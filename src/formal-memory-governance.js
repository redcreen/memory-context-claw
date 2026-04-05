import fs from "node:fs/promises";
import path from "node:path";

const SAFE_ARCHIVE_PATTERNS = [
  /\.log$/i,
  /\.backup$/i,
  /\.hmd$/i
];

export function selectSafeArchiveCandidates(audit) {
  return (audit?.results || []).filter((item) => {
    if (item.status !== "archive-review") {
      return false;
    }
    return SAFE_ARCHIVE_PATTERNS.some((pattern) => pattern.test(item.basename || ""));
  });
}

export async function applySafeArchiveCandidates(candidates, archiveDir) {
  await fs.mkdir(archiveDir, { recursive: true });
  const moved = [];

  for (const item of candidates) {
    const targetPath = path.join(archiveDir, path.basename(item.filePath));
    await fs.rename(item.filePath, targetPath);
    moved.push({
      from: item.filePath,
      to: targetPath
    });
  }

  return moved;
}
