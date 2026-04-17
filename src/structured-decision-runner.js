import fs from "node:fs/promises";

import {
  createMinimalCodexHome,
  runStructuredCodexPrompt,
  normalizeString as normalizeCodexString
} from "./codex-structured-runner.js";
import { messageContentToText, sanitizeForSystemPrompt } from "./utils.js";

function normalizeString(value, fallback = "") {
  return normalizeCodexString(value, fallback);
}

const sharedMinimalCodexHomes = new Map();

async function disposeSharedMinimalCodexHome(reasoningEffort) {
  const codexHome = sharedMinimalCodexHomes.get(reasoningEffort);
  if (!codexHome) {
    return;
  }
  sharedMinimalCodexHomes.delete(reasoningEffort);
  await fs.rm(codexHome, { recursive: true, force: true });
}

function sanitizePurpose(value, fallback = "decision") {
  return normalizeString(value, fallback)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || fallback;
}

function hasRuntimeSubagent(runtime) {
  return Boolean(
    runtime?.subagent?.run
    && runtime?.subagent?.waitForRun
    && runtime?.subagent?.getSessionMessages
  );
}

function hasInlineRunner(overrideRunner) {
  return typeof overrideRunner === "function";
}

function buildAttemptOrder({ transport = "auto", runtime, overrideRunner }) {
  if (transport === "inline") {
    return ["inline"];
  }
  if (transport === "runtime_subagent") {
    return ["runtime_subagent"];
  }
  if (transport === "codex_exec") {
    return ["codex_exec"];
  }

  const attempts = [];
  if (hasInlineRunner(overrideRunner)) {
    attempts.push("inline");
  }
  attempts.push("codex_exec");
  if (hasRuntimeSubagent(runtime)) {
    attempts.push("runtime_subagent");
  }
  return attempts;
}

async function runWithInlineRunner({
  overrideRunner,
  prompt,
  schema,
  sessionKey,
  purpose,
  query,
  input,
  config
}) {
  const startedAt = Date.now();
  const payload = await overrideRunner({
    prompt,
    schema,
    sessionKey,
    purpose,
    query,
    input,
    config
  });
  return {
    payload,
    elapsedMs: Date.now() - startedAt,
    transport: "inline"
  };
}

async function runWithCodexExec({
  prompt,
  schema,
  config,
  cwd
}) {
  const reasoningEffort = config.reasoningEffort || "low";
  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let codexHome = sharedMinimalCodexHomes.get(reasoningEffort);
    if (!codexHome) {
      codexHome = await createMinimalCodexHome(reasoningEffort);
      sharedMinimalCodexHomes.set(reasoningEffort, codexHome);
    }

    try {
      const result = await runStructuredCodexPrompt({
        prompt,
        schema,
        model: config.model || "gpt-5.4",
        reasoningEffort,
        timeoutMs: config.timeoutMs,
        cwd,
        codexHome
      });

      return {
        payload: result.payload,
        elapsedMs: result.elapsedMs,
        usage: result.usage,
        transport: "codex_exec"
      };
    } catch (error) {
      lastError = error;
      await disposeSharedMinimalCodexHome(reasoningEffort);
      if (attempt >= maxAttempts) {
        throw error;
      }
    }
  }

  throw lastError || new Error("codex_exec transport failed");
}

async function runWithRuntimeSubagent({
  runtime,
  sessionKey,
  prompt,
  config,
  parser,
  purpose,
  logger
}) {
  if (!hasRuntimeSubagent(runtime)) {
    throw new Error("runtime.subagent is unavailable");
  }

  const scopedSessionKey = `${normalizeString(sessionKey, "agent:main")}:${sanitizePurpose(purpose)}:${Date.now()}`;
  const startedAt = Date.now();
  const runResult = await runtime.subagent.run({
    sessionKey: scopedSessionKey,
    message: prompt,
    provider: config.provider || undefined,
    model: config.model || undefined,
    extraSystemPrompt:
      "Return only JSON. Do not include markdown fences, prose, or explanation outside the JSON payload.",
    lane: "subagent",
    deliver: false,
    idempotencyKey: `${sanitizePurpose(purpose)}-${Date.now()}`
  });

  const waitResult = await runtime.subagent.waitForRun({
    runId: runResult.runId,
    timeoutMs: config.timeoutMs
  });

  if (waitResult.status !== "ok") {
    throw new Error(waitResult.error || `${purpose} run failed: ${waitResult.status}`);
  }

  const session = await runtime.subagent.getSessionMessages({
    sessionKey: scopedSessionKey,
    limit: 20
  });
  const assistantMessages = Array.isArray(session?.messages) ? session.messages : [];
  const finalAssistant = [...assistantMessages]
    .reverse()
    .find((message) => message && message.role === "assistant");
  const assistantText = sanitizeForSystemPrompt(messageContentToText(finalAssistant?.content));
  const payload = parser ? parser(assistantText) : JSON.parse(assistantText);

  if (config.cleanupSession !== false && typeof runtime.subagent.deleteSession === "function") {
    try {
      await runtime.subagent.deleteSession({
        sessionKey: scopedSessionKey,
        deleteTranscript: true
      });
    } catch (error) {
      logger?.warn?.(
        `[unified-memory-core] failed to delete ${purpose} session ${scopedSessionKey}: ${String(error)}`
      );
    }
  }

  return {
    payload,
    elapsedMs: Date.now() - startedAt,
    transport: "runtime_subagent"
  };
}

export async function runStructuredDecision({
  runtime,
  logger,
  sessionKey,
  prompt,
  schema,
  config = {},
  parser = null,
  normalizePayload = null,
  purpose = "decision",
  query = "",
  input = null,
  overrideRunner = null,
  cwd = process.cwd()
}) {
  const errors = [];
  const attempts = buildAttemptOrder({
    transport: normalizeString(config.transport, "auto"),
    runtime,
    overrideRunner
  });

  for (const attempt of attempts) {
    try {
      let result = null;

      if (attempt === "inline") {
        result = await runWithInlineRunner({
          overrideRunner,
          prompt,
          schema,
          sessionKey,
          purpose,
          query,
          input,
          config
        });
      } else if (attempt === "codex_exec") {
        result = await runWithCodexExec({
          prompt,
          schema,
          config,
          cwd
        });
      } else if (attempt === "runtime_subagent") {
        result = await runWithRuntimeSubagent({
          runtime,
          sessionKey,
          prompt,
          config,
          parser,
          purpose,
          logger
        });
      }

      if (!result) {
        continue;
      }

      return {
        ...result,
        payload: normalizePayload ? normalizePayload(result.payload) : result.payload
      };
    } catch (error) {
      errors.push(`${attempt}: ${String(error?.message || error)}`);
      logger?.warn?.(
        `[unified-memory-core] ${purpose} transport ${attempt} failed for ${normalizeString(sessionKey, "session")}: ${String(error)}`
      );
    }
  }

  throw new Error(
    errors.length > 0
      ? `no structured decision transport succeeded (${errors.join("; ")})`
      : "no structured decision transport configured"
  );
}
