import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildCodexContextMinorGcPackage,
  resolveCodexContextMinorGcConfig
} from "./codex-context-minor-gc.js";

const CODEX_HOST_CONTEXT_WARNING_RATIO = 0.75;
const CODEX_HOST_CONTEXT_HANDOFF_RATIO = 0.82;
const CODEX_HOST_CONTEXT_SOFT_LIMIT_RATIO = 0.9;
const CODEX_HOST_CONTEXT_DEFAULT_WINDOW_CAP = 0;
const CODEX_VSCODE_DEFAULT_MAX_MESSAGES = 12;
const CODEX_VSCODE_MAX_ASSISTANT_CONTEXT_CHARS = 220;
const CODEX_VSCODE_MAX_COMMENTARY_CONTEXT_CHARS = 120;

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (["true", "1", "yes", "y", "enabled", "on"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n", "disabled", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeMessageText(value) {
  return normalizeString(String(value || "").replace(/\r\n?/g, "\n"));
}

function stripCodexContextBoilerplate(text = "") {
  const lines = normalizeMessageText(text).split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return true;
    }
    return ![
      /^Context\(估算\):/i,
      /^Ran \d+ commands?$/i,
      /^正在浏览/i,
      /^Searched for /i,
      /^Listed files in/i,
      /^已运行 /i
    ].some((pattern) => pattern.test(trimmed));
  });
  return normalizeString(filtered.join("\n"));
}

function truncateAtBoundary(text = "", maxChars = 0) {
  const normalized = normalizeString(text);
  const limit = Math.max(0, Math.trunc(Number(maxChars || 0)));
  if (!normalized || limit <= 0 || normalized.length <= limit) {
    return normalized;
  }

  const slice = normalized.slice(0, limit + 1);
  const boundary = Math.max(
    slice.lastIndexOf("。"),
    slice.lastIndexOf(". "),
    slice.lastIndexOf("！"),
    slice.lastIndexOf("？"),
    slice.lastIndexOf("\n"),
    slice.lastIndexOf("; "),
    slice.lastIndexOf(" ")
  );
  const picked = boundary >= Math.floor(limit * 0.6)
    ? slice.slice(0, boundary + 1)
    : normalized.slice(0, limit);
  return `${picked.trim()}…`;
}

function compressAssistantContextMessage({
  content = "",
  phase = ""
} = {}) {
  const normalizedPhase = normalizeString(phase);
  const stripped = stripCodexContextBoilerplate(content);
  if (!stripped) {
    return "";
  }

  const maxChars = normalizedPhase === "commentary"
    ? CODEX_VSCODE_MAX_COMMENTARY_CONTEXT_CHARS
    : CODEX_VSCODE_MAX_ASSISTANT_CONTEXT_CHARS;
  const paragraphs = stripped
    .split(/\n{2,}/)
    .map((item) => normalizeString(item))
    .filter(Boolean);
  const compact = normalizeString(paragraphs.slice(0, 2).join("\n\n"), stripped);
  return truncateAtBoundary(compact, maxChars);
}

function dedupeConsecutiveMessages(messages = []) {
  const deduped = [];
  for (const message of Array.isArray(messages) ? messages : []) {
    const previous = deduped[deduped.length - 1];
    if (
      previous &&
      previous.role === message?.role &&
      previous.content === message?.content
    ) {
      continue;
    }
    deduped.push(message);
  }
  return deduped;
}

function extractManualGcCasePrefix(text = "") {
  const match = normalizeMessageText(text).match(/\[(GC-[^\]]+)\]/i);
  return match ? `[${match[1]}]` : "";
}

function filterMessagesForManualGcCase(messages = [], query = "") {
  const casePrefix = extractManualGcCasePrefix(query);
  if (!casePrefix) {
    return Array.isArray(messages) ? messages : [];
  }

  const filtered = (Array.isArray(messages) ? messages : []).filter((message) => {
    if (normalizeString(message?.role) !== "user") {
      return false;
    }
    return normalizeMessageText(message?.content).includes(casePrefix);
  });

  return filtered.length > 0 ? filtered : (Array.isArray(messages) ? messages : []);
}

