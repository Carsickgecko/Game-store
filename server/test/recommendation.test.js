import test from "node:test";
import assert from "node:assert/strict";
import { recommendationTestUtils } from "../src/services/recommendation.js";

const {
  averageVectors,
  attachDistance,
  buildFeatureSpace,
  clampK,
  createFeatureVector,
  euclideanDistance,
  formatRecommendations,
} = recommendationTestUtils;

const sampleGames = [
  { id: 1, genre: "Action", platform: "PC", price: 10, rating: 4.5 },
  { id: 2, genre: "Action", platform: "PS5", price: 40, rating: 4.8 },
  { id: 3, genre: "RPG", platform: "PC", price: 70, rating: 3.9 },
];

test("clampK keeps recommendation size in valid bounds", () => {
  assert.equal(clampK(0), 1);
  assert.equal(clampK(99), 12);
  assert.equal(clampK("5"), 5);
});

test("buildFeatureSpace collects categories and numeric ranges", () => {
  const featureSpace = buildFeatureSpace(sampleGames);

  assert.deepEqual(featureSpace.genres, ["action", "rpg"]);
  assert.deepEqual(featureSpace.platforms, ["pc", "ps5"]);
  assert.equal(featureSpace.minPrice, 10);
  assert.equal(featureSpace.maxPrice, 70);
  assert.equal(featureSpace.minRating, 3.9);
  assert.equal(featureSpace.maxRating, 4.8);
});

test("createFeatureVector encodes categories and normalizes numeric features", () => {
  const featureSpace = buildFeatureSpace(sampleGames);
  const vector = createFeatureVector(sampleGames[0], featureSpace);

  assert.deepEqual(vector.slice(0, 5), [1, 0, 1, 0, 0]);
  assert.ok(Math.abs(vector[5] - 2 / 3) < 1e-12);
});

test("euclideanDistance and averageVectors produce expected values", () => {
  assert.equal(euclideanDistance([0, 0], [3, 4]), 5);
  assert.deepEqual(averageVectors([[1, 3], [3, 5], [5, 7]]), [3, 5]);
});

test("attachDistance sorts nearest games first and formatRecommendations rounds distance", () => {
  const featureSpace = buildFeatureSpace(sampleGames);
  const targetVector = createFeatureVector(sampleGames[0], featureSpace);
  const ranked = attachDistance(sampleGames.slice(1), targetVector, featureSpace);
  const formatted = formatRecommendations(ranked);

  assert.equal(ranked[0].id, 2);
  assert.equal(formatted[0].id, 2);
  assert.ok(typeof formatted[0].aiDistance === "number");
  assert.equal("distance" in formatted[0], false);
});
