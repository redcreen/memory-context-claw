# Memory Registry Roadmap

## Goal

Build the persistence and lifecycle center of the product.

## Phases

### Phase 1. Record families and schema

- source artifact schema
- candidate artifact schema
- stable artifact schema

### Phase 2. Lifecycle transitions

- promotion
- decay
- observation queue
- dropped state

### Phase 3. History and conflict

- decision trail
- conflict records
- superseded records

## Exit Criteria

- registry can persist and query all core artifact families
- lifecycle transitions are explicit and testable
- decision trail is visible and replayable
