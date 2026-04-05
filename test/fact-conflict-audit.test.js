import test from "node:test";
import assert from "node:assert/strict";
import { renderFactConflictAuditReport } from "../src/fact-conflict-audit.js";

test("renderFactConflictAuditReport renders no-conflict summary", () => {
  const markdown = renderFactConflictAuditReport(
    {
      summary: { slotsScanned: 4, conflicts: 0 },
      conflicts: []
    },
    {
      generatedAt: "2026-04-05T00:00:00.000Z",
      workspaceRoot: "/tmp/workspace"
    }
  );

  assert.match(markdown, /Fact Conflict Audit/);
  assert.match(markdown, /冲突槽位数：`0`/);
  assert.match(markdown, /当前未发现多值冲突槽位/);
});

test("renderFactConflictAuditReport renders conflicting slot values", () => {
  const markdown = renderFactConflictAuditReport(
    {
      summary: { slotsScanned: 2, conflicts: 1 },
      conflicts: [
        {
          slot: "preference.food",
          values: [
            {
              value: "牛排",
              items: [
                {
                  sourcePath: "memory/2026-04-05.md",
                  sourceChannel: "memory-daily",
                  fact: "你爱吃牛排"
                }
              ]
            },
            {
              value: "面食",
              items: [
                {
                  sourcePath: "sessions/old.jsonl",
                  sourceChannel: "assistant-conclusion",
                  fact: "你爱吃面食"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      generatedAt: "2026-04-05T00:00:00.000Z",
      workspaceRoot: "/tmp/workspace"
    }
  );

  assert.match(markdown, /preference\.food/);
  assert.match(markdown, /牛排/);
  assert.match(markdown, /面食/);
});
