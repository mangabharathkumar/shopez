const express = require("express");
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");
const { adminOnly, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/admin/all", adminOnly, getAllOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", adminOnly, updateOrderStatus);

module.exports = router;

