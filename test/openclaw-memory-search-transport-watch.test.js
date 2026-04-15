import test from "node:test";
import assert from "node:assert/strict";

import {
  renderTransportWatchReport,
  summarizeTransportProbeResults
} from "../src/openclaw-memory-search-transport-watch.js";

test("summarizeTransportProbeResults groups raw transport failures into watchlist", () => {
  const summary = summarizeTransportProbeResults([
    { id: "ok-case", category: "profile", status: "ok" },
    { id: "timeout-case", category: "cross-source", status: "timeout" },
    { id: "empty-case", category: "supersede", status: "empty_results" },
    { id: "invalid-json", category: "project", status: "invalid_json", error: "Command failed" }
  ]);

  assert.equal(summary.total, 4);
  assert.equal(summary.ok, 1);
  assert.equal(summary.timeout, 1);
  assert.equal(summary.emptyResults, 1);
  assert.equal(summary.invalidJson, 1);
  assert.equal(summary.byFailureClass.missing_json_payload, 1);
  assert.equal(summary.watchlist.length, 3);
});

test("renderTransportWatchReport includes watchlist note that transport is not algorithm quality", () => {
  const markdown = renderTransportWatchReport({
    summary: summarizeTransportProbeResults([
      { id: "timeout-case", category: "cross-source", status: "timeout" },
      { id: "invalid-json", category: "project", status: "invalid_json", error: "Command failed" }
    ])
  }, { generatedAt: "2026-04-14T00:00:00.000Z" });

  assert.match(markdown, /OpenClaw Memory Search Transport Watchlist/);
  assert.match(markdown, /Failure Classes/);
  assert.match(markdown, /missing_json_payload/);
  assert.match(markdown, /transport health only/);
  assert.match(markdown, /should not be counted as Unified Memory Core retrieval algorithm regressions/);
});
