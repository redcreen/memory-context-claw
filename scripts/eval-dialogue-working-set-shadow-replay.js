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
import {
  buildShadowContextSnapshot,
  sliceTurnsThroughId
} from "../src/dialogue-working-set-shadow.js";
import {
  buildWorkingSetDecisionPrompt,
  buildWorkingSetDecisionSchema
} from "../src/dialogue-working-set-llm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultCasesPath = path.resolve(repoRoot, "evals/dialogue-working-set-shadow-cases.js");

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

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Dialogue Working-Set Shadow Replay");
  lines.push("");
  lines.push(`- model: \`${report.model}\``);
  lines.push(`- reasoning effort: \`${report.reasoningEffort}\``);
  lines.push(`- checkpoints: \`${report.summary.checkpoints}\``);
  lines.push(`- passed: \`${report.summary.passed}/${report.summary.checkpoints}\``);
  lines.push(`- average raw reduction ratio: \`${report.summary.average_raw_reduction_ratio}\``);
  lines.push(`- average shadow-package reduction ratio: \`${report.summary.average_shadow_package_reduction_ratio}\``);
  lines.push(`- relation counts: \`${JSON.stringify(report.summary.relation_counts)}\``);
  lines.push("");

  for (const caseReport of report.caseReports) {
    lines.push(`## ${caseReport.id}`);
    lines.push(`- description: ${caseReport.description}`);
    lines.push(`- checkpoints: \`${caseReport.checkpoints.length}\``);
    lines.push("");

    for (const checkpoint of caseReport.checkpoints) {
      lines.push(`### ${checkpoint.turnId}`);
      lines.push(`- passed: \`${checkpoint.passed}\``);
      lines.push(`- relation: \`${checkpoint.payload.relation}\``);
      lines.push(`- elapsed ms: \`${checkpoint.elapsedMs}\``);
      lines.push(`- baseline raw estimate: \`${checkpoint.snapshot.baselinePromptEstimate}\``);
      lines.push(`- shadow raw estimate: \`${checkpoint.snapshot.shadowRawPromptEstimate}\``);
      lines.push(`- shadow package estimate: \`${checkpoint.snapshot.shadowPackageEstimate}\``);
      lines.push(`- raw reduction ratio: \`${checkpoint.snapshot.applied.reductionRatio.toFixed(4)}\``);
      lines.push(`- shadow package reduction ratio: \`${checkpoint.shadowPackageReductionRatio.toFixed(4)}\``);
      lines.push(`- evict_turn_ids: \`${JSON.stringify(checkpoint.snapshot.applied.appliedEvictTurnIds)}\``);
      lines.push(`- pin_turn_ids: \`${JSON.stringify(checkpoint.snapshot.applied.pinTurnIds)}\``);
      lines.push(`- archive_summary: ${checkpoint.payload.archive_summary}`);
      lines.push(`- reasoning_summary: ${checkpoint.payload.reasoning_summary}`);
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

async function runCheckpoint({
  caseDef,
  checkpoint,
  model,
  reasoningEffort,
  codexHome
}) {
  const turns = sliceTurnsThroughId(caseDef.transcript, checkpoint.turn_id);
  const promptCase = {
    id: `${caseDef.id}:${checkpoint.turn_id}`,
    description: caseDef.description,
    transcript: turns
  };
  const result = await runStructuredCodexPrompt({
    prompt: buildWorkingSetDecisionPrompt(promptCase),
    schema: buildWorkingSetDecisionSchema(),
    model,
    reasoningEffort,
    cwd: repoRoot,
    codexHome
  });
  const evaluation = evaluateWorkingSetDecision(
    {
      transcript: turns,
      expected: checkpoint.expected || {}
    },
    result.payload
  );
  const snapshot = buildShadowContextSnapshot({
    turns,
    decision: result.payload
  });
  const shadowPackageReductionRatio = snapshot.baselinePromptEstimate > 0
    ? (snapshot.baselinePromptEstimate - snapshot.shadowPackageEstimate) / snapshot.baselinePromptEstimate
    : 0;

  return {
    turnId: checkpoint.turn_id,
    payload: result.payload,
    usage: result.usage,
    elapsedMs: result.elapsedMs,
    stderr: result.stderr,
    passed: evaluation.passed,
    checks: evaluation.checks,
    snapshot,
    shadowPackageReductionRatio
  };
}

const only = normalizeString(readFlag("--only", ""));
const format = normalizeString(readFlag("--format", "json"));
const model = normalizeString(readFlag("--model", "gpt-5.4"));
const reasoningEffort = normalizeString(readFlag("--reasoning-effort", "low"), "low");
const casesPath = path.resolve(repoRoot, readFlag("--cases", defaultCasesPath));

const allCases = await importCases(casesPath);
const selectedCases = allCases.filter((item) => !only || normalizeString(item.id) === only);
if (!selectedCases.length) {
  throw new Error("No dialogue shadow replay cases selected.");
}

const codexHome = await createTemporaryCodexHome(reasoningEffort);

try {
  const caseReports = [];

  for (const caseDef of selectedCases) {
    console.error(`[dialogue-shadow-replay] running ${caseDef.id} checkpoints=${caseDef.checkpoints.length}`);
    const checkpoints = [];

    for (const checkpoint of caseDef.checkpoints) {
      checkpoints.push(await runCheckpoint({
        caseDef,
        checkpoint,
        model,
        reasoningEffort,
        codexHome
      }));
    }

    caseReports.push({
      id: caseDef.id,
      description: caseDef.description,
      checkpoints
    });
  }

  const flatCheckpoints = caseReports.flatMap((item) => item.checkpoints);
  const relationCounts = flatCheckpoints.reduce((counts, item) => {
    const relation = normalizeString(item.payload?.relation, "unknown");
    counts[relation] = (counts[relation] || 0) + 1;
    return counts;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    model,
    reasoningEffort,
    summary: {
      checkpoints: flatCheckpoints.length,
      passed: flatCheckpoints.filter((item) => item.passed).length,
      failed: flatCheckpoints.filter((item) => !item.passed).length,
      average_raw_reduction_ratio: flatCheckpoints.length
        ? Number(
            (
              flatCheckpoints.reduce((sum, item) => sum + item.snapshot.applied.reductionRatio, 0)
              / flatCheckpoints.length
            ).toFixed(4)
          )
        : 0,
      average_shadow_package_reduction_ratio: flatCheckpoints.length
        ? Number(
            (
              flatCheckpoints.reduce((sum, item) => sum + item.shadowPackageReductionRatio, 0)
              / flatCheckpoints.length
            ).toFixed(4)
          )
        : 0,
      relation_counts: relationCounts
    },
    caseReports
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
  await fs.rm(codexHome, { recursive: true, force: true });
}
