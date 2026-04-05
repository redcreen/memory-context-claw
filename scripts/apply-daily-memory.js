#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  collectConversationMemoryCandidates,
  mergeDailyPromotionBlock,
  selectPromotableDailyCandidates
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
const outputPath = readFlag("--output", path.join(workspaceRoot, "memory", `${date}.md`));

const result = await collectConversationMemoryCandidates(agentId, {
  sessionLimit,
  workspaceRoot
});
const candidates = selectPromotableDailyCandidates(result);

let existing = "";
try {
  existing = await fs.readFile(outputPath, "utf8");
} catch {}

const merged = mergeDailyPromotionBlock(existing, candidates, { date });

if (shouldWrite) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, merged, "utf8");
}

console.log(JSON.stringify({
  agentId,
  sessionLimit,
  date,
  outputPath,
  write: shouldWrite,
  promotableDaily: candidates.length,
  changed: merged !== existing
}, null, 2));
