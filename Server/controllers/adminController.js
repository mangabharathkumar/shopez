const asyncHandler = require("../middleware/asyncHandler");
const Admin = require("../models/Admin");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { sanitizeUser } = require("./authController");

const getDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, orders, settings] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.find(),
    Admin.findOne().sort({ createdAt: 1 }),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
    return acc;
  }, {});

  res.json({
    stats: {
      totalUsers,
      totalProducts,
      totalOrders: orders.length,
      totalRevenue,
      statusCounts,
    },
    settings,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(sanitizeUser) });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own admin account");
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ message: "User deleted successfully" });
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = await Admin.findOne().sort({ createdAt: 1 });
  res.json({ settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Admin.findOne().sort({ createdAt: 1 });

  if (!settings) {
    settings = new Admin({
      bannerImage: req.body.bannerImage,
      categories: req.body.categories || [],
    });
  }

  settings.siteName = req.body.siteName ?? settings.siteName;
  settings.bannerImage = req.body.bannerImage ?? settings.bannerImage;
  settings.bannerTitle = req.body.bannerTitle ?? settings.bannerTitle;
  settings.bannerSubtitle = req.body.bannerSubtitle ?? settings.bannerSubtitle;
  settings.categories = req.body.categories ?? settings.categories;

  const updatedSettings = await settings.save();
  res.json({ settings: updatedSettings });
});

module.exports = {
  getDashboard,
  getUsers,
  deleteUser,
  getSettings,
  updateSettings,
};

