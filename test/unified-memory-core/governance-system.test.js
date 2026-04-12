import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createGovernanceSystem,
  renderGovernanceAuditReport,
  renderLearningLifecycleReport,
  renderLearningWindowComparisonReport,
  renderPolicyAdaptationReport
} from "../../src/unified-memory-core/governance-system.js";
import { createMemoryRegistry } from "../../src/unified-memory-core/memory-registry.js";
import { createReflectionSystem } from "../../src/unified-memory-core/reflection-system.js";
import { ingestDeclaredSourceToCandidate } from "../../src/unified-memory-core/pipeline.js";
import { createProjectionSystem } from "../../src/unified-memory-core/projection-system.js";
import { createSourceSystem } from "../../src/unified-memory-core/source-system.js";

async function seedStableArtifact({ sourceSystem, registry, namespace, content, visibility = "workspace" }) {
  const { candidateArtifact } = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace,
      visibility,
      content
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  return registry.promoteCandidateToStable({
    candidateArtifactId: candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["governance_seed"]
  });
}

async function seedLearningStableArtifact({
  sourceSystem,
  reflectionSystem,
  registry,
  namespace,
  content,
  visibility = "workspace"
}) {
  const { sourceArtifact } = await sourceSystem.ingestDeclaredSource({
    sourceType: "manual",
    declaredBy: "test",
    namespace,
    visibility,
    content
  });
  await registry.persistSourceArtifact(sourceArtifact);
  const reflection = await reflectionSystem.runReflection({
    sourceArtifacts: [sourceArtifact],
    persistCandidates: true,
    decidedBy: "test-suite"
  });

  return registry.promoteCandidateToStable({
    candidateArtifactId: reflection.outputs[0].candidate_artifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["learning_governance_seed"]
  });
}

test("governance system audits a namespace and renders a non-destructive report", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-governance-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const governanceSystem = createGovernanceSystem({ registry, projectionSystem, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "audit-demo"
  };

  await seedStableArtifact({
    sourceSystem,
    registry,
    namespace,
    content: "Governance System 需要审计 registry 和 exports 的一致性"
  });

  const report = await governanceSystem.auditNamespace({ namespace });
  const markdown = renderGovernanceAuditReport(report);

  assert.equal(report.summary.records_scanned, 3);
  assert.equal(report.summary.exported_artifacts, 1);
  assert.equal(report.findings.length, 0);
  assert.match(markdown, /Unified Memory Core Governance Audit/);
  assert.match(markdown, /recordsScanned: `3`/);
  assert.match(markdown, /Findings/);
});

test("governance system creates dry-run repair records and replay runs", async () => {
  const governanceSystem = createGovernanceSystem({
    registry: {
      async listRecords() {
        return [];
      },
      async listDecisionTrails() {
        return [];
      }
    },
    projectionSystem: {
      async buildGenericExport() {
        return {
          exportVersion: "v1",
          exportContract: { artifact_refs: [] }
        };
      }
    },
    clock: () => new Date("2026-04-11T00:00:00.000Z"),
    idGenerator: (() => {
      let index = 0;
      return () => `id${++index}`;
    })()
  });

  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "repair-demo"
  };

  const repair = governanceSystem.createRepairRecord({
    namespace,
    findingCode: "candidate_missing_decision_trail",
    action: "mark_for_review",
    decidedBy: "maintainer",
    targetRecordIds: ["artifact_1"],
    notes: ["default dry-run"]
  });

  const replay = governanceSystem.createReplayRun({
    namespace,
    exportId: "export_1",
    replayedBy: "maintainer",
    inputRefs: ["artifact_1", "decision_1"],
    result: "queued",
    notes: ["replay after repair"]
  });

  const ownership = governanceSystem.buildRegressionOwnershipMap();

  assert.equal(repair.dry_run, true);
  assert.equal(repair.finding_code, "candidate_missing_decision_trail");
  assert.equal(replay.result, "queued");
  assert.deepEqual(ownership.governance_system, [
    "test/unified-memory-core/governance-system.test.js"
  ]);
});

