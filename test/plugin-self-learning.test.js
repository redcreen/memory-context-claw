import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createCodexAdapterRuntime } from "../src/codex-adapter.js";
import { resolvePluginConfig } from "../src/config.js";
import {
  buildDeclaredSourcesFromConversationCandidates,
  compressNightlyCandidateText,
  createOpenClawSelfLearningService,
  getNextSelfLearningRunAt,
  isSelfLearningRunDue
} from "../src/plugin/self-learning-service.js";

test("resolvePluginConfig enables nightly self-learning at midnight by default", () => {
  const config = resolvePluginConfig({});
  assert.equal(config.selfLearning.enabled, true);
  assert.equal(config.selfLearning.localTime, "00:00");
});

test("buildDeclaredSourcesFromConversationCandidates keeps promotable or medium-confidence long-term candidates only", () => {
  const declaredSources = buildDeclaredSourcesFromConversationCandidates({
    longTerm: [
      {
        text: "MEMORY.md should only keep stable rules and preferences.",
        score: 12,
        recommendation: {
          action: "promote-memory-md",
          confidence: "high"
        }
      },
      {
        text: "MEMORY.md should keep stable rules and preferences.",
        score: 9,
        recommendation: {
          action: "review-memory-md",
          confidence: "medium"
        }
      },
      {
        text: "Unclear maybe something.",
        score: 4,
        recommendation: {
          action: "review-memory-md",
          confidence: "low"
        }
      },
      {
        text: "Already stored.",
        score: 10,
        recommendation: {
          action: "skip-memory-md-existing",
          confidence: "high"
        }
      }
    ]
  });

  assert.deepEqual(declaredSources, [
    {
      sourceType: "manual",
      declaredBy: "openclaw-plugin-nightly-self-learning",
      content: "MEMORY.md should only keep stable rules and preferences."
    }
  ]);
});

test("compressNightlyCandidateText keeps durable structured rules and drops transcript or progress noise", () => {
  assert.equal(
    compressNightlyCandidateText("好，那我现在就切回你要的形式：先不给总结，只给原始内容。[0.00-4.36]"),
    ""
  );
  assert.equal(
    compressNightlyCandidateText("`MEMORY.md` 应该放的是长期稳定、会被反复复用的内容。"),
    "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。"
  );
  assert.equal(
    compressNightlyCandidateText("直接用 skill 适合这两类：\n- 这件事有现成领域流程，容易踩坑\n- 这件事背后其实是一组工具，不是一个工具"),
    ""
  );
  assert.equal(
    compressNightlyCandidateText("涉及现成领域流程或多工具协同时，应该优先沉淀为 skill。"),
    "涉及现成领域流程或多工具协同时，应该优先沉淀为 skill。"
  );
  assert.equal(
    compressNightlyCandidateText("可以，这一项我已经开始补了，而且 4 个 skill 现在都已经有可执行脚本版的第一版骨架了。"),
    ""
  );
  assert.equal(
    compressNightlyCandidateText("模型记住的不是一条条孤立事实，而是信息之间如何彼此连接、靠近、联想和流动。"),
    ""
  );
});

test("self-learning due check waits until scheduled local time and only runs once per day", () => {
  const now = new Date("2026-04-11T00:30:00+08:00");
  assert.equal(
    isSelfLearningRunDue({
      now,
      localTime: "01:00",
      lastCompletedLocalDate: ""
    }),
    false
  );
  assert.equal(
    isSelfLearningRunDue({
      now,
      localTime: "00:00",
      lastCompletedLocalDate: "2026-04-10"
    }),
    true
  );
  assert.equal(
    isSelfLearningRunDue({
      now,
      localTime: "00:00",
      lastCompletedLocalDate: "2026-04-11"
    }),
    false
  );

  const nextRun = getNextSelfLearningRunAt(now, "00:00");
  assert.equal(nextRun.toISOString(), "2026-04-11T16:00:00.000Z");
});

