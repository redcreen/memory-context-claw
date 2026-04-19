import { delegateCompactionToRuntime } from "openclaw/plugin-sdk";
import { buildAssemblyResult } from "./assembly.js";
import { resolvePluginConfig } from "./config.js";
import { mergeSystemPromptAdditions } from "./dialogue-working-set-guarded.js";
import {
  captureDialogueWorkingSetShadow,
  isLikelyExplicitSwitchQuery
} from "./dialogue-working-set-runtime-shadow.js";
import { DistillationManager, estimateUsageRatio } from "./distillation-manager.js";
import { createOpenClawAdapterRuntime } from "./openclaw-adapter.js";
import { applyPolicyToScoredCandidates } from "./unified-memory-core/policy-adaptation.js";
import { retrieveMemoryCandidates } from "./retrieval.js";
import {
  applyRerankOrder,
  rerankCandidatesWithSubagent,
  shouldSkipLlmRerank
} from "./rerank.js";
import { scoreCandidates } from "./scoring.js";
import {
  estimateMessageTokens,
  estimateTokenCountFromText,
  extractLatestUserPrompt,
  isInternalRerankSession,
  parseAgentId
} from "./utils.js";

export class ContextAssemblyEngine {
  constructor({
    runtime,
    logger,
    pluginConfig,
    retrievalFn = retrieveMemoryCandidates,
    rerankFn = rerankCandidatesWithSubagent,
    structuredDecisionRunner = null,
    scoreFn = scoreCandidates,
    compactFn = delegateCompactionToRuntime
  }) {
    this.runtime = runtime;
    this.logger = logger;
    this.config = resolvePluginConfig(pluginConfig);
    this.retrievalFn = retrievalFn;
    this.rerankFn = rerankFn;
    this.structuredDecisionRunner = structuredDecisionRunner;
    this.scoreFn = scoreFn;
    this.compactFn = compactFn;
    this.openclawAdapterRuntime = createOpenClawAdapterRuntime({
      logger,
      pluginConfig: this.config
    });
    this.distillationManager = new DistillationManager({
      logger,
      config: this.config
    });
    this.info = {
      id: "unified-memory-core",
      name: "Unified Memory Core",
      version: "0.2.1",
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
    return this.compactFn(params);
  }

  async assemble(params) {
    const assembleStartedAt = Date.now();
    const query = params.prompt || extractLatestUserPrompt(params.messages);
    const internalRerankSession = isInternalRerankSession(params.sessionKey);
    const shouldRunDialogueWorkingSet = (
      (this.config.dialogueWorkingSetShadow?.enabled || this.config.dialogueWorkingSetGuarded?.enabled)
      && this.config.enabled
      && query
      && !internalRerankSession
    );
    let dialogueWorkingSetEventPromise = null;
    let dialogueWorkingSetEvent = null;
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
    let result = null;
    let candidateLoadElapsedMs = 0;
    let assemblyBuildElapsedMs = 0;

    if (!this.config.enabled || !query || internalRerankSession) {
      const assemblyBuildStartedAt = Date.now();
      result = buildAssemblyResult({
        messages: params.messages,
        tokenBudget: params.tokenBudget,
        memoryBudgetRatio: 0,
        recentMessageCount: this.config.recentMessageCount,
        candidates: []
      });
      assemblyBuildElapsedMs = Date.now() - assemblyBuildStartedAt;
    } else {
      const agentId = parseAgentId(params.sessionKey, this.config.forceAgentId);
      const explicitSwitchFastPath = (
        this.config.dialogueWorkingSetGuarded?.enabled === true
        && isLikelyExplicitSwitchQuery(query)
      );
      const candidateLoadStartedAt = Date.now();
      const [governedContext, retrievalCandidates] = explicitSwitchFastPath
        ? [{
            candidates: [],
            policyContext: {
              enabled: false,
              policy_inputs: [],
              policy_block: "",
              rollback: {
                status: "disabled",
                reason_codes: ["explicit_switch_fast_path"]
              }
            },
            exportResults: []
          }, []]
        : await Promise.all([
            this.openclawAdapterRuntime.loadGovernedContext({
              query,
              maxCandidates: this.config.openclawAdapter?.governedExports?.maxCandidates,
              agentId
            }),
            this.retrievalFn({
              openclawCommand: this.config.openclawCommand,
              agentId,
              query,
              maxCandidates: this.config.maxCandidates,
              cardArtifacts: this.config.cardArtifacts,
              excludePaths: this.config.excludePaths,
              queryRewrite: this.config.queryRewrite,
              logger: this.logger
            })
          ]);
      candidateLoadElapsedMs = Date.now() - candidateLoadStartedAt;
      const governedCandidates = Array.isArray(governedContext?.candidates)
        ? governedContext.candidates
        : [];
      const rawCandidates = [...governedCandidates, ...retrievalCandidates];

      if (rawCandidates.length === 0) {
        if (shouldRunDialogueWorkingSet && !dialogueWorkingSetEventPromise) {
          dialogueWorkingSetEventPromise = captureDialogueWorkingSetShadow({
            runtime: this.runtime,
            logger: this.logger,
            config: {
              ...this.config.dialogueWorkingSetShadow,
              enabled: true
            },
            guardedConfig: this.config.dialogueWorkingSetGuarded,
            sessionKey: params.sessionKey,
            query,
            messages: params.messages,
            decisionRunner: this.structuredDecisionRunner,
            assemblyMetrics: {
              candidateLoadElapsedMs
            }
          });
        }
        const assemblyBuildStartedAt = Date.now();
        let assemblyMessages = params.messages;
        if (this.config.dialogueWorkingSetGuarded?.enabled && dialogueWorkingSetEventPromise) {
          dialogueWorkingSetEvent = await dialogueWorkingSetEventPromise;
          if (dialogueWorkingSetEvent?.guarded?.applied) {
            assemblyMessages = dialogueWorkingSetEvent.guarded.filteredMessages;
          }
        }
        result = buildAssemblyResult({
          messages: assemblyMessages,
          tokenBudget: params.tokenBudget,
          memoryBudgetRatio: 0,
          recentMessageCount: this.config.recentMessageCount,
          candidates: []
        });
        assemblyBuildElapsedMs = Date.now() - assemblyBuildStartedAt;
      } else {
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
              logger: this.logger,
              decisionRunner: this.structuredDecisionRunner
            });
            if (reranked.length > 0) {
              rankedCandidates = applyRerankOrder(heuristicCandidates, reranked);
            }
          } catch (error) {
            this.logger?.warn?.(
              `[unified-memory-core] llm rerank failed, falling back to heuristic ranking: ${String(error)}`
            );
          }
        }

