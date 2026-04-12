import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createMemoryRegistry } from "../../src/unified-memory-core/memory-registry.js";
import { ingestDeclaredSourceToCandidate } from "../../src/unified-memory-core/pipeline.js";
import { createSourceSystem } from "../../src/unified-memory-core/source-system.js";

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
  assert.equal(records.length, 3);
  assert.equal(trails.length, 2);
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
