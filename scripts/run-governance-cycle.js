#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { auditFormalMemoryWorkspace } from "../src/formal-memory-audit.js";
import { auditSessionMemoryExitWorkspace } from "../src/session-memory-exit-audit.js";
import { auditFactConflicts } from "../src/fact-conflict-audit.js";
import { auditFactDuplicates } from "../src/fact-duplicate-audit.js";
import {
  applySafeArchiveCandidates,
  selectSafeArchiveCandidates
} from "../src/formal-memory-governance.js";
import { renderGovernanceCycleReport } from "../src/governance-cycle.js";

const execFileAsync = promisify(execFile);

function readFlag(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

function extractJsonPayload(stdout = "") {
  const text = String(stdout || "").trim();
  const start = text.search(/[\[{]/);
  if (start === -1) {
    throw new Error("No JSON payload found");
  }
  const candidate = text.slice(start);
  return JSON.parse(candidate);
}

const repoRoot = process.cwd();
const workspaceRoot = readFlag("--workspace", path.join(os.homedir(), ".openclaw", "workspace"));
const cardsPath = readFlag("--cards", path.join(repoRoot, "reports", "conversation-memory-cards.json"));
const date = readFlag("--date", new Date().toISOString().slice(0, 10));
const shouldWrite = process.argv.includes("--write");
const applySafe = process.argv.includes("--apply-safe");
const runLive = process.argv.includes("--run-live");
const timeoutMs = readFlag("--timeout-ms", "45000");
const label = readFlag("--label", `${date}-governance-cycle`);
const outputPath = readFlag(
  "--output",
  path.join(repoRoot, "reports", `governance-cycle-${date}.md`)
);
const archiveDir = path.join(workspaceRoot, "memory_archive", `${label}-safe-governance`);

const formalAudit = await auditFormalMemoryWorkspace(workspaceRoot);
const sessionExitAudit = await auditSessionMemoryExitWorkspace({ workspaceRoot, cardsPath });
const factConflictAudit = await auditFactConflicts({
  workspaceRoot,
  pluginRoot: repoRoot,
  cardsPath
});
const factDuplicateAudit = await auditFactDuplicates({
  workspaceRoot,
  pluginRoot: repoRoot,
  cardsPath
});
const safeCandidates = selectSafeArchiveCandidates(formalAudit);
const moved = applySafe ? await applySafeArchiveCandidates(safeCandidates, archiveDir) : [];
const postGovernanceFormalAudit = applySafe ? await auditFormalMemoryWorkspace(workspaceRoot) : null;

let liveRegression = null;
let memorySearchGovernance = null;
if (runLive) {
  const { stdout } = await execFileAsync(
    "npm",
    ["run", "eval:hot:critical", "--", "--timeout-ms", String(timeoutMs)],
    {
      cwd: repoRoot,
      maxBuffer: 4 * 1024 * 1024
    }
  );
  liveRegression = extractJsonPayload(stdout);
}

{
  const { stdout } = await execFileAsync(
    "npm",
    ["run", "eval:memory-search:governance", "--", "--date", date],
    {
      cwd: repoRoot,
      maxBuffer: 4 * 1024 * 1024
    }
  );
  memorySearchGovernance = extractJsonPayload(stdout);
}

const generatedAt = new Date().toISOString();
const result = {
  formalAudit,
  postGovernanceFormalAudit,
  sessionExitAudit,
  factConflictAudit,
  factDuplicateAudit,
  memorySearchGovernance,
  safeGovernance: {
    applied: applySafe,
    archiveDir,
    candidates: safeCandidates.map((item) => item.filePath),
    moved
  },
  liveRegression
};

const markdown = renderGovernanceCycleReport(result, {
  generatedAt,
  workspaceRoot
});

if (shouldWrite) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, "utf8");
}

console.log(JSON.stringify({
  generatedAt,
  workspaceRoot,
  cardsPath,
  outputPath,
  write: shouldWrite,
  applySafe,
  runLive,
  summary: {
    formalAudit: formalAudit.summary,
    postGovernanceFormalAudit: postGovernanceFormalAudit?.summary ?? null,
    sessionExitAudit: sessionExitAudit.summary,
    factConflictAudit: factConflictAudit.summary,
    factDuplicateAudit: factDuplicateAudit.summary,
    memorySearchGovernance: memorySearchGovernance?.summary ?? null,
    safeCandidates: safeCandidates.length,
    moved: moved.length,
    liveRegression: liveRegression?.summary ?? null
  }
}, null, 2));
