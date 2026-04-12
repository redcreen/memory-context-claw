import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  collectConversationMemoryCandidates
} from "../conversation-memory.js";
import { createStandaloneRuntime, renderDailyReflectionReport } from "../unified-memory-core/index.js";
import {
  resolveOpenClawAgentNamespace,
  resolveOpenClawNamespace
} from "../unified-memory-core/adapter-bridges.js";

const DEFAULT_WORKSPACE_ROOT = path.join(os.homedir(), ".openclaw", "workspace");
const DEFAULT_AGENTS_ROOT = path.join(os.homedir(), ".openclaw", "agents");
const DEFAULT_MAX_DECLARED_SOURCES = 24;
const NIGHTLY_TRANSCRIPT_PATTERNS = [
  /原始逐句稿/u,
  /自动转写/u,
  /语音识别/u,
  /\[\d+\.\d{2}\s*-\s*\d+\.\d{2}\]/u,
  /\btranscript\b/iu,
  /\bpreview\b/iu
];
const NIGHTLY_META_PATTERNS = [
  /^好[,，。:\s]/u,
  /^可以[,，。:\s]/u,
  /^有[,，。:\s]/u,
  /^明白了?[,，。:\s]/u,
  /^收到[,，。:\s]/u,
  /^下面/u,
  /^我(现在|先|会|给你|建议|觉得)/u,
  /^如果你(要|愿意)/u
];
const NIGHTLY_PROGRESS_PATTERNS = [
  /已经/u,
  /已开始/u,
  /开始/u,
  /刚刚/u,
  /正在/u,
  /下一步/u,
  /接下来/u,
  /当前状态/u,
  /目前/u,
  /第一版/u,
  /骨架/u,
  /做完/u,
  /完成了/u
];
const NIGHTLY_DURABLE_SIGNAL_PATTERNS = [
  /应该/u,
  /应当/u,
  /必须/u,
  /不要/u,
  /禁止/u,
  /优先/u,
  /默认/u,
  /负责/u,
  /用于/u,
  /只(?:保留|保存|记录)/u,
  /先.+再/u,
  /\bshould\b/iu,
  /\bmust\b/iu,
  /\bprefer\b/iu,
  /\bdefault\b/iu,
  /\brule\b/iu,
  /\bprinciple\b/iu
];
const NIGHTLY_STRONG_DURABLE_PATTERNS = [
  /应该/u,
  /应当/u,
  /必须/u,
  /不要/u,
  /禁止/u,
  /优先/u,
  /默认/u,
  /只(?:保留|保存|记录)/u,
  /\bshould\b/iu,
  /\bmust\b/iu,
  /\bprefer\b/iu,
  /\bdefault\b/iu
];
const NIGHTLY_DOMAIN_ANCHOR_PATTERNS = [
  /memory\.md/iu,
  /\bmemory\b/iu,
  /\bskill\b/iu,
  /模块/u,
  /输入/u,
  /输出/u,
  /规则/u,
  /偏好/u,
  /背景/u,
  /流程/u,
  /\bartifact\b/iu,
  /\bregistry\b/iu,
  /\badapter\b/iu,
  /\bplugin\b/iu,
  /\bcontext\b/iu,
  /订单/u,
  /供应链/u,
  /\bworkspace\b/iu,
  /\bsession\b/iu
];
const NIGHTLY_ABSTRACT_CONCEPT_PATTERNS = [
  /模型/u,
  /信息/u,
  /连接/u,
  /联想/u,
  /流动/u,
  /闭环/u,
  /能力/u,
  /产品层/u,
  /本质/u
];
const NIGHTLY_DISCOURSE_MARKERS = [
  /现在/u,
  /其实/u,
  /所以/u,
  /一句话/u
];

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeTimeOfDay(value, fallback = "00:00") {
  const normalized = normalizeString(value, fallback);
  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return fallback;
  }
  const [hours, minutes] = normalized.split(":").map((item) => Number(item));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return fallback;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return fallback;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatLocalDateKey(date) {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function parseTimeOfDay(localTime) {
  const [hours, minutes] = normalizeTimeOfDay(localTime).split(":").map((item) => Number(item));
  return { hours, minutes };
}

export function isSelfLearningRunDue({
  now,
  localTime = "00:00",
  lastCompletedLocalDate = ""
} = {}) {
  const current = now instanceof Date ? now : new Date();
  const scheduled = new Date(current);
  const { hours, minutes } = parseTimeOfDay(localTime);
  scheduled.setHours(hours, minutes, 0, 0);
  return current >= scheduled && formatLocalDateKey(current) !== String(lastCompletedLocalDate || "");
}

export function getNextSelfLearningRunAt(now, localTime = "00:00") {
  const current = now instanceof Date ? now : new Date();
  const next = new Date(current);
  const { hours, minutes } = parseTimeOfDay(localTime);
  next.setHours(hours, minutes, 0, 0);
  if (next <= current) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function normalizeCandidateText(value) {
  return normalizeString(value).replace(/\s+/g, " ");
}

function normalizeNightlyDedupText(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[`"'“”‘’]/gu, "")
    .replace(/[\s.,!?;:，。！？；：（）()\-_/\\]+/gu, "");
}

function createNightlyBigrams(text = "") {
  const normalized = normalizeNightlyDedupText(text);
  if (normalized.length < 2) {
    return new Set(normalized ? [normalized] : []);
  }
  const grams = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    grams.add(normalized.slice(index, index + 2));
  }
  return grams;
}

function calculateNightlySimilarity(left, right) {
  const leftGrams = createNightlyBigrams(left);
  const rightGrams = createNightlyBigrams(right);
  if (leftGrams.size === 0 || rightGrams.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const gram of leftGrams) {
    if (rightGrams.has(gram)) {
      overlap += 1;
    }
  }
  return (2 * overlap) / (leftGrams.size + rightGrams.size);
}

function stripNightlyFormatting(text) {
  return normalizeCandidateText(text)
    .replace(/`+/g, "")
    .replace(/\*\*/g, "")
    .replace(/^>\s*/u, "")
    .replace(/\s[-*]\s+/gu, " ");
}

function splitNightlySegments(text) {
  const parts = String(text || "")
    .split(/\n+/u)
    .map((item) => item.trim())
    .filter(Boolean);
  const expanded = [];

  for (let index = 0; index < parts.length; index += 1) {
    const current = parts[index]
      .replace(/^[-*]\s*/u, "")
      .replace(/^\d+\.\s*/u, "")
      .replace(/^[一二三四五六七八九十]+[、.．]\s*/u, "")
      .trim();
    if (!current) {
      continue;
    }
    expanded.push(current);
    if (
      /[:：]$/u.test(current)
      && parts[index + 1]
    ) {
      const combined = [current];
      for (let offset = 1; offset <= 2; offset += 1) {
        const next = parts[index + offset];
        if (!next) {
          break;
        }
        combined.push(
          next
            .replace(/^[-*]\s*/u, "")
            .replace(/^\d+\.\s*/u, "")
            .replace(/^[一二三四五六七八九十]+[、.．]\s*/u, "")
            .trim()
        );
      }
      expanded.push(combined.join(" "));
    }
  }

  return expanded
    .flatMap((item) => item.split(/(?<=[。！？!?])/u))
    .map((item) => stripNightlyFormatting(item).trim())
    .filter(Boolean);
}

function createNightlySegmentVariants(text) {
  const variants = new Set();
  const normalized = trimLeadingNightlyMeta(stripNightlyFormatting(text));
  if (!normalized) {
    return [];
  }
  variants.add(normalized);

  const colonIndex = normalized.search(/[:：]/u);
  if (colonIndex >= 0 && colonIndex < normalized.length - 1) {
    variants.add(normalized.slice(colonIndex + 1).trim());
  }

  for (const marker of NIGHTLY_DISCOURSE_MARKERS) {
    const match = normalized.match(marker);
    if (!match || typeof match.index !== "number") {
      continue;
    }
    const next = normalized.slice(match.index + match[0].length).trim();
    if (next) {
      variants.add(next.replace(/^[：:，,\s]+/u, "").trim());
    }
  }

  return [...variants].filter(Boolean);
}

function trimLeadingNightlyMeta(text) {
  let next = String(text || "").trim();
  while (NIGHTLY_META_PATTERNS.some((pattern) => pattern.test(next))) {
    const replaced = next
      .replace(/^[^。！？!?]*[。！？!?]\s*/u, "")
      .trim();
    if (!replaced || replaced === next) {
      break;
    }
    next = replaced;
  }
  return next;
}

function isTranscriptLike(text) {
  return NIGHTLY_TRANSCRIPT_PATTERNS.some((pattern) => pattern.test(text));
}

function isProgressLike(text) {
  return NIGHTLY_PROGRESS_PATTERNS.some((pattern) => pattern.test(text));
}

function scoreNightlySegment(text) {
  const normalized = trimLeadingNightlyMeta(stripNightlyFormatting(text));
  if (!normalized || isTranscriptLike(normalized)) {
    return { text: "", score: -10, hasAnchor: false, durableSignalCount: 0 };
  }
  if (/[？?]$/u.test(normalized)) {
    return { text: "", score: -5, hasAnchor: false, durableSignalCount: 0 };
  }
  if (normalized.length > 140) {
    return { text: "", score: -6, hasAnchor: false, durableSignalCount: 0, strongDurableSignalCount: 0 };
  }

  const durableSignalCount = NIGHTLY_DURABLE_SIGNAL_PATTERNS
    .filter((pattern) => pattern.test(normalized))
    .length;
  const strongDurableSignalCount = NIGHTLY_STRONG_DURABLE_PATTERNS
    .filter((pattern) => pattern.test(normalized))
    .length;
  const domainAnchorCount = NIGHTLY_DOMAIN_ANCHOR_PATTERNS
    .filter((pattern) => pattern.test(normalized))
    .length;
  const abstractConceptCount = NIGHTLY_ABSTRACT_CONCEPT_PATTERNS
    .filter((pattern) => pattern.test(normalized))
    .length;
  const firstPersonLead = /^(我|我们)/u.test(normalized);
  const secondPersonAnchor = /(你|用户)/u.test(normalized);
  const progressLike = isProgressLike(normalized);
  const longButUnstructured = normalized.length > 180 && durableSignalCount === 0;
  const hasDomainOrUserAnchor = domainAnchorCount > 0 || secondPersonAnchor;
  const exampleHeavy = /比如[:：]/u.test(normalized) || /典型例子[:：]/u.test(normalized);

  let score = 0;
  score += durableSignalCount * 2;
  score += domainAnchorCount;
  if (secondPersonAnchor) {
    score += 1;
  }
  if (firstPersonLead) {
    score -= 1;
  }
  if (progressLike) {
    score -= 3;
  }
  if (abstractConceptCount > 0 && durableSignalCount === 0 && domainAnchorCount === 0) {
    score -= 3;
  }
  if (longButUnstructured) {
    score -= 2;
  }
  if (!hasDomainOrUserAnchor) {
    score -= 2;
  }
  if (normalized.length > 140) {
    score -= 3;
  }
  if (exampleHeavy) {
    score -= 2;
  }
  if (normalized.length < 10) {
    score -= 2;
  }

  return {
    text: normalized,
    score,
    hasAnchor: hasDomainOrUserAnchor,
    durableSignalCount,
    strongDurableSignalCount
  };
}

export function compressNightlyCandidateText(value) {
  const normalized = trimLeadingNightlyMeta(stripNightlyFormatting(value));
  if (!normalized) {
    return "";
  }
  if (isTranscriptLike(normalized)) {
    return "";
  }
  if (isProgressLike(normalized) && !NIGHTLY_DURABLE_SIGNAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return "";
  }

  const segments = splitNightlySegments(normalized);
  const best = segments
    .flatMap((segment) => createNightlySegmentVariants(segment))
    .map((segment) => scoreNightlySegment(segment))
    .filter((item) => item.text)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.text.length - right.text.length;
    })[0];

  if (best && best.score >= 2 && best.hasAnchor && best.strongDurableSignalCount > 0) {
    return best.text;
  }

  const whole = scoreNightlySegment(normalized);
  if (whole.score >= 2 && whole.hasAnchor && whole.strongDurableSignalCount > 0) {
    return whole.text;
  }

  return "";
}

