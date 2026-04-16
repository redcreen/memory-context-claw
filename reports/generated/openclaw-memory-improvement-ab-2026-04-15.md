# OpenClaw Memory Improvement A/B

- generatedAt: `2026-04-15T17:44:27.482Z`
- agent: `umceval65`
- shardCount: `2`
- totalCases: `100`
- unifiedPassed: `97`
- legacyPassed: `97`
- bothPass: `96`
- umcOnly: `1`
- legacyOnly: `1`
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
- unifiedPassed: `47`
- legacyPassed: `48`
- bothPass: `47`
- umcOnly: `0`
- legacyOnly: `1`
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
- ab-zh-negative: unified=`4/5` legacy=`5/5` umcOnly=`0`

## Attribution Summary

- shared-capability: `57`
- shared-baseline-retrieval: `39`
- unified-retrieval-gain: `1`
- unified-failed: `3`

## UMC-only Samples

- ab100-en-project-purpose-5 [ab-en-retrieval] attribution=`unified-retrieval-gain`
  prompt: Based only on your memory for this agent, if someone asks what Lantern does, how should you describe it? If memory is missing, reply exactly: I don't know based on current memory.
  unified: A B2B analytics assistant for clinic managers.
  legacy: I don't know based on current memory.

## Legacy-only Samples

- ab100-zh-negative-4 [ab-zh-negative] attribution=`unified-failed`
  prompt: 只根据当前记忆，我的生日是哪一天？如果没有这条记忆，就只回答：I don't know based on current memory.
  unified: 1983-02-06
  legacy: I don't know based on current memory.

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
- This suite measures **consumption** on the same prebuilt memory fixture. It does **not** by itself answer how well ordinary conversation writes new durable memory during a live session.
- That complementary question is now covered by [openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md](openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md).
- Read the two reports together:
  - this `100`-case report answers “who consumes the same existing memory better?”
  - the focused `10`-case report answers “who preserves new ordinary-conversation memory better after session transcripts are pruned?”
