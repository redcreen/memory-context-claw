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
