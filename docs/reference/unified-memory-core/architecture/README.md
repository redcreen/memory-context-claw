# Unified Memory Core Architecture Map

[English](README.md) | [中文](README.zh-CN.md)

Module architecture documents:

- [source-system.md](source-system.md)
- [reflection-system.md](reflection-system.md)
- [memory-registry.md](memory-registry.md)
- [projection-system.md](projection-system.md)
- [governance-system.md](governance-system.md)
- [openclaw-adapter.md](openclaw-adapter.md)
- [codex-adapter.md](codex-adapter.md)
- [realtime-memory-intent-ingestion.md](realtime-memory-intent-ingestion.md)
- [context-slimming-and-budgeted-assembly.md](context-slimming-and-budgeted-assembly.md)
- [dialogue-working-set-pruning.md](dialogue-working-set-pruning.md)
- [execution-modes.md](execution-modes.md)
- [standalone-mode.md](standalone-mode.md)
- [independent-execution.md](independent-execution.md)
- [../deployment-topology.md](../deployment-topology.md)

Recommended implementation review order:

1. `Source System`
2. `Memory Registry`
3. `OpenClaw Adapter`
4. `Context Slimming And Budgeted Assembly`
5. `Dialogue Working-Set Pruning`
6. `Codex Adapter`
7. `Reflection System`
8. `Standalone Mode`
9. `Independent Execution`
10. `Projection System`
11. `Governance System`
