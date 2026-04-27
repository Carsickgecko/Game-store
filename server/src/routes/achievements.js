import express from "express";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";
import { ensureOrdersSchema } from "./orders.js";

const router = express.Router();

const ACHIEVEMENT_SEEDS = [
  {
    code: "welcome_back",
    titleEn: "Welcome Back",
    titleVi: "Chào Mừng Trở Lại",
    descriptionEn: "Sign in to your NeonPlay account.",
    descriptionVi: "Đăng nhập vào tài khoản NeonPlay của bạn.",
    metric: "account_exists",
    thresholdValue: 1,
    icon: "spark",
    accentColor: "#ff6a00",
    sortOrder: 1,
  },
  {
    code: "profile_ready",
    titleEn: "Profile Ready",
    titleVi: "Hồ Sơ Hoàn Chỉnh",
    descriptionEn: "Add your name and email to complete your public profile.",
    descriptionVi: "Thêm tên và email để hoàn thiện hồ sơ công khai.",
    metric: "profile_complete",
    thresholdValue: 1,
    icon: "user",
    accentColor: "#3b82f6",
    sortOrder: 2,
  },
  {
    code: "cart_ready",
    titleEn: "Cart Ready",
    titleVi: "Giỏ Hàng Sẵn Sàng",
    descriptionEn: "Add a game to your cart.",
    descriptionVi: "Thêm một game vào giỏ hàng.",
    metric: "cart_count",
    thresholdValue: 1,
    icon: "cart",
    accentColor: "#f97316",
    sortOrder: 3,
  },
  {
    code: "cart_builder",
    titleEn: "Cart Builder",
    titleVi: "Xây Giỏ Hàng",
    descriptionEn: "Keep 3 games in your cart at the same time.",
    descriptionVi: "Giữ 3 game trong giỏ hàng cùng lúc.",
    metric: "cart_count",
    thresholdValue: 3,
    icon: "cart",
    accentColor: "#fb7185",
    sortOrder: 4,
  },
  {
    code: "wishlist_collector",
    titleEn: "Wishlist Collector",
    titleVi: "Nhà Sưu Tập Yêu Thích",
    descriptionEn: "Keep 5 games in your wishlist.",
    descriptionVi: "Giữ 5 game trong danh sách yêu thích.",
    metric: "wishlist_count",
    thresholdValue: 5,
    icon: "heart",
    accentColor: "#ec4899",
    sortOrder: 5,
  },
  {
    code: "wishlist_master",
    titleEn: "Wishlist Master",
    titleVi: "Bậc Thầy Yêu Thích",
    descriptionEn: "Keep 10 games in your wishlist.",
    descriptionVi: "Giữ 10 game trong danh sách yêu thích.",
    metric: "wishlist_count",
    thresholdValue: 10,
    icon: "target",
    accentColor: "#8b5cf6",
    sortOrder: 6,
  },
  {
    code: "first_checkout",
    titleEn: "First Checkout",
    titleVi: "Thanh Toán Đầu Tiên",
    descriptionEn: "Complete your first order.",
    descriptionVi: "Hoàn tất đơn hàng đầu tiên của bạn.",
    metric: "order_count",
    thresholdValue: 1,
    icon: "spark",
    accentColor: "#22c55e",
    sortOrder: 7,
  },
  {
    code: "repeat_buyer",
    titleEn: "Repeat Buyer",
    titleVi: "Khách Hàng Quay Lại",
    descriptionEn: "Complete 3 orders.",
    descriptionVi: "Hoàn tất 3 đơn hàng.",
    metric: "order_count",
    thresholdValue: 3,
    icon: "trophy",
    accentColor: "#84cc16",
    sortOrder: 8,
  },
  {
    code: "game_collector",
    titleEn: "Game Collector",
    titleVi: "Nhà Sưu Tập Game",
    descriptionEn: "Own 5 games in your library.",
    descriptionVi: "Sở hữu 5 game trong thư viện.",
    metric: "library_count",
    thresholdValue: 5,
    icon: "book",
    accentColor: "#14b8a6",
    sortOrder: 9,
  },
  {
    code: "library_legend",
    titleEn: "Library Legend",
    titleVi: "Huyền Thoại Thư Viện",
    descriptionEn: "Own 10 games in your library.",
    descriptionVi: "Sở hữu 10 game trong thư viện.",
    metric: "library_count",
    thresholdValue: 10,
    icon: "trophy",
    accentColor: "#eab308",
    sortOrder: 10,
  },
  {
    code: "game_archivist",
    titleEn: "Game Archivist",
    titleVi: "Người Lưu Giữ Game",
    descriptionEn: "Own 20 games in your library.",
    descriptionVi: "Sở hữu 20 game trong thư viện.",
    metric: "library_count",
    thresholdValue: 20,
    icon: "trophy",
    accentColor: "#f59e0b",
    sortOrder: 11,
  },
  {
    code: "deal_hunter",
    titleEn: "Deal Hunter",
    titleVi: "Thợ Săn Ưu Đãi",
    descriptionEn: "Own a discounted game in your library.",
    descriptionVi: "Sở hữu một game giảm giá trong thư viện.",
    metric: "discounted_library_count",
    thresholdValue: 1,
    icon: "bolt",
    accentColor: "#22c55e",
    sortOrder: 12,
  },
  {
    code: "bargain_stack",
    titleEn: "Bargain Stack",
    titleVi: "Chồng Ưu Đãi",
    descriptionEn: "Own 3 discounted games in your library.",
    descriptionVi: "Sở hữu 3 game giảm giá trong thư viện.",
    metric: "discounted_library_count",
    thresholdValue: 3,
    icon: "bolt",
    accentColor: "#10b981",
    sortOrder: 13,
  },
  {
    code: "critics_choice",
    titleEn: "Critics' Choice",
    titleVi: "Lựa Chọn Của Giới Phê Bình",
    descriptionEn: "Own 3 highly rated games (4.5+) in your library.",
    descriptionVi: "Sở hữu 3 game được đánh giá cao (4.5+) trong thư viện.",
    metric: "high_rated_library_count",
    thresholdValue: 3,
    icon: "spark",
    accentColor: "#60a5fa",
    sortOrder: 14,
  },
  {
    code: "big_spender",
    titleEn: "Big Spender",
    titleVi: "Tay Chi Mạnh",
    descriptionEn: "Spend a total of $100 in the store.",
    descriptionVi: "Chi tổng cộng $100 trong cửa hàng.",
    metric: "total_spent",
    thresholdValue: 100,
    icon: "target",
    accentColor: "#ef4444",
    sortOrder: 15,
  },
];

