import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { auditFactDuplicates, renderFactDuplicateAuditReport } from "../src/fact-duplicate-audit.js";

test("auditFactDuplicates detects duplicate facts and slot values across sources", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-dup-audit-"));
  const workspaceRoot = path.join(tempDir, "workspace");
  const pluginRoot = path.join(tempDir, "plugin");
  await fs.mkdir(path.join(workspaceRoot, "memory"), { recursive: true });
  await fs.mkdir(pluginRoot, { recursive: true });

  await fs.writeFile(
    path.join(workspaceRoot, "MEMORY.md"),
    "- **姓名**: 刘超（超哥）\n- **出生年份说明**: 实际出生年份为 1983；身份证登记生日年份为 1982（历史登记错误，但证件信息客观如此）\n",
    "utf8"
  );
  await fs.writeFile(path.join(pluginRoot, "README.md"), "# plugin\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "project-roadmap.md"), "# roadmap\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "formal-memory-policy.md"), "# policy\n", "utf8");

  const cardsPath = path.join(tempDir, "cards.json");
  await fs.writeFile(
    cardsPath,
    JSON.stringify([
      {
        title: "身份与称呼",
        fact: "你叫刘超，我平时记你是超哥",
        sourcePath: "memory/2026-04-05.md",
        sourceChannel: "assistant-fact"
      },
      {
        title: "饮食偏好",
        fact: "你爱吃牛排",
        sourcePath: "memory/2026-04-05-food-preference.md",
        sourceChannel: "assistant-fact"
      }
    ]),
    "utf8"
  );

  const audit = await auditFactDuplicates({ workspaceRoot, pluginRoot, cardsPath });

  assert.equal(audit.summary.duplicateFacts, 1);
  assert.equal(audit.summary.duplicateSlotValues, 2);
  assert.equal(audit.summary.acceptableLayered, 0);
  assert.equal(audit.summary.review, 3);
  assert.equal(audit.duplicateFacts[0].fact, "你叫刘超，我平时记你是超哥");
  assert.ok(audit.duplicateSlotValues.some((entry) => entry.slot === "identity.legal_name" && entry.value === "刘超"));
});

test("auditFactDuplicates classifies memory-md plus daily duplication as acceptable layered redundancy", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-dup-layered-"));
  const workspaceRoot = path.join(tempDir, "workspace");
  const pluginRoot = path.join(tempDir, "plugin");
  await fs.mkdir(path.join(workspaceRoot, "memory"), { recursive: true });
  await fs.mkdir(pluginRoot, { recursive: true });

  await fs.writeFile(
    path.join(workspaceRoot, "MEMORY.md"),
    "- **出生年份说明**: 实际出生年份为 1983；身份证登记生日年份为 1982（历史登记错误，但证件信息客观如此）\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(workspaceRoot, "memory", "2026-04-05.md"),
    "- 用户确认：实际出生年份为 1983；身份证登记生日年份为 1982。这是历史登记错误，但作为身份证件信息属于客观事实。\n",
    "utf8"
  );
  await fs.writeFile(path.join(pluginRoot, "README.md"), "# plugin\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "project-roadmap.md"), "# roadmap\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "formal-memory-policy.md"), "# policy\n", "utf8");
  const cardsPath = path.join(tempDir, "cards.json");
  await fs.writeFile(cardsPath, "[]", "utf8");

  const audit = await auditFactDuplicates({ workspaceRoot, pluginRoot, cardsPath });

  assert.equal(audit.summary.duplicateFacts, 1);
  assert.equal(audit.summary.duplicateSlotValues, 2);
  assert.equal(audit.summary.acceptableLayered, 3);
  assert.equal(audit.summary.review, 0);
  assert.equal(audit.duplicateFacts[0].classification, "acceptable-layered");
  assert.ok(audit.duplicateSlotValues.every((entry) => entry.classification === "acceptable-layered"));
});

test("renderFactDuplicateAuditReport renders empty state", () => {
  const markdown = renderFactDuplicateAuditReport(
    {
      summary: {
        cardsScanned: 3,
        duplicateFacts: 0,
        duplicateSlotValues: 0,
        acceptableLayered: 0,
        review: 0
      },
      duplicateFacts: [],
      duplicateSlotValues: []
    },
    {
      generatedAt: "2026-04-05T00:00:00.000Z",
      workspaceRoot: "/tmp/workspace"
    }
  );

  assert.match(markdown, /重复事实数：`0`/);
  assert.match(markdown, /合理分层冗余：`0`/);
  assert.match(markdown, /需继续治理：`0`/);
  assert.match(markdown, /当前未发现跨来源重复事实/);
  assert.match(markdown, /当前未发现跨来源重复槽位值/);
});
