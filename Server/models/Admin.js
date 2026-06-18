const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, required: true },
  },
  { _id: false }
);

const adminSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: "ShopEZ",
    },
    bannerImage: {
      type: String,
      required: true,
    },
    bannerTitle: {
      type: String,
      default: "Super Sale",
    },
    bannerSubtitle: {
      type: String,
      default: "Smart deals across every aisle",
    },
    categories: [categorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);

