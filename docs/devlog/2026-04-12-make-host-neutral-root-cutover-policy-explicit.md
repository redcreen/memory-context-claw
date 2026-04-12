# Make Host-Neutral Root Cutover Policy Explicit

## Context

By the time Stage 5 and release-preflight closed, the remaining registry-root work was no longer a code gap.

The actual gap was operator ambiguity:

- live runtime resolution had already moved to the canonical root
- migration dry-run from legacy to canonical returned `noop`
- split rehearsal against the canonical root already passed
- but the control surface still described cutover and `registry-root consistency` as unresolved

That created the wrong mental model:

- operators could still read `registry_roots_diverged` as "cutover not done"
- maintainers could still treat legacy mirroring as a future strong gate
- the repo still looked like it had an unresolved storage-policy decision

## What Changed

Closed the ambiguity as an explicit policy slice instead of leaving it as a lingering follow-up.

Implementation changes:

- extended `registry inspect` topology output with:
  - `operatorPolicy`
  - `consistencyGate`
  - `policyRationale`
- added an operator-visible advisory finding when canonical is active and legacy divergence remains present
- added registry-root tests for:
  - legacy fallback => `migrate_to_canonical_root` + `block`
  - canonical active + divergence => `adopt_canonical_root` + `advisory`

Control-surface changes:

- refreshed `.codex/status.md`
- refreshed `.codex/plan.md`
- refreshed `.codex/module-dashboard.md`
- refreshed `.codex/modules/memory-registry.md`
- refreshed `.codex/subprojects/host-neutral-memory.md`

Public-doc changes:

- updated configuration docs with the explicit cutover interpretation
- updated the host-neutral workstream entry docs with the current operator conclusion

## Key Decisions

1. Treat `~/.unified-memory-core/registry` as the canonical default operator target.
2. Treat runtime resolution on the canonical root as the practical cutover signal.
3. Do not promote "legacy must stay mirrored with canonical" into an independent strong gate.
4. Keep the real block conditions narrow:
   - runtime falls back to `legacy_fallback`
   - or the canonical root is missing
5. Treat legacy divergence under canonical-active runtime as advisory, not a stop-the-world failure.

## Verification

- `node --test test/unified-memory-core/registry-roots.test.js`
- `npm run umc:cli -- registry inspect --format markdown`
- `npm run umc:cli -- registry migrate --source-dir ~/.openclaw/unified-memory-core/registry --target-dir ~/.unified-memory-core/registry --format markdown`
- `npm run umc:cli -- review split-rehearsal --source-dir ~/.unified-memory-core/registry --target-dir /tmp/umc-split-rehearsal --format markdown`

Observed result:

- active root: canonical
- cutover ready: true
- migration recommendation: `adopt_canonical_root`
- split rehearsal: `pass`

## Outcome

The repo no longer treats host-neutral root cutover as an unresolved decision.

The remaining work is only:

- keep the explicit operator policy stable
- watch for any regression back to `legacy_fallback`
- decide later whether the stale legacy root copy should be archived or deleted
