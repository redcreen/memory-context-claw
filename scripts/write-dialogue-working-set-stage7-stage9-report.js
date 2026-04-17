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

async function readJson(relativePath) {
  const fullPath = path.resolve(repoRoot, relativePath);
  return JSON.parse(await fs.readFile(fullPath, "utf8"));
}

function renderMarkdown({
  scorecard,
  guardedAnswerAb
}) {
  const lines = [];
  lines.push("# Dialogue Working-Set Stage 7 And Stage 9");
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push("- Stage 7 closes the scorecard and operator surface for per-turn context loading optimization.");
  lines.push("- Stage 9 lands a guarded opt-in path that reuses the same LLM decision and keeps rollback configuration-only.");
  lines.push("");
  lines.push("## Stage 7 Scorecard");
  lines.push("");
  lines.push(`- captured events: \`${scorecard.summary.captured}/${scorecard.summary.total}\``);
  lines.push(`- guarded applied: \`${scorecard.summary.guardedApplied}\``);
  lines.push(`- average raw reduction ratio: \`${scorecard.summary.averageRawReductionRatio}\``);
  lines.push(`- average package reduction ratio: \`${scorecard.summary.averagePackageReductionRatio}\``);
  lines.push(`- average candidate-load elapsed ms: \`${scorecard.summary.averageCandidateLoadElapsedMs}\``);
  lines.push(`- average decision elapsed ms: \`${scorecard.summary.averageDecisionElapsedMs}\``);
  lines.push(`- relation counts: \`${JSON.stringify(scorecard.summary.relationCounts)}\``);
  lines.push("");
  lines.push("## Stage 9 Guarded Answer A/B");
  lines.push("");
  lines.push(`- baseline passed: \`${guardedAnswerAb.summary.baselinePassed}/${guardedAnswerAb.summary.total}\``);
  lines.push(`- shadow passed: \`${guardedAnswerAb.summary.shadowPassed}/${guardedAnswerAb.summary.total}\``);
  lines.push(`- guarded passed: \`${guardedAnswerAb.summary.guardedPassed}/${guardedAnswerAb.summary.total}\``);
  lines.push(`- guarded applied: \`${guardedAnswerAb.summary.guardedApplied}\``);
  lines.push(`- guarded only: \`${guardedAnswerAb.summary.guardedOnly}\``);
  lines.push(`- guarded vs shadow wins: \`${guardedAnswerAb.summary.guardedVsShadowWins}\``);
  lines.push(`- average shadow prompt reduction ratio: \`${guardedAnswerAb.summary.averageShadowPromptReductionRatio}\``);
  lines.push(`- average guarded prompt reduction ratio: \`${guardedAnswerAb.summary.averageGuardedPromptReductionRatio}\``);
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push("- Stage 7 is strong enough to keep as the new operator-facing scorecard surface.");
  lines.push("- Stage 9 guarded activation is now real, but remains opt-in and configuration-only.");
  lines.push("- Broader promotion should still wait for the separate ordinary-conversation realtime-write latency closure.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

const scorecardPath = readFlag(
  "--scorecard",
  "reports/generated/dialogue-working-set-scorecard-2026-04-17.json"
);
const guardedAnswerAbPath = readFlag(
  "--guarded-answer-ab",
  "reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17.json"
);
const outPath = path.resolve(
  repoRoot,
  readFlag("--out", "reports/generated/dialogue-working-set-stage7-stage9-2026-04-17.md")
);

const [scorecard, guardedAnswerAb] = await Promise.all([
  readJson(scorecardPath),
  readJson(guardedAnswerAbPath)
]);

const markdown = renderMarkdown({
  scorecard,
  guardedAnswerAb
});

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, markdown, "utf8");
process.stdout.write(markdown);
