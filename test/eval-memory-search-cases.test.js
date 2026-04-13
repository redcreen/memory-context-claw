import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("eval-memory-search-cases can skip builtin OpenClaw search for preflight runs", async () => {
  const scriptPath = path.join(process.cwd(), "scripts", "eval-memory-search-cases.js");
  const { stdout, stderr } = await execFileAsync(
    "node",
    [
      scriptPath,
      "--skip-builtin",
      "--only",
      "food-preference-recall"
    ],
    {
      cwd: process.cwd(),
      maxBuffer: 16 * 1024 * 1024
    }
  );

  const report = JSON.parse(String(stdout || "").trim());

  assert.equal(report.summary.cases, 1);
  assert.equal(report.summary.pluginSignalHits, 1);
  assert.equal(report.results[0].builtin.skipped, true);
  assert.equal(report.results[0].builtin.commandOk, true);
  assert.equal(report.results[0].plugin.expectedSignalsHit, true);
  assert.match(String(stderr || ""), /food-preference-recall/);
});
