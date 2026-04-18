import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { mergeInstallConfig } from "../src/install-config.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dropPlugins = ["openclaw-task-system", "openclaw-lark", "style-engine"];

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

export function buildHermeticOpenClawEnv(extraEnv = {}) {
  return {
    ...process.env,
    NODE_LLAMA_CPP_GPU: "false",
    ...extraEnv
  };
}

export async function copyRecursive(sourcePath, targetPath) {
  const stat = await fs.stat(sourcePath);
  if (stat.isDirectory()) {
    await fs.mkdir(targetPath, { recursive: true });
    const entries = await fs.readdir(sourcePath);
    for (const entry of entries) {
      await copyRecursive(path.join(sourcePath, entry), path.join(targetPath, entry));
    }
    return;
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

export function stripUnifiedMemoryCoreHostConfig(inputConfig) {
  const config = structuredClone(inputConfig || {});
  config.plugins = config.plugins || {};
  config.plugins.slots = config.plugins.slots || {};
  config.plugins.slots.contextEngine = "legacy";

  if (Array.isArray(config.plugins.allow)) {
    config.plugins.allow = config.plugins.allow.filter(
      (item) => !dropPlugins.includes(item) && item !== "unified-memory-core"
    );
  }

  if (config.plugins.entries && typeof config.plugins.entries === "object") {
    delete config.plugins.entries["unified-memory-core"];
    for (const pluginId of dropPlugins) {
      delete config.plugins.entries[pluginId];
    }
  }

  if (config.plugins.installs && typeof config.plugins.installs === "object") {
    delete config.plugins.installs["unified-memory-core"];
    for (const pluginId of dropPlugins) {
      delete config.plugins.installs[pluginId];
    }
  }

  if (config.plugins.load && Array.isArray(config.plugins.load.paths)) {
    config.plugins.load.paths = config.plugins.load.paths.filter((item) => {
      const text = String(item || "");
      if (text.includes("unified-memory-core")) {
        return false;
      }
      return !dropPlugins.some((pluginId) => text.includes(pluginId));
    });
  }

  return config;
}

export function resolveHermeticFixtureRoot(explicitPath = "") {
  return path.resolve(
    normalizeString(explicitPath, path.join(repoRoot, "evals", "openclaw-cli-memory-fixture"))
  );
}

export function resolveHermeticPluginPath(explicitPath = "") {
  return path.resolve(normalizeString(explicitPath, repoRoot));
}

export async function resolveHermeticEmbedModelPath(explicitPath = "") {
  const candidates = [
    normalizeString(explicitPath),
    normalizeString(process.env.UMC_EVAL_EMBED_MODEL_PATH),
    normalizeString(process.env.OPENCLAW_EMBED_MODEL_PATH),
    path.join(os.homedir(), ".openclaw", "models", "embeddinggemma-300m-qat-Q8_0.gguf")
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    try {
      await fs.access(resolved);
      return resolved;
    } catch {
      // continue
    }
  }

  throw new Error(
    [
      "Unable to resolve a local embedding model for hermetic OpenClaw evaluation.",
      "Set --embed-model-path or UMC_EVAL_EMBED_MODEL_PATH to a readable GGUF file."
    ].join(" ")
  );
}

export async function resolveHermeticAuthProfilesPath(explicitPath = "") {
  const candidates = [
    normalizeString(explicitPath),
    normalizeString(process.env.UMC_EVAL_AUTH_PROFILES_PATH),
    path.join(os.homedir(), ".openclaw", "agents", "main", "agent", "auth-profiles.json"),
    path.join(os.homedir(), ".openclaw", "agents", "umceval65", "agent", "auth-profiles.json")
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    try {
      await fs.access(resolved);
      return resolved;
    } catch {
      // continue
    }
  }

  return "";
}

export function resolveHermeticAgentModel(explicitModel = "") {
  return normalizeString(
    explicitModel,
    normalizeString(process.env.UMC_EVAL_AGENT_MODEL, normalizeString(process.env.OPENCLAW_AGENT_MODEL))
  );
}

export function buildHermeticOpenClawConfig({
  agentId,
  agentDir,
  workspacePath,
  modelPath,
  pluginPath,
  preset = "safe-local",
  includeUMC = true,
  agentModel = "",
  disableMemorySearchWatch = true
}) {
  const baseConfig = {
    commands: {},
    agents: {
      defaults: {
        workspace: workspacePath
      },
      list: [
        {
          id: agentId,
          name: agentId,
          workspace: workspacePath,
          agentDir
        }
      ]
    }
  };

  if (agentModel) {
    baseConfig.agents.defaults.model = { primary: agentModel };
    baseConfig.agents.list[0].model = { primary: agentModel };
  }

  const merged = mergeInstallConfig(baseConfig, {
    agentId,
    modelPath,
    workspacePath,
    pluginPath,
    preset
  });

  if (disableMemorySearchWatch) {
    for (const agent of merged?.agents?.list || []) {
      if (agent?.memorySearch?.sync && typeof agent.memorySearch.sync === "object") {
        agent.memorySearch.sync.watch = false;
      }
    }
  }

  return includeUMC ? merged : stripUnifiedMemoryCoreHostConfig(merged);
}

async function runOpenClawCommand(openclawBin, args, stateDir) {
  try {
    const result = await execFileAsync(openclawBin, args, {
      cwd: repoRoot,
      env: buildHermeticOpenClawEnv({
        OPENCLAW_STATE_DIR: stateDir
      }),
      maxBuffer: 16 * 1024 * 1024
    });
    return {
      ok: true,
      stdout: String(result.stdout || ""),
      stderr: String(result.stderr || "")
    };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || ""),
      stderr: String(error.stderr || ""),
      error: String(error?.message || error)
    };
  }
}

