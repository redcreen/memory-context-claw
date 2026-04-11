import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  createContractId,
  createContractTimestamp
} from "./contracts.js";

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(targetPath) {
  const raw = await fs.readFile(targetPath, "utf8");
  return JSON.parse(raw);
}

function toStatus(passed) {
  return passed ? "ready" : "needs_followup";
}

function normalizeList(values) {
  return values.filter(Boolean);
}

function buildOwnershipMap() {
  return {
    product_core: {
      responsibility: "portable contracts, registry, reflection, projection, governance, standalone runtime",
      paths: [
        "src/unified-memory-core/",
        "scripts/unified-memory-core-cli.js",
        "scripts/run-daily-reflection.js",
        "docs/unified-memory-core/"
      ]
    },
    openclaw_adapter: {
      responsibility: "OpenClaw-facing runtime integration and context assembly consumption boundary",
      paths: [
        "src/openclaw-adapter.js",
        "src/plugin/index.js",
        "src/engine.js",
        "src/scoring.js"
      ]
    },
    codex_adapter: {
      responsibility: "Codex-facing read-before-task and write-after-task integration boundary",
      paths: [
        "src/codex-adapter.js"
      ]
    },
    shared_eval_and_regression: {
      responsibility: "cross-surface regression coverage and migration confidence",
      paths: [
        "test/unified-memory-core/",
        "test/openclaw-adapter.test.js",
        "test/codex-adapter.test.js",
        "test/adapter-compatibility.test.js"
      ]
    }
  };
}

function buildReleaseBoundary() {
  return {
    current_release_unit: "single repo incubation with product core and adapters shipped together",
    product_boundary: "Unified Memory Core contracts, registry, reflection, projection, governance, and standalone operations",
    adapter_boundary: "OpenClaw adapter and Codex adapter consume portable exports through explicit boundaries",
    split_readiness_rule:
      "a future repo split is allowed only if portable contracts, standalone commands, and adapter boundaries remain unchanged for consumers",
    deferred_items: [
      "runtime API service",
      "multi-host network service",
      "advanced self-learning policy adaptation"
    ]
  };
}

function buildMigrationChecklist(readinessChecks) {
  return [
    {
      item: "freeze portable contract surface before split",
      status: readinessChecks.contracts_are_portable.status
    },
    {
      item: "keep standalone command surface available outside adapters",
      status: readinessChecks.standalone_operations_available.status
    },
    {
      item: "keep adapter integration paths explicit and isolated",
      status: readinessChecks.adapter_boundaries_explicit.status
    },
    {
      item: "align repo layout with future core/adapter split shape",
      status: readinessChecks.repo_layout_matches_target.status
    }
  ];
}

