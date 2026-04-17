# OpenClaw Memory Improvement A/B

- generatedAt: `2026-04-17T05:26:55.001Z`
- agent: `umceval65`
- shardCount: `1`
- hermeticState: `true`
- totalCases: `2`
- unifiedPassed: `2`
- legacyPassed: `1`
- bothPass: `1`
- umcOnly: `1`
- legacyOnly: `0`
- bothFail: `0`

## Language Split

### English

- total: `0`
- unifiedPassed: `0`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `0`

### Chinese

- total: `2`
- unifiedPassed: `2`
- legacyPassed: `1`
- bothPass: `1`
- umcOnly: `1`
- legacyOnly: `0`
- bothFail: `0`

## Category Summary

- ab-zh-history: unified=`2/2` legacy=`1/2` umcOnly=`1`

## Attribution Summary

- unified-gain: `1`
- shared-capability: `1`

## UMC-only Samples

- ab100-zh-history-editor-2 [ab-zh-history] attribution=`unified-gain`
  prompt: 只根据当前记忆，切到现在这个编辑器之前，我原来主力是哪个编辑器？如果没有这条记忆，就只回答：I don't know based on current memory.
  unified: Vim
  legacy: Zed

## Legacy-only Samples

- none

## Both-fail Samples

- none

## Shared-baseline Samples

- ab100-zh-history-editor-4 [ab-zh-history] attribution=`shared-capability`
  prompt: 只根据当前记忆，现在虽然已经换了编辑器，但之前那段时间主力到底是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
  unified: Vim。
  legacy: Vim。

## Notes

- This suite runs `2` live answer-level questions as real single-question `openclaw agent --local` calls.
- Each shard delegates to the hermetic benchmark runner, which rebuilds current and legacy base states from the repo fixture and clones a fresh state for every case.
- Fixture root: `/workspace/evals/openclaw-cli-memory-fixture`; plugin path: `/workspace`.
- Auth profiles: `/opt/openclaw/auth/auth-profiles.json`.
- Embedding model: `/opt/openclaw/models/embedding.gguf`; preset: `safe-local`; agent model: `openai-codex/gpt-5.4-mini`.
- Both Unified Memory Core and the legacy builtin baseline are evaluated against the same question set and the same hermetic fixture, without seeding from `~/.openclaw`.
