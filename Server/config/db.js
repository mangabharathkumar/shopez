const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ShopEZ";
  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS || 3000),
  });
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

module.exports = connectDB;
