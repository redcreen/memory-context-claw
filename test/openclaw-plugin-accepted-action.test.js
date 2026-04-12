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
    on(hookName, handler) {
      hooks.set(hookName, handler);
    }
  });

  const afterToolCall = hooks.get("after_tool_call");
  assert.equal(typeof afterToolCall, "function");

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
