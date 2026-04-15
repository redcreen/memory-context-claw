# Why Unified Memory Core Feels Better

If you only want one practical answer, it is this:

`unified-memory-core` is not a magic replacement for every OpenClaw builtin memory success, but it gives you a much more governable, testable, and maintainable memory system, and it already shows live answer-level gains on harder prompts.

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

- repo regression: `397 / 397`
- release-preflight: `8 / 8` pass
- retrieval-heavy CLI benchmark: `262 / 262`
- isolated local answer-level gate: `12 / 12`
- runnable matrix already maintained in the repo: `392` cases
- Chinese-bearing share in the runnable matrix: `53.83%`

## Live A/B: Memory Core Vs OpenClaw Builtin

We also ran a real live A/B answer-level comparison on the same agent and the same memory fixture.

Compared real cases: `16`

- both systems passed: `15`
- Memory Core only: `1`
- builtin only: `0`

Language split:

- English: `8` compared, `8` shared wins, `0` Memory Core only
- Chinese: `8` compared, `7` shared wins, `1` Memory Core only

This matters because it shows two things at once:

1. OpenClaw builtin memory is already decent on many simple fact prompts.
2. Memory Core is already showing net gains on harder natural phrasing, especially in Chinese, while also bringing much stronger governance and testing surfaces.

## A Concrete Example

Real Chinese A/B case:

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

That is why the direct answer-level A/B gain is only part of the story. The bigger product gain is that memory behavior becomes measurable and maintainable.

## What Is Next

The current GitHub development plan is moving to the next step:

- deepen answer-level coverage for `cross-source`, `conflict`, `multi-step history`, and more natural Chinese prompts

That next phase should increase the number of cases where Memory Core wins directly instead of merely matching the builtin baseline.
