import os from "node:os";
import path from "node:path";

export function getDefaultLaunchAgentPath() {
  return path.join(os.homedir(), "Library", "LaunchAgents", "ai.openclaw.gateway.plist");
}

export function parseRuntimeArgs(argv) {
  const options = {
    check: false,
    remove: false,
    dryRun: false,
    skipBuild: false,
    skipReload: false,
    launchAgentPath: getDefaultLaunchAgentPath(),
    openclawBin: "openclaw",
    llamaBin: "node-llama-cpp",
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--remove") options.remove = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--skip-build") options.skipBuild = true;
    else if (arg === "--skip-reload") options.skipReload = true;
    else if (arg === "--launch-agent") options.launchAgentPath = argv[++index];
    else if (arg === "--openclaw-bin") options.openclawBin = argv[++index];
    else if (arg === "--llama-bin") options.llamaBin = argv[++index];
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function applyGatewayGpuPolicy(plist, { remove = false } = {}) {
  const nextPlist = { ...(plist && typeof plist === "object" ? plist : {}) };
  const env = {
    ...(nextPlist.EnvironmentVariables && typeof nextPlist.EnvironmentVariables === "object"
      ? nextPlist.EnvironmentVariables
      : {})
  };
  const previousValue = env.NODE_LLAMA_CPP_GPU;

  if (remove) delete env.NODE_LLAMA_CPP_GPU;
  else env.NODE_LLAMA_CPP_GPU = "false";

  nextPlist.EnvironmentVariables = env;

  return {
    plist: nextPlist,
    changed:
      previousValue !== (env.NODE_LLAMA_CPP_GPU ?? undefined) ||
      (remove && previousValue !== undefined),
    previousValue,
    nextValue: env.NODE_LLAMA_CPP_GPU ?? null
  };
}

export function summarizeMainMemory(statusList) {
  const main = Array.isArray(statusList)
    ? statusList.find((item) => item?.agentId === "main")
    : null;

  return main
    ? {
        provider: main.status?.provider ?? null,
        files: main.status?.files ?? null,
        chunks: main.status?.chunks ?? null,
        dirty: main.status?.dirty ?? null
      }
    : null;
}

export function extractJsonPayload(text) {
  const value = String(text ?? "").trim();
  if (!value) {
    throw new Error("Empty output");
  }

  const start = value.search(/[\[{]/);
  if (start === -1) {
    throw new Error("No JSON payload found");
  }

  const candidate = value.slice(start).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const lines = candidate.split("\n");
    for (let index = 1; index < lines.length; index += 1) {
      const joined = lines.slice(index).join("\n").trim();
      if (!joined) {
        continue;
      }
      try {
        return JSON.parse(joined);
      } catch {
        continue;
      }
    }
    throw new Error("Unable to parse JSON payload");
  }
}
