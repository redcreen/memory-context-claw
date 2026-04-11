import test from "node:test";
import assert from "node:assert/strict";
import { scoreCandidates } from "../src/scoring.js";

test("scoreCandidates prefers MEMORY.md over generic workspace docs when relevance is close", () => {
  const candidates = [
    {
      path: "MEMORY.md",
      startLine: 1,
      endLine: 20,
      score: 0.45,
      snippet: "## 一句话结论\n长期规则和偏好在这里。\n## 适用场景\n回答风格和协作方式。",
      source: "memory"
    },
    {
      path: "workspace/notes/openclaw-memory-vs-lossless.md",
      startLine: 1,
      endLine: 20,
      score: 0.46,
      snippet: "这是一个普通专题文档，介绍 Memory 和 Lossless 的区别。",
      source: "memory"
    }
  ];

  const ranked = scoreCandidates(candidates, "我的长期偏好和规则是什么", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  });

  assert.equal(ranked[0].path, "MEMORY.md");
});

test("scoreCandidates boosts recent daily memory", () => {
  const recent = {
    path: "workspace/memory/2026-04-04.md",
    startLine: 1,
    endLine: 10,
    score: 0.38,
    snippet: "## 今日结论\n今天开始搭建长期记忆和 Workspace 索引。",
    source: "memory"
  };
  const old = {
    path: "workspace/memory/2026-01-01.md",
    startLine: 1,
    endLine: 10,
    score: 0.38,
    snippet: "## 今日结论\n很早之前的记录。",
    source: "memory"
  };

  const ranked = scoreCandidates([old, recent], "今天长期记忆做了什么", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-04T00:00:00Z"));

  assert.equal(ranked[0].path, recent.path);
});

test("scoreCandidates prefers config docs for config-intent prompts", () => {
  const candidates = [
    {
      path: "MEMORY.md",
      startLine: 1,
      endLine: 20,
      score: 0.46,
      snippet: "## 一句话结论\n长期规则和偏好在这里。\n## 关键信息\n长期偏好、固定工作流程。",
      source: "memory"
    },
    {
      path: "workspace/notes/memory-context-claw-config.md",
      startLine: 1,
      endLine: 30,
      score: 0.43,
      snippet:
        "## 一句话结论\nmemory-context-claw 的主配置分成两层。\n## 最小配置\nplugins.entries[\"memory-context-claw\"]\ncontextEngine\n安装",
      source: "memory"
    }
  ];

  const ranked = scoreCandidates(candidates, "这个项目的配置应该怎么写", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  });

  assert.equal(ranked[0].path, "workspace/notes/memory-context-claw-config.md");
});

