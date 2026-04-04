#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const casesPath = path.resolve(__dirname, "../evals/agent-regression-cases.json");

function includesAny(text, patterns) {
  if (!patterns || patterns.length === 0) {
    return true;
  }
  return patterns.some((pattern) => text.includes(pattern));
}

function includesSources(text, expectedSources) {
  if (!expectedSources || expectedSources.length === 0) {
    return true;
  }
  return expectedSources.every((pattern) => text.includes(pattern));
}

async function runCase(testCase, index) {
  const sessionId = `codex-agent-regression-${Date.now()}-${index}`;
  const { stdout } = await execFileAsync(
    "openclaw",
    [
      "agent",
      "--agent",
      "main",
      "--session-id",
      sessionId,
      "--message",
      testCase.message,
      "--json"
    ],
    {
      maxBuffer: 4 * 1024 * 1024,
      timeout: testCase.timeoutMs || 90_000
    }
  );

  const payload = JSON.parse(stdout);
  const text = payload?.result?.payloads?.map((item) => item?.text || "").join("\n") || "";
  const contentOk = includesAny(text, testCase.expectedAny || []);
  const sourceOk = includesSources(text, testCase.expectedSources || []);
  return {
    name: testCase.name,
    message: testCase.message,
    ok: contentOk && (testCase.requireSources ? sourceOk : true),
    contentOk,
    sourceOk,
    requireSources: Boolean(testCase.requireSources),
    expectedAny: testCase.expectedAny || [],
    expectedSources: testCase.expectedSources || [],
    answer: text
  };
}

const cases = JSON.parse(await fs.readFile(casesPath, "utf8"));
const results = [];

for (const [index, testCase] of cases.entries()) {
  results.push(await runCase(testCase, index));
}

const summary = {
  cases: results.length,
  passed: results.filter((item) => item.ok).length,
  failed: results.filter((item) => !item.ok).length
};

console.log(JSON.stringify({ summary, results }, null, 2));

if (summary.failed > 0) {
  process.exit(1);
}
