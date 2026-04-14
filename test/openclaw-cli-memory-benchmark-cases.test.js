import test from "node:test";
import assert from "node:assert/strict";

import cases from "../evals/openclaw-cli-memory-benchmark-cases.js";

test("openclaw CLI memory benchmark defines at least 100 cases", () => {
  assert.ok(cases.length >= 100);
});

test("openclaw CLI memory benchmark case ids are unique", () => {
  const ids = cases.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("openclaw CLI memory benchmark includes legacy attribution probes", () => {
  const compared = cases.filter((item) => item.compareLegacy === true);
  assert.ok(compared.length >= 10);
  assert.ok(compared.some((item) => item.attributionKind === "bootstrap"));
  assert.ok(compared.some((item) => item.attributionKind === "temporal"));
});

test("openclaw CLI memory benchmark includes a larger answer-level agent matrix", () => {
  const agentCases = cases.filter((item) => item.entrypoint === "agent");
  assert.ok(agentCases.length >= 35);
  assert.ok(agentCases.some((item) => item.category === "agent-preference"));
  assert.ok(agentCases.some((item) => item.category === "agent-rule"));
  assert.ok(agentCases.some((item) => item.category === "agent-history"));
});

test("openclaw CLI memory benchmark includes cross-source and supersede retrieval probes", () => {
  assert.ok(cases.some((item) => item.category === "cross-source"));
  assert.ok(cases.some((item) => item.category === "supersede"));
  assert.ok(
    cases.some(
      (item) =>
        item.entrypoint === "memory_search"
        && Array.isArray(item.expectedSourceGroups)
        && item.expectedSourceGroups.length >= 2
    )
  );
});
