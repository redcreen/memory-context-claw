import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { normalizeWhitespace, uniq } from "./utils.js";

const IGNORE_EXACT = new Set([
  "在么",
  "在吗",
  "继续",
  "好的",
  "ok",
  "ok333"
]);

const STABLE_LONG_TERM_PATTERNS = [
  /喜欢/,
  /偏好/,
  /习惯/,
  /沟通风格/,
  /最好/,
  /不要/,
  /优先/,
  /默认/,
  /必须/,
  /规则/,
  /原则/,
  /先.+再/,
  /我更/,
  /我一般/,
  /我平时/,
  /我习惯/,
  /应该放/,
  /不适合放/,
  /适合放/
];

const DAILY_MEMORY_PATTERNS = [
  /今天/,
  /刚才/,
  /我们已经/,
  /我们刚刚/,
  /下一步/,
  /推进/,
  /完成了/,
  /已经做了/,
  /开始/,
  /项目/,
  /插件/,
  /配置/,
  /索引/,
  /session/i,
  /memory/i,
  /openclaw/i,
  /lossless/i
];
const ACTION_PROGRESS_PATTERNS = [
  /我去查/,
  /我先/,
  /已开始/,
  /下一步/,
  /如果继续推进/,
  /先把/,
  /继续推进/
];
const SENTENCE_IGNORE_PATTERNS = [
  /^探针记忆测试第\d+条[:：]/,
  /^只回复/,
  /^完整路径/,
  /^推荐路线/,
  /^文件内容结论/,
  /^如果继续推进/,
  /^我去查/,
  /^我先/,
  /^已开始查到/,
  /^已开始/,
  /^继续推进并同步真实进展$/,
  /^To send an image back/i,
  /^Use the following/i,
  /^Current user intent:/i,
  /^Recalled context:/i,
  /^Path:/i,
  /^Range:/i,
  /^Kind:/i,
  /^Score:/i,
  /^Snippet:/i,
  /^I need /i,
  /^I'm /i,
  /^I’m /i,
  /^Let me /i,
  /^The user /i,
  /^Based on the context /i,
  /^From the context /i,
  /^According to /i,
  /^\*\*.+\*\*/,
  /^Session Startup/i,
  /^I'?ve read the files/i
];

const QUESTION_LIKE = /[？?]$/;
const FIRST_PERSON = /(我|我们)/;
const INTERROGATIVE_WORDS = /(什么|怎么|为什么|为何|是否|是不是|吗|么|哪种|哪个|哪里|谁|如何)/;
const STRONG_CONCLUSION_PATTERNS = [
  /结论/,
  /一句话/,
  /核心/,
  /定位/,
  /目标/,
  /原则/,
  /规则/,
  /偏好/,
  /应该/,
  /不应该/,
  /适合/,
  /不适合/
];
const ASSISTANT_SUMMARY_PATTERNS = [
  /结论先说/,
  /一句话结论/,
  /核心结论/,
  /总结一下/,
  /简单说/,
  /本质上/,
  /更准确地说/,
  /一句话/
];
const DAILY_SUMMARY_PATTERNS = [
  /今天我们/,
  /已经完成/,
  /已经做完/,
  /下一步是/,
  /接下来/,
  /当前状态/,
  /现在的真实状态/,
  /目前最合理的链路/
];
const SESSION_LEVEL_PATTERNS = [
  /最推荐/,
  /推荐/,
  /建议/,
  /下一步/,
  /当前状态/,
  /可以理解成/,
  /核心目标/,
  /主方案/,
  /这意味着/,
  /更合理的/,
  /一句话/
];
const MEMORY_DOMAIN_PATTERNS = [
  /memory/i,
  /memory\.md/i,
  /openclaw/i,
  /lossless/i,
  /context/i,
  /插件/,
  /长期记忆/,
  /长记忆/,
  /工作方式/,
  /偏好/,
  /规则/,
  /原则/,
  /知识库/,
  /workspace/i,
  /session/i,
  /status/i,
  /配置/,
  /索引/,
  /cli/i,
  /json/i,
  /方案/,
  /回答/
];
const RULE_STYLE_PATTERNS = [
  /^不要/,
  /以后.+要/,
  /回答要/,
  /先.+再/
];

function splitIntoSentences(text) {
  return String(text || "")
    .split(/[\n。！？!?]+/g)
    .map((item) => normalizeWhitespace(item).replace(/^\[[^\]]+\]\s*/, ""))
    .filter(Boolean);
}

function splitIntoCandidateLines(text) {
  return String(text || "")
    .split(/\n+/g)
    .map((item) => normalizeWhitespace(item.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "")))
    .filter(Boolean);
}

function stripReplyPrefix(text) {
  return normalizeWhitespace(String(text || "").replace(/\[\[reply_to_current\]\]/g, ""));
}

