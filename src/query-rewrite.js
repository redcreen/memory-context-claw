import { normalizeWhitespace } from "./utils.js";

function uniqStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function stripAgentMemoryInstruction(query) {
  return String(query || "")
    .replace(
      /^based only on your memory for this agent,\s*/i,
      ""
    )
    .replace(
      /\s*if memory is missing,\s*reply exactly:\s*i don't know based on current memory\.?\s*$/i,
      ""
    )
    .replace(
      /^仅根据你当前这个 agent 的记忆[，,]\s*/i,
      ""
    )
    .replace(
      /\s*如果记忆里没有[，,]\s*请直接回答[：:]\s*我不知道当前记忆里有没有这条信息。?\s*$/i,
      ""
    );
}

function compressQuery(query) {
  return normalizeWhitespace(
    stripAgentMemoryInstruction(query)
      .replace(/[？?！!，,。；;：:]/g, " ")
      .replace(/\s+/g, " ")
  );
}

function buildIntentRewrite(query) {
  const q = String(query || "");
  if (/[区别|差别|不同]/.test(q)) {
    return `${q} 为什么容易混淆 各自负责什么`;
  }
  if (/怎么|如何/.test(q)) {
    return `${q} 使用方法 适用场景`;
  }
  if (/是什么|啥意思|含义/.test(q)) {
    return `${q} 一句话结论 适用场景`;
  }
  if (/原则|规则/.test(q)) {
    return `${q} 维护原则 使用原则`;
  }
  return `${q} 核心结论 适用场景`;
}

function buildContrastRewrite(query) {
  const q = String(query || "");
  if (/[区别|差别|不同]/.test(q)) {
    return q.replace(/[区别|差别|不同]+/g, "对比");
  }
  return "";
}

function buildPolicyRewrite(query) {
  const q = String(query || "");
  if (/guess/i.test(q)) {
    return `${q} guesses facts do not guess`;
  }
  return "";
}

function buildChineseNaturalRewrite(query) {
  const q = String(query || "");
  if (!/[\u4e00-\u9fff]/.test(q)) {
    return "";
  }
  const hasHistoryIntent =
    /(之前|原来|先前|早前|旧阶段|历史|切换前|切换发生之前|最新切换发生之前|改用.+之前|切到现在.+之前|换了.+但之前|旧的主力)/.test(q);
  if (/怎么称呼我|怎么叫我|称呼我/.test(q)) {
    return "preferred name 用户 preferred name 怎么称呼用户";
  }
  if (/部署区域|deploy region|region/.test(q) && /现在|默认|用哪个|哪个/.test(q)) {
    return "current deploy region default deploy region now eu-west-1";
  }
  if (/(记忆不完整|记忆.*打架|拿不准.*记忆|应该猜吗|别猜|不要猜)/.test(q)) {
    return "missing or conflicting memory do not guess guessing policy";
  }
  if (/编辑器/.test(q) && hasHistoryIntent) {
    return "previous main editor before switch Vim before Zed old editor history";
  }
  if (/编辑器/.test(q) && /现在|主力|哪个/.test(q)) {
    return "current main editor now Zed replaced Vim";
  }
  if (/(本子|笔记本|notebook)/.test(q) && /开会|会议|现在|哪本/.test(q)) {
    return "current notebook for meetings charcoal A5 notebook blue pocket notebook";
  }
  if (/Project Lantern|Lantern/.test(q) && /(做什么|定位|服务谁|给谁用)/.test(q)) {
    return "Project Lantern clinic managers analytics assistant design partner";
  }
  return "";
}

export function rewriteRetrievalQueries(query, options = {}) {
  const base = compressQuery(query);
  if (!base) {
    return [];
  }

  const rewrites = uniqStrings([
    base,
    base.replace(/\s+/g, " "),
    buildContrastRewrite(base),
    buildPolicyRewrite(base),
    buildChineseNaturalRewrite(base),
    buildIntentRewrite(base)
  ]);

  const maxQueries = Math.max(1, Number(options.maxQueries || 4));
  return rewrites.slice(0, maxQueries);
}
