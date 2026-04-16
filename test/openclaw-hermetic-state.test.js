import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import {
  buildHermeticOpenClawConfig,
  resolveHermeticAgentModel,
  resolveHermeticFixtureRoot,
  stripUnifiedMemoryCoreHostConfig
} from "../scripts/openclaw-hermetic-state.js";

test("buildHermeticOpenClawConfig binds unified-memory-core for hermetic current state", () => {
  const config = buildHermeticOpenClawConfig({
    agentId: "umceval65",
    agentDir: "/tmp/agent",
    workspacePath: "/tmp/agent",
    modelPath: "/tmp/embed.gguf",
    pluginPath: "/repo/unified-memory-core",
    preset: "safe-local",
    includeUMC: true,
    agentModel: "openai-codex/gpt-5.4-mini"
  });

  assert.equal(config.plugins.slots.contextEngine, "unified-memory-core");
  assert.ok(config.plugins.allow.includes("unified-memory-core"));
  assert.equal(config.plugins.load.paths.includes("/repo/unified-memory-core"), true);
  assert.equal(config.agents.list[0].workspace, "/tmp/agent");
  assert.equal(config.agents.list[0].agentDir, "/tmp/agent");
  assert.equal(config.agents.list[0].memorySearch.local.modelPath, "/tmp/embed.gguf");
  assert.equal(config.agents.list[0].model.primary, "openai-codex/gpt-5.4-mini");
});

test("stripUnifiedMemoryCoreHostConfig removes UMC bindings and noisy plugins", () => {
  const legacy = stripUnifiedMemoryCoreHostConfig({
    plugins: {
      allow: ["unified-memory-core", "openclaw-task-system", "custom-plugin"],
      slots: { contextEngine: "unified-memory-core" },
      load: {
        paths: [
          "/repo/unified-memory-core",
          "/repo/openclaw-task-system",
          "/repo/custom-plugin"
        ]
      },
      entries: {
        "unified-memory-core": { enabled: true },
        "openclaw-task-system": { enabled: true },
        "custom-plugin": { enabled: true }
      }
    }
  });

  assert.equal(legacy.plugins.slots.contextEngine, "legacy");
  assert.deepEqual(legacy.plugins.allow, ["custom-plugin"]);
  assert.deepEqual(legacy.plugins.load.paths, ["/repo/custom-plugin"]);
  assert.deepEqual(Object.keys(legacy.plugins.entries), ["custom-plugin"]);
});

test("resolveHermeticAgentModel prefers explicit or env-provided model ids", () => {
  assert.equal(resolveHermeticAgentModel("openai-codex/gpt-5.4"), "openai-codex/gpt-5.4");
});

test("resolveHermeticFixtureRoot points at the in-repo fixture", async () => {
  const fixtureRoot = resolveHermeticFixtureRoot();
  const stat = await fs.stat(fixtureRoot);
  assert.equal(stat.isDirectory(), true);
});
