#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  collectConversationMemoryCandidates,
  renderConversationMemoryReport
} from "../src/conversation-memory.js";

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

const agentId = readFlag("--agent", "main");
const sessionLimit = Number(readFlag("--sessions", "8"));
const outputPath = readFlag(
  "--output",
  path.join(repoRoot, "reports", "conversation-memory-candidates.md")
);

const result = await collectConversationMemoryCandidates(agentId, { sessionLimit });
const markdown = renderConversationMemoryReport(result, {
  agentId,
  workspaceRoot: path.resolve(repoRoot, "..")
});

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, markdown, "utf8");

console.log(JSON.stringify({
  agentId,
  sessionLimit,
  outputPath,
  files: result.files.length,
  messages: result.messages.length,
  longTerm: result.longTerm.length,
  daily: result.daily.length
}, null, 2));
