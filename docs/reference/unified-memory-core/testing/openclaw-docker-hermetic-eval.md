# OpenClaw Docker Hermetic Eval

[English](openclaw-docker-hermetic-eval.md) | [中文](openclaw-docker-hermetic-eval.zh-CN.md)

This page covers the Docker-based hermetic path for OpenClaw memory evaluation.

The goal is not to copy the operator's `~/.openclaw` into a container. The goal is:

- every eval container starts from an in-repo fixture
- every container writes its own temporary OpenClaw state
- every case clones a fresh state from the indexed base state
- the default path does not start a gateway; it runs `memory index`, `memory search`, and `agent --local`

## Why Gateway Is Off By Default

The main benchmark is about memory, retrieval, context assembly, and answer quality, not about the online service path.

Keeping gateway off removes extra variables:

- port binding
- HTTP/session transport
- gateway retries and timeouts
- extra session locks
- host auth drift

If you later want an online-path smoke test, add a separate `gateway smoke` profile. Do not mix it into the main A/B benchmark.

## Prerequisites

1. Docker / Docker Compose available on the machine
2. a readable embedding GGUF file on the host
3. a readable OpenClaw `auth-profiles.json` on the host

The runner first tries to mirror the host CLI version and pulls
`ghcr.io/openclaw/openclaw:<host-version>`. It falls back to `latest` only
when the host CLI version cannot be resolved. The default scenarios already pin
an explicit `agentModel` so the container does not fall back to drifting host
defaults.

## Preferred Command

```bash
npm run eval:openclaw:docker -- \
  --scenario memory-improvement-ab \
  --embed-model-path ~/.openclaw/models/embeddinggemma-300m-qat-Q8_0.gguf \
  --auth-profiles-path ~/.openclaw/agents/main/agent/auth-profiles.json
```

This command:

1. pulls the official OpenClaw image that matches the host CLI version
2. mounts the repo into `/workspace`
3. mounts the embedding model read-only into the container
4. mounts the host `auth-profiles.json` read-only into the container
5. starts the container with the scenario's script, cases, fixture, and preset
6. writes reports back into the repo `reports/` paths

## Ordinary-Conversation Realtime-Write Scenario

To rerun the focused ordinary-conversation `40`-case suite in Docker, use:

```bash
UMC_EVAL_TIMEOUT_MS=30000 npm run eval:openclaw:docker -- \
  --scenario ordinary-conversation-memory-intent-ab \
  --embed-model-path ~/.openclaw/models/embeddinggemma-300m-qat-Q8_0.gguf \
  --auth-profiles-path ~/.openclaw/agents/main/agent/auth-profiles.json
```

This scenario is intentionally strict:

- run the full `legacy builtin` phase first
- delete the isolated legacy state roots
- run the full `unified-memory-core current` phase second
- keep one fresh temp state root per case
- apply an explicit `30s` budget to every capture / recall turn

That makes the result suitable both for contamination checks and for bounded-latency answer-level comparison.

## Scenario Source Of Truth

- [evals/openclaw-docker-scenarios.js](../../../../evals/openclaw-docker-scenarios.js)

Each scenario should define at least:

- `id`
- `script`
- `cases`
- `agent`
- `agentModel`
- `preset`
- `writeJson`
- `writeMarkdown`

That lets you run different case sets and host configs in different containers without changing the runner logic.

The ordinary-conversation scenario also pins:

- `fixtureRoot = evals/openclaw-ordinary-conversation-fixture`
- `agentModel = openai-codex/gpt-5.4-mini`
- `preset = safe-local`

## Compose And Entry Points

- Compose file: [docker-compose.openclaw-eval.yml](../../../../docker-compose.openclaw-eval.yml)
- Container entry: [scripts/run-openclaw-docker-entry.js](../../../../scripts/run-openclaw-docker-entry.js)
- Host orchestrator: [scripts/run-openclaw-docker-eval.js](../../../../scripts/run-openclaw-docker-eval.js)

There is only one default service:

- `openclaw-eval`

It does not boot a gateway. It runs the repo eval script directly inside the container.
The default image comes from `ghcr.io/openclaw/openclaw`, so the Docker path no
longer depends on a local `npm install -g openclaw` inside the Dockerfile.

## Recommended Flow

1. Run the targeted history-cleanup scenario first:

```bash
npm run eval:openclaw:docker -- \
  --scenario memory-improvement-history-cleanup \
  --embed-model-path ~/.openclaw/models/embeddinggemma-300m-qat-Q8_0.gguf \
  --auth-profiles-path ~/.openclaw/agents/main/agent/auth-profiles.json
```

2. Then run the full `memory-improvement-ab` scenario

3. Only if you still need online-path confirmation, add a separate gateway smoke container

4. For ordinary-conversation write-time behavior, prefer `ordinary-conversation-memory-intent-ab`

## How To Decide Whether Docker Isolation Is Still Contaminated

This is the foundation. If this part is unstable, the benchmark conclusions are not trustworthy.

The ordinary-conversation Docker runner treats these as hard contamination checks:

- `duplicateStateRoots = 0`
- `duplicateRegistryRoots = 0`
- `cleanupFailed = 0`
- `sessionClearFailed = 0`

One subtlety matters:

- OpenClaw will still generate bootstrap files like `AGENTS.md`, `MEMORY.md`, and daily notes inside each fresh temp workspace
- those files are regenerated inside each isolated state root
- they are runtime bootstrap, not evidence that host memory or previous cases leaked in

So contamination analysis must distinguish:

- deterministic bootstrap
- host-seeded memory contamination

The former is expected. The latter must stay at zero.

## Current Ordinary-Conversation Docker Conclusion

The latest hermetic Docker rerun for the focused `40`-case suite is:

- current: `3 / 40`
- legacy: `0 / 40`
- `UMC-only = 3`
- `both-fail = 37`

This should not be read as “Memory Core only improved 3 cases”. The more accurate reading is:

- the hermetic isolation layer is now clean
- under a `30s` Docker answer-level budget, latency becomes the dominant bottleneck
- legacy timed out on `40 / 40`
- current timed out on `36 / 40`, leaving `3` reproducible current-only wins

## Related Files

- [../../../../scripts/openclaw-hermetic-state.js](../../../../scripts/openclaw-hermetic-state.js)
- [../../../../scripts/eval-openclaw-cli-memory-benchmark.js](../../../../scripts/eval-openclaw-cli-memory-benchmark.js)
- [../../../../scripts/eval-openclaw-memory-improvement-ab.js](../../../../scripts/eval-openclaw-memory-improvement-ab.js)
- [../../../../evals/openclaw-cli-memory-fixture/README.md](../../../../evals/openclaw-cli-memory-fixture/README.md)
