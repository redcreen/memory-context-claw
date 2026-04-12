import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createMemoryRegistry } from "../../src/unified-memory-core/memory-registry.js";
import { createReflectionSystem } from "../../src/unified-memory-core/reflection-system.js";
import { ingestDeclaredSourceToCandidate } from "../../src/unified-memory-core/pipeline.js";
import { createSourceSystem } from "../../src/unified-memory-core/source-system.js";

async function seedLearningCandidate({
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
  return reflection.outputs[0].candidate_artifact;
}

test("memory registry persists a local-first source to candidate loop", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-registry-"));
  const sourceSystem = createSourceSystem({
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });
  const registry = createMemoryRegistry({
    rootDir: registryRoot,
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });

  const result = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: {
        tenant: "local",
        scope: "workspace",
        resource: "unified-memory-core",
        key: "loop"
      },
      visibility: "workspace",
      content: "统一记忆核心先完成 shared contracts 和 registry 闭环"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  const records = await registry.listRecords();
  const trails = await registry.listDecisionTrails();

  assert.equal(records.length, 2);
  assert.equal(trails.length, 1);
  assert.equal(result.candidateRecord.state, "candidate");
  assert.deepEqual(
    records.map((item) => item.record_type).sort(),
    ["candidate_artifact", "source_artifact"]
  );
});

test("memory registry promotes a candidate artifact into a stable artifact with decision trail", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-registry-"));
  const sourceSystem = createSourceSystem({
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });
  const registry = createMemoryRegistry({
    rootDir: registryRoot,
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });

  const { candidateArtifact } = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: {
        tenant: "local",
        scope: "workspace",
        resource: "unified-memory-core",
        key: "promote"
      },
      visibility: "shared",
      content: "Unified Memory Core 是长期记忆产品核心"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  const promoted = await registry.promoteCandidateToStable({
    candidateArtifactId: candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["governance_approved"]
  });

  const records = await registry.listRecords();
  const trails = await registry.listDecisionTrails();

  assert.equal(promoted.stableArtifact.state, "stable");
  assert.equal(promoted.candidateRecord.state, "observation");
  assert.equal(records.length, 3);
  assert.equal(trails.length, 3);
  assert.equal(promoted.decisionTrail.to_state, "stable");
});

test("memory registry can supersede a stable artifact with decision trail", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-registry-"));
  const sourceSystem = createSourceSystem({
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });
  const registry = createMemoryRegistry({
    rootDir: registryRoot,
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });

  const { candidateArtifact } = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: {
        tenant: "local",
        scope: "workspace",
        resource: "unified-memory-core",
        key: "supersede"
      },
      visibility: "shared",
      content: "Unified Memory Core 应该保留治理后的稳定规则"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  const promoted = await registry.promoteCandidateToStable({
    candidateArtifactId: candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["governance_approved"]
  });

  const superseded = await registry.supersedeStableArtifact({
    stableArtifactId: promoted.stableArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["noise_cleanup"]
  });

  const currentRecord = await registry.getRecord(promoted.stableArtifact.artifact_id);
  const trails = await registry.listDecisionTrails({
    artifactId: promoted.stableArtifact.artifact_id
  });

  assert.equal(superseded.stableArtifact.state, "superseded");
  assert.equal(currentRecord.state, "superseded");
  assert.equal(trails.at(-1)?.to_state, "superseded");
});

test("memory registry reuses an existing stable artifact instead of duplicating it", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-registry-"));
  const sourceSystem = createSourceSystem({
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });
  const registry = createMemoryRegistry({
    rootDir: registryRoot,
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });
  const declaredSource = {
    sourceType: "manual",
    declaredBy: "test",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "dedupe"
    },
    visibility: "shared",
    content: "Unified Memory Core 应该保留治理后的稳定规则"
  };

  const first = await ingestDeclaredSourceToCandidate({
    declaredSource,
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });
  const second = await ingestDeclaredSourceToCandidate({
    declaredSource,
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  const promoted = await registry.promoteCandidateToStable({
    candidateArtifactId: first.candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["governance_approved"]
  });
  const reused = await registry.promoteCandidateToStable({
    candidateArtifactId: second.candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["governance_approved"]
  });

  const stableRecords = await registry.listRecords({
    recordType: "stable_artifact",
    state: "stable"
  });
  const duplicateCandidateRecord = await registry.getRecord(second.candidateArtifact.artifact_id);

  assert.equal(stableRecords.length, 1);
  assert.equal(reused.reusedExisting, true);
  assert.equal(reused.stableArtifact.artifact_id, promoted.stableArtifact.artifact_id);
  assert.equal(duplicateCandidateRecord?.state, "dropped");
  assert.equal(reused.decisionTrail.to_state, "dropped");
});

test("memory registry supersedes conflicting stable learning artifacts on promotion", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-registry-conflict-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const reflectionSystem = createReflectionSystem({ registry, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "unified-memory-core",
    key: "conflict"
  };

  const firstCandidate = await seedLearningCandidate({
    sourceSystem,
    reflectionSystem,
    registry,
    namespace,
    content: "The user prefers concise summaries."
  });
  const firstPromotion = await registry.promoteCandidateToStable({
    candidateArtifactId: firstCandidate.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["lifecycle_ready"]
  });
  const secondCandidate = await seedLearningCandidate({
    sourceSystem,
    reflectionSystem,
    registry,
    namespace,
    content: "The user does not prefer concise summaries."
  });
  const secondPromotion = await registry.promoteCandidateToStable({
    candidateArtifactId: secondCandidate.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["lifecycle_ready"]
  });
  const firstStableRecord = await registry.getRecord(firstPromotion.stableArtifact.artifact_id);
  const conflictTrails = await registry.listDecisionTrails({
    artifactId: firstPromotion.stableArtifact.artifact_id
  });

  assert.equal(firstStableRecord.state, "superseded");
  assert.equal(secondPromotion.supersededStableArtifacts.length, 1);
  assert.equal(
    secondPromotion.supersededStableArtifacts[0].stableArtifact.artifact_id,
    firstPromotion.stableArtifact.artifact_id
  );
  assert.ok(conflictTrails.some((trail) => trail.reason_codes.includes("learning_conflict_superseded")));
});

test("memory registry decays stale weak learning candidates", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-registry-decay-"));
  const registry = createMemoryRegistry({
    rootDir: registryRoot,
    clock: () => new Date("2026-04-20T00:00:00.000Z")
  });

  await registry.persistCandidateArtifact({
    artifact_id: "artifact_decay_candidate",
    artifact_type: "candidate_artifact",
    contract_version: "1.0.0",
    state: "candidate",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "decay"
    },
    visibility: "workspace",
    title: "preference:stale",
    summary: "The user prefers concise summaries.",
    source_artifact_id: "source_decay_1",
    evidence_refs: ["source_decay_1"],
    fingerprint: "fingerprint_decay_1",
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

  const decayed = await registry.applyLearningDecay({
    decidedBy: "test-suite",
    referenceTime: "2026-04-20T00:00:00.000Z"
  });
  const currentRecord = await registry.getRecord("artifact_decay_candidate");

  assert.equal(decayed.length, 1);
  assert.equal(currentRecord.state, "dropped");
  assert.ok(
    decayed[0].decayReview.reason_codes.includes("learning_expired")
    || decayed[0].decayReview.reason_codes.includes("weak_signal_decay")
  );
});
