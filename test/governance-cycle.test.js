import test from "node:test";
import assert from "node:assert/strict";

import { renderGovernanceCycleReport } from "../src/governance-cycle.js";

test("renderGovernanceCycleReport includes audit, safe governance and live regression summaries", () => {
  const markdown = renderGovernanceCycleReport(
    {
      formalAudit: {
        summary: { total: 9, clean: 9, pendingRisk: 0, archiveReview: 0 }
      },
      postGovernanceFormalAudit: {
        summary: { total: 9, clean: 9, pendingRisk: 0, archiveReview: 0 }
      },
      sessionExitAudit: {
        summary: { total: 1, cardBackedFact: 1, cardBackedReview: 0, rawOnly: 0 }
      },
      factConflictAudit: {
        summary: { slotsScanned: 4, conflicts: 1 }
      },
      factDuplicateAudit: {
        summary: { cardsScanned: 14, duplicateFacts: 2, duplicateSlotValues: 2, acceptableLayered: 1, review: 1 }
      },
      memorySearchGovernance: {
        summary: {
          cases: 6,
          builtinSignalHits: 4,
          builtinSourceHits: 0,
          pluginSignalHits: 4,
          pluginSourceHits: 5,
          pluginFastPathLikely: 5,
          pluginFailures: 1
        }
      },
      safeGovernance: {
        applied: false,
        archiveDir: "/tmp/archive",
        candidates: ["/tmp/cron_sync.log"],
        moved: []
      },
      liveRegression: {
        summary: { cases: 2, passed: 2, failed: 0 }
      }
    },
    {
      generatedAt: "2026-04-05T00:00:00.000Z",
      workspaceRoot: "/tmp/workspace"
    }
  );

  assert.match(markdown, /Governance Cycle Report/);
  assert.match(markdown, /archiveReview: `0`/);
  assert.match(markdown, /Formal Memory Audit \(Post-Governance\)/);
  assert.match(markdown, /cardBackedFact: `1`/);
  assert.match(markdown, /conflicts: `1`/);
  assert.match(markdown, /Memory Search Governance/);
  assert.match(markdown, /builtinSourceHits: `0`/);
  assert.match(markdown, /pluginFailures: `1`/);
  assert.match(markdown, /cases: `2`/);
  assert.match(markdown, /\/tmp\/cron_sync\.log/);
});