export function renderIndependentExecutionReview(review, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(review, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Independent Execution Review");
  lines.push(`- reviewId: \`${review.review_id}\``);
  lines.push(`- generatedAt: \`${review.generated_at}\``);
  lines.push(`- repoRoot: \`${review.repo_root}\``);
  lines.push("");
  lines.push("## Checklist");
  for (const [key, item] of Object.entries(review.readiness_checks)) {
    lines.push(`- ${key}: \`${item.status}\``);
    for (const evidence of item.evidence) {
      lines.push(`  ${evidence}`);
    }
  }
  lines.push("");
  lines.push("## Ownership");
  for (const [key, entry] of Object.entries(review.ownership_map)) {
    lines.push(`- ${key}: ${entry.responsibility}`);
  }
  lines.push("");
  lines.push("## Release Boundary");
  lines.push(`- currentReleaseUnit: \`${review.release_boundary.current_release_unit}\``);
  lines.push(`- productBoundary: ${review.release_boundary.product_boundary}`);
  lines.push(`- adapterBoundary: ${review.release_boundary.adapter_boundary}`);
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export async function createIndependentExecutionReview(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const idGenerator = options.idGenerator || randomUUID;
  const clock = options.clock || (() => new Date());

  const packageJsonPath = path.join(repoRoot, "package.json");
  const packageJson = await readJsonFile(packageJsonPath);

  const checks = {
    contracts_are_portable: {
      status: "needs_followup",
      evidence: []
    },
    artifacts_are_portable: {
      status: "needs_followup",
      evidence: []
    },
    standalone_operations_available: {
      status: "needs_followup",
      evidence: []
    },
    adapter_boundaries_explicit: {
      status: "needs_followup",
      evidence: []
    },
    repo_layout_matches_target: {
      status: "needs_followup",
      evidence: []
    }
  };

  const contractFiles = normalizeList([
    await exists(path.join(repoRoot, "src", "unified-memory-core", "contracts.js")) ? "src/unified-memory-core/contracts.js" : "",
    await exists(path.join(repoRoot, "src", "unified-memory-core", "projection-system.js")) ? "src/unified-memory-core/projection-system.js" : "",
    await exists(path.join(repoRoot, "src", "unified-memory-core", "governance-system.js")) ? "src/unified-memory-core/governance-system.js" : ""
  ]);
  checks.contracts_are_portable.status = toStatus(contractFiles.length === 3);
  checks.contracts_are_portable.evidence = [
    `portable contract files present: ${contractFiles.join(", ") || "none"}`
  ];

  const portableArtifactFiles = normalizeList([
    await exists(path.join(repoRoot, "src", "unified-memory-core", "memory-registry.js")) ? "src/unified-memory-core/memory-registry.js" : "",
    await exists(path.join(repoRoot, "src", "unified-memory-core", "projection-system.js")) ? "src/unified-memory-core/projection-system.js" : "",
    await exists(path.join(repoRoot, "src", "unified-memory-core", "standalone-runtime.js")) ? "src/unified-memory-core/standalone-runtime.js" : ""
  ]);
  checks.artifacts_are_portable.status = toStatus(portableArtifactFiles.length === 3);
  checks.artifacts_are_portable.evidence = [
    `artifact portability files present: ${portableArtifactFiles.join(", ") || "none"}`
  ];

  const standaloneScripts = normalizeList([
    packageJson.scripts?.["umc:cli"] ? "package.json:scripts.umc:cli" : "",
    packageJson.scripts?.["umc:daily-reflection"] ? "package.json:scripts.umc:daily-reflection" : "",
    await exists(path.join(repoRoot, "scripts", "unified-memory-core-cli.js")) ? "scripts/unified-memory-core-cli.js" : ""
  ]);
  checks.standalone_operations_available.status = toStatus(standaloneScripts.length === 3);
  checks.standalone_operations_available.evidence = [
    `standalone command surface present: ${standaloneScripts.join(", ") || "none"}`
  ];

  const adapterBoundaryFiles = normalizeList([
    await exists(path.join(repoRoot, "src", "openclaw-adapter.js")) ? "src/openclaw-adapter.js" : "",
    await exists(path.join(repoRoot, "src", "codex-adapter.js")) ? "src/codex-adapter.js" : "",
    await exists(path.join(repoRoot, "src", "unified-memory-core", "adapter-bridges.js")) ? "src/unified-memory-core/adapter-bridges.js" : ""
  ]);
  checks.adapter_boundaries_explicit.status = toStatus(adapterBoundaryFiles.length === 3);
  checks.adapter_boundaries_explicit.evidence = [
    `adapter boundary files present: ${adapterBoundaryFiles.join(", ") || "none"}`
  ];

  const layoutMatches = [
    await exists(path.join(repoRoot, "docs", "unified-memory-core")),
    await exists(path.join(repoRoot, "src", "unified-memory-core")),
    await exists(path.join(repoRoot, "test", "unified-memory-core")),
    await exists(path.join(repoRoot, "evals"))
  ].every(Boolean);
  checks.repo_layout_matches_target.status = toStatus(layoutMatches);
  checks.repo_layout_matches_target.evidence = [
    `docs/unified-memory-core present: ${await exists(path.join(repoRoot, "docs", "unified-memory-core"))}`,
    `src/unified-memory-core present: ${await exists(path.join(repoRoot, "src", "unified-memory-core"))}`,
    `test/unified-memory-core present: ${await exists(path.join(repoRoot, "test", "unified-memory-core"))}`,
    `evals present: ${await exists(path.join(repoRoot, "evals"))}`
  ];

  return {
    review_id: createContractId("independent_review", idGenerator),
    contract_version: SHARED_CONTRACT_VERSION,
    generated_at: createContractTimestamp(clock),
    repo_root: repoRoot,
    readiness_checks: checks,
    ownership_map: buildOwnershipMap(),
    release_boundary: buildReleaseBoundary(),
    migration_checklist: buildMigrationChecklist(checks)
  };
}
