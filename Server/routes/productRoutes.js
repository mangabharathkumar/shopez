const express = require("express");
const {
  addProductReview,
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getStorefrontSettings,
  updateProduct,
} = require("../controllers/productController");
const { adminOnly, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/settings/storefront", getStorefrontSettings);
router.get("/:id", getProductById);
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);
router.post("/:id/reviews", protect, addProductReview);

module.exports = router;

