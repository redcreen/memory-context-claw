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
        path: "workspace/notes/openclaw-memory-vs-lossless.md",
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

test("buildAssemblyResult filters session noise for stable doc intents when card artifacts exist", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "memorySearch.provider 是做什么的", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "configuration.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.03,
        finalScore: 1.03,
        snippet: "memorySearch.provider 决定长期记忆检索使用哪个 embedding / memory_search provider，不影响主聊天模型。"
      },
      {
        path: "sessions/live-session.jsonl",
        pathKind: "sessionMemory",
        startLine: 301,
        endLine: 304,
        weightedScore: 0.66,
        finalScore: 0.66,
        snippet: "Assistant: memorySearch.provider 是做什么的？它决定长期记忆检索使用哪个 embedding / memory_search provider。"
      }
    ]
  });

  assert.equal(result.selectedCandidates.length, 1);
  assert.equal(result.selectedCandidates[0].path, "configuration.md");
  assert.doesNotMatch(result.systemPromptAddition, /sessions\/live-session\.jsonl/);
});

test("buildAssemblyResult keeps only workspace-structure supporting docs for directory-rule queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "长期记忆目录规则是什么", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "README.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.01,
        finalScore: 1.01,
        snippet: "项目内置 workspace 建议是：workspace/MEMORY.md 放长期规则，workspace/memory/ 放 daily memory，workspace/notes/ 放背景笔记。"
      },
      {
        path: "formal-memory-policy.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.96,
        finalScore: 0.96,
        snippet: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。"
      },
      {
        path: "MEMORY.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.81,
        finalScore: 0.81,
        snippet: "OpenViking 是主要长期记忆检索补充工具，用于查询个人信息、偏好、历史片段等。"
      },
      {
        path: "configuration.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.52,
        finalScore: 0.52,
        snippet: "memorySearch.provider 决定长期记忆检索使用哪个 embedding / memory_search provider，不影响主聊天模型。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["README.md"]
  );
});

test("buildAssemblyResult keeps only config-supporting docs for config queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "unified-memory-core 这个插件的配置应该怎么写", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "configuration.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.21,
        finalScore: 1.21,
        snippet: "unified-memory-core 的最小配置是：把它挂到 contextEngine，并在 entries 里 enabled: true。"
      },
      {
        path: "README.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.65,
        finalScore: 0.65,
        snippet: "workspace/notes 里只有带明确总结和适用场景、并且表达稳定概念或项目分工的 notes，才适合进入 stable card。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["configuration.md"]
  );
});

test("buildAssemblyResult keeps only formal rule docs for MEMORY scope queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "MEMORY.md 应该放什么内容", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "formal-memory-policy.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.06,
        finalScore: 1.06,
        snippet: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。"
      },
      {
        path: "MEMORY.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.64,
        finalScore: 0.64,
        snippet: "OpenViking 是主要长期记忆检索补充工具，用于查询个人信息、偏好、历史片段等。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["formal-memory-policy.md"]
  );
});

test("buildAssemblyResult prefers a single stable fact card for short token lookups", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "牛排 刘超", timestamp: 1 }],
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
        weightedScore: 1.12,
        finalScore: 1.12,
        snippet: "你爱吃牛排"
      },
      {
        path: "configuration.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.66,
        finalScore: 0.66,
        snippet: "unified-memory-core 的最小配置是：把它挂到 contextEngine，并在 entries 里 enabled: true。"
      },
      {
        path: "formal-memory-policy.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.61,
        finalScore: 0.61,
        snippet: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["MEMORY.md"]
  );
});

test("buildAssemblyResult keeps only birthday-supporting cards for self birthday queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "我生日是什么时候", timestamp: 1 }],
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
        weightedScore: 1.14,
        finalScore: 1.14,
        snippet: "你的生日是1983-02-06，农历生日是腊月二十四"
      },
      {
        path: "MEMORY.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.98,
        finalScore: 0.98,
        snippet: "你的实际出生年份是1983；身份证登记生日年份是1982，这是历史登记错误，但证件信息客观如此。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["memory/2026-04-05.md"]
  );
});

test("buildAssemblyResult keeps only daughter-supporting cards for daughter profile queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "我女儿叫什么，生日是哪天，现在几年级", timestamp: 1 }],
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
        weightedScore: 1.154,
        finalScore: 1.154,
        snippet: "你女儿叫刘子妍，生日是2014-12-29，现在上五年级"
      },
      {
        path: "MEMORY.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.022,
        finalScore: 1.022,
        snippet: "你的实际出生年份是1983；身份证登记生日年份是1982，这是历史登记错误，但证件信息客观如此。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["memory/2026-04-05.md"]
  );
});

