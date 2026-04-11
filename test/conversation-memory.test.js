import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";

import {
  applyExistingMemoryMatches,
  buildSearchFriendlyMemoryCards,
  extractConversationMemoryCandidates,
  extractIndexedChunkMessages,
  mergeDailyPromotionBlock,
  readIndexedSessionMessages,
  renderConversationMemoryReport,
  renderDailyPromotionBlock,
  renderSearchFriendlyMemoryCards,
  selectPromotableDailyCandidates,
  summarizeCandidateRecommendations
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

test("extractConversationMemoryCandidates keeps explicit food preferences as long-term memory", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "user",
      text: "我爱吃牛排。",
      timestamp: "2026-04-05T09:28:00.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "记住了，你爱吃牛排。以后聊吃饭、订餐、选餐厅，我会默认把牛排放进优先选项里。",
      timestamp: "2026-04-05T09:28:10.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.ok(longTerm.some((item) => item.text.includes("你爱吃牛排")));
  assert.ok(!longTerm.some((item) => item.text.includes("默认把牛排放进优先选项")));
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

test("extractConversationMemoryCandidates boosts fresh live daily candidates over stale indexed ones", () => {
  const now = new Date().toISOString();
  const stale = "2026-03-20T10:00:00.000Z";
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "今天我们已经完成 unified-memory-core 的候选提炼优化。",
      timestamp: now,
      filePath: "/tmp/live-session.jsonl"
    },
    {
      role: "assistant",
      text: "今天我们已经完成 unified-memory-core 的候选提炼优化（旧版）。",
      timestamp: stale,
      filePath: "sessions/old-session.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.ok(daily[0].filePath.startsWith("/tmp/live-session.jsonl"));
});

test("extractConversationMemoryCandidates rejects procedural status chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "我现在在按配置把各个 agent 的 workspace 和目录结构顺着查，下一步就是把它们各自的 MEMORY.md 和 memory 对齐起来。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects directory state snapshots from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "memory 文件夹是空的，没有按日期记录的每日笔记文件。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects generic multi-session workflow chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "这种情况用一个 agent 多 session 很自然。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects preparatory config-check starters from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "首先，我需要确认一下当前的 agent 配置情况。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects operational action-plan sentences from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "这需要修改OpenClaw的配置或创建监控脚本。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects greeting and readiness chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "三德子刚睡醒，准备就绪～ 今天想让我帮你做点啥",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects reset-explanation sentences from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "这意味着清除我们当前的对话历史，让我重新开始。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects memory-file confirmation chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "好的，我看到今天的记忆文件已经记录了重置操作。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects full-text presentation chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "以上是 MEMORY.md 的完整原文",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects start-of-work acknowledgement chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "在的，收到，开始只分析不修改的稳定性风险系统检查。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates classifies stable personal background as long-term memory", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "超哥2025年8月开始做毛绒玩具工厂，从互联网转型到实体制造业。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.ok(longTerm.some((item) => item.text.includes("毛绒玩具工厂")));
  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates does not classify plain honorific chatter as long-term memory", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "超哥，这个我还真不清楚。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(longTerm.length, 0);
  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects self-review progress chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "说实话：刚才这几轮并没有真正推进 main 的分析。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects help-text command explanations from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "根据帮助信息，reset 命令会重置本地配置和状态。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects illustrative thread examples from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "比如你有：主聊天、某个项目线程、某个群。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects continue-progress acknowledgements from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "收到，继续推进 Telegram 提醒链路检查和修复。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects local-config explanation sentences from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "因为这不一定全写在上下文里，通常要看本地配置或状态。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects config-key diagnosis sentences from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "看起来 `redirect` 不是有效的配置键。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("renderConversationMemoryReport includes both long-term and daily sections", () => {
  const markdown = renderConversationMemoryReport({
    files: ["/tmp/a.jsonl"],
    messages: [{}, {}],
    longTerm: [{
      text: "我习惯先出结构再写内容",
      role: "user",
      score: 8,
      filePath: "/tmp/a.jsonl",
      sourceChannel: "user-rule",
      recommendation: {
        action: "promote-memory-md",
        confidence: "high",
        reasons: ["用户明确表达的稳定规则/偏好"]
      }
    }],
    daily: [{
      text: "今天已经完成 main agent 的 sessionMemory 配置",
      role: "assistant",
      score: 6,
      filePath: "/tmp/a.jsonl",
      sourceChannel: "assistant-summary",
      recommendation: {
        action: "review-daily-memory",
        confidence: "low",
        reasons: ["已被整理成阶段总结"]
      }
    }]
  }, {
    agentId: "main",
    workspaceRoot: "/Users/redcreen/Project/unified-memory-core/workspace"
  });

  assert.match(markdown, /建议进入 MEMORY\.md/);
  assert.match(markdown, /建议进入当日 memory/);
  assert.match(markdown, /长期候选建议直升 MEMORY\.md/);
  assert.match(markdown, /长期候选已被现有 MEMORY 覆盖/);
  assert.match(markdown, /我习惯先出结构再写内容/);
  assert.match(markdown, /今天已经完成 main agent 的 sessionMemory 配置/);
  assert.match(markdown, /建议动作: `promote-memory-md`/);
  assert.match(markdown, /判断依据:/);
});

test("renderSearchFriendlyMemoryCards renders retrieval-friendly fact cards", () => {
  const markdown = renderSearchFriendlyMemoryCards({
    longTerm: [{
      text: "你爱吃牛排",
      role: "assistant",
      score: 8,
      filePath: "memory/2026-04-05-food-preference.md",
      sourceChannel: "assistant-fact",
      recommendation: {
        action: "review-memory-md",
        confidence: "medium"
      }
    }],
    daily: []
  }, {
    agentId: "main"
  });

  assert.match(markdown, /# Search-Friendly Memory Cards/);
  assert.match(markdown, /## Card 1: 饮食偏好/);
  assert.match(markdown, /- Fact: 你爱吃牛排/);
  assert.match(markdown, /food-preference\.md/);
});

test("renderSearchFriendlyMemoryCards extracts a shorter conclusion-style fact", () => {
  const markdown = renderSearchFriendlyMemoryCards({
    longTerm: [],
    daily: [{
      text: "我查到： - openclaw status --help 里有标准状态输出 - 插件 SDK 里有专门的 status-helpers - 架构文档里明确写了：channel plugin 可以实现 read-only channel inspection/status adapter 这说明： 如果你要把 Codex 余额作为 OpenClaw 的系统状态项展示，这是有正式扩展点的",
      role: "assistant",
      score: 8,
      filePath: "memory/2026-04-05-codex-balance.md",
      sourceChannel: "session-memory",
      recommendation: {
        action: "review-daily-memory",
        confidence: "medium"
      }
    }]
  }, {
    agentId: "main"
  });

  assert.match(markdown, /这是有正式扩展点的/);
  assert.doesNotMatch(markdown, /我查到： - openclaw status --help 里有标准状态输出/);
});

test("renderSearchFriendlyMemoryCards trims explanatory tails after the main rule", () => {
  const markdown = renderSearchFriendlyMemoryCards({
    longTerm: [{
      text: "`MEMORY.md` 应该放的是长期稳定、会被反复复用的内容。你之前定的范围主要是这些：长期偏好、固定工作流程。",
      role: "assistant",
      score: 12,
      filePath: "/tmp/memory-rule.jsonl",
      sourceChannel: "assistant-conclusion",
      recommendation: {
        action: "promote-memory-md",
        confidence: "high"
      }
    }],
    daily: []
  }, {
    agentId: "main"
  });

  assert.match(markdown, /Fact: MEMORY\.md 应该放的是长期稳定、会被反复复用的内容/);
  assert.doesNotMatch(markdown, /你之前定的范围主要是这些/);
});

test("buildSearchFriendlyMemoryCards returns structured card artifacts", () => {
  const cards = buildSearchFriendlyMemoryCards({
    longTerm: [{
      text: "你爱吃牛排",
      role: "assistant",
      score: 8,
      filePath: "memory/2026-04-05-food-preference.md",
      sourceChannel: "assistant-fact",
      recommendation: {
        action: "review-memory-md",
        confidence: "medium"
      }
    }],
    daily: []
  });

  assert.equal(cards.length, 1);
  assert.equal(cards[0].title, "饮食偏好");
  assert.equal(cards[0].fact, "你爱吃牛排");
  assert.equal(cards[0].sourceFile, "2026-04-05-food-preference.md");
  assert.equal(cards[0].sourceChannel, "assistant-fact");
});

test("summarizeCandidateRecommendations counts promote and review actions", () => {
  const summary = summarizeCandidateRecommendations({
    longTerm: [
      { recommendation: { action: "promote-memory-md" } },
      { recommendation: { action: "review-memory-md" } },
      { recommendation: { action: "review-memory-md" } },
      { recommendation: { action: "skip-memory-md-existing" } }
    ],
    daily: [
      { recommendation: { action: "promote-daily-memory" } },
      { recommendation: { action: "review-daily-memory" } },
      { recommendation: { action: "skip-daily-memory-existing" } }
    ]
  });

  assert.equal(summary.longTerm["promote-memory-md"], 1);
  assert.equal(summary.longTerm["review-memory-md"], 2);
  assert.equal(summary.longTerm["skip-memory-md-existing"], 1);
  assert.equal(summary.daily["promote-daily-memory"], 1);
  assert.equal(summary.daily["review-daily-memory"], 1);
  assert.equal(summary.daily["skip-daily-memory-existing"], 1);
});

test("selectPromotableDailyCandidates returns only promotable daily items", () => {
  const selected = selectPromotableDailyCandidates({
    daily: [
      { text: "OpenClaw 的长期记忆和 Lossless 不是同一层能力。", recommendation: { action: "promote-daily-memory" } },
      { text: "当前状态：OpenClaw 版本 2026.3.31", recommendation: { action: "promote-daily-memory" } },
      { text: "B", recommendation: { action: "review-daily-memory" } }
    ]
  });

  assert.deepEqual(selected.map((item) => item.text), ["OpenClaw 的长期记忆和 Lossless 不是同一层能力。"]);
});

test("mergeDailyPromotionBlock appends block once", () => {
  const block = renderDailyPromotionBlock([{ text: "今天已经完成 main agent 的 sessionMemory 配置" }], {
    date: "2026-04-05"
  });
  assert.match(block, /自动沉淀候选/);

  const merged = mergeDailyPromotionBlock("# 2026-04-05\n", [{ text: "今天已经完成 main agent 的 sessionMemory 配置" }], {
    date: "2026-04-05"
  });
  assert.match(merged, /自动沉淀候选/);

  const mergedAgain = mergeDailyPromotionBlock(merged, [{ text: "今天已经完成 main agent 的 sessionMemory 配置" }], {
    date: "2026-04-05"
  });
  assert.equal(mergedAgain, merged);
});

test("mergeDailyPromotionBlock replaces existing auto block", () => {
  const existing = "# 2026-04-05\n\n## 自动沉淀候选\n- 旧条目\n";
  const merged = mergeDailyPromotionBlock(existing, [{ text: "新条目" }], { date: "2026-04-05" });
  assert.match(merged, /新条目/);
  assert.doesNotMatch(merged, /旧条目/);
});

test("mergeDailyPromotionBlock removes existing auto block when no candidates remain", () => {
  const existing = "# 2026-04-05\n\n## 自动沉淀候选\n- 旧条目\n";
  const merged = mergeDailyPromotionBlock(existing, [], { date: "2026-04-05" });
  assert.equal(merged.trim(), "# 2026-04-05");
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

test("extractConversationMemoryCandidates keeps substantive daily completion summaries", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "当前状态：sessionMemory 已开启。接下来验证增量刷新。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "我还在这儿，刚才没有按 1 分钟给你回报，是我执行习惯没切过来。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.ok(daily.some((item) => item.text.includes("sessionMemory 已开启")));
  assert.ok(daily.every((item) => !item.text.includes("执行习惯没切过来")));
});

test("extractConversationMemoryCandidates prefers long-term for memory-rule sentences even when memory keyword appears", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "MEMORY.md 应该放长期稳定、会被反复复用的规则、偏好和背景信息。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.ok(longTerm.some((item) => item.text.includes("长期稳定")));
  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects self-correction chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "这个批评成立。我前面的判断只能算结构层面的初判，还不能当最终建议。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects task-request sentences from long-term memory", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "user",
      text: "帮我系统检查 openclaw-task-system 当前还存在哪些稳定性风险。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(longTerm.length, 0);
});

test("extractConversationMemoryCandidates rejects approval and residue chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "你再批这一个，我就能基本给你出确定原因： /approve 21018495 allow-once",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "Need likely continue maybe via skill creator? 继续。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects markdown-wrapped residue chatter from daily memory", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "**当前还没有把分析结果产出来，所以不能算做完。**",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "`我更新到 MEMORY.md 里，这样以后就不会搞混了`",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects low-signal label fragments", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "user",
      text: "MEMORY.md",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "user",
      text: "openclaw",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(longTerm.length, 0);
  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects low-signal generic assistant action starters", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "让我检查一下实际的配置。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(longTerm.length, 0);
  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects low-value config acknowledgement chatter", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "好的，我看到了配置文件。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "好的，配置已恢复。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "好的，我去 MEMORY.md 里查一下记录的内容。",
      timestamp: "2026-04-04T10:00:02.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "首先，让我检查一下 OpenClaw 的配置目录：",
      timestamp: "2026-04-04T10:00:03.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(longTerm.length, 0);
  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates rejects unrelated search-result and gateway-fix chatter", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "🎉 搜索结果：找到了淘宝相关的 OpenClaw Skill",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    },
    {
      role: "assistant",
      text: "完美！现在网关已经重新启动并应用了新的配置。问题已解决！控制台错误请求 deepseek/kimi-2.5 现在会被正确映射到 moonshot/kimi-2.5。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    },
    {
      role: "assistant",
      text: "现在我为每个 channel 添加独立的 allowFrom 配置。",
      timestamp: "2026-04-04T10:00:02.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    },
    {
      role: "assistant",
      text: "已经先把新的 main/MEMORY.md 草案写进去了。",
      timestamp: "2026-04-04T10:00:03.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    },
    {
      role: "assistant",
      text: "看起来已经有一个同名的skill了（我们刚才创建的简化版）。",
      timestamp: "2026-04-04T10:00:04.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    },
    {
      role: "assistant",
      text: "好的，我重新帮你为每个channel配置单独的openid。",
      timestamp: "2026-04-04T10:00:05.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    },
    {
      role: "assistant",
      text: "超哥，两个孩子，一儿一女，已经写进 MEMORY.md 了。",
      timestamp: "2026-04-04T10:00:06.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    },
    {
      role: "assistant",
      text: "不再去翻 memory/ 目录全文，不再扩任务。",
      timestamp: "2026-04-04T10:00:07.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    },
    {
      role: "assistant",
      text: "先查看 ClawHub（OpenClaw 的技能市场）：",
      timestamp: "2026-04-04T10:00:08.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    }
  ]);

  assert.equal(longTerm.length, 0);
  assert.equal(daily.length, 0);
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

test("extractConversationMemoryCandidates rejects latency troubleshooting from long-term memory", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "结论先说：核心不是 Feishu 发消息慢，而是首包前这段慢。日志里能看到 dispatching to agent、typing indicator 和 onPartialReply 之间的时延。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-a.jsonl"
    }
  ]);

  assert.equal(longTerm.length, 0);
  assert.ok(daily.some((item) => item.text.includes("Feishu 发消息慢")));
});

test("extractConversationMemoryCandidates keeps memory-domain conclusions in long-term memory", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "结论先说：长期记忆负责存和找，Lossless 负责当前上下文编排。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-a.jsonl"
    }
  ]);

  assert.ok(longTerm.some((item) => item.text.includes("长期记忆负责存和找")));
});

test("extractConversationMemoryCandidates rejects model-choice conclusions from long-term memory", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "先说结论：如果是你现在这个 main 总助链路，我更倾向于把默认模型放在 openai-codex/gpt-5.4，而不是 kimi。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-a.jsonl"
    }
  ]);

  assert.equal(longTerm.length, 0);
  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates keeps stable collaboration rules in long-term memory", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "一句话结论：因为现在做的这类事，很多是分阶段推进，不是必须整段时间都锁死执行。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-a.jsonl"
    }
  ]);

  assert.ok(longTerm.some((item) => item.text.includes("分阶段推进")));
});

