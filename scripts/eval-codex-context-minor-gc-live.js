#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createTemporaryCodexHome,
  normalizeString,
  runStructuredCodexPrompt
} from "../src/codex-structured-runner.js";
import { createCodexAdapterRuntime } from "../src/codex-adapter.js";
import { buildAnswerSchema, evaluateAnswer } from "../src/dialogue-working-set-answer-ab.js";

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

async function importCases(casesPath) {
  const moduleUrl = pathToFileURL(casesPath).href;
  const imported = await import(moduleUrl);
  const cases = imported.default || imported.cases || [];
  if (!Array.isArray(cases)) {
    throw new Error(`Case module did not export an array: ${casesPath}`);
  }
  return cases;
}

function buildMessages(transcript = []) {
  return (Array.isArray(transcript) ? transcript : []).map((turn) => ({
    role: turn.role,
    content: turn.content
  }));
}

function buildAdapterAnswerPrompt(caseDef, promptBlock, policyBlock = "") {
  const sections = [
    "Answer the latest user request using only the packaged context below.",
    "Do not use tools, shell commands, or repository inspection.",
    "If the packaged context is insufficient, answer exactly: I don't know based on current context.",
    "",
    `Case: ${normalizeString(caseDef?.id, "codex-context-minor-gc")}`,
    `Description: ${normalizeString(caseDef?.description, "codex Context Minor GC live evaluation")}`,
    "",
    `Current request: ${normalizeString(caseDef?.taskPrompt)}`,
    policyBlock ? `Policy:\n${policyBlock}` : "",
    `Prompt package:\n${normalizeString(promptBlock, "(none)")}`
  ].filter(Boolean);

  return sections.join("\n");
}

async function runAnswer({
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
    elapsedMs: result.elapsedMs,
    usage: result.usage
  };
}

