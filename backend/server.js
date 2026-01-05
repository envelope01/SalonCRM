// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
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

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.ActiveDb === "Dev"
    ? process.env.MONGO_URI_DEV
    : process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    console.log("Connected to:", mongoose.connection.name);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`test http://localhost:${PORT}/api/clients`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
