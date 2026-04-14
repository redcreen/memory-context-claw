import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("memory intent replay cases cover durable, session, task-local, and no-memory boundaries", async () => {
  const casesPath = path.join(process.cwd(), "evals", "memory-intent-replay-cases.json");
  const parsed = JSON.parse(await fs.readFile(casesPath, "utf8"));

  assert.ok(Array.isArray(parsed));
  assert.ok(parsed.length >= 7);

  const byId = new Map(parsed.map((item) => [item.id, item]));
  const expectedIds = [
    "telegram-xiaohongshu-tool-routing",
    "telegram-oneoff-tool-instruction",
    "telegram-session-reply-style",
    "telegram-small-talk-no-memory",
    "telegram-user-profile-language-preference",
    "telegram-durable-reusable-workflow-rule",
    "telegram-session-tool-routing-project-local"
  ];

  for (const id of expectedIds) {
    assert.ok(byId.has(id), `missing replay case: ${id}`);
  }

  assert.equal(byId.get("telegram-xiaohongshu-tool-routing").expected.category, "tool_routing_preference");
  assert.equal(byId.get("telegram-oneoff-tool-instruction").expected.category, "task_instruction");
  assert.equal(byId.get("telegram-oneoff-tool-instruction").expected.should_write_memory, false);
  assert.equal(byId.get("telegram-session-reply-style").expected.durability, "session");
  assert.equal(byId.get("telegram-small-talk-no-memory").expected.category, "none");
  assert.equal(byId.get("telegram-user-profile-language-preference").expected.category, "user_profile_fact");
  assert.equal(byId.get("telegram-durable-reusable-workflow-rule").expected.category, "durable_rule");
  assert.equal(byId.get("telegram-session-tool-routing-project-local").expected.category, "session_constraint");

  const categories = new Set(parsed.map((item) => item.expected?.category));
  assert.deepEqual(
    [...categories].sort(),
    [
      "durable_rule",
      "none",
      "session_constraint",
      "task_instruction",
      "tool_routing_preference",
      "user_profile_fact"
    ]
  );

  for (const item of parsed) {
    assert.equal(item.model, "gpt-5.4");
    assert.ok(Array.isArray(item.transcript));
    assert.equal(item.transcript.at(-1)?.role, "user");
  }
});
