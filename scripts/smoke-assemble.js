import { retrieveMemoryCandidates } from "../src/retrieval.js";
import { scoreCandidates } from "../src/scoring.js";
import { buildAssemblyResult } from "../src/assembly.js";
import { resolvePluginConfig } from "../src/config.js";
import { listPresetNames, resolvePluginPreset } from "../src/presets.js";
import { prepareRerankCandidates, shouldSkipLlmRerank } from "../src/rerank.js";

function usage() {
  console.error(
    [
      "Usage: node scripts/smoke-assemble.js [options] <query>",
      "",
      "Options:",
      `  --preset <name>      Preset name (${listPresetNames().join(", ")})`,
      "  --llm-rerank         Force-enable LLM rerank settings for this smoke run",
      "  --json-only          Print only the result JSON",
      "  --help               Show this message"
    ].join("\n")
  );
}

function parseArgs(argv) {
  const options = {
    preset: "safe-local",
    llmRerank: false,
    jsonOnly: false,
    queryParts: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--preset") options.preset = argv[++index];
    else if (arg === "--llm-rerank") options.llmRerank = true;
    else if (arg === "--json-only") options.jsonOnly = true;
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      options.queryParts.push(arg);
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
const query = options.queryParts.join(" ").trim();

if (!query) {
  usage();
  process.exit(1);
}

const basePreset = resolvePluginPreset(options.preset);
if (options.llmRerank) {
  basePreset.llmRerank.enabled = true;
}
const config = resolvePluginConfig(basePreset);
const logger = {
  warn: console.warn
};

const candidates = await retrieveMemoryCandidates({
  openclawCommand: config.openclawCommand,
  agentId: "main",
  query,
  maxCandidates: config.maxCandidates,
  excludePaths: config.excludePaths,
  queryRewrite: config.queryRewrite,
  logger
});

const ranked = scoreCandidates(candidates, query, config.weights);
const llmRerankCandidates = prepareRerankCandidates(ranked, config.llmRerank);
const assembly = buildAssemblyResult({
  messages: [
    { role: "user", content: query, timestamp: Date.now() }
  ],
  tokenBudget: 4096,
  memoryBudgetRatio: config.memoryBudgetRatio,
  recentMessageCount: config.recentMessageCount,
  maxSelectedChunks: config.maxSelectedChunks,
  maxChunksPerPath: config.maxChunksPerPath,
  candidates: ranked.map((item) => ({ ...item, finalScore: item.weightedScore }))
});

const result = {
  query,
  preset: options.preset,
  llmRerank: {
    enabled: config.llmRerank.enabled,
    wouldSkip: shouldSkipLlmRerank(ranked, config.llmRerank),
    topN: config.llmRerank.topN,
    queryRewrite: config.queryRewrite,
    candidates: llmRerankCandidates.map((item) => ({
      id: item.id,
      path: item.path,
      score: item.weightedScore
    }))
  },
  rankedTop: ranked.slice(0, config.maxSelectedChunks * 2).map((item) => ({
    path: item.path,
    score: item.weightedScore,
    range: `${item.startLine}-${item.endLine}`
  })),
  selected: assembly.selectedCandidates.map((item) => ({
    path: item.path,
    score: item.finalScore ?? item.weightedScore,
    range: `${item.startLine}-${item.endLine}`
  })),
  systemPromptAddition: assembly.systemPromptAddition
};

if (!options.jsonOnly) {
  console.error(
    `[unified-memory-core] preset=${options.preset} llmRerank.enabled=${config.llmRerank.enabled} llmRerank.wouldSkip=${result.llmRerank.wouldSkip}`
  );
}

console.log(JSON.stringify(result, null, 2));
