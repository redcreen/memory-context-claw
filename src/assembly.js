import {
  canonicalizeMemoryPath,
  estimateMessageTokens,
  estimateTokenCountFromText,
  extractLatestUserPrompt,
  sanitizeForSystemPrompt
} from "./utils.js";

function isStableDocIntent(query = "") {
  const text = String(query || "").toLowerCase();
  return /配置|config|安装|install|启用|enable|memorysearch\.provider|provider.*做什么|embedding|memory_search|lossless|context engine|长期记忆.*区别|为什么已经有长期记忆了|规则|原则|memory\.md|应该放|项目定位|项目背景|这个项目|做什么用|解决什么问题|workspace\/notes|pending|待确认信息|路线图|roadmap|架构文档|测试文档|哪个文档|主文档|总入口/.test(
    text
  );
}

function classifyStableDocIntent(query = "") {
  const text = String(query || "").toLowerCase();
  if (/memorysearch\.provider|provider.*做什么|embedding|memory_search/.test(text)) {
    return "provider";
  }
  if (/安装后.*确认|怎么确认|plugins list|memory status|验证|verify|已加载|生效了/.test(text)) {
    return "installVerify";
  }
  if (/路线图|roadmap|架构文档|architecture doc|测试文档|testsuite|配置文档|哪个文档|看哪个文档|主文档|总入口/.test(text)) {
    return "projectNavigation";
  }
  if (/稳定版|发布版|release tag|tag 安装|main 分支|当前 main|开发版安装|安装稳定版|安装.*main/.test(text)) {
    return "releaseInstall";
  }
  if (/workspace 目录|目录结构|怎么组织|如何组织|目录规则|memory 目录|workspace\/memory|workspace\/notes|workspace\/memory\.md|长期记忆目录/.test(text)) {
    return "workspaceStructure";
  }
  if (/workspace\/notes|notes 里的笔记|哪些笔记.*stable card|什么时候.*stable card|什么样的 note|什么样的 notes|背景 notes|背景笔记.*stable card/.test(text)) {
    return "workspaceNotesRule";
  }
  if (/lossless|上下文插件|context engine|长期记忆.*区别|为什么已经有长期记忆了/.test(text)) {
    return "lossless";
  }
  if (/待确认信息|pending|未确认信息.*放哪里|待确认.*放哪里|应该进入 pending|不该写入 memory\.md|不该写入 daily/.test(text)) {
    return "pendingRule";
  }
  if (/项目定位|项目背景|这个项目|做什么用|解决什么问题/.test(text)) {
    return "project";
  }
  if (/规则|原则|memory\.md|应该放|适合放|不适合放|长期稳定/.test(text)) {
    return "rule";
  }
  if (/配置|config|安装|install|启用|enable/.test(text)) {
    return "config";
  }
  return "";
}

function classifyStableFactIntent(query = "") {
  const text = String(query || "").toLowerCase();
  if (/爱吃|喜欢吃|饮食|口味|食物|偏好|爱好/.test(text)) {
    return "preference";
  }
  if (/怎么称呼|叫什么|姓名|名字|昵称|称呼|身份/.test(text)) {
    return "identity";
  }
  if (/时区|timezone|北京时间|gmt\+?8|utc\+?8/.test(text)) {
    return "timezone";
  }
  if (/沟通风格|怎么.*沟通|如何.*沟通|跟我沟通|交流风格|说话风格|直接|实用|不废话/.test(text)) {
    return "style";
  }
  if (/提醒|提醒事项|飞书任务|苹果日历|日历提醒|双通道/.test(text)) {
    return "reminder";
  }
  if (/低风险|可逆操作|高风险动作|先确认|默认推进|收到明确任务|可直接执行|风险动作/.test(text)) {
    return "execution";
  }
  if (/openviking|长期记忆检索补充工具|查询个人信息|历史片段|偏好查询/.test(text)) {
    return "toolRole";
  }
  if (/编程工作|文档工作|订单工作|健康工作|交给谁|哪个agent|哪个 agent|code agent|document agent|order agent|health agent|main 先处理/.test(text)) {
    return "agentRole";
  }
  if (/main.*负责|main.*边界|main 负责什么|总协调|任务判断|任务分派|结果汇总|长期承接/.test(text)) {
    return "mainBoundary";
  }
  if (/main 不负责什么|main 不长期承接|不长期承接|不负责/.test(text)) {
    return "mainNegativeBoundary";
  }
  if (/已开始是什么意思|等待确认是什么意思|排队中是什么意思|已暂停是什么意思|状态词|真实状态|阻塞态/.test(text)) {
    return "statusRule";
  }
  return "";
}

