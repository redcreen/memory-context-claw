# Unified Memory Core

[English](README.md) | [中文](README.zh-CN.md)

> A governed shared-memory core for OpenClaw: fact-first context, turn-by-turn context optimization, explicit self-learning lifecycle, and CLI-verifiable release gates.

## Why It Already Matters

If you want the shortest practical answer before reading the whole repo:

- latest full regression: `414 / 414`
- latest available release-preflight: `8 / 8` pass
- retrieval-heavy CLI benchmark: `262 / 262`
- isolated local answer-level gate: `12 / 12`, with `6 / 12` zh-bearing cases inside the formal gate
- deeper answer-level watch: `14 / 18`
- maintained runnable matrix: `392` cases with `53.83%` Chinese-bearing coverage
- live A/B on existing-memory consumption: `100` real answer-level cases, `100 / 100` current pass, `99 / 100` legacy pass, `1` Memory Core-only win, `0` builtin-only wins, and `0` shared failures
- dialogue working-set runtime shadow: replay `16 / 16`, answer A/B baseline `5 / 5`, shadow `5 / 5`, average reduction ratio `0.4368`
- Stage 7 context-optimization scorecard: captured `16 / 16`, average raw reduction ratio `0.4191`, average package reduction ratio `0.1151`
- Stage 9 guarded opt-in A/B: baseline `5 / 5`, shadow `5 / 5`, guarded `5 / 5`, guarded applied `2 / 5`, average guarded prompt reduction ratio `0.0424`
- focused ordinary-conversation write-time A/B:
  - host live: `current=38`, `legacy=21`, `UMC-only=18`
  - Docker hermetic steady-state: `current=32`, `legacy=17`, `UMC-only=17`, `legacy-only=2`, `both-fail=6`, `preCaseResetFailed=0`

Read these first:

- [Why Unified Memory Core Feels Better](docs/memory-improvement-evidence.md)
- [Full Regression And Memory Improvement Report](reports/generated/unified-memory-core-full-regression-and-memory-improvement-2026-04-15.md)
- [Context Slimming And Budgeted Assembly](docs/reference/unified-memory-core/architecture/context-slimming-and-budgeted-assembly.md)
- [Dialogue Working-Set Pruning](docs/reference/unified-memory-core/architecture/dialogue-working-set-pruning.md)
- [Plugin-Owned Context Decision Overlay](docs/reference/unified-memory-core/architecture/plugin-owned-context-decision-overlay.md)
- [Stage 7 / Stage 9 Summary](reports/generated/dialogue-working-set-stage7-stage9-2026-04-17.md)
- [Focused Ordinary-Conversation Realtime Write A/B](reports/generated/openclaw-ordinary-conversation-memory-intent-ab-2026-04-17.md)
- [Docker Hermetic Ordinary-Conversation Rerun](reports/generated/openclaw-ordinary-conversation-memory-intent-docker-rerun-2026-04-17.md)

The honest takeaway is now cleaner: OpenClaw builtin memory is already decent on many “existing memory consumption” prompts, so the older `100`-case A/B only shows a modest gap. On the ordinary-conversation write surface, both the host-live run and the hermetic Docker steady-state rerun now show a material Unified Memory Core advantage. The difference is attribution quality: the host run acts as the more optimistic live upper bound, while the Docker rerun is the stricter reproducible baseline. In other words, UMC is no longer only “supposed” to remember better on this surface; it now does so under a clean hermetic A/B as well.

## Three User-Facing Promises

From a user perspective, this product should collapse to three promises:

1. `Light and fast`
   - simple to install, low-friction to adopt, small in footprint, and fast enough on the main path
   - already landed: fact-first assembly, runtime working-set shadow instrumentation, release-preflight, and reproducible Docker hermetic eval
   - biggest current gap: per-turn context loading optimization is not yet a formal mainline and formal gate; ordinary-conversation hermetic A/B has already been recovered into a trustworthy steady-state surface, so the next gap is shrinking the remaining harder misses and keeping wall-clock down. The daily-use target is also now explicit: normal sessions should stay usable through lighter per-turn context management instead of depending on compat / compact to survive, while compat / compact remains a nightly or background safety net
