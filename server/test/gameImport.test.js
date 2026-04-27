import test from "node:test";
import assert from "node:assert/strict";
import { transformRawgGame } from "../src/services/gameImport.js";

test("transformRawgGame maps RAWG payload into store format", () => {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    const rawGame = {
      name: "Sample Game",
      rating: 4.7,
      background_image: "https://cdn.example.com/game.jpg",
      genres: [{ name: "Action" }, { name: "Adventure" }],
      platforms: [{ platform: { name: "PC" } }, { platform: { name: "PS5" } }],
      short_screenshots: [
        { image: "https://cdn.example.com/shot-1.jpg" },
        { image: "https://cdn.example.com/shot-2.jpg" },
      ],
    };

    const detailGame = {
      description_raw: "Detailed RAWG description.",
      background_image_additional: "https://cdn.example.com/shot-0.jpg",
    };

    const transformed = transformRawgGame(rawGame, detailGame);

    assert.equal(transformed.name, "Sample Game");
    assert.equal(transformed.genre, "Action, Adventure");
    assert.equal(transformed.platform, "PC, PS5");
    assert.equal(transformed.price, 10);
    assert.equal(transformed.oldPrice, 15);
    assert.equal(transformed.rating, 4.7);
    assert.equal(transformed.image, "https://cdn.example.com/game.jpg");
    assert.equal(transformed.description, "Detailed RAWG description.");
    assert.deepEqual(transformed.screenshots, [
      "https://cdn.example.com/shot-0.jpg",
      "https://cdn.example.com/shot-1.jpg",
      "https://cdn.example.com/shot-2.jpg",
    ]);
  } finally {
    Math.random = originalRandom;
  }
});
