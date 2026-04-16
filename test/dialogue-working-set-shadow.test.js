import test from "node:test";
import assert from "node:assert/strict";

import shadowCases from "../evals/dialogue-working-set-shadow-cases.js";
import answerCases from "../evals/dialogue-working-set-answer-ab-cases.js";
import adversarialCases from "../evals/dialogue-working-set-adversarial-cases.js";
import { evaluateWorkingSetDecision } from "../src/dialogue-working-set.js";
import {
  buildShadowContextSnapshot,
  sliceTurnsThroughId
} from "../src/dialogue-working-set-shadow.js";

test("sliceTurnsThroughId returns a prefix ending at the requested turn id", () => {
  const caseDef = shadowCases.find((item) => item.id === "shadow-replay-project-switches");
  const prefix = sliceTurnsThroughId(caseDef.transcript, "t6");
  assert.equal(prefix.at(-1).id, "t6");
  assert.equal(prefix.length, 6);
});

test("buildShadowContextSnapshot keeps semantic pins while shrinking raw turns", () => {
  const caseDef = shadowCases.find((item) => item.id === "shadow-replay-family-code-family");
  const snapshot = buildShadowContextSnapshot({
    turns: sliceTurnsThroughId(caseDef.transcript, "t5"),
    decision: {
      relation: "switch",
      pin_turn_ids: ["t1", "t3"],
      evict_turn_ids: ["t1", "t2", "t3", "t4"],
      archive_summary: "Family facts are pinned; code topic is now active."
    }
  });

  assert.equal(snapshot.semanticPinNotes.length, 2);
  assert.ok(snapshot.shadowPackageEstimate > 0);
  assert.ok(snapshot.shadowRawPromptEstimate < snapshot.baselinePromptEstimate);
});

test("evaluateWorkingSetDecision supports must_not_pin_turn_ids for assistant-guess adversarial cases", () => {
  const caseDef = adversarialCases.find((item) => item.id === "adversarial-assistant-claim-not-durable");
  const evaluation = evaluateWorkingSetDecision(caseDef, {
    relation: "switch",
    confidence: 0.94,
    pin_turn_ids: ["t2"],
    evict_turn_ids: ["t1", "t3"],
    archive_summary: "Only the user's correction survives as a durable pin.",
    reasoning_summary: "Assistant speculation should not be promoted."
  });

  assert.equal(evaluation.passed, true);
});

test("answer A/B cases cover both positive and negative recall boundaries", () => {
  assert.ok(answerCases.length >= 5);
  assert.ok(answerCases.some((item) => (item.forbiddenAny || []).length > 0));
  assert.ok(answerCases.some((item) => (item.expectedAny || []).length > 0));
});
