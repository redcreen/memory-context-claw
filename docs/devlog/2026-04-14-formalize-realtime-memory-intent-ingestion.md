# 2026-04-14 Formalize Realtime Memory-Intent Ingestion

## Problem

The repo could already remember explicit rules inside one live session, but ordinary conversation rules still depended on nightly self-learning to enter the governed registry.

That created three failures:

- clear future-behavior rules could be missed until nightly
- nightly hardcoded compression could still drop obviously durable rules
- `accepted_action` already had a governed real-time intake path while conversation rules did not

## Decision

Treat `reply + memory_extraction` as a first-class governed ingest contract instead of leaving it as an adapter-local experiment.

The implementation direction was:

1. build a replay regression surface for ambiguous memory-intent boundaries
2. formalize a shared `memory_intent` contract and source type
3. route durable vs session/task-local cases through explicit admission paths
4. add a dedicated gate so schema or prompt drift cannot silently push explicit rules back into the nightly funnel

## Implementation

- Added `src/unified-memory-core/memory-intent-contract.js`
- Added formal `memory_intent` source support to contracts, source normalization, reflection, daily reflection text handling, CLI help, and standalone summaries
- Changed Codex adapter `writeAfterTask(...)` so structured `memory_extraction` now emits governed `memory_intent` sources and runs through reflection + promotion instead of flattening into a `manual` source
- Expanded replay coverage to `7` high-confusion cases
- Added `npm run verify:memory-intent` as the formal gate for this slice
- Updated architecture, roadmap, development-plan, and control-surface documents so the slice is recoverable without chat history

## Validation

- `npm run verify:memory-intent`

## Outcome

The slice is now complete:

- `memory_extraction` is a formal contract, not a local runtime trick
- admission routing is explicit for durable, session, task-local, and skip cases
- replay coverage and governance tests exist
- the repo can move back to the main benchmark / answer-path execution line without losing this design truth
