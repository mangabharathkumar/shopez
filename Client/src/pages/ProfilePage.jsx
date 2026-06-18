import { PackageCheck, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/http";
import OrderStatus from "../components/OrderStatus";
import { useAuth } from "../context/authStore";
import { formatCurrency } from "../utils/money";

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: user?.username || "",
    phone: user?.phone || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
  });

  useEffect(() => {
    api.get("/orders/my-orders")
      .then(({ data }) => setOrders(data.orders))
      .catch(() => setOrders([]));
  }, []);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.put("/users/profile", {
        username: form.username,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
      });
      await refreshProfile();
      setMessage("Profile updated");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Profile</h1>
        </div>
      </div>

      <section className="profile-grid">
        <form className="profile-form" onSubmit={saveProfile}>
          <h2>Personal Details</h2>
          {message && <div className="success-message">{message}</div>}
          {error && <div className="form-error">{error}</div>}
          <input name="username" value={form.username} onChange={updateField} placeholder="Username" required />
          <input name="phone" value={form.phone} onChange={updateField} placeholder="Mobile number" />
          <input name="street" value={form.street} onChange={updateField} placeholder="Address" />
          <input name="city" value={form.city} onChange={updateField} placeholder="City" />
          <input name="state" value={form.state} onChange={updateField} placeholder="State" />
          <input name="pincode" value={form.pincode} onChange={updateField} placeholder="Pincode" />
          <button className="primary-button" type="submit"><Save size={17} /> Save Profile</button>
        </form>

        <section className="orders-panel">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Purchases</span>
              <h2>My Orders</h2>
            </div>
            <PackageCheck size={24} />
          </div>
          {orders.length === 0 ? (
            <div className="empty-state small">No orders yet.</div>
          ) : orders.map((order) => (
            <Link className="profile-order" to={`/orders/${order._id}`} key={order._id}>
              <div>
                <strong>{order.items[0]?.title}</strong>
                <p>{order.items.length} item{order.items.length > 1 ? "s" : ""} placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <OrderStatus status={order.orderStatus} />
              <span>{formatCurrency(order.total)}</span>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}
