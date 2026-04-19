const date = new Date().toISOString().slice(0, 10);

const scenarios = [
  {
    id: "guarded-session-probe-threshold",
    description: "OpenClaw guarded ultra-long near-compaction threshold probe in hermetic Docker state.",
    script: "scripts/eval-openclaw-guarded-session-probe.js",
    cases: "evals/openclaw-guarded-session-probe-threshold-cases.js",
    agent: "main",
    preset: "safe-local",
    agentModel: "openai-codex/gpt-5.4-mini",
    writeJson: `reports/openclaw-guarded-session-probe-threshold-docker-${date}.json`,
    writeMarkdown: `reports/generated/openclaw-guarded-session-probe-threshold-docker-${date}.md`
  }
];

export default scenarios;
export { scenarios };
