# Unified Memory Core

[English](README.md) | [中文](README.zh-CN.md)

> A governed shared-memory core for OpenClaw: fact-first context, explicit self-learning lifecycle, and CLI-verifiable release gates.

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
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.2.0
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

### Useful Commands

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
