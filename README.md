# Unified Memory Core

[English](README.md) | [中文](README.zh-CN.md)

> A governed memory core for OpenClaw: keep important rules, preferences, and project facts more stable in the current turn, while making long conversations less dependent on `compact`.

## North Star

> Simple to install, smooth to use, light and fast to run, smart to remember, easy to maintain.

The three core product promises are still:

- `light and fast`
- `smart`
- `reassuring`

## What This Is

`Unified Memory Core` does two main jobs:

1. make the right memory more likely to enter the current-turn context
2. keep long conversations thinner after topic switches instead of letting prompt thickness grow forever

It is not just “one more retrieval layer.”
It brings these concerns together:

- fact-first context assembly
- `Context Minor GC` for long-session slimming
- governed real-time and nightly memory ingestion/promotion
- operator surfaces for audit, replay, repair, and rollback

## What Users Get

- Better current-turn context
  Stable rules, identity facts, preferences, and project facts are less likely to be drowned out by irrelevant history.

- Less dependence on `compact` in long sessions
  `Context Minor GC` now ships on by default on the OpenClaw path. The host-visible proof already shows that near a practical compact danger zone, a topic switch can pull the real prompt back below threshold instead of forcing an immediate manual `compact`.

- More governed memory writes
  Explicit long-lived rules, tool preferences, and user preferences do not have to wait for nightly processing before they become eligible for long-term memory.

- Better maintainability
  The repo ships with `umc` CLI tooling plus audit, replay, repair, rollback, and Docker hermetic validation surfaces.

## Who This Is For

Good fit:

- you already use OpenClaw and want long-term memory to improve current-turn answer quality
- you have stable rules, user preferences, or project facts that need to be reused over time
- you want long conversations to stay usable without frequent `compact`
- you need a memory layer that is inspectable and reproducible

Not the main target:

- replacing all of OpenClaw builtin long memory
- patching host-native `memory_search` directly
- setups that do not use durable memory, notes, or stable rules at all

## Quick Start

### Install

Stable release:

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.3.1
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

With this minimal config, the default runtime already includes:

- ordinary-conversation realtime governed memory ingest
- the `Context Minor GC` guarded path

No extra guarded toggle is required.

### Verify It Loaded

```bash
openclaw plugins list
```

You should see `unified-memory-core`.

### `umc` After Install

The default executable lives at:

```bash
$HOME/.openclaw/extensions/unified-memory-core/umc
```

Recommended:

```bash
export PATH="$HOME/.openclaw/extensions/unified-memory-core:$PATH"
```

Common commands:

```bash
umc where
umc --help
umc source add --source-type manual --content "Remember this: prefer concise summaries."
umc export inspect --consumer openclaw --format markdown
```

## Recommended Workspace Shape

```text
workspace/
├── MEMORY.md
├── memory/
│   └── YYYY-MM-DD.md
└── notes/
    ├── unified-memory-core-config.md
    └── openclaw-memory-vs-lossless.md
```

Shortest mental model:

- `workspace/MEMORY.md`
  stable long-term rules and facts

- `workspace/memory/*.md`
  recent confirmed facts and daily memory

- `workspace/notes/*.md`
  project and domain notes

Not every note should become a stable card. Only notes with a clear summary, reusable rule/concept, and explicit reuse boundary should be promoted.

## Core Capabilities

- fact-first context assembly
- long-session `Context Minor GC`
- prioritization for rules, identity facts, and preferences
- governed `memory_intent` / `accepted_action` ingestion
- nightly self-learning and candidate promotion
- export/projection for OpenClaw, Codex, and future consumers
- audit, repair, replay, rollback, and release-preflight

## Recommended Reading

- [Why Unified Memory Core Feels Better](docs/memory-improvement-evidence.md)
- [Context Minor GC](docs/reference/unified-memory-core/architecture/context-minor-gc.md)
- [OpenClaw Near-Compaction Threshold Docker A/B](reports/generated/openclaw-guarded-session-probe-threshold-docker-2026-04-19.md)
- [Detailed Usage Guide](docs/reference/unified-memory-core/usage-guide.md)
- [Configuration Reference](docs/reference/configuration.md)
- [Roadmap](docs/roadmap.md)

## Maintainer Entry Points

If you are maintaining the repo rather than just installing it, start here:

- [Docs Home](docs/README.md)
- [Architecture](docs/architecture.md)
- [Test Plan](docs/test-plan.md)
- [Development Plan](docs/reference/unified-memory-core/development-plan.md)
- [Release Process](release.md)

Common maintainer commands:

```bash
npm test
npm run smoke:eval
npm run umc:openclaw-itest -- --format markdown
npm run umc:openclaw-install-verify -- --format markdown
npm run umc:release-preflight -- --format markdown
```

Local deployment to OpenClaw:

```bash
npm run deploy:local
openclaw gateway restart
```
