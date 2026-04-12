# Close Stage 4 Policy Adaptation And Multi-Consumer Use

## Context

Stage 3 had already made learning lifecycle behavior explicit, but the product was still missing the next actual loop:

`governed learning outputs -> policy-facing artifacts -> OpenClaw / Codex consumer behavior`

The repo still described Stage 4 as pending because:

- `policy-input artifact` had not been frozen as a shared contract
- OpenClaw and Codex were still reading stable artifacts directly, not a governed policy layer
- rollback / compatibility checks for consumer policy use were not first-class governance outputs
- there was no single reproducible local loop proving policy adaptation end to end

## What Changed

Implemented one shared Stage 4 layer instead of separate adapter-local heuristics.

Core changes:

- added `src/unified-memory-core/policy-adaptation.js`
- added `parsePolicyInputArtifact()` to shared contracts
- projected promoted learning artifacts into `policy_inputs` for `generic`, `openclaw`, and `codex` exports
- added policy fingerprints, policy summary, and rollback metadata on export payloads

Consumer changes:

- OpenClaw now loads governed `policyContext` beside governed export candidates
- assembly now injects governed policy guidance into the system prompt when available
- assembly selection can shrink via compact-mode policy hints
- Codex `readBeforeTask()` now returns `policy_inputs`, `policy_block`, `task_defaults`, and policy-aware memory ordering

Governance / runtime changes:

- added Stage 4 policy audit / compatibility report
- validated namespace + visibility behavior across consumers for learned artifacts
- added standalone runtime and CLI support for `govern audit-policy` and `learn policy-loop`
- added `scripts/run-policy-adaptation-loop.js` and `npm run umc:policy-loop`

## Key Decisions

1. Freeze policy adaptation at the export boundary, not inside adapters.
2. Keep rollback simple and explicit: invalid or incompatible policy inputs are ignored, not partially trusted.
3. Make OpenClaw and Codex consume the same governed policy evidence, then let each consumer shape its own behavior from that shared input.
4. Treat Stage 4 completion as “one reversible loop is proven”, not “all future product hardening is done”.

## Verification

- focused Stage 4 suite: `46/46`
- full repo `npm test`: `333/333`
- `node scripts/run-policy-adaptation-loop.js --registry-dir /tmp/umc-stage4-validation ...` passed
- OpenClaw policy context now exposes compact-mode guidance from promoted learning artifacts
- Codex task memory now exposes governed `policy_block` and `task_defaults`

## Outcome

Stage 4 is now closed.

The repo has:

- a named `policy-input artifact` contract
- policy projections on all consumer exports
- OpenClaw and Codex policy consumption through one governed layer
- rollback / compatibility evidence for multi-consumer policy use
- one local reproducible policy-adaptation loop

The next phase is Stage 5 product hardening, not more Stage 4 contract discovery.
