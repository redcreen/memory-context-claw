#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

import { extractJsonPayload } from "../src/retrieval.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const date = new Date().toISOString().slice(0, 10);
const repoRoot = path.resolve(__dirname, "..");
const defaultCasesPath = path.resolve(__dirname, "../evals/openclaw-ordinary-conversation-memory-intent-ab-cases.js");
const defaultFixtureRoot = path.resolve(__dirname, "../evals/openclaw-ordinary-conversation-fixture");
const defaultTemplateCacheRoot = path.resolve(repoRoot, ".cache", "openclaw-ordinary-state-templates");
const ordinaryStateTemplateVersion = "v3";
const ordinaryTemplateWarmupMessage = "What repository is this workspace for? Answer in one short sentence.";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function parseArgs(argv) {
  const args = {
    agentId: "rtab",
    sourceAgentId: "main",
    fixtureRoot: defaultFixtureRoot,
    pluginPath: repoRoot,
    authProfilesPath: normalizeString(process.env.UMC_EVAL_AUTH_PROFILES_PATH),
    agentModel: normalizeString(process.env.UMC_EVAL_AGENT_MODEL),
    preset: normalizeString(process.env.UMC_EVAL_PRESET, "safe-local"),
    casesPath: defaultCasesPath,
    templateCacheRoot: path.resolve(
      repoRoot,
      normalizeString(process.env.UMC_EVAL_TEMPLATE_CACHE_ROOT, defaultTemplateCacheRoot)
    ),
    refreshTemplateCache: normalizeString(process.env.UMC_EVAL_REFRESH_TEMPLATE_CACHE) === "1",
    keepState: normalizeString(process.env.UMC_EVAL_KEEP_STATE) === "1",
    fastFailCapture: normalizeString(process.env.UMC_EVAL_FAST_FAIL_CAPTURE, "1") !== "0",
    shardSize: Number(normalizeString(process.env.UMC_EVAL_SHARD_SIZE, "10")) || 10,
    shardCount: Number(normalizeString(process.env.UMC_EVAL_SHARD_COUNT, "4")) || 4,
    maxCases: 0,
    only: [],
    timeoutMs: 90_000,
    capturePollMs: 12_000,
    format: "markdown",
    writeJson: path.resolve(repoRoot, `reports/openclaw-ordinary-conversation-memory-intent-ab-${date}.json`),
    writeMarkdown: path.resolve(repoRoot, `reports/generated/openclaw-ordinary-conversation-memory-intent-ab-${date}.md`)
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--agent") args.agentId = String(argv[++index] || args.agentId);
    else if (arg === "--source-agent") args.sourceAgentId = String(argv[++index] || args.sourceAgentId);
    else if (arg === "--fixture-root") args.fixtureRoot = path.resolve(repoRoot, argv[++index]);
    else if (arg === "--plugin-path") args.pluginPath = path.resolve(repoRoot, argv[++index]);
    else if (arg === "--auth-profiles-path") args.authProfilesPath = path.resolve(repoRoot, argv[++index]);
    else if (arg === "--agent-model") args.agentModel = String(argv[++index] || args.agentModel);
    else if (arg === "--preset") args.preset = String(argv[++index] || args.preset);
    else if (arg === "--cases") args.casesPath = path.resolve(repoRoot, argv[++index]);
    else if (arg === "--template-cache-root") args.templateCacheRoot = path.resolve(repoRoot, argv[++index]);
    else if (arg === "--refresh-template-cache") args.refreshTemplateCache = true;
    else if (arg === "--keep-state") args.keepState = true;
    else if (arg === "--no-fast-fail-capture") args.fastFailCapture = false;
    else if (arg === "--shard-size") args.shardSize = Number(argv[++index] || args.shardSize);
    else if (arg === "--shard-count") args.shardCount = Number(argv[++index] || args.shardCount);
    else if (arg === "--max-cases") args.maxCases = Number(argv[++index] || 0);
    else if (arg === "--only") args.only = String(argv[++index] || "").split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++index] || args.timeoutMs);
    else if (arg === "--capture-poll-ms") args.capturePollMs = Number(argv[++index] || args.capturePollMs);
    else if (arg === "--format") args.format = String(argv[++index] || args.format);
    else if (arg === "--write-json") args.writeJson = path.resolve(repoRoot, argv[++index]);
    else if (arg === "--write-markdown") args.writeMarkdown = path.resolve(repoRoot, argv[++index]);
  }

  return args;
}

async function importCases(casesPath) {
  const moduleUrl = pathToFileURL(casesPath).href;
  const imported = await import(moduleUrl);
  const cases = imported.default || imported.cases || [];
  if (!Array.isArray(cases)) {
    throw new Error(`Case module did not export an array: ${casesPath}`);
  }
  return cases;
}

async function copyRecursive(sourcePath, targetPath) {
  const stat = await fs.stat(sourcePath);
  if (stat.isDirectory()) {
    await fs.mkdir(targetPath, { recursive: true });
    const entries = await fs.readdir(sourcePath);
    for (const entry of entries) {
      await copyRecursive(path.join(sourcePath, entry), path.join(targetPath, entry));
    }
    return;
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

async function listRelativeFiles(rootPath) {
  const files = [];

  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      const stat = await fs.stat(fullPath);
      files.push({
        path: relativePath,
        size: stat.size,
        mtimeMs: Math.trunc(stat.mtimeMs)
      });
    }
  }

  await walk(rootPath);
  return files;
}

