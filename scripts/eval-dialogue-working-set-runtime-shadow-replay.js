#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createTemporaryCodexHome,
  normalizeString,
  runStructuredCodexPrompt
} from "../src/codex-structured-runner.js";
import { evaluateWorkingSetDecision } from "../src/dialogue-working-set.js";
import { ContextAssemblyEngine } from "../src/engine.js";
import { buildWorkingSetDecisionSchema } from "../src/dialogue-working-set-llm.js";

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
        const runId = `runtime-shadow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function buildMessages(transcript = []) {
  return transcript.map((turn) => ({
    role: turn.role,
    content: turn.content
  }));
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Dialogue Working-Set Runtime Shadow Replay");
  lines.push("");
  lines.push(`- model: \`${report.model}\``);
  lines.push(`- reasoning effort: \`${report.reasoningEffort}\``);
  lines.push(`- output dir: \`${report.outputDir}\``);
  lines.push(`- cases: \`${report.summary.total}\``);
  lines.push(`- captured: \`${report.summary.captured}\``);
  lines.push(`- passed: \`${report.summary.passed}\``);
  lines.push(`- failed: \`${report.summary.failed}\``);
  lines.push(`- average reduction ratio: \`${report.summary.averageReductionRatio}\``);
  lines.push(`- average shadow elapsed ms: \`${report.summary.averageShadowElapsedMs}\``);
  lines.push(`- relation counts: \`${JSON.stringify(report.summary.relationCounts)}\``);
  lines.push("");

  for (const item of report.results) {
    lines.push(`## ${item.id}`);
    lines.push(`- description: ${item.description}`);
    lines.push(`- session key: \`${item.sessionKey}\``);
    lines.push(`- captured: \`${item.captured}\``);
    lines.push(`- passed: \`${item.passed}\``);
    lines.push(`- relation: \`${item.decision?.relation || ""}\``);
    lines.push(`- reduction ratio: \`${Number(item.snapshot?.applied?.reductionRatio || 0).toFixed(4)}\``);
    lines.push(`- elapsed ms: \`${item.timings?.totalElapsedMs || 0}\``);
    lines.push(`- export: \`${item.exportPath || ""}\``);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

const format = normalizeString(readFlag("--format", "json"));
const model = normalizeString(readFlag("--model", "gpt-5.4"));
const reasoningEffort = normalizeString(readFlag("--reasoning-effort", "low"), "low");
const reuseExports = hasFlag("--reuse-exports");
const casesPath = path.resolve(
  repoRoot,
  readFlag("--cases", "evals/dialogue-working-set-shadow-cases.js")
);
const adversarialCasesPath = path.resolve(
  repoRoot,
  readFlag("--adversarial-cases", "evals/dialogue-working-set-adversarial-cases.js")
);
const outputDir = path.resolve(
  repoRoot,
  readFlag("--output-dir", "reports/generated/dialogue-working-set-runtime-shadow-2026-04-16")
);

const [shadowCases, adversarialCases] = await Promise.all([
  importCases(casesPath),
  importCases(adversarialCasesPath)
]);

const runDefs = [];
for (const caseDef of shadowCases) {
  for (const checkpoint of caseDef.checkpoints || []) {
    const cutoff = caseDef.transcript.findIndex((turn) => turn.id === checkpoint.turn_id);
    runDefs.push({
      id: `${caseDef.id}:${checkpoint.turn_id}`,
      description: caseDef.description,
      transcript: cutoff >= 0 ? caseDef.transcript.slice(0, cutoff + 1) : caseDef.transcript,
      expected: checkpoint.expected || {},
      sessionKey: `agent:stage6-shadow:${caseDef.id}:${checkpoint.turn_id}`
    });
  }
}
for (const caseDef of adversarialCases) {
  runDefs.push({
    id: caseDef.id,
    description: caseDef.description,
    transcript: caseDef.transcript,
    expected: caseDef.expected || {},
    sessionKey: `agent:stage6-adversarial:${caseDef.id}`
  });
}

if (!reuseExports) {
  await fs.rm(outputDir, { recursive: true, force: true });
}

const codexHome = reuseExports ? "" : await createTemporaryCodexHome(reasoningEffort);

try {
  if (!reuseExports) {
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
        dialogueWorkingSetShadow: {
          enabled: true,
          model,
          timeoutMs: 120000,
          outputDir
        }
      },
      retrievalFn: async () => []
    });

    for (const runDef of runDefs) {
      console.error(`[runtime-shadow-replay] running ${runDef.id}`);
      await engine.assemble({
        messages: buildMessages(runDef.transcript),
        tokenBudget: 4096,
        sessionKey: runDef.sessionKey
      });
    }
  }

  const exportEvents = await listExportEvents(outputDir);
  const results = runDefs.map((runDef) => {
    const event = findEventBySessionKey(exportEvents, runDef.sessionKey);
    const evaluation = event?.decision
      ? evaluateWorkingSetDecision(
          {
            transcript: runDef.transcript,
            expected: runDef.expected
          },
          event.decision
        )
      : { passed: false, checks: [] };

    return {
      id: runDef.id,
      description: runDef.description,
      sessionKey: runDef.sessionKey,
      captured: event?.status === "captured",
      passed: event?.status === "captured" && evaluation.passed,
      checks: evaluation.checks,
      decision: event?.decision || null,
      snapshot: event?.snapshot || null,
      timings: event?.timings || null,
      exportPath: event?.exportPath || ""
    };
  });

  const relationCounts = results.reduce((counts, item) => {
    const relation = normalizeString(item.decision?.relation, "unknown");
    counts[relation] = (counts[relation] || 0) + 1;
    return counts;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    model,
    reasoningEffort,
    outputDir,
    summary: {
      total: results.length,
      captured: results.filter((item) => item.captured).length,
      passed: results.filter((item) => item.passed).length,
      failed: results.filter((item) => !item.passed).length,
      averageReductionRatio: results.length
        ? Number(
            (
              results.reduce((sum, item) => sum + Number(item.snapshot?.applied?.reductionRatio || 0), 0)
              / results.length
            ).toFixed(4)
          )
        : 0,
      averageShadowElapsedMs: results.length
        ? Number(
            (
              results.reduce((sum, item) => sum + Number(item.timings?.totalElapsedMs || 0), 0)
              / results.length
            ).toFixed(1)
          )
        : 0,
      relationCounts
    },
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

  if (report.summary.failed > 0) {
    process.exitCode = 1;
  }
} finally {
  if (codexHome) {
    await fs.rm(codexHome, { recursive: true, force: true });
  }
}