async function listJsonlFilesRecursively(rootDir) {
  const files = [];
  const pending = [rootDir];

  while (pending.length > 0) {
    const currentDir = pending.pop();
    let entries = [];
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

async function readJsonlLines(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function extractLatestCodexVscodeTokenCount({
  sessionPath
} = {}) {
  if (!normalizeString(sessionPath)) {
    return null;
  }

  let entries = [];
  try {
    entries = await readJsonlLines(sessionPath);
  } catch {
    return null;
  }

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry?.type !== "event_msg") {
      continue;
    }
    const payload = entry.payload || {};
    if (normalizeString(payload.type) !== "token_count") {
      continue;
    }
    const info = payload.info || {};
    const lastUsage = info.last_token_usage || {};
    const totalUsage = info.total_token_usage || {};

    return {
      timestamp: normalizeString(entry.timestamp),
      inputTokens: Math.max(0, normalizeNumber(lastUsage.input_tokens, 0)),
      cachedInputTokens: Math.max(0, normalizeNumber(lastUsage.cached_input_tokens, 0)),
      outputTokens: Math.max(0, normalizeNumber(lastUsage.output_tokens, 0)),
      reasoningOutputTokens: Math.max(0, normalizeNumber(lastUsage.reasoning_output_tokens, 0)),
      totalTokens: Math.max(0, normalizeNumber(lastUsage.total_tokens, 0)),
      modelContextWindow: Math.max(0, normalizeNumber(info.model_context_window, 0)),
      totalInputTokens: Math.max(0, normalizeNumber(totalUsage.input_tokens, 0))
    };
  }

  return null;
}

async function extractRecentCodexVscodeTokenCounts({
  sessionPath,
  limit = 8,
  hostContextWindowCap = CODEX_HOST_CONTEXT_DEFAULT_WINDOW_CAP
} = {}) {
  if (!normalizeString(sessionPath)) {
    return [];
  }

  let entries = [];
  try {
    entries = await readJsonlLines(sessionPath);
  } catch {
    return [];
  }

  const tokenEvents = [];
  for (const entry of entries) {
    if (entry?.type !== "event_msg") {
      continue;
    }
    const payload = entry.payload || {};
    if (normalizeString(payload.type) !== "token_count") {
      continue;
    }
    const info = payload.info || {};
    const lastUsage = info.last_token_usage || {};
    const reportedModelContextWindow = Math.max(0, normalizeNumber(info.model_context_window, 0));
    const cappedWindow = (
      reportedModelContextWindow > 0 && hostContextWindowCap > 0
        ? Math.min(reportedModelContextWindow, hostContextWindowCap)
        : reportedModelContextWindow
    );
    const inputTokens = Math.max(0, normalizeNumber(lastUsage.input_tokens, 0));
    const actualWindowRatio = cappedWindow > 0
      ? Number((inputTokens / cappedWindow).toFixed(4))
      : 0;
    let riskLevel = "normal";
    if (actualWindowRatio >= CODEX_HOST_CONTEXT_SOFT_LIMIT_RATIO) {
      riskLevel = "critical";
    } else if (actualWindowRatio >= CODEX_HOST_CONTEXT_HANDOFF_RATIO) {
      riskLevel = "high";
    } else if (actualWindowRatio >= CODEX_HOST_CONTEXT_WARNING_RATIO) {
      riskLevel = "warning";
    }
    tokenEvents.push({
      timestamp: normalizeString(entry.timestamp),
      inputTokens,
      modelContextWindow: cappedWindow,
      actualWindowRatio,
      riskLevel
    });
  }

  return tokenEvents.slice(-Math.max(1, Math.trunc(Number(limit || 8))));
}

function buildHostContextSummary({
  tokenCount = null,
  contextMinorGc = {},
  hostContextWindowCap = CODEX_HOST_CONTEXT_DEFAULT_WINDOW_CAP
} = {}) {
  if (!tokenCount || tokenCount.inputTokens <= 0) {
    return null;
  }

  const baseline = Math.max(0, normalizeNumber(contextMinorGc.baselineContextEstimate, 0));
  const effective = Math.max(0, normalizeNumber(contextMinorGc.effectiveContextEstimate, baseline));
  const savedTokens = Math.max(0, baseline - effective);
  const actualInputTokens = Math.max(0, normalizeNumber(tokenCount.inputTokens, 0));
  const originalInputTokens = actualInputTokens + savedTokens;
  const reportedModelContextWindow = Math.max(0, normalizeNumber(tokenCount.modelContextWindow, 0));
  const normalizedHostContextWindowCap = Math.max(0, normalizeNumber(hostContextWindowCap, 0));
  const modelContextWindow = (
    normalizedHostContextWindowCap > 0 && reportedModelContextWindow > 0
      ? Math.min(reportedModelContextWindow, normalizedHostContextWindowCap)
      : reportedModelContextWindow
  );
  const softLimitTokenCount = modelContextWindow > 0
    ? Math.max(0, Math.floor(modelContextWindow * CODEX_HOST_CONTEXT_SOFT_LIMIT_RATIO))
    : 0;
  const reductionRatio = originalInputTokens > 0
    ? Number((savedTokens / originalInputTokens).toFixed(4))
    : 0;
  const actualWindowRatio = modelContextWindow > 0
    ? Number((actualInputTokens / modelContextWindow).toFixed(4))
    : 0;
  const originalWindowRatio = modelContextWindow > 0
    ? Number((originalInputTokens / modelContextWindow).toFixed(4))
    : 0;
  let riskLevel = "normal";
  let recommendedAction = "continue";
  if (actualWindowRatio >= CODEX_HOST_CONTEXT_SOFT_LIMIT_RATIO) {
    riskLevel = "critical";
    recommendedAction = "switch_thread_now";
  } else if (actualWindowRatio >= CODEX_HOST_CONTEXT_HANDOFF_RATIO) {
    riskLevel = "high";
    recommendedAction = "switch_thread_soon";
  } else if (actualWindowRatio >= CODEX_HOST_CONTEXT_WARNING_RATIO) {
    riskLevel = "warning";
    recommendedAction = "keep_replies_terse";
  }

  return {
    actualInputTokens,
    originalInputTokens,
    savedTokens,
    cachedInputTokens: Math.max(0, normalizeNumber(tokenCount.cachedInputTokens, 0)),
    modelContextWindow,
    reportedModelContextWindow,
    modelContextWindowCapped: reportedModelContextWindow > modelContextWindow,
    softLimitRatio: CODEX_HOST_CONTEXT_SOFT_LIMIT_RATIO,
    softLimitTokenCount,
    actualWindowRatio,
    originalWindowRatio,
    actualSoftLimitExceeded: softLimitTokenCount > 0 && actualInputTokens > softLimitTokenCount,
    originalSoftLimitExceeded: softLimitTokenCount > 0 && originalInputTokens > softLimitTokenCount,
    reductionRatio,
    riskLevel,
    recommendedAction,
    timestamp: normalizeString(tokenCount.timestamp)
  };
}

function formatTokenCount(value) {
  const numeric = Math.max(0, Math.round(Number(value || 0)));
  if (numeric >= 100000) {
    return `${Math.round(numeric / 1000)}k`;
  }
  if (numeric >= 10000) {
    return `${(numeric / 1000).toFixed(1)}k`;
  }
  return String(numeric);
}

function formatPercent(value) {
  return `${(Math.max(0, Number(value || 0)) * 100).toFixed(1)}%`;
}

function renderRatioBar(ratio = 0, width = 16) {
  const safeWidth = Math.max(4, Math.trunc(Number(width || 16)));
  const filled = Math.min(safeWidth, Math.max(0, Math.round(Number(ratio || 0) * safeWidth)));
  return `[${"#".repeat(filled)}${"-".repeat(safeWidth - filled)}]`;
}

function formatShortTimestamp(value = "") {
  const normalized = normalizeString(value);
  if (!normalized) {
    return "unknown";
  }
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }
  const pad = (number) => String(number).padStart(2, "0");
  return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
}