test("extractConversationMemoryCandidates annotates promotion recommendations", () => {
  const { longTerm, daily } = extractConversationMemoryCandidates([
    {
      role: "user",
      text: "我习惯先给结论，再展开细节。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "当前状态：sessionMemory 已开启。接下来验证增量刷新。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ]);

  assert.equal(longTerm[0].recommendation.action, "promote-memory-md");
  assert.equal(longTerm[0].recommendation.confidence, "high");
  assert.ok(daily[0].recommendation.action.includes("daily-memory"));
});

test("extractConversationMemoryCandidates reduces redundant near-duplicate long-term candidates", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "MEMORY.md 应该放长期稳定、会被反复复用的内容。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "MEMORY.md 应该放长期稳定、会被反复复用的规则、偏好和背景信息。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.equal(longTerm.length, 1);
  assert.ok(longTerm[0].text.includes("规则、偏好和背景信息"));
});

test("extractConversationMemoryCandidates reduces repeated metaphor-style daily variants", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "Memory 是图书馆，Lossless 是图书管理员/备课助手，书已经收进馆里，不等于这节课桌上已经摆好了最该看的那几本。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session-a.jsonl"
    },
    {
      role: "assistant",
      text: "Memory 是图书馆，Lossless 是图书管理员/备课助手，书已经在馆里，不等于这一轮模型桌上已经摆好了最该看的那些。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-b.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.equal(daily.length, 1);
});

