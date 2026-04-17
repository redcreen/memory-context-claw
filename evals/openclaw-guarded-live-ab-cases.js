const cases = [
  {
    id: "guarded-live-language-after-code-detour",
    description: "A language preference should survive a short code detour and still answer correctly.",
    turns: [
      "以后默认给我中文回复。",
      "先切到代码：这轮先不改原有记忆系统，只做 shadow。",
      "再补一条：切回 builtin 也不能丢记忆。",
      "先不说代码了。我刚才要求你默认用什么语言回复？"
    ],
    expectedAll: ["中文"],
    forbiddenAny: ["英文", "不知道"],
    expectGuardedApplied: true
  },
  {
    id: "guarded-live-style-pin-survives-detour",
    description: "A style preference should survive an unrelated retrieval-policy detour.",
    turns: [
      "以后默认先给我结论，再展开细节。",
      "检索策略先走 fast path。",
      "先别开 rerank，这轮只做 shadow 数据。",
      "先不聊检索了。我刚才要求你默认怎么组织回复？"
    ],
    expectedAll: ["先给", "再展开"],
    forbiddenAny: ["不知道"],
    expectGuardedApplied: true
  },
  {
    id: "guarded-live-branch-negative",
    description: "A branch return should stay answer-correct without activating the guarded path.",
    turns: [
      "把发布验收拆成版本、安装、回滚三部分。",
      "插一句，我的时区是 Asia/Shanghai，记住。",
      "先回到刚才的发布验收，那三部分是什么？"
    ],
    expectedAll: ["版本", "安装", "回滚"],
    forbiddenAny: ["不知道"],
    expectGuardedApplied: false
  },
  {
    id: "guarded-live-continue-negative",
    description: "A same-topic continue turn should not activate guarded pruning.",
    turns: [
      "当前新任务是写 shadow mode 报告。",
      "报告里还要明确 rollback boundary。",
      "我们当前新任务是什么？"
    ],
    expectedAll: ["shadow", "报告"],
    forbiddenAny: ["不知道"],
    expectGuardedApplied: false
  }
];

export default cases;
export { cases };
