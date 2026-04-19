import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { ContextAssemblyEngine } from "../src/engine.js";
import {
  projectRuntimeMessagesToDialogueTurns,
  resolveDialogueWorkingSetShadowOutputDir
} from "../src/dialogue-working-set-runtime-shadow.js";

function createRuntimeWithShadowDecision(payload) {
  const sessions = new Map();
  const runs = new Map();

  return {
    subagent: {
      async run({ sessionKey }) {
        const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        sessions.set(sessionKey, {
          messages: [
            {
              role: "assistant",
              content: JSON.stringify(payload)
            }
          ]
        });
        runs.set(runId, { sessionKey });
        return { runId };
      },
      async waitForRun({ runId }) {
        return runs.has(runId)
          ? { status: "ok" }
          : { status: "error", error: "missing run" };
      },
      async getSessionMessages({ sessionKey }) {
        return sessions.get(sessionKey) || { messages: [] };
      },
      async deleteSession({ sessionKey }) {
        sessions.delete(sessionKey);
      }
    }
  };
}

async function listExportEvents(outputDir) {
  const exportsDir = path.join(outputDir, "exports");
  const files = await fs.readdir(exportsDir);
  const events = [];
  for (const fileName of files.filter((item) => item.endsWith(".json"))) {
    const fullPath = path.join(exportsDir, fileName);
    events.push(JSON.parse(await fs.readFile(fullPath, "utf8")));
  }
  return events;
}

test("projectRuntimeMessagesToDialogueTurns keeps only user/assistant messages and treats maxTurns as dialogue rounds", () => {
  const turns = projectRuntimeMessagesToDialogueTurns(
    [
      { role: "system", content: "system" },
      { role: "user", content: "u1" },
      { role: "assistant", content: "a1" },
      { role: "tool", content: "tool" },
      { role: "user", content: "u2" },
      { role: "assistant", content: "a2" }
    ],
    { maxTurns: 3, maxCharsPerTurn: 20 }
  );

  assert.deepEqual(
    turns.map((item) => `${item.id}:${item.role}:${item.content}`),
    ["t1:user:u1", "t2:assistant:a1", "t3:user:u2", "t4:assistant:a2"]
  );
});

test("projectRuntimeMessagesToDialogueTurns keeps recent dialogue rounds without role-specific truncation", () => {
  const turns = projectRuntimeMessagesToDialogueTurns(
    [
      { role: "user", content: "u1 ".repeat(80) },
      { role: "assistant", content: "a1 ".repeat(80) },
      { role: "user", content: "u2 ".repeat(80) },
      { role: "assistant", content: "a2 ".repeat(80) },
      { role: "user", content: "u3 ".repeat(80) },
      { role: "assistant", content: "a3 ".repeat(80) },
      { role: "user", content: "u4 ".repeat(80) },
      { role: "assistant", content: "a4 ".repeat(80) }
    ],
    { maxTurns: 4, maxCharsPerTurn: 400 }
  );

  assert.ok(turns.every((turn) => turn.content.length > 200));
});

test("assemble skips guarded shadow decision on explicit same-topic continue markers", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-guarded-skip-"));
  let runnerCalls = 0;
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        outputDir
      },
      dialogueWorkingSetGuarded: {
        enabled: true
      }
    },
    structuredDecisionRunner: async () => {
      runnerCalls += 1;
      return {
        relation: "switch",
        confidence: 0.9,
        evict_turn_ids: ["t1", "t2"],
        pin_turn_ids: [],
        archive_summary: "",
        reasoning_summary: "unused"
      };
    },
    retrievalFn: async () => []
  });

  await engine.assemble({
    messages: [
      { role: "user", content: "旧话题设定。" },
      { role: "assistant", content: "记住了。" },
      { role: "user", content: "继续同一个话题：再补充一个细节。" }
    ],
    tokenBudget: 4096,
    sessionKey: "agent:main:test-guarded-skip"
  });

  assert.equal(runnerCalls, 0);
  const events = await listExportEvents(resolveDialogueWorkingSetShadowOutputDir(outputDir));
  assert.equal(events.length, 1);
  assert.equal(events[0].status, "skipped");
  assert.equal(events[0].reason, "explicit_continue_marker");
});

