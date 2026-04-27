import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { reviewRouteTestUtils } from "../src/routes/reviews.js";

const { buildSummary, getOptionalUserId, normalizeReviewRow } =
  reviewRouteTestUtils;

test("normalizeReviewRow shapes review payload for the client", () => {
  const row = normalizeReviewRow({
    id: "4",
    gameId: "12",
    userId: "7",
    name: "Alice",
    rating: "5",
    comment: "Great game",
    avatarUrl: "/uploads/a.jpg",
    createdAt: "2026-04-15T10:00:00.000Z",
  });

  assert.deepEqual(row, {
    id: 4,
    gameId: 12,
    userId: 7,
    name: "Alice",
    rating: 5,
    comment: "Great game",
    avatarUrl: "/uploads/a.jpg",
    createdAt: "2026-04-15T10:00:00.000Z",
  });
});

test("buildSummary returns review count and rounded average", () => {
  assert.deepEqual(
    buildSummary([{ rating: 5 }, { rating: 4 }, { rating: 4 }]),
    { count: 3, average: 4.3 },
  );
  assert.deepEqual(buildSummary([]), { count: 0, average: null });
});

test("getOptionalUserId extracts user id from auth cookie token", () => {
  process.env.JWT_SECRET = "unit-test-secret";
  const token = jwt.sign({ id: 15 }, process.env.JWT_SECRET);
  const userId = getOptionalUserId({
    headers: { cookie: `neonplay_token=${token}` },
  });

  assert.equal(userId, 15);
});
