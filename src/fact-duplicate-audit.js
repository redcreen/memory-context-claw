import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildPolicyCardsFromMarkdown,
  buildProjectCardsFromMarkdown,
  buildStableMemoryCardsFromMarkdown
} from "./retrieval.js";

const DEFAULT_WORKSPACE_ROOT = path.join(os.homedir(), ".openclaw", "workspace");

function normalizeFact(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function classifyDuplicateGroup(items, kind = "fact") {
  const sourceChannels = new Set(items.map((item) => String(item.sourceChannel || "")));
  const sourcePaths = items.map((item) => String(item.sourcePath || ""));
  const hasMemoryMd = sourceChannels.has("memory-md");
  const hasMemoryDaily = sourceChannels.has("memory-daily");
  const hasFormalPolicy = sourceChannels.has("formal-policy");
  const hasSessionDerived = sourceChannels.has("assistant-conclusion") || sourceChannels.has("assistant-fact");

  if (kind === "slotValue" && hasMemoryMd && hasMemoryDaily) {
    return {
      classification: "acceptable-layered",
      reason: "同一已确认身份/背景事实同时存在于 MEMORY.md 和 daily memory，属于合理分层冗余。"
    };
  }

  if (kind === "fact" && hasFormalPolicy && hasSessionDerived) {
    return {
      classification: "review",
      reason: "正式 policy 已覆盖该规则事实，session-derived 版本应继续降权或自然退出。"
    };
  }

  if (kind === "fact" && hasMemoryMd && hasMemoryDaily) {
    return {
      classification: "acceptable-layered",
      reason: "同一事实同时存在于长期层和近期确认层，当前可接受，但后续可继续评估是否需要压缩。"
    };
  }

  if (sourcePaths.some((item) => item.includes("/sessions/")) || sourcePaths.some((item) => item.startsWith("sessions/"))) {
    return {
      classification: "review",
      reason: "重复事实仍依赖 session-derived 来源，建议继续治理其退出路径。"
    };
  }

  return {
    classification: "review",
    reason: "当前属于跨来源重复，建议人工判断是否合并、降级或保留。"
  };
}

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

  const birthdayMatch = fact.match(/你的生日是([^，。；]+)，农历生日是([^，。；]+)/);
  if (birthdayMatch) {
    slots.push({ slot: "identity.birthday_solar", value: birthdayMatch[1] });
    slots.push({ slot: "identity.birthday_lunar", value: birthdayMatch[2] });
  }

  const daughterMatch = fact.match(/你女儿叫([^，。；]+)，生日是([^，。；]+)，现在上([^，。；]+)/);
  if (daughterMatch) {
    slots.push({ slot: "family.daughter_profile", value: `${daughterMatch[1]}|${daughterMatch[2]}|${daughterMatch[3]}` });
  }

  const sonMatch = fact.match(/你儿子叫([^，。；]+)，生日是([^，。；]+)，现在上([^，。；]+)/);
  if (sonMatch) {
    slots.push({ slot: "family.son_profile", value: `${sonMatch[1]}|${sonMatch[2]}|${sonMatch[3]}` });
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

export async function auditFactDuplicates({
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

  const byFact = new Map();
  const bySlotValue = new Map();

  for (const card of mergedCards) {
    const item = {
      fact: normalizeFact(card?.fact),
      sourcePath: String(card?.sourcePath || ""),
      sourceChannel: String(card?.sourceChannel || "")
    };
    if (!item.fact) {
      continue;
    }

    if (!byFact.has(item.fact)) {
      byFact.set(item.fact, []);
    }
    byFact.get(item.fact).push(item);

    for (const slotFact of collectSlotFacts(card)) {
      const key = `${slotFact.slot}::${slotFact.value}`;
      if (!bySlotValue.has(key)) {
        bySlotValue.set(key, {
          slot: slotFact.slot,
          value: slotFact.value,
          items: []
        });
      }
      bySlotValue.get(key).items.push(item);
    }
  }

  const duplicateFacts = [...byFact.entries()]
    .filter(([, items]) => {
      const uniqueSources = new Set(items.map((item) => `${item.sourcePath}::${item.sourceChannel}`));
      return uniqueSources.size > 1;
    })
    .map(([fact, items]) => ({
      fact,
      items,
      ...classifyDuplicateGroup(items, "fact")
    }));

  const duplicateSlotValues = [...bySlotValue.values()]
    .filter((entry) => {
      const uniqueSources = new Set(entry.items.map((item) => `${item.sourcePath}::${item.sourceChannel}`));
      return uniqueSources.size > 1;
    })
    .map((entry) => ({
      ...entry,
      ...classifyDuplicateGroup(entry.items, "slotValue")
    }));

  const acceptableLayered = duplicateFacts.filter((item) => item.classification === "acceptable-layered").length
    + duplicateSlotValues.filter((item) => item.classification === "acceptable-layered").length;
  const review = duplicateFacts.filter((item) => item.classification === "review").length
    + duplicateSlotValues.filter((item) => item.classification === "review").length;

  return {
    summary: {
      cardsScanned: mergedCards.length,
      duplicateFacts: duplicateFacts.length,
      duplicateSlotValues: duplicateSlotValues.length,
      acceptableLayered,
      review
    },
    duplicateFacts,
    duplicateSlotValues
  };
}

export function renderFactDuplicateAuditReport(audit, { generatedAt, workspaceRoot } = {}) {
  const lines = [];
  lines.push("# Fact Duplicate Audit");
  if (generatedAt) {
    lines.push(`- 生成时间：${generatedAt}`);
  }
  if (workspaceRoot) {
    lines.push(`- 工作区：${workspaceRoot}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(`- 扫描卡片数：\`${audit.summary.cardsScanned}\``);
  lines.push(`- 重复事实数：\`${audit.summary.duplicateFacts}\``);
  lines.push(`- 重复槽位值数：\`${audit.summary.duplicateSlotValues}\``);
  lines.push(`- 合理分层冗余：\`${audit.summary.acceptableLayered}\``);
  lines.push(`- 需继续治理：\`${audit.summary.review}\``);
  lines.push("");

  lines.push("## Duplicate Facts");
  if (!audit.duplicateFacts.length) {
    lines.push("- 当前未发现跨来源重复事实。");
  } else {
    for (const entry of audit.duplicateFacts) {
      lines.push(`### ${entry.fact}`);
      lines.push(`- 分类：${entry.classification}`);
      lines.push(`- 判断：${entry.reason}`);
      for (const item of entry.items) {
        lines.push(`- ${item.sourcePath} (${item.sourceChannel})`);
      }
      lines.push("");
    }
  }
  lines.push("");

  lines.push("## Duplicate Slot Values");
  if (!audit.duplicateSlotValues.length) {
    lines.push("- 当前未发现跨来源重复槽位值。");
  } else {
    for (const entry of audit.duplicateSlotValues) {
      lines.push(`### ${entry.slot} = ${entry.value}`);
      lines.push(`- 分类：${entry.classification}`);
      lines.push(`- 判断：${entry.reason}`);
      for (const item of entry.items) {
        lines.push(`- ${item.sourcePath} (${item.sourceChannel})`);
      }
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
