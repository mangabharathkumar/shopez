import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { getErrorMessage } from "../api/http";
import { useAuth } from "./authStore";
import { ShopContext } from "./shopStore";

const cleanParams = (params) => {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value));
};

export function ShopProvider({ children }) {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [cart, setCart] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [message, setMessage] = useState("");
  const messageTimer = useRef(null);

  const showMessage = useCallback((nextMessage) => {
    setMessage(nextMessage);
    window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(""), 2600);
  }, []);

  const fetchProducts = useCallback(async (filters = {}) => {
    setLoadingProducts(true);
    try {
      const { data } = await api.get("/products", { params: cleanParams(filters) });
      setProducts(data.products);
      return data.products;
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data } = await api.get("/products/settings/storefront");
    setSettings(data.settings);
    return data.settings;
  }, []);

  const fetchCart = useCallback(async () => {
    if (!token) {
      setCart(null);
      return null;
    }

    const { data } = await api.get("/cart");
    setCart(data);
    return data;
  }, [token]);

  const addToCart = useCallback(async ({ productId, quantity = 1, size = "" }) => {
    try {
      const { data } = await api.post("/cart", { productId, quantity, size });
      setCart(data);
      showMessage("Added to cart");
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }, [showMessage]);

  const updateCartItem = useCallback(async (itemId, quantity) => {
    const { data } = await api.put(`/cart/${itemId}`, { quantity });
    setCart(data);
    return data;
  }, []);

  const removeCartItem = useCallback(async (itemId) => {
    const { data } = await api.delete(`/cart/${itemId}`);
    setCart(data);
    return data;
  }, []);

  const clearCart = useCallback(async () => {
    const { data } = await api.delete("/cart");
    setCart(data);
    return data;
  }, []);

  const createOrder = useCallback(async (payload) => {
    try {
      const { data } = await api.post("/orders", payload);
      await fetchCart();
      return data.order;
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }, [fetchCart]);

  useEffect(() => {
    return () => window.clearTimeout(messageTimer.current);
  }, []);

  useEffect(() => {
    fetchProducts().catch(() => setProducts([]));
    fetchSettings().catch(() => setSettings(null));
  }, [fetchProducts, fetchSettings]);

  useEffect(() => {
    fetchCart().catch(() => setCart(null));
  }, [fetchCart]);

  const value = useMemo(() => ({
    products,
    settings,
    cart,
    loadingProducts,
    message,
    fetchProducts,
    fetchSettings,
    fetchCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    createOrder,
    showMessage,
  }), [
    addToCart,
    cart,
    clearCart,
    createOrder,
    fetchCart,
    fetchProducts,
    fetchSettings,
    loadingProducts,
    message,
    products,
    removeCartItem,
    settings,
    showMessage,
    updateCartItem,
  ]);

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

