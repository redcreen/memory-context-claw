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
- focused ordinary-conversation write-time A/B:
  - host live: `current=38`, `legacy=21`, `UMC-only=18`
  - Docker hermetic (`30s` turn budget): `current=3`, `legacy=0`, `UMC-only=3`, `both-fail=37`

Read these first:

- [Why Unified Memory Core Feels Better](docs/memory-improvement-evidence.md)
- [Full Regression And Memory Improvement Report](reports/generated/unified-memory-core-full-regression-and-memory-improvement-2026-04-15.md)
- [Context Slimming And Budgeted Assembly](docs/reference/unified-memory-core/architecture/context-slimming-and-budgeted-assembly.md)
- [Dialogue Working-Set Pruning](docs/reference/unified-memory-core/architecture/dialogue-working-set-pruning.md)
- [Focused Ordinary-Conversation Realtime Write A/B](reports/generated/openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md)
- [Docker Hermetic Ordinary-Conversation Rerun](reports/generated/openclaw-ordinary-conversation-memory-intent-docker-rerun-2026-04-17.md)

The honest takeaway is now split in two: OpenClaw builtin memory is already decent on many “existing memory consumption” prompts, so the older `100`-case A/B only shows a modest gap. On the ordinary-conversation write surface, the host-live run shows a much clearer Unified Memory Core advantage, but the hermetic Docker rerun shows that the same surface is now heavily constrained by answer-level timeout pressure. In other words, UMC is not just about “remembering better” anymore; it also has to become faster and more reproducible under bounded evaluation budgets.

## Four Primary Product Values

The repo should now be understood through four primary product values, not just “memory retrieval” in the abstract.

1. `On-demand context loading instead of flat prompt stuffing`
   - Already landed: fact-first context assembly, durable-source slimming architecture, and runtime working-set shadow instrumentation
   - Measured now: dialogue working-set runtime shadow replay average reduction ratio `0.4368`, with runtime answer A/B baseline `5 / 5` and shadow `5 / 5`
   - Next milestone: turn this into a stable builtin-comparison context-thickness and latency gate on harder live A/B
2. `Self-learning on every turn and every night`
   - Already landed: realtime `memory_intent` ingestion, governed promotion / decay, and nightly self-learning enabled by default
   - Measured now: focused ordinary-conversation host-live A/B is current `38 / 40` vs legacy `21 / 40`, with `18` UMC-only wins
   - Current caveat: the hermetic Docker rerun is still timeout-constrained, so this value is real but not yet fully saturated under tight answer budgets
3. `CLI-governed memory you can add, inspect, and maintain`
   - Already landed: `umc source add`, inspect / audit / repair / replay / export flows, registry inspect / migrate, and release-preflight checks
   - Product meaning: operators can manage memory content as governed artifacts instead of treating the system as an opaque plugin
4. `One shared memory foundation across OpenClaw, Codex, and future consumers`
   - Already landed: shared contracts, a canonical registry root, projection / export layers, the OpenClaw adapter, and the Codex adapter
   - Product meaning: one governed memory core can be reused across multiple OpenClaw instances and cross-host consumers instead of trapping memory inside one runtime

These values also need to stay legible as six product qualities:

- `simple`
  - install, default configuration, and first verification should be obvious without forcing users to learn the whole governance stack first
- `usable`
  - the default workflow should feel clear and immediately better in practice, not just more feature-rich on paper
- `lightweight`
  - the runtime should send less context and avoid growing a heavier control layer, while keeping install footprint small
- `fast enough`
  - answer paths, context assembly, and day-to-day operations should stay fast enough that better memory does not feel slower
- `smart`
  - the system should remember what matters, avoid writing what does not, send only the right context, and stay conservative when uncertain
- `maintainable`
  - operators should be able to inspect, replay, repair, and roll back behavior without reverse-engineering hidden state

## Product North Star

The current product target can be compressed to one sentence:

> Simple to install, smooth to use, light and fast to run, smart to remember, easy to maintain.

In technical and engineering terms, that means:

- `simple to install`
  - the install command, default configuration, and first verification path should stay short and obvious
  - engineering meaning: package shape, plugin wiring, default config, and CLI entrypoints should minimize first-use friction
- `smooth to use`
  - users should not have to learn the whole governance model before feeling the value
  - engineering meaning: default paths come first, feature switches stay disciplined, and common tasks should remain direct
- `light and fast to run`
  - the product should feel lighter in prompt weight and faster in main-path behavior, not just more capable
  - engineering meaning: prompt thickness, context assembly cost, answer latency, install size, and runtime footprint all stay in scope
- `smart to remember`
  - remember what matters, avoid writing what does not, send only the right context, and stay conservative when uncertain
  - engineering meaning: self-learning, working-set pruning, budgeted assembly, abstention / guardrails, and bounded decision contracts must work together
- `easy to maintain`
  - when something goes wrong, operators should be able to inspect, trace, replay, and roll back it instead of guessing
  - engineering meaning: inspect / audit / replay / repair / rollback / hermetic eval surfaces remain first-class

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
