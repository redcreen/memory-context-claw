#!/usr/bin/env node

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { extractJsonPayload } from "../src/runtime-config.js";
import { runOpenClawBundleInstallVerification } from "./run-openclaw-bundle-install.js";

const __filename = fileURLToPath(import.meta.url);
const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const name = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags[name] = true;
      continue;
    }
    flags[name] = next;
    index += 1;
  }
  return flags;
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function buildCheck({
  code,
  passed,
  expected,
  actual,
  message
}) {
  return {
    code,
    status: passed ? "pass" : "fail",
    expected,
    actual,
    message
  };
}

function buildSummary(checks) {
  const passed = checks.filter((check) => check.status === "pass").length;
  const failed = checks.filter((check) => check.status === "fail").length;
  return {
    status: failed === 0 ? "pass" : "fail",
    total_checks: checks.length,
    passed_checks: passed,
    failed_checks: failed
  };
}

function parseNodeTestSummary(stdout) {
  const text = String(stdout || "");
  const pass = Number(text.match(/ℹ pass (\d+)/u)?.[1] || 0);
  const fail = Number(text.match(/ℹ fail (\d+)/u)?.[1] || 0);
  return {
    pass,
    fail
  };
}

async function runCommand(command, args, { cwd = process.cwd() } = {}) {
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      maxBuffer: 32 * 1024 * 1024
    });
    return {
      ok: true,
      stdout: String(result.stdout || ""),
      stderr: String(result.stderr || ""),
      code: 0
    };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || ""),
      stderr: String(error.stderr || ""),
      code: Number(error.code || 1),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function checkMarkdownLinks(repoRoot) {
  const { stdout } = await runCommand("rg", ["--files", "-g", "*.md"], { cwd: repoRoot });
  const files = String(stdout || "").trim().split(/\n+/u).filter(Boolean);
  const issues = [];
  const linkRe = /!?\[[^\]]*\]\(([^)]+)\)/gu;

  for (const relativePath of files) {
    if (relativePath.startsWith("dist/openclaw-release/")) {
      continue;
    }
    const absolutePath = path.join(repoRoot, relativePath);
    const raw = await fs.readFile(absolutePath, "utf8");
    for (const match of raw.matchAll(linkRe)) {
      let target = String(match[1] || "").trim();
      if (target.startsWith("<") && target.endsWith(">")) {
        target = target.slice(1, -1).trim();
      }
      if (!target || target.startsWith("#")) {
        continue;
      }
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/u.test(target)) {
        continue;
      }
      if (target.startsWith("/")) {
        continue;
      }

      const bareTarget = target.split(/\s+/u)[0].split("#")[0].split("?")[0];
      if (!bareTarget) {
        continue;
      }
      const resolved = path.resolve(path.dirname(absolutePath), bareTarget);
      try {
        await fs.access(resolved);
      } catch {
        issues.push({
          file: relativePath,
          target: bareTarget
        });
      }
    }
  }

  return {
    file_count: files.length,
    issue_count: issues.length,
    issues: issues.slice(0, 20)
  };
}

