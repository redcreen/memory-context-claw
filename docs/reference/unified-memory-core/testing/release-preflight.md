# Unified Memory Core Release Preflight

[English](release-preflight.md) | [中文](release-preflight.zh-CN.md)

This is the one-command CLI gate for:

`everything is verified except human acceptance`

## Preferred Command

Run:

```bash
npm run umc:release-preflight -- --format markdown
```

Structured CLI equivalent:

```bash
npm run umc:cli -- verify release-preflight --format markdown
```

## What It Covers

One passing preflight report means all of these are green in one run:

- `npm test`
- `npm run smoke:eval`
- `npm run eval:memory-search:cases -- --skip-builtin`
- `npm run umc:stage5 -- --format json`
- `npm run umc:openclaw-itest -- --format json`
- `npm run umc:openclaw-install-verify -- --format json`
- Markdown link scan
- `git diff --check`

The memory-search portion of release-preflight validates plugin-side expected signals only.

Builtin OpenClaw search comparison remains available through the standalone memory-search eval flow when you want deeper comparison outside the release gate.

## When To Use It

Use this flow when:

- Stage 5 is already complete
- you want release-grade CLI evidence
- you want the repo to stop depending on human operator repetition

## After It Passes

After a green preflight report, the remaining step is no longer more CLI work.

The remaining step is human acceptance, for example:

- one real OpenClaw conversation sanity check
- one final operator review before commit / push / tag

## Related Documents

- [openclaw-bundle-install.md](openclaw-bundle-install.md)
- [stage5-acceptance.md](stage5-acceptance.md)
- [../../../../release.md](../../../../release.md)
