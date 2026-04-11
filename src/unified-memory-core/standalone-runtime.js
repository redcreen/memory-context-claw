import os from "node:os";
import path from "node:path";

import { createMemoryRegistry } from "./memory-registry.js";
import { createSourceSystem } from "./source-system.js";
import { createProjectionSystem } from "./projection-system.js";
import { createGovernanceSystem } from "./governance-system.js";
import { createReflectionSystem } from "./reflection-system.js";
import { parseNamespace, parseVisibility } from "./contracts.js";

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

export function resolveStandaloneConfig(raw = {}) {
  const namespace = parseNamespace(raw.namespace || {
    tenant: normalizeString(raw.tenant, "local"),
    scope: normalizeString(raw.scope, "workspace"),
    resource: normalizeString(raw.resource, "unified-memory-core"),
    key: normalizeString(raw.key, "default"),
    ...(normalizeString(raw.host, "") ? { host: normalizeString(raw.host, "") } : {})
  });

  return {
    registryDir: normalizeString(raw.registryDir, DEFAULT_REGISTRY_DIR),
    namespace,
    visibility: parseVisibility(normalizeString(raw.visibility, "workspace"))
  };
}

export function createStandaloneRuntime(options = {}) {
  const clock = options.clock || (() => new Date());
  const config = resolveStandaloneConfig(options.config);
  const registry = createMemoryRegistry({
    rootDir: config.registryDir,
    clock
  });
  const sourceSystem = createSourceSystem({
    clock,
    defaultNamespace: config.namespace,
    defaultVisibility: config.visibility
  });
  const reflectionSystem = createReflectionSystem({
    registry,
    clock
  });
  const projectionSystem = createProjectionSystem({
    registry,
    clock
  });
  const governanceSystem = createGovernanceSystem({
    registry,
    projectionSystem,
    clock
  });

  async function addSource(declaredSource, { persist = true } = {}) {
    const result = await sourceSystem.ingestDeclaredSource(declaredSource);
    const sourceRecord = persist ? await registry.persistSourceArtifact(result.sourceArtifact) : null;
    return {
      ...result,
      sourceRecord
    };
  }

  async function reflectDeclaredSource({
    declaredSource,
    dryRun = false,
    promoteCandidates = false,
    decidedBy = "standalone-runtime"
  } = {}) {
    const sourceResult = await addSource(declaredSource, { persist: !dryRun });
    const reflectionResult = await reflectionSystem.runReflection({
      sourceArtifacts: [sourceResult.sourceArtifact],
      persistCandidates: !dryRun,
      decidedBy
    });

    const promoted = [];
    if (!dryRun && promoteCandidates) {
      for (const output of reflectionResult.outputs) {
        if (!output.recommendation.should_promote) {
          continue;
        }
        promoted.push(await registry.promoteCandidateToStable({
          candidateArtifactId: output.candidate_artifact.artifact_id,
          decidedBy,
          reasonCodes: ["reflection_promotion", `label:${output.primary_label}`]
        }));
      }
    }

    return {
      ...sourceResult,
      reflection: reflectionResult,
      promoted
    };
  }

  async function buildExport({
    consumer = "generic",
    namespace = config.namespace,
    allowedVisibilities,
    allowedStates
  } = {}) {
    return projectionSystem.buildExport({
      consumer,
      namespace,
      allowedVisibilities,
      allowedStates
    });
  }

  async function auditNamespace({
    namespace = config.namespace,
    allowedVisibilities,
    allowedStates
  } = {}) {
    return governanceSystem.auditNamespace({
      namespace,
      allowedVisibilities,
      allowedStates
    });
  }

  return {
    config,
    registry,
    sourceSystem,
    reflectionSystem,
    projectionSystem,
    governanceSystem,
    addSource,
    reflectDeclaredSource,
    buildExport,
    auditNamespace,
    getStats() {
      return registry.getStats();
    }
  };
}
