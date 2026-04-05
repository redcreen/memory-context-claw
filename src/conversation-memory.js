import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";

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
  /爱吃/,
  /喜欢/,
  /偏好/,
  /习惯/,
  /叫刘超/,
  /平时记你是超哥/,
  /两个孩子/,
  /一儿一女/,
  /从互联网转型到实体制造业/,
  /毛绒玩具工厂/,
  /实体制造业/,
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
  /^现在让我/,
  /^根据配置文件/,
  /^The user /i,
  /^Based on the context /i,
  /^From the context /i,
  /^According to /i,
  /^An async command the user already approved/i,
  /^\*\*.+\*\*/,
  /^#+\s*/,
  /^---/,
  /^Session Startup/i,
  /^I'?ve read the files/i
];

const QUESTION_LIKE = /[？?]$/;
const FIRST_PERSON = /(我|我们)/;
const SECOND_PERSON_FACT = /(你|用户)/;
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
  /cli/i
];
const LONG_TERM_ALLOWLIST_PATTERNS = [
  /先给结论/,
  /再展开/,
  /长篇空话/,
  /叫刘超/,
  /平时记你是超哥/,
  /两个孩子/,
  /一儿一女/,
  /毛绒玩具工厂/,
  /实体制造业/,
  /转型到实体制造业/,
  /长期背景/,
  /分阶段推进/,
  /一个 agent，多 session/,
  /多 session/,
  /目录规则/,
  /长期稳定/,
  /应该放/,
  /不适合放/,
  /适合放/,
  /工作原则/,
  /协作偏好/,
  /写作偏好/,
  /主方案/,
  /保底/
];
const THEMATIC_CORE_PATTERNS = [
  /memory/i,
  /memory\.md/i,
  /openclaw/i,
  /lossless/i,
  /context/i,
  /plugin/i,
  /插件/,
  /context engine/i,
  /memory-context-claw/i,
  /长期记忆/,
  /长记忆/,
  /workspace/i,
  /session/i,
  /索引/,
  /检索/,
  /召回/,
  /编排/,
  /组装/,
  /provider/i,
  /候选/,
  /提炼/,
  /沉淀/,
  /distill/i
];
const THEMATIC_OFFTOPIC_PATTERNS = [
  /claude/i,
  /儿时/,
  /童年/,
  /iphone/i,
  /google/i,
  /vpn/i,
  /代理/,
  /节点/,
  /生日/,
  /feishu/i,
  /飞书/,
  /图片发送/,
  /image_key/i,
  /oauth/i,
  /watchdog/i
];
const AUTO_APPLY_DAILY_ALLOW_PATTERNS = [
  /memory/i,
  /memory\.md/i,
  /openclaw/i,
  /lossless/i,
  /context/i,
  /插件/,
  /长期记忆/,
  /长记忆/,
  /索引/,
  /检索/,
  /召回/,
  /编排/,
  /provider/i
];
const AUTO_APPLY_DAILY_BLOCK_PATTERNS = [
  /未完成/,
  /我下一条/,
  /如果你要/,
  /我会按/,
  /当前状态： - /,
  /openclaw 版本/i,
  /lane wait exceeded/i,
  /claude/i,
  /iphone/i,
  /google/i,
  /vpn/i,
  /代理/,
  /节点/,
  /生日/
];
const DAILY_PROMOTION_BLOCK_PATTERNS = [
  /版本/i,
  /当前模型/i,
  /上下文占用/,
  /缓存命中率/,
  /当前活跃任务/,
  /运行模式/,
  /思考模式/,
  /队列深度/,
  /当前状态：/,
  /会话：/,
  /lane wait exceeded/i
];
const RULE_STYLE_PATTERNS = [
  /^不要/,
  /以后.+要/,
  /回答要/,
  /先.+再/
];
const PREFERENCE_STYLE_PATTERNS = [
  /爱吃/,
  /我更/,
  /我一般/,
  /我平时/,
  /我习惯/,
  /我的偏好/,
  /我希望/
];
const TASK_REQUEST_PREFIX_PATTERNS = [
  /^请帮我/,
  /^帮我/,
  /^请你/,
  /^你帮我/
];
const NON_LONG_TERM_PATTERNS = [
  /^帮我/,
  /^请帮我/,
  /^让我查看/,
  /network error/i,
  /vpn/i,
  /wi-?fi/i,
  /continue with google/i,
  /iphone/i,
  /apple/i,
  /代理/,
  /节点/,
  /地区/,
  /生日/,
  /卸载/,
  /dispatching to agent/i,
  /typing indicator/i,
  /onPartialReply/i,
  /cardkit/i,
  /首包/,
  /时延/,
  /日志里/,
  /message_id/i,
  /sender_id/i,
  /卡片/,
  /重启窗口/,
  /绑定规则/,
  /移除这两个 agent/,
  /默认配置中的用户列表/,
  /gateway正在运行/,
  /现在让我总结一下完成的配置/,
  /context:\s*\d+k/i,
  /总上下文上限/,
  /tokens?/i,
  /你希望我怎么称呼你/,
  /我该叫啥/,
  /表情符号/,
  /刚睡醒/,
  /默认模型/,
  /openai-codex/i,
  /gpt-5\.4/i,
  /kimi/i,
  /模型信息/,
  /当前这个环境里/,
  /总助链路/,
  /上下文上限/,
  /token budget/i,
  /准备就绪/,
  /今天想让我帮你做点啥/,
  /刚睡醒/
  ,
  /docker/i,
  /npm权限/,
  /安装情况总结/,
  /finance agent/i,
  /默认脑子/,
  /lane 问题/,
  /禁用 agent/,
  /agents\.list/i,
  /当前还没有把分析结果/,
  /我更新到 MEMORY/i,
  /写进 MEMORY\.md 了/i,
  /更新到记忆库/,
  /我把分析和执行混在一起了/,
  /我没有及时纠偏/,
  /对你来说/
];
const NON_DAILY_PATTERNS = [
  /我现在在按配置/,
  /我还在这儿/,
  /没跟上你要的节奏/,
  /接下来我会按你要求/,
  /好，先只做/,
  /我接下来只围绕/,
  /比如我可以先/,
  /如果你愿意，我下一步/,
  /我开始按这个范围落地/,
  /帮我系统检查/,
  /我去查/,
  /我先查全/,
  /先给.+建一个/,
  /先从 `?code`?/,
  /这次我先/,
  /继续同步真实进展/,
  /我会一条一条给你/,
  /我会按这个顺序做/,
  /淘宝相关/,
  /搜索结果：找到了/,
  /网关已经重新启动并应用了新的配置/,
  /问题已解决/,
  /allowFrom 配置/,
  /openid/i,
  /同名的skill/i,
  /同名的 skill/i,
  /clawhub/i,
  /技能市场/,
  /model not allowed/i,
  /moonshot\/kimi-2\.5/i,
  /deepseek\/kimi-2\.5/i,
  /这个纠正是对的/,
  /这个批评成立/,
  /我前面的判断/,
  /我把分析和执行混在一起了/,
  /我没有及时纠偏/,
  /并没有真正推进 .*? 的分析/i,
  /我没有把/,
  /对你来说/,
  /\/approve /,
  /^让我查看/,
  /^Need /i,
  /^Need likely continue/i,
  /知识传承教学成功完成/,
  /我直接看刚才三次 ping/,
  /^Source:/i,
  /重启恢复窗口/,
  /我更新到 MEMORY/i,
  /更新到记忆库/,
  /我看到了配置文件/,
  /配置已恢复/,
  /配置已经清理干净/,
  /我看完了，直接给你结果/,
  /配置是解决 lane/i,
  /我去 MEMORY\.md 里查一下/i,
  /首先.?让我(检查|查看)(一下)?/i,
  /首先，我需要确认一下当前的 agent 配置情况/i,
  /需要修改OpenClaw的配置/i,
  /创建监控脚本/,
  /重启 OpenClaw 服务让配置生效/i,
  /清除我们当前的对话历史/,
  /让我重新开始/,
  /我看到今天的记忆文件已经记录了/i,
  /已经记录了重置操作/,
  /以上是 MEMORY\.md 的完整原文/i,
  /完整原文$/,
  /完整全文$/,
  /^在的\b/,
  /收到，开始/i,
  /收到，继续推进/i,
  /只分析不修改/,
  /稳定性风险系统检查/,
  /Telegram 提醒链路检查和修复/,
  /根据帮助信息/,
  /reset 命令会重置本地配置和状态/,
  /不一定全写在上下文里/,
  /通常要看本地配置或状态/,
  /不是有效的配置键/,
  /配置键/,
  /^比如你有[:：]/,
  /主聊天/,
  /某个项目线程/,
  /某个群/,
  /如果系统支持先发起工具/i,
  /还没有完成你要求的/,
  /卡慢不是工具本身在跑/,
  /工作方式没收紧/,
  /接下来我会把动作收敛成一件事/,
  /草案写进去了/,
  /不再去翻 `?memory\/`? 目录全文/i,
  /不再扩任务/,
  /写进 MEMORY\.md 了/i,
  /memory 文件夹是空的/i,
  /没有按日期记录的每日笔记文件/i,
  /目录是空的/,
  /文件夹是空的/,
  /一个 agent 多 session/i,
  /多 session 很自然/i,
  /准备就绪/,
  /今天想让我帮你做点啥/,
  /刚睡醒/
];
const LOW_SIGNAL_FRAGMENT_PATTERNS = [
  /^memory\.md$/i,
  /^openclaw$/i,
  /^lossless$/i,
  /^context$/i,
  /^plugin$/i,
  /^让我/,
  /^但首先/,
  /^我找到了/,
  /^已继续做完/,
  /^这是之前明确记录下来的/,
  /^\*+\s*/,
  /^-+\s*$/,
  /^#+\s*$/
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

function stripPresentationFormatting(text) {
  return normalizeWhitespace(
    String(text || "")
      .replace(/`+/g, "")
      .replace(/\*\*/g, "")
      .replace(/^>\s*/, "")
  );
}

function shortenLongTermText(text) {
  const normalized = normalizeWhitespace(String(text || ""));
  if (!normalized) {
    return normalized;
  }
  const cutMarkers = [
    " 1.",
    " 2.",
    " ## ",
    " --- ",
    " Source:",
    " 如果你愿意，",
    " 如果继续推进"
  ];
  let shortened = normalized;
  for (const marker of cutMarkers) {
    const idx = shortened.indexOf(marker);
    if (idx > 0) {
      shortened = shortened.slice(0, idx).trim();
      break;
    }
  }
  if (shortened.length > 320) {
    shortened = `${shortened.slice(0, 320).trim()}...`;
  }
  return shortened;
}

function stripReplyPrefix(text) {
  return normalizeWhitespace(String(text || "").replace(/\[\[reply_to_current\]\]/g, ""));
}

function normalizeAssistantFactSentence(text = "") {
  const normalized = normalizeWhitespace(String(text || ""));
  if (!normalized) {
    return normalized;
  }

  const patterns = [
    /^(?:好的[，,]\s*)?记住了[，,]\s*(你.+)$/u,
    /^(?:好的[，,]\s*)?记下了[，,]\s*(你.+)$/u,
    /^(?:好的[，,]\s*)?我记住了[，,]\s*(你.+)$/u,
    /^(?:好的[，,]\s*)?我记下了[，,]\s*(你.+)$/u
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return normalizeWhitespace(match[1]);
    }
  }

  return normalized;
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
  if (normalized.startsWith("An async command the user already approved")) {
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

function sessionMemoryDbPath(agentId = "main") {
  return path.join(os.homedir(), ".openclaw", "memory", `${agentId}.sqlite`);
}

export function extractIndexedChunkMessages(text, filePath) {
  const normalized = String(text || "");
  const segments = normalized
    .split(/(?=(?:User|Assistant|user|assistant):\s)/g)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);

  const messages = [];
  for (const segment of segments) {
    let role = "";
    let body = segment;
    if (segment.startsWith("User:") || segment.startsWith("user:")) {
      role = "user";
      body = segment.slice(segment.indexOf(":") + 1);
    } else if (segment.startsWith("Assistant:") || segment.startsWith("assistant:")) {
      role = "assistant";
      body = segment.slice(segment.indexOf(":") + 1);
    } else {
      continue;
    }
    const textValue = stripReplyPrefix(body);
    if (!textValue || shouldIgnoreMessageText(textValue)) {
      continue;
    }
    messages.push({
      role,
      text: textValue,
      timestamp: "",
      filePath
    });
  }
  return messages;
}

export async function readIndexedSessionMessages(agentId = "main", {
  fileLimit = 24
} = {}) {
  const dbPath = sessionMemoryDbPath(agentId);
  try {
    await fs.access(dbPath);
  } catch {
    return [];
  }

  const db = new DatabaseSync(dbPath, { readonly: true });
  try {
    const rows = db.prepare(`
      SELECT c.path, c.text, latest.source
      FROM chunks c
      JOIN (
        SELECT path, source, MAX(updated_at) AS max_updated_at
        FROM chunks
        WHERE (source = 'sessions' AND path LIKE 'sessions/%')
           OR (source = 'memory' AND path LIKE 'memory/%')
        GROUP BY path, source
        ORDER BY max_updated_at DESC
        LIMIT ?
      ) latest ON latest.path = c.path AND latest.source = c.source
      WHERE c.source = 'sessions'
         OR c.source = 'memory'
      ORDER BY latest.max_updated_at DESC, c.updated_at ASC
    `).all(Number(fileLimit || 0));

    const byPath = new Map();
    for (const row of rows) {
      const isSessionRow = row.source === "sessions" && String(row.path || "").startsWith("sessions/");
      const isSessionMemoryRow = row.source === "memory" && isIndexedSessionMemoryRow(row);
      if (!isSessionRow && !isSessionMemoryRow) {
        continue;
      }
      const pathKey = row.path;
      if (!byPath.has(pathKey)) {
        byPath.set(pathKey, []);
      }
      byPath.get(pathKey).push(...extractIndexedChunkMessages(row.text, row.path));
    }

    const rankedPaths = [...byPath.entries()]
      .map(([filePath, messages]) => ({
        filePath,
        messages,
        score: messages.reduce((sum, message) => sum + scoreMemorySignal(message.text), 0)
      }))
      .filter((item) => item.score >= 4 || hasPotentialMemorySignal(item.messages))
      .sort((a, b) => b.score - a.score)
      .slice(0, fileLimit);

    const messages = [];
    for (const item of rankedPaths) {
      messages.push(...item.messages);
    }
    return messages;
  } finally {
    db.close();
  }
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

function isIndexedSessionMemoryRow(row) {
  const filePath = String(row?.path || "");
  const text = String(row?.text || "");
  if (!filePath.startsWith("memory/")) {
    return false;
  }
  if (!/^memory\/\d{4}-\d{2}-\d{2}-.+\.md$/i.test(filePath)) {
    return false;
  }
  return text.includes("## Conversation Summary") && text.includes("- **Session Key**:");
}

function scoreMemorySignal(text = "") {
  const normalized = normalizeWhitespace(text);
  let score = 0;
  if (!normalized) {
    return score;
  }
  if (MEMORY_DOMAIN_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 2;
  }
  if (RULE_STYLE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 2;
  }
  if (STABLE_LONG_TERM_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 1;
  }
  if (DAILY_MEMORY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 1;
  }
  if (ASSISTANT_SUMMARY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 1;
  }
  if (DAILY_SUMMARY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 1;
  }
  return score;
}

function shouldRejectLongTermText(text = "") {
  const normalized = stripPresentationFormatting(text);
  return NON_LONG_TERM_PATTERNS.some((pattern) => pattern.test(normalized));
}

function shouldRejectDailyText(text = "") {
  const normalized = stripPresentationFormatting(text);
  return NON_DAILY_PATTERNS.some((pattern) => pattern.test(normalized));
}

function hasLongTermAnchor(text = "") {
  const normalized = stripPresentationFormatting(text);
  if (!normalized) {
    return false;
  }
  return MEMORY_DOMAIN_PATTERNS.some((pattern) => pattern.test(normalized))
    || LONG_TERM_ALLOWLIST_PATTERNS.some((pattern) => pattern.test(normalized))
    || RULE_STYLE_PATTERNS.some((pattern) => pattern.test(normalized))
    || PREFERENCE_STYLE_PATTERNS.some((pattern) => pattern.test(normalized));
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
  const hasAnchoredFact = longTerm && hasLongTermAnchor(text) && SECOND_PERSON_FACT.test(text);
  if (!longTerm && !daily) {
    return null;
  }
  if (!strongConclusion && !FIRST_PERSON.test(text) && !daily && !hasAnchoredFact) {
    return null;
  }
  if (actionProgress || daily) {
    const anchoredLongTerm = longTerm && hasLongTermAnchor(text) && !actionProgress && !shouldRejectLongTermText(text);
    const kind = anchoredLongTerm ? "longTerm" : "daily";
    if (kind === "daily" && shouldRejectDailyText(text)) {
      return null;
    }
    return kind;
  }
  if (
    longTerm
    && !FIRST_PERSON.test(text)
    && !hasLongTermAnchor(text)
  ) {
    return null;
  }
  if (longTerm && shouldRejectLongTermText(text)) {
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
  score += scoreThemeAlignment(text);
  return score;
}

function scoreThemeAlignment(text = "") {
  const normalized = stripPresentationFormatting(text);
  if (!normalized) {
    return 0;
  }

  let score = 0;
  if (THEMATIC_CORE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 2;
  }
  if (
    (normalized.includes("应该放") || normalized.includes("适合放") || normalized.includes("不适合放"))
    && /memory/i.test(normalized)
  ) {
    score += 2;
  }
  if (THEMATIC_OFFTOPIC_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score -= 4;
  }
  return score;
}

function scoreCandidateFreshness(message, kind) {
  if (kind !== "daily") {
    return 0;
  }

  let score = 0;
  const filePath = String(message?.filePath || "");
  const timestamp = String(message?.timestamp || "");
  const now = new Date();

  if (filePath.startsWith("/")) {
    score += 2;
  } else if (filePath.startsWith("sessions/")) {
    score -= 1;
  }

  const parsed = timestamp ? Date.parse(timestamp) : Number.NaN;
  if (!Number.isNaN(parsed)) {
    const ageMs = now.getTime() - parsed;
    const oneDay = 24 * 60 * 60 * 1000;
    const threeDays = 3 * oneDay;
    const sevenDays = 7 * oneDay;
    if (ageMs <= oneDay) {
      score += 3;
    } else if (ageMs <= threeDays) {
      score += 2;
    } else if (ageMs <= sevenDays) {
      score += 1;
    }
  }

  return score;
}

function buildCandidate(text, message, kind, sourceChannel, scoreBonus = 0) {
  const candidateText = kind === "longTerm" ? shortenLongTermText(text) : text;
  if (kind === "longTerm" && shouldRejectLongTermText(candidateText)) {
    return null;
  }
  if (kind === "daily" && shouldRejectDailyText(candidateText)) {
    return null;
  }
  if (shouldDropLowSignalCandidate(candidateText, {
    role: message.role,
    kind,
    sourceChannel,
    filePath: message.filePath
  })) {
    return null;
  }
  return {
    kind,
    text: candidateText,
    role: message.role,
    timestamp: message.timestamp,
    filePath: message.filePath,
    sourceChannel,
    score: scoreSentence(candidateText, message.role) + scoreBonus + scoreCandidateFreshness(message, kind)
  };
}

function shouldDropLowSignalCandidate(text, {
  role = "",
  kind = "",
  sourceChannel = "",
  filePath = ""
} = {}) {
  const normalized = stripPresentationFormatting(text);
  if (!normalized) {
    return true;
  }
  const anchoredFact = hasLongTermAnchor(normalized) && SECOND_PERSON_FACT.test(normalized);

  if (LOW_SIGNAL_FRAGMENT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (normalized.length < 6 && !anchoredFact) {
    return true;
  }

  const compact = normalizeForSemanticDedup(normalized);
  const tokenCount = compact ? compact.split(/\s+/).filter(Boolean).length : 0;
  if (tokenCount <= 1 && normalized.length < 20 && !anchoredFact) {
    return true;
  }

  const themeScore = scoreThemeAlignment(normalized);
  const hasAnchor = hasLongTermAnchor(normalized);
  const genericAssistant = role === "assistant" && sourceChannel === "generic";

  if (genericAssistant && !hasAnchor && themeScore <= 0 && normalized.length < 18) {
    return true;
  }

  if (kind === "daily" && genericAssistant && /^我/.test(normalized) && themeScore <= 0) {
    return true;
  }

  if (
    kind === "daily"
    && role === "assistant"
    && themeScore < 0
    && !String(filePath).startsWith("/tmp/")
  ) {
    return true;
  }

  const statusSnapshotHits = DAILY_PROMOTION_BLOCK_PATTERNS
    .filter((pattern) => pattern.test(normalized))
    .length;
  if (kind === "daily" && statusSnapshotHits >= 3) {
    return true;
  }

  if (
    kind === "daily"
    && role === "assistant"
    && sourceChannel !== "session-summary"
    && normalized.length > 260
    && !DAILY_SUMMARY_PATTERNS.some((pattern) => pattern.test(normalized))
    && !/已经完成|下一步|当前进展|今日结论/.test(normalized)
  ) {
    return true;
  }

  return false;
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
    const looksLikeTaskRequest = TASK_REQUEST_PREFIX_PATTERNS.some((pattern) => pattern.test(sentence));
    const looksLikePreference = PREFERENCE_STYLE_PATTERNS.some((pattern) => pattern.test(sentence));
    if (FIRST_PERSON.test(sentence) && hasRuleSignal && (!looksLikeTaskRequest || looksLikePreference)) {
      if (shouldRejectLongTermText(sentence)) {
        continue;
      }
      const candidate = buildCandidate(sentence, message, "longTerm", "user-rule", 3);
      if (candidate) {
        candidates.push(candidate);
      }
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
    const normalizedLine = normalizeAssistantFactSentence(line);
    if (SENTENCE_IGNORE_PATTERNS.some((pattern) => pattern.test(line))) {
      continue;
    }
    if (ASSISTANT_SUMMARY_PATTERNS.some((pattern) => pattern.test(normalizedLine))) {
      const isMemoryDomain = MEMORY_DOMAIN_PATTERNS.some((pattern) => pattern.test(normalizedLine));
      const hasAnchor = hasLongTermAnchor(normalizedLine);
      const kind = isMemoryDomain
        ? "longTerm"
        : "daily";
      if (
        kind === "longTerm"
        && !hasAnchor
      ) {
        continue;
      }
      if (kind === "longTerm" && shouldRejectLongTermText(normalizedLine)) {
        continue;
      }
      if (kind === "daily" && shouldRejectDailyText(normalizedLine)) {
        continue;
      }
      const candidate = buildCandidate(normalizedLine, message, kind, "assistant-conclusion", 3);
      if (candidate) {
        candidates.push(candidate);
      }
      continue;
    }
    if (DAILY_SUMMARY_PATTERNS.some((pattern) => pattern.test(normalizedLine))) {
      if (shouldRejectDailyText(normalizedLine)) {
        continue;
      }
      const candidate = buildCandidate(normalizedLine, message, "daily", "assistant-summary", 2);
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }
  return candidates;
}

function extractAssistantFactCandidates(message) {
  if (message.role !== "assistant") {
    return [];
  }
  const candidates = [];
  for (const sentence of splitIntoSentences(message.text)) {
    const normalizedSentence = normalizeAssistantFactSentence(sentence);
    if (normalizedSentence === sentence) {
      continue;
    }
    if (!hasLongTermAnchor(normalizedSentence) || shouldRejectLongTermText(normalizedSentence)) {
      continue;
    }
    const candidate = buildCandidate(normalizedSentence, message, "longTerm", "assistant-fact", 4);
    if (candidate) {
      candidates.push(candidate);
    }
  }
  return candidates;
}

function reduceMessageLevelDerivedCandidates(candidates) {
  const factCandidates = candidates.filter((candidate) => (
    candidate.kind === "longTerm"
    && candidate.sourceChannel === "assistant-fact"
  ));

  if (!factCandidates.length) {
    return candidates;
  }

  return candidates.filter((candidate) => {
    if (
      candidate.kind !== "longTerm"
      || candidate.sourceChannel === "assistant-fact"
    ) {
      return true;
    }

    if (
      candidate.role !== "assistant"
      || !/(以后.+(我会|要)|我会默认|优先选项|默认把)/.test(candidate.text)
    ) {
      return true;
    }

    return false;
  });
}

export function __debugExtractAssistantFactCandidates(message) {
  return extractAssistantFactCandidates(message);
}

export function __debugNormalizeAssistantFactSentence(text) {
  return normalizeAssistantFactSentence(text);
}

export function __debugSplitIntoSentences(text) {
  return splitIntoSentences(text);
}

export function __debugBuildCandidate(text, message, kind, sourceChannel, scoreBonus = 0) {
  return buildCandidate(text, message, kind, sourceChannel, scoreBonus);
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
          && !hasLongTermAnchor(line)
        ) {
          continue;
        }
        if (kind === "longTerm" && shouldRejectLongTermText(line)) {
          continue;
        }
        if (kind === "daily" && shouldRejectDailyText(line)) {
          continue;
        }
        const candidate = {
          kind,
          text: line,
          role: message.role,
          timestamp: message.timestamp,
          filePath,
          sourceChannel: "session-summary",
          score: scoreSentence(line, message.role) + 2
        };
        if (shouldDropLowSignalCandidate(candidate.text, candidate)) {
          continue;
        }
        candidates.push(candidate);
      }
    }
  }
  return candidates;
}

function extractGenericSentenceCandidates(message) {
  const candidates = [];
  for (const sentence of splitIntoSentences(message.text)) {
    const normalizedSentence = message.role === "assistant"
      ? normalizeAssistantFactSentence(sentence)
      : sentence;
    const kind = classifySentence(normalizedSentence);
    if (!kind) {
      continue;
    }
    const candidate = buildCandidate(normalizedSentence, message, kind, "generic", 0);
    if (candidate) {
      candidates.push(candidate);
    }
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

function normalizeForSemanticDedup(text = "") {
  return stripPresentationFormatting(text)
    .toLowerCase()
    .replace(/[：:;；,.，。!?！？"'“”‘’`()（）【】[\]#>*`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCharacterBigrams(text = "") {
  const normalized = normalizeForSemanticDedup(text).replace(/\s+/g, "");
  const grams = new Set();
  for (let i = 0; i < normalized.length - 1; i += 1) {
    grams.add(normalized.slice(i, i + 2));
  }
  return grams;
}

function computeBigramJaccard(a, b) {
  const gramsA = buildCharacterBigrams(a);
  const gramsB = buildCharacterBigrams(b);
  if (!gramsA.size || !gramsB.size) {
    return 0;
  }
  let intersection = 0;
  for (const gram of gramsA) {
    if (gramsB.has(gram)) {
      intersection += 1;
    }
  }
  const union = gramsA.size + gramsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function computeBigramCoverage(current, existing) {
  const gramsCurrent = buildCharacterBigrams(current);
  const gramsExisting = buildCharacterBigrams(existing);
  if (!gramsCurrent.size || !gramsExisting.size) {
    return 0;
  }
  let intersection = 0;
  for (const gram of gramsCurrent) {
    if (gramsExisting.has(gram)) {
      intersection += 1;
    }
  }
  return intersection / gramsCurrent.size;
}

function isRedundantCandidate(candidate, kept) {
  const current = normalizeForSemanticDedup(candidate.text);
  const existing = normalizeForSemanticDedup(kept.text);
  if (!current || !existing || current === existing) {
    return false;
  }

  const shorter = current.length < existing.length ? current : existing;
  const longer = current.length < existing.length ? existing : current;
  if (shorter.length < 16) {
    return false;
  }

  if (!longer.includes(shorter)) {
    let prefix = 0;
    while (
      prefix < current.length
      && prefix < existing.length
      && current[prefix] === existing[prefix]
    ) {
      prefix += 1;
    }
    const prefixRatio = prefix / shorter.length;
    if (prefixRatio >= 0.72) {
      return true;
    }
  }

  const overlapRatio = shorter.length / longer.length;
  if (overlapRatio >= 0.45) {
    return true;
  }

  if (shorter.length >= 18) {
    const jaccard = computeBigramJaccard(current, existing);
    if (jaccard >= 0.58) {
      return true;
    }
  }

  return false;
}

function reduceRedundantCandidates(candidates) {
  const kept = [];
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return String(b.text || "").length - String(a.text || "").length;
  });

  for (const candidate of sorted) {
    const redundantWith = kept.find((item) => isRedundantCandidate(candidate, item));
    if (redundantWith) {
      continue;
    }
    kept.push(candidate);
  }

  return kept;
}

function mergeCandidatesPreservingSessionMemory(baseCandidates, sessionMemoryCandidates, maxItems) {
  const base = reduceRedundantCandidates(dedupeCandidates(baseCandidates))
    .sort((a, b) => b.score - a.score);
  const seen = new Set(base.map((candidate) => normalizeForSemanticDedup(candidate.text)));

  for (const candidate of sessionMemoryCandidates) {
    const key = normalizeForSemanticDedup(candidate.text);
    if (!key || seen.has(key)) {
      continue;
    }
    base.push(candidate);
    seen.add(key);
  }

  return base
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);
}

function buildPromotionDecision(candidate) {
  const reasons = [];
  const themeScore = scoreThemeAlignment(candidate.text);
  const offTopic = THEMATIC_OFFTOPIC_PATTERNS.some((pattern) => pattern.test(candidate.text));
  if (candidate.sourceChannel === "user-rule") {
    reasons.push("用户明确表达的稳定规则/偏好");
  }
  if (candidate.sourceChannel === "assistant-conclusion") {
    reasons.push("已被整理成结论句");
  }
  if (candidate.sourceChannel === "assistant-summary") {
    reasons.push("已被整理成阶段总结");
  }
  if (candidate.sourceChannel === "session-summary") {
    reasons.push("来自会话尾部阶段总结");
  }
  if (candidate.score >= 10) {
    reasons.push("信号强度较高");
  } else if (candidate.score >= 8) {
    reasons.push("信号强度中等");
  }
  if (offTopic || themeScore < 0) {
    reasons.push("主题未对齐，禁止自动升级");
  }

  if (candidate.kind === "longTerm") {
    if (
      !offTopic
      && themeScore >= 0
      && (
      candidate.sourceChannel === "user-rule"
      || (candidate.sourceChannel === "assistant-conclusion" && candidate.score >= 10)
      )
    ) {
      return {
        action: "promote-memory-md",
        confidence: "high",
        reasons
      };
    }
    return {
      action: "review-memory-md",
      confidence: candidate.score >= 8 ? "medium" : "low",
      reasons
    };
  }

  if (
    !offTopic
    && themeScore > 0
    &&
    (candidate.sourceChannel === "assistant-summary" || candidate.sourceChannel === "assistant-conclusion")
    && candidate.score >= 8
    && !DAILY_PROMOTION_BLOCK_PATTERNS.some((pattern) => pattern.test(candidate.text))
  ) {
    return {
      action: "promote-daily-memory",
      confidence: candidate.score >= 10 ? "high" : "medium",
      reasons
    };
  }

  return {
    action: "review-daily-memory",
    confidence: candidate.score >= 8 ? "medium" : "low",
    reasons
  };
}

function annotateCandidates(candidates) {
  return candidates.map((candidate) => ({
    ...candidate,
    recommendation: buildPromotionDecision(candidate)
  }));
}

async function readExistingMemoryCorpus(workspaceRoot) {
  if (!workspaceRoot) {
    return [];
  }

  const files = [];
  const rootMemory = path.join(workspaceRoot, "MEMORY.md");
  try {
    await fs.access(rootMemory);
    files.push(rootMemory);
  } catch {}

  const memoryDir = path.join(workspaceRoot, "memory");
  try {
    const entries = await fs.readdir(memoryDir);
    for (const entry of entries) {
      if (entry.endsWith(".md")) {
        files.push(path.join(memoryDir, entry));
      }
    }
  } catch {}

  const corpus = [];
  for (const filePath of files) {
    let raw = "";
    try {
      raw = await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }
    for (const line of splitIntoCandidateLines(raw)) {
      const normalized = normalizeForSemanticDedup(line);
      if (!normalized || normalized.length < 12) {
        continue;
      }
      corpus.push({
        filePath,
        text: line,
        normalized
      });
    }
    const documentNormalized = normalizeForSemanticDedup(raw);
    if (documentNormalized && documentNormalized.length >= 40) {
      corpus.push({
        filePath,
        text: raw,
        normalized: documentNormalized,
        matchKind: "document"
      });
    }
  }

  return corpus;
}

function findExistingMemoryOverlap(candidate, corpus) {
  const current = normalizeForSemanticDedup(candidate.text);
  if (!current || current.length < 12) {
    return null;
  }

  for (const item of corpus) {
    const existing = item.normalized || normalizeForSemanticDedup(item.text);
    if (!existing) {
      continue;
    }
    if (item.matchKind === "document") {
      if (current.length < 24) {
        continue;
      }
      const jaccard = computeBigramJaccard(current, existing);
      const coverage = computeBigramCoverage(current, existing);
      if (jaccard >= 0.34 || coverage >= 0.7) {
        return {
          filePath: item.filePath,
          text: item.text,
          match: jaccard >= 0.34 ? "semantic-document" : "semantic-document-coverage"
        };
      }
      continue;
    }
    if (existing === current) {
      return { filePath: item.filePath, text: item.text, match: "exact" };
    }

    const shorter = current.length < existing.length ? current : existing;
    const longer = current.length < existing.length ? existing : current;
    let prefix = 0;
    while (
      prefix < current.length
      && prefix < existing.length
      && current[prefix] === existing[prefix]
    ) {
      prefix += 1;
    }
    const prefixRatio = prefix / shorter.length;
    const overlapRatio = shorter.length / longer.length;

    if ((longer.includes(shorter) && overlapRatio >= 0.45) || prefixRatio >= 0.78) {
      return {
        filePath: item.filePath,
        text: item.text,
        match: longer.includes(shorter) ? "containment" : "prefix"
      };
    }
  }

  return null;
}

export function applyExistingMemoryMatches(candidates, corpus) {
  return candidates.map((candidate) => {
    const existingMatch = findExistingMemoryOverlap(candidate, corpus);
    if (!existingMatch) {
      return candidate;
    }

    const skipAction = candidate.kind === "longTerm"
      ? "skip-memory-md-existing"
      : "skip-daily-memory-existing";

    return {
      ...candidate,
      existingMatch,
      recommendation: {
        action: skipAction,
        confidence: "high",
        reasons: [
          `与现有记忆重复（${path.basename(existingMatch.filePath)}）`,
          `匹配方式：${existingMatch.match}`
        ]
      }
    };
  });
}

export function summarizeCandidateRecommendations(result) {
  const summary = {
    longTerm: {
      "promote-memory-md": 0,
      "review-memory-md": 0,
      "skip-memory-md-existing": 0
    },
    daily: {
      "promote-daily-memory": 0,
      "review-daily-memory": 0,
      "skip-daily-memory-existing": 0
    }
  };

  for (const item of result.longTerm || []) {
    const action = item.recommendation?.action;
    if (action && action in summary.longTerm) {
      summary.longTerm[action] += 1;
    }
  }
  for (const item of result.daily || []) {
    const action = item.recommendation?.action;
    if (action && action in summary.daily) {
      summary.daily[action] += 1;
    }
  }

  return summary;
}

export function selectPromotableDailyCandidates(result) {
  return (result?.daily || []).filter((item) => {
    if (item.recommendation?.action !== "promote-daily-memory") {
      return false;
    }
    const normalized = stripPresentationFormatting(item.text);
    if (!normalized) {
      return false;
    }
    if (AUTO_APPLY_DAILY_BLOCK_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return false;
    }
    if (!AUTO_APPLY_DAILY_ALLOW_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return false;
    }
    return true;
  });
}

export function selectPendingDailyCandidates(result) {
  return (result?.daily || []).filter((item) => {
    const action = item.recommendation?.action;
    if (action !== "review-daily-memory") {
      return false;
    }
    const normalized = stripPresentationFormatting(item.text);
    if (!normalized) {
      return false;
    }
    return true;
  });
}

export function renderDailyPromotionBlock(candidates, { date } = {}) {
  const lines = [];
  lines.push("## 自动沉淀候选");
  if (date) {
    lines.push(`> 生成日期：${date}`);
  }
  lines.push("> 这些条目来自 memory-context-claw 的候选提炼，建议人工快速扫一眼；确认无误后可保留。");
  lines.push("");
  for (const item of candidates) {
    lines.push(`- ${item.text}`);
  }
  return `${lines.join("\n")}\n`;
}

export function renderPendingDailyReviewBlock(candidates, { date } = {}) {
  const lines = [];
  lines.push("# 待确认记忆候选");
  if (date) {
    lines.push(`> 生成日期：${date}`);
  }
  lines.push("> 这些条目尚未进入正式记忆层。只有在用户明确确认后，才应被整理进 MEMORY.md 或 memory/YYYY-MM-DD.md。");
  lines.push("");
  for (const item of candidates) {
    const reasons = Array.isArray(item.recommendation?.reasons)
      ? item.recommendation.reasons.join("；")
      : "";
    lines.push(`## ${item.kind === "longTerm" ? "长期候选" : "每日候选"}`);
    lines.push(`- 内容：${item.text}`);
    lines.push(`- 来源：${item.sourceChannel || "unknown"}`);
    if (reasons) {
      lines.push(`- 原因：${reasons}`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export function mergeDailyPromotionBlock(existingMarkdown, candidates, { date } = {}) {
  const block = renderDailyPromotionBlock(candidates, { date }).trimEnd();
  const normalizedExisting = String(existingMarkdown || "");
  const marker = "## 自动沉淀候选";
  const markerIndex = normalizedExisting.indexOf(marker);
  if (!candidates.length) {
    if (markerIndex >= 0) {
      return normalizedExisting.slice(0, markerIndex).trimEnd() + (normalizedExisting.slice(0, markerIndex).trimEnd() ? "\n" : "");
    }
    return normalizedExisting;
  }
  if (markerIndex >= 0) {
    const before = normalizedExisting.slice(0, markerIndex).trimEnd();
    return before ? `${before}\n\n${block}\n` : `${block}\n`;
  }
  const trimmed = normalizedExisting.trimEnd();
  return trimmed ? `${trimmed}\n\n${block}\n` : `${block}\n`;
}

export function extractConversationMemoryCandidates(messages, {
  maxLongTerm = 12,
  maxDaily = 12
} = {}) {
  const longTerm = [];
  const daily = [];

  for (const message of messages) {
    const extracted = reduceMessageLevelDerivedCandidates([
      ...extractUserRuleCandidates(message),
      ...extractAssistantFactCandidates(message),
      ...extractAssistantConclusionCandidates(message),
      ...extractGenericSentenceCandidates(message)
    ]);
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
    longTerm: annotateCandidates(reduceRedundantCandidates(dedupeCandidates(longTerm))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxLongTerm)),
    daily: annotateCandidates(reduceRedundantCandidates(dedupeCandidates(daily))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxDaily))
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
  indexedHistoryEnabled = true,
  indexedHistoryFileLimit = 24,
  workspaceRoot = "",
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

  let indexedSessionMemoryMessages = [];
  if (indexedHistoryEnabled && indexedHistoryFileLimit > 0) {
    const indexedMessages = await readIndexedSessionMessages(agentId, {
      fileLimit: indexedHistoryFileLimit
    });
    indexedSessionMemoryMessages = indexedMessages.filter((message) => String(message.filePath || "").startsWith("memory/"));
    allMessages.push(...indexedMessages);
  }

  const extracted = extractConversationMemoryCandidates(allMessages, { maxLongTerm, maxDaily });
  const sessionMemoryExtracted = indexedSessionMemoryMessages.length
    ? extractConversationMemoryCandidates(indexedSessionMemoryMessages, { maxLongTerm, maxDaily })
    : { longTerm: [], daily: [] };
  const existingCorpus = await readExistingMemoryCorpus(workspaceRoot);
  const longTerm = applyExistingMemoryMatches(
    mergeCandidatesPreservingSessionMemory([
      ...extracted.longTerm,
      ...sessionMemoryExtracted.longTerm.map((candidate) => ({
        ...candidate,
        score: candidate.score + 2,
        sourceChannel: candidate.sourceChannel === "generic"
          ? "session-memory"
          : candidate.sourceChannel
      }))
    ], sessionMemoryExtracted.longTerm.map((candidate) => ({
      ...candidate,
      score: candidate.score + 2,
      sourceChannel: candidate.sourceChannel === "generic"
        ? "session-memory"
        : candidate.sourceChannel
    })), maxLongTerm),
    existingCorpus
  );
  const daily = applyExistingMemoryMatches(
    mergeCandidatesPreservingSessionMemory([
      ...extracted.daily,
      ...sessionMemoryExtracted.daily.map((candidate) => ({
        ...candidate,
        score: candidate.score + 1,
        sourceChannel: candidate.sourceChannel === "generic"
          ? "session-memory"
          : candidate.sourceChannel
      }))
    ], sessionMemoryExtracted.daily.map((candidate) => ({
      ...candidate,
      score: candidate.score + 1,
      sourceChannel: candidate.sourceChannel === "generic"
        ? "session-memory"
        : candidate.sourceChannel
    })), maxDaily),
    existingCorpus
  );

  return {
    files,
    messages: allMessages,
    longTerm,
    daily
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
  const recommendationSummary = summarizeCandidateRecommendations(result);
  lines.push(`- 长期候选建议直升 MEMORY.md: \`${recommendationSummary.longTerm["promote-memory-md"]}\``);
  lines.push(`- 长期候选建议人工复核: \`${recommendationSummary.longTerm["review-memory-md"]}\``);
  lines.push(`- 长期候选已被现有 MEMORY 覆盖: \`${recommendationSummary.longTerm["skip-memory-md-existing"]}\``);
  lines.push(`- 每日候选建议直升 daily memory: \`${recommendationSummary.daily["promote-daily-memory"]}\``);
  lines.push(`- 每日候选建议人工复核: \`${recommendationSummary.daily["review-daily-memory"]}\``);
  lines.push(`- 每日候选已被现有 daily memory 覆盖: \`${recommendationSummary.daily["skip-daily-memory-existing"]}\``);
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
      if (item.recommendation) {
        lines.push(`  建议动作: \`${item.recommendation.action}\` · confidence=\`${item.recommendation.confidence}\``);
        if (item.recommendation.reasons?.length) {
          lines.push(`  判断依据: ${item.recommendation.reasons.join("；")}`);
        }
        if (item.existingMatch) {
          lines.push(`  已覆盖位置: \`${path.basename(item.existingMatch.filePath)}\` · match=\`${item.existingMatch.match}\``);
        }
      }
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
      if (item.recommendation) {
        lines.push(`  建议动作: \`${item.recommendation.action}\` · confidence=\`${item.recommendation.confidence}\``);
        if (item.recommendation.reasons?.length) {
          lines.push(`  判断依据: ${item.recommendation.reasons.join("；")}`);
        }
        if (item.existingMatch) {
          lines.push(`  已覆盖位置: \`${path.basename(item.existingMatch.filePath)}\` · match=\`${item.existingMatch.match}\``);
        }
      }
    }
  }
  lines.push("");
  lines.push("## 为什么还需要人工审阅");
  lines.push("- 对话里有很多上下文依赖句子，直接入库容易带噪音。");
  lines.push("- 长期记忆应该是提炼后的结论，不应该是聊天原句堆砌。");
  lines.push("- 这份文件的作用是把“聊天里可能有价值的东西”先找出来，再决定写到哪里。");

  return `${lines.join("\n")}\n`;
}

function buildMemoryCardTitle(candidate) {
  const text = stripPresentationFormatting(candidate?.text || "");
  if (!text) {
    return "未命名记忆卡片";
  }

  if (/爱吃/.test(text)) {
    return "饮食偏好";
  }
  if (/叫刘超|超哥/.test(text)) {
    return "身份与称呼";
  }
  if (/孩子|一儿一女|家庭|家里/.test(text)) {
    return "家庭背景";
  }
  if (/工厂|实体制造业|毛绒玩具|职业|转型/.test(text)) {
    return "职业背景";
  }
  if (/项目|定位|目标|解决什么问题|context engine|上下文引擎|memory-context-claw|上下文层/.test(text)) {
    return "项目定位";
  }
  if (/lossless|长期记忆|长记忆|memory/i.test(text)) {
    return "记忆机制理解";
  }
  if (/规则|原则|偏好|应该|不适合|适合/.test(text)) {
    return "稳定规则";
  }
  if (/今天|刚刚|下一步|已经完成|推进/.test(text)) {
    return "阶段进展";
  }

  return text.length > 18 ? `${text.slice(0, 18)}...` : text;
}

function buildMemoryCardTags(candidate) {
  const tags = [];
  const text = stripPresentationFormatting(candidate?.text || "");

  if (candidate?.kind === "longTerm") {
    tags.push("long-term");
  } else {
    tags.push("daily");
  }
  if (/爱吃|偏好|喜欢/.test(text)) {
    tags.push("preference");
  }
  if (/你叫|超哥|刘超|身份|称呼/.test(text)) {
    tags.push("identity");
  }
  if (/孩子|一儿一女|家庭|家里/.test(text)) {
    tags.push("family");
  }
  if (/工厂|实体制造业|毛绒玩具|职业|转型/.test(text)) {
    tags.push("work");
  }
  if (/项目|定位|目标|解决什么问题|context engine|上下文引擎|memory-context-claw|上下文层/.test(text)) {
    tags.push("project");
  }
  if (/lossless|长期记忆|长记忆|memory/i.test(text)) {
    tags.push("memory");
  }
  if (/规则|原则/.test(text)) {
    tags.push("rule");
  }
  if (/工作方式|写作偏好|习惯|长期稳定|应该放|适合放|不适合放/.test(text)) {
    tags.push("workflow");
  }
  if (/背景|家庭|职业|工厂|实体制造业|毛绒玩具|孩子|一儿一女/.test(text)) {
    tags.push("background");
  }
  if (/今天|刚刚|下一步|已经完成|推进/.test(text)) {
    tags.push("progress");
  }

  return uniq(tags);
}

function compactMemoryCardFact(text = "", maxLength = 180) {
  const normalized = stripPresentationFormatting(text)
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function scoreMemoryCardSentence(sentence = "", candidate = {}) {
  const text = stripPresentationFormatting(sentence);
  if (!text) {
    return -Infinity;
  }

  let score = 0;
  if (hasLongTermAnchor(text)) {
    score += 4;
  }
  if (STRONG_CONCLUSION_PATTERNS.some((pattern) => pattern.test(text))) {
    score += 3;
  }
  if (DAILY_SUMMARY_PATTERNS.some((pattern) => pattern.test(text))) {
    score += 2;
  }
  if (SECOND_PERSON_FACT.test(text)) {
    score += 2;
  }
  if (candidate?.sourceChannel === "assistant-fact") {
    score += 3;
  }
  if (text.length >= 8 && text.length <= 120) {
    score += 2;
  } else if (text.length > 160) {
    score -= 2;
  }
  if (/^我查到/.test(text)) {
    score -= 1;
  }
  if (/^这说明[:：]?/.test(text)) {
    score += 1;
  }
  return score;
}

function deriveMemoryCardFact(candidate = {}) {
  const raw = stripPresentationFormatting(candidate?.text || "");
  if (!raw) {
    return "";
  }

  const boundaryPatterns = [
    /你之前定的范围主要是这些[:：]?/,
    /维护原则也很明确[:：]?/,
    /所以一句话说[:：]?/,
    /判断标准[:：]?/,
    /适用场景[:：]?/
  ];
  for (const pattern of boundaryPatterns) {
    const match = raw.match(pattern);
    if (match?.index && match.index >= 12) {
      return compactMemoryCardFact(raw.slice(0, match.index).trim());
    }
  }

  const summaryTailMatch = raw.match(/(?:这说明|一句话说|结论先说|核心结论)[:：]?\s*(.+)$/);
  const seeded = summaryTailMatch?.[1] ? [summaryTailMatch[1]] : [];
  const sentenceCandidates = [
    ...seeded,
    ...splitIntoSentences(raw),
    ...raw.split(/\s*-\s+/).filter(Boolean)
  ]
    .map((sentence) => normalizeAssistantFactSentence(sentence))
    .map((sentence) => stripPresentationFormatting(sentence))
    .filter(Boolean);

  if (!sentenceCandidates.length) {
    return compactMemoryCardFact(raw);
  }

  const ranked = dedupeCandidates(sentenceCandidates.map((text) => ({
    text,
    score: scoreMemoryCardSentence(text, candidate)
  })))
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length);

  const picked = ranked[0]?.text || raw;
  return compactMemoryCardFact(picked);
}

export function renderSearchFriendlyMemoryCards(result, {
  agentId = "main"
} = {}) {
  const cards = buildSearchFriendlyMemoryCards(result);

  const lines = [];
  lines.push("# Search-Friendly Memory Cards");
  lines.push("");
  lines.push("## Purpose");
  lines.push("This file is a retrieval-friendly companion to raw session-memory summaries.");
  lines.push("It keeps the same signal in smaller, cleaner memory-card form so retrieval does not need to fight startup metadata, greetings, or transcript noise.");
  lines.push("");
  lines.push(`- Agent: \`${agentId}\``);
  lines.push(`- Candidate cards: \`${cards.length}\``);
  lines.push("");

  if (!cards.length) {
    lines.push("No retrieval-friendly memory cards were produced from the current candidate set.");
    return `${lines.join("\n")}\n`;
  }

  cards.forEach((card, index) => {
    lines.push(`## Card ${index + 1}: ${card.title}`);
    lines.push("");
    lines.push(`- Type: \`${card.type}\``);
    lines.push(`- Fact: ${card.fact}`);
    lines.push(`- Tags: ${card.tags.map((tag) => `\`${tag}\``).join(", ") || "`memory`"}`);
    lines.push(`- Source file: \`${card.sourceFile}\``);
    lines.push(`- Source channel: \`${card.sourceChannel}\``);
    if (card.recommendation) {
      lines.push(`- Recommendation: \`${card.recommendation.action}\` (${card.recommendation.confidence})`);
    }
    lines.push("- Retrieval hint: Prefer this card over verbose session-summary phrasing when the same fact appears in both forms.");
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
}

export function buildSearchFriendlyMemoryCards(result) {
  const candidates = [
    ...(result?.longTerm || []),
    ...(result?.daily || [])
  ].filter((candidate) => (
    (
      candidate?.sourceChannel === "assistant-fact"
      || candidate?.sourceChannel === "session-memory"
      || candidate?.sourceChannel === "assistant-summary"
      || candidate?.sourceChannel === "assistant-conclusion"
    )
    && !(
      candidate?.sourceChannel === "assistant-conclusion"
      && candidate?.recommendation?.action === "skip-memory-md-existing"
    )
    && stripPresentationFormatting(candidate?.text || "").length <= 220
  )).map((candidate) => ({
    ...candidate,
    cardFact: deriveMemoryCardFact(candidate)
  })).filter((candidate) => (
    candidate.cardFact
    && (
      candidate?.sourceChannel === "assistant-fact"
      || candidate?.sourceChannel === "session-memory"
      || candidate?.sourceChannel === "assistant-summary"
      || candidate?.sourceChannel === "assistant-conclusion"
    )
  ));

  return candidates.map((candidate) => ({
    title: buildMemoryCardTitle(candidate),
    type: candidate.kind,
    fact: candidate.cardFact,
    tags: buildMemoryCardTags(candidate),
    sourceFile: path.basename(candidate.filePath || ""),
    sourcePath: candidate.filePath || "",
    sourceChannel: candidate.sourceChannel || "generic",
    recommendation: candidate.recommendation
      ? {
        action: candidate.recommendation.action,
        confidence: candidate.recommendation.confidence
      }
      : null
  }));
}
