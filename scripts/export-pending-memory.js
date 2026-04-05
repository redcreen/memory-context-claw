#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  collectConversationMemoryCandidates,
  renderPendingDailyReviewBlock,
  selectPendingDailyCandidates
} from "../src/conversation-memory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(repoRoot, "..");

function readFlag(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

const shouldWrite = process.argv.includes("--write");
const agentId = readFlag("--agent", "main");
const sessionLimit = Number(readFlag("--sessions", "8"));
const date = readFlag("--date", new Date().toISOString().slice(0, 10));
const outputPath = readFlag(
  "--output",
  path.join(repoRoot, "reports", `pending-memory-candidates-${date}.md`)
);

const result = await collectConversationMemoryCandidates(agentId, {
  sessionLimit,
  workspaceRoot
});
const candidates = selectPendingDailyCandidates(result);
const content = renderPendingDailyReviewBlock(candidates, { date });

if (shouldWrite) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, "utf8");
}

console.log(
  JSON.stringify(
    {
      agentId,
      sessionLimit,
      date,
      outputPath,
      write: shouldWrite,
      pendingDaily: candidates.length
    },
    null,
    2
  )
);
