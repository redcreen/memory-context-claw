import test from "node:test";
import assert from "node:assert/strict";

import {
  auditFormalMemoryContent,
  renderFormalMemoryAuditReport
} from "../src/formal-memory-audit.js";

test("auditFormalMemoryContent marks pending-style values as pending-risk", () => {
  const result = auditFormalMemoryContent(
    "/tmp/memory/2026-04-05.md",
    "- 用户说明一条待校验信息：该表述明显存在笔误或歧义，暂不作为已确认身份信息使用。"
  );

  assert.equal(result.status, "pending-risk");
  assert.ok(result.reasons.some((item) => item.startsWith("pending:")));
});

test("auditFormalMemoryContent marks runtime process docs for archive review", () => {
  const result = auditFormalMemoryContent(
    "/tmp/memory/2026-04-02-ok1-reminder.md",
    [
      "# Session: 2026-04-02 15:38:58 UTC",
      "- **Session Key**: agent:main:telegram:direct:8705812936",
      "## Conversation Summary",
      "user: 1分钟后回复我ok1",
      "assistant: ok1"
    ].join("\n")
  );

  assert.equal(result.status, "archive-review");
  assert.ok(result.reasons.some((item) => item.startsWith("archive-hint:")));
});

test("auditFormalMemoryContent keeps stable confirmed facts clean", () => {
  const result = auditFormalMemoryContent(
    "/tmp/memory/2026-04-05.md",
    [
      "# 2026-04-05",
      "- 用户新增家庭与生日信息：超哥生日为 1983-02-06；农历生日为腊月二十四。",
      "- 用户女儿名叫刘子妍，生日为 2014-12-29，当前上五年级。"
    ].join("\n")
  );

  assert.equal(result.status, "clean");
  assert.equal(result.reasons.length, 0);
});

test("auditFormalMemoryContent does not treat schema field names like /status as runtime noise", () => {
  const result = auditFormalMemoryContent(
    "/tmp/memory/2026-04-02.md",
    [
      "# Session Notes",
      "- task schema 包含 `agent_id/session_key/channel/chat_id/task_id/last_user_visible_update_at/status` 等字段。"
    ].join("\n")
  );

  assert.equal(result.status, "clean");
  assert.equal(result.reasons.length, 0);
});

test("renderFormalMemoryAuditReport includes summary and flagged files", () => {
  const markdown = renderFormalMemoryAuditReport(
    {
      summary: { total: 2, clean: 1, pendingRisk: 1, archiveReview: 0 },
      results: [
        {
          basename: "2026-04-05.md",
          filePath: "/tmp/memory/2026-04-05.md",
          status: "pending-risk",
          reasons: ["pending:/待确认/"]
        },
        {
          basename: "MEMORY.md",
          filePath: "/tmp/MEMORY.md",
          status: "clean",
          reasons: []
        }
      ]
    },
    {
      workspaceRoot: "/tmp",
      generatedAt: "2026-04-05T05:00:00.000Z"
    }
  );

  assert.match(markdown, /正式记忆层巡检报告/);
  assert.match(markdown, /pending-risk/);
  assert.match(markdown, /2026-04-05.md/);
});
