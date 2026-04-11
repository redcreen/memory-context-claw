# OpenClaw Adapter Roadmap

## Goal

Move the current repo shape onto the formal OpenClaw adapter boundary.

## Phases

### Phase 1. Boundary and namespace

- OpenClaw namespace mapping
- adapter consumption contract
- export-loading rules

### Phase 2. Runtime integration

- retrieval integration
- scoring / assembly integration
- adapter compatibility checks

### Phase 3. Hardening

- regression protection
- host-compatibility audits
- migration cleanup from legacy naming and paths

## Exit Criteria

- OpenClaw consumes product exports only through the adapter boundary
- adapter behavior stays regression-covered
- legacy runtime confusion is removed
