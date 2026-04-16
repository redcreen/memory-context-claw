# OpenClaw Memory Improvement A/B

- generatedAt: `2026-04-16T10:50:07.581Z`
- agent: `umceval65`
- shardCount: `2`
- totalCases: `100`
- unifiedPassed: `98`
- legacyPassed: `97`
- bothPass: `97`
- umcOnly: `1`
- legacyOnly: `0`
- bothFail: `2`

## Language Split

### English

- total: `50`
- unifiedPassed: `50`
- legacyPassed: `49`
- bothPass: `49`
- umcOnly: `1`
- legacyOnly: `0`
- bothFail: `0`

### Chinese

- total: `50`
- unifiedPassed: `48`
- legacyPassed: `48`
- bothPass: `48`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `2`

## Category Summary

- ab-en-bootstrap: unified=`15/15` legacy=`15/15` umcOnly=`0`
- ab-en-retrieval: unified=`20/20` legacy=`19/20` umcOnly=`1`
- ab-en-temporal: unified=`10/10` legacy=`10/10` umcOnly=`0`
- ab-en-negative: unified=`5/5` legacy=`5/5` umcOnly=`0`
- ab-zh-bootstrap: unified=`10/10` legacy=`10/10` umcOnly=`0`
- ab-zh-retrieval: unified=`20/20` legacy=`20/20` umcOnly=`0`
- ab-zh-temporal: unified=`10/10` legacy=`10/10` umcOnly=`0`
- ab-zh-history: unified=`3/5` legacy=`3/5` umcOnly=`0`
- ab-zh-negative: unified=`5/5` legacy=`5/5` umcOnly=`0`

## Attribution Summary

- shared-capability: `58`
- shared-baseline-retrieval: `39`
- unified-retrieval-gain: `1`
- unified-failed: `2`

## UMC-only Samples

- ab100-en-project-purpose-5 [ab-en-retrieval] attribution=`unified-retrieval-gain`
  prompt: Based only on your memory for this agent, if someone asks what Lantern does, how should you describe it? If memory is missing, reply exactly: I don't know based on current memory.
  unified: A B2B analytics assistant for clinic managers.
  legacy: I don't know based on current memory.

## Legacy-only Samples

- none

## Both-fail Samples

- ab100-zh-history-editor-2 [ab-zh-history] attribution=`unified-failed`
  prompt: 只根据当前记忆，切到现在这个编辑器之前，我原来主力是哪个编辑器？如果没有这条记忆，就只回答：I don't know based on current memory.
  unified: I don't know based on current memory.
  legacy: I don't know based on current memory.
- ab100-zh-history-editor-4 [ab-zh-history] attribution=`unified-failed`
  prompt: 只根据当前记忆，现在虽然已经换了编辑器，但之前那段时间主力到底是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
  unified: I don't know based on current memory.
  legacy: I don't know based on current memory.

## Shared-baseline Samples

- ab100-en-name-1 [ab-en-bootstrap] attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen.
- ab100-en-name-2 [ab-en-bootstrap] attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what name should you use when addressing the user? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen
- ab100-en-name-3 [ab-en-bootstrap] attribution=`shared-capability`
  prompt: Based only on your memory for this agent, how should this agent address the user by name? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen.
- ab100-en-name-4 [ab-en-bootstrap] attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the name you should call the user? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen
- ab100-en-name-5 [ab-en-bootstrap] attribution=`shared-capability`
  prompt: Based only on your memory for this agent, when you speak to the user directly, what name should you use? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen.
- ab100-en-role-1 [ab-en-bootstrap] attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's role? If memory is missing, reply exactly: I don't know based on current memory.
  unified: independent product engineer building a clinic analytics assistant
  legacy: independent product engineer building a clinic analytics assistant
- ab100-en-role-2 [ab-en-bootstrap] attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what does Maya Chen do? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Independent product engineer building a clinic analytics assistant.
  legacy: Maya Chen is an independent product engineer building a clinic analytics assistant.
- ab100-en-role-3 [ab-en-bootstrap] attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what kind of work is the user doing? If memory is missing, reply exactly: I don't know based on current memory.
  unified: building a clinic analytics assistant
  legacy: independent product engineer building a clinic analytics assistant

## Notes

- This suite runs `100` distinct live answer-level questions as real single-question `openclaw agent --local` calls.
- Each shard uses its own clean OpenClaw state directory so task-system and unrelated host plugins do not pollute the prompt or timing.
- Both Unified Memory Core and the legacy builtin baseline are evaluated against the same question set, same agent fixture, and same host path.
