#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeInstallConfig } from "../src/install-config.js";
import { listPresetNames } from "../src/presets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage() {
  console.log(
    [
      "Usage: node scripts/apply-openclaw-config.js --workspace <path> [options]",
      "",
      "Options:",
      "  --config <path>         OpenClaw config path",
      "  --plugin-path <path>    memory-context-claw directory path",
      "  --agent <id>            Agent id to configure (default: main)",
      "  --model-path <path>     Local GGUF embedding model path",
      `  --preset <name>         Plugin config preset (${listPresetNames().join(", ")})`,
      "  --dry-run               Print merged config and exit",
      "  --help                  Show this message"
    ].join("\n")
  );
}

function parseArgs(argv) {
  const options = {
    configPath: path.join(os.homedir(), ".openclaw", "openclaw.json"),
    pluginPath: path.resolve(__dirname, ".."),
    workspacePath: "",
    agentId: "main",
    preset: "safe-local",
    modelPath: path.join(
      os.homedir(),
      ".openclaw",
      "models",
      "embeddinggemma-300m-qat-Q8_0.gguf"
    ),
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") options.configPath = argv[++index];
    else if (arg === "--plugin-path") options.pluginPath = argv[++index];
    else if (arg === "--workspace") options.workspacePath = argv[++index];
    else if (arg === "--agent") options.agentId = argv[++index];
    else if (arg === "--preset") options.preset = argv[++index];
    else if (arg === "--model-path") options.modelPath = argv[++index];
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.workspacePath) {
    throw new Error("Missing required --workspace <path>");
  }

  options.configPath = path.resolve(options.configPath);
  options.pluginPath = path.resolve(options.pluginPath);
  options.workspacePath = path.resolve(options.workspacePath);
  options.modelPath = path.resolve(options.modelPath);
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const raw = await fs.readFile(options.configPath, "utf8");
  const config = JSON.parse(raw);
  const merged = mergeInstallConfig(config, options);

  if (options.dryRun) {
    console.log(JSON.stringify(merged, null, 2));
    return;
  }

  await fs.writeFile(options.configPath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        configPath: options.configPath,
        pluginPath: options.pluginPath,
        workspacePath: options.workspacePath,
        agentId: options.agentId,
        preset: options.preset,
        modelPath: options.modelPath,
        contextEngine: "memory-context-claw"
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
