# Converge repo-relative Markdown links after docs tree moves

- Date: 2026-04-12
- Status: resolved

## Problem

The docs tree had already been reorganized into `docs/reference/`, `docs/workstreams/`, `docs/archive/`, and `reports/generated/`, but many Markdown links still pointed at the pre-retrofit layout. The breakage was concentrated in archive/history docs, memory-search workstream docs, ownership/testing references, and a few generated reports. Some generated/archive pages also still contained local absolute filesystem links, which violated repo-doc link policy.

## Thinking

This was not a single broken page. It was structural drift after document moves:

- deep docs were one directory level off
- old stable filenames no longer matched the converged workstream layout
- generated/archive reports still linked to local machine paths or old report locations

The correct fix was to converge links to current repo-relative targets, not to reintroduce legacy paths.

## Solution

Updated the affected Markdown files so that:

- reference docs point to the correct repo-relative `src/`, `test/`, and `scripts/` paths
- memory-search workstream docs point to the converged `README.md` / `architecture.md` / `roadmap.md` / `governance.md` pages and current report/eval locations
- archive docs point to the current durable or generated targets instead of pre-move placeholders
- generated reports stop writing local absolute Markdown links and use repo-relative links or plain code text when the source is outside the repo

## Validation

Ran a repo-wide Markdown link scan over all `*.md` files and checked for:

- missing repo-relative targets
- local absolute Markdown links

Result: `issueCount = 0`.

## Related Files

- docs/archive/development-journal.md
- docs/archive/testsuite.md
- docs/workstreams/memory-search/roadmap.md
- docs/workstreams/memory-search/architecture.md
- docs/reference/unified-memory-core/ownership-map.md
- docs/reference/unified-memory-core/testing/README.md
- reports/generated/current-memory-audit.md
