# OpenClaw Docker Proxy And Answer-Path Root Cause

- generatedAt: `2026-04-17`
- scope: `ordinary-conversation-memory-intent-ab` Docker answer-path diagnosis

## Why This Exists

The Docker hermetic substrate had already been hardened:

- preconfigured template cache
- low-signal warmup
- fast-fail after capture failure
- 4-shard parallel ordinary benchmark

That made wall-clock much better, but the answer-level benchmark still looked wrong. This report closes the gap between:

- “the Docker substrate is clean”
- and “the Docker answer path still collapses”

## Confirmed Root Causes

### 1. The forwarded proxy address was wrong inside Docker

The host exports proxy URLs such as:

- `http://127.0.0.1:7890`
- `socks5://127.0.0.1:7890`

Inside Docker, `127.0.0.1` points at the container itself, not the host proxy.

Minimal proof inside the official OpenClaw image:

- `curl https://api.openai.com/v1/models` with the raw forwarded proxy env:
  - `curl: (7) Failed to connect to 127.0.0.1 port 7890`
- Node `fetch(...)` with `NODE_USE_ENV_PROXY=1` and the raw forwarded proxy env:
  - immediate `TypeError: fetch failed`

When the same env vars are rewritten to `host.docker.internal:7890`:

- `curl https://api.openai.com/v1/models` returns `401`
- Node `fetch("https://api.openai.com/v1/models")` returns `401`
- Node `fetch("https://api.moonshot.ai/v1/models")` also becomes reachable

### 2. Cloned Docker eval states were still pointing at the base template paths

The ordinary-conversation runner used a cached base state, then `fs.cp(...)` to clone it per case.

But `openclaw.json` inside the clone still contained absolute paths to the original template state:

- `agentDir`
- `workspace`
- `registryDir`

That meant a “new” cloned case could still read from the wrong state root.

This has now been fixed by rewriting `openclaw.json` after each clone so every cloned case points at its own:

- `agents/<agent>/agent`
- `workspace`
- `registry`

### 3. `openclaw agent --local` wall-clock is not the same thing as model answer time

Representative direct probes in Docker with the corrected proxy path showed:

- current / `openai-codex/gpt-5.4-mini`
  - `meta.durationMs ~= 22070`
  - command exit wall-clock `~= 55s`
- legacy / `openai-codex/gpt-5.4-mini`
  - `meta.durationMs ~= 33732`
  - command exit wall-clock `~= 77s`

So the benchmark’s earlier `30s capture timeout` was not measuring “how long the model took to think”.

It was measuring:

- model time
- plus CLI/session/hook/writeback tail latency
- plus full process exit time

That is why a turn could internally finish in ~22s and still miss a strict outer 30s wall-clock budget.

## What Was Changed

### Docker proxy rewriting is now automatic

The Docker runner now rewrites loopback proxy envs before they enter the container:

- `127.0.0.1`
- `localhost`
- `::1`

all become:

- `host.docker.internal`

This applies to:

- `ALL_PROXY`
- `all_proxy`
- `HTTP_PROXY`
- `http_proxy`
- `HTTPS_PROXY`
- `https_proxy`

The runner also still auto-enables:

- `NODE_USE_ENV_PROXY=1`

when proxy envs are present.

### Docker eval now forwards template-cache control envs

The host-side Docker launcher now forwards:

- `UMC_EVAL_REFRESH_TEMPLATE_CACHE`
- `UMC_EVAL_TEMPLATE_CACHE_ROOT`

so operator-side cache refresh actually reaches the containerized benchmark.

### Per-case clone config is now repointed to the cloned state

After each base-state clone, the ordinary benchmark rewrites `openclaw.json` with paths rooted in the cloned temp state.

This removes the stale-path bug from the per-case Docker runner.

## What Still Remains True

The Docker hermetic substrate itself is now in a good state:

- contamination checks remain valid
- config regeneration is no longer the dominant cost
- proxy handling is no longer lying to the benchmark

But the ordinary-conversation answer-level benchmark is still not “closed” if it stays on `openclaw agent --local`.

The remaining bottleneck is:

- CLI/path tail latency after the model has already produced its answer

not:

- Docker isolation
- config generation
- or the UMC ordinary-conversation write path itself

## Gateway Steady-State Validation

To verify that this was really a CLI-path issue rather than a memory-path issue, representative Docker probes were run through the gateway path instead of `agent --local`.

With the corrected proxy path:

- current / `openai-codex/gpt-5.4-mini`
  - completed in `~29s`
  - returned the expected visible acknowledgement
  - wrote governed `memory_intent` successfully
- legacy / `openai-codex/gpt-5.4-mini`
  - completed in `~38s`
  - also returned the expected visible acknowledgement

Interpretation:

- the Docker substrate is not the blocker anymore
- the provider path is reachable
- the current UMC write path is reachable
- the remaining distortion lives in the `agent --local` answer/exit path

## Final Diagnosis

At this point the problem splits cleanly into two layers:

1. Docker hermetic substrate
   - fixed enough to remain the default test base
2. Docker ordinary-conversation answer benchmark
   - still distorted if it stays on `openclaw agent --local`

The next correct productization step is therefore not “more template cache”.

It is:

- move the Docker ordinary answer benchmark onto a gateway/steady-state execution path
- while keeping the same hermetic state isolation guarantees

## Practical Conclusion

This round closes the Docker infrastructure investigation with a precise statement:

- Docker hermetic evaluation is still the correct default base for this repo
- the old proxy forwarding was wrong and has been fixed
- cloned eval states were previously mispointed and have been fixed
- the remaining answer-level distortion is now isolated to the `agent --local` CLI path
- steady-state gateway execution has already been validated as the right next path
