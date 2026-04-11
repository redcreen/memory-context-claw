import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { renderExportReport } from "../../src/unified-memory-core/projection-system.js";
import { createStandaloneRuntime } from "../../src/unified-memory-core/standalone-runtime.js";

const execFileAsync = promisify(execFile);

test("renderExportReport renders export summary in markdown", () => {
  const markdown = renderExportReport({
    exportContract: {
      export_id: "export_id1",
      consumer: "generic",
      namespace: {
        tenant: "local",
        scope: "workspace",
        resource: "unified-memory-core",
        key: "demo"
      },
      generated_at: "2026-04-11T00:00:00.000Z",
      metadata: {
        allowed_visibilities: ["workspace"],
        allowed_states: ["stable"]
      }
    },
    exportVersion: "v1",
    artifacts: [
      {
        title: "rule:demo",
        summary: "Keep exports deterministic."
      }
    ],
    payload: {
      artifacts: [
        {
          title: "rule:demo"
        }
      ]
    }
  });

  assert.match(markdown, /Unified Memory Core Export Report/);
  assert.match(markdown, /artifactCount: `1`/);
  assert.match(markdown, /rule:demo: Keep exports deterministic\./);
});

test("standalone runtime can inspect export for a promoted artifact", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-export-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "export-runtime",
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

  const exportResult = await runtime.inspectExport({
    consumer: "generic"
  });

  assert.equal(exportResult.exportContract.consumer, "generic");
  assert.equal(exportResult.artifacts.length, 1);
});

test("standalone CLI can render export inspect markdown", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-standalone-export-cli-"));
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: registryRoot,
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "export-cli",
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

  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");
  const { stdout } = await execFileAsync(
    "node",
    [
      cliPath,
      "export",
      "inspect",
      "--registry-dir",
      registryRoot,
      "--tenant",
      "local",
      "--scope",
      "workspace",
      "--resource",
      "unified-memory-core",
      "--key",
      "export-cli",
      "--consumer",
      "generic",
      "--format",
      "markdown"
    ],
    {
      cwd: process.cwd()
    }
  );

  assert.match(String(stdout || ""), /Unified Memory Core Export Report/);
  assert.match(String(stdout || ""), /artifactCount: `1`/);
});
