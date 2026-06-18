require("dotenv").config();
const connectDB = require("../config/db");
const Admin = require("../models/Admin");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { bannerImage, categories, products } = require("../data/seedData");

const seed = async () => {
  await connectDB();

  await Promise.all([
    Admin.deleteMany(),
    Cart.deleteMany(),
    Order.deleteMany(),
    Product.deleteMany(),
    User.deleteMany(),
  ]);

  await User.create([
    {
      username: "ShopEZ Admin",
      email: "admin@shopez.com",
      password: "admin123",
      role: "admin",
    },
    {
      username: "Demo Customer",
      email: "customer@shopez.com",
      password: "customer123",
      role: "customer",
      phone: "9876543210",
      address: {
        street: "MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
    },
  ]);

  await Admin.create({
    siteName: "ShopEZ",
    bannerImage,
    bannerTitle: "Super Sale",
    bannerSubtitle: "Fresh deals, secure checkout, and instant order confirmation",
    categories,
  });

  await Product.insertMany(products);

  console.log("ShopEZ database seeded successfully");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