function candidateMatchesStableDocIntent(intent, candidate) {
  const path = String(candidate?.path || candidate?.canonicalPath || "");
  const snippet = String(candidate?.snippet || "");
  const pathText = path.toLowerCase();
  const snippetText = snippet.toLowerCase();
  const haystack = `${pathText}\n${snippetText}`;
  const fromFormalPolicy = /(^|\/)formal-memory-policy\.md$/.test(pathText);
  const fromConfigDoc = /(^|\/)configuration\.md$/.test(pathText);
  const fromReadme = /(^|\/)readme\.md$/.test(pathText);
  const fromProjectRoadmap = /(^|\/)project-roadmap\.md$/.test(pathText);

  switch (intent) {
    case "provider":
      return fromConfigDoc && /memorysearch\.provider|embedding|memory_search|provider/.test(snippetText);
    case "installVerify":
      return fromConfigDoc && /plugins list|memory status|已加载|verify|验证/.test(snippetText);
    case "projectNavigation":
      return (fromProjectRoadmap || fromReadme) && /project-roadmap\.md|memory-search-roadmap\.md|system-architecture\.md|testsuite\.md|configuration\.md|主 roadmap|总索引|专项 roadmap|看哪个文档/.test(snippetText);
    case "releaseInstall":
      return (fromReadme || fromConfigDoc) && /release tag|稳定版|发布版|当前 main|开发版安装|main 分支/.test(snippetText);
    case "workspaceStructure":
      return (
        (fromReadme && /workspace\/memory|workspace\/notes|workspace\/memory\.md/.test(snippetText))
        || (fromFormalPolicy && /长期稳定|反复复用/.test(snippetText))
      );
    case "workspaceNotesRule":
      return fromReadme && /workspace\/notes|stable card|背景 notes|背景笔记|历史 roadmap|临时配置说明|一句话结论|适用场景/.test(snippetText);
    case "lossless":
      return (
        /openclaw-memory-vs-lossless\.md$/.test(pathText)
        || (fromReadme && /context engine|上下文引擎|长期记忆更稳定地变成当前轮可用的上下文/.test(snippetText))
      );
    case "pendingRule":
      return fromFormalPolicy && /pending|待确认信息|未确认信息|不得默认写入|memory\/yyyy-mm-dd\.md/.test(snippetText);
    case "project":
      return fromReadme && /context engine|上下文引擎|项目定位|长期记忆更稳定地变成当前轮可用的上下文/.test(snippetText);
    case "rule":
      return (
        (fromFormalPolicy && /规则|原则|长期稳定|反复复用|待确认信息|memory\/yyyy-mm-dd\.md/.test(snippetText))
        || (fromReadme && /workspace\/memory|workspace\/notes|workspace\/memory\.md/.test(snippetText))
      );
    case "config":
      return fromConfigDoc && /config|配置|安装|install|启用|enable|contextengine|entries|enabled:\s*true|memorysearch\.provider|plugins list|memory status/.test(snippetText);
    default:
      return true;
  }
}

