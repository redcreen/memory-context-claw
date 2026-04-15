import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import plugin from "../src/plugin/index.js";
import { createMemoryRegistry } from "../src/unified-memory-core/memory-registry.js";

test("openclaw plugin registers an after_tool_call hook that captures accepted_action signals", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-plugin-action-"));
  const hooks = new Map();
  const tools = new Map();

  plugin.register({
    runtime: {},
    logger: {
      info() {},
      warn() {},
      error() {}
    },
    pluginConfig: {
      openclawAdapter: {
        acceptedActions: {
          enabled: true
        },
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace",
          agentNamespace: {
            enabled: true
          }
        }
      }
    },
    registerContextEngine() {},
    registerService() {},
    registerTool(tool) {
      tools.set(tool.name, tool);
    },
    on(hookName, handler) {
      hooks.set(hookName, handler);
    }
  });

  const afterToolCall = hooks.get("after_tool_call");
  assert.equal(typeof afterToolCall, "function");
  assert.equal(tools.has("umc_emit_accepted_action_canary"), false);

  const persisted = await afterToolCall({
    toolName: "publish_site",
    params: {
      repo: "redcreen/redcreen.github.io"
    },
    result: {
      accepted_action: {
        actionType: "publish_site",
        accepted: true,
        succeeded: true,
        targets: [
          "redcreen/redcreen.github.io",
          "https://redcreen.github.io/brain-reinstall-jingangjing/"
        ],
        artifacts: ["dist/index.html"],
        outputs: {
          finalUrl: "https://redcreen.github.io/brain-reinstall-jingangjing/"
        },
        content: "User accepted the publish target and the site release succeeded."
      }
    }
  }, {
    agentId: "code",
    sessionKey: "agent:code:test",
    toolName: "publish_site",
    toolCallId: "tool_call_1"
  });

  assert.ok(persisted);
  assert.equal(persisted.declared_source.sourceType, "accepted_action");
  assert.equal(persisted.reflection.run.summary.by_extraction_class.target_fact, 1);
  assert.equal(persisted.reflection.run.summary.by_extraction_class.outcome_artifact, 2);
  assert.equal(persisted.promoted.length, 1);

  const registry = createMemoryRegistry({ rootDir: registryRoot });
  const records = await registry.listRecords();
  const trails = await registry.listDecisionTrails();
  const acceptedActionSources = records.filter(
    (record) => record.record_type === "source_artifact" && record.payload?.source_type === "accepted_action"
  );
  const stableRecords = records.filter((record) => record.record_type === "stable_artifact");

  assert.equal(acceptedActionSources.length, 1);
  assert.equal(stableRecords.length, 1);
  assert.equal(
    stableRecords[0].payload.attributes.accepted_action_extraction_class,
    "target_fact"
  );
  assert.equal(trails.length, 5);
});

test("openclaw accepted_action hook ignores tool results without a structured accepted-action payload", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-openclaw-plugin-ignore-"));
  const hooks = new Map();

  plugin.register({
    runtime: {},
    logger: {
      info() {},
      warn() {},
      error() {}
    },
    pluginConfig: {
      openclawAdapter: {
        acceptedActions: {
          enabled: true
        },
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace"
        }
      }
    },
    registerContextEngine() {},
    registerService() {},
    registerTool() {},
    on(hookName, handler) {
      hooks.set(hookName, handler);
    }
  });

  const afterToolCall = hooks.get("after_tool_call");
  const persisted = await afterToolCall({
    toolName: "publish_site",
    params: {},
    result: {
      ok: true,
      finalUrl: "https://redcreen.github.io/brain-reinstall-jingangjing/"
    }
  }, {
    agentId: "code"
  });

  assert.equal(persisted, null);

  const registry = createMemoryRegistry({ rootDir: registryRoot });
  const records = await registry.listRecords();
  assert.equal(records.length, 0);
});

test("umc canary tool emits a structured accepted_action payload for end-to-end host checks", async () => {
  const tools = new Map();

  plugin.register({
    runtime: {},
    logger: {
      info() {},
      warn() {},
      error() {}
    },
    pluginConfig: {
      openclawAdapter: {
        debug: {
          canaryTool: true
        }
      }
    },
    registerContextEngine() {},
    registerService() {},
    registerTool(tool) {
      tools.set(tool.name, tool);
    }
  });

  const tool = tools.get("umc_emit_accepted_action_canary");
  assert.ok(tool);

  const result = await tool.execute("tool_call_1", {
    canary_id: "e2e-canary",
    target: "https://example.invalid/umc/e2e-canary",
    artifact: "artifacts/e2e-canary.txt"
  });

  assert.equal(result.accepted_action.actionType, "umc_emit_accepted_action_canary");
  assert.equal(result.accepted_action.accepted, true);
  assert.equal(result.accepted_action.succeeded, true);
  assert.deepEqual(result.accepted_action.targets, ["https://example.invalid/umc/e2e-canary"]);
  assert.deepEqual(result.accepted_action.artifacts, ["artifacts/e2e-canary.txt"]);
  assert.equal(result.accepted_action.outputs.canaryId, "e2e-canary");
  assert.match(result.accepted_action.content, /e2e-canary/);
});
