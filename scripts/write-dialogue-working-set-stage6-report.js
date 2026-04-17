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
  runtimeShadowReplay,
  runtimeAnswerAb
}) {
  const lines = [];
  lines.push("# Dialogue Working-Set Stage 6");
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push("- runtime shadow instrumentation landed in `ContextAssemblyEngine.assemble()` and stays `default-off`");
  lines.push("- runtime shadow exports now capture `relation / evict / pins / reduction ratio` without mutating the final prompt");
  lines.push("- answer-level replay now reuses those runtime exports instead of relying only on isolated helper snapshots");
  lines.push("");
  lines.push("## Runtime Replay");
  lines.push("");
  lines.push(`- runtime shadow replay passed: \`${runtimeShadowReplay.summary.passed}/${runtimeShadowReplay.summary.total}\``);
  lines.push(`- runtime shadow replay captured: \`${runtimeShadowReplay.summary.captured}\``);
  lines.push(`- runtime shadow replay average reduction ratio: \`${runtimeShadowReplay.summary.averageReductionRatio}\``);
  lines.push(`- runtime shadow replay average elapsed ms: \`${runtimeShadowReplay.summary.averageShadowElapsedMs}\``);
  lines.push("");
  lines.push("## Answer A/B");
  lines.push("");
  lines.push(`- baseline passed: \`${runtimeAnswerAb.summary.baselinePassed}/${runtimeAnswerAb.summary.total}\``);
  lines.push(`- shadow passed: \`${runtimeAnswerAb.summary.shadowPassed}/${runtimeAnswerAb.summary.total}\``);
  lines.push(`- baseline only: \`${runtimeAnswerAb.summary.baselineOnly}\``);
  lines.push(`- shadow only: \`${runtimeAnswerAb.summary.shadowOnly}\``);
  lines.push(`- average prompt reduction ratio: \`${runtimeAnswerAb.summary.averagePromptReductionRatio}\``);
  lines.push("");
  lines.push("## Gate Decision");
  lines.push("");

  if (runtimeShadowReplay.summary.failed === 0 && runtimeAnswerAb.summary.baselineOnly === 0) {
    lines.push("- Stage 6 runtime shadow integration is strong enough to keep as the new measurement surface.");
    lines.push("- Keep the feature `default-off` and `shadow-only` in production-facing configs.");
    lines.push("- Do not open any active prompt mutation experiment yet; keep promotion gated behind future real-session soak.");
    lines.push("- Resume the previously deferred history cleanup and harder A/B expansion with the new shadow telemetry attached.");
  } else {
    lines.push("- Stage 6 integration exists, but validation is not clean enough to reopen the deferred queue safely.");
  }

  lines.push("");
  lines.push("## Rollback Boundary");
  lines.push("");
  lines.push("- rollback is configuration-only: set `dialogueWorkingSetShadow.enabled=false`");
  lines.push("- shadow exports remain sidecar artifacts under the configured output dir")
  lines.push("- current prompt assembly and builtin memory behavior remain unchanged in this stage")
  lines.push("");
  lines.push("## Source Reports");
  lines.push("");
  lines.push("- [dialogue-working-set-runtime-shadow-2026-04-16.md](dialogue-working-set-runtime-shadow-2026-04-16.md)");
  lines.push("- [dialogue-working-set-runtime-answer-ab-2026-04-16.md](dialogue-working-set-runtime-answer-ab-2026-04-16.md)");
  lines.push("- [dialogue-working-set-runtime-shadow-summary-2026-04-16.md](dialogue-working-set-runtime-shadow-summary-2026-04-16.md)");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

const runtimeShadowReplayPath = readFlag(
  "--runtime-shadow",
  "reports/generated/dialogue-working-set-runtime-shadow-2026-04-16.json"
);
const runtimeAnswerAbPath = readFlag(
  "--runtime-answer-ab",
  "reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16.json"
);
const outPath = path.resolve(
  repoRoot,
  readFlag("--out", "reports/generated/dialogue-working-set-stage6-2026-04-16.md")
);

const [runtimeShadowReplay, runtimeAnswerAb] = await Promise.all([
  readJson(runtimeShadowReplayPath),
  readJson(runtimeAnswerAbPath)
]);

const markdown = renderMarkdown({
  runtimeShadowReplay,
  runtimeAnswerAb
});

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, markdown, "utf8");
process.stdout.write(markdown);