function candidateMatchesStableFactIntent(intent, candidate) {
  const path = String(candidate?.path || candidate?.canonicalPath || "");
  const snippet = String(candidate?.snippet || "");
  const pathText = path.toLowerCase();
  const snippetText = snippet.toLowerCase();
  const fromStableMemory = /(^|\/)memory\.md$/.test(pathText) || /(^|\/)memory\/\d{4}-\d{2}-\d{2}\.md$/.test(pathText);

  switch (intent) {
    case "preference":
      return fromStableMemory || /爱吃|饮食|口味|偏好/.test(snippetText);
    case "identity":
      return fromStableMemory || /刘超|超哥|称呼|姓名|昵称/.test(snippetText);
    case "timezone":
      return fromStableMemory || /时区|北京时间|gmt\+?8|utc\+?8/.test(snippetText);
    case "style":
      return fromStableMemory || /沟通风格|交流风格|说话风格|直接|实用|不废话/.test(snippetText);
    case "reminder":
      return fromStableMemory || /提醒|飞书任务|苹果日历|日历提醒|双通道/.test(snippetText);
    case "execution":
      return fromStableMemory || /默认推进|风险动作再确认|低风险|可逆操作|可直接执行|高风险动作|先确认/.test(snippetText);
    case "toolRole":
      return fromStableMemory || /openviking|长期记忆检索补充工具|查询个人信息|偏好|历史片段/.test(snippetText);
    case "agentRole":
      return fromStableMemory || /编程工作|文档工作|订单工作|健康工作|code agent|document agent|order agent|health agent|main 先处理/.test(snippetText);
    case "mainBoundary":
      return fromStableMemory || /main 负责|总协调|任务判断|任务分派|结果汇总|不长期承接/.test(snippetText);
    case "mainNegativeBoundary":
      return fromStableMemory || /main 不长期承接|不负责/.test(snippetText);
    case "statusRule":
      return fromStableMemory || /已开始|等待确认|排队中|已暂停|真实状态|阻塞态/.test(snippetText);
    default:
      return true;
  }
}

function filterStableDocSupportingCandidates(query, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }
  const intent = classifyStableDocIntent(query);
  if (!intent) {
    return candidates;
  }

  const filtered = candidates.filter((candidate) => candidateMatchesStableDocIntent(intent, candidate));
  if (filtered.length > 0 && (intent === "workspaceStructure" || intent === "lossless")) {
    return [filtered[0]];
  }
  return filtered.length > 0 ? filtered : candidates;
}

function filterStableFactSupportingCandidates(query, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }
  const intent = classifyStableFactIntent(query);
  if (!intent) {
    return candidates;
  }

  const hasStableCardArtifact = candidates.some((candidate) => candidate?.pathKind === "cardArtifact");
  if (!hasStableCardArtifact) {
    return candidates;
  }

  const filtered = candidates.filter((candidate) => candidateMatchesStableFactIntent(intent, candidate));
  return filtered.length > 0 ? filtered : candidates;
}

function classifyMixedFactIntent(query = "") {
  const text = String(query || "").toLowerCase();
  if (/(?:^|你|我).*(生日|农历生日)/.test(text) && !/女儿|儿子|孩子/.test(text) && !/身份证|出生年份/.test(text)) {
    return "selfBirthday";
  }
  if (/女儿/.test(text)) {
    return "daughter";
  }
  if (/儿子/.test(text)) {
    return "son";
  }
  if (/孩子|一儿一女|家庭/.test(text) && !/身份证|出生年份/.test(text)) {
    return "children";
  }
  return "";
}

function candidateMatchesMixedFactIntent(intent, candidate) {
  const path = String(candidate?.path || candidate?.canonicalPath || "").toLowerCase();
  const snippet = String(candidate?.snippet || "").toLowerCase();
  const fromStableMemory = /(^|\/)memory\.md$/.test(path) || /(^|\/)memory\/\d{4}-\d{2}-\d{2}\.md$/.test(path);

  switch (intent) {
    case "selfBirthday":
      return (fromStableMemory || candidate?.pathKind === "cardArtifact")
        && /你的生日是|农历生日/.test(snippet)
        && !/身份证登记生日年份|实际出生年份/.test(snippet);
    case "daughter":
      return (fromStableMemory || candidate?.pathKind === "cardArtifact")
        && /你女儿/.test(snippet)
        && !/身份证登记生日年份|实际出生年份/.test(snippet);
    case "son":
      return (fromStableMemory || candidate?.pathKind === "cardArtifact")
        && /你儿子/.test(snippet)
        && !/身份证登记生日年份|实际出生年份/.test(snippet);
    case "children":
      return (fromStableMemory || candidate?.pathKind === "cardArtifact")
        && (/你女儿|你儿子|一儿一女|孩子|家庭/.test(snippet))
        && !/身份证登记生日年份|实际出生年份/.test(snippet);
    default:
      return true;
  }
}

