#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

import { extractJsonPayload } from "../src/retrieval.js";
import {
  renderTransportWatchReport,
  summarizeTransportProbeResults
} from "../src/openclaw-memory-search-transport-watch.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultCasesPath = path.resolve(__dirname, "../evals/openclaw-cli-memory-benchmark-cases.js");
const today = new Date().toISOString().slice(0, 10);
const defaultJsonPath = path.resolve(__dirname, `../reports/openclaw-memory-search-transport-watchlist-${today}.json`);
const defaultMarkdownPath = path.resolve(
  __dirname,
  `../reports/generated/openclaw-memory-search-transport-watchlist-${today}.md`
);

function parseArgs(argv) {
  const args = {
    openclawBin: "openclaw",
    agentId: "umceval",
    casesPath: defaultCasesPath,
    perCategory: 3,
    maxProbes: 24,
    timeoutMs: 15_000,
    format: "markdown",
    writeJson: defaultJsonPath,
    writeMarkdown: defaultMarkdownPath
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--openclaw-bin") args.openclawBin = argv[++index];
    else if (arg === "--agent") args.agentId = argv[++index];
    else if (arg === "--cases") args.casesPath = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--per-category") args.perCategory = Number(argv[++index] || 3);
    else if (arg === "--max-probes") args.maxProbes = Number(argv[++index] || 24);
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++index] || 15_000);
    else if (arg === "--format") args.format = argv[++index];
    else if (arg === "--write-json") args.writeJson = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--write-markdown") args.writeMarkdown = path.resolve(process.cwd(), argv[++index]);
  }

  return args;
}

async function importCases(casesPath) {
  const moduleUrl = pathToFileURL(casesPath).href;
  const imported = await import(moduleUrl);
  return imported.default || imported.cases || [];
}

function selectProbeCases(cases, args) {
  const selected = [];
  const counts = new Map();
  for (const item of cases) {
    if (item.entrypoint !== "memory_search") continue;
    const count = counts.get(item.category) || 0;
    if (count >= args.perCategory) continue;
    selected.push(item);
    counts.set(item.category, count + 1);
    if (selected.length >= args.maxProbes) break;
  }
  return selected;
}

async function runRawProbe(caseDef, args) {
  const startedAt = performance.now();
  try {
    const result = await execFileAsync(
      args.openclawBin,
      [
        "memory",
        "search",
        "--agent",
        args.agentId,
        "--query",
        caseDef.query,
        "--max-results",
        "5",
        "--json"
      ],
      {
        timeout: args.timeoutMs,
        maxBuffer: 8 * 1024 * 1024
      }
    );
    const payload = extractJsonPayload(String(result.stdout || ""));
    const results = Array.isArray(payload?.results) ? payload.results : [];
    return {
      id: caseDef.id,
      category: caseDef.category,
      query: caseDef.query,
      status: results.length > 0 ? "ok" : "empty_results",
      durationMs: Math.round(performance.now() - startedAt),
      resultCount: results.length,
      provider: payload?.provider || "",
      mode: payload?.mode || ""
    };
  } catch (error) {
    const text = String(error?.message || error);
    if (/timed out/i.test(text)) {
      return {
        id: caseDef.id,
        category: caseDef.category,
        query: caseDef.query,
        status: "timeout",
        durationMs: Math.round(performance.now() - startedAt),
        error: text,
        stderrPreview: text.slice(0, 240)
      };
    }
    if (String(error?.stdout || "").trim()) {
      try {
        const payload = extractJsonPayload(String(error.stdout || ""));
        const results = Array.isArray(payload?.results) ? payload.results : [];
        return {
          id: caseDef.id,
          category: caseDef.category,
          query: caseDef.query,
          status: results.length > 0 ? "ok" : "empty_results",
          durationMs: Math.round(performance.now() - startedAt),
          resultCount: results.length,
          provider: payload?.provider || "",
          mode: payload?.mode || ""
        };
      } catch {
        return {
          id: caseDef.id,
          category: caseDef.category,
          query: caseDef.query,
          status: "invalid_json",
          durationMs: Math.round(performance.now() - startedAt),
          error: text,
          stdoutPreview: String(error.stdout || "").slice(0, 240),
          stderrPreview: String(error.stderr || "").slice(0, 240)
        };
      }
    }
    return {
      id: caseDef.id,
      category: caseDef.category,
      query: caseDef.query,
      status: "command_failed",
      durationMs: Math.round(performance.now() - startedAt),
      error: text,
      stdoutPreview: String(error?.stdout || "").slice(0, 240),
      stderrPreview: String(error?.stderr || "").slice(0, 240)
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cases = await importCases(args.casesPath);
  const probes = selectProbeCases(cases, args);
  const results = [];
  for (const item of probes) {
    console.error(`[transport-watch] running ${item.id}`);
    results.push(await runRawProbe(item, args));
  }

  const generatedAt = new Date().toISOString();
  const report = {
    generatedAt,
    agentId: args.agentId,
    summary: summarizeTransportProbeResults(results),
    results
  };
  const markdown = renderTransportWatchReport(report, { generatedAt });

  await fs.mkdir(path.dirname(args.writeJson), { recursive: true });
  await fs.mkdir(path.dirname(args.writeMarkdown), { recursive: true });
  await fs.writeFile(args.writeJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(args.writeMarkdown, markdown, "utf8");

  if (args.format === "json") {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(markdown);
  }

  if (report.summary.watchlist.length > 0) {
    process.exitCode = 1;
  }
}

await main();
