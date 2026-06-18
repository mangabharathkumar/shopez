const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const { bannerImage, categories, products: seedProducts } = require("../data/seedData");

const createId = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
const finalPriceFor = (product) => Math.round(product.price - (product.price * (product.discount || 0)) / 100);

const store = {
  users: [],
  products: [],
  carts: [],
  orders: [],
  settings: {
    _id: createId(),
    siteName: "ShopEZ",
    bannerImage,
    bannerTitle: "Super Sale",
    bannerSubtitle: "Fresh deals, secure checkout, and instant order confirmation",
    categories,
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const seedMemoryStore = async () => {
  if (store.products.length > 0) return;

  store.users = [
    {
      _id: createId(),
      username: "ShopEZ Admin",
      email: "admin@shopez.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      phone: "",
      address: { street: "", city: "", state: "", pincode: "" },
      createdAt: new Date().toISOString(),
    },
    {
      _id: createId(),
      username: "Demo Customer",
      email: "customer@shopez.com",
      password: await bcrypt.hash("customer123", 10),
      role: "customer",
      phone: "9876543210",
      address: {
        street: "MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
      createdAt: new Date().toISOString(),
    },
  ];

  store.products = seedProducts.map((product) => ({
    ...clone(product),
    _id: createId(),
    reviews: (product.reviews || []).map((review) => ({ ...review, _id: createId() })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  phone: user.phone || "",
  address: user.address || { street: "", city: "", state: "", pincode: "" },
});

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || "shopez_local_development_secret", { expiresIn: "7d" });

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    res.status(401);
    next(new Error("Not authorized, token missing"));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "shopez_local_development_secret");
    const user = store.users.find((account) => account._id === decoded.id);

    if (!user) {
      res.status(401);
      next(new Error("Not authorized, user not found"));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    next(error);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    res.status(403);
    next(new Error("Admin access required"));
    return;
  }

  next();
};

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const filterProducts = (query) => {
  let results = [...store.products];

  if (query.search) {
    const search = query.search.toLowerCase();
    results = results.filter((product) => (
      product.title.toLowerCase().includes(search)
      || product.description.toLowerCase().includes(search)
      || product.brand.toLowerCase().includes(search)
    ));
  }

  if (query.category) {
    results = results.filter((product) => product.category.toLowerCase() === query.category.toLowerCase());
  }

  if (query.gender) {
    results = results.filter((product) => product.gender.toLowerCase() === query.gender.toLowerCase());
  }

  if (query.sort === "price_asc") results.sort((a, b) => a.price - b.price);
  else if (query.sort === "price_desc") results.sort((a, b) => b.price - a.price);
  else if (query.sort === "discount") results.sort((a, b) => b.discount - a.discount);
  else if (query.sort === "newest") results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else results.sort((a, b) => b.rating - a.rating);

  return results;
};

const getOrCreateCart = (userId) => {
  let cart = store.carts.find((item) => item.user === userId);

  if (!cart) {
    cart = { _id: createId(), user: userId, items: [] };
    store.carts.push(cart);
  }

  return cart;
};

const cartResponse = (userId) => {
  const cart = getOrCreateCart(userId);
  const populatedItems = cart.items.map((item) => ({
    ...item,
    product: store.products.find((product) => product._id === item.product),
  })).filter((item) => item.product);

  const subtotal = populatedItems.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0);

  return {
    cart: { ...cart, items: populatedItems },
    subtotal,
    totalItems: populatedItems.reduce((sum, item) => sum + item.quantity, 0),
  };
};

const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const afterDiscount = items.reduce((sum, item) => (
    sum + Math.round(item.price - (item.price * item.discount) / 100) * item.quantity
  ), 0);
  const shippingFee = afterDiscount >= 999 ? 0 : 49;

  return {
    subtotal,
    discountTotal: subtotal - afterDiscount,
    shippingFee,
    total: afterDiscount + shippingFee,
  };
};

const buildOrderItems = (sourceItems) => sourceItems.map((item) => {
  const product = store.products.find((candidate) => candidate._id === (item.product || item.productId));

  if (!product) {
    throw new Error("One or more products were not found");
  }

  const quantity = Number(item.quantity || 1);
  if (product.stock < quantity) {
    throw new Error(`${product.title} does not have enough stock`);
  }

  return {
    product: product._id,
    title: product.title,
    mainImg: product.mainImg,
    price: product.price,
    discount: product.discount || 0,
    quantity,
    size: item.size || "",
  };
});

const registerMemoryRoutes = async (app) => {
  await seedMemoryStore();

  const authRouter = express.Router();
  authRouter.post("/register", asyncRoute(async (req, res) => {
    const { username, email, password, userType } = req.body;
    if (!username || !email || !password) {
      res.status(400);
      throw new Error("Username, email, and password are required");
    }

    if (store.users.some((user) => user.email === email.toLowerCase())) {
      res.status(409);
      throw new Error("User already exists with this email");
    }

    const user = {
      _id: createId(),
      username,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: userType === "admin" ? "admin" : "customer",
      phone: "",
      address: { street: "", city: "", state: "", pincode: "" },
      createdAt: new Date().toISOString(),
    };

    store.users.push(user);
    res.status(201).json({ user: sanitizeUser(user), token: generateToken(user._id) });
  }));

  authRouter.post("/login", asyncRoute(async (req, res) => {
    const { email, password } = req.body;
    const user = store.users.find((account) => account.email === email?.toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    res.json({ user: sanitizeUser(user), token: generateToken(user._id) });
  }));

  authRouter.post("/logout", (req, res) => res.json({ message: "Logged out successfully" }));
  authRouter.get("/me", protect, (req, res) => res.json({ user: sanitizeUser(req.user) }));

  const userRouter = express.Router();
  userRouter.get("/profile", protect, (req, res) => res.json({ user: sanitizeUser(req.user) }));
  userRouter.put("/profile", protect, (req, res) => {
    req.user.username = req.body.username || req.user.username;
    req.user.phone = req.body.phone ?? req.user.phone;
    req.user.address = {
      street: req.body.address?.street ?? req.user.address.street,
      city: req.body.address?.city ?? req.user.address.city,
      state: req.body.address?.state ?? req.user.address.state,
      pincode: req.body.address?.pincode ?? req.user.address.pincode,
    };
    res.json({ user: sanitizeUser(req.user) });
  });

  const productRouter = express.Router();
  productRouter.get("/", (req, res) => res.json({ products: filterProducts(req.query) }));
  productRouter.get("/settings/storefront", (req, res) => res.json({ settings: store.settings }));
  productRouter.get("/:id", (req, res, next) => {
    const product = store.products.find((candidate) => candidate._id === req.params.id);
    if (!product) {
      res.status(404);
      next(new Error("Product not found"));
      return;
    }
    res.json({ product });
  });
  productRouter.post("/", protect, adminOnly, (req, res) => {
    const product = {
      _id: createId(),
      rating: 0,
      numReviews: 0,
      reviews: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body,
    };
    store.products.unshift(product);
    res.status(201).json({ product });
  });
  productRouter.put("/:id", protect, adminOnly, (req, res, next) => {
    const index = store.products.findIndex((candidate) => candidate._id === req.params.id);
    if (index < 0) {
      res.status(404);
      next(new Error("Product not found"));
      return;
    }
    store.products[index] = { ...store.products[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ product: store.products[index] });
  });
  productRouter.delete("/:id", protect, adminOnly, (req, res, next) => {
    const beforeLength = store.products.length;
    store.products = store.products.filter((product) => product._id !== req.params.id);
    if (store.products.length === beforeLength) {
      res.status(404);
      next(new Error("Product not found"));
      return;
    }
    res.json({ message: "Product deleted successfully" });
  });
  productRouter.post("/:id/reviews", protect, (req, res, next) => {
    const product = store.products.find((candidate) => candidate._id === req.params.id);
    if (!product) {
      res.status(404);
      next(new Error("Product not found"));
      return;
    }
    product.reviews.push({
      _id: createId(),
      user: req.user._id,
      username: req.user.username,
      rating: Number(req.body.rating),
      comment: req.body.comment,
    });
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numReviews;
    res.status(201).json({ product });
  });

  const cartRouter = express.Router();
  cartRouter.use(protect);
  cartRouter.get("/", (req, res) => res.json(cartResponse(req.user._id)));
  cartRouter.post("/", (req, res, next) => {
    const product = store.products.find((candidate) => candidate._id === req.body.productId);
    if (!product) {
      res.status(404);
      next(new Error("Product not found"));
      return;
    }

    const cart = getOrCreateCart(req.user._id);
    const existing = cart.items.find((item) => item.product === product._id && item.size === (req.body.size || ""));

    if (existing) {
      existing.quantity += Number(req.body.quantity || 1);
    } else {
      cart.items.push({
        _id: createId(),
        product: product._id,
        quantity: Number(req.body.quantity || 1),
        size: req.body.size || "",
        priceAtAdd: finalPriceFor(product),
      });
    }

    res.status(201).json(cartResponse(req.user._id));
  });
  cartRouter.put("/:itemId", (req, res, next) => {
    const cart = getOrCreateCart(req.user._id);
    const item = cart.items.find((candidate) => candidate._id === req.params.itemId);
    if (!item) {
      res.status(404);
      next(new Error("Cart item not found"));
      return;
    }
    item.quantity = Math.max(1, Number(req.body.quantity));
    res.json(cartResponse(req.user._id));
  });
  cartRouter.delete("/:itemId", (req, res) => {
    const cart = getOrCreateCart(req.user._id);
    cart.items = cart.items.filter((item) => item._id !== req.params.itemId);
    res.json(cartResponse(req.user._id));
  });
  cartRouter.delete("/", (req, res) => {
    const cart = getOrCreateCart(req.user._id);
    cart.items = [];
    res.json(cartResponse(req.user._id));
  });

  const orderRouter = express.Router();
  orderRouter.use(protect);
  orderRouter.post("/", (req, res) => {
    let sourceItems = req.body.items;
    if (!sourceItems || sourceItems.length === 0) {
      sourceItems = getOrCreateCart(req.user._id).items;
    }

    if (!sourceItems || sourceItems.length === 0) {
      res.status(400);
      throw new Error("No products selected for order");
    }

    const items = buildOrderItems(sourceItems);
    const order = {
      _id: createId(),
      user: req.user._id,
      items,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod || "Cash on Delivery",
      paymentStatus: req.body.paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      orderStatus: "Order Placed",
      notes: req.body.notes || "",
      ...calculateTotals(items),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.orders.unshift(order);
    items.forEach((item) => {
      const product = store.products.find((candidate) => candidate._id === item.product);
      if (product) product.stock -= item.quantity;
    });

    if (!req.body.items) getOrCreateCart(req.user._id).items = [];
    res.status(201).json({ order });
  });
  orderRouter.get("/my-orders", (req, res) => {
    res.json({ orders: store.orders.filter((order) => order.user === req.user._id) });
  });
  orderRouter.get("/admin/all", adminOnly, (req, res) => {
    const orders = store.orders.map((order) => ({ ...order, user: sanitizeUser(store.users.find((user) => user._id === order.user)) }));
    res.json({ orders });
  });
  orderRouter.get("/:id", (req, res, next) => {
    const order = store.orders.find((candidate) => candidate._id === req.params.id);
    if (!order) {
      res.status(404);
      next(new Error("Order not found"));
      return;
    }
    if (order.user !== req.user._id && req.user.role !== "admin") {
      res.status(403);
      next(new Error("Not allowed to view this order"));
      return;
    }
    res.json({ order: { ...order, user: sanitizeUser(store.users.find((user) => user._id === order.user)) } });
  });
  orderRouter.put("/:id/status", adminOnly, (req, res, next) => {
    const order = store.orders.find((candidate) => candidate._id === req.params.id);
    if (!order) {
      res.status(404);
      next(new Error("Order not found"));
      return;
    }
    order.orderStatus = req.body.orderStatus || order.orderStatus;
    order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
    order.updatedAt = new Date().toISOString();
    res.json({ order });
  });

  const adminRouter = express.Router();
  adminRouter.use(protect, adminOnly);
  adminRouter.get("/dashboard", (req, res) => {
    const statusCounts = store.orders.reduce((acc, order) => {
      acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
      return acc;
    }, {});
    res.json({
      stats: {
        totalUsers: store.users.length,
        totalProducts: store.products.length,
        totalOrders: store.orders.length,
        totalRevenue: store.orders.reduce((sum, order) => sum + order.total, 0),
        statusCounts,
      },
      settings: store.settings,
    });
  });
  adminRouter.get("/users", (req, res) => res.json({ users: store.users.map(sanitizeUser) }));
  adminRouter.delete("/users/:id", (req, res) => {
    store.users = store.users.filter((user) => user._id !== req.params.id);
    res.json({ message: "User deleted successfully" });
  });
  adminRouter.get("/orders", (req, res) => {
    const orders = store.orders.map((order) => ({ ...order, user: sanitizeUser(store.users.find((user) => user._id === order.user)) }));
    res.json({ orders });
  });
  adminRouter.put("/orders/:id/status", (req, res, next) => {
    const order = store.orders.find((candidate) => candidate._id === req.params.id);
    if (!order) {
      res.status(404);
      next(new Error("Order not found"));
      return;
    }
    order.orderStatus = req.body.orderStatus || order.orderStatus;
    order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
    order.updatedAt = new Date().toISOString();
    res.json({ order });
  });
  adminRouter.post("/products", (req, res) => {
    const product = {
      _id: createId(),
      rating: 0,
      numReviews: 0,
      reviews: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body,
    };
    store.products.unshift(product);
    res.status(201).json({ product });
  });
  adminRouter.get("/settings", (req, res) => res.json({ settings: store.settings }));
  adminRouter.put("/settings", (req, res) => {
    store.settings = { ...store.settings, ...req.body };
    res.json({ settings: store.settings });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/products", productRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/admin", adminRouter);
};

module.exports = registerMemoryRoutes;

