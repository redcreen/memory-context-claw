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
  shadowReplay,
  answerAb,
  adversarial
}) {
  const lines = [];
  lines.push("# Dialogue Working-Set Validation");
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push("- surface 1: turn-by-turn shadow replay");
  lines.push("- surface 2: baseline-vs-shadow answer A/B");
  lines.push("- surface 3: adversarial real-LLM decision replay");
  lines.push("- runtime status: current production path unchanged; all validation is still isolated / shadow-first");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- shadow replay checkpoints passed: \`${shadowReplay.summary.passed}/${shadowReplay.summary.checkpoints}\``);
  lines.push(`- shadow replay average raw reduction ratio: \`${shadowReplay.summary.average_raw_reduction_ratio}\``);
  lines.push(`- shadow replay average shadow-package reduction ratio: \`${shadowReplay.summary.average_shadow_package_reduction_ratio}\``);
  lines.push(`- answer A/B baseline passed: \`${answerAb.summary.baselinePassed}/${answerAb.summary.total}\``);
  lines.push(`- answer A/B shadow passed: \`${answerAb.summary.shadowPassed}/${answerAb.summary.total}\``);
  lines.push(`- answer A/B both pass: \`${answerAb.summary.bothPass}\``);
  lines.push(`- answer A/B shadow only: \`${answerAb.summary.shadowOnly}\``);
  lines.push(`- answer A/B baseline only: \`${answerAb.summary.baselineOnly}\``);
  lines.push(`- answer A/B average estimated prompt reduction ratio: \`${answerAb.summary.averagePromptReductionRatio}\``);
  lines.push(`- adversarial cases passed: \`${adversarial.summary.passed}/${adversarial.summary.cases}\``);
  lines.push(`- adversarial aggregate reduction ratio: \`${adversarial.summary.aggregate_reduction_ratio}\``);
  lines.push("");
  lines.push("## Interpretation");
  lines.push("");

  if (
    shadowReplay.summary.failed === 0
    && answerAb.summary.shadowPassed >= answerAb.summary.baselinePassed
    && adversarial.summary.failed === 0
  ) {
    lines.push("- The direction is strong enough to move into runtime shadow integration.");
    lines.push("- The evidence still does not justify a full production cutover.");
    lines.push("- The next safe step is instrumentation on the real runtime, not replacing the current prompt path.");
  } else {
    lines.push("- The evidence is mixed; stay in isolated validation before touching runtime integration.");
  }

  lines.push("");
  lines.push("## Recommendation");
  lines.push("");
  lines.push("1. Start a minimal runtime shadow integration that records `relation / evict / pins / reduction ratio` but does not alter the final prompt.");
  lines.push("2. Keep answer-level regression measurement attached to that shadow path.");
  lines.push("3. Do not promote working-set pruning into active prompt assembly until shadow telemetry stays green on real sessions.");
  lines.push("");
  lines.push("## Source Reports");
  lines.push("");
  lines.push("- [dialogue-working-set-shadow-replay-2026-04-16.md](dialogue-working-set-shadow-replay-2026-04-16.md)");
  lines.push("- [dialogue-working-set-answer-ab-2026-04-16.md](dialogue-working-set-answer-ab-2026-04-16.md)");
  lines.push("- [dialogue-working-set-adversarial-2026-04-16.md](dialogue-working-set-adversarial-2026-04-16.md)");
  lines.push("- [dialogue-working-set-pruning-feasibility-2026-04-16.md](dialogue-working-set-pruning-feasibility-2026-04-16.md)");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

const shadowPath = readFlag("--shadow", "reports/generated/dialogue-working-set-shadow-replay-2026-04-16.json");
const answerPath = readFlag("--answer-ab", "reports/generated/dialogue-working-set-answer-ab-2026-04-16.json");
const adversarialPath = readFlag("--adversarial", "reports/generated/dialogue-working-set-adversarial-2026-04-16.json");
const outPath = path.resolve(
  repoRoot,
  readFlag("--out", "reports/generated/dialogue-working-set-validation-2026-04-16.md")
);

const [shadowReplay, answerAb, adversarial] = await Promise.all([
  readJson(shadowPath),
  readJson(answerPath),
  readJson(adversarialPath)
]);

const markdown = renderMarkdown({
  shadowReplay,
  answerAb,
  adversarial
});

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, markdown, "utf8");
process.stdout.write(markdown);
