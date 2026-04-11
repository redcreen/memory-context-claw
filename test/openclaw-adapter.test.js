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
import { createSourceSystem } from "../src/unified-memory-core/source-system.js";

test("resolvePluginConfig keeps openclaw adapter governed export settings", () => {
  const config = resolvePluginConfig({
    openclawAdapter: {
      governedExports: {
        workspaceId: "demo-workspace",
        registryDir: "/tmp/registry",
        maxCandidates: 3,
        allowedVisibilities: ["workspace", "shared"]
      }
    }
  });

  assert.equal(config.openclawAdapter.governedExports.workspaceId, "demo-workspace");
  assert.equal(config.openclawAdapter.governedExports.registryDir, "/tmp/registry");
  assert.equal(config.openclawAdapter.governedExports.maxCandidates, 3);
  assert.deepEqual(config.openclawAdapter.governedExports.allowedVisibilities, ["workspace", "shared"]);
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
