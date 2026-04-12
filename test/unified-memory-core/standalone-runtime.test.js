import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { createStandaloneRuntime } from "../../src/unified-memory-core/standalone-runtime.js";

const execFileAsync = promisify(execFile);

function parseJson(stdout) {
  return JSON.parse(String(stdout || "").trim());
}

test("standalone runtime runs local ingest reflect promote export loop", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "standalone-loop",
      visibility: "workspace"
    },
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });

  const reflectionResult = await runtime.reflectDeclaredSource({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      content: "The user prefers terse implementation notes."
    },
    promoteCandidates: true,
    decidedBy: "standalone-test"
  });

  assert.equal(reflectionResult.reflection.run.summary.candidate_count, 1);
  assert.equal(reflectionResult.promoted.length, 1);

  const exportResult = await runtime.buildExport({
    consumer: "generic"
  });

  assert.equal(exportResult.artifacts.length, 1);
  assert.equal(exportResult.artifacts[0].summary, "The user prefers terse implementation notes.");
});

test("standalone CLI reflect dry-run returns reflection output without persisting records", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-cli-"));
  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");
  const { stdout } = await execFileAsync(
    "node",
    [
      cliPath,
      "reflect",
      "run",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "cli-dry-run",
      "--source-type",
      "manual",
      "--content",
      "Must keep exports deterministic.",
      "--dry-run"
    ],
    {
      cwd: process.cwd()
    }
  );

  const result = parseJson(stdout);
  assert.equal(result.reflection.run.summary.candidate_count, 1);
  assert.equal(result.reflection.candidate_records.length, 0);
  assert.equal(result.reflection.outputs[0].primary_label, "stable_rule_candidate");
});

test("standalone CLI govern audit renders markdown output", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-govern-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "govern-audit",
      visibility: "workspace"
    },
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });

  await runtime.reflectDeclaredSource({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      content: "The user prefers short progress reports."
    },
    promoteCandidates: true,
    decidedBy: "standalone-test"
  });

  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");
  const { stdout } = await execFileAsync(
    "node",
    [
      cliPath,
      "govern",
      "audit",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "govern-audit",
      "--format",
      "markdown"
    ],
    {
      cwd: process.cwd()
    }
  );

  assert.match(String(stdout || ""), /Unified Memory Core Governance Audit/);
});

test("standalone runtime can inspect registry-root resolution", () => {
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: "/tmp/explicit-registry",
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "registry-inspect",
      visibility: "workspace"
    }
  });

  const report = runtime.inspectRegistryRoot();
  assert.equal(report.registry_dir, "/tmp/explicit-registry");
  assert.equal(report.source, "explicit");
});

test("standalone runtime can inspect registry topology", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-topology-"));
  await fs.writeFile(path.join(registryRoot, "records.jsonl"), '{"record_id":"standalone"}\n', "utf8");
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "registry-inspect",
      visibility: "workspace"
    }
  });

  const report = await runtime.inspectRegistryTopology();
  assert.equal(report.summary.active_root, registryRoot);
  assert.equal(report.summary.active_source, "explicit");
  assert.equal(typeof report.canonical_root.registry_dir, "string");
});

test("standalone CLI can inspect registry topology", async () => {
  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");
  const { stdout } = await execFileAsync(
    "node",
    [
      cliPath,
      "registry",
      "inspect",
      "--registry-dir",
      "/tmp/cli-registry",
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "registry-inspect"
    ],
    {
      cwd: process.cwd()
    }
  );

  const result = parseJson(stdout);
  assert.equal(result.summary.active_root, "/tmp/cli-registry");
  assert.equal(result.summary.active_source, "explicit");
});

