const cases = [
  {
    id: "threshold-release-to-travel-without-compact",
    description: "A practical near-compaction proxy: keep one dense release thread growing until it crosses a 16k prompt-token threshold, then switch topics and verify guarded pulls the real prompt back below that threshold without manual compact.",
    compactThresholdTokens: 16000,
    switchTurnIndex: 18,
    rollbackWindow: 4,
    turns: [
      "我们先只聊 release 执行稿。记住首页固定代号是 north-star-lantern，后面如果我回问首页代号，必须直接回答这个值，不要改写。",
      "继续同一话题：这份执行稿不是面向产品和运营，而是面向值班工程师、发布 owner、数据库 owner、网关 owner，所以默认用执行、边界、风险、回滚、证据的写法，不要写成宣讲稿。",
      "还是同一话题：首页摘要必须固定包含 5 行，分别是版本标识、变更范围、风险等级、灰度范围、回滚开关；每一行都要能让值班人 30 秒内做出 go 或 no-go 判断。",
      "继续：版本标识部分要同时记录 tag、commit、构建时间、镜像 digest、制品校验方式、构建机器、发布审批号；如果后面我追问版本块，你默认先给 tag 和 digest，再补别的字段。",
      "继续：变更范围部分要写 API、job、数据库 schema、缓存 key、消息队列 topic、前端静态资源这 6 类，并且每类都要写“是否兼容旧版本”和“是否需要灰度隔离”。",
      "继续：风险等级部分不要只写高中低，还要写触发条件、放大路径、最坏影响面、首个观测信号、第一响应人；如果某一项没有明确 owner，就直接标成 blocker。",
      "继续：灰度范围块要写 staging、pre-prod、production-canary、production-25%、production-full 这 5 个阶段，每个阶段要写进入条件、退出条件、观察时间、回滚边界。",
      "继续：回滚块要同时写功能开关、数据库兼容边界、配置回退顺序、缓存清理顺序、消息队列补偿策略、静态资源回退策略，而且这些顺序都不能互相打架。",
      "继续：观测块要写 dashboard、错误率、延迟、业务告警、关键日志、人工巡检点，并且把 5 分钟、15 分钟、30 分钟的观察动作分开，不要混在一段里。",
      "继续：如果 staging 出现错误率超阈值，处置顺序先停灰度、再核对镜像 digest、再看关键日志、再比对配置差异、最后才决定是否打开回滚开关，这个顺序必须保留。",
      "继续：如果 production-canary 期间出现延迟抖动，但错误率没有超阈值，默认动作不是马上回滚，而是先看网关、缓存命中率、数据库慢查询，再判断是不是噪声，不要跳步骤。",
      "继续：我要求输出风格固定为先结论、再证据、最后待确认项；待确认项里必须区分 blocker 和 follow-up，不要把真正阻塞上线的项和事后可补的项混在一起。",
      "继续：如果我要在 shiproom 上口头讲这件事，你先记住讲述顺序是风险、边界、可回滚性、验证证据、时间窗口、责任人；哪怕后面我改问法，也先沿这个顺序回答。",
      "继续：验证证据部分必须覆盖单元测试、集成测试、回归用例、灰度观察、异常回滚演练，并且每块都要给一句最短结论，像“单测全绿”“回滚演练通过”这种粒度。",
      "继续：时间窗口固定是北京时间周三 21:00 到 23:00，staging 先观察 30 分钟，production 首批只有 5%，三位值班人都要能独立触发回滚，而且必须能在 10 分钟内回到旧版本。",
      "继续：首页还要加一段 operator checklist，按分钟写 0-5、5-15、15-30、30-60 的人工动作，每段都写看什么、谁确认、什么情况下暂停、什么情况下继续。",
      "继续：如果任何一步存在环境前置不满足、审批缺失、镜像不一致、schema 未确认、关键日志缺失中的任意一项，默认输出必须先给 no-go，再列出解除条件，不要先假设可以硬上。",
      "最后再补一层同主题细节：这份稿子默认不追求好看，只追求值班现场拿起来就能执行，所以更看重顺序、边界、风险、回滚、证据；同时别忘了首页固定代号 north-star-lantern。",
      "现在切到完全不同的话题。帮我想一个京都四晚的安静行程，要求第一晚很晚到、整体预算两万元、住处尽量靠地铁、白天不要排太满。",
      "继续旅行话题：如果第一晚住四条乌丸，后面三晚更适合继续住同一区，还是拆到东山和京都站附近？给我一个很短的建议。",
      "还是旅行：刚才这一段里，我更想去的是哪座城市？",
      "先离开旅行，回到最早的 release 执行稿。首页固定代号是什么？"
    ],
    checkpoints: [
      {
        turnIndex: 20,
        label: "travel-city-recall",
        expectedAll: ["京都"],
        forbiddenAny: ["大阪", "东京", "不知道"]
      },
      {
        turnIndex: 21,
        label: "release-codename-return",
        expectedAll: ["north-star-lantern"],
        forbiddenAny: ["不知道"]
      }
    ]
  }
];

export default cases;
export { cases };
