import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createCodexAdapterRuntime } from "../src/codex-adapter.js";
import { createOpenClawAdapterRuntime } from "../src/openclaw-adapter.js";
import { createGovernanceSystem } from "../src/unified-memory-core/governance-system.js";
import { createMemoryRegistry } from "../src/unified-memory-core/memory-registry.js";
import { ingestDeclaredSourceToCandidate } from "../src/unified-memory-core/pipeline.js";
import { createProjectionSystem } from "../src/unified-memory-core/projection-system.js";
import { createReflectionSystem } from "../src/unified-memory-core/reflection-system.js";
import { createSourceSystem } from "../src/unified-memory-core/source-system.js";

async function seedStableArtifact({
  sourceSystem,
  registry,
  namespace,
  visibility,
  content
}) {
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
    reasonCodes: ["adapter_compatibility_ready"]
  });
}

test("OpenClaw and Codex apply visibility filtering correctly on one shared namespace", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-adapter-compat-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "shared-demo"
  };

  await seedStableArtifact({
    sourceSystem,
    registry,
    namespace,
    visibility: "private",
    content: "仅本地私有规则"
  });
  await seedStableArtifact({
    sourceSystem,
    registry,
    namespace,
    visibility: "workspace",
    content: "workspace 级共享规则"
  });
  await seedStableArtifact({
    sourceSystem,
    registry,
    namespace,
    visibility: "shared",
    content: "跨工具共享规则"
  });

  const openclawRuntime = createOpenClawAdapterRuntime({
    pluginConfig: {
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "shared-demo",
          scope: "workspace",
          resource: "openclaw-shared-memory",
          allowedVisibilities: ["workspace", "shared"]
        }
      }
    }
  });
  const codexRuntime = createCodexAdapterRuntime({
    clock,
    config: {
      registryDir: registryRoot,
      projectId: "shared-demo",
      userId: "default-user",
      namespaceHint: "shared-demo",
      scope: "workspace",
      resource: "openclaw-shared-memory",
      allowedVisibilities: ["shared"]
    }
  });

  const openclawCandidates = await openclawRuntime.loadGovernedCandidates({
    query: "读取共享 namespace",
    maxCandidates: 10
  });
  const codexMemory = await codexRuntime.readBeforeTask({
    taskPrompt: "读取共享 namespace"
  });

  assert.equal(openclawCandidates.length, 2);
  assert.equal(codexMemory.memory_items.length, 1);
  assert.match(openclawCandidates.map((item) => item.snippet).join("\n"), /workspace 级共享规则/);
  assert.match(codexMemory.prompt_block, /跨工具共享规则/);
});

test("Codex same-namespace concurrent write-back keeps all records and decision trails", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-concurrent-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const codexRuntime = createCodexAdapterRuntime({
    clock,
    logger: { info() {} },
    config: {
      registryDir: registryRoot,
      projectId: "shared-demo",
      userId: "codex-user",
      namespaceHint: "shared-demo"
    }
  });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });

  await Promise.all([
    codexRuntime.writeAfterTask({
      taskId: "task_a",
      taskTitle: "实现 A",
      summary: "补 contracts"
    }),
    codexRuntime.writeAfterTask({
      taskId: "task_b",
      taskTitle: "实现 B",
      summary: "补 tests"
    })
  ]);

  const records = await registry.listRecords();
  const trails = await registry.listDecisionTrails();

  assert.equal(records.length, 4);
  assert.equal(trails.length, 2);
  assert.equal(
    records.filter((record) => record.record_type === "candidate_artifact").length,
    2
  );
  assert.equal(
    records.filter((record) => record.record_type === "source_artifact").length,
    2
  );
});

test("governance can audit a namespace after Codex write-back and track the replay surface", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-govern-codex-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const codexRuntime = createCodexAdapterRuntime({
    clock,
    logger: { info() {} },
    config: {
      registryDir: registryRoot,
      projectId: "shared-demo",
      userId: "codex-user",
      namespaceHint: "shared-demo"
    }
  });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const governanceSystem = createGovernanceSystem({ registry, projectionSystem, clock });

  const persisted = await codexRuntime.writeAfterTask({
    taskId: "task_replay",
    taskTitle: "整理 adapter 边界",
    summary: "补共享 namespace compatibility 测试"
  });

  const report = await governanceSystem.auditNamespace({
    namespace: persisted.write_back_event.namespace,
    allowedVisibilities: ["workspace"],
    allowedStates: ["stable", "candidate"]
  });
  const replay = governanceSystem.createReplayRun({
    namespace: persisted.write_back_event.namespace,
    exportId: report.export_contract.export_id,
    replayedBy: "governance-test",
    inputRefs: [
      persisted.sourceArtifact.artifact_id,
      persisted.candidateArtifact.artifact_id,
      persisted.write_back_event.event_id
    ],
    result: "queued",
    notes: ["codex write-back review"]
  });
  const ownership = governanceSystem.buildRegressionOwnershipMap();

  assert.equal(report.summary.records_scanned, 2);
  assert.equal(report.summary.decision_trails_scanned, 1);
  assert.equal(report.findings.length, 0);
  assert.equal(replay.result, "queued");
  assert.deepEqual(ownership.adapter_compatibility, [
    "test/adapter-compatibility.test.js"
  ]);
});

test("OpenClaw and Codex keep learned policy inputs aligned across one shared namespace", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-policy-compat-"));
  const clock = () => new Date("2026-04-20T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const reflectionSystem = createReflectionSystem({ registry, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "policy-shared"
  };

  const { sourceArtifact } = await sourceSystem.ingestDeclaredSource({
    sourceType: "manual",
    declaredBy: "test",
    namespace,
    visibility: "shared",
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
    reasonCodes: ["adapter_policy_alignment_ready"]
  });

  const openclawRuntime = createOpenClawAdapterRuntime({
    pluginConfig: {
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "policy-shared",
          scope: "workspace",
          resource: "openclaw-shared-memory",
          allowedVisibilities: ["shared"]
        }
      }
    }
  });
  const codexRuntime = createCodexAdapterRuntime({
    clock,
    config: {
      registryDir: registryRoot,
      projectId: "policy-shared",
      userId: "default-user",
      namespaceHint: "policy-shared",
      scope: "workspace",
      resource: "openclaw-shared-memory",
      allowedVisibilities: ["shared"]
    }
  });

  const openclawContext = await openclawRuntime.loadGovernedContext({
    query: "给我简洁的进展汇报"
  });
  const codexMemory = await codexRuntime.readBeforeTask({
    taskPrompt: "给我简洁的进展汇报"
  });

  assert.equal(openclawContext.policyContext.policy_inputs.length, 1);
  assert.equal(codexMemory.policy_inputs.length, 1);
  assert.equal(
    openclawContext.policyContext.policy_inputs[0].source_artifact_id,
    codexMemory.policy_inputs[0].source_artifact_id
  );
});