async function buildOrdinaryTemplateCacheKey(args, includeUMC) {
  const fixtureFiles = await listRelativeFiles(args.fixtureRoot);
  let authSignature = null;
  if (args.authProfilesPath) {
    const stat = await fs.stat(args.authProfilesPath);
    authSignature = {
      path: path.resolve(args.authProfilesPath),
      size: stat.size,
      mtimeMs: Math.trunc(stat.mtimeMs)
    };
  }

  const payload = {
    version: ordinaryStateTemplateVersion,
    includeUMC,
    agentId: args.agentId,
    preset: args.preset,
    agentModel: args.agentModel,
    fixtureRoot: path.resolve(args.fixtureRoot),
    fixtureFiles,
    authSignature,
    pluginPath: path.resolve(args.pluginPath)
  };

  return createHash("sha1")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 16);
}

function includesAny(text, patterns = []) {
  if (!patterns.length) return true;
  const haystack = String(text || "").toLowerCase();
  return patterns.some((pattern) => haystack.includes(String(pattern || "").toLowerCase()));
}

function includesAll(text, patterns = []) {
  if (!patterns.length) return true;
  const haystack = String(text || "").toLowerCase();
  return patterns.every((pattern) => haystack.includes(String(pattern || "").toLowerCase()));
}

function excludesAll(text, patterns = []) {
  if (!patterns.length) return true;
  const haystack = String(text || "").toLowerCase();
  return patterns.every((pattern) => !haystack.includes(String(pattern || "").toLowerCase()));
}

function pickJsonText(stdout = "", stderr = "") {
  return String(stdout || "").trim() ? String(stdout || "") : String(stderr || "");
}

function extractAgentText(payload) {
  const parts =
    payload?.result?.payloads
    || payload?.result?.content
    || payload?.payloads
    || payload?.content
    || [];
  return parts.map((item) => item?.text || "").join("\n").trim();
}

function classifyOutcome(item) {
  const current = item.current?.passed === true;
  const legacy = item.legacy?.passed === true;
  if (current && legacy) return "both_pass";
  if (current && !legacy) return "umc_only";
  if (!current && legacy) return "legacy_only";
  return "both_fail";
}

function createOutcomeBucket() {
  return {
    total: 0,
    currentPassed: 0,
    legacyPassed: 0,
    bothPass: 0,
    umcOnly: 0,
    legacyOnly: 0,
    bothFail: 0
  };
}

function applyOutcome(bucket, item) {
  bucket.total += 1;
  if (item.current?.passed) bucket.currentPassed += 1;
  if (item.legacy?.passed) bucket.legacyPassed += 1;

  const outcome = classifyOutcome(item);
  if (outcome === "both_pass") bucket.bothPass += 1;
  else if (outcome === "umc_only") bucket.umcOnly += 1;
  else if (outcome === "legacy_only") bucket.legacyOnly += 1;
  else bucket.bothFail += 1;
}

function evaluateCase(caseDef, run) {
  if (!run || run.ok !== true) {
    return {
      passed: false,
      expectedAnyOk: false,
      expectedAllOk: false,
      forbiddenOk: false,
      reason: run?.error || "command failed"
    };
  }

  const text = String(run.answer || "");
  const expectedAnyOk = includesAny(text, caseDef.expectedAny || []);
  const expectedAllOk = includesAll(text, caseDef.expectedAll || []);
  const forbiddenOk = excludesAll(text, caseDef.forbiddenAny || []);
  const passed = expectedAnyOk && expectedAllOk && forbiddenOk;
  return {
    passed,
    expectedAnyOk,
    expectedAllOk,
    forbiddenOk,
    reason: passed ? "matched" : "expectation mismatch"
  };
}

function summarizeIsolation(results) {
  const stateRoots = [];
  const registryRoots = [];
  let cleanupOk = 0;
  let sessionClearOk = 0;

  for (const item of results) {
    for (const run of [item.legacy, item.current]) {
      if (!run) continue;
      if (run.stateRootKey) stateRoots.push(run.stateRootKey);
      if (run.registryRootKey) registryRoots.push(run.registryRootKey);
      if (run.cleanupOk === true) cleanupOk += 1;
      if (run.sessionClearOk === true) sessionClearOk += 1;
    }
  }

  return {
    totalRuns: results.length * 2,
    uniqueStateRoots: new Set(stateRoots).size,
    duplicateStateRoots: stateRoots.length - new Set(stateRoots).size,
    uniqueRegistryRoots: new Set(registryRoots).size,
    duplicateRegistryRoots: registryRoots.length - new Set(registryRoots).size,
    cleanupOk,
    cleanupFailed: results.length * 2 - cleanupOk,
    sessionClearOk,
    sessionClearFailed: results.length * 2 - sessionClearOk
  };
}

function createTimingBucket() {
  return {
    runs: 0,
    cloneMs: 0,
    captureMs: 0,
    captureWaitMs: 0,
    sessionClearMs: 0,
    recallMs: 0,
    cleanupMs: 0,
    totalCaseMs: 0,
    captureTimeouts: 0,
    recallTimeouts: 0,
    maxCloneMs: 0,
    maxCaptureMs: 0,
    maxCaptureWaitMs: 0,
    maxSessionClearMs: 0,
    maxRecallMs: 0,
    maxCleanupMs: 0,
    maxTotalCaseMs: 0
  };
}

function applyRunTimings(bucket, run) {
  if (!run) {
    return;
  }

  const timings = run.timings || {};
  bucket.runs += 1;

  for (const key of [
    "cloneMs",
    "captureMs",
    "captureWaitMs",
    "sessionClearMs",
    "recallMs",
    "cleanupMs",
    "totalCaseMs"
  ]) {
    const value = Number(timings[key] || 0);
    bucket[key] += value;
    const maxKey = `max${key[0].toUpperCase()}${key.slice(1)}`;
    bucket[maxKey] = Math.max(bucket[maxKey], value);
  }

  if (String(run.captureError || "").includes("timeout")) {
    bucket.captureTimeouts += 1;
  }
  if (String(run.error || "").includes("timeout")) {
    bucket.recallTimeouts += 1;
  }
}

