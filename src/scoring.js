import {
  buildKeywordSet,
  canonicalizeMemoryPath,
  extractSessionTimestamp,
  normalizeWhitespace,
  scoreRecencyFromDate,
  scoreRecencyFromIsoDate,
  toIsoDateFromMemoryPath
} from "./utils.js";

function computePathKind(pathname, source = "memory") {
  if (source === "cardArtifact") {
    return "cardArtifact";
  }
  if (source === "sessions") {
    return "sessionMemory";
  }
  if (pathname === "MEMORY.md" || pathname.endsWith("/MEMORY.md")) {
    return "memoryFile";
  }
  if (pathname.includes("/memory/") || pathname.startsWith("memory/")) {
    return "dailyMemory";
  }
  return "workspaceDoc";
}

function isConfigIntent(prompt) {
  return /配置|config|安装|install|启用|enable/.test(String(prompt || "").toLowerCase());
}

function isProviderIntent(prompt) {
  return /memorysearch\.provider|provider.*做什么|provider.*作用|embedding|memory_search/.test(
    String(prompt || "").toLowerCase()
  );
}

function isPreferenceIntent(prompt) {
  return /爱吃|喜欢吃|饮食|口味|食物|偏好|爱好/.test(String(prompt || "").toLowerCase());
}

function isIdentityIntent(prompt) {
  return /称呼|叫什么|我是谁|怎么称呼|身份/.test(String(prompt || "").toLowerCase());
}

function isTimezoneIntent(prompt) {
  return /时区|timezone|北京时间|gmt\+?8|utc\+?8/.test(String(prompt || "").toLowerCase());
}

function isStyleIntent(prompt) {
  return /沟通风格|怎么.*沟通|如何.*沟通|跟我沟通|交流风格|说话风格|直接|实用|不废话/.test(
    String(prompt || "").toLowerCase()
  );
}

function isReminderIntent(prompt) {
  return /提醒|提醒事项|飞书任务|苹果日历|日历提醒|双通道/.test(String(prompt || "").toLowerCase());
}

function isExecutionRuleIntent(prompt) {
  return /低风险|可逆操作|高风险动作|先确认|默认推进|收到明确任务|可直接执行|风险动作/.test(
    String(prompt || "").toLowerCase()
  );
}

function isToolRoleIntent(prompt) {
  return /openviking|长期记忆检索补充工具|查询个人信息|历史片段|偏好查询/.test(
    String(prompt || "").toLowerCase()
  );
}

function isAgentRoleIntent(prompt) {
  return /编程工作|文档工作|订单工作|健康工作|交给谁|哪个agent|哪个 agent|code agent|document agent|order agent|health agent|main 先处理/.test(
    String(prompt || "").toLowerCase()
  );
}

function isMainBoundaryIntent(prompt) {
  return /main.*负责|main.*边界|main 负责什么|main 不负责什么|总协调|任务判断|任务分派|结果汇总|长期承接/.test(
    String(prompt || "").toLowerCase()
  );
}

function isMainNegativeBoundaryIntent(prompt) {
  return /main 不负责什么|main 不长期承接|不长期承接|不负责/.test(
    String(prompt || "").toLowerCase()
  );
}

function isStatusRuleIntent(prompt) {
  return /已开始是什么意思|等待确认是什么意思|排队中是什么意思|已暂停是什么意思|状态词|真实状态|阻塞态/.test(
    String(prompt || "").toLowerCase()
  );
}

function isRuleIntent(prompt) {
  return /规则|原则|工作方式|写作偏好|长期偏好|习惯|memory\.md|应该放|适合放|不适合放|长期稳定/.test(
    String(prompt || "").toLowerCase()
  );
}

function isBackgroundIntent(prompt) {
  return /几个孩子|一儿一女|孩子|家庭|家里|做什么|做哪行|工厂|实体制造业|毛绒玩具|背景|职业|转型|生日|农历|女儿|儿子/.test(
    String(prompt || "").toLowerCase()
  );
}

function isBirthdayIntent(prompt) {
  return /生日|农历生日|女儿|儿子|孩子|家庭|身份证/.test(String(prompt || "").toLowerCase());
}

function isProjectIntent(prompt) {
  return /项目定位|项目背景|这个项目|做什么用|解决什么问题|项目目标|插件定位|context engine|上下文引擎|memory-context-claw/.test(
    String(prompt || "").toLowerCase()
  );
}

