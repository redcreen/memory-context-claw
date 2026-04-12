import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { createStandaloneRuntime } from "../../src/unified-memory-core/standalone-runtime.js";

const execFileAsync = promisify(execFile);

async function createMixedSourceFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage5-fixture-"));
  const filePath = path.join(root, "notes.md");
  const directoryPath = path.join(root, "workspace");
  const imagePath = path.join(root, "signal.png");
  const sourcesFile = path.join(root, "sources.json");

  await fs.mkdir(directoryPath, { recursive: true });
  await fs.writeFile(filePath, "Prefer tests and docs when behavior changes.\n", "utf8");
  await fs.writeFile(path.join(directoryPath, "MEMORY.md"), "workspace memory root\n", "utf8");
  await fs.writeFile(path.join(directoryPath, "notes.md"), "daily note\n", "utf8");
  await fs.writeFile(
    imagePath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1+L1EAAAAASUVORK5CYII=",
      "base64"
    )
  );

  const declaredSources = [
    {
      sourceType: "manual",
      content: "Remember this: the user prefers concise progress reports."
    },
    {
      sourceType: "file",
      path: filePath
    },
    {
      sourceType: "directory",
      path: directoryPath
    },
    {
      sourceType: "url",
      url: "https://example.com/stage5",
      content: "Maintenance workflows should stay scriptable and reproducible."
    },
    {
      sourceType: "image",
      path: imagePath,
      altText: "Compact terminal-first maintenance diagram."
    }
  ];

  await fs.writeFile(
    sourcesFile,
    JSON.stringify({ declaredSources }, null, 2),
    "utf8"
  );

  return {
    root,
    filePath,
    directoryPath,
    imagePath,
    sourcesFile,
    declaredSources
  };
}

test("standalone runtime can close a passing Stage 5 acceptance report", async () => {
  const fixture = await createMixedSourceFixture();
  const registryRoot = path.join(fixture.root, "registry");
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "stage5-runtime",
      visibility: "workspace"
    },
    clock: () => new Date("2026-04-20T00:00:00.000Z")
  });

  const report = await runtime.runStage5Acceptance({
    declaredSources: fixture.declaredSources.map((item) => ({
      ...item,
      declaredBy: "stage5-test",
      namespace: {
        tenant: "local",
        scope: "workspace",
        resource: "unified-memory-core",
        key: "stage5-runtime"
      },
      visibility: "workspace"
    })),
    repoRoot: process.cwd(),
    splitTargetDir: path.join(fixture.root, "split-target")
  });

  assert.equal(report.summary.status, "pass");
  assert.equal(report.reproducibility.summary.failed_consumers, 0);
  assert.equal(
    report.checks.find((check) => check.code === "source_adapter_coverage")?.status,
    "pass"
  );
});

test("standalone CLI can run maintenance workflow from a sources file", async () => {
  const fixture = await createMixedSourceFixture();
  const registryRoot = path.join(fixture.root, "registry-cli");
  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");

  const { stdout } = await execFileAsync(
    "node",
    [
      cliPath,
      "maintenance",
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
      "stage5-cli",
      "--sources-file",
      fixture.sourcesFile,
      "--format",
      "markdown"
    ],
    { cwd: process.cwd() }
  );

  assert.match(String(stdout || ""), /Unified Memory Core Maintenance Workflow/);
  assert.match(String(stdout || ""), /Source Coverage/);
});

test("stage5 acceptance wrapper renders markdown", async () => {
  const scriptPath = path.join(process.cwd(), "scripts", "run-stage5-acceptance.js");
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage5-script-"));
  const splitTargetDir = path.join(registryRoot, "split-target");
  const { stdout } = await execFileAsync(
    "node",
    [
      scriptPath,
      "--registry-dir",
      registryRoot,
      "--target-dir",
      splitTargetDir,
      "--format",
      "markdown"
    ],
    { cwd: process.cwd() }
  );

  assert.match(String(stdout || ""), /Unified Memory Core Stage 5 Acceptance/);
  assert.match(String(stdout || ""), /source_adapter_coverage/);
});
