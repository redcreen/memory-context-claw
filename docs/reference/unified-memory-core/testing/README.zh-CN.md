# Unified Memory Core Testing Plan

[English](README.md) | [中文](README.zh-CN.md)

测试规划入口：

- [case-matrix.md](case-matrix.md)

Step 4 的 testing surfaces 分成 4 层：

1. contract validation
2. module behavior
3. export / artifact validation
4. adapter compatibility

当前必须补齐的测试面：

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

当前已经落地的测试套件：

- contract parsing / validation: [../../../test/unified-memory-core/contracts.test.js](../../../test/unified-memory-core/contracts.test.js)
- source normalization / replay snapshot: [../../../test/unified-memory-core/source-system.test.js](../../../test/unified-memory-core/source-system.test.js)
- registry persistence / local-first lifecycle loop: [../../../test/unified-memory-core/memory-registry.test.js](../../../test/unified-memory-core/memory-registry.test.js)
- reflection labeling / persistence / repeat-signal scoring: [../../../test/unified-memory-core/reflection-system.test.js](../../../test/unified-memory-core/reflection-system.test.js)
- self-learning daily reflection runner / report shape: [../../../test/unified-memory-core/daily-reflection.test.js](../../../test/unified-memory-core/daily-reflection.test.js)
- projection export contract / visibility filtering: [../../../test/unified-memory-core/projection-system.test.js](../../../test/unified-memory-core/projection-system.test.js)
- standalone export inspect / markdown report path: [../../../test/unified-memory-core/standalone-export.test.js](../../../test/unified-memory-core/standalone-export.test.js)
- independent execution / split-readiness review path: [../../../test/unified-memory-core/independent-execution.test.js](../../../test/unified-memory-core/independent-execution.test.js)
- OpenClaw / Codex adapter bridge compatibility: [../../../test/unified-memory-core/adapter-bridges.test.js](../../../test/unified-memory-core/adapter-bridges.test.js)
- governance audit / repair / replay primitives: [../../../test/unified-memory-core/governance-system.test.js](../../../test/unified-memory-core/governance-system.test.js)
- standalone runtime / CLI contract path: [../../../test/unified-memory-core/standalone-runtime.test.js](../../../test/unified-memory-core/standalone-runtime.test.js)
- standalone governance repair / replay command path: [../../../test/unified-memory-core/standalone-governance.test.js](../../../test/unified-memory-core/standalone-governance.test.js)
- OpenClaw runtime adapter integration: [../../../test/openclaw-adapter.test.js](../../../test/openclaw-adapter.test.js)
- Codex runtime adapter integration: [../../../test/codex-adapter.test.js](../../../test/codex-adapter.test.js)
- OpenClaw / Codex / governance adapter compatibility: [../../../test/adapter-compatibility.test.js](../../../test/adapter-compatibility.test.js)
