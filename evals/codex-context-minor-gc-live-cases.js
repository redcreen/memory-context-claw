const cases = [
  {
    id: "codex-minor-gc-seat-preference",
    description: "A durable travel preference should survive a code detour after guarded pruning.",
    transcript: [
      { id: "t1", role: "user", content: "以后默认给我中文，结论优先。" },
      { id: "t2", role: "assistant", content: "记住了。" },
      { id: "t3", role: "user", content: "再记一下：我坐飞机喜欢靠过道。" },
      { id: "t4", role: "assistant", content: "记住了，你坐飞机偏好靠过道。" },
      { id: "t5", role: "user", content: "插一句代码：这轮先只做 shadow，不接管主路径。" },
      { id: "t6", role: "assistant", content: "收到，这轮代码 detour 先只做 shadow。" },
      { id: "t7", role: "user", content: "代码 detour 已经结束。回到偏好：我坐飞机喜欢什么位置？" }
    ],
    taskPrompt: "我坐飞机喜欢什么位置？",
    expectedAll: ["靠过道"],
    forbiddenAny: ["不知道"],
    expectedGuardedApplied: true
  },
  {
    id: "codex-minor-gc-style-pin-survives-detour",
    description: "A style preference should survive a short code detour after that detour is explicitly closed.",
    transcript: [
      { id: "t1", role: "user", content: "以后默认先给我结论，再展开细节。" },
      { id: "t2", role: "assistant", content: "记住了，以后默认先给结论。" },
      { id: "t3", role: "user", content: "现在切到代码：这轮先只做 shadow，不接管主路径。" },
      { id: "t4", role: "assistant", content: "收到，这轮先只做 shadow。" },
      { id: "t5", role: "user", content: "代码先到这。刚才我要求你默认怎么组织回复？" }
    ],
    taskPrompt: "刚才我要求你默认怎么组织回复？",
    expectedAll: ["先给", "再展开"],
    forbiddenAny: ["不知道"],
    expectedGuardedApplied: true
  },
  {
    id: "codex-minor-gc-branch-negative",
    description: "A branch return should stay answer-correct without activating the guarded path.",
    transcript: [
      { id: "t1", role: "user", content: "把发布验收拆成版本、安装、回滚三部分。" },
      { id: "t2", role: "user", content: "插一句，我的时区是 Asia/Shanghai，记住。" },
      { id: "t3", role: "user", content: "先回到刚才的发布验收，那三部分是什么？" }
    ],
    taskPrompt: "先回到刚才的发布验收，那三部分是什么？",
    expectedAll: ["版本", "安装", "回滚"],
    forbiddenAny: ["不知道"],
    expectedGuardedApplied: false
  },
  {
    id: "codex-minor-gc-continue-negative",
    description: "A same-topic continue turn should not activate guarded pruning.",
    transcript: [
      { id: "t1", role: "user", content: "当前新任务是写 shadow mode 报告。" },
      { id: "t2", role: "user", content: "报告里还要明确 rollback boundary。" },
      { id: "t3", role: "user", content: "我们当前新任务是什么？" }
    ],
    taskPrompt: "我们当前新任务是什么？",
    expectedAll: ["shadow", "报告"],
    forbiddenAny: ["不知道"],
    expectedGuardedApplied: false
  }
];

export default cases;
export { cases };