test("extractConversationMemoryCandidates prefers thematic plugin-memory candidates over off-topic history", () => {
  const { longTerm } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "MEMORY.md 应该放长期稳定、会被反复复用的规则、偏好和背景信息。",
      timestamp: "2026-04-04T10:00:00.000Z",
      filePath: "/tmp/session-a.jsonl"
    },
    {
      role: "assistant",
      text: "Claude 注册网络问题更像是 iPhone 地区和代理出口环境叠加导致的假报错。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-b.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.ok(longTerm[0].text.includes("MEMORY.md"));
});

test("extractConversationMemoryCandidates penalizes off-topic daily items even if fresh", () => {
  const now = new Date().toISOString();
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "这个插件的定位是 context engine，不是另一个长期记忆库。",
      timestamp: now,
      filePath: "/tmp/plugin-session.jsonl"
    },
    {
      role: "assistant",
      text: "不记得那种儿时往事，我没有人类那种从小到大的亲身童年记忆。",
      timestamp: now,
      filePath: "/tmp/offtopic-session.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.ok(daily[0].text.includes("context engine"));
});

test("buildSearchFriendlyMemoryCards labels project positioning cards clearly", () => {
  const cards = buildSearchFriendlyMemoryCards({
    longTerm: [
      {
        kind: "longTerm",
        text: "这个插件的定位是 context engine，负责把长期记忆更稳定地变成当前轮可用的上下文。",
        filePath: "memory/2026-04-05-project-positioning.md",
        sourceChannel: "assistant-conclusion",
        recommendation: {
          action: "review-memory-md",
          confidence: "medium"
        }
      }
    ],
    daily: []
  });

  assert.equal(cards[0].title, "项目定位");
  assert.ok(cards[0].tags.includes("project"));
  assert.match(cards[0].fact, /context engine|长期记忆更稳定地变成当前轮可用的上下文/);
});

