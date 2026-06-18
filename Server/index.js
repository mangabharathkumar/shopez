require("dotenv").config();
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const registerMemoryRoutes = require("./routes/memoryRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "ShopEZ API is running",
    endpoints: ["/api/auth", "/api/products", "/api/cart", "/api/orders", "/api/admin"],
  });
});

const registerDatabaseRoutes = () => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);
};

const startServer = (mode) => {
  app.locals.dataMode = mode;
  app.use(notFound);
  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`ShopEZ server running on http://localhost:${port}`);
    console.log(`Data mode: ${mode}`);
  });
};

connectDB()
  .then(() => {
    registerDatabaseRoutes();
    startServer("MongoDB");
  })
  .catch((error) => {
    if (process.env.ALLOW_MEMORY_STORE === "false") {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    }

    console.warn("MongoDB connection failed; starting with in-memory demo data.");
    console.warn(error.message);
    registerMemoryRoutes(app).then(() => startServer("Memory demo"));
  });
