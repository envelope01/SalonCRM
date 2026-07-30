// server.js
const express = require("express");
const cors = require("cors");
const { config } = require("./src/config/index.ts");
const { pool } = require("./src/db/index.ts");

const app = express();

// Middlewares
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.app.clientOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", reportRoutes);

// Routes

const authRoutes = require("./routes/authRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");
app.use("/api/auth", authRoutes);

const clientRoutes = require("./routes/clientRoutes");
app.use("/api/clients", clientRoutes);

const serviceRoutes = require("./routes/serviceRoutes");
app.use("/api/services", serviceRoutes);

const visitRoutes = require("./routes/visitRoutes");
app.use("/api/visits", visitRoutes);

const expenseRoutes = require("./routes/expenseRoutes");
app.use("/api/expenses", expenseRoutes);

// Simple health check route
app.get("/", (req, res) => {
  res.send("Salon CRM API is running version 1.0");
});

// Connect to PostgreSQL and start server
const PORT = config.app.port;

pool
  .query("select 1")
  .then(() => {
    console.log("PostgreSQL connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.app.env}`);
      console.log(`Allowed client origin(s): ${config.app.clientOrigins.join(", ")}`);
      console.log(`test http://localhost:${PORT}/api/clients`);
    });
  })
  .catch((err) => {
    console.error("PostgreSQL connection error:", err);
    process.exit(1);
  });