test("self-learning service runs at startup when due, auto-promotes, and writes latest reports", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-nightly-"));
  const timers = [];
  const loggerMessages = [];
  let currentTime = new Date("2026-04-11T00:05:00+08:00");

  const service = createOpenClawSelfLearningService({
    clock: () => currentTime,
    logger: {
      info(message) {
        loggerMessages.push(String(message));
      },
      warn(message) {
        loggerMessages.push(String(message));
      }
    },
    setTimeout(callback, delay) {
      const timer = { callback, delay };
      timers.push(timer);
      return timer;
    },
    clearTimeout() {},
    pluginConfig: resolvePluginConfig({
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace"
        }
      }
    }),
    collector: async () => ({
      declaredSources: [
        {
          sourceType: "manual",
          declaredBy: "test-suite",
          content: "Remember this: the user prefers concise commit messages."
        }
      ],
      collector: {
        workspaceRoot: "/tmp/workspace",
        scannedAgents: [{ agentId: "main", declaredSources: 1 }],
        agentCount: 1,
        declaredSourceCount: 1
      }
    })
  });

  await service.start();

  const state = await service.readState();
  assert.equal(state.lastCompletedLocalDate, "2026-04-11");
  assert.equal(state.lastStatus, "completed");
  assert.ok(state.lastRunId);
  assert.ok(state.latestReportJsonPath.endsWith("daily-reflection-latest.json"));
  assert.ok(state.latestReportMarkdownPath.endsWith("daily-reflection-latest.md"));

  const records = await service.runtime.registry.listRecords();
  assert.ok(records.some((record) => record.record_type === "stable_artifact"));

  const latestReport = JSON.parse(await fs.readFile(state.latestReportJsonPath, "utf8"));
  assert.equal(latestReport.collector.declaredSourceCount, 1);
  assert.equal(latestReport.report.promoted_stable_artifacts.length, 1);

  const latestMarkdown = await fs.readFile(state.latestReportMarkdownPath, "utf8");
  assert.match(latestMarkdown, /promotedStableArtifacts: `1`/);
  assert.equal(timers.length, 1);
  assert.match(loggerMessages.join("\n"), /nightly self-learning completed/);
});

test("self-learning service reuses existing stable artifacts on repeated runs", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-nightly-"));
  const service = createOpenClawSelfLearningService({
    clock: () => new Date("2026-04-11T00:05:00+08:00"),
    setTimeout() {
      return {};
    },
    clearTimeout() {},
    pluginConfig: resolvePluginConfig({
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace"
        }
      }
    }),
    collector: async () => ({
      declaredSources: [
        {
          sourceType: "manual",
          declaredBy: "test-suite",
          content: "Remember this: the user prefers concise commit messages."
        }
      ],
      collector: {
        workspaceRoot: "/tmp/workspace",
        scannedAgents: [{ agentId: "main", declaredSources: 1 }],
        agentCount: 1,
        declaredSourceCount: 1
      }
    })
  });

  const first = await service.runNow("manual-first");
  const second = await service.runNow("manual-second");
  const stableRecords = await service.runtime.registry.listRecords({
    recordType: "stable_artifact",
    state: "stable"
  });

  assert.equal(first.report.promoted_stable_artifacts.length, 1);
  assert.equal((first.report.reused_stable_artifacts || []).length, 0);
  assert.equal(second.report.promoted_stable_artifacts.length, 0);
  assert.equal((second.report.reused_stable_artifacts || []).length, 1);
  assert.equal(stableRecords.length, 1);
});

