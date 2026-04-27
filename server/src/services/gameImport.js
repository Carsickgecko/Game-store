import sql from "mssql";
import { getPool } from "../db.js";

const RAWG_BASE_URL = "https://api.rawg.io/api/games";
const DEFAULT_PAGE_SIZE = 12;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;
const MAX_SCREENSHOTS = 6;

function clampPage(value, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return fallback;
  }

  return Math.floor(numeric);
}

function clampPageSize(value, fallback = DEFAULT_PAGE_SIZE) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, Math.floor(numeric)));
}

function toMoney(value) {
  return Number(value.toFixed(2));
}

function generateRandomPrice() {
  return toMoney(10 + Math.random() * 60);
}

function generateOldPrice(price) {
  const extra = 5 + Math.random() * 20;
  return toMoney(price + extra);
}

function uniqueNames(items, getName) {
  return [...new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => String(getName(item) || "").trim())
      .filter(Boolean),
  )];
}

function joinNames(items, getName, fallback) {
  const names = uniqueNames(items, getName);
  return names.length ? names.join(", ") : fallback;
}

function uniqueUrls(urls) {
  return [...new Set(
    (Array.isArray(urls) ? urls : [])
      .map((url) => String(url || "").trim())
      .filter(Boolean),
  )];
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDescription(rawGame, detailGame, genre, platform) {
  const detailedDescription =
    detailGame?.description_raw ||
    stripHtml(detailGame?.description) ||
    stripHtml(rawGame?.description) ||
    "";

  if (detailedDescription) {
    return detailedDescription;
  }

  const released = rawGame?.released ? `Released: ${rawGame.released}. ` : "";
  return `${released}Imported from RAWG. Genres: ${genre}. Platforms: ${platform}.`;
}

function collectScreenshots(rawGame, detailGame) {
  const urls = uniqueUrls([
    detailGame?.background_image_additional,
    ...(Array.isArray(detailGame?.short_screenshots)
      ? detailGame.short_screenshots.map((item) => item?.image)
      : []),
    ...(Array.isArray(rawGame?.short_screenshots)
      ? rawGame.short_screenshots.map((item) => item?.image)
      : []),
  ]);

  return urls.slice(0, MAX_SCREENSHOTS);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`RAWG request failed: ${response.status} ${detail}`);
  }

  return response.json();
}

async function ensureGamesImportSchema() {
  const pool = await getPool();

  await pool.request().query(`
    IF EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'Games'
        AND COLUMN_NAME = 'Genre'
        AND CHARACTER_MAXIMUM_LENGTH < 255
    )
    BEGIN
      ALTER TABLE dbo.Games ALTER COLUMN Genre NVARCHAR(255) NULL;
    END;

    IF EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'Games'
        AND COLUMN_NAME = 'Platform'
        AND CHARACTER_MAXIMUM_LENGTH < 255
    )
    BEGIN
      ALTER TABLE dbo.Games ALTER COLUMN Platform NVARCHAR(255) NULL;
    END;

    IF OBJECT_ID(N'dbo.GameScreenshots', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.GameScreenshots (
        ScreenshotId INT IDENTITY(1,1) PRIMARY KEY,
        GameId INT NOT NULL,
        ImageUrl NVARCHAR(500) NOT NULL,
        SortOrder INT NOT NULL CONSTRAINT DF_GameScreenshots_SortOrder DEFAULT(0),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_GameScreenshots_CreatedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_GameScreenshots_Game FOREIGN KEY (GameId) REFERENCES dbo.Games(GameId)
      );
    END;
  `);
}

async function fetchRawgGameDetail(rawgId, apiKey) {
  const params = new URLSearchParams({ key: apiKey });
  const url = `${RAWG_BASE_URL}/${rawgId}?${params.toString()}`;

  console.log(`[GAME IMPORT] Fetching detail for RAWG game id=${rawgId}`);
  return fetchJson(url);
}

export function transformRawgGame(rawGame, detailGame = null) {
  const genre = joinNames(
    detailGame?.genres || rawGame?.genres,
    (item) => item?.name,
    "Action",
  );
  const platform = joinNames(
    detailGame?.platforms || rawGame?.platforms || rawGame?.parent_platforms,
    (item) => item?.platform?.name || item?.name,
    "PC",
  );
  const price = generateRandomPrice();
  const oldPrice = generateOldPrice(price);

  return {
    name: String(rawGame?.name || "").trim(),
    genre,
    platform,
    price,
    oldPrice,
    rating: Number(rawGame?.rating || 0),
    image: rawGame?.background_image || null,
    description: buildDescription(rawGame, detailGame, genre, platform),
    screenshots: collectScreenshots(rawGame, detailGame),
  };
}