function shouldIgnoreMessageText(text) {
  const normalized = stripReplyPrefix(text);
  if (!normalized) {
    return true;
  }
  if (IGNORE_EXACT.has(normalized)) {
    return true;
  }
  if (normalized.startsWith("A new session was started via /new or /reset")) {
    return true;
  }
  if (normalized.startsWith("Continue where you left off.")) {
    return true;
  }
  if (normalized.startsWith("<relevant-memories>")) {
    return true;
  }
  if (normalized.startsWith("Sender (untrusted metadata):")) {
    return true;
  }
  if (normalized.startsWith("Conversation info")) {
    return true;
  }
  if (normalized.startsWith("🦞 OpenClaw")) {
    return true;
  }
  if (normalized.startsWith("✅ New session started")) {
    return true;
  }
  if (normalized.startsWith("System:")) {
    return true;
  }
  if (normalized.includes("Current time:")) {
    return true;
  }
  if (normalized.includes("只回复")) {
    return true;
  }
  if (normalized.includes("```")) {
    return true;
  }
  if (normalized.includes("/Users/")) {
    return true;
  }
  if (normalized.includes("toolCall") || normalized.includes("thinkingSignature")) {
    return true;
  }
  return false;
}

function messageContentToVisibleText(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((part) => {
      if (!part || typeof part !== "object") {
        return "";
      }
      if (part.type === "text" && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export async function listRecentSessionFiles(agentId = "main", { limit = 8 } = {}) {
  const sessionsDir = path.join(os.homedir(), ".openclaw", "agents", agentId, "sessions");
  const entries = await fs.readdir(sessionsDir);
  const files = await Promise.all(entries
    .filter((name) => name.endsWith(".jsonl"))
    .map(async (name) => {
      const fullPath = path.join(sessionsDir, name);
      const stat = await fs.stat(fullPath);
      return { fullPath, mtimeMs: stat.mtimeMs };
    }));
  return files.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, limit).map((item) => item.fullPath);
}

function hasPotentialMemorySignal(messages) {
  return messages.some((message) =>
    splitIntoSentences(message.text).some((sentence) => {
      if (SENTENCE_IGNORE_PATTERNS.some((pattern) => pattern.test(sentence))) {
        return false;
      }
      return STABLE_LONG_TERM_PATTERNS.some((pattern) => pattern.test(sentence))
        || DAILY_MEMORY_PATTERNS.some((pattern) => pattern.test(sentence))
        || ASSISTANT_SUMMARY_PATTERNS.some((pattern) => pattern.test(sentence))
        || DAILY_SUMMARY_PATTERNS.some((pattern) => pattern.test(sentence));
    })
  );
}

export async function readSessionMessages(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  const messages = [];
  for (const line of lines) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (parsed?.type !== "message") {
      continue;
    }
    const role = parsed?.message?.role;
    if (role !== "user" && role !== "assistant") {
      continue;
    }
    const text = stripReplyPrefix(messageContentToVisibleText(parsed?.message?.content));
    if (shouldIgnoreMessageText(text)) {
      continue;
    }
    messages.push({
      role,
      text,
      timestamp: parsed?.timestamp || "",
      filePath
    });
  }
  return messages;
}

function classifySentence(sentence) {
  const text = normalizeWhitespace(sentence);
  if (!text || QUESTION_LIKE.test(text) || INTERROGATIVE_WORDS.test(text)) {
    return null;
  }
  if (SENTENCE_IGNORE_PATTERNS.some((pattern) => pattern.test(text))) {
    return null;
  }
  const longTerm = STABLE_LONG_TERM_PATTERNS.some((pattern) => pattern.test(text));
  const daily = DAILY_MEMORY_PATTERNS.some((pattern) => pattern.test(text));
  const actionProgress = ACTION_PROGRESS_PATTERNS.some((pattern) => pattern.test(text));
  const strongConclusion = STRONG_CONCLUSION_PATTERNS.some((pattern) => pattern.test(text));
  if (!longTerm && !daily) {
    return null;
  }
  if (!strongConclusion && !FIRST_PERSON.test(text) && !daily) {
    return null;
  }
  if (actionProgress || daily) {
    return longTerm && !actionProgress && !daily ? "longTerm" : "daily";
  }
  if (
    longTerm
    && !FIRST_PERSON.test(text)
    && !MEMORY_DOMAIN_PATTERNS.some((pattern) => pattern.test(text))
    && !RULE_STYLE_PATTERNS.some((pattern) => pattern.test(text))
  ) {
    return null;
  }
  return "longTerm";
}

function scoreSentence(text, role) {
  let score = 0;
  if (role === "user") {
    score += 3;
  }
  if (role === "assistant") {
    score += 1;
  }
  if (FIRST_PERSON.test(text)) {
    score += 2;
  }
  if (STABLE_LONG_TERM_PATTERNS.some((pattern) => pattern.test(text))) {
    score += 3;
  }
  if (DAILY_MEMORY_PATTERNS.some((pattern) => pattern.test(text))) {
    score += 2;
  }
  if (STRONG_CONCLUSION_PATTERNS.some((pattern) => pattern.test(text))) {
    score += 2;
  }
  if (text.length >= 14 && text.length <= 100) {
    score += 1;
  }
  if (text.length > 120) {
    score -= 2;
  }
  if (/^(这个|那个|这里|那里)/.test(text)) {
    score -= 1;
  }
  return score;
}

function buildCandidate(text, message, kind, sourceChannel, scoreBonus = 0) {
  return {
    kind,
    text,
    role: message.role,
    timestamp: message.timestamp,
    filePath: message.filePath,
    sourceChannel,
    score: scoreSentence(text, message.role) + scoreBonus
  };
}

function extractUserRuleCandidates(message) {
  if (message.role !== "user") {
    return [];
  }
  const candidates = [];
  for (const sentence of splitIntoSentences(message.text)) {
    if (SENTENCE_IGNORE_PATTERNS.some((pattern) => pattern.test(sentence))) {
      continue;
    }
    const hasRuleSignal = STABLE_LONG_TERM_PATTERNS.some((pattern) => pattern.test(sentence));
    if (FIRST_PERSON.test(sentence) && hasRuleSignal) {
      candidates.push(buildCandidate(sentence, message, "longTerm", "user-rule", 3));
    }
  }
  return candidates;
}

function extractAssistantConclusionCandidates(message) {
  if (message.role !== "assistant") {
    return [];
  }
  const candidates = [];
  for (const line of splitIntoCandidateLines(message.text)) {
    if (SENTENCE_IGNORE_PATTERNS.some((pattern) => pattern.test(line))) {
      continue;
    }
    if (ASSISTANT_SUMMARY_PATTERNS.some((pattern) => pattern.test(line))) {
      const kind = STABLE_LONG_TERM_PATTERNS.some((pattern) => pattern.test(line))
        ? "longTerm"
        : "daily";
      if (
        kind === "longTerm"
        && !FIRST_PERSON.test(line)
        && !MEMORY_DOMAIN_PATTERNS.some((pattern) => pattern.test(line))
        && !RULE_STYLE_PATTERNS.some((pattern) => pattern.test(line))
      ) {
        continue;
      }
      candidates.push(buildCandidate(line, message, kind, "assistant-conclusion", 3));
      continue;
    }
    if (DAILY_SUMMARY_PATTERNS.some((pattern) => pattern.test(line))) {
      candidates.push(buildCandidate(line, message, "daily", "assistant-summary", 2));
    }
  }
  return candidates;
}

function extractSessionLevelCandidates(messages) {
  const byFile = new Map();
  for (const message of messages) {
    const key = message.filePath || "unknown";
    if (!byFile.has(key)) {
      byFile.set(key, []);
    }
    byFile.get(key).push(message);
  }

  const candidates = [];
  for (const [filePath, sessionMessages] of byFile.entries()) {
    const assistantMessages = sessionMessages.filter((message) => message.role === "assistant");
    const tail = assistantMessages.slice(-4);
    for (const message of tail) {
      const cleaned = stripReplyPrefix(message.text);
      for (const line of splitIntoCandidateLines(cleaned)) {
        if (SENTENCE_IGNORE_PATTERNS.some((pattern) => pattern.test(line))) {
          continue;
        }
        if (!SESSION_LEVEL_PATTERNS.some((pattern) => pattern.test(line))) {
          continue;
        }
        const kind = DAILY_SUMMARY_PATTERNS.some((pattern) => pattern.test(line))
          ? "daily"
          : "longTerm";
        if (
          kind === "longTerm"
          && !FIRST_PERSON.test(line)
          && !MEMORY_DOMAIN_PATTERNS.some((pattern) => pattern.test(line))
          && !RULE_STYLE_PATTERNS.some((pattern) => pattern.test(line))
        ) {
          continue;
        }
        candidates.push({
          kind,
          text: line,
          role: message.role,
          timestamp: message.timestamp,
          filePath,
          sourceChannel: "session-summary",
          score: scoreSentence(line, message.role) + 2
        });
      }
    }
  }
  return candidates;
}

function extractGenericSentenceCandidates(message) {
  const candidates = [];
  for (const sentence of splitIntoSentences(message.text)) {
    const kind = classifySentence(sentence);
    if (!kind) {
      continue;
    }
    candidates.push(buildCandidate(sentence, message, kind, "generic", 0));
  }
  return candidates;
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const output = [];
  for (const candidate of candidates) {
    const key = normalizeWhitespace(candidate.text).toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(candidate);
  }
  return output;
}

export function extractConversationMemoryCandidates(messages, {
  maxLongTerm = 12,
  maxDaily = 12
} = {}) {
  const longTerm = [];
  const daily = [];

  for (const message of messages) {
    const extracted = [
      ...extractUserRuleCandidates(message),
      ...extractAssistantConclusionCandidates(message),
      ...extractGenericSentenceCandidates(message)
    ];
    for (const candidate of extracted) {
      if (candidate.kind === "longTerm") {
        longTerm.push(candidate);
      } else {
        daily.push(candidate);
      }
    }
  }

  for (const candidate of extractSessionLevelCandidates(messages)) {
    if (candidate.kind === "longTerm") {
      longTerm.push(candidate);
    } else {
      daily.push(candidate);
    }
  }

  return {
    longTerm: dedupeCandidates(longTerm)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxLongTerm),
    daily: dedupeCandidates(daily)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxDaily)
  };
}

