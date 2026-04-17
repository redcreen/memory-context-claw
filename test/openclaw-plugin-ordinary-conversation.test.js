import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import plugin from "../src/plugin/index.js";
import { createMemoryRegistry } from "../src/unified-memory-core/memory-registry.js";
import { classifyOrdinaryConversationMemoryIntent } from "../src/plugin/ordinary-conversation-memory-hook.js";

test("ordinary GitHub keyword rules stay durable_rule and produce answer-friendly summaries", () => {
  const classified = classifyOrdinaryConversationMemoryIntent({
    userMessage: "From now on, whenever I send a GitHub repository link, use the keyword saffron-releases to remind yourself to check the Releases tab first. Remember this as my default workflow.",
    assistantReply: "Understood."
  });

  assert.ok(classified);
  assert.equal(classified.category, "durable_rule");
  assert.match(classified.summary, /default rule keyword:\s*saffron-releases/i);
  assert.match(classified.summary, /releases tab/i);
});

test("ordinary keyword and codename extraction does not collapse to the filler word 'for'", () => {
  const csvRule = classifyOrdinaryConversationMemoryIntent({
    userMessage: "From now on, whenever I ask you to review a CSV export, first compare the column headers before anything else. The keyword for that default workflow is silver-headers. Remember this.",
    assistantReply: "Understood."
  });
  const hotelRule = classifyOrdinaryConversationMemoryIntent({
    userMessage: "Going forward, whenever I ask for hotel options, show me the cancellation policy first. The codename for that default travel rule is pine-cancel. Remember it.",
    assistantReply: "Understood."
  });

  assert.ok(csvRule);
  assert.ok(hotelRule);
  assert.match(csvRule.summary, /silver-headers/i);
  assert.doesNotMatch(csvRule.summary, /\bfor\.$/i);
  assert.match(hotelRule.summary, /pine-cancel/i);
  assert.doesNotMatch(hotelRule.summary, /\bfor\.$/i);
});

test("ordinary Slack routing rules keep generic tool names without product-specific hardcoding", () => {
  const classified = classifyOrdinaryConversationMemoryIntent({
    userMessage: "Going forward, whenever I send you a Slack thread URL, use summarize_slack_thread first and mark the result with olive-thread. Please remember that default routing rule.",
    assistantReply: "Understood."
  });

  assert.ok(classified);
  assert.equal(classified.category, "tool_routing_preference");
  assert.equal(classified.structured_rule?.action?.tool, "summarize_slack_thread");
  assert.match(classified.summary, /Slack thread/i);
  assert.match(classified.summary, /olive-thread/i);
  assert.match(classified.summary, /tag the result olive-thread/i);
});

test("ordinary Notion routing rules keep trigger labels even when English casing changes", () => {
  const classified = classifyOrdinaryConversationMemoryIntent({
    userMessage: "Going forward, whenever I send a Notion export package, use parse_notion_export first and tag the result copper-notion. Remember this default workflow.",
    assistantReply: "Understood."
  });

  assert.ok(classified);
  assert.equal(classified.category, "tool_routing_preference");
  assert.match(classified.summary, /Notion export package/i);
  assert.match(classified.summary, /copper-notion/i);
  assert.match(classified.summary, /tag the result copper-notion/i);
});

test("ordinary routing rules recognize generic action verbs beyond use", () => {
  const classified = classifyOrdinaryConversationMemoryIntent({
    userMessage: "Going forward, whenever I send hotel options, run compare_hotel_options first and remember that default workflow.",
    assistantReply: "Understood."
  });

  assert.ok(classified);
  assert.equal(classified.category, "tool_routing_preference");
  assert.equal(classified.structured_rule?.action?.tool, "compare_hotel_options");
});

test("ordinary durable rules do not confuse snake_case codenames with tool names", () => {
  const classified = classifyOrdinaryConversationMemoryIntent({
    userMessage: "From now on, whenever I send a GitHub repository link, remember the default codename olive_thread and check the Releases tab first.",
    assistantReply: "Understood."
  });

  assert.ok(classified);
  assert.equal(classified.category, "durable_rule");
  assert.equal(classified.structured_rule?.action?.tool, "");
  assert.match(classified.summary, /olive_thread/i);
});

test("durable reply-language preferences are not misclassified as session constraints", () => {
  const classified = classifyOrdinaryConversationMemoryIntent({
    userMessage: "以后默认都用中文回复，记住这个偏好。",
    assistantReply: "收到。"
  });

  assert.ok(classified);
  assert.equal(classified.category, "user_profile_fact");
  assert.equal(classified.durability, "durable");
});

test("ordinary small talk without durable signals exits cleanly", () => {
  const classified = classifyOrdinaryConversationMemoryIntent({
    userMessage: "哈哈，今天路上太堵了，先随便聊聊。",
    assistantReply: "收到。"
  });

  assert.equal(classified, null);
});

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
  assert.match(stableRecords[0].payload.summary, /先看 readme/i);
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

test("openclaw ordinary conversation hook ignores Chinese one-off airport assumptions", async () => {
  const classified = classifyOrdinaryConversationMemoryIntent({
    userMessage: "这一次先假设我默认出发机场是成田机场，方便订今天的航班；不要把这个记成长期默认机场。",
    assistantReply: "收到。"
  });

  assert.equal(classified, null);
});

test("openclaw plugin pre-captures durable ordinary memory on before_agent_start and dedupes agent_end", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-plugin-before-agent-start-"));
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

  const beforeAgentStart = hooks.get("before_agent_start");
  const agentEnd = hooks.get("agent_end");
  assert.equal(typeof beforeAgentStart, "function");
  assert.equal(typeof agentEnd, "function");

  const beforeResult = await beforeAgentStart({
    prompt: "dummy",
    messages: [
      { role: "user", content: "Going forward, whenever I send a pull request link, first check unresolved review comments. The codename for that default rule is cedar-comments. Please remember it." }
    ]
  }, {
    agentId: "main",
    sessionKey: "agent:main:test"
  });

  assert.ok(beforeResult);
  assert.equal(beforeResult.declared_source.category, "durable_rule");

  const endResult = await agentEnd({
    success: true,
    messages: [
      { role: "user", content: "Going forward, whenever I send a pull request link, first check unresolved review comments. The codename for that default rule is cedar-comments. Please remember it." },
      { role: "assistant", content: "Got it — I’ll use cedar-comments." }
    ]
  }, {
    agentId: "main",
    sessionKey: "agent:main:test"
  });

  assert.equal(endResult, null);

  const registry = createMemoryRegistry({ rootDir: registryRoot });
  const records = await registry.listRecords();
  assert.equal(records.filter((record) => record.record_type === "source_artifact").length, 1);
  assert.equal(records.filter((record) => record.record_type === "stable_artifact").length, 1);
});
