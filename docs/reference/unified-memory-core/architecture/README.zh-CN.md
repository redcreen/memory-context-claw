# Unified Memory Core Architecture Map

[English](README.md) | [中文](README.zh-CN.md)

模块架构文档入口：

- [source-system.md](source-system.md)
- [reflection-system.md](reflection-system.md)
- [memory-registry.md](memory-registry.md)
- [projection-system.md](projection-system.md)
- [governance-system.md](governance-system.md)
- [openclaw-adapter.md](openclaw-adapter.md)
- [openclaw-prompt-injection-flow.zh-CN.md](openclaw-prompt-injection-flow.zh-CN.md)
- [codex-adapter.md](codex-adapter.md)
- [realtime-memory-intent-ingestion.md](realtime-memory-intent-ingestion.md)
- [context-slimming-and-budgeted-assembly.zh-CN.md](context-slimming-and-budgeted-assembly.zh-CN.md)
- [context-minor-gc.zh-CN.md](context-minor-gc.zh-CN.md)
- [dialogue-working-set-pruning.zh-CN.md](dialogue-working-set-pruning.zh-CN.md)
- [plugin-owned-context-decision-overlay.zh-CN.md](plugin-owned-context-decision-overlay.zh-CN.md)
- [execution-modes.zh-CN.md](execution-modes.zh-CN.md)
- [standalone-mode.md](standalone-mode.md)
- [independent-execution.md](independent-execution.md)
- [../deployment-topology.md](../deployment-topology.md)

推荐 review / 实现顺序：

1. `Source System`
2. `Memory Registry`
3. `OpenClaw Adapter`
4. `Context Slimming And Budgeted Assembly`
5. `Context Minor GC`
6. `Dialogue Working-Set Pruning`
7. `Plugin-Owned Context Decision Overlay`
8. `Codex Adapter`
9. `Reflection System`
10. `Standalone Mode`
11. `Independent Execution`
12. `Projection System`
13. `Governance System`
