# Converge architecture retrofit for unified-memory-core

- Date: 2026-04-12
- Status: resolved

## Problem

The repo still looked aligned at the top level, but its architecture retrofit path stopped at a working note. The real repo still had legacy architecture and roadmap trees, missing control-surface sections, and public-doc rules that forced low-quality bilingual stubs.

## Thinking

The correct fix was not another checklist. The repo needed direct convergence: move legacy deep documentation into reference/workstream/archive buckets, narrow the public-doc surface to real landing docs, regenerate the execution line from a valid active slice, and make the control surface reflect the current checkpoint instead of old retrofit scaffolding.

## Solution

Ran the architecture-retrofit flow to generate a repo-local working note, repaired the control-surface sync path, migrated legacy Markdown trees into governed locations, customized doc-governance so only true public docs remain bilingual-gated, regenerated the execution line, and refreshed architecture supervision so the repo could continue from a concrete slice after retrofit.

## Validation

Architecture-retrofit note generation passed, control-surface and docs sync completed, and the repo now reruns deep validation against the new governed structure instead of the old mixed doc tree.

## Follow-Ups

- Keep evaluating whether more workstream docs should be promoted into the public bilingual stack only after they have real translated content and stable links.

## Related Files

- .codex/architecture-retrofit.md,.codex/doc-governance.json,.codex/plan.md,.codex/status.md,docs/README.md,docs/reference/README.md,docs/workstreams/README.md