export function buildDeclaredSourcesFromConversationCandidates(result, {
  maxSources = DEFAULT_MAX_DECLARED_SOURCES
} = {}) {
  const selected = [];
  const candidates = Array.isArray(result?.longTerm) ? result.longTerm : [];

  for (const candidate of candidates) {
    const text = compressNightlyCandidateText(candidate?.text);
    const action = candidate?.recommendation?.action;
    const confidence = candidate?.recommendation?.confidence;
    if (!text) {
      continue;
    }
    if (action === "skip-memory-md-existing") {
      continue;
    }
    if (action !== "promote-memory-md" && confidence === "low") {
      continue;
    }

    const previous = selected.find((item) => calculateNightlySimilarity(item.text, text) >= 0.66);
    const score = Number(candidate?.score || 0);
    if (!previous) {
      selected.push({
        text,
        score,
        candidate
      });
      continue;
    }
    if (Number(previous.score || 0) < score) {
      previous.text = text;
      previous.score = score;
      previous.candidate = candidate;
    }
  }

  return selected
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
    .slice(0, maxSources)
    .map((item) => ({
      sourceType: "manual",
      declaredBy: "openclaw-plugin-nightly-self-learning",
      content: item.text
    }));
}

async function listAgentIds(agentsRoot = DEFAULT_AGENTS_ROOT) {
  try {
    const entries = await fs.readdir(agentsRoot, { withFileTypes: true });
    const agentIds = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter(Boolean)
      .sort();
    return agentIds.length > 0 ? agentIds : ["main"];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return ["main"];
    }
    throw error;
  }
}