2. `Smart`
   - remember what matters, avoid writing noise, send only the right context, and stay conservative when uncertain
   - already landed: realtime `memory_intent` ingestion, nightly self-learning, durable-source slimming direction, and the working-set pruning shadow path
   - biggest current gap: working-set optimization is still shadow-only, so the “smart” gain is not fully user-visible yet
3. `Reassuring`
   - inspectable, governable, replayable, rollback-friendly, and reusable across OpenClaw, Codex, and future consumers
   - already landed: `umc` CLI, inspect / audit / replay / repair / rollback surfaces, canonical registry root, and OpenClaw / Codex adapters
   - biggest current gap: product-grade cross-Codex and multi-instance evidence still lags behind the OpenClaw path

## Product North Star

The current product target can be compressed to one sentence:

> Simple to install, smooth to use, light and fast to run, smart to remember, easy to maintain.

In technical and engineering terms, that means:

- `light and fast`
  - install command, default configuration, first verification, package size, startup cost, prompt thickness, answer latency, and runtime cost all belong to the same target
  - the hot path should remain usable without depending on compat / compact as a normal habit; per-turn context management should keep prompt thickness under control, while compat / compact remains a nightly or background safety net
- `smart`
  - self-learning, working-set pruning, budgeted assembly, abstention / guardrails, and bounded decision contracts must improve judgment quality together
- `reassuring`
  - inspect / audit / replay / repair / rollback / hermetic eval / shared registry surfaces remain first-class so operators do not need to guess

## Current Distance From The North Star

The product is already beyond “concept validation”, but it still has several clear gaps before it matches the north star.

Areas that are already relatively strong:

- `reassuring`
  - CLI, audit, replay, repair, rollback, release-preflight, and Docker hermetic eval already behave like real operator surfaces
- the backbone of `smart`
  - both realtime and nightly learning paths are landed, and the host-live A/B already shows real value

Areas that are still comparatively weak:

- `light and fast`
  - the first gap to close is not installation polish but the fact that per-turn context is still thicker than it should be, Stage 6 is still only a shadow measurement layer, and hermetic ordinary-conversation realtime write still hits heavy timeout pressure
- `smart`
  - context optimization is validated, but still shadow-only, so the gain is not yet the default user experience
- `reassuring`
  - the shared-foundation story is strong architecturally, but product evidence is still much stronger on OpenClaw than on Codex or multi-instance reuse

So the next focus order should stay explicit:

1. finish the `light and fast` context-loading problem first by making context thickness, working-set reduction, budgeted assembly, and answer-level latency one formal mainline
   - the stage goal is not just “lower average tokens”; it is “keep daily long-running use alive without requiring compat / compact as the normal escape hatch”
2. continue `light and fast` by pushing down ordinary-conversation realtime-write timeout / latency in hermetic runs
3. then shorten install / bootstrap / verify
4. move `smart` from a shadow measurement surface into a very narrow guarded opt-in user path
5. strengthen `reassuring` with clearer cross-OpenClaw / Codex evidence

## Who This Is For

This repo is a good fit if you already use OpenClaw long memory and want better working-context quality instead of a flat retrieval dump.

Typical fit:

- you keep stable rules or preferences in `workspace/MEMORY.md`
- you keep daily memory in `workspace/memory/YYYY-MM-DD.md`
- you keep project or domain notes in `workspace/notes/`
- you want stable facts and rules to win more often in final context assembly

Not the primary target:

- replacing OpenClaw builtin long memory entirely
- patching host-side `memory_search` directly
- projects that do not use durable memory or notes at all

## Quick Start

### Install

Stable release:

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.2.1
```

Development head:

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git
```

### Minimal Configuration

Set `unified-memory-core` as the active `contextEngine` in `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    allow: ["unified-memory-core"],
    slots: {
      contextEngine: "unified-memory-core"
    },
    entries: {
      "unified-memory-core": {
        enabled: true
      }
    }
  }
}
```

Nightly self-learning is now enabled by default inside the plugin. Every day at local `00:00`, the plugin scans recent OpenClaw session memory, derives governed long-term learning candidates, runs daily reflection, and auto-promotes stable candidates that pass the baseline threshold.

Most users do not need to configure this. Only add `selfLearning` if you want to disable it or move the run time:

```json5
{
  plugins: {
    entries: {
      "unified-memory-core": {
        enabled: true,
        selfLearning: {
          enabled: true,
          localTime: "00:00"
        }
      }
    }
  }
}
```

