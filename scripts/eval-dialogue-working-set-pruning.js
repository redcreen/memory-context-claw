#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { evaluateWorkingSetDecision } from "../src/dialogue-working-set.js";
import {
  createTemporaryCodexHome,
  normalizeString,
  runStructuredCodexPrompt
} from "../src/codex-structured-runner.js";
import {
  buildWorkingSetDecisionPrompt,
  buildWorkingSetDecisionSchema
} from "../src/dialogue-working-set-llm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultCasesPath = path.resolve(repoRoot, "evals/dialogue-working-set-pruning-cases.js");

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

function jsonEscape(value) {
  return JSON.stringify(value);
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

async function runCase(caseDef, {
  model = "gpt-5.4",
  cwd = repoRoot,
  codexHome,
  reasoningEffort = "low"
} = {}) {
  const result = await runStructuredCodexPrompt({
    prompt: buildWorkingSetDecisionPrompt(caseDef),
    schema: buildWorkingSetDecisionSchema(),
    model,
    reasoningEffort,
    cwd,
    codexHome
  });
  const evaluation = evaluateWorkingSetDecision(caseDef, result.payload);

  return {
    id: caseDef.id,
    description: caseDef.description,
    model,
    passed: evaluation.passed,
    payload: result.payload,
    checks: evaluation.checks,
    applied: evaluation.applied,
    stderr: result.stderr,
    usage: result.usage,
    elapsedMs: result.elapsedMs
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Dialogue Working-Set Pruning Eval");
  lines.push("");
  lines.push(`- model: \`${report.model}\``);
  lines.push(`- reasoning effort: \`${report.reasoningEffort}\``);
  lines.push(`- passed: \`${report.summary.passed}/${report.summary.cases}\``);
  lines.push(`- total baseline tokens: \`${report.summary.total_baseline_tokens}\``);
  lines.push(`- total kept tokens: \`${report.summary.total_kept_tokens}\``);
  lines.push(`- aggregate reduction ratio: \`${report.summary.aggregate_reduction_ratio}\``);
  lines.push(`- switch-case average reduction ratio: \`${report.summary.switch_case_average_reduction_ratio}\``);
  lines.push("");

  for (const result of report.results) {
    lines.push(`## ${result.id}`);
    lines.push(`- description: ${result.description}`);
    lines.push(`- passed: \`${result.passed}\``);
    lines.push(`- relation: \`${result.payload.relation}\``);
    lines.push(`- confidence: \`${result.payload.confidence}\``);
    lines.push(`- elapsed ms: \`${result.elapsedMs}\``);
    lines.push(`- baseline tokens: \`${result.applied.baselineTokens}\``);
    lines.push(`- kept tokens: \`${result.applied.keptTokens}\``);
    lines.push(`- reduction ratio: \`${result.applied.reductionRatio.toFixed(4)}\``);
    lines.push(`- evict_turn_ids: \`${JSON.stringify(result.applied.appliedEvictTurnIds)}\``);
    lines.push(`- pin_turn_ids: \`${JSON.stringify(result.applied.pinTurnIds)}\``);
    lines.push(`- pinned_only_turn_ids: \`${JSON.stringify(result.applied.pinnedOnlyTurnIds)}\``);
    lines.push(`- archive_summary: ${result.payload.archive_summary}`);
    lines.push(`- reasoning_summary: ${result.payload.reasoning_summary}`);
    lines.push("");
    lines.push("### Checks");
    for (const check of result.checks) {
      lines.push(`- ${check.name}: \`${check.passed ? "pass" : "fail"}\` expected=\`${jsonEscape(check.expected)}\` actual=\`${jsonEscape(check.actual)}\``);
    }
    lines.push("");
    lines.push("### Payload");
    lines.push("```json");
    lines.push(JSON.stringify(result.payload, null, 2));
    lines.push("```");
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

const only = normalizeString(readFlag("--only", ""));
const format = normalizeString(readFlag("--format", "json"));
const model = normalizeString(readFlag("--model", "gpt-5.4"));
const reasoningEffort = normalizeString(readFlag("--reasoning-effort", "low"), "low");
const casesPath = path.resolve(repoRoot, readFlag("--cases", defaultCasesPath));
const cases = await importCases(casesPath);

const selectedCases = cases.filter((item) => !only || normalizeString(item.id) === only);
if (selectedCases.length === 0) {
  throw new Error("No dialogue working-set pruning cases selected.");
}

const codexHome = await createTemporaryCodexHome(reasoningEffort);

try {
  const results = [];
  for (const caseDef of selectedCases) {
    console.error(
      `[dialogue-working-set-eval] running ${caseDef.id} model=${model} reasoning=${reasoningEffort}`
    );
    results.push(await runCase(caseDef, {
      model,
      codexHome,
      reasoningEffort
    }));
  }

  const totalBaselineTokens = results.reduce((sum, result) => sum + result.applied.baselineTokens, 0);
  const totalKeptTokens = results.reduce((sum, result) => sum + result.applied.keptTokens, 0);
  const switchResults = results.filter((result) => result.payload.relation === "switch");
  const report = {
    generatedAt: new Date().toISOString(),
    model,
    reasoningEffort,
    summary: {
      cases: results.length,
      passed: results.filter((item) => item.passed).length,
      failed: results.filter((item) => !item.passed).length,
      total_baseline_tokens: totalBaselineTokens,
      total_kept_tokens: totalKeptTokens,
      aggregate_reduction_ratio: totalBaselineTokens > 0
        ? Number(((totalBaselineTokens - totalKeptTokens) / totalBaselineTokens).toFixed(4))
        : 0,
      switch_case_average_reduction_ratio: switchResults.length > 0
        ? Number(
            (
              switchResults.reduce((sum, item) => sum + item.applied.reductionRatio, 0)
              / switchResults.length
            ).toFixed(4)
          )
        : 0
    },
    results
  };

  if (hasFlag("--write-json")) {
    const outPath = path.resolve(repoRoot, readFlag("--write-json"));
    await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  if (hasFlag("--write-markdown")) {
    const outPath = path.resolve(repoRoot, readFlag("--write-markdown"));
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
