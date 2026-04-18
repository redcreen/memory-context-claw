import os from "node:os";
import path from "node:path";

import {
  applyPolicyToMemoryItems,
  createCodexAdapterBridge,
  createContractId,
  createContractTimestamp,
  createMemoryRegistry,
  parseMemoryIntentExtraction,
  createPolicyContext,
  createProjectionSystem,
  createReflectionSystem,
  renderMemoryIntentText,
  createSourceSystem,
  createNamespaceKey,
  parseNamespace,
  parseVisibility,
  resolveRegistryRoot,
  resolveOpenClawAgentNamespace,
  resolveOpenClawNamespace,
  SHARED_CONTRACT_VERSION
} from "./unified-memory-core/index.js";
import { ingestDeclaredSourceToCandidate } from "./unified-memory-core/pipeline.js";
import {
  buildCodexContextMinorGcPackage,
  mergeCodexPromptBlocks,
  resolveCodexContextMinorGcConfig
} from "./codex-context-minor-gc.js";
import { estimateTokenCountFromText } from "./utils.js";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeStringList(values, fallback) {
  if (!Array.isArray(values)) {
    return [...fallback];
  }
  const normalized = values
    .map((value) => normalizeString(value))
    .filter(Boolean);
  return normalized.length > 0 ? normalized : [...fallback];
}

