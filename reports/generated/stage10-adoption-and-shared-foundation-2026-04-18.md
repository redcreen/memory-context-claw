# Stage 10 Adoption And Shared-Foundation Proof

- Generated at: `2026-04-17T22:04:14.066Z`
- Status: `pass`

## Shortest Maintainer Path

```bash
npm install
npm run umc:stage10 -- --format markdown
```

## Stronger Release-Grade Gate

```bash
npm run umc:release-preflight -- --format markdown
```

## Package / Startup / First-Run

- package tarball: `1456484 bytes`
- `npm pack` duration: `1642ms`
- bundled files / entry count: `762`
- `umc where`: `154ms`
- first-run `umc registry inspect --registry-dir <temp>`: `80ms`

## Codex Shared-Foundation Proof

- status: `pass`
- workspace: `stage10-shared-foundation`
- promoted: `1`
- candidates: `1`
- policy inputs: `1`
- top candidate: `When drafting GitHub PR comments, prefer the github_pr_comment tool.`

## Multi-Instance Shared-Memory Proof

- status: `pass`
- workspace: `stage10-multi-instance`
- candidates: `2`
- policy inputs: `2`
- snippets:
  - `Keep progress updates concise and bullet-first.`
  - `Prefer async written updates over live calls.`

## Checks

- [PASS] `package_footprint_measured`
  - expected: package tarball metrics captured
  - actual: `1456484 bytes`
- [PASS] `cli_startup_measured`
  - expected: CLI startup timing captured
  - actual: `154ms`
- [PASS] `cli_first_run_measured`
  - expected: first-run registry inspect timing captured
  - actual: `80ms`
- [PASS] `codex_shared_foundation_proof`
  - expected: Codex `writeAfterTask(...)` durable memory becomes OpenClaw-readable governed memory on one shared root
  - actual: `1 promoted / 1 candidate`
- [PASS] `multi_instance_shared_memory_proof`
  - expected: multiple writers can share one registry root and remain readable through one OpenClaw workspace view
  - actual: `2 candidates / 2 policy inputs`

## Interpretation

Stage 10 is no longer an architecture-only claim.

The shortest maintainer path now proves three concrete product properties in one pass:

1. the package is small enough to measure and discuss as part of the `light and fast` surface
2. the CLI startup and first-run operator path are measured directly
3. the shared foundation is proven on both Codex and multi-instance paths instead of only the OpenClaw mainline
