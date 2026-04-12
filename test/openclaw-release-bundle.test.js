import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildOpenClawReleaseBundle } from "../scripts/build-openclaw-release-bundle.js";

async function collectFiles(rootDir, currentDir = rootDir) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(rootDir, fullPath));
    } else if (entry.isFile()) {
      files.push(path.relative(rootDir, fullPath).replace(/\\/g, "/"));
    }
  }
  return files.sort();
}

test("buildOpenClawReleaseBundle emits a clean runtime-only archive", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-release-bundle-test-"));

  try {
    const report = await buildOpenClawReleaseBundle({
      repoRoot: process.cwd(),
      outputDir
    });

    const files = await collectFiles(report.bundle_dir);

    assert.equal(report.safety_scan.status, "pass");
    assert.equal(files.includes("index.js"), true);
    assert.equal(files.includes("openclaw.plugin.json"), true);
    assert.equal(files.includes("package.json"), true);
    assert.equal(files.includes("src/retrieval.js"), true);
    assert.equal(files.includes("docs/reference/configuration.md"), true);
    assert.equal(files.includes("docs/reference/formal-memory-policy.md"), true);
    assert.equal(files.includes("docs/workstreams/project/roadmap.md"), true);
    assert.equal(files.some((file) => file.startsWith("scripts/")), false);
    assert.equal(files.some((file) => file.startsWith("test/")), false);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
