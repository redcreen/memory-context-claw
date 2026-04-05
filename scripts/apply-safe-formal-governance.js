#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { auditFormalMemoryWorkspace } from "../src/formal-memory-audit.js";
import {
  applySafeArchiveCandidates,
  selectSafeArchiveCandidates
} from "../src/formal-memory-governance.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function readFlag(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

const workspaceRoot = readFlag(
  "--workspace",
  path.join(process.env.HOME || "", ".openclaw", "workspace")
);
const shouldWrite = process.argv.includes("--write");
const label = readFlag("--label", new Date().toISOString().slice(0, 10));
const archiveDir = readFlag(
  "--archive-dir",
  path.join(workspaceRoot, "memory_archive", `${label}-safe-governance`)
);

const audit = await auditFormalMemoryWorkspace(workspaceRoot);
const candidates = selectSafeArchiveCandidates(audit);
const moved = shouldWrite ? await applySafeArchiveCandidates(candidates, archiveDir) : [];

console.log(JSON.stringify({
  workspaceRoot,
  archiveDir,
  write: shouldWrite,
  candidates: candidates.map((item) => item.filePath),
  moved
}, null, 2));