async function collectOpenClawDeclaredSources({
  pluginConfig,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const agentIds = await listAgentIds();
  const declaredSources = [];
  const scannedAgents = [];
  const memoryDistillation = pluginConfig?.memoryDistillation || {};
  const governedExports = pluginConfig?.openclawAdapter?.governedExports || {};
  const namespaceBaseContext = {
    workspaceId: governedExports.workspaceId,
    tenant: governedExports.tenant,
    scope: governedExports.scope,
    resource: governedExports.resource,
    host: governedExports.host
  };

  for (const agentId of agentIds) {
    let result;
    try {
      result = await collectConversationMemoryCandidates(agentId, {
        sessionLimit: memoryDistillation.sessionLimit,
        indexedHistoryEnabled: memoryDistillation.indexedHistoryEnabled,
        indexedHistoryFileLimit: memoryDistillation.indexedHistoryFileLimit,
        workspaceRoot
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    const agentDeclaredSources = buildDeclaredSourcesFromConversationCandidates(result);
    if (agentDeclaredSources.length === 0) {
      continue;
    }
    scannedAgents.push({
      agentId,
      sessionFiles: Array.isArray(result.files) ? result.files.length : 0,
      messages: Array.isArray(result.messages) ? result.messages.length : 0,
      longTermCandidates: Array.isArray(result.longTerm) ? result.longTerm.length : 0,
      declaredSources: agentDeclaredSources.length
    });
    const targetNamespace = governedExports?.agentNamespace?.enabled
      ? resolveOpenClawAgentNamespace({
        ...namespaceBaseContext,
        agentId
      })
      : resolveOpenClawNamespace(namespaceBaseContext);
    declaredSources.push(...agentDeclaredSources.map((item) => ({
      ...item,
      declaredBy: `${item.declaredBy}:${agentId}`,
      namespace: targetNamespace
    })));
  }

  return {
    declaredSources,
    collector: {
      workspaceRoot,
      scannedAgents,
      agentCount: scannedAgents.length,
      declaredSourceCount: declaredSources.length
    }
  };
}

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJsonFile(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeTextFile(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

export function createOpenClawSelfLearningService(options = {}) {
  const clock = options.clock || (() => new Date());
  const logger = options.logger;
  const pluginConfig = options.pluginConfig || {};
  const timerApi = {
    setTimeout: options.setTimeout || globalThis.setTimeout,
    clearTimeout: options.clearTimeout || globalThis.clearTimeout
  };
  const collector = options.collector || ((params) => collectOpenClawDeclaredSources(params));
  const governedExports = pluginConfig?.openclawAdapter?.governedExports || {};
  const registryDir = normalizeString(
    governedExports.registryDir,
    path.join(os.homedir(), ".openclaw", "unified-memory-core", "registry")
  );
  const localTime = normalizeTimeOfDay(pluginConfig?.selfLearning?.localTime, "00:00");
  const runtimeFactory = options.runtimeFactory || ((params) => createStandaloneRuntime(params));
  const namespace = resolveOpenClawNamespace({
    workspaceId: governedExports.workspaceId,
    tenant: governedExports.tenant,
    scope: governedExports.scope,
    resource: governedExports.resource,
    host: governedExports.host
  });
  const runtime = runtimeFactory({
    config: {
      registryDir,
      namespace,
      visibility: "workspace"
    },
    clock
  });
  const schedulerStatePath = options.statePath || path.join(registryDir, "self-learning", "scheduler-state.json");
  const reportsDir = options.reportsDir || path.join(registryDir, "self-learning", "reports");

  let timer = null;
  let running = null;

  async function persistState(nextState) {
    await writeJsonFile(schedulerStatePath, nextState);
  }

  async function readState() {
    return readJsonFile(schedulerStatePath, {
      lastCompletedLocalDate: "",
      lastCompletedAt: "",
      lastStatus: "idle",
      latestReportJsonPath: "",
      latestReportMarkdownPath: ""
    });
  }

  async function writeReports(localDateKey, payload) {
    const jsonPath = path.join(reportsDir, `daily-reflection-${localDateKey}.json`);
    const markdownPath = path.join(reportsDir, `daily-reflection-${localDateKey}.md`);
    const latestJsonPath = path.join(reportsDir, "daily-reflection-latest.json");
    const latestMarkdownPath = path.join(reportsDir, "daily-reflection-latest.md");
    const markdown = payload.report
      ? renderDailyReflectionReport(payload.report, { format: "markdown" })
      : [
          "# Unified Memory Core Daily Reflection",
          `- localDate: \`${localDateKey}\``,
          `- sourceCount: \`${payload.collector?.declaredSourceCount || 0}\``,
          "- status: `no_sources`"
        ].join("\n") + "\n";

    await writeJsonFile(jsonPath, payload);
    await writeJsonFile(latestJsonPath, payload);
    await writeTextFile(markdownPath, markdown);
    await writeTextFile(latestMarkdownPath, markdown);

    return {
      jsonPath,
      markdownPath,
      latestJsonPath,
      latestMarkdownPath
    };
  }

  async function runOnce(trigger = "timer") {
    if (running) {
      return running;
    }

    running = (async () => {
      const startedAt = clock();
      const localDateKey = formatLocalDateKey(startedAt);
      const previousState = await readState();

      await persistState({
        ...previousState,
        lastAttemptedAt: startedAt.toISOString(),
        lastStatus: "running"
      });

      try {
        const collected = await collector({
          pluginConfig,
          workspaceRoot: DEFAULT_WORKSPACE_ROOT
        });
        const declaredSources = (collected?.declaredSources || []).map((item) => ({
          ...item,
          namespace: item.namespace || namespace,
          visibility: item.visibility || "workspace"
        }));

        let report = null;
        if (declaredSources.length > 0) {
          report = await runtime.runDailyReflection({
            declaredSources,
            autoPromote: true,
            decidedBy: "openclaw-plugin-nightly-self-learning"
          });
        }

        const persistedReports = await writeReports(localDateKey, {
          trigger,
          localDate: localDateKey,
          scheduledLocalTime: localTime,
          generatedAt: clock().toISOString(),
          namespace,
          collector: collected?.collector || {
            workspaceRoot: DEFAULT_WORKSPACE_ROOT,
            scannedAgents: [],
            agentCount: 0,
            declaredSourceCount: declaredSources.length
          },
          report
        });

        const nextState = {
          ...previousState,
          lastAttemptedAt: startedAt.toISOString(),
          lastCompletedAt: clock().toISOString(),
          lastCompletedLocalDate: localDateKey,
          lastStatus: report ? "completed" : "no_sources",
          lastRunId: report?.run_id || "",
          latestReportJsonPath: persistedReports.latestJsonPath,
          latestReportMarkdownPath: persistedReports.latestMarkdownPath,
          lastError: ""
        };

        await persistState(nextState);
        logger?.info?.(
          `[unified-memory-core] nightly self-learning completed (status=${nextState.lastStatus}, sources=${declaredSources.length}, promoted=${report?.promoted_stable_artifacts?.length || 0}, next=${getNextSelfLearningRunAt(clock(), localTime).toISOString()})`
        );
        return {
          state: nextState,
          report
        };
      } catch (error) {
        const failedState = {
          ...previousState,
          lastAttemptedAt: startedAt.toISOString(),
          lastStatus: "failed",
          lastError: String(error)
        };
        await persistState(failedState);
        logger?.warn?.(`[unified-memory-core] nightly self-learning failed: ${String(error)}`);
        throw error;
      } finally {
        running = null;
      }
    })();

    return running;
  }

  async function runIfDue(trigger = "timer") {
    if (pluginConfig?.selfLearning?.enabled === false) {
      return null;
    }
    const state = await readState();
    if (!isSelfLearningRunDue({
      now: clock(),
      localTime,
      lastCompletedLocalDate: state.lastCompletedLocalDate
    })) {
      return null;
    }
    return runOnce(trigger);
  }

  function scheduleNext() {
    if (pluginConfig?.selfLearning?.enabled === false) {
      return;
    }
    if (timer) {
      timerApi.clearTimeout(timer);
      timer = null;
    }
    const nextRunAt = getNextSelfLearningRunAt(clock(), localTime);
    const delayMs = Math.max(1000, nextRunAt.getTime() - clock().getTime());
    timer = timerApi.setTimeout(async () => {
      try {
        await runIfDue("timer");
      } catch {}
      scheduleNext();
    }, delayMs);
    logger?.info?.(
      `[unified-memory-core] nightly self-learning scheduled (localTime=${localTime}, next=${nextRunAt.toISOString()})`
    );
  }

  return {
    id: "unified-memory-core-nightly-self-learning",
    runtime,
    async start() {
      if (pluginConfig?.selfLearning?.enabled === false) {
        logger?.info?.("[unified-memory-core] nightly self-learning disabled");
        return;
      }
      await runIfDue("startup");
      scheduleNext();
    },
    async stop() {
      if (timer) {
        timerApi.clearTimeout(timer);
        timer = null;
      }
    },
    async runNow(trigger = "manual") {
      return runOnce(trigger);
    },
    async readState() {
      return readState();
    }
  };
}
