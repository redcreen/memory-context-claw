# Dialogue Working-Set Runtime Shadow Summary

- output dir: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16`
- exports: `16`
- captured: `16`
- skipped: `0`
- errors: `0`
- average reduction ratio: `0.4368`
- relation counts: `{"switch":7,"branch":3,"continue":5,"resolve":1}`

## Recent Exports

- `2026-04-16T14:01:34.946Z` `agent:stage6-shadow:shadow-replay-status-style-release:t6` relation=`switch` reduction=`0.8393` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-status-style-release-t6-shadow-1776348094946-b3mtcl.json`
- `2026-04-16T14:01:18.088Z` `agent:stage6-shadow:shadow-replay-status-style-release:t4` relation=`continue` reduction=`0.6410` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-status-style-release-t4-shadow-1776348078088-bu3f5g.json`
- `2026-04-16T13:59:46.605Z` `agent:stage6-shadow:shadow-replay-project-switches:t9` relation=`continue` reduction=`0.4783` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-project-switches-t9-shadow-1776347986605-3suwfc.json`
- `2026-04-16T13:59:21.203Z` `agent:stage6-shadow:shadow-replay-project-switches:t7` relation=`switch` reduction=`0.6731` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-project-switches-t7-shadow-1776347961203-p189bd.json`
- `2026-04-16T13:58:56.987Z` `agent:stage6-shadow:shadow-replay-project-switches:t6` relation=`continue` reduction=`0.1538` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-project-switches-t6-shadow-1776347936987-hix5ef.json`
- `2026-04-16T14:00:22.386Z` `agent:stage6-shadow:shadow-replay-open-loop-branch-return:t5` relation=`branch` reduction=`0.5581` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-open-loop-branch-return-t5-shadow-1776348022386-1daby9.json`
- `2026-04-16T14:00:07.166Z` `agent:stage6-shadow:shadow-replay-open-loop-branch-return:t3` relation=`branch` reduction=`0.0000` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-open-loop-branch-return-t3-shadow-1776348007166-ifzse1.json`
- `2026-04-16T14:00:55.952Z` `agent:stage6-shadow:shadow-replay-family-code-family:t7` relation=`switch` reduction=`0.6389` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-family-code-family-t7-shadow-1776348055952-9wymi2.json`
- `2026-04-16T14:00:40.757Z` `agent:stage6-shadow:shadow-replay-family-code-family:t5` relation=`switch` reduction=`0.6087` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-family-code-family-t5-shadow-1776348040757-i4x27z.json`
- `2026-04-16T14:03:09.496Z` `agent:stage6-adversarial:adversarial-session-negative-no-pin` relation=`switch` reduction=`0.5333` export=`/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-adversarial-adversarial-session-negative-no-pin-shadow-1776348189496-t4tppr.json`

## Operator Notes

- each export is replayable JSON under `exports/`
- `decision` preserves the LLM shadow output
- `snapshot` shows baseline raw transcript, kept raw transcript, semantic pins, archive summary, and token estimates
- this summary does not change the active prompt path; it only audits the shadow telemetry surface
