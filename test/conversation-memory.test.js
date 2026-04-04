import test from "node:test";
import assert from "node:assert/strict";

import {
  extractConversationMemoryCandidates,
  renderConversationMemoryReport
} from "../src/conversation-memory.js";

test("extractConversationMemoryCandidates keeps stable user preferences as long-term memory", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "user",
      text: "我更喜欢先有结构，再展开正文。以后回答要先给结论，再展开。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.ok(longTerm.some((item) => item.text.includes("我更喜欢先有结构")));
  assert.ok(longTerm.some((item) => item.text.includes("以后回答要先给结论")));
});

test("extractConversationMemoryCandidates routes project progress to daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "今天我们已经把 session memory 打开了，下一步是验证 sessions 能不能真正进索引。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.ok(daily.some((item) => item.text.includes("今天我们已经把 session memory 打开了")));
});

test("renderConversationMemoryReport includes both long-term and daily sections", () => {
  const markdown = renderConversationMemoryReport({
    files: ["/tmp/a.jsonl"],
    messages: [{}, {}],
    longTerm: [{
      text: "我习惯先出结构再写内容",
      role: "user",
      score: 8,
      filePath: "/tmp/a.jsonl"
    }],
    daily: [{
      text: "今天已经完成 main agent 的 sessionMemory 配置",
      role: "assistant",
      score: 6,
      filePath: "/tmp/a.jsonl"
    }]
  }, {
    agentId: "main",
    workspaceRoot: "/Users/redcreen/Project/长记忆"
  });

  assert.match(markdown, /建议进入 MEMORY\.md/);
  assert.match(markdown, /建议进入当日 memory/);
  assert.match(markdown, /我习惯先出结构再写内容/);
  assert.match(markdown, /今天已经完成 main agent 的 sessionMemory 配置/);
});

test("extractConversationMemoryCandidates ignores action receipt and command-like noise", () => {
  const result = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "我去查本地 OpenClaw 文档里 /status 和插件扩展点，先把可行接法摸清楚，再给你一个明确方案。只回复 MAIN_OK，不要加解释。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(result.longTerm.length, 0);
  assert.equal(result.daily.length, 0);
});

test("extractConversationMemoryCandidates ignores probe markers and assistant introspection", () => {
  const result = extractConversationMemoryCandidates([
    {
      role: "user",
      text: "探针记忆测试第1条：用户长期偏好是先给结论再展开，避免长篇空话。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "I need to think about how to answer this and maybe use memory search first.",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(result.longTerm.length, 0);
  assert.equal(result.daily.length, 0);
});

test("projectRuntimeMessagesToConversationItems ignores assistant thinking blocks", async () => {
  const { projectRuntimeMessagesToConversationItems } = await import("../src/conversation-memory.js");
  const items = projectRuntimeMessagesToConversationItems([
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: "I need to think about how to answer this." },
        { type: "text", text: "最终回复内容" }
      ]
    }
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].text, "最终回复内容");
});

test("extractConversationMemoryCandidates prefers explicit assistant conclusions", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "结论先说：今天我们已经完成 main agent 的 session memory 配置。下一步是验证 sessions 增量刷新。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.ok(daily.some((item) => item.text.includes("结论先说")));
});

test("extractConversationMemoryCandidates captures user rule channel with higher confidence", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "user",
      text: "我习惯先给结论，再展开细节。不要长篇空话。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.ok(longTerm.some((item) => item.sourceChannel === "user-rule"));
});

test("extractConversationMemoryCandidates still captures assistant daily summary lines", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "当前状态：sessionMemory 已开启。接下来验证增量刷新。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.ok(daily.some((item) => item.text.includes("当前状态")));
});

test("extractConversationMemoryCandidates can derive session-level summary candidates", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "[[reply_to_current]] 可以理解成两档方案。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session-a.jsonl"
    },
    {
      role: "assistant",
      text: "[[reply_to_current]] 最推荐：先做一个本地 JSON 或 CLI 输出。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-a.jsonl"
    }
  ]);

  assert.ok(longTerm.some((item) => item.sourceChannel === "session-summary"));
  assert.ok(longTerm.some((item) => item.text.includes("最推荐")));
});

test("extractConversationMemoryCandidates keeps reply_to_current assistant conclusions", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "[[reply_to_current]] 结论先说：最推荐先做一个本地 JSON 或 CLI 输出，后面再接进 status 体系。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-a.jsonl"
    }
  ]);

  assert.ok(longTerm.some((item) => item.text.includes("最推荐先做一个本地 JSON")));
  assert.ok(longTerm.some((item) => item.text.includes("结论先说")));
  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates ignores non-memory assistant troubleshooting conclusions", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "一句话判断：你现在不像是单点问题，更像是中国区设备 + 代理环境 + 注册校验一起导致的假网络报错。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-a.jsonl"
    }
  ]);

  assert.equal(longTerm.length, 0);
});