export async function createHermeticOpenClawState({
  openclawBin = "openclaw",
  agentId,
  includeUMC = true,
  fixtureRoot = "",
  pluginPath = "",
  embedModelPath = "",
  authProfilesPath = "",
  preset = "safe-local",
  agentModel = ""
}) {
  const resolvedFixtureRoot = resolveHermeticFixtureRoot(fixtureRoot);
  const resolvedPluginPath = resolveHermeticPluginPath(pluginPath);
  const resolvedEmbedModelPath = await resolveHermeticEmbedModelPath(embedModelPath);
  const resolvedAuthProfilesPath = await resolveHermeticAuthProfilesPath(authProfilesPath);
  const resolvedAgentModel = resolveHermeticAgentModel(agentModel);
  const stateDir = await fs.mkdtemp(
    path.join(os.tmpdir(), includeUMC ? "umc-hermetic-current-" : "umc-hermetic-legacy-")
  );
  const agentDir = path.join(stateDir, "agents", agentId, "agent");
  const sessionsDir = path.join(stateDir, "agents", agentId, "sessions");
  const configPath = path.join(stateDir, "openclaw.json");

  await copyRecursive(resolvedFixtureRoot, agentDir);
  if (resolvedAuthProfilesPath) {
    await copyRecursive(resolvedAuthProfilesPath, path.join(agentDir, "auth-profiles.json"));
  }
  await fs.mkdir(sessionsDir, { recursive: true });
  await fs.writeFile(path.join(sessionsDir, "sessions.json"), "{}\n", "utf8");
  await fs.mkdir(path.join(stateDir, "memory"), { recursive: true });

  const config = buildHermeticOpenClawConfig({
    agentId,
    agentDir,
    workspacePath: agentDir,
    modelPath: resolvedEmbedModelPath,
    pluginPath: resolvedPluginPath,
    preset,
    includeUMC,
    agentModel: resolvedAgentModel
  });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  const validate = await runOpenClawCommand(openclawBin, ["--no-color", "config", "validate"], stateDir);
  if (!validate.ok) {
    throw new Error(
      `Hermetic OpenClaw config validation failed: ${validate.error || validate.stderr || validate.stdout}`
    );
  }

  const index = await runOpenClawCommand(
    openclawBin,
    ["--no-color", "memory", "index", "--agent", agentId, "--force"],
    stateDir
  );
  if (!index.ok) {
    throw new Error(
      `Hermetic OpenClaw memory index failed: ${index.error || index.stderr || index.stdout}`
    );
  }

  return {
    stateDir,
    agentDir,
    configPath,
    fixtureRoot: resolvedFixtureRoot,
    pluginPath: resolvedPluginPath,
    embedModelPath: resolvedEmbedModelPath,
    authProfilesPath: resolvedAuthProfilesPath,
    agentModel: resolvedAgentModel,
    includeUMC
  };
}

export async function cloneHermeticOpenClawState(baseStateDir, prefix = "umc-hermetic-case-") {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await copyRecursive(baseStateDir, stateDir);
  return stateDir;
}

export async function cleanupHermeticOpenClawState(stateDir) {
  if (!stateDir) {
    return;
  }
  await fs.rm(stateDir, { recursive: true, force: true }).catch(() => {});
}