test("buildAssemblyResult keeps family cards ahead of identity-correction cards for children queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "我的孩子情况是什么", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 2,
    candidates: [
      {
        path: "MEMORY.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.05,
        finalScore: 1.05,
        snippet: "你的实际出生年份是1983；身份证登记生日年份是1982，这是历史登记错误，但证件信息客观如此。"
      },
      {
        path: "memory/2026-04-05.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.02,
        finalScore: 1.02,
        snippet: "你女儿叫刘子妍，生日是2014-12-29，现在上五年级"
      },
      {
        path: "memory/2026-04-05.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 1.01,
        finalScore: 1.01,
        snippet: "你儿子叫刘子暄，生日是2007-07-25，现在上高三"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["memory/2026-04-05.md", "memory/2026-04-05.md"]
  );
  assert.ok(result.selectedCandidates.every((item) => !/身份证登记生日年份/.test(item.snippet)));
});

test("buildAssemblyResult keeps only project-positioning supporting docs for project queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "这个项目主要解决什么问题", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "README.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.95,
        finalScore: 0.95,
        snippet: "这是一个面向 OpenClaw 的 context engine 插件，负责把长期记忆更稳定地变成当前轮可用的上下文。"
      },
      {
        path: "workspace/notes/openclaw-memory-vs-lossless.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.74,
        finalScore: 0.74,
        snippet: "长期记忆负责存和找；Lossless / context engine 负责把当前这一轮最该看的内容更好地送进模型。"
      },
      {
        path: "MEMORY.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.78,
        finalScore: 0.78,
        snippet: "OpenViking 是主要长期记忆检索补充工具，用于查询个人信息、偏好、历史片段等。"
      },
      {
        path: "formal-memory-policy.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.47,
        finalScore: 0.47,
        snippet: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["README.md"]
  );
});

test("buildAssemblyResult keeps only lossless-supporting docs for lossless queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "为什么已经有长期记忆了，还需要 Lossless", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "workspace/notes/openclaw-memory-vs-lossless.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.74,
        finalScore: 0.74,
        snippet: "长期记忆负责存和找；Lossless / context engine 负责把当前这一轮最该看的内容更好地送进模型。"
      },
      {
        path: "README.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.66,
        finalScore: 0.66,
        snippet: "这是一个面向 OpenClaw 的 context engine 插件，负责把长期记忆更稳定地变成当前轮可用的上下文。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["workspace/notes/openclaw-memory-vs-lossless.md"]
  );
});

test("buildAssemblyResult keeps only project-navigation supporting docs for roadmap queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "项目路线图应该看哪个文档", timestamp: 1 }],
    tokenBudget: 2048,
    memoryBudgetRatio: 0.35,
    recentMessageCount: 8,
    maxSelectedChunks: 4,
    maxChunksPerPath: 1,
    candidates: [
      {
        path: "project-roadmap.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.96,
        finalScore: 0.96,
        snippet: "项目总 roadmap 看 docs/workstreams/project/roadmap.md（原 project-roadmap.md）；memory search 专项 roadmap 看 docs/workstreams/memory-search/roadmap.md（原 memory-search-roadmap.md）。"
      },
      {
        path: "formal-memory-policy.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.66,
        finalScore: 0.66,
        snippet: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。"
      },
      {
        path: "sessions/live-session.jsonl",
        pathKind: "sessionMemory",
        startLine: 26,
        endLine: 26,
        weightedScore: 0.67,
        finalScore: 0.67,
        snippet: "项目路线图应该看哪个文档？"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["project-roadmap.md"]
  );
});

test("buildAssemblyResult keeps only preference-supporting cards for preference queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "我爱吃什么", timestamp: 1 }],
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
        weightedScore: 0.94,
        finalScore: 0.94,
        snippet: "你爱吃牛排"
      },
      {
        path: "configuration.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.36,
        finalScore: 0.36,
        snippet: "unified-memory-core 的最小配置是：把它挂到 contextEngine，并在 entries 里 enabled: true。"
      },
      {
        path: "formal-memory-policy.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.31,
        finalScore: 0.31,
        snippet: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["MEMORY.md"]
  );
});

test("buildAssemblyResult keeps only identity-supporting cards for identity queries", () => {
  const result = buildAssemblyResult({
    messages: [{ role: "user", content: "你怎么称呼我", timestamp: 1 }],
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
        weightedScore: 0.97,
        finalScore: 0.97,
        snippet: "你叫刘超，我平时记你是超哥"
      },
      {
        path: "configuration.md",
        pathKind: "cardArtifact",
        startLine: 1,
        endLine: 1,
        weightedScore: 0.49,
        finalScore: 0.49,
        snippet: "unified-memory-core 的最小配置是：把它挂到 contextEngine，并在 entries 里 enabled: true。"
      }
    ]
  });

  assert.deepEqual(
    result.selectedCandidates.map((item) => item.path),
    ["MEMORY.md"]
  );
});

test("enforcePathDiversity limits repeated chunks from the same file", () => {
  const selected = enforcePathDiversity(
    [
      { path: "MEMORY.md", finalScore: 0.9 },
      { path: "workspace/MEMORY.md", canonicalPath: "MEMORY.md", finalScore: 0.8 },
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
