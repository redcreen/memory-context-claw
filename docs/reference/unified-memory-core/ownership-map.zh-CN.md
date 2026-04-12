# Unified Memory Core Ownership Map

[English](ownership-map.md) | [中文](ownership-map.zh-CN.md)

## 目的

这份文档在当前单仓孵化阶段，把产品 core 与 adapters 的 ownership boundary 固定下来。

## Ownership 表

### Product Core

负责：

- shared contracts
- source / registry / reflection / projection / governance 模块
- standalone runtime 与 CLI
- 可移植 export 与 review surfaces

主路径：

- [../../src/unified-memory-core/](../../../src/unified-memory-core/)
- [../../scripts/unified-memory-core-cli.js](../../../scripts/unified-memory-core-cli.js)
- [../../scripts/run-daily-reflection.js](../../../scripts/run-daily-reflection.js)
- [../../scripts/run-independent-execution-review.js](../../../scripts/run-independent-execution-review.js)

### OpenClaw Adapter

负责：

- OpenClaw 运行时接入
- context assembly consumption boundary
- host/plugin wiring

主路径：

- [../../src/openclaw-adapter.js](../../../src/openclaw-adapter.js)
- [../../src/plugin/index.js](../../../src/plugin/index.js)
- [../../src/engine.js](../../../src/engine.js)
- [../../src/scoring.js](../../../src/scoring.js)

### Codex Adapter

负责：

- Codex 的 read-before-task contract
- Codex 的 write-after-task governed write-back

主路径：

- [../../src/codex-adapter.js](../../../src/codex-adapter.js)

### Shared Regression Surface

负责：

- 跨表面的回归信心
- 拆分前的迁移护栏

主路径：

- [../../test/unified-memory-core/](../../../test/unified-memory-core/)
- [../../test/openclaw-adapter.test.js](../../../test/openclaw-adapter.test.js)
- [../../test/codex-adapter.test.js](../../../test/codex-adapter.test.js)
- [../../test/adapter-compatibility.test.js](../../../test/adapter-compatibility.test.js)

## 边界规则

- product core 必须保持可在没有 OpenClaw host 参与时复用
- adapters 只消费 portable exports，不重新定义 core contracts
- host-specific logic 留在 `src/unified-memory-core/` 外部
- 未来若拆仓，必须保持这些边界不变
