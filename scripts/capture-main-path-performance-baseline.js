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
const answerAgentId = process.env.UMC_EVAL_AGENT || "umceval";

async function resetAgentSessionState(agentId) {
  const sessionsDir = path.join(process.env.HOME || "", ".openclaw", "agents", agentId, "sessions");
  try {
    await fs.mkdir(sessionsDir, { recursive: true });
    const entries = await fs.readdir(sessionsDir);
    for (const entry of entries) {
      await fs.rm(path.join(sessionsDir, entry), { recursive: true, force: true });
    }
    await fs.writeFile(path.join(sessionsDir, "sessions.json"), "{}\n", "utf8");
  } catch {
    // best effort for isolated perf probes
  }
}

function extractJsonPayload(stdout = "") {
  const text = String(stdout || "").trim();
  const startOffsets = [];
  if (text.startsWith("{") || text.startsWith("[")) {
    startOffsets.push(0);
  }
  for (const pattern of ["\n{", "\n["]) {
    let index = text.indexOf(pattern);
    while (index !== -1) {
      startOffsets.push(index + 1);
      index = text.indexOf(pattern, index + pattern.length);
    }
  }
  const uniqueOffsets = [...new Set(startOffsets)].sort((left, right) => left - right);
  for (const offset of uniqueOffsets) {
    const candidate = text.slice(offset).trim();
    if (!candidate) {
      continue;
    }
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }
  throw new Error("No JSON payload found");
}

function pickJsonText(stdout = "", stderr = "") {
  return String(stdout || "").trim() ? String(stdout || "") : String(stderr || "");
}

async function runJsonCommand(bin, args, options = {}) {
  try {
    const result = await execFileAsync(bin, args, {
      cwd: repoRoot,
      maxBuffer: 16 * 1024 * 1024,
      timeout: options.timeoutMs,
      env: { ...process.env, ...(options.env || {}) }
    });
    const jsonText = pickJsonText(result.stdout, result.stderr);
    return {
      ok: true,
      payload: extractJsonPayload(jsonText),
      stdout: String(result.stdout || ""),
      stderr: String(result.stderr || "")
    };
  } catch (error) {
    const stdout = String(error.stdout || "");
    const stderr = String(error.stderr || "");
    const jsonText = pickJsonText(stdout, stderr);
    return {
      ok: false,
      payload: jsonText.trim() ? extractJsonPayload(jsonText) : null,
      stdout,
      stderr,
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
  await resetAgentSessionState(agentId);
  const startedAt = Date.now();
  const effectiveMessage = `Use the memory_search tool first if needed before answering. ${message}`;
  const hostTimeoutSecs = "60";
  const result = await runJsonCommand(
    "openclaw",
    ["agent", "--local", "--agent", agentId, "--thinking", "off", "--timeout", hostTimeoutSecs, "--json", "--message", effectiveMessage],
    { timeoutMs: 90_000 }
  );
  const payload = result.payload || {};
  const answer = (payload?.result?.payloads || payload?.payloads || [])
    .map((item) => item?.text || "")
    .join("\n")
    .trim();
  return {
    ok: result.ok,
    message,
    effectiveMessage,
    answer,
    durationMs: payload?.result?.meta?.durationMs || payload?.meta?.durationMs || Math.max(Date.now() - startedAt, 0),
    sessionId: payload?.result?.meta?.agentMeta?.sessionId || payload?.meta?.agentMeta?.sessionId || "",
    provider: payload?.result?.meta?.agentMeta?.provider || payload?.meta?.agentMeta?.provider || "",
    model: payload?.result?.meta?.agentMeta?.model || payload?.meta?.agentMeta?.model || "",
    error: result.error || null
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Main-Path Performance Baseline");
  lines.push("");
  lines.push(`- generatedAt: \`${report.generatedAt}\``);
  lines.push(`- repo: \`unified-memory-core\``);
  lines.push(`- answerAgent: \`${report.answerLevel.agentId}\``);
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
  lines.push(
    `- answer-level host path is still the slowest visible path: avg \`${report.answerLevel.averageDurationMs}\`, pass \`${report.answerLevel.passed}/${report.answerLevel.results?.length || 0}\``
  );
  lines.push("");
  lines.push("## Notes");
  lines.push("- This baseline is for the main path planning slice, not a release gate replacement.");
  lines.push("- The answer-level samples intentionally use the same OpenClaw CLI path as the formal answer-level gate.");
  lines.push("- The baseline now uses `openclaw agent --local` so gateway/session-lock failures stay out of main-path latency attribution.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const retrievalAssembly = await runPerfEval();
  const transport = await runTransportBaseline();
  const answerLevelResults = [];
  answerLevelResults.push(
    await runAgentPrompt(
      answerAgentId,
      "Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory."
    )
  );
  answerLevelResults.push(
    await runAgentPrompt(
      answerAgentId,
      "Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory."
    )
  );
  answerLevelResults.push(
    await runAgentPrompt(
      answerAgentId,
      "Based only on your memory for this agent, what is the confirmed default deploy region now? If memory is missing, reply exactly: I don't know based on current memory."
    )
  );

  const report = {
    generatedAt: new Date().toISOString(),
    retrievalAssembly,
    transport,
    answerLevel: {
      agentId: answerAgentId,
      results: answerLevelResults,
      passed: answerLevelResults.filter((item) => item.ok && item.answer).length,
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
