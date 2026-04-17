import test from "node:test";
import assert from "node:assert/strict";

import {
  applyGuardedWorkingSetToMessages
} from "../src/dialogue-working-set-guarded.js";
import {
  buildContextOptimizationScorecard,
  summarizeContextOptimizationEvents
} from "../src/dialogue-working-set-scorecard.js";

test("buildContextOptimizationScorecard derives raw and package reduction metrics", () => {
  const scorecard = buildContextOptimizationScorecard({
    projectionTurns: [{ id: "t1" }, { id: "t2" }, { id: "t3" }],
    snapshot: {
      baselinePromptEstimate: 120,
      shadowRawPromptEstimate: 60,
      shadowPackageEstimate: 48,
      applied: {
        relation: "switch",
        keepTurnIds: ["t3"],
        appliedEvictTurnIds: ["t1", "t2"],
        pinTurnIds: ["t1"],
        reductionRatio: 0.5
      }
    },
    assemblyMetrics: {
      candidateLoadElapsedMs: 14,
      assemblyBuildElapsedMs: 6,
      decisionElapsedMs: 240
    },
    guarded: {
      enabled: true,
      applied: true,
      reason: "guarded_candidate",
      filteredMessageCount: 1,
      filteredMessageTokenEstimate: 20,
      carryForwardEstimate: 12
    }
  });

  assert.equal(scorecard.baselineTurnCount, 3);
  assert.equal(scorecard.evictedTurnCount, 2);
  assert.equal(scorecard.packageReductionRatio, 0.6);
  assert.equal(scorecard.guardedApplied, true);
});

test("summarizeContextOptimizationEvents aggregates guarded applications and relation counts", () => {
  const summary = summarizeContextOptimizationEvents([
    {
      status: "captured",
      scorecard: {
        relation: "switch",
        rawReductionRatio: 0.5,
        packageReductionRatio: 0.6,
        candidateLoadElapsedMs: 12,
        assemblyBuildElapsedMs: 4,
        decisionElapsedMs: 210,
        guardedCarryForwardEstimate: 18
      },
      guarded: {
        applied: true
      }
    },
    {
      status: "captured",
      scorecard: {
        relation: "continue",
        rawReductionRatio: 0,
        packageReductionRatio: 0,
        candidateLoadElapsedMs: 10,
        assemblyBuildElapsedMs: 3,
        decisionElapsedMs: 190,
        guardedCarryForwardEstimate: 0
      },
      guarded: {
        applied: false
      }
    }
  ]);

  assert.equal(summary.captured, 2);
  assert.equal(summary.guardedApplied, 1);
  assert.equal(summary.relationCounts.switch, 1);
  assert.equal(summary.relationCounts.continue, 1);
});

test("applyGuardedWorkingSetToMessages skips activation when carry-forward would remove the net token gain", () => {
  const guarded = applyGuardedWorkingSetToMessages({
    messages: [
      { role: "user", content: "以后默认中文。" },
      { role: "assistant", content: "记住了。" },
      { role: "user", content: "今天先这样，下次继续。" }
    ],
    projection: [
      { id: "t1", sourceIndex: 0 },
      { id: "t2", sourceIndex: 1 },
      { id: "t3", sourceIndex: 2 }
    ],
    snapshot: {
      baselinePromptEstimate: 10,
      injectedArchiveSummary: "This summary is intentionally long enough to erase any token gain.",
      applied: {
        relation: "resolve",
        reductionRatio: 0.4,
        appliedEvictTurnIds: ["t1", "t2"]
      }
    },
    config: {
      enabled: true
    }
  });

  assert.equal(guarded.applied, false);
  assert.equal(guarded.reason, "no_net_token_gain");
});
