#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

import { extractJsonPayload } from "../src/retrieval.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const date = new Date().toISOString().slice(0, 10);
const repoRoot = path.resolve(__dirname, "..");
const defaultCasesPath = path.resolve(__dirname, "../evals/openclaw-ordinary-conversation-memory-intent-ab-cases.js");

function parseArgs(argv) {
  const args = {
    agentId: "rtab",
    sourceAgentId: "main",
    casesPath: defaultCasesPath,
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
    else if (arg === "--cases") args.casesPath = path.resolve(repoRoot, argv[++index]);
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
    captureObserved: results.filter((item) => item.current?.captureObserved === true).length
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
  lines.push("");
  lines.push("## Method");
  lines.push("");
  lines.push("- Each case runs a real `openclaw agent --local` capture turn, then prunes session transcripts before the recall turn.");
  lines.push("- The benchmark does not interleave systems case-by-case. It runs all `legacy builtin` cases first in isolated temp state roots, deletes those state roots, and only then runs all `current` Unified Memory Core cases in fresh isolated temp state roots.");
  lines.push("- Each case still gets its own isolated state root so earlier cases cannot leak durable memory into later cases.");
  lines.push("- This isolates explicit long-memory behavior from short-lived session/bootstrap carry-over.");
  lines.push("- `current` means the repo checkout loaded as the OpenClaw `unified-memory-core` context engine, with ordinary-conversation governed `memory_intent` enabled.");
  lines.push("- `legacy` means the default `legacy` context engine with no `unified-memory-core` plugin loaded.");
  lines.push("- OpenClaw ships a separate `memory-lancedb` plugin, but it is not active in the current host default config, so this focused A/B measures the actual current default host path rather than a hypothetical enabled-autoCapture setup.");
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

async function writeText(filePath, text) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text, "utf8");
}

async function runCommand(bin, args, options = {}) {
  try {
    const result = await execFileAsync(bin, args, {
      cwd: repoRoot,
      env: { ...process.env, ...(options.env || {}) },
      maxBuffer: 8 * 1024 * 1024,
      timeout: options.timeoutMs
    });
    return {
      ok: true,
      stdout: String(result.stdout || ""),
      stderr: String(result.stderr || "")
    };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || ""),
      stderr: String(error.stderr || ""),
      error: String(error?.message || error)
    };
  }
}

async function createEvalStateDir({ includeUMC, agentId, sourceAgentId }) {
  const sourceRoot = path.join(os.homedir(), ".openclaw");
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), includeUMC ? "umc-ordinary-current-" : "umc-ordinary-legacy-"));
  const workspaceDir = path.join(tempRoot, "workspace");
  const registryDir = path.join(tempRoot, "registry");
  await fs.mkdir(workspaceDir, { recursive: true });

  const raw = await fs.readFile(path.join(sourceRoot, "openclaw.json"), "utf8");
  const config = JSON.parse(raw);
  config.agents = config.agents || {};
  config.agents.list = [{
    id: agentId,
    name: agentId,
    workspace: workspaceDir,
    agentDir: path.join(tempRoot, "agents", agentId, "agent"),
    model: config.agents?.defaults?.model,
    memorySearch: {
      provider: "none",
      fallback: "none"
    }
  }];

  config.plugins = config.plugins || {};
  config.plugins.allow = includeUMC ? ["unified-memory-core"] : [];
  config.plugins.slots = {
    ...(config.plugins.slots || {}),
    contextEngine: includeUMC ? "unified-memory-core" : "legacy"
  };
  config.plugins.load = { paths: includeUMC ? [repoRoot] : [] };
  config.plugins.entries = includeUMC
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
    : {};
  config.plugins.installs = {};
  config.tools = {
    ...(config.tools || {}),
    allow: []
  };

  await writeText(path.join(tempRoot, "openclaw.json"), `${JSON.stringify(config, null, 2)}\n`);
  await copyRecursive(
    path.join(sourceRoot, "agents", sourceAgentId, "agent"),
    path.join(tempRoot, "agents", agentId, "agent")
  );
  const sessionsDir = path.join(tempRoot, "agents", agentId, "sessions");
  await fs.mkdir(sessionsDir, { recursive: true });
  await writeText(path.join(sessionsDir, "sessions.json"), "{}\n");

  return {
    stateDir: tempRoot,
    registryDir
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
  let last = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await runCommand("openclaw", [
      "agent",
      "--agent",
      agentId,
      "--local",
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

async function runCaseForMode(caseDef, args, includeUMC) {
  const state = await createEvalStateDir({
    includeUMC,
    agentId: args.agentId,
    sourceAgentId: args.sourceAgentId
  });

  try {
    const recordsSizeBefore = includeUMC
      ? await fileSizeOrZero(path.join(state.registryDir, "records.jsonl"))
      : 0;
    const capture = await runAgentTurn({
      stateDir: state.stateDir,
      agentId: args.agentId,
      sessionId: `${caseDef.id}-capture`,
      message: caseDef.captureMessage,
      timeoutMs: args.timeoutMs
    });
    const captureObserved = includeUMC && caseDef.category !== "one_off_instruction"
      ? await waitForRegistryWrite(state.registryDir, recordsSizeBefore, args.capturePollMs)
      : false;
    await clearSessionArtifacts(state.stateDir, args.agentId);
    const recall = await runAgentTurn({
      stateDir: state.stateDir,
      agentId: args.agentId,
      sessionId: `${caseDef.id}-recall`,
      message: caseDef.recallMessage,
      timeoutMs: args.timeoutMs
    });
    const evaluation = evaluateCase(caseDef, recall);
    return {
      ...evaluation,
      captureObserved,
      captureAnswer: capture.answer || "",
      answer: recall.answer || "",
      error: recall.error || ""
    };
  } finally {
    await removeStateDir(state.stateDir);
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

  for (let index = 0; index < selectedCases.length; index += 1) {
    const caseDef = selectedCases[index];
    process.stderr.write(`[ordinary-ab][legacy] ${index + 1}/${selectedCases.length} start ${caseDef.id}\n`);
    // eslint-disable-next-line no-await-in-loop
    const legacy = await runCaseForMode(caseDef, args, false);
    results[index].legacy = legacy;
    process.stderr.write(`[ordinary-ab][legacy] ${index + 1}/${selectedCases.length} done ${caseDef.id} passed=${legacy.passed === true}\n`);
  }

  for (let index = 0; index < selectedCases.length; index += 1) {
    const caseDef = selectedCases[index];
    process.stderr.write(`[ordinary-ab][current] ${index + 1}/${selectedCases.length} start ${caseDef.id}\n`);
    // eslint-disable-next-line no-await-in-loop
    const current = await runCaseForMode(caseDef, args, true);
    results[index].current = current;
    process.stderr.write(
      `[ordinary-ab][current] ${index + 1}/${selectedCases.length} done ${caseDef.id} outcome=${classifyOutcome(results[index])} current=${current.passed === true} legacy=${results[index].legacy?.passed === true}\n`
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    casesPath: args.casesPath,
    agentId: args.agentId,
    sourceAgentId: args.sourceAgentId,
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
