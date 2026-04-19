# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T03:04:05.487Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `1/2`
- averageBaselinePeakPromptTokens: `19879`
- averageGuardedPeakPromptTokens: `18169`
- averageBaselinePostSwitchPromptTokens: `19998`
- averageGuardedPostSwitchPromptTokens: `13512`
- averageBaselineRollbackRatio: `-0.006`
- averageGuardedRollbackRatio: `0.2563`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.3243`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## stress-release-rollback-after-topic-switch
- description: A denser single-topic release thread should build a much thicker prompt before a topic switch, then reveal whether guarded OpenClaw causes an obvious host-visible prompt rollback.
- baseline peakBeforeSwitch: `19879`
- guarded peakBeforeSwitch: `18169`
- baseline postSwitchMin: `19998`
- guarded postSwitchMin: `13512`
- baseline rollbackRatio: `-0.006`
- guarded rollbackRatio: `0.2563`
- guarded postSwitch savings vs baseline: `0.3243`
- guarded applied turns in switch window: `3`
- guarded checkpoints: `1/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`15217` durationMs=`17998`
- t2: promptTokens=`15292` durationMs=`9098`
- t3: promptTokens=`15498` durationMs=`8748`
- t4: promptTokens=`15920` durationMs=`15655`
- t5: promptTokens=`16401` durationMs=`9982`
- t6: promptTokens=`16991` durationMs=`9117`
- t7: promptTokens=`17359` durationMs=`10515`
- t8: promptTokens=`17944` durationMs=`13060`
- t9: promptTokens=`18503` durationMs=`9499`
- t10: promptTokens=`19118` durationMs=`13736`
- t11: promptTokens=`19879` durationMs=`9915`
- t12: promptTokens=`19998` durationMs=`4780`
- t13: promptTokens=`20648` durationMs=`14921`
- t14: promptTokens=`21612` durationMs=`4952`
- t15: promptTokens=`21629` durationMs=`6475`
- t16: promptTokens=`21877` durationMs=`3740`

### Guarded Turns
- t1: promptTokens=`13786` durationMs=`9080` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13864` durationMs=`13219` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`14018` durationMs=`18144` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.4023`
- t4: promptTokens=`14481` durationMs=`18129` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.6928`
- t5: promptTokens=`14963` durationMs=`29847` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.5991`
- t6: promptTokens=`15573` durationMs=`19187` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.6777`
- t7: promptTokens=`15972` durationMs=`19068` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.7806`
- t8: promptTokens=`16594` durationMs=`23332` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.7944`
- t9: promptTokens=`16178` durationMs=`19938` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.7415`
- t10: promptTokens=`17368` durationMs=`24061` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.7358`
- t11: promptTokens=`18169` durationMs=`26126` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.7273`
- t12: promptTokens=`17808` durationMs=`18920` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.7230`
- t13: promptTokens=`13512` durationMs=`24652` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9169`
- t14: promptTokens=`15303` durationMs=`17102` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.6360`
- t15: promptTokens=`19447` durationMs=`22009` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.8465`
- t16: promptTokens=`13836` durationMs=`32232` guardedApplied=`true` relation=`resolve` packageReductionRatio=`0.9543`

### Guarded Checkpoints
- travel-city-recall: turn=`15` passed=`true` answer=你更想住的是 **京都**。
- release-codename-return: turn=`16` passed=`false` answer=首页固定代号是 **`vX.Y.Z`**。

