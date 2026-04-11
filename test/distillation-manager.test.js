import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { DistillationManager, estimateUsageRatio } from "../src/distillation-manager.js";

function makeConfig(overrides = {}) {
  return {
    forceAgentId: "",
    memoryDistillation: {
      enabled: true,
      triggerBeforeCompaction: true,
      preCompactTriggerRatio: 0.72,
      compactFallback: true,
      cooldownMs: 300000,
      sessionLimit: 8,
      outputDir: "",
      ...overrides
    }
  };
}

test("estimateUsageRatio reflects message size against budget", () => {
  const ratio = estimateUsageRatio([{ role: "user", content: "a".repeat(400) }], 100);
  assert.ok(ratio > 0.9);
});

test("shouldTrigger respects pre-compaction ratio and cooldown", async () => {
  const manager = new DistillationManager({
    logger: { info() {}, warn() {} },
    config: makeConfig({
      preCompactTriggerRatio: 0.5,
      cooldownMs: 100000
    })
  });

  assert.equal(
    manager.shouldTrigger({
      sessionKey: "agent:main:test",
      stage: "pre-compact-threshold",
      usageRatio: 0.4
    }),
    false
  );

  assert.equal(
    manager.shouldTrigger({
      sessionKey: "agent:main:test",
      stage: "pre-compact-threshold",
      usageRatio: 0.8
    }),
    true
  );

  assert.equal(
    manager.shouldTrigger({
      sessionKey: "agent:main:test",
      stage: "pre-compact-threshold",
      usageRatio: 0.9
    }),
    false
  );
});

test("run writes candidate memory artifact", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-"));
  const manager = new DistillationManager({
    logger: { info() {}, warn() {} },
    config: makeConfig({
      cooldownMs: 0,
      outputDir: path.join(tempDir, "out")
    }),
    cwd: tempDir
  });

  const result = await manager.run({
    sessionKey: "agent:main:test",
    stage: "compact-fallback",
    tokenBudget: 1000,
    messages: [
      {
        role: "user",
        content: "我习惯先给结论，再展开细节。"
      },
      {
        role: "assistant",
        content: "结论先说：今天我们已经完成 session memory 配置。"
      }
    ]
  });

  assert.ok(result?.outputPath);
  const markdown = await fs.readFile(result.outputPath, "utf8");
  assert.match(markdown, /建议进入 MEMORY\.md/);
  assert.match(markdown, /channel=`user-rule`|channel=\`user-rule\`/);
});
