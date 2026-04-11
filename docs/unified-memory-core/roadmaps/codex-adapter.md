# Codex Adapter Roadmap

## Goal

Make Codex a first-class consumer of governed shared memory.

## Phases

### Phase 1. Binding model

- user / project / namespace binding
- code-memory scope model
- adapter contract

### Phase 2. Read and write loops

- read-before-task flow
- write-after-task event flow
- governed write-back reviewability

### Phase 3. Workflow hardening

- coding-task projection tuning
- compatibility checks
- shared code-memory regression tests

## Exit Criteria

- Codex can read governed code memory before tasks
- Codex can emit governed write-back events after tasks
- OpenClaw and Codex can share one memory namespace cleanly