function finalizeTimingBucket(bucket) {
  const divisor = Math.max(1, bucket.runs);
  return {
    ...bucket,
    avgCloneMs: Math.round(bucket.cloneMs / divisor),
    avgCaptureMs: Math.round(bucket.captureMs / divisor),
    avgCaptureWaitMs: Math.round(bucket.captureWaitMs / divisor),
    avgSessionClearMs: Math.round(bucket.sessionClearMs / divisor),
    avgRecallMs: Math.round(bucket.recallMs / divisor),
    avgCleanupMs: Math.round(bucket.cleanupMs / divisor),
    avgTotalCaseMs: Math.round(bucket.totalCaseMs / divisor)
  };
}

function summarizeTimings(results, environment = {}) {
  const legacy = createTimingBucket();
  const current = createTimingBucket();

  for (const item of results) {
    applyRunTimings(legacy, item.legacy);
    applyRunTimings(current, item.current);
  }

  return {
    templatePrepMs: {
      legacy: Number(environment.legacyBaseStatePrepMs || 0),
      current: Number(environment.currentBaseStatePrepMs || 0)
    },
    legacy: finalizeTimingBucket(legacy),
    current: finalizeTimingBucket(current)
  };
}

function summarizeResults(results) {
  const byLanguage = {
    en: createOutcomeBucket(),
    zh: createOutcomeBucket()
  };
  const byCategory = {
    durable_rule: createOutcomeBucket(),
    tool_routing_preference: createOutcomeBucket(),
    user_profile_fact: createOutcomeBucket(),
    session_constraint: createOutcomeBucket(),
    one_off_instruction: createOutcomeBucket()
  };

  const summary = {
    total: results.length,
    currentPassed: results.filter((item) => item.current?.passed === true).length,
    legacyPassed: results.filter((item) => item.legacy?.passed === true).length,
    bothPass: 0,
    umcOnly: 0,
    legacyOnly: 0,
    bothFail: 0,
    byLanguage,
    byCategory,
    captureObserved: results.filter((item) => item.current?.captureObserved === true).length,
    isolation: summarizeIsolation(results)
  };

  for (const item of results) {
    applyOutcome(byLanguage[item.language || "en"], item);
    applyOutcome(byCategory[item.category], item);

    const outcome = classifyOutcome(item);
    if (outcome === "both_pass") summary.bothPass += 1;
    else if (outcome === "umc_only") summary.umcOnly += 1;
    else if (outcome === "legacy_only") summary.legacyOnly += 1;
    else summary.bothFail += 1;
  }

  return summary;
}

function normalizeSingleLine(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || "(empty)";
}