test("self-learning service can write nightly learning into agent sub namespaces", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-nightly-agent-"));
  const service = createOpenClawSelfLearningService({
    clock: () => new Date("2026-04-11T00:05:00+08:00"),
    setTimeout() {
      return {};
    },
    clearTimeout() {},
    pluginConfig: resolvePluginConfig({
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "demo-workspace",
          agentNamespace: {
            enabled: true
          }
        }
      }
    }),
    collector: async () => ({
      declaredSources: [
        {
          sourceType: "manual",
          declaredBy: "test-suite:code",
          namespace: {
            tenant: "local",
            scope: "workspace",
            resource: "openclaw-shared-memory",
            key: "demo-workspace.agent.code"
          },
          content: "Code agent should prefer governed memory."
        }
      ],
      collector: {
        workspaceRoot: "/tmp/workspace",
        scannedAgents: [{ agentId: "code", declaredSources: 1 }],
        agentCount: 1,
        declaredSourceCount: 1
      }
    })
  });

  await service.runNow("manual-agent");

  const stableRecords = await service.runtime.registry.listRecords({
    recordType: "stable_artifact",
    state: "stable"
  });

  assert.equal(stableRecords.length, 1);
  assert.equal(stableRecords[0].namespace.key, "demo-workspace.agent.code");
});

test("self-learning service can route one agent into an overridden workspace without moving others", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-nightly-agent-workspace-"));
  const service = createOpenClawSelfLearningService({
    clock: () => new Date("2026-04-11T00:05:00+08:00"),
    setTimeout() {
      return {};
    },
    clearTimeout() {},
    pluginConfig: resolvePluginConfig({
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "default-workspace",
          agentWorkspaceIds: {
            code: "code-workspace"
          },
          agentNamespace: {
            enabled: true
          }
        }
      }
    }),
    collector: async () => ({
      declaredSources: [
        {
          sourceType: "manual",
          declaredBy: "test-suite:code",
          namespace: {
            tenant: "local",
            scope: "workspace",
            resource: "openclaw-shared-memory",
            key: "code-workspace.agent.code"
          },
          content: "Code workspace-specific stable rule."
        }
      ],
      collector: {
        workspaceRoot: "/tmp/workspace",
        scannedAgents: [{ agentId: "code", declaredSources: 1 }],
        agentCount: 1,
        declaredSourceCount: 1
      }
    })
  });

  await service.runNow("manual-code-workspace");

  const stableRecords = await service.runtime.registry.listRecords({
    recordType: "stable_artifact",
    state: "stable"
  });

  assert.equal(stableRecords.length, 1);
  assert.equal(stableRecords[0].namespace.key, "code-workspace.agent.code");
});

test("self-learning service can ingest Codex write-back signals into the nightly learning pipeline", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-nightly-codex-"));
  const clock = () => new Date("2026-04-11T00:05:00+08:00");
  const codexRuntime = createCodexAdapterRuntime({
    clock,
    logger: { info() {} },
    config: {
      registryDir: registryRoot,
      scope: "workspace",
      resource: "openclaw-shared-memory",
      workspaceId: "code-workspace",
      agentId: "code",
      agentNamespaceEnabled: true
    }
  });

  await codexRuntime.writeAfterTask({
    taskId: "task_code_nightly",
    taskTitle: "实现 code 记忆",
    summary: "Remember this: for code-workspace, code agent should prefer small, focused patches."
  });

  const service = createOpenClawSelfLearningService({
    clock,
    setTimeout() {
      return {};
    },
    clearTimeout() {},
    pluginConfig: resolvePluginConfig({
      openclawAdapter: {
        governedExports: {
          registryDir: registryRoot,
          workspaceId: "default-workspace",
          agentWorkspaceIds: {
            code: "code-workspace"
          },
          agentNamespace: {
            enabled: true
          }
        }
      }
    }),
    collector: async () => ({
      declaredSources: [],
      collector: {
        workspaceRoot: "/tmp/workspace",
        scannedAgents: [],
        agentCount: 0,
        declaredSourceCount: 0
      }
    })
  });

  const result = await service.runNow("manual-codex-nightly");
  assert.equal(result.report.summary.sources.source_count, 1);
  assert.ok(result.report.summary.reflection.candidate_count >= 1);
  assert.ok(result.report.promotion_review.length >= 1);

  const state = await service.readState();
  const latestReport = JSON.parse(await fs.readFile(state.latestReportJsonPath, "utf8"));
  assert.equal(latestReport.codexCollector.declaredSourceCount, 1);
});
