# Unified Memory Core OpenClaw Bundle Install

[English](openclaw-bundle-install.md) | [中文](openclaw-bundle-install.zh-CN.md)

This document covers the release-grade deployment check for `unified-memory-core`.

It validates one specific question:

`can OpenClaw install a clean release bundle, bind it as contextEngine, and still pass memory CLI smoke in an isolated profile?`

## Preferred Command

Run:

```bash
npm run umc:openclaw-install-verify -- --format markdown
```

This command automatically:

1. builds a clean OpenClaw release bundle
2. checks the bundle for blocked install patterns
3. installs the bundle through `openclaw plugins install`
4. binds `unified-memory-core` into `plugins.slots.contextEngine`
5. validates config, plugin load, memory indexing, and memory search

If you prefer the structured CLI:

```bash
npm run umc:cli -- verify openclaw-install --format markdown
```

## What A Passing Report Means

A passing report proves all of these are true:

- the release artifact is runtime-only, not a dev-repo dump
- OpenClaw safe install accepts the artifact without `--dangerously-force-unsafe-install`
- the installed plugin still loads and answers through the real host path
- host memory CLI behavior remains usable after install

## Narrower Commands

If this flow fails, isolate the layer:

```bash
npm run umc:build-bundle -- --format markdown
```

```bash
npm run umc:openclaw-itest -- --format markdown
```

The first command checks bundle construction and safety scan only.

The second command checks host loading and memory CLI paths through `plugins.load.paths`, without the install step.

## Related Documents

- [release-preflight.md](release-preflight.md)
- [stage5-acceptance.md](stage5-acceptance.md)
- [openclaw-cli-integration.md](openclaw-cli-integration.md)
- [../../../../release.md](../../../../release.md)