function filterMixedFactSupportingCandidates(query, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }
  const intent = classifyMixedFactIntent(query);
  if (!intent) {
    return candidates;
  }

  const hasStableCardArtifact = candidates.some((candidate) => candidate?.pathKind === "cardArtifact");
  if (!hasStableCardArtifact) {
    return candidates;
  }

  const filtered = candidates.filter((candidate) => candidateMatchesMixedFactIntent(intent, candidate));
  return filtered.length > 0 ? filtered : candidates;
}

function classifyShortFactLookup(query = "") {
  const raw = String(query || "").trim();
  if (!raw) {
    return false;
  }
  if (isStableDocIntent(raw) || classifyStableFactIntent(raw) || classifyMixedFactIntent(raw)) {
    return false;
  }

  const normalized = raw
    .replace(/[，、。；：！？,.!?/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = normalized ? normalized.split(" ") : [];

  return parts.length >= 1 && parts.length <= 4 && normalized.length <= 16;
}

function isDirectStableFactCard(candidate) {
  const path = String(candidate?.path || candidate?.canonicalPath || "").toLowerCase();
  const snippet = String(candidate?.snippet || "");
  const fromStableMemory = /(^|\/)memory\.md$/.test(path) || /(^|\/)memory\/\d{4}-\d{2}-\d{2}\.md$/.test(path);
  return (
    candidate?.pathKind === "cardArtifact" &&
    fromStableMemory &&
    /你爱吃|你叫|你的生日是|农历生日|你女儿|你儿子|你的实际出生年份|你的时区|openviking|main 负责|main 不负责|已开始|等待确认|排队中|已暂停/.test(snippet)
  );
}

function filterShortFactLookupCandidates(query, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }
  if (!classifyShortFactLookup(query)) {
    return candidates;
  }

  const directStableFactCards = candidates.filter(isDirectStableFactCard);
  if (directStableFactCards.length === 0) {
    return candidates;
  }

  return [directStableFactCards[0]];
}

function filterSessionNoiseForStableDocIntents(query, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }
  if (!isStableDocIntent(query)) {
    return candidates;
  }

  const hasStableCardArtifact = candidates.some((candidate) => candidate?.pathKind === "cardArtifact");
  if (!hasStableCardArtifact) {
    return candidates;
  }

  const filtered = candidates.filter((candidate) => candidate?.pathKind !== "sessionMemory");
  return filtered.length > 0 ? filtered : candidates;
}

export function trimMessagesToBudget(messages, tokenBudget, recentMessageCount) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  const budget = Math.max(256, Number(tokenBudget || 0));
  const preserved = [];
  let total = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const tokens = estimateMessageTokens(message);
    const mustKeep = preserved.length < recentMessageCount;
    if (mustKeep || total + tokens <= budget) {
      preserved.push(message);
      total += tokens;
      continue;
    }
    break;
  }

  return preserved.reverse();
}

export function selectChunksWithinBudget(candidates, tokenBudget, maxSelectedChunks) {
  const selected = [];
  const seen = new Set();
  let total = 0;
  for (const candidate of candidates) {
    if (selected.length >= maxSelectedChunks) {
      break;
    }
    const uniqueKey = [
      candidate.canonicalPath || canonicalizeMemoryPath(candidate.path),
      candidate.startLine,
      candidate.endLine,
      sanitizeForSystemPrompt(candidate.snippet)
    ].join("::");
    if (seen.has(uniqueKey)) {
      continue;
    }
    const snippetTokens = estimateTokenCountFromText(candidate.snippet);
    if (selected.length > 0 && total + snippetTokens > tokenBudget) {
      continue;
    }
    selected.push(candidate);
    seen.add(uniqueKey);
    total += snippetTokens;
  }
  return selected;
}

