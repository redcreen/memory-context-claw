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

export function summarizeUnifiedMemoryCorePlugin(inspectPayload) {
  const plugin = inspectPayload?.plugin;
  if (!plugin || typeof plugin !== "object") {
    return null;
  }
  const install = inspectPayload?.install && typeof inspectPayload.install === "object"
    ? inspectPayload.install
    : plugin.install && typeof plugin.install === "object"
      ? plugin.install
      : null;

  return {
    id: plugin.id ?? null,
    version: plugin.version ?? null,
    status: plugin.status ?? null,
    enabled: plugin.enabled ?? null,
    rootDir: plugin.rootDir ?? null,
    services: Array.isArray(plugin.services) ? plugin.services : [],
    typedHooks: Array.isArray(inspectPayload?.typedHooks)
      ? inspectPayload.typedHooks.map((item) => item?.name).filter(Boolean)
      : [],
    install: install
      ? {
          source: install.source ?? null,
          sourcePath: install.sourcePath ?? null,
          installPath: install.installPath ?? null,
          version: install.version ?? null,
          installedAt: install.installedAt ?? null
        }
      : null
  };
}

export function summarizeCommandFailure(error) {
  if (!error || typeof error !== "object") {
    return {
      message: String(error ?? "Unknown command failure"),
      code: null,
      stdout: "",
      stderr: ""
    };
  }

  const stdout = typeof error.stdout === "string" ? error.stdout.trim() : "";
  const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
  const message = typeof error.message === "string" && error.message.trim()
    ? error.message.trim()
    : stderr || stdout || String(error);

  return {
    message,
    code: typeof error.code === "number" ? error.code : null,
    stdout,
    stderr
  };
}

export function isUnsupportedMemoryStatusFailure(summary) {
  const text = [
    summary?.message,
    summary?.stderr,
    summary?.stdout
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  if (!text) {
    return false;
  }

  return (
    /unknown command ['"]memory['"]/.test(text)
    || /unknown command ['"]status['"]/.test(text)
    || /did you mean.*memory/.test(text)
    || /usage:\s*openclaw memory/.test(text)
  );
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
