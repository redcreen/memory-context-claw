# Unified Memory Core OpenClaw CLI Integration

[English](openclaw-cli-integration.md) | [中文](openclaw-cli-integration.zh-CN.md)

This page covers the host-level integration smoke path for `unified-memory-core` through the real OpenClaw CLI.

Use this after the repo-level Stage 3-4 acceptance flow when you want confidence that:

- OpenClaw can load the plugin from an isolated profile
- `contextEngine` binding works in host config
- OpenClaw host memory commands still work with the configured plugin

## Preferred Command

```bash
npm run umc:openclaw-itest -- --format markdown
```

This script:

1. creates an isolated OpenClaw profile
2. bootstraps a minimal `openclaw.json`
3. binds `unified-memory-core` as `plugins.slots.contextEngine`
4. validates host config through `openclaw config validate`
5. verifies plugin load through `openclaw plugins inspect` and `openclaw plugins list`
6. writes a smoke `MEMORY.md`, runs `openclaw memory index --force`, and checks `openclaw memory search`
7. cleans up the generated profile and workspace unless you pass `--keep-profile`

## Why This Uses Config Loading Instead Of `plugins install -l .`

For local development trees, OpenClaw safe-install policy may block `openclaw plugins install -l .` when the repo contains shell-execution helpers such as deployment scripts.

That install guard is expected. For local integration smoke, this repo uses host config loading instead:

- `plugins.load.paths`
- `plugins.allow`
- `plugins.slots.contextEngine`

This still exercises the real OpenClaw host loader and real OpenClaw CLI paths.

## Optional Live Agent Probe

If you also want to probe `openclaw agent --local`, run:

```bash
npm run umc:openclaw-itest -- --agent-probe --format markdown
```

Use this only when the isolated profile already has valid auth/provider setup. The default smoke flow skips it, because host auth is not a stable repo-level prerequisite.

## Recommended Overall Flow

1. Run repo acceptance:

```bash
npm run umc:acceptance -- --format markdown
```

2. Run OpenClaw host integration smoke:

```bash
npm run umc:openclaw-itest -- --format markdown
```

3. Only if you still want extra UI confidence, do one manual OpenClaw black-box spot check.

## Related Docs

- [stage3-stage4-acceptance.md](stage3-stage4-acceptance.md)
- [README.md](README.md)
- [../../../../scripts/run-openclaw-cli-integration.js](../../../../scripts/run-openclaw-cli-integration.js)
