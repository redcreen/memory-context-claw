import { randomUUID } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  createContractId,
  createContractTimestamp,
  createNamespaceKey,
  parseNamespace
} from "./contracts.js";
import {
  diffLearningWindowSummaries,
  evaluateLearningCandidateDecay,
  isLearningArtifact,
  summarizeLearningTimeWindow
} from "./learning-lifecycle.js";
import { createPolicyContext } from "./policy-adaptation.js";
import { validateOpenClawExportConsumption } from "./openclaw-consumption.js";

function assertRegistry(registry) {
  if (!registry || typeof registry.listRecords !== "function" || typeof registry.listDecisionTrails !== "function") {
    throw new TypeError("governance system requires a registry with listRecords() and listDecisionTrails()");
  }
}

function assertProjectionSystem(projectionSystem) {
  if (!projectionSystem || typeof projectionSystem.buildGenericExport !== "function") {
    throw new TypeError("governance system requires a projection system with buildGenericExport()");
  }
}

function normalizeList(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim());
}

function buildSummary(records, decisionTrails, exportResult) {
  const byType = {};
  const byState = {};
  for (const record of records) {
    byType[record.record_type] = (byType[record.record_type] || 0) + 1;
    byState[record.state] = (byState[record.state] || 0) + 1;
  }

  return {
    records_scanned: records.length,
    decision_trails_scanned: decisionTrails.length,
    exported_artifacts: exportResult.exportContract.artifact_refs.length,
    by_type: byType,
    by_state: byState
  };
}

function buildFindings({ records, decisionTrails, exportResult }) {
  const findings = [];
  const exportedIds = new Set(exportResult.exportContract.artifact_refs);
  const candidateWithoutTrail = records.filter(
    (record) =>
      record.record_type === "candidate_artifact" &&
      !decisionTrails.some((trail) => trail.artifact_id === record.record_id)
  );

  if (candidateWithoutTrail.length > 0) {
    findings.push({
      finding_id: `finding_missing_trail_${candidateWithoutTrail.length}`,
      severity: "warning",
      code: "candidate_missing_decision_trail",
      message: "One or more candidate artifacts do not have a decision trail.",
      record_refs: candidateWithoutTrail.map((record) => record.record_id)
    });
  }

  const exportedWithoutStableState = records.filter(
    (record) =>
      exportedIds.has(record.record_id) &&
      record.record_type === "stable_artifact" &&
      record.state !== "stable"
  );

  if (exportedWithoutStableState.length > 0) {
    findings.push({
      finding_id: `finding_export_state_${exportedWithoutStableState.length}`,
      severity: "error",
      code: "export_contains_non_stable_artifact",
      message: "Export includes artifacts that are not in stable state.",
      record_refs: exportedWithoutStableState.map((record) => record.record_id)
    });
  }

  return findings;
}

function buildLearningLifecycleSummary({
  activeCandidates,
  stableLearningArtifacts,
  supersededLearningArtifacts,
  promotionReviews,
  decayReviews,
  conflicts,
  openclawValidation
}) {
  return {
    active_candidates: activeCandidates.length,
    promotable_candidates: promotionReviews.filter((item) => item.should_promote).length,
    decay_recommended: decayReviews.filter((item) => item.should_decay).length,
    stable_learning_artifacts: stableLearningArtifacts.length,
    superseded_learning_artifacts: supersededLearningArtifacts.length,
    conflicts_detected: conflicts.length,
    openclaw_consumed_candidates: openclawValidation?.consumed_candidates || 0,
    openclaw_missing_promoted_artifacts: openclawValidation?.missing_expected_artifact_ids?.length || 0
  };
}

