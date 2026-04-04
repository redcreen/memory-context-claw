import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { retrieveMemoryCandidates } from "../src/retrieval.js";
import { scoreCandidates } from "../src/scoring.js";
import { resolvePluginConfig } from "../src/config.js";
import { buildAssemblyResult } from "../src/assembly.js";
import { canonicalizeMemoryPath } from "../src/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const evalPath = path.resolve(__dirname, "../evals/golden-cases.json");
const cases = JSON.parse(await fs.readFile(evalPath, "utf8"));
const config = resolvePluginConfig({});

function computeRecallAtK(selectedPaths, expectedPaths, k) {
  const topK = [...new Set(selectedPaths.map(canonicalizeMemoryPath))].slice(0, k);
  const expected = expectedPaths.map(canonicalizeMemoryPath);
  const hits = expected.filter((item) => topK.includes(item)).length;
  return expectedPaths.length === 0 ? 1 : hits / expectedPaths.length;
}

function computeMRR(selectedPaths, expectedPaths) {
  const deduped = [...new Set(selectedPaths.map(canonicalizeMemoryPath))];
  const expected = expectedPaths.map(canonicalizeMemoryPath);
  const firstMatchIndex = deduped.findIndex((item) => expected.includes(item));
  return firstMatchIndex === -1 ? 0 : 1 / (firstMatchIndex + 1);
}

function computeNdcgAtK(selectedPaths, expectedPaths, k) {
  const topK = [...new Set(selectedPaths.map(canonicalizeMemoryPath))].slice(0, k);
  const expected = expectedPaths.map(canonicalizeMemoryPath);
  const dcg = topK.reduce((sum, item, index) => {
    const relevance = expected.includes(item) ? 1 : 0;
    return sum + relevance / Math.log2(index + 2);
  }, 0);

  const idealLength = Math.min(expected.length, k);
  const idcg = Array.from({ length: idealLength }, (_, index) => 1 / Math.log2(index + 2)).reduce(
    (sum, value) => sum + value,
    0
  );

  return idcg === 0 ? 1 : dcg / idcg;
}

function average(values) {
  return values.length === 0 ? 0 : values.reduce((sum, item) => sum + item, 0) / values.length;
}

const logger = {
  warn: console.warn
};

const results = [];

for (const testCase of cases) {
  const rawCandidates = await retrieveMemoryCandidates({
    openclawCommand: config.openclawCommand,
    agentId: "main",
    query: testCase.query,
    maxCandidates: config.maxCandidates,
    excludePaths: config.excludePaths,
    queryRewrite: config.queryRewrite,
    logger
  });

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
  const selectedPaths = assembly.selectedCandidates.map((item) => item.path);
  const recallAt3 = computeRecallAtK(selectedPaths, testCase.expectedPaths, 3);
  const recallAt5 = computeRecallAtK(selectedPaths, testCase.expectedPaths, 5);
  const mrr = computeMRR(selectedPaths, testCase.expectedPaths);
  const ndcgAt5 = computeNdcgAtK(selectedPaths, testCase.expectedPaths, 5);

  results.push({
    name: testCase.name,
    query: testCase.query,
    recallAt3,
    recallAt5,
    mrr,
    ndcgAt5,
      selectedTop5: selectedPaths.map(canonicalizeMemoryPath).slice(0, 5)
  });
}

const summary = {
  cases: results.length,
  avgRecallAt3: average(results.map((item) => item.recallAt3)),
  avgRecallAt5: average(results.map((item) => item.recallAt5)),
  avgMRR: average(results.map((item) => item.mrr)),
  avgNdcgAt5: average(results.map((item) => item.ndcgAt5))
};

console.log(
  JSON.stringify(
    {
      summary,
      results
    },
    null,
    2
  )
);
