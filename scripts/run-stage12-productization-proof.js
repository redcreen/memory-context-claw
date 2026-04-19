#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized || fallback;
}

function parseArgs(argv) {
  const options = { repoRoot: process.cwd(), format: "markdown" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") options.repoRoot = path.resolve(argv[++index]);
    else if (arg === "--format") options.format = normalizeString(argv[++index], "markdown");
    else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/run-stage12-productization-proof.js [options]",
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
      maxBuffer: 64 * 1024 * 1024
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

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
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
  const passedChecks = checks.filter((check) => check.status === "pass").length;
  const failedChecks = checks.length - passedChecks;
  return {
    status: failedChecks === 0 ? "pass" : "fail",
    total_checks: checks.length,
    passed_checks: passedChecks,
    failed_checks: failedChecks
  };
}

function parseLastMatch(text, pattern) {
  const matches = Array.from(text.matchAll(pattern));
  if (!matches.length) {
    return null;
  }
  return matches[matches.length - 1].slice(1);
}

async function collectOrdinaryConversationCloseout(repoRoot) {
  const reportPath = path.join(
    repoRoot,
    "reports/generated/openclaw-ordinary-conversation-memory-intent-closeout-2026-04-17.md"
  );
  const text = await readText(reportPath);
  const current = parseLastMatch(text, /current:\s*`(\d+)\s*\/\s*(\d+)`/gi);
  const legacy = parseLastMatch(text, /legacy:\s*`(\d+)\s*\/\s*(\d+)`/gi);
  const bothPass = parseLastMatch(text, /`both-pass\s*=\s*(\d+)`/gi);
  const umcOnly = parseLastMatch(text, /`UMC-only\s*=\s*(\d+)`/gi);
  const legacyOnly = parseLastMatch(text, /`legacy-only\s*=\s*(\d+)`/gi);
  const bothFail = parseLastMatch(text, /`both-fail\s*=\s*(\d+)`/gi);
  return {
    report_path: reportPath,
    current_passed: Number(current?.[0] || 0),
    current_total: Number(current?.[1] || 0),
    legacy_passed: Number(legacy?.[0] || 0),
    legacy_total: Number(legacy?.[1] || 0),
    both_pass: Number(bothPass?.[0] || 0),
    umc_only: Number(umcOnly?.[0] || 0),
    legacy_only: Number(legacyOnly?.[0] || 0),
    both_fail: Number(bothFail?.[0] || 0)
  };
}

async function collectAcceptedActionCanary(repoRoot) {
  const reportPath = path.join(
    repoRoot,
    "reports/generated/openclaw-accepted-action-canary-2026-04-15.md"
  );
  const text = await readText(reportPath);
  const result = parseLastMatch(text, /Result:\s*`([^`]+)`/gi)?.[0] || "unknown";
  const promoted = parseLastMatch(text, /promoted=(\d+)/gi)?.[0] || "unknown";
  return {
    report_path: reportPath,
    result,
    promoted
  };
}

async function collectOperatorSurface(repoRoot) {
  const packageJson = await readJson(path.join(repoRoot, "package.json"));
  const zhArchitecture = await readText(
    path.join(repoRoot, "docs/reference/unified-memory-core/architecture/realtime-memory-intent-ingestion.zh-CN.md")
  );
  const enArchitecture = await readText(
    path.join(repoRoot, "docs/reference/unified-memory-core/architecture/realtime-memory-intent-ingestion.md")
  );
  return {
    scripts: {
      verifyMemoryIntent: packageJson.scripts?.["verify:memory-intent"] || "",
      evalOpenClawOrdinaryAb: packageJson.scripts?.["eval:openclaw:ordinary-ab"] || "",
      umcStage12: packageJson.scripts?.["umc:stage12"] || ""
    },
    zh_mentions_formal_gate: zhArchitecture.includes("`npm run umc:stage12`"),
    en_mentions_formal_gate: enArchitecture.includes("`npm run umc:stage12`"),
    zh_mentions_runtime_seams:
      zhArchitecture.includes("`writeAfterTask(...)`") && zhArchitecture.includes("`agent_end`"),
    en_mentions_runtime_seams:
      enArchitecture.includes("`writeAfterTask(...)`") && enArchitecture.includes("`agent_end`")
  };
}

function toMarkdown(report) {
  const ordinary = report.evidence.ordinary_conversation_closeout;
  const canary = report.evidence.accepted_action_canary;
  const operator = report.evidence.operator_surface;
  const lines = [
    "# Stage 12 Realtime Memory Intent Productization Proof",
    "",
    `- generatedAt: \`${report.generated_at}\``,
    `- repoRoot: \`${report.repo_root}\``,
    `- status: \`${report.summary.status}\``,
    "",
    "## Summary",
    "",
    `- checks: \`${report.summary.passed_checks} / ${report.summary.total_checks}\` passed`,
    `- fresh gate: \`npm run verify:memory-intent\` => \`${report.evidence.memory_intent_gate.status}\` (\`${report.evidence.memory_intent_gate.duration_ms}ms\`)`,
    `- ordinary-conversation strict closeout: current \`${ordinary.current_passed} / ${ordinary.current_total}\`, legacy \`${ordinary.legacy_passed} / ${ordinary.legacy_total}\`, \`UMC-only = ${ordinary.umc_only}\`, \`both-fail = ${ordinary.both_fail}\``,
    `- accepted-action host canary: \`${canary.result}\` (expected \`promoted=${canary.promoted}\` because the canary emits one-off outcomes)`,
    "",
    "## Checks",
    ""
  ];

  for (const check of report.checks) {
    lines.push(`### ${check.code}`);
    lines.push("");
    lines.push(`- status: \`${check.status}\``);
    lines.push(`- expected: ${check.expected}`);
    lines.push(`- actual: ${check.actual}`);
    lines.push(`- note: ${check.message}`);
    lines.push("");
  }

  lines.push("## Evidence");
  lines.push("");
  lines.push(`- ordinary-conversation closeout report: [${path.basename(ordinary.report_path)}](../generated/${path.basename(ordinary.report_path)})`);
  lines.push(`- accepted-action host canary report: [${path.basename(canary.report_path)}](../generated/${path.basename(canary.report_path)})`);
  lines.push("");
  lines.push("## Operator Surface");
  lines.push("");
  lines.push(`- \`verify:memory-intent\`: \`${operator.scripts.verifyMemoryIntent}\``);
  lines.push(`- \`eval:openclaw:ordinary-ab\`: \`${operator.scripts.evalOpenClawOrdinaryAb}\``);
  lines.push(`- \`umc:stage12\`: \`${operator.scripts.umcStage12}\``);
  lines.push("");
  lines.push("## Conclusion");
  lines.push("");
  lines.push(
    report.summary.status === "pass"
      ? "`Stage 12` can be treated as closed: the shared memory-intent contract is gated, ordinary-conversation realtime ingest has a strict hermetic closeout surface, accepted-action host runtime is proven, and the operator entrypoint is now one command."
      : "`Stage 12` cannot close yet because one or more formal checks are still failing."
  );
  return lines.join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = options.repoRoot;
  const generatedAt = new Date().toISOString();

  const memoryIntentGate = await runTimedCommand("npm", ["run", "verify:memory-intent"], {
    cwd: repoRoot,
    env: process.env
  });
  const ordinaryConversationCloseout = await collectOrdinaryConversationCloseout(repoRoot);
  const acceptedActionCanary = await collectAcceptedActionCanary(repoRoot);
  const operatorSurface = await collectOperatorSurface(repoRoot);

  const checks = [
    buildCheck({
      code: "memory-intent-formal-gate",
      passed: memoryIntentGate.ok,
      expected: "`npm run verify:memory-intent` passes on the current repo state",
      actual: memoryIntentGate.ok
        ? `pass in ${memoryIntentGate.duration_ms}ms`
        : `fail in ${memoryIntentGate.duration_ms}ms (${memoryIntentGate.error || memoryIntentGate.stderr || "unknown error"})`,
      message: "Stage 12 cannot close without a fresh contract/runtime/governance gate pass."
    }),
    buildCheck({
      code: "ordinary-conversation-runtime-closeout",
      passed:
        ordinaryConversationCloseout.current_passed === ordinaryConversationCloseout.current_total
        && ordinaryConversationCloseout.both_fail === 0
        && ordinaryConversationCloseout.umc_only >= 20,
      expected: "strict Docker ordinary-conversation closeout reaches full current pass with zero shared failures and clear UMC-only wins",
      actual:
        `current ${ordinaryConversationCloseout.current_passed}/${ordinaryConversationCloseout.current_total}, `
        + `legacy ${ordinaryConversationCloseout.legacy_passed}/${ordinaryConversationCloseout.legacy_total}, `
        + `UMC-only ${ordinaryConversationCloseout.umc_only}, both-fail ${ordinaryConversationCloseout.both_fail}`,
      message: "This is the formal proof that realtime ordinary-conversation ingest is no longer just a contract on paper."
    }),
    buildCheck({
      code: "accepted-action-host-runtime-proof",
      passed: acceptedActionCanary.result === "pass",
      expected: "the real OpenClaw host canary proves structured accepted_action reaches the governed registry path",
      actual: `result=${acceptedActionCanary.result}, promoted=${acceptedActionCanary.promoted}`,
      message: "Stage 12 also has to cover the accepted-action realtime seam, not only memory_extraction and replay."
    }),
    buildCheck({
      code: "operator-surface-is-one-command",
      passed:
        operatorSurface.scripts.verifyMemoryIntent.length > 0
        && operatorSurface.scripts.evalOpenClawOrdinaryAb.length > 0
        && operatorSurface.scripts.umcStage12.length > 0
        && operatorSurface.zh_mentions_formal_gate
        && operatorSurface.en_mentions_formal_gate
        && operatorSurface.zh_mentions_runtime_seams
        && operatorSurface.en_mentions_runtime_seams,
      expected: "package scripts and architecture docs expose one explicit Stage 12 operator surface plus both runtime seams",
      actual:
        `umc:stage12=${Boolean(operatorSurface.scripts.umcStage12)}, `
        + `verify:memory-intent=${Boolean(operatorSurface.scripts.verifyMemoryIntent)}, `
        + `ordinary-ab=${Boolean(operatorSurface.scripts.evalOpenClawOrdinaryAb)}, `
        + `docsGate=${operatorSurface.zh_mentions_formal_gate && operatorSurface.en_mentions_formal_gate}, `
        + `docsSeams=${operatorSurface.zh_mentions_runtime_seams && operatorSurface.en_mentions_runtime_seams}`,
      message: "Stage 12 is productization work, so the proof surface must exist for maintainers, not only as scattered reports."
    })
  ];

  const report = {
    generated_at: generatedAt,
    repo_root: repoRoot,
    summary: buildSummary(checks),
    checks,
    evidence: {
      memory_intent_gate: {
        status: memoryIntentGate.ok ? "pass" : "fail",
        duration_ms: memoryIntentGate.duration_ms,
        stdout: memoryIntentGate.stdout,
        stderr: memoryIntentGate.stderr
      },
      ordinary_conversation_closeout: ordinaryConversationCloseout,
      accepted_action_canary: acceptedActionCanary,
      operator_surface: operatorSurface
    }
  };

  if (options.format === "json") {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(toMarkdown(report));
}

await main();
