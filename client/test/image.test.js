import test from "node:test";
import assert from "node:assert/strict";
import { toImageUrl } from "../src/utils/image.js";

test("toImageUrl keeps absolute remote URLs", () => {
  assert.equal(
    toImageUrl("https://cdn.example.com/image.jpg"),
    "https://cdn.example.com/image.jpg",
  );
});

test("toImageUrl prefixes uploads with the API root", () => {
  assert.equal(
    toImageUrl("/uploads/game.jpg"),
    "http://localhost:5001/uploads/game.jpg",
  );

  assert.equal(
    toImageUrl("uploads/game.jpg"),
    "http://localhost:5001/uploads/game.jpg",
  );
});

test("toImageUrl returns fallback image for invalid input", () => {
  assert.equal(toImageUrl(""), "/images/hero-bg.jpg");
  assert.equal(toImageUrl("unknown-path"), "/images/hero-bg.jpg");
});
