# OpenClaw Memory Improvement Summary

- generatedAt: `2026-04-15T05:06:04.108Z`
- comparedCases: `16`
- unifiedPassed: `16`
- legacyPassed: `15`
- bothPass: `15`
- umcOnly: `1`
- legacyOnly: `0`
- bothFail: `0`

## Language Split

### English

- comparedCases: `8`
- bothPass: `8`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `0`

### Chinese

- comparedCases: `8`
- bothPass: `7`
- umcOnly: `1`
- legacyOnly: `0`
- bothFail: `0`

## Attribution Summary

- shared-capability: `13`
- shared-baseline-retrieval: `2`
- unified-retrieval-gain: `1`

## Significant Takeaways

- Shared baseline memory capability: `15` / `16` real cases passed in both systems.
- Memory Core-only gains: `1` / `16` real cases passed only with `unified-memory-core`.
- Chinese Memory Core-only gains: `1` / `8`.
- English Memory Core-only gains: `0` / `8`.

## UMC-only Samples

- agent-zh-natural-project-1 [agent-zh-natural] (zh) attribution=`unified-retrieval-gain`
  prompt: 只根据当前记忆，Project Lantern 到底是在做什么？如果没有这条记忆，就只回答：I don't know based on current memory.
  unified: - Project Lantern 是一个面向诊所管理者的 **B2B analytics assistant**。 - 当前记忆里就是这么定义的。 Source: notes/project-lantern.md#L1-L15
  legacy: 面向诊所管理者的 B2B 分析助手。

## Shared-baseline Samples

- agent-name-1 [agent-profile] (en) attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Maya Chen
  legacy: Maya Chen
- agent-timezone-1 [agent-profile] (en) attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's timezone? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Asia/Shanghai
  legacy: Asia/Shanghai
- agent-project-1 [agent-project] (en) attribution=`shared-baseline-retrieval`
  prompt: Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Project Lantern is a B2B analytics assistant for clinic managers. Source: notes/project-lantern.md#L1-L15
  legacy: A B2B analytics assistant for clinic managers.
- agent-current-editor-1 [agent-temporal] (en) attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's current main editor now? If memory is missing, reply exactly: I don't know based on current memory.
  unified: Zed
  legacy: Zed

## Notes

- This summary counts only cases that were actually run against both Unified Memory Core and the legacy builtin context engine.
- `umcOnly` means Unified Memory Core passed while legacy failed.
- `bothPass` means the builtin baseline was already sufficient for that case.
