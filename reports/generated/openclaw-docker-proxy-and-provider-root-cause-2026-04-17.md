# OpenClaw Docker Proxy And Provider Root Cause

- generatedAt: `2026-04-17`
- scope: `ordinary-conversation-memory-intent-ab` Docker answer-path diagnosis

## Why This Exists

The Docker hermetic substrate had already been improved in three ways:

- preconfigured template cache
- low-signal warmup
- fast-fail after capture timeout
- shard parallelism

That made the benchmark much faster in wall-clock terms, but it did not explain why answer-level capture still collapsed.

This report isolates the remaining bottleneck.

## Minimal Proxy Probe

Inside the same official Docker image used by the harness:

- direct Node `fetch("https://api.openai.com/v1/models")` without proxy-aware fetch:
  - result: `TypeError: fetch failed`
  - duration: `14ms`
- the same Node `fetch(...)` with `NODE_USE_ENV_PROXY=1`:
  - result: HTTP `401`
  - duration: `948ms`

Interpretation:

- `curl` working through proxy was not enough evidence
- the actual LLM path uses Node `fetch`
- in Docker, Node `fetch` was not proxy-aware until `NODE_USE_ENV_PROXY=1` was enabled

## What Was Changed

The Docker runner now automatically sets:

- `NODE_USE_ENV_PROXY=1`

whenever proxy environment variables are present.

This turns the proxy fix into a default property of Docker hermetic evaluation instead of an operator-side manual tweak.

## Targeted 3-Case Rerun After Proxy Fix

Focused cases:

- `ordinary-ab-en-rule-pr-comments-1`
- `ordinary-ab-zh-rule-hotels-1`
- `ordinary-ab-zh-seat-1`

Result:

- comparedCases: `3`
- currentPassed: `0`
- legacyPassed: `0`
- bothFail: `3`

Timing changed in an important way:

- legacy avg capture: `30038ms`
- legacy capture timeouts: `3 / 3`
- current avg capture: `23762ms`
- current capture timeouts: `0 / 3`

Interpretation:

- the proxy fix did not make the suite pass
- but it **did** move current-mode capture off the previous `30s` timeout ceiling
- so one real part of the Docker answer-path slowdown was indeed proxy-unaware Node fetch

## Gateway Steady-State Probe

A separate long-lived gateway probe was also run in Docker to test whether repeated `--local` CLI cold starts were still the main issue.

What the probe showed:

- gateway startup is real but bounded
- once the gateway is up, the call path is valid
- the remaining failure is no longer “CLI cold start”
- the remaining failure is still inside the provider/auth path

Observed gateway result:

- capture wall-clock: `58379ms`
- capture meta duration: `37082ms`
- recall wall-clock: `40437ms`
- recall meta duration: `33686ms`
- both turns surfaced:
  - `Request timed out before a response was generated`

Gateway log evidence showed repeated:

- `LLM request failed: network connection error`
- `rawError=fetch failed`
- provider/account failover attempts on the `openai-codex` profile

Interpretation:

- a true steady-state runner is still the right long-term direction
- but the short-term blocker is no longer the benchmark substrate itself
- the short-term blocker is the Docker container's provider/auth execution path for the current `openai-codex` auth-profile route

## Final Diagnosis

At this point the Docker ordinary-conversation benchmark problem splits cleanly into two layers:

1. Docker substrate layer
   - isolation: fixed
   - state contamination: fixed
   - config regeneration overhead: fixed
   - proxy-unaware Node fetch: fixed

2. Container provider/auth layer
   - still unstable for the current `openai-codex` auth-profile route
   - still able to dominate answer-level timing and failure outcomes

## Practical Conclusion

This means the current direction can be closed with a precise statement:

- the Docker hermetic **test substrate** is now in a good enough state to remain the default evaluation base
- but the Docker ordinary-conversation **capability surface** is still blocked by the container provider/auth path, not by isolation or config generation anymore

So future work should not keep re-optimizing the same benchmark scaffold first.

The next bottleneck to attack is:

- stable container-compatible model/provider access for answer-level runs
- or a dedicated Docker eval model route that avoids the flaky auth-profile path entirely
