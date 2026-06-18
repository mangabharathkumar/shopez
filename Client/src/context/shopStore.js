import { createContext, useContext } from "react";

export const ShopContext = createContext(null);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used inside ShopProvider");
  return context;
};

