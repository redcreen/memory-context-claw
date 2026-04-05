#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  auditFormalMemoryWorkspace,
  renderFormalMemoryAuditReport
} from "../src/formal-memory-audit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const workspaceRoot = readFlag(
  "--workspace",
  path.join(os.homedir(), ".openclaw", "workspace")
);

function readFlag(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

const shouldWrite = process.argv.includes("--write");
const date = readFlag("--date", new Date().toISOString().slice(0, 10));
const outputPath = readFlag(
  "--output",
  path.join(repoRoot, "reports", `formal-memory-audit-${date}.md`)
);

const audit = await auditFormalMemoryWorkspace(workspaceRoot);
const generatedAt = new Date().toISOString();
const markdown = renderFormalMemoryAuditReport(audit, {
  workspaceRoot,
  generatedAt
});

if (shouldWrite) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, "utf8");
}

console.log(JSON.stringify({
  workspaceRoot,
  generatedAt,
  outputPath,
  write: shouldWrite,
  summary: audit.summary
}, null, 2));
