import express from "express";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

function toSafeText(value, maxLength = 255) {
  return String(value || "").trim().slice(0, maxLength);
}

function ensureRequiredContact(payload) {
  const contact = {
    email: toSafeText(payload?.email, 255),
    name: toSafeText(payload?.name, 120),
    country: toSafeText(payload?.country, 20),
    city: toSafeText(payload?.city, 120),
    address: toSafeText(payload?.address, 255),
    zip: toSafeText(payload?.zip, 40),
  };

  const valid =
    contact.email &&
    contact.name &&
    contact.country &&
    contact.city &&
    contact.address &&
    contact.zip;

  return { valid: Boolean(valid), contact };
}

export async function ensureOrdersSchema(pool) {
  await pool.request().query(`
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
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT(SYSUTCDATETIME())
      );
    END;

    IF COL_LENGTH('dbo.Orders', 'Subtotal') IS NULL
      ALTER TABLE dbo.Orders ADD Subtotal DECIMAL(10,2) NOT NULL CONSTRAINT DF_Orders_Subtotal_Alter DEFAULT(0);
    IF COL_LENGTH('dbo.Orders', 'ServiceFee') IS NULL
      ALTER TABLE dbo.Orders ADD ServiceFee DECIMAL(10,2) NOT NULL CONSTRAINT DF_Orders_ServiceFee_Alter DEFAULT(0);
    IF COL_LENGTH('dbo.Orders', 'PaymentFee') IS NULL
      ALTER TABLE dbo.Orders ADD PaymentFee DECIMAL(10,2) NOT NULL CONSTRAINT DF_Orders_PaymentFee_Alter DEFAULT(0);
    IF COL_LENGTH('dbo.Orders', 'PaymentMethod') IS NULL
      ALTER TABLE dbo.Orders ADD PaymentMethod NVARCHAR(50) NOT NULL CONSTRAINT DF_Orders_PaymentMethod_Alter DEFAULT(N'card');
    IF COL_LENGTH('dbo.Orders', 'Status') IS NULL
      ALTER TABLE dbo.Orders ADD Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Orders_Status_Alter DEFAULT(N'completed');
    IF COL_LENGTH('dbo.Orders', 'CreatedAt') IS NULL
      ALTER TABLE dbo.Orders ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_CreatedAt_Alter DEFAULT(SYSUTCDATETIME());
    IF COL_LENGTH('dbo.Orders', 'PaymentProvider') IS NULL
      ALTER TABLE dbo.Orders ADD PaymentProvider NVARCHAR(40) NULL;
    IF COL_LENGTH('dbo.Orders', 'ProviderSessionId') IS NULL
      ALTER TABLE dbo.Orders ADD ProviderSessionId NVARCHAR(255) NULL;
    IF COL_LENGTH('dbo.Orders', 'PaymentIntentId') IS NULL
      ALTER TABLE dbo.Orders ADD PaymentIntentId NVARCHAR(255) NULL;
    IF COL_LENGTH('dbo.Orders', 'Currency') IS NULL
      ALTER TABLE dbo.Orders ADD Currency NVARCHAR(10) NOT NULL CONSTRAINT DF_Orders_Currency DEFAULT(N'usd');
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

    IF COL_LENGTH('dbo.OrderItems', 'Price') IS NULL
      ALTER TABLE dbo.OrderItems ADD Price DECIMAL(10,2) NOT NULL CONSTRAINT DF_OrderItems_Price_Alter DEFAULT(0);
    IF COL_LENGTH('dbo.OrderItems', 'Qty') IS NULL
      ALTER TABLE dbo.OrderItems ADD Qty INT NOT NULL CONSTRAINT DF_OrderItems_Qty_Alter DEFAULT(1);
    IF COL_LENGTH('dbo.OrderItems', 'CreatedAt') IS NULL
      ALTER TABLE dbo.OrderItems ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrderItems_CreatedAt_Alter DEFAULT(SYSUTCDATETIME());
  `);
}