function normalizeStringArrayLike(values, fallback = []) {
  if (Array.isArray(values)) {
    const normalized = values
      .map((value) => normalizeString(value))
      .filter(Boolean);
    return normalized.length > 0 ? normalized : [...fallback];
  }
  if (typeof values === "string") {
    const normalized = values
      .split(",")
      .map((value) => normalizeString(value))
      .filter(Boolean);
    return normalized.length > 0 ? normalized : [...fallback];
  }
  return [...fallback];
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (["true", "1", "yes", "y", "accepted", "success", "succeeded"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n", "rejected", "failed"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeOptionalObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return { ...value };
}

function dedupeMemoryItems(items, maxItems) {
  const seen = new Set();
  const merged = [];

  for (const item of items) {
    const key = String(item?.memory_id || item?.title || "");
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
    if (merged.length >= maxItems) {
      break;
    }
  }

  return merged;
}

function normalizeTaskPrompt(value) {
  return normalizeString(value).replace(/\s+/g, " ").trim();
}

function resolveAcceptedActionPayload(input = {}) {
  const nested = input.acceptedAction && typeof input.acceptedAction === "object" && !Array.isArray(input.acceptedAction)
    ? input.acceptedAction
    : input.accepted_action && typeof input.accepted_action === "object" && !Array.isArray(input.accepted_action)
      ? input.accepted_action
      : null;

  return {
    ...(nested || {}),
    ...input
  };
}

function resolveMemoryExtractionPayload(input = {}) {
  const nested = input.memoryExtraction && typeof input.memoryExtraction === "object" && !Array.isArray(input.memoryExtraction)
    ? input.memoryExtraction
    : input.memory_extraction && typeof input.memory_extraction === "object" && !Array.isArray(input.memory_extraction)
      ? input.memory_extraction
      : null;

  return nested ? { ...nested } : null;
}

function formatWriteBackContent(event) {
  const lines = [
    `task_id: ${event.task_id}`,
    `event_type: ${event.event_type}`,
    `task_title: ${event.task_title}`,
    `summary: ${event.summary}`
  ];
  if (event.details) {
    lines.push(`details: ${event.details}`);
  }
  if (event.tags.length > 0) {
    lines.push(`tags: ${event.tags.join(", ")}`);
  }
  return lines.join("\n");
}

function createWriteBackCandidateBuilder(event, clock) {
  return ({ sourceArtifact }) => {
    const now = createContractTimestamp(clock);
    return {
      artifact_id: createContractId("artifact"),
      artifact_type: "candidate_artifact",
      contract_version: SHARED_CONTRACT_VERSION,
      state: "candidate",
      namespace: sourceArtifact.namespace,
      visibility: event.visibility,
      title: `codex:${event.event_type}:${event.task_id}`,
      summary: event.summary,
      source_artifact_id: sourceArtifact.artifact_id,
      evidence_refs: [sourceArtifact.artifact_id],
      fingerprint: sourceArtifact.fingerprint,
      confidence: 0.66,
      attributes: {
        adapter: "codex",
        event_type: event.event_type,
        task_id: event.task_id,
        task_title: event.task_title,
        tags: event.tags,
        actor_id: event.actor_id,
        project_id: event.project_id,
        project_path: event.project_path,
        write_back_event_id: event.event_id
      },
      export_hints: ["codex", "write-back-review"],
      created_at: now,
      updated_at: now
    };
  };
}

export function resolveCodexAdapterConfig(raw = {}) {
  const projectPath = normalizeString(raw.projectPath, process.cwd());
  const projectId = normalizeString(raw.projectId, path.basename(projectPath) || "default-project");
  const userId = normalizeString(raw.userId, os.userInfo().username || "default-user");
  const registryResolution = resolveRegistryRoot({
    explicitDir: raw.registryDir,
    env: raw.env
  });

  return {
    registryDir: registryResolution.registryDir,
    registryResolution,
    projectPath,
    projectId,
    userId,
    tenant: normalizeString(raw.tenant, "local"),
    scope: normalizeString(raw.scope, "project"),
    resource: normalizeString(raw.resource, "shared-code-memory"),
    namespaceHint: normalizeString(raw.namespaceHint, `${projectId}-${userId}`),
    workspaceId: normalizeString(raw.workspaceId, ""),
    agentId: normalizeString(raw.agentId, ""),
    agentNamespaceEnabled: raw.agentNamespaceEnabled === true,
    host: normalizeString(raw.host, ""),
    allowedVisibilities: normalizeStringList(
      raw.allowedVisibilities,
      ["private", "workspace", "shared", "public"]
    ),
    allowedStates: normalizeStringList(raw.allowedStates, ["stable"]),
    maxItems: Number.isFinite(raw.maxItems) ? Math.max(1, Math.min(20, Number(raw.maxItems))) : 6,
    writeBackVisibility: normalizeString(raw.writeBackVisibility, "workspace"),
    contextMinorGc: resolveCodexContextMinorGcConfig(raw.contextMinorGc),
    policyAdaptation: {
      enabled: raw.policyAdaptation?.enabled !== false,
      maxPolicyInputs: Number.isFinite(raw.policyAdaptation?.maxPolicyInputs)
        ? Math.max(1, Math.min(20, Number(raw.policyAdaptation.maxPolicyInputs)))
        : 8,
      rollbackOnError: raw.policyAdaptation?.rollbackOnError !== false
    }
  };
}

function resolveCodexNamespacePlan(raw = {}) {
  const config = resolveCodexAdapterConfig(raw);

  if (config.workspaceId) {
    const baseContext = {
      tenant: config.tenant,
      scope: config.scope,
      resource: config.resource,
      workspaceId: config.workspaceId,
      host: config.host
    };
    const namespaces = [];

    if (config.agentNamespaceEnabled && config.agentId) {
      namespaces.push(resolveOpenClawAgentNamespace({
        ...baseContext,
        agentId: config.agentId
      }));
    }

    namespaces.push(resolveOpenClawNamespace(baseContext));

    return {
      primaryNamespace: namespaces[0],
      namespaces
    };
  }

  const namespace = parseNamespace({
    tenant: config.tenant,
    scope: config.scope,
    resource: config.resource,
    key: config.namespaceHint,
    ...(config.host ? { host: config.host } : {})
  });

  return {
    primaryNamespace: namespace,
    namespaces: [namespace]
  };
}

export function createCodexWriteBackEvent(input = {}, context = {}, options = {}) {
  const clock = options.clock || (() => new Date());
  const config = resolveCodexAdapterConfig(context);
  const namespacePlan = resolveCodexNamespacePlan(context);
  const namespace = parseNamespace(options.namespace || namespacePlan.primaryNamespace);

  const eventType = normalizeString(input.eventType || input.event_type, "task_result");
  const taskId = normalizeString(input.taskId || input.task_id, createContractId("task"));
  const taskTitle = normalizeTaskPrompt(input.taskTitle || input.task_title || "codex task");
  const summary = normalizeTaskPrompt(input.summary || input.resultSummary || input.content || "");
  if (!summary) {
    throw new TypeError("Codex write-back event requires a summary");
  }

  return {
    event_id: createContractId("codex_event"),
    contract_version: SHARED_CONTRACT_VERSION,
    event_type: eventType,
    namespace,
    visibility: parseVisibility(input.visibility || config.writeBackVisibility),
    actor_id: normalizeString(input.actorId || input.actor_id, config.userId),
    project_id: normalizeString(input.projectId || input.project_id, config.projectId),
    project_path: normalizeString(input.projectPath || input.project_path, config.projectPath),
    task_id: taskId,
    task_title: taskTitle,
    summary,
    details: normalizeTaskPrompt(input.details || ""),
    tags: normalizeStringList(input.tags, []),
    metadata: input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? { ...input.metadata }
      : {},
    emitted_at: createContractTimestamp(clock)
  };
}

export function createCodexAcceptedActionSource(input = {}, context = {}, options = {}) {
  const clock = options.clock || (() => new Date());
  const config = resolveCodexAdapterConfig(context);
  const namespacePlan = resolveCodexNamespacePlan(context);
  const namespace = parseNamespace(options.namespace || namespacePlan.primaryNamespace);
  const payload = resolveAcceptedActionPayload(input);
  const actionType = normalizeString(payload.actionType || payload.action_type || payload.kind);

  if (!actionType) {
    return null;
  }

  const status = normalizeString(payload.status, "succeeded");
  const accepted = normalizeBoolean(
    payload.accepted ?? payload.userAccepted ?? payload.user_accepted,
    true
  );
  const succeeded = normalizeBoolean(
    payload.succeeded ?? payload.executionSucceeded ?? payload.execution_succeeded ?? status,
    /success|succeed|applied|completed|done/iu.test(status)
  );
  const content = normalizeTaskPrompt(
    payload.content
    || payload.summary
    || input.summary
    || input.details
    || ""
  );
  const targets = normalizeStringArrayLike(
    payload.targets ?? payload.externalTargets ?? payload.external_targets,
    []
  );
  const artifacts = normalizeStringArrayLike(
    payload.artifacts ?? payload.artifactPaths ?? payload.artifact_paths,
    []
  );
  const outputs = normalizeOptionalObject(payload.outputs);
  const declaredSource = {
    sourceType: "accepted_action",
    declaredBy: `codex-adapter:${normalizeString(payload.actorId || payload.actor_id, config.userId)}`,
    namespace,
    visibility: parseVisibility(payload.visibility || config.writeBackVisibility),
    actionType,
    status,
    accepted,
    succeeded,
    agentId: normalizeString(payload.agentId || payload.agent_id || payload.runtime || context.agentId || ""),
    targets,
    artifacts,
    content
  };
  const inputs = normalizeOptionalObject(payload.inputs);

  if (inputs) {
    declaredSource.inputs = inputs;
  }
  if (outputs) {
    declaredSource.outputs = outputs;
  }

  return declaredSource;
}

export function createCodexMemoryExtractionSource(input = {}, context = {}, options = {}) {
  const payload = resolveMemoryExtractionPayload(input);
  if (!payload) {
    return null;
  }

  const clock = options.clock || (() => new Date());
  const config = resolveCodexAdapterConfig(context);
  const namespacePlan = resolveCodexNamespacePlan(context);
  const namespace = parseNamespace(options.namespace || namespacePlan.primaryNamespace);
  const memoryIntent = parseMemoryIntentExtraction({
    ...payload,
    summary: payload.summary || input.memorySummary || input.memory_summary || input.summary || "",
    userMessage: input.userMessage || input.user_message || payload.userMessage || payload.user_message || "",
    assistantReply:
      input.assistantReply
      || input.assistant_reply
      || input.userVisibleReply
      || input.user_visible_reply
      || payload.userVisibleReply
      || payload.user_visible_reply
      || ""
  });

  if (!memoryIntent.should_write_memory || !memoryIntent.summary || memoryIntent.admission_route === "skip") {
    return null;
  }

  return {
    sourceType: "memory_intent",
    declaredBy: `codex-adapter:${normalizeString(input.actorId || input.actor_id, config.userId)}`,
    namespace,
    visibility: parseVisibility(input.visibility || config.writeBackVisibility),
    shouldWriteMemory: memoryIntent.should_write_memory,
    category: memoryIntent.category,
    durability: memoryIntent.durability,
    confidence: memoryIntent.confidence,
    summary: memoryIntent.summary,
    userMessage: memoryIntent.user_message,
    assistantReply: memoryIntent.assistant_reply,
    structuredRule: memoryIntent.structured_rule,
    exportHints: [
      "codex",
      "memory_extraction",
      `memory_category:${memoryIntent.category}`,
      `memory_durability:${memoryIntent.durability}`,
      `memory_route:${memoryIntent.admission_route}`,
      ...(memoryIntent.structured_rule?.action?.tool
        ? [`memory_tool:${memoryIntent.structured_rule.action.tool}`]
        : [])
    ],
    metadata: {
      captured_at: createContractTimestamp(clock),
      text: renderMemoryIntentText(memoryIntent),
      ...memoryIntent
    }
  };
}

export function mapCodexExportToTaskMemory(exportResult, { taskPrompt, maxItems, policyContext } = {}) {
  const items = Array.isArray(exportResult?.payload?.code_memory)
    ? exportResult.payload.code_memory
    : [];
  const effectivePolicyContext = policyContext || createPolicyContext({
    exportResults: [exportResult],
    consumer: "codex",
    maxPolicyInputs: 8,
    rollbackOnError: true
  });
  const mappedItems = items.map((item) => ({
    memory_id: item.memory_id,
    title: item.title,
    summary: item.summary,
    namespace: item.namespace,
    evidence_refs: item.evidence_refs,
    attributes: item.attributes,
    export_hints: item.export_hints
  }));
  const adapted = applyPolicyToMemoryItems(mappedItems, {
    policyContext: effectivePolicyContext,
    prompt: taskPrompt,
    maxItems
  });
  const memoryItems = adapted.memory_items;

  const promptBlock = memoryItems.length === 0
    ? ""
    : [
        "## Shared Code Memory",
        ...memoryItems.map((item) => `- ${item.title}: ${item.summary}`)
      ].join("\n");

  return {
    task_prompt: normalizeTaskPrompt(taskPrompt),
    export_version: exportResult.exportVersion,
    export_contract: exportResult.exportContract,
    namespace: exportResult.exportContract.namespace,
    policy_inputs: effectivePolicyContext.enabled ? effectivePolicyContext.policy_inputs : [],
    policy_block: effectivePolicyContext.policy_block || "",
    task_defaults: {
      response_style: effectivePolicyContext.response_style || "default",
      supporting_context_mode: effectivePolicyContext.supporting_context_mode || "default",
      avoid_patterns: effectivePolicyContext.avoid_patterns || [],
      prefer_patterns: effectivePolicyContext.prefer_patterns || []
    },
    policy_adaptation: adapted.adaptation,
    memory_items: memoryItems,
    prompt_block: promptBlock
  };
}

export function createCodexAdapterRuntime(options = {}) {
  const logger = options.logger;
  const clock = options.clock || (() => new Date());
  const config = resolveCodexAdapterConfig(options.config);
  const registry = createMemoryRegistry({
    rootDir: config.registryDir,
    clock
  });
  const projectionSystem = createProjectionSystem({
    registry,
    clock
  });
  const bridge = createCodexAdapterBridge({ projectionSystem });
  const sourceSystem = createSourceSystem({
    clock,
    defaultNamespace: {
      tenant: config.tenant,
      scope: config.scope,
      resource: config.resource,
      key: config.workspaceId || config.namespaceHint,
      ...(config.host ? { host: config.host } : {})
    },
    defaultVisibility: config.writeBackVisibility
  });
  const reflectionSystem = createReflectionSystem({
    registry,
    clock
  });
  const writeChains = new Map();

  async function readBeforeTask(input = {}) {
    const maxItems = Number.isFinite(input.maxItems)
      ? Math.max(1, Math.min(20, Number(input.maxItems)))
      : config.maxItems;
    const namespacePlan = resolveCodexNamespacePlan({
      registryDir: config.registryDir,
      projectPath: normalizeString(input.projectPath, config.projectPath),
      projectId: normalizeString(input.projectId, config.projectId),
      userId: normalizeString(input.userId, config.userId),
      tenant: normalizeString(input.tenant, config.tenant),
      scope: normalizeString(input.scope, config.scope),
      resource: normalizeString(input.resource, config.resource),
      namespaceHint: normalizeString(input.namespaceHint, config.namespaceHint),
      workspaceId: normalizeString(input.workspaceId, config.workspaceId),
      agentId: normalizeString(input.agentId, config.agentId),
      agentNamespaceEnabled:
        input.agentNamespaceEnabled === undefined
          ? config.agentNamespaceEnabled
          : input.agentNamespaceEnabled === true,
      host: normalizeString(input.host, config.host)
    });
    const allowedVisibilities = input.allowedVisibilities || config.allowedVisibilities;
    const allowedStates = input.allowedStates || config.allowedStates;
    const exportResults = namespacePlan.namespaces.length === 1
      ? [await bridge.loadExports(
        {
          projectPath: normalizeString(input.projectPath, config.projectPath),
          projectId: normalizeString(input.projectId, config.projectId),
          userId: normalizeString(input.userId, config.userId),
          tenant: normalizeString(input.tenant, config.tenant),
          scope: normalizeString(input.scope, config.scope),
          resource: normalizeString(input.resource, config.resource),
          namespaceHint: normalizeString(input.namespaceHint, config.namespaceHint),
          host: normalizeString(input.host, config.host)
        },
        {
          allowedVisibilities,
          allowedStates
        }
      )]
      : await Promise.all(
        namespacePlan.namespaces.map((namespace) => projectionSystem.buildCodexExport({
          namespace,
          allowedVisibilities,
          allowedStates
        }))
      );

    const exportResult = {
      exportVersion: exportResults[0]?.exportVersion || "v1",
      exportContract: exportResults[0]?.exportContract || {
        namespace: namespacePlan.primaryNamespace
      },
      payload: {
        code_memory: dedupeMemoryItems(
          exportResults.flatMap((item) => Array.isArray(item?.payload?.code_memory) ? item.payload.code_memory : []),
          maxItems
        ),
        policy_inputs: exportResults.flatMap((item) => Array.isArray(item?.payload?.policy_inputs) ? item.payload.policy_inputs : [])
      }
    };
    const policyContext = createPolicyContext({
      exportResults,
      consumer: "codex",
      maxPolicyInputs: config.policyAdaptation.maxPolicyInputs,
      rollbackOnError: config.policyAdaptation.rollbackOnError
    });
    const memoryPackage = mapCodexExportToTaskMemory(exportResult, {
      taskPrompt: input.taskPrompt || input.prompt || "",
      maxItems,
      policyContext: config.policyAdaptation.enabled
        ? policyContext
        : {
            ...policyContext,
            enabled: false,
            policy_inputs: [],
            policy_block: "",
            rollback: {
              status: "disabled",
              reason_codes: ["policy_adaptation_disabled"],
              invalid_inputs: []
            }
          }
    });
    const taskPrompt = input.taskPrompt || input.prompt || "";
    const conversationMessages = (
      input.recentMessages
      || input.dialogueMessages
      || input.conversationMessages
      || input.messages
      || []
    );
    const inputContextMinorGc = input.contextMinorGc && typeof input.contextMinorGc === "object" && !Array.isArray(input.contextMinorGc)
      ? input.contextMinorGc
      : {};
    const contextMinorGcConfig = resolveCodexContextMinorGcConfig({
      ...config.contextMinorGc,
      ...inputContextMinorGc,
      shadow: {
        ...(config.contextMinorGc?.shadow || {}),
        ...(inputContextMinorGc.shadow && typeof inputContextMinorGc.shadow === "object" ? inputContextMinorGc.shadow : {})
      },
      guarded: {
        ...(config.contextMinorGc?.guarded || {}),
        ...(inputContextMinorGc.guarded && typeof inputContextMinorGc.guarded === "object" ? inputContextMinorGc.guarded : {})
      }
    });
    const contextMinorGc = await buildCodexContextMinorGcPackage({
      logger,
      config: contextMinorGcConfig,
      sessionKey: normalizeString(
        input.contextMinorGcSessionKey,
        `${contextMinorGcConfig.sessionKeyPrefix}:${namespacePlan.primaryNamespace.key}`
      ),
      query: taskPrompt,
      messages: conversationMessages,
      decisionRunner: typeof input.contextMinorGcDecisionRunner === "function"
        ? input.contextMinorGcDecisionRunner
        : typeof inputContextMinorGc.decisionRunner === "function"
          ? inputContextMinorGc.decisionRunner
          : null
    });
    const memoryPromptBlock = memoryPackage.prompt_block || "";
    const baselinePromptBlock = mergeCodexPromptBlocks(
      contextMinorGc.baselineContextBlock,
      memoryPromptBlock
    );
    const optimizedPromptBlock = mergeCodexPromptBlocks(
      contextMinorGc.optimizedContextBlock,
      memoryPromptBlock
    );
    const effectivePromptBlock = mergeCodexPromptBlocks(
      contextMinorGc.effectiveContextBlock,
      memoryPromptBlock
    );

    return {
      ...memoryPackage,
      memory_prompt_block: memoryPromptBlock,
      baseline_prompt_block: baselinePromptBlock,
      optimized_prompt_block: optimizedPromptBlock,
      conversation_prompt_block: contextMinorGc.baselineContextBlock,
      prompt_block: effectivePromptBlock,
      context_minor_gc: {
        ...contextMinorGc,
        baselinePromptBlock,
        optimizedPromptBlock,
        effectivePromptBlock,
        baselinePromptEstimate: estimateTokenCountFromText(baselinePromptBlock),
        optimizedPromptEstimate: estimateTokenCountFromText(optimizedPromptBlock),
        effectivePromptEstimate: estimateTokenCountFromText(effectivePromptBlock)
      }
    };
  }

  async function withNamespaceWriteLock(namespace, task) {
    const namespaceKey = createNamespaceKey(namespace);
    const previous = writeChains.get(namespaceKey) || Promise.resolve();
    const next = previous.then(task, task);
    const settled = next.finally(() => {
      if (writeChains.get(namespaceKey) === settled) {
        writeChains.delete(namespaceKey);
      }
    });
    writeChains.set(namespaceKey, settled);
    return settled;
  }

  async function writeAfterTask(input = {}) {
    const event = createCodexWriteBackEvent(input, {
      registryDir: config.registryDir,
      projectPath: normalizeString(input.projectPath, config.projectPath),
      projectId: normalizeString(input.projectId, config.projectId),
      userId: normalizeString(input.userId, config.userId),
      tenant: normalizeString(input.tenant, config.tenant),
      scope: normalizeString(input.scope, config.scope),
      resource: normalizeString(input.resource, config.resource),
      namespaceHint: normalizeString(input.namespaceHint, config.namespaceHint),
      workspaceId: normalizeString(input.workspaceId, config.workspaceId),
      agentId: normalizeString(input.agentId, config.agentId),
      agentNamespaceEnabled:
        input.agentNamespaceEnabled === undefined
          ? config.agentNamespaceEnabled
          : input.agentNamespaceEnabled === true,
      host: normalizeString(input.host, config.host),
      writeBackVisibility: normalizeString(
        input.visibility,
        config.writeBackVisibility
      )
    }, { clock });

    return withNamespaceWriteLock(event.namespace, async () => {
      const persistence = await ingestDeclaredSourceToCandidate({
        declaredSource: {
          sourceType: "manual",
          declaredBy: `codex-adapter:${event.actor_id}`,
          namespace: event.namespace,
          visibility: event.visibility,
          content: formatWriteBackContent(event)
        },
        sourceSystem,
        registry,
        decidedBy: `codex-adapter:${event.actor_id}`,
        decisionMetadata: {
          write_back_event_id: event.event_id,
          event_type: event.event_type,
          task_id: event.task_id
        },
        candidateBuilder: createWriteBackCandidateBuilder(event, clock)
      });
      const acceptedActionSource = createCodexAcceptedActionSource(input, {
        registryDir: config.registryDir,
        projectPath: normalizeString(input.projectPath, config.projectPath),
        projectId: normalizeString(input.projectId, config.projectId),
        userId: normalizeString(input.userId, config.userId),
        tenant: normalizeString(input.tenant, config.tenant),
        scope: normalizeString(input.scope, config.scope),
        resource: normalizeString(input.resource, config.resource),
        namespaceHint: normalizeString(input.namespaceHint, config.namespaceHint),
        workspaceId: normalizeString(input.workspaceId, config.workspaceId),
        agentId: normalizeString(input.agentId, config.agentId),
        agentNamespaceEnabled:
          input.agentNamespaceEnabled === undefined
            ? config.agentNamespaceEnabled
            : input.agentNamespaceEnabled === true,
        host: normalizeString(input.host, config.host),
        writeBackVisibility: normalizeString(
          input.visibility,
          config.writeBackVisibility
        )
      }, { clock });
      const memoryExtractionSource = createCodexMemoryExtractionSource(input, {
        registryDir: config.registryDir,
        projectPath: normalizeString(input.projectPath, config.projectPath),
        projectId: normalizeString(input.projectId, config.projectId),
        userId: normalizeString(input.userId, config.userId),
        tenant: normalizeString(input.tenant, config.tenant),
        scope: normalizeString(input.scope, config.scope),
        resource: normalizeString(input.resource, config.resource),
        namespaceHint: normalizeString(input.namespaceHint, config.namespaceHint),
        workspaceId: normalizeString(input.workspaceId, config.workspaceId),
        agentId: normalizeString(input.agentId, config.agentId),
        agentNamespaceEnabled:
          input.agentNamespaceEnabled === undefined
            ? config.agentNamespaceEnabled
            : input.agentNamespaceEnabled === true,
        host: normalizeString(input.host, config.host),
        writeBackVisibility: normalizeString(
          input.visibility,
          config.writeBackVisibility
        )
      }, { clock });
      let memoryExtractionPersistence = null;
      let acceptedActionPersistence = null;

      if (memoryExtractionSource) {
        const memoryIntentSourceResult = await sourceSystem.ingestDeclaredSource(memoryExtractionSource);
        const memoryIntentSourceRecord = await registry.persistSourceArtifact(
          memoryIntentSourceResult.sourceArtifact
        );
        const reflection = await reflectionSystem.runReflection({
          sourceArtifacts: [memoryIntentSourceResult.sourceArtifact],
          persistCandidates: true,
          decidedBy: `codex-adapter:${event.actor_id}`
        });
        const promoted = [];

        for (const output of reflection.outputs) {
          if (!output.recommendation.should_promote) {
            continue;
          }
          promoted.push(await registry.promoteCandidateToStable({
            candidateArtifactId: output.candidate_artifact.artifact_id,
            decidedBy: `codex-adapter:${event.actor_id}`,
            reasonCodes: [
              "codex_memory_intent_promotion",
              `label:${output.primary_label}`,
              `route:${output.candidate_artifact.attributes?.memory_intent_admission_route || "unknown"}`
            ]
          }));
        }

        memoryExtractionPersistence = {
          declared_source: memoryExtractionSource,
          sourceManifest: memoryIntentSourceResult.sourceManifest,
          sourceArtifact: memoryIntentSourceResult.sourceArtifact,
          sourceRecord: memoryIntentSourceRecord,
          reflection,
          promoted
        };
      }

      if (acceptedActionSource) {
        const acceptedActionSourceResult = await sourceSystem.ingestDeclaredSource(acceptedActionSource);
        const acceptedActionSourceRecord = await registry.persistSourceArtifact(
          acceptedActionSourceResult.sourceArtifact
        );
        const reflection = await reflectionSystem.runReflection({
          sourceArtifacts: [acceptedActionSourceResult.sourceArtifact],
          persistCandidates: true,
          decidedBy: `codex-adapter:${event.actor_id}`
        });
        const promoted = [];

        for (const output of reflection.outputs) {
          if (!output.recommendation.should_promote) {
            continue;
          }
          promoted.push(await registry.promoteCandidateToStable({
            candidateArtifactId: output.candidate_artifact.artifact_id,
            decidedBy: `codex-adapter:${event.actor_id}`,
            reasonCodes: [
              "codex_accepted_action_promotion",
              `label:${output.primary_label}`
            ]
          }));
        }

        acceptedActionPersistence = {
          declared_source: acceptedActionSource,
          sourceManifest: acceptedActionSourceResult.sourceManifest,
          sourceArtifact: acceptedActionSourceResult.sourceArtifact,
          sourceRecord: acceptedActionSourceRecord,
          reflection,
          promoted
        };
      }

      logger?.info?.(
        `[unified-memory-core] codex write-back persisted (event=${event.event_id}, namespace=${createNamespaceKey(event.namespace)})`
      );

      return {
        write_back_event: event,
        memory_extraction: memoryExtractionPersistence,
        accepted_action: acceptedActionPersistence,
        ...persistence
      };
    });
  }

  return {
    config,
    readBeforeTask,
    writeAfterTask
  };
}
