import { LockKeyhole, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authStore";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    userType: "customer",
  });
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const user = mode === "login"
        ? await login({ email: form.email, password: form.password })
        : await register(form);

      navigate(user.role === "admin" ? "/admin" : from, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-art">
          <Link className="brand" to="/">ShopEZ</Link>
          <h1>Effortless shopping starts here.</h1>
          <p>Create an account, add products to your cart, place secure orders, and track every purchase from your profile.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="segmented-control">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              <LockKeyhole size={17} />
              Login
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
              <UserPlus size={17} />
              Register
            </button>
          </div>

          <h2>{mode === "login" ? "Login" : "Register"}</h2>

          {error && <div className="form-error">{error}</div>}

          {mode === "register" && (
            <input
              name="username"
              value={form.username}
              onChange={updateField}
              placeholder="Username"
              required
            />
          )}
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            placeholder="Email address"
            required
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            placeholder="Password"
            minLength={6}
            required
          />
          {mode === "register" && (
            <select name="userType" value={form.userType} onChange={updateField}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          )}
          <button className="primary-button full" type="submit">
            {mode === "login" ? "Login" : "Create Account"}
          </button>
          <p className="demo-accounts">Demo: admin@shopez.com / admin123 or customer@shopez.com / customer123</p>
        </form>
      </section>
    </main>
  );
}