export async function findLatestCodexVscodeSession({
  cwd = process.cwd(),
  sessionsRoot = path.join(os.homedir(), ".codex", "sessions"),
  sessionId = normalizeString(process.env.CODEX_THREAD_ID)
} = {}) {
  const normalizedCwd = path.resolve(cwd);
  const sessionFiles = await listJsonlFilesRecursively(sessionsRoot);
  const ordered = await Promise.all(
    sessionFiles.map(async (filePath) => ({
      filePath,
      mtimeMs: (await fs.stat(filePath)).mtimeMs
    }))
  );

  ordered.sort((left, right) => right.mtimeMs - left.mtimeMs);

  const normalizedSessionId = normalizeString(sessionId);

  for (const candidate of ordered) {
    let lines = [];
    try {
      lines = await readJsonlLines(candidate.filePath);
    } catch {
      continue;
    }
    const sessionMeta = lines.find((entry) => entry?.type === "session_meta");
    const payload = sessionMeta?.payload || {};
    const payloadCwd = normalizeString(payload.cwd);
    const originator = normalizeString(payload.originator);
    const source = payload.source;
    const sourceName = typeof source === "string"
      ? normalizeString(source)
      : normalizeString(source?.subagent ? "subagent" : "");

    if (originator !== "codex_vscode" && sourceName !== "vscode") {
      continue;
    }
    if (normalizedSessionId) {
      if (normalizeString(payload.id) !== normalizedSessionId) {
        continue;
      }
    } else if (path.resolve(payloadCwd || "/") !== normalizedCwd) {
      continue;
    }

    return {
      filePath: candidate.filePath,
      sessionId: normalizeString(payload.id),
      originator: originator || sourceName,
      cwd: payloadCwd,
      timestamp: normalizeString(payload.timestamp)
    };
  }

  return null;
}

