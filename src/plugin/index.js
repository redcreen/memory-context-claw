import { ContextAssemblyEngine } from "../engine.js";
import { resolvePluginConfig } from "../config.js";
import { createOpenClawAcceptedActionHookRuntime } from "./accepted-action-hook.js";
import { createOpenClawOrdinaryConversationHookRuntime } from "./ordinary-conversation-memory-hook.js";
import { createOpenClawSelfLearningService } from "./self-learning-service.js";

function normalizeCanaryString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function buildAcceptedActionCanaryResult(rawParams = {}) {
  const canaryId = normalizeCanaryString(rawParams.canary_id, "umc-canary");
  const target = normalizeCanaryString(
    rawParams.target,
    `https://example.invalid/umc-canary/${encodeURIComponent(canaryId)}`
  );
  const artifact = normalizeCanaryString(
    rawParams.artifact,
    `artifacts/${canaryId}.txt`
  );
  const summary = normalizeCanaryString(
    rawParams.summary,
    `UMC canary ${canaryId} executed successfully.`
  );
  const status = normalizeCanaryString(rawParams.status, "succeeded");
  const accepted = rawParams.accepted !== false;
  const succeeded = rawParams.succeeded !== false;
  const replyText = normalizeCanaryString(
    rawParams.reply_text,
    `accepted_action canary emitted for ${canaryId}`
  );

  return {
    content: [
      {
        type: "text",
        text: replyText
      }
    ],
    accepted_action: {
      actionType: "umc_emit_accepted_action_canary",
      accepted,
      succeeded,
      status,
      targets: [target],
      artifacts: [artifact],
      outputs: {
        canaryId,
        target,
        artifact
      },
      content: summary
    },
    details: {
      canaryId,
      target,
      artifact,
      summary,
      status,
      accepted,
      succeeded
    }
  };
}

export default {
  id: "unified-memory-core",
  name: "Unified Memory Core",
  description: "Memory-first reranking and context assembly for OpenClaw",

  configSchema: {
    parse(value) {
      return resolvePluginConfig(value);
    }
  },

  register(api) {
    const pluginConfig = resolvePluginConfig(api.pluginConfig);
    const engine = new ContextAssemblyEngine({
      runtime: api.runtime,
      logger: api.logger,
      pluginConfig
    });
    const acceptedActionHookRuntime = createOpenClawAcceptedActionHookRuntime({
      logger: api.logger,
      pluginConfig
    });
    const ordinaryConversationHookRuntime = createOpenClawOrdinaryConversationHookRuntime({
      logger: api.logger,
      pluginConfig
    });

    api.registerContextEngine("unified-memory-core", () => engine);

    if (typeof api.registerTool === "function" && pluginConfig.openclawAdapter?.debug?.canaryTool === true) {
      api.registerTool({
        name: "umc_emit_accepted_action_canary",
        label: "Emit UMC Accepted-Action Canary",
        description: "Emit a structured accepted_action payload so OpenClaw after_tool_call canaries can be verified end-to-end.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            canary_id: { type: "string", description: "Stable id for this canary run." },
            target: { type: "string", description: "Reusable target URI or identifier for the canary." },
            artifact: { type: "string", description: "Artifact path produced by this canary." },
            summary: { type: "string", description: "Accepted-action summary text stored in registry." },
            reply_text: { type: "string", description: "User-visible tool reply text." },
            status: { type: "string", description: "Accepted-action status string." },
            accepted: { type: "boolean", description: "Whether the user accepted the action." },
            succeeded: { type: "boolean", description: "Whether execution succeeded." }
          },
          required: ["canary_id"]
        },
        async execute(_toolCallId, rawParams) {
          return buildAcceptedActionCanaryResult(rawParams);
        }
      });
    }

    if (typeof api.on === "function" && acceptedActionHookRuntime.enabled) {
      api.on("after_tool_call", async (event, ctx) => acceptedActionHookRuntime.captureAfterToolCall(event, ctx));
    }
    if (typeof api.on === "function" && ordinaryConversationHookRuntime.enabled) {
      api.on("before_agent_start", async (event, ctx) => ordinaryConversationHookRuntime.captureBeforeAgentStart(event, ctx));
      api.on("agent_end", async (event, ctx) => ordinaryConversationHookRuntime.captureAgentEnd(event, ctx));
    }

    if (typeof api.registerService === "function") {
      api.registerService(createOpenClawSelfLearningService({
        logger: api.logger,
        pluginConfig
      }));
    } else if (pluginConfig.selfLearning.enabled) {
      api.logger.warn?.("[unified-memory-core] registerService() unavailable; nightly self-learning not started");
    }

    api.logger.info(
      `[unified-memory-core] loaded (enabled=${pluginConfig.enabled}, llmRerank=${pluginConfig.llmRerank.enabled}, maxCandidates=${pluginConfig.maxCandidates}, governedExports=${pluginConfig.openclawAdapter?.governedExports?.enabled !== false}, nightlySelfLearning=${pluginConfig.selfLearning.enabled}@${pluginConfig.selfLearning.localTime}, ordinaryConversationMemory=${pluginConfig.openclawAdapter?.ordinaryConversationMemory?.enabled !== false}, canaryTool=${pluginConfig.openclawAdapter?.debug?.canaryTool === true})`
    );
  }
};
