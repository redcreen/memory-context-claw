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
      pluginPath: "/tmp/context-assembly-claw",
      preset: "safe-local"
    }
  );

  assert.equal(merged.plugins.slots.contextEngine, "context-assembly-claw");
  assert.deepEqual(merged.plugins.load.paths, ["/tmp/context-assembly-claw"]);
  assert.deepEqual(merged.plugins.allow, ["openclaw-task-system", "context-assembly-claw"]);
  assert.equal(merged.agents.list[0].memorySearch.provider, "local");
  assert.deepEqual(merged.agents.list[0].memorySearch.extraPaths, ["/tmp/workspace"]);
  assert.equal(merged.plugins.entries["context-assembly-claw"].config.llmRerank.enabled, false);
});

test("mergeConfig can apply llm-rerank preset", () => {
  const merged = mergeInstallConfig(
    {},
    {
      agentId: "main",
      modelPath: "/tmp/model.gguf",
      workspacePath: "/tmp/workspace",
      pluginPath: "/tmp/context-assembly-claw",
      preset: "llm-rerank"
    }
  );

  assert.equal(merged.plugins.entries["context-assembly-claw"].config.llmRerank.enabled, true);
  assert.equal(merged.plugins.entries["context-assembly-claw"].config.llmRerank.model, "gpt-5.4");
});
