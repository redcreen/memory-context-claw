import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildWorkingSetDecisionPrompt,
  parseWorkingSetDecisionResponse
} from "./dialogue-working-set-llm.js";
import { applyGuardedWorkingSetToMessages } from "./dialogue-working-set-guarded.js";
import { buildContextOptimizationScorecard } from "./dialogue-working-set-scorecard.js";
import { buildShadowContextSnapshot } from "./dialogue-working-set-shadow.js";
import {
  messageContentToText,
  normalizeWhitespace,
  parseAgentId,
  sanitizeForSystemPrompt
} from "./utils.js";

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

export function resolveDialogueWorkingSetShadowOutputDir(outputDir = "") {
  return normalizeString(outputDir) || DEFAULT_DIALOGUE_WORKING_SET_SHADOW_OUTPUT_DIR;
}

export function projectRuntimeMessagesToDialogueTurns(messages = [], options = {}) {
  return projectRuntimeMessagesToDialogueProjection(messages, options).turns;
}

export function projectRuntimeMessagesToDialogueProjection(messages = [], options = {}) {
  const maxTurns = Number(options.maxTurns || 12);
  const maxCharsPerTurn = Number(options.maxCharsPerTurn || 900);
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

  const sliced = maxTurns > 0 ? dialogueMessages.slice(-maxTurns) : dialogueMessages;
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
  if (turns.length < Number(config.minTurns || 3)) {
    return { eligible: false, reason: "not_enough_turns", turns, projection: projected.projection };
  }
  if (!turns.some((turn) => turn.role === "user")) {
    return { eligible: false, reason: "missing_user_turn", turns, projection: projected.projection };
  }
  if (!hasSubagentRuntime(runtime)) {
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
  logger
}) {
  const shadowSessionKey = `${normalizeSessionKey(sessionKey)}:dialogue-working-set-shadow:${Date.now()}`;
  const startedAt = Date.now();

  const runResult = await runtime.subagent.run({
    sessionKey: shadowSessionKey,
    message: buildWorkingSetDecisionPrompt({
      id: normalizeSessionKey(sessionKey),
      description: query,
      transcript: turns
    }),
    provider: config.provider || undefined,
    model: config.model || undefined,
    extraSystemPrompt:
      "Return only JSON. Do not include markdown fences, prose, or explanation outside the JSON payload.",
    lane: "subagent",
    deliver: false,
    idempotencyKey: `dialogue-working-set-shadow-${Date.now()}`
  });

  const waitResult = await runtime.subagent.waitForRun({
    runId: runResult.runId,
    timeoutMs: config.timeoutMs
  });

  if (waitResult.status !== "ok") {
    throw new Error(waitResult.error || `shadow run failed: ${waitResult.status}`);
  }

  const session = await runtime.subagent.getSessionMessages({
    sessionKey: shadowSessionKey,
    limit: 20
  });
  const assistantMessages = Array.isArray(session?.messages) ? session.messages : [];
  const finalAssistant = [...assistantMessages]
    .reverse()
    .find((message) => message && message.role === "assistant");
  const assistantText = sanitizeForSystemPrompt(messageContentToText(finalAssistant?.content));
  const payload = parseWorkingSetDecisionResponse(assistantText);

  if (config.cleanupSession !== false && typeof runtime.subagent.deleteSession === "function") {
    try {
      await runtime.subagent.deleteSession({
        sessionKey: shadowSessionKey,
        deleteTranscript: true
      });
    } catch (error) {
      logger?.warn?.(
        `[unified-memory-core] failed to delete dialogue shadow session ${shadowSessionKey}: ${String(error)}`
      );
    }
  }

  return {
    payload,
    elapsedMs: Date.now() - startedAt
  };
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
  assemblyMetrics = {}
}) {
  const startedAt = Date.now();
  const normalizedSessionKey = normalizeSessionKey(sessionKey);
  const agentId = parseAgentId(normalizedSessionKey);
  const sampling = evaluateDialogueWorkingSetShadowSampling({
    runtime,
    config,
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
    const decision = await runWorkingSetShadowDecision({
      runtime,
      sessionKey: normalizedSessionKey,
      query,
      turns: sampling.turns,
      config,
      logger
    });
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
      reason: normalizeString(String(error), "shadow_capture_failed"),
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
