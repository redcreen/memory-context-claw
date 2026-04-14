#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const today = new Date().toISOString().slice(0, 10);

function extractJsonPayload(stdout = "") {
  const text = String(stdout || "").trim();
  const start = text.search(/[\[{]/);
  if (start === -1) {
    throw new Error("No JSON payload found");
  }
  return JSON.parse(text.slice(start));
}

async function runJsonCommand(bin, args, options = {}) {
  try {
    const result = await execFileAsync(bin, args, {
      cwd: repoRoot,
      maxBuffer: 16 * 1024 * 1024,
      timeout: options.timeoutMs,
      env: { ...process.env, ...(options.env || {}) }
    });
    return {
      ok: true,
      payload: extractJsonPayload(result.stdout),
      stdout: String(result.stdout || ""),
      stderr: String(result.stderr || "")
    };
  } catch (error) {
    const stdout = String(error.stdout || "");
    return {
      ok: false,
      payload: stdout.trim() ? extractJsonPayload(stdout) : null,
      stdout,
      stderr: String(error.stderr || ""),
      error: String(error.message || error)
    };
  }
}

async function runPerfEval() {
  const result = await runJsonCommand("npm", ["run", "eval:perf", "--", "--timeout-ms", "15000"]);
  return result.payload;
}

async function runTransportBaseline() {
  const result = await runJsonCommand("node", [
    "scripts/watch-openclaw-memory-search-transport.js",
    "--format",
    "json",
    "--per-category",
    "1",
    "--max-probes",
    "8",
    "--timeout-ms",
    "8000"
  ]);
  return result.payload;
}

async function runAgentPrompt(agentId, message) {
  const startedAt = Date.now();
  const result = await runJsonCommand(
    "openclaw",
    ["agent", "--agent", agentId, "--thinking", "off", "--timeout", "30", "--json", "--message", message],
    { timeoutMs: 45000 }
  );
  const payload = result.payload || {};
  const answer = (payload?.result?.payloads || []).map((item) => item?.text || "").join("\n").trim();
  return {
    ok: result.ok,
    message,
    answer,
    durationMs: payload?.result?.meta?.durationMs || Math.max(Date.now() - startedAt, 0),
    sessionId: payload?.result?.meta?.agentMeta?.sessionId || "",
    provider: payload?.result?.meta?.agentMeta?.provider || "",
    model: payload?.result?.meta?.agentMeta?.model || "",
    error: result.error || null
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Main-Path Performance Baseline");
  lines.push("");
  lines.push(`- generatedAt: \`${report.generatedAt}\``);
  lines.push(`- repo: \`unified-memory-core\``);
  lines.push("");
  lines.push("## Retrieval / Assembly Baseline");
  lines.push(`- cases: \`${report.retrievalAssembly.summary?.cases ?? 0}\``);
  lines.push(`- averageTotalMs: \`${report.retrievalAssembly.summary?.averageTotalMs ?? 0}\``);
  lines.push(`- softExceeded: \`${report.retrievalAssembly.summary?.softExceeded ?? 0}\``);
  lines.push(`- hardExceeded: \`${report.retrievalAssembly.summary?.hardExceeded ?? 0}\``);
  lines.push("");
  lines.push("## Raw Transport Baseline");
  lines.push(`- probes: \`${report.transport.summary?.total ?? 0}\``);
  lines.push(`- rawOk: \`${report.transport.summary?.ok ?? 0}\``);
  lines.push(`- watchlist: \`${(report.transport.summary?.watchlist || []).length}\``);
  lines.push(`- averageDurationMs: \`${report.transport.summary?.averageDurationMs ?? 0}\``);
  lines.push(`- maxDurationMs: \`${report.transport.summary?.maxDurationMs ?? 0}\``);
  lines.push("");
  lines.push("## Answer-Level Agent Baseline");
  for (const item of report.answerLevel.results || []) {
    lines.push(`- ok=\`${item.ok}\` durationMs=\`${item.durationMs}\` answer=${JSON.stringify(item.answer)}`);
    lines.push(`  prompt: ${item.message}`);
    if (item.error) {
      lines.push(`  error: ${item.error}`);
    }
  }
  lines.push("");
  lines.push("## Layer Attribution");
  lines.push(`- retrieval / assembly fast path is still millisecond-level: avg \`${report.retrievalAssembly.summary?.averageTotalMs ?? 0}ms\``);
  lines.push(`- raw transport remains slower and less reliable: avg \`${report.transport.summary?.averageDurationMs ?? 0}ms\`, watchlist \`${(report.transport.summary?.watchlist || []).length}\``);
  lines.push(`- answer-level host path is the slowest visible path: avg \`${report.answerLevel.averageDurationMs}\` and current answers stay in abstention`);
  lines.push("");
  lines.push("## Notes");
  lines.push("- This baseline is for the main path planning slice, not a release gate replacement.");
  lines.push("- The answer-level samples intentionally use the same host path that the benchmark matrix is exercising.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const retrievalAssembly = await runPerfEval();
  const transport = await runTransportBaseline();
  const answerLevelResults = [];
  answerLevelResults.push(
    await runAgentPrompt(
      "umceval",
      "Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory."
    )
  );
  answerLevelResults.push(
    await runAgentPrompt(
      "umceval",
      "Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory."
    )
  );
  answerLevelResults.push(
    await runAgentPrompt(
      "umceval",
      "Based only on your memory for this agent, what is the confirmed default deploy region now? If memory is missing, reply exactly: I don't know based on current memory."
    )
  );

  const report = {
    generatedAt: new Date().toISOString(),
    retrievalAssembly,
    transport,
    answerLevel: {
      results: answerLevelResults,
      averageDurationMs: Math.round(
        answerLevelResults.reduce((sum, item) => sum + Number(item.durationMs || 0), 0) /
          Math.max(answerLevelResults.length, 1)
      )
    }
  };

  const jsonPath = path.join(repoRoot, "reports", `main-path-performance-baseline-${today}.json`);
  const markdownPath = path.join(repoRoot, "reports", "generated", `main-path-performance-baseline-${today}.md`);
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await fs.mkdir(path.dirname(markdownPath), { recursive: true });
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(markdownPath, renderMarkdown(report), "utf8");

  console.log(JSON.stringify({ jsonPath, markdownPath, report }, null, 2));
}

await main();
