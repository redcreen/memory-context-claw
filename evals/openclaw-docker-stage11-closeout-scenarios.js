const date = new Date().toISOString().slice(0, 10);

const scenarios = [
  {
    id: "guarded-session-probe-stress",
    description: "OpenClaw guarded long-session stress probe in hermetic Docker state for Stage 11 host-visible closeout.",
    script: "scripts/eval-openclaw-guarded-session-probe.js",
    cases: "evals/openclaw-guarded-session-probe-stress-cases.js",
    agent: "main",
    preset: "safe-local",
    agentModel: "openai-codex/gpt-5.4-mini",
    writeJson: `reports/openclaw-guarded-session-probe-stress-docker-${date}.json`,
    writeMarkdown: `reports/generated/openclaw-guarded-session-probe-stress-docker-${date}.md`
  }
];

export default scenarios;
export { scenarios };
