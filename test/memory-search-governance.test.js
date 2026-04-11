import test from "node:test";
import assert from "node:assert/strict";
import {
  compareMemorySearchSummaries,
  renderMemorySearchGovernanceReport,
  summarizeMemorySearchResults
} from "../src/memory-search-governance.js";

test("summarizeMemorySearchResults computes failures and watchlist", () => {
  const summary = summarizeMemorySearchResults([
    {
      id: "food-preference-recall",
      query: "我爱吃什么",
      builtin: { commandOk: false, expectedSignalsHit: true, expectedSourceHit: false },
      plugin: {
        expectedSignalsHit: true,
        expectedSourceHit: true,
        fastPathLikely: true,
        selectionQuality: {
          selectedCount: 1,
          singleCard: true,
          multiCard: false,
          noisySupporting: false,
          unexpectedSupportingCount: 0
        }
      }
    },
    {
      id: "short-chinese-token",
      query: "牛排 刘超",
      builtin: { commandOk: true, expectedSignalsHit: false, expectedSourceHit: false },
      plugin: {
        expectedSignalsHit: false,
        expectedSourceHit: true,
        fastPathLikely: false,
        selectionQuality: {
          selectedCount: 2,
          singleCard: false,
          multiCard: true,
          noisySupporting: true,
          unexpectedSupportingCount: 1
        }
      }
    }
  ]);

  assert.equal(summary.cases, 2);
  assert.equal(summary.builtinUnavailable, 1);
  assert.equal(summary.pluginSingleCard, 1);
  assert.equal(summary.pluginMultiCard, 1);
  assert.equal(summary.pluginNoisySupporting, 1);
  assert.equal(summary.pluginUnexpectedSupportingTotal, 1);
  assert.equal(summary.builtinFailures, 1);
  assert.equal(summary.pluginFailures, 1);
  assert.equal(summary.watchlist.length, 1);
  assert.equal(summary.watchlist[0].id, "short-chinese-token");
});

test("compareMemorySearchSummaries reports delta and watchlist changes", () => {
  const comparison = compareMemorySearchSummaries(
    {
      builtinUnavailable: 2,
      builtinSignalHits: 0,
      builtinSourceHits: 0,
      pluginSignalHits: 6,
      pluginSourceHits: 5,
      pluginFastPathLikely: 6,
      pluginSingleCard: 5,
      pluginMultiCard: 1,
      pluginNoisySupporting: 1,
      pluginUnexpectedSupportingTotal: 1,
      builtinFailures: 0,
      pluginFailures: 1,
      watchlist: [{ id: "short-chinese-token" }]
    },
    {
      builtinUnavailable: 0,
      builtinSignalHits: 4,
      builtinSourceHits: 0,
      pluginSignalHits: 4,
      pluginSourceHits: 4,
      pluginFastPathLikely: 5,
      pluginSingleCard: 2,
      pluginMultiCard: 4,
      pluginNoisySupporting: 3,
      pluginUnexpectedSupportingTotal: 5,
      builtinFailures: 6,
      pluginFailures: 3,
      watchlist: [{ id: "short-chinese-token" }, { id: "food-preference-recall" }, { id: "session-memory-source-competition" }]
    }
  );

  assert.equal(comparison.pluginSignalHitsDelta, 2);
  assert.equal(comparison.pluginSingleCardDelta, 3);
  assert.equal(comparison.pluginNoisySupportingDelta, -2);
  assert.equal(comparison.pluginUnexpectedSupportingTotalDelta, -4);
  assert.equal(comparison.pluginFailuresDelta, -2);
  assert.deepEqual(comparison.watchlistAdded, []);
  assert.deepEqual(comparison.watchlistResolved.sort(), ["food-preference-recall", "session-memory-source-competition"]);
  assert.deepEqual(comparison.watchlistPersisting, ["short-chinese-token"]);
});

test("renderMemorySearchGovernanceReport includes summary and watchlist", () => {
  const markdown = renderMemorySearchGovernanceReport(
    {
      summary: {
        cases: 6,
        builtinUnavailable: 6,
        builtinSignalHits: 4,
        builtinSourceHits: 0,
        pluginSignalHits: 4,
        pluginSourceHits: 5,
        pluginFastPathLikely: 5,
        pluginSingleCard: 4,
        pluginMultiCard: 2,
        pluginNoisySupporting: 1,
        pluginUnexpectedSupportingTotal: 1,
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
      comparison: {
        builtinUnavailableDelta: 6,
        builtinSignalHitsDelta: -4,
        builtinSourceHitsDelta: 0,
        pluginSignalHitsDelta: 0,
        pluginSourceHitsDelta: 1,
        pluginFastPathLikelyDelta: 0,
        pluginSingleCardDelta: 2,
        pluginMultiCardDelta: -2,
        pluginNoisySupportingDelta: -2,
        pluginUnexpectedSupportingTotalDelta: -4,
        builtinFailuresDelta: -6,
        pluginFailuresDelta: -2,
        watchlistAdded: [],
        watchlistResolved: ["food-preference-recall"],
        watchlistPersisting: ["short-chinese-token"]
      },
      results: []
    },
    { generatedAt: "2026-04-05T00:00:00.000Z" }
  );

  assert.match(markdown, /Memory Search Governance Report/);
  assert.match(markdown, /builtinUnavailable: `6`/);
  assert.match(markdown, /pluginFailures: `1`/);
  assert.match(markdown, /pluginSingleCard: `4`/);
  assert.match(markdown, /pluginNoisySupporting: `1`/);
  assert.match(markdown, /Delta vs Previous/);
  assert.match(markdown, /pluginUnexpectedSupportingTotalDelta: `-4`/);
  assert.match(markdown, /Watchlist Changes/);
  assert.match(markdown, /short-chinese-token/);
  assert.match(markdown, /牛排 刘超/);
});