const ACTIVE_ACHIEVEMENT_CODE_LIST = ACHIEVEMENT_SEEDS.map(({ code }) => code);

export async function ensureAchievementSchema(pool) {
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.Achievements', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Achievements (
        AchievementId INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(80) NOT NULL UNIQUE,
        TitleEn NVARCHAR(140) NOT NULL,
        TitleVi NVARCHAR(140) NOT NULL,
        DescriptionEn NVARCHAR(280) NOT NULL,
        DescriptionVi NVARCHAR(280) NOT NULL,
        Metric NVARCHAR(80) NOT NULL,
        ThresholdValue INT NOT NULL CONSTRAINT DF_Achievements_ThresholdValue DEFAULT(1),
        Icon NVARCHAR(40) NULL,
        AccentColor NVARCHAR(20) NULL,
        SortOrder INT NOT NULL CONSTRAINT DF_Achievements_SortOrder DEFAULT(0),
        IsActive BIT NOT NULL CONSTRAINT DF_Achievements_IsActive DEFAULT(1),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Achievements_CreatedAt DEFAULT(SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Achievements_UpdatedAt DEFAULT(SYSUTCDATETIME())
      );
    END;

    IF OBJECT_ID(N'dbo.UserAchievements', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.UserAchievements (
        UserAchievementId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        AchievementId INT NOT NULL,
        ProgressValue INT NOT NULL CONSTRAINT DF_UserAchievements_ProgressValue DEFAULT(0),
        UnlockedAt DATETIME2 NOT NULL CONSTRAINT DF_UserAchievements_UnlockedAt DEFAULT(SYSUTCDATETIME()),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserAchievements_CreatedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT UQ_UserAchievements_User_Achievement UNIQUE (UserId, AchievementId),
        CONSTRAINT FK_UserAchievements_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_UserAchievements_Achievement FOREIGN KEY (AchievementId) REFERENCES dbo.Achievements(AchievementId)
      );
    END;
  `);

  for (const achievement of ACHIEVEMENT_SEEDS) {
    await pool
      .request()
      .input("code", achievement.code)
      .input("titleEn", achievement.titleEn)
      .input("titleVi", achievement.titleVi)
      .input("descriptionEn", achievement.descriptionEn)
      .input("descriptionVi", achievement.descriptionVi)
      .input("metric", achievement.metric)
      .input("thresholdValue", achievement.thresholdValue)
      .input("icon", achievement.icon)
      .input("accentColor", achievement.accentColor)
      .input("sortOrder", achievement.sortOrder).query(`
        MERGE dbo.Achievements AS target
        USING (SELECT @code AS Code) AS source
        ON target.Code = source.Code
        WHEN MATCHED THEN
          UPDATE SET
            TitleEn = @titleEn,
            TitleVi = @titleVi,
            DescriptionEn = @descriptionEn,
            DescriptionVi = @descriptionVi,
            Metric = @metric,
            ThresholdValue = @thresholdValue,
            Icon = @icon,
            AccentColor = @accentColor,
            SortOrder = @sortOrder,
            IsActive = 1,
            UpdatedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (
            Code,
            TitleEn,
            TitleVi,
            DescriptionEn,
            DescriptionVi,
            Metric,
            ThresholdValue,
            Icon,
            AccentColor,
            SortOrder,
            IsActive
          )
          VALUES (
            @code,
            @titleEn,
            @titleVi,
            @descriptionEn,
            @descriptionVi,
            @metric,
            @thresholdValue,
            @icon,
            @accentColor,
            @sortOrder,
            1
          );
      `);
  }

  const activeCodesSql = ACTIVE_ACHIEVEMENT_CODE_LIST.map(
    (code) => `N'${String(code).replace(/'/g, "''")}'`,
  ).join(", ");

  await pool.request().query(`
    UPDATE dbo.Achievements
    SET
      IsActive = CASE WHEN Code IN (${activeCodesSql}) THEN 1 ELSE 0 END,
      UpdatedAt = SYSUTCDATETIME()
  `);
}

