import test from "node:test";
import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function hasOpenClaw() {
  try {
    execFileSync("openclaw", ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

test(
  "OpenClaw can install the generated release bundle in an isolated profile",
  { skip: !hasOpenClaw() },
  async () => {
    const scriptPath = path.join(process.cwd(), "scripts", "run-openclaw-bundle-install.js");
    const { stdout } = await execFileAsync(
      "node",
      [
        scriptPath,
        "--format",
        "json"
      ],
      {
        cwd: process.cwd(),
        maxBuffer: 32 * 1024 * 1024
      }
    );

    const report = JSON.parse(String(stdout || "").trim());
    assert.equal(report.summary.status, "pass");
    assert.equal(report.summary.failed_checks, 0);
    assert.equal(report.host.context_engine, "unified-memory-core");
    assert.equal(report.host.plugin_status, "loaded");
    assert.ok(report.host.memory_files >= 1);
    assert.ok(report.host.memory_results >= 1);
  }
);
