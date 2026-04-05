import test from "node:test";
import assert from "node:assert/strict";

import {
  auditSessionMemoryExitContent,
  isSessionMemoryFile,
  renderSessionMemoryExitAuditReport
} from "../src/session-memory-exit-audit.js";

test("isSessionMemoryFile detects host-generated session-memory markdown", () => {
  const raw = [
    "# Session: 2026-04-05 01:28:57 UTC",
    "- **Session Key**: agent:main:telegram:direct:8705812936",
    "## Conversation Summary",
    "Sender (untrusted metadata):"
  ].join("\n");

  assert.equal(isSessionMemoryFile(raw), true);
});

test("auditSessionMemoryExitContent marks assistant-fact-backed session memory as card-backed-fact", () => {
  const result = auditSessionMemoryExitContent(
    "/tmp/workspace/memory/2026-04-05-food-preference.md",
    "## Conversation Summary",
    [
      {
        sourcePath: "memory/2026-04-05-food-preference.md",
        sourceChannel: "assistant-fact",
        fact: "你爱吃牛排"
      }
    ]
  );

  assert.equal(result.status, "card-backed-fact");
  assert.equal(result.assistantFactCount, 1);
  assert.deepEqual(result.facts, ["你爱吃牛排"]);
});

test("renderSessionMemoryExitAuditReport includes summary and fact list", () => {
  const markdown = renderSessionMemoryExitAuditReport(
    {
      summary: { total: 1, cardBackedFact: 1, cardBackedReview: 0, rawOnly: 0 },
      results: [
        {
          basename: "2026-04-05-food-preference.md",
          filePath: "/tmp/workspace/memory/2026-04-05-food-preference.md",
          status: "card-backed-fact",
          cardCount: 1,
          assistantFactCount: 1,
          facts: ["你爱吃牛排"]
        }
      ]
    },
    {
      workspaceRoot: "/tmp/workspace",
      cardsPath: "/tmp/cards.json",
      generatedAt: "2026-04-05T00:00:00.000Z"
    }
  );

  assert.match(markdown, /Session-Memory Exit Audit/);
  assert.match(markdown, /card-backed-fact/);
  assert.match(markdown, /你爱吃牛排/);
});
