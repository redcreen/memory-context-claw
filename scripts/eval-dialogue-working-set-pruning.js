#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import cases from "../evals/dialogue-working-set-pruning-cases.js";
import { evaluateWorkingSetDecision } from "../src/dialogue-working-set.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultCodexHome = path.join(os.homedir(), ".codex");

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

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function jsonEscape(value) {
  return JSON.stringify(value);
}

function buildPrompt(caseDef) {
  const transcript = caseDef.transcript
    .map((turn) => `${turn.id} ${turn.role}: ${turn.content}`)
    .join("\n");

  return [
    "You are producing one hidden runtime decision for a chat system.",
    "Do not use tools, shell commands, or repository inspection.",
    "Use only the transcript provided below and return the final structured decision directly.",
    "",
    "Goal:",
    "- shrink the NEXT-TURN raw prompt working set when earlier topics are resolved or irrelevant",
    "- never delete the session log",
    "- preserve unresolved tasks and still-relevant topic context",
    "- preserve durable user facts, preferences, and rules as semantic pins when raw turns can leave the prompt",
    "",
    "Important constraints:",
    "- the latest user turn is always kept by the runtime; do not list it in evict_turn_ids",
    "- pin_turn_ids means the semantic content should survive as a compact pin or capsule even if the raw turn is evicted",
    "- use relation=continue for the same active topic",
    "- use relation=branch for a side question while an older task is still open",
    "- use relation=switch when the active topic changed and the old raw block can leave the next-turn prompt",
    "- use relation=resolve when the conversation mostly closes and only pins + the latest user turn should remain",
    "- be strict: off-topic status snapshots and solved blocks are good eviction candidates",
    "",
    `Case: ${caseDef.id}`,
    `Description: ${caseDef.description}`,
    "",
    "Transcript:",
    transcript
  ].join("\n");
}

function buildSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    additionalProperties: false,
    required: [
      "relation",
      "confidence",
      "evict_turn_ids",
      "pin_turn_ids",
      "archive_summary",
      "reasoning_summary"
    ],
    properties: {
      relation: {
        type: "string",
        enum: ["continue", "branch", "switch", "resolve"]
      },
      confidence: {
        type: "number"
      },
      evict_turn_ids: {
        type: "array",
        items: { type: "string" }
      },
      pin_turn_ids: {
        type: "array",
        items: { type: "string" }
      },
      archive_summary: {
        type: "string"
      },
      reasoning_summary: {
        type: "string"
      }
    }
  };
}

function extractJsonObject(stdout) {
  const lines = String(stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];

    try {
      const parsed = JSON.parse(line);
      const messageText = parsed?.item?.type === "agent_message"
        ? normalizeString(parsed.item.text)
        : "";

      if (messageText) {
        return JSON.parse(messageText);
      }

      if (parsed?.type === "turn.completed") {
        continue;
      }

      if (typeof parsed === "object" && parsed && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        const looksLikePayload = [
          "relation",
          "confidence",
          "evict_turn_ids",
          "pin_turn_ids",
          "archive_summary",
          "reasoning_summary"
        ].every((key) => keys.includes(key));

        if (looksLikePayload) {
          return parsed;
        }
      }
    } catch {}
  }

  throw new Error("No JSON payload found in codex exec output.");
}

async function createTemporaryCodexHome(reasoningEffort = "low") {
  const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-home-"));
  const filesToCopy = ["auth.json", "config.toml"];

  for (const fileName of filesToCopy) {
    const sourcePath = path.join(defaultCodexHome, fileName);
    const targetPath = path.join(tempHome, fileName);
    try {
      await fs.copyFile(sourcePath, targetPath);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const configPath = path.join(tempHome, "config.toml");
  let configContent = "";

  try {
    configContent = await fs.readFile(configPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  if (/^model_reasoning_effort\s*=.*$/m.test(configContent)) {
    configContent = configContent.replace(
      /^model_reasoning_effort\s*=.*$/m,
      `model_reasoning_effort = ${JSON.stringify(reasoningEffort)}`
    );
  } else {
    configContent = `${configContent.trimEnd()}\nmodel_reasoning_effort = ${JSON.stringify(reasoningEffort)}\n`;
  }

  await fs.writeFile(configPath, configContent, "utf8");

  return tempHome;
}

async function runCase(caseDef, {
  model = "gpt-5.4",
  cwd = repoRoot,
  codexHome
} = {}) {
  const promptPath = path.join(
    os.tmpdir(),
    `umc-working-set-prompt-${process.pid}-${Date.now()}-${caseDef.id}.txt`
  );
  const schemaPath = path.join(
    os.tmpdir(),
    `umc-working-set-schema-${process.pid}-${Date.now()}-${caseDef.id}.json`
  );
  await fs.writeFile(promptPath, `${buildPrompt(caseDef)}\n`, "utf8");
  await fs.writeFile(schemaPath, `${JSON.stringify(buildSchema(), null, 2)}\n`, "utf8");

  try {
    const { stdout, stderr } = await execFileAsync(
      "zsh",
      [
        "-c",
        'codex exec --json -m "$MODEL_NAME" --ephemeral --color never --output-schema "$SCHEMA_PATH" --skip-git-repo-check -C "$WORKDIR_PATH" - < "$PROMPT_PATH"'
      ],
      {
        cwd,
        env: {
          ...process.env,
          MODEL_NAME: model,
          PROMPT_PATH: promptPath,
          SCHEMA_PATH: schemaPath,
          WORKDIR_PATH: cwd,
          ...(codexHome ? { CODEX_HOME: codexHome } : {})
        },
        maxBuffer: 16 * 1024 * 1024
      }
    );

    const payload = extractJsonObject(stdout);
    const evaluation = evaluateWorkingSetDecision(caseDef, payload);

    return {
      id: caseDef.id,
      description: caseDef.description,
      model,
      passed: evaluation.passed,
      payload,
      checks: evaluation.checks,
      applied: evaluation.applied,
      stderr: normalizeString(stderr)
    };
  } finally {
    await fs.rm(promptPath, { force: true });
    await fs.rm(schemaPath, { force: true });
  }
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
      codexHome
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
