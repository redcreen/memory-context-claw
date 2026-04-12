# Module Status

## Ownership

Own Codex-facing adapter integration, compatibility behavior, and future Codex-specific memory consumption paths.

## Current Status

`stage4-complete / stable`

## Already Implemented

- Codex adapter runtime integration baseline
- compatibility coverage across OpenClaw / Codex / governance surfaces
- first-class adapter position in product docs and architecture
- governed `policy_inputs`, `policy_block`, and `task_defaults` on task reads

## Remaining Steps
1. Converge Codex on the same canonical registry root used by OpenClaw.
2. Keep task-side policy consumption on governed exports, not Codex-local heuristics.
3. Revisit task-side consumption only when Stage 5 hardening requires more explicit operator controls.
4. Keep shared namespace compatibility proven as root policy changes.

## Completion Signal

Codex now consumes governed Stage 4 policy inputs. Remaining work is root alignment and later hardening, not Stage 4 discovery.

## Next Checkpoint

Prove that Codex can keep reading the same governed policy memory as root policy converges.
