# OpenClaw Memory Improvement Summary

- generatedAt: `2026-04-16T10:53:01.338Z`
- comparedCases: `100`
- unifiedPassed: `98`
- legacyPassed: `97`
- bothPass: `97`
- umcOnly: `1`
- legacyOnly: `0`
- bothFail: `2`

## Language Split

### English

- comparedCases: `50`
- unifiedPassed: `50`
- legacyPassed: `49`
- bothPass: `49`
- umcOnly: `1`
- legacyOnly: `0`
- bothFail: `0`

### Chinese

- comparedCases: `50`
- unifiedPassed: `48`
- legacyPassed: `48`
- bothPass: `48`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `2`

## Attribution Summary

- shared-capability: `58`
- shared-baseline-retrieval: `39`
- unified-retrieval-gain: `1`
- unified-failed: `2`

## Significant Takeaways

- Shared baseline memory capability: `97` / `100` real cases passed in both systems.
- Memory Core-only gains: `1` / `100` real cases passed only with `unified-memory-core`.
- Chinese Memory Core-only gains: `0` / `50`.
- English Memory Core-only gains: `1` / `50`.

## UMC-only Samples

- ab100-en-project-purpose-5 [ab-en-retrieval] (en) attribution=`unified-retrieval-gain`
  prompt: Based only on your memory for this agent, if someone asks what Lantern does, how should you describe it? If memory is missing, reply exactly: I don't know based on current memory.
  unified: A B2B analytics assistant for clinic managers.
  legacy: I don't know based on current memory.

## Legacy-only Samples

- none

## Both-fail Samples

- ab100-zh-history-editor-2 [ab-zh-history] (zh) attribution=`unified-failed`
  prompt: 只根据当前记忆，切到现在这个编辑器之前，我原来主力是哪个编辑器？如果没有这条记忆，就只回答：I don't know based on current memory.
  unified: I don't know based on current memory.
  legacy: I don't know based on current memory.
- ab100-zh-history-editor-4 [ab-zh-history] (zh) attribution=`unified-failed`
  prompt: 只根据当前记忆，现在虽然已经换了编辑器，但之前那段时间主力到底是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
  unified: I don't know based on current memory.
  legacy: I don't know based on current memory.

## Shared-baseline Samples

- ab100-en-name-1 [ab-en-bootstrap] (en) attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen.
- ab100-en-name-2 [ab-en-bootstrap] (en) attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what name should you use when addressing the user? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen
- ab100-en-name-3 [ab-en-bootstrap] (en) attribution=`shared-capability`
  prompt: Based only on your memory for this agent, how should this agent address the user by name? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen.
- ab100-en-name-4 [ab-en-bootstrap] (en) attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the name you should call the user? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen

## Notes

- This summary counts only cases that were actually run against both Unified Memory Core and the legacy builtin context engine.
- `umcOnly` means Unified Memory Core passed while legacy failed.
- `bothPass` means the builtin baseline was already sufficient for that case.
