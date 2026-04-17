import test from "node:test";
import assert from "node:assert/strict";

import {
  createMinimalCodexHome,
  normalizeExecErrorMetadata,
  tryRecoverStructuredPayloadFromExecError
} from "../src/codex-structured-runner.js";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

test("tryRecoverStructuredPayloadFromExecError recovers payload from stdout", () => {
  const startedAt = Date.now() - 25;
  const recovered = tryRecoverStructuredPayloadFromExecError(
    {
      message: "Command failed with exit code 1",
      code: 1,
      stdout: [
        '{"type":"thread.started","thread_id":"thr_123"}',
        '{"type":"turn.started"}',
        '{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"{\\"ok\\":true,\\"value\\":7}"}}',
        '{"type":"turn.completed","usage":{"input_tokens":10,"output_tokens":2}}'
      ].join("\n"),
      stderr: "warning line"
    },
    startedAt
  );

  assert.ok(recovered);
  assert.deepEqual(recovered.payload, { ok: true, value: 7 });
  assert.deepEqual(recovered.usage, { input_tokens: 10, output_tokens: 2 });
  assert.equal(recovered.recoveredFromExecError, true);
  assert.equal(recovered.execError.exitCode, 1);
  assert.equal(recovered.execError.timedOut, false);
  assert.equal(recovered.stderr, "warning line");
  assert.ok(recovered.elapsedMs >= 0);
});

test("normalizeExecErrorMetadata marks timeout-shaped failures", () => {
  const metadata = normalizeExecErrorMetadata({
    code: "ETIMEDOUT",
    signal: "SIGTERM",
    killed: true,
    message: "process timed out"
  });

  assert.deepEqual(metadata, {
    exitCode: null,
    signal: "SIGTERM",
    killed: true,
    timedOut: true
  });
});

test("createMinimalCodexHome prefers UMC_CODEX_SEED_HOME when present", async (t) => {
  const seedHome = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-seed-"));
  const originalSeedHome = process.env.UMC_CODEX_SEED_HOME;
  process.env.UMC_CODEX_SEED_HOME = seedHome;

  try {
    await fs.writeFile(path.join(seedHome, "auth.json"), '{"provider":"seed"}\n', "utf8");
    await fs.writeFile(path.join(seedHome, "config.toml"), 'model = "seed"\n', "utf8");

    const freshModule = await import(`../src/codex-structured-runner.js?seed=${Date.now()}`);
    const tempHome = await freshModule.createMinimalCodexHome("low");
    t.after(async () => {
      await fs.rm(tempHome, { recursive: true, force: true });
      await fs.rm(seedHome, { recursive: true, force: true });
      if (typeof originalSeedHome === "string") {
        process.env.UMC_CODEX_SEED_HOME = originalSeedHome;
      } else {
        delete process.env.UMC_CODEX_SEED_HOME;
      }
    });

    assert.equal(
      await fs.readFile(path.join(tempHome, "auth.json"), "utf8"),
      '{"provider":"seed"}\n'
    );
  } finally {
    if (!t.signal?.aborted) {
      if (typeof originalSeedHome === "string") {
        process.env.UMC_CODEX_SEED_HOME = originalSeedHome;
      } else {
        delete process.env.UMC_CODEX_SEED_HOME;
      }
    }
  }
});
