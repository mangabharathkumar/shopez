export const formatCurrency = (value = 0) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export const discountedPrice = (product) => {
  if (!product) return 0;
  return Math.round(product.price - (product.price * (product.discount || 0)) / 100);
};

