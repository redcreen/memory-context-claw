import test from "node:test";
import assert from "node:assert/strict";

import cases from "../evals/codex-context-minor-gc-live-cases.js";

test("codex Context Minor GC live cases keep a compact four-case shape", () => {
  assert.equal(cases.length, 4);
});

test("codex Context Minor GC live cases use unique ids and explicit prompts", () => {
  const ids = new Set();
  for (const item of cases) {
    assert.ok(item.id);
    assert.ok(item.taskPrompt);
    assert.ok(Array.isArray(item.transcript));
    assert.ok(item.transcript.length >= 3);
    assert.equal(ids.has(item.id), false, `duplicate case id: ${item.id}`);
    ids.add(item.id);
  }
});

test("codex Context Minor GC live cases define explicit guarded expectations", () => {
  const guardedTrue = cases.filter((item) => item.expectedGuardedApplied === true).length;
  const guardedFalse = cases.filter((item) => item.expectedGuardedApplied === false).length;

  assert.ok(guardedTrue >= 2);
  assert.ok(guardedFalse >= 1);
});
