import {
  createMemoryRegistry,
  createNamespaceKey,
  createReflectionSystem,
  createSourceSystem,
  parseVisibility,
  resolveOpenClawAgentNamespace,
  resolveOpenClawNamespace,
  resolveRegistryRoot
} from "../unified-memory-core/index.js";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
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

function normalizePromptText(value) {
  return normalizeString(value).replace(/\s+/g, " ").trim();
}

function normalizeStringMap(values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [normalizeString(key), normalizeString(value)])
      .filter(([key, value]) => key && value)
  );
}

function resolveWorkspaceIdForAgent(governedExports = {}, agentId = "") {
  const overrides = normalizeStringMap(governedExports.agentWorkspaceIds);
  const normalizedAgentId = normalizeString(agentId);

  if (normalizedAgentId && overrides[normalizedAgentId]) {
    return overrides[normalizedAgentId];
  }

  return normalizeString(governedExports.workspaceId, "default-workspace");
}

function resolveAcceptedActionPayload(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return null;
  }

  const nested = result.acceptedAction && typeof result.acceptedAction === "object" && !Array.isArray(result.acceptedAction)
    ? result.acceptedAction
    : result.accepted_action && typeof result.accepted_action === "object" && !Array.isArray(result.accepted_action)
      ? result.accepted_action
      : null;

  return nested
    ? { ...result, ...nested }
    : { ...result };
}

export function resolveOpenClawAcceptedActionHookConfig(pluginConfig = {}) {
  const raw = pluginConfig?.openclawAdapter?.acceptedActions || {};
  const governedExports = pluginConfig?.openclawAdapter?.governedExports || {};
  const registryResolution = resolveRegistryRoot({
    explicitDir: governedExports.registryDir
  });

  return {
    enabled: raw.enabled !== false,
    visibility: parseVisibility(raw.visibility || "workspace"),
    governedExports: {
      registryDir: registryResolution.registryDir,
      registryResolution,
      workspaceId: resolveWorkspaceIdForAgent(governedExports, ""),
      agentWorkspaceIds: normalizeStringMap(governedExports.agentWorkspaceIds),
      agentNamespace: {
        enabled: governedExports?.agentNamespace?.enabled === true
      },
      tenant: normalizeString(governedExports.tenant, "local"),
      scope: normalizeString(governedExports.scope, "workspace"),
      resource: normalizeString(governedExports.resource, "openclaw-shared-memory"),
      host: normalizeString(governedExports.host, "")
    }
  };
}

function resolveAcceptedActionNamespace(config, ctx = {}) {
  const governedExports = config.governedExports;
  const workspaceId = resolveWorkspaceIdForAgent(governedExports, ctx.agentId);
  const baseContext = {
    workspaceId,
    tenant: governedExports.tenant,
    scope: governedExports.scope,
    resource: governedExports.resource,
    host: governedExports.host
  };

  if (governedExports.agentNamespace.enabled && normalizeString(ctx.agentId)) {
    return resolveOpenClawAgentNamespace({
      ...baseContext,
      agentId: normalizeString(ctx.agentId)
    });
  }

  return resolveOpenClawNamespace(baseContext);
}

