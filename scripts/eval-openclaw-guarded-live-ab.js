#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { evaluateAnswer } from "../src/dialogue-working-set-answer-ab.js";
import { extractJsonPayload } from "../src/retrieval.js";
import {
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

function hasFlag(name) {
  return process.argv.includes(name);
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
  outputDir
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
    enabled: mode !== "baseline",
    model: shadowModel,
    transport,
    reasoningEffort,
    timeoutMs: 120000,
    maxTurns: 12,
    minTurns: 3,
    maxCharsPerTurn: 900,
    outputDir: mode === "baseline" ? "" : outputDir,
    cleanupSession: true
  };
  pluginEntry.config.dialogueWorkingSetGuarded = {
    enabled: mode === "guarded",
    allowedRelations: ["switch", "resolve"],
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
      env: { ...process.env, OPENCLAW_STATE_DIR: stateDir },
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
      if (value.length <= maxBuffer) {
        return value;
      }
      return value.slice(value.length - maxBuffer);
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

async function readLatestGuardedEvent(outputDir, sessionKey) {
  const exportsDir = path.join(outputDir, "exports");
  if (!(await pathExists(exportsDir))) {
    return null;
  }
  const files = (await fs.readdir(exportsDir))
    .filter((item) => item.endsWith(".json"))
    .sort();
  const matched = [];
  for (const fileName of files) {
    const fullPath = path.join(exportsDir, fileName);
    const payload = JSON.parse(await fs.readFile(fullPath, "utf8"));
    if (payload?.session_key === sessionKey) {
      matched.push({
        ...payload,
        exportPath: fullPath
      });
    }
  }
  if (matched.length) {
    matched.sort((left, right) => String(left.generated_at).localeCompare(String(right.generated_at)));
    return matched.at(-1);
  }

  const fallback = [];
  for (const fileName of files) {
    const fullPath = path.join(exportsDir, fileName);
    const payload = JSON.parse(await fs.readFile(fullPath, "utf8"));
    fallback.push({
      ...payload,
      exportPath: fullPath
    });
  }
  fallback.sort((left, right) => String(left.generated_at).localeCompare(String(right.generated_at)));
  return fallback.at(-1) || null;
}

async function waitForGuardedEvent(outputDir, sessionKey, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const event = await readLatestGuardedEvent(outputDir, sessionKey);
    if (event) {
      return event;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
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
    mode === "baseline" ? "umc-guarded-live-baseline-" : "umc-guarded-live-guarded-"
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
      outputDir
    });

    const turnResults = [];
    for (const message of caseDef.turns) {
      const result = await runAgentTurn({
        stateDir,
        agentId,
        sessionId,
        message,
        timeoutMs
      });
      turnResults.push(result);
      if (result.ok !== true) {
        break;
      }
    }

    const finalTurn = turnResults.at(-1) || { ok: false, error: "missing_final_turn", answer: "" };
    const answerText = normalizeString(finalTurn.answer);
    const evaluation = evaluateAnswer(caseDef, answerText);
    const promptTokens =
      Number(finalTurn?.payload?.result?.meta?.agentMeta?.promptTokens)
      || Number(finalTurn?.payload?.meta?.agentMeta?.promptTokens)
      || 0;
    const durationMs =
      Number(finalTurn?.payload?.result?.meta?.durationMs)
      || Number(finalTurn?.payload?.meta?.durationMs)
      || 0;
    const event = mode === "guarded"
      ? await waitForGuardedEvent(outputDir, sessionKey, 15_000)
      : null;

    return {
      mode,
      sessionId,
      sessionKey,
      turnsCompleted: turnResults.filter((item) => item.ok === true).length,
      ok: finalTurn.ok === true,
      answer: answerText,
      error: finalTurn.ok === true ? "" : String(finalTurn.error || "run_failed"),
      promptTokens,
      durationMs,
      evaluation,
      event
    };
  } finally {
    await cleanupHermeticOpenClawState(stateDir);
  }
}

