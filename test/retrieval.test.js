import test from "node:test";
import assert from "node:assert/strict";
import { extractJsonPayload } from "../src/retrieval.js";
import { shouldExcludeMemoryPath } from "../src/utils.js";
import { resolvePluginConfig } from "../src/config.js";

test("extractJsonPayload parses pure json output", () => {
  const parsed = extractJsonPayload('{"results":[{"path":"MEMORY.md"}]}');
  assert.deepEqual(parsed, { results: [{ path: "MEMORY.md" }] });
});

test("extractJsonPayload ignores leading plugin log lines", () => {
  const parsed = extractJsonPayload(
    [
      "[plugins] [task-system] plugin loaded (enabled=true)",
      "[plugins] [memory-context-claw] loaded (enabled=true)",
      '{"results":[{"path":"memory/2026-04-04.md","score":0.82}]}'
    ].join("\n")
  );

  assert.deepEqual(parsed, {
    results: [{ path: "memory/2026-04-04.md", score: 0.82 }]
  });
});

test("shouldExcludeMemoryPath filters plugin repo paths", () => {
  assert.equal(
    shouldExcludeMemoryPath(
      "../../Project/长记忆/context-assembly-claw/README.md",
      ["/context-assembly-claw/"]
    ),
    true
  );
  assert.equal(
    shouldExcludeMemoryPath("../../Project/长记忆/MEMORY.md", ["/context-assembly-claw/"]),
    false
  );
});

test("resolvePluginConfig enables query rewrite by default", () => {
  const config = resolvePluginConfig({});
  assert.equal(config.queryRewrite.enabled, true);
  assert.equal(config.queryRewrite.maxQueries, 4);
  assert.equal(
    config.excludePaths.includes("/memory-context-claw-enabled-vs-disabled-report.md"),
    true
  );
});

test("resolvePluginConfig merges default and preset exclude paths", () => {
  const config = resolvePluginConfig({
    excludePaths: ["/custom-report.md"]
  });
  assert.equal(config.excludePaths.includes("/memory-context-claw-enabled-vs-disabled-report.md"), true);
  assert.equal(config.excludePaths.includes("/custom-report.md"), true);
});