export async function extractCodexVscodeRecentMessages({
  sessionPath,
  prompt = "",
  includeCommentary = false,
  maxMessages = CODEX_VSCODE_DEFAULT_MAX_MESSAGES
} = {}) {
  if (!normalizeString(sessionPath)) {
    throw new TypeError("sessionPath is required");
  }

  const entries = await readJsonlLines(sessionPath);
  const messages = [];

  for (const entry of entries) {
    if (entry?.type !== "event_msg") {
      continue;
    }
    const payload = entry.payload || {};
    const payloadType = normalizeString(payload.type);

    if (payloadType === "user_message") {
      const content = normalizeMessageText(payload.message);
      if (content) {
        messages.push({ role: "user", content });
      }
      continue;
    }

    if (payloadType === "agent_message") {
      const phase = normalizeString(payload.phase);
      if (phase === "commentary" && includeCommentary !== true) {
        continue;
      }
      if (phase && !["commentary", "final_answer"].includes(phase)) {
        continue;
      }
      const content = compressAssistantContextMessage({
        content: payload.message,
        phase
      });
      if (content) {
        messages.push({ role: "assistant", content });
      }
    }
  }

  const normalizedPrompt = normalizeMessageText(prompt);
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  if (normalizedPrompt && lastUserMessage?.content !== normalizedPrompt) {
    messages.push({ role: "user", content: normalizedPrompt });
  }

  const dedupedMessages = dedupeConsecutiveMessages(messages);
  const manualCaseFilteredMessages = filterMessagesForManualGcCase(dedupedMessages, normalizedPrompt || normalizeMessageText(lastUserMessage?.content));
  const limitedMessages = maxMessages > 0
    ? manualCaseFilteredMessages.slice(-maxMessages)
    : manualCaseFilteredMessages;
  const query = normalizedPrompt || normalizeMessageText(lastUserMessage?.content);

  return {
    query,
    messages: limitedMessages
  };
}

