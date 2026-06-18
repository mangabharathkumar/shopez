const express = require("express");
const {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", getCart);
router.post("/", addToCart);
router.put("/:itemId", updateCartItem);
router.delete("/:itemId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;

