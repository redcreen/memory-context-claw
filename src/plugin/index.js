import { ContextAssemblyEngine } from "../engine.js";
import { resolvePluginConfig } from "../config.js";

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

    api.logger.info(
      `[unified-memory-core] loaded (enabled=${pluginConfig.enabled}, llmRerank=${pluginConfig.llmRerank.enabled}, maxCandidates=${pluginConfig.maxCandidates}, governedExports=${pluginConfig.openclawAdapter?.governedExports?.enabled !== false})`
    );
  }
};
