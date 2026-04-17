import test from "node:test";
import assert from "node:assert/strict";

import cases from "../evals/openclaw-guarded-live-ab-cases.js";

test("guarded live A/B suite keeps a narrow four-case shape with balanced activation intent", () => {
  assert.equal(cases.length, 4);
  assert.equal(cases.filter((item) => item.expectGuardedApplied === true).length, 2);
  assert.equal(cases.filter((item) => item.expectGuardedApplied === false).length, 2);
});

test("guarded live A/B cases use unique ids and multi-turn user-only transcripts", () => {
  const ids = cases.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of cases) {
    assert.ok(Array.isArray(item.turns));
    assert.ok(item.turns.length >= 3);
    assert.ok(item.turns.every((turn) => typeof turn === "string" && turn.trim().length > 0));
  }
});

test("guarded live A/B cases define explicit expectations", () => {
  for (const item of cases) {
    assert.equal(typeof item.description, "string");
    assert.ok(item.description.trim().length > 0);
    assert.ok(Array.isArray(item.expectedAll) || Array.isArray(item.expectedAny));
    assert.ok(Array.isArray(item.forbiddenAny));
  }
});