export async function fetchRawgGames(options = {}) {
  const apiKey = process.env.RAWG_API_KEY || process.env.RAWG_KEY;

  if (!apiKey) {
    throw new Error("RAWG_API_KEY is missing in server environment.");
  }

  const page = clampPage(options.page, 1);
  const pageSize = clampPageSize(options.pageSize, DEFAULT_PAGE_SIZE);
  const genre = String(options.genre || "").trim();

  const params = new URLSearchParams({
    key: apiKey,
    page: String(page),
    page_size: String(pageSize),
  });

  if (genre) {
    params.set("genres", genre);
  }

  const url = `${RAWG_BASE_URL}?${params.toString()}`;
  console.log(
    `[GAME IMPORT] Fetching RAWG games. page=${page}, pageSize=${pageSize}, genre=${genre || "all"}`,
  );

  const payload = await fetchJson(url);
  const results = Array.isArray(payload?.results) ? payload.results : [];

  console.log(`[GAME IMPORT] RAWG returned ${results.length} games.`);

  const detailedGames = [];

  for (const rawGame of results) {
    try {
      const detailGame = rawGame?.id
        ? await fetchRawgGameDetail(rawGame.id, apiKey)
        : null;

      detailedGames.push(transformRawgGame(rawGame, detailGame));
    } catch (error) {
      console.error(
        `[GAME IMPORT] Failed to fetch detail for "${rawGame?.name}":`,
        error,
      );
      detailedGames.push(transformRawgGame(rawGame, null));
    }
  }

  return detailedGames.filter((game) => game.name);
}

export async function upsertImportedGame(game) {
  const pool = await getPool();
  const existing = await pool
    .request()
    .input("name", sql.NVarChar(sql.MAX), game.name)
    .query(`
      SELECT TOP 1 GameId AS gameId
      FROM dbo.Games
      WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@name)))
    `);

  const existingGameId = Number(existing.recordset?.[0]?.gameId);

  if (Number.isFinite(existingGameId)) {
    await pool
      .request()
      .input("gameId", sql.Int, existingGameId)
      .input("genre", sql.NVarChar(255), game.genre)
      .input("platform", sql.NVarChar(255), game.platform)
      .input("rating", sql.Float, game.rating)
      .input("image", sql.NVarChar(sql.MAX), game.image)
      .input("description", sql.NVarChar(sql.MAX), game.description)
      .query(`
        UPDATE dbo.Games
        SET
          Genre = @genre,
          Platform = @platform,
          Rating = @rating,
          ImageUrl = @image,
          Description = @description,
          IsActive = 1
        WHERE GameId = @gameId
      `);

    return {
      inserted: false,
      updated: true,
      gameId: existingGameId,
    };
  }

  const inserted = await pool
    .request()
    .input("name", sql.NVarChar(sql.MAX), game.name)
    .input("genre", sql.NVarChar(255), game.genre)
    .input("platform", sql.NVarChar(255), game.platform)
    .input("price", sql.Decimal(10, 2), game.price)
    .input("oldPrice", sql.Decimal(10, 2), game.oldPrice)
    .input("rating", sql.Float, game.rating)
    .input("image", sql.NVarChar(sql.MAX), game.image)
    .input("description", sql.NVarChar(sql.MAX), game.description)
    .query(`
        INSERT INTO dbo.Games (
          Name,
          Genre,
          Platform,
          Price,
          OldPrice,
          Rating,
          ImageUrl,
          Description,
          IsActive
        )
        OUTPUT INSERTED.GameId AS gameId
        VALUES (
          @name,
          @genre,
          @platform,
          @price,
          @oldPrice,
          @rating,
          @image,
          @description,
          1
        )
    `);

  return {
    inserted: true,
    updated: false,
    gameId: Number(inserted.recordset?.[0]?.gameId),
  };
}

export async function replaceGameScreenshots(gameId, screenshots = []) {
  if (!Number.isFinite(Number(gameId))) {
    return;
  }

  const pool = await getPool();
  const normalizedScreenshots = uniqueUrls(screenshots).slice(0, MAX_SCREENSHOTS);

  await pool.request().input("gameId", sql.Int, Number(gameId)).query(`
    DELETE FROM dbo.GameScreenshots
    WHERE GameId = @gameId
  `);

  for (let index = 0; index < normalizedScreenshots.length; index += 1) {
    await pool
      .request()
      .input("gameId", sql.Int, Number(gameId))
      .input("imageUrl", sql.NVarChar(500), normalizedScreenshots[index])
      .input("sortOrder", sql.Int, index).query(`
        INSERT INTO dbo.GameScreenshots (GameId, ImageUrl, SortOrder)
        VALUES (@gameId, @imageUrl, @sortOrder)
      `);
  }
}

export async function importGamesFromRawg(options = {}) {
  await ensureGamesImportSchema();
  const games = await fetchRawgGames(options);

  let insertedCount = 0;
  let updatedCount = 0;
  const insertedGames = [];
  const updatedGames = [];

  for (const game of games) {
    try {
      const result = await upsertImportedGame(game);
      await replaceGameScreenshots(result.gameId, game.screenshots);

      if (result.inserted) {
        insertedCount += 1;
        insertedGames.push(game.name);
        console.log(`[GAME IMPORT] Inserted: ${game.name}`);
      } else if (result.updated) {
        updatedCount += 1;
        updatedGames.push(game.name);
        console.log(`[GAME IMPORT] Updated existing game: ${game.name}`);
      }
    } catch (error) {
      console.error(`[GAME IMPORT] Failed to insert "${game.name}":`, error);
      throw error;
    }
  }

  return {
    fetchedCount: games.length,
    insertedCount,
    updatedCount,
    insertedGames,
    updatedGames,
  };
}