### Verify It Loaded

```bash
openclaw plugins list
```

You should see `unified-memory-core` in the loaded plugin list.

### `umc` After Install

For a normal installed user, the default `umc` executable lives inside the host plugin directory:

```bash
$HOME/.openclaw/extensions/unified-memory-core/umc
```

The simplest setup is to add that directory to `PATH`:

```bash
export PATH="$HOME/.openclaw/extensions/unified-memory-core:$PATH"
```

After that, you can use:

```bash
umc where
umc --help
umc source add --source-type manual --content "Remember this: prefer concise summaries."
umc help source add
```

If you do not want to change `PATH`, call the full path directly:

```bash
"$HOME/.openclaw/extensions/unified-memory-core/umc" where
"$HOME/.openclaw/extensions/unified-memory-core/umc" --help
```

### Mental Model

- `workspace/MEMORY.md` stores stable long-term rules and facts.
- `workspace/memory/*.md` stores recent and daily memory.
- `workspace/notes/*.md` stores project or domain notes.
- not every `workspace/notes/*.md` file should become a stable card; only notes with a clear summary, a reusable rule/concept, and a clear reuse boundary should be promoted, while historical roadmaps and temporary config notes should stay as background notes.
- the OpenClaw adapter decides what should matter most for the current turn.

Recommended workspace shape:

```text
workspace/
├── MEMORY.md
├── memory/
│   └── YYYY-MM-DD.md
└── notes/
    ├── unified-memory-core-config.md
    └── openclaw-memory-vs-lossless.md
```

## Core Capabilities

- fact-first context assembly for high-value memory questions
- turn-by-turn context optimization across durable-source slimming and hot-session working-set pruning
- stable rule, identity, and preference prioritization
- governed retrieval and assembly instead of flat equal-weight recall
- a governed self-learning baseline across declared sources, reflection, candidate promotion, and export/audit surfaces
- export and projection layers for OpenClaw, Codex, and future consumers
- governance, audit, repair, replay, and regression tooling for maintainers

The system is organized around seven first-class modules:

- Source System
- Reflection System
- Memory Registry
- Projection System
- Governance System
- OpenClaw Adapter
- Codex Adapter

Two cross-cutting milestone tracks now matter more than anything else:

- `self-learning`
  - governed reflection, promotion, decay, policy adaptation, and export surfaces
- `context optimization`
  - durable-source slimming and budgeted assembly
  - dialogue working-set pruning for long multi-topic sessions
  - default-off runtime shadow instrumentation before any active prompt experiment

## Why Context Optimization Now Matters

This repo now has two flagship tracks:

1. `self-learning`
2. `context optimization`

The second one is no longer a side note.

The practical reason is simple:

- retrieval / assembly is already fast enough to stop being the main bottleneck
- answer-level latency and prompt thickness are now the bigger problem
- many “memory quality” issues are really “too much irrelevant context survives into this turn”

So context optimization is now treated as a first-class milestone, not a minor adapter tweak.

It currently has two coordinated architecture surfaces:

- durable-source slimming and budgeted assembly
  - [Context Slimming And Budgeted Assembly](docs/reference/unified-memory-core/architecture/context-slimming-and-budgeted-assembly.md)
- hot-session working-set pruning
  - [Dialogue Working-Set Pruning](docs/reference/unified-memory-core/architecture/dialogue-working-set-pruning.md)

Current status:

- Stage 6 runtime shadow integration is landed
- it remains `default-off` and shadow-only
- active prompt mutation is still deferred
- the next round is docs-first: clarify the bounded LLM-led decision contract, operator metrics, rollback boundary, and harder A/B design before changing the default prompt path

## Why Self-Learning Already Matters

The long-term differentiator of this repo is `self-learning`, but that baseline is no longer hypothetical.

Today the repo already includes:

- declared learning inputs through `manual`, `file`, `directory`, and `conversation` sources
- structured reflection and daily reflection pipelines that emit candidate artifacts
- repeated-signal and explicit `remember this` detection
- candidate-to-stable promotion baseline with decision trails
- standalone runtime / CLI flows for reflect, daily-run, export, audit, repair, and replay
- generic, OpenClaw, and Codex export surfaces around promoted stable artifacts
- plugin-level nightly self-learning: default local `00:00`, startup catch-up, persisted run state, and latest reflection reports

