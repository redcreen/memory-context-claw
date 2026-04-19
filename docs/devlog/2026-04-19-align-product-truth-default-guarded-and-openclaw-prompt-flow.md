# Align Product Truth, Default Guarded GC, And OpenClaw Prompt Flow

## Problem

After Stage 12 closeout, the repo still had three connected gaps:

1. product-truth documents were no longer aligned
   - roadmap and development-plan said Stage 12 was closed and the repo had entered maintenance
   - but the stable architecture page and workstream roadmap still described Stage 11 as reopened and Stage 12 as a future theme

2. the default runtime did not match the user-facing promise
   - README described UMC as reducing dependence on `compact`
   - but OpenClaw `dialogueWorkingSetGuarded.enabled` still defaulted to `false`
   - that meant the documented day-to-day benefit depended on an extra hidden opt-in

3. the OpenClaw prompt-path explanation was not easy to find
   - the repo had enough code to explain the boundary cleanly
   - but there was no durable document showing that UMC assembles the prompt package in `contextEngine.assemble()` while the host still owns the final model call

The user-facing outcome was confusing:

- the repo claimed one thing
- defaults behaved slightly differently
- and the most important architectural boundary still lived mostly in code-reading and chat explanation

## Decision

Treat this as one convergence problem instead of three separate polish tasks.

The decision was:

1. restore one truthful project narrative across README, roadmap, architecture, and workstream docs
2. make the OpenClaw guarded GC path match the current product promise by default
3. formalize the prompt-injection explanation as a durable architecture document and link it from the right entrypoints

This also required a wording correction:

- Stage 11 remains closed
- Stage 12 remains closed
- the repo is in `post-stage12-product-maintenance`
- `Context Minor GC` continues as a long-running optimization track, not as a reopened numbered stage

## Implementation

### 1. Enabled guarded GC by default for OpenClaw

Changed the default config in:

- `src/config.js`

`dialogueWorkingSetGuarded.enabled` now defaults to `true`, while:

- `dialogueWorkingSetShadow.enabled` stays `false`
- the guarded path still keeps narrow relation / reduction / eviction boundaries

Added regression coverage in:

- `test/openclaw-adapter.test.js`

so the default contract is now explicit and protected.

### 2. Realigned the product-truth documents

Updated:

- `README.md`
- `README.zh-CN.md`
- `docs/roadmap.md`
- `docs/roadmap.zh-CN.md`
- `docs/architecture.md`
- `docs/architecture.zh-CN.md`
- `docs/workstreams/project/roadmap.md`
- `docs/workstreams/project/roadmap.zh-CN.md`
- `docs/reference/configuration.md`
- `docs/reference/configuration.zh-CN.md`
- `docs/reference/unified-memory-core/architecture/context-minor-gc.md`
- `docs/reference/unified-memory-core/architecture/context-minor-gc.zh-CN.md`
- `docs/reference/unified-memory-core/architecture/context-minor-gc-experience-gap.md`
- `docs/reference/unified-memory-core/architecture/context-minor-gc-experience-gap.zh-CN.md`

Key corrections:

- removed the stale “Stage 11 reopened” wording from stable architecture pages
- made the README promise match the default runtime
- restored the repo north-star sentence
- restored the mapping from the three product promises to already-landed capability surfaces
- reframed the Codex experience-gap doc as a host-specific historical analysis instead of a repo-wide active blocker

### 3. Formalized the OpenClaw prompt injection flow

Promoted the temporary explanation into durable bilingual architecture docs:

- `docs/reference/unified-memory-core/architecture/openclaw-prompt-injection-flow.md`
- `docs/reference/unified-memory-core/architecture/openclaw-prompt-injection-flow.zh-CN.md`

Linked them from:

- architecture index
- OpenClaw adapter architecture page
- usage guide

The key boundary now lives in durable docs:

- UMC owns prompt-package assembly inside `contextEngine.assemble()`
- runtime hooks mainly own memory writes
- the OpenClaw host still owns the final LLM call

## Validation

Runtime/config validation:

- `node --test test/openclaw-adapter.test.js test/engine-dialogue-working-set-shadow.test.js test/openclaw-plugin-manifest.test.js`

Formal proof and integration:

- `npm run umc:stage12 -- --format markdown`
- `npm run umc:openclaw-itest -- --format json`

Repo-wide validation:

- `npm test`
- `git diff --check`

Local host rollout:

- `npm run deploy:local`
- `openclaw gateway restart`

## Outcome

The repo is now closer to one honest product state:

- the default OpenClaw runtime now matches the current compact-avoidance promise
- stable docs no longer conflict with roadmap truth about Stage 11 / Stage 12
- the prompt assembly boundary is now understandable without re-reading source code or chat history

This change did not declare a new product capability.
It removed drift between:

- what the repo says
- what the default runtime does
- and how the main OpenClaw prompt path actually works