test("assemble uses heuristic continue-after-switch path after an explicit topic switch", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-guarded-heuristic-continue-"));
  let runnerCalls = 0;
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        outputDir
      },
      dialogueWorkingSetGuarded: {
        enabled: true
      }
    },
    structuredDecisionRunner: async () => {
      runnerCalls += 1;
      throw new Error("heuristic continue-after-switch should not call decision runner");
    },
    retrievalFn: async () => []
  });

  const result = await engine.assemble({
    messages: [
      { role: "user", content: "记一下：当前编辑器是 Zed。" },
      { role: "assistant", content: "记住了。" },
      { role: "user", content: "现在切到完全不同的话题。帮我想一个京都三晚行程。" },
      { role: "assistant", content: "可以先住四条乌丸。" },
      { role: "user", content: "继续旅行话题：如果第一晚住四条乌丸，第二晚住哪里更合适？" }
    ],
    tokenBudget: 4096,
    sessionKey: "agent:main:test-guarded-heuristic-continue"
  });

  assert.equal(runnerCalls, 0);
  assert.ok(result.messages.length >= 2);
  const events = await listExportEvents(resolveDialogueWorkingSetShadowOutputDir(outputDir));
  assert.equal(events.length, 1);
  assert.equal(events[0].status, "captured");
  assert.equal(events[0].decision_transport, "heuristic_continue_after_switch");
  assert.equal(events[0].decision.relation, "continue");
});

test("assemble uses heuristic switch path for explicit topic-switch markers", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-guarded-heuristic-switch-"));
  let runnerCalls = 0;
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        outputDir
      },
      dialogueWorkingSetGuarded: {
        enabled: true
      }
    },
    structuredDecisionRunner: async () => {
      runnerCalls += 1;
      throw new Error("explicit switch should not call decision runner");
    },
    retrievalFn: async () => []
  });

  const result = await engine.assemble({
    messages: [
      { role: "user", content: "记一下：当前编辑器是 Zed。" },
      { role: "assistant", content: "记住了。" },
      { role: "user", content: "现在切到完全不同的话题。帮我想一个京都三晚行程。" }
    ],
    tokenBudget: 4096,
    sessionKey: "agent:main:test-guarded-heuristic-switch"
  });

  assert.equal(runnerCalls, 0);
  assert.ok(result.messages.length >= 1);
  const events = await listExportEvents(resolveDialogueWorkingSetShadowOutputDir(outputDir));
  assert.equal(events.length, 1);
  assert.equal(events[0].status, "captured");
  assert.equal(events[0].decision_transport, "heuristic_switch");
  assert.equal(events[0].decision.relation, "switch");
  assert.match(String(events[0].guarded.reason || ""), /guarded_candidate|no_net_token_gain/);
});

test("assemble skips retrieval loading on explicit switch fast path", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-guarded-switch-skip-retrieval-"));
  let retrievalCalls = 0;
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        outputDir
      },
      dialogueWorkingSetGuarded: {
        enabled: true
      }
    },
    structuredDecisionRunner: async () => {
      throw new Error("explicit switch should not call decision runner");
    },
    retrievalFn: async () => {
      retrievalCalls += 1;
      return [{
        path: "memory/MEMORY.md",
        pathKind: "memoryFile",
        startLine: 1,
        endLine: 1,
        snippet: "should not be used",
        weightedScore: 1
      }];
    }
  });

  await engine.assemble({
    messages: [
      { role: "user", content: "记一下：当前编辑器是 Zed。" },
      { role: "assistant", content: "记住了。" },
      { role: "user", content: "现在切到完全不同的话题。帮我想一个京都三晚行程。" }
    ],
    tokenBudget: 4096,
    sessionKey: "agent:main:test-guarded-switch-skip-retrieval"
  });

  assert.equal(retrievalCalls, 0);
});

test("assemble records runtime shadow telemetry even when retrieval returns no candidates", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-shadow-"));
  const engine = new ContextAssemblyEngine({
    runtime: createRuntimeWithShadowDecision({
      relation: "switch",
      confidence: 0.94,
      evict_turn_ids: ["t1", "t2"],
      pin_turn_ids: [],
      archive_summary: "",
      reasoning_summary: "The active topic switched."
    }),
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        outputDir,
        transport: "runtime_subagent"
      }
    },
    retrievalFn: async () => []
  });

  const result = await engine.assemble({
    messages: [
      { role: "user", content: "以后默认中文。" },
      { role: "assistant", content: "记住了。" },
      { role: "user", content: "现在切到新任务：写 shadow 报告。" }
    ],
    tokenBudget: 4096,
    sessionKey: "agent:main:test-shadow"
  });

  assert.equal(result.systemPromptAddition, "");
  const events = await listExportEvents(outputDir);
  assert.equal(events.length, 1);
  assert.equal(events[0].status, "captured");
  assert.equal(events[0].decision.relation, "switch");
  assert.ok(events[0].snapshot.applied.reductionRatio > 0);
});

