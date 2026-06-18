const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, token missing");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    res.status(401);
    throw new Error("Not authorized, user not found");
  }

  req.user = user;
  next();
});

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }

  next();
};

module.exports = { protect, adminOnly };

