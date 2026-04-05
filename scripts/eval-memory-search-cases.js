#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { retrieveMemoryCandidates, extractJsonPayload } from "../src/retrieval.js";
import { scoreCandidates } from "../src/scoring.js";
import { buildAssemblyResult } from "../src/assembly.js";
import { resolvePluginConfig } from "../src/config.js";
import { resolvePluginPreset } from "../src/presets.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultCasesPath = path.resolve(__dirname, "../evals/memory-search-cases.json");

function parseArgs(argv) {
  const options = {
    preset: "safe-local",
    casesPath: defaultCasesPath,
    only: [],
    commandTimeoutMs: 15000,
    builtinMaxResults: 20
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
    } else if (arg === "--builtin-max-results") {
      options.builtinMaxResults = Number(argv[++index] || 20);
    }
  }

  return options;
}

function textIncludesAny(text, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  return patterns.some((pattern) => text.includes(pattern));
}

function textIncludesAll(text, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  return patterns.every((pattern) => text.includes(pattern));
}

function valueMatchesExpectedSource(value, expectedSources = []) {
  if (!expectedSources.length) {
    return true;
  }
  return expectedSources.some((pattern) => String(value || "").includes(pattern));
}

function classifySource(pathValue, sourceValue) {
  const pathText = String(pathValue || "");
  const sourceText = String(sourceValue || "");
  if (sourceText) {
    return sourceText;
  }
  if (pathText.includes("MEMORY.md")) {
    return "MEMORY.md";
  }
  if (pathText.includes("memory/")) {
    return "memory/%";
  }
  if (pathText.includes("sessions/")) {
    return "sessions/%";
  }
  if (pathText.includes("README.md")) {
    return "README.md";
  }
  if (pathText.includes("project-roadmap.md")) {
    return "project-roadmap.md";
  }
  return "unknown";
}

function summarizeSources(items) {
  const counts = {};
  for (const item of items) {
    const key = classifySource(item?.path, item?.source);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function inferFastPath(candidates) {
  return Array.isArray(candidates) && candidates.length > 0 && candidates.every((item) => item?.source === "cardArtifact");
}

async function runBuiltinSearch(query, config, options) {
  const args = [
    "memory",
    "search",
    "--agent",
    "main",
    "--query",
    query,
    "--max-results",
    String(options.builtinMaxResults),
    "--json"
  ];

  try {
    const { stdout } = await execFileAsync(config.openclawCommand, args, {
      maxBuffer: 4 * 1024 * 1024,
      timeout: Number(options.commandTimeoutMs) > 0 ? Number(options.commandTimeoutMs) : undefined
    });
    const parsed = extractJsonPayload(stdout);
    return {
      ok: true,
      results: Array.isArray(parsed?.results) ? parsed.results : [],
      error: null,
      rawStdout: stdout
    };
  } catch (error) {
    const stdout = String(error?.stdout || "");
    const stderr = String(error?.stderr || "");
    try {
      const parsed = extractJsonPayload(stdout);
      return {
        ok: false,
        results: Array.isArray(parsed?.results) ? parsed.results : [],
        error: String(error?.message || error),
        rawStdout: stdout,
        rawStderr: stderr
      };
    } catch {
      return {
        ok: false,
        results: [],
        error: String(error?.message || error),
        rawStdout: stdout,
        rawStderr: stderr
      };
    }
  }
}

async function runCase(testCase, config, options) {
  const builtin = await runBuiltinSearch(testCase.query, config, options);
  const builtinResults = builtin.results;
  const builtinText = builtinResults
    .map((item) => `${item?.path || ""}\n${item?.snippet || ""}`)
    .join("\n");
  const builtinExpectedSignalsHit = textIncludesAll(builtinText, testCase.expectedSignals || []);
  const builtinExpectedSourceHit = (testCase.expectedSources || []).length === 0
    ? true
    : builtinResults.some((item) => valueMatchesExpectedSource(item?.path, testCase.expectedSources));

  const rawCandidates = await retrieveMemoryCandidates({
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

  const fastPathLikely = inferFastPath(rawCandidates);
  const ranked = scoreCandidates(rawCandidates, testCase.query, config.weights);
  const assembly = buildAssemblyResult({
    messages: [{ role: "user", content: testCase.query, timestamp: Date.now() }],
    tokenBudget: 4096,
    memoryBudgetRatio: config.memoryBudgetRatio,
    recentMessageCount: config.recentMessageCount,
    maxSelectedChunks: config.maxSelectedChunks,
    maxChunksPerPath: config.maxChunksPerPath,
    candidates: ranked.map((item) => ({ ...item, finalScore: item.weightedScore }))
  });

  const selectedText = assembly.selectedCandidates
    .map((item) => `${item?.path || ""}\n${item?.snippet || ""}`)
    .join("\n");
  const pluginExpectedSignalsHit = textIncludesAll(selectedText, testCase.expectedSignals || []);
  const pluginExpectedSourceHit = (testCase.expectedSources || []).length === 0
    ? true
    : assembly.selectedCandidates.some(
        (item) =>
          valueMatchesExpectedSource(item?.path, testCase.expectedSources) ||
          valueMatchesExpectedSource(item?.source, testCase.expectedSources)
      );

  return {
    id: testCase.id,
    category: testCase.category || "memory_search",
    query: testCase.query,
    risk: testCase.risk || "",
    expectedSignals: testCase.expectedSignals || [],
    expectedSources: testCase.expectedSources || [],
    builtin: {
      commandOk: builtin.ok,
      error: builtin.error,
      totalResults: builtinResults.length,
      expectedSignalsHit: builtinExpectedSignalsHit,
      expectedSourceHit: builtinExpectedSourceHit,
      topSources: summarizeSources(builtinResults),
      topResults: builtinResults.slice(0, 5).map((item) => ({
        path: item?.path || "",
        source: classifySource(item?.path, item?.source),
        score: Number(item?.score || 0),
        snippet: item?.snippet || ""
      }))
    },
    plugin: {
      fastPathLikely,
      candidateCount: rawCandidates.length,
      expectedSignalsHit: pluginExpectedSignalsHit,
      expectedSourceHit: pluginExpectedSourceHit,
      topSources: summarizeSources(assembly.selectedCandidates),
      selected: assembly.selectedCandidates.slice(0, 5).map((item) => ({
        path: item?.path || "",
        source: item?.source || "",
        score: Number(item?.finalScore ?? item?.weightedScore ?? 0),
        snippet: item?.snippet || ""
      }))
    }
  };
}

const options = parseArgs(process.argv.slice(2));
const preset = resolvePluginPreset(options.preset);
const config = resolvePluginConfig(preset);
let cases = JSON.parse(await fs.readFile(options.casesPath, "utf8"));

if (options.only.length > 0) {
  const allow = new Set(options.only);
  cases = cases.filter((item) => allow.has(item.id));
}

const results = [];
for (const testCase of cases) {
  console.error(`[eval:memory-search] running ${testCase.id} query="${testCase.query}"`);
  results.push(await runCase(testCase, config, options));
}

const summary = {
  preset: options.preset,
  cases: results.length,
  builtinSignalHits: results.filter((item) => item.builtin.expectedSignalsHit).length,
  builtinSourceHits: results.filter((item) => item.builtin.expectedSourceHit).length,
  pluginSignalHits: results.filter((item) => item.plugin.expectedSignalsHit).length,
  pluginSourceHits: results.filter((item) => item.plugin.expectedSourceHit).length,
  pluginFastPathLikely: results.filter((item) => item.plugin.fastPathLikely).length
};

console.log(JSON.stringify({ summary, results }, null, 2));
