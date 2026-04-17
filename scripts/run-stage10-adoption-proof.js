#!/usr/bin/env node

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";

import { createCodexAdapterRuntime } from "../src/codex-adapter.js";
import { createOpenClawAdapterRuntime } from "../src/openclaw-adapter.js";
import { createMemoryRegistry } from "../src/unified-memory-core/memory-registry.js";

const execFileAsync = promisify(execFile);

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    format: "markdown"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      options.repoRoot = path.resolve(argv[++index]);
    } else if (arg === "--format") {
      options.format = normalizeString(argv[++index], "markdown");
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/run-stage10-adoption-proof.js [options]",
          "",
          "Options:",
          "  --repo-root <path>   Repo root to inspect (default: cwd)",
          "  --format <mode>      markdown|json (default: markdown)",
          "  --help               Show this message"
        ].join("\n")
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

async function runTimedCommand(command, args, { cwd, env } = {}) {
  const started = performance.now();
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      env,
      maxBuffer: 32 * 1024 * 1024
    });
    return {
      ok: true,
      duration_ms: Math.round(performance.now() - started),
      stdout: String(result.stdout || ""),
      stderr: String(result.stderr || "")
    };
  } catch (error) {
    return {
      ok: false,
      duration_ms: Math.round(performance.now() - started),
      stdout: String(error.stdout || ""),
      stderr: String(error.stderr || ""),
      code: Number(error.code || 1),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function buildCheck({ code, passed, expected, actual, message }) {
  return {
    code,
    status: passed ? "pass" : "fail",
    expected,
    actual,
    message
  };
}

function buildSummary(checks) {
  const passed_checks = checks.filter((check) => check.status === "pass").length;
  const failed_checks = checks.filter((check) => check.status === "fail").length;
  return {
    status: failed_checks === 0 ? "pass" : "fail",
    total_checks: checks.length,
    passed_checks,
    failed_checks
  };
}

async function measurePackageFootprint(repoRoot) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage10-pack-"));
  try {
    const pack = await runTimedCommand(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", tempDir],
      { cwd: repoRoot }
    );
    if (!pack.ok) {
      return {
        status: "failed",
        duration_ms: pack.duration_ms,
        error: pack.error || pack.stderr || "npm pack failed"
      };
    }
    const payload = JSON.parse(pack.stdout.trim());
    const item = Array.isArray(payload) ? payload[0] : payload;
    const archivePath = path.join(tempDir, item.filename);
    const archiveStat = await fs.stat(archivePath);
    return {
      status: "pass",
      duration_ms: pack.duration_ms,
      filename: item.filename,
      tarball_bytes: archiveStat.size,
      package_size: item.size,
      unpacked_size: item.unpackedSize,
      entry_count: item.entryCount,
      bundled_files: item.files?.length || null
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function measureCliCosts(repoRoot) {
  const startup = await runTimedCommand("node", ["./umc", "--no-cli-path", "where"], {
    cwd: repoRoot
  });
  const firstRunRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage10-first-run-"));
  const inspect = await runTimedCommand(
    "node",
    ["./umc", "--no-cli-path", "registry", "inspect", "--registry-dir", path.join(firstRunRoot, "registry"), "--format", "json"],
    { cwd: repoRoot }
  );
  await fs.rm(firstRunRoot, { recursive: true, force: true }).catch(() => {});

  return {
    startup: {
      status: startup.ok ? "pass" : "failed",
      duration_ms: startup.duration_ms,
      payload: startup.ok ? JSON.parse(startup.stdout) : null,
      error: startup.ok ? "" : startup.error || startup.stderr || "failed"
    },
    first_run_registry_inspect: {
      status: inspect.ok ? "pass" : "failed",
      duration_ms: inspect.duration_ms,
      payload: inspect.ok ? JSON.parse(inspect.stdout) : null,
      error: inspect.ok ? "" : inspect.error || inspect.stderr || "failed"
    }
  };
}

async function proveCodexSharedFoundation() {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage10-codex-"));
  const clock = () => new Date("2026-04-18T00:00:00.000Z");
  const workspaceId = "stage10-shared-foundation";
  const agentId = "code";
  try {
    const codexRuntime = createCodexAdapterRuntime({
      clock,
      logger: { info() {} },
      config: {
        registryDir: registryRoot,
        scope: "workspace",
        resource: "openclaw-shared-memory",
        workspaceId,
        agentId,
        agentNamespaceEnabled: true,
        allowedVisibilities: ["workspace", "shared"]
      }
    });

    const persisted = await codexRuntime.writeAfterTask({
      taskId: "stage10_codex_shared_foundation",
      taskTitle: "Persist GitHub PR comment preference",
      summary: "Persist durable GitHub PR comment preference",
      details: "Use the GitHub PR comment tool when drafting PR comment replies.",
      visibility: "workspace",
      scope: "workspace",
      resource: "openclaw-shared-memory",
      workspaceId,
      agentId,
      agentNamespaceEnabled: true,
      memoryExtraction: {
        should_write_memory: true,
        category: "tool_routing_preference",
        durability: "durable",
        confidence: 0.95,
        summary: "When drafting GitHub PR comments, prefer the github_pr_comment tool.",
        user_message: "When you need to draft a GitHub PR comment, use the GitHub PR comment tool.",
        assistant_reply: "Understood.",
        structured_rule: {
          trigger: {
            content_kind: "tool_routing_preference",
            domains: ["github", "pull_request"]
          },
          action: {
            tool: "github_pr_comment"
          }
        }
      }
    });

    const openclawRuntime = createOpenClawAdapterRuntime({
      pluginConfig: {
        openclawAdapter: {
          governedExports: {
            registryDir: registryRoot,
            workspaceId,
            scope: "workspace",
            resource: "openclaw-shared-memory",
            allowedVisibilities: ["workspace", "shared"],
            agentNamespace: {
              enabled: true
            }
          }
        }
      }
    });

    const context = await openclawRuntime.loadGovernedContext({
      query: "How should I handle GitHub PR comments?",
      agentId,
      maxCandidates: 4
    });

    const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
    const records = await registry.listRecords();
    const trails = await registry.listDecisionTrails();
    const candidateSnippet = context.candidates.map((candidate) => candidate.snippet).join("\n");
    const passed =
      (persisted.memory_extraction?.promoted?.length || 0) >= 1
      && context.candidates.length >= 1
      && /github_pr_comment|GitHub PR comment/u.test(candidateSnippet);

    return {
      status: passed ? "pass" : "fail",
      workspace_id: workspaceId,
      agent_id: agentId,
      registry_root: registryRoot,
      promoted: persisted.memory_extraction?.promoted?.length || 0,
      candidate_count: context.candidates.length,
      policy_input_count: context.policyContext.policy_inputs.length,
      top_candidate_snippet: context.candidates[0]?.snippet || "",
      record_count: records.length,
      decision_trail_count: trails.length
    };
  } finally {
    await fs.rm(registryRoot, { recursive: true, force: true }).catch(() => {});
  }
}

async function proveMultiInstanceSharedMemory() {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage10-multi-"));
  const clock = () => new Date("2026-04-18T00:00:00.000Z");
  const workspaceId = "stage10-multi-instance";
  const baseConfig = {
    registryDir: registryRoot,
    scope: "workspace",
    resource: "openclaw-shared-memory",
    workspaceId,
    agentNamespaceEnabled: false,
    allowedVisibilities: ["workspace", "shared"]
  };

  try {
    const codexRuntimeA = createCodexAdapterRuntime({
      clock,
      logger: { info() {} },
      config: { ...baseConfig, userId: "alice" }
    });
    const codexRuntimeB = createCodexAdapterRuntime({
      clock,
      logger: { info() {} },
      config: { ...baseConfig, userId: "bob" }
    });

    await Promise.all([
      codexRuntimeA.writeAfterTask({
        taskId: "stage10_multi_a",
        taskTitle: "Persist concise progress rule",
        summary: "Persist concise progress rule",
        visibility: "workspace",
        ...baseConfig,
        memoryExtraction: {
          should_write_memory: true,
          category: "durable_rule",
          durability: "durable",
          confidence: 0.94,
          summary: "Keep progress updates concise and bullet-first.",
          user_message: "Keep progress updates concise and bullet-first.",
          assistant_reply: "Understood."
        }
      }),
      codexRuntimeB.writeAfterTask({
        taskId: "stage10_multi_b",
        taskTitle: "Persist async updates preference",
        summary: "Persist async updates preference",
        visibility: "workspace",
        ...baseConfig,
        memoryExtraction: {
          should_write_memory: true,
          category: "user_profile_fact",
          durability: "durable",
          confidence: 0.92,
          summary: "Prefer async written updates over live calls.",
          user_message: "Prefer async written updates over live calls.",
          assistant_reply: "Understood."
        }
      })
    ]);

    const openclawRuntime = createOpenClawAdapterRuntime({
      pluginConfig: {
        openclawAdapter: {
          governedExports: {
            registryDir: registryRoot,
            workspaceId,
            scope: "workspace",
            resource: "openclaw-shared-memory",
            allowedVisibilities: ["workspace", "shared"]
          }
        }
      }
    });

    const context = await openclawRuntime.loadGovernedContext({
      query: "How should I communicate updates?",
      maxCandidates: 10
    });

    const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
    const records = await registry.listRecords();
    const trails = await registry.listDecisionTrails();
    const snippets = context.candidates.map((candidate) => candidate.snippet);
    const passed =
      snippets.some((snippet) => /concise and bullet-first/u.test(snippet))
      && snippets.some((snippet) => /async written updates/u.test(snippet))
      && context.policyContext.policy_inputs.length >= 2;

    return {
      status: passed ? "pass" : "fail",
      workspace_id: workspaceId,
      registry_root: registryRoot,
      candidate_count: context.candidates.length,
      policy_input_count: context.policyContext.policy_inputs.length,
      snippets,
      record_count: records.length,
      decision_trail_count: trails.length
    };
  } finally {
    await fs.rm(registryRoot, { recursive: true, force: true }).catch(() => {});
  }
}

export async function runStage10AdoptionProof({
  repoRoot = process.cwd()
} = {}) {
  const packageFootprint = await measurePackageFootprint(repoRoot);
  const cliCosts = await measureCliCosts(repoRoot);
  const codexSharedFoundation = await proveCodexSharedFoundation();
  const multiInstanceSharedMemory = await proveMultiInstanceSharedMemory();

  const checks = [
    buildCheck({
      code: "package_footprint_measured",
      passed: packageFootprint.status === "pass",
      expected: "package tarball metrics captured",
      actual: packageFootprint.status === "pass"
        ? `${packageFootprint.tarball_bytes} bytes`
        : packageFootprint.error || "failed",
      message: "package size is visible on the Stage 10 evidence surface"
    }),
    buildCheck({
      code: "cli_startup_measured",
      passed: cliCosts.startup.status === "pass",
      expected: "CLI startup timing captured",
      actual: cliCosts.startup.status === "pass"
        ? `${cliCosts.startup.duration_ms}ms`
        : cliCosts.startup.error || "failed",
      message: "the shortest operator startup path has a measured latency"
    }),
    buildCheck({
      code: "cli_first_run_measured",
      passed: cliCosts.first_run_registry_inspect.status === "pass",
      expected: "first-run registry inspect timing captured",
      actual: cliCosts.first_run_registry_inspect.status === "pass"
        ? `${cliCosts.first_run_registry_inspect.duration_ms}ms`
        : cliCosts.first_run_registry_inspect.error || "failed",
      message: "first-run operator latency is captured without requiring a host install"
    }),
    buildCheck({
      code: "codex_shared_foundation_proof",
      passed: codexSharedFoundation.status === "pass",
      expected: "Codex writeAfterTask durable memory becomes OpenClaw-readable governed memory on one shared root",
      actual: codexSharedFoundation.status === "pass"
        ? `${codexSharedFoundation.promoted} promoted / ${codexSharedFoundation.candidate_count} candidate(s)`
        : "failed",
      message: "Codex proof is no longer only architectural"
    }),
    buildCheck({
      code: "multi_instance_shared_memory_proof",
      passed: multiInstanceSharedMemory.status === "pass",
      expected: "multiple writers can share one registry root and remain readable through one OpenClaw workspace view",
      actual: multiInstanceSharedMemory.status === "pass"
        ? `${multiInstanceSharedMemory.candidate_count} candidate(s) / ${multiInstanceSharedMemory.policy_input_count} policy input(s)`
        : "failed",
      message: "multi-instance shared memory is backed by a real operator proof"
    })
  ];

  return {
    report_id: "stage10_adoption_and_shared_foundation",
    generated_at: new Date().toISOString(),
    shortest_path: {
      maintainer: [
        "npm install",
        "npm run umc:stage10 -- --format markdown"
      ],
      release_grade: [
        "npm run umc:release-preflight -- --format markdown"
      ]
    },
    package_footprint: packageFootprint,
    cli_costs: cliCosts,
    codex_shared_foundation: codexSharedFoundation,
    multi_instance_shared_memory: multiInstanceSharedMemory,
    checks,
    summary: buildSummary(checks)
  };
}

export function renderStage10AdoptionProofReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Stage 10 Adoption And Shared-Foundation Proof");
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push(`- status: \`${report.summary.status}\``);
  lines.push("");
  lines.push("## Shortest Maintainer Path");
  for (const command of report.shortest_path.maintainer) {
    lines.push(`- \`${command}\``);
  }
  lines.push("");
  lines.push("## Stronger Release-Grade Gate");
  for (const command of report.shortest_path.release_grade) {
    lines.push(`- \`${command}\``);
  }
  lines.push("");
  lines.push("## Package / Startup / First-Run");
  lines.push(`- packageTarball: \`${report.package_footprint.tarball_bytes} bytes\``);
  lines.push(`- npmPackDuration: \`${report.package_footprint.duration_ms}ms\``);
  lines.push(`- entryCount: \`${report.package_footprint.entry_count}\``);
  lines.push(`- startupWhere: \`${report.cli_costs.startup.duration_ms}ms\``);
  lines.push(`- firstRunRegistryInspect: \`${report.cli_costs.first_run_registry_inspect.duration_ms}ms\``);
  lines.push("");
  lines.push("## Codex Shared-Foundation Proof");
  lines.push(`- status: \`${report.codex_shared_foundation.status}\``);
  lines.push(`- promoted: \`${report.codex_shared_foundation.promoted}\``);
  lines.push(`- candidateCount: \`${report.codex_shared_foundation.candidate_count}\``);
  lines.push(`- policyInputCount: \`${report.codex_shared_foundation.policy_input_count}\``);
  lines.push(`- topCandidate: \`${report.codex_shared_foundation.top_candidate_snippet}\``);
  lines.push("");
  lines.push("## Multi-Instance Shared-Memory Proof");
  lines.push(`- status: \`${report.multi_instance_shared_memory.status}\``);
  lines.push(`- candidateCount: \`${report.multi_instance_shared_memory.candidate_count}\``);
  lines.push(`- policyInputCount: \`${report.multi_instance_shared_memory.policy_input_count}\``);
  for (const snippet of report.multi_instance_shared_memory.snippets || []) {
    lines.push(`- snippet: \`${snippet}\``);
  }
  lines.push("");
  lines.push("## Checks");
  for (const check of report.checks) {
    lines.push(
      `- [${check.status.toUpperCase()}] ${check.code}: ${check.message} (expected=${check.expected}; actual=${check.actual})`
    );
  }
  lines.push("");
  return `${lines.join("\n").trimEnd()}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await runStage10AdoptionProof({
    repoRoot: options.repoRoot
  });
  process.stdout.write(renderStage10AdoptionProofReport(report, { format: options.format }));
  if (report.summary.status !== "pass") {
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1]
  && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exitCode = 1;
  });
}
