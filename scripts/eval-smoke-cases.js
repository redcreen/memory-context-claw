#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { retrieveMemoryCandidates } from "../src/retrieval.js";
import { scoreCandidates } from "../src/scoring.js";
import { buildAssemblyResult } from "../src/assembly.js";
import { resolvePluginConfig } from "../src/config.js";
import { resolvePluginPreset } from "../src/presets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultCasesPath = path.resolve(__dirname, "../evals/smoke-cases.json");

function parseArgs(argv) {
  const options = {
    preset: "safe-local",
    casesPath: defaultCasesPath,
    only: [],
    categories: []
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
    } else if (arg === "--categories") {
      options.categories = String(argv[++index] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return options;
}

function includesAny(text, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  return patterns.some((pattern) => text.includes(pattern));
}

function pathIncludesAny(paths, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  return patterns.some((pattern) => paths.some((value) => String(value || "").includes(pattern)));
}

async function runCase(testCase, config) {
  const candidates = await retrieveMemoryCandidates({
    openclawCommand: config.openclawCommand,
    agentId: "main",
    query: testCase.query,
    maxCandidates: config.maxCandidates,
    excludePaths: config.excludePaths,
    queryRewrite: config.queryRewrite,
    cardArtifacts: config.cardArtifacts,
    logger: { warn: console.warn }
  });

  const ranked = scoreCandidates(candidates, testCase.query, config.weights);
  const assembly = buildAssemblyResult({
    messages: [{ role: "user", content: testCase.query, timestamp: Date.now() }],
    tokenBudget: 4096,
    memoryBudgetRatio: config.memoryBudgetRatio,
    recentMessageCount: config.recentMessageCount,
    maxSelectedChunks: config.maxSelectedChunks,
    maxChunksPerPath: config.maxChunksPerPath,
    candidates: ranked.map((item) => ({ ...item, finalScore: item.weightedScore }))
  });

  const top = ranked[0] || null;
  const selectedTexts = assembly.selectedCandidates.map((item) => String(item.snippet || ""));
  const selectedPaths = assembly.selectedCandidates.map((item) => String(item.path || ""));
  const selectedJoined = selectedTexts.join("\n");

  const topSourceOk = !testCase.expectedTopSource || top?.source === testCase.expectedTopSource;
  const selectedAnyOk = includesAny(selectedJoined, testCase.expectedSelectedAny || []);
  const selectedPathsOk = pathIncludesAny(selectedPaths, testCase.expectedSelectedPathsAny || []);

  return {
    name: testCase.name,
    category: testCase.category || "misc",
    query: testCase.query,
    ok: topSourceOk && selectedAnyOk && selectedPathsOk,
    top: top
      ? {
        path: top.path,
        source: top.source,
        snippet: top.snippet,
        score: top.weightedScore
      }
      : null,
    selected: assembly.selectedCandidates.map((item) => ({
      path: item.path,
      source: item.source,
      snippet: item.snippet,
      score: item.finalScore ?? item.weightedScore
    })),
    checks: {
      topSourceOk,
      selectedAnyOk,
      selectedPathsOk
    }
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

if (options.categories.length > 0) {
  const categoryAllow = new Set(options.categories);
  cases = cases.filter((item) => categoryAllow.has(item.category || "misc"));
}

const results = [];
for (const testCase of cases) {
  results.push(await runCase(testCase, config));
}

const summary = {
  preset: options.preset,
  cases: results.length,
  passed: results.filter((item) => item.ok).length,
  failed: results.filter((item) => !item.ok).length
};

console.log(JSON.stringify({ summary, results }, null, 2));

if (summary.failed > 0) {
  process.exit(1);
}