test("scoreCandidates prefers recent session memory over workspace docs when relevance is close", () => {
  const candidates = [
    {
      path: "sessions/live-session.jsonl.reset.2026-04-04T15-10-22.499Z",
      startLine: 1,
      endLine: 1,
      score: 0.44,
      snippet: "今天我们已经完成 main agent 的 session memory 配置。",
      source: "sessions"
    },
    {
      path: "workspace/notes/openclaw-memory-vs-lossless.md",
      startLine: 1,
      endLine: 20,
      score: 0.45,
      snippet: "这是一个普通专题文档，介绍 Memory 和 Lossless 的区别。",
      source: "memory"
    }
  ];

  const ranked = scoreCandidates(candidates, "今天我们把 session memory 做到哪一步了", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-04T16:00:00Z"));

  assert.equal(ranked[0].source, "sessions");
});

test("scoreCandidates still keeps MEMORY.md above session memory for stable preference prompts", () => {
  const candidates = [
    {
      path: "sessions/live-session.jsonl.reset.2026-04-04T15-10-22.499Z",
      startLine: 1,
      endLine: 1,
      score: 0.48,
      snippet: "今天我们讨论过回答要先给结论。",
      source: "sessions"
    },
    {
      path: "MEMORY.md",
      startLine: 1,
      endLine: 20,
      score: 0.46,
      snippet: "## 一句话结论\n我习惯先给结论，再展开细节。\n## 适用场景\n长期协作偏好。",
      source: "memory"
    }
  ];

  const ranked = scoreCandidates(candidates, "我的长期写作偏好是什么", {
    retrievalScore: 0.55,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-04T16:00:00Z"));

  assert.equal(ranked[0].path, "MEMORY.md");
});

test("scoreCandidates prefers card artifacts over stale session memory for direct preference prompts", () => {
  const candidates = [
    {
      path: "sessions/old-food.jsonl",
      source: "sessions",
      score: 0.69,
      snippet: "你爱吃面食，像面条、馒头这些",
      startLine: 1,
      endLine: 5
    },
    {
      path: "memory/2026-04-05-food-preference.md",
      source: "cardArtifact",
      score: 0.65,
      snippet: "你爱吃牛排",
      startLine: 1,
      endLine: 1
    }
  ];

  const ranked = scoreCandidates(candidates, "我爱吃什么", {
    retrievalScore: 0.55,
    cardArtifact: 0.16,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-05T12:00:00Z"));

  assert.equal(ranked[0].source, "cardArtifact");
  assert.match(ranked[0].snippet, /牛排/);
});

test("scoreCandidates prefers timezone facts for timezone prompts", () => {
  const ranked = scoreCandidates(
    [
      {
        path: "MEMORY.md",
        startLine: 1,
        endLine: 1,
        score: 0.4,
        snippet: "你的时区是GMT+8（北京时间）",
        source: "cardArtifact"
      },
      {
        path: "memory/2026-04-05.md",
        startLine: 1,
        endLine: 3,
        score: 0.8,
        snippet: "你的实际出生年份是1983；身份证登记生日年份是1982。",
        source: "memory"
      }
    ],
    "我的时区是什么",
    {
      retrievalScore: 0.55,
      cardArtifact: 0.16,
      memoryFile: 0.18,
      dailyMemory: 0.12,
      sessionRecent: 0.1,
      workspaceDoc: 0.08,
      summarySection: 0.08,
      keywordOverlap: 0.12,
      recency: 0.07
    }
  );

  assert.equal(ranked[0].path, "MEMORY.md");
  assert.match(ranked[0].snippet, /GMT\+8|北京时间/);
});

test("scoreCandidates prefers communication style facts for style prompts", () => {
  const ranked = scoreCandidates(
    [
      {
        path: "MEMORY.md",
        startLine: 1,
        endLine: 1,
        score: 0.4,
        snippet: "你的沟通风格偏好是直接、实用、不废话",
        source: "cardArtifact"
      },
      {
        path: "memory/2026-04-05.md",
        startLine: 1,
        endLine: 3,
        score: 0.8,
        snippet: "你的生日是1983-02-06，农历生日是腊月二十四。",
        source: "memory"
      }
    ],
    "你应该怎么跟我沟通",
    {
      retrievalScore: 0.55,
      cardArtifact: 0.16,
      memoryFile: 0.18,
      dailyMemory: 0.12,
      sessionRecent: 0.1,
      workspaceDoc: 0.08,
      summarySection: 0.08,
      keywordOverlap: 0.12,
      recency: 0.07
    }
  );

  assert.equal(ranked[0].path, "MEMORY.md");
  assert.match(ranked[0].snippet, /直接、实用、不废话/);
});

test("scoreCandidates prefers reminder-channel facts for reminder prompts", () => {
  const ranked = scoreCandidates(
    [
      {
        path: "MEMORY.md",
        startLine: 1,
        endLine: 1,
        score: 0.45,
        snippet: "当你说提醒时，默认使用飞书任务 + 苹果日历双通道。",
        source: "cardArtifact"
      },
      {
        path: "memory/2026-04-05.md",
        startLine: 1,
        endLine: 3,
        score: 0.8,
        snippet: "你的生日是1983-02-06，农历生日是腊月二十四。",
        source: "memory"
      }
    ],
    "我说提醒时默认用什么",
    {
      retrievalScore: 0.55,
      cardArtifact: 0.16,
      memoryFile: 0.18,
      dailyMemory: 0.12,
      sessionRecent: 0.1,
      workspaceDoc: 0.08,
      summarySection: 0.08,
      keywordOverlap: 0.12,
      recency: 0.07
    }
  );

  assert.equal(ranked[0].path, "MEMORY.md");
  assert.match(ranked[0].snippet, /飞书任务|苹果日历/);
});

test("scoreCandidates prefers execution-rule facts for execution prompts", () => {
  const ranked = scoreCandidates(
    [
      {
        path: "MEMORY.md",
        startLine: 1,
        endLine: 1,
        score: 0.45,
        snippet: "收到明确任务后，纯内部、低风险、可逆操作可直接执行；高风险动作才先确认。",
        source: "cardArtifact"
      },
      {
        path: "memory/2026-04-05.md",
        startLine: 1,
        endLine: 3,
        score: 0.8,
        snippet: "你的生日是1983-02-06，农历生日是腊月二十四。",
        source: "memory"
      }
    ],
    "收到明确任务后，低风险可逆操作应该怎么做",
    {
      retrievalScore: 0.55,
      cardArtifact: 0.16,
      memoryFile: 0.18,
      dailyMemory: 0.12,
      sessionRecent: 0.1,
      workspaceDoc: 0.08,
      summarySection: 0.08,
      keywordOverlap: 0.12,
      recency: 0.07
    }
  );

  assert.equal(ranked[0].path, "MEMORY.md");
  assert.match(ranked[0].snippet, /低风险|可直接执行|先确认/);
});

test("scoreCandidates prefers OpenViking role facts for tool-role prompts", () => {
  const ranked = scoreCandidates(
    [
      {
        path: "MEMORY.md",
        startLine: 1,
        endLine: 1,
        score: 0.45,
        snippet: "OpenViking 是主要长期记忆检索补充工具，用于查询个人信息、偏好、历史片段等。",
        source: "cardArtifact"
      },
      {
        path: "memory/2026-04-05.md",
        startLine: 1,
        endLine: 3,
        score: 0.8,
        snippet: "你的生日是1983-02-06，农历生日是腊月二十四。",
        source: "memory"
      }
    ],
    "OpenViking 是做什么的",
    {
      retrievalScore: 0.55,
      cardArtifact: 0.16,
      memoryFile: 0.18,
      dailyMemory: 0.12,
      sessionRecent: 0.1,
      workspaceDoc: 0.08,
      summarySection: 0.08,
      keywordOverlap: 0.12,
      recency: 0.07
    }
  );

  assert.equal(ranked[0].path, "MEMORY.md");
  assert.match(ranked[0].snippet, /OpenViking|长期记忆检索补充工具/);
});

test("scoreCandidates prefers agent-role facts for routing prompts", () => {
  const ranked = scoreCandidates(
    [
      {
        path: "MEMORY.md",
        startLine: 1,
        endLine: 1,
        score: 0.45,
        snippet: "编程工作默认交给 code Agent。",
        source: "cardArtifact"
      },
      {
        path: "memory/2026-04-05.md",
        startLine: 1,
        endLine: 3,
        score: 0.8,
        snippet: "你的生日是1983-02-06，农历生日是腊月二十四。",
        source: "memory"
      }
    ],
    "编程工作应该交给哪个 Agent",
    {
      retrievalScore: 0.55,
      cardArtifact: 0.16,
      memoryFile: 0.18,
      dailyMemory: 0.12,
      sessionRecent: 0.1,
      workspaceDoc: 0.08,
      summarySection: 0.08,
      keywordOverlap: 0.12,
      recency: 0.07
    }
  );

  assert.equal(ranked[0].path, "MEMORY.md");
  assert.match(ranked[0].snippet, /编程工作默认交给 code Agent/);
});

test("scoreCandidates prefers main-boundary facts for boundary prompts", () => {
  const ranked = scoreCandidates(
    [
      {
        path: "MEMORY.md",
        startLine: 1,
        endLine: 1,
        score: 0.45,
        snippet: "main 负责总协调、任务判断、任务分派、结果汇总。",
        source: "cardArtifact"
      },
      {
        path: "memory/2026-04-05.md",
        startLine: 1,
        endLine: 3,
        score: 0.8,
        snippet: "你的生日是1983-02-06，农历生日是腊月二十四。",
        source: "memory"
      }
    ],
    "main 负责什么",
    {
      retrievalScore: 0.55,
      cardArtifact: 0.16,
      memoryFile: 0.18,
      dailyMemory: 0.12,
      sessionRecent: 0.1,
      workspaceDoc: 0.08,
      summarySection: 0.08,
      keywordOverlap: 0.12,
      recency: 0.07
    }
  );

  assert.equal(ranked[0].path, "MEMORY.md");
  assert.match(ranked[0].snippet, /main 负责总协调、任务判断、任务分派、结果汇总/);
});

test("scoreCandidates prefers main negative-boundary facts for negative boundary prompts", () => {
  const ranked = scoreCandidates(
    [
      {
        path: "MEMORY.md",
        startLine: 1,
        endLine: 1,
        score: 0.45,
        snippet: "main 不负责长期承接明确属于专业 Agent 的具体执行。",
        source: "cardArtifact"
      },
      {
        path: "memory/2026-04-05.md",
        startLine: 1,
        endLine: 3,
        score: 0.8,
        snippet: "你的生日是1983-02-06，农历生日是腊月二十四。",
        source: "memory"
      }
    ],
    "main 不负责什么",
    {
      retrievalScore: 0.55,
      cardArtifact: 0.16,
      memoryFile: 0.18,
      dailyMemory: 0.12,
      sessionRecent: 0.1,
      workspaceDoc: 0.08,
      summarySection: 0.08,
      keywordOverlap: 0.12,
      recency: 0.07
    }
  );

  assert.equal(ranked[0].path, "MEMORY.md");
  assert.match(ranked[0].snippet, /main 不负责长期承接明确属于专业 Agent 的具体执行/);
});

test("scoreCandidates prefers status-rule facts for status prompts", () => {
  const ranked = scoreCandidates(
    [
      {
        path: "MEMORY.md",
        startLine: 1,
        endLine: 1,
        score: 0.45,
        snippet: "“已开始”表示已经发出实际工具调用、后台任务或明确执行动作",
        source: "cardArtifact"
      },
      {
        path: "memory/2026-04-05.md",
        startLine: 1,
        endLine: 3,
        score: 0.8,
        snippet: "你的生日是1983-02-06，农历生日是腊月二十四。",
        source: "memory"
      }
    ],
    "已开始是什么意思",
    {
      retrievalScore: 0.55,
      cardArtifact: 0.16,
      memoryFile: 0.18,
      dailyMemory: 0.12,
      sessionRecent: 0.1,
      workspaceDoc: 0.08,
      summarySection: 0.08,
      keywordOverlap: 0.12,
      recency: 0.07
    }
  );

  assert.equal(ranked[0].path, "MEMORY.md");
  assert.match(ranked[0].snippet, /已开始.*实际工具调用|后台任务|明确执行动作/);
});

test("scoreCandidates penalizes stale conflicting preference facts when a newer card exists", () => {
  const candidates = [
    {
      path: "sessions/old-food.jsonl",
      source: "sessions",
      score: 0.8,
      snippet: "你爱吃面食，像面条、馒头这些",
      startLine: 1,
      endLine: 5
    },
    {
      path: "memory/2026-04-05-food-preference.md",
      source: "cardArtifact",
      score: 0.62,
      snippet: "你爱吃牛排",
      startLine: 1,
      endLine: 1
    }
  ];

  const ranked = scoreCandidates(candidates, "我爱吃什么", {
    retrievalScore: 0.55,
    cardArtifact: 0.16,
    preferenceConflictPenalty: 0.24,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-05T12:00:00Z"));

  assert.equal(ranked[0].source, "cardArtifact");
  assert.match(ranked[0].snippet, /牛排/);
  assert.ok((ranked[1].preferenceConflictPenalty || 0) > 0);
});

test("scoreCandidates prefers card artifacts for identity prompts too", () => {
  const candidates = [
    {
      path: "sessions/old-name.jsonl",
      source: "sessions",
      score: 0.7,
      snippet: "你之前提过超哥这个称呼，但这段里还夹杂了很多旧会话元数据",
      startLine: 1,
      endLine: 8
    },
    {
      path: "memory/2026-04-05-identity.md",
      source: "cardArtifact",
      score: 0.61,
      snippet: "你叫刘超，我平时记你是超哥",
      startLine: 1,
      endLine: 1
    }
  ];

  const ranked = scoreCandidates(candidates, "你怎么称呼我", {
    retrievalScore: 0.55,
    cardArtifact: 0.16,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-05T12:00:00Z"));

  assert.equal(ranked[0].source, "cardArtifact");
  assert.match(ranked[0].snippet, /刘超|超哥/);
});

test("scoreCandidates prefers card artifacts for rule-style prompts", () => {
  const candidates = [
    {
      path: "sessions/old-memory-md.jsonl",
      source: "sessions",
      score: 0.71,
      snippet: "之前讨论过 MEMORY.md、daily 和 workspace，但这段里还夹杂了很多旧会话过程说明",
      startLine: 1,
      endLine: 8
    },
    {
      path: "memory/2026-04-05-memory-rule.md",
      source: "cardArtifact",
      score: 0.6,
      snippet: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      startLine: 1,
      endLine: 1
    }
  ];

  const ranked = scoreCandidates(candidates, "MEMORY.md 应该放什么内容", {
    retrievalScore: 0.55,
    cardArtifact: 0.16,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-05T12:00:00Z"));

  assert.equal(ranked[0].source, "cardArtifact");
  assert.match(ranked[0].snippet, /长期稳定|反复复用/);
});

test("scoreCandidates prefers card artifacts for background prompts", () => {
  const candidates = [
    {
      path: "sessions/old-background.jsonl",
      source: "sessions",
      score: 0.73,
      snippet: "之前提过超哥的行业背景，但这段还混了很多旧会话过程和元数据",
      startLine: 1,
      endLine: 8
    },
    {
      path: "memory/2026-04-05-work-background.md",
      source: "cardArtifact",
      score: 0.6,
      snippet: "你2025年8月开始做毛绒玩具工厂，从互联网转型到实体制造业。",
      startLine: 1,
      endLine: 1
    }
  ];

  const ranked = scoreCandidates(candidates, "你现在做什么行业", {
    retrievalScore: 0.55,
    cardArtifact: 0.16,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-05T12:00:00Z"));

  assert.equal(ranked[0].source, "cardArtifact");
  assert.match(ranked[0].snippet, /毛绒玩具工厂|实体制造业/);
});

test("scoreCandidates prefers card artifacts for project prompts", () => {
  const candidates = [
    {
      path: "sessions/old-project.jsonl",
      source: "sessions",
      score: 0.73,
      snippet: "之前讨论过插件定位，但这段混了很多旧会话过程和元数据",
      startLine: 1,
      endLine: 8
    },
    {
      path: "memory/2026-04-05-project-positioning.md",
      source: "cardArtifact",
      score: 0.6,
      snippet: "这是一个面向 OpenClaw 的 context engine 插件，负责把长期记忆更稳定地变成当前轮可用的上下文。",
      startLine: 1,
      endLine: 1
    }
  ];

  const ranked = scoreCandidates(candidates, "这个项目主要解决什么问题", {
    retrievalScore: 0.55,
    cardArtifact: 0.16,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  }, new Date("2026-04-05T12:00:00Z"));

  assert.equal(ranked[0].source, "cardArtifact");
  assert.match(ranked[0].snippet, /context engine|长期记忆更稳定地变成当前轮可用的上下文/);
});

test("scoreCandidates prefers provider-role config explanations for provider prompts", () => {
  const candidates = [
    {
      path: "sessions/live-session.jsonl",
      source: "sessions",
      score: 0.93,
      snippet: "Assistant: memorySearch.provider 是做什么的？它决定长期记忆检索使用哪个 embedding / memory_search provider，不影响主聊天模型。",
      startLine: 1,
      endLine: 10
    },
    {
      path: "MEMORY.md",
      source: "cardArtifact",
      score: 0.88,
      snippet: "你的实际出生年份是1983；身份证登记生日年份是1982，这是历史登记错误，但证件信息客观如此。",
      startLine: 1,
      endLine: 1
    },
    {
      path: "configuration.md",
      source: "cardArtifact",
      score: 0.72,
      snippet: "memorySearch.provider 决定长期记忆检索使用哪个 embedding / memory_search provider，不影响主聊天模型。",
      startLine: 1,
      endLine: 1
    }
  ];

  const ranked = scoreCandidates(candidates, "memorySearch.provider 是做什么的", {
    retrievalScore: 0.55,
    cardArtifact: 0.16,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  });

  assert.equal(ranked[0].path, "configuration.md");
  assert.match(ranked[0].snippet, /embedding|memory_search/);
});

test("scoreCandidates suppresses session noise for lossless concept prompts when stable note cards exist", () => {
  const candidates = [
    {
      path: "sessions/live-session.jsonl",
      source: "sessions",
      score: 0.94,
      snippet: "Assistant: Lossless 更像上下文插件，长期记忆负责保存和检索。",
      startLine: 1,
      endLine: 12
    },
    {
      path: "workspace/notes/openclaw-memory-vs-lossless.md",
      source: "cardArtifact",
      score: 0.74,
      snippet: "长期记忆负责存和找；Lossless / context engine 负责把当前这一轮最该看的内容更好地送进模型。",
      startLine: 1,
      endLine: 1
    }
  ];

  const ranked = scoreCandidates(candidates, "为什么已经有长期记忆了，还需要 Lossless", {
    retrievalScore: 0.55,
    cardArtifact: 0.16,
    memoryFile: 0.18,
    dailyMemory: 0.12,
    sessionRecent: 0.1,
    workspaceDoc: 0.08,
    summarySection: 0.08,
    keywordOverlap: 0.12,
    recency: 0.07
  });

  assert.equal(ranked[0].path, "workspace/notes/openclaw-memory-vs-lossless.md");
  assert.equal(ranked[0].source, "cardArtifact");
});
