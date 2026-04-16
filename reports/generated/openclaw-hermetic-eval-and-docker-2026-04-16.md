# OpenClaw Hermetic Eval And Docker Summary

- generatedAt: `2026-04-16`
- branch: `stage6-dialogue-working-set-shadow`
- scope: `fixture-only hermetic eval + reusable Docker harness`

## What Changed

- OpenClaw benchmark state creation now uses repo fixture only; it no longer seeds from `~/.openclaw`
- current and legacy base states are both created as hermetic temp states
- every answer-level case now clones a fresh state from the indexed base state
- a reusable Docker eval harness was added around the same hermetic core
- the Docker path now runs on the official `ghcr.io/openclaw/openclaw` image instead of rebuilding `openclaw` from `npm` inside a local Dockerfile
- the Docker runner now mirrors the host `openclaw --version` tag by default, then falls back to `latest`
- Docker default mode does **not** start gateway; it runs `memory index`, `memory search`, and `agent --local`

## Validation

Static / unit validation:

- `node --check scripts/openclaw-hermetic-state.js`
- `node --check scripts/eval-openclaw-cli-memory-benchmark.js`
- `node --check scripts/eval-openclaw-memory-improvement-ab.js`
- `node --check scripts/run-openclaw-docker-entry.js`
- `node --check scripts/run-openclaw-docker-eval.js`
- `node --test test/openclaw-hermetic-state.test.js test/openclaw-docker-scenarios.test.js test/openclaw-memory-improvement-history-cleanup-cases.test.js`

Hermetic answer-level findings:

- initial fixture-only run without explicit `agentModel` failed because the clean agent state fell back to an unauthenticated provider path
- direct single-case hermetic benchmark with `--agent-model openai-codex/gpt-5.4-mini` passed:
  - `ab100-zh-history-editor-2`: `unified-gain`
  - unified answer: `Vim。`
  - legacy answer: `I don't know based on current memory.`
- direct single-case hermetic benchmark for `ab100-zh-history-editor-4` also passed:
  - attribution: `shared-capability`
  - unified answer: `Vim。`
  - legacy answer: `之前那段时间主力是 Vim。`
- two-case hermetic benchmark run passed `2/2`, but both were `shared-capability`
- exact A/B wrapper initially failed because it still used a `20s` agent timeout; after aligning to `120s`, the wrapper succeeded but showed `1/2` due answer-level variance on `ab100-zh-history-editor-4`
- ordinary-conversation hermetic Docker rerun now also completed for the full focused `40`-case suite:
  - current: `3 / 40`
  - legacy: `0 / 40`
  - `UMC-only = 3`
  - `both-fail = 37`
  - dominant failure class: bounded `30s` answer-level timeouts rather than state contamination
  - detailed report: [openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md](openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md)

## Interpretation

- clean isolation is now real: the runner can be made independent of `~/.openclaw`
- the old live-state evidence was not clean enough for final attribution
- after isolation, the remaining instability is primarily answer-level latency / timeout pressure, not memory-state contamination
- the Docker rerun also confirms that fresh containers still generate bootstrap workspace files such as `AGENTS.md`, `MEMORY.md`, and daily memory notes, but those are regenerated inside each isolated temp state and do not indicate cross-case leakage
- for the most defensible comparisons, high-variance answer-level cases should prefer:
  - one case per hermetic container
  - explicit `agentModel`
  - explicit turn timeout budgets
  - optional repeated runs before claiming a durable gain

## Docker Status

- Docker Desktop and `docker compose` are now installed and working on this machine
- the preferred runner path is now:
  - `docker pull ghcr.io/openclaw/openclaw:<host-version>`
  - `docker compose ... run --rm --name umc-eval-<scenario> openclaw-eval`
- real runner execution succeeded with the official image:
  - scenario: `memory-improvement-history-cleanup`
  - image: `ghcr.io/openclaw/openclaw:2026.4.2`
  - result: `2/2` passed, `shared-capability: 2`
  - report: [openclaw-memory-improvement-history-cleanup-2026-04-16.md](openclaw-memory-improvement-history-cleanup-2026-04-16.md)
- real runner execution also succeeded with the official image for the focused `40`-case ordinary-conversation suite:
  - scenario: `ordinary-conversation-memory-intent-ab`
  - image: `ghcr.io/openclaw/openclaw:2026.4.2`
  - result: current `3 / 40`, legacy `0 / 40`
  - isolation: `80 / 80` distinct state roots, `40 / 40` distinct current registry roots, `80 / 80` cleanup success, `80 / 80` session-clear success
  - interpretation: the hermetic root is now trustworthy, but the Docker answer path is substantially slower than the host path under a `30s` turn budget
- the Docker path is now usable as a real hermetic eval workflow, not just a dry-run scaffold

## Next Recommendation

1. Treat Docker hermetic eval as the new preferred OpenClaw comparison path
2. Pin `agentModel` and explicit turn-timeout budgets in scenario config for answer-level runs
3. Treat host-vs-Docker deltas as a performance/latency investigation, not as proof of contamination
