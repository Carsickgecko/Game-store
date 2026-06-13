IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Orders (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL CONSTRAINT DF_Orders_Subtotal DEFAULT(0),
    ServiceFee DECIMAL(10,2) NOT NULL CONSTRAINT DF_Orders_ServiceFee DEFAULT(0),
    PaymentFee DECIMAL(10,2) NOT NULL CONSTRAINT DF_Orders_PaymentFee DEFAULT(0),
    Total DECIMAL(10,2) NOT NULL CONSTRAINT DF_Orders_Total DEFAULT(0),
    PaymentMethod NVARCHAR(50) NOT NULL CONSTRAINT DF_Orders_PaymentMethod DEFAULT(N'card'),
    Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT(N'completed'),
    PaymentProvider NVARCHAR(40) NULL,
    ProviderSessionId NVARCHAR(255) NULL,
    PaymentIntentId NVARCHAR(255) NULL,
    Currency NVARCHAR(10) NOT NULL CONSTRAINT DF_Orders_Currency DEFAULT(N'usd'),
    PaidAt DATETIME2 NULL,
    CustomerEmail NVARCHAR(255) NULL,
    CustomerName NVARCHAR(120) NULL,
    BillingCountry NVARCHAR(20) NULL,
    BillingCity NVARCHAR(120) NULL,
    BillingAddress NVARCHAR(255) NULL,
    BillingZip NVARCHAR(40) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT(SYSUTCDATETIME())
  );
END;

IF COL_LENGTH('dbo.Orders', 'PaymentProvider') IS NULL
  ALTER TABLE dbo.Orders ADD PaymentProvider NVARCHAR(40) NULL;
IF COL_LENGTH('dbo.Orders', 'ProviderSessionId') IS NULL
  ALTER TABLE dbo.Orders ADD ProviderSessionId NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Orders', 'PaymentIntentId') IS NULL
  ALTER TABLE dbo.Orders ADD PaymentIntentId NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Orders', 'Currency') IS NULL
  ALTER TABLE dbo.Orders ADD Currency NVARCHAR(10) NOT NULL CONSTRAINT DF_Orders_Currency_Alter DEFAULT(N'usd');
IF COL_LENGTH('dbo.Orders', 'PaidAt') IS NULL
  ALTER TABLE dbo.Orders ADD PaidAt DATETIME2 NULL;
IF COL_LENGTH('dbo.Orders', 'CustomerEmail') IS NULL
  ALTER TABLE dbo.Orders ADD CustomerEmail NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Orders', 'CustomerName') IS NULL
  ALTER TABLE dbo.Orders ADD CustomerName NVARCHAR(120) NULL;
IF COL_LENGTH('dbo.Orders', 'BillingCountry') IS NULL
  ALTER TABLE dbo.Orders ADD BillingCountry NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.Orders', 'BillingCity') IS NULL
  ALTER TABLE dbo.Orders ADD BillingCity NVARCHAR(120) NULL;
IF COL_LENGTH('dbo.Orders', 'BillingAddress') IS NULL
  ALTER TABLE dbo.Orders ADD BillingAddress NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Orders', 'BillingZip') IS NULL
  ALTER TABLE dbo.Orders ADD BillingZip NVARCHAR(40) NULL;

IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.OrderItems (
    OrderItemId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    GameId INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Qty INT NOT NULL CONSTRAINT DF_OrderItems_Qty DEFAULT(1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrderItems_CreatedAt DEFAULT(SYSUTCDATETIME()),
    CONSTRAINT FK_OrderItems_Order FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId),
    CONSTRAINT FK_OrderItems_Game FOREIGN KEY (GameId) REFERENCES dbo.Games(GameId)
  );
END;
