import test from "node:test";
import assert from "node:assert/strict";

import cases from "../evals/dialogue-working-set-pruning-cases.js";
import {
  applySoftEvictionPlan,
  evaluateWorkingSetDecision,
  resolveLatestUserTurnId
} from "../src/dialogue-working-set.js";

test("resolveLatestUserTurnId keeps the current user turn guarded", () => {
  const turnId = resolveLatestUserTurnId([
    { id: "t1", role: "assistant", content: "hello" },
    { id: "t2", role: "user", content: "hi" },
    { id: "t3", role: "assistant", content: "done" },
    { id: "t4", role: "user", content: "next question" }
  ]);

  assert.equal(turnId, "t4");
});

test("applySoftEvictionPlan blocks eviction of the latest user turn but allows pinned turns to leave raw context", () => {
  const applied = applySoftEvictionPlan({
    turns: cases.find((item) => item.id === "switch-project-to-config-with-pins").transcript,
    decision: {
      relation: "switch",
      pin_turn_ids: ["t1", "t5"],
      evict_turn_ids: ["t3", "t4", "t5", "t6", "t7"],
      archive_summary: "Old project-summary block is resolved; keep durable preferences as pins."
    }
  });

  assert.deepEqual(applied.pinTurnIds, ["t1", "t5"]);
  assert.deepEqual(applied.appliedEvictTurnIds.sort(), ["t3", "t4", "t5", "t6"].sort());
  assert.deepEqual(applied.blockedEvictTurnIds, ["t7"]);
  assert.ok(applied.pinnedOnlyTurnIds.includes("t5"));
});

test("evaluateWorkingSetDecision passes a branch case that preserves the open loop", () => {
  const caseDef = cases.find((item) => item.id === "branch-keep-open-loop-stage6");
  const evaluation = evaluateWorkingSetDecision(caseDef, {
    relation: "branch",
    confidence: 0.94,
    pin_turn_ids: [],
    evict_turn_ids: [],
    archive_summary: "",
    reasoning_summary: "The Stage 6 planning task is still open, so the side question should not evict the earlier task turns."
  });

  assert.equal(evaluation.passed, true);
});

test("evaluateWorkingSetDecision passes a switch case with semantic pins and meaningful reduction", () => {
  const caseDef = cases.find((item) => item.id === "switch-family-to-code-with-durable-pins");
  const evaluation = evaluateWorkingSetDecision(caseDef, {
    relation: "switch",
    confidence: 0.95,
    pin_turn_ids: ["t1", "t3"],
    evict_turn_ids: ["t1", "t2", "t3", "t4"],
    archive_summary: "Family facts are pinned for later recall; raw family turns can leave the next-turn prompt while the code topic becomes active.",
    reasoning_summary: "The user explicitly closed the family topic and switched to code architecture."
  });

  assert.equal(evaluation.passed, true);
  assert.ok(evaluation.applied.reductionRatio >= 0.45);
});
