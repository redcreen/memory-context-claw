import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { resolvePluginConfig } from "../src/config.js";
import { ContextAssemblyEngine } from "../src/engine.js";
import {
  createOpenClawAdapterRuntime,
  mapOpenClawExportToCandidates,
  resolveOpenClawAdapterConfig
} from "../src/openclaw-adapter.js";
import { createMemoryRegistry } from "../src/unified-memory-core/memory-registry.js";
import { ingestDeclaredSourceToCandidate } from "../src/unified-memory-core/pipeline.js";
import { createReflectionSystem } from "../src/unified-memory-core/reflection-system.js";
import { createSourceSystem } from "../src/unified-memory-core/source-system.js";

test("resolvePluginConfig keeps openclaw adapter governed export settings", () => {
  const config = resolvePluginConfig({
    openclawAdapter: {
      ordinaryConversationMemory: {
        enabled: true,
        visibility: "shared",
        maxUserChars: 1024
      },
      acceptedActions: {
        enabled: true,
        visibility: "shared"
      },
      governedExports: {
        workspaceId: "demo-workspace",
        registryDir: "/tmp/registry",
        agentWorkspaceIds: {
          code: "code-workspace"
        },
        agentNamespace: {
          enabled: true
        },
        policyAdaptation: {
          maxPolicyInputs: 5
        },
        maxCandidates: 3,
        allowedVisibilities: ["workspace", "shared"]
      }
    }
  });

  assert.equal(config.openclawAdapter.governedExports.workspaceId, "demo-workspace");
  assert.equal(config.openclawAdapter.governedExports.registryDir, "/tmp/registry");
  assert.equal(config.openclawAdapter.ordinaryConversationMemory.enabled, true);
  assert.equal(config.openclawAdapter.ordinaryConversationMemory.visibility, "shared");
  assert.equal(config.openclawAdapter.ordinaryConversationMemory.maxUserChars, 1024);
  assert.equal(config.openclawAdapter.acceptedActions.enabled, true);
  assert.equal(config.openclawAdapter.acceptedActions.visibility, "shared");
  assert.deepEqual(config.openclawAdapter.governedExports.agentWorkspaceIds, {
    code: "code-workspace"
  });
  assert.equal(config.openclawAdapter.governedExports.agentNamespace.enabled, true);
  assert.equal(config.openclawAdapter.governedExports.policyAdaptation.maxPolicyInputs, 5);
  assert.equal(config.openclawAdapter.governedExports.maxCandidates, 3);
  assert.deepEqual(config.openclawAdapter.governedExports.allowedVisibilities, ["workspace", "shared"]);
});

test("resolvePluginConfig enables guarded dialogue working-set path by default", () => {
  const config = resolvePluginConfig({});

  assert.equal(config.dialogueWorkingSetShadow.enabled, false);
  assert.equal(config.dialogueWorkingSetGuarded.enabled, true);
  assert.deepEqual(config.dialogueWorkingSetGuarded.allowedRelations, ["switch", "resolve"]);
});

test("openclaw adapter runtime loads governed export candidates from local registry", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "demo-workspace"
  };

  const { candidateArtifact } = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace,
      visibility: "workspace",
      content: "OpenClaw adapter 应优先消费 governed exports"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  await registry.promoteCandidateToStable({
    candidateArtifactId: candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["openclaw_adapter_ready"]
  });

  const adapterRuntime = createOpenClawAdapterRuntime({
    pluginConfig: {
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace",
          allowedVisibilities: ["workspace"],
          maxCandidates: 2
        }
      }
    }
  });

  const candidates = await adapterRuntime.loadGovernedCandidates({
    query: "当前应该优先带什么长期记忆",
    maxCandidates: 2
  });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].source, "governedArtifact");
  assert.match(candidates[0].snippet, /governed exports/);
});

test("engine merges governed export candidates into the openclaw retrieval path", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-engine-openclaw-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "demo-workspace"
  };

  const { candidateArtifact } = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace,
      visibility: "workspace",
      content: "Unified Memory Core 的 governed export 要先进入 OpenClaw adapter"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  await registry.promoteCandidateToStable({
    candidateArtifactId: candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["engine_integration_ready"]
  });

  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      maxSelectedChunks: 2,
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace",
          allowedVisibilities: ["workspace"]
        }
      }
    },
    retrievalFn: async () => []
  });

  const result = await engine.assemble({
    prompt: "这个项目的长期记忆优先级是什么",
    messages: [{ role: "user", content: "这个项目的长期记忆优先级是什么" }],
    tokenBudget: 4096,
    sessionKey: "agent:main:test"
  });

  assert.equal(result.selectedCandidates.length, 1);
  assert.equal(result.selectedCandidates[0].source, "governedArtifact");
  assert.match(result.systemPromptAddition, /OpenClaw adapter/);
});