test("buildSearchFriendlyMemoryCards labels work background cards clearly", () => {
  const cards = buildSearchFriendlyMemoryCards({
    longTerm: [
      {
        kind: "longTerm",
        text: "你2025年8月开始做毛绒玩具工厂，从互联网转型到实体制造业。",
        filePath: "memory/2026-04-05-work-background.md",
        sourceChannel: "assistant-fact",
        recommendation: {
          action: "review-memory-md",
          confidence: "medium"
        }
      }
    ],
    daily: []
  });

  assert.equal(cards[0].title, "职业背景");
  assert.ok(cards[0].tags.includes("work"));
  assert.ok(cards[0].tags.includes("background"));
  assert.match(cards[0].fact, /毛绒玩具工厂|实体制造业/);
});

test("buildSearchFriendlyMemoryCards drops assistant-conclusion cards already covered by MEMORY.md", () => {
  const cards = buildSearchFriendlyMemoryCards({
    longTerm: [
      {
        kind: "longTerm",
        text: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
        filePath: "/Users/redcreen/.openclaw/agents/main/sessions/demo.jsonl",
        sourceChannel: "assistant-conclusion",
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      },
      {
        kind: "longTerm",
        text: "你爱吃牛排",
        filePath: "memory/2026-04-05-food-preference.md",
        sourceChannel: "assistant-fact",
        recommendation: {
          action: "review-memory-md",
          confidence: "medium"
        }
      }
    ],
    daily: []
  });

  assert.equal(cards.length, 1);
  assert.equal(cards[0].fact, "你爱吃牛排");
});

