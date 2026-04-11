import test from "node:test";
import assert from "node:assert/strict";
import { ContextAssemblyEngine } from "../src/engine.js";

function makeCandidate({
  id,
  path,
  kind = "workspaceDoc",
  retrievalScore = 0.7,
  snippet = "snippet",
  startLine = 1,
  endLine = 10
}) {
  return {
    id,
    path,
    kind,
    retrievalScore,
    snippet,
    startLine,
    endLine,
    updatedAt: Date.now()
  };
}

test("assemble applies llm rerank when enabled and candidates are close", async () => {
  let rerankCalls = 0;
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {} },
    pluginConfig: {
      enabled: true,
      maxSelectedChunks: 2,
      llmRerank: {
        enabled: true,
        topN: 4,
        minScoreDeltaToSkip: 0.2
      }
    },
    retrievalFn: async () => [
      makeCandidate({
        id: "cand-1",
        path: "workspace/notes/openclaw-memory-vs-lossless.md",
        retrievalScore: 0.79
      }),
      makeCandidate({
        id: "cand-2",
        path: "workspace/MEMORY.md",
        kind: "memoryFile",
        retrievalScore: 0.78
      })
    ],
    rerankFn: async ({ candidates }) => {
      rerankCalls += 1;
      assert.equal(candidates.length, 2);
      return [{ id: "cand-2", score: 0.95, reason: "better match" }];
    }
  });

  const result = await engine.assemble({
    prompt: "Lossless 插件 和 长期记忆 的区别",
    messages: [{ role: "user", content: "Lossless 插件 和 长期记忆 的区别" }],
    tokenBudget: 4096,
    sessionKey: "agent:main:test"
  });

  assert.equal(rerankCalls, 1);
  assert.match(result.systemPromptAddition, /Path: workspace\/MEMORY\.md/);
  assert.ok(
    result.selectedCandidates.findIndex((item) => item.path.endsWith("/MEMORY.md")) === 0
  );
});

test("assemble skips llm rerank when heuristic winner is clearly ahead", async () => {
  let rerankCalls = 0;
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {} },
    pluginConfig: {
      enabled: true,
      maxSelectedChunks: 2,
      llmRerank: {
        enabled: true,
        topN: 4,
        minScoreDeltaToSkip: 0.05
      }
    },
    retrievalFn: async () => [
      makeCandidate({
        id: "cand-1",
        path: "workspace/MEMORY.md",
        kind: "memoryFile",
        retrievalScore: 0.98
      }),
      makeCandidate({
        id: "cand-2",
        path: "workspace/notes/other.md",
        retrievalScore: 0.4
      })
    ],
    rerankFn: async () => {
      rerankCalls += 1;
      return [];
    }
  });

  await engine.assemble({
    prompt: "MEMORY.md 的使用原则",
    messages: [{ role: "user", content: "MEMORY.md 的使用原则" }],
    tokenBudget: 4096,
    sessionKey: "agent:main:test"
  });

  assert.equal(rerankCalls, 0);
});

test("assemble bypasses retrieval for internal rerank sessions", async () => {
  let retrievalCalls = 0;
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {} },
    pluginConfig: {
      enabled: true
    },
    retrievalFn: async () => {
      retrievalCalls += 1;
      return [];
    }
  });

  const result = await engine.assemble({
    prompt: "ignored",
    messages: [{ role: "user", content: "ignored" }],
    tokenBudget: 4096,
    sessionKey: "agent:main:test:context-rerank:123"
  });

  assert.equal(retrievalCalls, 0);
  assert.equal(result.systemPromptAddition, "");
});

test("assemble schedules async distillation when nearing compaction threshold", async () => {
  const scheduled = [];
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      memoryDistillation: {
        enabled: true,
        triggerBeforeCompaction: true,
        preCompactTriggerRatio: 0.5,
        compactFallback: true,
        cooldownMs: 0
      }
    },
    retrievalFn: async () => []
  });

  engine.distillationManager.schedule = (params) => {
    scheduled.push(params);
  };

  await engine.assemble({
    prompt: "测试",
    messages: [
      { role: "user", content: "a".repeat(2000) },
      { role: "assistant", content: "b".repeat(2000) }
    ],
    tokenBudget: 1000,
    sessionKey: "agent:main:test"
  });

  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].stage, "pre-compact-threshold");
});

test("compact schedules async fallback distillation without blocking compaction", async () => {
  const scheduled = [];
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      memoryDistillation: {
        enabled: true,
        compactFallback: true,
        cooldownMs: 0
      }
    }
  });

  engine.distillationManager.schedule = (params) => {
    scheduled.push(params);
  };

  await engine.compact({
    sessionKey: "agent:main:test",
    messages: [{ role: "user", content: "hello world" }],
    tokenBudget: 1000
  });

  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].stage, "compact-fallback");
});
