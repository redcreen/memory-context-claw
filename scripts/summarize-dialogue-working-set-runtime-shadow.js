#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    const payload = JSON.parse(await fs.readFile(fullPath, "utf8"));
    events.push({
      ...payload,
      exportPath: fullPath
    });
  }
  return events;
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Dialogue Working-Set Runtime Shadow Summary");
  lines.push("");
  lines.push(`- output dir: \`${report.outputDir}\``);
  lines.push(`- exports: \`${report.summary.total}\``);
  lines.push(`- captured: \`${report.summary.captured}\``);
  lines.push(`- skipped: \`${report.summary.skipped}\``);
  lines.push(`- errors: \`${report.summary.errors}\``);
  lines.push(`- average reduction ratio: \`${report.summary.averageReductionRatio}\``);
  lines.push(`- relation counts: \`${JSON.stringify(report.summary.relationCounts)}\``);
  lines.push("");
  lines.push("## Recent Exports");
  lines.push("");

  for (const item of report.events.slice(-10).reverse()) {
    lines.push(`- \`${item.generated_at}\` \`${item.session_key}\` relation=\`${item.decision?.relation || ""}\` reduction=\`${Number(item.snapshot?.applied?.reductionRatio || 0).toFixed(4)}\` export=\`${item.exportPath}\``);
  }

  lines.push("");
  lines.push("## Operator Notes");
  lines.push("");
  lines.push("- each export is replayable JSON under `exports/`");
  lines.push("- `decision` preserves the LLM shadow output")
  lines.push("- `snapshot` shows baseline raw transcript, kept raw transcript, semantic pins, archive summary, and token estimates")
  lines.push("- this summary does not change the active prompt path; it only audits the shadow telemetry surface")
  lines.push("");

  return `${lines.join("\n")}\n`;
}

const outputDir = path.resolve(
  repoRoot,
  readFlag("--output-dir", "reports/generated/dialogue-working-set-runtime-shadow")
);
const outPath = path.resolve(
  repoRoot,
  readFlag("--out", "reports/generated/dialogue-working-set-runtime-shadow-summary-2026-04-16.md")
);

const events = await listExportEvents(outputDir);
const relationCounts = events.reduce((counts, item) => {
  const relation = normalizeString(item.decision?.relation, "unknown");
  counts[relation] = (counts[relation] || 0) + 1;
  return counts;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  outputDir,
  summary: {
    total: events.length,
    captured: events.filter((item) => item.status === "captured").length,
    skipped: events.filter((item) => item.status === "skipped").length,
    errors: events.filter((item) => item.status === "error").length,
    averageReductionRatio: events.length
      ? Number(
          (
            events.reduce((sum, item) => sum + Number(item.snapshot?.applied?.reductionRatio || 0), 0)
            / events.length
          ).toFixed(4)
        )
      : 0,
    relationCounts
  },
  events
};

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, renderMarkdown(report), "utf8");
process.stdout.write(renderMarkdown(report));