        const policyAdjusted = applyPolicyToScoredCandidates(rankedCandidates, {
          policyContext: governedContext?.policyContext,
          query
        });
        rankedCandidates = policyAdjusted.candidates;

        if (shouldRunDialogueWorkingSet && !dialogueWorkingSetEventPromise) {
          dialogueWorkingSetEventPromise = captureDialogueWorkingSetShadow({
            runtime: this.runtime,
            logger: this.logger,
            config: {
              ...this.config.dialogueWorkingSetShadow,
              enabled: true
            },
            guardedConfig: this.config.dialogueWorkingSetGuarded,
            sessionKey: params.sessionKey,
            query,
            messages: params.messages,
            decisionRunner: this.structuredDecisionRunner,
            assemblyMetrics: {
              candidateLoadElapsedMs
            }
          });
        }
        const assemblyBuildStartedAt = Date.now();
        let assemblyMessages = params.messages;
        if (this.config.dialogueWorkingSetGuarded?.enabled && dialogueWorkingSetEventPromise) {
          dialogueWorkingSetEvent = await dialogueWorkingSetEventPromise;
          if (dialogueWorkingSetEvent?.guarded?.applied) {
            assemblyMessages = dialogueWorkingSetEvent.guarded.filteredMessages;
          }
        }
        result = buildAssemblyResult({
          messages: assemblyMessages,
          tokenBudget: params.tokenBudget,
          memoryBudgetRatio: this.config.memoryBudgetRatio,
          recentMessageCount: this.config.recentMessageCount,
          maxSelectedChunks: this.config.maxSelectedChunks,
          maxChunksPerPath: this.config.maxChunksPerPath,
          candidates: rankedCandidates,
          policyContext: governedContext?.policyContext
        });
        assemblyBuildElapsedMs = Date.now() - assemblyBuildStartedAt;
      }

      if (explicitSwitchFastPath) {
        const switchHint = [
          "The user explicitly switched to a new topic.",
          "Answer only the new request.",
          "Be direct and concise on this first reply.",
          "Do not restate or summarize the older archived topic unless the user asks for it."
        ].join(" ");
        const mergedAddition = mergeSystemPromptAdditions(
          switchHint,
          result.systemPromptAddition
        );
        const estimatedTokens =
          result.messages.reduce((sum, message) => sum + estimateMessageTokens(message), 0) +
          estimateTokenCountFromText(mergedAddition);
        result = {
          ...result,
          systemPromptAddition: mergedAddition,
          estimatedTokens
        };
      }
    }

    if (dialogueWorkingSetEventPromise && !dialogueWorkingSetEvent) {
      dialogueWorkingSetEvent = await dialogueWorkingSetEventPromise;
    }

    if (dialogueWorkingSetEvent?.guarded?.applied) {
      const mergedAddition = mergeSystemPromptAdditions(
        dialogueWorkingSetEvent.guarded.carryForwardText,
        result.systemPromptAddition
      );
      const estimatedTokens =
        result.messages.reduce((sum, message) => sum + estimateMessageTokens(message), 0) +
        estimateTokenCountFromText(mergedAddition);
      result = {
        ...result,
        systemPromptAddition: mergedAddition,
        estimatedTokens
      };
    }

    return result;
  }
}
