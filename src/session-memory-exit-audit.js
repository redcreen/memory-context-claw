import fs from "node:fs/promises";
import path from "node:path";

const SESSION_MEMORY_PATTERNS = [
  /Conversation Summary/,
  /Sender \(untrusted metadata\)/,
  /Session Key:/,
  /Session ID:/,
  /A new session was started/
];

export function isSessionMemoryFile(raw = "") {
  const text = String(raw || "");
  return SESSION_MEMORY_PATTERNS.some((pattern) => pattern.test(text));
}

export function auditSessionMemoryExitContent(filePath, raw, cards = []) {
  const relativePath = `memory/${path.basename(filePath)}`;
  const matchingCards = cards.filter((card) => String(card?.sourcePath || "") === relativePath);
  const assistantFactCards = matchingCards.filter((card) => String(card?.sourceChannel || "") === "assistant-fact");
  const policySafeCards = matchingCards.filter((card) =>
    ["assistant-fact", "memory-md", "memory-daily", "formal-policy"].includes(String(card?.sourceChannel || ""))
  );

  const status =
    assistantFactCards.length > 0
      ? "card-backed-fact"
      : policySafeCards.length > 0
        ? "card-backed-review"
        : "raw-only";

  return {
    filePath,
    basename: path.basename(filePath),
    relativePath,
    status,
    cardCount: matchingCards.length,
    assistantFactCount: assistantFactCards.length,
    facts: matchingCards.map((card) => String(card?.fact || "")).filter(Boolean)
  };
}

export async function auditSessionMemoryExitWorkspace({ workspaceRoot, cardsPath }) {
  const memoryDir = path.join(workspaceRoot, "memory");
  let cards = [];

  try {
    const rawCards = await fs.readFile(cardsPath, "utf8");
    const parsed = JSON.parse(rawCards);
    if (Array.isArray(parsed)) {
      cards = parsed;
    }
  } catch {}

  const entries = await fs.readdir(memoryDir);
  const results = [];

  for (const entry of entries.sort()) {
    if (!entry.endsWith(".md")) {
      continue;
    }
    const fullPath = path.join(memoryDir, entry);
    let raw = "";
    try {
      raw = await fs.readFile(fullPath, "utf8");
    } catch {
      continue;
    }
    if (!isSessionMemoryFile(raw)) {
      continue;
    }
    results.push(auditSessionMemoryExitContent(fullPath, raw, cards));
  }

  return {
    summary: {
      total: results.length,
      cardBackedFact: results.filter((item) => item.status === "card-backed-fact").length,
      cardBackedReview: results.filter((item) => item.status === "card-backed-review").length,
      rawOnly: results.filter((item) => item.status === "raw-only").length
    },
    results
  };
}

export function renderSessionMemoryExitAuditReport(audit, { workspaceRoot, generatedAt, cardsPath } = {}) {
  const lines = [];
  lines.push("# Session-Memory Exit Audit");
  if (generatedAt) {
    lines.push(`- 生成时间：${generatedAt}`);
  }
  if (workspaceRoot) {
    lines.push(`- 工作区：${workspaceRoot}`);
  }
  if (cardsPath) {
    lines.push(`- Card 源：${cardsPath}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(`- session-memory 文件数：\`${audit.summary.total}\``);
  lines.push(`- card-backed-fact：\`${audit.summary.cardBackedFact}\``);
  lines.push(`- card-backed-review：\`${audit.summary.cardBackedReview}\``);
  lines.push(`- raw-only：\`${audit.summary.rawOnly}\``);
  lines.push("");

  for (const item of audit.results) {
    lines.push(`## ${item.basename}`);
    lines.push(`- 路径：${item.filePath}`);
    lines.push(`- 状态：${item.status}`);
    lines.push(`- card 数：${item.cardCount}`);
    lines.push(`- assistant-fact 数：${item.assistantFactCount}`);
    if (item.facts.length) {
      lines.push("- card facts：");
      for (const fact of item.facts) {
        lines.push(`  - ${fact}`);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
