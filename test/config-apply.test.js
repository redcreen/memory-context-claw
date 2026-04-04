import test from "node:test";
import assert from "node:assert/strict";
import { mergeInstallConfig } from "../src/install-config.js";

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
      pluginPath: "/tmp/memory-context-claw",
      preset: "safe-local"
    }
  );

  assert.equal(merged.plugins.slots.contextEngine, "memory-context-claw");
  assert.deepEqual(merged.plugins.load.paths, ["/tmp/memory-context-claw"]);
  assert.deepEqual(merged.plugins.allow, ["openclaw-task-system", "memory-context-claw"]);
  assert.equal(merged.agents.list[0].memorySearch.provider, "local");
  assert.deepEqual(merged.agents.list[0].memorySearch.extraPaths, ["/tmp/workspace"]);
  assert.equal(merged.plugins.entries["memory-context-claw"].config.llmRerank.enabled, false);
});

test("mergeConfig can apply llm-rerank preset", () => {
  const merged = mergeInstallConfig(
    {},
    {
      agentId: "main",
      modelPath: "/tmp/model.gguf",
      workspacePath: "/tmp/workspace",
      pluginPath: "/tmp/memory-context-claw",
      preset: "llm-rerank"
    }
  );

  assert.equal(merged.plugins.entries["memory-context-claw"].config.llmRerank.enabled, true);
  assert.equal(merged.plugins.entries["memory-context-claw"].config.llmRerank.model, "gpt-5.4");
});
