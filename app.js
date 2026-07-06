const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const trayRoutes = require("./routes/trayRoutes");
require("dotenv").config();

const db = require("./config/firebase");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  })
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));
app.use(express.static(path.join(__dirname, "./public")));

// Serve the frontend SPA as static files
app.use(express.static(path.join(__dirname, "./frontend")));

// API & view routes
app.use("/", trayRoutes);

// SPA fallback — serve frontend index.html for any unmatched GET request
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

module.exports = app;
