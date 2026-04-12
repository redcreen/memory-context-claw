import { createMemoryRegistry } from "./memory-registry.js";
import { createSourceSystem } from "./source-system.js";
import { createProjectionSystem } from "./projection-system.js";
import { createGovernanceSystem } from "./governance-system.js";
import { createReflectionSystem } from "./reflection-system.js";
import { createDailyReflectionRunner } from "./daily-reflection.js";
import { createIndependentExecutionReview } from "./independent-execution.js";
import { parseNamespace, parseVisibility } from "./contracts.js";
import {
  buildRegistryRootReport,
  inspectRegistryTopology,
  migrateRegistryRoot,
  resolveRegistryRoot
} from "./registry-roots.js";

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

  const registryResolution = resolveRegistryRoot({
    explicitDir: raw.registryDir,
    env: raw.env
  });

  return {
    registryDir: registryResolution.registryDir,
    registryResolution,
    namespace,
    visibility: parseVisibility(normalizeString(raw.visibility, "workspace"))
  };
}

export function createStandaloneRuntime(options = {}) {
  const clock = options.clock || (() => new Date());
  const config = resolveStandaloneConfig(options.config);
  const repoRoot = options.repoRoot || process.cwd();
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
  const dailyReflectionRunner = createDailyReflectionRunner({
    sourceSystem,
    reflectionSystem,
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

  async function inspectExport(params = {}) {
    return buildExport(params);
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

  async function planRepair({
    namespace = config.namespace,
    findingCode,
    action,
    decidedBy = "standalone-runtime",
    targetRecordIds,
    dryRun = true,
    notes = [],
    allowedVisibilities,
    allowedStates
  } = {}) {
    const report = await governanceSystem.auditNamespace({
      namespace,
      allowedVisibilities,
      allowedStates
    });
    const matchingFinding = report.findings.find(
      (finding) => finding.code === String(findingCode || "").trim()
    );

    return governanceSystem.createRepairRecord({
      namespace,
      findingCode,
      action,
      decidedBy,
      targetRecordIds:
        Array.isArray(targetRecordIds) && targetRecordIds.length > 0
          ? targetRecordIds
          : matchingFinding?.record_refs || [],
      dryRun,
      notes
    });
  }

  async function planReplay({
    namespace = config.namespace,
    replayedBy = "standalone-runtime",
    exportId,
    inputRefs,
    result = "queued",
    notes = [],
    allowedVisibilities,
    allowedStates
  } = {}) {
    const exportResult = await projectionSystem.buildGenericExport({
      namespace,
      allowedVisibilities,
      allowedStates
    });

    return governanceSystem.createReplayRun({
      namespace,
      exportId: exportId || exportResult.exportContract.export_id,
      replayedBy,
      inputRefs:
        Array.isArray(inputRefs) && inputRefs.length > 0
          ? inputRefs
          : exportResult.exportContract.artifact_refs,
      result,
      notes
    });
  }

  return {
    config,
    registry,
    sourceSystem,
    reflectionSystem,
    dailyReflectionRunner,
    projectionSystem,
    governanceSystem,
    addSource,
    reflectDeclaredSource,
    runDailyReflection(params) {
      return dailyReflectionRunner.runDailyReflection(params);
    },
    buildExport,
    inspectExport,
    auditNamespace,
    planRepair,
    planReplay,
    inspectRegistryRoot() {
      return buildRegistryRootReport({
        explicitDir: options?.config?.registryDir,
        env: options?.config?.env
      });
    },
    inspectRegistryTopology() {
      return inspectRegistryTopology({
        explicitDir: options?.config?.registryDir,
        env: options?.config?.env
      });
    },
    migrateRegistryRoot(params = {}) {
      return migrateRegistryRoot({
        explicitDir: options?.config?.registryDir,
        env: options?.config?.env,
        sourceDir: params.sourceDir,
        targetDir: params.targetDir,
        apply: params.apply === true
      });
    },
    reviewIndependentExecution(params = {}) {
      return createIndependentExecutionReview({
        repoRoot: params.repoRoot || repoRoot,
        clock
      });
    },
    getStats() {
      return registry.getStats();
    }
  };
}
