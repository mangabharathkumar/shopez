const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    mainImg: { type: String, required: true },
    carousel: [{ type: String }],
    sizes: [{ type: String }],
    category: { type: String, required: true, index: true },
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex", "Kids", "NA"],
      default: "NA",
    },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 95 },
    stock: { type: Number, default: 10, min: 0 },
    brand: { type: String, default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual("finalPrice").get(function finalPrice() {
  return Math.round(this.price - (this.price * this.discount) / 100);
});

module.exports = mongoose.model("Product", productSchema);

