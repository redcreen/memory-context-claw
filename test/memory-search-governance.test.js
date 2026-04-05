import test from "node:test";
import assert from "node:assert/strict";
import {
  renderMemorySearchGovernanceReport,
  summarizeMemorySearchResults
} from "../src/memory-search-governance.js";

test("summarizeMemorySearchResults computes failures and watchlist", () => {
  const summary = summarizeMemorySearchResults([
    {
      id: "food-preference-recall",
      query: "我爱吃什么",
      builtin: { expectedSignalsHit: true, expectedSourceHit: false },
      plugin: { expectedSignalsHit: true, expectedSourceHit: true, fastPathLikely: true }
    },
    {
      id: "short-chinese-token",
      query: "牛排 刘超",
      builtin: { expectedSignalsHit: false, expectedSourceHit: false },
      plugin: { expectedSignalsHit: false, expectedSourceHit: true, fastPathLikely: false }
    }
  ]);

  assert.equal(summary.cases, 2);
  assert.equal(summary.builtinFailures, 2);
  assert.equal(summary.pluginFailures, 1);
  assert.equal(summary.watchlist.length, 1);
  assert.equal(summary.watchlist[0].id, "short-chinese-token");
});

test("renderMemorySearchGovernanceReport includes summary and watchlist", () => {
  const markdown = renderMemorySearchGovernanceReport(
    {
      summary: {
        cases: 6,
        builtinSignalHits: 4,
        builtinSourceHits: 0,
        pluginSignalHits: 4,
        pluginSourceHits: 5,
        pluginFastPathLikely: 5,
        builtinFailures: 6,
        pluginFailures: 1,
        watchlist: [
          {
            id: "short-chinese-token",
            query: "牛排 刘超",
            builtinSignals: false,
            builtinSource: false,
            pluginSignals: false,
            pluginSource: true
          }
        ]
      },
      results: []
    },
    { generatedAt: "2026-04-05T00:00:00.000Z" }
  );

  assert.match(markdown, /Memory Search Governance Report/);
  assert.match(markdown, /pluginFailures: `1`/);
  assert.match(markdown, /short-chinese-token/);
  assert.match(markdown, /牛排 刘超/);
});