function buildLearningLifecycleFindings({
  stableLearningArtifacts,
  promotionReviews,
  decayReviews,
  conflicts,
  openclawValidation
}) {
  const findings = [];

  for (const review of promotionReviews) {
    if (!review.should_promote) {
      continue;
    }
    findings.push({
      finding_id: `learning_promotable_${review.candidate_artifact_id}`,
      severity: "info",
      code: "learning_candidate_ready_for_promotion",
      message: "A learning candidate is ready for promotion.",
      record_refs: [review.candidate_artifact_id]
    });
  }

  for (const review of decayReviews) {
    if (!review.should_decay) {
      continue;
    }
    findings.push({
      finding_id: `learning_decay_${review.candidate_artifact_id}`,
      severity: "warning",
      code: "learning_candidate_ready_for_decay",
      message: "A weak or stale learning candidate should decay or expire.",
      record_refs: [review.candidate_artifact_id]
    });
  }

  for (const artifact of stableLearningArtifacts) {
    if (artifact.attributes?.learning_signal_type) {
      continue;
    }
    findings.push({
      finding_id: `learning_metadata_${artifact.artifact_id}`,
      severity: "warning",
      code: "stable_learning_artifact_missing_metadata",
      message: "A stable learning artifact is missing lifecycle metadata.",
      record_refs: [artifact.artifact_id]
    });
  }

  for (const conflict of conflicts) {
    findings.push({
      finding_id: conflict.conflict_id,
      severity: conflict.severity,
      code: conflict.code,
      message: conflict.message,
      record_refs: conflict.artifact_refs
    });
  }

  if (openclawValidation?.missing_expected_artifact_ids?.length > 0) {
    findings.push({
      finding_id: "learning_openclaw_missing_promoted",
      severity: "error",
      code: "openclaw_missing_promoted_learning_artifact",
      message: "OpenClaw export validation is missing promoted learning artifacts.",
      record_refs: openclawValidation.missing_expected_artifact_ids
    });
  }

  return findings;
}

function buildPolicyConsumerSummary(context, exportResult) {
  const sourceArtifactIds = Array.isArray(context?.policy_inputs)
    ? context.policy_inputs.map((item) => item.source_artifact_id)
    : [];
  return {
    export_id: exportResult?.exportContract?.export_id || "",
    artifact_count: Array.isArray(exportResult?.exportContract?.artifact_refs)
      ? exportResult.exportContract.artifact_refs.length
      : 0,
    policy_input_count: sourceArtifactIds.length,
    source_artifact_ids: sourceArtifactIds,
    response_style: context?.response_style || "default",
    supporting_context_mode: context?.supporting_context_mode || "default",
    rollback_status: context?.rollback?.status || "disabled"
  };
}

function buildPolicyAdaptationSummary({
  openclawContext,
  codexContext,
  genericContext
}) {
  const openclawIds = new Set(openclawContext.policy_inputs.map((item) => item.source_artifact_id));
  const codexIds = new Set(codexContext.policy_inputs.map((item) => item.source_artifact_id));
  const genericIds = new Set(genericContext.policy_inputs.map((item) => item.source_artifact_id));
  const sharedIds = [...openclawIds].filter((artifactId) => codexIds.has(artifactId));

  return {
    openclaw_policy_inputs: openclawIds.size,
    codex_policy_inputs: codexIds.size,
    generic_policy_inputs: genericIds.size,
    shared_policy_sources: sharedIds.length,
    rollback_disabled_consumers: [openclawContext, codexContext, genericContext]
      .filter((context) => context.rollback?.status === "disabled")
      .length,
    compact_mode_consumers: [openclawContext, codexContext, genericContext]
      .filter((context) => context.supporting_context_mode === "compact")
      .length
  };
}