function buildDefaultOutputDir(cwd = process.cwd()) {
  return path.resolve(cwd, "reports/generated/codex-vscode-context-minor-gc");
}

function summarizeContextMinorGc(contextMinorGc = {}) {
  const event = contextMinorGc.event || {};
  const artifactPaths = contextMinorGc.artifactPaths || event.artifact_paths || {};
  const hostContext = contextMinorGc.hostContext || null;
  const hostHistory = Array.isArray(contextMinorGc.hostHistory) ? contextMinorGc.hostHistory : [];

  return {
    enabled: contextMinorGc.enabled === true,
    status: normalizeString(contextMinorGc.status),
    reason: normalizeString(contextMinorGc.reason),
    applied: contextMinorGc.applied === true,
    relation: normalizeString(contextMinorGc.relation),
    decisionTransport: normalizeString(contextMinorGc.decisionTransport),
    promptReductionRatio: Number(contextMinorGc.promptReductionRatio || 0),
    baselineContextEstimate: Number(contextMinorGc.baselineContextEstimate || 0),
    effectiveContextEstimate: Number(contextMinorGc.effectiveContextEstimate || 0),
    effectiveContextBlock: normalizeString(contextMinorGc.effectiveContextBlock),
    exportPath: normalizeString(artifactPaths.export),
    summaryPath: normalizeString(artifactPaths.summary),
    hostHistory: hostHistory.map((entry) => ({
      timestamp: normalizeString(entry.timestamp),
      inputTokens: Number(entry.inputTokens || 0),
      modelContextWindow: Number(entry.modelContextWindow || 0),
      actualWindowRatio: Number(entry.actualWindowRatio || 0),
      riskLevel: normalizeString(entry.riskLevel, "normal")
    })),
    hostContext: hostContext
      ? {
        actualInputTokens: Number(hostContext.actualInputTokens || 0),
        originalInputTokens: Number(hostContext.originalInputTokens || 0),
        savedTokens: Number(hostContext.savedTokens || 0),
        modelContextWindow: Number(hostContext.modelContextWindow || 0),
        reportedModelContextWindow: Number(hostContext.reportedModelContextWindow || 0),
        modelContextWindowCapped: hostContext.modelContextWindowCapped === true,
        softLimitRatio: Number(hostContext.softLimitRatio || 0),
        softLimitTokenCount: Number(hostContext.softLimitTokenCount || 0),
        actualWindowRatio: Number(hostContext.actualWindowRatio || 0),
        originalWindowRatio: Number(hostContext.originalWindowRatio || 0),
        actualSoftLimitExceeded: hostContext.actualSoftLimitExceeded === true,
        originalSoftLimitExceeded: hostContext.originalSoftLimitExceeded === true,
        reductionRatio: Number(hostContext.reductionRatio || 0),
        riskLevel: normalizeString(hostContext.riskLevel, "normal"),
        recommendedAction: normalizeString(hostContext.recommendedAction, "continue")
      }
      : null
  };
}

