# Unified Memory Core Testing Plan

[English](README.md) | [中文](README.zh-CN.md)

Testing planning entrypoints:

- [case-matrix.md](case-matrix.md)
- [stage3-stage4-acceptance.md](stage3-stage4-acceptance.md)
- [stage5-acceptance.md](stage5-acceptance.md)
- [openclaw-cli-integration.md](openclaw-cli-integration.md)
- [openclaw-bundle-install.md](openclaw-bundle-install.md)
- [release-preflight.md](release-preflight.md)
- [main-path-performance-plan.md](main-path-performance-plan.md)

Preferred operator flow:

- run `npm run umc:acceptance -- --format markdown` first
- run `npm run umc:stage5 -- --format markdown` next when you need product-hardening and split-readiness evidence
- run `npm run umc:openclaw-itest -- --format markdown` next when you need host-level OpenClaw integration confidence
- run `npm run umc:release-preflight -- --format markdown` when you want one CLI gate that leaves only human acceptance
- fall back to the narrower lifecycle / maintenance / reproducibility / review CLI commands only if an acceptance report fails

Stage 5 testing surfaces are grouped into five layers:

1. contract validation
2. module behavior
3. export / artifact validation
4. adapter compatibility
5. product hardening and split-readiness validation

Current protected surfaces that must stay green:

- source registration correctness
- normalization and fingerprint correctness
- candidate extraction correctness
- registry lifecycle correctness
- projection artifact correctness
- governance audit / repair / replay correctness
- OpenClaw adapter compatibility
- Codex adapter compatibility
- multi-runtime namespace / visibility / concurrency correctness
- self-learning reflection / promotion / decay correctness
- standalone CLI contract correctness
- independent execution / split-readiness review correctness
- source adapter hardening for `file` / `directory` / `url` / `image`
- maintenance workflow correctness
- export reproducibility correctness
- OpenClaw release bundle build correctness
- OpenClaw release bundle install verification correctness
- release-preflight orchestration correctness

Current implemented suites:

- contract parsing and validation: [../../../test/unified-memory-core/contracts.test.js](../../../../test/unified-memory-core/contracts.test.js)
- source normalization and replay snapshot: [../../../test/unified-memory-core/source-system.test.js](../../../../test/unified-memory-core/source-system.test.js)
- registry persistence and local-first lifecycle loop: [../../../test/unified-memory-core/memory-registry.test.js](../../../../test/unified-memory-core/memory-registry.test.js)
- reflection labeling, persistence, and repeat-signal scoring: [../../../test/unified-memory-core/reflection-system.test.js](../../../../test/unified-memory-core/reflection-system.test.js)
- self-learning daily reflection runner and report shape: [../../../test/unified-memory-core/daily-reflection.test.js](../../../../test/unified-memory-core/daily-reflection.test.js)
- projection export contract and visibility filtering: [../../../test/unified-memory-core/projection-system.test.js](../../../../test/unified-memory-core/projection-system.test.js)
- standalone export inspect and markdown report path: [../../../test/unified-memory-core/standalone-export.test.js](../../../../test/unified-memory-core/standalone-export.test.js)
- independent execution / split-readiness review path: [../../../test/unified-memory-core/independent-execution.test.js](../../../../test/unified-memory-core/independent-execution.test.js)
- OpenClaw / Codex adapter bridge compatibility: [../../../test/unified-memory-core/adapter-bridges.test.js](../../../../test/unified-memory-core/adapter-bridges.test.js)
- governance audit / repair / replay primitives: [../../../test/unified-memory-core/governance-system.test.js](../../../../test/unified-memory-core/governance-system.test.js)
- standalone runtime and CLI contract path: [../../../test/unified-memory-core/standalone-runtime.test.js](../../../../test/unified-memory-core/standalone-runtime.test.js)
- Stage 3-4 acceptance automation: [../../../test/unified-memory-core/stage3-stage4-acceptance.test.js](../../../../test/unified-memory-core/stage3-stage4-acceptance.test.js)
- Stage 5 acceptance automation: [../../../test/unified-memory-core/stage5-acceptance.test.js](../../../../test/unified-memory-core/stage5-acceptance.test.js)
- OpenClaw CLI host integration smoke: [../../../test/openclaw-cli-integration.test.js](../../../../test/openclaw-cli-integration.test.js)
- OpenClaw release bundle builder: [../../../test/openclaw-release-bundle.test.js](../../../../test/openclaw-release-bundle.test.js)
- OpenClaw release bundle install verification: [../../../test/openclaw-bundle-install.test.js](../../../../test/openclaw-bundle-install.test.js)
- standalone governance repair / replay command path: [../../../test/unified-memory-core/standalone-governance.test.js](../../../../test/unified-memory-core/standalone-governance.test.js)
- OpenClaw runtime adapter integration: [../../../test/openclaw-adapter.test.js](../../../../test/openclaw-adapter.test.js)
- Codex runtime adapter integration: [../../../test/codex-adapter.test.js](../../../../test/codex-adapter.test.js)
- adapter compatibility across OpenClaw / Codex / governance: [../../../test/adapter-compatibility.test.js](../../../../test/adapter-compatibility.test.js)