async function getUserMetricValues(pool, userId) {
  const result = await pool.request().input("userId", userId).query(`
    SELECT
      1 AS accountExists,
      CASE
        WHEN NULLIF(LTRIM(RTRIM(ISNULL(u.FullName, ''))), '') IS NOT NULL
         AND NULLIF(LTRIM(RTRIM(ISNULL(u.Email, ''))), '') IS NOT NULL
        THEN 1
        ELSE 0
      END AS profileComplete,
      ISNULL((
        SELECT COUNT(1)
        FROM dbo.Wishlist w
        WHERE w.UserId = u.UserId
      ), 0) AS wishlistCount,
      ISNULL((
        SELECT COUNT(1)
        FROM dbo.UserLibrary ul
        WHERE ul.UserId = u.UserId
      ), 0) AS libraryCount,
      ISNULL((
        SELECT SUM(c.Quantity)
        FROM dbo.Cart c
        WHERE c.UserId = u.UserId
      ), 0) AS cartCount,
      ISNULL((
        SELECT COUNT(1)
        FROM dbo.UserLibrary ul
        INNER JOIN dbo.Games g ON g.GameId = ul.GameId
        WHERE ul.UserId = u.UserId
          AND ISNULL(g.OldPrice, 0) > ISNULL(g.Price, 0)
      ), 0) AS discountedLibraryCount,
      ISNULL((
        SELECT COUNT(1)
        FROM dbo.Orders o
        WHERE o.UserId = u.UserId
      ), 0) AS orderCount,
      ISNULL((
        SELECT SUM(o.Total)
        FROM dbo.Orders o
        WHERE o.UserId = u.UserId
      ), 0) AS totalSpent,
      ISNULL((
        SELECT COUNT(1)
        FROM dbo.UserLibrary ul
        INNER JOIN dbo.Games g ON g.GameId = ul.GameId
        WHERE ul.UserId = u.UserId
          AND ISNULL(g.Rating, 0) >= 4.5
      ), 0) AS highRatedLibraryCount
    FROM dbo.Users u
    WHERE u.UserId = @userId
  `);

  const row = result.recordset?.[0];
  if (!row) {
    return null;
  }

  return {
    account_exists: Number(row.accountExists || 0),
    profile_complete: Number(row.profileComplete || 0),
    wishlist_count: Number(row.wishlistCount || 0),
    library_count: Number(row.libraryCount || 0),
    cart_count: Number(row.cartCount || 0),
    discounted_library_count: Number(row.discountedLibraryCount || 0),
    order_count: Number(row.orderCount || 0),
    total_spent: Math.floor(Number(row.totalSpent || 0)),
    high_rated_library_count: Number(row.highRatedLibraryCount || 0),
  };
}

