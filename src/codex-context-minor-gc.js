import path from "node:path";

import {
  captureDialogueWorkingSetShadow,
  projectRuntimeMessagesToDialogueProjection
} from "./dialogue-working-set-runtime-shadow.js";
import { mergeSystemPromptAdditions } from "./dialogue-working-set-guarded.js";
import {
  buildSemanticPinNotes,
  renderDialogueTurns
} from "./dialogue-working-set-shadow.js";
import { estimateTokenCountFromText, messageContentToText, normalizeWhitespace } from "./utils.js";

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

function normalizeStringArray(values = [], fallback = []) {
  if (!Array.isArray(values)) {
    return [...fallback];
  }
  const normalized = values
    .map((value) => normalizeString(value))
    .filter(Boolean);
  return normalized.length > 0 ? [...new Set(normalized)] : [...fallback];
}

function buildDefaultOutputDir(outputDir = "") {
  return normalizeString(
    outputDir,
    path.resolve(process.cwd(), "reports/generated/codex-context-minor-gc")
  );
}

function normalizeConversationMessages(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .flatMap((message) => {
      const role = normalizeString(message?.role);
      if (!["user", "assistant"].includes(role)) {
        return [];
      }
      const content = normalizeWhitespace(messageContentToText(message?.content));
      if (!content) {
        return [];
      }
      return [{ role, content }];
    });
}

export function buildCodexConversationContextBlock(turns = [], heading = "## Recent Conversation Context") {
  const transcript = renderDialogueTurns(turns);
  if (!transcript) {
    return "";
  }
  return `${heading}\n${transcript}`;
}

function buildOptimizedContextBlock(snapshot = {}) {
  const optimizedText = normalizeWhitespace(snapshot?.shadowPackageText || "");
  if (!optimizedText) {
    return "";
  }
  return `## Context Minor GC Working Set\n${optimizedText}`;
}

function buildCodexPackagedContextBlock(snapshot = {}) {
  const applied = snapshot?.applied || {};
  const keepTurns = Array.isArray(applied?.keepTurns) ? applied.keepTurns : [];
  const keepTurnsText = renderDialogueTurns(keepTurns);
  const semanticPinNotes = Array.isArray(snapshot?.semanticPinNotes)
    ? snapshot.semanticPinNotes
    : buildSemanticPinNotes({
      turns: keepTurns,
      pinTurnIds: Array.isArray(applied?.pinnedOnlyTurnIds) ? applied.pinnedOnlyTurnIds : []
    });
  const sections = [];

  if (keepTurnsText) {
    sections.push(`Active raw turns:\n${keepTurnsText}`);
  }
  if (semanticPinNotes.length > 0) {
    sections.push([
      "Semantic pins:",
      ...semanticPinNotes.map((item) => `- ${normalizeWhitespace(item)}`)
    ].join("\n"));
  }
  if (sections.length === 0) {
    return "";
  }
  return `## Context Minor GC Working Set\n${sections.join("\n\n")}`;
}

function shouldApplyCodexPackagedGuard({
  snapshot = {},
  packagedEstimate = 0,
  baselineEstimate = 0,
  guardedConfig = {}
} = {}) {
  if (guardedConfig?.enabled !== true) {
    return { allowed: false, reason: "feature_disabled" };
  }

  const applied = snapshot?.applied || {};
  const relation = normalizeString(applied?.relation, "continue");
  const allowedRelations = normalizeStringArray(guardedConfig?.allowedRelations, ["switch", "resolve"]);
  const evictedTurnIds = normalizeStringArray(applied?.appliedEvictTurnIds);
  const minEvictedTurns = Math.max(1, Math.trunc(normalizeNumber(guardedConfig?.minEvictedTurns, 1)));
  const reductionRatio = Math.max(0, normalizeNumber(applied?.reductionRatio, 0));
  const minReductionRatio = Math.max(0, normalizeNumber(guardedConfig?.minReductionRatio, 0.18));

  if (!allowedRelations.includes(relation)) {
    return { allowed: false, reason: "relation_not_allowed" };
  }
  if (evictedTurnIds.length < minEvictedTurns) {
    return { allowed: false, reason: "not_enough_evictions" };
  }
  if (reductionRatio < minReductionRatio) {
    return { allowed: false, reason: "reduction_below_min" };
  }
  if (baselineEstimate > 0 && packagedEstimate >= baselineEstimate) {
    return { allowed: false, reason: "no_net_token_gain" };
  }

  return {
    allowed: true,
    reason: "codex_packaged_guard",
    relation,
    reductionRatio
  };
}

