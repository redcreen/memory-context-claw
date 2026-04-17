#!/usr/bin/env node

import fs from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultScenariosPath = path.resolve(repoRoot, "evals", "openclaw-docker-scenarios.js");
const defaultComposeFile = path.resolve(repoRoot, "docker-compose.openclaw-eval.yml");
const defaultAuthProfilesPath = fs.existsSync(path.join(process.env.HOME || "", ".openclaw", "agents", "main", "agent", "auth-profiles.json"))
  ? path.join(process.env.HOME || "", ".openclaw", "agents", "main", "agent", "auth-profiles.json")
  : "";
const defaultCodexHomePath = fs.existsSync(path.join(process.env.HOME || "", ".codex"))
  ? path.join(process.env.HOME || "", ".codex")
  : "";
const fallbackEmptyCodexHomePath = path.resolve(repoRoot, ".cache", "openclaw-empty-codex-home");

function resolveDefaultOpenClawImage() {
  const explicit = normalizeString(process.env.OPENCLAW_EVAL_IMAGE);
  if (explicit) {
    return explicit;
  }
  try {
    const versionOutput = execFileSync("openclaw", ["--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    const match = versionOutput.match(/OpenClaw\s+([0-9][^\s]*)/i);
    if (match?.[1]) {
      return `ghcr.io/openclaw/openclaw:${match[1]}`;
    }
  } catch {
    // Fall back to latest when the host CLI is unavailable.
  }
  return "ghcr.io/openclaw/openclaw:latest";
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function rewriteDockerProxyUrl(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname;
    if (host === "127.0.0.1" || host === "localhost" || host === "::1") {
      parsed.hostname = "host.docker.internal";
      return parsed.toString();
    }
  } catch {
    // Preserve the original string when proxy parsing fails.
  }

  return normalized;
}

function parseArgs(argv) {
  const options = {
    dockerBin: "docker",
    composeFile: defaultComposeFile,
    scenariosPath: defaultScenariosPath,
    scenarioIds: [],
    image: resolveDefaultOpenClawImage(),
    embedModelPath: normalizeString(process.env.UMC_DOCKER_EMBED_MODEL_PATH),
    authProfilesPath: normalizeString(process.env.UMC_DOCKER_AUTH_PROFILES_PATH, defaultAuthProfilesPath),
    codexHomePath: normalizeString(process.env.UMC_DOCKER_CODEX_HOME_PATH, defaultCodexHomePath),
    agentModel: normalizeString(process.env.UMC_EVAL_AGENT_MODEL),
    pull: true,
    build: true,
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--docker-bin") options.dockerBin = argv[++index];
    else if (arg === "--compose-file") options.composeFile = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--scenarios") options.scenariosPath = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--scenario") options.scenarioIds.push(argv[++index]);
    else if (arg === "--image") options.image = argv[++index];
    else if (arg === "--embed-model-path") options.embedModelPath = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--auth-profiles-path") options.authProfilesPath = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--codex-home-path") options.codexHomePath = path.resolve(process.cwd(), argv[++index]);
    else if (arg === "--agent-model") options.agentModel = argv[++index];
    else if (arg === "--no-pull") options.pull = false;
    else if (arg === "--no-build") options.build = false;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/run-openclaw-docker-eval.js [options]",
          "",
          "Options:",
          "  --scenario <id>            Run one scenario id; repeatable",
          "  --scenarios <path>         Scenario module path (default: evals/openclaw-docker-scenarios.js)",
          "  --compose-file <path>      Docker compose file (default: docker-compose.openclaw-eval.yml)",
          "  --docker-bin <bin>         Docker CLI binary (default: docker)",
          "  --image <ref>              OpenClaw image reference (default: ghcr.io/openclaw/openclaw:<host-version>)",
          "  --embed-model-path <path>  Host GGUF mounted read-only into the container",
          "  --auth-profiles-path <path> Host OpenClaw auth-profiles.json mounted read-only into the container",
          "  --codex-home-path <path>  Host Codex home mounted read-only as a seed home inside the container",
          "  --agent-model <id>         Optional explicit agent model id passed into the container",
          "  --no-pull                  Skip `docker pull` before running scenarios",
          "  --no-build                 Skip `docker compose build` for the derived eval image",
          "  --dry-run                  Print the planned docker commands without running them"
        ].join("\n")
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.embedModelPath) {
    throw new Error(
      "Missing embed model path. Set --embed-model-path or UMC_DOCKER_EMBED_MODEL_PATH."
    );
  }
  if (!options.authProfilesPath) {
    throw new Error(
      "Missing auth-profiles path. Set --auth-profiles-path or UMC_DOCKER_AUTH_PROFILES_PATH."
    );
  }

  if (!options.codexHomePath) {
    options.codexHomePath = fallbackEmptyCodexHomePath;
  }

  return options;
}

