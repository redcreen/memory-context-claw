#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createTemporaryCodexHome,
  normalizeString,
  runStructuredCodexPrompt
} from "../src/codex-structured-runner.js";
import {
  buildAnswerSchema,
  buildAssemblyAnswerPrompt,
  buildBaselineAnswerPrompt,
  buildShadowAnswerPrompt,
  evaluateAnswer
} from "../src/dialogue-working-set-answer-ab.js";
import { buildShadowContextSnapshot } from "../src/dialogue-working-set-shadow.js";
import { ContextAssemblyEngine } from "../src/engine.js";
import { buildWorkingSetDecisionSchema } from "../src/dialogue-working-set-llm.js";
import { estimateTokenCountFromText } from "../src/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

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

function createCodexSubagentRuntime({
  model,
  reasoningEffort,
  codexHome
}) {
  const sessions = new Map();
  const runs = new Map();

  return {
    subagent: {
      async run({ sessionKey, message, model: overrideModel }) {
        const runId = `guarded-answer-ab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const result = await runStructuredCodexPrompt({
          prompt: message,
          schema: buildWorkingSetDecisionSchema(),
          model: normalizeString(overrideModel, model),
          reasoningEffort,
          cwd: repoRoot,
          codexHome
        });
        sessions.set(sessionKey, {
          messages: [
            {
              role: "assistant",
              content: JSON.stringify(result.payload)
            }
          ],
          result
        });
        runs.set(runId, { sessionKey, result });
        return { runId };
      },
      async waitForRun({ runId }) {
        if (!runs.has(runId)) {
          return { status: "error", error: `missing run: ${runId}` };
        }
        return { status: "ok" };
      },
      async getSessionMessages({ sessionKey }) {
        return sessions.get(sessionKey) || { messages: [] };
      },
      async deleteSession({ sessionKey }) {
        sessions.delete(sessionKey);
      }
    }
  };
}

async function listExportEvents(outputDir) {
  const exportsDir = path.join(outputDir, "exports");
  let files = [];
  try {
    files = await fs.readdir(exportsDir);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const events = [];
  for (const fileName of files.filter((item) => item.endsWith(".json")).sort()) {
    const fullPath = path.join(exportsDir, fileName);
    const payload = JSON.parse(await fs.readFile(fullPath, "utf8"));
    events.push({
      ...payload,
      exportPath: fullPath
    });
  }
  return events;
}

function findEventBySessionKey(events, sessionKey) {
  return events.find((item) => item.session_key === sessionKey) || null;
}

function buildMessages(transcript = []) {
  return transcript.map((turn) => ({
    role: turn.role,
    content: turn.content
  }));
}

async function runAnswerPrompt({
  prompt,
  model,
  reasoningEffort,
  codexHome
}) {
  const result = await runStructuredCodexPrompt({
    prompt,
    schema: buildAnswerSchema(),
    model,
    reasoningEffort,
    cwd: repoRoot,
    codexHome
  });

  return {
    answer: normalizeString(result.payload?.answer),
    usage: result.usage,
    elapsedMs: result.elapsedMs,
    stderr: result.stderr,
    promptEstimate: estimateTokenCountFromText(prompt)
  };
}

function summarize(results = []) {
  return {
    total: results.length,
    baselinePassed: results.filter((item) => item.baseline.passed).length,
    shadowPassed: results.filter((item) => item.shadow.passed).length,
    guardedPassed: results.filter((item) => item.guarded.passed).length,
    bothShadowAndGuarded: results.filter((item) => item.shadow.passed && item.guarded.passed).length,
    guardedOnly: results.filter((item) => !item.baseline.passed && item.guarded.passed).length,
    guardedVsShadowWins: results.filter((item) => !item.shadow.passed && item.guarded.passed).length,
    baselineOnly: results.filter((item) => item.baseline.passed && !item.guarded.passed).length,
    bothFail: results.filter((item) => !item.baseline.passed && !item.guarded.passed).length,
    guardedApplied: results.filter((item) => item.guardedApplied).length,
    averageShadowPromptReductionRatio: results.length
      ? Number((results.reduce((sum, item) => sum + item.shadowPromptReductionRatio, 0) / results.length).toFixed(4))
      : 0,
    averageGuardedPromptReductionRatio: results.length
      ? Number((results.reduce((sum, item) => sum + item.guardedPromptReductionRatio, 0) / results.length).toFixed(4))
      : 0
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Dialogue Working-Set Guarded Answer A/B");
  lines.push("");
  lines.push(`- model: \`${report.model}\``);
  lines.push(`- reasoning effort: \`${report.reasoningEffort}\``);
  lines.push(`- output dir: \`${report.outputDir}\``);
  lines.push(`- cases: \`${report.summary.total}\``);
  lines.push(`- baseline passed: \`${report.summary.baselinePassed}\``);
  lines.push(`- shadow passed: \`${report.summary.shadowPassed}\``);
  lines.push(`- guarded passed: \`${report.summary.guardedPassed}\``);
  lines.push(`- guarded applied: \`${report.summary.guardedApplied}\``);
  lines.push(`- guarded only: \`${report.summary.guardedOnly}\``);
  lines.push(`- guarded vs shadow wins: \`${report.summary.guardedVsShadowWins}\``);
  lines.push(`- average shadow prompt reduction ratio: \`${report.summary.averageShadowPromptReductionRatio}\``);
  lines.push(`- average guarded prompt reduction ratio: \`${report.summary.averageGuardedPromptReductionRatio}\``);
  lines.push("");

  for (const result of report.results) {
    lines.push(`## ${result.id}`);
    lines.push(`- description: ${result.description}`);
    lines.push(`- guarded applied: \`${result.guardedApplied}\``);
    lines.push(`- relation: \`${result.event?.decision?.relation || ""}\``);
    lines.push(`- baseline answer: ${result.baseline.answer}`);
    lines.push(`- shadow answer: ${result.shadow.answer}`);
    lines.push(`- guarded answer: ${result.guarded.answer}`);
    lines.push(`- export: \`${result.event?.exportPath || ""}\``);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

const format = normalizeString(readFlag("--format", "json"));
const model = normalizeString(readFlag("--model", "gpt-5.4"));
const reasoningEffort = normalizeString(readFlag("--reasoning-effort", "low"), "low");
const casesPath = path.resolve(
  repoRoot,
  readFlag("--cases", "evals/dialogue-working-set-answer-ab-cases.js")
);
const outputDir = path.resolve(
  repoRoot,
  readFlag("--output-dir", "reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17")
);

const cases = await importCases(casesPath);
await fs.rm(outputDir, { recursive: true, force: true });
const codexHome = await createTemporaryCodexHome(reasoningEffort);

try {
  const runtime = createCodexSubagentRuntime({
    model,
    reasoningEffort,
    codexHome
  });
  const engine = new ContextAssemblyEngine({
    runtime,
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        model,
        timeoutMs: 120000,
        outputDir
      },
      dialogueWorkingSetGuarded: {
        enabled: true
      }
    },
    retrievalFn: async () => []
  });

  const assemblyResults = {};
  for (const caseDef of cases) {
    const sessionKey = `agent:stage9-guarded-answer-ab:${caseDef.id}`;
    console.error(`[guarded-answer-ab] capturing ${caseDef.id}`);
    assemblyResults[sessionKey] = await engine.assemble({
      messages: buildMessages(caseDef.transcript),
      tokenBudget: 4096,
      sessionKey
    });
  }

  const exportEvents = await listExportEvents(outputDir);
  const results = [];

  for (const caseDef of cases) {
    const sessionKey = `agent:stage9-guarded-answer-ab:${caseDef.id}`;
    const event = findEventBySessionKey(exportEvents, sessionKey);
    const assemblyResult = assemblyResults[sessionKey] || {};
    const snapshot = buildShadowContextSnapshot({
      turns: event?.transcript || caseDef.transcript,
      decision: event?.decision || {}
    });

    const baselinePrompt = buildBaselineAnswerPrompt(caseDef);
    const shadowPrompt = buildShadowAnswerPrompt(caseDef, snapshot);
    const guardedPrompt = buildAssemblyAnswerPrompt(caseDef, assemblyResult);

    const baselineRun = await runAnswerPrompt({
      prompt: baselinePrompt,
      model,
      reasoningEffort,
      codexHome
    });
    const shadowRun = await runAnswerPrompt({
      prompt: shadowPrompt,
      model,
      reasoningEffort,
      codexHome
    });
    const guardedRun = await runAnswerPrompt({
      prompt: guardedPrompt,
      model,
      reasoningEffort,
      codexHome
    });

    const baselineEval = evaluateAnswer(caseDef, baselineRun.answer);
    const shadowEval = evaluateAnswer(caseDef, shadowRun.answer);
    const guardedEval = evaluateAnswer(caseDef, guardedRun.answer);

    results.push({
      id: caseDef.id,
      description: caseDef.description,
      guardedApplied: event?.guarded?.applied === true,
      event: event ? { ...event, snapshot } : null,
      baseline: {
        ...baselineRun,
        ...baselineEval
      },
      shadow: {
        ...shadowRun,
        ...shadowEval
      },
      guarded: {
        ...guardedRun,
        ...guardedEval
      },
      shadowPromptReductionRatio: baselineRun.promptEstimate > 0
        ? (baselineRun.promptEstimate - shadowRun.promptEstimate) / baselineRun.promptEstimate
        : 0,
      guardedPromptReductionRatio: baselineRun.promptEstimate > 0
        ? (baselineRun.promptEstimate - guardedRun.promptEstimate) / baselineRun.promptEstimate
        : 0
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    model,
    reasoningEffort,
    outputDir,
    summary: summarize(results),
    results
  };

  if (hasFlag("--write-json")) {
    const outPath = path.resolve(repoRoot, readFlag("--write-json"));
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  if (hasFlag("--write-markdown")) {
    const outPath = path.resolve(repoRoot, readFlag("--write-markdown"));
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, renderMarkdown(report), "utf8");
  }

  if (format === "markdown") {
    process.stdout.write(renderMarkdown(report));
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
} finally {
  await fs.rm(codexHome, { recursive: true, force: true });
}
