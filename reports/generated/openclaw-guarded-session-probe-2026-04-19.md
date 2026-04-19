# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T02:32:06.882Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `19584`
- averageGuardedPeakPromptTokens: `15696`
- averageBaselinePostSwitchPromptTokens: `20272`
- averageGuardedPostSwitchPromptTokens: `15693`
- averageBaselineRollbackRatio: `-0.0351`
- averageGuardedRollbackRatio: `0.0002`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.2259`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## stress-release-rollback-after-topic-switch
- description: A denser single-topic release thread should build a much thicker prompt before a topic switch, then reveal whether guarded OpenClaw causes an obvious host-visible prompt rollback.
- baseline peakBeforeSwitch: `19584`
- guarded peakBeforeSwitch: `15696`
- baseline postSwitchMin: `20272`
- guarded postSwitchMin: `15693`
- baseline rollbackRatio: `-0.0351`
- guarded rollbackRatio: `0.0002`
- guarded postSwitch savings vs baseline: `0.2259`
- guarded applied turns in switch window: `1`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`14940` durationMs=`6768`
- t2: promptTokens=`15013` durationMs=`9337`
- t3: promptTokens=`15224` durationMs=`8458`
- t4: promptTokens=`15634` durationMs=`7755`
- t5: promptTokens=`16109` durationMs=`10709`
- t6: promptTokens=`16685` durationMs=`9785`
- t7: promptTokens=`17059` durationMs=`7683`
- t8: promptTokens=`17722` durationMs=`11963`
- t9: promptTokens=`18200` durationMs=`9111`
- t10: promptTokens=`18818` durationMs=`9649`
- t11: promptTokens=`19584` durationMs=`10919`
- t12: promptTokens=`20272` durationMs=`11293`
- t13: promptTokens=`20359` durationMs=`9318`
- t14: promptTokens=`21255` durationMs=`4393`
- t15: promptTokens=`21284` durationMs=`6398`
- t16: promptTokens=`21562` durationMs=`8286`

### Guarded Turns
- t1: promptTokens=`13694` durationMs=`6772` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13701` durationMs=`4199` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`13721` durationMs=`12550` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.6142`
- t4: promptTokens=`13881` durationMs=`14834` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.7150`
- t5: promptTokens=`13602` durationMs=`14374` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.6691`
- t6: promptTokens=`14637` durationMs=`12766` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8426`
- t7: promptTokens=`13712` durationMs=`16994` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.8254`
- t8: promptTokens=`15475` durationMs=`18303` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8582`
- t9: promptTokens=`14759` durationMs=`14481` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.8489`
- t10: promptTokens=`15696` durationMs=`16925` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8864`
- t11: promptTokens=`15374` durationMs=`19250` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.8400`
- t12: promptTokens=`16622` durationMs=`15712` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8157`
- t13: promptTokens=`15693` durationMs=`31042` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9454`
- t14: promptTokens=`18007` durationMs=`16600` guardedApplied=`false` relation=`switch` packageReductionRatio=`0.5507`
- t15: promptTokens=`17612` durationMs=`13670` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.6983`
- t16: promptTokens=`16938` durationMs=`14806` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.8675`

### Guarded Checkpoints
- travel-city-recall: turn=`15` passed=`true` answer=京都。
- release-codename-return: turn=`16` passed=`true` answer=**north-star-lantern**

