import test from "node:test";
import assert from "node:assert/strict";
import {
  applyGatewayGpuPolicy,
  extractJsonPayload,
  parseRuntimeArgs,
  summarizeMainMemory
} from "../src/runtime-config.js";

test("parseRuntimeArgs reads explicit binary overrides", () => {
  const parsed = parseRuntimeArgs([
    "--check",
    "--launch-agent",
    "/tmp/gateway.plist",
    "--openclaw-bin",
    "/usr/local/bin/openclaw",
    "--llama-bin",
    "/usr/local/bin/node-llama-cpp"
  ]);

  assert.equal(parsed.check, true);
  assert.equal(parsed.launchAgentPath, "/tmp/gateway.plist");
  assert.equal(parsed.openclawBin, "/usr/local/bin/openclaw");
  assert.equal(parsed.llamaBin, "/usr/local/bin/node-llama-cpp");
});

test("applyGatewayGpuPolicy writes cpu-safe gateway env", () => {
  const result = applyGatewayGpuPolicy({
    EnvironmentVariables: {
      PATH: "/usr/bin:/bin"
    }
  });

  assert.equal(result.changed, true);
  assert.equal(result.nextValue, "false");
  assert.equal(result.plist.EnvironmentVariables.NODE_LLAMA_CPP_GPU, "false");
});

test("applyGatewayGpuPolicy removes override in remove mode", () => {
  const result = applyGatewayGpuPolicy(
    {
      EnvironmentVariables: {
        NODE_LLAMA_CPP_GPU: "false",
        PATH: "/usr/bin:/bin"
      }
    },
    { remove: true }
  );

  assert.equal(result.changed, true);
  assert.equal(result.nextValue, null);
  assert.equal("NODE_LLAMA_CPP_GPU" in result.plist.EnvironmentVariables, false);
});

test("summarizeMainMemory extracts main agent health", () => {
  const summary = summarizeMainMemory([
    {
      agentId: "main",
      status: {
        provider: "local",
        files: 30,
        chunks: 124,
        dirty: false
      }
    }
  ]);

  assert.deepEqual(summary, {
    provider: "local",
    files: 30,
    chunks: 124,
    dirty: false
  });
});

test("extractJsonPayload ignores leading plugin log lines", () => {
  const parsed = extractJsonPayload(
    [
      "[plugins] [task-system] plugin loaded",
      '[{"agentId":"main","status":{"provider":"local"}}]'
    ].join("\n")
  );

  assert.deepEqual(parsed, [{ agentId: "main", status: { provider: "local" } }]);
});
