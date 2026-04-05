import fs from "node:fs/promises";
import path from "node:path";

const PENDING_PATTERNS = [
  /(?<!等)待确认(?:信息|事实|内容|值)?/,
  /暂不作为已确认/,
  /需用户再次确认/,
  /需要用户再次确认/,
  /可能有笔误/,
  /未确认/,
  /pending/i
];

const RUNTIME_PATTERNS = [
  /Session Key:/,
  /Session ID:/,
  /Source:/,
  /Conversation Summary/,
  /Sender \(untrusted metadata\)/,
  /message_id/,
  /A new session was started/,
  /Exec denied/,
  /reply_to_current/,
  /(^|\s)\/status(\s|$)/m,
  /Cache:/,
  /Context:/,
  /Queue:/,
  /\bping\b/i,
  /\bgreeting\b/i
];

const PROCESS_PATTERNS = [
  /1分钟后回复我?ok/i,
  /2分钟后回复我?ok/i,
  /5分钟后回复我?ok/i,
  /收到，\d+分钟后回复/i,
  /^\s*ok\d*\s*$/im,
  /当前没有新增实质进展/,
  /需要授权才能执行/
];

const FILEPATH_ARCHIVE_HINTS = [
  /\.log$/i,
  /\.hmd$/i,
  /\.backup$/i,
  /session-/i,
  /greeting/i,
  /ping/i,
  /availability/i,
  /exec-approval/i,
  /latency/i,
  /slow-diagnosis/i,
  /model-check/i,
  /codex-balance/i,
  /ok1-reminder/i
];

function collectPatternReasons(text, patterns, label) {
  const reasons = [];
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      reasons.push(`${label}:${pattern}`);
    }
  }
  return reasons;
}

export async function listFormalMemoryFiles(workspaceRoot) {
  const files = [];
  const rootMemory = path.join(workspaceRoot, "MEMORY.md");
  try {
    await fs.access(rootMemory);
    files.push(rootMemory);
  } catch {}

  const memoryDir = path.join(workspaceRoot, "memory");
  try {
    const entries = await fs.readdir(memoryDir);
    for (const entry of entries.sort()) {
      if (entry.endsWith(".md") || entry.endsWith(".log") || entry.endsWith(".hmd") || entry.endsWith(".backup")) {
        files.push(path.join(memoryDir, entry));
      }
    }
  } catch {}

  return files;
}

export function auditFormalMemoryContent(filePath, raw) {
  const content = String(raw || "");
  const basename = path.basename(filePath);
  const reasons = [];

  for (const pattern of FILEPATH_ARCHIVE_HINTS) {
    if (pattern.test(basename)) {
      reasons.push(`archive-hint:${pattern}`);
    }
  }

  reasons.push(...collectPatternReasons(content, PENDING_PATTERNS, "pending"));
  reasons.push(...collectPatternReasons(content, RUNTIME_PATTERNS, "runtime"));
  reasons.push(...collectPatternReasons(content, PROCESS_PATTERNS, "process"));

  const pending = reasons.filter((item) => item.startsWith("pending:"));
  const runtime = reasons.filter((item) => item.startsWith("runtime:") || item.startsWith("archive-hint:"));
  const process = reasons.filter((item) => item.startsWith("process:"));

  let status = "clean";
  if (pending.length) {
    status = "pending-risk";
  } else if (runtime.length || process.length) {
    status = "archive-review";
  }

  return {
    filePath,
    basename,
    status,
    reasons,
    counts: {
      pending: pending.length,
      runtime: runtime.length,
      process: process.length
    }
  };
}

export async function auditFormalMemoryWorkspace(workspaceRoot) {
  const files = await listFormalMemoryFiles(workspaceRoot);
  const results = [];

  for (const filePath of files) {
    let raw = "";
    try {
      raw = await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }
    results.push(auditFormalMemoryContent(filePath, raw));
  }

  const summary = {
    total: results.length,
    clean: results.filter((item) => item.status === "clean").length,
    pendingRisk: results.filter((item) => item.status === "pending-risk").length,
    archiveReview: results.filter((item) => item.status === "archive-review").length
  };

  return { summary, results };
}

export function renderFormalMemoryAuditReport(audit, { workspaceRoot, generatedAt } = {}) {
  const lines = [];
  lines.push("# 正式记忆层巡检报告");
  if (generatedAt) {
    lines.push(`- 生成时间：${generatedAt}`);
  }
  if (workspaceRoot) {
    lines.push(`- 工作区：${workspaceRoot}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(`- 扫描文件数：\`${audit.summary.total}\``);
  lines.push(`- clean：\`${audit.summary.clean}\``);
  lines.push(`- pending-risk：\`${audit.summary.pendingRisk}\``);
  lines.push(`- archive-review：\`${audit.summary.archiveReview}\``);
  lines.push("");

  for (const status of ["pending-risk", "archive-review", "clean"]) {
    const group = audit.results.filter((item) => item.status === status);
    if (!group.length) {
      continue;
    }
    lines.push(`## ${status}`);
    for (const item of group) {
      lines.push(`### ${item.basename}`);
      lines.push(`- 路径：${item.filePath}`);
      lines.push(`- 状态：${item.status}`);
      if (item.reasons.length) {
        lines.push("- 触发原因：");
        for (const reason of item.reasons) {
          lines.push(`  - ${reason}`);
        }
      } else {
        lines.push("- 触发原因：无");
      }
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
