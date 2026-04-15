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
- [execution-modes.md](execution-modes.md)
- [standalone-mode.md](standalone-mode.md)
- [independent-execution.md](independent-execution.md)
- [../deployment-topology.md](../deployment-topology.md)

Recommended implementation review order:

1. `Source System`
2. `Memory Registry`
3. `OpenClaw Adapter`
4. `Codex Adapter`
5. `Reflection System`
6. `Standalone Mode`
7. `Independent Execution`
8. `Projection System`
9. `Governance System`
