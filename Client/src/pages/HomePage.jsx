import { ArrowRight, BadgeCheck, CreditCard, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useShop } from "../context/shopStore";

export default function HomePage() {
  const { products, settings } = useShop();
  const featured = products.slice(0, 8);
  const categories = settings?.categories || [];

  return (
    <main>
      <section
        className="home-hero"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(10, 18, 32, 0.78), rgba(10, 18, 32, 0.18)), url(${settings?.bannerImage || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80"})` }}
      >
        <div className="hero-copy">
          <span className="eyebrow">ShopEZ marketplace</span>
          <h1>{settings?.bannerTitle || "Super Sale"}</h1>
          <p>{settings?.bannerSubtitle || "Find daily essentials, electronics, fashion, and sports gear in one secure checkout."}</p>
          <div className="hero-actions">
            <Link className="primary-button large" to="/products">
              Shop Now
              <ArrowRight size={18} />
            </Link>
            <Link className="secondary-button large" to="/auth">Create Account</Link>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div><BadgeCheck size={21} /> Verified products</div>
        <div><CreditCard size={21} /> Secure checkout</div>
        <div><PackageCheck size={21} /> Instant confirmation</div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Browse by need</span>
            <h2>Featured Categories</h2>
          </div>
          <Link to="/products">View catalog</Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              className="category-tile"
              key={category.slug}
              to={`/products?category=${encodeURIComponent(category.name)}`}
            >
              <img src={category.image} alt={category.name} />
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Popular right now</span>
            <h2>Recommended Products</h2>
          </div>
          <Link to="/products?sort=discount">Best discounts</Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard product={product} key={product._id} />
          ))}
        </div>
      </section>
    </main>
  );
}
