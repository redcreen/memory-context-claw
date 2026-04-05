import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { rewriteRetrievalQueries } from "./query-rewrite.js";
import { classifyQueryIntent, resolveRetrievalPolicy } from "./retrieval-policy.js";
import { buildKeywordSet, shouldExcludeMemoryPath } from "./utils.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CARDS_PATH = path.resolve(__dirname, "..", "reports", "conversation-memory-cards.json");
const DEFAULT_WORKSPACE_ROOT = path.join(os.homedir(), ".openclaw", "workspace");
const DEFAULT_PLUGIN_ROOT = path.resolve(__dirname, "..");
const DAILY_MEMORY_LIMIT = 7;
function normalizeFact(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function getCardSourcePriority(card) {
  const sourceChannel = String(card?.sourceChannel || "");
  switch (sourceChannel) {
    case "formal-policy":
      return 80;
    case "memory-md":
      return 70;
    case "config-doc":
      return 60;
    case "project-doc":
      return 55;
    case "memory-daily":
      return 50;
    case "assistant-fact":
      return 40;
    case "assistant-summary":
      return 35;
    case "assistant-conclusion":
      return 30;
    case "session-memory":
      return 20;
    default:
      return 10;
  }
}

function dedupeCardsForConsumption(cards) {
  const dedupedByPath = new Map();
  for (const card of cards) {
    const key = `${card?.sourcePath || ""}::${card?.fact || ""}`;
    if (!dedupedByPath.has(key)) {
      dedupedByPath.set(key, card);
    }
  }

  const dedupedByFact = new Map();
  for (const card of dedupedByPath.values()) {
    const factKey = normalizeFact(card?.fact);
    if (!factKey) {
      continue;
    }
    const existing = dedupedByFact.get(factKey);
    if (!existing) {
      dedupedByFact.set(factKey, card);
      continue;
    }

    const currentPriority = getCardSourcePriority(card);
    const existingPriority = getCardSourcePriority(existing);
    if (currentPriority > existingPriority) {
      dedupedByFact.set(factKey, card);
      continue;
    }
    if (currentPriority === existingPriority) {
      const currentPath = String(card?.sourcePath || "");
      const existingPath = String(existing?.sourcePath || "");
      if (currentPath < existingPath) {
        dedupedByFact.set(factKey, card);
      }
    }
  }

  return [...dedupedByFact.values()];
}

export function extractJsonPayload(stdout) {
  const text = String(stdout ?? "").trim();
  if (!text) {
    throw new Error("Empty stdout");
  }

  const jsonStart = text.search(/[\[{]/);
  if (jsonStart === -1) {
    throw new Error("No JSON payload found in stdout");
  }

  let candidate = text.slice(jsonStart).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const lines = candidate.split("\n");
    for (let index = 1; index < lines.length; index += 1) {
      const joined = lines.slice(index).join("\n").trim();
      if (!joined) {
        continue;
      }
      try {
        return JSON.parse(joined);
      } catch {
        continue;
      }
    }
    throw new Error("Unable to parse JSON payload from stdout");
  }
}

export async function retrieveMemoryCandidates({
  openclawCommand,
  agentId,
  query,
  maxCandidates,
  commandTimeoutMs = 0,
  pluginRoot = DEFAULT_PLUGIN_ROOT,
  cardArtifacts = {
    enabled: true,
    path: "",
    maxCandidates: 6,
    workspaceRoot: "",
    fastPathEnabled: true,
    fastPathMinScore: 0.3
  },
  excludePaths = [],
  queryRewrite = { enabled: true, maxQueries: 4 },
  logger
}) {
  if (!query || !String(query).trim()) {
    return [];
  }

  try {
    const cardCandidates = await readCardArtifactCandidates({
      query,
      maxCandidates: cardArtifacts?.maxCandidates ?? 6,
      artifactPath: cardArtifacts?.path || DEFAULT_CARDS_PATH,
      workspaceRoot: cardArtifacts?.workspaceRoot || DEFAULT_WORKSPACE_ROOT,
      pluginRoot,
      excludePaths,
      logger
    });

    if (shouldUseCardFastPath(query, cardCandidates, cardArtifacts)) {
      logger?.debug?.(
        `[memory-context-claw] card fast path hit for query="${query}" with ${cardCandidates.length} cards`
      );
      return cardCandidates
        .slice(0, maxCandidates)
        .map((item) => ({
          ...item,
          score: Number(item.score || 0),
          sourceQuery: query,
          fusionScore: Number(item.fusionScore || item.score || 0)
        }));
    }

    const queries = queryRewrite?.enabled
      ? rewriteRetrievalQueries(query, queryRewrite)
      : [String(query).trim()];
    const allResults = [];

    for (const searchQuery of queries) {
      const { stdout } = await execFileAsync(
        openclawCommand,
        [
          "memory",
          "search",
          "--agent",
          agentId,
          "--query",
          searchQuery,
          "--max-results",
          String(maxCandidates),
          "--json"
        ],
        {
          maxBuffer: 4 * 1024 * 1024,
          timeout: Number(commandTimeoutMs) > 0 ? Number(commandTimeoutMs) : undefined
        }
      );

      const parsed = extractJsonPayload(stdout);
      const results = Array.isArray(parsed?.results) ? parsed.results : [];
      for (const [index, item] of results.entries()) {
        if (shouldExcludeMemoryPath(item?.path, excludePaths)) {
          continue;
        }
        allResults.push({
          ...item,
          sourceQuery: searchQuery,
          fusionScore: Number(item?.score || 0) + 1 / (index + 1)
        });
      }
    }

    const merged = new Map();
    for (const item of allResults) {
      const key = `${item.path}::${item.startLine || 0}::${item.endLine || 0}`;
      const existing = merged.get(key);
      if (!existing || Number(item.fusionScore || 0) > Number(existing.fusionScore || 0)) {
        merged.set(key, item);
      }
    }
    for (const item of cardCandidates) {
      const key = `${item.path}::${item.startLine || 0}::${item.endLine || 0}`;
      const existing = merged.get(key);
      if (!existing || Number(item.fusionScore || 0) > Number(existing.fusionScore || 0)) {
        merged.set(key, item);
      }
    }

    return [...merged.values()]
      .sort((left, right) => Number(right.fusionScore || 0) - Number(left.fusionScore || 0))
      .slice(0, maxCandidates)
      .map(({ fusionScore, sourceQuery, ...item }) => ({
        ...item,
        score: Number(item.score || 0),
        sourceQuery,
        fusionScore
      }));
  } catch (error) {
    logger?.warn?.(
      `[memory-context-claw] memory retrieval failed for agent=${agentId}: ${String(error)}`
    );
    return [];
  }
}

function shouldUseCardFastPath(query, cardCandidates, cardArtifacts) {
  if (cardArtifacts?.enabled === false || cardArtifacts?.fastPathEnabled === false) {
    return false;
  }

  if (!Array.isArray(cardCandidates) || cardCandidates.length === 0) {
    return false;
  }

  const policy = resolveRetrievalPolicy(query);
  const intents = policy.intents;

  if (policy.mode === "search-first") {
    return false;
  }

  const threshold = Number(cardArtifacts?.fastPathMinScore || 0.3);
  const matchers = [];

  if (intents.preference) {
    matchers.push((item) => /爱吃|喜欢吃|饮食|口味|食物|偏好/.test(String(item?.snippet || "")));
  }
  if (intents.identity) {
    matchers.push((item) => /叫刘超|超哥|称呼|姓名|昵称/.test(String(item?.snippet || "")));
  }
  if (intents.timezone) {
    matchers.push((item) => /时区|北京时间|gmt\+?8|utc\+?8/i.test(String(item?.snippet || "")));
  }
  if (intents.style) {
    matchers.push((item) => /沟通风格|交流风格|说话风格|直接|实用|不废话/.test(String(item?.snippet || "")));
  }
  if (intents.reminder) {
    matchers.push((item) => /提醒|飞书任务|苹果日历|日历提醒|双通道/.test(String(item?.snippet || "")));
  }
  if (intents.execution) {
    matchers.push((item) => /默认推进|风险动作再确认|低风险|可逆操作|可直接执行|高风险动作|先确认/.test(String(item?.snippet || "")));
  }
  if (intents.toolRole) {
    matchers.push((item) => /openviking|长期记忆检索补充工具|查询个人信息|偏好|历史片段/.test(String(item?.snippet || "")));
  }
  if (intents.agentRole) {
    matchers.push((item) => /编程工作|文档工作|订单工作|健康工作|code agent|document agent|order agent|health agent|main 先处理/.test(String(item?.snippet || "")));
  }
  if (intents.mainBoundary) {
    matchers.push((item) => /main 负责|总协调|任务判断|任务分派|结果汇总|不长期承接/.test(String(item?.snippet || "")));
  }
  if (intents.mainNegativeBoundary) {
    matchers.push((item) => /main 不长期承接|不负责/.test(String(item?.snippet || "")));
  }
  if (intents.statusRule) {
    matchers.push((item) => /已开始|等待确认|排队中|已暂停|真实状态|阻塞态/.test(String(item?.snippet || "")));
  }
  if (intents.rule) {
    matchers.push((item) => /memory\.md|长期稳定|反复复用|daily memory|已确认/.test(String(item?.snippet || "")));
  }
  if (intents.background) {
    matchers.push((item) => /孩子|家庭|工厂|实体制造业|毛绒玩具|职业|转型|背景/.test(String(item?.snippet || "")));
  }
  if (intents.birthday) {
    matchers.push((item) => /生日|农历|女儿|儿子|孩子|家庭|身份证/.test(String(item?.snippet || "")));
  }
  if (intents.project) {
    matchers.push((item) => /项目|context engine|上下文引擎|memory-context-claw|长期记忆|上下文/.test(String(item?.snippet || "")));
  }

  const matchedCard = cardCandidates.find((item) => matchers.some((matcher) => matcher(item)));
  if (matchedCard) {
    return Number(matchedCard?.score || 0) >= threshold;
  }

  const topScore = Number(cardCandidates[0]?.score || 0);
  return topScore >= threshold;
}

export function buildCardArtifactCandidates(cards, query, maxCandidates = 6) {
  const keywords = buildKeywordSet(query);
  const queryText = String(query || "");
  const intents = classifyQueryIntent(queryText);
  const configIntent = intents.config;
  const providerIntent = intents.provider;
  const preferenceIntent = intents.preference;
  const timezoneIntent = intents.timezone;
  const styleIntent = intents.style;
  const reminderIntent = intents.reminder;
  const executionRuleIntent = intents.execution;
  const toolRoleIntent = intents.toolRole;
  const agentRoleIntent = intents.agentRole;
  const mainBoundaryIntent = intents.mainBoundary;
  const mainNegativeBoundaryIntent = intents.mainNegativeBoundary;
  const statusRuleIntent = intents.statusRule;
  const ruleIntent = intents.rule;
  const backgroundIntent = intents.background;
  const birthdayIntent = intents.birthday;
  const selfBirthdayIntent = /(?:^|你|我).*(生日|农历生日)/.test(queryText) && !/女儿|儿子|孩子/.test(queryText);
  const daughterIntent = /女儿/.test(queryText);
  const sonIntent = /儿子/.test(queryText);
  const childrenIntent = /孩子|一儿一女|家庭/.test(queryText);
  const guardrailIntent = /身份证/.test(queryText);
  const projectIntent = intents.project;
  const hasStableConfigCard = configIntent && (Array.isArray(cards) ? cards : []).some((card) => {
    const sourceChannel = String(card?.sourceChannel || "");
    const fact = String(card?.fact || "");
    const tagsList = Array.isArray(card?.tags) ? card.tags : [];
    return (
      sourceChannel === "config-doc"
      && (
        /配置|config|安装|install|启用|enable|contextEngine|enabled:\s*true|entries/.test(fact)
        || tagsList.includes("config")
      )
    );
  });
  const hasStableRuleCard = ruleIntent && (Array.isArray(cards) ? cards : []).some((card) => {
    const sourceChannel = String(card?.sourceChannel || "");
    const fact = String(card?.fact || "");
    const tagsList = Array.isArray(card?.tags) ? card.tags : [];
    return (
      sourceChannel === "memory-md"
      && (
        /规则|原则|工作方式|写作偏好|长期偏好|习惯|长期稳定|memory\.md|应该放|适合放|不适合放/.test(fact)
        || tagsList.includes("rule")
        || tagsList.includes("workflow")
        || tagsList.includes("memory")
      )
    );
  });
  const ranked = (Array.isArray(cards) ? cards : [])
    .map((card, index) => {
      const title = String(card?.title || "");
      const fact = String(card?.fact || "");
      const tagsList = Array.isArray(card?.tags) ? card.tags : [];
      const sourceChannel = String(card?.sourceChannel || "");
      const tags = tagsList.join(" ");
      const haystack = `${title}\n${fact}\n${tags}`.toLowerCase();
      const hits = keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? 1 : 0), 0);
      const overlap = keywords.length ? hits / keywords.length : 0;
      const preferenceBoost =
        preferenceIntent && (/爱吃|偏好|喜欢|称呼|身份/.test(fact) || tagsList.includes("preference") || tagsList.includes("identity"))
          ? 0.18
          : 0;
      const ruleBoost =
        ruleIntent &&
        (/规则|原则|工作方式|写作偏好|长期偏好|习惯|长期稳定|memory\.md|应该放|适合放|不适合放/.test(fact) ||
          tagsList.includes("rule") ||
          tagsList.includes("workflow") ||
          tagsList.includes("memory"))
          ? 0.18
          : 0;
      const backgroundBoost =
        backgroundIntent &&
        (/孩子|一儿一女|家庭|家里|工厂|实体制造业|毛绒玩具|职业|转型|背景/.test(fact) ||
          tagsList.includes("family") ||
          tagsList.includes("work") ||
          tagsList.includes("background"))
          ? 0.18
          : 0;
      const birthdayBoost =
        birthdayIntent &&
        (/生日|农历|女儿|儿子|五年级|高三|腊月/.test(fact) ||
          tagsList.includes("family") ||
          tagsList.includes("background") ||
          tagsList.includes("identity"))
          ? 0.18
          : 0;
      const slotBoost =
        (selfBirthdayIntent && /你的生日|农历生日/.test(fact) ? 0.16 : 0) +
        (daughterIntent && /你女儿/.test(fact) ? 0.16 : 0) +
        (sonIntent && /你儿子/.test(fact) ? 0.16 : 0) +
        (childrenIntent && (/你女儿|你儿子|一儿一女|家庭/.test(fact) ? 0.12 : 0)) +
        (guardrailIntent && (/待确认|暂不作为已确认|身份证/.test(fact) ? 0.18 : 0));
      const slotPenalty =
        (selfBirthdayIntent && /你女儿|你儿子/.test(fact) ? 0.08 : 0) +
        (daughterIntent && /你儿子|你的生日/.test(fact) ? 0.08 : 0) +
        (sonIntent && /你女儿|你的生日/.test(fact) ? 0.08 : 0) +
        (guardrailIntent && /你女儿|你儿子|你的生日/.test(fact) ? 0.08 : 0);
      const projectBoost =
        projectIntent &&
        (
          /项目|定位|目标|解决什么问题|context engine|上下文引擎|memory-context-claw|上下文层/.test(fact)
          || sourceChannel === "project-doc"
          || (tagsList.includes("project") && !tagsList.includes("config"))
        )
          ? 0.18
          : 0;
      const configBoost =
        configIntent &&
        (/配置|config|安装|install|启用|enable|contextengine|entries|enabled:\s*true/.test(fact) ||
          tagsList.includes("config"))
          ? 0.22
          : 0;
      const providerBoost =
        providerIntent &&
        (/memorysearch\.provider|embedding|memory_search|检索 provider|不影响主聊天模型/i.test(fact) ||
          tagsList.includes("provider") ||
          tagsList.includes("embedding"))
          ? 0.24
          : 0;
      const timezoneBoost =
        timezoneIntent &&
        (/时区|timezone|北京时间|gmt\+?8|utc\+?8/i.test(fact) || tagsList.includes("timezone"))
          ? 0.24
          : 0;
      const styleBoost =
        styleIntent &&
        (/沟通风格|交流风格|说话风格|直接|实用|不废话/.test(fact) ||
          tagsList.includes("workflow") ||
          tagsList.includes("style"))
          ? 0.4
          : 0;
      const reminderBoost =
        reminderIntent &&
        (/提醒|飞书任务|苹果日历|日历提醒|双通道/.test(fact) ||
          tagsList.includes("reminder") ||
          tagsList.includes("workflow"))
          ? 0.28
          : 0;
      const executionRuleBoost =
        executionRuleIntent &&
        (/默认推进|风险动作再确认|低风险|可逆操作|可直接执行|高风险动作|先确认/.test(fact) ||
          tagsList.includes("execution") ||
          tagsList.includes("workflow"))
          ? 0.3
          : 0;
      const toolRoleBoost =
        toolRoleIntent &&
        (/openviking|长期记忆检索补充工具|查询个人信息|偏好|历史片段/.test(fact) ||
          tagsList.includes("tool") ||
          tagsList.includes("role"))
          ? 0.26
          : 0;
      const agentRoleBoost =
        agentRoleIntent &&
        (/编程工作|文档工作|订单工作|健康工作|code agent|document agent|order agent|health agent|main 先处理/.test(fact) ||
          tagsList.includes("agent-role") ||
          tagsList.includes("routing"))
          ? 0.26
          : 0;
      const mainBoundaryBoost =
        mainBoundaryIntent &&
        (/main 负责|总协调|任务判断|任务分派|结果汇总|不长期承接/.test(fact) ||
          tagsList.includes("main-boundary") ||
          tagsList.includes("routing"))
          ? 0.26
          : 0;
      const mainNegativeBoundaryBoost =
        mainNegativeBoundaryIntent &&
        (/main 不长期承接|不负责/.test(fact) || tagsList.includes("main-boundary"))
          ? 0.18
          : 0;
      const statusRuleBoost =
        statusRuleIntent &&
        (/已开始|等待确认|排队中|已暂停|真实状态|阻塞态/.test(fact) ||
          tagsList.includes("status-rule") ||
          tagsList.includes("workflow"))
          ? 0.24
          : 0;
      const styleSourceBoost =
        styleIntent &&
        sourceChannel === "memory-md" &&
        (tagsList.includes("style") || tagsList.includes("workflow"))
          ? 0.18
          : 0;
      const styleGenericPenalty =
        styleIntent &&
        !(
          /沟通风格|交流风格|说话风格|直接|实用|不废话/.test(fact) ||
          tagsList.includes("style") ||
          (sourceChannel === "memory-md" && tagsList.includes("workflow"))
        )
          ? 0.22
          : 0;
      const styleSessionPenalty =
        styleIntent &&
        sourceChannel !== "memory-md" &&
        sourceChannel !== "formal-policy" &&
        !(/沟通风格|交流风格|说话风格|直接|实用|不废话/.test(fact) || tagsList.includes("style"))
          ? 0.18
          : 0;
      const reminderSourceBoost =
        reminderIntent &&
        sourceChannel === "memory-md" &&
        (tagsList.includes("reminder") || tagsList.includes("workflow"))
          ? 0.18
          : 0;
      const executionRuleSourceBoost =
        executionRuleIntent &&
        sourceChannel === "memory-md" &&
        (tagsList.includes("execution") || tagsList.includes("workflow"))
          ? 0.18
          : 0;
      const toolRoleSourceBoost =
        toolRoleIntent &&
        sourceChannel === "memory-md" &&
        (tagsList.includes("tool") || tagsList.includes("role"))
          ? 0.16
          : 0;
      const agentRoleSourceBoost =
        agentRoleIntent &&
        sourceChannel === "memory-md" &&
        (tagsList.includes("agent-role") || tagsList.includes("routing") || tagsList.includes("workflow"))
          ? 0.16
          : 0;
      const mainBoundarySourceBoost =
        mainBoundaryIntent &&
        sourceChannel === "memory-md" &&
        (tagsList.includes("main-boundary") || tagsList.includes("routing") || tagsList.includes("workflow"))
          ? 0.16
          : 0;
      const mainNegativeBoundarySourceBoost =
        mainNegativeBoundaryIntent &&
        sourceChannel === "memory-md" &&
        (tagsList.includes("main-boundary") || tagsList.includes("routing") || tagsList.includes("workflow"))
          ? 0.12
          : 0;
      const statusRuleSourceBoost =
        statusRuleIntent &&
        sourceChannel === "memory-md" &&
        (tagsList.includes("status-rule") || tagsList.includes("workflow"))
          ? 0.14
          : 0;
      const reminderPenalty =
        reminderIntent &&
        !(/提醒|飞书任务|苹果日历|日历提醒|双通道/.test(fact) || tagsList.includes("reminder"))
          ? 0.2
          : 0;
      const executionRulePenalty =
        executionRuleIntent &&
        !(/默认推进|风险动作再确认|低风险|可逆操作|可直接执行|高风险动作|先确认/.test(fact) || tagsList.includes("execution"))
          ? 0.2
          : 0;
      const toolRolePenalty =
        toolRoleIntent &&
        !(/openviking|长期记忆检索补充工具|查询个人信息|偏好|历史片段/.test(fact) || tagsList.includes("tool"))
          ? 0.18
          : 0;
      const agentRolePenalty =
        agentRoleIntent &&
        !(/编程工作|文档工作|订单工作|健康工作|code agent|document agent|order agent|health agent|main 先处理/.test(fact) ||
          tagsList.includes("agent-role"))
          ? 0.18
          : 0;
      const mainBoundaryPenalty =
        mainBoundaryIntent &&
        !(/main 负责|总协调|任务判断|任务分派|结果汇总|不长期承接/.test(fact) ||
          tagsList.includes("main-boundary"))
          ? 0.18
          : 0;
      const mainNegativeBoundaryPenalty =
        mainNegativeBoundaryIntent &&
        /main 负责/.test(fact)
          ? 0.18
          : 0;
      const statusRulePenalty =
        statusRuleIntent &&
        !(/已开始|等待确认|排队中|已暂停|真实状态|阻塞态/.test(fact) || tagsList.includes("status-rule"))
          ? 0.16
          : 0;
      const sourceBoost = sourceChannel === "assistant-fact"
        ? 0.14
        : sourceChannel === "memory-md"
          ? 0.12
          : sourceChannel === "formal-policy"
            ? 0.16
          : sourceChannel === "config-doc"
            ? 0.18
          : 0;
      const configSourceBoost =
        configIntent && sourceChannel === "config-doc"
          ? 0.2
          : 0;
      const providerSourceBoost =
        providerIntent && sourceChannel === "config-doc"
          ? 0.22
          : 0;
      const configProjectPenalty =
        hasStableConfigCard
        && (configIntent || providerIntent)
        && sourceChannel === "project-doc"
        && !(
          /配置|config|安装|install|启用|enable|contextengine|entries|enabled:\s*true|memorysearch\.provider|embedding|memory_search|不影响主聊天模型/i.test(
            fact
          ) || tagsList.includes("config") || tagsList.includes("provider") || tagsList.includes("embedding")
        )
          ? 0.18
          : 0;
      const projectConfigPenalty =
        projectIntent
        && !configIntent
        && sourceChannel === "config-doc"
          ? 0.2
          : 0;
      const ruleSourceBoost =
        ruleIntent && (sourceChannel === "memory-md" || sourceChannel === "formal-policy")
          ? 0.16
          : 0;
      const ruleSessionPenalty =
        hasStableRuleCard
        && ruleIntent
        && sourceChannel !== "memory-md"
        && sourceChannel !== "formal-policy"
        && (
          /规则|原则|工作方式|写作偏好|长期偏好|习惯|长期稳定|memory\.md|应该放|适合放|不适合放/.test(fact)
          || tagsList.includes("rule")
          || tagsList.includes("workflow")
          || tagsList.includes("memory")
        )
          ? 0.12
          : 0;
      const recommendationBoost = String(card?.recommendation?.action || "").includes("memory-md")
        ? 0.08
        : 0;
      const score =
        overlap +
        preferenceBoost +
        ruleBoost +
        backgroundBoost +
        birthdayBoost +
        slotBoost -
        slotPenalty +
        projectBoost +
        configBoost +
        providerBoost +
        timezoneBoost +
        styleBoost +
        reminderBoost +
        executionRuleBoost +
        toolRoleBoost +
        agentRoleBoost +
        mainBoundaryBoost +
        mainNegativeBoundaryBoost +
        statusRuleBoost +
        styleSourceBoost +
        reminderSourceBoost +
        executionRuleSourceBoost +
        toolRoleSourceBoost +
        agentRoleSourceBoost +
        mainBoundarySourceBoost +
        mainNegativeBoundarySourceBoost +
        statusRuleSourceBoost +
        sourceBoost +
        configSourceBoost +
        providerSourceBoost +
        ruleSourceBoost +
        recommendationBoost -
        styleGenericPenalty -
        styleSessionPenalty -
        reminderPenalty -
        executionRulePenalty -
        toolRolePenalty -
        agentRolePenalty -
        mainBoundaryPenalty -
        mainNegativeBoundaryPenalty -
        statusRulePenalty -
        configProjectPenalty -
        projectConfigPenalty -
        ruleSessionPenalty;
      return {
        index,
        card,
        score
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, maxCandidates);

  return ranked.map(({ card, score }, index) => ({
    path: String(card?.sourcePath || card?.sourceFile || `card://${index + 1}`),
    startLine: 1,
    endLine: 1,
    snippet: String(card?.fact || ""),
    source: "cardArtifact",
    score: Math.max(0.01, score),
    sourceQuery: query,
    fusionScore: Math.max(0.01, score) + 1 / (index + 1)
  }));
}

export function buildStableMemoryCardsFromMarkdown(markdown = "", filePath = "MEMORY.md") {
  const cards = [];
  const lines = String(markdown || "").split(/\r?\n/);
  const isDailyMemory = /memory\/\d{4}-\d{2}-\d{2}\.md$/.test(filePath.replace(/\\/g, "/"));

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const nameMatch = trimmed.match(/(?:^[-*]\s*)?\*\*姓名\*\*[:：]\s*([^\s（(]+)\s*[（(]([^）)]+)[）)]/);
    if (nameMatch) {
      const [, legalName, nickname] = nameMatch;
      cards.push({
        title: "身份与称呼",
        type: "longTerm",
        fact: `你叫${legalName}，我平时记你是${nickname}`,
        tags: ["long-term", "identity"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const styleMatch = trimmed.match(/(?:^[-*]\s*)?\*\*沟通风格\*\*[:：]\s*(.+)$/);
    if (styleMatch) {
      cards.push({
        title: "稳定规则",
        type: "longTerm",
        fact: `你的沟通风格偏好是${styleMatch[1].trim()}`,
        tags: ["long-term", "workflow", "rule", "style"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const timezoneMatch = trimmed.match(/(?:^[-*]\s*)?\*\*时区\*\*[:：]\s*(.+)$/);
    if (timezoneMatch) {
      cards.push({
        title: "时区信息",
        type: "longTerm",
        fact: `你的时区是${timezoneMatch[1].trim()}`,
        tags: ["long-term", "identity", "background", "timezone"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const foodPreferenceMatch = trimmed.match(/(?:^[-*]\s*)?\*\*饮食偏好\*\*[:：]\s*(.+)$/);
    if (foodPreferenceMatch) {
      cards.push({
        title: "饮食偏好",
        type: "longTerm",
        fact: `你爱吃${foodPreferenceMatch[1].trim()}`,
        tags: ["long-term", "preference"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const reminderMatch = trimmed.match(/(?:^[-*]\s*)?当用户说[“"']提醒[”"']时[，,、]?默认使用\s*(.+)$/);
    if (reminderMatch) {
      cards.push({
        title: "提醒通道偏好",
        type: "longTerm",
        fact: `当你说提醒时，默认使用${reminderMatch[1].trim()}`,
        tags: ["long-term", "workflow", "rule", "reminder"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const executionRuleMatch = trimmed.match(
      /^(?:\d+\.\s*)?\*\*默认推进，风险动作再确认\*\*[:：]\s*(.+)$/
    );
    if (executionRuleMatch) {
      cards.push({
        title: "执行原则",
        type: "longTerm",
        fact: `收到明确任务后，纯内部、低风险、可逆操作可直接执行；高风险动作才先确认。`,
        tags: ["long-term", "workflow", "rule", "execution"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const openVikingMatch = trimmed.match(/(?:^[-*]\s*)?\*\*OpenViking\*\*[:：]\s*(.+)$/i);
    if (openVikingMatch) {
      cards.push({
        title: "记忆系统分工",
        type: "longTerm",
        fact: `OpenViking 是主要长期记忆检索补充工具，用于查询个人信息、偏好、历史片段等。`,
        tags: ["long-term", "tool", "role", "memory"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const agentRoleMatch = trimmed.match(
      /(?:^[-*]\s*)?\*\*(编程工作|文档工作|订单工作|健康工作)\*\*\s*[→\-]\s*`?([a-z]+)`?\s*Agent/i
    );
    if (agentRoleMatch) {
      const [, workType, agentName] = agentRoleMatch;
      cards.push({
        title: "Agent 分工",
        type: "longTerm",
        fact: `${workType}默认交给 ${agentName.toLowerCase()} Agent。`,
        tags: ["long-term", "workflow", "rule", "agent-role", "routing"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const mainBoundaryMatch = trimmed.match(/(?:^[-*]\s*)?main 负责(.+)$/i);
    if (mainBoundaryMatch) {
      cards.push({
        title: "main 边界",
        type: "longTerm",
        fact: `main 负责${mainBoundaryMatch[1].trim()}`,
        tags: ["long-term", "workflow", "rule", "main-boundary", "routing"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const mainBoundaryNegativeMatch = trimmed.match(/(?:^[-*]\s*)?main 不长期承接(.+)$/i);
    if (mainBoundaryNegativeMatch) {
      cards.push({
        title: "main 边界",
        type: "longTerm",
        fact: `main 不负责长期承接${mainBoundaryNegativeMatch[1].trim()}`,
        tags: ["long-term", "workflow", "rule", "main-boundary", "routing"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const statusStartedMatch = trimmed.match(/(?:^[-*]\s*)?[“"']已开始[”"']\s*=\s*(.+)$/);
    if (statusStartedMatch) {
      cards.push({
        title: "状态词规则",
        type: "longTerm",
        fact: `“已开始”表示${statusStartedMatch[1].trim()}`,
        tags: ["long-term", "workflow", "rule", "status-rule"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const idYearMatch = trimmed.match(
      /(?:^[-*]\s*)?\*\*出生年份说明\*\*[:：]\s*实际出生年份为\s*(\d{4})[；;]\s*身份证登记(?:生日)?年份为\s*(\d{4}).*(历史登记错误|证件信息客观如此)/
    );
    if (idYearMatch) {
      const [, actualYear, idYear] = idYearMatch;
      cards.push({
        title: "身份信息说明",
        type: "longTerm",
        fact: `你的实际出生年份是${actualYear}；身份证登记生日年份是${idYear}，这是历史登记错误，但证件信息客观如此。`,
        tags: ["long-term", "identity", "background"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-md",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      });
      continue;
    }

    const birthdayMatch = trimmed.match(/生日为\s*(\d{4}-\d{2}-\d{2}|\d{4}年\d{1,2}月\d{1,2}日)[；;]\s*农历生日为\s*([^。；;]+)/);
    if (birthdayMatch) {
      const [, solar, lunar] = birthdayMatch;
      cards.push({
        title: "生日信息",
        type: isDailyMemory ? "daily" : "longTerm",
        fact: `你的生日是${solar}，农历生日是${lunar.trim()}`,
        tags: ["identity", "background", isDailyMemory ? "daily" : "long-term"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: isDailyMemory ? "memory-daily" : "memory-md",
        recommendation: {
          action: isDailyMemory ? "review-daily-memory" : "review-memory-md",
          confidence: "medium"
        }
      });
      continue;
    }

    const daughterMatch = trimmed.match(/女儿名叫([^，。；;]+)[，,]\s*生日为?\s*(\d{4}-\d{2}-\d{2}|\d{4}年\d{1,2}月\d{1,2}日)[，,]\s*当前上([^。；;]+)/);
    if (daughterMatch) {
      const [, name, birthday, grade] = daughterMatch;
      cards.push({
        title: "家庭背景",
        type: isDailyMemory ? "daily" : "longTerm",
        fact: `你女儿叫${name.trim()}，生日是${birthday.trim()}，现在上${grade.trim()}`,
        tags: ["family", "background", isDailyMemory ? "daily" : "long-term"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: isDailyMemory ? "memory-daily" : "memory-md",
        recommendation: {
          action: isDailyMemory ? "review-daily-memory" : "review-memory-md",
          confidence: "medium"
        }
      });
      continue;
    }

    const sonMatch = trimmed.match(/儿子名叫([^，。；;]+)[，,]\s*生日为?\s*(\d{4}-\d{2}-\d{2}|\d{4}年\d{1,2}月\d{1,2}日)[，,]\s*当前上([^。；;]+)/);
    if (sonMatch) {
      const [, name, birthday, grade] = sonMatch;
      cards.push({
        title: "家庭背景",
        type: isDailyMemory ? "daily" : "longTerm",
        fact: `你儿子叫${name.trim()}，生日是${birthday.trim()}，现在上${grade.trim()}`,
        tags: ["family", "background", isDailyMemory ? "daily" : "long-term"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: isDailyMemory ? "memory-daily" : "memory-md",
        recommendation: {
          action: isDailyMemory ? "review-daily-memory" : "review-memory-md",
          confidence: "medium"
        }
      });
      continue;
    }

    const identityCorrectionMatch = trimmed.match(
      /实际出生年份为\s*(\d{4})[；;]\s*身份证登记(?:生日)?年份为\s*(\d{4}).*(历史登记错误|客观事实)/
    );
    if (identityCorrectionMatch) {
      const [, actualYear, idYear] = identityCorrectionMatch;
      cards.push({
        title: "身份信息说明",
        type: isDailyMemory ? "daily" : "longTerm",
        fact: `你的实际出生年份是${actualYear}；身份证登记生日年份是${idYear}，这是历史登记错误，但证件信息客观如此。`,
        tags: ["identity", "background", isDailyMemory ? "daily" : "long-term"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: isDailyMemory ? "memory-daily" : "memory-md",
        recommendation: {
          action: isDailyMemory ? "review-daily-memory" : "review-memory-md",
          confidence: "high"
        }
      });
      continue;
    }

    const guardrailMatch = trimmed.match(/待校验信息[:：]?[“"\']?([^"”']+)[”"\']?.*?(暂不作为已确认身份信息使用|暂不作为已确认事实使用|待确认)/);
    if (guardrailMatch) {
      const [, , status] = guardrailMatch;
      cards.push({
        title: "待确认身份信息",
        type: "daily",
        fact: `身份证生日信息待确认，这条信息${status.trim()}`,
        tags: ["identity", "guardrail", "daily"],
        sourceFile: path.basename(filePath),
        sourcePath: filePath,
        sourceChannel: "memory-daily",
        recommendation: {
          action: "review-daily-memory",
          confidence: "medium"
        }
      });
    }
  }

  return cards;
}

export function buildProjectCardsFromMarkdown(markdown = "", filePath = "README.md") {
  const cards = [];
  const text = String(markdown || "");

  const projectPatterns = [
    /memory-context-claw.+?OpenClaw.+?context engine plugin/i,
    /面向 OpenClaw 的 [`']?context engine[`']? 插件/,
    /把长期记忆更稳定地变成当前轮可用的上下文/,
    /负责把长期记忆更稳定地变成当前轮可用的上下文/
  ];

  const hasProjectSignal = projectPatterns.some((pattern) => pattern.test(text));
  if (!hasProjectSignal) {
    return cards;
  }

  cards.push({
    title: "项目定位",
    type: "longTerm",
    fact: "这是一个面向 OpenClaw 的 context engine 插件，负责把长期记忆更稳定地变成当前轮可用的上下文。",
    tags: ["long-term", "project", "memory"],
    sourceFile: path.basename(filePath),
    sourcePath: filePath,
    sourceChannel: "project-doc",
    recommendation: {
      action: "review-memory-md",
      confidence: "high"
    }
  });

  return cards;
}

export function buildConfigCardsFromMarkdown(markdown = "", filePath = "configuration.md") {
  const cards = [];
  const text = String(markdown || "");

  if (
    /allow:\s*\["memory-context-claw"\]/.test(text)
    && /contextEngine:\s*"memory-context-claw"/.test(text)
    && /enabled:\s*true/.test(text)
  ) {
    cards.push({
      title: "插件最小配置",
      type: "longTerm",
      fact: "memory-context-claw 的最小配置是：把它挂到 contextEngine，并在 entries 里 enabled: true。",
      tags: ["long-term", "project", "config", "memory"],
      sourceFile: path.basename(filePath),
      sourcePath: filePath,
      sourceChannel: "config-doc",
      recommendation: {
        action: "review-memory-md",
        confidence: "high"
      }
    });
  }

  if (
    /memorySearch:\s*\{/.test(text)
    && /provider:\s*"local"/.test(text)
    && /embeddinggemma|embedding/i.test(text)
  ) {
    cards.push({
      title: "memorySearch provider 角色",
      type: "longTerm",
      fact: "memorySearch.provider 决定长期记忆检索使用哪个 embedding / memory_search provider，不影响主聊天模型。",
      tags: ["long-term", "project", "config", "provider", "embedding", "memory"],
      sourceFile: path.basename(filePath),
      sourcePath: filePath,
      sourceChannel: "config-doc",
      recommendation: {
        action: "review-memory-md",
        confidence: "high"
      }
    });
  }

  return cards;
}

export function buildPolicyCardsFromMarkdown(markdown = "", filePath = "formal-memory-policy.md") {
  const cards = [];
  const text = String(markdown || "");

  if (
    /MEMORY\.md/.test(text)
    && /长期稳定记忆/.test(text)
    && /高优先级、会反复复用/.test(text)
  ) {
    cards.push({
      title: "正式记忆准入规则",
      type: "longTerm",
      fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      tags: ["long-term", "memory", "rule", "workflow", "policy"],
      sourceFile: path.basename(filePath),
      sourcePath: filePath,
      sourceChannel: "formal-policy",
      recommendation: {
        action: "review-memory-md",
        confidence: "high"
      }
    });
  }

  if (
    /memory\/YYYY-MM-DD\.md/.test(text)
    && /已确认/.test(text)
    && /阶段事实|近期确认信息|项目结论/.test(text)
  ) {
    cards.push({
      title: "正式 daily 准入规则",
      type: "daily",
      fact: "daily memory 应该放已确认、对未来检索仍有价值的阶段事实或近期确认信息。",
      tags: ["daily", "memory", "rule", "policy"],
      sourceFile: path.basename(filePath),
      sourcePath: filePath,
      sourceChannel: "formal-policy",
      recommendation: {
        action: "review-daily-memory",
        confidence: "high"
      }
    });
  }

  return cards;
}

async function readWorkspaceStableMemoryCards(workspaceRoot, logger) {
  const cards = [];
  const rootMemoryPath = path.join(workspaceRoot, "MEMORY.md");
  try {
    const raw = await fs.readFile(rootMemoryPath, "utf8");
    cards.push(...buildStableMemoryCardsFromMarkdown(raw, "MEMORY.md"));
  } catch (error) {
    logger?.debug?.(
      `[memory-context-claw] workspace MEMORY card load skipped (${rootMemoryPath}): ${String(error)}`
    );
  }

  const dailyDir = path.join(workspaceRoot, "memory");
  try {
    const entries = (await fs.readdir(dailyDir))
      .filter((entry) => /^\d{4}-\d{2}-\d{2}\.md$/.test(entry))
      .sort()
      .slice(-DAILY_MEMORY_LIMIT);
    for (const entry of entries) {
      const dailyPath = path.join(dailyDir, entry);
      const raw = await fs.readFile(dailyPath, "utf8");
      cards.push(...buildStableMemoryCardsFromMarkdown(raw, `memory/${entry}`));
    }
  } catch (error) {
    logger?.debug?.(
      `[memory-context-claw] workspace daily card load skipped (${dailyDir}): ${String(error)}`
    );
  }

  return cards;
}

async function readPluginStableProjectCards(pluginRoot, logger) {
  const cards = [];
  const projectFiles = ["README.md", "project-roadmap.md"];

  for (const fileName of projectFiles) {
    const fullPath = path.join(pluginRoot, fileName);
    try {
      const raw = await fs.readFile(fullPath, "utf8");
      cards.push(...buildProjectCardsFromMarkdown(raw, fileName));
    } catch (error) {
      logger?.debug?.(
        `[memory-context-claw] project card load skipped (${fullPath}): ${String(error)}`
      );
    }
  }

  return cards;
}

async function readPluginStableConfigCards(pluginRoot, logger) {
  const cards = [];
  const configFiles = ["configuration.md"];

  for (const fileName of configFiles) {
    const fullPath = path.join(pluginRoot, fileName);
    try {
      const raw = await fs.readFile(fullPath, "utf8");
      cards.push(...buildConfigCardsFromMarkdown(raw, fileName));
    } catch (error) {
      logger?.debug?.(
        `[memory-context-claw] config card load skipped (${fullPath}): ${String(error)}`
      );
    }
  }

  return cards;
}

async function readPluginStablePolicyCards(pluginRoot, logger) {
  const cards = [];
  const policyFiles = ["formal-memory-policy.md"];

  for (const fileName of policyFiles) {
    const fullPath = path.join(pluginRoot, fileName);
    try {
      const raw = await fs.readFile(fullPath, "utf8");
      cards.push(...buildPolicyCardsFromMarkdown(raw, fileName));
    } catch (error) {
      logger?.debug?.(
        `[memory-context-claw] policy card load skipped (${fullPath}): ${String(error)}`
      );
    }
  }

  return cards;
}

export async function readCardArtifactCandidates({
  query,
  maxCandidates = 6,
  artifactPath = DEFAULT_CARDS_PATH,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  pluginRoot = DEFAULT_PLUGIN_ROOT,
  excludePaths = [],
  logger
} = {}) {
  const mergedCards = [];

  try {
    const raw = await fs.readFile(artifactPath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      mergedCards.push(...parsed);
    }
  } catch (error) {
    logger?.debug?.(
      `[memory-context-claw] card artifact load skipped (${artifactPath}): ${String(error)}`
    );
  }

  try {
    mergedCards.push(...await readWorkspaceStableMemoryCards(workspaceRoot, logger));
  } catch {}

  try {
    mergedCards.push(...await readPluginStableProjectCards(pluginRoot, logger));
  } catch {}

  try {
    mergedCards.push(...await readPluginStablePolicyCards(pluginRoot, logger));
  } catch {}

  try {
    mergedCards.push(...await readPluginStableConfigCards(pluginRoot, logger));
  } catch {}

  const candidates = buildCardArtifactCandidates(dedupeCardsForConsumption(mergedCards), query, maxCandidates);
  return candidates.filter((item) => !shouldExcludeMemoryPath(item?.path, excludePaths));
}
