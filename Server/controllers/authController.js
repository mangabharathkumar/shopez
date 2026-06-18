const jwt = require("jsonwebtoken");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
});

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, userType } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Username, email, and password are required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(409);
    throw new Error("User already exists with this email");
  }

  const user = await User.create({
    username,
    email,
    password,
    role: userType === "admin" ? "admin" : "customer",
  });

  res.status(201).json({
    user: sanitizeUser(user),
    token: generateToken(user._id),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  const isMatch = user && (await user.matchPassword(password));

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    user: sanitizeUser(user),
    token: generateToken(user._id),
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  sanitizeUser,
};