function summarize(results = []) {
  const totals = results.length;
  const baselinePassed = results.filter((item) => item.baseline.evaluation.passed).length;
  const guardedPassed = results.filter((item) => item.guarded.evaluation.passed).length;
  const guardedApplied = results.filter((item) => item.guarded.event?.guarded?.applied === true).length;
  const expectedGuarded = results.filter((item) => item.expectGuardedApplied === true).length;
  const activationMatched = results.filter(
    (item) => (item.guarded.event?.guarded?.applied === true) === (item.expectGuardedApplied === true)
  ).length;
  const falseActivations = results.filter(
    (item) => item.expectGuardedApplied !== true && item.guarded.event?.guarded?.applied === true
  ).length;
  const missedActivations = results.filter(
    (item) => item.expectGuardedApplied === true && item.guarded.event?.guarded?.applied !== true
  ).length;
  const baselineOnly = results.filter(
    (item) => item.baseline.evaluation.passed && !item.guarded.evaluation.passed
  ).length;
  const guardedOnly = results.filter(
    (item) => !item.baseline.evaluation.passed && item.guarded.evaluation.passed
  ).length;
  const bothFail = results.filter(
    (item) => !item.baseline.evaluation.passed && !item.guarded.evaluation.passed
  ).length;
  const averagePromptReductionRatio = totals
    ? Number(
      (
        results.reduce((sum, item) => sum + Number(item.promptReductionRatio || 0), 0) / totals
      ).toFixed(4)
    )
    : 0;
  const appliedOnly = results.filter((item) => item.guarded.event?.guarded?.applied === true);
  const averageAppliedPromptReductionRatio = appliedOnly.length
    ? Number(
      (
        appliedOnly.reduce((sum, item) => sum + Number(item.promptReductionRatio || 0), 0) / appliedOnly.length
      ).toFixed(4)
    )
    : 0;
  const averageRawReductionRatio = appliedOnly.length
    ? Number(
      (
        appliedOnly.reduce(
          (sum, item) => sum + Number(item.guarded.event?.scorecard?.rawReductionRatio || 0),
          0
        ) / appliedOnly.length
      ).toFixed(4)
    )
    : 0;

  return {
    total: totals,
    baselinePassed,
    guardedPassed,
    guardedApplied,
    expectedGuarded,
    activationMatched,
    falseActivations,
    missedActivations,
    guardedOnly,
    baselineOnly,
    bothFail,
    averageBaselinePromptTokens: totals
      ? Math.round(results.reduce((sum, item) => sum + Number(item.baseline.promptTokens || 0), 0) / totals)
      : 0,
    averageGuardedPromptTokens: totals
      ? Math.round(results.reduce((sum, item) => sum + Number(item.guarded.promptTokens || 0), 0) / totals)
      : 0,
    averagePromptReductionRatio,
    averageAppliedPromptReductionRatio,
    averageAppliedRawReductionRatio: averageRawReductionRatio
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# OpenClaw Guarded Live A/B");
  lines.push("");
  lines.push(`- generatedAt: \`${report.generatedAt}\``);
  lines.push(`- agentModel: \`${report.agentModel}\``);
  lines.push(`- shadowModel: \`${report.shadowModel}\``);
  lines.push(`- reasoningEffort: \`${report.reasoningEffort}\``);
  lines.push(`- transport: \`${report.transport}\``);
  lines.push(`- total: \`${report.summary.total}\``);
  lines.push(`- baselinePassed: \`${report.summary.baselinePassed}/${report.summary.total}\``);
  lines.push(`- guardedPassed: \`${report.summary.guardedPassed}/${report.summary.total}\``);
  lines.push(`- guardedApplied: \`${report.summary.guardedApplied}/${report.summary.total}\``);
  lines.push(`- activationMatched: \`${report.summary.activationMatched}/${report.summary.total}\``);
  lines.push(`- falseActivations: \`${report.summary.falseActivations}\``);
  lines.push(`- missedActivations: \`${report.summary.missedActivations}\``);
  lines.push(`- averageBaselinePromptTokens: \`${report.summary.averageBaselinePromptTokens}\``);
  lines.push(`- averageGuardedPromptTokens: \`${report.summary.averageGuardedPromptTokens}\``);
  lines.push(`- averagePromptReductionRatio: \`${report.summary.averagePromptReductionRatio}\``);
  lines.push(`- averageAppliedPromptReductionRatio: \`${report.summary.averageAppliedPromptReductionRatio}\``);
  lines.push(`- averageAppliedRawReductionRatio: \`${report.summary.averageAppliedRawReductionRatio}\``);
  lines.push("");
  lines.push("## Method");
  lines.push("");
  lines.push("- Every run uses an isolated hermetic `OPENCLAW_STATE_DIR` built from the repo fixture, not host `~/.openclaw` memory.");
  lines.push("- `baseline` keeps the current UMC path but leaves `dialogueWorkingSetShadow` and `dialogueWorkingSetGuarded` off.");
  lines.push("- `guarded` enables `dialogueWorkingSetShadow` plus the Stage 9 guarded opt-in path.");
  lines.push("- Both modes disable unrelated learning/distillation writes so the comparison stays focused on context-path behavior.");
  lines.push("");
  for (const item of report.results) {
    lines.push(`## ${item.id}`);
    lines.push(`- description: ${item.description}`);
    lines.push(`- expectGuardedApplied: \`${item.expectGuardedApplied}\``);
    lines.push(`- actualGuardedApplied: \`${item.guarded.event?.guarded?.applied === true}\``);
    lines.push(`- relation: \`${item.guarded.event?.decision?.relation || ""}\``);
    lines.push(`- guardedReason: \`${item.guarded.event?.guarded?.reason || ""}\``);
    lines.push(`- baseline answer: ${item.baseline.answer || item.baseline.error}`);
    lines.push(`- guarded answer: ${item.guarded.answer || item.guarded.error}`);
    lines.push(`- baseline promptTokens: \`${item.baseline.promptTokens}\``);
    lines.push(`- guarded promptTokens: \`${item.guarded.promptTokens}\``);
    lines.push(`- promptReductionRatio: \`${item.promptReductionRatio}\``);
    lines.push(`- rawReductionRatio: \`${Number(item.guarded.event?.scorecard?.rawReductionRatio || 0).toFixed(4)}\``);
    if (item.guarded.event?.exportPath) {
      lines.push(`- export: \`${item.guarded.event.exportPath}\``);
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
const timeoutMs = Number(readFlag("--timeout-ms", "90000")) || 90000;
const casesPath = path.resolve(repoRoot, readFlag("--cases", "evals/openclaw-guarded-live-ab-cases.js"));
const writeJson = path.resolve(repoRoot, readFlag("--write-json", `reports/openclaw-guarded-live-ab-${today}.json`));
const writeMarkdown = path.resolve(repoRoot, readFlag("--write-markdown", `reports/generated/openclaw-guarded-live-ab-${today}.md`));
const outputRoot = path.resolve(
  repoRoot,
  readFlag("--output-dir", `reports/generated/openclaw-guarded-live-ab-${today}`)
);

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
    console.error(`[guarded-live-ab] ${caseDef.id} baseline`);
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
    console.error(`[guarded-live-ab] ${caseDef.id} guarded`);
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

    const baselinePromptTokens = Number(baseline.promptTokens || 0);
    const guardedPromptTokens = Number(guarded.promptTokens || 0);
    const promptReductionRatio = baselinePromptTokens > 0
      ? Number(((baselinePromptTokens - guardedPromptTokens) / baselinePromptTokens).toFixed(4))
      : 0;

    results.push({
      id: caseDef.id,
      description: caseDef.description,
      expectGuardedApplied: caseDef.expectGuardedApplied === true,
      baseline,
      guarded,
      promptReductionRatio
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