function computeIntentBoost(prompt, canonicalPath, snippet) {
  const configIntent = isConfigIntent(prompt);
  const providerIntent = isProviderIntent(prompt);
  const preferenceIntent = isPreferenceIntent(prompt);
  const identityIntent = isIdentityIntent(prompt);
  const timezoneIntent = isTimezoneIntent(prompt);
  const styleIntent = isStyleIntent(prompt);
  const reminderIntent = isReminderIntent(prompt);
  const executionRuleIntent = isExecutionRuleIntent(prompt);
  const toolRoleIntent = isToolRoleIntent(prompt);
  const agentRoleIntent = isAgentRoleIntent(prompt);
  const mainBoundaryIntent = isMainBoundaryIntent(prompt);
  const mainNegativeBoundaryIntent = isMainNegativeBoundaryIntent(prompt);
  const statusRuleIntent = isStatusRuleIntent(prompt);
  const ruleIntent = isRuleIntent(prompt);
  const backgroundIntent = isBackgroundIntent(prompt);
  const birthdayIntent = isBirthdayIntent(prompt);
  const projectIntent = isProjectIntent(prompt);
  if (
    !configIntent &&
    !providerIntent &&
    !preferenceIntent &&
    !identityIntent &&
    !timezoneIntent &&
    !styleIntent &&
    !reminderIntent &&
    !executionRuleIntent &&
    !toolRoleIntent &&
    !agentRoleIntent &&
    !mainBoundaryIntent &&
    !mainNegativeBoundaryIntent &&
    !statusRuleIntent &&
    !ruleIntent &&
    !backgroundIntent &&
    !birthdayIntent &&
    !projectIntent
  ) {
    return 0;
  }

  const haystack = `${canonicalPath}\n${snippet}`.toLowerCase();
  let boost = 0;

  if (configIntent) {
    if (/config|配置/.test(haystack)) {
      boost += 0.08;
    }
    if (/install|安装|启用|enabled|contextengine|plugins\.entries|最小配置/.test(haystack)) {
      boost += 0.08;
    }
    if (/memory-context-claw/.test(haystack)) {
      boost += 0.08;
    }
  }

  if (providerIntent) {
    if (/memorysearch\.provider|embedding|memory_search|检索 provider|不影响主聊天模型/.test(haystack)) {
      boost += 0.2;
    }
    if (/config|配置/.test(haystack)) {
      boost += 0.08;
    }
    if (/身份证登记|出生年份|刘超|超哥/.test(haystack)) {
      boost -= 0.16;
    }
  }

  if (preferenceIntent) {
    if (/爱吃|喜欢吃|偏好|口味|称呼|身份|爱好/.test(haystack)) {
      boost += 0.12;
    }
    if (/你爱吃|你叫|超哥|刘超/.test(haystack)) {
      boost += 0.08;
    }
  }

  if (identityIntent) {
    if (/你叫|怎么称呼|超哥|刘超|身份/.test(haystack)) {
      boost += 0.18;
    }
    if (/你叫|我平时记你是/.test(haystack)) {
      boost += 0.08;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.12;
    }
  }

  if (timezoneIntent) {
    if (/时区|timezone|北京时间|gmt\+?8|utc\+?8/.test(haystack)) {
      boost += 0.2;
    }
    if (/刘超|超哥|身份证登记|出生年份/.test(haystack)) {
      boost -= 0.1;
    }
  }

  if (styleIntent) {
    if (/沟通风格|交流风格|说话风格|直接|实用|不废话/.test(haystack)) {
      boost += 0.18;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (reminderIntent) {
    if (/提醒|提醒事项|飞书任务|苹果日历|日历提醒|双通道/.test(haystack)) {
      boost += 0.2;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (executionRuleIntent) {
    if (/默认推进|风险动作再确认|低风险|可逆操作|可直接执行|高风险动作|先确认/.test(haystack)) {
      boost += 0.22;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (toolRoleIntent) {
    if (/openviking|长期记忆检索补充工具|查询个人信息|偏好|历史片段/.test(haystack)) {
      boost += 0.2;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (agentRoleIntent) {
    if (/编程工作|文档工作|订单工作|健康工作|code agent|document agent|order agent|health agent|main 先处理/.test(haystack)) {
      boost += 0.2;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (mainBoundaryIntent) {
    if (/main 负责|总协调|任务判断|任务分派|结果汇总|不长期承接/.test(haystack)) {
      boost += 0.2;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (mainNegativeBoundaryIntent) {
    if (/main 不长期承接|不负责/.test(haystack)) {
      boost += 0.16;
    }
    if (/main 负责/.test(haystack)) {
      boost -= 0.14;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (statusRuleIntent) {
    if (/已开始|等待确认|排队中|已暂停|真实状态|阻塞态/.test(haystack)) {
      boost += 0.18;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (ruleIntent) {
    if (/规则|原则|工作方式|写作偏好|长期偏好|习惯|长期稳定/.test(haystack)) {
      boost += 0.14;
    }
    if (/memory\.md|应该放|适合放|不适合放/.test(haystack)) {
      boost += 0.14;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (backgroundIntent) {
    if (/孩子|一儿一女|家庭|家里|背景|职业|转型|工厂|实体制造业|毛绒玩具|生日|农历|女儿|儿子|腊月|五年级|高三/.test(haystack)) {
      boost += 0.16;
    }
    if (/你有|你做|你在做|刘超|超哥/.test(haystack)) {
      boost += 0.08;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (birthdayIntent) {
    if (/生日|农历|女儿|儿子|腊月|五年级|高三|身份证|待确认|笔误/.test(haystack)) {
      boost += 0.18;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  if (projectIntent) {
    if (/项目|定位|目标|解决什么问题|context engine|上下文引擎|memory-context-claw|长期记忆|上下文层/.test(haystack)) {
      boost += 0.16;
    }
    if (/插件|openclaw|context engine|contextengine/.test(haystack)) {
      boost += 0.08;
    }
    if (/元数据|metadata/.test(haystack)) {
      boost -= 0.08;
    }
  }

  return boost;
}

function computeKeywordOverlap(promptKeywords, candidateText) {
  if (promptKeywords.length === 0) {
    return 0;
  }
  const haystack = normalizeWhitespace(candidateText).toLowerCase();
  let hits = 0;
  for (const keyword of promptKeywords) {
    if (haystack.includes(keyword)) {
      hits += 1;
    }
  }
  return hits / promptKeywords.length;
}

function hasStructuredSummary(text) {
  return /一句话结论|适用场景|关键信息|今日结论/.test(text);
}

function extractPreferenceSlotValue(text) {
  const normalized = normalizeWhitespace(text);
  const match = normalized.match(/(?:你|用户)(?:更)?(?:爱吃|喜欢吃)([^，。；、\s]+)/);
  return match?.[1] || "";
}

export function scoreCandidates(candidates, prompt, weights, now = new Date()) {
  const preferenceIntent = isPreferenceIntent(prompt);
  const configIntent = isConfigIntent(prompt);
  const providerIntent = isProviderIntent(prompt);
  const ruleIntent = isRuleIntent(prompt);
  const projectIntent = isProjectIntent(prompt);
  const losslessIntent = /lossless|上下文插件|context engine|长期记忆.*区别|为什么已经有长期记忆了/i.test(
    String(prompt || "").toLowerCase()
  );
  const promptKeywords = buildKeywordSet(prompt);
  const maxRetrievalScore = Math.max(1e-9, ...candidates.map((item) => Number(item.score || 0)));

  const scored = candidates
    .map((candidate, index) => {
      const path = String(candidate.path || "");
      const canonicalPath = canonicalizeMemoryPath(path);
      const snippet = String(candidate.snippet || "");
      const source = String(candidate.source || "memory");
      const retrievalScore = Number(candidate.score || 0) / maxRetrievalScore;
      const pathKind = computePathKind(canonicalPath, source);
      const keywordOverlap = computeKeywordOverlap(promptKeywords, `${canonicalPath}\n${snippet}`);
      const summaryBoost = hasStructuredSummary(snippet) ? 1 : 0;
      const recency = pathKind === "sessionMemory"
        ? scoreRecencyFromDate(extractSessionTimestamp(path), now)
        : scoreRecencyFromIsoDate(toIsoDateFromMemoryPath(canonicalPath), now);
      const intentBoost = computeIntentBoost(prompt, canonicalPath, snippet);
      const sessionBoost = pathKind === "sessionMemory" ? 1 : 0;
      const sessionIntentPenalty =
        pathKind !== "sessionMemory"
          ? 0
          : providerIntent
            ? (weights.providerSessionPenalty ?? 0.34)
            : (configIntent || ruleIntent)
              ? (weights.ruleConfigSessionPenalty ?? 0.24)
              : (projectIntent || losslessIntent)
                ? (weights.projectConceptSessionPenalty ?? 0.2)
                : 0;

      const weightedScore =
        retrievalScore * weights.retrievalScore +
        keywordOverlap * weights.keywordOverlap +
        summaryBoost * weights.summarySection +
        recency * weights.recency +
        sessionBoost * (weights.sessionRecent ?? 0) +
        intentBoost +
        (pathKind === "cardArtifact" ? (weights.cardArtifact ?? 0) : 0) +
        (pathKind === "memoryFile" ? weights.memoryFile : 0) +
        (pathKind === "dailyMemory" ? weights.dailyMemory : 0) +
        (pathKind === "workspaceDoc" ? weights.workspaceDoc : 0) -
        sessionIntentPenalty;

      return {
        id: `cand-${index + 1}`,
        path,
        canonicalPath,
        pathKind,
        startLine: Number(candidate.startLine || 0),
        endLine: Number(candidate.endLine || 0),
        retrievalScore: Number(candidate.score || 0),
        keywordOverlap,
        summaryBoost,
        recency,
        sessionBoost,
        sessionIntentPenalty,
        intentBoost,
        weightedScore,
        snippet,
        source
      };
    });

  if (preferenceIntent) {
    const preferredFacts = new Set(
      scored
        .filter((item) => item.source === "cardArtifact")
        .map((item) => extractPreferenceSlotValue(item.snippet))
        .filter(Boolean)
    );

    if (preferredFacts.size > 0) {
      for (const item of scored) {
        if (item.source === "cardArtifact") {
          continue;
        }
        const candidateFact = extractPreferenceSlotValue(item.snippet);
        if (!candidateFact) {
          continue;
        }
        if (!preferredFacts.has(candidateFact)) {
          item.preferenceConflictPenalty = weights.preferenceConflictPenalty ?? 0;
          item.weightedScore -= item.preferenceConflictPenalty;
        }
      }
    }
  }

  return scored.sort((left, right) => right.weightedScore - left.weightedScore);
}
