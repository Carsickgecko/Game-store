import { getPool } from "../db.js";

const DEFAULT_K = 5;

function normalizeCategory(value) {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampK(value, fallback = DEFAULT_K) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(1, Math.min(12, Math.floor(numeric)));
}

function buildFeatureSpace(games) {
  const genres = [...new Set(games.map((game) => normalizeCategory(game.genre)).filter(Boolean))].sort();
  const platforms = [...new Set(games.map((game) => normalizeCategory(game.platform)).filter(Boolean))].sort();

  const prices = games.map((game) => toNumber(game.price));
  const ratings = games.map((game) => toNumber(game.rating));

  return {
    genres,
    platforms,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 1,
    minRating: ratings.length ? Math.min(...ratings) : 0,
    maxRating: ratings.length ? Math.max(...ratings) : 1,
  };
}

function normalizeValue(value, min, max) {
  if (max === min) {
    return 0;
  }

  return (value - min) / (max - min);
}

function createFeatureVector(game, featureSpace) {
  const normalizedGenre = normalizeCategory(game.genre);
  const normalizedPlatform = normalizeCategory(game.platform);

  const genreVector = featureSpace.genres.map((genre) =>
    genre === normalizedGenre ? 1 : 0,
  );
  const platformVector = featureSpace.platforms.map((platform) =>
    platform === normalizedPlatform ? 1 : 0,
  );

  const price = normalizeValue(
    toNumber(game.price),
    featureSpace.minPrice,
    featureSpace.maxPrice,
  );
  const rating = normalizeValue(
    toNumber(game.rating),
    featureSpace.minRating,
    featureSpace.maxRating,
  );

  return [...genreVector, ...platformVector, price, rating];
}

function euclideanDistance(vectorA, vectorB) {
  let sum = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    const diff = (vectorA[index] || 0) - (vectorB[index] || 0);
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

function averageVectors(vectors) {
  if (!vectors.length) {
    return [];
  }

  const dimension = vectors[0].length;
  const average = new Array(dimension).fill(0);

  for (const vector of vectors) {
    for (let index = 0; index < dimension; index += 1) {
      average[index] += vector[index] || 0;
    }
  }

  return average.map((value) => value / vectors.length);
}

function attachDistance(candidateGames, targetVector, featureSpace) {
  return candidateGames
    .map((game) => {
      const vector = createFeatureVector(game, featureSpace);
      const distance = euclideanDistance(targetVector, vector);

      return {
        ...game,
        distance,
      };
    })
    .sort((left, right) => {
      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }

      return toNumber(right.rating) - toNumber(left.rating);
    });
}

function formatRecommendations(items) {
  return items.map(({ distance, ...game }) => ({
    ...game,
    aiDistance: Number(distance.toFixed(6)),
  }));
}

export const recommendationTestUtils = {
  normalizeCategory,
  toNumber,
  clampK,
  buildFeatureSpace,
  normalizeValue,
  createFeatureVector,
  euclideanDistance,
  averageVectors,
  attachDistance,
  formatRecommendations,
};

async function fetchActiveGames() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      g.GameId AS id,
      g.Name AS name,
      g.Price AS price,
      g.OldPrice AS oldPrice,
      g.Rating AS rating,
      g.Genre AS genre,
      g.Platform AS platform,
      g.ImageUrl AS image,
      g.Description AS longDescription
    FROM dbo.Games g
    WHERE g.IsActive = 1
  `);

  return result.recordset || [];
}

async function fetchUserPreferenceGames(userId) {
  const pool = await getPool();
  const result = await pool.request().input("userId", Number(userId)).query(`
    SELECT DISTINCT
      g.GameId AS id,
      g.Name AS name,
      g.Price AS price,
      g.OldPrice AS oldPrice,
      g.Rating AS rating,
      g.Genre AS genre,
      g.Platform AS platform,
      g.ImageUrl AS image,
      g.Description AS longDescription
    FROM dbo.Games g
    INNER JOIN (
      SELECT GameId
      FROM dbo.Wishlist
      WHERE UserId = @userId

      UNION

      SELECT GameId
      FROM dbo.Cart
      WHERE UserId = @userId

      UNION

      SELECT GameId
      FROM dbo.UserLibrary
      WHERE UserId = @userId
    ) liked ON liked.GameId = g.GameId
    WHERE g.IsActive = 1
  `);

  return result.recordset || [];
}

export async function getSimilarGames(gameId, options = {}) {
  const k = clampK(options.k, DEFAULT_K);
  const games = await fetchActiveGames();
  const numericGameId = Number(gameId);
  const targetGame = games.find((game) => Number(game.id) === numericGameId);

  if (!targetGame) {
    return null;
  }

  const featureSpace = buildFeatureSpace(games);
  const targetVector = createFeatureVector(targetGame, featureSpace);
  const ranked = attachDistance(
    games.filter((game) => Number(game.id) !== numericGameId),
    targetVector,
    featureSpace,
  );

  return formatRecommendations(ranked.slice(0, k));
}

export async function getRecommendationsForUser(userId, options = {}) {
  const k = clampK(options.k, DEFAULT_K);
  const [games, preferenceGames] = await Promise.all([
    fetchActiveGames(),
    fetchUserPreferenceGames(userId),
  ]);

  if (!games.length) {
    return [];
  }

  const excludedIds = new Set(
    preferenceGames.map((game) => Number(game.id)).filter(Number.isFinite),
  );

  if (!preferenceGames.length) {
    return [...games]
      .sort((left, right) => {
        if (toNumber(right.rating) !== toNumber(left.rating)) {
          return toNumber(right.rating) - toNumber(left.rating);
        }

        return toNumber(left.price) - toNumber(right.price);
      })
      .slice(0, k);
  }

  const featureSpace = buildFeatureSpace(games);
  const preferenceVector = averageVectors(
    preferenceGames.map((game) => createFeatureVector(game, featureSpace)),
  );

  const ranked = attachDistance(
    games.filter((game) => !excludedIds.has(Number(game.id))),
    preferenceVector,
    featureSpace,
  );

  return formatRecommendations(ranked.slice(0, k));
}
