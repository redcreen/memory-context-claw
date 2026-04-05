import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildPolicyCardsFromMarkdown,
  buildProjectCardsFromMarkdown,
  buildStableMemoryCardsFromMarkdown
} from "./retrieval.js";

const DEFAULT_WORKSPACE_ROOT = path.join(os.homedir(), ".openclaw", "workspace");

function collectSlotFacts(card) {
  const fact = String(card?.fact || "");
  const slots = [];

  const foodMatch = fact.match(/你爱吃([^，。；、\s]+)/);
  if (foodMatch) {
    slots.push({ slot: "preference.food", value: foodMatch[1] });
  }

  const nameMatch = fact.match(/你叫([^，。；、\s]+).*记你是([^，。；、\s]+)/);
  if (nameMatch) {
    slots.push({ slot: "identity.legal_name", value: nameMatch[1] });
    slots.push({ slot: "identity.preferred_name", value: nameMatch[2] });
  }

  const actualBirthYearMatch = fact.match(/实际出生年份是(\d{4})/);
  if (actualBirthYearMatch) {
    slots.push({ slot: "identity.actual_birth_year", value: actualBirthYearMatch[1] });
  }

  const idBirthYearMatch = fact.match(/身份证登记生日年份是(\d{4})/);
  if (idBirthYearMatch) {
    slots.push({ slot: "identity.id_birth_year", value: idBirthYearMatch[1] });
  }

  return slots;
}

async function readWorkspaceStableCards(workspaceRoot) {
  const cards = [];
  const rootMemoryPath = path.join(workspaceRoot, "MEMORY.md");
  try {
    const raw = await fs.readFile(rootMemoryPath, "utf8");
    cards.push(...buildStableMemoryCardsFromMarkdown(raw, "MEMORY.md"));
  } catch {}

  const dailyDir = path.join(workspaceRoot, "memory");
  try {
    const entries = (await fs.readdir(dailyDir)).filter((entry) => /^\d{4}-\d{2}-\d{2}\.md$/.test(entry));
    for (const entry of entries.sort()) {
      const raw = await fs.readFile(path.join(dailyDir, entry), "utf8");
      cards.push(...buildStableMemoryCardsFromMarkdown(raw, `memory/${entry}`));
    }
  } catch {}

  return cards;
}

async function readPluginStableCards(pluginRoot) {
  const cards = [];
  for (const fileName of ["README.md", "project-roadmap.md"]) {
    try {
      const raw = await fs.readFile(path.join(pluginRoot, fileName), "utf8");
      cards.push(...buildProjectCardsFromMarkdown(raw, fileName));
    } catch {}
  }
  try {
    const raw = await fs.readFile(path.join(pluginRoot, "formal-memory-policy.md"), "utf8");
    cards.push(...buildPolicyCardsFromMarkdown(raw, "formal-memory-policy.md"));
  } catch {}
  return cards;
}

export async function auditFactConflicts({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  pluginRoot,
  cardsPath
}) {
  const mergedCards = [];

  try {
    const raw = await fs.readFile(cardsPath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      mergedCards.push(...parsed);
    }
  } catch {}

  mergedCards.push(...await readWorkspaceStableCards(workspaceRoot));
  if (pluginRoot) {
    mergedCards.push(...await readPluginStableCards(pluginRoot));
  }

  const bySlot = new Map();
  for (const card of mergedCards) {
    for (const slotFact of collectSlotFacts(card)) {
      const key = slotFact.slot;
      if (!bySlot.has(key)) {
        bySlot.set(key, new Map());
      }
      const byValue = bySlot.get(key);
      if (!byValue.has(slotFact.value)) {
        byValue.set(slotFact.value, []);
      }
      byValue.get(slotFact.value).push({
        value: slotFact.value,
        fact: String(card?.fact || ""),
        sourcePath: String(card?.sourcePath || ""),
        sourceChannel: String(card?.sourceChannel || "")
      });
    }
  }

  const conflicts = [];
  for (const [slot, valuesMap] of bySlot.entries()) {
    if (valuesMap.size <= 1) {
      continue;
    }
    conflicts.push({
      slot,
      values: [...valuesMap.entries()].map(([value, items]) => ({ value, items }))
    });
  }

  return {
    summary: {
      slotsScanned: bySlot.size,
      conflicts: conflicts.length
    },
    conflicts
  };
}

export function renderFactConflictAuditReport(audit, { generatedAt, workspaceRoot } = {}) {
  const lines = [];
  lines.push("# Fact Conflict Audit");
  if (generatedAt) {
    lines.push(`- 生成时间：${generatedAt}`);
  }
  if (workspaceRoot) {
    lines.push(`- 工作区：${workspaceRoot}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(`- 扫描槽位数：\`${audit.summary.slotsScanned}\``);
  lines.push(`- 冲突槽位数：\`${audit.summary.conflicts}\``);
  lines.push("");

  if (!audit.conflicts.length) {
    lines.push("## Conflicts");
    lines.push("- 当前未发现多值冲突槽位。");
    lines.push("");
    return `${lines.join("\n").trimEnd()}\n`;
  }

  lines.push("## Conflicts");
  for (const conflict of audit.conflicts) {
    lines.push(`### ${conflict.slot}`);
    for (const group of conflict.values) {
      lines.push(`- 值：${group.value}`);
      for (const item of group.items) {
        lines.push(`  - ${item.sourcePath} (${item.sourceChannel}): ${item.fact}`);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
