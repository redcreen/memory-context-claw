import { ContextAssemblyEngine } from "../engine.js";
import { resolvePluginConfig } from "../config.js";

export default {
  id: "memory-context-claw",
  name: "Memory Context Claw",
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

    api.registerContextEngine("memory-context-claw", () => engine);

    api.logger.info(
      `[memory-context-claw] loaded (enabled=${pluginConfig.enabled}, llmRerank=${pluginConfig.llmRerank.enabled}, maxCandidates=${pluginConfig.maxCandidates})`
    );
  }
};
