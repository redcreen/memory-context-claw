function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

export function sortDialogueWorkingSetShadowEvents(events = []) {
  return [...(Array.isArray(events) ? events : [])].sort((left, right) =>
    normalizeString(left?.generated_at).localeCompare(normalizeString(right?.generated_at))
  );
}

export function pickDialogueWorkingSetShadowEvent(events = [], options = {}) {
  const sorted = sortDialogueWorkingSetShadowEvents(events);
  if (sorted.length === 0) {
    return null;
  }

  const query = normalizeString(options.query);
  const sessionKey = normalizeString(options.sessionKey);

  let candidates = sorted;
  if (query) {
    const queryMatches = candidates.filter((event) => normalizeString(event?.query) === query);
    if (queryMatches.length > 0) {
      candidates = queryMatches;
    }
  }
  if (sessionKey) {
    const sessionMatches = candidates.filter((event) => normalizeString(event?.session_key) === sessionKey);
    if (sessionMatches.length > 0) {
      candidates = sessionMatches;
    }
  }

  const captured = candidates.filter((event) => normalizeString(event?.status) === "captured");
  if (captured.length > 0) {
    return captured.at(-1);
  }

  const nonSkipped = candidates.filter((event) => normalizeString(event?.status) !== "skipped");
  if (nonSkipped.length > 0) {
    return nonSkipped.at(-1);
  }

  return candidates.at(-1) || null;
}
