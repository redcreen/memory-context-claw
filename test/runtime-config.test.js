import test from "node:test";
import assert from "node:assert/strict";

import { extractJsonPayload } from "../src/runtime-config.js";
import { extractJsonPayload as extractRetrievalJsonPayload } from "../src/retrieval.js";

test("extractJsonPayload parses JSON after plugin logs in stderr-style output", () => {
  const raw = [
    "[plugins] [unified-memory-core] loaded",
    "[plugins] style-engine: registered capture_xiaohongshu_note",
    "(node:1) [OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED] Warning: compat is deprecated",
    "Bundled plugins must use scoped plugin-sdk subpaths.",
    "{",
    '  "payloads": [',
    '    { "text": "Maya Chen", "mediaUrl": null }',
    "  ],",
    '  "meta": { "durationMs": 19301 }',
    "}"
  ].join("\n");

  const payload = extractJsonPayload(raw);
  assert.equal(payload.payloads[0].text, "Maya Chen");
  assert.equal(payload.meta.durationMs, 19301);
});

test("extractJsonPayload prefers the trailing JSON block over earlier bracketed log prefixes", () => {
  const raw = [
    "[plugins] preload",
    "[plugins] second log line",
    "{",
    '  "ok": true,',
    '  "results": [1, 2, 3]',
    "}"
  ].join("\n");

  const payload = extractJsonPayload(raw);
  assert.equal(payload.ok, true);
  assert.deepEqual(payload.results, [1, 2, 3]);
});

test("retrieval extractJsonPayload parses stderr-style host output with plugin logs", () => {
  const raw = [
    "[plugins] [unified-memory-core] loaded",
    "[plugins] [task-system] plugin loaded",
    "(node:1) warning",
    "{",
    '  "payloads": [',
    '    { "text": "Maya Chen" }',
    "  ],",
    '  "meta": { "durationMs": 20561 }',
    "}"
  ].join("\n");

  const payload = extractRetrievalJsonPayload(raw);
  assert.equal(payload.payloads[0].text, "Maya Chen");
  assert.equal(payload.meta.durationMs, 20561);
});
