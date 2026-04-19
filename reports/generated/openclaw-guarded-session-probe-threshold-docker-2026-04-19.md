# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T06:41:40.640Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `18285`
- averageGuardedPeakPromptTokens: `17844`
- averageBaselinePostSwitchPromptTokens: `18039`
- averageGuardedPostSwitchPromptTokens: `13186`
- averageBaselineRollbackRatio: `0.0135`
- averageGuardedRollbackRatio: `0.261`
- averageBaselineThresholdCrossTurn: `2`
- averageGuardedThresholdCrossTurn: `14`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.269`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## threshold-release-to-travel-without-compact
- description: A practical near-compaction proxy: keep one dense release thread growing until it crosses a 16k prompt-token threshold, then switch topics and verify guarded pulls the real prompt back below that threshold without manual compact.
- baseline peakBeforeSwitch: `18285`
- guarded peakBeforeSwitch: `17844`
- baseline postSwitchMin: `18039`
- guarded postSwitchMin: `13186`
- baseline rollbackRatio: `0.0135`
- guarded rollbackRatio: `0.261`
- guarded postSwitch savings vs baseline: `0.269`
- compactAvoidedByGuarded: `true`
- guarded applied turns in switch window: `2`
- compact proxy threshold: `16000`
- baseline firstThresholdCrossTurn: `3`
- guarded firstThresholdCrossTurn: `15`
- baseline postSwitchBelowThresholdTurns: `0/4`
- guarded postSwitchBelowThresholdTurns: `2/4`
- baseline turnsAtOrAboveThreshold: `20`
- guarded turnsAtOrAboveThreshold: `6`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`15130` durationMs=`18521`
- t2: promptTokens=`15312` durationMs=`5378`
- t3: promptTokens=`16620` durationMs=`5976`
- t4: promptTokens=`16473` durationMs=`9363`
- t5: promptTokens=`16615` durationMs=`6941`
- t6: promptTokens=`16022` durationMs=`6769`
- t7: promptTokens=`16195` durationMs=`11639`
- t8: promptTokens=`16420` durationMs=`6903`
- t9: promptTokens=`16482` durationMs=`9336`
- t10: promptTokens=`16780` durationMs=`5548`
- t11: promptTokens=`16806` durationMs=`5282`
- t12: promptTokens=`17011` durationMs=`6003`
- t13: promptTokens=`17207` durationMs=`5650`
- t14: promptTokens=`17240` durationMs=`5991`
- t15: promptTokens=`18285` durationMs=`5562`
- t16: promptTokens=`18009` durationMs=`10576`
- t17: promptTokens=`17758` durationMs=`10741`
- t18: promptTokens=`17902` durationMs=`6011`
- t19: promptTokens=`18039` durationMs=`11782`
- t20: promptTokens=`19126` durationMs=`5191`
- t21: promptTokens=`19259` durationMs=`4869`
- t22: promptTokens=`19494` durationMs=`6916`

### Guarded Turns
- t1: promptTokens=`12767` durationMs=`23301` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`12949` durationMs=`7570` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`0` durationMs=`27282` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.5487`
- t4: promptTokens=`13558` durationMs=`5863` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t5: promptTokens=`13494` durationMs=`6559` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t6: promptTokens=`13502` durationMs=`6106` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t7: promptTokens=`13657` durationMs=`9100` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t8: promptTokens=`13889` durationMs=`5591` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t9: promptTokens=`13942` durationMs=`5225` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t10: promptTokens=`14257` durationMs=`5995` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t11: promptTokens=`14274` durationMs=`7512` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t12: promptTokens=`14518` durationMs=`8819` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t13: promptTokens=`14708` durationMs=`7073` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t14: promptTokens=`14755` durationMs=`6900` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t15: promptTokens=`16039` durationMs=`30698` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.8869`
- t16: promptTokens=`17566` durationMs=`6142` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t17: promptTokens=`17699` durationMs=`6285` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t18: promptTokens=`17844` durationMs=`20963` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.9143`
- t19: promptTokens=`13199` durationMs=`11610` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9571`
- t20: promptTokens=`19050` durationMs=`4575` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t21: promptTokens=`19180` durationMs=`4684` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8456`
- t22: promptTokens=`13186` durationMs=`4142` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9825`

### Guarded Checkpoints
- travel-city-recall: turn=`21` passed=`true` answer=京都。
- release-codename-return: turn=`22` passed=`true` answer=north-star-lantern
north-star-lantern

