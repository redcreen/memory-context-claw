# Independent Execution Roadmap

[English](independent-execution.md) | [中文](independent-execution.zh-CN.md)

## Goal

Make `Unified Memory Core` structurally ready for independent long-term execution.

Current status:

- `step-12 design package complete`
- implementation baseline complete
- release planning is the next phase only if a future split is chosen

## Phases

### Phase 1. Ownership Clarity

- core vs adapter ownership map
- release boundary note
- split-readiness checklist

### Phase 2. Operational Readiness

- standalone operation assumptions
- artifact portability checks
- repo-layout convergence

### Phase 3. Split Optionality

- migration checklist
- release cutover note
- optional repo split preparation

## Exit Criteria

- independent execution no longer depends on plugin-first wording
- split path is documented and reviewable
- repo split becomes an operational choice
