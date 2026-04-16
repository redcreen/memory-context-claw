# OpenClaw Ordinary-Conversation Docker Hermetic Rerun

- generatedAt: `2026-04-17`
- scope: focused `40`-case ordinary-conversation realtime-write A/B rerun under Docker hermetic isolation
- detailed per-case report: [openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md](openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md)

## Why This Rerun Exists

The earlier focused `40`-case ordinary-conversation A/B was useful, but it still ran on the host path. That left open a reasonable concern:

- did earlier cases leak memory into later ones?
- did the benchmark accidentally benefit from host `~/.openclaw` state?
- were the results partly an artifact of local environment drift?

This Docker rerun exists to answer that concern directly.

## Hermetic Method

The rerun used these constraints:

- start from an in-repo empty fixture: `evals/openclaw-ordinary-conversation-fixture`
- do **not** seed from host `~/.openclaw`
- mount only:
  - read-only embedding model
  - read-only `auth-profiles.json`
  - repo checkout at `/workspace`
- run all `legacy builtin` cases first
- delete that isolated legacy state
- then run all `current` UMC cases
- give every case its own temp OpenClaw state root
- prune session transcripts before recall
- give every capture / recall turn an explicit `30s` timeout budget

One subtlety matters:

- OpenClaw still generates bootstrap files such as `AGENTS.md`, `MEMORY.md`, and daily notes inside each fresh temp workspace
- those files are regenerated inside each new isolated state root
- they are runtime bootstrap, not cross-case contamination

## Isolation Verdict

The isolation checks passed:

- total runs: `80`
- unique state roots: `80`
- duplicate state roots: `0`
- unique current registry roots: `40`
- duplicate current registry roots: `0`
- cleanup success: `80 / 80`
- session-clear success: `80 / 80`

So the root question now has a clean answer:

`The Docker rerun does not show cross-case memory contamination.`

## Docker Result

Focused `40`-case realtime-write result under Docker:

- current: `3 / 40`
- legacy: `0 / 40`
- both pass: `0`
- UMC-only: `3`
- legacy-only: `0`
- both fail: `37`

Language split:

- English: current `1 / 20`, legacy `0 / 20`
- Chinese: current `2 / 20`, legacy `0 / 20`

Category split:

- durable_rule: current `2 / 8`, legacy `0 / 8`
- tool_routing_preference: current `0 / 8`, legacy `0 / 8`
- user_profile_fact: current `1 / 8`, legacy `0 / 8`
- session_constraint: current `0 / 8`, legacy `0 / 8`
- one_off_instruction: current `0 / 8`, legacy `0 / 8`

The three reproducible UMC-only wins were:

- `ordinary-ab-en-rule-pr-comments-1`
- `ordinary-ab-zh-rule-hotels-1`
- `ordinary-ab-zh-seat-1`

## What Actually Failed

The dominant failure mode was not “wrong memory recall”.

It was `timeout after 30000ms`:

- legacy: `40 / 40` timed out
- current: `36 / 40` timed out

That means this rerun changed the main diagnosis:

- contamination is no longer the main risk
- answer-level latency under a bounded Docker budget is now the main risk

## Host Versus Docker

The earlier host-live focused `40`-case result was:

- current: `38 / 40`
- legacy: `21 / 40`
- UMC-only: `18`

So the clean reading is now:

1. The host result should no longer be treated as fully contamination-proof attribution.
2. The Docker result should now be treated as the clean reproducible baseline.
3. The large host-vs-Docker gap is primarily a latency / runtime-budget problem, not evidence that the Docker memory state is contaminated.

## Practical Conclusion

If the question is:

`Does Unified Memory Core still beat the current default legacy path under clean Docker isolation?`

The answer is:

`Yes, but only modestly under a strict 30s turn budget: 3 cases to 0.`

If the question is:

`Is Docker isolation itself stable enough that future A/B results are worth trusting?`

The answer is:

`Yes. The contamination root now looks controlled.`

That makes the next optimization target very clear:

- keep Docker hermetic eval as the preferred reproducible A/B path
- improve ordinary-conversation answer latency so the clean path is not dominated by timeouts
