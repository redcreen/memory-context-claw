import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssemblyResult,
  enforcePathDiversity,
  trimMessagesToBudget
} from "../src/assembly.js";

test("trimMessagesToBudget preserves most recent messages first", () => {
  const messages = [
    { role: "user", content: "old short", timestamp: 1 },
    { role: "assistant", content: "older reply", timestamp: 2 },
    { role: "user", content: "recent question with a little more text", timestamp: 3 },
    { role: "assistant", content: "recent answer with a little more text", timestamp: 4 }
  ];

  const trimmed = trimMessagesToBudget(messages, 4, 2);
  assert.ok(trimmed.length >= 2);
  assert.equal(trimmed.at(-2).timestamp, 3);
  assert.equal(trimmed.at(-1).timestamp, 4);
});

test("buildAssemblyResult injects selected memory snippets into systemPromptAddition", () => {
  const result = buildAssemblyResult({
    messages: [
      { role: "user", content: "Lossless 和长期记忆有什么区别", timestamp: 1 },
      { role: "assistant", content: "我来解释。", timestamp: 2 }
    ],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "../../Project/长记忆/openclaw-memory-vs-lossless.md",
        pathKind: "workspaceDoc",
        startLine: 1,
        endLine: 20,
        weightedScore: 0.88,
        finalScore: 0.91,
        snippet: "OpenClaw 内置长期记忆负责长期保存和检索，Lossless 更偏向上下文编排。"
      }
    ]
  });

  assert.match(result.systemPromptAddition, /Recalled context:/);
  assert.match(result.systemPromptAddition, /Lossless 更偏向上下文编排/);
  assert.equal(result.messages.length, 2);
  assert.equal(result.selectedCandidates.length, 1);
});

test("buildAssemblyResult adds guardrail instruction for ambiguous identity values", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "我的身份证生日是什么？", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "memory/2026-04-05.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.2,
        finalScore: 1.2,
        snippet: "身份证生日信息待确认，这条信息暂不作为已确认身份信息使用"
      }
    ]
  });

  assert.match(result.systemPromptAddition, /must not quote, restate, paraphrase, or infer/i);
  assert.match(result.systemPromptAddition, /pending confirmation/i);
});

test("buildAssemblyResult adds stable fact override instruction for direct fact cards", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "我爱吃什么？", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "MEMORY.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.1,
        finalScore: 1.1,
        snippet: "你爱吃牛排"
      }
    ]
  });

  assert.match(result.systemPromptAddition, /latest confirmed fact/i);
  assert.match(result.systemPromptAddition, /older conflicting conversation messages/i);
});

test("enforcePathDiversity limits repeated chunks from the same file", () => {
  const selected = enforcePathDiversity(
    [
      { path: "MEMORY.md", finalScore: 0.9 },
      { path: "../../Project/长记忆/MEMORY.md", canonicalPath: "MEMORY.md", finalScore: 0.8 },
      { path: "memory/2026-04-04.md", finalScore: 0.7 }
    ],
    3,
    1
  );

  assert.deepEqual(
    selected.map((item) => item.path),
    ["MEMORY.md", "memory/2026-04-04.md"]
  );
});