function renderBucket(lines, title, item) {
  lines.push(`### ${title}`);
  lines.push("");
  lines.push(`- total: \`${item.total}\``);
  lines.push(`- currentPassed: \`${item.currentPassed}\``);
  lines.push(`- legacyPassed: \`${item.legacyPassed}\``);
  lines.push(`- bothPass: \`${item.bothPass}\``);
  lines.push(`- umcOnly: \`${item.umcOnly}\``);
  lines.push(`- legacyOnly: \`${item.legacyOnly}\``);
  lines.push(`- bothFail: \`${item.bothFail}\``);
  lines.push("");
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# OpenClaw Ordinary-Conversation Memory-Intent A/B");
  lines.push("");
  lines.push(`- generatedAt: \`${report.generatedAt}\``);
  lines.push(`- comparedCases: \`${report.summary.total}\``);
  lines.push(`- currentPassed: \`${report.summary.currentPassed}\``);
  lines.push(`- legacyPassed: \`${report.summary.legacyPassed}\``);
  lines.push(`- bothPass: \`${report.summary.bothPass}\``);
  lines.push(`- umcOnly: \`${report.summary.umcOnly}\``);
  lines.push(`- legacyOnly: \`${report.summary.legacyOnly}\``);
  lines.push(`- bothFail: \`${report.summary.bothFail}\``);
  lines.push(`- currentCaptureObserved: \`${report.summary.captureObserved}\``);
  lines.push(`- phaseOrder: \`legacy first -> delete isolated legacy state -> current second\``);
  lines.push(`- executionEnvironment: \`${report.environment.executionEnvironment}\``);
  lines.push(`- shardCount: \`${report.environment.shardCount}\``);
  lines.push(`- fastFailCapture: \`${report.environment.fastFailCapture === true}\``);
  if (report.environment.dockerImage) {
    lines.push(`- dockerImage: \`${report.environment.dockerImage}\``);
  }
  if (report.environment.totalWallClockMs > 0) {
    lines.push(`- totalWallClockMs: \`${report.environment.totalWallClockMs}\``);
  }
  lines.push("");
  lines.push("## Method");
  lines.push("");
  lines.push("- Each case runs a real `openclaw agent --local` capture turn, then prunes session transcripts before the recall turn.");
  lines.push("- The benchmark does not interleave systems case-by-case. It runs all `legacy builtin` cases first in isolated temp state roots, deletes those state roots, and only then runs all `current` Unified Memory Core cases in fresh isolated temp state roots.");
  lines.push("- The runner now prebuilds one hermetic `legacy` base state and one hermetic `current` base state per benchmark run, including fixture copy, auth profile placement, and `openclaw.json` generation.");
  lines.push("- Those base states are pre-warmed with one low-signal answer turn so later cases start from a steadier answer path without seeding durable benchmark memory.");
  lines.push("- Each case then clones one of those preconfigured base states instead of regenerating config and directory scaffolding from scratch.");
  lines.push("- Cases are split into shards and run in parallel inside the same hermetic Docker container, while each case still keeps its own isolated state root.");
  lines.push("- Each case still gets its own isolated state root so earlier cases cannot leak durable memory into later cases.");
  lines.push("- Ordinary-conversation Docker eval does **not** seed from host `~/.openclaw` workspaces or host memory DBs. The only mounted host inputs are the auth profiles file and model/API credentials.");
  lines.push(`- State roots are built from the repo fixture root \`${report.environment.fixtureRoot}\`, which is intentionally empty except for tracked scaffold files; no prior memory is preloaded.`);
  lines.push("- This isolates explicit long-memory behavior from short-lived session/bootstrap carry-over.");
  lines.push("- `current` means the repo checkout loaded as the OpenClaw `unified-memory-core` context engine, with ordinary-conversation governed `memory_intent` enabled.");
  lines.push("- `legacy` means the default `legacy` context engine with no `unified-memory-core` plugin loaded.");
  lines.push("- OpenClaw ships a separate `memory-lancedb` plugin, but it is not active in the current host default config, so this focused A/B measures the actual current default host path rather than a hypothetical enabled-autoCapture setup.");
  lines.push("");
  lines.push("## Isolation Checks");
  lines.push("");
  lines.push(`- totalRuns: \`${report.summary.isolation.totalRuns}\``);
  lines.push(`- uniqueStateRoots: \`${report.summary.isolation.uniqueStateRoots}\``);
  lines.push(`- duplicateStateRoots: \`${report.summary.isolation.duplicateStateRoots}\``);
  lines.push(`- uniqueRegistryRoots: \`${report.summary.isolation.uniqueRegistryRoots}\``);
  lines.push(`- duplicateRegistryRoots: \`${report.summary.isolation.duplicateRegistryRoots}\``);
  lines.push(`- cleanupOk: \`${report.summary.isolation.cleanupOk}\``);
  lines.push(`- cleanupFailed: \`${report.summary.isolation.cleanupFailed}\``);
  lines.push(`- sessionClearOk: \`${report.summary.isolation.sessionClearOk}\``);
  lines.push(`- sessionClearFailed: \`${report.summary.isolation.sessionClearFailed}\``);
  if (report.environment.baseStateReuse === true) {
    lines.push(`- baseStateReuse: \`true\``);
    lines.push(`- legacyBaseStateKey: \`${report.environment.legacyBaseStateKey}\``);
    lines.push(`- currentBaseStateKey: \`${report.environment.currentBaseStateKey}\``);
    lines.push(`- templateCacheRoot: \`${report.environment.templateCacheRoot}\``);
    lines.push(`- templateCacheHits: legacy=\`${report.environment.templateCacheHits?.legacy === true}\`, current=\`${report.environment.templateCacheHits?.current === true}\``);
  }
  lines.push("");
  lines.push("## Phase Timing");
  lines.push("");
  lines.push(`- templatePrepMs: legacy=\`${report.timing.templatePrepMs.legacy}\`, current=\`${report.timing.templatePrepMs.current}\``);
  lines.push(`- legacy avg(ms): clone=\`${report.timing.legacy.avgCloneMs}\`, capture=\`${report.timing.legacy.avgCaptureMs}\`, wait=\`${report.timing.legacy.avgCaptureWaitMs}\`, sessionClear=\`${report.timing.legacy.avgSessionClearMs}\`, recall=\`${report.timing.legacy.avgRecallMs}\`, cleanup=\`${report.timing.legacy.avgCleanupMs}\`, total=\`${report.timing.legacy.avgTotalCaseMs}\``);
  lines.push(`- legacy max(ms): clone=\`${report.timing.legacy.maxCloneMs}\`, capture=\`${report.timing.legacy.maxCaptureMs}\`, wait=\`${report.timing.legacy.maxCaptureWaitMs}\`, sessionClear=\`${report.timing.legacy.maxSessionClearMs}\`, recall=\`${report.timing.legacy.maxRecallMs}\`, cleanup=\`${report.timing.legacy.maxCleanupMs}\`, total=\`${report.timing.legacy.maxTotalCaseMs}\``);
  lines.push(`- legacy timeouts: capture=\`${report.timing.legacy.captureTimeouts}\`, recall=\`${report.timing.legacy.recallTimeouts}\``);
  lines.push(`- current avg(ms): clone=\`${report.timing.current.avgCloneMs}\`, capture=\`${report.timing.current.avgCaptureMs}\`, wait=\`${report.timing.current.avgCaptureWaitMs}\`, sessionClear=\`${report.timing.current.avgSessionClearMs}\`, recall=\`${report.timing.current.avgRecallMs}\`, cleanup=\`${report.timing.current.avgCleanupMs}\`, total=\`${report.timing.current.avgTotalCaseMs}\``);
  lines.push(`- current max(ms): clone=\`${report.timing.current.maxCloneMs}\`, capture=\`${report.timing.current.maxCaptureMs}\`, wait=\`${report.timing.current.maxCaptureWaitMs}\`, sessionClear=\`${report.timing.current.maxSessionClearMs}\`, recall=\`${report.timing.current.maxRecallMs}\`, cleanup=\`${report.timing.current.maxCleanupMs}\`, total=\`${report.timing.current.maxTotalCaseMs}\``);
  lines.push(`- current timeouts: capture=\`${report.timing.current.captureTimeouts}\`, recall=\`${report.timing.current.recallTimeouts}\``);
  lines.push("");
  lines.push("- Interpretation:");
  lines.push("  - `duplicateStateRoots = 0` means every legacy/current run used a distinct temp OpenClaw state root.");
  lines.push("  - `duplicateRegistryRoots = 0` means current-mode governed memory writes did not share registry directories across cases.");
  lines.push("  - `cleanupFailed = 0` and `sessionClearFailed = 0` mean the runner both pruned session transcripts before recall and removed the temp state roots after each case.");
  lines.push("  - If any of those counters drift, the benchmark should be treated as contaminated until re-run.");
  lines.push("");
  lines.push("## Language Split");
  lines.push("");
  renderBucket(lines, "English", report.summary.byLanguage.en);
  renderBucket(lines, "Chinese", report.summary.byLanguage.zh);
  lines.push("## Category Split");
  lines.push("");
  renderBucket(lines, "Durable Rule", report.summary.byCategory.durable_rule);
  renderBucket(lines, "Tool Routing Preference", report.summary.byCategory.tool_routing_preference);
  renderBucket(lines, "User Profile Fact", report.summary.byCategory.user_profile_fact);
  renderBucket(lines, "Session Constraint", report.summary.byCategory.session_constraint);
  renderBucket(lines, "One-Off Instruction", report.summary.byCategory.one_off_instruction);
  lines.push("## Per-Case Results");
  lines.push("");
  for (const item of report.results) {
    lines.push(`### ${item.id}`);
    lines.push("");
    lines.push(`- language: \`${item.language}\``);
    lines.push(`- category: \`${item.category}\``);
    lines.push(`- outcome: \`${classifyOutcome(item)}\``);
    lines.push(`- currentCaptureObserved: \`${item.current?.captureObserved === true}\``);
    lines.push(`- 设计的问题 -> ${item.designQuestion}`);
    lines.push(`- 预期的结果 -> ${item.expectedResult}`);
    lines.push(`- captureMessage -> ${item.captureMessage}`);
    lines.push(`- recallMessage -> ${item.recallMessage}`);
    lines.push(`- builtin 实际结果 -> ${normalizeSingleLine(item.legacy?.answer || item.legacy?.error)} ${item.legacy?.passed === true ? "(`pass`)" : "(`fail`)"} `);
    lines.push(`- memory core 实际结果 -> ${normalizeSingleLine(item.current?.answer || item.current?.error)} ${item.current?.passed === true ? "(`pass`)" : "(`fail`)"} `);
    lines.push("");
  }
  lines.push("## Focused Conclusion");
  lines.push("");
  if (report.summary.umcOnly > report.summary.legacyOnly) {
    lines.push(`- On this focused realtime-write surface, Unified Memory Core wins more cases than the legacy default path: \`${report.summary.umcOnly}\` UMC-only vs \`${report.summary.legacyOnly}\` legacy-only.`);
  } else if (report.summary.umcOnly < report.summary.legacyOnly) {
    lines.push(`- On this focused realtime-write surface, the legacy default path still wins more cases: \`${report.summary.legacyOnly}\` legacy-only vs \`${report.summary.umcOnly}\` UMC-only.`);
  } else {
    lines.push(`- On this focused realtime-write surface, current and legacy are tied on exclusive wins: \`${report.summary.umcOnly}\` each.`);
  }
  lines.push("- This suite is intentionally different from the earlier 100-case A/B: it tests live ordinary-conversation writing and then removes session transcripts before recall.");
  lines.push("- That makes it the first direct probe of whether ordinary conversation itself can create durable recallable memory rather than merely improving consumption of an existing fixture.");
  return `${lines.join("\n")}\n`;
}

