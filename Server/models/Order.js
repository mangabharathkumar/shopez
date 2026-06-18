const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    title: { type: String, required: true },
    mainImg: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: "" },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "UPI", "Card"],
      default: "Cash on Delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Order Placed", "Processing", "Shipped", "In Transit", "Delivered", "Cancelled"],
      default: "Order Placed",
    },
    notes: {
      type: String,
      default: "",
    },
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