export function projectRuntimeMessagesToConversationItems(messages, {
  fallbackFilePath = ""
} = {}) {
  return (Array.isArray(messages) ? messages : [])
    .map((message) => ({
      role: message?.role,
      text: stripReplyPrefix(messageContentToVisibleText(message?.content)),
      timestamp: message?.timestamp || "",
      filePath: fallbackFilePath
    }))
    .filter((item) => item.role && item.text && !shouldIgnoreMessageText(item.text));
}

export async function collectConversationMemoryCandidates(agentId = "main", {
  sessionLimit = 8,
  scanWindow = 24,
  maxLongTerm = 12,
  maxDaily = 12
} = {}) {
  const recentFiles = await listRecentSessionFiles(agentId, { limit: Math.max(sessionLimit, scanWindow) });
  const files = [];
  const allMessages = [];
  for (const filePath of recentFiles) {
    const messages = await readSessionMessages(filePath);
    if (!messages.length) {
      continue;
    }
    const shouldInclude = hasPotentialMemorySignal(messages) || files.length < Math.min(3, sessionLimit);
    if (!shouldInclude) {
      continue;
    }
    files.push(filePath);
    allMessages.push(...messages);
    if (files.length >= sessionLimit) {
      break;
    }
  }
  return {
    files,
    messages: allMessages,
    ...extractConversationMemoryCandidates(allMessages, { maxLongTerm, maxDaily })
  };
}

