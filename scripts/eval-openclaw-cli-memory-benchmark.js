#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

import { extractJsonPayload, searchLocalMemoryIndex } from "../src/retrieval.js";
import { buildAgentEvalPrompt } from "../src/openclaw-agent-eval-prompt.js";
import { rewriteRetrievalQueries } from "../src/query-rewrite.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultCasesPath = path.resolve(__dirname, "../evals/openclaw-cli-memory-benchmark-cases.js");
const defaultJsonPath = path.resolve(
  __dirname,
  `../reports/openclaw-cli-memory-benchmark-${new Date().toISOString().slice(0, 10)}.json`
);
const defaultMarkdownPath = path.resolve(
  __dirname,
  `../reports/generated/openclaw-cli-memory-benchmark-${new Date().toISOString().slice(0, 10)}.md`
);

function parseArgs(argv) {
  const args = {
    openclawBin: "openclaw",
    agentId: "umceval",
    casesPath: defaultCasesPath,
    format: "markdown",
    writeJson: defaultJsonPath,
    writeMarkdown: defaultMarkdownPath,
    only: [],
    categories: [],
    entrypoints: [],
    maxCases: 0,
    searchTimeoutMs: 30_000,
    agentTimeoutMs: 120_000,
    maxResults: 5,
    skipLegacy: false,
    rawSearchCli: false,
    agentToolHint: true,
    agentLocal: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--openclaw-bin") args.openclawBin = argv[++index];
    else if (arg === "--agent") args.agentId = argv[++index];
    else if (arg === "--cases") args.casesPath = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--format") args.format = argv[++index];
    else if (arg === "--write-json") args.writeJson = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--write-markdown") args.writeMarkdown = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--only") {
      args.only = String(argv[++index] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    else if (arg === "--categories") {
      args.categories = String(argv[++index] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    else if (arg === "--entrypoints") {
      args.entrypoints = String(argv[++index] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    else if (arg === "--max-cases") args.maxCases = Number(argv[++index] || 0);
    else if (arg === "--search-timeout-ms") args.searchTimeoutMs = Number(argv[++index] || 30_000);
    else if (arg === "--agent-timeout-ms") args.agentTimeoutMs = Number(argv[++index] || 120_000);
    else if (arg === "--max-results") args.maxResults = Number(argv[++index] || 5);
    else if (arg === "--skip-legacy") args.skipLegacy = true;
    else if (arg === "--raw-search-cli") args.rawSearchCli = true;
    else if (arg === "--no-agent-tool-hint") args.agentToolHint = false;
    else if (arg === "--agent-local") args.agentLocal = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/eval-openclaw-cli-memory-benchmark.js [options]",
          "",
          "Options:",
          "  --agent <id>                OpenClaw agent id (default: umceval)",
          "  --cases <path>              Benchmark case module path",
          "  --format <json|markdown>    stdout format",
          "  --write-json <path>         Write machine-readable report",
          "  --write-markdown <path>     Write human-readable report",
          "  --only <ids>                Comma-separated case ids",
          "  --categories <names>        Comma-separated category filters",
          "  --entrypoints <names>       Comma-separated entrypoint filters",
          "  --max-cases <n>             Limit case count",
          "  --search-timeout-ms <ms>    Timeout for openclaw memory search",
          "  --agent-timeout-ms <ms>     Timeout for openclaw agent",
          "  --max-results <n>           Memory search max results",
          "  --skip-legacy               Skip legacy A/B runs",
          "  --raw-search-cli            Force raw `openclaw memory search` before sqlite fallback",
          "  --no-agent-tool-hint        Do not prepend the explicit memory_search tool hint for agent cases",
          "  --agent-local               Run answer-level cases via `openclaw agent --local`"
        ].join("\n")
      );
      process.exit(0);
    }
  }

  return args;
}

function familyFromPath(pathValue) {
  const text = String(pathValue || "");
  if (!text) return "unknown";
  if (text.includes("MEMORY.md")) return "MEMORY.md";
  if (text.includes("notes/")) return "notes/%";
  if (text.includes("memory/")) return "memory/%";
  if (text.includes("sessions/")) return "sessions/%";
  return "other";
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

function hasChinese(text = "") {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

function hitsExpectedSources(results, expectedSources = []) {
  if (!expectedSources.length) return true;
  return results.some((item) => {
    const target = `${item?.path || ""}\n${item?.citation || ""}\n${item?.source || ""}`;
    return expectedSources.some((pattern) => target.includes(pattern));
  });
}

function hitsExpectedSourceGroups(results, expectedSourceGroups = []) {
  if (!expectedSourceGroups.length) return true;
  return expectedSourceGroups.every((group) => {
    const patterns = Array.isArray(group) ? group : [group];
    return results.some((item) => {
      const target = `${item?.path || ""}\n${item?.citation || ""}\n${item?.source || ""}`;
      return patterns.some((pattern) => target.includes(pattern));
    });
  });
}

function summarizeFamilies(results = []) {
  const counts = {};
  for (const item of results) {
    const key = familyFromPath(item?.path);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function mergeFallbackResults(items = [], limit = 5) {
  const merged = new Map();
  for (const item of items) {
    const key = `${item?.path || ""}::${item?.startLine || 0}::${item?.endLine || 0}`;
    const previous = merged.get(key);
    if (!previous || Number(item?.score || 0) > Number(previous?.score || 0)) {
      merged.set(key, item);
    }
  }
  return [...merged.values()]
    .sort((left, right) => Number(right?.score || 0) - Number(left?.score || 0))
    .slice(0, limit);
}

async function runCommand(bin, args, options = {}) {
  try {
    const result = await execFileAsync(bin, args, {
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

function pickJsonText(stdout = "", stderr = "") {
  return String(stdout || "").trim() ? String(stdout || "") : String(stderr || "");
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

async function resetAgentSessionState(agentId) {
  const sessionsDir = path.join(os.homedir(), ".openclaw", "agents", agentId, "sessions");
  try {
    await fs.mkdir(sessionsDir, { recursive: true });
    const entries = await fs.readdir(sessionsDir);
    for (const entry of entries) {
      await fs.rm(path.join(sessionsDir, entry), { force: true, recursive: true });
    }
    await fs.writeFile(path.join(sessionsDir, "sessions.json"), "{}\n", "utf8");
  } catch {
    // best effort; local answer-level eval should not fail just because cleanup was partial
  }
}

async function prepareLegacyStateDir(agentId) {
  const sourceRoot = path.join(os.homedir(), ".openclaw");
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-bench-legacy-"));
  const sourceConfigPath = path.join(sourceRoot, "openclaw.json");
  const targetConfigPath = path.join(tempRoot, "openclaw.json");
  const raw = await fs.readFile(sourceConfigPath, "utf8");
  const config = JSON.parse(raw);
  config.plugins = config.plugins || {};
  config.plugins.slots = config.plugins.slots || {};
  config.plugins.slots.contextEngine = "legacy";
  config.plugins.allow = Array.isArray(config.plugins.allow)
    ? config.plugins.allow.filter((item) => item !== "unified-memory-core")
    : config.plugins.allow;
  if (config.plugins.load && Array.isArray(config.plugins.load.paths)) {
    config.plugins.load.paths = config.plugins.load.paths.filter(
      (item) => !String(item || "").includes("unified-memory-core")
    );
  }
  if (config.plugins.entries && typeof config.plugins.entries === "object") {
    delete config.plugins.entries["unified-memory-core"];
  }
  if (config.plugins.installs && typeof config.plugins.installs === "object") {
    delete config.plugins.installs["unified-memory-core"];
  }
  await fs.writeFile(targetConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  const maybePaths = [
    [path.join(sourceRoot, "agents", agentId, "agent"), path.join(tempRoot, "agents", agentId, "agent")],
    [path.join(sourceRoot, "memory", `${agentId}.sqlite`), path.join(tempRoot, "memory", `${agentId}.sqlite`)]
  ];

  for (const [sourcePath, targetPath] of maybePaths) {
    try {
      await copyRecursive(sourcePath, targetPath);
    } catch {
      // optional
    }
  }

  return tempRoot;
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

function extractInjectedWorkspaceFiles(payload) {
  const items =
    payload?.result?.systemPromptReport?.injectedWorkspaceFiles
    || payload?.meta?.systemPromptReport?.injectedWorkspaceFiles
    || [];
  return items.map((item) => item?.name || item?.path || "");
}

function buildCaseText(caseDef, run) {
  if (!run) return "";
  if (caseDef.entrypoint === "memory_search") {
    return (run.results || [])
      .map((item) => `${item?.path || ""}\n${item?.snippet || ""}`)
      .join("\n");
  }
  return run.answer || "";
}

function evaluateCase(caseDef, run) {
  if (!run || run.ok !== true) {
    return {
      passed: false,
      expectedAnyOk: false,
      expectedAllOk: false,
      forbiddenOk: false,
      sourcesOk: false,
      reason: run?.error || "command failed"
    };
  }
  const text = buildCaseText(caseDef, run);
  const expectedAnyOk = includesAny(text, caseDef.expectedAny || []);
  const expectedAllOk = includesAll(text, caseDef.expectedAll || []);
  const forbiddenOk = excludesAll(text, caseDef.forbiddenAny || []);
  const sourcesOk =
    caseDef.entrypoint === "memory_search"
      ? (
        hitsExpectedSources(run.results || [], caseDef.expectedSources || [])
        && hitsExpectedSourceGroups(run.results || [], caseDef.expectedSourceGroups || [])
      )
      : true;
  const passed = expectedAnyOk && expectedAllOk && forbiddenOk && sourcesOk;
  return {
    passed,
    expectedAnyOk,
    expectedAllOk,
    forbiddenOk,
    sourcesOk,
    reason: passed ? "matched" : "expectation mismatch"
  };
}

function classifyAttribution(caseDef, unifiedEval, legacyEval, unifiedRun) {
  if (caseDef.compareLegacy !== true) {
    return "not-compared";
  }
  if (!unifiedEval.passed) {
    return "unified-failed";
  }
  if (!legacyEval) {
    return "legacy-skipped";
  }
  if (legacyEval.passed) {
    return caseDef.attributionKind === "retrieval"
      ? "shared-baseline-retrieval"
      : "shared-capability";
  }
  if (caseDef.attributionKind === "bootstrap") {
    const injected = Array.isArray(unifiedRun?.injectedWorkspaceFiles)
      ? unifiedRun.injectedWorkspaceFiles
      : [];
    return injected.includes("MEMORY.md")
      ? "unified-better-bootstrap-use"
      : "unified-bootstrap-leaning";
  }
  if (caseDef.attributionKind === "temporal") {
    return "unified-temporal-gain";
  }
  if (caseDef.attributionKind === "retrieval") {
    return "unified-retrieval-gain";
  }
  if (caseDef.attributionKind === "negative") {
    return "shared-abstention";
  }
  return "unified-gain";
}

async function runSearchCase(caseDef, args, env) {
  let command = { ok: false, error: "raw search cli skipped by default" };
  if (args.rawSearchCli) {
    command = await runCommand(
      args.openclawBin,
      [
        "memory",
        "search",
        "--agent",
        args.agentId,
        "--query",
        caseDef.query,
        "--max-results",
        String(args.maxResults),
        "--json"
      ],
      { timeoutMs: args.searchTimeoutMs, env }
    );

    if (command.ok) {
      try {
        const payload = extractJsonPayload(command.stdout);
        const results = Array.isArray(payload?.results) ? payload.results : [];
        return {
          ok: true,
          transport: "openclaw_cli",
          results,
          topFamilies: summarizeFamilies(results),
          provider: payload?.provider || "",
          mode: payload?.mode || ""
        };
      } catch (error) {
        command.error = String(error?.message || error);
      }
    }
  }

  const fallbackQueries = rewriteRetrievalQueries(caseDef.query, { maxQueries: 4 });
  const fallbackResults = mergeFallbackResults(
    fallbackQueries.flatMap((query) =>
      searchLocalMemoryIndex({
        agentId: args.agentId,
        query,
        maxCandidates: args.maxResults,
        logger: { debug() {} },
        env: { ...process.env, ...(env || {}) }
      })
    ),
    args.maxResults
  );
  if (Array.isArray(fallbackResults) && fallbackResults.length > 0) {
    return {
      ok: true,
      transport: args.rawSearchCli ? "local_sqlite_fallback" : "local_sqlite_index",
      results: fallbackResults.map((item) => ({
        path: item.path,
        snippet: item.snippet,
        source: item.source,
        citation: item.path
      })),
      topFamilies: summarizeFamilies(fallbackResults),
      provider: "local-sqlite",
      mode: "fallback"
    };
  }
  return {
    ok: false,
    error: command.error || "openclaw memory search failed and fallback returned no results",
    stdout: command.stdout,
    stderr: command.stderr
  };
}

async function runAgentCase(caseDef, args, env) {
  if (args.agentLocal) {
    await resetAgentSessionState(args.agentId);
  }
  const sessionId = `umc-bench-${caseDef.id}-${randomUUID().slice(0, 8)}`;
  const timeoutSecs = Math.max(10, Math.ceil(args.agentTimeoutMs / 1000));
  const message = buildAgentEvalPrompt(caseDef.message, {
    toolHintEnabled: args.agentToolHint
  });
  const command = await runCommand(
    args.openclawBin,
    [
      "agent",
      ...(args.agentLocal ? ["--local"] : []),
      "--agent",
      args.agentId,
      "--session-id",
      sessionId,
      "--thinking",
      "off",
      "--timeout",
      String(timeoutSecs),
      "--json",
      "--message",
      message
    ],
    { timeoutMs: args.agentTimeoutMs, env }
  );
  try {
    const payload = extractJsonPayload(pickJsonText(command.stdout, command.stderr));
    return {
      ok: true,
      transport: args.agentLocal ? "agent_local" : "agent",
      answer: extractAgentText(payload),
      injectedWorkspaceFiles: extractInjectedWorkspaceFiles(payload),
      observedSessionKey:
        payload?.result?.systemPromptReport?.sessionKey
        || payload?.meta?.systemPromptReport?.sessionKey
        || "",
      observedSessionId:
        payload?.result?.meta?.agentMeta?.sessionId
        || payload?.meta?.agentMeta?.sessionId
        || "",
      warning: command.ok ? "" : (command.error || command.stderr || "").trim()
    };
  } catch (error) {
    if (!command.ok) {
      return { ok: false, error: command.error, stdout: command.stdout, stderr: command.stderr };
    }
    return {
      ok: false,
      error: String(error?.message || error),
      stdout: command.stdout
    };
  }
}

async function runOne(caseDef, args, legacyStateDir) {
  const currentRun =
    caseDef.entrypoint === "memory_search"
      ? await runSearchCase(caseDef, args)
      : await runAgentCase(caseDef, args);
  const currentEval = evaluateCase(caseDef, currentRun);

  let legacyRun = null;
  let legacyEval = null;
  if (caseDef.compareLegacy === true && !args.skipLegacy && legacyStateDir) {
    legacyRun =
      caseDef.entrypoint === "memory_search"
        ? await runSearchCase(caseDef, args, { OPENCLAW_STATE_DIR: legacyStateDir })
        : await runAgentCase(caseDef, args, { OPENCLAW_STATE_DIR: legacyStateDir });
    legacyEval = evaluateCase(caseDef, legacyRun);
  }

  const attribution = classifyAttribution(caseDef, currentEval, legacyEval, currentRun);
  return {
    id: caseDef.id,
    category: caseDef.category,
    entrypoint: caseDef.entrypoint,
    query: caseDef.query || "",
    message: caseDef.message || "",
    compareLegacy: caseDef.compareLegacy === true,
    attributionKind: caseDef.attributionKind || "",
    attribution,
    current: {
      ...currentRun,
      ...currentEval
    },
    legacy: legacyRun
      ? {
          ...legacyRun,
          ...legacyEval
        }
      : null
  };
}

function summarizeResults(results) {
  const byCategory = {};
  const byAttribution = {};
  const byTransport = {};
  const byEntrypoint = {};
  const byLanguage = {
    zhBearing: 0,
    nonZh: 0
  };
  let abstained = 0;
  for (const result of results) {
    const category = result.category || "unknown";
    const attribution = result.attribution || "unknown";
    byCategory[category] ||= { total: 0, passed: 0 };
    byCategory[category].total += 1;
    if (result.current?.passed) {
      byCategory[category].passed += 1;
    }
    byAttribution[attribution] = (byAttribution[attribution] || 0) + 1;
    const transport = result.current?.transport || result.entrypoint;
    byTransport[transport] = (byTransport[transport] || 0) + 1;
    byEntrypoint[result.entrypoint] = (byEntrypoint[result.entrypoint] || 0) + 1;
    const prompt = result.query || result.message || "";
    if (hasChinese(prompt)) {
      byLanguage.zhBearing += 1;
    } else {
      byLanguage.nonZh += 1;
    }
    if (String(result.current?.observed || "").includes("I don't know based on current memory.")) {
      abstained += 1;
    }
  }

  return {
    total: results.length,
    passed: results.filter((item) => item.current?.passed).length,
    failed: results.filter((item) => !item.current?.passed).length,
    comparedLegacy: results.filter((item) => item.compareLegacy).length,
    legacyPassed: results.filter((item) => item.legacy?.passed).length,
    abstained,
    abstentionRate: results.length > 0 ? Number((abstained / results.length).toFixed(4)) : 0,
    byLanguage,
    byCategory,
    byAttribution,
    byTransport,
    byEntrypoint
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# OpenClaw CLI Memory Benchmark");
  lines.push("");
  lines.push(`- generatedAt: \`${report.generatedAt}\``);
  lines.push(`- agent: \`${report.agentId}\``);
  lines.push(`- totalCases: \`${report.summary.total}\``);
  lines.push(`- currentPassed: \`${report.summary.passed}\``);
  lines.push(`- currentFailed: \`${report.summary.failed}\``);
  lines.push(`- legacyCompared: \`${report.summary.comparedLegacy}\``);
  lines.push(`- legacyPassed: \`${report.summary.legacyPassed}\``);
  lines.push(`- abstained: \`${report.summary.abstained}\``);
  lines.push(`- abstentionRate: \`${report.summary.abstentionRate}\``);
  lines.push(
    `- zhBearingCases: \`${report.summary.byLanguage?.zhBearing || 0}/${report.summary.total}\``
  );
  lines.push("");
  lines.push("## Language Summary");
  for (const [key, count] of Object.entries(report.summary.byLanguage || {})) {
    lines.push(`- ${key}: \`${count}\``);
  }
  lines.push("");
  lines.push("## Category Summary");
  for (const [category, stats] of Object.entries(report.summary.byCategory)) {
    lines.push(`- ${category}: \`${stats.passed}/${stats.total}\``);
  }
  lines.push("");
  lines.push("## Attribution Summary");
  for (const [key, count] of Object.entries(report.summary.byAttribution)) {
    lines.push(`- ${key}: \`${count}\``);
  }
  lines.push("");
  lines.push("## Transport Summary");
  for (const [key, count] of Object.entries(report.summary.byTransport)) {
    lines.push(`- ${key}: \`${count}\``);
  }
  lines.push("");
  lines.push("## Entrypoint Summary");
  for (const [key, count] of Object.entries(report.summary.byEntrypoint)) {
    lines.push(`- ${key}: \`${count}\``);
  }
  lines.push("");
  lines.push("## Failing Cases");
  const failing = report.results.filter((item) => !item.current?.passed);
  if (failing.length === 0) {
    lines.push("- none");
  } else {
    for (const item of failing) {
      lines.push(`- ${item.id}: ${item.current?.reason || "failed"}`);
    }
  }
  lines.push("");
  lines.push("## Sample Results");
  for (const item of report.results.slice(0, 12)) {
    const prompt = item.query || item.message;
    const answer =
      item.entrypoint === "memory_search"
        ? item.current?.results?.[0]?.snippet || ""
        : item.current?.answer || "";
    lines.push(`- ${item.id} [${item.category}] \`${item.entrypoint}\` pass=\`${item.current?.passed}\` attribution=\`${item.attribution}\``);
    lines.push(`  prompt: ${prompt}`);
    lines.push(`  observed: ${String(answer).slice(0, 180).replace(/\n/g, " ")}`);
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("- This script supports both retrieval-level and answer-level cases; the entrypoint summary above shows which ones were selected in this run.");
  lines.push("- Search-heavy cases default to the same OpenClaw agent sqlite index because raw `openclaw memory search` is currently unstable on this host.");
  lines.push("- Use `--raw-search-cli` only when you explicitly want to probe that unstable transport and accept fallback noise.");
  lines.push("- Legacy comparison is only enabled for benchmark-critical attribution cases, not the full matrix.");
  lines.push("- The current fixture mirror lives under `evals/openclaw-cli-memory-fixture/`.");
  lines.push(`- Agent cases ${report.agentToolHint === false ? "do not use" : "use"} an explicit memory_search tool hint before answering.`);
  lines.push(`- Agent cases ${report.agentLocal === true ? "run via `openclaw agent --local` to avoid gateway/session-lock noise" : "run via the default gateway path"}.`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let cases = await importCases(args.casesPath);
  if (args.only.length > 0) {
    const allow = new Set(args.only);
    cases = cases.filter((item) => allow.has(item.id));
  }
  if (args.categories.length > 0) {
    const allow = new Set(args.categories);
    cases = cases.filter((item) => allow.has(item.category));
  }
  if (args.entrypoints.length > 0) {
    const allow = new Set(args.entrypoints);
    cases = cases.filter((item) => allow.has(item.entrypoint));
  }
  if (args.maxCases > 0) {
    cases = cases.slice(0, args.maxCases);
  }
  if (cases.length === 0) {
    throw new Error("No benchmark cases selected.");
  }

  const legacyStateDir = args.skipLegacy ? null : await prepareLegacyStateDir(args.agentId);
  const results = [];
  for (const caseDef of cases) {
    console.error(`[benchmark] running ${caseDef.id} entrypoint=${caseDef.entrypoint}`);
    const result = await runOne(caseDef, args, legacyStateDir);
    results.push(result);
    console.error(
      `[benchmark] finished ${caseDef.id} pass=${result.current?.passed} attribution=${result.attribution}`
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    agentId: args.agentId,
    agentToolHint: args.agentToolHint,
    agentLocal: args.agentLocal,
    casesPath: args.casesPath,
    summary: summarizeResults(results),
    results
  };

  if (args.writeJson) {
    await fs.mkdir(path.dirname(args.writeJson), { recursive: true });
    await fs.writeFile(args.writeJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  if (args.writeMarkdown) {
    await fs.mkdir(path.dirname(args.writeMarkdown), { recursive: true });
    await fs.writeFile(args.writeMarkdown, renderMarkdown(report), "utf8");
  }

  if (args.format === "json") {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderMarkdown(report));
  }

  if (report.summary.failed > 0) {
    process.exitCode = 1;
  }
}

await main();
