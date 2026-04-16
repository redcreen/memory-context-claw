import test from "node:test";
import assert from "node:assert/strict";

import cases from "../evals/openclaw-ordinary-conversation-memory-intent-ab-cases.js";

test("ordinary conversation realtime A/B suite defines exactly 40 focused cases", () => {
  assert.equal(cases.length, 40);
});

test("ordinary conversation realtime A/B suite keeps a 20/20 English-Chinese split", () => {
  const counts = cases.reduce((acc, item) => {
    acc[item.language] = (acc[item.language] || 0) + 1;
    return acc;
  }, {});
  assert.equal(counts.en, 20);
  assert.equal(counts.zh, 20);
});

test("ordinary conversation realtime A/B suite keeps balanced category coverage", () => {
  const counts = cases.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  assert.equal(counts.durable_rule, 8);
  assert.equal(counts.tool_routing_preference, 8);
  assert.equal(counts.user_profile_fact, 8);
  assert.equal(counts.session_constraint, 8);
  assert.equal(counts.one_off_instruction, 8);
});

test("ordinary conversation realtime A/B suite gives every case human-readable design and expectation text", () => {
  for (const item of cases) {
    assert.equal(typeof item.designQuestion, "string");
    assert.ok(item.designQuestion.trim().length > 0);
    assert.equal(typeof item.expectedResult, "string");
    assert.ok(item.expectedResult.trim().length > 0);
  }
});

test("ordinary conversation realtime A/B case ids are unique", () => {
  const ids = cases.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});
