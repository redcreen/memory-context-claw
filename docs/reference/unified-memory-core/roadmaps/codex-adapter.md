# Codex Adapter Roadmap

[English](codex-adapter.md) | [中文](codex-adapter.zh-CN.md)

## Goal

Make Codex a first-class consumer of governed shared memory.

Current status:

- `step-9 design package complete`
- implementation is the next phase

## Phases

### Phase 1. Binding model

- user / project / namespace binding
- code-memory scope model
- adapter contract
- local-first multi-runtime binding rules

### Phase 2. Read and write loops

- read-before-task flow
- write-after-task event flow
- governed write-back reviewability
- shared-workspace-safe write serialization

### Phase 3. Workflow hardening

- coding-task projection tuning
- compatibility checks
- shared code-memory regression tests
- future shared-registry readiness checks

## Exit Criteria

- Codex can read governed code memory before tasks
- Codex can emit governed write-back events after tasks
- OpenClaw and Codex can share one memory namespace cleanly
- local-first and shared-workspace behavior stay explicit and governed