function buildPolicyAdaptationFindings({
  namespaceKey,
  allowedVisibilities,
  openclawContext,
  codexContext,
  genericContext
}) {
  const findings = [];
  const contexts = [
    { consumer: "openclaw", context: openclawContext },
    { consumer: "codex", context: codexContext },
    { consumer: "generic", context: genericContext }
  ];

  for (const { consumer, context } of contexts) {
    if (context.rollback?.status === "disabled") {
      findings.push({
        finding_id: `policy_disabled_${consumer}`,
        severity: "error",
        code: "policy_adaptation_disabled_for_consumer",
        message: `${consumer} policy adaptation is disabled after rollback protection.`,
        record_refs: []
      });
    }

    for (const policyInput of context.policy_inputs || []) {
      if (createNamespaceKey(policyInput.namespace) !== namespaceKey) {
        findings.push({
          finding_id: `policy_namespace_${consumer}_${policyInput.policy_input_id}`,
          severity: "error",
          code: "policy_input_namespace_mismatch",
          message: `${consumer} export contains a policy input from a different namespace.`,
          record_refs: [policyInput.source_artifact_id]
        });
      }
      const visibility = String(policyInput.metadata?.visibility || "").trim();
      if (visibility && Array.isArray(allowedVisibilities) && allowedVisibilities.length > 0 && !allowedVisibilities.includes(visibility)) {
        findings.push({
          finding_id: `policy_visibility_${consumer}_${policyInput.policy_input_id}`,
          severity: "error",
          code: "policy_input_visibility_leak",
          message: `${consumer} export surfaced a policy input outside the allowed visibilities.`,
          record_refs: [policyInput.source_artifact_id]
        });
      }
    }
  }

  const openclawIds = new Set(openclawContext.policy_inputs.map((item) => item.source_artifact_id));
  const codexIds = new Set(codexContext.policy_inputs.map((item) => item.source_artifact_id));
  const genericIds = new Set(genericContext.policy_inputs.map((item) => item.source_artifact_id));

  const missingInOpenClaw = [...genericIds].filter((artifactId) => !openclawIds.has(artifactId));
  const missingInCodex = [...genericIds].filter((artifactId) => !codexIds.has(artifactId));
  if (missingInOpenClaw.length > 0) {
    findings.push({
      finding_id: "policy_missing_openclaw",
      severity: "warning",
      code: "consumer_missing_policy_inputs",
      message: "OpenClaw export is missing policy inputs present in the generic export.",
      record_refs: missingInOpenClaw
    });
  }
  if (missingInCodex.length > 0) {
    findings.push({
      finding_id: "policy_missing_codex",
      severity: "warning",
      code: "consumer_missing_policy_inputs",
      message: "Codex export is missing policy inputs present in the generic export.",
      record_refs: missingInCodex
    });
  }

  return findings;
}