export async function buildCodexVscodeContextMinorGc({
  cwd = process.cwd(),
  prompt = "",
  includeCommentary = false,
  maxMessages = CODEX_VSCODE_DEFAULT_MAX_MESSAGES,
  sessionsRoot = path.join(os.homedir(), ".codex", "sessions"),
  sessionId = normalizeString(process.env.CODEX_THREAD_ID),
  logger,
  packageBuilder = buildCodexContextMinorGcPackage,
  contextMinorGc = {}
} = {}) {
  const resolvedSessionsRoot = normalizeString(
    sessionsRoot,
    path.join(os.homedir(), ".codex", "sessions")
  );
  const gcEnabled = contextMinorGc.enabled !== false;
  const session = await findLatestCodexVscodeSession({
    cwd,
    sessionsRoot: resolvedSessionsRoot,
    sessionId
  });
  if (!session) {
    return {
      status: "missing_session",
      query: normalizeMessageText(prompt),
      session: null,
      extractedMessageCount: 0,
      contextMinorGc: summarizeContextMinorGc({
        status: "disabled",
        reason: "missing_vscode_session"
      })
    };
  }

  const extracted = await extractCodexVscodeRecentMessages({
    sessionPath: session.filePath,
    prompt,
    includeCommentary,
    maxMessages
  });

  const resolvedConfig = resolveCodexContextMinorGcConfig({
    enabled: gcEnabled,
    transport: normalizeString(contextMinorGc.transport, "codex_exec"),
    model: normalizeString(contextMinorGc.model, "gpt-5.4"),
    reasoningEffort: normalizeString(contextMinorGc.reasoningEffort, "low"),
    timeoutMs: Math.max(1000, normalizeNumber(contextMinorGc.timeoutMs, 120000)),
    maxTurns: Math.max(1, normalizeNumber(contextMinorGc.maxTurns, 12)),
    minTurns: Math.max(1, normalizeNumber(contextMinorGc.minTurns, 3)),
    maxCharsPerTurn: Math.max(
      64,
      normalizeNumber(contextMinorGc.maxCharsPerTurn, 900)
    ),
    outputDir: normalizeString(contextMinorGc.outputDir, buildDefaultOutputDir(cwd)),
    cleanupSession: contextMinorGc.cleanupSession,
    guarded: {
      enabled: contextMinorGc.guarded?.enabled !== false,
      allowedRelations: Array.isArray(contextMinorGc.guarded?.allowedRelations)
        ? contextMinorGc.guarded.allowedRelations
        : ["switch", "resolve", "continue"],
      minReductionRatio: contextMinorGc.guarded?.minReductionRatio,
      minEvictedTurns: contextMinorGc.guarded?.minEvictedTurns,
      prependCarryForward: contextMinorGc.guarded?.prependCarryForward
    }
  });

  const contextMinorGcPackage = gcEnabled
    ? await packageBuilder({
      logger,
      config: resolvedConfig,
      sessionKey: `codex:vscode:${session.sessionId || "session"}`,
      query: extracted.query,
      messages: extracted.messages
    })
    : {
      enabled: false,
      status: "host_only",
      reason: "host_only_fast_path",
      applied: false,
      relation: "",
      decisionTransport: "",
      promptReductionRatio: 0,
      baselineContextEstimate: 0,
      effectiveContextEstimate: 0,
      effectiveContextBlock: "",
      artifactPaths: {}
    };
  const latestTokenCount = await extractLatestCodexVscodeTokenCount({
    sessionPath: session.filePath
  });
  const hostHistory = await extractRecentCodexVscodeTokenCounts({
    sessionPath: session.filePath,
    limit: normalizeNumber(contextMinorGc.historyLimit, 8),
    hostContextWindowCap: normalizeNumber(
      contextMinorGc.hostContextWindowCap,
      CODEX_HOST_CONTEXT_DEFAULT_WINDOW_CAP
    )
  });
  const hostContext = buildHostContextSummary({
    tokenCount: latestTokenCount,
    contextMinorGc: contextMinorGcPackage,
    hostContextWindowCap: normalizeNumber(
      contextMinorGc.hostContextWindowCap,
      CODEX_HOST_CONTEXT_DEFAULT_WINDOW_CAP
    )
  });
  const packagedWithHostContext = {
    ...contextMinorGcPackage,
    hostContext,
    hostHistory
  };

  return {
    status: "ok",
    query: extracted.query,
    session: {
      ...session
    },
    extractedMessageCount: extracted.messages.length,
    recentMessages: extracted.messages,
    contextMinorGc: summarizeContextMinorGc(packagedWithHostContext),
    rawContextMinorGc: packagedWithHostContext
  };
}

