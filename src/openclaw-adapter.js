import os from "node:os";
import path from "node:path";

import {
  createMemoryRegistry,
  createOpenClawAdapterBridge,
  createProjectionSystem
} from "./unified-memory-core/index.js";

const DEFAULT_REGISTRY_DIR = path.join(
  os.homedir(),
  ".openclaw",
  "unified-memory-core",
  "registry"
);

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

export function resolveOpenClawAdapterConfig(pluginConfig = {}) {
  const raw = pluginConfig?.openclawAdapter || {};
  const governedExports = raw?.governedExports || {};

  return {
    enabled: raw.enabled !== false,
    governedExports: {
      enabled: governedExports.enabled !== false,
      registryDir: normalizeString(governedExports.registryDir, DEFAULT_REGISTRY_DIR),
      workspaceId: normalizeString(governedExports.workspaceId, "default-workspace"),
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

export function mapOpenClawExportToCandidates(exportResult, { query, maxCandidates }) {
  const items = Array.isArray(exportResult?.payload?.memory_items)
    ? exportResult.payload.memory_items
    : [];

  return items.slice(0, maxCandidates).map((item, index) => {
    const baseScore = Math.max(0.01, 0.92 - index * 0.03);
    return {
      id: item.memory_id,
      path: `umc://openclaw-export/${item.memory_id}`,
      canonicalPath: `umc://openclaw-export/${item.memory_id}`,
      startLine: 1,
      endLine: 1,
      snippet: String(item.summary || item.title || ""),
      source: "governedArtifact",
      pathKind: "governedArtifact",
      title: item.title,
      visibility: item.visibility,
      exportHints: item.export_hints,
      attributes: item.attributes,
      score: baseScore,
      retrievalScore: baseScore,
      sourceQuery: query,
      fusionScore: baseScore + 1 / (index + 1)
    };
  });
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
  const bridge = createOpenClawAdapterBridge({ projectionSystem });

  return {
    enabled: true,
    async loadGovernedCandidates({ query, maxCandidates } = {}) {
      try {
        const exportResult = await bridge.loadExports(
          {
            workspaceId: config.governedExports.workspaceId,
            tenant: config.governedExports.tenant,
            scope: config.governedExports.scope,
            resource: config.governedExports.resource,
            host: config.governedExports.host
          },
          {
            allowedVisibilities: config.governedExports.allowedVisibilities,
            allowedStates: config.governedExports.allowedStates
          }
        );

        return mapOpenClawExportToCandidates(exportResult, {
          query,
          maxCandidates: Math.min(
            maxCandidates || config.governedExports.maxCandidates,
            config.governedExports.maxCandidates
          )
        });
      } catch (error) {
        logger?.warn?.(
          `[unified-memory-core] openclaw adapter export loading failed: ${String(error)}`
        );
        return [];
      }
    }
  };
}
