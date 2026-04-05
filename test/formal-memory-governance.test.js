import test from "node:test";
import assert from "node:assert/strict";

import { selectSafeArchiveCandidates } from "../src/formal-memory-governance.js";

test("selectSafeArchiveCandidates keeps only low-risk recurring archive items", () => {
  const selected = selectSafeArchiveCandidates({
    results: [
      {
        basename: "cron_sync.log",
        filePath: "/tmp/memory/cron_sync.log",
        status: "archive-review"
      },
      {
        basename: "2026-03-28.md.backup",
        filePath: "/tmp/memory/2026-03-28.md.backup",
        status: "archive-review"
      },
      {
        basename: "2026-04-05-food-preference.md",
        filePath: "/tmp/memory/2026-04-05-food-preference.md",
        status: "archive-review"
      },
      {
        basename: "MEMORY.md",
        filePath: "/tmp/MEMORY.md",
        status: "clean"
      }
    ]
  });

  assert.deepEqual(
    selected.map((item) => item.basename),
    ["cron_sync.log", "2026-03-28.md.backup"]
  );
});
