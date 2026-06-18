const express = require("express");
const {
  deleteUser,
  getDashboard,
  getSettings,
  getUsers,
  updateSettings,
} = require("../controllers/adminController");
const { getAllOrders, updateOrderStatus } = require("../controllers/orderController");
const { createProduct } = require("../controllers/productController");
const { adminOnly, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);
router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.post("/products", createProduct);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

module.exports = router;

