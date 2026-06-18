import { CreditCard, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/http";
import OrderSummary from "../components/OrderSummary";
import { useAuth } from "../context/authStore";
import { useShop } from "../context/shopStore";
import { formatCurrency } from "../utils/money";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("product");
  const querySize = searchParams.get("size") || "";
  const { user } = useAuth();
  const { cart, createOrder } = useShop();
  const [directProduct, setDirectProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(querySize);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState({
    fullName: user?.username || "",
    phone: user?.phone || "",
    address: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
  });

  useEffect(() => {
    if (!productId) return;
    api.get(`/products/${productId}`).then(({ data }) => {
      setDirectProduct(data.product);
      setSelectedSize(querySize || data.product.sizes?.[0] || "");
    });
  }, [productId, querySize]);

  const displayItems = useMemo(() => {
    if (directProduct) {
      return [{
        id: directProduct._id,
        title: directProduct.title,
        image: directProduct.mainImg,
        price: directProduct.price,
        discount: directProduct.discount,
        quantity,
        size: selectedSize,
      }];
    }

    return (cart?.cart?.items || []).map((item) => ({
      id: item._id,
      title: item.product?.title,
      image: item.product?.mainImg,
      price: item.product?.price || item.priceAtAdd,
      discount: item.product?.discount || 0,
      quantity: item.quantity,
      size: item.size,
    }));
  }, [cart, directProduct, quantity, selectedSize]);

  const totals = useMemo(() => {
    const subtotal = displayItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const afterDiscount = displayItems.reduce((sum, item) => {
      const price = Math.round(item.price - (item.price * item.discount) / 100);
      return sum + price * item.quantity;
    }, 0);
    const shippingFee = afterDiscount >= 999 || afterDiscount === 0 ? 0 : 49;
    return {
      subtotal,
      discountTotal: subtotal - afterDiscount,
      shippingFee,
      total: afterDiscount + shippingFee,
    };
  }, [displayItems]);

  const updateAddress = (event) => {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        shippingAddress: address,
        paymentMethod,
      };

      if (directProduct) {
        payload.items = [{
          productId: directProduct._id,
          quantity,
          size: selectedSize,
        }];
      }

      const order = await createOrder(payload);
      navigate(`/orders/${order._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!directProduct && displayItems.length === 0) {
    if (productId) {
      return <main className="page-shell"><div className="loading">Loading checkout...</div></main>;
    }

    return (
      <main className="page-shell">
        <div className="empty-state">
          No products selected for checkout.
          <Link className="primary-button" to="/products">Shop Products</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Secure checkout</span>
          <h1>Order Details</h1>
        </div>
      </div>

      <form className="checkout-layout" onSubmit={submitOrder}>
        <section className="checkout-form">
          <div className="form-section-title"><MapPin size={20} /> Shipping Address</div>
          <div className="form-grid">
            <input name="fullName" value={address.fullName} onChange={updateAddress} placeholder="Full name" required />
            <input name="phone" value={address.phone} onChange={updateAddress} placeholder="Mobile number" required />
            <input className="span-2" name="address" value={address.address} onChange={updateAddress} placeholder="Address" required />
            <input name="city" value={address.city} onChange={updateAddress} placeholder="City" required />
            <input name="state" value={address.state} onChange={updateAddress} placeholder="State" required />
            <input name="pincode" value={address.pincode} onChange={updateAddress} placeholder="Pincode" required />
          </div>

          <div className="form-section-title"><CreditCard size={20} /> Payment Method</div>
          <div className="payment-options">
            {["Cash on Delivery", "UPI", "Card"].map((method) => (
              <label className="payment-choice" key={method}>
                <input
                  type="radio"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                {method}
              </label>
            ))}
          </div>

          <div className="checkout-items">
            {displayItems.map((item) => (
              <article className="checkout-item" key={item.id}>
                <img src={item.image} alt={item.title} />
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.size || "Standard"} x {item.quantity}</p>
                  <strong>{formatCurrency(Math.round(item.price - (item.price * item.discount) / 100))}</strong>
                </div>
              </article>
            ))}
          </div>

          {directProduct && (
            <label className="quantity-field">
              Quantity
              <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            </label>
          )}

          {directProduct?.sizes?.length > 0 && (
            <label className="quantity-field">
              Size
              <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
                {directProduct.sizes.map((size) => <option key={size}>{size}</option>)}
              </select>
            </label>
          )}

          {error && <div className="form-error">{error}</div>}
        </section>

        <div className="checkout-column">
          <OrderSummary {...totals} />
          <button className="primary-button full" type="submit" disabled={submitting}>
            {submitting ? "Placing Order..." : `Place Order ${formatCurrency(totals.total)}`}
          </button>
        </div>
      </form>
    </main>
  );
}