async function importScenarios(scenariosPath) {
  const moduleUrl = pathToFileURL(scenariosPath).href;
  const imported = await import(moduleUrl);
  const scenarios = imported.default || imported.scenarios || [];
  if (!Array.isArray(scenarios)) {
    throw new Error(`Scenario module did not export an array: ${scenariosPath}`);
  }
  return scenarios;
}

async function runDockerCommand(dockerBin, args, env, dryRun = false) {
  const printable = [dockerBin, ...args].join(" ");
  process.stderr.write(`[docker-eval] ${printable}\n`);
  if (dryRun) {
    return;
  }
  await new Promise((resolve, reject) => {
    const child = spawn(dockerBin, args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        ...env
      },
      stdio: "inherit"
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Docker command failed with exit code ${code}`));
    });
    child.on("error", reject);
  });
}

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function buildComposeEnvFlags(env) {
  return Object.entries(env)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .flatMap(([key, value]) => ["-e", `${key}=${value}`]);
}

function buildScenarioEnv(scenario, options) {
  const env = {
    OPENCLAW_EVAL_IMAGE: options.image,
    OPENCLAW_EVAL_DERIVED_IMAGE: `umc-openclaw-eval:${normalizeString(options.image).replace(/[^a-zA-Z0-9_.-]+/g, "-") || "latest"}`,
    UMC_DOCKER_EMBED_MODEL_PATH: options.embedModelPath,
    UMC_DOCKER_AUTH_PROFILES_PATH: options.authProfilesPath,
    UMC_DOCKER_CODEX_HOME_PATH: options.codexHomePath,
    UMC_EVAL_EXECUTION_ENV: "docker",
    UMC_EVAL_DOCKER_IMAGE: options.image,
    UMC_EVAL_REPO_ROOT: "/workspace",
    UMC_EVAL_SCRIPT: normalizeString(scenario.script),
    UMC_EVAL_CASES: normalizeString(scenario.cases),
    UMC_EVAL_AGENT: normalizeString(scenario.agent, "umceval65"),
    UMC_EVAL_FIXTURE_ROOT: normalizeString(scenario.fixtureRoot, "evals/openclaw-cli-memory-fixture"),
    UMC_EVAL_PLUGIN_PATH: "/workspace",
    UMC_EVAL_PRESET: normalizeString(scenario.preset, "safe-local"),
    UMC_EVAL_AUTH_PROFILES_PATH: "/opt/openclaw/auth/auth-profiles.json",
    UMC_EVAL_AGENT_MODEL: normalizeString(options.agentModel, normalizeString(scenario.agentModel)),
    UMC_EVAL_WRITE_JSON: normalizeString(scenario.writeJson),
    UMC_EVAL_WRITE_MARKDOWN: normalizeString(scenario.writeMarkdown),
    UMC_EVAL_FORMAT: normalizeString(scenario.format, "markdown")
  };

  for (const key of [
    "NODE_USE_ENV_PROXY",
    "ALL_PROXY",
    "all_proxy",
    "HTTP_PROXY",
    "http_proxy",
    "HTTPS_PROXY",
    "https_proxy",
    "NO_PROXY",
    "no_proxy"
  ]) {
    const value = normalizeString(process.env[key]);
    if (value) {
      env[key] = /proxy/i.test(key) ? rewriteDockerProxyUrl(value) : value;
    }
  }

  const hasProxyEnv = [
    env.ALL_PROXY,
    env.all_proxy,
    env.HTTP_PROXY,
    env.http_proxy,
    env.HTTPS_PROXY,
    env.https_proxy
  ].some((value) => typeof value === "string" && value.length > 0);
  if (hasProxyEnv && !normalizeString(env.NODE_USE_ENV_PROXY)) {
    env.NODE_USE_ENV_PROXY = "1";
  }

  for (const key of [
    "UMC_EVAL_ONLY",
    "UMC_EVAL_MAX_CASES",
    "UMC_EVAL_TIMEOUT_MS",
    "UMC_EVAL_CAPTURE_POLL_MS",
    "UMC_EVAL_SHARD_SIZE",
    "UMC_EVAL_SHARD_COUNT",
    "UMC_EVAL_AGENT_TIMEOUT_MS",
    "UMC_EVAL_ORDINARY_RUNNER_MODE",
    "UMC_EVAL_GATEWAY_PORT_BASE",
    "UMC_EVAL_EXTRA_ARGS",
    "UMC_EVAL_REFRESH_TEMPLATE_CACHE",
    "UMC_EVAL_TEMPLATE_CACHE_ROOT",
    "UMC_EVAL_KEEP_STATE",
    "UMC_EVAL_FAST_FAIL_CAPTURE"
  ]) {
    const value = normalizeString(process.env[key]);
    if (value) {
      env[key] = value;
    }
  }

  return env;
}

function applyScenarioArgs(env, scenario) {
  const args = Array.isArray(scenario.args) ? scenario.args : [];
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (flag === "--shard-size" && !normalizeString(env.UMC_EVAL_SHARD_SIZE)) env.UMC_EVAL_SHARD_SIZE = String(value);
    else if (flag === "--shard-count" && !normalizeString(env.UMC_EVAL_SHARD_COUNT)) env.UMC_EVAL_SHARD_COUNT = String(value);
    else if (flag === "--agent-timeout-ms" && !normalizeString(env.UMC_EVAL_AGENT_TIMEOUT_MS)) env.UMC_EVAL_AGENT_TIMEOUT_MS = String(value);
    else if (flag === "--max-cases" && !normalizeString(env.UMC_EVAL_MAX_CASES)) env.UMC_EVAL_MAX_CASES = String(value);
    else if (flag === "--only" && !normalizeString(env.UMC_EVAL_ONLY)) env.UMC_EVAL_ONLY = String(value);
  }
  return env;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const scenarios = await importScenarios(options.scenariosPath);
  const selected =
    options.scenarioIds.length > 0
      ? scenarios.filter((scenario) => options.scenarioIds.includes(scenario.id))
      : scenarios;
  if (selected.length === 0) {
    throw new Error("No docker eval scenarios selected.");
  }

  if (options.pull) {
    await runDockerCommand(
      options.dockerBin,
      ["pull", options.image],
      {
        OPENCLAW_EVAL_IMAGE: options.image,
        UMC_DOCKER_EMBED_MODEL_PATH: options.embedModelPath,
        UMC_DOCKER_AUTH_PROFILES_PATH: options.authProfilesPath
      },
      options.dryRun
    );
  }

  ensureDirectory(options.codexHomePath);

  if (options.build) {
    await runDockerCommand(
      options.dockerBin,
      ["compose", "-f", options.composeFile, "build", "openclaw-eval"],
      {
        OPENCLAW_EVAL_IMAGE: options.image,
        OPENCLAW_EVAL_DERIVED_IMAGE: `umc-openclaw-eval:${normalizeString(options.image).replace(/[^a-zA-Z0-9_.-]+/g, "-") || "latest"}`,
        UMC_DOCKER_EMBED_MODEL_PATH: options.embedModelPath,
        UMC_DOCKER_AUTH_PROFILES_PATH: options.authProfilesPath,
        UMC_DOCKER_CODEX_HOME_PATH: options.codexHomePath
      },
      options.dryRun
    );
  }

  for (const scenario of selected) {
    const scenarioEnv = applyScenarioArgs(buildScenarioEnv(scenario, options), scenario);
    const runArgs = [
      "compose",
      "-f",
      options.composeFile,
      "run",
      "--rm",
      ...buildComposeEnvFlags(scenarioEnv),
      "--name",
      `umc-eval-${scenario.id}`,
      "openclaw-eval"
    ];
    await runDockerCommand(options.dockerBin, runArgs, scenarioEnv, options.dryRun);
  }
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
