# Close Stage 5 Product Hardening And Independent Operation

## Context

Stage 4 had already proved one reversible policy-adaptation loop, but the repo still lacked a stable operator-grade hardening layer.

The practical gaps were:

- standalone source ingestion still stopped at `manual / file / directory / conversation`
- there was no scheduled-job-friendly maintenance workflow
- release-boundary and split-readiness checks existed as documents, not as CLI-verifiable evidence
- export reproducibility was implied by design, not proven by a dedicated audit
- Stage 5 had no one-command acceptance flow

## What Changed

Implemented Stage 5 as one CLI-first hardening layer instead of a loose checklist.

Core runtime / source changes:

- extended shared source contracts to include `url` and `image`
- hardened `src/unified-memory-core/source-system.js` for `file / directory / url / image`
- taught reflection, daily reflection, and pipeline summary paths to consume the new source payloads
- added multi-source manifest support through CLI `--sources-file`

Operator workflow changes:

- added maintenance workflow support in standalone runtime and CLI
- added export reproducibility audit in standalone runtime and CLI
- added split rehearsal report on top of independent-execution review and registry migration dry-run
- added one-command Stage 5 acceptance through `scripts/run-stage5-acceptance.js` and `npm run umc:stage5`

Release-boundary / readiness changes:

- corrected independent-execution review to prefer `docs/reference/unified-memory-core/`
- added runtime API prerequisites as an explicit documented gate
- added Stage 5 testing docs, maintenance docs, and updated release-boundary / migration-checklist verification

## Key Decisions

1. Treat Stage 5 as an operator surface, not just an implementation surface.
2. Keep URL and image ingestion local-first: accept declared snapshots / metadata, not network-required fetching.
3. Reuse one governed policy loop as Stage 5 evidence instead of inventing a parallel hidden hardening path.
4. Keep repo-split rehearsal dry-run only; prove readiness before any physical split work.

## Verification

- `node --test test/unified-memory-core/source-system.test.js`
- `node --test test/unified-memory-core/independent-execution.test.js`
- `node --test test/unified-memory-core/stage5-acceptance.test.js`
- `npm run umc:stage5 -- --format markdown`
- `npm run umc:acceptance -- --format markdown`
- `npm run umc:openclaw-itest -- --format markdown`
- `npm run umc:cli -- maintenance run --sources-file ... --format markdown`
- `npm run umc:cli -- export reproducibility --format markdown`
- `npm run umc:cli -- review independent-execution --format markdown`
- `npm run umc:cli -- review split-rehearsal --format markdown`
- `npm test`
- `npm run smoke:eval`
- `npm run eval:memory-search:cases`
- Markdown link scan: `234` files, `issueCount = 0`
- `git diff --check`

## Outcome

Stage 5 is now closed.

The repo has:

- hardened standalone source adapters for `file / directory / url / image`
- a scheduled-job-friendly maintenance workflow
- reproducibility, release-boundary, and split-rehearsal evidence
- runtime API prerequisites documented as a deferred gate
- one-command Stage 5 acceptance

The next work is not more Stage 5 contract discovery. It is keeping the new evidence stable and making root-cutover policy explicit.
