import fs from "node:fs/promises";
import path from "node:path";

import {
  extractConversationMemoryCandidates,
  projectRuntimeMessagesToConversationItems,
  renderConversationMemoryReport
} from "./conversation-memory.js";
import { estimateMessageTokens, parseAgentId } from "./utils.js";

function sanitizeSessionKey(sessionKey = "") {
  return String(sessionKey || "main").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function resolveOutputPath(config, cwd, sessionKey, stage) {
  const baseDir = config.outputDir?.trim()
    ? config.outputDir.trim()
    : path.join(cwd, "reports", "candidate-memory");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(baseDir, `${sanitizeSessionKey(sessionKey)}.${stage}.${timestamp}.md`);
}

export function estimateUsageRatio(messages, tokenBudget) {
  const budget = Math.max(1, Number(tokenBudget || 0));
  const used = (Array.isArray(messages) ? messages : [])
    .reduce((sum, message) => sum + estimateMessageTokens(message), 0);
  return used / budget;
}

export class DistillationManager {
  constructor({
    logger,
    config,
    cwd = process.cwd()
  }) {
    this.logger = logger;
    this.config = config;
    this.cwd = cwd;
    this.lastTriggerBySession = new Map();
  }

  shouldTrigger({ sessionKey, stage, usageRatio }) {
    const cfg = this.config.memoryDistillation;
    if (!cfg.enabled) {
      return false;
    }
    if (stage === "pre-compact-threshold" && !cfg.triggerBeforeCompaction) {
      return false;
    }
    if (stage === "compact-fallback" && !cfg.compactFallback) {
      return false;
    }
    if (stage === "pre-compact-threshold" && usageRatio < cfg.preCompactTriggerRatio) {
      return false;
    }
    const key = `${sessionKey}:${stage}`;
    const now = Date.now();
    const last = this.lastTriggerBySession.get(key) || 0;
    if (now - last < cfg.cooldownMs) {
      return false;
    }
    this.lastTriggerBySession.set(key, now);
    return true;
  }

  async run({ sessionKey, messages, tokenBudget, stage }) {
    const cfg = this.config.memoryDistillation;
    const usageRatio = estimateUsageRatio(messages, tokenBudget);
    if (!this.shouldTrigger({ sessionKey, stage, usageRatio })) {
      return null;
    }

    const agentId = parseAgentId(sessionKey, this.config.forceAgentId);
    const conversationItems = projectRuntimeMessagesToConversationItems(messages, {
      fallbackFilePath: sessionKey
    });
    const candidates = extractConversationMemoryCandidates(conversationItems);
    const markdown = renderConversationMemoryReport({
      files: [sessionKey],
      messages: conversationItems,
      ...candidates
    }, {
      agentId,
      workspaceRoot: path.resolve(this.cwd, "..")
    });
    const outputPath = resolveOutputPath(cfg, this.cwd, sessionKey, stage);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, markdown, "utf8");
    this.logger?.info?.(
      `[unified-memory-core] wrote async candidate memory (${stage}, usage=${usageRatio.toFixed(3)}) to ${outputPath}`
    );
    return { outputPath, usageRatio, stage };
  }

  schedule(params) {
    void this.run(params).catch((error) => {
      this.logger?.warn?.(
        `[unified-memory-core] async distillation failed: ${String(error)}`
      );
    });
  }
}
