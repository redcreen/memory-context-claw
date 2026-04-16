import test from "node:test";
import assert from "node:assert/strict";

import cases from "../evals/openclaw-ordinary-conversation-memory-intent-ab-cases.js";

test("ordinary conversation realtime A/B suite defines exactly 10 focused cases", () => {
  assert.equal(cases.length, 10);
});

test("ordinary conversation realtime A/B suite keeps a 5/5 English-Chinese split", () => {
  const counts = cases.reduce((acc, item) => {
    acc[item.language] = (acc[item.language] || 0) + 1;
    return acc;
  }, {});
  assert.equal(counts.en, 5);
  assert.equal(counts.zh, 5);
});

test("ordinary conversation realtime A/B suite covers durable, profile, and negative ordinary-conversation paths", () => {
  const categories = new Set(cases.map((item) => item.category));
  assert.ok(categories.has("durable_rule"));
  assert.ok(categories.has("tool_routing_preference"));
  assert.ok(categories.has("user_profile_fact"));
  assert.ok(categories.has("session_constraint"));
  assert.ok(categories.has("one_off_instruction"));
});

test("ordinary conversation realtime A/B case ids are unique", () => {
  const ids = cases.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});
