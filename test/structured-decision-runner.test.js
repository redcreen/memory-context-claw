import test from "node:test";
import assert from "node:assert/strict";

import { runStructuredDecision } from "../src/structured-decision-runner.js";

function createSubagentRuntime(assistantPayload) {
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
              content: JSON.stringify(assistantPayload)
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

test("runStructuredDecision prefers inline runner in auto mode", async () => {
  const result = await runStructuredDecision({
    runtime: {},
    sessionKey: "agent:main:test-inline",
    prompt: "ignored",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["ok"],
      properties: {
        ok: { type: "boolean" }
      }
    },
    config: {
      transport: "auto"
    },
    normalizePayload: (payload) => payload,
    purpose: "inline-test",
    query: "test",
    overrideRunner: async () => ({ ok: true })
  });

  assert.equal(result.transport, "inline");
  assert.deepEqual(result.payload, { ok: true });
});

test("runStructuredDecision supports runtime_subagent transport", async () => {
  const result = await runStructuredDecision({
    runtime: createSubagentRuntime({
      value: 42
    }),
    sessionKey: "agent:main:test-subagent",
    prompt: "ignored",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["value"],
      properties: {
        value: { type: "number" }
      }
    },
    config: {
      transport: "runtime_subagent",
      timeoutMs: 5000,
      cleanupSession: true
    },
    parser: (text) => JSON.parse(text),
    normalizePayload: (payload) => payload,
    purpose: "subagent-test"
  });

  assert.equal(result.transport, "runtime_subagent");
  assert.deepEqual(result.payload, { value: 42 });
});