test("assemble keeps prompt path stable and writes a skipped shadow event when subagent runtime is unavailable", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-shadow-skip-"));
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        outputDir,
        transport: "runtime_subagent"
      }
    },
    retrievalFn: async () => []
  });

  const result = await engine.assemble({
    messages: [
      { role: "user", content: "以后默认中文。" },
      { role: "assistant", content: "记住了。" },
      { role: "user", content: "当前任务是什么？" }
    ],
    tokenBudget: 4096,
    sessionKey: "agent:main:test-shadow-skip"
  });

  assert.equal(result.systemPromptAddition, "");
  const events = await listExportEvents(resolveDialogueWorkingSetShadowOutputDir(outputDir));
  assert.equal(events.length, 1);
  assert.equal(events[0].status, "skipped");
  assert.equal(events[0].reason, "subagent_unavailable");
});

test("assemble captures shadow telemetry through a plugin-owned decision runner without runtime.subagent", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-shadow-inline-"));
  let runnerCalls = 0;
  const engine = new ContextAssemblyEngine({
    runtime: {},
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        outputDir
      }
    },
    structuredDecisionRunner: async ({ query, input }) => {
      runnerCalls += 1;
      assert.match(query, /当前任务/);
      assert.equal(Array.isArray(input?.turns), true);
      return {
        relation: "switch",
        confidence: 0.92,
        evict_turn_ids: ["t1", "t2"],
        pin_turn_ids: [],
        archive_summary: "",
        reasoning_summary: "The active topic switched."
      };
    },
    retrievalFn: async () => []
  });

  const result = await engine.assemble({
    messages: [
      { role: "user", content: "以后默认中文。" },
      { role: "assistant", content: "记住了。" },
      { role: "user", content: "当前任务是什么？" }
    ],
    tokenBudget: 4096,
    sessionKey: "agent:main:test-shadow-inline"
  });

  assert.equal(result.systemPromptAddition, "");
  assert.equal(runnerCalls, 1);
  const events = await listExportEvents(resolveDialogueWorkingSetShadowOutputDir(outputDir));
  assert.equal(events.length, 1);
  assert.equal(events[0].status, "captured");
  assert.equal(events[0].decision.relation, "switch");
});

test("assemble applies guarded working-set pruning only on opt-in switch cases", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-guarded-"));
  const engine = new ContextAssemblyEngine({
    runtime: createRuntimeWithShadowDecision({
      relation: "switch",
      confidence: 0.95,
      evict_turn_ids: ["t1", "t2"],
      pin_turn_ids: [],
      archive_summary: "",
      reasoning_summary: "The active topic switched."
    }),
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        outputDir,
        transport: "runtime_subagent"
      },
      dialogueWorkingSetGuarded: {
        enabled: true
      }
    },
    retrievalFn: async () => []
  });

  const result = await engine.assemble({
    messages: [
      { role: "user", content: "旧话题先放这里。" },
      { role: "assistant", content: "收到。" },
      { role: "user", content: "现在切到新任务：写 shadow 报告。" }
    ],
    tokenBudget: 4096,
    sessionKey: "agent:main:test-guarded"
  });

  assert.equal(result.messages.length, 1);
  assert.equal(result.systemPromptAddition, "");

  const events = await listExportEvents(outputDir);
  assert.equal(events.length, 1);
  assert.equal(events[0].guarded.applied, true);
  assert.equal(events[0].guarded.reason, "guarded_candidate");
  assert.equal(events[0].scorecard.guardedApplied, true);
});

test("assemble does not apply guarded pruning for continue relations", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-guarded-continue-"));
  const engine = new ContextAssemblyEngine({
    runtime: createRuntimeWithShadowDecision({
      relation: "continue",
      confidence: 0.91,
      evict_turn_ids: [],
      pin_turn_ids: [],
      archive_summary: "",
      reasoning_summary: "The active topic continues."
    }),
    logger: { warn() {}, info() {} },
    pluginConfig: {
      enabled: true,
      openclawAdapter: {
        enabled: false,
        governedExports: {
          enabled: false
        }
      },
      dialogueWorkingSetShadow: {
        enabled: true,
        outputDir,
        transport: "runtime_subagent"
      },
      dialogueWorkingSetGuarded: {
        enabled: true
      }
    },
    retrievalFn: async () => []
  });

  const result = await engine.assemble({
    messages: [
      { role: "user", content: "继续帮我整理发布说明。" },
      { role: "assistant", content: "好，我继续整理。" },
      { role: "user", content: "把风险和回滚一并写上。" }
    ],
    tokenBudget: 4096,
    sessionKey: "agent:main:test-guarded-continue"
  });

  assert.equal(result.messages.length, 3);
  assert.equal(result.systemPromptAddition, "");

  const events = await listExportEvents(outputDir);
  assert.equal(events.length, 1);
  assert.equal(events[0].guarded.applied, false);
  assert.equal(events[0].guarded.reason, "relation_not_allowed");
});
