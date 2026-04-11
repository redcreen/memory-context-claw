import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  createDailyReflectionRunner,
  renderDailyReflectionReport
} from "../../src/unified-memory-core/daily-reflection.js";
import { createMemoryRegistry } from "../../src/unified-memory-core/memory-registry.js";
import { createReflectionSystem } from "../../src/unified-memory-core/reflection-system.js";
import { createSourceSystem } from "../../src/unified-memory-core/source-system.js";
import { createStandaloneRuntime } from "../../src/unified-memory-core/standalone-runtime.js";

const execFileAsync = promisify(execFile);

function createIdGenerator() {
  let index = 0;
  return () => `id${++index}`;
}

function createFixedClock() {
  return () => new Date("2026-04-11T00:00:00.000Z");
}

test("daily reflection runner detects repeated signals and explicit remember instructions", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-daily-reflect-"));
  const clock = createFixedClock();
  const idGenerator = createIdGenerator();
  const registry = createMemoryRegistry({
    rootDir: registryRoot,
    clock,
    idGenerator
  });
  const sourceSystem = createSourceSystem({
    clock,
    idGenerator,
    defaultNamespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "daily-reflection"
    },
    defaultVisibility: "workspace"
  });
  const reflectionSystem = createReflectionSystem({
    registry,
    clock,
    idGenerator
  });
  const dailyRunner = createDailyReflectionRunner({
    sourceSystem,
    reflectionSystem,
    registry,
    clock,
    idGenerator
  });

  const firstRun = await dailyRunner.runDailyReflection({
    declaredSources: [
      {
        sourceType: "manual",
        declaredBy: "test",
        content: "Remember this: the user prefers concise commit messages."
      }
    ],
    dryRun: false,
    autoPromote: false,
    decidedBy: "daily-test"
  });

  assert.equal(firstRun.summary.reflection.candidate_count, 1);
  assert.equal(firstRun.explicit_remember_signals.length, 1);

  const secondRun = await dailyRunner.runDailyReflection({
    declaredSources: [
      {
        sourceType: "manual",
        declaredBy: "test",
        content: "Remember this: the user prefers concise commit messages."
      }
    ],
    dryRun: false,
    autoPromote: true,
    decidedBy: "daily-test"
  });

  assert.equal(secondRun.summary.reflection.repeated_signal_count, 1);
  assert.equal(secondRun.promoted_stable_artifacts.length, 1);
  assert.equal(secondRun.promotion_review[0].should_promote, true);
});

test("daily reflection report renders markdown summary", async () => {
  const markdown = renderDailyReflectionReport({
    run_id: "daily_reflection_id1",
    generated_at: "2026-04-11T00:00:00.000Z",
    summary: {
      sources: {
        source_count: 1
      },
      reflection: {
        candidate_count: 1,
        repeated_signal_count: 0,
        by_label: {
          stable_preference_candidate: 1
        }
      }
    },
    explicit_remember_signals: [],
    promoted_stable_artifacts: [],
    promotion_review: []
  });

  assert.match(markdown, /Unified Memory Core Daily Reflection/);
  assert.match(markdown, /stable_preference_candidate: 1/);
});

test("standalone runtime daily reflection loop can export promoted artifacts", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-daily-runtime-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "daily-runtime",
      visibility: "workspace"
    },
    clock: createFixedClock()
  });

  await runtime.runDailyReflection({
    declaredSources: [
      {
        sourceType: "manual",
        declaredBy: "test",
        content: "Remember this: the user prefers concise status updates."
      },
      {
        sourceType: "manual",
        declaredBy: "test",
        content: "Remember this: the user prefers concise status updates."
      }
    ],
    autoPromote: true,
    decidedBy: "daily-runtime-test"
  });

  const exportResult = await runtime.buildExport({
    consumer: "generic"
  });

  assert.equal(exportResult.artifacts.length, 2);
});

test("daily reflection CLI command returns reviewable report", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-daily-cli-"));
  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");
  const { stdout } = await execFileAsync(
    "node",
    [
      cliPath,
      "learn",
      "daily-run",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "daily-cli",
      "--source-type",
      "manual",
      "--content",
      "Please remember this preference: concise summaries only.",
      "--dry-run"
    ],
    {
      cwd: process.cwd()
    }
  );

  const result = JSON.parse(String(stdout || "").trim());
  assert.equal(result.summary.sources.source_count, 1);
  assert.equal(result.explicit_remember_signals.length, 1);
});