async function getNormalizedCheckoutItems(pool, rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("EMPTY_CART");
  }

  const items = rawItems
    .map((item) => ({
      gameId: Number(item?.gameId),
      qty: Math.max(1, Number(item?.qty || 1)),
    }))
    .filter((item) => Number.isFinite(item.gameId));

  if (items.length === 0) {
    throw new Error("INVALID_ITEMS");
  }

  const uniqueGameIds = [...new Set(items.map((item) => item.gameId))];
  const gameRows = await pool.request().query(`
    SELECT GameId, Name, Price, ImageUrl
    FROM dbo.Games
    WHERE IsActive = 1
      AND GameId IN (${uniqueGameIds.join(",")})
  `);

  const gameMap = new Map(
    (gameRows.recordset || []).map((row) => [
      Number(row.GameId),
      {
        gameId: Number(row.GameId),
        name: row.Name,
        price: Number(row.Price || 0),
        imageUrl: row.ImageUrl || null,
      },
    ]),
  );

  let subtotal = 0;
  const normalizedItems = items.map((item) => {
    const game = gameMap.get(item.gameId);

    if (!game) {
      throw new Error("GAME_NOT_FOUND");
    }

    const lineTotal = game.price * item.qty;
    subtotal += lineTotal;

    return {
      ...game,
      qty: item.qty,
      lineTotal,
    };
  });

  return {
    items: normalizedItems,
    subtotal,
  };
}