export function renderConversationMemoryReport(result, {
  agentId = "main",
  workspaceRoot = process.cwd()
} = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const dailyTarget = path.join(workspaceRoot, "memory", `${today}.md`);
  const lines = [];

  lines.push("# 对话记忆沉淀建议");
  lines.push("");
  lines.push("## 这份文件讲什么");
  lines.push("这份文件不是把整段聊天直接塞进长期记忆，而是从最近会话里抽出更像“可沉淀记忆”的候选项。");
  lines.push("");
  lines.push(`- Agent: \`${agentId}\``);
  lines.push(`- 扫描会话文件数: \`${result.files.length}\``);
  lines.push(`- 扫描消息数: \`${result.messages.length}\``);
  lines.push(`- 候选长期记忆: \`${result.longTerm.length}\``);
  lines.push(`- 候选每日记忆: \`${result.daily.length}\``);
  lines.push("");
  lines.push("## 建议进入 MEMORY.md");
  lines.push("这些更像长期稳定规则、偏好、工作方式。");
  lines.push("");
  if (result.longTerm.length === 0) {
    lines.push("- 当前没有抽出足够强的长期记忆候选。");
  } else {
    for (const item of result.longTerm) {
      lines.push(`- ${item.text}`);
      lines.push(`  来源: \`${path.basename(item.filePath)}\` · \`${item.role}\` · channel=\`${item.sourceChannel || "generic"}\` · score=${item.score}`);
    }
  }
  lines.push("");
  lines.push("## 建议进入当日 memory");
  lines.push(`这些更像阶段结论、当前进展、项目决策，建议审阅后写入 \`${dailyTarget}\`。`);
  lines.push("");
  if (result.daily.length === 0) {
    lines.push("- 当前没有抽出足够强的每日记忆候选。");
  } else {
    for (const item of result.daily) {
      lines.push(`- ${item.text}`);
      lines.push(`  来源: \`${path.basename(item.filePath)}\` · \`${item.role}\` · channel=\`${item.sourceChannel || "generic"}\` · score=${item.score}`);
    }
  }
  lines.push("");
  lines.push("## 为什么还需要人工审阅");
  lines.push("- 对话里有很多上下文依赖句子，直接入库容易带噪音。");
  lines.push("- 长期记忆应该是提炼后的结论，不应该是聊天原句堆砌。");
  lines.push("- 这份文件的作用是把“聊天里可能有价值的东西”先找出来，再决定写到哪里。");

  return `${lines.join("\n")}\n`;
}
