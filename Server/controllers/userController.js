const asyncHandler = require("../middleware/asyncHandler");
const { sanitizeUser } = require("./authController");
const User = require("../models/User");

const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.username = req.body.username || user.username;
  user.phone = req.body.phone ?? user.phone;
  user.address = {
    street: req.body.address?.street ?? user.address.street,
    city: req.body.address?.city ?? user.address.city,
    state: req.body.address?.state ?? user.address.state,
    pincode: req.body.address?.pincode ?? user.address.pincode,
  };

  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();
  res.json({ user: sanitizeUser(updatedUser) });
});

module.exports = { getProfile, updateProfile };

