const cases = [
  {
    id: "stress-release-rollback-after-topic-switch",
    description: "A denser single-topic release thread should build a much thicker prompt before a topic switch, then reveal whether guarded OpenClaw causes an obvious host-visible prompt rollback.",
    switchTurnIndex: 11,
    rollbackWindow: 3,
    turns: [
      "我们先只聊 release 方案。记住一个固定事实：这个发布方案首页的固定代号是 north-star-lantern，而且后面我回问时都按这个代号回答。",
      "继续同一个方案：验收一定拆成版本、安装、回滚、观测四块，每块都必须写 owner、风险等级、回滚边界、人工兜底人和预计耗时。",
      "还是同一个方案：版本块要写 tag、commit、构建时间、镜像 digest、制品校验方式；安装块要写目标环境、前置条件、灰度范围、依赖服务和失败时的暂停条件。",
      "继续：回滚块要写开关、数据库兼容边界、配置回退顺序、缓存处理、消息队列处理；观测块要写 dashboard、错误率、延迟、业务告警、关键日志和人工巡检点。",
      "再补一层：这个方案要先跑 staging，再跑 production，staging 通过后要盯 30 分钟错误率，production 首批灰度只放 5%，而且这两段都要写得很明确。",
      "还是 release 方案：如果我要在 shiproom 上讲这件事，你先记住讲述顺序要从风险、边界、可回滚性、验证证据，再到时间窗口，不要改这个顺序。",
      "继续同一个话题：验证证据部分要同时覆盖单元测试、集成测试、回归用例、灰度观察、异常回滚演练，而且每块都要有一句最短结论。",
      "再补充：如果后面我追问这个方案，你默认先给 3 条最高风险，再展开细节；但无论怎么展开，首页代号 north-star-lantern 都不能丢。",
      "继续：这轮上线窗口默认是北京时间周三晚上九点到十一点，值班人包括发布 owner、数据库 owner、网关 owner，而且三个人都要能独立触发回滚。",
      "还是同一个方案：如果 staging 期间错误率超过阈值，先停灰度、看日志关键字、核对镜像 digest、最后才决定要不要拉回滚开关，这个顺序也先记住。",
      "继续：我要的输出风格是先结论、再证据、最后列待确认项；如果有待确认项，必须明确哪些是 blocker，哪些只是建议后补，不要混在一起。",
      "最后再压一层同主题细节：这份方案不是给产品同学看的，而是给值班工程师和发布 owner 的操作稿，所以默认用更偏执行、边界、风险的表达。",
      "现在切到完全不同的话题。帮我想一个京都三晚行程，要求安静、靠地铁、预算两万元，而且第一晚晚到。",
      "继续旅行话题：如果第一晚住四条乌丸，第二晚和第三晚更适合住哪里？一句话。",
      "还是旅行：刚才这段里，我更想住哪座城市？",
      "先离开旅行，回到最早的 release 方案。首页固定代号是什么？"
    ],
    checkpoints: [
      {
        turnIndex: 14,
        label: "travel-city-recall",
        expectedAll: ["京都"],
        forbiddenAny: ["大阪", "不知道"]
      },
      {
        turnIndex: 15,
        label: "release-codename-return",
        expectedAll: ["north-star-lantern"],
        forbiddenAny: ["不知道"]
      }
    ]
  }
];

export default cases;
export { cases };
