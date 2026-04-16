# Dialogue Working-Set Runtime Shadow Replay

- model: `gpt-5.4`
- reasoning effort: `low`
- output dir: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16`
- cases: `16`
- captured: `16`
- passed: `16`
- failed: `0`
- average reduction ratio: `0.4368`
- average shadow elapsed ms: `18728.3`
- relation counts: `{"continue":5,"switch":7,"branch":3,"resolve":1}`

## shadow-replay-project-switches:t6
- description: One architecture topic continues, then switches to config, then switches again to testing.
- session key: `agent:stage6-shadow:shadow-replay-project-switches:t6`
- captured: `true`
- passed: `true`
- relation: `continue`
- reduction ratio: `0.1538`
- elapsed ms: `24202`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-project-switches-t6-shadow-1776347936987-hix5ef.json`

## shadow-replay-project-switches:t7
- description: One architecture topic continues, then switches to config, then switches again to testing.
- session key: `agent:stage6-shadow:shadow-replay-project-switches:t7`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.6731`
- elapsed ms: `25394`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-project-switches-t7-shadow-1776347961203-p189bd.json`

## shadow-replay-project-switches:t9
- description: One architecture topic continues, then switches to config, then switches again to testing.
- session key: `agent:stage6-shadow:shadow-replay-project-switches:t9`
- captured: `true`
- passed: `true`
- relation: `continue`
- reduction ratio: `0.4783`
- elapsed ms: `20556`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-project-switches-t9-shadow-1776347986605-3suwfc.json`

## shadow-replay-open-loop-branch-return:t3
- description: An unfinished planning task is interrupted by a side question and then resumed.
- session key: `agent:stage6-shadow:shadow-replay-open-loop-branch-return:t3`
- captured: `true`
- passed: `true`
- relation: `branch`
- reduction ratio: `0.0000`
- elapsed ms: `15213`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-open-loop-branch-return-t3-shadow-1776348007166-ifzse1.json`

## shadow-replay-open-loop-branch-return:t5
- description: An unfinished planning task is interrupted by a side question and then resumed.
- session key: `agent:stage6-shadow:shadow-replay-open-loop-branch-return:t5`
- captured: `true`
- passed: `true`
- relation: `branch`
- reduction ratio: `0.5581`
- elapsed ms: `18366`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-open-loop-branch-return-t5-shadow-1776348022386-1daby9.json`

## shadow-replay-family-code-family:t5
- description: Durable family facts are captured, the chat switches to code, then the user returns to the old family fact.
- session key: `agent:stage6-shadow:shadow-replay-family-code-family:t5`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.6087`
- elapsed ms: `15190`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-family-code-family-t5-shadow-1776348040757-i4x27z.json`

## shadow-replay-family-code-family:t7
- description: Durable family facts are captured, the chat switches to code, then the user returns to the old family fact.
- session key: `agent:stage6-shadow:shadow-replay-family-code-family:t7`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.6389`
- elapsed ms: `22132`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-family-code-family-t7-shadow-1776348055952-9wymi2.json`

## shadow-replay-status-style-release:t4
- description: Status noise and a style preference should yield to two successive task switches.
- session key: `agent:stage6-shadow:shadow-replay-status-style-release:t4`
- captured: `true`
- passed: `true`
- relation: `continue`
- reduction ratio: `0.6410`
- elapsed ms: `16854`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-status-style-release-t4-shadow-1776348078088-bu3f5g.json`

## shadow-replay-status-style-release:t6
- description: Status noise and a style preference should yield to two successive task switches.
- session key: `agent:stage6-shadow:shadow-replay-status-style-release:t6`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.8393`
- elapsed ms: `20196`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-shadow-shadow-replay-status-style-release-t6-shadow-1776348094946-b3mtcl.json`

## adversarial-false-switch-same-topic
- description: The user rephrases the same topic; this should stay continue, not switch.
- session key: `agent:stage6-adversarial:adversarial-false-switch-same-topic`
- captured: `true`
- passed: `true`
- relation: `continue`
- reduction ratio: `0.0000`
- elapsed ms: `15008`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-adversarial-adversarial-false-switch-same-topic-shadow-1776348115146-i7in4d.json`

## adversarial-branch-unfinished-with-side-fact
- description: A durable side fact appears while the main task is still open; the main task must stay.
- session key: `agent:stage6-adversarial:adversarial-branch-unfinished-with-side-fact`
- captured: `true`
- passed: `true`
- relation: `branch`
- reduction ratio: `0.0000`
- elapsed ms: `17121`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-adversarial-adversarial-branch-unfinished-with-side-fact-shadow-1776348130156-rvzo7t.json`

## adversarial-return-old-topic-after-code-switch
- description: The chat switched to code, then explicitly jumps back to an old durable preference.
- session key: `agent:stage6-adversarial:adversarial-return-old-topic-after-code-switch`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.7778`
- elapsed ms: `23571`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-adversarial-adversarial-return-old-topic-after-code-switch-shadow-1776348147282-degjq5.json`

## adversarial-assistant-claim-not-durable
- description: The assistant guessed wrong first; only the user's correction may survive as a durable pin.
- session key: `agent:stage6-adversarial:adversarial-assistant-claim-not-durable`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.6316`
- elapsed ms: `18633`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-adversarial-adversarial-assistant-claim-not-durable-shadow-1776348170859-ws1dr9.json`

## adversarial-session-negative-no-pin
- description: A one-off codename must not be promoted into a long-lived pin after the topic switches.
- session key: `agent:stage6-adversarial:adversarial-session-negative-no-pin`
- captured: `true`
- passed: `true`
- relation: `switch`
- reduction ratio: `0.5333`
- elapsed ms: `17311`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-adversarial-adversarial-session-negative-no-pin-shadow-1776348189496-t4tppr.json`

## adversarial-implicit-continuation
- description: A follow-up that refers to a numbered phase implicitly should still count as continuing the same topic.
- session key: `agent:stage6-adversarial:adversarial-implicit-continuation`
- captured: `true`
- passed: `true`
- relation: `continue`
- reduction ratio: `0.0000`
- elapsed ms: `15300`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-adversarial-adversarial-implicit-continuation-shadow-1776348206813-bf9ssb.json`

## adversarial-resolve-close-conversation
- description: The conversation closes and only the durable preference plus latest user turn should remain.
- session key: `agent:stage6-adversarial:adversarial-resolve-close-conversation`
- captured: `true`
- passed: `true`
- relation: `resolve`
- reduction ratio: `0.4545`
- elapsed ms: `14606`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-shadow-2026-04-16/exports/agent-stage6-adversarial-adversarial-resolve-close-conversation-shadow-1776348222117-rwxtyk.json`