function summarize(results = []) {
  const applied = results.filter((item) => item.minorGc.context_minor_gc.applied === true);
  const average = (values = []) => {
    if (!values.length) {
      return 0;
    }
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4));
  };

  return {
    total: results.length,
    baselinePassed: results.filter((item) => item.baseline.passed).length,
    minorGcPassed: results.filter((item) => item.minorGc.passed).length,
    guardedApplied: applied.length,
    activationMatched: results.filter(
      (item) => item.minorGc.context_minor_gc.applied === item.expectedGuardedApplied
    ).length,
    falseActivations: results.filter(
      (item) => item.minorGc.context_minor_gc.applied === true && item.expectedGuardedApplied !== true
    ).length,
    missedActivations: results.filter(
      (item) => item.minorGc.context_minor_gc.applied !== true && item.expectedGuardedApplied === true
    ).length,
    averagePromptReductionRatio: average(
      results.map((item) => Number(item.minorGc.context_minor_gc.promptReductionRatio || 0))
    ),
    appliedOnlyPromptReductionRatio: average(
      applied.map((item) => Number(item.minorGc.context_minor_gc.promptReductionRatio || 0))
    ),
    appliedOnlyPackageReductionRatio: average(
      applied.map((item) => Number(item.minorGc.context_minor_gc.event?.scorecard?.packageReductionRatio || 0))
    )
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Codex Context Minor GC Live Matrix");
  lines.push("");
  lines.push(`- model: \`${report.model}\``);
  lines.push(`- reasoning effort: \`${report.reasoningEffort}\``);
  lines.push(`- cases: \`${report.summary.total}\``);
  lines.push(`- baseline passed: \`${report.summary.baselinePassed}\``);
  lines.push(`- minor-gc passed: \`${report.summary.minorGcPassed}\``);
  lines.push(`- guarded applied: \`${report.summary.guardedApplied}\``);
  lines.push(`- activation matched: \`${report.summary.activationMatched}\``);
  lines.push(`- false activations: \`${report.summary.falseActivations}\``);
  lines.push(`- missed activations: \`${report.summary.missedActivations}\``);
  lines.push(`- average prompt reduction ratio: \`${report.summary.averagePromptReductionRatio}\``);
  lines.push(`- applied-only prompt reduction ratio: \`${report.summary.appliedOnlyPromptReductionRatio}\``);
  lines.push(`- applied-only package reduction ratio: \`${report.summary.appliedOnlyPackageReductionRatio}\``);
  lines.push("");

  for (const item of report.results) {
    lines.push(`## ${item.id}`);
    lines.push(`- description: ${item.description}`);
    lines.push(`- expectedGuardedApplied: \`${item.expectedGuardedApplied}\``);
    lines.push(`- actualGuardedApplied: \`${item.minorGc.context_minor_gc.applied}\``);
    lines.push(`- relation: \`${item.minorGc.context_minor_gc.relation}\``);
    lines.push(`- baseline answer: ${item.baseline.answer}`);
    lines.push(`- minor-gc answer: ${item.minorGc.answer}`);
    lines.push(`- prompt reduction ratio: \`${item.minorGc.context_minor_gc.promptReductionRatio}\``);
    lines.push(`- export: \`${item.minorGc.context_minor_gc.event?.artifact_paths?.export || ""}\``);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

const model = normalizeString(readFlag("--model", "gpt-5.4"));
const reasoningEffort = normalizeString(readFlag("--reasoning-effort", "low"), "low");
const format = normalizeString(readFlag("--format", "json"));
const casesPath = path.resolve(
  repoRoot,
  readFlag("--cases", "evals/codex-context-minor-gc-live-cases.js")
);
const outputDir = path.resolve(
  repoRoot,
  readFlag("--output-dir", "reports/generated/codex-context-minor-gc-live-2026-04-18")
);

const cases = await importCases(casesPath);
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-minor-gc-live-"));
const codexHome = await createTemporaryCodexHome(reasoningEffort);

try {
  const adapter = createCodexAdapterRuntime({
    logger: { warn() {}, info() {} },
    config: {
      registryDir: registryRoot,
      projectPath: repoRoot,
      userId: "codex-live-eval",
      contextMinorGc: {
        enabled: true,
        model,
        transport: "codex_exec",
        reasoningEffort,
        timeoutMs: 120000,
        outputDir,
        guarded: {
          enabled: true
        }
      }
    }
  });

  const results = [];

  for (const caseDef of cases) {
    console.error(`[codex-context-minor-gc-live] running ${caseDef.id}`);
    const recentMessages = buildMessages(caseDef.transcript);
    const baselinePackage = await adapter.readBeforeTask({
      taskPrompt: caseDef.taskPrompt,
      recentMessages,
      contextMinorGc: {
        enabled: false
      }
    });
    const minorGcPackage = await adapter.readBeforeTask({
      taskPrompt: caseDef.taskPrompt,
      recentMessages,
      contextMinorGcSessionKey: `codex:${caseDef.id}`,
      contextMinorGc: {
        enabled: true,
        model,
        reasoningEffort,
        transport: "codex_exec",
        outputDir,
        guarded: {
          enabled: true
        }
      }
    });

    const baselinePrompt = buildAdapterAnswerPrompt(
      caseDef,
      baselinePackage.prompt_block,
      baselinePackage.policy_block
    );
    const minorGcPrompt = buildAdapterAnswerPrompt(
      caseDef,
      minorGcPackage.prompt_block,
      minorGcPackage.policy_block
    );

    const [baselineAnswer, minorGcAnswer] = await Promise.all([
      runAnswer({
        prompt: baselinePrompt,
        model,
        reasoningEffort,
        codexHome
      }),
      runAnswer({
        prompt: minorGcPrompt,
        model,
        reasoningEffort,
        codexHome
      })
    ]);

    results.push({
      id: caseDef.id,
      description: caseDef.description,
      expectedGuardedApplied: caseDef.expectedGuardedApplied === true,
      baseline: {
        ...baselineAnswer,
        ...evaluateAnswer(caseDef, baselineAnswer.answer),
        promptEstimate: minorGcPackage.context_minor_gc.baselinePromptEstimate
      },
      minorGc: {
        ...minorGcAnswer,
        ...evaluateAnswer(caseDef, minorGcAnswer.answer),
        context_minor_gc: minorGcPackage.context_minor_gc
      }
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

  const jsonPath = path.join(outputDir, "report.json");
  const markdownPath = path.join(outputDir, "report.md");
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(markdownPath, renderMarkdown(report), "utf8");

  if (format === "markdown") {
    process.stdout.write(renderMarkdown(report));
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
} finally {
  await fs.rm(registryRoot, { recursive: true, force: true });
  await fs.rm(codexHome, { recursive: true, force: true });
}
