import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createMemoryRegistry } from "../../src/unified-memory-core/memory-registry.js";
import { ingestDeclaredSourceToCandidate } from "../../src/unified-memory-core/pipeline.js";
import { createProjectionSystem } from "../../src/unified-memory-core/projection-system.js";
import { createReflectionSystem } from "../../src/unified-memory-core/reflection-system.js";
import { createSourceSystem } from "../../src/unified-memory-core/source-system.js";

async function seedStableArtifact({ registry, sourceSystem, namespace, visibility, content }) {
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
    reasonCodes: ["projection_ready"]
  });
}

test("projection system builds deterministic openclaw and codex exports from stable artifacts", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-projection-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "demo"
  };

  await seedStableArtifact({
    registry,
    sourceSystem,
    namespace,
    visibility: "workspace",
    content: "Unified Memory Core 优先共享稳定规则和事实"
  });

  const openclawExport = await projectionSystem.buildOpenClawExport({ namespace });
  const codexExport = await projectionSystem.buildCodexExport({ namespace });

  assert.equal(openclawExport.exportContract.consumer, "openclaw");
  assert.equal(codexExport.exportContract.consumer, "codex");
  assert.equal(openclawExport.payload.memory_items.length, 1);
  assert.equal(codexExport.payload.code_memory.length, 1);
  assert.equal(openclawExport.payload.policy_inputs.length, 0);
  assert.equal(codexExport.payload.policy_inputs.length, 0);
  assert.deepEqual(
    openclawExport.exportContract.artifact_refs,
    codexExport.exportContract.artifact_refs
  );
  assert.equal(openclawExport.exportVersion, codexExport.exportVersion);
});

test("projection system filters by namespace and visibility", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-projection-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const targetNamespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "visible"
  };

  await seedStableArtifact({
    registry,
    sourceSystem,
    namespace: targetNamespace,
    visibility: "workspace",
    content: "workspace visible"
  });
  await seedStableArtifact({
    registry,
    sourceSystem,
    namespace: targetNamespace,
    visibility: "private",
    content: "private only"
  });
  await seedStableArtifact({
    registry,
    sourceSystem,
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "openclaw-shared-memory",
      key: "other"
    },
    visibility: "workspace",
    content: "other namespace"
  });

  const exportResult = await projectionSystem.buildGenericExport({
    namespace: targetNamespace,
    allowedVisibilities: ["workspace"]
  });

  assert.equal(exportResult.payload.artifacts.length, 1);
  assert.match(exportResult.payload.artifacts[0].summary, /workspace visible/);
});

test("projection system includes policy inputs for promoted learning artifacts", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-projection-policy-"));
  const clock = () => new Date("2026-04-12T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const reflectionSystem = createReflectionSystem({ registry, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "policy-demo"
  };

  const { sourceArtifact } = await sourceSystem.ingestDeclaredSource({
    sourceType: "manual",
    declaredBy: "test",
    namespace,
    visibility: "workspace",
    content: "Remember this: the user prefers concise progress reports."
  });
  await registry.persistSourceArtifact(sourceArtifact);
  const reflection = await reflectionSystem.runReflection({
    sourceArtifacts: [sourceArtifact],
    persistCandidates: true,
    decidedBy: "test-suite"
  });
  await registry.promoteCandidateToStable({
    candidateArtifactId: reflection.outputs[0].candidate_artifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["policy_projection_ready"]
  });

  const openclawExport = await projectionSystem.buildOpenClawExport({ namespace });
  const codexExport = await projectionSystem.buildCodexExport({ namespace });

  assert.equal(openclawExport.payload.policy_inputs.length, 1);
  assert.equal(codexExport.payload.policy_inputs.length, 1);
  assert.equal(openclawExport.payload.policy_inputs[0].consumer, "openclaw");
  assert.equal(codexExport.payload.policy_inputs[0].consumer, "codex");
  assert.equal(openclawExport.payload.policy_summary.compact_mode_inputs, 1);
});
