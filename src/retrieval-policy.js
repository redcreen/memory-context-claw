const PATTERNS = {
  config: /配置|config|安装|install|启用|enable/i,
  releaseInstall: /稳定版|发布版|release tag|tag 安装|main 分支|当前 main|开发版安装|安装稳定版|安装.*main/i,
  installVerify: /验证|verify|已加载|生效了|怎么确认|确认.*插件|plugins list|memory status|安装后.*检查/i,
  projectNavigation: /路线图|roadmap|架构文档|architecture doc|测试文档|testsuite|配置文档|哪个文档|看哪个文档|主文档|总入口/i,
  workspaceStructure: /workspace 目录|目录结构|怎么组织|如何组织|目录规则|memory 目录|workspace\/memory|workspace\/notes|workspace\/memory\.md|长期记忆目录/,
  workspaceNotesRule: /workspace\/notes|notes 里的笔记|哪些笔记.*stable card|什么时候.*stable card|什么样的 note|什么样的 notes|背景 notes|背景笔记.*stable card/i,
  lossless: /lossless|上下文插件|context engine|长期记忆.*区别|为什么已经有长期记忆了/i,
  provider: /memorysearch\.provider|provider.*做什么|provider.*作用|embedding|memory_search/i,
  pendingRule: /待确认信息|pending|未确认信息.*放哪里|待确认.*放哪里|应该进入 pending|不该写入 memory\.md|不该写入 daily/i,
  preference: /爱吃|喜欢吃|饮食|口味|食物|偏好|爱好/,
  identity: /怎么称呼|叫什么|姓名|名字|昵称|称呼|身份/,
  timezone: /时区|timezone|北京时间|gmt\+?8|utc\+?8/i,
  style: /沟通风格|怎么.*沟通|如何.*沟通|跟我沟通|交流风格|说话风格|直接|实用|不废话/,
  reminder: /提醒|提醒事项|飞书任务|苹果日历|日历提醒|双通道/,
  execution: /低风险|可逆操作|高风险动作|先确认|默认推进|收到明确任务|可直接执行|风险动作/,
  toolRole: /openviking|长期记忆检索补充工具|查询个人信息|历史片段|偏好查询/i,
  agentRole: /编程工作|文档工作|订单工作|健康工作|交给谁|哪个agent|哪个 agent|code agent|document agent|order agent|health agent|main 先处理/i,
  mainBoundary: /main.*负责|main.*边界|main 负责什么|main 不负责什么|总协调|任务判断|任务分派|结果汇总|长期承接/i,
  mainNegativeBoundary: /main 不负责什么|main 不长期承接|不长期承接|不负责/i,
  statusRule: /已开始是什么意思|等待确认是什么意思|排队中是什么意思|已暂停是什么意思|状态词|真实状态|阻塞态/,
  rule: /规则|原则|工作方式|写作偏好|长期偏好|习惯|memory\.md|应该放|适合放|不适合放|长期稳定/i,
  background: /几个孩子|一儿一女|孩子|家庭|家里|做什么|做哪行|工厂|实体制造业|毛绒玩具|背景|职业|转型/,
  birthday: /生日|农历生日|农历|女儿|儿子|孩子|家庭|身份证/,
  project: /项目定位|项目背景|这个项目|做什么用|解决什么问题|项目目标|插件定位|context engine|上下文引擎|memory-context-claw|workspace 目录|目录结构|内置 workspace/i
};

export function classifyQueryIntent(query = "") {
  const text = String(query || "").trim();
  return {
    rawQuery: text,
    config: PATTERNS.config.test(text),
    releaseInstall: PATTERNS.releaseInstall.test(text),
    installVerify: PATTERNS.installVerify.test(text),
    projectNavigation: PATTERNS.projectNavigation.test(text),
    workspaceStructure: PATTERNS.workspaceStructure.test(text),
    workspaceNotesRule: PATTERNS.workspaceNotesRule.test(text),
    lossless: PATTERNS.lossless.test(text),
    provider: PATTERNS.provider.test(text),
    pendingRule: PATTERNS.pendingRule.test(text),
    preference: PATTERNS.preference.test(text),
    identity: PATTERNS.identity.test(text),
    timezone: PATTERNS.timezone.test(text),
    style: PATTERNS.style.test(text),
    reminder: PATTERNS.reminder.test(text),
    execution: PATTERNS.execution.test(text),
    toolRole: PATTERNS.toolRole.test(text),
    agentRole: PATTERNS.agentRole.test(text),
    mainBoundary: PATTERNS.mainBoundary.test(text),
    mainNegativeBoundary: PATTERNS.mainNegativeBoundary.test(text),
    statusRule: PATTERNS.statusRule.test(text),
    rule: PATTERNS.rule.test(text),
    background: PATTERNS.background.test(text),
    birthday: PATTERNS.birthday.test(text),
    project: PATTERNS.project.test(text)
  };
}

export function resolveRetrievalPolicy(query = "", options = {}) {
  const intents = classifyQueryIntent(query);
  const llmIntentFallbackEnabled = options?.llmIntentFallbackEnabled === true;

  let mode = "search-first";
  let rationale = "unclassified-query";
  let sourcePriority = ["builtin-search", "workspace-doc", "sessions"];

  if (
    intents.preference ||
    intents.identity ||
    intents.timezone ||
    intents.style ||
    intents.reminder ||
    intents.execution ||
    intents.toolRole ||
    intents.agentRole ||
    intents.mainBoundary ||
    intents.mainNegativeBoundary ||
    intents.statusRule
  ) {
    mode = "fast-path-first";
    rationale = "stable-fact-or-stable-rule";
    sourcePriority = ["cardArtifact", "MEMORY.md", "memory/%", "builtin-search"];
  } else if (intents.rule || intents.config || intents.releaseInstall || intents.installVerify || intents.projectNavigation || intents.workspaceStructure || intents.workspaceNotesRule || intents.lossless || intents.provider || intents.pendingRule || intents.project) {
    mode = "formal-memory-first";
    rationale = "formal-or-project-doc-priority";
    sourcePriority = ["cardArtifact", "formal-memory-policy.md", "MEMORY.md", "README.md", "configuration.md", "builtin-search"];
  } else if (intents.background || intents.birthday) {
    mode = "mixed-mode";
    rationale = "stable-facts-plus-supporting-history";
    sourcePriority = ["cardArtifact", "memory/%", "builtin-search", "sessions"];
  }

  return {
    mode,
    rationale,
    sourcePriority,
    intents,
    llm: {
      defaultPath: "disabled",
      fallbackEnabled: llmIntentFallbackEnabled,
      allowed: llmIntentFallbackEnabled ? "single-optional-fallback" : "none"
    }
  };
}

export function isFactIntent(query = "") {
  const intents = classifyQueryIntent(query);
  return Object.entries(intents)
    .filter(([key]) => key !== "rawQuery")
    .some(([, value]) => value === true);
}
