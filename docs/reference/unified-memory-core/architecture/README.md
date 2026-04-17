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
- [plugin-owned-context-decision-overlay.md](plugin-owned-context-decision-overlay.md)
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
6. `Plugin-Owned Context Decision Overlay`
7. `Codex Adapter`
8. `Reflection System`
9. `Standalone Mode`
10. `Independent Execution`
11. `Projection System`
12. `Governance System`
