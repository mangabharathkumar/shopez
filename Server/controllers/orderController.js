const asyncHandler = require("../middleware/asyncHandler");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

const finalPriceFor = (product) => Math.round(product.price - (product.price * product.discount) / 100);

const requiredAddressFields = ["fullName", "phone", "address", "city", "state", "pincode"];

const buildOrderItems = async (items) => {
  const orderItems = [];

  for (const item of items) {
    const productId = item.product || item.productId;
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("One or more products were not found");
    }

    const quantity = Number(item.quantity || 1);
    if (product.stock < quantity) {
      throw new Error(`${product.title} does not have enough stock`);
    }

    orderItems.push({
      product: product._id,
      title: product.title,
      mainImg: product.mainImg,
      price: product.price,
      discount: product.discount,
      quantity,
      size: item.size || "",
    });
  }

  return orderItems;
};

const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = items.reduce((sum, item) => {
    const discountedPrice = Math.round(item.price - (item.price * item.discount) / 100);
    return sum + discountedPrice * item.quantity;
  }, 0);
  const shippingFee = total >= 999 ? 0 : 49;

  return {
    subtotal,
    discountTotal: subtotal - total,
    shippingFee,
    total: total + shippingFee,
  };
};

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = "Cash on Delivery", notes = "", items } = req.body;

  if (!shippingAddress || requiredAddressFields.some((field) => !shippingAddress[field])) {
    res.status(400);
    throw new Error("Complete shipping address is required");
  }

  let sourceItems = items;
  if (!sourceItems || sourceItems.length === 0) {
    const cart = await Cart.findOne({ user: req.user._id });
    sourceItems = cart?.items || [];
  }

  if (!sourceItems || sourceItems.length === 0) {
    res.status(400);
    throw new Error("No products selected for order");
  }

  const orderItems = await buildOrderItems(sourceItems);
  const totals = calculateTotals(orderItems);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
    notes,
    ...totals,
  });

  await Promise.all(orderItems.map((item) => (
    Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
  )));

  if (!items) {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  }

  res.status(201).json({ order });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "username email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const canView = order.user._id.toString() === req.user._id.toString() || req.user.role === "admin";
  if (!canView) {
    res.status(403);
    throw new Error("Not allowed to view this order");
  }

  res.json({ order });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "username email")
    .sort({ createdAt: -1 });

  res.json({ orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.orderStatus = req.body.orderStatus || order.orderStatus;
  order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
  const updatedOrder = await order.save();

  res.json({ order: updatedOrder });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};

