import test from "node:test";
import assert from "node:assert/strict";
import {
  applyRerankOrder,
  buildRerankPrompt,
  prepareRerankCandidates,
  parseRerankResponse,
  shouldSkipLlmRerank
} from "../src/rerank.js";

test("parseRerankResponse accepts direct json", () => {
  const parsed = parseRerankResponse(
    '{"selected":[{"id":"cand-2","score":0.91,"reason":"best match"}]}'
  );
  assert.deepEqual(parsed, [{ id: "cand-2", score: 0.91, reason: "best match" }]);
});

test("applyRerankOrder promotes reranked candidates", () => {
  const ordered = applyRerankOrder(
    [
      { id: "cand-1", weightedScore: 0.5 },
      { id: "cand-2", weightedScore: 0.4 }
    ],
    [{ id: "cand-2", score: 0.8, reason: "better" }]
  );

  assert.equal(ordered[0].id, "cand-2");
  assert.equal(ordered[0].rerankReason, "better");
});

test("prepareRerankCandidates truncates long snippets", () => {
  const prepared = prepareRerankCandidates(
    [
      {
        id: "cand-1",
        snippet: "a".repeat(120),
        weightedScore: 0.7
      }
    ],
    { topN: 4, maxSnippetChars: 40 }
  );

  assert.equal(prepared.length, 1);
  assert.ok(prepared[0].snippet.length <= 40);
  assert.match(prepared[0].snippet, /\.\.\.$/);
});

test("shouldSkipLlmRerank skips when heuristic winner is clearly ahead", () => {
  const skip = shouldSkipLlmRerank(
    [
      { weightedScore: 0.9 },
      { weightedScore: 0.6 }
    ],
    { enabled: true, topN: 6, minScoreDeltaToSkip: 0.2 }
  );

  assert.equal(skip, true);
});

test("buildRerankPrompt includes strict json instruction", () => {
  const prompt = buildRerankPrompt("什么是长期记忆", [
    {
      id: "cand-1",
      path: "MEMORY.md",
      startLine: 1,
      endLine: 10,
      weightedScore: 0.88,
      snippet: "长期稳定规则。"
    }
  ]);

  assert.match(prompt, /Return strict JSON only/);
  assert.match(prompt, /ID: cand-1/);
});

test("shouldSkipLlmRerank does not skip when candidates are close", () => {
  const skip = shouldSkipLlmRerank(
    [
      { weightedScore: 0.78 },
      { weightedScore: 0.7 }
    ],
    { enabled: true, topN: 6, minScoreDeltaToSkip: 0.2 }
  );

  assert.equal(skip, false);
});
