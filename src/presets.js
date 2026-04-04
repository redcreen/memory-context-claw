export const PLUGIN_CONFIG_PRESETS = {
  "safe-local": {
    enabled: true,
    maxCandidates: 18,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    excludePaths: [
      "/memory-context-claw/",
      "/context-assembly-claw/",
      "/openclaw-task-system/",
      "/node_modules/",
      "/.git/"
    ],
    queryRewrite: {
      enabled: true,
      maxQueries: 4
    },
    llmRerank: {
      enabled: false,
      topN: 6,
      model: "gpt-5.4",
      timeoutMs: 20000,
      maxSnippetChars: 900,
      minScoreDeltaToSkip: 0.18
    }
  },
  "llm-rerank": {
    enabled: true,
    maxCandidates: 18,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    excludePaths: [
      "/memory-context-claw/",
      "/context-assembly-claw/",
      "/openclaw-task-system/",
      "/node_modules/",
      "/.git/"
    ],
    queryRewrite: {
      enabled: true,
      maxQueries: 4
    },
    llmRerank: {
      enabled: true,
      topN: 6,
      model: "gpt-5.4",
      timeoutMs: 20000,
      maxSnippetChars: 900,
      minScoreDeltaToSkip: 0.18
    }
  }
};

export function listPresetNames() {
  return Object.keys(PLUGIN_CONFIG_PRESETS);
}

export function resolvePluginPreset(name = "safe-local") {
  const preset = PLUGIN_CONFIG_PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown preset: ${name}`);
  }
  return JSON.parse(JSON.stringify(preset));
}