test("governance system audits learning lifecycle and builds learning-specific repair and replay paths", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-learning-governance-"));
  const clock = () => new Date("2026-04-20T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const reflectionSystem = createReflectionSystem({ registry, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const governanceSystem = createGovernanceSystem({ registry, projectionSystem, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "learning-audit"
  };

  await seedLearningStableArtifact({
    sourceSystem,
    reflectionSystem,
    registry,
    namespace,
    content: "Remember this: the user prefers concise summaries."
  });
  await registry.persistCandidateArtifact({
    artifact_id: "artifact_learning_stale",
    artifact_type: "candidate_artifact",
    contract_version: "1.0.0",
    state: "candidate",
    namespace,
    visibility: "workspace",
    title: "preference:stale",
    summary: "The user prefers concise summaries.",
    source_artifact_id: "source_learning_stale",
    evidence_refs: ["source_learning_stale"],
    fingerprint: "fingerprint_learning_stale",
    confidence: 0.4,
    attributes: {
      reflection_label: "stable_preference_candidate",
      learning_signal_type: "preference",
      learning_polarity: "positive",
      learning_topic_signature: "concisesummaries",
      repeated_source_count: 0,
      explicit_remember_signal: false
    },
    export_hints: ["stable_preference_candidate", "learning:preference"],
    created_at: "2026-04-01T00:00:00.000Z",
    updated_at: "2026-04-01T00:00:00.000Z"
  });

  const report = await governanceSystem.auditLearningLifecycle({ namespace });
  const markdown = renderLearningLifecycleReport(report);
  const repair = governanceSystem.createLearningRepairRecord({
    namespace,
    findingCode: "learning_candidate_ready_for_decay",
    decidedBy: "test-suite",
    report
  });
  const replay = governanceSystem.createLearningReplayRun({
    namespace,
    replayedBy: "test-suite",
    report
  });

  assert.equal(report.summary.stable_learning_artifacts, 1);
  assert.equal(report.summary.decay_recommended, 1);
  assert.equal(report.summary.openclaw_consumed_candidates, 1);
  assert.ok(report.findings.some((finding) => finding.code === "learning_candidate_ready_for_decay"));
  assert.match(markdown, /Learning Lifecycle Audit/);
  assert.deepEqual(repair.target_record_ids, ["artifact_learning_stale"]);
  assert.equal(replay.result, "queued");
  assert.equal(replay.input_refs.length, 1);
});

test("governance system compares learning time windows", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-learning-compare-"));
  let currentTime = new Date("2026-04-10T00:00:00.000Z");
  const clock = () => currentTime;
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const reflectionSystem = createReflectionSystem({ registry, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const governanceSystem = createGovernanceSystem({ registry, projectionSystem, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "learning-compare"
  };

  await seedLearningStableArtifact({
    sourceSystem,
    reflectionSystem,
    registry,
    namespace,
    content: "Remember this: the user prefers concise summaries."
  });

  currentTime = new Date("2026-04-19T00:00:00.000Z");
  await seedLearningStableArtifact({
    sourceSystem,
    reflectionSystem,
    registry,
    namespace,
    content: "Remember this: the user prefers terminal-first workflows."
  });
  await seedLearningStableArtifact({
    sourceSystem,
    reflectionSystem,
    registry,
    namespace,
    content: "Remember this: the user prefers test-driven changes."
  });

  const report = await governanceSystem.compareLearningTimeWindows({
    namespace,
    currentWindowDays: 7,
    previousWindowDays: 7,
    referenceTime: "2026-04-20T00:00:00.000Z"
  });
  const markdown = renderLearningWindowComparisonReport(report);

  assert.equal(report.current_window.summary.promotions, 2);
  assert.equal(report.previous_window.summary.promotions, 1);
  assert.equal(report.delta.promotions, 1);
  assert.match(markdown, /Learning Window Comparison/);
});

test("governance system audits multi-consumer policy adaptation compatibility", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-policy-governance-"));
  const clock = () => new Date("2026-04-20T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const reflectionSystem = createReflectionSystem({ registry, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const governanceSystem = createGovernanceSystem({ registry, projectionSystem, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "policy-governance"
  };

  await seedLearningStableArtifact({
    sourceSystem,
    reflectionSystem,
    registry,
    namespace,
    content: "Remember this: the user prefers concise progress reports."
  });

  const report = await governanceSystem.auditPolicyAdaptation({ namespace });
  const markdown = renderPolicyAdaptationReport(report);

  assert.equal(report.summary.openclaw_policy_inputs, 1);
  assert.equal(report.summary.codex_policy_inputs, 1);
  assert.equal(report.summary.shared_policy_sources, 1);
  assert.equal(report.findings.length, 0);
  assert.match(markdown, /Policy Adaptation Report/);
});