export function renderCodexVscodeContextMinorGcPrompt(result = {}) {
  const contextMinorGc = result.contextMinorGc || {};
  if (contextMinorGc.applied !== true) {
    return "";
  }
  return `${normalizeString(contextMinorGc.effectiveContextBlock)}\n`;
}

export function renderCodexVscodeContextMinorGcFooter(result = {}) {
  const contextMinorGc = result.contextMinorGc || {};
  const baseline = Number(contextMinorGc.baselineContextEstimate || 0);
  const hostContext = contextMinorGc.hostContext || null;

  if (!hostContext) {
    return "";
  }

  const actualText = formatTokenCount(hostContext.actualInputTokens);
  const originalText = formatTokenCount(hostContext.originalInputTokens);
  const windowText = formatTokenCount(hostContext.modelContextWindow);
  const savedRatioText = formatPercent(hostContext.reductionRatio);
  const windowRatioText = formatPercent(hostContext.actualWindowRatio);

  return `Context(估算): 最近一轮输入 ${actualText}，无GC估算 ${originalText}；窗口口径 ${windowText}，压缩比：${savedRatioText}（${actualText}/${originalText}），占窗口比例：${windowRatioText}（${actualText}/${windowText}）`;
}

export function renderCodexVscodeContextMinorGcSizeLine(result = {}) {
  const hostContext = result?.contextMinorGc?.hostContext || null;
  if (!hostContext) {
    return "Context Size: unavailable";
  }
  const actualText = formatTokenCount(hostContext.actualInputTokens);
  const windowText = formatTokenCount(hostContext.modelContextWindow);
  return `Context Size: ${actualText} / ${windowText} ${renderRatioBar(hostContext.actualWindowRatio)} ${formatPercent(hostContext.actualWindowRatio)} · risk=${normalizeString(hostContext.riskLevel, "normal")} · action=${normalizeString(hostContext.recommendedAction, "continue")}`;
}

export function renderCodexVscodeContextMinorGcHistory(result = {}) {
  const hostHistory = Array.isArray(result?.contextMinorGc?.hostHistory)
    ? result.contextMinorGc.hostHistory
    : [];
  if (hostHistory.length === 0) {
    return "Context History: unavailable\n";
  }
  const lines = ["# Context History"];
  for (const entry of hostHistory) {
    lines.push(
      `- ${formatShortTimestamp(entry.timestamp)} · ${formatTokenCount(entry.inputTokens)} / ${formatTokenCount(entry.modelContextWindow)} · ${formatPercent(entry.actualWindowRatio)} · ${normalizeString(entry.riskLevel, "normal")}`
    );
  }
  return `${lines.join("\n")}\n`;
}

export function renderCodexVscodeContextMinorGcPanel(result = {}) {
  const hostContext = result?.contextMinorGc?.hostContext || null;
  if (!hostContext) {
    return "# Context Size\n\nunavailable\n";
  }
  const lines = [
    "# Context Size",
    "",
    renderCodexVscodeContextMinorGcSizeLine(result),
    "",
    `- current: \`${formatTokenCount(hostContext.actualInputTokens)} / ${formatTokenCount(hostContext.modelContextWindow)}\``,
    `- noGcEstimate: \`${formatTokenCount(hostContext.originalInputTokens)}\``,
    `- windowRatio: \`${formatPercent(hostContext.actualWindowRatio)}\``,
    `- reductionRatio: \`${formatPercent(hostContext.reductionRatio)}\``,
    `- risk: \`${normalizeString(hostContext.riskLevel, "normal")}\``,
    `- action: \`${normalizeString(hostContext.recommendedAction, "continue")}\``
  ];
  const history = renderCodexVscodeContextMinorGcHistory(result).trim();
  if (history && history !== "Context History: unavailable") {
    lines.push("", history);
  }
  return `${lines.join("\n")}\n`;
}

