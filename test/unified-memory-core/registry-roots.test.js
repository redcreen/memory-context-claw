import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildRegistryRootReport,
  inspectRegistryTopology,
  migrateRegistryRoot,
  resolveRegistryRoot
} from "../../src/unified-memory-core/registry-roots.js";

test("resolveRegistryRoot prefers explicit dir, then env, then canonical, then legacy fallback", () => {
  const canonicalDir = "/tmp/canonical";
  const legacyDir = "/tmp/legacy";
  const existing = new Set([canonicalDir, legacyDir]);
  const exists = (targetPath) => existing.has(targetPath);

  const explicit = resolveRegistryRoot({
    explicitDir: "/tmp/explicit",
    canonicalRegistryDir: canonicalDir,
    legacyRegistryDir: legacyDir,
    exists
  });
  assert.equal(explicit.registryDir, "/tmp/explicit");
  assert.equal(explicit.source, "explicit");

  const env = resolveRegistryRoot({
    env: {
      UMC_REGISTRY_DIR: "/tmp/from-env"
    },
    canonicalRegistryDir: canonicalDir,
    legacyRegistryDir: legacyDir,
    exists
  });
  assert.equal(env.registryDir, "/tmp/from-env");
  assert.equal(env.source, "env");

  const canonical = resolveRegistryRoot({
    canonicalRegistryDir: canonicalDir,
    legacyRegistryDir: legacyDir,
    exists
  });
  assert.equal(canonical.registryDir, canonicalDir);
  assert.equal(canonical.source, "canonical");
  assert.equal(canonical.usedCompatibilityFallback, false);
});

test("resolveRegistryRoot uses legacy fallback only when canonical root is absent", () => {
  const canonicalDir = "/tmp/canonical";
  const legacyDir = "/tmp/legacy";
  const exists = (targetPath) => targetPath === legacyDir;

  const resolution = resolveRegistryRoot({
    canonicalRegistryDir: canonicalDir,
    legacyRegistryDir: legacyDir,
    exists
  });

  assert.equal(resolution.registryDir, legacyDir);
  assert.equal(resolution.source, "legacy_fallback");
  assert.equal(resolution.usedCompatibilityFallback, true);
});

test("buildRegistryRootReport exposes operator-visible resolution details", () => {
  const report = buildRegistryRootReport({
    env: {
      UMC_REGISTRY_DIR: "/tmp/umc-registry"
    }
  });

  assert.equal(report.registry_dir, "/tmp/umc-registry");
  assert.equal(report.source, "env");
  assert.equal(typeof report.canonical_registry_dir, "string");
  assert.equal(typeof report.legacy_openclaw_registry_dir, "string");
});

test("inspectRegistryTopology reports legacy fallback and root divergence", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-topology-"));
  const canonicalDir = path.join(tempRoot, "canonical");
  const legacyDir = path.join(tempRoot, "legacy");
  await fs.mkdir(canonicalDir, { recursive: true });
  await fs.mkdir(legacyDir, { recursive: true });
  await fs.writeFile(path.join(canonicalDir, "records.jsonl"), '{"record_id":"a"}\n', "utf8");
  await fs.writeFile(path.join(legacyDir, "records.jsonl"), '{"record_id":"b"}\n', "utf8");

  const report = await inspectRegistryTopology({
    canonicalRegistryDir: canonicalDir,
    legacyRegistryDir: legacyDir,
    exists: (targetPath) => targetPath === legacyDir
  });

  assert.equal(report.summary.active_source, "legacy_fallback");
  assert.equal(report.summary.migration_needed, true);
  assert.equal(report.summary.operator_policy, "migrate_to_canonical_root");
  assert.equal(report.summary.consistency_gate, "block");
  assert.ok(report.findings.some((finding) => finding.code === "active_root_uses_legacy_fallback"));
  assert.ok(report.findings.some((finding) => finding.code === "registry_roots_diverged"));
});

test("inspectRegistryTopology treats canonical-active divergence as advisory after cutover", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-cutover-"));
  const canonicalDir = path.join(tempRoot, "canonical");
  const legacyDir = path.join(tempRoot, "legacy");
  await fs.mkdir(canonicalDir, { recursive: true });
  await fs.mkdir(legacyDir, { recursive: true });
  await fs.writeFile(
    path.join(canonicalDir, "records.jsonl"),
    ['{"record_id":"canonical-1"}', '{"record_id":"canonical-2"}'].join("\n") + "\n",
    "utf8"
  );
  await fs.writeFile(path.join(legacyDir, "records.jsonl"), '{"record_id":"legacy-1"}\n', "utf8");

  const report = await inspectRegistryTopology({
    canonicalRegistryDir: canonicalDir,
    legacyRegistryDir: legacyDir
  });

  assert.equal(report.summary.active_source, "canonical");
  assert.equal(report.summary.cutover_ready, true);
  assert.equal(report.summary.operator_policy, "adopt_canonical_root");
  assert.equal(report.summary.consistency_gate, "advisory");
  assert.ok(report.findings.some((finding) => finding.code === "registry_roots_diverged"));
  assert.ok(report.findings.some((finding) => finding.code === "canonical_root_adopted"));
});

test("migrateRegistryRoot can dry-run and then apply a non-destructive legacy to canonical merge", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-migrate-"));
  const canonicalDir = path.join(tempRoot, "canonical");
  const legacyDir = path.join(tempRoot, "legacy");
  await fs.mkdir(legacyDir, { recursive: true });
  await fs.writeFile(
    path.join(legacyDir, "records.jsonl"),
    ['{"record_id":"legacy-1"}', '{"record_id":"legacy-2"}'].join("\n") + "\n",
    "utf8"
  );
  await fs.writeFile(path.join(legacyDir, "decision-trails.jsonl"), '{"decision_id":"trail-1"}\n', "utf8");

  const dryRun = await migrateRegistryRoot({
    canonicalRegistryDir: canonicalDir,
    legacyRegistryDir: legacyDir
  });
  assert.equal(dryRun.apply, false);
  assert.equal(dryRun.noop, false);
  assert.equal(dryRun.added_records, 2);
  assert.equal(dryRun.added_decision_trails, 1);

  const applied = await migrateRegistryRoot({
    canonicalRegistryDir: canonicalDir,
    legacyRegistryDir: legacyDir,
    apply: true
  });
  assert.equal(applied.apply, true);
  assert.equal(applied.added_records, 2);

  const records = await fs.readFile(path.join(canonicalDir, "records.jsonl"), "utf8");
  const decisionTrails = await fs.readFile(path.join(canonicalDir, "decision-trails.jsonl"), "utf8");
  assert.match(records, /legacy-1/);
  assert.match(records, /legacy-2/);
  assert.match(decisionTrails, /trail-1/);

  const secondRun = await migrateRegistryRoot({
    canonicalRegistryDir: canonicalDir,
    legacyRegistryDir: legacyDir,
    apply: true
  });
  assert.equal(secondRun.noop, true);
  assert.equal(secondRun.added_records, 0);
  assert.equal(secondRun.added_decision_trails, 0);
});
