# Main-Path Performance Plan

[English](main-path-performance-plan.md) | [中文](main-path-performance-plan.zh-CN.md)

## Goal

This document defines the post-Stage-5 performance work for the main path.

It answers:

- which paths are measured
- how they are measured
- how slow paths are attributed
- which results may drive the next optimization order

## Current conclusion

The main path now has to be split into three layers:

1. internal retrieval / assembly
2. raw `openclaw memory search` transport
3. live `openclaw agent` answer-level host path

These three layers must be measured separately. They should no longer be collapsed into one vague “memory search performance” bucket.

## Baselines to keep

### 1. Retrieval / Assembly

Goal:

- measure internal retrieval, scoring, and assembly cost
- tell whether the cost comes from retrieval fan-out or assembly itself

Entrypoint:

```bash
npm run eval:perf -- --timeout-ms 15000
```

Core metrics:

- `retrievalMs`
- `scoringMs`
- `assemblyMs`
- `totalMs`
- `candidateCount`
- `selectedCount`

### 2. Raw Transport

Goal:

- measure whether raw `openclaw memory search` itself is timing out, empty, or unstable
- prevent transport faults from being misclassified as plugin algorithm regressions

Entrypoint:

```bash
npm run eval:openclaw:transport-watch
```

Core metrics:

- `rawOk`
- `watchlist`
- `averageDurationMs`
- `maxDurationMs`
- failure distribution by category

### 3. Answer-Level Host Path

Goal:

- measure the real `openclaw agent` answer path
- separate “slow but correct” from “slow and abstaining”

Entrypoints:

```bash
npm run eval:openclaw:agent-matrix -- --skip-legacy --max-cases 36 --format markdown
```

and:

```bash
npm run eval:main-path:perf
```

Core metrics:

- `durationMs`
- pass/fail
- abstention rate
- difference between current-state prompts and ordinary fact prompts

## Attribution rules

### When retrieval / assembly is green, transport has a watchlist, and answer-level is red

Interpretation:

- treat the host answer-level consumption boundary as the primary problem
- do not misclassify it as a retrieval algorithm regression

### When retrieval / assembly is red and transport is also red

Interpretation:

- separate the transport failure share first
- only treat the remainder as a plugin main-path performance problem

### When answer-level is green and transport is red

Interpretation:

- keep transport on the watchlist
- do not let it block answer-level algorithm work

## Budget guidance

Use engineering budgets first, not product SLA promises:

- retrieval / assembly: keep the fast path in the millisecond range and watch averages plus slowest cases
- raw transport: watch trend and failure distribution before setting a hard SLA
- answer-level host path: first remove obvious tens-of-seconds abnormal behavior, then discuss tighter budgets

## Next optimization order

1. keep the isolated local answer-level formal gate green and expand it beyond the current `6` representative cases
2. continue isolating gateway/session-lock noise and raw transport failures so they do not contaminate answer-level conclusions
3. once the formal gate is stable, decide whether the slowest layer sits in host integration, prompt/context assembly, or call-boundary behavior
4. rerun the baseline after each meaningful performance change and write back a fresh report