export function createOpenClawAcceptedActionSource({
  event = {},
  ctx = {},
  result,
  pluginConfig = {}
} = {}) {
  const config = resolveOpenClawAcceptedActionHookConfig(pluginConfig);
  const payload = resolveAcceptedActionPayload(result);
  const actionType = normalizeString(payload?.actionType || payload?.action_type || payload?.kind);

  if (!config.enabled || !actionType) {
    return null;
  }

  const status = normalizeString(payload?.status, "succeeded");
  const accepted = normalizeBoolean(
    payload?.accepted ?? payload?.userAccepted ?? payload?.user_accepted,
    true
  );
  const succeeded = normalizeBoolean(
    payload?.succeeded ?? payload?.executionSucceeded ?? payload?.execution_succeeded ?? status,
    /success|succeed|applied|completed|done/iu.test(status)
  );
  const outputs = normalizeOptionalObject(payload?.outputs);
  const inputs = normalizeOptionalObject(payload?.inputs);
  const declaredSource = {
    sourceType: "accepted_action",
    declaredBy: `openclaw-plugin:${normalizeString(event.toolName || ctx.toolName, "unknown-tool")}`,
    namespace: resolveAcceptedActionNamespace(config, ctx),
    visibility: parseVisibility(payload?.visibility || config.visibility),
    actionType,
    status,
    accepted,
    succeeded,
    agentId: normalizeString(payload?.agentId || payload?.agent_id || ctx.agentId || ""),
    targets: normalizeStringArrayLike(
      payload?.targets ?? payload?.externalTargets ?? payload?.external_targets,
      []
    ),
    artifacts: normalizeStringArrayLike(
      payload?.artifacts ?? payload?.artifactPaths ?? payload?.artifact_paths,
      []
    ),
    content: normalizePromptText(
      payload?.content
      || payload?.summary
      || payload?.message
      || payload?.text
      || `${normalizeString(event.toolName || ctx.toolName, "tool")} completed accepted action ${actionType}`
    )
  };

  if (inputs) {
    declaredSource.inputs = inputs;
  }
  if (outputs) {
    declaredSource.outputs = outputs;
  }

  return declaredSource;
}

export function createOpenClawAcceptedActionHookRuntime(options = {}) {
  const clock = options.clock || (() => new Date());
  const logger = options.logger;
  const pluginConfig = options.pluginConfig || {};
  const config = resolveOpenClawAcceptedActionHookConfig(pluginConfig);
  const registry = createMemoryRegistry({
    rootDir: config.governedExports.registryDir,
    clock
  });
  const sourceSystem = createSourceSystem({
    clock,
    defaultNamespace: resolveAcceptedActionNamespace(config, {}),
    defaultVisibility: config.visibility
  });
  const reflectionSystem = createReflectionSystem({
    registry,
    clock
  });
  const writeChains = new Map();

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

  async function captureAfterToolCall(event = {}, ctx = {}) {
    const declaredSource = createOpenClawAcceptedActionSource({
      event,
      ctx,
      result: event.result,
      pluginConfig
    });

    if (!declaredSource) {
      return null;
    }

    return withNamespaceWriteLock(declaredSource.namespace, async () => {
      const sourceResult = await sourceSystem.ingestDeclaredSource(declaredSource);
      const sourceRecord = await registry.persistSourceArtifact(sourceResult.sourceArtifact);
      const reflection = await reflectionSystem.runReflection({
        sourceArtifacts: [sourceResult.sourceArtifact],
        persistCandidates: true,
        decidedBy: declaredSource.declaredBy
      });
      const promoted = [];

      for (const output of reflection.outputs) {
        if (!output.recommendation.should_promote) {
          continue;
        }
        promoted.push(await registry.promoteCandidateToStable({
          candidateArtifactId: output.candidate_artifact.artifact_id,
          decidedBy: declaredSource.declaredBy,
          reasonCodes: [
            "openclaw_accepted_action_promotion",
            `label:${output.primary_label}`,
            `tool:${normalizeString(event.toolName || ctx.toolName, "unknown-tool")}`
          ]
        }));
      }

      logger?.info?.(
        `[unified-memory-core] openclaw accepted_action captured (tool=${normalizeString(event.toolName || ctx.toolName, "unknown-tool")}, namespace=${createNamespaceKey(declaredSource.namespace)}, promoted=${promoted.length})`
      );

      return {
        declared_source: declaredSource,
        sourceManifest: sourceResult.sourceManifest,
        sourceArtifact: sourceResult.sourceArtifact,
        sourceRecord,
        reflection,
        promoted
      };
    });
  }

  return {
    enabled: config.enabled,
    config,
    captureAfterToolCall
  };
}
