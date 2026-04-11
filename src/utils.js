export function parseAgentId(sessionKey, forcedAgentId = "") {
  if (forcedAgentId) {
    return forcedAgentId;
  }
  if (typeof sessionKey !== "string" || !sessionKey.startsWith("agent:")) {
    return "main";
  }
  const parts = sessionKey.split(":");
  return parts[1] || "main";
}

export function isInternalRerankSession(sessionKey) {
  return typeof sessionKey === "string" && sessionKey.includes(":context-rerank:");
}

export function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeForSystemPrompt(value) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

export function uniq(items) {
  return [...new Set(items)];
}

export function canonicalizeMemoryPath(pathname) {
  const normalized = String(pathname || "").replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized) {
    return "";
  }
  if (normalized === "MEMORY.md" || normalized.endsWith("/MEMORY.md")) {
    return "MEMORY.md";
  }
  const memoryIndex = normalized.indexOf("/memory/");
  if (memoryIndex >= 0) {
    return normalized.slice(memoryIndex + 1);
  }
  if (normalized.startsWith("memory/")) {
    return normalized;
  }
  return normalized;
}

export function normalizePathForMatching(pathname) {
  return String(pathname || "").replace(/\\/g, "/").toLowerCase();
}

export function shouldExcludeMemoryPath(pathname, excludePatterns = []) {
  const normalized = normalizePathForMatching(pathname);
  if (!normalized) {
    return false;
  }
  return excludePatterns.some((pattern) => {
    const candidate = normalizePathForMatching(pattern);
    return candidate ? normalized.includes(candidate) : false;
  });
}

export function toIsoDateFromMemoryPath(pathname) {
  const match = String(pathname).match(/memory\/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

export function extractSessionTimestamp(pathname) {
  const value = String(pathname || "");
  const match = value.match(
    /sessions\/.+?\.jsonl(?:\.(?:reset|deleted)\.)?(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/
  );
  if (!match) {
    return null;
  }
  const [, date, hh, mm, ss] = match;
  const iso = `${date}T${hh}:${mm}:${ss}Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function scoreRecencyFromDate(date, now = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 0;
  }
  const days = Math.max(0, (now.getTime() - date.getTime()) / 86400000);
  if (days <= 1) {
    return 1;
  }
  if (days <= 3) {
    return 0.9;
  }
  if (days <= 7) {
    return 0.7;
  }
  if (days <= 30) {
    return 0.4;
  }
  return 0.1;
}

export function scoreRecencyFromIsoDate(isoDate, now = new Date()) {
  if (!isoDate) {
    return 0;
  }
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  const days = Math.max(0, (now.getTime() - parsed.getTime()) / 86400000);
  if (days <= 3) {
    return 1;
  }
  if (days <= 7) {
    return 0.8;
  }
  if (days <= 30) {
    return 0.5;
  }
  return 0.15;
}

export function extractLatestUserPrompt(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || message.role !== "user") {
      continue;
    }
    return messageContentToText(message.content);
  }
  return "";
}

export function messageContentToText(content) {
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
      if (typeof part.thinking === "string") {
        return part.thinking;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export function estimateTokenCountFromText(text) {
  const value = normalizeWhitespace(text);
  if (!value) {
    return 0;
  }
  return Math.ceil(value.length / 4);
}

export function estimateMessageTokens(message) {
  return estimateTokenCountFromText(messageContentToText(message?.content));
}

export function buildKeywordSet(prompt) {
  const raw = String(prompt || "");
  const latinTokens = raw
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9_-]{1,}/g);
  const cjkBigrams = [];
  const cjk = [...raw.replace(/\s+/g, "")].filter((char) => /[\u4e00-\u9fff]/.test(char));
  for (let index = 0; index < cjk.length - 1; index += 1) {
    cjkBigrams.push(`${cjk[index]}${cjk[index + 1]}`);
  }
  return uniq([...(latinTokens || []), ...cjkBigrams]);
}

export function buildOrderedKeywordSet(prompt) {
  const raw = String(prompt || "");
  const ordered = [];
  const push = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) {
      return;
    }
    if (!ordered.includes(normalized)) {
      ordered.push(normalized);
    }
  };

  const latinTokens = raw.match(/[a-z0-9][a-z0-9_-]{1,}/gi) || [];
  for (const token of latinTokens) {
    push(token);
  }

  const segments = raw
    .split(/\s+/)
    .map((item) => item.replace(/[^\p{Script=Han}a-zA-Z0-9_-]/gu, ""))
    .filter(Boolean);

  for (const segment of segments) {
    const cjkChars = [...segment].filter((char) => /[\u4e00-\u9fff]/.test(char));
    if (cjkChars.length >= 2 && cjkChars.length <= 4) {
      push(cjkChars.join(""));
    }
    for (let index = 0; index < cjkChars.length - 1; index += 1) {
      push(`${cjkChars[index]}${cjkChars[index + 1]}`);
    }
  }

  return ordered;
}
