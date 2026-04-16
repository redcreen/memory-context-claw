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

## Related Files

- [../../../../scripts/openclaw-hermetic-state.js](../../../../scripts/openclaw-hermetic-state.js)
- [../../../../scripts/eval-openclaw-cli-memory-benchmark.js](../../../../scripts/eval-openclaw-cli-memory-benchmark.js)
- [../../../../scripts/eval-openclaw-memory-improvement-ab.js](../../../../scripts/eval-openclaw-memory-improvement-ab.js)
- [../../../../evals/openclaw-cli-memory-fixture/README.md](../../../../evals/openclaw-cli-memory-fixture/README.md)
