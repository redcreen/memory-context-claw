# Source System Roadmap

## Goal

Build controlled, replayable source ingestion.

## Phases

### Phase 1. Manifest and registration

- define source manifest schema
- define scope / visibility fields
- define source id and fingerprint rules

### Phase 2. Adapter MVP

- file adapter
- directory adapter
- conversation adapter
- manual CLI input adapter

### Phase 3. Replay and change detection

- replay inputs
- fingerprint diff
- dry-run inspection

## Exit Criteria

- declared sources can become source artifacts
- fingerprinting supports dedupe and replay
- test coverage exists for registration and normalization