function shardCases(cases, count) {
  const shards = Array.from({ length: count }, () => []);
  for (let index = 0; index < cases.length; index += 1) {
    shards[index % count].push(cases[index]);
  }
  return shards.filter((items) => items.length > 0);
}

async function writeText(filePath, text) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text, "utf8");
}

async function runCommand(bin, args, options = {}) {
  const maxBuffer = 8 * 1024 * 1024;
  return await new Promise((resolve) => {
    const dockerWrapped = process.env.UMC_EVAL_EXECUTION_ENV === "docker"
      && options.timeoutMs
      && bin === "openclaw";
    const spawnBin = dockerWrapped ? "/usr/bin/timeout" : bin;
    const spawnArgs = dockerWrapped
      ? ["--signal=KILL", `${Math.max(1, Math.ceil(options.timeoutMs / 1000))}s`, bin, ...args]
      : args;
    const child = spawn(spawnBin, spawnArgs, {
      cwd: repoRoot,
      env: { ...process.env, ...(options.env || {}) },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const trimBuffer = (value) => {
      if (value.length <= maxBuffer) {
        return value;
      }
      return value.slice(value.length - maxBuffer);
    };

    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const killTree = (signal = "SIGKILL") => {
      try {
        process.kill(-child.pid, signal);
        return;
      } catch {
        try {
          child.kill(signal);
        } catch {
          // ignore cleanup failure
        }
      }
    };

    child.stdout.on("data", (chunk) => {
      stdout = trimBuffer(stdout + String(chunk));
    });
    child.stderr.on("data", (chunk) => {
      stderr = trimBuffer(stderr + String(chunk));
    });

    child.on("error", (error) => {
      finish({
        ok: false,
        stdout,
        stderr,
        error: String(error?.message || error)
      });
    });

    child.on("close", (code, signal) => {
      if (timedOut) {
        finish({
          ok: false,
          stdout,
          stderr,
          error: `timeout after ${options.timeoutMs}ms`
        });
        return;
      }
      if (code === 0) {
        finish({
          ok: true,
          stdout,
          stderr
        });
        return;
      }
      finish({
        ok: false,
        stdout,
        stderr,
        error: `exit ${code ?? "null"} signal ${signal ?? "null"}`
      });
    });

    const timer = options.timeoutMs
      ? setTimeout(() => {
        timedOut = true;
        killTree();
      }, options.timeoutMs)
      : null;
  });
}

function buildOrdinaryConfig({
  includeUMC,
  agentId,
  agentDir,
  workspaceDir,
  registryDir,
  pluginPath,
  agentModel
}) {
  const config = {
    commands: {},
    agents: {
      defaults: {
        workspace: workspaceDir
      },
      list: [
        {
          id: agentId,
          name: agentId,
          workspace: workspaceDir,
          agentDir,
          memorySearch: {
            provider: "none",
            fallback: "none"
          }
        }
      ]
    },
    plugins: {
      allow: includeUMC ? ["unified-memory-core"] : [],
      slots: {
        contextEngine: includeUMC ? "unified-memory-core" : "legacy"
      },
      load: {
        paths: includeUMC ? [pluginPath] : []
      },
      entries: includeUMC
        ? {
          "unified-memory-core": {
            enabled: true,
            config: {
              selfLearning: {
                enabled: false
              },
              openclawAdapter: {
                ordinaryConversationMemory: {
                  enabled: true
                },
                governedExports: {
                  registryDir,
                  workspaceId: "ordinary-live"
                }
              }
            }
          }
        }
        : {},
      installs: {}
    },
    tools: {
      allow: []
    }
  };

  if (agentModel) {
    config.agents.defaults.model = { primary: agentModel };
    config.agents.list[0].model = { primary: agentModel };
  }

  return config;
}

async function createEvalStateDir(args, includeUMC) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), includeUMC ? "umc-ordinary-current-" : "umc-ordinary-legacy-"));
  return await materializeEvalStateDir(args, includeUMC, tempRoot);
}

