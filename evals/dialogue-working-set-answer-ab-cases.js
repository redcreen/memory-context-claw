const cases = [
  {
    id: "answer-ab-return-family-seat",
    description: "A durable seat preference should still answer correctly after a code detour.",
    transcript: [
      { id: "t1", role: "user", content: "以后默认给我中文，结论优先。" },
      { id: "t2", role: "assistant", content: "记住了。" },
      { id: "t3", role: "user", content: "再记一下：我坐飞机喜欢靠过道。" },
      { id: "t4", role: "assistant", content: "记住了，你坐飞机偏好靠过道。" },
      { id: "t5", role: "user", content: "家庭偏好先到这。现在说代码：我们这轮先不改现有记忆系统。" },
      { id: "t6", role: "assistant", content: "好，先 shadow，再决定是否接管主路径。" },
      { id: "t7", role: "user", content: "代码先放一边。刚才说过，我坐飞机喜欢什么位置？" }
    ],
    expectedAll: ["靠过道"],
    forbiddenAny: ["不知道"]
  },
  {
    id: "answer-ab-branch-return-stage6",
    description: "A side fact should not break recall of an unfinished three-part rollout split.",
    transcript: [
      { id: "t1", role: "user", content: "把发布验收拆成版本、安装、回滚三部分。" },
      { id: "t2", role: "assistant", content: "可以，先拆成版本正确性、安装验证、回滚安全。" },
      { id: "t3", role: "user", content: "插一句，我的时区是 Asia/Shanghai，记住。" },
      { id: "t4", role: "assistant", content: "记住了，你的时区是 Asia/Shanghai。" },
      { id: "t5", role: "user", content: "先回到刚才的发布验收，那三部分是什么？" }
    ],
    expectedAll: ["版本", "安装", "回滚"],
    forbiddenAny: ["不知道"]
  },
  {
    id: "answer-ab-session-negative",
    description: "A one-off codename must not become a permanent default after the topic switches.",
    transcript: [
      { id: "t1", role: "user", content: "只这一次把这轮方案叫琥珀梯，不用长期记。" },
      { id: "t2", role: "assistant", content: "明白，这次临时叫琥珀梯。" },
      { id: "t3", role: "user", content: "现在切到文档。以后默认这个方案应该怎么称呼？如果没有长期默认，就直说没有。" }
    ],
    expectedAny: ["没有长期默认", "没有默认称呼", "当前没有默认称呼", "I don't know based on current context"],
    forbiddenAny: []
  },
  {
    id: "answer-ab-current-task-after-switch",
    description: "After an older topic is closed, the current task should still answer correctly from the pruned working set.",
    transcript: [
      { id: "t1", role: "user", content: "默认中文。" },
      { id: "t2", role: "assistant", content: "记住了。" },
      { id: "t3", role: "user", content: "Project Lantern 是做真实场景 AI 记忆治理的。" },
      { id: "t4", role: "assistant", content: "明白了。" },
      { id: "t5", role: "user", content: "这块先到这。当前新任务是写 shadow mode 报告。" },
      { id: "t6", role: "assistant", content: "收到，当前新任务是写 shadow mode 报告。" },
      { id: "t7", role: "user", content: "我们当前新任务是什么？" }
    ],
    expectedAll: ["shadow", "报告"],
    forbiddenAny: ["不知道"]
  },
  {
    id: "answer-ab-style-pin-survives",
    description: "A style preference should still answer correctly after an unrelated retrieval-policy detour.",
    transcript: [
      { id: "t1", role: "assistant", content: "当前状态：OpenClaw 版本 2026.3.31，当前模型 openai-codex/gpt-5.4，上下文占用 158k / 272k，缓存命中率 99%。" },
      { id: "t2", role: "user", content: "以后默认先给我结论，再展开细节。" },
      { id: "t3", role: "assistant", content: "记住了，以后默认先给结论。" },
      { id: "t4", role: "user", content: "先说检索策略，当前默认先走 fast path。" },
      { id: "t5", role: "assistant", content: "好，当前默认先走 fast path。" },
      { id: "t6", role: "user", content: "我刚才要求你回复时默认怎么组织结构？" }
    ],
    expectedAll: ["先给", "再展开"],
    forbiddenAny: ["不知道"]
  }
];

export default cases;
export { cases };
