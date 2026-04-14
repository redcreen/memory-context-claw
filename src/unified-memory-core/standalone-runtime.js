import { createMemoryRegistry } from "./memory-registry.js";
import { createSourceSystem } from "./source-system.js";
import { createProjectionSystem } from "./projection-system.js";
import { createGovernanceSystem } from "./governance-system.js";
import { createReflectionSystem } from "./reflection-system.js";
import { createDailyReflectionRunner } from "./daily-reflection.js";
import { createIndependentExecutionReview } from "./independent-execution.js";
import {
  SHARED_CONTRACT_VERSION,
  createContractId,
  createContractTimestamp,
  createNamespaceKey,
  parseNamespace,
  parseVisibility
} from "./contracts.js";
import {
  applyPolicyToMemoryItems,
  applyPolicyToScoredCandidates,
  createPolicyContext
} from "./policy-adaptation.js";
import {
  buildRegistryRootReport,
  inspectRegistryTopology,
  migrateRegistryRoot,
  resolveRegistryRoot
} from "./registry-roots.js";
import { mapOpenClawExportToCandidates } from "./openclaw-consumption.js";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function countExportArtifacts(exportResult) {
  if (Array.isArray(exportResult?.artifacts)) {
    return exportResult.artifacts.length;
  }
  if (Array.isArray(exportResult?.payload?.artifacts)) {
    return exportResult.payload.artifacts.length;
  }
  if (Array.isArray(exportResult?.payload?.openclaw_context)) {
    return exportResult.payload.openclaw_context.length;
  }
  if (Array.isArray(exportResult?.payload?.code_memory)) {
    return exportResult.payload.code_memory.length;
  }
  return 0;
}

function countPolicyInputs(exportResult) {
  if (Array.isArray(exportResult?.payload?.policy_inputs)) {
    return exportResult.payload.policy_inputs.length;
  }
  return Number(exportResult?.exportContract?.metadata?.policy_input_count || 0);
}

function createAcceptanceCheck({
  phase,
  code,
  passed,
  expected,
  actual,
  message,
  severity = "error"
}) {
  return {
    phase,
    code,
    severity,
    status: passed ? "pass" : "fail",
    expected,
    actual,
    message
  };
}

function summarizeDeclaredSource(declaredSource) {
  if (!declaredSource || typeof declaredSource !== "object") {
    return {
      source_type: "unknown",
      preview: ""
    };
  }

  const sourceType = normalizeString(declaredSource.sourceType, "unknown");
  if (sourceType === "manual") {
    return {
      source_type: sourceType,
      preview: normalizeString(declaredSource.content, "").slice(0, 120)
    };
  }
  if (sourceType === "conversation") {
    const firstMessage = Array.isArray(declaredSource.messages) ? declaredSource.messages[0] : null;
    return {
      source_type: sourceType,
      preview: normalizeString(firstMessage?.content, "").slice(0, 120)
    };
  }
  if (sourceType === "url") {
    return {
      source_type: sourceType,
      preview: normalizeString(declaredSource.url || declaredSource.href || declaredSource.path, "").slice(0, 120)
    };
  }
  if (sourceType === "accepted_action") {
    return {
      source_type: sourceType,
      preview: normalizeString(
        declaredSource.content
        || declaredSource.summary
        || declaredSource.actionType
        || declaredSource.action_type,
        ""
      ).slice(0, 120)
    };
  }
  if (sourceType === "memory_intent") {
    return {
      source_type: sourceType,
      preview: normalizeString(
        declaredSource.summary
        || declaredSource.content
        || declaredSource.category,
        ""
      ).slice(0, 120)
    };
  }
  if (sourceType === "image") {
    return {
      source_type: sourceType,
      preview: normalizeString(
        declaredSource.altText
        || declaredSource.alt_text
        || declaredSource.caption
        || declaredSource.path,
        ""
      ).slice(0, 120)
    };
  }
  if (normalizeString(declaredSource.source_type, "")) {
    return {
      source_type: normalizeString(declaredSource.source_type, "unknown"),
      preview: normalizeString(
        declaredSource.normalized_payload?.text
        || declaredSource.normalized_payload?.path
        || declaredSource.normalized_payload?.url,
        ""
      ).slice(0, 120)
    };
  }

  return {
    source_type: sourceType,
    preview: normalizeString(declaredSource.path, "").slice(0, 120)
  };
}

function summarizeDeclaredSources(declaredSources = []) {
  const byType = {};
  const previews = [];

  for (const declaredSource of declaredSources) {
    const summary = summarizeDeclaredSource(declaredSource);
    byType[summary.source_type] = (byType[summary.source_type] || 0) + 1;
    if (summary.preview) {
      previews.push(summary.preview);
    }
  }

  return {
    source_count: declaredSources.length,
    by_source_type: byType,
    previews: previews.slice(0, 5)
  };
}

function buildExportSnapshot(consumer, exportResult, consumerSummary = {}) {
  return {
    consumer,
    export_id: exportResult?.exportContract?.export_id || "",
    artifact_count: countExportArtifacts(exportResult),
    policy_input_count: countPolicyInputs(exportResult),
    rollback_status: normalizeString(consumerSummary.rollback_status, "unknown"),
    supporting_context_mode: normalizeString(consumerSummary.supporting_context_mode, "unknown")
  };
}

function summarizeCheckStatus(checks = []) {
  const passedChecks = checks.filter((check) => check.status === "pass").length;
  const failedChecks = checks.length - passedChecks;
  return {
    status: failedChecks === 0 ? "pass" : "fail",
    total_checks: checks.length,
    passed_checks: passedChecks,
    failed_checks: failedChecks
  };
}

