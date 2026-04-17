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

test("projectRuntimeMessagesToDialogueTurns keeps only user/assistant messages and respects maxTurns", () => {
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
    ["t1:assistant:a1", "t2:user:u2", "t3:assistant:a2"]
  );
});

test("assemble records runtime shadow telemetry even when retrieval returns no candidates", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-shadow-"));
  const engine = new ContextAssemblyEngine({
    runtime: createRuntimeWithShadowDecision({
      relation: "switch",
      confidence: 0.94,
      evict_turn_ids: ["t1", "t2"],
      pin_turn_ids: ["t1"],
      archive_summary: "Keep the user preference as a pin.",
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
        outputDir
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
        outputDir
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