test("extractConversationMemoryCandidates does not auto-promote off-topic assistant conclusions", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "结论先说：你现在不像是单点问题，更像是中国区设备 + 代理环境 + Claude 注册校验一起导致的假网络报错。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-a.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.equal(daily[0].recommendation.action, "review-daily-memory");
});

test("extractConversationMemoryCandidates drops off-topic historical assistant daily candidates", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "结论先说：你现在不像是单点问题，更像是中国区设备 + 代理环境 + Claude 注册校验一起导致的假网络报错。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates filters status snapshot summaries entirely", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "当前状态：OpenClaw 版本 2026.3.31，当前模型 openai-codex/gpt-5.4，会话 agent:main:main，上下文占用 158k / 272k，缓存命中率 99%，当前活跃任务 0。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/tmp/session-a.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates drops status snapshot summaries from daily candidates", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "当前状态：OpenClaw 版本 2026.3.31，当前模型 openai-codex/gpt-5.4，会话 agent:main:main，上下文占用 158k / 272k，缓存命中率 99%，当前活跃任务 0。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.equal(daily.length, 0);
});

test("extractConversationMemoryCandidates drops overlong explanatory daily candidates", () => {
  const { daily } = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "能不能一边执行一边对话，不主要取决于模型名，而是取决于整个运行方式。关键不在模型本身，而在工具调用是不是分阶段的、agent 框架会不会把任务锁死在单轮里、模型首包速度会不会让体感像卡住。如果系统支持先发起工具、工具异步返回、中间还能继续收发消息，那就能做到边推进边汇报。如果之前那套是发一个请求后整个会话阻塞、必须等全跑完才能回，那不管是 kimi-k2.5 还是别的模型，看起来都会像傻等。",
      timestamp: "2026-04-04T10:00:01.000Z",
      filePath: "/Users/redcreen/.openclaw/agents/main/sessions/old.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  assert.equal(daily.length, 0);
});

