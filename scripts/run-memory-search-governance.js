#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  renderMemorySearchGovernanceReport,
  summarizeMemorySearchResults
} from "../src/memory-search-governance.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function readFlag(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

function extractJsonPayload(stdout = "") {
  const text = String(stdout || "").trim();
  const start = text.search(/[\[{]/);
  if (start === -1) {
    throw new Error("No JSON payload found");
  }
  return JSON.parse(text.slice(start));
}

const date = readFlag("--date", new Date().toISOString().slice(0, 10));
const shouldWrite = process.argv.includes("--write");
const outputPath = readFlag(
  "--output",
  path.join(repoRoot, "reports", `memory-search-governance-${date}.md`)
);

const { stdout } = await execFileAsync(
  "npm",
  ["run", "eval:memory-search:cases", "--", "--format", "json"],
  {
    cwd: repoRoot,
    maxBuffer: 4 * 1024 * 1024
  }
);

const parsed = extractJsonPayload(stdout);
const result = {
  summary: summarizeMemorySearchResults(parsed.results || []),
  results: parsed.results || [],
  baselineSummary: parsed.summary || {}
};

const generatedAt = new Date().toISOString();
const markdown = renderMemorySearchGovernanceReport(result, { generatedAt });

if (shouldWrite) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, "utf8");
}

console.log(JSON.stringify({
  generatedAt,
  outputPath,
  write: shouldWrite,
  summary: result.summary,
  baselineSummary: result.baselineSummary
}, null, 2));
