import test from "node:test";
import assert from "node:assert/strict";
import { homeRouteTestUtils } from "../src/routes/home.js";

const {
  clampInt,
  getDiscountAmount,
  getDiscountPercent,
  rotateDaily,
  sortDiscountedGames,
} = homeRouteTestUtils;

test("clampInt normalizes invalid and out-of-range values", () => {
  assert.equal(clampInt("7", 3, 1, 10), 7);
  assert.equal(clampInt("abc", 3, 1, 10), 3);
  assert.equal(clampInt("99", 3, 1, 10), 10);
  assert.equal(clampInt("-5", 3, 1, 10), 1);
});

test("discount helpers compute amount and percentage safely", () => {
  const game = { price: 25, oldPrice: 100 };

  assert.equal(getDiscountAmount(game), 75);
  assert.equal(getDiscountPercent(game), 75);
  assert.equal(getDiscountPercent({ price: 20, oldPrice: 20 }), 0);
});

test("sortDiscountedGames prioritizes bigger percentage discounts", () => {
  const ranked = sortDiscountedGames([
    { id: 1, price: 30, oldPrice: 60, rating: 4.2 },
    { id: 2, price: 20, oldPrice: 100, rating: 4.9 },
    { id: 3, price: 15, oldPrice: 30, rating: 4.7 },
    { id: 4, price: 25, oldPrice: 25, rating: 5.0 },
  ]);

  assert.deepEqual(
    ranked.map((game) => game.id),
    [2, 1, 3],
  );
});

test("rotateDaily keeps the same items and order length", () => {
  const originalDate = globalThis.Date;

  class MockDate extends Date {
    constructor(...args) {
      if (args.length > 0) {
        super(...args);
        return;
      }

      super("2026-04-15T12:00:00Z");
    }
  }

  globalThis.Date = MockDate;

  try {
    const items = ["a", "b", "c", "d"];
    const rotated = rotateDaily(items);

    assert.equal(rotated.length, items.length);
    assert.deepEqual([...rotated].sort(), [...items].sort());
  } finally {
    globalThis.Date = originalDate;
  }
});
