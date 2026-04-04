const DEFAULT_CONFIG = {
  enabled: true,
  openclawCommand: "openclaw",
  maxCandidates: 18,
  maxSelectedChunks: 4,
  maxChunksPerPath: 1,
  memoryBudgetRatio: 0.35,
  recentMessageCount: 8,
  excludePaths: [
    "/context-assembly-claw/",
    "/openclaw-task-system/",
    "/node_modules/",
    "/.git/"
  ],
  queryRewrite: {
    enabled: true,
    maxQueries: 4
  },
  forceAgentId: "",
  llmRerank: {
    enabled: false,
    topN: 6,
    model: "gpt-5.4",
    provider: "",
    timeoutMs: 20000,
    maxSnippetChars: 900,
    minScoreDeltaToSkip: 0.18
  },
  weights: {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }
};

function clampNumber(value, min, max, fallback) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function mergeObject(base, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ...base };
  }
  return { ...base, ...incoming };
}

export function resolvePluginConfig(raw) {
  const cfg = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const llmRerank = mergeObject(DEFAULT_CONFIG.llmRerank, cfg.llmRerank);
  const queryRewrite = mergeObject(DEFAULT_CONFIG.queryRewrite, cfg.queryRewrite);
  const weights = mergeObject(DEFAULT_CONFIG.weights, cfg.weights);

  return {
    enabled: cfg.enabled !== false,
    openclawCommand:
      typeof cfg.openclawCommand === "string" && cfg.openclawCommand.trim()
        ? cfg.openclawCommand.trim()
        : DEFAULT_CONFIG.openclawCommand,
    maxCandidates: clampNumber(cfg.maxCandidates, 1, 50, DEFAULT_CONFIG.maxCandidates),
    maxSelectedChunks: clampNumber(
      cfg.maxSelectedChunks,
      1,
      20,
      DEFAULT_CONFIG.maxSelectedChunks
    ),
    maxChunksPerPath: clampNumber(
      cfg.maxChunksPerPath,
      1,
      5,
      DEFAULT_CONFIG.maxChunksPerPath
    ),
    memoryBudgetRatio: clampNumber(
      cfg.memoryBudgetRatio,
      0.1,
      0.8,
      DEFAULT_CONFIG.memoryBudgetRatio
    ),
    recentMessageCount: clampNumber(
      cfg.recentMessageCount,
      1,
      30,
      DEFAULT_CONFIG.recentMessageCount
    ),
    excludePaths: Array.isArray(cfg.excludePaths)
      ? cfg.excludePaths.filter((item) => typeof item === "string" && item.trim())
      : [...DEFAULT_CONFIG.excludePaths],
    queryRewrite: {
      enabled: queryRewrite.enabled !== false,
      maxQueries: clampNumber(queryRewrite.maxQueries, 1, 8, DEFAULT_CONFIG.queryRewrite.maxQueries)
    },
    forceAgentId: typeof cfg.forceAgentId === "string" ? cfg.forceAgentId.trim() : "",
    llmRerank: {
      enabled: llmRerank.enabled === true,
      topN: clampNumber(llmRerank.topN, 2, 20, DEFAULT_CONFIG.llmRerank.topN),
      model:
        typeof llmRerank.model === "string" && llmRerank.model.trim()
          ? llmRerank.model.trim()
          : DEFAULT_CONFIG.llmRerank.model,
      provider:
        typeof llmRerank.provider === "string" ? llmRerank.provider.trim() : "",
      timeoutMs: clampNumber(
        llmRerank.timeoutMs,
        1000,
        120000,
        DEFAULT_CONFIG.llmRerank.timeoutMs
      ),
      maxSnippetChars: clampNumber(
        llmRerank.maxSnippetChars,
        120,
        4000,
        DEFAULT_CONFIG.llmRerank.maxSnippetChars
      ),
      minScoreDeltaToSkip: clampNumber(
        llmRerank.minScoreDeltaToSkip,
        0,
        1,
        DEFAULT_CONFIG.llmRerank.minScoreDeltaToSkip
      )
    },
    weights: {
      retrievalScore: Number(weights.retrievalScore ?? DEFAULT_CONFIG.weights.retrievalScore),
      memoryFile: Number(weights.memoryFile ?? DEFAULT_CONFIG.weights.memoryFile),
      dailyMemory: Number(weights.dailyMemory ?? DEFAULT_CONFIG.weights.dailyMemory),
      workspaceDoc: Number(weights.workspaceDoc ?? DEFAULT_CONFIG.weights.workspaceDoc),
      summarySection: Number(weights.summarySection ?? DEFAULT_CONFIG.weights.summarySection),
      keywordOverlap: Number(weights.keywordOverlap ?? DEFAULT_CONFIG.weights.keywordOverlap),
      recency: Number(weights.recency ?? DEFAULT_CONFIG.weights.recency)
    }
  };
}
