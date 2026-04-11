import { randomUUID } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  createContractId,
  createContractTimestamp,
  createNamespaceKey,
  parseNamespace
} from "./contracts.js";

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

  function buildRegressionOwnershipMap() {
    return {
      shared_contracts: ["test/unified-memory-core/contracts.test.js"],
      source_system: ["test/unified-memory-core/source-system.test.js"],
      memory_registry: ["test/unified-memory-core/memory-registry.test.js"],
      projection_system: ["test/unified-memory-core/projection-system.test.js"],
      adapter_bridges: ["test/unified-memory-core/adapter-bridges.test.js"],
      governance_system: ["test/unified-memory-core/governance-system.test.js"]
    };
  }

  return {
    auditNamespace,
    createRepairRecord,
    createReplayRun,
    buildRegressionOwnershipMap
  };
}
