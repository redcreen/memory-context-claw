#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createTemporaryCodexHome,
  normalizeString,
  runStructuredCodexPrompt
} from "../src/codex-structured-runner.js";
import { estimateTokenCountFromText } from "../src/utils.js";
import { buildShadowContextSnapshot } from "../src/dialogue-working-set-shadow.js";
import {
  buildWorkingSetDecisionPrompt,
  buildWorkingSetDecisionSchema
} from "../src/dialogue-working-set-llm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultCasesPath = path.resolve(repoRoot, "evals/dialogue-working-set-answer-ab-cases.js");

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

function includesAny(text, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  const haystack = String(text || "").toLowerCase();
  return patterns.some((pattern) => haystack.includes(String(pattern || "").toLowerCase()));
}

function includesAll(text, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  const haystack = String(text || "").toLowerCase();
  return patterns.every((pattern) => haystack.includes(String(pattern || "").toLowerCase()));
}

function excludesAll(text, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  const haystack = String(text || "").toLowerCase();
  return patterns.every((pattern) => !haystack.includes(String(pattern || "").toLowerCase()));
}

function evaluateAnswer(caseDef, answerText) {
  const checks = [
    {
      name: "expected_any",
      passed: includesAny(answerText, caseDef.expectedAny || []),
      expected: caseDef.expectedAny || [],
      actual: answerText
    },
    {
      name: "expected_all",
      passed: includesAll(answerText, caseDef.expectedAll || []),
      expected: caseDef.expectedAll || [],
      actual: answerText
    },
    {
      name: "forbidden_any",
      passed: excludesAll(answerText, caseDef.forbiddenAny || []),
      expected: caseDef.forbiddenAny || [],
      actual: answerText
    }
  ];

  return {
    passed: checks.every((item) => item.passed),
    checks
  };
}

function buildAnswerSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    additionalProperties: false,
    required: ["answer"],
    properties: {
      answer: {
        type: "string"
      }
    }
  };
}

function buildAnswerPrompt(caseDef, contextText) {
  return [
    "Answer the latest user message using only the context below.",
    "Do not use tools, shell commands, or repository inspection.",
    "If the conversation context is insufficient, answer exactly: I don't know based on current context.",
    "",
    `Case: ${caseDef.id}`,
    `Description: ${caseDef.description}`,
    "",
    "Context:",
    contextText
  ].join("\n");
}

function buildBaselineAnswerPrompt(caseDef) {
  const transcript = caseDef.transcript
    .map((turn) => `${turn.id} ${turn.role}: ${turn.content}`)
    .join("\n");
  return buildAnswerPrompt(caseDef, transcript);
}

