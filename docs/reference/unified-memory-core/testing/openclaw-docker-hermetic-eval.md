# OpenClaw Docker Hermetic Eval

[English](openclaw-docker-hermetic-eval.md) | [中文](openclaw-docker-hermetic-eval.zh-CN.md)

This page covers the Docker-based hermetic path for OpenClaw memory evaluation.

The goal is not to copy the operator's `~/.openclaw` into a container. The goal is:

- every eval container starts from an in-repo fixture
- every container writes its own temporary OpenClaw state
- every case clones a fresh state from a preconfigured base state
- the default path does not start a gateway; it runs `memory index`, `memory search`, and `agent --local`

## Default Test Policy

From this point forward, A/B and CLI evaluation in this repo should default to the Docker hermetic path.

The reason is straightforward:

- the first job of an A/B harness is to avoid self-deception
- Docker gives us a cleaner way to separate `legacy` and `current` into distinct state roots
- capability conclusions only matter if the eval substrate is first reproducible and contamination-safe

Host-live runs still matter, but they are now the exception rather than the default.

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
- prepare one persistent template cache per mode under the repo mount
- clone one fresh temp state root per case from that preconfigured template instead of regenerating `openclaw.json`, fixture copies, and directory scaffolding
- apply an explicit `30s` budget to every capture / recall turn

The current fast path also enables three default accelerators:

- prewarmed templates:
  each base state gets one low-signal warmup turn before being cached
- fast-fail:
  if capture fails or times out, the runner skips registry wait and recall
- shard parallelism:
  the ordinary-conversation scenario now runs in `4` shards by default

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

The ordinary-conversation runner now stores its reusable templates in:

- `.cache/openclaw-ordinary-state-templates`

That directory is excluded from git, but it lives under the repo mount, so it survives across Docker runs. To force a rebuild, pass:

```bash
--refresh-template-cache
```

When the machine depends on a proxy to reach model providers, the runner now also auto-enables:

- `NODE_USE_ENV_PROXY=1`

That matters because the real model path in Docker uses Node `fetch`, not `curl`.
Passing `HTTP_PROXY` / `HTTPS_PROXY` into the container was not enough by itself; without this flag, Node `fetch` could still fail immediately with `TypeError: fetch failed`.

The runner also rewrites common host loopback proxy addresses:

- `127.0.0.1`
- `localhost`
- `::1`

into:

- `host.docker.internal`

Inside Docker, loopback points at the container itself rather than the host proxy process.

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

The current state is now clearer:

- the Docker `gateway` steady-state route has already been validated as a way to bypass part of the `agent --local` CLI tail latency
- but it should not replace the default ordinary benchmark until long-lived process cleanup has been shown not to reintroduce cross-case contamination

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

- current: `0 / 40`
- legacy: `0 / 40`
- `UMC-only = 0`
- `both-fail = 40`

This should not be read as “Memory Core did not improve anything”.
The more accurate reading is:

- the hermetic isolation layer is now clean
- under the current `30s` fast path, the answer-level capture turn itself still does not finish
- legacy times out on capture for `40 / 40`
- current also times out on capture for `40 / 40`

So this ordinary-conversation Docker fast path is currently an `infra/perf watch`, not the final capability ranking surface.

Put more plainly:

- it is now fast enough
- it is now clean enough
- but at this strict budget it mainly measures whether the answer path can finish at all
- it should not replace host-live or wider-budget capability conclusions

## Why This Fast Path Still Matters

It already answers the questions that had to be settled first:

- are cases contaminating each other: `no`
- are `legacy` and `current` sharing state roots: `no`
- was config regeneration the main bottleneck: `no`
- can the full `40`-case suite finish inside a bounded wall-clock window: `yes`

The current trade-off is:

- this path is now suitable as an infra / perf / contamination gate
- it is not yet suitable as the final answer-level capability benchmark for ordinary-conversation memory writing

If we want to turn Docker ordinary-conversation A/B back into a capability surface, the next step is a truer steady-state runner that avoids repeated cold answer-path startup while still preserving zero contamination between cases.

## Current Closure

This line of work can now be closed with a precise split:

1. benchmark-substrate problems
   - isolation
   - contamination
   - config regeneration overhead
   - proxy-unaware Node fetch
   are now under control

2. container provider/auth problems
   - these still dominate ordinary-conversation answer-level outcomes
   - especially on the current `openai-codex` auth-profile route inside Docker

So the current closure statement is:

- Docker hermetic **substrate** is now strong enough to stay as the default evaluation base
- Docker hermetic **ordinary-conversation capability comparison** is still blocked by the container provider/auth path, not by the benchmark scaffold anymore

Related diagnostic reports:

- [openclaw-docker-steady-state-speedup-2026-04-17.md](../../../../reports/generated/openclaw-docker-steady-state-speedup-2026-04-17.md)
- [openclaw-docker-proxy-and-provider-root-cause-2026-04-17.md](../../../../reports/generated/openclaw-docker-proxy-and-provider-root-cause-2026-04-17.md)

## Related Files

- [../../../../scripts/openclaw-hermetic-state.js](../../../../scripts/openclaw-hermetic-state.js)
- [../../../../scripts/eval-openclaw-cli-memory-benchmark.js](../../../../scripts/eval-openclaw-cli-memory-benchmark.js)
- [../../../../scripts/eval-openclaw-memory-improvement-ab.js](../../../../scripts/eval-openclaw-memory-improvement-ab.js)
- [../../../../evals/openclaw-cli-memory-fixture/README.md](../../../../evals/openclaw-cli-memory-fixture/README.md)
