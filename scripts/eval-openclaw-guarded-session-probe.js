#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { evaluateAnswer } from "../src/dialogue-working-set-answer-ab.js";
import { pickDialogueWorkingSetShadowEvent } from "../src/dialogue-working-set-shadow-event-selection.js";
import { extractJsonPayload } from "../src/retrieval.js";
import {
  buildHermeticOpenClawEnv,
  cleanupHermeticOpenClawState,
  cloneHermeticOpenClawState,
  createHermeticOpenClawState
} from "./openclaw-hermetic-state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const today = new Date().toISOString().slice(0, 10);

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function readFlag(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

async function importCases(casesPath) {
  const moduleUrl = pathToFileURL(casesPath).href;
  const imported = await import(moduleUrl);
  const cases = imported.default || imported.cases || [];
  if (!Array.isArray(cases)) {
    throw new Error(`Case module did not export an array: ${casesPath}`);
  }
  return cases;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveHostDefaultAgentModel() {
  const configPath = path.join(os.homedir(), ".openclaw", "openclaw.json");
  try {
    const raw = JSON.parse(await fs.readFile(configPath, "utf8"));
    const list = Array.isArray(raw?.agents?.list) ? raw.agents.list : [];
    const mainModel = list.find((item) => item?.id === "main")?.model?.primary;
    const defaultModel = raw?.agents?.defaults?.model?.primary;
    return normalizeString(mainModel || defaultModel);
  } catch {
    return "";
  }
}

function resolveDecisionModel(explicitModel, agentModel) {
  const raw = normalizeString(explicitModel);
  if (raw) {
    return raw;
  }
  const normalizedAgentModel = normalizeString(agentModel);
  if (!normalizedAgentModel) {
    return "gpt-5.4-mini";
  }
  const providerSplit = normalizedAgentModel.split("/");
  return normalizeString(providerSplit.at(-1), "gpt-5.4-mini");
}

async function patchModeConfig({
  stateDir,
  mode,
  shadowModel,
  reasoningEffort,
  transport,
  outputDir,
  timeoutMs
}) {
  const configPath = path.join(stateDir, "openclaw.json");
  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  const pluginEntry = config?.plugins?.entries?.["unified-memory-core"];
  if (!pluginEntry) {
    throw new Error(`Missing unified-memory-core plugin entry in ${configPath}`);
  }

  pluginEntry.enabled = true;
  pluginEntry.config = pluginEntry.config || {};
  pluginEntry.config.selfLearning = {
    ...(pluginEntry.config.selfLearning || {}),
    enabled: false
  };
  pluginEntry.config.llmRerank = {
    ...(pluginEntry.config.llmRerank || {}),
    enabled: false
  };
  pluginEntry.config.openclawAdapter = {
    ...(pluginEntry.config.openclawAdapter || {}),
    ordinaryConversationMemory: {
      ...((pluginEntry.config.openclawAdapter || {}).ordinaryConversationMemory || {}),
      enabled: false
    },
    governedExports: {
      ...((pluginEntry.config.openclawAdapter || {}).governedExports || {}),
      enabled: false
    }
  };
  pluginEntry.config.dialogueWorkingSetShadow = {
    enabled: mode === "guarded",
    model: shadowModel,
    transport,
    reasoningEffort,
    timeoutMs,
    maxTurns: 12,
    minTurns: 3,
    maxCharsPerTurn: 900,
    outputDir: mode === "guarded" ? outputDir : "",
    cleanupSession: true
  };
  pluginEntry.config.dialogueWorkingSetGuarded = {
    enabled: mode === "guarded",
    allowedRelations: ["switch", "resolve", "continue"],
    minReductionRatio: 0.18,
    minEvictedTurns: 1,
    prependCarryForward: true
  };

  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function pickJsonText(stdout = "", stderr = "") {
  return String(stdout || "").trim() ? String(stdout || "") : String(stderr || "");
}

function extractAgentText(payload) {
  const parts =
    payload?.result?.payloads
    || payload?.result?.content
    || payload?.payloads
    || payload?.content
    || [];
  return parts.map((item) => item?.text || "").join("\n").trim();
}

async function runAgentTurn({ stateDir, agentId, sessionId, message, timeoutMs }) {
  const timeoutSeconds = Math.max(5, Math.ceil(timeoutMs / 1000));

  return await new Promise((resolve) => {
    const child = spawn("openclaw", [
      "agent",
      "--agent",
      agentId,
      "--local",
      "--thinking",
      "off",
      "--timeout",
      String(timeoutSeconds),
      "--json",
      "--session-id",
      sessionId,
      "--message",
      message
    ], {
      cwd: repoRoot,
      env: buildHermeticOpenClawEnv({ OPENCLAW_STATE_DIR: stateDir }),
      stdio: ["ignore", "pipe", "pipe"],
      detached: true
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let timer = null;

    const trimBuffer = (value) => {
      const maxBuffer = 8 * 1024 * 1024;
      return value.length <= maxBuffer ? value : value.slice(value.length - maxBuffer);
    };

    const killTree = (signal = "SIGTERM") => {
      try {
        process.kill(-child.pid, signal);
        return;
      } catch {
        try {
          child.kill(signal);
        } catch {
          // ignore cleanup failure
        }
      }
    };

    const finish = (payload) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(payload);
    };

    child.stdout.on("data", (chunk) => {
      stdout = trimBuffer(stdout + String(chunk));
    });
    child.stderr.on("data", (chunk) => {
      stderr = trimBuffer(stderr + String(chunk));
    });

    child.on("error", (error) => {
      finish({
        ok: false,
        error: String(error?.message || error),
        stdout,
        stderr
      });
    });

    child.on("close", (code, signal) => {
      if (timedOut) {
        finish({
          ok: false,
          error: `timeout after ${timeoutMs}ms`,
          stdout,
          stderr
        });
        return;
      }

      const jsonText = pickJsonText(stdout, stderr);
      if (!jsonText.trim()) {
        finish({
          ok: false,
          error: code === 0 ? "missing_json_payload" : `exit ${code ?? "null"} signal ${signal ?? "null"}`,
          stdout,
          stderr
        });
        return;
      }

      try {
        const payload = extractJsonPayload(jsonText);
        finish({
          ok: true,
          payload,
          answer: extractAgentText(payload),
          stdout,
          stderr
        });
      } catch {
        finish({
          ok: false,
          error: code === 0 ? "json_parse_failed" : `exit ${code ?? "null"} signal ${signal ?? "null"}`,
          stdout,
          stderr
        });
      }
    });

    timer = setTimeout(() => {
      timedOut = true;
      killTree("SIGKILL");
    }, timeoutMs);
  });
}

function extractPromptTokens(payload) {
  return (
    Number(payload?.result?.meta?.agentMeta?.promptTokens)
    || Number(payload?.payload?.meta?.agentMeta?.promptTokens)
    || Number(payload?.meta?.agentMeta?.promptTokens)
    || 0
  );
}

function extractDurationMs(payload) {
  return (
    Number(payload?.result?.meta?.durationMs)
    || Number(payload?.meta?.durationMs)
    || 0
  );
}

async function readShadowEvents(outputDir) {
  const exportsDir = path.join(outputDir, "exports");
  if (!(await pathExists(exportsDir))) {
    return [];
  }
  const files = (await fs.readdir(exportsDir))
    .filter((item) => item.endsWith(".json"))
    .sort();
  const events = [];
  for (const fileName of files) {
    const fullPath = path.join(exportsDir, fileName);
    const payload = JSON.parse(await fs.readFile(fullPath, "utf8"));
    events.push({
      ...payload,
      exportPath: fullPath
    });
  }
  return events;
}

async function waitForTurnEvent(outputDir, { sessionKey, query }, timeoutMs) {
  const startedAt = Date.now();
  let lastCandidate = null;
  while (Date.now() - startedAt < timeoutMs) {
    const events = await readShadowEvents(outputDir);
    const candidate = pickDialogueWorkingSetShadowEvent(events, {
      sessionKey,
      query
    });
    if (candidate) {
      lastCandidate = candidate;
      if (String(candidate.status || "") === "captured") {
        return candidate;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return lastCandidate;
}

function evaluateCheckpoints(caseDef, turnRecords = []) {
  const checkpoints = Array.isArray(caseDef.checkpoints) ? caseDef.checkpoints : [];
  return checkpoints.map((checkpoint) => {
    const turn = turnRecords.find((item) => item.turnIndex === checkpoint.turnIndex) || {};
    const evaluation = evaluateAnswer({
      expectedAll: checkpoint.expectedAll,
      expectedAny: checkpoint.expectedAny,
      forbiddenAny: checkpoint.forbiddenAny
    }, normalizeString(turn.answer));
    return {
      label: normalizeString(checkpoint.label, `turn-${checkpoint.turnIndex}`),
      turnIndex: checkpoint.turnIndex,
      answer: normalizeString(turn.answer),
      passed: evaluation.passed,
      expectedAll: Array.isArray(checkpoint.expectedAll) ? checkpoint.expectedAll : [],
      expectedAny: Array.isArray(checkpoint.expectedAny) ? checkpoint.expectedAny : [],
      forbiddenAny: Array.isArray(checkpoint.forbiddenAny) ? checkpoint.forbiddenAny : []
    };
  });
}

function computePromptWindowMetrics(caseDef, turnRecords = []) {
  const switchTurnIndex = Math.max(0, Number(caseDef.switchTurnIndex || 0));
  const rollbackWindow = Math.max(1, Number(caseDef.rollbackWindow || 2));
  const preSwitchTurns = turnRecords.filter((item) => item.turnIndex < switchTurnIndex && item.ok === true);
  const switchWindowTurns = turnRecords.filter(
    (item) => item.turnIndex >= switchTurnIndex && item.turnIndex < switchTurnIndex + rollbackWindow && item.ok === true
  );
  const peakBeforeSwitch = preSwitchTurns.reduce(
    (max, item) => Math.max(max, Number(item.promptTokens || 0)),
    0
  );
  const minWithinSwitchWindow = switchWindowTurns.length > 0
    ? switchWindowTurns.reduce(
      (min, item) => Math.min(min, Number(item.promptTokens || 0)),
      Number.POSITIVE_INFINITY
    )
    : 0;
  const rollbackRatio = peakBeforeSwitch > 0 && Number.isFinite(minWithinSwitchWindow)
    ? Number(((peakBeforeSwitch - minWithinSwitchWindow) / peakBeforeSwitch).toFixed(4))
    : 0;
  const guardedAppliedTurns = switchWindowTurns.filter((item) => item.event?.guarded?.applied === true).length;

  return {
    switchTurnIndex,
    rollbackWindow,
    peakBeforeSwitch,
    minWithinSwitchWindow: Number.isFinite(minWithinSwitchWindow) ? minWithinSwitchWindow : 0,
    rollbackRatio,
    guardedAppliedTurns
  };
}

async function runCaseInMode({
  caseDef,
  mode,
  baseStateDir,
  agentId,
  outputRoot,
  shadowModel,
  reasoningEffort,
  transport,
  timeoutMs
}) {
  const stateDir = await cloneHermeticOpenClawState(
    baseStateDir,
    mode === "baseline" ? "umc-guarded-probe-baseline-" : "umc-guarded-probe-guarded-"
  );
  const outputDir = path.join(outputRoot, `${caseDef.id}-${mode}`);
  const sessionId = `${caseDef.id}-${mode}`;
  const sessionKey = `agent:${agentId}:${sessionId}`;

  try {
    await fs.rm(outputDir, { recursive: true, force: true });
    await patchModeConfig({
      stateDir,
      mode,
      shadowModel,
      reasoningEffort,
      transport,
      outputDir,
      timeoutMs
    });

    const turnRecords = [];
    for (let index = 0; index < caseDef.turns.length; index += 1) {
      const message = caseDef.turns[index];
      const result = await runAgentTurn({
        stateDir,
        agentId,
        sessionId,
        message,
        timeoutMs
      });
      const event = mode === "guarded" && result.ok === true
        ? await waitForTurnEvent(outputDir, { sessionKey, query: message }, 15_000)
        : null;

      turnRecords.push({
        turnIndex: index,
        message,
        ok: result.ok === true,
        answer: result.ok === true ? normalizeString(result.answer) : "",
        error: result.ok === true ? "" : String(result.error || "run_failed"),
        promptTokens: result.ok === true ? extractPromptTokens(result.payload) : 0,
        durationMs: result.ok === true ? extractDurationMs(result.payload) : 0,
        event
      });

      if (result.ok !== true) {
        break;
      }
    }

    return {
      mode,
      sessionId,
      sessionKey,
      ok: turnRecords.every((item) => item.ok === true) && turnRecords.length === caseDef.turns.length,
      turnsCompleted: turnRecords.filter((item) => item.ok === true).length,
      turns: turnRecords,
      checkpoints: evaluateCheckpoints(caseDef, turnRecords),
      promptWindow: computePromptWindowMetrics(caseDef, turnRecords)
    };
  } finally {
    await cleanupHermeticOpenClawState(stateDir);
  }
}

function summarize(results = []) {
  const total = results.length;
  const checkpointTotals = results.flatMap((item) => item.guarded.checkpoints);
  return {
    total,
    guardedCasesOk: results.filter((item) => item.guarded.ok).length,
    baselineCasesOk: results.filter((item) => item.baseline.ok).length,
    guardedCheckpointPasses: checkpointTotals.filter((item) => item.passed).length,
    guardedCheckpointTotal: checkpointTotals.length,
    averageBaselinePeakPromptTokens: total
      ? Math.round(results.reduce((sum, item) => sum + Number(item.baseline.promptWindow.peakBeforeSwitch || 0), 0) / total)
      : 0,
    averageGuardedPeakPromptTokens: total
      ? Math.round(results.reduce((sum, item) => sum + Number(item.guarded.promptWindow.peakBeforeSwitch || 0), 0) / total)
      : 0,
    averageBaselinePostSwitchPromptTokens: total
      ? Math.round(results.reduce((sum, item) => sum + Number(item.baseline.promptWindow.minWithinSwitchWindow || 0), 0) / total)
      : 0,
    averageGuardedPostSwitchPromptTokens: total
      ? Math.round(results.reduce((sum, item) => sum + Number(item.guarded.promptWindow.minWithinSwitchWindow || 0), 0) / total)
      : 0,
    averageBaselineRollbackRatio: total
      ? Number((results.reduce((sum, item) => sum + Number(item.baseline.promptWindow.rollbackRatio || 0), 0) / total).toFixed(4))
      : 0,
    averageGuardedRollbackRatio: total
      ? Number((results.reduce((sum, item) => sum + Number(item.guarded.promptWindow.rollbackRatio || 0), 0) / total).toFixed(4))
      : 0,
    averageGuardedVsBaselinePostSwitchSavingsRatio: total
      ? Number((results.reduce((sum, item) => sum + Number(item.promptComparison.postSwitchSavingsRatio || 0), 0) / total).toFixed(4))
      : 0
  };
}

function renderTurnLine(turn = {}) {
  const event = turn.event || {};
  const relation = normalizeString(
    event?.decision?.relation || event?.relation || event?.scorecard?.relation,
    ""
  );
  const applied = event?.guarded?.applied === true;
  const packageReductionRatio = Number(
    event?.package_reduction_ratio
    || event?.scorecard?.packageReductionRatio
    || 0
  );
  return `- t${Number(turn.turnIndex) + 1}: promptTokens=\`${turn.promptTokens}\` durationMs=\`${turn.durationMs}\`${turn.event ? ` guardedApplied=\`${applied}\` relation=\`${relation}\` packageReductionRatio=\`${packageReductionRatio.toFixed(4)}\`` : ""}`;
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# OpenClaw Guarded Session Probe");
  lines.push("");
  lines.push(`- generatedAt: \`${report.generatedAt}\``);
  lines.push(`- agentModel: \`${report.agentModel}\``);
  lines.push(`- shadowModel: \`${report.shadowModel}\``);
  lines.push(`- reasoningEffort: \`${report.reasoningEffort}\``);
  lines.push(`- transport: \`${report.transport}\``);
  lines.push(`- total: \`${report.summary.total}\``);
  lines.push(`- guardedCasesOk: \`${report.summary.guardedCasesOk}/${report.summary.total}\``);
  lines.push(`- guardedCheckpointPasses: \`${report.summary.guardedCheckpointPasses}/${report.summary.guardedCheckpointTotal}\``);
  lines.push(`- averageBaselinePeakPromptTokens: \`${report.summary.averageBaselinePeakPromptTokens}\``);
  lines.push(`- averageGuardedPeakPromptTokens: \`${report.summary.averageGuardedPeakPromptTokens}\``);
  lines.push(`- averageBaselinePostSwitchPromptTokens: \`${report.summary.averageBaselinePostSwitchPromptTokens}\``);
  lines.push(`- averageGuardedPostSwitchPromptTokens: \`${report.summary.averageGuardedPostSwitchPromptTokens}\``);
  lines.push(`- averageBaselineRollbackRatio: \`${report.summary.averageBaselineRollbackRatio}\``);
  lines.push(`- averageGuardedRollbackRatio: \`${report.summary.averageGuardedRollbackRatio}\``);
  lines.push(`- averageGuardedVsBaselinePostSwitchSavingsRatio: \`${report.summary.averageGuardedVsBaselinePostSwitchSavingsRatio}\``);
  lines.push("");
  lines.push("## Method");
  lines.push("");
  lines.push("- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.");
  lines.push("- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.");
  lines.push("- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.");
  lines.push("- No manual `compact` is used anywhere in the probe.");
  lines.push("");
  for (const item of report.results) {
    lines.push(`## ${item.id}`);
    lines.push(`- description: ${item.description}`);
    lines.push(`- baseline peakBeforeSwitch: \`${item.baseline.promptWindow.peakBeforeSwitch}\``);
    lines.push(`- guarded peakBeforeSwitch: \`${item.guarded.promptWindow.peakBeforeSwitch}\``);
    lines.push(`- baseline postSwitchMin: \`${item.baseline.promptWindow.minWithinSwitchWindow}\``);
    lines.push(`- guarded postSwitchMin: \`${item.guarded.promptWindow.minWithinSwitchWindow}\``);
    lines.push(`- baseline rollbackRatio: \`${item.baseline.promptWindow.rollbackRatio}\``);
    lines.push(`- guarded rollbackRatio: \`${item.guarded.promptWindow.rollbackRatio}\``);
    lines.push(`- guarded postSwitch savings vs baseline: \`${item.promptComparison.postSwitchSavingsRatio}\``);
    lines.push(`- guarded applied turns in switch window: \`${item.guarded.promptWindow.guardedAppliedTurns}\``);
    lines.push(`- guarded checkpoints: \`${item.guarded.checkpoints.filter((entry) => entry.passed).length}/${item.guarded.checkpoints.length}\``);
    lines.push(`- baseline checkpoints: \`${item.baseline.checkpoints.filter((entry) => entry.passed).length}/${item.baseline.checkpoints.length}\``);
    lines.push("");
    lines.push("### Baseline Turns");
    for (const turn of item.baseline.turns) {
      lines.push(renderTurnLine(turn));
    }
    lines.push("");
    lines.push("### Guarded Turns");
    for (const turn of item.guarded.turns) {
      lines.push(renderTurnLine(turn));
    }
    lines.push("");
    lines.push("### Guarded Checkpoints");
    for (const checkpoint of item.guarded.checkpoints) {
      lines.push(`- ${checkpoint.label}: turn=\`${checkpoint.turnIndex + 1}\` passed=\`${checkpoint.passed}\` answer=${checkpoint.answer}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

const agentId = normalizeString(readFlag("--agent-id", "main"), "main");
const fixtureRoot = normalizeString(readFlag("--fixture-root"), "");
const pluginPath = normalizeString(readFlag("--plugin-path", repoRoot), repoRoot);
const embedModelPath = normalizeString(readFlag("--embed-model-path"), "");
const authProfilesPath = normalizeString(readFlag("--auth-profiles-path"), "");
const format = normalizeString(readFlag("--format", "json"), "json");
const only = normalizeString(readFlag("--only", ""), "");
const reasoningEffort = normalizeString(readFlag("--reasoning-effort", "low"), "low");
const transport = normalizeString(readFlag("--transport", "codex_exec"), "codex_exec");
const timeoutMs = Number(readFlag("--timeout-ms", "120000")) || 120000;
const casesPath = path.resolve(repoRoot, readFlag("--cases", "evals/openclaw-guarded-session-probe-cases.js"));
const writeJson = path.resolve(repoRoot, readFlag("--write-json", `reports/openclaw-guarded-session-probe-${today}.json`));
const writeMarkdown = path.resolve(repoRoot, readFlag("--write-markdown", `reports/generated/openclaw-guarded-session-probe-${today}.md`));
const outputRoot = path.resolve(repoRoot, readFlag("--output-dir", `reports/generated/openclaw-guarded-session-probe-${today}`));

const hostAgentModel = await resolveHostDefaultAgentModel();
const agentModel = normalizeString(readFlag("--agent-model", hostAgentModel), hostAgentModel);
const shadowModel = resolveDecisionModel(readFlag("--shadow-model", ""), agentModel);
const importedCases = await importCases(casesPath);
const cases = only
  ? importedCases.filter((item) => only.split(",").map((value) => value.trim()).filter(Boolean).includes(item.id))
  : importedCases;

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

const baselineState = await createHermeticOpenClawState({
  agentId,
  includeUMC: true,
  fixtureRoot,
  pluginPath,
  embedModelPath,
  authProfilesPath,
  agentModel
});
const guardedState = await createHermeticOpenClawState({
  agentId,
  includeUMC: true,
  fixtureRoot,
  pluginPath,
  embedModelPath,
  authProfilesPath,
  agentModel
});

try {
  const results = [];
  for (const caseDef of cases) {
    console.error(`[guarded-session-probe] ${caseDef.id} baseline`);
    const baseline = await runCaseInMode({
      caseDef,
      mode: "baseline",
      baseStateDir: baselineState.stateDir,
      agentId,
      outputRoot,
      shadowModel,
      reasoningEffort,
      transport,
      timeoutMs
    });
    console.error(`[guarded-session-probe] ${caseDef.id} guarded`);
    const guarded = await runCaseInMode({
      caseDef,
      mode: "guarded",
      baseStateDir: guardedState.stateDir,
      agentId,
      outputRoot,
      shadowModel,
      reasoningEffort,
      transport,
      timeoutMs
    });

    const baselinePostSwitch = Number(baseline.promptWindow.minWithinSwitchWindow || 0);
    const guardedPostSwitch = Number(guarded.promptWindow.minWithinSwitchWindow || 0);
    const postSwitchSavingsRatio = baselinePostSwitch > 0
      ? Number(((baselinePostSwitch - guardedPostSwitch) / baselinePostSwitch).toFixed(4))
      : 0;

    results.push({
      id: caseDef.id,
      description: caseDef.description,
      baseline,
      guarded,
      promptComparison: {
        postSwitchSavingsRatio
      }
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    agentId,
    agentModel,
    shadowModel,
    reasoningEffort,
    transport,
    outputRoot,
    summary: summarize(results),
    results
  };

  await fs.mkdir(path.dirname(writeJson), { recursive: true });
  await fs.writeFile(writeJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.mkdir(path.dirname(writeMarkdown), { recursive: true });
  await fs.writeFile(writeMarkdown, renderMarkdown(report), "utf8");

  if (format === "markdown") {
    process.stdout.write(renderMarkdown(report));
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
} finally {
  await cleanupHermeticOpenClawState(baselineState.stateDir);
  await cleanupHermeticOpenClawState(guardedState.stateDir);
}
