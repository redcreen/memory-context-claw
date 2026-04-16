import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import plugin from "../src/plugin/index.js";
import { createMemoryRegistry } from "../src/unified-memory-core/memory-registry.js";

test("openclaw plugin registers an agent_end hook that captures ordinary durable rules into memory_intent", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-plugin-ordinary-"));
  const hooks = new Map();

  plugin.register({
    runtime: {},
    logger: {
      info() {},
      warn() {},
      error() {}
    },
    pluginConfig: {
      openclawAdapter: {
        ordinaryConversationMemory: {
          enabled: true
        },
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace"
        }
      }
    },
    registerContextEngine() {},
    registerService() {},
    registerTool() {},
    on(hookName, handler) {
      hooks.set(hookName, handler);
    }
  });

  const agentEnd = hooks.get("agent_end");
  assert.equal(typeof agentEnd, "function");

  const persisted = await agentEnd({
    success: true,
    messages: [
      { role: "user", content: "以后只要我发 GitHub 仓库链接，你都先看 README，再给结论。" },
      { role: "assistant", content: "记住了。以后遇到 GitHub 仓库链接，我会先看 README 再给结论。" }
    ]
  }, {
    agentId: "main",
    sessionKey: "agent:main:test"
  });

  assert.ok(persisted);
  assert.equal(persisted.declared_source.sourceType, "memory_intent");
  assert.equal(persisted.declared_source.category, "durable_rule");
  assert.equal(persisted.declared_source.durability, "durable");
  assert.equal(persisted.promoted.length, 1);

  const registry = createMemoryRegistry({ rootDir: registryRoot });
  const records = await registry.listRecords();
  const stableRecords = records.filter((record) => record.record_type === "stable_artifact");
  assert.equal(
    records.filter((record) => record.record_type === "source_artifact" && record.payload?.source_type === "memory_intent").length,
    1
  );
  assert.equal(stableRecords.length, 1);
  assert.equal(stableRecords[0].payload.attributes.memory_intent_admission_route, "candidate_rule");
});

test("openclaw ordinary conversation hook keeps session-only constraints out of stable memory", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-plugin-session-"));
  const hooks = new Map();

  plugin.register({
    runtime: {},
    logger: {
      info() {},
      warn() {},
      error() {}
    },
    pluginConfig: {
      openclawAdapter: {
        ordinaryConversationMemory: {
          enabled: true
        },
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace"
        }
      }
    },
    registerContextEngine() {},
    registerService() {},
    registerTool() {},
    on(hookName, handler) {
      hooks.set(hookName, handler);
    }
  });

  const agentEnd = hooks.get("agent_end");
  const persisted = await agentEnd({
    success: true,
    messages: [
      { role: "user", content: "接下来这个会话里你都用中文，而且回复尽量短。" },
      { role: "assistant", content: "收到，这个会话里我会用中文并尽量简短。" }
    ]
  }, {
    agentId: "main",
    sessionKey: "agent:main:test"
  });

  assert.ok(persisted);
  assert.equal(persisted.declared_source.sourceType, "memory_intent");
  assert.equal(persisted.declared_source.category, "session_constraint");
  assert.equal(persisted.promoted.length, 0);
  assert.equal(
    persisted.reflection.outputs[0].candidate_artifact.attributes.memory_intent_admission_route,
    "observation_session"
  );

  const registry = createMemoryRegistry({ rootDir: registryRoot });
  const records = await registry.listRecords();
  assert.equal(records.filter((record) => record.record_type === "stable_artifact").length, 0);
});

test("openclaw ordinary conversation hook ignores one-off instructions that should not become memory", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-plugin-ignore-ordinary-"));
  const hooks = new Map();

  plugin.register({
    runtime: {},
    logger: {
      info() {},
      warn() {},
      error() {}
    },
    pluginConfig: {
      openclawAdapter: {
        ordinaryConversationMemory: {
          enabled: true
        },
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace"
        }
      }
    },
    registerContextEngine() {},
    registerService() {},
    registerTool() {},
    on(hookName, handler) {
      hooks.set(hookName, handler);
    }
  });

  const agentEnd = hooks.get("agent_end");
  const persisted = await agentEnd({
    success: true,
    messages: [
      { role: "user", content: "只这一次用 capture_xiaohongshu_note 就行；不用记住，也别默认以后都这么做。" },
      { role: "assistant", content: "好的，这次我会处理，但不会把它记成长期规则。" }
    ]
  }, {
    agentId: "main",
    sessionKey: "agent:main:test"
  });

  assert.equal(persisted, null);

  const registry = createMemoryRegistry({ rootDir: registryRoot });
  const records = await registry.listRecords();
  assert.equal(records.length, 0);
});
