import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildWorkingSetDecisionPrompt,
  buildWorkingSetDecisionSchema,
  normalizeWorkingSetDecisionPayload,
  parseWorkingSetDecisionResponse
} from "./dialogue-working-set-llm.js";
import { applyGuardedWorkingSetToMessages } from "./dialogue-working-set-guarded.js";
import { buildContextOptimizationScorecard } from "./dialogue-working-set-scorecard.js";
import { buildShadowContextSnapshot } from "./dialogue-working-set-shadow.js";
import { runStructuredDecision } from "./structured-decision-runner.js";
import { messageContentToText, normalizeWhitespace, parseAgentId } from "./utils.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_DIALOGUE_WORKING_SET_SHADOW_OUTPUT_DIR = path.join(
  repoRoot,
  "reports/generated/dialogue-working-set-runtime-shadow"
);

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function truncateText(value, maxChars) {
  const text = normalizeWhitespace(value);
  if (!text) {
    return "";
  }
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function normalizeSessionKey(value) {
  return normalizeString(value, "agent:main:dialogue-working-set-shadow");
}

function resolveShadowErrorReason(error) {
  if (normalizeString(error?.reasonCode) === "decision_timeout") {
    return "decision_timeout";
  }
  if (error?.code === "ETIMEDOUT") {
    return "decision_timeout";
  }
  return normalizeString(String(error), "shadow_capture_failed");
}

function sanitizePathSegment(value, fallback = "session") {
  const normalized = normalizeString(value, fallback)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

function createEventId() {
  return `shadow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hasSubagentRuntime(runtime) {
  return Boolean(
    runtime?.subagent?.run
    && runtime?.subagent?.waitForRun
    && runtime?.subagent?.getSessionMessages
  );
}

function requiresRuntimeSubagent(config = {}) {
  return normalizeString(config.transport, "auto") === "runtime_subagent";
}

export function resolveDialogueWorkingSetShadowOutputDir(outputDir = "") {
  return normalizeString(outputDir) || DEFAULT_DIALOGUE_WORKING_SET_SHADOW_OUTPUT_DIR;
}

export function isLikelyExplicitContinueQuery(query = "") {
  const text = normalizeWhitespace(query).toLowerCase();
  if (!text) {
    return false;
  }
  const hasContinueMarker = [
    /^继续/u,
    /^继续同一个/u,
    /^还是同一个/u,
    /^还是同一个方案/u,
    /^还是同一个话题/u,
    /^还是 release/u,
    /^还是旅行/u,
    /^再补/u,
    /^再补充/u,
    /^再补一层/u,
    /^再补一条/u,
    /^最后再压一层/u,
    /^continue\b/i,
    /^still on\b/i,
    /^same topic\b/i,
    /^another detail\b/i,
    /^add one more\b/i
  ].some((pattern) => pattern.test(text));
  const hasBoundaryMarker = [
    /切到/u,
    /换个.*话题/u,
    /换到/u,
    /先不聊/u,
    /回到/u,
    /先离开/u,
    /完全不同的话题/u,
    /\bback to\b/i,
    /\breturn to\b/i,
    /\bswitch\b/i,
    /\bdifferent topic\b/i,
    /\bleave\b.*\btopic\b/i
  ].some((pattern) => pattern.test(text));
  return hasContinueMarker && !hasBoundaryMarker;
}

export function isLikelyExplicitSwitchQuery(query = "") {
  const text = normalizeWhitespace(query).toLowerCase();
  if (!text) {
    return false;
  }
  return [
    /现在切到.*不同话题/u,
    /现在切到.*新话题/u,
    /换个.*话题/u,
    /完全不同的话题/u,
    /先不聊.*了/u,
    /先离开.*回到/u,
    /\blet's switch\b/i,
    /\bswitch to\b/i,
    /\bleave the .* topic\b/i,
    /\bback to the editor\b/i,
    /\bback to the .* fact\b/i
  ].some((pattern) => pattern.test(text));
}

function compactSemanticTurnContent(value, maxChars = 120) {
  return truncateText(value, maxChars);
}

function findLatestUserTurn(turns = []) {
  return [...(Array.isArray(turns) ? turns : [])].reverse().find((turn) => turn.role === "user") || null;
}

function findLatestExplicitSwitchUserTurn(turns = []) {
  const normalizedTurns = Array.isArray(turns) ? turns : [];
  const latestUserTurn = findLatestUserTurn(normalizedTurns);
  return [...normalizedTurns]
    .reverse()
    .find((turn) =>
      turn.role === "user"
      && turn.id !== latestUserTurn?.id
      && isLikelyExplicitSwitchQuery(turn.content)
    ) || null;
}

function buildAnchorPinTurnIds(turns = [], latestUserTurnId = "") {
  const normalizedTurns = Array.isArray(turns) ? turns : [];
  const priorUserTurns = normalizedTurns.filter(
    (turn) => turn.role === "user" && turn.id !== latestUserTurnId
  );
  const anchorCandidates = [];
  const seen = new Set();
  const maybeAdd = (turn) => {
    if (!turn?.id || seen.has(turn.id)) {
      return;
    }
    seen.add(turn.id);
    anchorCandidates.push(turn.id);
  };

  const currentStateTurn = [...priorUserTurns].reverse().find((turn) =>
    /(更新|现在|当前|目前|default|current)/i.test(turn.content)
  );
  maybeAdd(currentStateTurn);

  const durableAnchorTurn = priorUserTurns.find((turn) =>
    /(记住|记一下|默认|以后|固定|代号|喜欢|偏好|规则|语言|编辑器|时区)/i.test(turn.content)
  );
  maybeAdd(durableAnchorTurn);

  const latestDurableTurn = [...priorUserTurns].reverse().find((turn) =>
    /(默认|规则|代号|喜欢|偏好|编辑器|语言)/i.test(turn.content)
  );
  maybeAdd(latestDurableTurn);

  return anchorCandidates.slice(0, 3);
}

function buildHeuristicSwitchDecision(turns = [], query = "") {
  const normalizedTurns = Array.isArray(turns) ? turns : [];
  const latestUserTurnId = findLatestUserTurn(normalizedTurns)?.id || "";
  const priorUserTurns = normalizedTurns.filter((turn) => turn.role === "user" && turn.id !== latestUserTurnId);
  const anchorCandidates = buildAnchorPinTurnIds(normalizedTurns, latestUserTurnId);

  const archiveSummary = priorUserTurns
    .slice(Math.max(0, priorUserTurns.length - 3))
    .map((turn) => compactSemanticTurnContent(turn.content, 100))
    .filter(Boolean)
    .join(" / ");

  return {
    relation: "switch",
    confidence: 0.9,
    evict_turn_ids: normalizedTurns
      .filter((turn) => turn.id !== latestUserTurnId)
      .map((turn) => turn.id),
    pin_turn_ids: anchorCandidates.slice(0, 3),
    archive_summary: archiveSummary,
    reasoning_summary: `Explicit topic-switch marker detected in latest user turn: ${compactSemanticTurnContent(query, 120)}`
  };
}

function buildHeuristicContinueAfterSwitchDecision(turns = [], query = "") {
  const normalizedTurns = Array.isArray(turns) ? turns : [];
  const latestUserTurnId = findLatestUserTurn(normalizedTurns)?.id || "";
  const switchTurn = findLatestExplicitSwitchUserTurn(normalizedTurns);
  if (!switchTurn) {
    return null;
  }
  const switchIndex = normalizedTurns.findIndex((turn) => turn.id === switchTurn.id);
  if (switchIndex < 0) {
    return null;
  }

  const preSwitchTurns = normalizedTurns.slice(0, switchIndex);
  const archiveSummary = preSwitchTurns
    .filter((turn) => turn.role === "user")
    .slice(Math.max(0, preSwitchTurns.filter((turn) => turn.role === "user").length - 3))
    .map((turn) => compactSemanticTurnContent(turn.content, 100))
    .filter(Boolean)
    .join(" / ");

  return {
    relation: "continue",
    confidence: 0.86,
    evict_turn_ids: normalizedTurns
      .filter((turn, index) => index < switchIndex)
      .map((turn) => turn.id),
    pin_turn_ids: buildAnchorPinTurnIds(preSwitchTurns, latestUserTurnId),
    archive_summary: archiveSummary,
    reasoning_summary: `Continue marker follows a recent explicit switch, so keep only the new-topic raw block and archive older context: ${compactSemanticTurnContent(query, 120)}`
  };
}

export function projectRuntimeMessagesToDialogueTurns(messages = [], options = {}) {
  return projectRuntimeMessagesToDialogueProjection(messages, options).turns;
}

export function projectRuntimeMessagesToDialogueProjection(messages = [], options = {}) {
  const maxTurns = Number(options.maxTurns || 12);
  const maxCharsPerTurn = Number(options.maxCharsPerTurn || 900);
  const maxDialogueMessages = maxTurns > 0 ? maxTurns * 2 : 0;
  const dialogueMessages = (Array.isArray(messages) ? messages : [])
    .flatMap((message, sourceIndex) => {
      const role = normalizeString(message?.role);
      if (!["user", "assistant"].includes(role)) {
        return [];
      }
      const content = truncateText(messageContentToText(message?.content), maxCharsPerTurn);
      if (!content) {
        return [];
      }
      return [{ role, content, sourceIndex }];
    });

  const sliced = maxDialogueMessages > 0 ? dialogueMessages.slice(-maxDialogueMessages) : dialogueMessages;
  const turns = sliced.map((turn, index) => ({
    id: `t${index + 1}`,
    role: turn.role,
    content: turn.content
  }));
  const projection = sliced.map((turn, index) => ({
    id: `t${index + 1}`,
    role: turn.role,
    content: turn.content,
    sourceIndex: turn.sourceIndex
  }));
  return {
    turns,
    projection
  };
}

export function evaluateDialogueWorkingSetShadowSampling({
  runtime,
  config,
  guardedConfig,
  query,
  messages
}) {
  if (!config?.enabled) {
    return { eligible: false, reason: "feature_disabled" };
  }
  if (!normalizeString(query)) {
    return { eligible: false, reason: "missing_query" };
  }
  const projected = projectRuntimeMessagesToDialogueProjection(messages, config);
  const turns = projected.turns;
  if (
    guardedConfig?.enabled === true
    && isLikelyExplicitContinueQuery(query)
    && !findLatestExplicitSwitchUserTurn(turns)
  ) {
    return { eligible: false, reason: "explicit_continue_marker", turns, projection: projected.projection };
  }
  if (turns.length < Number(config.minTurns || 3)) {
    return { eligible: false, reason: "not_enough_turns", turns, projection: projected.projection };
  }
  if (!turns.some((turn) => turn.role === "user")) {
    return { eligible: false, reason: "missing_user_turn", turns, projection: projected.projection };
  }
  if (requiresRuntimeSubagent(config) && !hasSubagentRuntime(runtime)) {
    return { eligible: false, reason: "subagent_unavailable", turns, projection: projected.projection };
  }
  return { eligible: true, turns, projection: projected.projection };
}

async function runWorkingSetShadowDecision({
  runtime,
  sessionKey,
  query,
  turns,
  config,
  logger,
  decisionRunner
}) {
  return runStructuredDecision({
    runtime,
    logger,
    sessionKey: normalizeSessionKey(sessionKey),
    prompt: buildWorkingSetDecisionPrompt({
      id: normalizeSessionKey(sessionKey),
      description: query,
      transcript: turns
    }),
    schema: buildWorkingSetDecisionSchema(),
    config,
    parser: parseWorkingSetDecisionResponse,
    normalizePayload: normalizeWorkingSetDecisionPayload,
    purpose: "dialogue-working-set-shadow",
    query,
    input: {
      turns
    },
    overrideRunner: decisionRunner
  });
}

function buildShadowSummaryEvent(event, exportRelativePath = "") {
  const snapshot = event.snapshot || {};
  const applied = snapshot.applied || {};
  const scorecard = event.scorecard || {};

  return {
    schema_version: event.schema_version,
    event_id: event.event_id,
    generated_at: event.generated_at,
    session_key: event.session_key,
    agent_id: event.agent_id,
    query: event.query,
    status: event.status,
    reason: event.reason || "",
    decision_transport: String(event.decision_transport || ""),
    relation: event.decision?.relation || applied.relation || "",
    pin_turn_ids: applied.pinTurnIds || [],
    evict_turn_ids: applied.appliedEvictTurnIds || [],
    reduction_ratio: Number(applied.reductionRatio || 0),
    package_reduction_ratio: Number(scorecard.packageReductionRatio || 0),
    baseline_prompt_estimate: Number(snapshot.baselinePromptEstimate || 0),
    shadow_raw_prompt_estimate: Number(snapshot.shadowRawPromptEstimate || 0),
    shadow_package_estimate: Number(snapshot.shadowPackageEstimate || 0),
    candidate_load_elapsed_ms: Number(scorecard.candidateLoadElapsedMs || 0),
    assembly_build_elapsed_ms: Number(scorecard.assemblyBuildElapsedMs || 0),
    guarded_applied: event.guarded?.applied === true,
    guarded_reason: String(event.guarded?.reason || ""),
    elapsed_ms: Number(event.timings?.totalElapsedMs || 0),
    export_path: exportRelativePath
  };
}

async function writeShadowArtifacts(outputDir, event) {
  const resolvedOutputDir = resolveDialogueWorkingSetShadowOutputDir(outputDir);
  const exportsDir = path.join(resolvedOutputDir, "exports");
  await fs.mkdir(exportsDir, { recursive: true });

  const sessionSlug = sanitizePathSegment(event.session_key, "session");
  const exportFileName = `${sessionSlug}-${event.event_id}.json`;
  const exportPath = path.join(exportsDir, exportFileName);
  const exportRelativePath = path.relative(resolvedOutputDir, exportPath);
  const summaryPath = path.join(resolvedOutputDir, "telemetry.jsonl");

  await fs.writeFile(exportPath, `${JSON.stringify(event, null, 2)}\n`, "utf8");
  await fs.appendFile(
    summaryPath,
    `${JSON.stringify(buildShadowSummaryEvent(event, exportRelativePath))}\n`,
    "utf8"
  );

  return {
    ...event,
    artifact_paths: {
      export: exportPath,
      summary: summaryPath
    }
  };
}

export async function captureDialogueWorkingSetShadow({
  runtime,
  logger,
  config,
  guardedConfig = {},
  sessionKey,
  query,
  messages,
  assemblyMetrics = {},
  decisionRunner = null
}) {
  const startedAt = Date.now();
  const normalizedSessionKey = normalizeSessionKey(sessionKey);
  const agentId = parseAgentId(normalizedSessionKey);
  const sampling = evaluateDialogueWorkingSetShadowSampling({
    runtime,
    config,
    guardedConfig,
    query,
    messages
  });

  const baseEvent = {
    schema_version: "umc.dialogue-working-set-shadow.v1",
    event_id: createEventId(),
    generated_at: new Date().toISOString(),
    session_key: normalizedSessionKey,
    agent_id: agentId,
    query: normalizeString(query),
    status: sampling.eligible ? "captured" : "skipped",
    reason: sampling.eligible ? "" : sampling.reason,
    sampling: {
      max_turns: Number(config.maxTurns || 12),
      min_turns: Number(config.minTurns || 3),
      max_chars_per_turn: Number(config.maxCharsPerTurn || 900)
    },
    transcript: sampling.turns || projectRuntimeMessagesToDialogueTurns(messages, config),
    decision: null,
    decision_transport: "",
    snapshot: null,
    scorecard: null,
    guarded: {
      enabled: guardedConfig?.enabled === true,
      applied: false,
      reason: guardedConfig?.enabled === true ? "not_evaluated" : "feature_disabled",
      filteredMessageCount: Array.isArray(messages) ? messages.length : 0,
      filteredMessageTokenEstimate: 0,
      carryForwardEstimate: 0,
      evictedSourceIndices: []
    },
    timings: {
      totalElapsedMs: 0,
      decisionElapsedMs: 0
    }
  };

  if (!sampling.eligible) {
    baseEvent.timings.totalElapsedMs = Date.now() - startedAt;
    baseEvent.scorecard = buildContextOptimizationScorecard({
      projectionTurns: baseEvent.transcript,
      snapshot: baseEvent.snapshot,
      assemblyMetrics: {
        ...assemblyMetrics,
        totalElapsedMs: baseEvent.timings.totalElapsedMs,
        decisionElapsedMs: 0
      },
      guarded: baseEvent.guarded
    });
    return writeShadowArtifacts(config.outputDir, baseEvent);
  }

  try {
    let decision = null;
    if (isLikelyExplicitSwitchQuery(query)) {
      decision = {
        payload: buildHeuristicSwitchDecision(sampling.turns, query),
        elapsedMs: 0,
        transport: "heuristic_switch"
      };
    } else if (guardedConfig?.enabled === true && isLikelyExplicitContinueQuery(query)) {
      const heuristicContinueDecision = buildHeuristicContinueAfterSwitchDecision(sampling.turns, query);
      if (heuristicContinueDecision) {
        decision = {
          payload: heuristicContinueDecision,
          elapsedMs: 0,
          transport: "heuristic_continue_after_switch"
        };
      }
    }
    if (!decision) {
      decision = await runWorkingSetShadowDecision({
        runtime,
        sessionKey: normalizedSessionKey,
        query,
        turns: sampling.turns,
        config,
        logger,
        decisionRunner
      });
    }
    const snapshot = buildShadowContextSnapshot({
      turns: sampling.turns,
      decision: decision.payload
    });
    const guarded = applyGuardedWorkingSetToMessages({
      messages,
      projection: sampling.projection,
      snapshot,
      config: guardedConfig
    });

    return writeShadowArtifacts(config.outputDir, {
      ...baseEvent,
      decision: decision.payload,
      decision_transport: decision.transport || "",
      snapshot,
      scorecard: buildContextOptimizationScorecard({
        projectionTurns: sampling.turns,
        snapshot,
        assemblyMetrics: {
          ...assemblyMetrics,
          totalElapsedMs: Date.now() - startedAt,
          decisionElapsedMs: decision.elapsedMs
        },
        guarded
      }),
      guarded,
      timings: {
        totalElapsedMs: Date.now() - startedAt,
        decisionElapsedMs: decision.elapsedMs
      }
    });
  } catch (error) {
    logger?.warn?.(
      `[unified-memory-core] dialogue working-set shadow failed for ${normalizedSessionKey}: ${String(error)}`
    );

    return writeShadowArtifacts(config.outputDir, {
      ...baseEvent,
      status: "error",
      reason: resolveShadowErrorReason(error),
      scorecard: buildContextOptimizationScorecard({
        projectionTurns: baseEvent.transcript,
        snapshot: baseEvent.snapshot,
        assemblyMetrics: {
          ...assemblyMetrics,
          totalElapsedMs: Date.now() - startedAt,
          decisionElapsedMs: 0
        },
        guarded: baseEvent.guarded
      }),
      timings: {
        totalElapsedMs: Date.now() - startedAt,
        decisionElapsedMs: 0
      }
    });
  }
}
