import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  createIndependentExecutionReview,
  renderIndependentExecutionReview
} from "../../src/unified-memory-core/independent-execution.js";

const execFileAsync = promisify(execFile);

async function createFixtureRepo() {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-independent-"));
  await fs.mkdir(path.join(repoRoot, "docs", "unified-memory-core"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, "src", "unified-memory-core"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, "test", "unified-memory-core"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, "evals"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, "scripts"), { recursive: true });
  await fs.writeFile(
    path.join(repoRoot, "package.json"),
    JSON.stringify({
      scripts: {
        "umc:cli": "node scripts/unified-memory-core-cli.js",
        "umc:daily-reflection": "node scripts/run-daily-reflection.js"
      }
    }, null, 2),
    "utf8"
  );
  await fs.writeFile(path.join(repoRoot, "scripts", "unified-memory-core-cli.js"), "", "utf8");
  await fs.writeFile(path.join(repoRoot, "src", "openclaw-adapter.js"), "", "utf8");
  await fs.writeFile(path.join(repoRoot, "src", "codex-adapter.js"), "", "utf8");
  await fs.writeFile(path.join(repoRoot, "src", "unified-memory-core", "contracts.js"), "", "utf8");
  await fs.writeFile(path.join(repoRoot, "src", "unified-memory-core", "projection-system.js"), "", "utf8");
  await fs.writeFile(path.join(repoRoot, "src", "unified-memory-core", "governance-system.js"), "", "utf8");
  await fs.writeFile(path.join(repoRoot, "src", "unified-memory-core", "memory-registry.js"), "", "utf8");
  await fs.writeFile(path.join(repoRoot, "src", "unified-memory-core", "standalone-runtime.js"), "", "utf8");
  await fs.writeFile(path.join(repoRoot, "src", "unified-memory-core", "adapter-bridges.js"), "", "utf8");
  return repoRoot;
}

test("independent execution review summarizes split readiness from repo facts", async () => {
  const repoRoot = await createFixtureRepo();
  const review = await createIndependentExecutionReview({
    repoRoot,
    clock: () => new Date("2026-04-11T00:00:00.000Z"),
    idGenerator: (() => {
      let index = 0;
      return () => `id${++index}`;
    })()
  });

  assert.equal(review.readiness_checks.contracts_are_portable.status, "ready");
  assert.equal(review.readiness_checks.adapter_boundaries_explicit.status, "ready");
  assert.equal(review.readiness_checks.repo_layout_matches_target.status, "ready");
  assert.equal(review.migration_checklist.length, 4);
});

test("independent execution review renders markdown", async () => {
  const markdown = renderIndependentExecutionReview({
    review_id: "independent_review_id1",
    generated_at: "2026-04-11T00:00:00.000Z",
    repo_root: "/tmp/demo",
    readiness_checks: {
      contracts_are_portable: {
        status: "ready",
        evidence: ["portable contract files present"]
      }
    },
    ownership_map: {
      product_core: {
        responsibility: "portable contracts"
      }
    },
    release_boundary: {
      current_release_unit: "single repo incubation with product core and adapters shipped together",
      product_boundary: "Unified Memory Core contracts",
      adapter_boundary: "OpenClaw adapter and Codex adapter consume portable exports"
    }
  });

  assert.match(markdown, /Unified Memory Core Independent Execution Review/);
  assert.match(markdown, /contracts_are_portable: `ready`/);
  assert.match(markdown, /product_core: portable contracts/);
});

test("CLI can render independent execution review in markdown", async () => {
  const cliPath = path.join(process.cwd(), "scripts", "unified-memory-core-cli.js");
  const { stdout } = await execFileAsync(
    "node",
    [
      cliPath,
      "review",
      "independent-execution",
      "--repo-root",
      process.cwd(),
      "--format",
      "markdown"
    ],
    {
      cwd: process.cwd()
    }
  );

  assert.match(String(stdout || ""), /Unified Memory Core Independent Execution Review/);
  assert.match(String(stdout || ""), /repo_layout_matches_target/);
});
