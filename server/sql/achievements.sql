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

MERGE dbo.Achievements AS target
USING (
  VALUES
    (N'welcome_back', N'Welcome Back', N'Chào Mừng Trở Lại', N'Sign in to your NeonPlay account.', N'Đăng nhập vào tài khoản NeonPlay của bạn.', N'account_exists', 1, N'spark', N'#ff6a00', 1),
    (N'profile_ready', N'Profile Ready', N'Hồ Sơ Hoàn Chỉnh', N'Add your name and email to complete your public profile.', N'Thêm tên và email để hoàn thiện hồ sơ công khai.', N'profile_complete', 1, N'user', N'#3b82f6', 2),
    (N'cart_ready', N'Cart Ready', N'Giỏ Hàng Sẵn Sàng', N'Add a game to your cart.', N'Thêm một game vào giỏ hàng.', N'cart_count', 1, N'cart', N'#f97316', 3),
    (N'cart_builder', N'Cart Builder', N'Xây Giỏ Hàng', N'Keep 3 games in your cart at the same time.', N'Giữ 3 game trong giỏ hàng cùng lúc.', N'cart_count', 3, N'cart', N'#fb7185', 4),
    (N'wishlist_collector', N'Wishlist Collector', N'Nhà Sưu Tập Yêu Thích', N'Keep 5 games in your wishlist.', N'Giữ 5 game trong danh sách yêu thích.', N'wishlist_count', 5, N'heart', N'#ec4899', 5),
    (N'wishlist_master', N'Wishlist Master', N'Bậc Thầy Yêu Thích', N'Keep 10 games in your wishlist.', N'Giữ 10 game trong danh sách yêu thích.', N'wishlist_count', 10, N'target', N'#8b5cf6', 6),
    (N'first_checkout', N'First Checkout', N'Thanh Toán Đầu Tiên', N'Complete your first order.', N'Hoàn tất đơn hàng đầu tiên của bạn.', N'order_count', 1, N'spark', N'#22c55e', 7),
    (N'repeat_buyer', N'Repeat Buyer', N'Khách Hàng Quay Lại', N'Complete 3 orders.', N'Hoàn tất 3 đơn hàng.', N'order_count', 3, N'trophy', N'#84cc16', 8),
    (N'game_collector', N'Game Collector', N'Nhà Sưu Tập Game', N'Own 5 games in your library.', N'Sở hữu 5 game trong thư viện.', N'library_count', 5, N'book', N'#14b8a6', 9),
    (N'library_legend', N'Library Legend', N'Huyền Thoại Thư Viện', N'Own 10 games in your library.', N'Sở hữu 10 game trong thư viện.', N'library_count', 10, N'trophy', N'#eab308', 10),
    (N'game_archivist', N'Game Archivist', N'Người Lưu Giữ Game', N'Own 20 games in your library.', N'Sở hữu 20 game trong thư viện.', N'library_count', 20, N'trophy', N'#f59e0b', 11),
    (N'deal_hunter', N'Deal Hunter', N'Thợ Săn Ưu Đãi', N'Own a discounted game in your library.', N'Sở hữu một game giảm giá trong thư viện.', N'discounted_library_count', 1, N'bolt', N'#22c55e', 12),
    (N'bargain_stack', N'Bargain Stack', N'Chồng Ưu Đãi', N'Own 3 discounted games in your library.', N'Sở hữu 3 game giảm giá trong thư viện.', N'discounted_library_count', 3, N'bolt', N'#10b981', 13),
    (N'critics_choice', N'Critics'' Choice', N'Lựa Chọn Của Giới Phê Bình', N'Own 3 highly rated games (4.5+) in your library.', N'Sở hữu 3 game được đánh giá cao (4.5+) trong thư viện.', N'high_rated_library_count', 3, N'spark', N'#60a5fa', 14),
    (N'big_spender', N'Big Spender', N'Tay Chi Mạnh', N'Spend a total of $100 in the store.', N'Chi tổng cộng $100 trong cửa hàng.', N'total_spent', 100, N'target', N'#ef4444', 15)
) AS source (
  Code,
  TitleEn,
  TitleVi,
  DescriptionEn,
  DescriptionVi,
  Metric,
  ThresholdValue,
  Icon,
  AccentColor,
  SortOrder
)
ON target.Code = source.Code
WHEN MATCHED THEN
  UPDATE SET
    TitleEn = source.TitleEn,
    TitleVi = source.TitleVi,
    DescriptionEn = source.DescriptionEn,
    DescriptionVi = source.DescriptionVi,
    Metric = source.Metric,
    ThresholdValue = source.ThresholdValue,
    Icon = source.Icon,
    AccentColor = source.AccentColor,
    SortOrder = source.SortOrder,
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
    source.Code,
    source.TitleEn,
    source.TitleVi,
    source.DescriptionEn,
    source.DescriptionVi,
    source.Metric,
    source.ThresholdValue,
    source.Icon,
    source.AccentColor,
    source.SortOrder,
    1
  );

UPDATE dbo.Achievements
SET
  IsActive = CASE
    WHEN Code IN (
      N'welcome_back',
      N'profile_ready',
      N'cart_ready',
      N'cart_builder',
      N'wishlist_collector',
      N'wishlist_master',
      N'first_checkout',
      N'repeat_buyer',
      N'game_collector',
      N'library_legend',
      N'game_archivist',
      N'deal_hunter',
      N'bargain_stack',
      N'critics_choice',
      N'big_spender'
    ) THEN 1
    ELSE 0
  END,
  UpdatedAt = SYSUTCDATETIME();
