# ShopEZ MERN E-commerce Application

ShopEZ is a MERN stack e-commerce app with customer authentication, product catalog browsing, cart management, checkout, profile order history, and an admin dashboard for products, users, orders, banner settings, and categories.

## Project Structure

```text
Shopez/
  Client/   React + Vite frontend
  Server/   Express + MongoDB API
```

## Backend Setup

```bash
cd Server
npm install
npm run seed
npm run dev
```

The backend uses `mongodb://127.0.0.1:27017/ShopEZ` by default. Start MongoDB locally first, or update `Server/.env` with your MongoDB Atlas connection string. If MongoDB is not running, the API automatically starts with in-memory demo data so the full app can still be tested locally.

Demo accounts created by `npm run seed` and also available in in-memory demo mode:

```text
Admin:    admin@shopez.com / admin123
Customer: customer@shopez.com / customer123
```

## Frontend Setup

```bash
cd Client
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`
Backend URL: `http://localhost:8000`

## Main Features

- Customer registration and login
- Product catalog with search, category, gender, and sort filters
- Product details with images, pricing, discounts, sizes, and reviews
- Cart add/update/remove flow
- Checkout with shipping address and payment method
- Order confirmation and profile order history
- Admin dashboard with stats, users, orders, banner settings, and new product form
