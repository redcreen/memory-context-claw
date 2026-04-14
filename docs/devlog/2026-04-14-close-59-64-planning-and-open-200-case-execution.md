# Close 59-64 planning and open 200-case execution

## Problem

After the first `187`-case benchmark expansion, the repo still had `59-64` sitting as planning-only steps.

That left three gaps:

1. the `200`-case direction was still a verbal intention rather than a written coverage plan
2. Chinese coverage and answer-level gating were visible in status text, but not closed into the durable execution order
3. the main-path performance discussion existed as a priority, but not yet as a concrete plan plus first baseline

## Considered

- Only update the roadmap and leave `59-64` as planning steps.
  - Rejected because it would keep the repo in a half-planned state and force the next session to reconstruct the same priorities.
- Expand cases immediately without closing the planning queue.
  - Rejected because the benchmark already had obvious blind spots, especially Chinese coverage and answer-level attribution.
- Close `59-64` as a bundle: coverage review, Chinese quota planning, formal gate framing, performance plan, and first baseline.
  - Chosen because it turns the next phase into an execution queue instead of another planning loop.

## Changes

- Added the coverage-review report:
  - `reports/generated/openclaw-cli-memory-coverage-plan-2026-04-14.md`
- Added the main-path performance planning docs:
  - `docs/reference/unified-memory-core/testing/main-path-performance-plan.md`
  - `docs/reference/unified-memory-core/testing/main-path-performance-plan.zh-CN.md`
- Added the first main-path performance baseline artifacts:
  - `reports/main-path-performance-baseline-2026-04-14.json`
  - `reports/generated/main-path-performance-baseline-2026-04-14.md`
- Updated `docs/reference/unified-memory-core/development-plan*.md`:
  - marked `59-64` completed
  - opened `65-70` as the next execution queue
- Updated `docs/roadmap*.md`, `docs/workstreams/project/roadmap*.md`, `.codex/plan.md`, and `.codex/status.md` so the active slice moves from planning to execution.

## Verification

- `npm run eval:perf -- --timeout-ms 15000`
  - passed
  - retrieval / assembly average total `20ms`
- `node scripts/watch-openclaw-memory-search-transport.js --format json --per-category 1 --max-probes 8 --timeout-ms 8000`
  - watchlist remained red
  - `8 / 8 invalid_json`
  - average duration `9863ms`
- targeted `openclaw agent` answer-level sampling against `umceval`
  - preferred name: host failure at `45049ms`
  - project question: abstained at `25895ms`
  - current deploy region: abstained at `30502ms`
- `git diff --check`
  - passed

## Outcome

`59-64` are no longer “next planning ideas.”

They are now closed as durable outputs, and the next active slice is explicit:

- expand to `200+` cases
- make Chinese cases at least `50%`
- formalize answer-level and transport gates
- optimize the slowest main-path layer starting with the host answer-level path
