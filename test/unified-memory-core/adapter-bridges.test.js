import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createCodexAdapterBridge,
  createOpenClawAdapterBridge,
  resolveCodexNamespace,
  resolveOpenClawNamespace
} from "../../src/unified-memory-core/adapter-bridges.js";
import { createMemoryRegistry } from "../../src/unified-memory-core/memory-registry.js";
import { ingestDeclaredSourceToCandidate } from "../../src/unified-memory-core/pipeline.js";
import { createProjectionSystem } from "../../src/unified-memory-core/projection-system.js";
import { createSourceSystem } from "../../src/unified-memory-core/source-system.js";

test("namespace resolvers build stable openclaw and codex namespace bindings", () => {
  assert.deepEqual(
    resolveOpenClawNamespace({
      workspaceId: "Main Workspace",
      host: "macbook-pro",
      tenant: "Local"
    }),
    {
      tenant: "local",
      scope: "workspace",
      resource: "openclaw-shared-memory",
      key: "main-workspace",
      host: "macbook-pro"
    }
  );

  assert.deepEqual(
    resolveCodexNamespace({
      projectPath: "/Users/redcreen/Project/unified-memory-core",
      userId: "Red Screen",
      tenant: "Local"
    }),
    {
      tenant: "local",
      scope: "project",
      resource: "shared-code-memory",
      key: "unified-memory-core-red-screen"
    }
  );
});

test("adapter bridges load consumer-specific exports through the projection system", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-adapter-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const openclawBridge = createOpenClawAdapterBridge({ projectionSystem });
  const codexBridge = createCodexAdapterBridge({ projectionSystem });
  const openclawNamespace = resolveOpenClawNamespace({ workspaceId: "shared-demo" });
  const codexNamespace = resolveCodexNamespace({
    projectId: "shared-demo",
    userId: "default-user",
    namespaceHint: "shared-demo",
    scope: "workspace",
    resource: "openclaw-shared-memory"
  });

  const { candidateArtifact } = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: openclawNamespace,
      visibility: "shared",
      content: "同一个 namespace 可以被 OpenClaw 和 Codex 共享消费"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  await registry.promoteCandidateToStable({
    candidateArtifactId: candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["shared_namespace_ready"]
  });

  const openclawExport = await openclawBridge.loadExports({ workspaceId: "shared-demo" });
  const codexExport = await codexBridge.loadExports(
    {
      projectId: "shared-demo",
      userId: "default-user",
      namespaceHint: "shared-demo",
      scope: "workspace",
      resource: "openclaw-shared-memory"
    },
    { allowedVisibilities: ["shared"] }
  );

  assert.equal(openclawExport.payload.memory_items.length, 1);
  assert.equal(codexExport.payload.code_memory.length, 1);
  assert.equal(
    codexExport.exportContract.namespace.key,
    openclawExport.exportContract.namespace.key
  );
  assert.equal(codexNamespace.key, openclawNamespace.key);
});
