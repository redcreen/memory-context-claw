# Unified Memory Core Ownership Map

[English](ownership-map.md) | [中文](ownership-map.zh-CN.md)

## Purpose

This document fixes the ownership boundary between product core and adapters while the repo is still incubated as one unit.

## Ownership Table

### Product Core

Owns:

- shared contracts
- source / registry / reflection / projection / governance modules
- standalone runtime and CLI
- portable export and review surfaces

Primary paths:

- [../../src/unified-memory-core/](../../../src/unified-memory-core/)
- [../../scripts/unified-memory-core-cli.js](../../../scripts/unified-memory-core-cli.js)
- [../../scripts/run-daily-reflection.js](../../../scripts/run-daily-reflection.js)
- [../../scripts/run-independent-execution-review.js](../../../scripts/run-independent-execution-review.js)

### OpenClaw Adapter

Owns:

- OpenClaw-facing runtime integration
- context assembly consumption boundary
- host/plugin wiring

Primary paths:

- [../../src/openclaw-adapter.js](../../../src/openclaw-adapter.js)
- [../../src/plugin/index.js](../../../src/plugin/index.js)
- [../../src/engine.js](../../../src/engine.js)
- [../../src/scoring.js](../../../src/scoring.js)

### Codex Adapter

Owns:

- Codex-facing read-before-task contract
- Codex write-after-task governed write-back

Primary paths:

- [../../src/codex-adapter.js](../../../src/codex-adapter.js)

### Shared Regression Surface

Owns:

- cross-surface regression confidence
- migration guardrails before any split

Primary paths:

- [../../test/unified-memory-core/](../../../test/unified-memory-core/)
- [../../test/openclaw-adapter.test.js](../../../test/openclaw-adapter.test.js)
- [../../test/codex-adapter.test.js](../../../test/codex-adapter.test.js)
- [../../test/adapter-compatibility.test.js](../../../test/adapter-compatibility.test.js)

## Boundary Rules

- product core must stay reusable without OpenClaw host participation
- adapters consume portable exports; they do not redefine core contracts
- host-specific logic stays outside `src/unified-memory-core/`
- a future repo split must preserve these boundaries