async function createPendingOrder(pool, payload) {
  const tx = pool.transaction();
  await tx.begin();

  try {
    const orderResult = await tx
      .request()
      .input("userId", payload.userId)
      .input("subtotal", payload.subtotal)
      .input("serviceFee", payload.serviceFee)
      .input("paymentFee", payload.paymentFee)
      .input("total", payload.total)
      .input("paymentMethod", payload.paymentMethod)
      .input("status", payload.status)
      .input("paymentProvider", payload.paymentProvider)
      .input("currency", payload.currency)
      .input("customerEmail", payload.contact.email)
      .input("customerName", payload.contact.name)
      .input("billingCountry", payload.contact.country)
      .input("billingCity", payload.contact.city)
      .input("billingAddress", payload.contact.address)
      .input("billingZip", payload.contact.zip).query(`
        INSERT INTO dbo.Orders (
          UserId,
          Subtotal,
          ServiceFee,
          PaymentFee,
          Total,
          PaymentMethod,
          Status,
          PaymentProvider,
          Currency,
          CustomerEmail,
          CustomerName,
          BillingCountry,
          BillingCity,
          BillingAddress,
          BillingZip,
          CreatedAt
        )
        OUTPUT INSERTED.OrderId
        VALUES (
          @userId,
          @subtotal,
          @serviceFee,
          @paymentFee,
          @total,
          @paymentMethod,
          @status,
          @paymentProvider,
          @currency,
          @customerEmail,
          @customerName,
          @billingCountry,
          @billingCity,
          @billingAddress,
          @billingZip,
          SYSUTCDATETIME()
        )
      `);

    const orderId = Number(orderResult.recordset?.[0]?.OrderId);

    for (const item of payload.items) {
      await tx
        .request()
        .input("orderId", orderId)
        .input("gameId", item.gameId)
        .input("price", item.price)
        .input("qty", item.qty).query(`
          INSERT INTO dbo.OrderItems (OrderId, GameId, Price, Qty, CreatedAt)
          VALUES (@orderId, @gameId, @price, @qty, SYSUTCDATETIME())
        `);
    }

    await tx.commit();
    return orderId;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function markOrderStatus(pool, orderId, status) {
  const safeStatus = String(status || "").trim().toLowerCase();
  const allowedStatuses = new Set([
    "pending_payment",
    "payment_error",
    "payment_expired",
    "completed",
  ]);

  if (!allowedStatuses.has(safeStatus)) {
    throw new Error(`INVALID_ORDER_STATUS:${safeStatus || "unknown"}`);
  }

  await pool
    .request()
    .input("orderId", orderId)
    .input("status", safeStatus).query(`
      UPDATE dbo.Orders
      SET Status = @status
      WHERE OrderId = @orderId
        AND ISNULL(Status, N'') <> N'completed'
    `);
}

export async function findOrderById(pool, orderId) {
  const result = await pool.request().input("orderId", orderId).query(`
    SELECT TOP 1
      OrderId AS orderId,
      UserId AS userId,
      Status AS status,
      ProviderSessionId AS providerSessionId
    FROM dbo.Orders
    WHERE OrderId = @orderId
  `);

  return result.recordset?.[0] || null;
}

export async function findOrderByProviderSessionId(pool, providerSessionId) {
  const result = await pool
    .request()
    .input("providerSessionId", providerSessionId).query(`
      SELECT TOP 1
        OrderId AS orderId,
        UserId AS userId,
        Status AS status,
        ProviderSessionId AS providerSessionId
      FROM dbo.Orders
      WHERE ProviderSessionId = @providerSessionId
    `);

  return result.recordset?.[0] || null;
}

export async function finalizePaidOrder(pool, orderId, userId, session) {
  const tx = pool.transaction();
  await tx.begin();

  try {
    const orderItems = await tx.request().input("orderId", orderId).query(`
      SELECT GameId
      FROM dbo.OrderItems
      WHERE OrderId = @orderId
    `);

    const items = (orderItems.recordset || []).map((row) => Number(row.GameId));

    await tx
      .request()
      .input("orderId", orderId)
      .input("paymentIntentId", String(session.payment_intent || ""))
      .input("providerSessionId", String(session.id || ""))
      .query(`
        UPDATE dbo.Orders
        SET
          Status = N'completed',
          PaymentMethod = N'stripe',
          PaymentProvider = N'stripe',
          PaymentIntentId = @paymentIntentId,
          ProviderSessionId = @providerSessionId,
          PaidAt = SYSUTCDATETIME()
        WHERE OrderId = @orderId
      `);

    for (const gameId of items) {
      await tx
        .request()
        .input("userId", userId)
        .input("gameId", gameId).query(`
          IF NOT EXISTS (
            SELECT 1
            FROM dbo.UserLibrary
            WHERE UserId = @userId AND GameId = @gameId
          )
          BEGIN
            INSERT INTO dbo.UserLibrary (UserId, GameId, AddedAt)
            VALUES (@userId, @gameId, SYSUTCDATETIME())
          END
        `);

      await tx
        .request()
        .input("userId", userId)
        .input("gameId", gameId).query(`
          DELETE FROM dbo.Cart
          WHERE UserId = @userId AND GameId = @gameId
        `);
    }

    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

async function finalizeDemoOrder(pool, orderId, userId, paymentMethod = "card") {
  const tx = pool.transaction();
  await tx.begin();

  try {
    const orderItems = await tx.request().input("orderId", orderId).query(`
      SELECT GameId
      FROM dbo.OrderItems
      WHERE OrderId = @orderId
    `);

    const items = (orderItems.recordset || []).map((row) => Number(row.GameId));

    await tx
      .request()
      .input("orderId", orderId)
      .input("paymentMethod", toSafeText(paymentMethod, 50) || "card").query(`
        UPDATE dbo.Orders
        SET
          Status = N'completed',
          PaymentMethod = @paymentMethod,
          PaymentProvider = N'demo',
          PaidAt = SYSUTCDATETIME()
        WHERE OrderId = @orderId
      `);

    for (const gameId of items) {
      await tx
        .request()
        .input("userId", userId)
        .input("gameId", gameId).query(`
          IF NOT EXISTS (
            SELECT 1
            FROM dbo.UserLibrary
            WHERE UserId = @userId AND GameId = @gameId
          )
          BEGIN
            INSERT INTO dbo.UserLibrary (UserId, GameId, AddedAt)
            VALUES (@userId, @gameId, SYSUTCDATETIME())
          END
        `);

      await tx
        .request()
        .input("userId", userId)
        .input("gameId", gameId).query(`
          DELETE FROM dbo.Cart
          WHERE UserId = @userId AND GameId = @gameId
        `);
    }

    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

async function listOrders(req, res) {
  try {
    const userId = Number(req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const pool = await getPool();
    await ensureOrdersSchema(pool);

    const result = await pool.request().input("userId", userId).query(`
      SELECT
        o.OrderId AS orderId,
        o.Subtotal AS subtotal,
        o.ServiceFee AS serviceFee,
        o.PaymentFee AS paymentFee,
        o.Total AS total,
        o.PaymentMethod AS paymentMethod,
        o.Status AS status,
        o.CreatedAt AS createdAt,
        oi.OrderItemId AS orderItemId,
        oi.GameId AS gameId,
        oi.Price AS price,
        oi.Qty AS qty,
        g.Name AS gameName,
        g.ImageUrl AS gameImage,
        g.Genre AS genre,
        g.Platform AS platform
      FROM dbo.Orders o
      LEFT JOIN dbo.OrderItems oi ON oi.OrderId = o.OrderId
      LEFT JOIN dbo.Games g ON g.GameId = oi.GameId
      WHERE o.UserId = @userId
      ORDER BY o.CreatedAt DESC, oi.OrderItemId ASC
    `);

    const grouped = new Map();

    for (const row of result.recordset || []) {
      const orderId = Number(row.orderId);

      if (!grouped.has(orderId)) {
        grouped.set(orderId, {
          orderId,
          subtotal: Number(row.subtotal || 0),
          serviceFee: Number(row.serviceFee || 0),
          paymentFee: Number(row.paymentFee || 0),
          total: Number(row.total || 0),
          paymentMethod: row.paymentMethod || "card",
          status: row.status || "completed",
          createdAt: row.createdAt || null,
          items: [],
        });
      }

      if (row.orderItemId) {
        grouped.get(orderId).items.push({
          id: Number(row.orderItemId),
          gameId: Number(row.gameId),
          name: row.gameName || `Game #${row.gameId}`,
          image: row.gameImage || null,
          genre: row.genre || null,
          platform: row.platform || null,
          price: Number(row.price || 0),
          qty: Number(row.qty || 1),
          lineTotal: Number(row.price || 0) * Number(row.qty || 1),
        });
      }
    }

    return res.json({ data: [...grouped.values()] });
  } catch (err) {
    console.error("ORDERS GET ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
}

router.get("/", authMiddleware, listOrders);

router.get("/my", authMiddleware, async (req, res) => {
  return listOrders(req, res);
});

router.post("/checkout-session", authMiddleware, async (req, res) => {
  return res.status(409).json({
    message:
      "Stripe checkout is currently disabled. Demo checkout is active through /api/v1/orders.",
  });
});

router.get(
  "/checkout-session/:sessionId/confirm",
  authMiddleware,
  async (req, res) => {
    return res.status(409).json({
      message:
        "Stripe payment confirmation is currently disabled. Demo checkout completes immediately.",
    });
  },
);

router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { valid, contact } = ensureRequiredContact(req.body);
    if (!valid) {
      return res
        .status(400)
        .json({ message: "Missing contact or billing information." });
    }

    const paymentMethod = toSafeText(req.body?.paymentMethod, 50) || "card";
    const serviceFee = Math.max(0, Number(req.body?.serviceFee || 0));
    const paymentFee = Math.max(0, Number(req.body?.paymentFee || 0));

    const pool = await getPool();
    await ensureOrdersSchema(pool);

    const { items, subtotal } = await getNormalizedCheckoutItems(
      pool,
      req.body?.items,
    );

    const total = subtotal + serviceFee + paymentFee;

    const orderId = await createPendingOrder(pool, {
      userId,
      items,
      subtotal,
      serviceFee,
      paymentFee,
      total,
      paymentMethod,
      paymentProvider: "demo",
      status: "completed",
      currency: "demo",
      contact,
    });

    await finalizeDemoOrder(pool, orderId, userId, paymentMethod);

    return res.status(201).json({
      ok: true,
      orderId,
      status: "completed",
      paymentMode: "demo",
    });
  } catch (err) {
    if (String(err?.message) === "EMPTY_CART") {
      return res.status(400).json({ message: "Cart is empty." });
    }

    if (String(err?.message) === "INVALID_ITEMS") {
      return res.status(400).json({ message: "Invalid items payload." });
    }

    if (String(err?.message) === "GAME_NOT_FOUND") {
      return res.status(400).json({ message: "Some games no longer exist." });
    }

    console.error("ORDERS CREATE DEMO ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

export default router;
