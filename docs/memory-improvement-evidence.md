# Why Unified Memory Core Feels Better

If you only want one practical answer, it is this:

`unified-memory-core` is not a magic replacement for every OpenClaw builtin memory success. But the more accurate statement is no longer just “the lead is modest.” After two different live A/B surfaces, the real conclusion is:

- when the comparison is “who consumes the same existing memory fixture better?”, the gap is still modest
- when the comparison is “who writes a new durable memory better during ordinary conversation, then recalls it in a later session?”, Unified Memory Core is already clearly ahead

## What Users Get Immediately

- facts, rules, and current-state questions are handled through a governed retrieval and assembly path
- nightly self-learning is built in and already active
- memory behavior is protected by formal CLI gates instead of “it seemed okay in chat”
- host transport failures are separated from algorithm regressions

In practice, that means:

- fewer ambiguous “maybe this old chunk is fine” memory answers
- better handling of “what is true now” questions
- a much stronger maintainer story when something regresses

## What The Current Evidence Says

Latest full evidence:

- full report: [unified-memory-core-full-regression-and-memory-improvement-2026-04-15.md](../reports/generated/unified-memory-core-full-regression-and-memory-improvement-2026-04-15.md)

Current test highlights:

- repo regression: `414 / 414`
- latest available release-preflight evidence: `8 / 8` pass
- retrieval-heavy CLI benchmark: `262 / 262`
- isolated local answer-level gate: `12 / 12`, with `6 / 12` zh-bearing cases inside the formal gate itself
- deeper answer-level watch: `14 / 18`
- runnable matrix already maintained in the repo: `392` cases
- Chinese-bearing share in the runnable matrix: `53.83%`

## Live A/B: Memory Core Vs OpenClaw Builtin

We also ran a real live A/B answer-level comparison on the same agent family and the same memory fixture.

Compared real cases: `100`

- both systems passed: `97`
- Memory Core only: `1`
- builtin only: `0`
- both failed: `2`

Language split:

- English: `50` compared, `50` UMC pass, `49` builtin pass, `1` Memory Core only
- Chinese: `50` compared, `48` UMC pass, `48` builtin pass, `0` Memory Core only, `0` builtin only, `2` both fail

This matters because it shows two things at once:

1. OpenClaw builtin memory is already decent on many simple fact prompts.
2. Memory Core does show a real net gain, but the gap is still small enough that it would be misleading to describe the current answer-level difference as large.

## Focused A/B: Ordinary-Conversation Realtime Write

We also added a second live A/B that is much closer to the user intuition behind `should_write_memory`:

- capture one new rule, preference, or fact during ordinary conversation
- prune session transcripts so the next turn cannot simply lean on immediate carry-over
- ask a later recall question and see whether the new memory actually survived as durable recall

Focused report:

- [openclaw-ordinary-conversation-memory-intent-ab-2026-04-17.md](../reports/generated/openclaw-ordinary-conversation-memory-intent-ab-2026-04-17.md)
- [openclaw-ordinary-conversation-memory-intent-docker-rerun-2026-04-17.md](../reports/generated/openclaw-ordinary-conversation-memory-intent-docker-rerun-2026-04-17.md)

This surface now has two readings:

Host-live rerun:

- current path: `38 / 40`
- legacy default path: `21 / 40`
- both pass: `20`
- Memory Core only: `18`
- legacy only: `1`
- both fail: `1`

Hermetic Docker strict baseline:

- last full strict sweep: `39 / 40`
- legacy default path: `15 / 40`
- both pass: `15`
- Memory Core only: `24`
- legacy only: `0`
- both fail: `1`
- `preCaseResetFailed = 0`

The last remaining shared-fail from that full sweep (`ordinary-ab-en-tool-notion-1`) was then rerun under the same strict Docker method and flipped to `UMC-only`, so the current closeout state is:

- current path: `40 / 40`
- legacy default path: `15 / 40`
- both pass: `15`
- Memory Core only: `25`
- legacy only: `0`
- both fail: `0`
- `preCaseResetFailed = 0`

The interpretation is now stricter:

- the older `100`-case A/B still says “existing-memory consumption uplift is modest”
- the host-live focused `40`-case suite says “ordinary-conversation realtime write behavior is materially better with Unified Memory Core”
- the hermetic Docker strict baseline now says “the isolation root is trustworthy, and the Memory Core advantage survives under clean Docker A/B as well”

## What This Round Improved

This round was not just another test rerun. The answer-level runner itself was hardened with:

- stronger JSON payload extraction
- stale session-lock cleanup for isolated eval agents
- no per-case destructive session reset
- one bounded retry for empty or parse-failed host payloads

That kept the stable answer-level gate at a reliable `12 / 12`, and the deeper watch remains at `14 / 18`.

That does not mean the deeper gate is solved yet. It means the stable signal is clean again, and the remaining deeper failures are now a smaller, more honest mix of host-noise residue and real answer-level misses.

## A Concrete Example

The clearest current Memory Core-only win is:

- prompt:
  `Based only on your memory for this agent, if someone asks what Lantern does, how should you describe it? If memory is missing, reply exactly: I don't know based on current memory.`
- Memory Core: pass
- builtin legacy: fail

A cleanup worth calling out:

- the earlier Chinese birthday prompt was removed from the plain-negative A/B bucket
- it was not a clean abstention probe and behaved more like an identity-conflict / guardrail question
- after replacing it with a true unknown-fact negative, the `100`-case live A/B no longer contains a builtin-only win

A still-useful Chinese A/B example is:

- prompt:
  `只根据当前记忆，Project Lantern 到底是在做什么？如果没有这条记忆，就只回答：I don't know based on current memory.`
- Memory Core: pass
- builtin legacy: fail

This is exactly the kind of case where “just retrieve some memory” is not enough. The retrieval and assembly path has to stay aligned enough for the final answer to remain correct.

## Why Maintainers Usually Care Even More

Even when a prompt is a shared win, Memory Core still gives you something the builtin path does not give you as clearly in this repo:

- a governed memory lifecycle
- nightly self-learning reports
- promotion / replay / audit surfaces
- formal benchmark gates
- transport watchlists
- explicit performance baselines

That is why the direct answer-level A/B gain is only part of the story. The bigger product gain is that memory behavior becomes measurable and maintainable, and now also shows clearer wins on the specific write-time memory surface that the earlier `100`-case benchmark did not capture.

## What Is Next

The current GitHub development plan is moving to the next step:

- deepen answer-level coverage for `cross-source`, `conflict`, `multi-step history`, and more natural Chinese prompts

That next phase now has a sharper objective:

- remove the two shared Chinese-history misses from the current `100`-case suite
- then turn more `cross-source`, `conflict`, `multi-step history`, and denser natural-Chinese prompts into direct Memory Core wins instead of mostly shared passes
