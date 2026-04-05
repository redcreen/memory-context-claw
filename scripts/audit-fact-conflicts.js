#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { auditFactConflicts, renderFactConflictAuditReport } from "../src/fact-conflict-audit.js";

function readFlag(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

const repoRoot = process.cwd();
const shouldWrite = process.argv.includes("--write");
const workspaceRoot = readFlag("--workspace", path.join(os.homedir(), ".openclaw", "workspace"));
const cardsPath = readFlag("--cards", path.join(repoRoot, "reports", "conversation-memory-cards.json"));
const outputPath = readFlag(
  "--output",
  path.join(repoRoot, "reports", `fact-conflict-audit-${new Date().toISOString().slice(0, 10)}.md`)
);

const audit = await auditFactConflicts({
  workspaceRoot,
  pluginRoot: repoRoot,
  cardsPath
});

const markdown = renderFactConflictAuditReport(audit, {
  generatedAt: new Date().toISOString(),
  workspaceRoot
});

if (shouldWrite) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, "utf8");
}

console.log(JSON.stringify({
  workspaceRoot,
  cardsPath,
  outputPath,
  write: shouldWrite,
  summary: audit.summary
}, null, 2));
