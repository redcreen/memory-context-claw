import { delegateCompactionToRuntime } from "openclaw/plugin-sdk";
import { buildAssemblyResult } from "./assembly.js";
import { resolvePluginConfig } from "./config.js";
import { DistillationManager, estimateUsageRatio } from "./distillation-manager.js";
import { retrieveMemoryCandidates } from "./retrieval.js";
import {
  applyRerankOrder,
  rerankCandidatesWithSubagent,
  shouldSkipLlmRerank
} from "./rerank.js";
import { scoreCandidates } from "./scoring.js";
import { extractLatestUserPrompt, isInternalRerankSession, parseAgentId } from "./utils.js";

export class ContextAssemblyEngine {
  constructor({
    runtime,
    logger,
    pluginConfig,
    retrievalFn = retrieveMemoryCandidates,
    rerankFn = rerankCandidatesWithSubagent,
    scoreFn = scoreCandidates
  }) {
    this.runtime = runtime;
    this.logger = logger;
    this.config = resolvePluginConfig(pluginConfig);
    this.retrievalFn = retrievalFn;
    this.rerankFn = rerankFn;
    this.scoreFn = scoreFn;
    this.distillationManager = new DistillationManager({
      logger,
      config: this.config
    });
    this.info = {
      id: "memory-context-claw",
      name: "Memory Context Claw",
      version: "0.1.0",
      ownsCompaction: false
    };
  }

  async ingest() {
    return { ingested: true };
  }

  async compact(params) {
    if (this.config.memoryDistillation.enabled && this.config.memoryDistillation.compactFallback) {
      this.distillationManager.schedule({
        sessionKey: params.sessionKey || "agent:main:compact",
        messages: params.messages || [],
        tokenBudget: params.tokenBudget || 0,
        stage: "compact-fallback"
      });
    }
    return delegateCompactionToRuntime(params);
  }

  async assemble(params) {
    const query = params.prompt || extractLatestUserPrompt(params.messages);
    const usageRatio = estimateUsageRatio(params.messages, params.tokenBudget);
    if (this.config.memoryDistillation.enabled &&
      this.config.memoryDistillation.triggerBeforeCompaction &&
      usageRatio >= this.config.memoryDistillation.preCompactTriggerRatio) {
      this.distillationManager.schedule({
        sessionKey: params.sessionKey || "agent:main:pre-compact",
        messages: params.messages || [],
        tokenBudget: params.tokenBudget || 0,
        stage: "pre-compact-threshold"
      });
    }
    if (!this.config.enabled || !query || isInternalRerankSession(params.sessionKey)) {
      return buildAssemblyResult({
        messages: params.messages,
        tokenBudget: params.tokenBudget,
        memoryBudgetRatio: 0,
        recentMessageCount: this.config.recentMessageCount,
        candidates: []
      });
    }

    const agentId = parseAgentId(params.sessionKey, this.config.forceAgentId);
    const rawCandidates = await this.retrievalFn({
      openclawCommand: this.config.openclawCommand,
      agentId,
      query,
      maxCandidates: this.config.maxCandidates,
      cardArtifacts: this.config.cardArtifacts,
      excludePaths: this.config.excludePaths,
      queryRewrite: this.config.queryRewrite,
      logger: this.logger
    });

    if (rawCandidates.length === 0) {
      return buildAssemblyResult({
        messages: params.messages,
        tokenBudget: params.tokenBudget,
        memoryBudgetRatio: 0,
        recentMessageCount: this.config.recentMessageCount,
        candidates: []
      });
    }

    const heuristicCandidates = this.scoreFn(
      rawCandidates,
      query,
      this.config.weights
    ).slice(0, this.config.maxSelectedChunks * 3);

    let rankedCandidates = heuristicCandidates.map((candidate) => ({
      ...candidate,
      finalScore: candidate.weightedScore
    }));

    if (!shouldSkipLlmRerank(heuristicCandidates, this.config.llmRerank)) {
      try {
        const reranked = await this.rerankFn({
          runtime: this.runtime,
          sessionKey: params.sessionKey || `agent:${agentId}:main`,
          query,
          candidates: heuristicCandidates,
          config: this.config.llmRerank,
          logger: this.logger
        });
        if (reranked.length > 0) {
          rankedCandidates = applyRerankOrder(heuristicCandidates, reranked);
        }
      } catch (error) {
        this.logger?.warn?.(
          `[memory-context-claw] llm rerank failed, falling back to heuristic ranking: ${String(error)}`
        );
      }
    }

    return buildAssemblyResult({
      messages: params.messages,
      tokenBudget: params.tokenBudget,
      memoryBudgetRatio: this.config.memoryBudgetRatio,
      recentMessageCount: this.config.recentMessageCount,
      maxSelectedChunks: this.config.maxSelectedChunks,
      maxChunksPerPath: this.config.maxChunksPerPath,
      candidates: rankedCandidates
    });
  }
}
