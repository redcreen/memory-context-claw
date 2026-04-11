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