function buildShadowAnswerPrompt(caseDef, snapshot) {
  return buildAnswerPrompt(
    caseDef,
    snapshot.shadowPackageText || snapshot.shadowRawTranscript || "(none)"
  );
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

function classifyOutcome(item) {
  const baseline = item.baseline?.passed === true;
  const shadow = item.shadow?.passed === true;
  if (baseline && shadow) return "both_pass";
  if (!baseline && shadow) return "shadow_only";
  if (baseline && !shadow) return "baseline_only";
  return "both_fail";
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Dialogue Working-Set Answer A/B");
  lines.push("");
  lines.push(`- model: \`${report.model}\``);
  lines.push(`- reasoning effort: \`${report.reasoningEffort}\``);
  lines.push(`- cases: \`${report.summary.total}\``);
  lines.push(`- baselinePassed: \`${report.summary.baselinePassed}\``);
  lines.push(`- shadowPassed: \`${report.summary.shadowPassed}\``);
  lines.push(`- bothPass: \`${report.summary.bothPass}\``);
  lines.push(`- shadowOnly: \`${report.summary.shadowOnly}\``);
  lines.push(`- baselineOnly: \`${report.summary.baselineOnly}\``);
  lines.push(`- bothFail: \`${report.summary.bothFail}\``);
  lines.push(`- average estimated prompt reduction ratio: \`${report.summary.averagePromptReductionRatio}\``);
  lines.push(`- average baseline elapsed ms: \`${report.summary.averageBaselineElapsedMs}\``);
  lines.push(`- average shadow elapsed ms: \`${report.summary.averageShadowElapsedMs}\``);
  lines.push("");

  for (const result of report.results) {
    lines.push(`## ${result.id}`);
    lines.push(`- description: ${result.description}`);
    lines.push(`- decision relation: \`${result.decision.payload.relation}\``);
    lines.push(`- decision raw reduction ratio: \`${result.snapshot.applied.reductionRatio.toFixed(4)}\``);
    lines.push(`- outcome: \`${classifyOutcome(result)}\``);
    lines.push(`- baseline prompt estimate: \`${result.baseline.promptEstimate}\``);
    lines.push(`- shadow prompt estimate: \`${result.shadow.promptEstimate}\``);
    lines.push(`- prompt reduction ratio: \`${result.promptReductionRatio.toFixed(4)}\``);
    lines.push(`- baseline elapsed ms: \`${result.baseline.elapsedMs}\``);
    lines.push(`- shadow elapsed ms: \`${result.shadow.elapsedMs}\``);
    lines.push(`- baseline answer: ${result.baseline.answer}`);
    lines.push(`- shadow answer: ${result.shadow.answer}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

const only = normalizeString(readFlag("--only", ""));
const format = normalizeString(readFlag("--format", "json"));
const model = normalizeString(readFlag("--model", "gpt-5.4"));
const reasoningEffort = normalizeString(readFlag("--reasoning-effort", "low"), "low");
const casesPath = path.resolve(repoRoot, readFlag("--cases", defaultCasesPath));

const allCases = await importCases(casesPath);
const selectedCases = allCases.filter((item) => !only || normalizeString(item.id) === only);
if (!selectedCases.length) {
  throw new Error("No dialogue answer A/B cases selected.");
}

const codexHome = await createTemporaryCodexHome(reasoningEffort);

try {
  const results = [];

  for (const caseDef of selectedCases) {
    console.error(`[dialogue-answer-ab] running ${caseDef.id}`);
    const decision = await runStructuredCodexPrompt({
      prompt: buildWorkingSetDecisionPrompt(caseDef),
      schema: buildWorkingSetDecisionSchema(),
      model,
      reasoningEffort,
      cwd: repoRoot,
      codexHome
    });
    const snapshot = buildShadowContextSnapshot({
      turns: caseDef.transcript,
      decision: decision.payload
    });

    const baselinePrompt = buildBaselineAnswerPrompt(caseDef);
    const shadowPrompt = buildShadowAnswerPrompt(caseDef, snapshot);
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

    const baselineEval = evaluateAnswer(caseDef, baselineRun.answer);
    const shadowEval = evaluateAnswer(caseDef, shadowRun.answer);
    const promptReductionRatio = baselineRun.promptEstimate > 0
      ? (baselineRun.promptEstimate - shadowRun.promptEstimate) / baselineRun.promptEstimate
      : 0;

    results.push({
      id: caseDef.id,
      description: caseDef.description,
      decision,
      snapshot,
      baseline: {
        ...baselineRun,
        ...baselineEval
      },
      shadow: {
        ...shadowRun,
        ...shadowEval
      },
      promptReductionRatio
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    model,
    reasoningEffort,
    summary: {
      total: results.length,
      baselinePassed: results.filter((item) => item.baseline.passed).length,
      shadowPassed: results.filter((item) => item.shadow.passed).length,
      bothPass: results.filter((item) => item.baseline.passed && item.shadow.passed).length,
      shadowOnly: results.filter((item) => !item.baseline.passed && item.shadow.passed).length,
      baselineOnly: results.filter((item) => item.baseline.passed && !item.shadow.passed).length,
      bothFail: results.filter((item) => !item.baseline.passed && !item.shadow.passed).length,
      averagePromptReductionRatio: results.length
        ? Number((results.reduce((sum, item) => sum + item.promptReductionRatio, 0) / results.length).toFixed(4))
        : 0,
      averageBaselineElapsedMs: results.length
        ? Number((results.reduce((sum, item) => sum + item.baseline.elapsedMs, 0) / results.length).toFixed(1))
        : 0,
      averageShadowElapsedMs: results.length
        ? Number((results.reduce((sum, item) => sum + item.shadow.elapsedMs, 0) / results.length).toFixed(1))
        : 0
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

  if (report.summary.shadowPassed < report.summary.total) {
    process.exitCode = 1;
  }
} finally {
  await fs.rm(codexHome, { recursive: true, force: true });
}