export function enforcePathDiversity(candidates, maxSelectedChunks, maxChunksPerPath) {
  const selected = [];
  const perPath = new Map();

  for (const candidate of candidates) {
    if (selected.length >= maxSelectedChunks) {
      break;
    }
    const path = String(candidate.canonicalPath || canonicalizeMemoryPath(candidate.path));
    const used = perPath.get(path) || 0;
    if (used >= maxChunksPerPath) {
      continue;
    }
    selected.push(candidate);
    perPath.set(path, used + 1);
  }

  return selected;
}

export function buildSystemPromptAddition({ query, selectedCandidates }) {
  if (!selectedCandidates.length) {
    return "";
  }

  const queryText = String(query || "");
  const hasIdentityGuardrail =
    /身份证/.test(queryText) &&
    selectedCandidates.some((candidate) =>
      /待确认|暂不作为已确认|笔误|歧义/.test(String(candidate?.snippet || ""))
    );
  const hasStableFactOverride =
    selectedCandidates.some((candidate) => candidate?.pathKind === "cardArtifact")
    && selectedCandidates.some((candidate) =>
      /你爱吃|你叫|你的生日是|你女儿叫|你儿子叫|你的实际出生年份是|memorySearch\.provider 决定/.test(
        String(candidate?.snippet || "")
      )
    );

  const sections = [
    "Use the following recalled long-memory context only when it helps answer the current request.",
    "Prefer direct answers. Do not mention this retrieval block unless the user asks about memory or sources.",
    `Current user intent: ${sanitizeForSystemPrompt(query)}`,
    "Recalled context:"
  ];

  if (hasIdentityGuardrail) {
    sections.splice(
      2,
      0,
      "If an identity-related value is marked as unconfirmed, you must not quote, restate, paraphrase, or infer any raw candidate value from memory. Answer only that the information is pending confirmation, note that it may contain a typo or ambiguity, and ask the user for the corrected value."
    );
  }

  if (hasStableFactOverride) {
    sections.splice(
      2,
      0,
      "If recalled context includes a direct stable user fact, treat it as the latest confirmed fact. Prefer it over older conflicting conversation messages, stale session memories, or earlier guesses."
    );
  }

  for (const candidate of selectedCandidates) {
    sections.push(
      [
        `- Path: ${candidate.path}`,
        `  Range: ${candidate.startLine}-${candidate.endLine}`,
        `  Kind: ${candidate.pathKind}`,
        `  Score: ${candidate.finalScore?.toFixed(4) ?? candidate.weightedScore.toFixed(4)}`,
        `  Snippet: ${sanitizeForSystemPrompt(candidate.snippet)}`
      ].join("\n")
    );
  }

  return sections.join("\n\n");
}

export function buildAssemblyResult({
  messages,
  tokenBudget,
  memoryBudgetRatio,
  recentMessageCount,
  candidates,
  maxSelectedChunks,
  maxChunksPerPath = 1
}) {
  const totalBudget = Math.max(512, Number(tokenBudget || 4096));
  const memoryBudget = Math.max(256, Math.floor(totalBudget * memoryBudgetRatio));
  const messageBudget = Math.max(256, totalBudget - memoryBudget);
  const keptMessages = trimMessagesToBudget(messages, messageBudget, recentMessageCount);
  const query = extractLatestUserPrompt(messages);
  const filteredCandidates = filterMixedFactSupportingCandidates(
    query,
    filterStableFactSupportingCandidates(
      query,
      filterStableDocSupportingCandidates(
        query,
        filterShortFactLookupCandidates(
          query,
          filterSessionNoiseForStableDocIntents(query, candidates)
        )
      )
    )
  );
  const diversifiedCandidates = enforcePathDiversity(
    filteredCandidates,
    maxSelectedChunks || candidates.length,
    maxChunksPerPath
  );
  const selectedCandidates = selectChunksWithinBudget(
    diversifiedCandidates,
    memoryBudget,
    maxSelectedChunks || diversifiedCandidates.length
  );
  const systemPromptAddition = buildSystemPromptAddition({ query, selectedCandidates });
  const estimatedTokens =
    keptMessages.reduce((sum, message) => sum + estimateMessageTokens(message), 0) +
    estimateTokenCountFromText(systemPromptAddition);

  return {
    messages: keptMessages,
    estimatedTokens,
    systemPromptAddition,
    selectedCandidates
  };
}