test("openclaw adapter runtime merges workspace and agent sub-namespace exports", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-agent-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const sharedNamespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "demo-workspace"
  };
  const agentNamespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "demo-workspace.agent.code"
  };

  const shared = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: sharedNamespace,
      visibility: "workspace",
      content: "共享规则：所有 agent 都能读到"
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
    reasonCodes: ["shared_namespace_ready"]
  });
  await registry.promoteCandidateToStable({
    candidateArtifactId: agent.candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["agent_namespace_ready"]
  });

  const adapterRuntime = createOpenClawAdapterRuntime({
    pluginConfig: {
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace",
          agentNamespace: {
            enabled: true
          },
          allowedVisibilities: ["workspace"],
          maxCandidates: 4
        }
      }
    }
  });

  const codeCandidates = await adapterRuntime.loadGovernedCandidates({
    query: "读 code agent 的治理记忆",
    agentId: "code",
    maxCandidates: 4
  });
  const mainCandidates = await adapterRuntime.loadGovernedCandidates({
    query: "读 main agent 的治理记忆",
    agentId: "main",
    maxCandidates: 4
  });

  assert.equal(codeCandidates.length, 2);
  assert.match(codeCandidates[0].snippet, /code agent 专属规则/);
  assert.match(codeCandidates.map((item) => item.snippet).join("\n"), /共享规则/);
  assert.equal(mainCandidates.length, 1);
  assert.match(mainCandidates[0].snippet, /共享规则/);
});

test("openclaw adapter runtime can override workspace per agent without moving every agent", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-agent-workspace-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const defaultWorkspace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "default-workspace"
  };
  const codeWorkspace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "code-workspace"
  };
  const codeAgentWorkspace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "code-workspace.agent.code"
  };

  const mainShared = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: defaultWorkspace,
      visibility: "workspace",
      content: "main agent 共享规则"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });
  const codeShared = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: codeWorkspace,
      visibility: "workspace",
      content: "code workspace 共享规则"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });
  const codeAgent = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace: codeAgentWorkspace,
      visibility: "workspace",
      content: "code agent 专属记忆"
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  for (const item of [mainShared, codeShared, codeAgent]) {
    await registry.promoteCandidateToStable({
      candidateArtifactId: item.candidateArtifact.artifact_id,
      decidedBy: "test-suite",
      reasonCodes: ["agent_workspace_override_ready"]
    });
  }

  const adapterRuntime = createOpenClawAdapterRuntime({
    pluginConfig: {
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "default-workspace",
          agentWorkspaceIds: {
            code: "code-workspace"
          },
          agentNamespace: {
            enabled: true
          },
          allowedVisibilities: ["workspace"],
          maxCandidates: 4
        }
      }
    }
  });

  const codeCandidates = await adapterRuntime.loadGovernedCandidates({
    query: "读 code agent 的治理记忆",
    agentId: "code",
    maxCandidates: 4
  });
  const mainCandidates = await adapterRuntime.loadGovernedCandidates({
    query: "读 main agent 的治理记忆",
    agentId: "main",
    maxCandidates: 4
  });

  assert.equal(codeCandidates.length, 2);
  assert.match(codeCandidates.map((item) => item.snippet).join("\n"), /code workspace 共享规则/);
  assert.match(codeCandidates.map((item) => item.snippet).join("\n"), /code agent 专属记忆/);
  assert.equal(mainCandidates.length, 1);
  assert.match(mainCandidates[0].snippet, /main agent 共享规则/);
});

test("mapOpenClawExportToCandidates converts exported memory items into retrieval candidates", () => {
  const candidates = mapOpenClawExportToCandidates(
    {
      payload: {
        memory_items: [
          {
            memory_id: "artifact_1",
            title: "稳定规则",
            summary: "先走 governed export",
            visibility: "workspace"
          }
        ]
      }
    },
    {
      query: "测试",
      maxCandidates: 3
    }
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].pathKind, "governedArtifact");
  assert.equal(resolveOpenClawAdapterConfig({}).governedExports.enabled, true);
});

test("openclaw adapter runtime exposes learning metadata for promoted lifecycle artifacts", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-learning-"));
  const clock = () => new Date("2026-04-20T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const reflectionSystem = createReflectionSystem({ registry, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "learning-workspace"
  };

  const { sourceArtifact } = await sourceSystem.ingestDeclaredSource({
    sourceType: "manual",
    declaredBy: "test",
    namespace,
    visibility: "workspace",
    content: "Remember this: the user prefers concise summaries."
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
    reasonCodes: ["learning_metadata_ready"]
  });

  const adapterRuntime = createOpenClawAdapterRuntime({
    pluginConfig: {
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "learning-workspace",
          allowedVisibilities: ["workspace"],
          maxCandidates: 2
        }
      }
    }
  });

  const candidates = await adapterRuntime.loadGovernedCandidates({
    query: "读取学习后的长期记忆",
    maxCandidates: 2
  });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].learning.signal_type, "preference");
  assert.equal(candidates[0].learning.lifecycle_state, "stable");
  assert.ok((candidates[0].learning.promotion_score || 0) > 0);
});

test("openclaw adapter runtime surfaces governed policy context for stage 4 adaptation", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-policy-"));
  const clock = () => new Date("2026-04-20T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const reflectionSystem = createReflectionSystem({ registry, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "policy-workspace"
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
    reasonCodes: ["openclaw_policy_ready"]
  });

  const adapterRuntime = createOpenClawAdapterRuntime({
    pluginConfig: {
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "policy-workspace",
          allowedVisibilities: ["workspace"],
          maxCandidates: 3
        }
      }
    }
  });

  const context = await adapterRuntime.loadGovernedContext({
    query: "给我一个简洁的进展汇报",
    maxCandidates: 3
  });

  assert.equal(context.policyContext.enabled, true);
  assert.equal(context.policyContext.supporting_context_mode, "compact");
  assert.match(context.policyContext.policy_block, /concise progress reports/i);
});