export function resolveCodexContextMinorGcConfig(raw = {}) {
  const enabled = normalizeBoolean(raw.enabled, false);
  const shadow = raw.shadow && typeof raw.shadow === "object" && !Array.isArray(raw.shadow)
    ? raw.shadow
    : {};
  const guarded = raw.guarded && typeof raw.guarded === "object" && !Array.isArray(raw.guarded)
    ? raw.guarded
    : {};

  return {
    enabled,
    sessionKeyPrefix: normalizeString(raw.sessionKeyPrefix, "codex"),
    shadow: {
      enabled,
      model: normalizeString(shadow.model, normalizeString(raw.model, "gpt-5.4")),
      provider: normalizeString(shadow.provider, normalizeString(raw.provider)),
      transport: normalizeString(shadow.transport, normalizeString(raw.transport, "codex_exec")),
      reasoningEffort: normalizeString(
        shadow.reasoningEffort,
        normalizeString(raw.reasoningEffort, "low")
      ),
      timeoutMs: Math.max(1000, normalizeNumber(shadow.timeoutMs ?? raw.timeoutMs, 120000)),
      maxTurns: Math.max(1, normalizeNumber(shadow.maxTurns ?? raw.maxTurns, 12)),
      minTurns: Math.max(1, normalizeNumber(shadow.minTurns ?? raw.minTurns, 3)),
      maxCharsPerTurn: Math.max(
        64,
        normalizeNumber(shadow.maxCharsPerTurn ?? raw.maxCharsPerTurn, 900)
      ),
      outputDir: buildDefaultOutputDir(shadow.outputDir || raw.outputDir),
      cleanupSession: normalizeBoolean(shadow.cleanupSession ?? raw.cleanupSession, true)
    },
    guarded: {
      enabled: normalizeBoolean(guarded.enabled ?? raw.guardedEnabled, false),
      allowedRelations: normalizeStringArray(
        guarded.allowedRelations ?? raw.allowedRelations,
        ["switch", "resolve"]
      ),
      minReductionRatio: Math.max(
        0,
        normalizeNumber(guarded.minReductionRatio ?? raw.minReductionRatio, 0.18)
      ),
      minEvictedTurns: Math.max(
        1,
        Math.trunc(normalizeNumber(guarded.minEvictedTurns ?? raw.minEvictedTurns, 1))
      ),
      prependCarryForward: normalizeBoolean(
        guarded.prependCarryForward ?? raw.prependCarryForward,
        true
      )
    }
  };
}

export async function buildCodexContextMinorGcPackage({
  logger,
  config = {},
  sessionKey,
  query,
  messages,
  decisionRunner = null
} = {}) {
  const resolvedConfig = resolveCodexContextMinorGcConfig(config);
  const normalizedMessages = normalizeConversationMessages(messages);
  const projection = projectRuntimeMessagesToDialogueProjection(
    normalizedMessages,
    resolvedConfig.shadow
  );
  const baselineContextBlock = buildCodexConversationContextBlock(projection.turns);
  const baselineContextEstimate = estimateTokenCountFromText(baselineContextBlock);

  const baseResult = {
    enabled: resolvedConfig.enabled,
    status: resolvedConfig.enabled ? "skipped" : "disabled",
    reason: resolvedConfig.enabled ? "missing_messages" : "feature_disabled",
    sessionKey: normalizeString(sessionKey, "codex:minor-gc"),
    query: normalizeString(query),
    projectedTurns: projection.turns,
    projectedMessages: normalizedMessages,
    baselineContextBlock,
    optimizedContextBlock: baselineContextBlock,
    effectiveContextBlock: baselineContextBlock,
    baselineContextEstimate,
    optimizedContextEstimate: baselineContextEstimate,
    effectiveContextEstimate: baselineContextEstimate,
    promptReductionRatio: 0,
    applied: false,
    decisionTransport: "",
    relation: "",
    event: null
  };

  if (projection.turns.length === 0) {
    return baseResult;
  }

  if (!resolvedConfig.enabled) {
    return {
      ...baseResult,
      status: "baseline_only",
      reason: "feature_disabled"
    };
  }

  const event = await captureDialogueWorkingSetShadow({
    runtime: null,
    logger,
    config: resolvedConfig.shadow,
    guardedConfig: resolvedConfig.guarded,
    sessionKey: baseResult.sessionKey,
    query: baseResult.query,
    messages: normalizedMessages,
    decisionRunner
  });

  const optimizedContextBlock = buildOptimizedContextBlock(event?.snapshot || {});
  const optimizedContextEstimate = estimateTokenCountFromText(optimizedContextBlock);
  const packagedContextBlock = buildCodexPackagedContextBlock(event?.snapshot || {});
  const packagedContextEstimate = estimateTokenCountFromText(packagedContextBlock);
  const codexGuard = shouldApplyCodexPackagedGuard({
    snapshot: event?.snapshot || {},
    packagedEstimate: packagedContextEstimate,
    baselineEstimate: baselineContextEstimate,
    guardedConfig: resolvedConfig.guarded
  });
  const applied = codexGuard.allowed === true && Boolean(packagedContextBlock);
  const effectiveContextBlock = applied ? packagedContextBlock : baselineContextBlock;
  const effectiveContextEstimate = estimateTokenCountFromText(effectiveContextBlock);
  const promptReductionRatio = baselineContextEstimate > 0
    ? Number(((baselineContextEstimate - effectiveContextEstimate) / baselineContextEstimate).toFixed(4))
    : 0;

  return {
    ...baseResult,
    status: normalizeString(event?.status, "error"),
    reason: normalizeString(event?.reason),
    optimizedContextBlock: optimizedContextBlock || baselineContextBlock,
    effectiveContextBlock,
    optimizedContextEstimate: optimizedContextEstimate || baselineContextEstimate,
    effectiveContextEstimate,
    promptReductionRatio,
    applied,
    codexGuardReason: codexGuard.reason,
    packagedContextBlock: packagedContextBlock || optimizedContextBlock || baselineContextBlock,
    packagedContextEstimate: packagedContextEstimate || optimizedContextEstimate || baselineContextEstimate,
    decisionTransport: normalizeString(event?.decision_transport),
    relation: normalizeString(event?.decision?.relation || event?.scorecard?.relation),
    event
  };
}

export function mergeCodexPromptBlocks(...parts) {
  return mergeSystemPromptAdditions(...parts);
}