async function syncUnlockedAchievements(pool, userId, achievements) {
  for (const achievement of achievements) {
    if (!achievement.unlocked) {
      continue;
    }

    await pool
      .request()
      .input("userId", userId)
      .input("achievementId", achievement.id)
      .input("progressValue", achievement.currentValue).query(`
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.UserAchievements
          WHERE UserId = @userId AND AchievementId = @achievementId
        )
        BEGIN
          INSERT INTO dbo.UserAchievements (UserId, AchievementId, ProgressValue, UnlockedAt)
          VALUES (@userId, @achievementId, @progressValue, SYSUTCDATETIME())
        END
      `);
  }
}

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const pool = await getPool();
    await ensureOrdersSchema(pool);
    await ensureAchievementSchema(pool);

    const metrics = await getUserMetricValues(pool, userId);
    if (!metrics) {
      return res.status(404).json({ message: "User not found." });
    }

    const defsResult = await pool.request().query(`
      SELECT
        AchievementId AS id,
        Code AS code,
        TitleEn AS titleEn,
        TitleVi AS titleVi,
        DescriptionEn AS descriptionEn,
        DescriptionVi AS descriptionVi,
        Metric AS metric,
        ThresholdValue AS thresholdValue,
        Icon AS icon,
        AccentColor AS accentColor,
        SortOrder AS sortOrder
      FROM dbo.Achievements
      WHERE IsActive = 1
      ORDER BY SortOrder ASC, AchievementId ASC
    `);

    const baseAchievements = (defsResult.recordset || []).map((item) => {
      const currentValue = Number(metrics[item.metric] || 0);
      const thresholdValue = Math.max(1, Number(item.thresholdValue || 1));
      const progressValue = Math.min(currentValue, thresholdValue);
      const progressPercent = Math.min(
        100,
        Math.round((progressValue / thresholdValue) * 100),
      );

      return {
        ...item,
        currentValue,
        progressValue,
        progressPercent,
        unlocked: currentValue >= thresholdValue,
      };
    });

    await syncUnlockedAchievements(pool, userId, baseAchievements);

    const unlockedResult = await pool.request().input("userId", userId).query(`
      SELECT AchievementId AS achievementId, ProgressValue AS progressValue, UnlockedAt AS unlockedAt
      FROM dbo.UserAchievements
      WHERE UserId = @userId
    `);

    const unlockedMap = new Map(
      (unlockedResult.recordset || []).map((item) => [
        Number(item.achievementId),
        item,
      ]),
    );

    const achievements = baseAchievements.map((item) => {
      const earned = unlockedMap.get(Number(item.id));

      return {
        ...item,
        unlocked: Boolean(earned) || item.unlocked,
        unlockedAt: earned?.unlockedAt || null,
        storedProgressValue: earned?.progressValue ?? null,
      };
    });

    const unlockedCount = achievements.filter((item) => item.unlocked).length;
    const totalCount = achievements.length;
    const completionRate =
      totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    return res.json({
      data: achievements,
      summary: {
        unlockedCount,
        totalCount,
        completionRate,
      },
    });
  } catch (err) {
    console.error("ACHIEVEMENTS GET ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

export default router;
