# Module Status

## Ownership

Own source, candidate, and stable artifact storage plus decision trail, lifecycle state transitions, conflict handling, and lineage boundaries.

## Current Status

`stable / policy-fixed`

## Already Implemented

- registry persistence baseline
- source/candidate/stable artifact separation
- candidate -> observation -> stable lifecycle trail
- explicit promotion / decay / conflict / stable-update rules for learning artifacts
- duplicate reuse and conflict supersede behavior
- registry test coverage for lifecycle primitives
- split rehearsal compatibility for registry migration dry-runs

## Remaining Steps

1. Keep canonical root active as the default operator target.
2. Preserve the explicit rule that legacy divergence is advisory when runtime already resolves to canonical.
3. Keep lifecycle lineage metadata stable in post-Stage-5 maintenance.

## Completion Signal

Registry now supports the full lifecycle, Stage 5 split-rehearsal compatibility, and an explicit cutover policy: `~/.unified-memory-core/registry` is the canonical operator target, while `legacy_fallback` or a missing canonical root is the real block condition.

## Next Checkpoint

Keep `registry inspect` at `operatorPolicy = adopt_canonical_root` or `canonical_root_active`; do not let later work reintroduce legacy-mirroring as a hard requirement.
