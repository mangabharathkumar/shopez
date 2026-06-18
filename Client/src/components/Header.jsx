import { LogOut, Search, ShieldCheck, ShoppingCart, Store, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authStore";
import { useShop } from "../context/shopStore";

export default function Header() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useShop();
  const [search, setSearch] = useState("");

  const cartCount = cart?.totalItems || 0;

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(`/products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="ShopEZ home">
        <Store size={24} />
        <span>ShopEZ</span>
      </Link>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search electronics, fashion, mobiles..."
          aria-label="Search products"
        />
        <button type="submit" aria-label="Search">
          <Search size={19} />
        </button>
      </form>

      <nav className="main-nav">
        <NavLink to="/products">Products</NavLink>
        {isAdmin && (
          <NavLink to="/admin">
            <ShieldCheck size={17} />
            Admin
          </NavLink>
        )}
        {user && (
          <NavLink to="/profile">
            <UserRound size={17} />
            Profile
          </NavLink>
        )}
        {user && !isAdmin && (
          <NavLink className="cart-link" to="/cart" aria-label={`Cart with ${cartCount} items`}>
            <ShoppingCart size={18} />
            <span>{cartCount}</span>
          </NavLink>
        )}
        {user ? (
          <button className="icon-text-button" type="button" onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        ) : (
          <NavLink className="login-button" to="/auth">Login</NavLink>
        )}
      </nav>
    </header>
  );
}
