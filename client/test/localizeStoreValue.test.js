import test from "node:test";
import assert from "node:assert/strict";
import {
  localizeGenre,
  localizeMeta,
  localizePlatform,
} from "../src/utils/localizeStoreValue.js";

const dictionary = {
  "taxonomy.genres.action": "Action VN",
  "taxonomy.genres.rpg": "RPG VN",
  "taxonomy.genres.shooter": "Shooter VN",
  "taxonomy.platforms.pc": "PC VN",
  "taxonomy.platforms.playstation_5": "PS5 VN",
};

function t(key) {
  return dictionary[key] || key;
}

test("localizeGenre translates comma-separated genre values", () => {
  assert.equal(localizeGenre("Action, RPG", t), "Action VN | RPG VN");
});

test("localizePlatform keeps unknown values while translating known ones", () => {
  assert.equal(localizePlatform("PC, Xbox", t), "PC VN | Xbox");
});

test("localizeMeta splits both pipes and bullet separators", () => {
  assert.equal(
    localizeMeta("Action • PC | Shooter", t),
    "Action VN | PC VN | Shooter VN",
  );
});
