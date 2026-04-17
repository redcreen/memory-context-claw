import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeExecErrorMetadata,
  tryRecoverStructuredPayloadFromExecError
} from "../src/codex-structured-runner.js";

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
