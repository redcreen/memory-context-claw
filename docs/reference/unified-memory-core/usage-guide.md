# Unified Memory Core Usage Guide

[English](usage-guide.md) | [中文](usage-guide.zh-CN.md)

## Why This Document Exists

The top-level [README](../../../README.md) should stay short enough for first-time discovery.

This guide is the durable, detailed manual for people who actually want to use, operate, validate, or maintain `Unified Memory Core` in a real OpenClaw environment.

Use this document when you need more than:

- a quick install snippet
- a one-screen project summary
- isolated testing references

## Who Should Read This

This guide is for:

- OpenClaw users who want better long-memory quality
- operators who need to install, configure, and validate the plugin safely
- maintainers who need to understand the day-to-day CLI workflow
- repo contributors who need to know which inputs belong where

This guide is not the best first read if you only want a high-level overview.
In that case, start with [../../../README.md](../../../README.md).

## Mental Model

`Unified Memory Core` is not a flat retrieval dump.

It is a governed memory layer that:

- ingests declared memory inputs
- produces governed candidate and stable artifacts
- projects those artifacts to different consumers
- changes final OpenClaw context assembly so stable facts and rules win more often

The repo now has:

- explicit self-learning lifecycle rules
- policy adaptation for OpenClaw and Codex
- Stage 5 product-hardening workflows
- CLI-verifiable release gates

## Where Things Belong

The most important usage rule is to put the right content in the right place.

### `workspace/MEMORY.md`

Put durable rules, preferences, identity facts, and instructions here.

Good examples:

- preferred name
- stable food preferences
- recurring work style preferences
- fixed family facts that should remain easy to recall

Avoid putting noisy daily logs here.

### `workspace/memory/YYYY-MM-DD.md`

Put recent observations, daily facts, and session-adjacent notes here.

Good examples:

- what changed today
- a new temporary preference
- a new observation you are not yet sure should become long-term

This layer is useful precisely because it is more temporary and less authoritative than `MEMORY.md`.

### `workspace/notes/*.md`

Put project notes, concepts, background material, and reusable summaries here.

Good examples:

- project rationale
- architecture summaries
- domain-specific concepts worth reusing later
- summarized personal or family background that has a clear reuse boundary

Bad candidates:

- stale roadmaps
- temporary debugging notes
- transient install scratch notes

Not every note should become a stable learning artifact.

## Choose an Install Mode

### Stable tag install

Use this when you want a predictable user-facing install target.

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.2.0
```

### Development-head install

Use this when you intentionally want the moving `main` branch.

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git
```

### Local checkout install

Use this when you are actively editing the repo.

```bash
openclaw plugins install -l .
```

### Safer local deployment

Use this when you want a local copy under the OpenClaw extension directory instead of running directly from your working checkout.

```bash
npm run deploy:local
```

## Minimal Host Configuration

Set `unified-memory-core` as the active `contextEngine` in `~/.openclaw/openclaw.json`.

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

If you are editing by hand, validate the host config after changes:

```bash
openclaw config validate
```

Then confirm the plugin is visible:

```bash
openclaw plugins list
openclaw plugins inspect unified-memory-core
```

## Self-Learning Defaults

Nightly self-learning is enabled by default.

The plugin will:

- scan recent OpenClaw session memory
- derive governed learning candidates
- run daily reflection
- promote candidates that meet the baseline rules

Default schedule:

- local time `00:00`

Override only if you need to disable it or move the run time:

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

## Normal Day-to-Day Use

For a normal user, the workflow should stay simple.

1. Put durable facts and rules in `workspace/MEMORY.md`.
2. Put recent observations in `workspace/memory/*.md`.
3. Put reusable background notes in `workspace/notes/*.md`.
4. Keep chatting with OpenClaw normally.
5. Use explicit signals such as `Remember this: ...` only when something should clearly be learned.

You do not need to run the whole CLI stack every day.

## What Happens When You Say “Remember This”

That signal does not bypass governance.

Instead, it helps the system:

- extract a stronger learning candidate
- score the signal as more explicit
- run it through the governed lifecycle
- project promoted artifacts back into consumer-facing outputs

This matters because the repo is designed to avoid uncontrolled direct promotion from raw chat text to stable memory.

## Recommended Operator Validation Levels