What is now complete:

- explicit learning lifecycle rules for promotion, decay / expiry, conflict detection, and stable registry updates
- learning-specific audit, replay, repair, time-window comparison, and regression coverage
- policy adaptation that feeds governed learning outputs back into OpenClaw and Codex behavior
- Stage 5 hardening for source adapters, maintenance workflow, reproducibility, release boundary, and split rehearsal
- release bundle build, real OpenClaw install verification, host smoke, and one-command `release-preflight`

So the accurate positioning is:

- current value: better fact-first context plus a governed learning and policy-adaptation baseline that is already implemented
- current state: Stages 1-5 are complete and the repo has a CLI gate that leaves only human acceptance
- later discussion: runtime API / service mode stays deferred until the documented prerequisites stay green over time

If you want the strongest signal about where this project is going, read the self-learning workstream docs alongside the adapter docs.

## Common Workflows

### Normal Use

- keep durable rules in `workspace/MEMORY.md`
- keep fresh observations in `workspace/memory/*.md`
- keep project rationale and notes in `workspace/notes/`
- continue chatting with OpenClaw; the adapter handles retrieval and assembly

### Maintainer Resume Order

1. [.codex/status.md](.codex/status.md)
2. [.codex/module-dashboard.md](.codex/module-dashboard.md)
3. `.codex/modules/*.md`
4. [docs/module-map.md](docs/module-map.md)
5. `.codex/subprojects/*.md` only when a cross-cutting workstream matters
6. deeper roadmap and reports only after the control surface is clear

### Useful Commands For Installed Users

```bash
umc where
umc --help
umc source --help
umc source add --source-type manual --content "Remember this: prefer concise summaries."
umc learn lifecycle-run --source-type manual --content "Remember this: prefer concise progress reports." --format markdown
umc export inspect --consumer openclaw --format markdown
```

### Repo Maintainer Commands

```bash
npm test
npm run smoke:eval
npm run eval:smoke-promotion
npm run umc:stage5 -- --format markdown
npm run umc:release-preflight -- --format markdown
npm run umc:daily-reflection -- --source-type manual --content "Remember this: prefer concise summaries." --dry-run
npm run umc:cli -- export inspect --consumer generic --format markdown
```

## Documentation Map

- [Docs Home](docs/README.md)
- [Architecture](docs/architecture.md)
- [Module Map](docs/module-map.md)
- [Roadmap](docs/roadmap.md)
- [Test Plan](docs/test-plan.md)
- [Detailed Usage Guide](docs/reference/unified-memory-core/usage-guide.md)
- [Release Process](release.md)

Deeper repo-specific references:

- [Master Roadmap](docs/workstreams/project/roadmap.md)
- [Top-Level System Architecture](docs/workstreams/system/architecture.md)
- [Detailed Development Queue](docs/reference/unified-memory-core/development-plan.md)
- [Detailed Testing Stack](docs/reference/unified-memory-core/testing/README.md)
- [Self-Learning Roadmap](docs/workstreams/self-learning/roadmap.md)

## Development

Key implementation entrypoints:

- shared contracts: [src/unified-memory-core/contracts.js](src/unified-memory-core/contracts.js)
- source ingestion and normalization: [src/unified-memory-core/source-system.js](src/unified-memory-core/source-system.js)
- registry lifecycle: [src/unified-memory-core/memory-registry.js](src/unified-memory-core/memory-registry.js)
- reflection and daily loop: [src/unified-memory-core/reflection-system.js](src/unified-memory-core/reflection-system.js), [src/unified-memory-core/daily-reflection.js](src/unified-memory-core/daily-reflection.js)
- projection and exports: [src/unified-memory-core/projection-system.js](src/unified-memory-core/projection-system.js)
- governance: [src/unified-memory-core/governance-system.js](src/unified-memory-core/governance-system.js)
- OpenClaw runtime: [src/openclaw-adapter.js](src/openclaw-adapter.js)
- Codex runtime: [src/codex-adapter.js](src/codex-adapter.js)

Local development install:

```bash
openclaw plugins install -l .
```

Safer local deployment:

```bash
npm run deploy:local
```

That copies the repo into `~/.openclaw/extensions/unified-memory-core` so editing this checkout does not instantly change the live plugin.
