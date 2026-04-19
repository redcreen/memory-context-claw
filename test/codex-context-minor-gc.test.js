import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildCodexContextMinorGcPackage } from "../src/codex-context-minor-gc.js";

test("buildCodexContextMinorGcPackage writes codex-specific telemetry for the final applied result", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-gc-"));
  const result = await buildCodexContextMinorGcPackage({
    sessionKey: "codex:vscode:test-session",
    query: "继续收敛当前问题",
    messages: [
      { role: "user", content: "先确认现状，旧背景 A 旧背景 A 旧背景 A 旧背景 A 旧背景 A。" },
      { role: "assistant", content: "现状已经确认，旧解释 B 旧解释 B 旧解释 B 旧解释 B 旧解释 B。" },
      { role: "user", content: "补充旧问题 C 旧问题 C 旧问题 C 旧问题 C。" },
      { role: "assistant", content: "收到，开始转到当前主线。" },
      { role: "user", content: "继续收敛当前问题" }
    ],
    config: {
      enabled: true,
      outputDir,
      transport: "auto",
      guarded: {
        enabled: true,
        allowedRelations: ["continue"],
        minReductionRatio: 0,
        minEvictedTurns: 1
      }
    },
    decisionRunner: async () => ({
      relation: "continue",
      evict_turn_ids: ["t1", "t2", "t3"],
      pin_turn_ids: []
    })
  });

  assert.equal(result.applied, true);
  assert.equal(result.codexGuardReason, "codex_packaged_guard");
  assert.ok(result.promptReductionRatio > 0);
  assert.match(result.artifactPaths.summary, /codex-telemetry\.jsonl$/);
  assert.match(result.artifactPaths.export, /codex-packaged\.json$/);

  const telemetryLines = (await fs.readFile(result.artifactPaths.summary, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean);
  const latestTelemetry = JSON.parse(telemetryLines.at(-1));
  assert.equal(latestTelemetry.schema_version, "umc.codex-context-minor-gc.v1");
  assert.equal(latestTelemetry.applied, true);
  assert.equal(latestTelemetry.relation, "continue");
  assert.match(latestTelemetry.shadow_summary_path, /telemetry\.jsonl$/);

  const exportPayload = JSON.parse(await fs.readFile(result.artifactPaths.export, "utf8"));
  assert.equal(exportPayload.schema_version, "umc.codex-context-minor-gc.v1");
  assert.equal(exportPayload.applied, true);
  assert.equal(exportPayload.session_key, "codex:vscode:test-session");
});

test("buildCodexContextMinorGcPackage prefers summary-first task state over active raw turns", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-gc-summary-"));
  const oldUserContext = "旧背景和排查步骤 A A A A A A A。".repeat(24);
  const oldAssistantContext = "这是很长的旧解释和诊断输出 B B B B B B B。".repeat(24);
  const result = await buildCodexContextMinorGcPackage({
    sessionKey: "codex:vscode:summary-session",
    query: "继续收口体感问题",
    messages: [
      { role: "user", content: oldUserContext },
      { role: "assistant", content: oldAssistantContext },
      { role: "user", content: "现在只关心怎么让用户明显感觉线程更薄。" }
    ],
    config: {
      enabled: true,
      outputDir,
      transport: "auto",
      guarded: {
        enabled: true,
        allowedRelations: ["continue"],
        minReductionRatio: 0,
        minEvictedTurns: 1
      }
    },
    decisionRunner: async () => ({
      relation: "continue",
      evict_turn_ids: ["t1", "t2"],
      pin_turn_ids: [],
      archive_summary: "当前只保留体感收口、增长源控制和 summary-first。"
    })
  });

  assert.equal(result.applied, true);
  assert.match(result.effectiveContextBlock, /Task state summary:/);
  assert.match(result.effectiveContextBlock, /Latest user ask:/);
  assert.doesNotMatch(result.effectiveContextBlock, /Active raw turns:/);
});