async function materializeEvalStateDir(args, includeUMC, tempRoot) {
  const agentDir = path.join(tempRoot, "agents", args.agentId, "agent");
  const workspaceDir = path.join(tempRoot, "workspace");
  const registryDir = path.join(tempRoot, "registry");
  await fs.mkdir(workspaceDir, { recursive: true });
  await copyRecursive(args.fixtureRoot, agentDir);
  if (args.authProfilesPath) {
    await copyRecursive(args.authProfilesPath, path.join(agentDir, "auth-profiles.json"));
  }
  const config = buildOrdinaryConfig({
    includeUMC,
    agentId: args.agentId,
    agentDir,
    workspaceDir,
    registryDir,
    pluginPath: args.pluginPath,
    agentModel: args.agentModel
  });
  await writeText(path.join(tempRoot, "openclaw.json"), `${JSON.stringify(config, null, 2)}\n`);
  const sessionsDir = path.join(tempRoot, "agents", args.agentId, "sessions");
  await fs.mkdir(sessionsDir, { recursive: true });
  await writeText(path.join(sessionsDir, "sessions.json"), "{}\n");

  return {
    stateDir: tempRoot,
    registryDir,
    stateRootKey: path.basename(tempRoot),
    registryRootKey: path.relative(os.tmpdir(), registryDir)
  };
}

async function cloneEvalStateDir(baseStateDir, prefix) {
  const targetDir = path.join(os.tmpdir(), `${prefix}${randomUUID()}`);
  await fs.cp(baseStateDir, targetDir, {
    recursive: true,
    force: true
  });
  return targetDir;
}

async function ensureCachedEvalBaseState(args, includeUMC) {
  const cacheKey = await buildOrdinaryTemplateCacheKey(args, includeUMC);
  const modeName = includeUMC ? "current" : "legacy";
  const stateDir = path.join(args.templateCacheRoot, `${modeName}-${cacheKey}`);
  const metaPath = path.join(stateDir, ".umc-template-meta.json");

  if (args.refreshTemplateCache) {
    await fs.rm(stateDir, { recursive: true, force: true }).catch(() => {});
  }

  try {
    await fs.access(metaPath);
    return {
      stateDir,
      registryDir: path.join(stateDir, "registry"),
      baseStateRootKey: path.basename(stateDir),
      baseRegistryRootKey: path.relative(os.tmpdir(), path.join(stateDir, "registry")),
      cacheHit: true
    };
  } catch {
    // build below
  }

  const buildDir = path.join(args.templateCacheRoot, `${modeName}-${cacheKey}.build-${randomUUID()}`);
  await fs.mkdir(args.templateCacheRoot, { recursive: true });
  const built = await materializeEvalStateDir(args, includeUMC, buildDir);
  const warmup = await runAgentTurn({
    stateDir: built.stateDir,
    agentId: args.agentId,
    sessionId: `template-prewarm-${modeName}`,
    message: ordinaryTemplateWarmupMessage,
    timeoutMs: Math.max(args.timeoutMs, 120_000)
  });
  await clearSessionArtifacts(built.stateDir, args.agentId);
  if (includeUMC) {
    await resetRegistryDir(built.registryDir);
  }
  await writeText(
    metaPath.replace(stateDir, buildDir),
    `${JSON.stringify({
      version: ordinaryStateTemplateVersion,
      includeUMC,
      builtAt: new Date().toISOString(),
      fixtureRoot: path.resolve(args.fixtureRoot),
      pluginPath: path.resolve(args.pluginPath),
      authProfilesPath: normalizeString(args.authProfilesPath),
      agentModel: normalizeString(args.agentModel),
      warmup: {
        ok: warmup?.ok === true,
        error: warmup?.error || "",
        answer: warmup?.answer || ""
      }
    }, null, 2)}\n`
  );
  await fs.rm(stateDir, { recursive: true, force: true }).catch(() => {});
  await fs.rename(buildDir, stateDir);

  return {
    stateDir,
    registryDir: path.join(stateDir, "registry"),
    baseStateRootKey: path.basename(stateDir),
    baseRegistryRootKey: path.relative(os.tmpdir(), path.join(stateDir, "registry")),
    cacheHit: false
  };
}

