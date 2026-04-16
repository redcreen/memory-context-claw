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

function parseArgs(argv) {
  const options = {
    dockerBin: "docker",
    composeFile: defaultComposeFile,
    scenariosPath: defaultScenariosPath,
    scenarioIds: [],
    image: resolveDefaultOpenClawImage(),
    embedModelPath: normalizeString(process.env.UMC_DOCKER_EMBED_MODEL_PATH),
    authProfilesPath: normalizeString(process.env.UMC_DOCKER_AUTH_PROFILES_PATH, defaultAuthProfilesPath),
    agentModel: normalizeString(process.env.UMC_EVAL_AGENT_MODEL),
    pull: true,
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
    else if (arg === "--agent-model") options.agentModel = argv[++index];
    else if (arg === "--no-pull") options.pull = false;
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
          "  --agent-model <id>         Optional explicit agent model id passed into the container",
          "  --no-pull                  Skip `docker pull` before running scenarios",
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

function buildComposeEnvFlags(env) {
  return Object.entries(env)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .flatMap(([key, value]) => ["-e", `${key}=${value}`]);
}

function buildScenarioEnv(scenario, options) {
  return {
    OPENCLAW_EVAL_IMAGE: options.image,
    UMC_DOCKER_EMBED_MODEL_PATH: options.embedModelPath,
    UMC_DOCKER_AUTH_PROFILES_PATH: options.authProfilesPath,
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
}

function applyScenarioArgs(env, scenario) {
  const args = Array.isArray(scenario.args) ? scenario.args : [];
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (flag === "--shard-size") env.UMC_EVAL_SHARD_SIZE = String(value);
    else if (flag === "--shard-count") env.UMC_EVAL_SHARD_COUNT = String(value);
    else if (flag === "--agent-timeout-ms") env.UMC_EVAL_AGENT_TIMEOUT_MS = String(value);
    else if (flag === "--max-cases") env.UMC_EVAL_MAX_CASES = String(value);
    else if (flag === "--only") env.UMC_EVAL_ONLY = String(value);
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
