# Dialogue Working-Set Runtime Shadow Replay

- model: `gpt-5.4`
- reasoning effort: `low`
- output dir: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17`
- cases: `16`
- captured: `16`
- passed: `15`
- failed: `1`
- average reduction ratio: `0.4191`
- average shadow elapsed ms: `15970.3`
- guarded applied: `0`
- relation counts: `{"continue":3,"branch":5,"switch":7,"resolve":1}`

## shadow-replay-project-switches:t6
- description: One architecture topic continues, then switches to config, then switches again to testing.
- session key: `agent:stage6-shadow:shadow-replay-project-switches:t6`
- captured: `true`
- passed: `true`
- relation: `continue`
- reduction ratio: `0.1026`
- elapsed ms: `17764`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-shadow-shadow-replay-project-switches-t6-shadow-1776410420027-x1ijba.json`

## shadow-replay-project-switches:t7
- description: One architecture topic continues, then switches to config, then switches again to testing.
- session key: `agent:stage6-shadow:shadow-replay-project-switches:t7`
- captured: `true`
- passed: `false`
- relation: `branch`
- reduction ratio: `0.1154`
- elapsed ms: `19196`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-shadow-shadow-replay-project-switches-t7-shadow-1776410437795-ob0zth.json`

## shadow-replay-project-switches:t9
- description: One architecture topic continues, then switches to config, then switches again to testing.
- session key: `agent:stage6-shadow:shadow-replay-project-switches:t9`
- captured: `true`
- passed: `true`
- relation: `branch`
- reduction ratio: `0.5072`
- elapsed ms: `21742`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-shadow-shadow-replay-project-switches-t9-shadow-1776410456992-wwn3sf.json`

## shadow-replay-open-loop-branch-return:t3
- description: An unfinished planning task is interrupted by a side question and then resumed.
- session key: `agent:stage6-shadow:shadow-replay-open-loop-branch-return:t3`
- captured: `true`
- passed: `true`
- relation: `branch`
- reduction ratio: `0.0000`
- elapsed ms: `13000`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-shadow-shadow-replay-open-loop-branch-return-t3-shadow-1776410478761-asw63x.json`

## shadow-replay-open-loop-branch-return:t5
- description: An unfinished planning task is interrupted by a side question and then resumed.
- session key: `agent:stage6-shadow:shadow-replay-open-loop-branch-return:t5`
- captured: `true`
- passed: `true`
- relation: `branch`
- reduction ratio: `0.5581`
- elapsed ms: `13762`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-shadow-shadow-replay-open-loop-branch-return-t5-shadow-1776410491762-3xjmh1.json`

## shadow-replay-family-code-family:t5
- description: Durable family facts are captured, the chat switches to code, then the user returns to the old family fact.
- session key: `agent:stage6-shadow:shadow-replay-family-code-family:t5`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.6087`
- elapsed ms: `13955`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-shadow-shadow-replay-family-code-family-t5-shadow-1776410505525-bunzku.json`

## shadow-replay-family-code-family:t7
- description: Durable family facts are captured, the chat switches to code, then the user returns to the old family fact.
- session key: `agent:stage6-shadow:shadow-replay-family-code-family:t7`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.8333`
- elapsed ms: `20062`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-shadow-shadow-replay-family-code-family-t7-shadow-1776410519481-j1aln5.json`

## shadow-replay-status-style-release:t4
- description: Status noise and a style preference should yield to two successive task switches.
- session key: `agent:stage6-shadow:shadow-replay-status-style-release:t4`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.7436`
- elapsed ms: `15916`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-shadow-shadow-replay-status-style-release-t4-shadow-1776410539544-lmy9to.json`

## shadow-replay-status-style-release:t6
- description: Status noise and a style preference should yield to two successive task switches.
- session key: `agent:stage6-shadow:shadow-replay-status-style-release:t6`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.8393`
- elapsed ms: `18567`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-shadow-shadow-replay-status-style-release-t6-shadow-1776410555461-d1dded.json`

## adversarial-false-switch-same-topic
- description: The user rephrases the same topic; this should stay continue, not switch.
- session key: `agent:stage6-adversarial:adversarial-false-switch-same-topic`
- captured: `true`
- passed: `true`
- relation: `continue`
- reduction ratio: `0.0000`
- elapsed ms: `13841`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-adversarial-adversarial-false-switch-same-topic-shadow-1776410574029-9h6ybv.json`

## adversarial-branch-unfinished-with-side-fact
- description: A durable side fact appears while the main task is still open; the main task must stay.
- session key: `agent:stage6-adversarial:adversarial-branch-unfinished-with-side-fact`
- captured: `true`
- passed: `true`
- relation: `branch`
- reduction ratio: `0.0000`
- elapsed ms: `13217`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-adversarial-adversarial-branch-unfinished-with-side-fact-shadow-1776410587871-1ez9ap.json`

## adversarial-return-old-topic-after-code-switch
- description: The chat switched to code, then explicitly jumps back to an old durable preference.
- session key: `agent:stage6-adversarial:adversarial-return-old-topic-after-code-switch`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.7778`
- elapsed ms: `19519`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-adversarial-adversarial-return-old-topic-after-code-switch-shadow-1776410601089-z6e8uu.json`

## adversarial-assistant-claim-not-durable
- description: The assistant guessed wrong first; only the user's correction may survive as a durable pin.
- session key: `agent:stage6-adversarial:adversarial-assistant-claim-not-durable`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.6316`
- elapsed ms: `13302`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-adversarial-adversarial-assistant-claim-not-durable-shadow-1776410620611-g7ou4y.json`

## adversarial-session-negative-no-pin
- description: A one-off codename must not be promoted into a long-lived pin after the topic switches.
- session key: `agent:stage6-adversarial:adversarial-session-negative-no-pin`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.5333`
- elapsed ms: `12379`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-adversarial-adversarial-session-negative-no-pin-shadow-1776410633915-xn90xg.json`

## adversarial-implicit-continuation
- description: A follow-up that refers to a numbered phase implicitly should still count as continuing the same topic.
- session key: `agent:stage6-adversarial:adversarial-implicit-continuation`
- captured: `true`
- passed: `true`
- relation: `continue`
- reduction ratio: `0.0000`
- elapsed ms: `13988`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-adversarial-adversarial-implicit-continuation-shadow-1776410646295-720loz.json`

## adversarial-resolve-close-conversation
- description: The conversation closes and only the durable preference plus latest user turn should remain.
- session key: `agent:stage6-adversarial:adversarial-resolve-close-conversation`
- captured: `true`
- passed: `true`
- relation: `resolve`
- reduction ratio: `0.4545`
- elapsed ms: `15314`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-stage7-shadow-2026-04-17/exports/agent-stage6-adversarial-adversarial-resolve-close-conversation-shadow-1776410660285-za9sfw.json`

