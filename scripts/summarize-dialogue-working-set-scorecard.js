#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { summarizeContextOptimizationEvents } from "../src/dialogue-working-set-scorecard.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function readFlag(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

async function listExportEvents(outputDir) {
  const exportsDir = path.join(outputDir, "exports");
  let files = [];
  try {
    files = await fs.readdir(exportsDir);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const events = [];
  for (const fileName of files.filter((item) => item.endsWith(".json")).sort()) {
    const fullPath = path.join(exportsDir, fileName);
    events.push(JSON.parse(await fs.readFile(fullPath, "utf8")));
  }
  return events;
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Dialogue Working-Set Context Optimization Scorecard");
  lines.push("");
  lines.push(`- output dir: \`${report.outputDir}\``);
  lines.push(`- total events: \`${report.summary.total}\``);
  lines.push(`- captured: \`${report.summary.captured}\``);
  lines.push(`- skipped: \`${report.summary.skipped}\``);
  lines.push(`- errors: \`${report.summary.errors}\``);
  lines.push(`- guarded applied: \`${report.summary.guardedApplied}\``);
  lines.push(`- average raw reduction ratio: \`${report.summary.averageRawReductionRatio}\``);
  lines.push(`- average package reduction ratio: \`${report.summary.averagePackageReductionRatio}\``);
  lines.push(`- average candidate-load elapsed ms: \`${report.summary.averageCandidateLoadElapsedMs}\``);
  lines.push(`- average assembly-build elapsed ms: \`${report.summary.averageAssemblyBuildElapsedMs}\``);
  lines.push(`- average decision elapsed ms: \`${report.summary.averageDecisionElapsedMs}\``);
  lines.push(`- relation counts: \`${JSON.stringify(report.summary.relationCounts)}\``);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

const format = normalizeString(readFlag("--format", "json"), "json");
const outputDir = path.resolve(
  repoRoot,
  readFlag("--output-dir", "reports/generated/dialogue-working-set-runtime-shadow")
);
const events = await listExportEvents(outputDir);
const report = {
  generatedAt: new Date().toISOString(),
  outputDir,
  summary: summarizeContextOptimizationEvents(events)
};

if (format === "markdown") {
  process.stdout.write(renderMarkdown(report));
} else {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
