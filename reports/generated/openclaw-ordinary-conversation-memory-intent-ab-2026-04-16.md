# OpenClaw Ordinary-Conversation Memory-Intent A/B

- generatedAt: `2026-04-16T10:48:22.473Z`
- comparedCases: `10`
- currentPassed: `10`
- legacyPassed: `5`
- bothPass: `5`
- umcOnly: `5`
- legacyOnly: `0`
- bothFail: `0`
- currentCaptureObserved: `9`

## Method

- Each case runs a real `openclaw agent --local` capture turn, then prunes session transcripts before the recall turn.
- This isolates explicit long-memory behavior from short-lived session/bootstrap carry-over.
- `current` means the repo checkout loaded as the OpenClaw `unified-memory-core` context engine, with ordinary-conversation governed `memory_intent` enabled.
- `legacy` means the default `legacy` context engine with no `unified-memory-core` plugin loaded.
- OpenClaw ships a separate `memory-lancedb` plugin, but it is not active in the current host default config, so this focused A/B measures the actual current default host path rather than a hypothetical enabled-autoCapture setup.

## Language Split

### English

- total: `5`
- currentPassed: `5`
- legacyPassed: `3`
- bothPass: `3`
- umcOnly: `2`
- legacyOnly: `0`
- bothFail: `0`

### Chinese

- total: `5`
- currentPassed: `5`
- legacyPassed: `2`
- bothPass: `2`
- umcOnly: `3`
- legacyOnly: `0`
- bothFail: `0`

## Per-Case Results

### ordinary-ab-en-rule-releases-1

- language: `en`
- category: `durable_rule`
- outcome: `both_pass`
- captureObserved: `true`
- captureMessage: From now on, whenever I send a GitHub repository link, use the keyword saffron-releases to remind yourself to check the Releases tab first. Remember this as my default workflow.
- recallMessage: Based only on your memory for this agent, what keyword should you use when I send a GitHub repository link? If memory is missing, reply exactly: I don't know based on current memory.
- current: saffron-releases
- legacy: saffron-releases

### ordinary-ab-en-tool-tag-1

- language: `en`
- category: `tool_routing_preference`
- outcome: `umc_only`
- captureObserved: `true`
- captureMessage: From now on, whenever I send a Xiaohongshu link, use capture_xiaohongshu_note first and tag the result with amber-card. Remember this.
- recallMessage: Based only on your memory for this agent, what tag should you use after handling one of my Xiaohongshu links? If memory is missing, reply exactly: I don't know based on current memory.
- current: amber-card
- legacy: I don't know based on current memory.

### ordinary-ab-en-timezone-1

- language: `en`
- category: `user_profile_fact`
- outcome: `umc_only`
- captureObserved: `true`
- captureMessage: My timezone is Asia/Shanghai. Remember this for future scheduling.
- recallMessage: Based only on your memory for this agent, what is the user's timezone? If memory is missing, reply exactly: I don't know based on current memory.
- current: Asia/Shanghai (GMT+8)
- legacy: I don't know based on current memory.

### ordinary-ab-en-coffee-1

- language: `en`
- category: `user_profile_fact`
- outcome: `both_pass`
- captureObserved: `true`
- captureMessage: I usually order an oat-milk flat white with no sugar. Remember this.
- recallMessage: Based only on your memory for this agent, what coffee order should you assume for the user? If memory is missing, reply exactly: I don't know based on current memory.
- current: Oat-milk flat white, no sugar.
- legacy: Oat-milk flat white with no sugar.

### ordinary-ab-en-session-negative-1

- language: `en`
- category: `session_constraint`
- outcome: `both_pass`
- captureObserved: `true`
- captureMessage: For this session only, call the current plan cobalt-ladder and keep replies short.
- recallMessage: Based only on your memory for this agent, what codename should you permanently use for my current plan? If memory is missing, reply exactly: I don't know based on current memory.
- current: I don't know based on current memory.
- legacy: I don't know based on current memory.

### ordinary-ab-zh-rule-releases-1

- language: `zh`
- category: `durable_rule`
- outcome: `umc_only`
- captureObserved: `true`
- captureMessage: 以后只要我发 GitHub 仓库链接，你先看 Releases 页面；我把这个默认规则的代号叫做琥珀Releases。记住这个默认规则。
- recallMessage: 只根据当前记忆，只要我发 GitHub 仓库链接，这个默认规则的代号是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
- current: 琥珀Releases
- legacy: I don't know based on current memory.

### ordinary-ab-zh-tool-tag-1

- language: `zh`
- category: `tool_routing_preference`
- outcome: `both_pass`
- captureObserved: `true`
- captureMessage: 以后只要我发小红书链接，你都先用 capture_xiaohongshu_note，并且在结果里打 amber-card 标签。记住这个。
- recallMessage: 只根据当前记忆，处理我的小红书链接后，你应该打什么标签？如果没有这条记忆，就只回答：I don't know based on current memory.
- current: amber-card
- legacy: amber-card

### ordinary-ab-zh-updates-1

- language: `zh`
- category: `user_profile_fact`
- outcome: `umc_only`
- captureObserved: `true`
- captureMessage: 我平时更喜欢异步文字更新，不喜欢临时语音电话。记住这个偏好。
- recallMessage: 只根据当前记忆，我更喜欢什么更新方式？如果没有这条记忆，就只回答：I don't know based on current memory.
- current: 你更喜欢异步文字更新，不喜欢临时语音电话。
- legacy: I don't know based on current memory.

### ordinary-ab-zh-notebook-1

- language: `zh`
- category: `user_profile_fact`
- outcome: `umc_only`
- captureObserved: `true`
- captureMessage: 我平时开会都记在炭灰色 A5 笔记本里。记住这个。
- recallMessage: 只根据当前记忆，我平时开会用什么笔记本？如果没有这条记忆，就只回答：I don't know based on current memory.
- current: 炭灰色 A5 笔记本。
- legacy: I don't know based on current memory.

### ordinary-ab-zh-oneoff-negative-1

- language: `zh`
- category: `one_off_instruction`
- outcome: `both_pass`
- captureObserved: `false`
- captureMessage: 只这一次把这轮方案叫做琥珀梯，不用记住，也别默认以后都这么叫。
- recallMessage: 只根据当前记忆，以后默认应该怎么称呼这轮方案？如果没有这条记忆，就只回答：I don't know based on current memory.
- current: I don't know based on current memory.
- legacy: I don't know based on current memory.

## Focused Conclusion

- On this focused realtime-write surface, Unified Memory Core wins more cases than the legacy default path: `5` UMC-only vs `0` legacy-only.
- This suite is intentionally different from the earlier 100-case A/B: it tests live ordinary-conversation writing and then removes session transcripts before recall.
- That makes it the first direct probe of whether ordinary conversation itself can create durable recallable memory rather than merely improving consumption of an existing fixture.
