#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { retrieveMemoryCandidates } from "../src/retrieval.js";
import { scoreCandidates } from "../src/scoring.js";
import { buildAssemblyResult } from "../src/assembly.js";
import { resolvePluginConfig } from "../src/config.js";
import { resolvePluginPreset } from "../src/presets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultCasesPath = path.resolve(__dirname, "../evals/perf-cases.json");

function parseArgs(argv) {
  const options = {
    preset: "safe-local",
    casesPath: defaultCasesPath,
    only: [],
    commandTimeoutMs: 15000
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--preset") {
      options.preset = argv[++index];
    } else if (arg === "--cases") {
      options.casesPath = path.resolve(process.cwd(), argv[++index]);
    } else if (arg === "--only") {
      options.only = String(argv[++index] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (arg === "--timeout-ms") {
      options.commandTimeoutMs = Number(argv[++index] || 0);
    }
  }

  return options;
}

async function runCase(testCase, config, options) {
  const retrievalStart = performance.now();
  const candidates = await retrieveMemoryCandidates({
    openclawCommand: config.openclawCommand,
    agentId: "main",
    query: testCase.query,
    maxCandidates: config.maxCandidates,
    commandTimeoutMs: options.commandTimeoutMs,
    excludePaths: config.excludePaths,
    queryRewrite: config.queryRewrite,
    cardArtifacts: config.cardArtifacts,
    logger: { warn: console.warn }
  });
  const retrievalMs = performance.now() - retrievalStart;

  const scoringStart = performance.now();
  const ranked = scoreCandidates(candidates, testCase.query, config.weights);
  const scoringMs = performance.now() - scoringStart;

  const assemblyStart = performance.now();
  const assembly = buildAssemblyResult({
    messages: [{ role: "user", content: testCase.query, timestamp: Date.now() }],
    tokenBudget: 4096,
    memoryBudgetRatio: config.memoryBudgetRatio,
    recentMessageCount: config.recentMessageCount,
    maxSelectedChunks: config.maxSelectedChunks,
    maxChunksPerPath: config.maxChunksPerPath,
    candidates: ranked.map((item) => ({ ...item, finalScore: item.weightedScore }))
  });
  const assemblyMs = performance.now() - assemblyStart;

  const totalMs = retrievalMs + scoringMs + assemblyMs;
  const withinSoft = totalMs <= Number(testCase.softLimitMs || Infinity);
  const withinHard = totalMs <= Number(testCase.hardLimitMs || Infinity);

  return {
    name: testCase.name,
    query: testCase.query,
    softLimitMs: testCase.softLimitMs,
    hardLimitMs: testCase.hardLimitMs,
    retrievalMs: Math.round(retrievalMs),
    scoringMs: Math.round(scoringMs),
    assemblyMs: Math.round(assemblyMs),
    totalMs: Math.round(totalMs),
    candidateCount: candidates.length,
    selectedCount: assembly.selectedCandidates.length,
    withinSoft,
    withinHard
  };
}

const options = parseArgs(process.argv.slice(2));
const preset = resolvePluginPreset(options.preset);
const config = resolvePluginConfig(preset);
let cases = JSON.parse(await fs.readFile(options.casesPath, "utf8"));

if (options.only.length > 0) {
  const allow = new Set(options.only);
  cases = cases.filter((item) => allow.has(item.name));
}

const results = [];
for (const testCase of cases) {
  const startedAt = new Date().toISOString();
  console.error(
    `[eval:perf] running ${testCase.name} (soft=${testCase.softLimitMs}ms hard=${testCase.hardLimitMs}ms timeout=${options.commandTimeoutMs}ms) at ${startedAt}`
  );
  try {
    const result = await runCase(testCase, config, options);
    results.push(result);
    console.error(
      `[eval:perf] finished ${testCase.name} total=${result.totalMs}ms retrieval=${result.retrievalMs}ms scoring=${result.scoringMs}ms assembly=${result.assemblyMs}ms candidates=${result.candidateCount}`
    );
  } catch (error) {
    const message = String(error?.message || error);
    results.push({
      name: testCase.name,
      query: testCase.query,
      softLimitMs: testCase.softLimitMs,
      hardLimitMs: testCase.hardLimitMs,
      retrievalMs: null,
      scoringMs: null,
      assemblyMs: null,
      totalMs: null,
      candidateCount: 0,
      selectedCount: 0,
      withinSoft: false,
      withinHard: false,
      error: message
    });
    console.error(`[eval:perf] failed ${testCase.name}: ${message}`);
  }
}

const completedResults = results.filter((item) => Number.isFinite(item.totalMs));

const summary = {
  preset: options.preset,
  cases: results.length,
  softExceeded: results.filter((item) => !item.withinSoft).length,
  hardExceeded: results.filter((item) => !item.withinHard).length,
  failures: results.filter((item) => item.error).length,
  averageTotalMs: completedResults.length
    ? Math.round(
        completedResults.reduce((sum, item) => sum + item.totalMs, 0) /
          completedResults.length
      )
    : 0
};

console.log(JSON.stringify({ summary, results }, null, 2));

if (summary.hardExceeded > 0 || summary.failures > 0) {
  process.exit(1);
}
