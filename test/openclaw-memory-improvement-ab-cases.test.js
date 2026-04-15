import test from "node:test";
import assert from "node:assert/strict";

import cases from "../evals/openclaw-memory-improvement-ab-cases.js";

function hasChinese(text = "") {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

test("memory improvement A/B suite defines exactly 100 live answer-level cases", () => {
  assert.equal(cases.length, 100);
  assert.ok(cases.every((item) => item.entrypoint === "agent"));
  assert.ok(cases.every((item) => item.compareLegacy === true));
});

test("memory improvement A/B suite keeps a 50/50 English and Chinese split", () => {
  const zh = cases.filter((item) => hasChinese(item.message));
  const en = cases.filter((item) => !hasChinese(item.message));
  assert.equal(zh.length, 50);
  assert.equal(en.length, 50);
});

test("memory improvement A/B suite spans bootstrap, retrieval, temporal, history, and negative cases", () => {
  const attributionKinds = new Set(cases.map((item) => item.attributionKind));
  assert.ok(attributionKinds.has("bootstrap"));
  assert.ok(attributionKinds.has("retrieval"));
  assert.ok(attributionKinds.has("temporal"));
  assert.ok(attributionKinds.has("history"));
  assert.ok(attributionKinds.has("negative"));
});

test("memory improvement A/B case ids are unique", () => {
  const ids = cases.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});
