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
const casesPath = path.resolve(__dirname, "../evals/agent-regression-cases.json");

function buildMessages(query) {
  return [{ role: "user", content: query, timestamp: Date.now() }];
}

function summarizeAssembly(assembly) {
  return {
    selectedCount: assembly.selectedCandidates.length,
    promptAdditionChars: assembly.systemPromptAddition.length,
    selectedPaths: assembly.selectedCandidates.map((item) => item.path)
  };
}

async function compareCase(testCase, enabledConfig, disabledConfig) {
  const rawCandidates = await retrieveMemoryCandidates({
    openclawCommand: enabledConfig.openclawCommand,
    agentId: "main",
    query: testCase.message,
    maxCandidates: enabledConfig.maxCandidates,
    excludePaths: enabledConfig.excludePaths,
    queryRewrite: enabledConfig.queryRewrite,
    logger: { warn: console.warn }
  });

  const ranked = scoreCandidates(rawCandidates, testCase.message, enabledConfig.weights).map(
    (item) => ({
      ...item,
      finalScore: item.weightedScore
    })
  );

  const enabledAssembly = buildAssemblyResult({
    messages: buildMessages(testCase.message),
    tokenBudget: 4096,
    memoryBudgetRatio: enabledConfig.memoryBudgetRatio,
    recentMessageCount: enabledConfig.recentMessageCount,
    maxSelectedChunks: enabledConfig.maxSelectedChunks,
    maxChunksPerPath: enabledConfig.maxChunksPerPath,
    candidates: ranked
  });

  const disabledAssembly = buildAssemblyResult({
    messages: buildMessages(testCase.message),
    tokenBudget: 4096,
    memoryBudgetRatio: disabledConfig.memoryBudgetRatio,
    recentMessageCount: disabledConfig.recentMessageCount,
    maxSelectedChunks: disabledConfig.maxSelectedChunks,
    maxChunksPerPath: disabledConfig.maxChunksPerPath,
    candidates: []
  });

  return {
    name: testCase.name,
    query: testCase.message,
    enabled: summarizeAssembly(enabledAssembly),
    disabled: summarizeAssembly(disabledAssembly),
    delta: {
      selectedCount:
        enabledAssembly.selectedCandidates.length - disabledAssembly.selectedCandidates.length,
      promptAdditionChars:
        enabledAssembly.systemPromptAddition.length - disabledAssembly.systemPromptAddition.length
    }
  };
}

const preset = resolvePluginPreset("safe-local");
const enabledConfig = resolvePluginConfig(preset);
const disabledConfig = resolvePluginConfig({ ...preset, enabled: false });
const cases = JSON.parse(await fs.readFile(casesPath, "utf8"));

const results = [];
for (const testCase of cases) {
  results.push(await compareCase(testCase, enabledConfig, disabledConfig));
}

const summary = {
  cases: results.length,
  enabledSelectedCases: results.filter((item) => item.enabled.selectedCount > 0).length,
  disabledSelectedCases: results.filter((item) => item.disabled.selectedCount > 0).length,
  avgEnabledSelectedCount:
    results.reduce((sum, item) => sum + item.enabled.selectedCount, 0) / results.length,
  avgEnabledPromptAdditionChars:
    results.reduce((sum, item) => sum + item.enabled.promptAdditionChars, 0) / results.length,
  avgDisabledSelectedCount:
    results.reduce((sum, item) => sum + item.disabled.selectedCount, 0) / results.length,
  avgDisabledPromptAdditionChars:
    results.reduce((sum, item) => sum + item.disabled.promptAdditionChars, 0) / results.length
};

console.log(JSON.stringify({ summary, results }, null, 2));
