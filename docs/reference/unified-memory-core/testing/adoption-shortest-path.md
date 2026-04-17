# Stage 10 Shortest Adoption Path

[English](adoption-shortest-path.md) | [中文](adoption-shortest-path.zh-CN.md)

This page answers one practical question:

`If I want the shortest credible path that shows Unified Memory Core is installable, runnable, and product-grade beyond OpenClaw alone, what do I run?`

## Shortest Maintainer Path

```bash
npm install
npm run umc:stage10 -- --format markdown
```

This is now the formal Stage 10 adoption proof.

It captures in one pass:

- package tarball size
- `umc` CLI startup cost
- `umc registry inspect` first-run cost
- Codex `writeAfterTask(...)` -> governed `memory_intent` -> OpenClaw-readable shared-memory proof
- multi-instance shared-root operator proof

## Stronger Release-Grade Path

If you are not looking for the shortest adoption baseline but for the stronger “only human acceptance remains” gate, run:

```bash
npm run umc:release-preflight -- --format markdown
```

That one-command gate still covers:

- full repo regression
- smoke eval
- plugin-side memory-search cases
- Stage 5 acceptance
- host smoke
- real bundle install verification
- Markdown link scan
- `git diff --check`

## Current Baseline

Latest Stage 10 adoption proof:

- latest sampled package tarball: `1456484 bytes`
- `umc where` startup: `154ms`
- `umc registry inspect --registry-dir <temp>` first-run: `80ms`
- Codex shared-foundation proof: `1 promoted / 1 candidate / 1 policy input`
- multi-instance shared-root proof: `2 candidates / 2 policy inputs`

Reports:

- [../../../../reports/generated/stage10-adoption-and-shared-foundation-2026-04-18.md](../../../../reports/generated/stage10-adoption-and-shared-foundation-2026-04-18.md)
- [../../../../reports/generated/stage10-adoption-closeout-2026-04-18.md](../../../../reports/generated/stage10-adoption-closeout-2026-04-18.md)

## What This Path Does Not Replace

- it does not replace `release-preflight`
- it does not replace Docker hermetic A/B
- it does not widen the Stage 9 guarded smart path into the default path

Its only job is to make this true:

`adoption is shorter, and the shared-foundation story is backed by real evidence instead of architecture claims alone.`
