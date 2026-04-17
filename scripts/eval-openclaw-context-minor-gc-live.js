#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { evaluateAnswer, includesAny } from "../src/dialogue-working-set-answer-ab.js";
import { extractJsonPayload } from "../src/retrieval.js";
import {
  buildHermeticOpenClawConfig,
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

async function rewriteClonedStateConfig({
  stateDir,
  agentId,
  pluginPath,
  preset,
  includeUMC,
  agentModel,
  modelPath
}) {
  const agentDir = path.join(stateDir, "agents", agentId, "agent");
  const config = buildHermeticOpenClawConfig({
    agentId,
    agentDir,
    workspacePath: agentDir,
    modelPath,
    pluginPath,
    preset,
    includeUMC,
    agentModel
  });
  await fs.writeFile(path.join(stateDir, "openclaw.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

async function patchShadowConfig({
  stateDir,
  outputDir,
  shadowModel,
  reasoningEffort,
  transport,
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
    enabled: true,
    model: shadowModel,
    transport,
    reasoningEffort,
    timeoutMs,
    maxTurns: 12,
    minTurns: 3,
    maxCharsPerTurn: 900,
    outputDir,
    cleanupSession: true
  };
  pluginEntry.config.dialogueWorkingSetGuarded = {
    enabled: false,
    allowedRelations: ["switch", "resolve"],
    minReductionRatio: 0.18,
    minEvictedTurns: 1,
    prependCarryForward: true
  };

  await fs.mkdir(outputDir, { recursive: true });
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
      return value.length <= maxBuffer ? value : value.slice(value.length - maxBuffer);
    };

    const killTree = (signal = "SIGTERM") => {
      try {
        process.kill(-child.pid, signal);
      } catch {
        try {
          child.kill(signal);
        } catch {
          // ignore
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

async function clearSessions(stateDir, agentId) {
  const sessionsDir = path.join(stateDir, "agents", agentId, "sessions");
  await fs.rm(sessionsDir, { recursive: true, force: true });
  await fs.mkdir(sessionsDir, { recursive: true });
  await fs.writeFile(path.join(sessionsDir, "sessions.json"), "{}\n", "utf8");
}

async function readLatestShadowEvent(outputDir, sessionKey) {
  const exportsDir = path.join(outputDir, "exports");
  if (!(await pathExists(exportsDir))) {
    return null;
  }
  const files = (await fs.readdir(exportsDir))
    .filter((item) => item.endsWith(".json"))
    .sort();
  const matched = [];
  const fallback = [];
  for (const fileName of files) {
    const fullPath = path.join(exportsDir, fileName);
    const payload = JSON.parse(await fs.readFile(fullPath, "utf8"));
    const event = {
      ...payload,
      exportPath: fullPath
    };
    fallback.push(event);
    if (payload?.session_key === sessionKey) {
      matched.push(event);
    }
  }
  const sortByGeneratedAt = (left, right) => String(left.generated_at).localeCompare(String(right.generated_at));
  matched.sort(sortByGeneratedAt);
  fallback.sort(sortByGeneratedAt);
  return matched.at(-1) || fallback.at(-1) || null;
}

async function waitForShadowEvent(outputDir, sessionKey, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const event = await readLatestShadowEvent(outputDir, sessionKey);
    if (event) {
      return event;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
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

function evaluateRelation(caseDef, event) {
  const relation = normalizeString(
    event?.relation
    || event?.decision?.relation
    || event?.scorecard?.relation
  );
  const expected = Array.isArray(caseDef.expectedRelations) ? caseDef.expectedRelations : [];
  return {
    relation,
    passed: expected.length === 0 || expected.includes(relation),
    expected
  };
}

function evaluateReduction(caseDef, event) {
  const actual = Number(
    event?.reduction_ratio
    || event?.raw_reduction_ratio
    || event?.scorecard?.rawReductionRatio
    || 0
  );
  const min = Number(caseDef.minRawReductionRatio || 0);
  return {
    actual,
    min,
    passed: actual >= min
  };
}

function formatExpectation(caseDef) {
  return [
    Array.isArray(caseDef.expectedAll) && caseDef.expectedAll.length
      ? `expected_all=${JSON.stringify(caseDef.expectedAll)}`
      : "",
    Array.isArray(caseDef.expectedAny) && caseDef.expectedAny.length
      ? `expected_any=${JSON.stringify(caseDef.expectedAny)}`
      : "",
    Array.isArray(caseDef.forbiddenAny) && caseDef.forbiddenAny.length
      ? `forbidden_any=${JSON.stringify(caseDef.forbiddenAny)}`
      : "",
    Array.isArray(caseDef.expectedRelations) && caseDef.expectedRelations.length
      ? `relations=${JSON.stringify(caseDef.expectedRelations)}`
      : "",
    typeof caseDef.minRawReductionRatio === "number"
      ? `min_raw_reduction=${caseDef.minRawReductionRatio}`
      : ""
  ].filter(Boolean).join("; ");
}

async function warmBaseState({
  stateDir,
  agentId,
  shadowModel,
  reasoningEffort,
  transport,
  timeoutMs,
  outputRoot
}) {
  const warmupOutput = path.join(outputRoot, "_warmup");
  const warmupSessionId = "cmgc-warmup";
  await fs.rm(warmupOutput, { recursive: true, force: true });
  await patchShadowConfig({
    stateDir,
    outputDir: warmupOutput,
    shadowModel,
    reasoningEffort,
    transport,
    timeoutMs
  });
  for (const message of [
    "以后默认中文，只回复确认。",
    "现在切到别的话题：只回复确认。",
    "刚才我要求你默认用什么语言回复？只回复一个词。"
  ]) {
    await runAgentTurn({
      stateDir,
      agentId,
      sessionId: warmupSessionId,
      message,
      timeoutMs
    });
  }
  await clearSessions(stateDir, agentId);
  await fs.rm(warmupOutput, { recursive: true, force: true });
}

async function runCase({
  caseDef,
  warmedTemplate,
  agentId,
  pluginPath,
  preset,
  shadowModel,
  reasoningEffort,
  transport,
  timeoutMs,
  outputRoot,
  agentModel
}) {
  const stateDir = await cloneHermeticOpenClawState(warmedTemplate.stateDir, "umc-cmgc-live-");
  const sessionId = `${caseDef.id}-shadow`;
  const sessionKey = `agent:${agentId}:${sessionId}`;
  const outputDir = path.join(outputRoot, caseDef.id);

  try {
    await rewriteClonedStateConfig({
      stateDir,
      agentId,
      pluginPath,
      preset,
      includeUMC: true,
      agentModel,
      modelPath: warmedTemplate.embedModelPath
    });
    await patchShadowConfig({
      stateDir,
      outputDir,
      shadowModel,
      reasoningEffort,
      transport,
      timeoutMs
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
    const answerEval = evaluateAnswer(caseDef, answerText);
    const event = await waitForShadowEvent(outputDir, sessionKey, 15_000);
    const relationEval = evaluateRelation(caseDef, event);
    const reductionEval = evaluateReduction(caseDef, event);
    const promptTokens = extractPromptTokens(finalTurn.payload);
    const durationMs = extractDurationMs(finalTurn.payload);

    return {
      id: caseDef.id,
      description: caseDef.description,
      designQuestion: caseDef.turns.at(-1),
      expected: formatExpectation(caseDef),
      ok: finalTurn.ok === true,
      answer: answerText,
      error: finalTurn.ok === true ? "" : String(finalTurn.error || "run_failed"),
      turnsCompleted: turnResults.filter((item) => item.ok === true).length,
      promptTokens,
      durationMs,
      event,
      answerEval,
      relationEval,
      reductionEval,
      passed:
        finalTurn.ok === true
        && event?.status === "captured"
        && answerEval.passed
        && relationEval.passed
        && reductionEval.passed
    };
  } finally {
    await cleanupHermeticOpenClawState(stateDir);
  }
}

function summarize(results = []) {
  const total = results.length;
  const captured = results.filter((item) => item.event?.status === "captured").length;
  const answerPassed = results.filter((item) => item.answerEval?.passed === true).length;
  const relationPassed = results.filter((item) => item.relationEval?.passed === true).length;
  const reductionPassed = results.filter((item) => item.reductionEval?.passed === true).length;
  const fullyPassed = results.filter((item) => item.passed).length;
  const failures = results.filter((item) => !item.passed).length;
  return {
    total,
    captured,
    answerPassed,
    relationPassed,
    reductionPassed,
    passed: fullyPassed,
    failed: failures,
    averagePromptTokens: total
      ? Math.round(results.reduce((sum, item) => sum + Number(item.promptTokens || 0), 0) / total)
      : 0,
    averageDurationMs: total
      ? Math.round(results.reduce((sum, item) => sum + Number(item.durationMs || 0), 0) / total)
      : 0,
    averageRawReductionRatio: total
      ? Number((results.reduce((sum, item) => sum + Number(
        item.event?.reduction_ratio
        || item.event?.raw_reduction_ratio
        || item.event?.scorecard?.rawReductionRatio
        || 0
      ), 0) / total).toFixed(4))
      : 0,
    averagePackageReductionRatio: total
      ? Number((results.reduce((sum, item) => sum + Number(
        item.event?.package_reduction_ratio
        || item.event?.scorecard?.packageReductionRatio
        || 0
      ), 0) / total).toFixed(4))
      : 0,
    relationCounts: results.reduce((counts, item) => {
      const relation = normalizeString(item.relationEval?.relation);
      if (relation) {
        counts[relation] = (counts[relation] || 0) + 1;
      }
      return counts;
    }, {})
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# OpenClaw Context Minor GC Live Matrix");
  lines.push("");
  lines.push(`- generatedAt: \`${report.generatedAt}\``);
  lines.push(`- agentModel: \`${report.agentModel}\``);
  lines.push(`- shadowModel: \`${report.shadowModel}\``);
  lines.push(`- reasoningEffort: \`${report.reasoningEffort}\``);
  lines.push(`- transport: \`${report.transport}\``);
  lines.push(`- timeoutMs: \`${report.timeoutMs}\``);
  lines.push(`- total: \`${report.summary.total}\``);
  lines.push(`- captured: \`${report.summary.captured}/${report.summary.total}\``);
  lines.push(`- answerPassed: \`${report.summary.answerPassed}/${report.summary.total}\``);
  lines.push(`- relationPassed: \`${report.summary.relationPassed}/${report.summary.total}\``);
  lines.push(`- reductionPassed: \`${report.summary.reductionPassed}/${report.summary.total}\``);
  lines.push(`- passed: \`${report.summary.passed}/${report.summary.total}\``);
  lines.push(`- averagePromptTokens: \`${report.summary.averagePromptTokens}\``);
  lines.push(`- averageDurationMs: \`${report.summary.averageDurationMs}\``);
  lines.push(`- averageRawReductionRatio: \`${report.summary.averageRawReductionRatio}\``);
  lines.push(`- averagePackageReductionRatio: \`${report.summary.averagePackageReductionRatio}\``);
  lines.push(`- relationCounts: \`${JSON.stringify(report.summary.relationCounts)}\``);
  lines.push("");
  lines.push("## Method");
  lines.push("");
  lines.push("- Run inside a hermetic OpenClaw state with UMC enabled and `dialogueWorkingSetShadow=true`.");
  lines.push("- Keep `dialogueWorkingSetGuarded=false`, `ordinaryConversationMemory=false`, and `governedExports=false` so the matrix isolates Stage 7 context optimization telemetry instead of write-path behavior.");
  lines.push("- Prewarm the base state once, reset sessions, then clone that warmed template per case.");
  lines.push("- Every case is judged by four conditions together: final turn succeeded, shadow event captured, final answer matched the case expectation, and shadow relation/raw-reduction stayed inside the expected band.");
  lines.push("");
  for (const item of report.results) {
    lines.push(`## ${item.id}`);
    lines.push(`- description: ${item.description}`);
    lines.push(`- 设计的问题 -> ${item.designQuestion}`);
    lines.push(`- 预期的结果 -> ${item.expected}`);
    lines.push(`- 实际结果 -> ${item.answer || item.error}`);
    lines.push(`- captured -> \`${item.event?.status === "captured"}\``);
    lines.push(`- relation -> actual \`${item.relationEval.relation}\` expected \`${JSON.stringify(item.relationEval.expected)}\``);
    lines.push(`- rawReductionRatio -> actual \`${item.reductionEval.actual}\` min \`${item.reductionEval.min}\``);
    lines.push(`- promptTokens -> \`${item.promptTokens}\``);
    lines.push(`- durationMs -> \`${item.durationMs}\``);
    lines.push(`- export -> \`${item.event?.exportPath || ""}\``);
    lines.push(`- passed -> \`${item.passed}\``);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

const agentId = normalizeString(readFlag("--agent", "main"), "main");
const fixtureRoot = normalizeString(readFlag("--fixture-root"), "");
const pluginPath = normalizeString(readFlag("--plugin-path", repoRoot), repoRoot);
const embedModelPath = normalizeString(readFlag("--embed-model-path"), "");
const authProfilesPath = normalizeString(readFlag("--auth-profiles-path"), "");
const preset = normalizeString(readFlag("--preset", "safe-local"), "safe-local");
const format = normalizeString(readFlag("--format", "json"), "json");
const only = normalizeString(readFlag("--only", ""), "");
const maxCases = Number(readFlag("--max-cases", "0")) || 0;
const reasoningEffort = normalizeString(readFlag("--reasoning-effort", "low"), "low");
const transport = normalizeString(readFlag("--transport", "codex_exec"), "codex_exec");
const timeoutMs = Number(readFlag("--timeout-ms", "120000")) || 120000;
const casesPath = path.resolve(repoRoot, readFlag("--cases", "evals/openclaw-context-minor-gc-live-cases.js"));
const writeJson = path.resolve(repoRoot, readFlag("--write-json", `reports/openclaw-context-minor-gc-live-${today}.json`));
const writeMarkdown = path.resolve(repoRoot, readFlag("--write-markdown", `reports/generated/openclaw-context-minor-gc-live-${today}.md`));
const outputRoot = path.resolve(repoRoot, readFlag("--output-dir", `reports/generated/openclaw-context-minor-gc-live-${today}`));

const hostAgentModel = await resolveHostDefaultAgentModel();
const agentModel = normalizeString(readFlag("--agent-model", hostAgentModel), hostAgentModel);
const shadowModel = resolveDecisionModel(readFlag("--shadow-model", ""), agentModel);
const importedCases = await importCases(casesPath);
const selected = only
  ? importedCases.filter((item) => only.split(",").map((value) => value.trim()).filter(Boolean).includes(item.id))
  : importedCases;
const cases = maxCases > 0 ? selected.slice(0, maxCases) : selected;

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

const baseState = await createHermeticOpenClawState({
  agentId,
  includeUMC: true,
  fixtureRoot,
  pluginPath,
  embedModelPath,
  authProfilesPath,
  preset,
  agentModel
});

try {
  await warmBaseState({
    stateDir: baseState.stateDir,
    agentId,
    shadowModel,
    reasoningEffort,
    transport,
    timeoutMs,
    outputRoot
  });

  const results = [];
  for (const caseDef of cases) {
    console.error(`[context-minor-gc-live] ${caseDef.id}`);
    results.push(await runCase({
      caseDef,
      warmedTemplate: baseState,
      agentId,
      pluginPath,
      preset,
      shadowModel,
      reasoningEffort,
      transport,
      timeoutMs,
      outputRoot,
      agentModel
    }));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    agentId,
    agentModel,
    shadowModel,
    reasoningEffort,
    transport,
    timeoutMs,
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

  if (report.summary.passed < report.summary.total) {
    process.exitCode = 1;
  }
} finally {
  await cleanupHermeticOpenClawState(baseState.stateDir);
}
