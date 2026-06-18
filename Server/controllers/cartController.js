const asyncHandler = require("../middleware/asyncHandler");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const finalPriceFor = (product) => Math.round(product.price - (product.price * product.discount) / 100);

const enrichCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate("items.product");
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0);
  return {
    cart,
    subtotal,
    totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
};

const getCart = asyncHandler(async (req, res) => {
  const summary = await enrichCart(req.user._id);
  res.json(summary);
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size = "" } = req.body;
  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.stock < quantity) {
    res.status(400);
    throw new Error("Requested quantity is not available");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find((item) => (
    item.product.toString() === productId && item.size === size
  ));

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({
      product: productId,
      quantity,
      size,
      priceAtAdd: finalPriceFor(product),
    });
  }

  await cart.save();
  const summary = await enrichCart(req.user._id);
  res.status(201).json(summary);
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error("Cart item not found");
  }

  item.quantity = Math.max(1, Number(quantity));
  await cart.save();
  const summary = await enrichCart(req.user._id);
  res.json(summary);
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
  await cart.save();
  const summary = await enrichCart(req.user._id);
  res.json(summary);
});

const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { upsert: true });
  const summary = await enrichCart(req.user._id);
  res.json(summary);
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};

