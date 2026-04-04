import test from "node:test";
import assert from "node:assert/strict";
import { scoreCandidates } from "../src/scoring.js";

test("scoreCandidates prefers MEMORY.md over generic workspace docs when relevance is close", () => {
  const candidates = [
    {
      path: "MEMORY.md",
      startLine: 1,
      endLine: 20,
      score: 0.45,
      snippet: "## 一句话结论\n长期规则和偏好在这里。\n## 适用场景\n回答风格和协作方式。",
      source: "memory"
    },
    {
      path: "../../Project/长记忆/openclaw-memory-vs-lossless.md",
      startLine: 1,
      endLine: 20,
      score: 0.46,
      snippet: "这是一个普通专题文档，介绍 Memory 和 Lossless 的区别。",
      source: "memory"
    }
  ];

  const ranked = scoreCandidates(candidates, "我的长期偏好和规则是什么", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  });

  assert.equal(ranked[0].path, "MEMORY.md");
});

test("scoreCandidates boosts recent daily memory", () => {
  const recent = {
    path: "../../Project/长记忆/memory/2026-04-04.md",
    startLine: 1,
    endLine: 10,
    score: 0.38,
    snippet: "## 今日结论\n今天开始搭建长期记忆和 Workspace 索引。",
    source: "memory"
  };
  const old = {
    path: "../../Project/长记忆/memory/2026-01-01.md",
    startLine: 1,
    endLine: 10,
    score: 0.38,
    snippet: "## 今日结论\n很早之前的记录。",
    source: "memory"
  };

  const ranked = scoreCandidates([old, recent], "今天长期记忆做了什么", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-04T00:00:00Z"));

  assert.equal(ranked[0].path, recent.path);
});

test("scoreCandidates prefers config docs for config-intent prompts", () => {
  const candidates = [
    {
      path: "MEMORY.md",
      startLine: 1,
      endLine: 20,
      score: 0.46,
      snippet: "## 一句话结论\n长期规则和偏好在这里。\n## 关键信息\n长期偏好、固定工作流程。",
      source: "memory"
    },
    {
      path: "../../Project/长记忆/memory-context-claw-config.md",
      startLine: 1,
      endLine: 30,
      score: 0.43,
      snippet:
        "## 一句话结论\nmemory-context-claw 的主配置分成两层。\n## 最小配置\nplugins.entries[\"memory-context-claw\"]\ncontextEngine\n安装",
      source: "memory"
    }
  ];

  const ranked = scoreCandidates(candidates, "这个项目的配置应该怎么写", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  });

  assert.equal(ranked[0].path, "../../Project/长记忆/memory-context-claw-config.md");
});

test("scoreCandidates prefers recent session memory over workspace docs when relevance is close", () => {
  const candidates = [
    {
      path: "sessions/live-session.jsonl.reset.2026-04-04T15-10-22.499Z",
      startLine: 1,
      endLine: 1,
      score: 0.44,
      snippet: "今天我们已经完成 main agent 的 session memory 配置。",
      source: "sessions"
    },
    {
      path: "../../Project/长记忆/openclaw-memory-vs-lossless.md",
      startLine: 1,
      endLine: 20,
      score: 0.45,
      snippet: "这是一个普通专题文档，介绍 Memory 和 Lossless 的区别。",
      source: "memory"
    }
  ];

  const ranked = scoreCandidates(candidates, "今天我们把 session memory 做到哪一步了", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-04T16:00:00Z"));

  assert.equal(ranked[0].source, "sessions");
});

test("scoreCandidates still keeps MEMORY.md above session memory for stable preference prompts", () => {
  const candidates = [
    {
      path: "sessions/live-session.jsonl.reset.2026-04-04T15-10-22.499Z",
      startLine: 1,
      endLine: 1,
      score: 0.48,
      snippet: "今天我们讨论过回答要先给结论。",
      source: "sessions"
    },
    {
      path: "MEMORY.md",
      startLine: 1,
      endLine: 20,
      score: 0.46,
      snippet: "## 一句话结论\n我习惯先给结论，再展开细节。\n## 适用场景\n长期协作偏好。",
      source: "memory"
    }
  ];

  const ranked = scoreCandidates(candidates, "我的长期写作偏好是什么", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-04T16:00:00Z"));

  assert.equal(ranked[0].path, "MEMORY.md");
});
