const date = new Date().toISOString().slice(0, 10);

const scenarios = [
  {
    id: "memory-improvement-ab",
    description: "Full 100-case OpenClaw memory improvement A/B in hermetic Docker state.",
    script: "scripts/eval-openclaw-memory-improvement-ab.js",
    cases: "evals/openclaw-memory-improvement-ab-cases.js",
    agent: "umceval65",
    preset: "safe-local",
    agentModel: "openai-codex/gpt-5.4-mini",
    args: ["--shard-size", "25", "--shard-count", "4"],
    writeJson: `reports/openclaw-memory-improvement-ab-${date}.json`,
    writeMarkdown: `reports/generated/openclaw-memory-improvement-ab-${date}.md`
  },
  {
    id: "memory-improvement-history-cleanup",
    description: "Targeted history cleanup A/B cases in hermetic Docker state.",
    script: "scripts/eval-openclaw-memory-improvement-ab.js",
    cases: "evals/openclaw-memory-improvement-history-cleanup-cases.js",
    agent: "umceval65",
    preset: "safe-local",
    agentModel: "openai-codex/gpt-5.4-mini",
    args: ["--shard-size", "2", "--shard-count", "1"],
    writeJson: `reports/openclaw-memory-improvement-history-cleanup-${date}.json`,
    writeMarkdown: `reports/generated/openclaw-memory-improvement-history-cleanup-${date}.md`
  }
];

export default scenarios;
