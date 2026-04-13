import test from "node:test";
import assert from "node:assert/strict";

import {
  isUnsupportedMemoryStatusFailure,
  summarizeCommandFailure,
  summarizeUnifiedMemoryCorePlugin
} from "../src/runtime-config.js";

test("summarizeUnifiedMemoryCorePlugin returns stable runtime fields", () => {
  const summary = summarizeUnifiedMemoryCorePlugin({
    plugin: {
      id: "unified-memory-core",
      version: "0.2.1",
      status: "loaded",
      enabled: true,
      rootDir: "/tmp/unified-memory-core",
      services: ["unified-memory-core-nightly-self-learning"],
      install: {
        source: "path",
        sourcePath: "/tmp/source",
        installPath: "/tmp/install",
        version: "0.2.1",
        installedAt: "2026-04-13T00:00:00.000Z"
      }
    },
    typedHooks: [{ name: "after_tool_call" }]
  });

  assert.deepEqual(summary, {
    id: "unified-memory-core",
    version: "0.2.1",
    status: "loaded",
    enabled: true,
    rootDir: "/tmp/unified-memory-core",
    services: ["unified-memory-core-nightly-self-learning"],
    typedHooks: ["after_tool_call"],
    install: {
      source: "path",
      sourcePath: "/tmp/source",
      installPath: "/tmp/install",
      version: "0.2.1",
      installedAt: "2026-04-13T00:00:00.000Z"
    }
  });
});

test("summarizeCommandFailure normalizes exec failures", () => {
  const summary = summarizeCommandFailure({
    message: "Command failed: openclaw memory status --json",
    code: 1,
    stdout: "stdout text\n",
    stderr: "stderr text\n"
  });

  assert.deepEqual(summary, {
    message: "Command failed: openclaw memory status --json",
    code: 1,
    stdout: "stdout text",
    stderr: "stderr text"
  });
});

test("isUnsupportedMemoryStatusFailure detects unsupported memory/status commands", () => {
  assert.equal(
    isUnsupportedMemoryStatusFailure(
      summarizeCommandFailure({
        message: "Command failed",
        stderr: "error: unknown command 'memory'"
      })
    ),
    true
  );

  assert.equal(
    isUnsupportedMemoryStatusFailure(
      summarizeCommandFailure({
        message: "Command failed",
        stderr: "error: unknown command 'status'"
      })
    ),
    true
  );

  assert.equal(
    isUnsupportedMemoryStatusFailure(
      summarizeCommandFailure({
        message: "Command failed",
        stderr: "Config invalid"
      })
    ),
    false
  );
});
