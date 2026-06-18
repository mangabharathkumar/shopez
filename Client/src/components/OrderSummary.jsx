import { formatCurrency } from "../utils/money";

export default function OrderSummary({ subtotal = 0, discountTotal = 0, shippingFee = 0, total = 0 }) {
  return (
    <aside className="summary-panel">
      <h2>Order Summary</h2>
      <div>
        <span>Subtotal</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>
      <div>
        <span>Discount</span>
        <strong>-{formatCurrency(discountTotal)}</strong>
      </div>
      <div>
        <span>Shipping</span>
        <strong>{shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</strong>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </aside>
  );
}

