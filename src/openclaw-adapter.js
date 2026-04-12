import {
  createMemoryRegistry,
  createProjectionSystem,
  resolveOpenClawAgentNamespace,
  resolveOpenClawNamespace,
  resolveRegistryRoot
} from "./unified-memory-core/index.js";
import { mapOpenClawExportToCandidates } from "./unified-memory-core/openclaw-consumption.js";
export { mapOpenClawExportToCandidates } from "./unified-memory-core/openclaw-consumption.js";

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

function resolveWorkspaceIdForAgent(governedExports, agentId) {
  const normalizedAgentId = normalizeString(agentId);
  const overrides = governedExports.agentWorkspaceIds || {};

  if (normalizedAgentId && typeof overrides[normalizedAgentId] === "string" && overrides[normalizedAgentId].trim()) {
    return overrides[normalizedAgentId].trim();
  }

  return governedExports.workspaceId;
}

function dedupeGovernedCandidates(candidates, maxCandidates) {
  const seen = new Set();
  const merged = [];

  for (const candidate of candidates) {
    const key = String(candidate?.id || candidate?.path || "");
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(candidate);
    if (merged.length >= maxCandidates) {
      break;
    }
  }

  return merged;
}

export function resolveOpenClawAdapterConfig(pluginConfig = {}) {
  const raw = pluginConfig?.openclawAdapter || {};
  const governedExports = raw?.governedExports || {};
  const agentNamespace = governedExports?.agentNamespace || {};

  return {
    enabled: raw.enabled !== false,
    governedExports: {
      enabled: governedExports.enabled !== false,
      ...(() => {
        const registryResolution = resolveRegistryRoot({
          explicitDir: governedExports.registryDir
        });
        return {
          registryDir: registryResolution.registryDir,
          registryResolution
        };
      })(),
      workspaceId: normalizeString(governedExports.workspaceId, "default-workspace"),
      agentWorkspaceIds: normalizeStringMap(governedExports.agentWorkspaceIds),
      agentNamespace: {
        enabled: agentNamespace.enabled === true
      },
      tenant: normalizeString(governedExports.tenant, "local"),
      scope: normalizeString(governedExports.scope, "workspace"),
      resource: normalizeString(governedExports.resource, "openclaw-shared-memory"),
      host: normalizeString(governedExports.host, ""),
      allowedVisibilities: normalizeStringList(
        governedExports.allowedVisibilities,
        ["private", "workspace", "shared", "public"]
      ),
      allowedStates: normalizeStringList(governedExports.allowedStates, ["stable"]),
      maxCandidates: Number.isFinite(governedExports.maxCandidates)
        ? Math.max(1, Math.min(20, Number(governedExports.maxCandidates)))
        : 4
    }
  };
}

export function createOpenClawAdapterRuntime(options = {}) {
  const logger = options.logger;
  const config = resolveOpenClawAdapterConfig(options.pluginConfig);

  if (!config.enabled || !config.governedExports.enabled) {
    return {
      enabled: false,
      async loadGovernedCandidates() {
        return [];
      }
    };
  }

  const registry = createMemoryRegistry({
    rootDir: config.governedExports.registryDir
  });
  const projectionSystem = createProjectionSystem({ registry });

  return {
    enabled: true,
    async loadGovernedCandidates({ query, maxCandidates, agentId } = {}) {
      try {
        const requestedMaxCandidates = Math.min(
          maxCandidates || config.governedExports.maxCandidates,
          config.governedExports.maxCandidates
        );
        const resolvedWorkspaceId = resolveWorkspaceIdForAgent(
          config.governedExports,
          agentId
        );
        const baseContext = {
          workspaceId: resolvedWorkspaceId,
          tenant: config.governedExports.tenant,
          scope: config.governedExports.scope,
          resource: config.governedExports.resource,
          host: config.governedExports.host
        };
        const namespaces = [
          resolveOpenClawNamespace(baseContext)
        ];

        if (config.governedExports.agentNamespace.enabled && agentId) {
          namespaces.unshift(resolveOpenClawAgentNamespace({
            ...baseContext,
            agentId
          }));
        }

        const exportResults = await Promise.all(
          namespaces.map((namespace) => projectionSystem.buildOpenClawExport({
            namespace,
            allowedVisibilities: config.governedExports.allowedVisibilities,
            allowedStates: config.governedExports.allowedStates
          }))
        );

        const candidates = dedupeGovernedCandidates(
          exportResults.flatMap((exportResult, namespaceIndex) => mapOpenClawExportToCandidates(exportResult, {
            query,
            maxCandidates: requestedMaxCandidates + namespaceIndex
          })),
          requestedMaxCandidates
        );

        return candidates;
      } catch (error) {
        logger?.warn?.(
          `[unified-memory-core] openclaw adapter export loading failed: ${String(error)}`
        );
        return [];
      }
    }
  };
}
