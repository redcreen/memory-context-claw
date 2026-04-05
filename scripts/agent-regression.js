#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { extractJsonPayload } from "../src/retrieval.js";
import { extractHotSessionMeta } from "../src/hot-session-regression.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const casesPath = path.resolve(__dirname, "../evals/agent-regression-cases.json");
const LOG_PREFIX = "[eval:hot]";

function parseArgs(argv) {
  const args = {
    casesPath,
    only: [],
    timeoutMs: 90_000
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--cases") {
      args.casesPath = path.resolve(process.cwd(), argv[index + 1]);
      index += 1;
      continue;
    }
    if (value === "--only") {
      args.only = (argv[index + 1] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }
    if (value === "--timeout-ms") {
      args.timeoutMs = Number(argv[index + 1] || 90_000);
      index += 1;
    }
  }

  return args;
}

function includesAny(text, patterns) {
  if (!patterns || patterns.length === 0) {
    return true;
  }
  return patterns.some((pattern) => text.includes(pattern));
}

function includesAll(text, patterns) {
  if (!patterns || patterns.length === 0) {
    return true;
  }
  return patterns.every((pattern) => text.includes(pattern));
}

function excludesAll(text, patterns) {
  if (!patterns || patterns.length === 0) {
    return true;
  }
  return patterns.every((pattern) => !text.includes(pattern));
}

function includesSources(text, expectedSources) {
  if (!expectedSources || expectedSources.length === 0) {
    return true;
  }
  return expectedSources.every((pattern) => text.includes(pattern));
}

async function runCase(testCase, index, defaultTimeoutMs) {
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
      timeout: testCase.timeoutMs || defaultTimeoutMs || 90_000
    }
  );

  const payload = extractJsonPayload(stdout);
  const text = payload?.result?.payloads?.map((item) => item?.text || "").join("\n") || "";
  const hotSession = extractHotSessionMeta(payload, sessionId);
  const contentOk = includesAny(text, testCase.expectedAny || []);
  const contentAllOk = includesAll(text, testCase.expectedAll || []);
  const sourceOk = includesSources(text, testCase.expectedSources || []);
  const forbiddenOk = excludesAll(text, testCase.forbiddenAny || []);
  return {
    name: testCase.name,
    message: testCase.message,
    ok: contentOk && contentAllOk && forbiddenOk && (testCase.requireSources ? sourceOk : true),
    contentOk,
    contentAllOk,
    sourceOk,
    forbiddenOk,
    requireSources: Boolean(testCase.requireSources),
    expectedAny: testCase.expectedAny || [],
    expectedAll: testCase.expectedAll || [],
    expectedSources: testCase.expectedSources || [],
    forbiddenAny: testCase.forbiddenAny || [],
    answer: text,
    hotSession,
    note: hotSession.hotMainAlias
      ? "Result came from hot main session; treat as hot-session health check, not isolated-session baseline."
      : undefined
  };
}

const cliArgs = parseArgs(process.argv.slice(2));
let cases = JSON.parse(await fs.readFile(cliArgs.casesPath, "utf8"));
if (cliArgs.only.length > 0) {
  const allowSet = new Set(cliArgs.only);
  cases = cases.filter((testCase) => allowSet.has(testCase.name));
}

if (cases.length === 0) {
  console.error("No agent regression cases selected.");
  process.exit(1);
}

const results = [];

for (const [index, testCase] of cases.entries()) {
  const startedAt = new Date().toISOString();
  console.error(
    `${LOG_PREFIX} running ${testCase.name} timeout=${testCase.timeoutMs || cliArgs.timeoutMs}ms at ${startedAt}`
  );
  try {
    const result = await runCase(testCase, index, cliArgs.timeoutMs);
    results.push(result);
    console.error(
      `${LOG_PREFIX} finished ${testCase.name} ok=${result.ok} contentAny=${result.contentOk} contentAll=${result.contentAllOk} forbiddenOk=${result.forbiddenOk} isolated=${result.hotSession?.isolated ?? false} observedSessionKey=${result.hotSession?.observedSessionKey || "-"}`
    );
  } catch (error) {
    const message = String(error?.message || error);
    results.push({
      name: testCase.name,
      message: testCase.message,
      ok: false,
      contentOk: false,
      contentAllOk: false,
      sourceOk: false,
      forbiddenOk: true,
      requireSources: Boolean(testCase.requireSources),
      expectedAny: testCase.expectedAny || [],
      expectedAll: testCase.expectedAll || [],
      expectedSources: testCase.expectedSources || [],
      forbiddenAny: testCase.forbiddenAny || [],
      answer: "",
      error: message
    });
    console.error(`${LOG_PREFIX} failed ${testCase.name}: ${message}`);
  }
}

const summary = {
  cases: results.length,
  passed: results.filter((item) => item.ok).length,
  failed: results.filter((item) => !item.ok).length,
  isolated: results.filter((item) => item.hotSession?.isolated).length,
  hotMainAlias: results.filter((item) => item.hotSession?.hotMainAlias).length,
  matchedRequestedSessionId: results.filter((item) => item.hotSession?.matchedRequestedSessionId).length
};

if (summary.hotMainAlias > 0 && summary.isolated === 0) {
  summary.note = "All cases ran against the hot main session; treat failures as hot-session health signals, not clean isolated-session regressions.";
}

console.log(JSON.stringify({ summary, results }, null, 2));

if (summary.failed > 0) {
  process.exit(1);
}
