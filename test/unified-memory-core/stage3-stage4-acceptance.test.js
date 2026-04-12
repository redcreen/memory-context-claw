import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  createStandaloneRuntime,
  renderStage34AcceptanceReport
} from "../../src/unified-memory-core/index.js";

const execFileAsync = promisify(execFile);

function parseJson(stdout) {
  return JSON.parse(String(stdout || "").trim());
}

test("standalone runtime can produce a passing Stage 3-4 acceptance report", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage34-runtime-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "stage34-runtime",
      visibility: "workspace"
    },
    clock: () => new Date("2026-04-20T00:00:00.000Z")
  });

  const report = await runtime.runStage34Acceptance({
    declaredSources: [
      {
        sourceType: "manual",
        declaredBy: "test",
        content: "Remember this: the user prefers concise progress reports."
      }
    ],
    query: "给我一个简洁的项目进展更新",
    taskPrompt: "给我一个简洁的项目进展更新并继续编码"
  });

  assert.equal(report.summary.status, "pass");
  assert.equal(report.summary.failed_checks, 0);
  assert.equal(report.learning_lifecycle.summary.stable_learning_artifacts, 1);
  assert.equal(report.policy_adaptation.summary.openclaw_policy_inputs, 1);
  assert.equal(report.exports.generic.policy_input_count, 1);
  assert.equal(report.codex_context.response_style, "concise");
  assert.match(renderStage34AcceptanceReport(report), /Stage 3-4 Acceptance/);
});

test("standalone CLI can verify Stage 3-4 acceptance as structured JSON", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage34-cli-"));
  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");
  const { stdout } = await execFileAsync(
    "node",
    [
      cliPath,
      "verify",
      "stage3-stage4",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "stage34-cli",
      "--source-type",
      "manual",
      "--content",
      "Remember this: the user prefers concise progress reports."
    ],
    { cwd: process.cwd() }
  );

  const report = parseJson(stdout);
  assert.equal(report.summary.status, "pass");
  assert.equal(report.summary.failed_checks, 0);
  assert.equal(report.exports.openclaw.policy_input_count, 1);
  assert.equal(report.openclaw_context.supporting_context_mode, "compact");
});

test("stage3-stage4 acceptance script can run against an isolated temp registry", async () => {
  const scriptPath = path.join(process.cwd(), "scripts", "run-stage3-stage4-acceptance.js");
  const { stdout } = await execFileAsync(
    "node",
    [
      scriptPath,
      "--format",
      "json",
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "stage34-script",
      "--source-type",
      "manual",
      "--content",
      "Remember this: the user prefers concise progress reports."
    ],
    { cwd: process.cwd() }
  );

  const report = parseJson(stdout);
  assert.equal(report.summary.status, "pass");
  assert.equal(report.summary.failed_checks, 0);
  assert.match(report.registry_dir, /umc-stage34-acceptance-/);
});
