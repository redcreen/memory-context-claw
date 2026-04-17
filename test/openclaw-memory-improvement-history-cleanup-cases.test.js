import test from "node:test";
import assert from "node:assert/strict";

import cases from "../evals/openclaw-memory-improvement-history-cleanup-cases.js";

test("history cleanup suite keeps only the two deferred Chinese editor-history cases", () => {
  assert.deepEqual(
    cases.map((item) => item.id),
    ["ab100-zh-history-editor-2", "ab100-zh-history-editor-4"]
  );
  assert.ok(cases.every((item) => item.category === "ab-zh-history"));
  assert.ok(cases.every((item) => item.compareLegacy === true));
  assert.ok(cases.every((item) => item.attributionKind === "history"));
  assert.ok(cases.every((item) => Array.isArray(item.expectedAny) && item.expectedAny.includes("Vim")));
  assert.ok(cases.every((item) => Array.isArray(item.forbiddenAny) && item.forbiddenAny.includes("Zed")));
});