test("applyExistingMemoryMatches downgrades candidates already covered by existing memory", () => {
  const extracted = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "MEMORY.md 应该放长期稳定、会被反复复用的规则、偏好和背景信息。",
      timestamp: "",
      filePath: "/tmp/session.jsonl"
    },
    {
      role: "assistant",
      text: "今天已经完成 main agent 的 sessionMemory 配置。",
      timestamp: "",
      filePath: "/tmp/session.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  const longTerm = applyExistingMemoryMatches(extracted.longTerm, [
    {
      filePath: "/tmp/MEMORY.md",
      text: "MEMORY.md 应该放长期稳定、会被反复复用的规则、偏好和背景信息"
    }
  ]);
  const daily = applyExistingMemoryMatches(extracted.daily, [
    {
      filePath: "/tmp/memory/2026-04-04.md",
      text: "今天已经完成 main agent 的 sessionMemory 配置"
    }
  ]);

  assert.equal(longTerm[0].recommendation.action, "skip-memory-md-existing");
  assert.equal(longTerm[0].existingMatch.filePath, "/tmp/MEMORY.md");
  assert.equal(daily[0].recommendation.action, "skip-daily-memory-existing");
  assert.equal(daily[0].existingMatch.filePath, "/tmp/memory/2026-04-04.md");
});

