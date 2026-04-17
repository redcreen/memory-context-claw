import test from "node:test";
import assert from "node:assert/strict";

import cases from "../evals/openclaw-context-minor-gc-live-cases.js";

test("context minor gc live cases cover the harder six-case matrix", () => {
  assert.equal(cases.length, 6);
  assert.equal(new Set(cases.map((item) => item.id)).size, cases.length);
});

test("context minor gc live cases keep multi-turn transcripts and explicit answer expectations", () => {
  for (const item of cases) {
    assert.ok(typeof item.description === "string" && item.description.trim().length > 0);
    assert.ok(Array.isArray(item.turns) && item.turns.length >= 3);
    assert.ok(item.turns.every((turn) => typeof turn === "string" && turn.trim().length > 0));
    assert.ok(Array.isArray(item.expectedRelations) && item.expectedRelations.length >= 1);
    assert.ok(Array.isArray(item.expectedAll) || Array.isArray(item.expectedAny));
    assert.ok(Array.isArray(item.forbiddenAny));
    assert.equal(typeof item.minRawReductionRatio, "number");
  }
});