export function renderGovernanceAuditReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Governance Audit");
  lines.push(`- reportId: \`${report.report_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(report.namespace)}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push(`- exportVersion: \`${report.export_version}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- recordsScanned: \`${report.summary.records_scanned}\``);
  lines.push(`- decisionTrailsScanned: \`${report.summary.decision_trails_scanned}\``);
  lines.push(`- exportedArtifacts: \`${report.summary.exported_artifacts}\``);
  lines.push("");
  lines.push("## Findings");
  if (report.findings.length === 0) {
    lines.push("- none");
  } else {
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderGovernanceRepairRecord(record, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(record, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Governance Repair");
  lines.push(`- repairId: \`${record.repair_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(record.namespace)}\``);
  lines.push(`- findingCode: \`${record.finding_code}\``);
  lines.push(`- action: \`${record.action}\``);
  lines.push(`- dryRun: \`${record.dry_run}\``);
  lines.push(`- createdAt: \`${record.created_at}\``);
  lines.push("");
  lines.push("## Targets");
  if (record.target_record_ids.length === 0) {
    lines.push("- none");
  } else {
    for (const recordId of record.target_record_ids) {
      lines.push(`- ${recordId}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderGovernanceReplayRun(replay, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(replay, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Governance Replay");
  lines.push(`- replayId: \`${replay.replay_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(replay.namespace)}\``);
  lines.push(`- exportId: \`${replay.export_id}\``);
  lines.push(`- result: \`${replay.result}\``);
  lines.push(`- createdAt: \`${replay.created_at}\``);
  lines.push("");
  lines.push("## Inputs");
  if (replay.input_refs.length === 0) {
    lines.push("- none");
  } else {
    for (const inputRef of replay.input_refs) {
      lines.push(`- ${inputRef}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderLearningLifecycleReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Learning Lifecycle Audit");
  lines.push(`- reportId: \`${report.report_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(report.namespace)}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- activeCandidates: \`${report.summary.active_candidates}\``);
  lines.push(`- promotableCandidates: \`${report.summary.promotable_candidates}\``);
  lines.push(`- decayRecommended: \`${report.summary.decay_recommended}\``);
  lines.push(`- stableLearningArtifacts: \`${report.summary.stable_learning_artifacts}\``);
  lines.push(`- conflictsDetected: \`${report.summary.conflicts_detected}\``);
  lines.push(`- openclawConsumedCandidates: \`${report.summary.openclaw_consumed_candidates}\``);
  lines.push(`- openclawMissingPromotedArtifacts: \`${report.summary.openclaw_missing_promoted_artifacts}\``);
  lines.push("");
  lines.push("## Findings");
  if (report.findings.length === 0) {
    lines.push("- none");
  } else {
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
    }
  }
  lines.push("");
  lines.push("## Promotion Review");
  if (report.promotion_reviews.length === 0) {
    lines.push("- none");
  } else {
    for (const review of report.promotion_reviews) {
      lines.push(`- ${review.candidate_artifact_id}: promote=${review.should_promote} action=${review.recommended_action} score=${review.promotion_score}`);
    }
  }
  lines.push("");
  lines.push("## Decay Review");
  if (report.decay_reviews.length === 0) {
    lines.push("- none");
  } else {
    for (const review of report.decay_reviews) {
      lines.push(`- ${review.candidate_artifact_id}: decay=${review.should_decay} action=${review.action} reasons=${review.reason_codes.join(",") || "none"}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderLearningWindowComparisonReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Learning Window Comparison");
  lines.push(`- comparisonId: \`${report.comparison_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(report.namespace)}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push("");
  lines.push("## Current Window");
  lines.push(`- days: \`${report.current_window.days}\``);
  for (const [key, value] of Object.entries(report.current_window.summary)) {
    lines.push(`- ${key}: \`${value}\``);
  }
  lines.push("");
  lines.push("## Previous Window");
  lines.push(`- days: \`${report.previous_window.days}\``);
  for (const [key, value] of Object.entries(report.previous_window.summary)) {
    lines.push(`- ${key}: \`${value}\``);
  }
  lines.push("");
  lines.push("## Delta");
  for (const [key, value] of Object.entries(report.delta)) {
    lines.push(`- ${key}: \`${value}\``);
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderPolicyAdaptationReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Policy Adaptation Report");
  lines.push(`- reportId: \`${report.report_id}\``);
  lines.push(`- namespace: \`${createNamespaceKey(report.namespace)}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- openclawPolicyInputs: \`${report.summary.openclaw_policy_inputs}\``);
  lines.push(`- codexPolicyInputs: \`${report.summary.codex_policy_inputs}\``);
  lines.push(`- genericPolicyInputs: \`${report.summary.generic_policy_inputs}\``);
  lines.push(`- sharedPolicySources: \`${report.summary.shared_policy_sources}\``);
  lines.push(`- rollbackDisabledConsumers: \`${report.summary.rollback_disabled_consumers}\``);
  lines.push("");
  lines.push("## Consumers");
  for (const [consumer, consumerSummary] of Object.entries(report.consumers)) {
    lines.push(
      `- ${consumer}: inputs=${consumerSummary.policy_input_count} artifacts=${consumerSummary.artifact_count} rollback=${consumerSummary.rollback_status} mode=${consumerSummary.supporting_context_mode}`
    );
  }
  lines.push("");
  lines.push("## Findings");
  if (report.findings.length === 0) {
    lines.push("- none");
  } else {
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function createGovernanceSystem(options = {}) {
  const registry = options.registry;
  const projectionSystem = options.projectionSystem;
  const idGenerator = options.idGenerator || randomUUID;
  const clock = options.clock || (() => new Date());

  assertRegistry(registry);
  assertProjectionSystem(projectionSystem);

  async function auditNamespace({
    namespace,
    allowedVisibilities = ["private", "workspace", "shared", "public"],
    allowedStates = ["stable"]
  }) {
    const parsedNamespace = parseNamespace(namespace);
    const namespaceKey = createNamespaceKey(parsedNamespace);
    const [records, decisionTrails, exportResult] = await Promise.all([
      registry.listRecords({ namespaceKey }),
      registry.listDecisionTrails(),
      projectionSystem.buildGenericExport({
        namespace: parsedNamespace,
        allowedVisibilities,
        allowedStates
      })
    ]);

    const relevantTrails = decisionTrails.filter(
      (trail) => createNamespaceKey(trail.namespace) === namespaceKey
    );
    const summary = buildSummary(records, relevantTrails, exportResult);
    const findings = buildFindings({
      records,
      decisionTrails: relevantTrails,
      exportResult
    });

    return {
      report_id: createContractId("audit", idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      namespace: parsedNamespace,
      export_version: exportResult.exportVersion,
      generated_at: createContractTimestamp(clock),
      summary,
      findings,
      export_contract: exportResult.exportContract
    };
  }

  async function validateOpenClawConsumption({
    namespace,
    allowedVisibilities = ["private", "workspace", "shared", "public"],
    allowedStates = ["stable"],
    maxCandidates = 10,
    expectedArtifactIds = []
  }) {
    if (typeof projectionSystem.buildOpenClawExport !== "function") {
      throw new TypeError("projection system does not support buildOpenClawExport()");
    }

    const parsedNamespace = parseNamespace(namespace);
    const exportResult = await projectionSystem.buildOpenClawExport({
      namespace: parsedNamespace,
      allowedVisibilities,
      allowedStates
    });
    const validation = validateOpenClawExportConsumption({
      exportResult,
      expectedArtifactIds,
      maxCandidates
    });

    return {
      namespace: parsedNamespace,
      export_id: exportResult.exportContract.export_id,
      generated_at: createContractTimestamp(clock),
      ...validation
    };
  }

  async function auditLearningLifecycle({
    namespace,
    allowedVisibilities = ["private", "workspace", "shared", "public"],
    allowedStates = ["stable"],
    referenceTime,
    maxOpenClawCandidates = 10
  }) {
    const parsedNamespace = parseNamespace(namespace);
    const namespaceKey = createNamespaceKey(parsedNamespace);
    const [records, decisionTrails] = await Promise.all([
      registry.listRecords({ namespaceKey }),
      registry.listDecisionTrails()
    ]);

    const relevantTrails = decisionTrails.filter(
      (trail) => createNamespaceKey(trail.namespace) === namespaceKey
    );
    const activeCandidates = records.filter(
      (record) =>
        record.record_type === "candidate_artifact"
        && (record.state === "candidate" || record.state === "observation")
        && isLearningArtifact(record.payload)
    );
    const stableLearningArtifacts = records
      .filter(
        (record) =>
          record.record_type === "stable_artifact"
          && record.state === "stable"
          && isLearningArtifact(record.payload)
      )
      .map((record) => record.payload);
    const supersededLearningArtifacts = records
      .filter(
        (record) =>
          record.record_type === "stable_artifact"
          && record.state === "superseded"
          && isLearningArtifact(record.payload)
      )
      .map((record) => record.payload);

    const promotionReviews = [];
    for (const candidateRecord of activeCandidates) {
      const review = typeof registry.reviewLearningCandidate === "function"
        ? await registry.reviewLearningCandidate({
            candidateArtifactId: candidateRecord.record_id,
            referenceTime
          })
        : null;
      promotionReviews.push({
        candidate_artifact_id: candidateRecord.record_id,
        ...(review || {})
      });
    }

    const decayReviews = activeCandidates.map((candidateRecord) => ({
      candidate_artifact_id: candidateRecord.record_id,
      ...evaluateLearningCandidateDecay(candidateRecord.payload, {
        referenceTime
      })
    }));
    const conflicts = typeof registry.detectLifecycleConflicts === "function"
      ? await registry.detectLifecycleConflicts({ namespace: parsedNamespace })
      : [];
    const openclawValidation = await validateOpenClawConsumption({
      namespace: parsedNamespace,
      allowedVisibilities,
      allowedStates,
      maxCandidates: maxOpenClawCandidates,
      expectedArtifactIds: stableLearningArtifacts
        .map((artifact) => artifact.artifact_id)
        .slice(0, maxOpenClawCandidates)
    });
    const summary = buildLearningLifecycleSummary({
      activeCandidates,
      stableLearningArtifacts,
      supersededLearningArtifacts,
      promotionReviews,
      decayReviews,
      conflicts,
      openclawValidation
    });
    const findings = buildLearningLifecycleFindings({
      stableLearningArtifacts,
      promotionReviews,
      decayReviews,
      conflicts,
      openclawValidation
    });

    return {
      report_id: createContractId("learning_audit", idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      namespace: parsedNamespace,
      generated_at: createContractTimestamp(clock),
      summary,
      findings,
      promotion_reviews: promotionReviews,
      decay_reviews: decayReviews,
      conflicts,
      openclaw_validation: openclawValidation,
      stable_learning_artifacts: stableLearningArtifacts.map((artifact) => artifact.artifact_id),
      relevant_decision_trails: relevantTrails.length
    };
  }

  async function compareLearningTimeWindows({
    namespace,
    currentWindowDays = 7,
    previousWindowDays = currentWindowDays,
    referenceTime
  }) {
    const parsedNamespace = parseNamespace(namespace);
    const namespaceKey = createNamespaceKey(parsedNamespace);
    const [records, decisionTrails] = await Promise.all([
      registry.listRecords({ namespaceKey }),
      registry.listDecisionTrails()
    ]);
    const relevantTrails = decisionTrails.filter(
      (trail) => createNamespaceKey(trail.namespace) === namespaceKey
    );
    const referenceTimestamp = Date.parse(referenceTime || createContractTimestamp(clock));
    const currentEnd = referenceTimestamp + 1;
    const currentStart = currentEnd - currentWindowDays * 24 * 60 * 60 * 1000;
    const previousEnd = currentStart;
    const previousStart = previousEnd - previousWindowDays * 24 * 60 * 60 * 1000;
    const currentSummary = summarizeLearningTimeWindow({
      records,
      decisionTrails: relevantTrails,
      windowStart: currentStart,
      windowEnd: currentEnd
    });
    const previousSummary = summarizeLearningTimeWindow({
      records,
      decisionTrails: relevantTrails,
      windowStart: previousStart,
      windowEnd: previousEnd
    });

    return {
      comparison_id: createContractId("learning_compare", idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      namespace: parsedNamespace,
      generated_at: createContractTimestamp(clock),
      current_window: {
        days: currentWindowDays,
        start_at: new Date(currentStart).toISOString(),
        end_at: new Date(currentEnd).toISOString(),
        summary: currentSummary
      },
      previous_window: {
        days: previousWindowDays,
        start_at: new Date(previousStart).toISOString(),
        end_at: new Date(previousEnd).toISOString(),
        summary: previousSummary
      },
      delta: diffLearningWindowSummaries(currentSummary, previousSummary)
    };
  }

  async function auditPolicyAdaptation({
    namespace,
    allowedVisibilities = ["private", "workspace", "shared", "public"],
    allowedStates = ["stable"],
    maxPolicyInputs = 8
  }) {
    if (
      typeof projectionSystem.buildOpenClawExport !== "function"
      || typeof projectionSystem.buildCodexExport !== "function"
    ) {
      throw new TypeError("projection system does not support multi-consumer policy exports");
    }

    const parsedNamespace = parseNamespace(namespace);
    const namespaceKey = createNamespaceKey(parsedNamespace);
    const [openclawExport, codexExport, genericExport] = await Promise.all([
      projectionSystem.buildOpenClawExport({
        namespace: parsedNamespace,
        allowedVisibilities,
        allowedStates
      }),
      projectionSystem.buildCodexExport({
        namespace: parsedNamespace,
        allowedVisibilities,
        allowedStates
      }),
      projectionSystem.buildGenericExport({
        namespace: parsedNamespace,
        allowedVisibilities,
        allowedStates
      })
    ]);

    const openclawContext = createPolicyContext({
      exportResults: [openclawExport],
      consumer: "openclaw",
      maxPolicyInputs
    });
    const codexContext = createPolicyContext({
      exportResults: [codexExport],
      consumer: "codex",
      maxPolicyInputs
    });
    const genericContext = createPolicyContext({
      exportResults: [genericExport],
      consumer: "generic",
      maxPolicyInputs
    });

    return {
      report_id: createContractId("policy_audit", idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      namespace: parsedNamespace,
      generated_at: createContractTimestamp(clock),
      summary: buildPolicyAdaptationSummary({
        openclawContext,
        codexContext,
        genericContext
      }),
      consumers: {
        openclaw: buildPolicyConsumerSummary(openclawContext, openclawExport),
        codex: buildPolicyConsumerSummary(codexContext, codexExport),
        generic: buildPolicyConsumerSummary(genericContext, genericExport)
      },
      findings: buildPolicyAdaptationFindings({
        namespaceKey,
        allowedVisibilities,
        openclawContext,
        codexContext,
        genericContext
      }),
      exports: {
        openclaw: openclawExport.exportContract.export_id,
        codex: codexExport.exportContract.export_id,
        generic: genericExport.exportContract.export_id
      }
    };
  }

  function createRepairRecord({
    namespace,
    findingCode,
    action,
    decidedBy,
    targetRecordIds = [],
    dryRun = true,
    notes = []
  }) {
    const parsedNamespace = parseNamespace(namespace);
    return {
      repair_id: createContractId("repair", idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      namespace: parsedNamespace,
      finding_code: String(findingCode || "").trim(),
      action: String(action || "").trim(),
      decided_by: String(decidedBy || "").trim(),
      target_record_ids: normalizeList(targetRecordIds),
      dry_run: dryRun !== false,
      notes: normalizeList(notes),
      created_at: createContractTimestamp(clock)
    };
  }

  function createLearningRepairRecord({
    namespace,
    findingCode,
    action = "mark_learning_review",
    decidedBy,
    targetRecordIds = [],
    dryRun = true,
    notes = [],
    report
  }) {
    const reportTargets = Array.isArray(report?.findings)
      ? (report.findings.find((item) => item.code === String(findingCode || "").trim())?.record_refs || [])
      : [];
    return createRepairRecord({
      namespace,
      findingCode,
      action,
      decidedBy,
      targetRecordIds: targetRecordIds.length > 0 ? targetRecordIds : reportTargets,
      dryRun,
      notes: [...notes, "learning-lifecycle-repair"]
    });
  }

  function createReplayRun({
    namespace,
    exportId,
    replayedBy,
    inputRefs = [],
    result = "pending",
    notes = []
  }) {
    const parsedNamespace = parseNamespace(namespace);
    return {
      replay_id: createContractId("replay", idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      namespace: parsedNamespace,
      export_id: String(exportId || "").trim(),
      replayed_by: String(replayedBy || "").trim(),
      input_refs: normalizeList(inputRefs),
      result: String(result || "pending").trim(),
      notes: normalizeList(notes),
      created_at: createContractTimestamp(clock)
    };
  }

  function createLearningReplayRun({
    namespace,
    exportId,
    replayedBy,
    inputRefs = [],
    result = "queued",
    notes = [],
    report
  }) {
    const reportRefs = Array.isArray(report?.openclaw_validation?.consumed_artifact_ids)
      ? report.openclaw_validation.consumed_artifact_ids
      : [];
    return createReplayRun({
      namespace,
      exportId: exportId || report?.openclaw_validation?.export_id || report?.export_contract?.export_id,
      replayedBy,
      inputRefs: inputRefs.length > 0 ? inputRefs : reportRefs,
      result,
      notes: [...notes, "learning-lifecycle-replay"]
    });
  }

  function buildRegressionOwnershipMap() {
    return {
      shared_contracts: ["test/unified-memory-core/contracts.test.js"],
      source_system: ["test/unified-memory-core/source-system.test.js"],
      memory_registry: ["test/unified-memory-core/memory-registry.test.js"],
      projection_system: ["test/unified-memory-core/projection-system.test.js"],
      reflection_system: ["test/unified-memory-core/reflection-system.test.js"],
      daily_reflection: ["test/unified-memory-core/daily-reflection.test.js"],
      independent_execution: ["test/unified-memory-core/independent-execution.test.js"],
      adapter_bridges: ["test/unified-memory-core/adapter-bridges.test.js"],
      openclaw_adapter_runtime: ["test/openclaw-adapter.test.js"],
      codex_adapter_runtime: ["test/codex-adapter.test.js"],
      adapter_compatibility: ["test/adapter-compatibility.test.js"],
      governance_system: ["test/unified-memory-core/governance-system.test.js"],
      standalone_runtime: ["test/unified-memory-core/standalone-runtime.test.js"],
      policy_adaptation: [
        "test/unified-memory-core/policy-adaptation.test.js",
        "test/unified-memory-core/governance-system.test.js",
        "test/openclaw-adapter.test.js",
        "test/codex-adapter.test.js",
        "test/adapter-compatibility.test.js"
      ],
      learning_lifecycle: [
        "test/unified-memory-core/memory-registry.test.js",
        "test/unified-memory-core/governance-system.test.js",
        "test/unified-memory-core/standalone-runtime.test.js",
        "test/openclaw-adapter.test.js"
      ]
    };
  }

  return {
    auditNamespace,
    auditLearningLifecycle,
    compareLearningTimeWindows,
    auditPolicyAdaptation,
    validateOpenClawConsumption,
    createRepairRecord,
    createLearningRepairRecord,
    createReplayRun,
    createLearningReplayRun,
    buildRegressionOwnershipMap
  };
}