test("standalone CLI can plan and apply registry migration", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-migrate-"));
  const legacyDir = path.join(tempRoot, "legacy");
  const canonicalDir = path.join(tempRoot, "canonical");
  await fs.mkdir(legacyDir, { recursive: true });
  await fs.writeFile(path.join(legacyDir, "records.jsonl"), '{"record_id":"legacy-cli"}\n', "utf8");
  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");

  const dryRun = await execFileAsync(
    "node",
    [
      cliPath,
      "registry",
      "migrate",
      "--registry-dir",
      legacyDir,
      "--source-dir",
      legacyDir,
      "--target-dir",
      canonicalDir
    ],
    {
      cwd: process.cwd()
    }
  );
  const dryRunResult = parseJson(dryRun.stdout);
  assert.equal(dryRunResult.noop, false);
  assert.equal(dryRunResult.added_records, 1);

  const apply = await execFileAsync(
    "node",
    [
      cliPath,
      "registry",
      "migrate",
      "--registry-dir",
      legacyDir,
      "--source-dir",
      legacyDir,
      "--target-dir",
      canonicalDir,
      "--apply"
    ],
    {
      cwd: process.cwd()
    }
  );
  const applyResult = parseJson(apply.stdout);
  assert.equal(applyResult.apply, true);
  assert.equal(applyResult.added_records, 1);
  assert.match(await fs.readFile(path.join(canonicalDir, "records.jsonl"), "utf8"), /legacy-cli/);
});

test("standalone runtime closes a local observation to stable governed learning loop", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-lifecycle-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "lifecycle-loop",
      visibility: "workspace"
    },
    clock: () => new Date("2026-04-20T00:00:00.000Z")
  });

  const report = await runtime.runLearningLifecycle({
    declaredSources: [
      {
        sourceType: "manual",
        declaredBy: "test",
        content: "Remember this: the user prefers concise progress reports."
      }
    ],
    autoPromote: true,
    decidedBy: "standalone-test"
  });

  assert.equal(report.daily_reflection.summary.sources.source_count, 1);
  assert.equal(report.lifecycle.promotedStableArtifacts.length, 1);
  assert.equal(report.learning_audit.summary.stable_learning_artifacts, 1);
  assert.equal(report.learning_audit.summary.openclaw_consumed_candidates, 1);
  assert.equal(report.replay_run.result, "queued");
});

test("standalone CLI can run lifecycle loop and render learning audit markdown", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-lifecycle-cli-"));
  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");

  const lifecycleResult = await execFileAsync(
    "node",
    [
      cliPath,
      "learn",
      "lifecycle-run",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "lifecycle-cli",
      "--source-type",
      "manual",
      "--content",
      "Remember this: the user prefers concise summaries."
    ],
    { cwd: process.cwd() }
  );
  const auditResult = await execFileAsync(
    "node",
    [
      cliPath,
      "govern",
      "audit-learning",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "lifecycle-cli",
      "--format",
      "markdown"
    ],
    { cwd: process.cwd() }
  );

  const lifecycle = parseJson(lifecycleResult.stdout);
  assert.equal(lifecycle.learning_audit.summary.stable_learning_artifacts, 1);
  assert.match(String(auditResult.stdout || ""), /Learning Lifecycle Audit/);
});

test("standalone runtime can close a local policy-adaptation loop", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-policy-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "policy-loop",
      visibility: "workspace"
    },
    clock: () => new Date("2026-04-20T00:00:00.000Z")
  });

  const report = await runtime.runPolicyAdaptationLoop({
    declaredSources: [
      {
        sourceType: "manual",
        declaredBy: "test",
        content: "Remember this: the user prefers concise progress reports."
      }
    ],
    query: "给我一个简洁的进展汇报",
    taskPrompt: "给我一个简洁的进展汇报并继续编码"
  });

  assert.equal(report.learning_lifecycle.learning_audit.summary.stable_learning_artifacts, 1);
  assert.equal(report.policy_audit.summary.openclaw_policy_inputs, 1);
  assert.equal(report.openclaw_context.policy_context.supporting_context_mode, "compact");
  assert.equal(report.codex_context.task_defaults.response_style, "concise");
});

test("standalone CLI can audit policy adaptation and run policy loop", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-policy-cli-"));
  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");

  await execFileAsync(
    "node",
    [
      cliPath,
      "learn",
      "policy-loop",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "policy-cli",
      "--source-type",
      "manual",
      "--content",
      "Remember this: the user prefers concise progress reports."
    ],
    { cwd: process.cwd() }
  );

  const auditResult = await execFileAsync(
    "node",
    [
      cliPath,
      "govern",
      "audit-policy",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "policy-cli",
      "--format",
      "markdown"
    ],
    { cwd: process.cwd() }
  );

  assert.match(String(auditResult.stdout || ""), /Policy Adaptation Report/);
});
