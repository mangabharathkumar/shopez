import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Toast from "./components/Toast";
import { AuthProvider } from "./context/AuthContext";
import { ShopProvider } from "./context/ShopContext";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import ProductsPage from "./pages/ProductsPage";
import ProfilePage from "./pages/ProfilePage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailsPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toast />
        </BrowserRouter>
      </ShopProvider>
    </AuthProvider>
  );
}

export default App;

