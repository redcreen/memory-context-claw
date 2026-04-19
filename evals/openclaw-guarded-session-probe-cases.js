const cases = [
  {
    id: "probe-release-then-travel-switch",
    description: "A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.",
    switchTurnIndex: 7,
    rollbackWindow: 3,
    turns: [
      "我们先聊 release 方案。记住一个固定事实：这个发布方案第一页的项目代号固定写 north-star-lantern。",
      "继续同一个 release 话题：把验收拆成版本、安装、回滚、观测四块，而且每块都要写 owner、风险和 rollback boundary。",
      "再补充同一个方案：版本块要写 tag、commit、构建时间、镜像 digest；安装块要写目标环境、前置条件和灰度范围。",
      "继续 release：回滚块要写开关、数据库兼容边界、失败后的人工兜底；观测块要写 dashboard、告警和日志关键字。",
      "还是同一个发布方案：如果这轮只保留 5 条关键检查项，你先别展开内容，只确认你记住的是同一个方案。",
      "继续：以后我问这个发布方案时，默认先给结论，再补细节，而且回答里保留 north-star-lantern 这个代号。",
      "再补一层：这个方案要先跑 staging，再进 production，而且 staging 通过后 30 分钟内要盯错误率和回滚开关。",
      "现在换个完全不同的话题。帮我想一个京都三晚行程，偏安静、靠地铁、预算两万元。",
      "继续旅行话题：如果第一晚住四条乌丸，后两晚更适合住哪里？一句话。",
      "还是旅行：刚才这段里，我更想住哪座城市？",
      "先离开旅行，回到最早那个发布方案。第一页固定代号是什么？"
    ],
    checkpoints: [
      {
        turnIndex: 9,
        label: "travel-city-recall",
        expectedAll: ["京都"],
        forbiddenAny: ["大阪", "不知道"]
      },
      {
        turnIndex: 10,
        label: "release-codename-return",
        expectedAll: ["north-star-lantern"],
        forbiddenAny: ["不知道"]
      }
    ]
  },
  {
    id: "probe-editor-then-cooking-switch",
    description: "A long editor/workflow thread should shrink after switching to cooking while preserving the newer current editor fact.",
    switchTurnIndex: 7,
    rollbackWindow: 3,
    turns: [
      "记一下：我以前默认编辑器是 Vim。",
      "更新一下：我现在默认编辑器是 Zed，而且后面都按这个新值算。",
      "继续同一个编辑器话题：我把日常工作拆成代码导航、批量替换、Git 操作、预览四块，你先记住这是同一个 workflow。",
      "再补充：代码导航要快，批量替换要可回滚，Git 操作要偏命令行，预览要尽量轻量。",
      "还是同一个 workflow：如果以后我问编辑器选择，默认先给结论，再说明原因，不要把旧值 Vim 当成当前值。",
      "继续：这个 workflow 主要服务于 Node.js 和文档维护，不是为了写长篇文章。",
      "再补一条：我切题之后再回来问当前编辑器，你也应该优先回答现在这个新值。",
      "现在换个完全不同的话题。给我一个适合工作日晚饭的番茄牛肉炖菜思路，要求一锅做完。",
      "继续做饭话题：如果我只有番茄、牛腩、洋葱和土豆，最应该先处理哪一步？一句话。",
      "还是做饭：刚才这道菜里，主要肉类是什么？",
      "现在回到编辑器问题。我现在默认编辑器是什么？"
    ],
    checkpoints: [
      {
        turnIndex: 9,
        label: "cooking-main-protein",
        expectedAll: ["牛"],
        forbiddenAny: ["鸡", "不知道"]
      },
      {
        turnIndex: 10,
        label: "editor-current-value-return",
        expectedAll: ["Zed"],
        forbiddenAny: ["Vim", "不知道"]
      }
    ]
  }
];

export default cases;
export { cases };
