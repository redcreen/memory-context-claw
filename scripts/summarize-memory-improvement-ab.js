#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const date = new Date().toISOString().slice(0, 10);
  const args = {
    input: path.resolve(process.cwd(), `reports/openclaw-memory-improvement-ab-${date}.json`),
    outputJson: path.resolve(process.cwd(), `reports/openclaw-memory-improvement-summary-${date}.json`),
    outputMarkdown: path.resolve(process.cwd(), `reports/generated/openclaw-memory-improvement-summary-${date}.md`)
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") args.input = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--write-json") args.outputJson = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--write-markdown") args.outputMarkdown = path.resolve(process.cwd(), argv[++index]);
  }

  return args;
}

function detectLanguage(item) {
  const text = `${item?.query || ""}\n${item?.message || ""}\n${item?.id || ""}`;
  return /[\u4e00-\u9fff]/.test(text) ? "zh" : "en";
}

function classifyOutcome(item) {
  const unified = item?.current?.passed === true;
  const legacy = item?.legacy?.passed === true;
  if (unified && legacy) return "both_pass";
  if (unified && !legacy) return "umc_only";
  if (!unified && legacy) return "legacy_only";
  return "both_fail";
}

function pushCount(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function outcomeField(outcome) {
  if (outcome === "both_pass") return "bothPass";
  if (outcome === "umc_only") return "umcOnly";
  if (outcome === "legacy_only") return "legacyOnly";
  return "bothFail";
}

function pickSamples(results, predicate, limit = 4) {
  return results.filter(predicate).slice(0, limit).map((item) => ({
    id: item.id,
    category: item.category,
    language: detectLanguage(item),
    attribution: item.attribution,
    prompt: item.message || item.query || "",
    unifiedAnswer: item.current?.answer || item.current?.text || "",
    legacyAnswer: item.legacy?.answer || item.legacy?.text || ""
  }));
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# OpenClaw Memory Improvement Summary");
  lines.push("");
  lines.push(`- generatedAt: \`${summary.generatedAt}\``);
  lines.push(`- comparedCases: \`${summary.totals.comparedCases}\``);
  lines.push(`- unifiedPassed: \`${summary.totals.unifiedPassed}\``);
  lines.push(`- legacyPassed: \`${summary.totals.legacyPassed}\``);
  lines.push(`- bothPass: \`${summary.totals.bothPass}\``);
  lines.push(`- umcOnly: \`${summary.totals.umcOnly}\``);
  lines.push(`- legacyOnly: \`${summary.totals.legacyOnly}\``);
  lines.push(`- bothFail: \`${summary.totals.bothFail}\``);
  lines.push("");
  lines.push("## Language Split");
  lines.push("");
  for (const lang of ["en", "zh"]) {
    const item = summary.byLanguage[lang];
    lines.push(`### ${lang === "zh" ? "Chinese" : "English"}`);
    lines.push("");
    lines.push(`- comparedCases: \`${item.comparedCases}\``);
    lines.push(`- bothPass: \`${item.bothPass}\``);
    lines.push(`- umcOnly: \`${item.umcOnly}\``);
    lines.push(`- legacyOnly: \`${item.legacyOnly}\``);
    lines.push(`- bothFail: \`${item.bothFail}\``);
    lines.push("");
  }

  lines.push("## Attribution Summary");
  lines.push("");
  for (const [key, value] of Object.entries(summary.byAttribution)) {
    lines.push(`- ${key}: \`${value}\``);
  }
  lines.push("");

  lines.push("## Significant Takeaways");
  lines.push("");
  lines.push(`- Shared baseline memory capability: \`${summary.totals.bothPass}\` / \`${summary.totals.comparedCases}\` real cases passed in both systems.`);
  lines.push(`- Memory Core-only gains: \`${summary.totals.umcOnly}\` / \`${summary.totals.comparedCases}\` real cases passed only with \`unified-memory-core\`.`);
  lines.push(`- Chinese Memory Core-only gains: \`${summary.byLanguage.zh.umcOnly}\` / \`${summary.byLanguage.zh.comparedCases}\`.`);
  lines.push(`- English Memory Core-only gains: \`${summary.byLanguage.en.umcOnly}\` / \`${summary.byLanguage.en.comparedCases}\`.`);
  lines.push("");

  const sections = [
    ["UMC-only Samples", summary.samples.umcOnly],
    ["Shared-baseline Samples", summary.samples.bothPass]
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
      lines.push(`- ${item.id} [${item.category}] (${item.language}) attribution=\`${item.attribution}\``);
      lines.push(`  prompt: ${item.prompt}`);
      lines.push(`  unified: ${String(item.unifiedAnswer || "").replace(/\n/g, " ")}`);
      lines.push(`  legacy: ${String(item.legacyAnswer || "").replace(/\n/g, " ")}`);
    }
    lines.push("");
  }

  lines.push("## Notes");
  lines.push("");
  lines.push("- This summary counts only cases that were actually run against both Unified Memory Core and the legacy builtin context engine.");
  lines.push("- `umcOnly` means Unified Memory Core passed while legacy failed.");
  lines.push("- `bothPass` means the builtin baseline was already sufficient for that case.");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(await fs.readFile(args.input, "utf8"));
  const results = Array.isArray(raw.results) ? raw.results : [];
  const compared = results.filter((item) => item.compareLegacy === true);

  const summary = {
    generatedAt: new Date().toISOString(),
    sourceReport: args.input,
    totals: {
      comparedCases: compared.length,
      unifiedPassed: 0,
      legacyPassed: 0,
      bothPass: 0,
      umcOnly: 0,
      legacyOnly: 0,
      bothFail: 0
    },
    byLanguage: {
      en: { comparedCases: 0, bothPass: 0, umcOnly: 0, legacyOnly: 0, bothFail: 0 },
      zh: { comparedCases: 0, bothPass: 0, umcOnly: 0, legacyOnly: 0, bothFail: 0 }
    },
    byAttribution: {},
    samples: {
      umcOnly: [],
      bothPass: []
    }
  };

  for (const item of compared) {
    const lang = detectLanguage(item);
    const outcome = classifyOutcome(item);
    const unifiedPassed = item?.current?.passed === true;
    const legacyPassed = item?.legacy?.passed === true;
    summary.byLanguage[lang].comparedCases += 1;
    pushCount(summary.byLanguage[lang], outcomeField(outcome));
    pushCount(summary.byAttribution, item.attribution || "unknown");
    if (unifiedPassed) summary.totals.unifiedPassed += 1;
    if (legacyPassed) summary.totals.legacyPassed += 1;
    if (outcome === "both_pass") summary.totals.bothPass += 1;
    else if (outcome === "umc_only") summary.totals.umcOnly += 1;
    else if (outcome === "legacy_only") summary.totals.legacyOnly += 1;
    else summary.totals.bothFail += 1;
  }

  summary.samples.umcOnly = pickSamples(compared, (item) => classifyOutcome(item) === "umc_only");
  summary.samples.bothPass = pickSamples(compared, (item) => classifyOutcome(item) === "both_pass");

  await fs.mkdir(path.dirname(args.outputJson), { recursive: true });
  await fs.mkdir(path.dirname(args.outputMarkdown), { recursive: true });
  await fs.writeFile(args.outputJson, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await fs.writeFile(args.outputMarkdown, renderMarkdown(summary), "utf8");
  process.stdout.write(`${renderMarkdown(summary)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
