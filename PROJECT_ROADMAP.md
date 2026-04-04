# Memory Context Claw Roadmap

## Positioning

`memory-context-claw` is an OpenClaw `context engine` plugin.

It does not replace OpenClaw's built-in long memory. It sits on top of it and
focuses on one layer:

- what to recall
- how to rerank recalled memory
- how to assemble the best memory into the current context

In one sentence:

`Turn OpenClaw long memory into more reliable, task-ready context.`

## Problem

OpenClaw can already store and search long memory, but real usage still runs
into a second problem:

- finding something is not the same as putting the right thing into context
- long-term rules, recent notes, and topic docs should not have equal priority
- user phrasing changes between turns
- engineering files can pollute recall if the workspace is broad

This project exists to solve that context-assembly layer.

## Recommended Name

Primary recommendation:

`memory-context-claw`

Why:

- already matches the implemented plugin id
- clearly describes the job
- feels native in the OpenClaw ecosystem

Suggested GitHub subtitle:

`Memory-first context assembly for OpenClaw`

## What Is Already Done

### Plugin foundation

- installable OpenClaw plugin
- `contextEngine` slot integration
- plugin config schema

### First-stage recall and rerank

- recall via `openclaw memory search --json`
- structure-aware heuristic reranking
- path diversity control
- token-budget-aware context packing
- `systemPromptAddition` output

### Second-stage LLM rerank

- optional second-stage rerank
- `gpt-5.4` configuration support
- candidate truncation before rerank
- skip logic when heuristic winner is already clearly ahead

### Query rewrite recall

- rule-based retrieval rewrites
- original query + nearby reformulations
- merged and deduped multi-query recall

### Recall noise control

- default `excludePaths`
- plugin repo and engineering files filtered after retrieval

### Local embedding runtime stability

- service-scoped CPU-safe runtime policy for local embeddings
- avoids polluting shell startup files
- keeps local memory usable while reducing gateway crash risk

### Validation and automation

- unit tests
- integration tests
- golden-case evaluation
- compare/smoke scripts
- one-command verification flow

## Current Status

The project is past proof-of-concept.

A fair description today is:

`usable alpha / early beta`

It is installable, testable, and already useful, but not yet polished as a
public release for broad adoption.

## Roadmap

### Phase 1: Public repo readiness

Goal:

- make the repository readable and publishable

Work:

- tighten the GitHub-facing README
- add LICENSE
- simplify public install docs
- remove machine-specific noise from docs
- add cleaner example configs

### Phase 2: Performance control

Goal:

- keep quality gains while controlling latency

Work:

- add speed tiers for query rewrite
- reduce default recall fan-out when needed
- optimize repeated CLI recall overhead
- evaluate moving from CLI recall to a more direct integration path

### Phase 3: Evaluation upgrades

Goal:

- measure improvements, not just implement them

Work:

- grow the golden dataset
- compare heuristic-only vs second-stage rerank
- compare query-rewrite off vs on
- add more realistic ranking quality measurements

### Phase 4: Stronger query rewrite

Goal:

- improve recall stability across phrasing differences

Work:

- evolve from rule-only rewrite to rule + optional LLM rewrite
- tailor rewrite strategies by query type
- improve contrast, explanation, and how-to style queries separately

### Phase 5: Stronger context assembly

Goal:

- improve what finally enters context

Work:

- better dedupe across similar chunks
- better balancing of long-term rules vs recent notes
- finer token-budget allocation
- improved document-layer selection

### Phase 6: Public release

Goal:

- make it feel like a normal OpenClaw plugin people can adopt quickly

Work:

- stable defaults
- public install guide
- example usage patterns
- issue templates
- public roadmap and release notes

## Immediate Priorities

If only the next three things matter, they should be:

1. polish the public GitHub README
2. add performance tiers for query rewrite
3. expand eval coverage for rerank and rewrite comparisons

## Suggested GitHub Description

Long version:

`Memory-first context assembly for OpenClaw. Improve long-memory recall, reranking, query rewrite, and context packing without replacing OpenClaw's built-in memory.`

Short version:

`An OpenClaw context-engine plugin for better long-memory context assembly.`
