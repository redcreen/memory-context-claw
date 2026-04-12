import test from "node:test";
import assert from "node:assert/strict";
import { mergeInstallConfig, mergePluginHostConfig } from "../src/install-config.js";

test("mergeConfig injects plugin slot and main local memory", () => {
  const merged = mergeInstallConfig(
    {
      plugins: {
        allow: ["openclaw-task-system"]
      }
    },
    {
      agentId: "main",
      modelPath: "/tmp/model.gguf",
      workspacePath: "/tmp/workspace",
      pluginPath: "/tmp/unified-memory-core",
      preset: "safe-local"
    }
  );

  assert.equal(merged.plugins.slots.contextEngine, "unified-memory-core");
  assert.deepEqual(merged.plugins.load.paths, ["/tmp/unified-memory-core"]);
  assert.deepEqual(merged.plugins.allow, ["openclaw-task-system", "unified-memory-core"]);
  assert.equal(merged.agents.list[0].memorySearch.provider, "local");
  assert.deepEqual(merged.agents.list[0].memorySearch.extraPaths, ["/tmp/workspace"]);
  assert.equal(merged.plugins.entries["unified-memory-core"].config.llmRerank.enabled, false);
});

test("mergeConfig can apply llm-rerank preset", () => {
  const merged = mergeInstallConfig(
    {},
    {
      agentId: "main",
      modelPath: "/tmp/model.gguf",
      workspacePath: "/tmp/workspace",
      pluginPath: "/tmp/unified-memory-core",
      preset: "llm-rerank"
    }
  );

  assert.equal(merged.plugins.entries["unified-memory-core"].config.llmRerank.enabled, true);
  assert.equal(merged.plugins.entries["unified-memory-core"].config.llmRerank.model, "gpt-5.4");
});

test("mergePluginHostConfig can bind an already installed plugin without load paths", () => {
  const merged = mergePluginHostConfig(
    {},
    {
      agentId: "main",
      modelPath: "/tmp/model.gguf",
      workspacePath: "/tmp/workspace",
      preset: "safe-local"
    }
  );

  assert.equal(merged.plugins.slots.contextEngine, "unified-memory-core");
  assert.equal(merged.plugins.allow.includes("unified-memory-core"), true);
  assert.equal(merged.plugins.entries["unified-memory-core"].enabled, true);
  assert.equal(merged.plugins.load, undefined);
  assert.equal(merged.agents.list[0].memorySearch.provider, "local");
});
