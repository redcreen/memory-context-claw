import { resolvePluginPreset } from "./presets.js";

export function ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function upsertAgent(list, agentId, patch) {
  const next = [...ensureArray(list)];
  const index = next.findIndex((item) => item && item.id === agentId);
  if (index === -1) next.push({ id: agentId, ...patch });
  else next[index] = { ...ensureObject(next[index]), ...patch };
  return next;
}

function mergePluginEntryConfig(existingConfig, presetConfig) {
  const current = ensureObject(existingConfig);
  const currentLlmRerank = ensureObject(current.llmRerank);

  return {
    ...current,
    enabled: presetConfig.enabled,
    maxCandidates: presetConfig.maxCandidates,
    maxSelectedChunks: presetConfig.maxSelectedChunks,
    maxChunksPerPath: presetConfig.maxChunksPerPath,
    memoryBudgetRatio: presetConfig.memoryBudgetRatio,
    recentMessageCount: presetConfig.recentMessageCount,
    excludePaths: Array.isArray(current.excludePaths)
      ? current.excludePaths
      : presetConfig.excludePaths,
    queryRewrite: {
      ...ensureObject(current.queryRewrite),
      enabled: ensureObject(current.queryRewrite).enabled ?? presetConfig.queryRewrite.enabled,
      maxQueries:
        ensureObject(current.queryRewrite).maxQueries ?? presetConfig.queryRewrite.maxQueries
    },
    llmRerank: {
      ...currentLlmRerank,
      enabled: presetConfig.llmRerank.enabled,
      topN: presetConfig.llmRerank.topN,
      model: presetConfig.llmRerank.model,
      timeoutMs: presetConfig.llmRerank.timeoutMs,
      maxSnippetChars: presetConfig.llmRerank.maxSnippetChars,
      minScoreDeltaToSkip: presetConfig.llmRerank.minScoreDeltaToSkip
    }
  };
}

export function mergePluginHostConfig(config, options) {
  const next = { ...ensureObject(config) };
  const presetConfig = resolvePluginPreset(options.preset);

  const agents = ensureObject(next.agents);
  const list = upsertAgent(agents.list, options.agentId, {
    memorySearch: {
      provider: "local",
      fallback: "none",
      local: {
        modelPath: options.modelPath
      },
      sync: {
        watch: true
      },
      extraPaths: [options.workspacePath]
    }
  });
  next.agents = { ...agents, list };

  const plugins = ensureObject(next.plugins);
  const allow = Array.from(new Set([...ensureArray(plugins.allow), "unified-memory-core"]));
  const load = ensureObject(plugins.load);
  const loadPaths = normalizeString(options.pluginPath)
    ? Array.from(new Set([...ensureArray(load.paths), normalizeString(options.pluginPath)]))
    : ensureArray(load.paths);
  const entries = ensureObject(plugins.entries);
  const existingEntry = ensureObject(entries["unified-memory-core"]);
  const existingConfig = ensureObject(existingEntry.config);

  next.plugins = {
    ...plugins,
    allow,
    slots: {
      ...ensureObject(plugins.slots),
      contextEngine: "unified-memory-core"
    },
    entries: {
      ...entries,
      "unified-memory-core": {
        ...existingEntry,
        enabled: true,
        config: mergePluginEntryConfig(existingConfig, presetConfig)
      }
    }
  };

  if (loadPaths.length > 0) {
    next.plugins.load = {
      ...load,
      paths: loadPaths
    };
  }

  return next;
}

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export function mergeInstallConfig(config, options) {
  return mergePluginHostConfig(config, options);
}