export function renderCodexVscodeContextMinorGcMarkdown(result = {}, options = {}) {
  const contextMinorGc = result.contextMinorGc || {};
  const verbose = options?.verbose === true;
  const lines = [
    `- status: \`${normalizeString(result.status, "unknown")}\``,
    `- query: \`${normalizeString(result.query, "unknown")}\``,
    `- extractedMessageCount: \`${Number(result.extractedMessageCount || 0)}\``,
    `- sessionId: \`${normalizeString(result.session?.sessionId, "missing")}\``,
    `- gcStatus: \`${normalizeString(contextMinorGc.status, "unknown")}\``,
    `- applied: \`${contextMinorGc.applied === true}\``,
    `- reason: \`${normalizeString(contextMinorGc.reason, "n/a")}\``,
    `- relation: \`${normalizeString(contextMinorGc.relation, "n/a")}\``,
    `- decisionTransport: \`${normalizeString(contextMinorGc.decisionTransport, "n/a")}\``,
    `- promptReductionRatio: \`${Number(contextMinorGc.promptReductionRatio || 0)}\``
  ];

  if (verbose) {
    lines.splice(4, 0, `- sessionPath: \`${normalizeString(result.session?.filePath, "missing")}\``);
  }

  if (contextMinorGc.hostContext?.actualInputTokens > 0) {
    lines.push(`- hostActualInputTokens: \`${Number(contextMinorGc.hostContext.actualInputTokens || 0)}\``);
    lines.push(`- hostOriginalInputTokens: \`${Number(contextMinorGc.hostContext.originalInputTokens || 0)}\``);
    lines.push(`- hostContextWindow: \`${Number(contextMinorGc.hostContext.modelContextWindow || 0)}\``);
    lines.push(`- hostActualWindowRatio: \`${Number(contextMinorGc.hostContext.actualWindowRatio || 0)}\``);
    lines.push(`- hostRiskLevel: \`${normalizeString(contextMinorGc.hostContext.riskLevel, "normal")}\``);
    lines.push(`- hostRecommendedAction: \`${normalizeString(contextMinorGc.hostContext.recommendedAction, "continue")}\``);
    if (verbose) {
      lines.push(`- hostMetricSemantics: \`last_token_usage.input_tokens (recent request), not VS Code status-bar occupancy\``);
      lines.push(`- hostReportedContextWindow: \`${Number(contextMinorGc.hostContext.reportedModelContextWindow || 0)}\``);
      lines.push(`- hostContextWindowCapped: \`${contextMinorGc.hostContext.modelContextWindowCapped === true}\``);
      lines.push(`- hostOriginalWindowRatio: \`${Number(contextMinorGc.hostContext.originalWindowRatio || 0)}\``);
      lines.push(`- hostSoftLimitTokenCount: \`${Number(contextMinorGc.hostContext.softLimitTokenCount || 0)}\``);
      lines.push(`- hostSoftLimitExceeded: \`${contextMinorGc.hostContext.actualSoftLimitExceeded === true}\``);
    }
  }

  if (verbose && contextMinorGc.summaryPath) {
    lines.push(`- telemetry: \`${contextMinorGc.summaryPath}\``);
  }
  if (verbose && contextMinorGc.exportPath) {
    lines.push(`- export: \`${contextMinorGc.exportPath}\``);
  }
  const footer = renderCodexVscodeContextMinorGcFooter(result);
  if (footer) {
    lines.push(`- footer: \`${footer}\``);
  }
  if (verbose && contextMinorGc.applied === true && contextMinorGc.effectiveContextBlock) {
    lines.push("");
    lines.push(contextMinorGc.effectiveContextBlock);
  }

  return `${lines.join("\n")}\n`;
}
