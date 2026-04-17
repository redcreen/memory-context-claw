# OpenClaw Ordinary-Conversation Docker Hermetic Rerun

- generatedAt: `2026-04-17`
- scope: focused `40`-case ordinary-conversation realtime-write A/B rerun under Docker hermetic isolation
- detailed per-case report: [openclaw-ordinary-conversation-memory-intent-ab-2026-04-17.md](openclaw-ordinary-conversation-memory-intent-ab-2026-04-17.md)

## Why This Rerun Exists

The earlier focused `40`-case ordinary-conversation A/B was useful, but it still ran on the host path. That left open a reasonable concern:

- did earlier cases leak memory into later ones?
- did the benchmark accidentally benefit from host `~/.openclaw` state?
- were the results partly an artifact of local environment drift?

This Docker rerun exists to answer that concern directly.

It now also carries one explicit distinction:

- the official capability conclusion comes from the strict `1 shard` baseline
- the `2/4`-shard `gateway-steady` path remains a fast watch/smoke lane

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
- build one warmed base state per mode
- fan that base state out into `4` shard-local state roots
- reset every case back to the warmed shard baseline before capture
- prune session transcripts before recall
- run capture / recall through `gateway call agent`

One subtlety matters:

- OpenClaw still generates bootstrap files such as `AGENTS.md`, `MEMORY.md`, and daily notes inside each fresh temp workspace
- those files are regenerated inside each new isolated state root
- they are runtime bootstrap, not cross-case contamination

## Isolation Verdict

The isolation checks passed:

- total runs: `80`
- unique state roots: `8`
- duplicate state roots: `72`
- unique current registry roots: `4`
- duplicate current registry roots: `36`
- cleanup success: `80 / 80`
- session-clear success: `80 / 80`
- pre-case reset success: `80 / 80`

So the root question now has a clean answer:

`The Docker rerun does not show cross-case memory contamination.`

## Docker Result

Focused `40`-case realtime-write strict baseline result under Docker:

- current: `39 / 40`
- legacy: `15 / 40`
- both pass: `15`
- UMC-only: `24`
- legacy-only: `0`
- both fail: `1`

Language split:

- English: current `19 / 20`, legacy `7 / 20`
- Chinese: current `20 / 20`, legacy `8 / 20`

Category split:

- durable_rule: current `8 / 8`, legacy `0 / 8`
- tool_routing_preference: current `7 / 8`, legacy `0 / 8`
- user_profile_fact: current `8 / 8`, legacy `0 / 8`
- session_constraint: current `8 / 8`, legacy `8 / 8`
- one_off_instruction: current `8 / 8`, legacy `7 / 8`

## What Actually Failed

The dominant story is no longer “everything timed out”.
The remaining failure set is now one strict shared-fail harder case rather than a broad timeout wall.

That means this rerun changed the main diagnosis again:

- contamination is not the main risk
- Docker answer-level capability is now measurable
- the strict baseline is now strong enough to be the official ordinary-conversation A/B surface
- the remaining work is targeted case cleanup, not benchmark-substrate rescue

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

`Yes. Under the current steady-state Docker hermetic path, Unified Memory Core still leads the current default legacy path.`

If the question is:

`Is Docker isolation itself stable enough that future A/B results are worth trusting?`

The answer is:

`Yes. The contamination root now looks controlled.`

That makes the next optimization target very clear:

- keep Docker hermetic eval as the preferred reproducible A/B path
- continue shrinking the residual `6` shared-fail and `2` legacy-only cases
- keep shaving wall-clock without giving up the current reset guarantees