There are four practical confidence levels.

### Level 1: basic repo confidence

```bash
npm test
npm run smoke:eval
```

Use this when you want a quick regression check.

### Level 2: governed-learning confidence

```bash
npm run umc:acceptance -- --format markdown
```

Use this for Stage 3-4 lifecycle and policy-adaptation validation.

### Level 3: product-hardening confidence

```bash
npm run umc:stage5 -- --format markdown
```

Use this when you want maintenance, reproducibility, release-boundary, and split-readiness evidence.

### Level 4: release confidence

```bash
npm run umc:release-preflight -- --format markdown
```

This is the strongest single CLI gate.

It combines:

- full repo regression
- smoke eval
- memory-search regression
- Stage 5 acceptance
- host-level OpenClaw smoke
- real bundle-install verification
- Markdown link scan
- patch cleanliness

If this passes, the repo is in the state:

`everything is verified except human acceptance`

## Host-Level OpenClaw Checks

If you need confidence that the plugin works inside a real OpenClaw profile, run:

```bash
npm run umc:openclaw-itest -- --format markdown
```

If you need confidence that a clean release bundle can be installed through the real OpenClaw CLI, run:

```bash
npm run umc:openclaw-install-verify -- --format markdown
```

These are different checks:

- `umc:openclaw-itest` validates host-level integration from the repo side
- `umc:openclaw-install-verify` validates the packaged install path

## Detailed CLI Workflows

### Inspect exports

```bash
npm run umc:cli -- export inspect --consumer generic --format markdown
npm run umc:cli -- export inspect --consumer openclaw --format markdown
npm run umc:cli -- export inspect --consumer codex --format markdown
```

### Run maintenance

```bash
npm run umc:cli -- maintenance run --format markdown
```

### Review reproducibility

```bash
npm run umc:cli -- export reproducibility --format markdown
```

### Review independent execution

```bash
npm run umc:cli -- review independent-execution --repo-root . --format markdown
```

### Review split rehearsal

```bash
npm run umc:cli -- review split-rehearsal --format markdown
```

## How To Decide What To Write

Use this decision rule:

- if it is stable and should dominate later recall, put it in `MEMORY.md`
- if it is recent and may still change, put it in `workspace/memory/*.md`
- if it is reusable background or project/domain context, put it in `workspace/notes/*.md`
- if it is only scratch thinking, keep it out of governed memory inputs

If you are unsure, prefer the less authoritative layer first.

## What “Good” Looks Like

You are using the system correctly when:

- stable rules and identity facts are easy to recall
- daily noise does not overwhelm the final context
- notes enrich context without becoming uncontrolled stable cards
- promotion remains conservative
- reports remain readable enough for operator review

## Common Mistakes

- putting daily chatter into `MEMORY.md`
- expecting every note file to become a stable memory artifact
- using development-head install when you really wanted a stable install target
- skipping `release-preflight` and then treating an ad-hoc local run as release evidence
- treating raw recall quantity as the same thing as context quality

## Troubleshooting

### The plugin does not appear in `openclaw plugins list`

Check:

- install mode
- `plugins.allow`
- `plugins.entries.unified-memory-core.enabled`
- `plugins.slots.contextEngine`
- `openclaw config validate`

### The plugin loads but behavior does not seem better

Check:

- whether stable content actually exists in `workspace/MEMORY.md`
- whether notes are too noisy
- whether your expected fact is still only in temporary memory
- whether the relevant acceptance and smoke surfaces are still green

### You want to validate everything before release

Run:

```bash
npm run umc:release-preflight -- --format markdown
```

### You are working on the repo and want a realistic host check

Run:

```bash
npm run umc:openclaw-itest -- --format markdown
```

## Where To Read Next

- quick project entry: [../../../README.md](../../../README.md)
- docs home: [../../README.md](../../README.md)
- configuration reference: [../configuration.md](../configuration.md)
- testing stack: [testing/README.md](testing/README.md)
- maintenance workflow: [maintenance-workflow.md](maintenance-workflow.md)
- release boundary: [release-boundary.md](release-boundary.md)
- runtime API prerequisites: [runtime-api-prerequisites.md](runtime-api-prerequisites.md)
- release process: [../../../release.md](../../../release.md)
