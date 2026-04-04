#!/usr/bin/env node

import { retrieveMemoryCandidates } from "../src/retrieval.js";
import { scoreCandidates } from "../src/scoring.js";
import { buildAssemblyResult } from "../src/assembly.js";
import { resolvePluginConfig } from "../src/config.js";
import { prepareRerankCandidates, shouldSkipLlmRerank } from "../src/rerank.js";
import { resolvePluginPreset } from "../src/presets.js";

const query = process.argv.slice(2).join(" ").trim();

if (!query) {
  console.error("Usage: node scripts/compare-presets.js <query>");
  process.exit(1);
}

async function runPreset(presetName) {
  const config = resolvePluginConfig(resolvePluginPreset(presetName));
  const candidates = await retrieveMemoryCandidates({
    openclawCommand: config.openclawCommand,
    agentId: "main",
    query,
    maxCandidates: config.maxCandidates,
    excludePaths: config.excludePaths,
    queryRewrite: config.queryRewrite,
    logger: { warn: console.warn }
  });
  const ranked = scoreCandidates(candidates, query, config.weights);
  const assembly = buildAssemblyResult({
    messages: [{ role: "user", content: query, timestamp: Date.now() }],
    tokenBudget: 4096,
    memoryBudgetRatio: config.memoryBudgetRatio,
    recentMessageCount: config.recentMessageCount,
    maxSelectedChunks: config.maxSelectedChunks,
    maxChunksPerPath: config.maxChunksPerPath,
    candidates: ranked.map((item) => ({ ...item, finalScore: item.weightedScore }))
  });

  return {
    preset: presetName,
    llmRerankEnabled: config.llmRerank.enabled,
    llmWouldSkip: shouldSkipLlmRerank(ranked, config.llmRerank),
    rerankCandidates: prepareRerankCandidates(ranked, config.llmRerank).map((item) => ({
      path: item.path,
      score: item.weightedScore
    })),
    selected: assembly.selectedCandidates.map((item) => ({
      path: item.path,
      score: item.finalScore ?? item.weightedScore,
      range: `${item.startLine}-${item.endLine}`
    }))
  };
}

const safeLocal = await runPreset("safe-local");
const llmRerank = await runPreset("llm-rerank");

console.log(
  JSON.stringify(
    {
      query,
      presets: {
        "safe-local": safeLocal,
        "llm-rerank": llmRerank
      }
    },
    null,
    2
  )
);
