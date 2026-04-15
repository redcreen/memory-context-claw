#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const date = new Date().toISOString().slice(0, 10);
const defaultCasesPath = path.resolve(__dirname, "../evals/openclaw-memory-improvement-ab-cases.js");
const dropPlugins = ["openclaw-task-system", "openclaw-lark", "style-engine"];

function parseArgs(argv) {
  const args = {
    agentId: process.env.UMC_EVAL_AGENT || "umceval65",
    casesPath: defaultCasesPath,
    format: "markdown",
    maxCases: 0,
    shardSize: 25,
    shardCount: 4,
    agentTimeoutMs: 20_000,
    writeJson: path.resolve(process.cwd(), `reports/openclaw-memory-improvement-ab-${date}.json`),
    writeMarkdown: path.resolve(process.cwd(), `reports/generated/openclaw-memory-improvement-ab-${date}.md`)
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--agent") args.agentId = argv[++index];
    else if (arg === "--cases") args.casesPath = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--format") args.format = argv[++index];
    else if (arg === "--max-cases") args.maxCases = Number(argv[++index] || 0);
    else if (arg === "--shard-size") args.shardSize = Number(argv[++index] || 25);
    else if (arg === "--shard-count") args.shardCount = Number(argv[++index] || 4);
    else if (arg === "--agent-timeout-ms") args.agentTimeoutMs = Number(argv[++index] || 20_000);
    else if (arg === "--write-json") args.writeJson = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--write-markdown") args.writeMarkdown = path.resolve(process.cwd(), argv[++index]);
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

async function createEvalStateDir({ agentId, includeUMC }) {
  const root = path.join(os.homedir(), ".openclaw");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), includeUMC ? "umc-ab-current-" : "umc-ab-legacy-"));
  const config = JSON.parse(await fs.readFile(path.join(root, "openclaw.json"), "utf8"));
  config.plugins = config.plugins || {};
  config.plugins.slots = config.plugins.slots || {};
  if (!includeUMC) {
    config.plugins.slots.contextEngine = "legacy";
  }
  if (Array.isArray(config.plugins.allow)) {
    config.plugins.allow = config.plugins.allow.filter(
      (item) => !dropPlugins.includes(item) && (includeUMC || item !== "unified-memory-core")
    );
  }
  if (config.plugins.entries && typeof config.plugins.entries === "object") {
    for (const key of [...dropPlugins, ...(includeUMC ? [] : ["unified-memory-core"])]) {
      delete config.plugins.entries[key];
    }
  }
  if (config.plugins.installs && typeof config.plugins.installs === "object") {
    for (const key of [...dropPlugins, ...(includeUMC ? [] : ["unified-memory-core"])]) {
      delete config.plugins.installs[key];
    }
  }
  if (config.plugins.load && Array.isArray(config.plugins.load.paths)) {
    config.plugins.load.paths = config.plugins.load.paths.filter((item) => {
      const text = String(item || "");
      if (dropPlugins.some((name) => text.includes(name))) return false;
      if (!includeUMC && text.includes("unified-memory-core")) return false;
      return true;
    });
  }

  await fs.writeFile(path.join(dir, "openclaw.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  await copyRecursive(path.join(root, "memory", `${agentId}.sqlite`), path.join(dir, "memory", `${agentId}.sqlite`));
  await copyRecursive(path.join(root, "agents", agentId, "agent"), path.join(dir, "agents", agentId, "agent"));
  await fs.mkdir(path.join(dir, "agents", agentId, "sessions"), { recursive: true });
  await fs.writeFile(path.join(dir, "agents", agentId, "sessions", "sessions.json"), "{}\n", "utf8");
  return dir;
}

function detectLanguage(item) {
  return /[\u4e00-\u9fff]/.test(`${item.id}\n${item.message || ""}\n${item.query || ""}`) ? "zh" : "en";
}

function classifyOutcome(item) {
  const unified = item?.current?.passed === true;
  const legacy = item?.legacy?.passed === true;
  if (unified && legacy) return "both_pass";
  if (unified && !legacy) return "umc_only";
  if (!unified && legacy) return "legacy_only";
  return "both_fail";
}

function classifyAttribution(item) {
  if (!item.current?.passed) return "unified-failed";
  if (item.legacy?.passed) {
    return item.attributionKind === "retrieval" ? "shared-baseline-retrieval" : "shared-capability";
  }
  if (item.attributionKind === "bootstrap") return "unified-better-bootstrap-use";
  if (item.attributionKind === "temporal") return "unified-temporal-gain";
  if (item.attributionKind === "history") return "unified-history-gain";
  if (item.attributionKind === "retrieval") return "unified-retrieval-gain";
  if (item.attributionKind === "negative") return "shared-abstention";
  return "unified-gain";
}

function summarizeResults(results) {
  const summary = {
    total: results.length,
    passed: results.filter((item) => item.current?.passed).length,
    failed: results.filter((item) => !item.current?.passed).length,
    comparedLegacy: results.length,
    legacyPassed: results.filter((item) => item.legacy?.passed).length,
    byLanguage: {
      en: { total: 0, unifiedPassed: 0, legacyPassed: 0, bothPass: 0, umcOnly: 0, legacyOnly: 0, bothFail: 0 },
      zh: { total: 0, unifiedPassed: 0, legacyPassed: 0, bothPass: 0, umcOnly: 0, legacyOnly: 0, bothFail: 0 }
    },
    byCategory: {},
    byAttribution: {}
  };

  for (const item of results) {
    const language = detectLanguage(item);
    const outcome = classifyOutcome(item);
    const attribution = item.attribution;
    summary.byLanguage[language].total += 1;
    if (item.current?.passed) summary.byLanguage[language].unifiedPassed += 1;
    if (item.legacy?.passed) summary.byLanguage[language].legacyPassed += 1;
    if (outcome === "both_pass") summary.byLanguage[language].bothPass += 1;
    else if (outcome === "umc_only") summary.byLanguage[language].umcOnly += 1;
    else if (outcome === "legacy_only") summary.byLanguage[language].legacyOnly += 1;
    else summary.byLanguage[language].bothFail += 1;

    summary.byCategory[item.category] ||= { total: 0, unifiedPassed: 0, legacyPassed: 0, umcOnly: 0 };
    summary.byCategory[item.category].total += 1;
    if (item.current?.passed) summary.byCategory[item.category].unifiedPassed += 1;
    if (item.legacy?.passed) summary.byCategory[item.category].legacyPassed += 1;
    if (outcome === "umc_only") summary.byCategory[item.category].umcOnly += 1;

    summary.byAttribution[attribution] = (summary.byAttribution[attribution] || 0) + 1;
  }

  return summary;
}

function pickSamples(results, predicate, limit = 8) {
  return results.filter(predicate).slice(0, limit);
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# OpenClaw Memory Improvement A/B");
  lines.push("");
  lines.push(`- generatedAt: \`${report.generatedAt}\``);
  lines.push(`- agent: \`${report.agentId}\``);
  lines.push(`- shardCount: \`${report.shardCount}\``);
  lines.push(`- totalCases: \`${report.summary.total}\``);
  lines.push(`- unifiedPassed: \`${report.summary.passed}\``);
  lines.push(`- legacyPassed: \`${report.summary.legacyPassed}\``);
  lines.push(`- bothPass: \`${report.results.filter((item) => classifyOutcome(item) === "both_pass").length}\``);
  lines.push(`- umcOnly: \`${report.results.filter((item) => classifyOutcome(item) === "umc_only").length}\``);
  lines.push(`- legacyOnly: \`${report.results.filter((item) => classifyOutcome(item) === "legacy_only").length}\``);
  lines.push(`- bothFail: \`${report.results.filter((item) => classifyOutcome(item) === "both_fail").length}\``);
  lines.push("");
  lines.push("## Language Split");
  lines.push("");
  for (const lang of ["en", "zh"]) {
    const item = report.summary.byLanguage[lang];
    lines.push(`### ${lang === "zh" ? "Chinese" : "English"}`);
    lines.push("");
    lines.push(`- total: \`${item.total}\``);
    lines.push(`- unifiedPassed: \`${item.unifiedPassed}\``);
    lines.push(`- legacyPassed: \`${item.legacyPassed}\``);
    lines.push(`- bothPass: \`${item.bothPass}\``);
    lines.push(`- umcOnly: \`${item.umcOnly}\``);
    lines.push(`- legacyOnly: \`${item.legacyOnly}\``);
    lines.push(`- bothFail: \`${item.bothFail}\``);
    lines.push("");
  }

  lines.push("## Category Summary");
  lines.push("");
  for (const [category, stats] of Object.entries(report.summary.byCategory)) {
    lines.push(`- ${category}: unified=\`${stats.unifiedPassed}/${stats.total}\` legacy=\`${stats.legacyPassed}/${stats.total}\` umcOnly=\`${stats.umcOnly}\``);
  }
  lines.push("");

  lines.push("## Attribution Summary");
  lines.push("");
  for (const [key, value] of Object.entries(report.summary.byAttribution)) {
    lines.push(`- ${key}: \`${value}\``);
  }
  lines.push("");

  const sections = [
    ["UMC-only Samples", pickSamples(report.results, (item) => classifyOutcome(item) === "umc_only")],
    ["Legacy-only Samples", pickSamples(report.results, (item) => classifyOutcome(item) === "legacy_only")],
    ["Both-fail Samples", pickSamples(report.results, (item) => classifyOutcome(item) === "both_fail")],
    ["Shared-baseline Samples", pickSamples(report.results, (item) => classifyOutcome(item) === "both_pass")]
  ];

  for (const [title, items] of sections) {
    lines.push(`## ${title}`);
    lines.push("");
    if (!items.length) {
      lines.push("- none");
      lines.push("");
      continue;
    }
    for (const item of items) {
      lines.push(`- ${item.id} [${item.category}] attribution=\`${item.attribution}\``);
      lines.push(`  prompt: ${item.message || item.query || ""}`);
      lines.push(`  unified: ${String(item.current?.answer || "").replace(/\n/g, " ")}`);
      lines.push(`  legacy: ${String(item.legacy?.answer || "").replace(/\n/g, " ")}`);
    }
    lines.push("");
  }

  lines.push("## Notes");
  lines.push("");
  lines.push("- This suite runs `100` distinct live answer-level questions as real single-question `openclaw agent --local` calls.");
  lines.push("- Each shard uses its own clean OpenClaw state directory so task-system and unrelated host plugins do not pollute the prompt or timing.");
  lines.push("- Both Unified Memory Core and the legacy builtin baseline are evaluated against the same question set, same agent fixture, and same host path.");
  return `${lines.join("\n")}\n`;
}

function shardCases(cases, count) {
  const shards = Array.from({ length: count }, () => []);
  for (let index = 0; index < cases.length; index += 1) {
    shards[index % count].push(cases[index]);
  }
  return shards.filter((items) => items.length > 0);
}

async function runBench({ casesPath, ids, agentId, agentTimeoutMs, stateDir, outputDir, suffix }) {
  const jsonPath = path.join(outputDir, `${suffix}.json`);
  const markdownPath = path.join(outputDir, `${suffix}.md`);
  try {
    await execFileAsync(
      "node",
      [
        path.resolve(__dirname, "./eval-openclaw-cli-memory-benchmark.js"),
        "--cases",
        casesPath,
        "--entrypoints",
        "agent",
        "--agent",
        agentId,
        "--agent-local",
        "--skip-legacy",
        "--agent-timeout-ms",
        String(agentTimeoutMs),
        "--write-json",
        jsonPath,
        "--write-markdown",
        markdownPath,
        "--format",
        "markdown",
        "--only",
        ids.join(",")
      ],
      {
        cwd: path.resolve(__dirname, ".."),
        env: {
          ...process.env,
          OPENCLAW_STATE_DIR: stateDir
        },
        maxBuffer: 16 * 1024 * 1024
      }
    );
  } catch (error) {
    if (!error?.stdout && !error?.stderr) {
      throw error;
    }
  }
  return JSON.parse(await fs.readFile(jsonPath, "utf8"));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let cases = await importCases(args.casesPath);
  if (args.maxCases > 0) {
    cases = cases.slice(0, args.maxCases);
  }
  const shardCount = Math.min(args.shardCount, Math.max(1, Math.ceil(cases.length / Math.max(1, args.shardSize))));
  const shards = shardCases(cases, shardCount);
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-ab-clean-"));

  const shardTasks = shards.map(async (items, index) => {
    const currentStateDir = await createEvalStateDir({ agentId: args.agentId, includeUMC: true });
    const legacyStateDir = await createEvalStateDir({ agentId: args.agentId, includeUMC: false });
    const ids = items.map((item) => item.id);
    console.error(`[ab100] shard ${index + 1}/${shards.length} cases=${ids.length}`);
    const [current, legacy] = await Promise.all([
      runBench({
        casesPath: args.casesPath,
        ids,
        agentId: args.agentId,
        agentTimeoutMs: args.agentTimeoutMs,
        stateDir: currentStateDir,
        outputDir: workDir,
        suffix: `current-${index + 1}`
      }),
      runBench({
        casesPath: args.casesPath,
        ids,
        agentId: args.agentId,
        agentTimeoutMs: args.agentTimeoutMs,
        stateDir: legacyStateDir,
        outputDir: workDir,
        suffix: `legacy-${index + 1}`
      })
    ]);
    return { current, legacy };
  });

  const shardOutputs = await Promise.all(shardTasks);
  const currentResults = new Map();
  const legacyResults = new Map();
  for (const shard of shardOutputs) {
    for (const item of shard.current.results || []) currentResults.set(item.id, item);
    for (const item of shard.legacy.results || []) legacyResults.set(item.id, item);
  }

  const results = cases.map((caseDef) => {
    const currentItem = currentResults.get(caseDef.id);
    const legacyItem = legacyResults.get(caseDef.id);
    const merged = {
      id: caseDef.id,
      category: caseDef.category,
      entrypoint: caseDef.entrypoint,
      query: caseDef.query || "",
      message: caseDef.message || "",
      compareLegacy: true,
      attributionKind: caseDef.attributionKind,
      current: currentItem?.current || { passed: false, answer: "", reason: "missing current result" },
      legacy: legacyItem?.current || { passed: false, answer: "", reason: "missing legacy result" }
    };
    merged.attribution = classifyAttribution(merged);
    return merged;
  });

  const report = {
    generatedAt: new Date().toISOString(),
    agentId: args.agentId,
    shardCount: shards.length,
    casesPath: args.casesPath,
    summary: summarizeResults(results),
    results
  };

  await fs.mkdir(path.dirname(args.writeJson), { recursive: true });
  await fs.mkdir(path.dirname(args.writeMarkdown), { recursive: true });
  await fs.writeFile(args.writeJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(args.writeMarkdown, renderMarkdown(report), "utf8");

  process.stdout.write(
    `${args.format === "json" ? JSON.stringify(report, null, 2) : renderMarkdown(report)}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