function buildConsumerReproducibility(consumer, runs = []) {
  const payloadFingerprints = runs.map((run) => normalizeString(run.payloadFingerprint));
  const policyFingerprints = runs.map((run) => normalizeString(run.policyFingerprint));
  const rollbackStatuses = runs.map((run) => normalizeString(run.rollbackStatus, "unknown"));
  const artifactRefs = runs.map((run) => JSON.stringify(run.artifactRefs || []));
  const payloadStable = new Set(payloadFingerprints).size <= 1;
  const policyStable = new Set(policyFingerprints).size <= 1;
  const artifactRefsStable = new Set(artifactRefs).size <= 1;
  const rollbackStable = new Set(rollbackStatuses).size <= 1;

  return {
    consumer,
    runs: runs.length,
    payload_fingerprints: payloadFingerprints,
    policy_fingerprints: policyFingerprints,
    rollback_statuses: rollbackStatuses,
    payload_stable: payloadStable,
    policy_stable: policyStable,
    artifact_refs_stable: artifactRefsStable,
    rollback_stable: rollbackStable,
    artifact_count: Number(runs[0]?.artifactCount || 0),
    policy_input_count: Number(runs[0]?.policyInputCount || 0)
  };
}

function countReviewIssues(review = {}) {
  return Object.values(review.readiness_checks || {})
    .filter((item) => item.status !== "ready")
    .length;
}

export function renderMaintenanceWorkflowReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Maintenance Workflow");
  lines.push(`- runId: \`${report.run_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(report.namespace)}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push(`- registryDir: \`${report.registry_dir}\``);
  lines.push(`- status: \`${report.summary.status}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- sources: \`${report.sources.source_count}\``);
  lines.push(`- stableLearningArtifacts: \`${report.summary.stable_learning_artifacts}\``);
  lines.push(`- lifecycleFindings: \`${report.summary.learning_findings}\``);
  lines.push(`- policyFindings: \`${report.summary.policy_findings}\``);
  lines.push(`- namespaceFindings: \`${report.summary.namespace_findings}\``);
  lines.push(`- replayPlan: \`${report.summary.replay_plan_status}\``);
  lines.push(`- repairPlan: \`${report.summary.repair_plan_status}\``);
  lines.push("");
  lines.push("## Source Coverage");
  for (const [sourceType, count] of Object.entries(report.sources.by_source_type || {})) {
    lines.push(`- ${sourceType}: ${count}`);
  }
  lines.push("");
  lines.push("## Checks");
  lines.push(`- policyLoopStatus: \`${report.policy_loop.policy_audit.findings.length === 0 ? "clean" : "followup"}\``);
  lines.push(`- learningAuditStatus: \`${report.policy_loop.learning_lifecycle.learning_audit.findings.length === 0 ? "clean" : "followup"}\``);
  lines.push(`- namespaceAuditStatus: \`${report.namespace_audit.findings.length === 0 ? "clean" : "followup"}\``);
  lines.push(`- topologyMigrationNeeded: \`${report.registry_topology.summary.migration_needed}\``);
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderExportReproducibilityReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Export Reproducibility");
  lines.push(`- reportId: \`${report.report_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(report.namespace)}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push(`- status: \`${report.summary.status}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- consumersChecked: \`${report.summary.consumers_checked}\``);
  lines.push(`- stableConsumers: \`${report.summary.stable_consumers}\``);
  lines.push(`- failedConsumers: \`${report.summary.failed_consumers}\``);
  lines.push("");
  lines.push("## Consumers");
  for (const consumer of Object.values(report.consumers || {})) {
    lines.push(
      `- ${consumer.consumer}: payload=${consumer.payload_stable} policy=${consumer.policy_stable} refs=${consumer.artifact_refs_stable} rollback=${consumer.rollback_stable}`
    );
  }
  lines.push("");
  lines.push("## Findings");
  if (!Array.isArray(report.findings) || report.findings.length === 0) {
    lines.push("- none");
  } else {
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderSplitRehearsalReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Split Rehearsal");
  lines.push(`- rehearsalId: \`${report.rehearsal_id}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push(`- repoRoot: \`${report.repo_root}\``);
  lines.push(`- registrySource: \`${report.registry_migration.source_dir}\``);
  lines.push(`- registryTarget: \`${report.registry_migration.target_dir}\``);
  lines.push(`- status: \`${report.summary.status}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- independentReviewIssues: \`${report.summary.independent_review_issues}\``);
  lines.push(`- migrationNeeded: \`${report.summary.migration_needed}\``);
  lines.push(`- migrationAddsRecords: \`${report.summary.added_records}\``);
  lines.push("");
  lines.push("## Path Mapping");
  for (const item of report.path_mapping) {
    lines.push(`- ${item.from} -> ${item.to}`);
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderStage5AcceptanceReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Stage 5 Acceptance");
  lines.push(`- reportId: \`${report.report_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(report.namespace)}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push(`- registryDir: \`${report.registry_dir}\``);
  lines.push(`- status: \`${report.summary.status}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- passedChecks: \`${report.summary.passed_checks}\``);
  lines.push(`- failedChecks: \`${report.summary.failed_checks}\``);
  lines.push(`- totalChecks: \`${report.summary.total_checks}\``);
  lines.push(`- sourceCount: \`${report.sources.source_count}\``);
  lines.push(`- stage34Status: \`${report.stage34_acceptance.summary.status}\``);
  lines.push(`- maintenanceStatus: \`${report.maintenance.summary.status}\``);
  lines.push(`- reproducibilityStatus: \`${report.reproducibility.summary.status}\``);
  lines.push(`- splitRehearsalStatus: \`${report.split_rehearsal.summary.status}\``);
  lines.push("");
  lines.push("## Checks");
  for (const check of report.checks) {
    lines.push(
      `- [${check.status.toUpperCase()}] ${check.phase}.${check.code}: ${check.message} (expected=${check.expected}; actual=${check.actual})`
    );
  }
  lines.push("");
  lines.push("## Source Coverage");
  for (const [sourceType, count] of Object.entries(report.sources.by_source_type || {})) {
    lines.push(`- ${sourceType}: ${count}`);
  }
  lines.push("");
  lines.push("## Minimal Human Follow-Up");
  for (const item of report.manual_follow_up) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderStage34AcceptanceReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Stage 3-4 Acceptance");
  lines.push(`- reportId: \`${report.report_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(report.namespace)}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push(`- registryDir: \`${report.registry_dir}\``);
  lines.push(`- status: \`${report.summary.status}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- passedChecks: \`${report.summary.passed_checks}\``);
  lines.push(`- failedChecks: \`${report.summary.failed_checks}\``);
  lines.push(`- totalChecks: \`${report.summary.total_checks}\``);
  lines.push(`- stableLearningArtifacts: \`${report.learning_lifecycle.summary.stable_learning_artifacts}\``);
  lines.push(`- openclawPolicyInputs: \`${report.policy_adaptation.summary.openclaw_policy_inputs}\``);
  lines.push(`- codexPolicyInputs: \`${report.policy_adaptation.summary.codex_policy_inputs}\``);
  lines.push(`- genericPolicyInputs: \`${report.policy_adaptation.summary.generic_policy_inputs}\``);
  lines.push("");
  lines.push("## Checks");
  for (const check of report.checks) {
    lines.push(
      `- [${check.status.toUpperCase()}] ${check.phase}.${check.code}: ${check.message} (expected=${check.expected}; actual=${check.actual})`
    );
  }
  lines.push("");
  lines.push("## Consumers");
  for (const snapshot of Object.values(report.exports)) {
    lines.push(
      `- ${snapshot.consumer}: artifacts=${snapshot.artifact_count} policyInputs=${snapshot.policy_input_count} rollback=${snapshot.rollback_status} mode=${snapshot.supporting_context_mode}`
    );
  }
  lines.push("");
  lines.push("## Runtime Signals");
  lines.push(`- openclawCandidateCount: \`${report.openclaw_context.candidate_count}\``);
  lines.push(`- openclawSupportingContextMode: \`${report.openclaw_context.supporting_context_mode}\``);
  lines.push(`- codexMemoryItemCount: \`${report.codex_context.memory_item_count}\``);
  lines.push(`- codexResponseStyle: \`${report.codex_context.response_style}\``);
  lines.push("");
  lines.push("## Minimal Human Follow-Up");
  for (const item of report.manual_follow_up) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
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

  function buildCodexTaskMemory(exportResult, policyContext, { taskPrompt = "", maxItems = 6 } = {}) {
    const mappedItems = Array.isArray(exportResult?.payload?.code_memory)
      ? exportResult.payload.code_memory.map((item) => ({
          memory_id: item.memory_id,
          title: item.title,
          summary: item.summary,
          namespace: item.namespace,
          evidence_refs: item.evidence_refs,
          attributes: item.attributes,
          export_hints: item.export_hints
        }))
      : [];
    const adapted = applyPolicyToMemoryItems(mappedItems, {
      policyContext,
      prompt: taskPrompt,
      maxItems
    });
    const promptBlock = adapted.memory_items.length === 0
      ? ""
      : [
          "## Shared Code Memory",
          ...adapted.memory_items.map((item) => `- ${item.title}: ${item.summary}`)
        ].join("\n");

    return {
      task_prompt: taskPrompt,
      export_version: exportResult.exportVersion,
      export_contract: exportResult.exportContract,
      namespace: exportResult.exportContract.namespace,
      policy_inputs: policyContext.enabled ? policyContext.policy_inputs : [],
      policy_block: policyContext.policy_block || "",
      task_defaults: {
        response_style: policyContext.response_style || "default",
        supporting_context_mode: policyContext.supporting_context_mode || "default",
        avoid_patterns: policyContext.avoid_patterns || [],
        prefer_patterns: policyContext.prefer_patterns || []
      },
      policy_adaptation: adapted.adaptation,
      memory_items: adapted.memory_items,
      prompt_block: promptBlock
    };
  }

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

  async function auditLearningLifecycle({
    namespace = config.namespace,
    allowedVisibilities,
    allowedStates,
    referenceTime,
    maxOpenClawCandidates
  } = {}) {
    return governanceSystem.auditLearningLifecycle({
      namespace,
      allowedVisibilities,
      allowedStates,
      referenceTime,
      maxOpenClawCandidates
    });
  }

  async function compareLearningTimeWindows({
    namespace = config.namespace,
    currentWindowDays,
    previousWindowDays,
    referenceTime
  } = {}) {
    return governanceSystem.compareLearningTimeWindows({
      namespace,
      currentWindowDays,
      previousWindowDays,
      referenceTime
    });
  }

  async function auditPolicyAdaptation({
    namespace = config.namespace,
    allowedVisibilities,
    allowedStates,
    maxPolicyInputs
  } = {}) {
    return governanceSystem.auditPolicyAdaptation({
      namespace,
      allowedVisibilities,
      allowedStates,
      maxPolicyInputs
    });
  }

  async function validateOpenClawConsumption({
    namespace = config.namespace,
    allowedVisibilities,
    allowedStates,
    maxCandidates,
    expectedArtifactIds
  } = {}) {
    return governanceSystem.validateOpenClawConsumption({
      namespace,
      allowedVisibilities,
      allowedStates,
      maxCandidates,
      expectedArtifactIds
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

  async function planLearningRepair({
    namespace = config.namespace,
    findingCode,
    action,
    decidedBy = "standalone-runtime",
    targetRecordIds = [],
    dryRun = true,
    notes = [],
    report
  } = {}) {
    const lifecycleReport = report || await governanceSystem.auditLearningLifecycle({
      namespace
    });

    return governanceSystem.createLearningRepairRecord({
      namespace,
      findingCode,
      action,
      decidedBy,
      targetRecordIds,
      dryRun,
      notes,
      report: lifecycleReport
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

  async function planLearningReplay({
    namespace = config.namespace,
    replayedBy = "standalone-runtime",
    exportId,
    inputRefs,
    result = "queued",
    notes = [],
    report
  } = {}) {
    const lifecycleReport = report || await governanceSystem.auditLearningLifecycle({
      namespace
    });

    return governanceSystem.createLearningReplayRun({
      namespace,
      exportId,
      replayedBy,
      inputRefs: Array.isArray(inputRefs) ? inputRefs : [],
      result,
      notes,
      report: lifecycleReport
    });
  }

  async function runLearningLifecycle({
    declaredSources = [],
    sourceArtifacts = [],
    dryRun = false,
    autoPromote = true,
    decidedBy = "standalone-runtime",
    allowedVisibilities,
    allowedStates,
    comparisonWindowDays = 7,
    maxOpenClawCandidates = 10
  } = {}) {
    const referenceTime = createContractTimestamp(clock);
    const dailyReflection = await dailyReflectionRunner.runDailyReflection({
      declaredSources,
      sourceArtifacts,
      dryRun,
      autoPromote: false,
      decidedBy
    });
    const namespace = sourceArtifacts[0]?.namespace
      || dailyReflection.reflection?.outputs?.[0]?.candidate_artifact?.namespace
      || config.namespace;
    const lifecycle = await registry.processLearningLifecycle({
      namespace,
      decidedBy,
      autoPromote,
      applyDecay: true,
      dryRun,
      referenceTime
    });
    const learningAudit = await governanceSystem.auditLearningLifecycle({
      namespace,
      allowedVisibilities,
      allowedStates,
      referenceTime,
      maxOpenClawCandidates
    });
    const comparison = await governanceSystem.compareLearningTimeWindows({
      namespace,
      currentWindowDays: comparisonWindowDays,
      previousWindowDays: comparisonWindowDays,
      referenceTime
    });
    const repairPlan = learningAudit.findings.length > 0
      ? governanceSystem.createLearningRepairRecord({
          namespace,
          findingCode: learningAudit.findings[0].code,
          decidedBy,
          report: learningAudit
        })
      : null;
    const replayRun = governanceSystem.createLearningReplayRun({
      namespace,
      replayedBy: decidedBy,
      result: "queued",
      report: learningAudit
    });

    return {
      run_id: createContractId("learning_loop", options.idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      generated_at: referenceTime,
      namespace,
      dry_run: dryRun,
      daily_reflection: dailyReflection,
      lifecycle,
      learning_audit: learningAudit,
      time_window_comparison: comparison,
      repair_plan: repairPlan,
      replay_run: replayRun
    };
  }

  async function runPolicyAdaptationLoop({
    declaredSources = [],
    sourceArtifacts = [],
    dryRun = false,
    autoPromote = true,
    decidedBy = "standalone-runtime",
    allowedVisibilities,
    allowedStates,
    query = "summarize the current governed policy",
    taskPrompt = "apply current governed coding policy",
    comparisonWindowDays = 7,
    maxCandidates = 6,
    maxItems = 6,
    maxPolicyInputs = 8
  } = {}) {
    const lifecycle = await runLearningLifecycle({
      declaredSources,
      sourceArtifacts,
      dryRun,
      autoPromote,
      decidedBy,
      allowedVisibilities,
      allowedStates,
      comparisonWindowDays,
      maxOpenClawCandidates: maxCandidates
    });
    const namespace = lifecycle.namespace || config.namespace;
    const [openclawExport, codexExport, policyAudit] = await Promise.all([
      projectionSystem.buildOpenClawExport({
        namespace,
        allowedVisibilities,
        allowedStates
      }),
      projectionSystem.buildCodexExport({
        namespace,
        allowedVisibilities,
        allowedStates
      }),
      governanceSystem.auditPolicyAdaptation({
        namespace,
        allowedVisibilities,
        allowedStates,
        maxPolicyInputs
      })
    ]);
    const openclawPolicyContext = createPolicyContext({
      exportResults: [openclawExport],
      consumer: "openclaw",
      maxPolicyInputs
    });
    const codexPolicyContext = createPolicyContext({
      exportResults: [codexExport],
      consumer: "codex",
      maxPolicyInputs
    });
    const openclawCandidates = mapOpenClawExportToCandidates(openclawExport, {
      query,
      maxCandidates
    }).map((candidate) => ({
      ...candidate,
      pathKind: candidate.pathKind || "governedArtifact",
      weightedScore: Number(candidate.score || 0),
      finalScore: Number(candidate.score || 0)
    }));
    const openclawAdapted = applyPolicyToScoredCandidates(openclawCandidates, {
      policyContext: openclawPolicyContext,
      query
    });
    const codexMemory = buildCodexTaskMemory(codexExport, codexPolicyContext, {
      taskPrompt,
      maxItems
    });

    return {
      run_id: createContractId("policy_loop", options.idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      generated_at: createContractTimestamp(clock),
      namespace,
      dry_run: dryRun,
      learning_lifecycle: lifecycle,
      policy_audit: policyAudit,
      openclaw_context: {
        export_id: openclawExport.exportContract.export_id,
        policy_context: openclawPolicyContext,
        policy_adaptation: openclawAdapted.adaptation,
        candidates: openclawAdapted.candidates
      },
      codex_context: codexMemory
    };
  }

  async function runStage34Acceptance({
    declaredSources = [],
    sourceArtifacts = [],
    dryRun = false,
    autoPromote = true,
    decidedBy = "standalone-runtime",
    allowedVisibilities,
    allowedStates,
    query = "summarize the current governed policy",
    taskPrompt = "apply current governed coding policy",
    comparisonWindowDays = 7,
    maxCandidates = 6,
    maxItems = 6,
    maxPolicyInputs = 8
  } = {}) {
    const policyLoop = await runPolicyAdaptationLoop({
      declaredSources,
      sourceArtifacts,
      dryRun,
      autoPromote,
      decidedBy,
      allowedVisibilities,
      allowedStates,
      query,
      taskPrompt,
      comparisonWindowDays,
      maxCandidates,
      maxItems,
      maxPolicyInputs
    });
    const namespace = policyLoop.namespace || config.namespace;
    const [genericExport, openclawExport, codexExport] = await Promise.all([
      projectionSystem.buildGenericExport({
        namespace,
        allowedVisibilities,
        allowedStates
      }),
      projectionSystem.buildOpenClawExport({
        namespace,
        allowedVisibilities,
        allowedStates
      }),
      projectionSystem.buildCodexExport({
        namespace,
        allowedVisibilities,
        allowedStates
      })
    ]);
    const learningAudit = policyLoop.learning_lifecycle.learning_audit;
    const policyAudit = policyLoop.policy_audit;
    const openclawSummary = policyAudit.consumers?.openclaw || {};
    const codexSummary = policyAudit.consumers?.codex || {};
    const genericSummary = policyAudit.consumers?.generic || {};

    const checks = [
      createAcceptanceCheck({
        phase: "stage3",
        code: "sources_observed",
        passed: Number(policyLoop.learning_lifecycle.daily_reflection.summary.sources.source_count || 0) >= 1,
        expected: ">= 1 source",
        actual: Number(policyLoop.learning_lifecycle.daily_reflection.summary.sources.source_count || 0),
        message: "daily reflection ingested at least one source"
      }),
      createAcceptanceCheck({
        phase: "stage3",
        code: "stable_learning_promoted",
        passed: Number(policyLoop.learning_lifecycle.lifecycle.promotedStableArtifacts?.length || 0) >= 1,
        expected: ">= 1 promoted stable artifact",
        actual: Number(policyLoop.learning_lifecycle.lifecycle.promotedStableArtifacts?.length || 0),
        message: "learning candidates promoted into stable artifacts"
      }),
      createAcceptanceCheck({
        phase: "stage3",
        code: "learning_audit_clean",
        passed: learningAudit.findings.length === 0,
        expected: "0 findings",
        actual: learningAudit.findings.length,
        message: "learning lifecycle audit has no blocking findings"
      }),
      createAcceptanceCheck({
        phase: "stage3",
        code: "stable_learning_visible",
        passed: Number(learningAudit.summary.stable_learning_artifacts || 0) >= 1,
        expected: ">= 1 stable learning artifact",
        actual: Number(learningAudit.summary.stable_learning_artifacts || 0),
        message: "stable governed learning artifacts are visible in the namespace"
      }),
      createAcceptanceCheck({
        phase: "stage3",
        code: "openclaw_consumes_promoted_learning",
        passed: Number(learningAudit.summary.openclaw_consumed_candidates || 0) >= 1,
        expected: ">= 1 consumed promoted artifact",
        actual: Number(learningAudit.summary.openclaw_consumed_candidates || 0),
        message: "OpenClaw consumption sees promoted learning output"
      }),
      createAcceptanceCheck({
        phase: "stage4",
        code: "policy_audit_clean",
        passed: policyAudit.findings.length === 0,
        expected: "0 findings",
        actual: policyAudit.findings.length,
        message: "policy adaptation audit has no blocking findings"
      }),
      createAcceptanceCheck({
        phase: "stage4",
        code: "shared_policy_sources",
        passed: Number(policyAudit.summary.shared_policy_sources || 0) >= 1,
        expected: ">= 1 shared policy source",
        actual: Number(policyAudit.summary.shared_policy_sources || 0),
        message: "policy inputs are sourced from shared governed artifacts"
      }),
      createAcceptanceCheck({
        phase: "stage4",
        code: "policy_exports_present",
        passed: [
          countPolicyInputs(genericExport),
          countPolicyInputs(openclawExport),
          countPolicyInputs(codexExport)
        ].every((count) => count >= 1),
        expected: "generic/openclaw/codex policy inputs all >= 1",
        actual: `generic=${countPolicyInputs(genericExport)}, openclaw=${countPolicyInputs(openclawExport)}, codex=${countPolicyInputs(codexExport)}`,
        message: "all supported consumers receive governed policy inputs"
      }),
      createAcceptanceCheck({
        phase: "stage4",
        code: "rollback_protection_enabled",
        passed: Number(policyAudit.summary.rollback_disabled_consumers || 0) === 0,
        expected: "0 rollback-disabled consumers",
        actual: Number(policyAudit.summary.rollback_disabled_consumers || 0),
        message: "rollback protection remains enabled for all consumers"
      }),
      createAcceptanceCheck({
        phase: "stage4",
        code: "openclaw_policy_context_active",
        passed:
          policyLoop.openclaw_context.policy_context?.enabled === true
          && Number(policyLoop.openclaw_context.candidates?.length || 0) >= 1,
        expected: "enabled policy context with >= 1 adapted candidate",
        actual: `enabled=${policyLoop.openclaw_context.policy_context?.enabled === true}, candidates=${Number(policyLoop.openclaw_context.candidates?.length || 0)}`,
        message: "OpenClaw runtime receives active policy guidance and adapted candidates"
      }),
      createAcceptanceCheck({
        phase: "stage4",
        code: "codex_policy_context_active",
        passed:
          Number(policyLoop.codex_context.policy_inputs?.length || 0) >= 1
          && Number(policyLoop.codex_context.memory_items?.length || 0) >= 1,
        expected: ">= 1 policy input and >= 1 memory item",
        actual: `policyInputs=${Number(policyLoop.codex_context.policy_inputs?.length || 0)}, memoryItems=${Number(policyLoop.codex_context.memory_items?.length || 0)}`,
        message: "Codex runtime receives policy inputs and adapted task memory"
      })
    ];
    const passedChecks = checks.filter((check) => check.status === "pass").length;
    const failedChecks = checks.length - passedChecks;

    return {
      report_id: createContractId("stage34_acceptance", options.idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      generated_at: createContractTimestamp(clock),
      namespace,
      registry_dir: config.registryDir,
      dry_run: dryRun,
      sample_input: summarizeDeclaredSource(declaredSources[0] || sourceArtifacts[0]),
      summary: {
        status: failedChecks === 0 ? "pass" : "fail",
        total_checks: checks.length,
        passed_checks: passedChecks,
        failed_checks: failedChecks,
        requires_manual_followup: failedChecks !== 0
      },
      checks,
      exports: {
        generic: buildExportSnapshot("generic", genericExport, genericSummary),
        openclaw: buildExportSnapshot("openclaw", openclawExport, openclawSummary),
        codex: buildExportSnapshot("codex", codexExport, codexSummary)
      },
      learning_lifecycle: {
        run_id: policyLoop.learning_lifecycle.run_id,
        summary: policyLoop.learning_lifecycle.learning_audit.summary,
        findings: policyLoop.learning_lifecycle.learning_audit.findings,
        comparison: policyLoop.learning_lifecycle.time_window_comparison
      },
      policy_adaptation: {
        report_id: policyAudit.report_id,
        summary: policyAudit.summary,
        findings: policyAudit.findings
      },
      policy_loop: policyLoop,
      openclaw_context: {
        candidate_count: Number(policyLoop.openclaw_context.candidates?.length || 0),
        policy_input_count: Number(policyLoop.openclaw_context.policy_context?.policy_inputs?.length || 0),
        supporting_context_mode: normalizeString(
          policyLoop.openclaw_context.policy_context?.supporting_context_mode,
          "default"
        )
      },
      codex_context: {
        memory_item_count: Number(policyLoop.codex_context.memory_items?.length || 0),
        policy_input_count: Number(policyLoop.codex_context.policy_inputs?.length || 0),
        response_style: normalizeString(policyLoop.codex_context.task_defaults?.response_style, "default"),
        supporting_context_mode: normalizeString(
          policyLoop.codex_context.task_defaults?.supporting_context_mode,
          "default"
        )
      },
      manual_follow_up:
        failedChecks === 0
          ? [
              "For CLI validation, no additional manual step is required.",
              "Before release, run one OpenClaw black-box spot check against the real plugin/runtime."
            ]
          : [
              "Fix failing automated checks before relying on manual spot checks.",
              "Use the lifecycle, policy audit, and export inspect commands to isolate the failing phase."
            ]
    };
  }

  async function runMaintenanceWorkflow({
    policyLoop,
    declaredSources = [],
    sourceArtifacts = [],
    dryRun = false,
    autoPromote = true,
    decidedBy = "standalone-runtime",
    allowedVisibilities,
    allowedStates,
    query = "summarize the current governed policy",
    taskPrompt = "apply current governed coding policy",
    comparisonWindowDays = 7,
    maxCandidates = 6,
    maxItems = 6,
    maxPolicyInputs = 8
  } = {}) {
    const activePolicyLoop = policyLoop || await runPolicyAdaptationLoop({
      declaredSources,
      sourceArtifacts,
      dryRun,
      autoPromote,
      decidedBy,
      allowedVisibilities,
      allowedStates,
      query,
      taskPrompt,
      comparisonWindowDays,
      maxCandidates,
      maxItems,
      maxPolicyInputs
    });
    const namespace = activePolicyLoop.namespace || config.namespace;
    const [namespaceAudit, registryTopology, genericExport] = await Promise.all([
      governanceSystem.auditNamespace({
        namespace,
        allowedVisibilities,
        allowedStates
      }),
      inspectRegistryTopology({
        explicitDir: options?.config?.registryDir,
        env: options?.config?.env
      }),
      projectionSystem.buildGenericExport({
        namespace,
        allowedVisibilities,
        allowedStates
      })
    ]);

    const learningAudit = activePolicyLoop.learning_lifecycle.learning_audit;
    const policyAudit = activePolicyLoop.policy_audit;
    const namespaceFinding = namespaceAudit.findings[0];
    const learningFinding = learningAudit.findings[0];
    const repairPlan = namespaceFinding
      ? governanceSystem.createRepairRecord({
          namespace,
          findingCode: namespaceFinding.code,
          action: "mark_for_review",
          decidedBy,
          targetRecordIds: namespaceFinding.record_refs || [],
          notes: ["maintenance-workflow"],
          dryRun: true
        })
      : null;
    const learningRepairPlan = learningFinding
      ? governanceSystem.createLearningRepairRecord({
          namespace,
          findingCode: learningFinding.code,
          decidedBy,
          report: learningAudit,
          notes: ["maintenance-workflow"],
          dryRun: true
        })
      : null;
    const replayRun = governanceSystem.createReplayRun({
      namespace,
      exportId: genericExport.exportContract.export_id,
      replayedBy: decidedBy,
      inputRefs: genericExport.exportContract.artifact_refs,
      result: namespaceAudit.findings.length === 0 ? "clean" : "queued",
      notes: ["maintenance-workflow"]
    });
    const learningReplayRun = governanceSystem.createLearningReplayRun({
      namespace,
      replayedBy: decidedBy,
      result: learningAudit.findings.length === 0 ? "clean" : "queued",
      notes: ["maintenance-workflow"],
      report: learningAudit
    });

    const sources = summarizeDeclaredSources(
      declaredSources.length > 0 ? declaredSources : sourceArtifacts
    );
    const totalFindings = learningAudit.findings.length + policyAudit.findings.length + namespaceAudit.findings.length;

    return {
      run_id: createContractId("maintenance", options.idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      generated_at: createContractTimestamp(clock),
      namespace,
      registry_dir: config.registryDir,
      dry_run: dryRun,
      sources,
      policy_loop: activePolicyLoop,
      namespace_audit: namespaceAudit,
      registry_topology: registryTopology,
      repair_plan: repairPlan,
      learning_repair_plan: learningRepairPlan,
      replay_run: replayRun,
      learning_replay_run: learningReplayRun,
      summary: {
        status: totalFindings === 0 ? "pass" : "followup",
        stable_learning_artifacts: Number(learningAudit.summary.stable_learning_artifacts || 0),
        learning_findings: learningAudit.findings.length,
        policy_findings: policyAudit.findings.length,
        namespace_findings: namespaceAudit.findings.length,
        replay_plan_status: replayRun.result,
        repair_plan_status: repairPlan ? "queued" : "clean",
        learning_repair_plan_status: learningRepairPlan ? "queued" : "clean"
      }
    };
  }

  async function auditExportReproducibility({
    namespace = config.namespace,
    allowedVisibilities,
    allowedStates,
    consumers = ["generic", "openclaw", "codex"],
    runs = 2,
    maxPolicyInputs = 8
  } = {}) {
    const consumerReports = {};
    const findings = [];

    for (const consumer of consumers) {
      const snapshots = [];
      for (let index = 0; index < runs; index += 1) {
        const exportResult = await projectionSystem.buildExport({
          consumer,
          namespace,
          allowedVisibilities,
          allowedStates
        });
        const policyContext = createPolicyContext({
          exportResults: [exportResult],
          consumer,
          maxPolicyInputs
        });
        snapshots.push({
          payloadFingerprint: exportResult.payloadFingerprint,
          policyFingerprint: exportResult.payload?.policy_fingerprint,
          artifactRefs: exportResult.exportContract?.artifact_refs || [],
          rollbackStatus: normalizeString(
            policyContext.rollback?.status,
            normalizeString(exportResult.payload?.policy_rollback?.status, "unknown")
          ),
          artifactCount: countExportArtifacts(exportResult),
          policyInputCount: countPolicyInputs(exportResult)
        });
      }

      const consumerSummary = buildConsumerReproducibility(consumer, snapshots);
      consumerReports[consumer] = consumerSummary;
      if (!consumerSummary.payload_stable) {
        findings.push({
          severity: "error",
          code: "payload_fingerprint_changed_between_runs",
          message: `${consumer} payload fingerprint changed between reproducibility runs.`,
          consumer
        });
      }
      if (!consumerSummary.policy_stable) {
        findings.push({
          severity: "error",
          code: "policy_fingerprint_changed_between_runs",
          message: `${consumer} policy fingerprint changed between reproducibility runs.`,
          consumer
        });
      }
      if (!consumerSummary.artifact_refs_stable) {
        findings.push({
          severity: "error",
          code: "artifact_refs_changed_between_runs",
          message: `${consumer} artifact refs changed between reproducibility runs.`,
          consumer
        });
      }
      if (!consumerSummary.rollback_stable) {
        findings.push({
          severity: "error",
          code: "rollback_status_changed_between_runs",
          message: `${consumer} rollback status changed between reproducibility runs.`,
          consumer
        });
      }
    }

    const failedConsumers = Object.values(consumerReports).filter(
      (consumer) =>
        !consumer.payload_stable
        || !consumer.policy_stable
        || !consumer.artifact_refs_stable
        || !consumer.rollback_stable
    ).length;

    return {
      report_id: createContractId("reproducibility", options.idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      generated_at: createContractTimestamp(clock),
      namespace,
      consumers: consumerReports,
      findings,
      summary: {
        status: failedConsumers === 0 ? "pass" : "fail",
        consumers_checked: Object.keys(consumerReports).length,
        stable_consumers: Object.keys(consumerReports).length - failedConsumers,
        failed_consumers: failedConsumers
      }
    };
  }

  async function runSplitRehearsal({
    repoRoot: overrideRepoRoot = repoRoot,
    sourceDir = config.registryDir,
    targetDir = `${config.registryDir}-split-rehearsal`,
    apply = false
  } = {}) {
    const [independentReview, migrationReport] = await Promise.all([
      createIndependentExecutionReview({
        repoRoot: overrideRepoRoot,
        clock
      }),
      migrateRegistryRoot({
        explicitDir: options?.config?.registryDir,
        env: options?.config?.env,
        sourceDir,
        targetDir,
        apply
      })
    ]);
    const independentIssues = countReviewIssues(independentReview);

    return {
      rehearsal_id: createContractId("split_rehearsal", options.idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      generated_at: createContractTimestamp(clock),
      repo_root: overrideRepoRoot,
      independent_review: independentReview,
      registry_migration: migrationReport,
      path_mapping: [
        {
          from: "src/unified-memory-core/",
          to: "packages/unified-memory-core/src/"
        },
        {
          from: "scripts/unified-memory-core-cli.js",
          to: "packages/unified-memory-core/scripts/unified-memory-core-cli.js"
        },
        {
          from: "docs/reference/unified-memory-core/",
          to: "packages/unified-memory-core/docs/"
        },
        {
          from: "src/openclaw-adapter.js",
          to: "packages/openclaw-adapter/src/openclaw-adapter.js"
        },
        {
          from: "src/codex-adapter.js",
          to: "packages/codex-adapter/src/codex-adapter.js"
        }
      ],
      summary: {
        status: independentIssues === 0 ? "pass" : "followup",
        independent_review_issues: independentIssues,
        migration_needed: Boolean(migrationReport.topology?.summary?.migration_needed),
        added_records: Number(migrationReport.added_records || 0)
      }
    };
  }

  async function runStage5Acceptance({
    declaredSources = [],
    sourceArtifacts = [],
    dryRun = false,
    autoPromote = true,
    decidedBy = "standalone-runtime",
    allowedVisibilities,
    allowedStates,
    query = "summarize the current governed policy",
    taskPrompt = "apply current governed coding policy",
    comparisonWindowDays = 7,
    maxCandidates = 6,
    maxItems = 6,
    maxPolicyInputs = 8,
    repoRoot: overrideRepoRoot = repoRoot,
    splitTargetDir = `${config.registryDir}-split-rehearsal`
  } = {}) {
    const stage34Acceptance = await runStage34Acceptance({
      declaredSources,
      sourceArtifacts,
      dryRun,
      autoPromote,
      decidedBy,
      allowedVisibilities,
      allowedStates,
      query,
      taskPrompt,
      comparisonWindowDays,
      maxCandidates,
      maxItems,
      maxPolicyInputs
    });
    const maintenance = await runMaintenanceWorkflow({
      policyLoop: stage34Acceptance.policy_loop,
      declaredSources,
      sourceArtifacts,
      dryRun,
      autoPromote,
      decidedBy,
      allowedVisibilities,
      allowedStates,
      query,
      taskPrompt,
      comparisonWindowDays,
      maxCandidates,
      maxItems,
      maxPolicyInputs
    });
    const namespace = maintenance.namespace || stage34Acceptance.namespace || config.namespace;
    const [reproducibility, independentReview, splitRehearsal] = await Promise.all([
      auditExportReproducibility({
        namespace,
        allowedVisibilities,
        allowedStates,
        maxPolicyInputs
      }),
      createIndependentExecutionReview({
        repoRoot: overrideRepoRoot,
        clock
      }),
      runSplitRehearsal({
        repoRoot: overrideRepoRoot,
        sourceDir: config.registryDir,
        targetDir: splitTargetDir,
        apply: false
      })
    ]);

    const sources = maintenance.sources.source_count > 0
      ? maintenance.sources
      : summarizeDeclaredSources(declaredSources.length > 0 ? declaredSources : sourceArtifacts);
    const sourceTypes = Object.keys(sources.by_source_type || {});
    const requiredSourceTypes = ["file", "directory", "url", "image"];
    const reviewIssueCount = countReviewIssues(independentReview);
    const checks = [
      createAcceptanceCheck({
        phase: "stage5",
        code: "stage34_regression_passes",
        passed: stage34Acceptance.summary.status === "pass",
        expected: "stage3-4 acceptance pass",
        actual: stage34Acceptance.summary.status,
        message: "Stage 3-4 baseline remains green while Stage 5 runs"
      }),
      createAcceptanceCheck({
        phase: "stage5",
        code: "source_adapter_coverage",
        passed: requiredSourceTypes.every((sourceType) => sourceTypes.includes(sourceType)),
        expected: `contains ${requiredSourceTypes.join(", ")}`,
        actual: sourceTypes.join(", "),
        message: "Stage 5 exercises hardened standalone source adapters"
      }),
      createAcceptanceCheck({
        phase: "stage5",
        code: "maintenance_workflow_clean",
        passed: maintenance.summary.status === "pass",
        expected: "pass",
        actual: maintenance.summary.status,
        message: "scheduled-job-friendly maintenance workflow is clean"
      }),
      createAcceptanceCheck({
        phase: "stage5",
        code: "reproducibility_clean",
        passed: reproducibility.summary.failed_consumers === 0,
        expected: "0 failed consumers",
        actual: reproducibility.summary.failed_consumers,
        message: "learning exports remain reproducible across repeated builds"
      }),
      createAcceptanceCheck({
        phase: "stage5",
        code: "release_boundary_ready",
        passed: reviewIssueCount === 0,
        expected: "0 readiness issues",
        actual: reviewIssueCount,
        message: "release boundary and independent execution checks are ready"
      }),
      createAcceptanceCheck({
        phase: "stage5",
        code: "split_rehearsal_ready",
        passed: splitRehearsal.summary.status === "pass",
        expected: "pass",
        actual: splitRehearsal.summary.status,
        message: "repo split rehearsal and migration dry-run are reviewable"
      })
    ];
    const summary = summarizeCheckStatus(checks);

    return {
      report_id: createContractId("stage5_acceptance", options.idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      generated_at: createContractTimestamp(clock),
      namespace,
      registry_dir: config.registryDir,
      dry_run: dryRun,
      sources,
      checks,
      summary,
      stage34_acceptance: stage34Acceptance,
      maintenance,
      reproducibility,
      independent_execution: independentReview,
      split_rehearsal: splitRehearsal,
      manual_follow_up:
        summary.status === "pass"
          ? [
              "CLI validation is complete for Stage 5.",
              "Before a public release, optionally rerun the OpenClaw host smoke in a real profile."
            ]
          : [
              "Fix failing Stage 5 checks before relying on manual validation.",
              "Use the maintenance, reproducibility, and independent-review commands to isolate the failing slice."
            ]
    };
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
    auditLearningLifecycle,
    compareLearningTimeWindows,
    auditPolicyAdaptation,
    validateOpenClawConsumption,
    planRepair,
    planLearningRepair,
    planReplay,
    planLearningReplay,
    runLearningLifecycle,
    runPolicyAdaptationLoop,
    runStage34Acceptance,
    runMaintenanceWorkflow,
    auditExportReproducibility,
    runSplitRehearsal,
    runStage5Acceptance,
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
