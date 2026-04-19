import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildCodexVscodeContextMinorGc,
  extractCodexVscodeRecentMessages,
    findLatestCodexVscodeSession,
  renderCodexVscodeContextMinorGcFooter,
  renderCodexVscodeContextMinorGcHistory,
  renderCodexVscodeContextMinorGcMarkdown,
  renderCodexVscodeContextMinorGcPanel,
  renderCodexVscodeContextMinorGcPrompt,
  renderCodexVscodeContextMinorGcSizeLine
} from "../src/codex-vscode-context-minor-gc.js";

async function writeSessionFile(filePath, lines) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`,
    "utf8"
  );
}

test("findLatestCodexVscodeSession picks the newest matching workspace session", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-sessions-"));
  const repoPath = "/tmp/unified-memory-core";
  const olderPath = path.join(rootDir, "2026", "04", "17", "older.jsonl");
  const newerPath = path.join(rootDir, "2026", "04", "18", "newer.jsonl");
  const otherPath = path.join(rootDir, "2026", "04", "18", "other.jsonl");

  await writeSessionFile(olderPath, [{
    type: "session_meta",
    payload: {
      id: "older",
      cwd: repoPath,
      originator: "codex_vscode",
      source: "vscode"
    }
  }]);
  await writeSessionFile(newerPath, [{
    type: "session_meta",
    payload: {
      id: "newer",
      cwd: repoPath,
      originator: "codex_vscode",
      source: "vscode"
    }
  }]);
  await writeSessionFile(otherPath, [{
    type: "session_meta",
    payload: {
      id: "other",
      cwd: "/tmp/other-project",
      originator: "codex_vscode",
      source: "vscode"
    }
  }]);

  await fs.utimes(olderPath, new Date("2026-04-17T00:00:00Z"), new Date("2026-04-17T00:00:00Z"));
  await fs.utimes(newerPath, new Date("2026-04-18T00:00:00Z"), new Date("2026-04-18T00:00:00Z"));
  await fs.utimes(otherPath, new Date("2026-04-18T01:00:00Z"), new Date("2026-04-18T01:00:00Z"));

  const result = await findLatestCodexVscodeSession({
    cwd: repoPath,
    sessionsRoot: rootDir,
    sessionId: ""
  });

  assert.equal(result.sessionId, "newer");
  assert.equal(result.filePath, newerPath);
});

test("findLatestCodexVscodeSession prefers an exact session id over newest same-cwd session", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-session-id-"));
  const repoPath = "/tmp/unified-memory-core";
  const olderPath = path.join(rootDir, "2026", "04", "18", "older.jsonl");
  const newerPath = path.join(rootDir, "2026", "04", "18", "newer.jsonl");

  await writeSessionFile(olderPath, [{
    type: "session_meta",
    payload: {
      id: "target-session",
      cwd: repoPath,
      originator: "codex_vscode",
      source: "vscode"
    }
  }]);
  await writeSessionFile(newerPath, [{
    type: "session_meta",
    payload: {
      id: "other-session",
      cwd: repoPath,
      originator: "codex_vscode",
      source: "vscode"
    }
  }]);

  await fs.utimes(olderPath, new Date("2026-04-18T00:00:00Z"), new Date("2026-04-18T00:00:00Z"));
  await fs.utimes(newerPath, new Date("2026-04-18T01:00:00Z"), new Date("2026-04-18T01:00:00Z"));

  const result = await findLatestCodexVscodeSession({
    cwd: repoPath,
    sessionsRoot: rootDir,
    sessionId: "target-session"
  });

  assert.equal(result.sessionId, "target-session");
  assert.equal(result.filePath, olderPath);
});

test("extractCodexVscodeRecentMessages drops commentary by default and appends prompt when needed", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-session-"));
  const sessionPath = path.join(rootDir, "session.jsonl");

  await writeSessionFile(sessionPath, [
    {
      type: "session_meta",
      payload: {
        id: "session-1",
        cwd: "/tmp/unified-memory-core",
        originator: "codex_vscode",
        source: "vscode"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "旧问题"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "agent_message",
        phase: "commentary",
        message: "处理中"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "agent_message",
        phase: "final_answer",
        message: "旧答案"
      }
    }
  ]);

  const result = await extractCodexVscodeRecentMessages({
    sessionPath,
    prompt: "新问题"
  });

  assert.equal(result.query, "新问题");
  assert.deepEqual(result.messages, [
    { role: "user", content: "旧问题" },
    { role: "assistant", content: "旧答案" },
    { role: "user", content: "新问题" }
  ]);
});

test("extractCodexVscodeRecentMessages compresses long assistant answers and dedupes repeated turns", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-compress-"));
  const sessionPath = path.join(rootDir, "session.jsonl");
  const longBody = [
    "Context(估算): 最近一轮输入 133k，无GC估算 133k；窗口口径 258k，压缩比：0.0%（133k/133k），占窗口比例：51.6%（133k/258k）",
    "对，基本没用。135k 到 133k 这种变化只是噪音级别，说明刚才那个改动只减少了很小的重复文案，没有碰到真正的大头。",
    "真正的大头是这条宿主线程里已经积累下来的东西：工具轨迹、长 commentary、长 final answer、调试输出。",
    "要有体感，下一步必须直接砍增长源：少写长 commentary，避免把重型调试输出灌进当前线程。",
    "必要时把观测改成 repo 外日志摘要而不是直接读 raw session。"
  ].join("\n\n");

  await writeSessionFile(sessionPath, [
    {
      type: "session_meta",
      payload: {
        id: "session-compress",
        cwd: "/tmp/unified-memory-core",
        originator: "codex_vscode",
        source: "vscode"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "但是并没有比 133k少多少啊，感觉没有啥用啊"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "agent_message",
        phase: "final_answer",
        message: longBody
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "Stage 11 的开发任务一口气做完"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "Stage 11 的开发任务一口气做完"
      }
    }
  ]);

  const result = await extractCodexVscodeRecentMessages({
    sessionPath
  });

  assert.equal(result.messages.length, 3);
  assert.equal(result.messages[0].role, "user");
  assert.equal(result.messages[1].role, "assistant");
  assert.equal(result.messages[2].role, "user");
  assert.doesNotMatch(result.messages[1].content, /^Context\(估算\):/);
  assert.ok(result.messages[1].content.length <= 321);
  assert.equal(
    result.messages[2].content,
    "Stage 11 的开发任务一口气做完"
  );
});

test("buildCodexVscodeContextMinorGc uses extracted messages and renders prompt output only when applied", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-build-"));
  const repoPath = "/tmp/unified-memory-core";
  const sessionPath = path.join(rootDir, "2026", "04", "18", "session.jsonl");

  await writeSessionFile(sessionPath, [
    {
      type: "session_meta",
      payload: {
        id: "session-live",
        cwd: repoPath,
        originator: "codex_vscode",
        source: "vscode"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "先看现状"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "agent_message",
        phase: "final_answer",
        message: "现状已确认。"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "继续默认开启 gc"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          last_token_usage: {
            input_tokens: 1000,
            cached_input_tokens: 800,
            output_tokens: 120,
            reasoning_output_tokens: 10,
            total_tokens: 1120
          },
          model_context_window: 2000
        }
      }
    }
  ]);

  let observedInput = null;
  const result = await buildCodexVscodeContextMinorGc({
    cwd: repoPath,
    sessionsRoot: rootDir,
    sessionId: "",
    packageBuilder: async (input) => {
      observedInput = input;
      return {
        enabled: true,
        status: "captured",
        reason: "",
        applied: true,
        relation: "switch",
        decisionTransport: "inline",
        promptReductionRatio: 0.42,
        baselineContextEstimate: 100,
        effectiveContextEstimate: 58,
        effectiveContextBlock: "## Context Minor GC Working Set\n- keep the latest ask",
        artifactPaths: {
          export: "/tmp/codex-export.json",
          summary: "/tmp/codex-telemetry.jsonl"
        },
        event: {
          artifact_paths: {
            export: "/tmp/export.json",
            summary: "/tmp/telemetry.jsonl"
          }
        }
      };
    }
  });

  assert.equal(observedInput.query, "继续默认开启 gc");
  assert.deepEqual(observedInput.config.guarded.allowedRelations, ["switch", "resolve", "continue"]);
  assert.deepEqual(observedInput.messages, [
    { role: "user", content: "先看现状" },
    { role: "assistant", content: "现状已确认。" },
    { role: "user", content: "继续默认开启 gc" }
  ]);
  assert.equal(result.contextMinorGc.applied, true);
  assert.equal(result.contextMinorGc.exportPath, "/tmp/codex-export.json");
  assert.equal(result.contextMinorGc.summaryPath, "/tmp/codex-telemetry.jsonl");
  assert.deepEqual(result.contextMinorGc.hostContext, {
    actualInputTokens: 1000,
    originalInputTokens: 1042,
    savedTokens: 42,
    modelContextWindow: 2000,
    reportedModelContextWindow: 2000,
    modelContextWindowCapped: false,
    softLimitRatio: 0.9,
    softLimitTokenCount: 1800,
    actualWindowRatio: 0.5,
    originalWindowRatio: 0.521,
    actualSoftLimitExceeded: false,
    originalSoftLimitExceeded: false,
    reductionRatio: 0.0403,
    riskLevel: "normal",
    recommendedAction: "continue"
  });
  assert.match(renderCodexVscodeContextMinorGcPrompt(result), /Context Minor GC Working Set/);
  assert.equal(
    renderCodexVscodeContextMinorGcFooter(result),
    "Context(估算): 最近一轮输入 1000，无GC估算 1042；窗口口径 2000，压缩比：4.0%（1000/1042），占窗口比例：50.0%（1000/2000）"
  );
  assert.equal(
    renderCodexVscodeContextMinorGcPrompt({
      contextMinorGc: {
        applied: false,
        effectiveContextBlock: "ignored"
      }
    }),
    ""
  );
  assert.equal(
    renderCodexVscodeContextMinorGcFooter({
      contextMinorGc: {
        applied: false,
        baselineContextEstimate: 100,
        effectiveContextEstimate: 100
      }
    }),
    ""
  );
  assert.match(
    renderCodexVscodeContextMinorGcFooter({
      contextMinorGc: {
        hostContext: {
          actualInputTokens: 1900,
          originalInputTokens: 2050,
          modelContextWindow: 2000,
          reportedModelContextWindow: 2000,
          modelContextWindowCapped: false,
          softLimitTokenCount: 1800,
          actualWindowRatio: 0.95,
          originalWindowRatio: 1.025,
          actualSoftLimitExceeded: true,
          originalSoftLimitExceeded: true,
          riskLevel: "critical",
          recommendedAction: "switch_thread_now",
          reductionRatio: 0.0732
        }
      }
    }),
    /最近一轮输入 1900，无GC估算 2050；窗口口径 2000，压缩比：7.3%（1900\/2050），占窗口比例：95.0%（1900\/2000）/
  );
});

test("buildCodexVscodeContextMinorGc feeds summary-first assistant context into the package builder", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-summary-first-"));
  const repoPath = "/tmp/unified-memory-core";
  const sessionPath = path.join(rootDir, "2026", "04", "18", "session.jsonl");
  const longAnswer = [
    "Context(估算): 最近一轮输入 155k，无GC估算 155k；窗口口径 258k，压缩比：0.0%（155k/155k），占窗口比例：60.1%（155k/258k）",
    "是，而且这次涨得快不是单纯因为多聊了几句，主要是我们上一轮为了排查问题，把很重的调试轨迹也写进了同一条 Codex session。",
    "最明显的是直接读 session jsonl 的命令，里面带了大段工具输出，甚至包含图片相关的大 payload。",
    "当前这条线程最近 12 次 last_token_usage.input_tokens 已经从 110k 涨到 125k+。",
    "后续我这边会避免再直接 dump 原始 session 文件，只做摘要读取。"
  ].join("\n\n");

  await writeSessionFile(sessionPath, [
    {
      type: "session_meta",
      payload: {
        id: "session-summary",
        cwd: repoPath,
        originator: "codex_vscode",
        source: "vscode"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "context 上涨非常快"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "agent_message",
        phase: "final_answer",
        message: longAnswer
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "继续"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          last_token_usage: {
            input_tokens: 1000,
            cached_input_tokens: 0,
            output_tokens: 0,
            reasoning_output_tokens: 0,
            total_tokens: 1000
          },
          model_context_window: 2000
        }
      }
    }
  ]);

  let observedInput = null;
  await buildCodexVscodeContextMinorGc({
    cwd: repoPath,
    sessionsRoot: rootDir,
    sessionId: "",
    packageBuilder: async (input) => {
      observedInput = input;
      return {
        enabled: true,
        status: "captured",
        reason: "",
        applied: false,
        relation: "continue",
        decisionTransport: "inline",
        promptReductionRatio: 0,
        baselineContextEstimate: 0,
        effectiveContextEstimate: 0,
        effectiveContextBlock: "",
        artifactPaths: {}
      };
    }
  });

  assert.ok(observedInput.messages[1].content.length <= 321);
  assert.doesNotMatch(observedInput.messages[1].content, /^Context\(估算\):/);
  assert.match(observedInput.messages[1].content, /这次涨得快/);
});

test("buildCodexVscodeContextMinorGc keeps the reported host window by default", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-window-cap-"));
  const repoPath = "/tmp/unified-memory-core";
  const sessionPath = path.join(rootDir, "2026", "04", "18", "session.jsonl");

  await writeSessionFile(sessionPath, [
    {
      type: "session_meta",
      payload: {
        id: "session-cap",
        cwd: repoPath,
        originator: "codex_vscode",
        source: "vscode"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "验证 compat"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          last_token_usage: {
            input_tokens: 198000,
            cached_input_tokens: 0,
            output_tokens: 0,
            reasoning_output_tokens: 0,
            total_tokens: 198000
          },
          model_context_window: 486000
        }
      }
    }
  ]);

  const result = await buildCodexVscodeContextMinorGc({
    cwd: repoPath,
    sessionsRoot: rootDir,
    sessionId: "",
    packageBuilder: async () => ({
      enabled: true,
      status: "captured",
      reason: "",
      applied: false,
      relation: "continue",
      decisionTransport: "inline",
      promptReductionRatio: 0,
      baselineContextEstimate: 0,
      effectiveContextEstimate: 0,
      effectiveContextBlock: "",
      artifactPaths: {}
    })
  });

  assert.equal(result.contextMinorGc.hostContext.modelContextWindow, 486000);
  assert.equal(result.contextMinorGc.hostContext.reportedModelContextWindow, 486000);
  assert.equal(result.contextMinorGc.hostContext.modelContextWindowCapped, false);
  assert.equal(result.contextMinorGc.hostContext.softLimitTokenCount, 437400);
  assert.equal(result.contextMinorGc.hostContext.actualWindowRatio, 0.4074);
  assert.match(
    renderCodexVscodeContextMinorGcFooter(result),
    /窗口口径 486k，压缩比：0.0%（198k\/198k），占窗口比例：40.7%（198k\/486k）/
  );
});

test("buildCodexVscodeContextMinorGc limits the forwarded recent message window by default", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-window-limit-"));
  const repoPath = "/tmp/unified-memory-core";
  const sessionPath = path.join(rootDir, "2026", "04", "18", "session.jsonl");
  const lines = [{
    type: "session_meta",
    payload: {
      id: "session-window-limit",
      cwd: repoPath,
      originator: "codex_vscode",
      source: "vscode"
    }
  }];

  for (let index = 1; index <= 18; index += 1) {
    lines.push({
      type: "event_msg",
      payload: {
        type: "user_message",
        message: `问题 ${index}`
      }
    });
  }

  await writeSessionFile(sessionPath, lines);

  let observedInput = null;
  await buildCodexVscodeContextMinorGc({
    cwd: repoPath,
    sessionsRoot: rootDir,
    sessionId: "",
    packageBuilder: async (input) => {
      observedInput = input;
      return {
        enabled: true,
        status: "captured",
        reason: "",
        applied: false,
        relation: "continue",
        decisionTransport: "inline",
        promptReductionRatio: 0,
        baselineContextEstimate: 0,
        effectiveContextEstimate: 0,
        effectiveContextBlock: "",
        artifactPaths: {}
      };
    }
  });

  assert.equal(observedInput.messages.length, 12);
  assert.equal(observedInput.messages[0].content, "问题 7");
  assert.equal(observedInput.messages.at(-1).content, "问题 18");
});

test("renderCodexVscodeContextMinorGcMarkdown stays concise by default and exposes details only in verbose mode", () => {
  const result = {
    status: "ok",
    query: "继续",
    extractedMessageCount: 3,
    session: {
      sessionId: "session-1",
      filePath: "/tmp/session.jsonl"
    },
    contextMinorGc: {
      status: "captured",
      applied: true,
      reason: "",
      relation: "continue",
      decisionTransport: "codex_exec",
      promptReductionRatio: 0.42,
      effectiveContextBlock: "## Context Minor GC Working Set\nTask state summary:\n收口用户体感",
      summaryPath: "/tmp/codex-telemetry.jsonl",
      exportPath: "/tmp/export.json",
      hostContext: {
        actualInputTokens: 1000,
        originalInputTokens: 1042,
        modelContextWindow: 2000,
        reportedModelContextWindow: 2000,
        modelContextWindowCapped: false,
        actualWindowRatio: 0.5,
        originalWindowRatio: 0.521,
        softLimitTokenCount: 1800,
        actualSoftLimitExceeded: false,
        riskLevel: "normal",
        recommendedAction: "continue",
        reductionRatio: 0.0403
      }
    }
  };

  const concise = renderCodexVscodeContextMinorGcMarkdown(result);
  assert.doesNotMatch(concise, /sessionPath/);
  assert.doesNotMatch(concise, /telemetry:/);
  assert.doesNotMatch(concise, /Context Minor GC Working Set/);
  assert.match(concise, /hostActualInputTokens/);

  const verbose = renderCodexVscodeContextMinorGcMarkdown(result, { verbose: true });
  assert.match(verbose, /sessionPath/);
  assert.match(verbose, /telemetry:/);
  assert.match(verbose, /Context Minor GC Working Set/);
});

test("buildCodexVscodeContextMinorGc includes recent host context history", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-history-"));
  const repoPath = "/tmp/unified-memory-core";
  const sessionPath = path.join(rootDir, "2026", "04", "18", "session.jsonl");

  await writeSessionFile(sessionPath, [
    {
      type: "session_meta",
      payload: {
        id: "session-history",
        cwd: repoPath,
        originator: "codex_vscode",
        source: "vscode"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "继续"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          last_token_usage: { input_tokens: 1000 },
          model_context_window: 2000
        }
      },
      timestamp: "2026-04-18T10:00:00.000Z"
    },
    {
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          last_token_usage: { input_tokens: 1200 },
          model_context_window: 2000
        }
      },
      timestamp: "2026-04-18T10:01:00.000Z"
    }
  ]);

  const result = await buildCodexVscodeContextMinorGc({
    cwd: repoPath,
    sessionsRoot: rootDir,
    sessionId: "",
    packageBuilder: async () => ({
      enabled: true,
      status: "captured",
      reason: "",
      applied: false,
      relation: "continue",
      decisionTransport: "inline",
      promptReductionRatio: 0,
      baselineContextEstimate: 100,
      effectiveContextEstimate: 100,
      effectiveContextBlock: "",
      artifactPaths: {}
    })
  });

  assert.equal(result.contextMinorGc.hostHistory.length, 2);
  assert.equal(result.contextMinorGc.hostHistory[0].inputTokens, 1000);
  assert.equal(result.contextMinorGc.hostHistory[1].inputTokens, 1200);
});

test("buildCodexVscodeContextMinorGc can use host-only fast path without invoking package builder", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-vscode-host-only-"));
  const repoPath = "/tmp/unified-memory-core";
  const sessionPath = path.join(rootDir, "2026", "04", "18", "session.jsonl");

  await writeSessionFile(sessionPath, [
    {
      type: "session_meta",
      payload: {
        id: "session-host-only",
        cwd: repoPath,
        originator: "codex_vscode",
        source: "vscode"
      }
    },
    {
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          last_token_usage: {
            input_tokens: 1500
          },
          model_context_window: 2000
        }
      }
    }
  ]);

  let packageBuilderCalled = false;
  const result = await buildCodexVscodeContextMinorGc({
    cwd: repoPath,
    sessionsRoot: rootDir,
    sessionId: "",
    contextMinorGc: {
      enabled: false
    },
    packageBuilder: async () => {
      packageBuilderCalled = true;
      throw new Error("packageBuilder should not be called in host-only mode");
    }
  });

  assert.equal(packageBuilderCalled, false);
  assert.equal(result.contextMinorGc.status, "host_only");
  assert.equal(result.contextMinorGc.hostContext.actualInputTokens, 1500);
});

test("renderCodexVscodeContext size views expose current size and trend", () => {
  const result = {
    contextMinorGc: {
      hostContext: {
        actualInputTokens: 1200,
        originalInputTokens: 1400,
        modelContextWindow: 2000,
        actualWindowRatio: 0.6,
        reductionRatio: 0.1429,
        riskLevel: "warning",
        recommendedAction: "keep_replies_terse"
      },
      hostHistory: [
        {
          timestamp: "2026-04-18T10:00:00.000Z",
          inputTokens: 900,
          modelContextWindow: 2000,
          actualWindowRatio: 0.45,
          riskLevel: "normal"
        },
        {
          timestamp: "2026-04-18T10:01:00.000Z",
          inputTokens: 1200,
          modelContextWindow: 2000,
          actualWindowRatio: 0.6,
          riskLevel: "warning"
        }
      ]
    }
  };

  assert.match(renderCodexVscodeContextMinorGcSizeLine(result), /Context Size: 1200 \/ 2000/);
  assert.match(renderCodexVscodeContextMinorGcPanel(result), /# Context Size/);
  assert.match(renderCodexVscodeContextMinorGcPanel(result), /# Context History/);
  assert.match(renderCodexVscodeContextMinorGcHistory(result), /\d{2}:\d{2}:\d{2}/);
});