async function clearSessionArtifacts(stateDir, agentId) {
  const sessionsDir = path.join(stateDir, "agents", agentId, "sessions");
  try {
    const entries = await fs.readdir(sessionsDir);
    for (const entry of entries) {
      if (entry.endsWith(".jsonl") || entry.endsWith(".lock")) {
        await fs.rm(path.join(sessionsDir, entry), { force: true });
      }
    }
    await writeText(path.join(sessionsDir, "sessions.json"), "{}\n");
  } catch {
    // best effort
  }
}

async function removeStateDir(stateDir) {
  try {
    await fs.rm(stateDir, { recursive: true, force: true });
  } catch {
    // best effort
  }
}

async function resetRegistryDir(registryDir) {
  try {
    await fs.rm(registryDir, { recursive: true, force: true });
  } catch {
    // best effort
  }
  await fs.mkdir(registryDir, { recursive: true });
}

async function pathMissing(targetPath) {
  try {
    await fs.access(targetPath);
    return false;
  } catch {
    return true;
  }
}

async function fileSizeOrZero(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

async function waitForRegistryWrite(registryDir, previousSize, timeoutMs) {
  const recordsPath = path.join(registryDir, "records.jsonl");
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const size = await fileSizeOrZero(recordsPath);
    if (size > previousSize) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function runAgentTurn({ stateDir, agentId, sessionId, message, timeoutMs }) {
  const timeoutSeconds = Math.max(5, Math.ceil(timeoutMs / 1000));
  const maxAttempts = process.env.UMC_EVAL_EXECUTION_ENV === "docker" ? 1 : 2;
  let last = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await runCommand("openclaw", [
      "agent",
      "--agent",
      agentId,
      "--local",
      "--thinking",
      "off",
      "--timeout",
      String(timeoutSeconds),
      "--json",
      "--session-id",
      sessionId,
      "--message",
      message
    ], {
      timeoutMs,
      env: { OPENCLAW_STATE_DIR: stateDir }
    });

    if (!result.ok) {
      last = {
        ok: false,
        error: result.error,
        stdout: result.stdout,
        stderr: result.stderr
      };
      continue;
    }

    try {
      const payload = extractJsonPayload(pickJsonText(result.stdout, result.stderr));
      const answer = extractAgentText(payload);
      if (!answer && attempt === 0) {
        last = {
          ok: false,
          error: "empty_answer",
          stdout: result.stdout,
          stderr: result.stderr
        };
        continue;
      }
      return {
        ok: true,
        payload,
        answer,
        stdout: result.stdout,
        stderr: result.stderr
      };
    } catch (error) {
      last = {
        ok: false,
        error: `json_parse_failed: ${String(error)}`,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }
  }

  return last || {
    ok: false,
    error: "unknown_failure"
  };
}

async function runCaseForMode(caseDef, args, includeUMC, baseState) {
  const caseStartedAt = Date.now();
  const cloneStartedAt = Date.now();
  const stateDir = await cloneEvalStateDir(
    baseState.stateDir,
    includeUMC ? "umc-ordinary-current-case-" : "umc-ordinary-legacy-case-"
  );
  const cloneMs = Date.now() - cloneStartedAt;
  const state = {
    stateDir,
    registryDir: path.join(stateDir, "registry"),
    stateRootKey: path.basename(stateDir),
    registryRootKey: path.relative(os.tmpdir(), path.join(stateDir, "registry"))
  };
  let output = null;

  try {
    const recordsSizeBefore = includeUMC
      ? await fileSizeOrZero(path.join(state.registryDir, "records.jsonl"))
      : 0;
    const captureStartedAt = Date.now();
    const capture = await runAgentTurn({
      stateDir: state.stateDir,
      agentId: args.agentId,
      sessionId: `${caseDef.id}-capture`,
      message: caseDef.captureMessage,
      timeoutMs: args.timeoutMs
    });
    const captureMs = Date.now() - captureStartedAt;
    const captureFailed = capture.ok !== true;
    let captureObserved = false;
    let captureWaitMs = 0;
    if (!captureFailed) {
      const captureWaitStartedAt = Date.now();
      captureObserved = includeUMC && caseDef.category !== "one_off_instruction"
        ? await waitForRegistryWrite(state.registryDir, recordsSizeBefore, args.capturePollMs)
        : false;
      captureWaitMs = Date.now() - captureWaitStartedAt;
    }
    const sessionClearStartedAt = Date.now();
    await clearSessionArtifacts(state.stateDir, args.agentId);
    const sessionClearMs = Date.now() - sessionClearStartedAt;
    const sessionClearOk = await pathMissing(path.join(state.stateDir, "agents", args.agentId, "sessions", `${caseDef.id}-capture.jsonl`));
    let recall = {
      ok: false,
      error: "skipped_due_to_capture_failure",
      answer: ""
    };
    let recallMs = 0;
    if (!(captureFailed && args.fastFailCapture)) {
      const recallStartedAt = Date.now();
      recall = await runAgentTurn({
        stateDir: state.stateDir,
        agentId: args.agentId,
        sessionId: `${caseDef.id}-recall`,
        message: caseDef.recallMessage,
        timeoutMs: args.timeoutMs
      });
      recallMs = Date.now() - recallStartedAt;
    }
    const evaluation = evaluateCase(caseDef, recall);
    output = {
      ...evaluation,
      captureObserved,
      sessionClearOk,
      captureAnswer: capture.answer || "",
      captureError: capture.error || "",
      fastFailedAfterCapture: captureFailed && args.fastFailCapture,
      answer: recall.answer || "",
      error: recall.error || "",
      stateRootKey: state.stateRootKey,
      registryRootKey: includeUMC ? state.registryRootKey : "",
      cleanupOk: false,
      timings: {
        cloneMs,
        captureMs,
        captureWaitMs,
        sessionClearMs,
        recallMs,
        cleanupMs: 0,
        totalCaseMs: 0
      }
    };
    return output;
  } finally {
    const cleanupStartedAt = Date.now();
    if (!args.keepState) {
      await removeStateDir(state.stateDir);
    }
    const cleanupMs = Date.now() - cleanupStartedAt;
    const cleanupOk = args.keepState ? true : await pathMissing(state.stateDir);
    if (output) {
      output.cleanupOk = cleanupOk;
      output.timings.cleanupMs = cleanupMs;
      output.timings.totalCaseMs = Date.now() - caseStartedAt;
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const importedCases = await importCases(args.casesPath);
  const filteredCases = args.only.length
    ? importedCases.filter((item) => args.only.includes(item.id))
    : importedCases;
  const selectedCases = args.maxCases > 0 ? filteredCases.slice(0, args.maxCases) : filteredCases;
  const results = selectedCases.map((item) => ({ ...item }));
  const startedAt = Date.now();

  const legacyBaseStateStartedAt = Date.now();
  const legacyBaseState = await ensureCachedEvalBaseState(args, false);
  const legacyBaseStatePrepMs = Date.now() - legacyBaseStateStartedAt;
  const currentBaseStateStartedAt = Date.now();
  const currentBaseState = await ensureCachedEvalBaseState(args, true);
  const currentBaseStatePrepMs = Date.now() - currentBaseStateStartedAt;
  const effectiveShardCount = Math.min(
    Math.max(1, args.shardCount),
    Math.max(1, Math.ceil(selectedCases.length / Math.max(1, args.shardSize)))
  );
  const shards = shardCases(selectedCases, effectiveShardCount);
  const resultMap = new Map(results.map((item) => [item.id, item]));

  async function runShardCases(items, includeUMC, baseState) {
    const modeName = includeUMC ? "current" : "legacy";
    for (let index = 0; index < items.length; index += 1) {
      const caseDef = items[index];
      process.stderr.write(`[ordinary-ab][${modeName}] shard-case ${index + 1}/${items.length} start ${caseDef.id}\n`);
      // eslint-disable-next-line no-await-in-loop
      const run = await runCaseForMode(caseDef, args, includeUMC, baseState);
      const target = resultMap.get(caseDef.id);
      target[modeName] = run;
      if (includeUMC) {
        process.stderr.write(
          `[ordinary-ab][${modeName}] shard-case ${index + 1}/${items.length} done ${caseDef.id} outcome=${classifyOutcome(target)} current=${run.passed === true} legacy=${target.legacy?.passed === true}\n`
        );
      } else {
        process.stderr.write(
          `[ordinary-ab][${modeName}] shard-case ${index + 1}/${items.length} done ${caseDef.id} passed=${run.passed === true}\n`
        );
      }
    }
  }

  await Promise.all(
    shards.map((items, index) => {
      process.stderr.write(`[ordinary-ab][legacy] shard ${index + 1}/${shards.length} cases=${items.length}\n`);
      return runShardCases(items, false, legacyBaseState);
    })
  );

  await Promise.all(
    shards.map((items, index) => {
      process.stderr.write(`[ordinary-ab][current] shard ${index + 1}/${shards.length} cases=${items.length}\n`);
      return runShardCases(items, true, currentBaseState);
    })
  );

  const report = {
    generatedAt: new Date().toISOString(),
    casesPath: args.casesPath,
    agentId: args.agentId,
    sourceAgentId: args.sourceAgentId,
    environment: {
      executionEnvironment: normalizeString(process.env.UMC_EVAL_EXECUTION_ENV, "host"),
      dockerImage: normalizeString(process.env.UMC_EVAL_DOCKER_IMAGE),
      fixtureRoot: args.fixtureRoot,
      pluginPath: args.pluginPath,
      authProfilesPath: args.authProfilesPath ? "(mounted auth profiles)" : "(none)",
      hostSeededFromHome: false,
      shardCount: shards.length,
      fastFailCapture: args.fastFailCapture,
      totalWallClockMs: Date.now() - startedAt,
      baseStateReuse: true,
      legacyBaseStateKey: legacyBaseState.baseStateRootKey,
      currentBaseStateKey: currentBaseState.baseStateRootKey,
      templateCacheRoot: args.templateCacheRoot,
      legacyBaseStatePrepMs,
      currentBaseStatePrepMs,
      templateCacheHits: {
        legacy: legacyBaseState.cacheHit === true,
        current: currentBaseState.cacheHit === true
      }
    },
    timing: summarizeTimings(results, {
      legacyBaseStatePrepMs,
      currentBaseStatePrepMs
    }),
    summary: summarizeResults(results),
    results
  };

  await writeText(args.writeJson, `${JSON.stringify(report, null, 2)}\n`);
  await writeText(args.writeMarkdown, renderMarkdown(report));

  if (args.format === "json") {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  process.stdout.write(renderMarkdown(report));
}

await main();