test("applyExistingMemoryMatches detects semantic overlap with existing memory document", () => {
  const extracted = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。长期偏好、固定工作流程、常用术语与约定、项目长期背景，都应该放在这里；频繁变化的内容先放到 memory/。",
      timestamp: "",
      filePath: "/tmp/session.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  const longTerm = applyExistingMemoryMatches(extracted.longTerm, [
    {
      filePath: "/tmp/MEMORY.md",
      text: "# 长记忆\n这个文件只放长期稳定、会被反复复用的规则、偏好和背景信息。\n长期偏好\n固定工作流程\n常用术语与约定\n项目长期背景\n频繁变化的内容先放到 memory/ 里",
      normalized: "长记忆 这个文件只放长期稳定 会被反复复用的规则 偏好和背景信息 长期偏好 固定工作流程 常用术语与约定 项目长期背景 频繁变化的内容先放到 memory 里",
      matchKind: "document"
    }
  ]);

  assert.equal(longTerm[0].recommendation.action, "skip-memory-md-existing");
  assert.equal(longTerm[0].existingMatch.match, "semantic-document");
});

test("applyExistingMemoryMatches detects candidate coverage inside existing memory document", () => {
  const extracted = extractConversationMemoryCandidates([
    {
      role: "assistant",
      text: "MEMORY.md 应该放长期稳定、会被反复复用的规则、偏好和背景信息。",
      timestamp: "",
      filePath: "/tmp/session.jsonl"
    }
  ], { maxLongTerm: 10, maxDaily: 10 });

  const longTerm = applyExistingMemoryMatches(extracted.longTerm, [
    {
      filePath: "/tmp/MEMORY.md",
      text: "# 长记忆\n这个文件只放长期稳定、会被反复复用的规则、偏好和背景信息。\n长期偏好\n固定工作流程\n常用术语与约定\n项目长期背景\n频繁变化的内容先放到 memory/ 里",
      normalized: "长记忆 这个文件只放长期稳定 会被反复复用的规则 偏好和背景信息 长期偏好 固定工作流程 常用术语与约定 项目长期背景 频繁变化的内容先放到 memory 里",
      matchKind: "document"
    }
  ]);

  assert.equal(longTerm[0].recommendation.action, "skip-memory-md-existing");
  assert.equal(longTerm[0].existingMatch.match, "semantic-document-coverage");
});

