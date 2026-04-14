import { normalizeWhitespace } from "./utils.js";

function uniqStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function compressQuery(query) {
  return normalizeWhitespace(
    String(query || "")
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
    buildIntentRewrite(base)
  ]);

  const maxQueries = Math.max(1, Number(options.maxQueries || 4));
  return rewrites.slice(0, maxQueries);
}
