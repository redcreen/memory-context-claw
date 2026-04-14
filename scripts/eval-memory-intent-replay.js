#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultCasesPath = path.resolve(repoRoot, "evals/memory-intent-replay-cases.json");

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

function normalizeStringArray(values) {
  return Array.isArray(values)
    ? values.map((item) => normalizeString(item)).filter(Boolean)
    : [];
}

function jsonEscape(value) {
  return JSON.stringify(value);
}

function buildPrompt(caseDef) {
  const transcript = Array.isArray(caseDef.transcript)
    ? caseDef.transcript
      .map((turn) => `${normalizeString(turn.role, "assistant")}: ${normalizeString(turn.content)}`)
      .join("\n")
    : "";

  return [
    "You are replaying one real chat conversation turn. Return JSON only via the provided schema.",
    "",
    "Task:",
    "1. Produce the assistant's user-visible reply for the LAST user message.",
    "2. Separately produce a structured memory extraction describing whether this last user message should be written into durable memory.",
    "3. Judge memory from the user's final message in context, not in isolation.",
    "4. Be strict: temporary task instructions are not durable memory. Long-lived user preferences, operating rules, routing preferences, and reusable behavior rules are durable.",
    "",
    "Assume the runtime can keep the JSON hidden from the user and only show user_visible_reply.",
    "",
    "Conversation context:",
    `- Channel: ${normalizeString(caseDef.channel, "unknown")}`,
    `- Session key: ${normalizeString(caseDef.sessionKey, "unknown")}`,
    `- Description: ${normalizeString(caseDef.description, "none")}`,
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
    required: ["user_visible_reply", "memory_extraction"],
    properties: {
      user_visible_reply: { type: "string" },
      memory_extraction: {
        type: "object",
        additionalProperties: false,
        required: ["should_write_memory", "category", "durability", "confidence", "summary", "structured_rule"],
        properties: {
          should_write_memory: { type: "boolean" },
          category: {
            type: "string",
            enum: [
              "none",
              "session_constraint",
              "task_instruction",
              "durable_rule",
              "tool_routing_preference",
              "user_profile_fact"
            ]
          },
          durability: {
            type: "string",
            enum: ["none", "session", "durable"]
          },
          confidence: { type: "number" },
          summary: { type: "string" },
          structured_rule: {
            anyOf: [
              { type: "null" },
              {
                type: "object",
                additionalProperties: false,
                required: ["trigger", "action"],
                properties: {
                  trigger: {
                    type: "object",
                    additionalProperties: false,
                    required: ["content_kind", "domains"],
                    properties: {
                      content_kind: { type: "string" },
                      domains: {
                        type: "array",
                        items: { type: "string" }
                      }
                    }
                  },
                  action: {
                    type: "object",
                    additionalProperties: false,
                    required: ["tool"],
                    properties: {
                      tool: { type: "string" }
                    }
                  }
                }
              }
            ]
          }
        }
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
    try {
      return JSON.parse(lines[index]);
    } catch {}
  }

  throw new Error("No JSON payload found in codex exec output.");
}

function evaluateResult(caseDef, payload) {
  const expected = caseDef.expected || {};
  const extraction = payload?.memory_extraction || {};
  const structuredRule = extraction?.structured_rule || {};
  const trigger = structuredRule?.trigger || {};
  const action = structuredRule?.action || {};
  const domains = normalizeStringArray(trigger.domains);

  const checks = [
    {
      name: "should_write_memory",
      passed: extraction.should_write_memory === expected.should_write_memory,
      expected: expected.should_write_memory,
      actual: extraction.should_write_memory
    },
    {
      name: "category",
      passed: extraction.category === expected.category,
      expected: expected.category,
      actual: extraction.category
    },
    {
      name: "durability",
      passed: extraction.durability === expected.durability,
      expected: expected.durability,
      actual: extraction.durability
    },
    {
      name: "min_confidence",
      passed: Number(extraction.confidence || 0) >= Number(expected.min_confidence || 0),
      expected: `>= ${expected.min_confidence}`,
      actual: extraction.confidence
    },
    {
      name: "tool",
      passed: normalizeString(action.tool) === normalizeString(expected.tool),
      expected: expected.tool,
      actual: action.tool
    },
    {
      name: "domains",
      passed: normalizeStringArray(expected.domains).every((domain) => domains.includes(domain)),
      expected: expected.domains,
      actual: domains
    }
  ];

  return {
    passed: checks.every((item) => item.passed),
    checks
  };
}

async function runCase(caseDef, {
  model = "gpt-5.4",
  cwd = repoRoot
} = {}) {
  const schemaPath = path.join(os.tmpdir(), `umc-memory-intent-schema-${process.pid}-${Date.now()}.json`);
  await fs.writeFile(schemaPath, `${JSON.stringify(buildSchema(), null, 2)}\n`, "utf8");

  try {
    const prompt = buildPrompt(caseDef);
    const { stdout, stderr } = await execFileAsync(
      "codex",
      [
        "exec",
        "-m",
        model,
        "--ephemeral",
        "--color",
        "never",
        "--output-schema",
        schemaPath,
        "--skip-git-repo-check",
        "-C",
        cwd,
        "-"
      ],
      {
        cwd,
        maxBuffer: 16 * 1024 * 1024,
        input: prompt
      }
    );

    const payload = extractJsonObject(stdout);
    const evaluation = evaluateResult(caseDef, payload);

    return {
      id: caseDef.id,
      model,
      passed: evaluation.passed,
      payload,
      checks: evaluation.checks,
      stderr: String(stderr || "")
    };
  } finally {
    await fs.rm(schemaPath, { force: true });
  }
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Memory Intent Replay Eval");
  lines.push("");
  lines.push(`- model: \`${report.model}\``);
  lines.push(`- passed: \`${report.summary.passed}/${report.summary.cases}\``);
  lines.push("");

  for (const result of report.results) {
    lines.push(`## ${result.id}`);
    lines.push(`- passed: \`${result.passed}\``);
    lines.push(`- category: \`${result.payload?.memory_extraction?.category || ""}\``);
    lines.push(`- durability: \`${result.payload?.memory_extraction?.durability || ""}\``);
    lines.push(`- confidence: \`${result.payload?.memory_extraction?.confidence ?? ""}\``);
    lines.push(`- reply: ${result.payload?.user_visible_reply || ""}`);
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

const casesPath = path.resolve(repoRoot, readFlag("--cases", defaultCasesPath));
const only = normalizeString(readFlag("--only", ""));
const format = normalizeString(readFlag("--format", "json"));
const model = normalizeString(readFlag("--model", "gpt-5.4"));

const parsed = JSON.parse(await fs.readFile(casesPath, "utf8"));
const selectedCases = (Array.isArray(parsed) ? parsed : []).filter((item) =>
  !only || normalizeString(item.id) === only
);

if (selectedCases.length === 0) {
  throw new Error("No memory-intent replay cases selected.");
}

const results = [];
for (const caseDef of selectedCases) {
  console.error(`[memory-intent-eval] running ${caseDef.id} model=${model}`);
  results.push(await runCase(caseDef, { model }));
}

const report = {
  generatedAt: new Date().toISOString(),
  model,
  casesPath,
  summary: {
    cases: results.length,
    passed: results.filter((item) => item.passed).length,
    failed: results.filter((item) => !item.passed).length
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
