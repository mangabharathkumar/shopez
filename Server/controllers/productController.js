const asyncHandler = require("../middleware/asyncHandler");
const Admin = require("../models/Admin");
const Product = require("../models/Product");

const buildProductFilter = (query) => {
  const filter = {};

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
      { brand: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.category) {
    filter.category = { $regex: `^${query.category}$`, $options: "i" };
  }

  if (query.gender) {
    filter.gender = { $regex: `^${query.gender}$`, $options: "i" };
  }

  return filter;
};

const getSort = (sort) => {
  switch (sort) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "discount":
      return { discount: -1 };
    case "newest":
      return { createdAt: -1 };
    default:
      return { rating: -1, numReviews: -1, createdAt: -1 };
  }
};

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find(buildProductFilter(req.query)).sort(getSort(req.query.sort));
  res.json({ products });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ product });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ message: "Product deleted successfully" });
});

const addProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const alreadyReviewed = product.reviews.some((review) => (
    review.user && review.user.toString() === req.user._id.toString()
  ));

  if (alreadyReviewed) {
    res.status(409);
    throw new Error("Product already reviewed by this user");
  }

  product.reviews.push({
    user: req.user._id,
    username: req.user.username,
    rating: Number(rating),
    comment,
  });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numReviews;

  await product.save();
  res.status(201).json({ product });
});

const getStorefrontSettings = asyncHandler(async (req, res) => {
  const settings = await Admin.findOne().sort({ createdAt: 1 });
  res.json({ settings });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  getStorefrontSettings,
};

