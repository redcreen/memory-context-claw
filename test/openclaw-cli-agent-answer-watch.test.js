import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("deeper answer-level watch matrix covers cross-source, history, and natural Chinese", async () => {
  const scriptPath = path.resolve("scripts/eval-openclaw-cli-agent-answer-watch.js");
  const raw = await fs.readFile(scriptPath, "utf8");
  const match = raw.match(/const defaultWatchCaseIds = \[(?<body>[\s\S]*?)\];/u);
  assert.ok(match?.groups?.body, "defaultWatchCaseIds should be defined");

  const ids = [...match.groups.body.matchAll(/"([^"]+)"/gu)].map((item) => item[1]);
  assert.ok(ids.length >= 16);
  assert.ok(ids.some((item) => item.includes("cross-source")));
  assert.ok(ids.some((item) => item.includes("history")));

  const zhBearing = ids.filter((item) => item.includes("agent-zh")).length;
  const zhNatural = ids.filter((item) => item.includes("agent-zh-natural")).length;
  assert.ok(zhBearing / ids.length >= 0.5);
  assert.ok(zhNatural >= 6);
});
