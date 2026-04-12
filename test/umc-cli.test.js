import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const umcPath = path.join(repoRoot, "umc");

function runUmc(args, options = {}) {
  return spawnSync(process.execPath, [umcPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options
  });
}

test("umc where prints wrapper and backend paths", () => {
  const result = runUmc(["where"]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.umc, umcPath);
  assert.match(payload.backend, /unified-memory-core-cli\.js|portable-cli\.js/);
  assert.match(payload.mode, /full|portable/);
});

test("umc -h renders grouped top-level help", () => {
  const result = runUmc(["--no-cli-path", "-h"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: umc \[options\] \[command\]/);
  assert.match(result.stdout, /Commands:/);
  assert.match(result.stdout, /source \*/);
  assert.match(result.stdout, /Examples:/);
});

test("umc source without a subcommand renders grouped help", () => {
  const result = runUmc(["--no-cli-path", "source"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: umc source \[options\] \[command\]/);
  assert.match(result.stdout, /Persist one declared source artifact/);
});

test("umc help source add renders command-specific help", () => {
  const result = runUmc(["--no-cli-path", "help", "source", "add"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: umc source add \[options\]/);
  assert.match(result.stdout, /Persist one declared source artifact/);
  assert.match(result.stdout, /Examples:/);
});

test("portable top-level help hides full-only commands", () => {
  const result = runUmc(["--no-cli-path", "--help"], {
    env: {
      ...process.env,
      UMC_CLI_FORCE_PORTABLE: "1"
    }
  });

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /release \*/);
  assert.doesNotMatch(result.stdout, /verify release-preflight/);
  assert.match(result.stdout, /verify \*/);
});

test("umc source add delegates to the full cli backend", async () => {
  const registryDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-full-cli-"));
  const result = runUmc([
    "--no-cli-path",
    "source",
    "add",
    "--registry-dir",
    registryDir,
    "--source-type",
    "manual",
    "--content",
    "Remember this: full cli wrapper test."
  ]);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.sourceArtifact.source_type, "manual");
  assert.equal(payload.sourceRecord.state, "source_artifact");
});

test("umc source add can fall back to the portable cli backend", async () => {
  const registryDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-portable-cli-"));
  const result = runUmc([
    "--no-cli-path",
    "source",
    "add",
    "--registry-dir",
    registryDir,
    "--source-type",
    "manual",
    "--content",
    "Remember this: portable cli wrapper test."
  ], {
    env: {
      ...process.env,
      UMC_CLI_FORCE_PORTABLE: "1"
    }
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.sourceArtifact.source_type, "manual");
  assert.equal(payload.sourceRecord.state, "source_artifact");
});

test("umc source add accepts structured accepted_action sources", async () => {
  const registryDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-action-cli-"));
  const result = runUmc([
    "--no-cli-path",
    "source",
    "add",
    "--registry-dir",
    registryDir,
    "--source-type",
    "accepted_action",
    "--action-type",
    "publish_site",
    "--status",
    "succeeded",
    "--accepted",
    "true",
    "--succeeded",
    "true",
    "--agent-id",
    "code",
    "--targets",
    "redcreen/redcreen.github.io,https://redcreen.github.io/demo/",
    "--artifacts",
    "dist/index.html",
    "--content",
    "User accepted the publish target."
  ]);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.sourceArtifact.source_type, "accepted_action");
  assert.equal(payload.sourceArtifact.normalized_payload.action_type, "publish_site");
  assert.equal(payload.sourceArtifact.normalized_payload.execution_succeeded, true);
  assert.match(payload.sourceArtifact.normalized_payload.text, /publish target/);
});

test("umc learn lifecycle-run promotes accepted_action signals through the governed loop", async () => {
  const registryDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-action-lifecycle-"));
  const result = runUmc([
    "--no-cli-path",
    "learn",
    "lifecycle-run",
    "--registry-dir",
    registryDir,
    "--source-type",
    "accepted_action",
    "--action-type",
    "publish_site",
    "--status",
    "succeeded",
    "--accepted",
    "true",
    "--succeeded",
    "true",
    "--agent-id",
    "code",
    "--targets",
    "redcreen/redcreen.github.io,https://redcreen.github.io/brain-reinstall-jingangjing/",
    "--artifacts",
    "dist/index.html",
    "--content",
    "User accepted the publish target and the site release succeeded."
  ]);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.lifecycle.promotedStableArtifacts.length, 1);
  assert.equal(payload.learning_audit.summary.stable_learning_artifacts, 1);
  assert.match(
    payload.lifecycle.promotedStableArtifacts[0].stableArtifact.summary,
    /redcreen\/redcreen\.github\.io/
  );
  assert.equal(
    payload.lifecycle.promotedStableArtifacts[0].stableArtifact.attributes.source_type,
    "accepted_action"
  );
});
