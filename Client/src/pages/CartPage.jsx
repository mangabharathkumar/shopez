import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import OrderSummary from "../components/OrderSummary";
import { useShop } from "../context/shopStore";
import { discountedPrice, formatCurrency } from "../utils/money";

export default function CartPage() {
  const { cart, updateCartItem, removeCartItem } = useShop();
  const items = cart?.cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || item.priceAtAdd) * item.quantity, 0);
  const total = cart?.subtotal || 0;
  const discountTotal = subtotal - total;
  const shippingFee = total >= 999 || total === 0 ? 0 : 49;

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Shopping cart</span>
          <h1>Your Cart</h1>
        </div>
        <Link to="/products">Continue shopping</Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          Your cart is empty.
          <Link className="primary-button" to="/products">Shop Products</Link>
        </div>
      ) : (
        <section className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-row" key={item._id}>
                <img src={item.product?.mainImg} alt={item.product?.title} />
                <div className="cart-row-copy">
                  <h2>{item.product?.title}</h2>
                  <p>{item.size || item.product?.category}</p>
                  <strong>{formatCurrency(item.priceAtAdd || discountedPrice(item.product))}</strong>
                </div>
                <div className="quantity-control">
                  <button type="button" aria-label="Decrease" onClick={() => updateCartItem(item._id, item.quantity - 1)}>
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label="Increase" onClick={() => updateCartItem(item._id, item.quantity + 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                <button className="danger-icon" type="button" aria-label="Remove item" onClick={() => removeCartItem(item._id)}>
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
          <div className="checkout-column">
            <OrderSummary
              subtotal={subtotal}
              discountTotal={discountTotal}
              shippingFee={shippingFee}
              total={total + shippingFee}
            />
            <Link className="primary-button full" to="/checkout">Proceed to Checkout</Link>
          </div>
        </section>
      )}
    </main>
  );
}
