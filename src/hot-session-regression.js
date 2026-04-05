function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectByKey(value, key, results = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectByKey(item, key, results);
    }
    return results;
  }

  if (!isRecord(value)) {
    return results;
  }

  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (entryKey === key && typeof entryValue === "string" && entryValue.trim()) {
      results.push(entryValue.trim());
    }
    collectByKey(entryValue, key, results);
  }

  return results;
}

function firstUnique(values) {
  const unique = [];
  for (const value of values) {
    if (!unique.includes(value)) {
      unique.push(value);
    }
  }
  return unique[0] || "";
}

export function extractHotSessionMeta(payload, requestedSessionId = "") {
  const observedSessionKey = firstUnique(collectByKey(payload, "sessionKey"));
  const observedSessionId = firstUnique(collectByKey(payload, "sessionId"));
  const requested = String(requestedSessionId || "").trim();
  const hotMainAlias = observedSessionKey === "agent:main:main";
  const matchedRequestedSessionId = Boolean(requested) && observedSessionId === requested;

  return {
    requestedSessionId: requested,
    observedSessionKey,
    observedSessionId,
    hotMainAlias,
    matchedRequestedSessionId,
    isolated: Boolean(requested) && matchedRequestedSessionId && !hotMainAlias
  };
}

