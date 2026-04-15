import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("default answer-level formal gate keeps the stable 12-case slice", async () => {
  const scriptPath = path.resolve("scripts/eval-openclaw-cli-agent-answer-matrix.js");
  const raw = await fs.readFile(scriptPath, "utf8");
  const match = raw.match(/const defaultFormalGateCaseIds = \[(?<body>[\s\S]*?)\];/u);
  assert.ok(match?.groups?.body, "defaultFormalGateCaseIds should be defined");

  const ids = [...match.groups.body.matchAll(/"([^"]+)"/gu)].map((item) => item[1]);
  assert.equal(ids.length, 12, "formal gate should stay on the stable 12-case slice");
  assert.ok(ids.includes("agent-history-editor-1"));
  assert.ok(ids.includes("agent-zh-natural-project-1"));
  assert.ok(ids.includes("agent-negative-1"));
});
