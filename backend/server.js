// server.js
require("tsx/cjs");

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { clientOrigins, env, isAllowedClientOrigin } = require("./src/config/env.ts");
const { pool } = require("./src/db/index.ts");
const { logger } = require("./src/lib/logger.ts");
const { requestContext } = require("./src/middleware/requestContext.ts");
const { requestLogger } = require("./src/middleware/requestLogger.ts");
const {
  errorHandler,
  notFoundHandler,
} = require("./src/middleware/errorHandler.ts");

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Middlewares
app.use(requestContext);
app.use(requestLogger);
app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedClientOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const reportRoutes = require("./routes/reportRoutes");
app.use("/api", apiLimiter);
app.use("/api/reports", reportRoutes);

// Routes

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authLimiter, authRoutes);

const clientRoutes = require("./routes/clientRoutes");
app.use("/api/clients", clientRoutes);

const serviceRoutes = require("./routes/serviceRoutes");
app.use("/api/services", serviceRoutes);

const visitRoutes = require("./routes/visitRoutes");
app.use("/api/visits", visitRoutes);

const expenseRoutes = require("./routes/expenseRoutes");
app.use("/api/expenses", expenseRoutes);

const settingsRoutes = require("./routes/settingsRoutes");
app.use("/api/settings", settingsRoutes);

// Simple health check route
app.get("/", (req, res) => {
  res.send("Salon CRM API is running version 1.0");
});

app.get("/health", async (_req, res, next) => {
  try {
    await pool.query("select 1");
    res.json({
      status: "ok",
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
    });
  } catch (error) {
    next(error);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

// Connect to PostgreSQL and start server
const PORT = env.PORT;
const HOST = env.NODE_ENV === "development" ? "0.0.0.0" : undefined;
let server;

async function shutdown(signal) {
  logger.info("shutdown_started", { signal });

  if (!server) {
    await pool.end();
    process.exit(0);
  }

  server.close(async (error) => {
    if (error) {
      logger.error("http_server_close_failed", { error });
      process.exit(1);
    }

    try {
      await pool.end();
      logger.info("shutdown_completed", { signal });
      process.exit(0);
    } catch (poolError) {
      logger.error("database_pool_close_failed", { error: poolError });
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", { error: reason });
});
process.on("uncaughtException", (error) => {
  logger.error("uncaught_exception", { error });
  shutdown("uncaughtException");
});

pool
  .query("select 1")
  .then(() => {
    logger.info("database_connected");
    server = app.listen(PORT, HOST, () => {
      logger.info("server_started", {
        host: HOST || "default",
        port: PORT,
        environment: env.NODE_ENV,
        clientOrigins,
      });
    });
  })
  .catch((err) => {
    logger.error("database_connection_failed", { error: err });
    process.exit(1);
  });
