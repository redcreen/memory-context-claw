import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  auditSessionMemoryExitWorkspace,
  renderSessionMemoryExitAuditReport
} from "../src/session-memory-exit-audit.js";

const args = process.argv.slice(2);
const write = args.includes("--write");

function readFlagValue(flag, fallback = "") {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return args[index + 1];
}

const workspaceRoot = readFlagValue("--workspace", path.join(os.homedir(), ".openclaw", "workspace"));
const cardsPath = readFlagValue(
  "--cards",
  path.resolve(process.cwd(), "reports", "conversation-memory-cards.json")
);
const outputPath = readFlagValue(
  "--output",
  path.resolve(process.cwd(), "reports", `session-memory-exit-audit-${new Date().toISOString().slice(0, 10)}.md`)
);

const audit = await auditSessionMemoryExitWorkspace({ workspaceRoot, cardsPath });
const markdown = renderSessionMemoryExitAuditReport(audit, {
  workspaceRoot,
  cardsPath,
  generatedAt: new Date().toISOString()
});

if (write) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, "utf8");
}

console.log(JSON.stringify({ workspaceRoot, cardsPath, outputPath, write, summary: audit.summary }, null, 2));
