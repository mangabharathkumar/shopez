import { CheckCircle2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/http";
import OrderStatus from "../components/OrderStatus";
import { formatCurrency } from "../utils/money";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [id]);

  if (error) {
    return <main className="page-shell"><div className="empty-state">{error}</div></main>;
  }

  if (!order) {
    return <main className="page-shell"><div className="loading">Loading order...</div></main>;
  }

  return (
    <main className="page-shell">
      <section className="confirmation-banner">
        <CheckCircle2 size={38} />
        <div>
          <span className="eyebrow">Order confirmation</span>
          <h1>Order placed successfully</h1>
          <p>Order ID: {order._id}</p>
        </div>
      </section>

      <section className="order-detail-grid">
        <div className="order-detail-main">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Status</span>
              <h2>{order.orderStatus}</h2>
            </div>
            <OrderStatus status={order.orderStatus} />
          </div>

          <div className="checkout-items">
            {order.items.map((item) => (
              <article className="checkout-item" key={`${item.product}-${item.title}`}>
                <img src={item.mainImg} alt={item.title} />
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.size || "Standard"} x {item.quantity}</p>
                  <strong>{formatCurrency(Math.round(item.price - (item.price * item.discount) / 100))}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="order-info-panel">
          <Package size={22} />
          <h2>Shipping Details</h2>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.address}, {order.shippingAddress.city}</p>
          <p>{order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
          <p>{order.shippingAddress.phone}</p>
          <div className="summary-total">
            <span>Total paid</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>
          <Link className="secondary-button full" to="/profile">View Profile Orders</Link>
        </aside>
      </section>
    </main>
  );
}