export async function runReleasePreflight({
  repoRoot = process.cwd()
} = {}) {
  const checks = [];
  const artifacts = {};

  const npmTest = await runCommand("npm", ["test"], { cwd: repoRoot });
  const npmTestSummary = parseNodeTestSummary(npmTest.stdout);
  artifacts.npm_test = npmTestSummary;
  checks.push(
    buildCheck({
      code: "npm_test",
      passed: npmTest.ok && npmTestSummary.fail === 0,
      expected: "full repo npm test passes",
      actual: `${npmTestSummary.pass}/${npmTestSummary.pass + npmTestSummary.fail || 0}`,
      message: "full repo regression suite stays green"
    })
  );

  const smokeEval = await runCommand("npm", ["run", "smoke:eval"], { cwd: repoRoot });
  const smokeEvalReport = smokeEval.ok ? extractJsonPayload(smokeEval.stdout) : null;
  artifacts.smoke_eval = smokeEvalReport;
  checks.push(
    buildCheck({
      code: "smoke_eval",
      passed: smokeEval.ok && smokeEvalReport?.summary?.failed === 0,
      expected: "smoke eval has zero failures",
      actual: smokeEvalReport
        ? `${smokeEvalReport.summary.passed}/${smokeEvalReport.summary.cases}`
        : smokeEval.error || smokeEval.stderr || "failed",
      message: "smoke eval stays green"
    })
  );

  const memorySearch = await runCommand("npm", ["run", "eval:memory-search:cases"], { cwd: repoRoot });
  const memorySearchReport = memorySearch.ok ? extractJsonPayload(memorySearch.stdout) : null;
  artifacts.memory_search = memorySearchReport;
  checks.push(
    buildCheck({
      code: "memory_search_cases",
      passed: memorySearch.ok
        && Number(memorySearchReport?.summary?.pluginSignalHits || 0) === Number(memorySearchReport?.summary?.cases || 0),
      expected: "plugin memory-search cases all hit expected signals",
      actual: memorySearchReport
        ? `${memorySearchReport.summary.pluginSignalHits}/${memorySearchReport.summary.cases}`
        : memorySearch.error || memorySearch.stderr || "failed",
      message: "plugin memory-search regression stays green"
    })
  );

  const stage5 = await runCommand("npm", ["run", "umc:stage5", "--", "--format", "json"], { cwd: repoRoot });
  const stage5Report = stage5.ok ? extractJsonPayload(stage5.stdout) : null;
  artifacts.stage5 = stage5Report;
  checks.push(
    buildCheck({
      code: "stage5_acceptance",
      passed: stage5.ok && stage5Report?.summary?.status === "pass",
      expected: "Stage 5 acceptance passes",
      actual: stage5Report?.summary?.status || stage5.error || stage5.stderr || "failed",
      message: "Stage 5 product hardening acceptance stays green"
    })
  );

  const hostSmoke = await runCommand("npm", ["run", "umc:openclaw-itest", "--", "--format", "json"], { cwd: repoRoot });
  const hostSmokeReport = hostSmoke.ok ? extractJsonPayload(hostSmoke.stdout) : null;
  artifacts.host_smoke = hostSmokeReport;
  checks.push(
    buildCheck({
      code: "openclaw_host_smoke",
      passed: hostSmoke.ok && hostSmokeReport?.summary?.status === "pass",
      expected: "OpenClaw host smoke passes",
      actual: hostSmokeReport?.summary?.status || hostSmoke.error || hostSmoke.stderr || "failed",
      message: "host-level OpenClaw integration stays green"
    })
  );

  const installVerifyReport = await runOpenClawBundleInstallVerification({
    repoRoot,
    format: "json"
  });
  artifacts.bundle_install = installVerifyReport;
  checks.push(
    buildCheck({
      code: "openclaw_bundle_install",
      passed: installVerifyReport.summary.status === "pass",
      expected: "installed release bundle passes isolated host verification",
      actual: installVerifyReport.summary.status,
      message: "release bundle can be installed and exercised through OpenClaw CLI"
    })
  );

  const markdownLinks = await checkMarkdownLinks(repoRoot);
  artifacts.markdown_links = markdownLinks;
  checks.push(
    buildCheck({
      code: "markdown_links",
      passed: markdownLinks.issue_count === 0,
      expected: "markdown link scan has zero issues",
      actual: `${markdownLinks.issue_count} issue(s)`,
      message: "markdown docs stay internally link-clean"
    })
  );

  const diffCheck = await runCommand("git", ["diff", "--check"], { cwd: repoRoot });
  artifacts.diff_check = {
    ok: diffCheck.ok,
    output: normalizeString(diffCheck.stdout || diffCheck.stderr)
  };
  checks.push(
    buildCheck({
      code: "git_diff_check",
      passed: diffCheck.ok,
      expected: "git diff --check passes",
      actual: diffCheck.ok ? "pass" : diffCheck.error || diffCheck.stderr || diffCheck.stdout || "failed",
      message: "working tree changes stay patch-clean"
    })
  );

  return {
    report_id: `release_preflight_${Date.now()}`,
    generated_at: new Date().toISOString(),
    repo_root: repoRoot,
    summary: buildSummary(checks),
    checks,
    artifacts
  };
}

export function renderReleasePreflightReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Release Preflight");
  lines.push(`- reportId: \`${report.report_id}\``);
  lines.push(`- repoRoot: \`${report.repo_root}\``);
  lines.push(`- status: \`${report.summary.status}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- passedChecks: \`${report.summary.passed_checks}\``);
  lines.push(`- failedChecks: \`${report.summary.failed_checks}\``);
  lines.push(`- npmTest: \`${report.artifacts.npm_test.pass}/${report.artifacts.npm_test.pass + report.artifacts.npm_test.fail}\``);
  lines.push(`- smokeEval: \`${report.artifacts.smoke_eval.summary.passed}/${report.artifacts.smoke_eval.summary.cases}\``);
  lines.push(`- memorySearchCases: \`${report.artifacts.memory_search.summary.pluginSignalHits}/${report.artifacts.memory_search.summary.cases}\``);
  lines.push(`- bundleInstallTag: \`${report.artifacts.bundle_install.bundle.release_tag}\``);
  lines.push("");
  lines.push("## Checks");
  for (const check of report.checks) {
    lines.push(
      `- [${check.status.toUpperCase()}] ${check.code}: ${check.message} (expected=${check.expected}; actual=${check.actual})`
    );
  }
  lines.push("");
  lines.push("## Outcome");
  lines.push("- A passing preflight means repo regression, Stage 5 acceptance, host smoke, and release bundle deployment are all CLI-verifiable.");
  lines.push("- After this report is green, the remaining step is human acceptance rather than more implementation or operator-side validation.");
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const report = await runReleasePreflight({
    repoRoot: normalizeString(flags["repo-root"], process.cwd())
  });

  console.log(
    renderReleasePreflightReport(report, {
      format: normalizeString(flags.format, "markdown")
    })
  );

  if (report.summary.status !== "pass") {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exit(1);
  });
}
