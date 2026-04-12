# Unified Memory Core Testing Plan

[English](README.md) | [中文](README.zh-CN.md)

测试规划入口：

- [case-matrix.md](case-matrix.md)
- [stage3-stage4-acceptance.zh-CN.md](stage3-stage4-acceptance.zh-CN.md)
- [stage5-acceptance.zh-CN.md](stage5-acceptance.zh-CN.md)
- [openclaw-cli-integration.zh-CN.md](openclaw-cli-integration.zh-CN.md)
- [openclaw-bundle-install.zh-CN.md](openclaw-bundle-install.zh-CN.md)
- [release-preflight.zh-CN.md](release-preflight.zh-CN.md)

推荐操作路径：

- 先跑 `npm run umc:acceptance -- --format markdown`
- 如果要拿 product hardening 和 split-readiness 证据，再跑 `npm run umc:stage5 -- --format markdown`
- 如果要确认宿主级 OpenClaw 集成，再跑 `npm run umc:openclaw-itest -- --format markdown`
- 如果要把“真实安装 + 完整 CLI 验证”一次收口，再跑 `npm run umc:release-preflight -- --format markdown`
- 只有 acceptance 报告失败时，再退回更窄的 lifecycle / maintenance / reproducibility / review CLI 命令定位问题

Stage 5 的 testing surfaces 分成 5 层：

1. contract validation
2. module behavior
3. export / artifact validation
4. adapter compatibility
5. product hardening 与 split-readiness validation

当前需要持续保护、持续为绿的测试面：

- source registration correctness
- normalization / fingerprint correctness
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
- `file` / `directory` / `url` / `image` 四类 source adapter hardening
- maintenance workflow correctness
- export reproducibility correctness
- OpenClaw release bundle build correctness
- OpenClaw release bundle install verification correctness
- release-preflight orchestration correctness

当前已经落地的测试套件：

- contract parsing / validation: [../../../test/unified-memory-core/contracts.test.js](../../../../test/unified-memory-core/contracts.test.js)
- source normalization / replay snapshot: [../../../test/unified-memory-core/source-system.test.js](../../../../test/unified-memory-core/source-system.test.js)
- registry persistence / local-first lifecycle loop: [../../../test/unified-memory-core/memory-registry.test.js](../../../../test/unified-memory-core/memory-registry.test.js)
- reflection labeling / persistence / repeat-signal scoring: [../../../test/unified-memory-core/reflection-system.test.js](../../../../test/unified-memory-core/reflection-system.test.js)
- self-learning daily reflection runner / report shape: [../../../test/unified-memory-core/daily-reflection.test.js](../../../../test/unified-memory-core/daily-reflection.test.js)
- projection export contract / visibility filtering: [../../../test/unified-memory-core/projection-system.test.js](../../../../test/unified-memory-core/projection-system.test.js)
- standalone export inspect / markdown report path: [../../../test/unified-memory-core/standalone-export.test.js](../../../../test/unified-memory-core/standalone-export.test.js)
- independent execution / split-readiness review path: [../../../test/unified-memory-core/independent-execution.test.js](../../../../test/unified-memory-core/independent-execution.test.js)
- OpenClaw / Codex adapter bridge compatibility: [../../../test/unified-memory-core/adapter-bridges.test.js](../../../../test/unified-memory-core/adapter-bridges.test.js)
- governance audit / repair / replay primitives: [../../../test/unified-memory-core/governance-system.test.js](../../../../test/unified-memory-core/governance-system.test.js)
- standalone runtime / CLI contract path: [../../../test/unified-memory-core/standalone-runtime.test.js](../../../../test/unified-memory-core/standalone-runtime.test.js)
- Stage 3-4 acceptance automation: [../../../test/unified-memory-core/stage3-stage4-acceptance.test.js](../../../../test/unified-memory-core/stage3-stage4-acceptance.test.js)
- Stage 5 acceptance automation: [../../../test/unified-memory-core/stage5-acceptance.test.js](../../../../test/unified-memory-core/stage5-acceptance.test.js)
- OpenClaw CLI host integration smoke: [../../../test/openclaw-cli-integration.test.js](../../../../test/openclaw-cli-integration.test.js)
- OpenClaw release bundle builder: [../../../test/openclaw-release-bundle.test.js](../../../../test/openclaw-release-bundle.test.js)
- OpenClaw release bundle install verification: [../../../test/openclaw-bundle-install.test.js](../../../../test/openclaw-bundle-install.test.js)
- standalone governance repair / replay command path: [../../../test/unified-memory-core/standalone-governance.test.js](../../../../test/unified-memory-core/standalone-governance.test.js)
- OpenClaw runtime adapter integration: [../../../test/openclaw-adapter.test.js](../../../../test/openclaw-adapter.test.js)
- Codex runtime adapter integration: [../../../test/codex-adapter.test.js](../../../../test/codex-adapter.test.js)
- OpenClaw / Codex / governance adapter compatibility: [../../../test/adapter-compatibility.test.js](../../../../test/adapter-compatibility.test.js)
