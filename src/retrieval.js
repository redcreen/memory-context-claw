import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { rewriteRetrievalQueries } from "./query-rewrite.js";
import { shouldExcludeMemoryPath } from "./utils.js";

const execFileAsync = promisify(execFile);

export function extractJsonPayload(stdout) {
  const text = String(stdout ?? "").trim();
  if (!text) {
    throw new Error("Empty stdout");
  }

  const jsonStart = text.search(/[\[{]/);
  if (jsonStart === -1) {
    throw new Error("No JSON payload found in stdout");
  }

  let candidate = text.slice(jsonStart).trim();
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
    throw new Error("Unable to parse JSON payload from stdout");
  }
}

export async function retrieveMemoryCandidates({
  openclawCommand,
  agentId,
  query,
  maxCandidates,
  excludePaths = [],
  queryRewrite = { enabled: true, maxQueries: 4 },
  logger
}) {
  if (!query || !String(query).trim()) {
    return [];
  }

  try {
    const queries = queryRewrite?.enabled
      ? rewriteRetrievalQueries(query, queryRewrite)
      : [String(query).trim()];
    const allResults = [];

    for (const searchQuery of queries) {
      const { stdout } = await execFileAsync(
        openclawCommand,
        [
          "memory",
          "search",
          "--agent",
          agentId,
          "--query",
          searchQuery,
          "--max-results",
          String(maxCandidates),
          "--json"
        ],
        {
          maxBuffer: 4 * 1024 * 1024
        }
      );

      const parsed = extractJsonPayload(stdout);
      const results = Array.isArray(parsed?.results) ? parsed.results : [];
      for (const [index, item] of results.entries()) {
        if (shouldExcludeMemoryPath(item?.path, excludePaths)) {
          continue;
        }
        allResults.push({
          ...item,
          sourceQuery: searchQuery,
          fusionScore: Number(item?.score || 0) + 1 / (index + 1)
        });
      }
    }

    const merged = new Map();
    for (const item of allResults) {
      const key = `${item.path}::${item.startLine || 0}::${item.endLine || 0}`;
      const existing = merged.get(key);
      if (!existing || Number(item.fusionScore || 0) > Number(existing.fusionScore || 0)) {
        merged.set(key, item);
      }
    }

    return [...merged.values()]
      .sort((left, right) => Number(right.fusionScore || 0) - Number(left.fusionScore || 0))
      .slice(0, maxCandidates)
      .map(({ fusionScore, sourceQuery, ...item }) => ({
        ...item,
        score: Number(item.score || 0),
        sourceQuery,
        fusionScore
      }));
  } catch (error) {
    logger?.warn?.(
      `[memory-context-claw] memory retrieval failed for agent=${agentId}: ${String(error)}`
    );
    return [];
  }
}
