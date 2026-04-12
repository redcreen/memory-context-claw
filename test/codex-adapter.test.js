import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createCodexAdapterRuntime,
  createCodexWriteBackEvent,
  mapCodexExportToTaskMemory,
  resolveCodexAdapterConfig
} from "../src/codex-adapter.js";
import { createMemoryRegistry } from "../src/unified-memory-core/memory-registry.js";
import { ingestDeclaredSourceToCandidate } from "../src/unified-memory-core/pipeline.js";
import { createSourceSystem } from "../src/unified-memory-core/source-system.js";

test("codex adapter resolves local-first project binding defaults", () => {
  const config = resolveCodexAdapterConfig({
    projectPath: "/tmp/unified-memory-core",
    userId: "codex-user"
  });

  assert.equal(config.projectId, "unified-memory-core");
  assert.equal(config.userId, "codex-user");
  assert.equal(config.resource, "shared-code-memory");
  assert.equal(config.scope, "project");
});

test("codex adapter can resolve openclaw-compatible workspace plus agent settings", () => {
  const config = resolveCodexAdapterConfig({
    registryDir: "/tmp/registry",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    workspaceId: "code-workspace",
    agentId: "code",
    agentNamespaceEnabled: true
  });

  assert.equal(config.workspaceId, "code-workspace");
  assert.equal(config.agentId, "code");
  assert.equal(config.agentNamespaceEnabled, true);
  assert.equal(config.scope, "workspace");
  assert.equal(config.resource, "openclaw-shared-memory");
});

test("codex adapter loads governed code memory before a task", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-read-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const namespace = {
    tenant: "local",
    scope: "project",
    resource: "shared-code-memory",
    key: "unified-memory-core-codex-user"
  };

  const { candidateArtifact } = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace,
      visibility: "workspace",
      content: "实现前先看 shared contracts 和 registry lifecycle。"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  await registry.promoteCandidateToStable({
    candidateArtifactId: candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["codex_read_ready"]
  });

  const adapter = createCodexAdapterRuntime({
    clock,
    config: {
      registryDir: registryRoot,
      projectPath: "/tmp/unified-memory-core",
      userId: "codex-user"
    }
  });

  const memoryPackage = await adapter.readBeforeTask({
    taskPrompt: "继续实现 Codex Adapter"
  });

  assert.equal(memoryPackage.memory_items.length, 1);
  assert.match(memoryPackage.prompt_block, /Shared Code Memory/);
  assert.match(memoryPackage.prompt_block, /shared contracts/i);
});

test("codex adapter persists a governed write-back event into source and candidate records", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-write-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const adapter = createCodexAdapterRuntime({
    clock,
    logger: { info() {} },
    config: {
      registryDir: registryRoot,
      projectPath: "/tmp/unified-memory-core",
      userId: "codex-user"
    }
  });

  const persisted = await adapter.writeAfterTask({
    taskId: "task_1",
    taskTitle: "实现 Codex Adapter",
    summary: "补齐 read-before-task 和 write-after-task contract",
    details: "新增本地优先写回闭环。",
    tags: ["codex", "adapter", "memory"]
  });

  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const records = await registry.listRecords();
  const trails = await registry.listDecisionTrails();

  assert.equal(persisted.write_back_event.task_id, "task_1");
  assert.equal(records.length, 2);
  assert.equal(trails.length, 1);
  assert.equal(persisted.candidateRecord.state, "candidate");
  assert.equal(persisted.write_back_event.visibility, "workspace");
});

test("codex adapter can share a namespace hint with openclaw-compatible workspace scope", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-shared-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "shared-demo"
  };

  const { candidateArtifact } = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace,
      visibility: "shared",
      content: "同一个 namespaceHint 可以被 OpenClaw 和 Codex 共用。"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  await registry.promoteCandidateToStable({
    candidateArtifactId: candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["cross_tool_ready"]
  });

  const adapter = createCodexAdapterRuntime({
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

  const memoryPackage = await adapter.readBeforeTask({
    taskPrompt: "读取共享 namespace"
  });

  assert.equal(memoryPackage.memory_items.length, 1);
  assert.equal(memoryPackage.namespace.key, "shared-demo");
});

test("codex adapter can merge workspace and agent sub-namespace memory like openclaw code agent", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-agent-shared-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const sharedNamespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "code-workspace"
  };
  const agentNamespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "code-workspace.agent.code"
  };

  const shared = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: sharedNamespace,
      visibility: "workspace",
      content: "code workspace 共享规则"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });
  const agent = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: agentNamespace,
      visibility: "workspace",
      content: "code agent 专属规则"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  await registry.promoteCandidateToStable({
    candidateArtifactId: shared.candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["codex_dual_layer_ready"]
  });
  await registry.promoteCandidateToStable({
    candidateArtifactId: agent.candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["codex_dual_layer_ready"]
  });

  const adapter = createCodexAdapterRuntime({
    clock,
    config: {
      registryDir: registryRoot,
      scope: "workspace",
      resource: "openclaw-shared-memory",
      workspaceId: "code-workspace",
      agentId: "code",
      agentNamespaceEnabled: true,
      allowedVisibilities: ["workspace"]
    }
  });

  const memoryPackage = await adapter.readBeforeTask({
    taskPrompt: "继续实现 code agent 共享记忆"
  });

  assert.equal(memoryPackage.memory_items.length, 2);
  assert.equal(memoryPackage.namespace.key, "code-workspace.agent.code");
  assert.match(memoryPackage.prompt_block, /code agent 专属规则/);
  assert.match(memoryPackage.prompt_block, /code workspace 共享规则/);
});

test("codex adapter can write back into the same agent sub-namespace", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-agent-write-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const adapter = createCodexAdapterRuntime({
    clock,
    logger: { info() {} },
    config: {
      registryDir: registryRoot,
      scope: "workspace",
      resource: "openclaw-shared-memory",
      workspaceId: "code-workspace",
      agentId: "code",
      agentNamespaceEnabled: true
    }
  });

  const persisted = await adapter.writeAfterTask({
    taskId: "task_code_1",
    taskTitle: "实现 code 路径",
    summary: "补齐 code agent 与 Codex 的共享记忆对齐"
  });

  assert.equal(persisted.write_back_event.namespace.key, "code-workspace.agent.code");
});

test("createCodexWriteBackEvent validates summary and maps task metadata", () => {
  const event = createCodexWriteBackEvent(
    {
      taskId: "task_2",
      taskTitle: "整理代码",
      summary: "补齐测试",
      tags: ["tests"]
    },
    {
      projectPath: "/tmp/unified-memory-core",
      userId: "codex-user"
    },
    {
      clock: () => new Date("2026-04-11T00:00:00.000Z")
    }
  );

  const memoryPackage = mapCodexExportToTaskMemory(
    {
      exportVersion: "v1",
      exportContract: { namespace: event.namespace },
      payload: {
        code_memory: [
          {
            memory_id: "artifact_1",
            title: "shared memory",
            summary: "先补 contracts"
          }
        ]
      }
    },
    {
      taskPrompt: "继续编码",
      maxItems: 3
    }
  );

  assert.equal(event.task_id, "task_2");
  assert.equal(event.project_id, "unified-memory-core");
  assert.equal(memoryPackage.memory_items.length, 1);
  assert.match(memoryPackage.prompt_block, /shared memory/);
});
