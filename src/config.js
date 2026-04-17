const DEFAULT_CONFIG = {
  enabled: true,
  openclawCommand: "openclaw",
  selfLearning: {
    enabled: true,
    localTime: "00:00"
  },
  cardArtifacts: {
    enabled: true,
    path: "",
    maxCandidates: 6,
    fastPathEnabled: true,
    fastPathMinScore: 0.3
  },
  maxCandidates: 18,
  maxSelectedChunks: 4,
  maxChunksPerPath: 1,
  memoryBudgetRatio: 0.35,
  recentMessageCount: 8,
  excludePaths: [
    "/unified-memory-core/",
    "/unified-memory-core/",
    "/unified-memory-core-enabled-vs-disabled-report.md",
    "/openclaw-task-system/",
    "/node_modules/",
    "/.git/"
  ],
  queryRewrite: {
    enabled: true,
    maxQueries: 4
  },
  memoryDistillation: {
    enabled: true,
    triggerBeforeCompaction: true,
    preCompactTriggerRatio: 0.72,
    compactFallback: true,
    cooldownMs: 300000,
    sessionLimit: 8,
    indexedHistoryEnabled: true,
    indexedHistoryFileLimit: 24,
    outputDir: ""
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
  dialogueWorkingSetShadow: {
    enabled: false,
    model: "gpt-5.4",
    provider: "",
    timeoutMs: 20000,
    maxTurns: 12,
    minTurns: 3,
    maxCharsPerTurn: 900,
    outputDir: "",
    cleanupSession: true
  },
  dialogueWorkingSetGuarded: {
    enabled: false,
    allowedRelations: ["switch", "resolve"],
    minReductionRatio: 0.18,
    minEvictedTurns: 1,
    prependCarryForward: true
  },
  openclawAdapter: {
    enabled: true,
    debug: {
      canaryTool: false
    },
    ordinaryConversationMemory: {
      enabled: true,
      visibility: "workspace",
      maxUserChars: 800
    },
    acceptedActions: {
      enabled: true,
      visibility: "workspace"
    },
    governedExports: {
      enabled: true,
      registryDir: "",
      workspaceId: "",
      agentWorkspaceIds: {},
      agentNamespace: {
        enabled: false
      },
      tenant: "local",
      scope: "workspace",
      resource: "openclaw-shared-memory",
      host: "",
      allowedVisibilities: ["private", "workspace", "shared", "public"],
      allowedStates: ["stable"],
      maxCandidates: 4,
      policyAdaptation: {
        enabled: true,
        maxPolicyInputs: 8,
        rollbackOnError: true
      }
    }
  },
  weights: {
    retrievalScore: 0.55,
    cardArtifact: 0.16,
    preferenceConflictPenalty: 0.24,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
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

function mergeStringArrays(base, incoming) {
  const values = [
    ...(Array.isArray(base) ? base : []),
    ...(Array.isArray(incoming) ? incoming : [])
  ].filter((item) => typeof item === "string" && item.trim());
  return [...new Set(values)];
}

function normalizeStringMap(values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [
        typeof key === "string" ? key.trim() : "",
        typeof value === "string" ? value.trim() : ""
      ])
      .filter(([key, value]) => key && value)
  );
}

function normalizeTimeOfDay(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return fallback;
  }
  const [hours, minutes] = normalized.split(":").map((item) => Number(item));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return fallback;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return fallback;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function resolvePluginConfig(raw) {
  const cfg = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const selfLearning = mergeObject(DEFAULT_CONFIG.selfLearning, cfg.selfLearning);
  const cardArtifacts = mergeObject(DEFAULT_CONFIG.cardArtifacts, cfg.cardArtifacts);
  const llmRerank = mergeObject(DEFAULT_CONFIG.llmRerank, cfg.llmRerank);
  const dialogueWorkingSetShadow = mergeObject(
    DEFAULT_CONFIG.dialogueWorkingSetShadow,
    cfg.dialogueWorkingSetShadow
  );
  const dialogueWorkingSetGuarded = mergeObject(
    DEFAULT_CONFIG.dialogueWorkingSetGuarded,
    cfg.dialogueWorkingSetGuarded
  );
  const queryRewrite = mergeObject(DEFAULT_CONFIG.queryRewrite, cfg.queryRewrite);
  const memoryDistillation = mergeObject(DEFAULT_CONFIG.memoryDistillation, cfg.memoryDistillation);
  const weights = mergeObject(DEFAULT_CONFIG.weights, cfg.weights);
  const openclawAdapter = mergeObject(DEFAULT_CONFIG.openclawAdapter, cfg.openclawAdapter);
  const acceptedActions = mergeObject(
    DEFAULT_CONFIG.openclawAdapter.acceptedActions,
    openclawAdapter.acceptedActions
  );
  const ordinaryConversationMemory = mergeObject(
    DEFAULT_CONFIG.openclawAdapter.ordinaryConversationMemory,
    openclawAdapter.ordinaryConversationMemory
  );
  const debug = mergeObject(
    DEFAULT_CONFIG.openclawAdapter.debug,
    openclawAdapter.debug
  );
  const governedExports = mergeObject(
    DEFAULT_CONFIG.openclawAdapter.governedExports,
    openclawAdapter.governedExports
  );
  const agentNamespace = mergeObject(
    DEFAULT_CONFIG.openclawAdapter.governedExports.agentNamespace,
    governedExports.agentNamespace
  );
  const policyAdaptation = mergeObject(
    DEFAULT_CONFIG.openclawAdapter.governedExports.policyAdaptation,
    governedExports.policyAdaptation
  );

  return {
    enabled: cfg.enabled !== false,
    openclawCommand:
      typeof cfg.openclawCommand === "string" && cfg.openclawCommand.trim()
        ? cfg.openclawCommand.trim()
        : DEFAULT_CONFIG.openclawCommand,
    selfLearning: {
      enabled: selfLearning.enabled !== false,
      localTime: normalizeTimeOfDay(
        selfLearning.localTime,
        DEFAULT_CONFIG.selfLearning.localTime
      )
    },
    cardArtifacts: {
      enabled: cardArtifacts.enabled !== false,
      path: typeof cardArtifacts.path === "string" ? cardArtifacts.path.trim() : "",
      maxCandidates: clampNumber(
        cardArtifacts.maxCandidates,
        0,
        20,
        DEFAULT_CONFIG.cardArtifacts.maxCandidates
      ),
      fastPathEnabled: cardArtifacts.fastPathEnabled !== false,
      fastPathMinScore: clampNumber(
        cardArtifacts.fastPathMinScore,
        0,
        5,
        DEFAULT_CONFIG.cardArtifacts.fastPathMinScore
      )
    },
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
    excludePaths: mergeStringArrays(DEFAULT_CONFIG.excludePaths, cfg.excludePaths),
    queryRewrite: {
      enabled: queryRewrite.enabled !== false,
      maxQueries: clampNumber(queryRewrite.maxQueries, 1, 8, DEFAULT_CONFIG.queryRewrite.maxQueries)
    },
    memoryDistillation: {
      enabled: memoryDistillation.enabled !== false,
      triggerBeforeCompaction: memoryDistillation.triggerBeforeCompaction !== false,
      preCompactTriggerRatio: clampNumber(
        memoryDistillation.preCompactTriggerRatio,
        0.1,
        0.99,
        DEFAULT_CONFIG.memoryDistillation.preCompactTriggerRatio
      ),
      compactFallback: memoryDistillation.compactFallback !== false,
      cooldownMs: clampNumber(
        memoryDistillation.cooldownMs,
        0,
        86400000,
        DEFAULT_CONFIG.memoryDistillation.cooldownMs
      ),
      sessionLimit: clampNumber(
        memoryDistillation.sessionLimit,
        1,
        50,
        DEFAULT_CONFIG.memoryDistillation.sessionLimit
      ),
      indexedHistoryEnabled: memoryDistillation.indexedHistoryEnabled !== false,
      indexedHistoryFileLimit: clampNumber(
        memoryDistillation.indexedHistoryFileLimit,
        0,
        200,
        DEFAULT_CONFIG.memoryDistillation.indexedHistoryFileLimit
      ),
      outputDir:
        typeof memoryDistillation.outputDir === "string"
          ? memoryDistillation.outputDir.trim()
          : ""
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
    dialogueWorkingSetShadow: {
      enabled: dialogueWorkingSetShadow.enabled === true,
      model:
        typeof dialogueWorkingSetShadow.model === "string" && dialogueWorkingSetShadow.model.trim()
          ? dialogueWorkingSetShadow.model.trim()
          : DEFAULT_CONFIG.dialogueWorkingSetShadow.model,
      provider:
        typeof dialogueWorkingSetShadow.provider === "string"
          ? dialogueWorkingSetShadow.provider.trim()
          : "",
      timeoutMs: clampNumber(
        dialogueWorkingSetShadow.timeoutMs,
        1000,
        120000,
        DEFAULT_CONFIG.dialogueWorkingSetShadow.timeoutMs
      ),
      maxTurns: clampNumber(
        dialogueWorkingSetShadow.maxTurns,
        1,
        100,
        DEFAULT_CONFIG.dialogueWorkingSetShadow.maxTurns
      ),
      minTurns: clampNumber(
        dialogueWorkingSetShadow.minTurns,
        1,
        50,
        DEFAULT_CONFIG.dialogueWorkingSetShadow.minTurns
      ),
      maxCharsPerTurn: clampNumber(
        dialogueWorkingSetShadow.maxCharsPerTurn,
        80,
        8000,
        DEFAULT_CONFIG.dialogueWorkingSetShadow.maxCharsPerTurn
      ),
      outputDir:
        typeof dialogueWorkingSetShadow.outputDir === "string"
          ? dialogueWorkingSetShadow.outputDir.trim()
          : "",
      cleanupSession: dialogueWorkingSetShadow.cleanupSession !== false
    },
    dialogueWorkingSetGuarded: {
      enabled: dialogueWorkingSetGuarded.enabled === true,
      allowedRelations: mergeStringArrays(
        DEFAULT_CONFIG.dialogueWorkingSetGuarded.allowedRelations,
        dialogueWorkingSetGuarded.allowedRelations
      ).filter((value) => ["continue", "branch", "switch", "resolve"].includes(value)),
      minReductionRatio: clampNumber(
        dialogueWorkingSetGuarded.minReductionRatio,
        0,
        1,
        DEFAULT_CONFIG.dialogueWorkingSetGuarded.minReductionRatio
      ),
      minEvictedTurns: clampNumber(
        dialogueWorkingSetGuarded.minEvictedTurns,
        1,
        20,
        DEFAULT_CONFIG.dialogueWorkingSetGuarded.minEvictedTurns
      ),
      prependCarryForward: dialogueWorkingSetGuarded.prependCarryForward !== false
    },
    openclawAdapter: {
      enabled: openclawAdapter.enabled !== false,
      debug: {
        canaryTool: debug.canaryTool === true
      },
      ordinaryConversationMemory: {
        enabled: ordinaryConversationMemory.enabled !== false,
        visibility:
          typeof ordinaryConversationMemory.visibility === "string" && ordinaryConversationMemory.visibility.trim()
            ? ordinaryConversationMemory.visibility.trim()
            : DEFAULT_CONFIG.openclawAdapter.ordinaryConversationMemory.visibility,
        maxUserChars: clampNumber(
          ordinaryConversationMemory.maxUserChars,
          32,
          4000,
          DEFAULT_CONFIG.openclawAdapter.ordinaryConversationMemory.maxUserChars
        )
      },
      acceptedActions: {
        enabled: acceptedActions.enabled !== false,
        visibility:
          typeof acceptedActions.visibility === "string" && acceptedActions.visibility.trim()
            ? acceptedActions.visibility.trim()
            : DEFAULT_CONFIG.openclawAdapter.acceptedActions.visibility
      },
      governedExports: {
        enabled: governedExports.enabled !== false,
        registryDir:
          typeof governedExports.registryDir === "string"
            ? governedExports.registryDir.trim()
            : "",
        workspaceId:
          typeof governedExports.workspaceId === "string"
            ? governedExports.workspaceId.trim()
            : "",
        agentWorkspaceIds: normalizeStringMap(governedExports.agentWorkspaceIds),
        agentNamespace: {
          enabled: agentNamespace.enabled === true
        },
        tenant:
          typeof governedExports.tenant === "string" && governedExports.tenant.trim()
            ? governedExports.tenant.trim()
            : DEFAULT_CONFIG.openclawAdapter.governedExports.tenant,
        scope:
          typeof governedExports.scope === "string" && governedExports.scope.trim()
            ? governedExports.scope.trim()
            : DEFAULT_CONFIG.openclawAdapter.governedExports.scope,
        resource:
          typeof governedExports.resource === "string" && governedExports.resource.trim()
            ? governedExports.resource.trim()
            : DEFAULT_CONFIG.openclawAdapter.governedExports.resource,
        host:
          typeof governedExports.host === "string"
            ? governedExports.host.trim()
            : "",
        allowedVisibilities: mergeStringArrays([], governedExports.allowedVisibilities),
        allowedStates: mergeStringArrays([], governedExports.allowedStates),
        maxCandidates: clampNumber(
          governedExports.maxCandidates,
          1,
          20,
          DEFAULT_CONFIG.openclawAdapter.governedExports.maxCandidates
        ),
        policyAdaptation: {
          enabled: policyAdaptation.enabled !== false,
          maxPolicyInputs: clampNumber(
            policyAdaptation.maxPolicyInputs,
            1,
            20,
            DEFAULT_CONFIG.openclawAdapter.governedExports.policyAdaptation.maxPolicyInputs
          ),
          rollbackOnError: policyAdaptation.rollbackOnError !== false
        }
      }
    },
    weights: {
      retrievalScore: Number(weights.retrievalScore ?? DEFAULT_CONFIG.weights.retrievalScore),
      cardArtifact: Number(weights.cardArtifact ?? DEFAULT_CONFIG.weights.cardArtifact),
      preferenceConflictPenalty: Number(
        weights.preferenceConflictPenalty ?? DEFAULT_CONFIG.weights.preferenceConflictPenalty
      ),
      memoryFile: Number(weights.memoryFile ?? DEFAULT_CONFIG.weights.memoryFile),
      dailyMemory: Number(weights.dailyMemory ?? DEFAULT_CONFIG.weights.dailyMemory),
      sessionRecent: Number(weights.sessionRecent ?? DEFAULT_CONFIG.weights.sessionRecent),
      workspaceDoc: Number(weights.workspaceDoc ?? DEFAULT_CONFIG.weights.workspaceDoc),
      summarySection: Number(weights.summarySection ?? DEFAULT_CONFIG.weights.summarySection),
      keywordOverlap: Number(weights.keywordOverlap ?? DEFAULT_CONFIG.weights.keywordOverlap),
      recency: Number(weights.recency ?? DEFAULT_CONFIG.weights.recency)
    }
  };
}