test("extractIndexedChunkMessages converts indexed session chunks into visible messages", () => {
  const messages = extractIndexedChunkMessages(
    "User: 我之前怎么理解 Lossless 和长期记忆的区别？\nAssistant: [[reply_to_current]] 结论先说：长期记忆负责存和找，Lossless 负责当前上下文编排。",
    "sessions/example.jsonl"
  );

  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "user");
  assert.match(messages[0].text, /Lossless 和长期记忆/);
  assert.equal(messages[1].role, "assistant");
  assert.match(messages[1].text, /长期记忆负责存和找/);
});

test("extractIndexedChunkMessages supports lowercase session-memory transcript markers", () => {
  const messages = extractIndexedChunkMessages(
    "assistant: ✅ New session started · model: openai-codex/gpt-5.4\nuser: 我爱吃牛排\nassistant: [[reply_to_current]] 记住了，你爱吃牛排。以后聊吃饭、订餐、选餐厅，我会默认把牛排放进优先选项里。",
    "memory/2026-04-05-food-preference.md"
  );

  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "user");
  assert.match(messages[0].text, /我爱吃牛排/);
  assert.equal(messages[1].role, "assistant");
  assert.match(messages[1].text, /记住了，你爱吃牛排/);
});

test("readIndexedSessionMessages returns empty when memory db is missing", async () => {
  const messages = await readIndexedSessionMessages("agent-that-does-not-exist", {
    fileLimit: 5
  });
  assert.deepEqual(messages, []);
});

test("readIndexedSessionMessages includes indexed session-memory summary files", async () => {
  const agentId = `test-agent-memory-${Date.now()}`;
  const dbDir = path.join(os.homedir(), ".openclaw", "memory");
  const dbPath = path.join(dbDir, `${agentId}.sqlite`);
  await fs.mkdir(dbDir, { recursive: true });

  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`
      CREATE TABLE chunks (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'memory',
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        hash TEXT NOT NULL,
        model TEXT NOT NULL,
        text TEXT NOT NULL,
        embedding TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    const text = `# Session: 2026-04-05 01:28:57 UTC

- **Session Key**: agent:main:telegram:direct:8705812936
- **Session ID**: abc
- **Source**: telegram

## Conversation Summary

Assistant: [[reply_to_current]] 早，超哥。
User: 我爱吃牛排
Assistant: [[reply_to_current]] 记住了，你爱吃牛排。以后聊吃饭、订餐、选餐厅，我会默认把牛排放进优先选项里。`;
    db.prepare(`
      INSERT INTO chunks (id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "c1",
      "memory/2026-04-05-food-preference.md",
      "memory",
      1,
      12,
      "h1",
      "m1",
      text,
      "[]",
      Date.now()
    );
  } finally {
    db.close();
  }

  try {
    const messages = await readIndexedSessionMessages(agentId, { fileLimit: 5 });
    assert.ok(messages.some((message) => message.text.includes("我爱吃牛排")));
    assert.ok(messages.some((message) => message.text.includes("记住了，你爱吃牛排")));
  } finally {
    await fs.unlink(dbPath).catch(() => {});
  }
});

test("readIndexedSessionMessages does not treat ordinary dated memory files as session-memory summaries", async () => {
  const agentId = `test-agent-daily-${Date.now()}`;
  const dbDir = path.join(os.homedir(), ".openclaw", "memory");
  const dbPath = path.join(dbDir, `${agentId}.sqlite`);
  await fs.mkdir(dbDir, { recursive: true });

  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`
      CREATE TABLE chunks (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'memory',
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        hash TEXT NOT NULL,
        model TEXT NOT NULL,
        text TEXT NOT NULL,
        embedding TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    db.prepare(`
      INSERT INTO chunks (id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "c2",
      "memory/2026-04-05.md",
      "memory",
      1,
      6,
      "h2",
      "m1",
      "# 今日记录\n\n- 我爱吃牛排\n- 今天继续推进插件排查",
      "[]",
      Date.now()
    );
  } finally {
    db.close();
  }

  try {
    const messages = await readIndexedSessionMessages(agentId, { fileLimit: 5 });
    assert.deepEqual(messages, []);
  } finally {
    await fs.unlink(dbPath).catch(() => {});
  }
});
