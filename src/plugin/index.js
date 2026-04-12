import { ContextAssemblyEngine } from "../engine.js";
import { resolvePluginConfig } from "../config.js";
import { createOpenClawSelfLearningService } from "./self-learning-service.js";

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

    api.registerContextEngine("unified-memory-core", () => engine);

    if (typeof api.registerService === "function") {
      api.registerService(createOpenClawSelfLearningService({
        logger: api.logger,
        pluginConfig
      }));
    } else if (pluginConfig.selfLearning.enabled) {
      api.logger.warn?.("[unified-memory-core] registerService() unavailable; nightly self-learning not started");
    }

    api.logger.info(
      `[unified-memory-core] loaded (enabled=${pluginConfig.enabled}, llmRerank=${pluginConfig.llmRerank.enabled}, maxCandidates=${pluginConfig.maxCandidates}, governedExports=${pluginConfig.openclawAdapter?.governedExports?.enabled !== false}, nightlySelfLearning=${pluginConfig.selfLearning.enabled}@${pluginConfig.selfLearning.localTime})`
    );
  }
};
