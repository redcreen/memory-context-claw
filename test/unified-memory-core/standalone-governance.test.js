import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { createStandaloneRuntime } from "../../src/unified-memory-core/standalone-runtime.js";

const execFileAsync = promisify(execFile);

test("standalone runtime can build repair plan from audit findings", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-repair-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "repair-runtime",
      visibility: "workspace"
    },
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });

  const sourceResult = await runtime.addSource({
    sourceType: "manual",
    declaredBy: "test",
    content: "This candidate will be missing a decision trail."
  });
  await runtime.registry.persistCandidateArtifact({
    artifact_id: "artifact_missing_trail",
    artifact_type: "candidate_artifact",
    contract_version: "1.0.0",
    state: "candidate",
    namespace: runtime.config.namespace,
    visibility: "workspace",
    title: "candidate:missing-trail",
    summary: "candidate missing trail",
    source_artifact_id: sourceResult.sourceArtifact.artifact_id,
    evidence_refs: [sourceResult.sourceArtifact.artifact_id],
    fingerprint: "fingerprint_missing_trail",
    confidence: 0.5,
    attributes: {
      source_type: "manual"
    },
    export_hints: [],
    created_at: "2026-04-11T00:00:00.000Z",
    updated_at: "2026-04-11T00:00:00.000Z"
  });

  const repair = await runtime.planRepair({
    findingCode: "candidate_missing_decision_trail",
    action: "mark_for_review",
    decidedBy: "test-suite"
  });

  assert.equal(repair.finding_code, "candidate_missing_decision_trail");
  assert.deepEqual(repair.target_record_ids, ["artifact_missing_trail"]);
  assert.equal(repair.dry_run, true);
});

test("standalone runtime can build replay plan from current export", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-replay-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "replay-runtime",
      visibility: "workspace"
    },
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });

  await runtime.reflectDeclaredSource({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      content: "The user prefers concise summaries."
    },
    promoteCandidates: true,
    decidedBy: "test-suite"
  });

  const replay = await runtime.planReplay({
    replayedBy: "test-suite",
    result: "queued"
  });

  assert.equal(replay.result, "queued");
  assert.equal(replay.input_refs.length, 1);
  assert.match(replay.export_id, /^export_/);
});

test("standalone CLI can render repair and replay markdown", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-govern-cli-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "govern-cli",
      visibility: "workspace"
    },
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });

  const sourceResult = await runtime.addSource({
    sourceType: "manual",
    declaredBy: "test",
    content: "repair cli fixture"
  });
  await runtime.registry.persistCandidateArtifact({
    artifact_id: "artifact_cli_missing_trail",
    artifact_type: "candidate_artifact",
    contract_version: "1.0.0",
    state: "candidate",
    namespace: runtime.config.namespace,
    visibility: "workspace",
    title: "candidate:cli-missing-trail",
    summary: "candidate missing trail",
    source_artifact_id: sourceResult.sourceArtifact.artifact_id,
    evidence_refs: [sourceResult.sourceArtifact.artifact_id],
    fingerprint: "fingerprint_cli_missing_trail",
    confidence: 0.5,
    attributes: {
      source_type: "manual"
    },
    export_hints: [],
    created_at: "2026-04-11T00:00:00.000Z",
    updated_at: "2026-04-11T00:00:00.000Z"
  });

  await runtime.reflectDeclaredSource({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      content: "The user prefers clear audit outputs."
    },
    promoteCandidates: true,
    decidedBy: "test-suite"
  });

  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");
  const repairResult = await execFileAsync(
    "node",
    [
      cliPath,
      "govern",
      "repair",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "govern-cli",
      "--finding-code",
      "candidate_missing_decision_trail",
      "--action",
      "mark_for_review",
      "--format",
      "markdown"
    ],
    { cwd: process.cwd() }
  );
  const replayResult = await execFileAsync(
    "node",
    [
      cliPath,
      "govern",
      "replay",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "govern-cli",
      "--format",
      "markdown"
    ],
    { cwd: process.cwd() }
  );

  assert.match(String(repairResult.stdout || ""), /Unified Memory Core Governance Repair/);
  assert.match(String(repairResult.stdout || ""), /artifact_cli_missing_trail/);
  assert.match(String(replayResult.stdout || ""), /Unified Memory Core Governance Replay/);
});
