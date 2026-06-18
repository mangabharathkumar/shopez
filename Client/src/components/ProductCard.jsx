import { ShoppingCart, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authStore";
import { useShop } from "../context/shopStore";
import { discountedPrice, formatCurrency } from "../utils/money";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useShop();

  const handleAdd = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    await addToCart({ productId: product._id, quantity: 1, size: product.sizes?.[0] || "" });
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-image-link">
        <img src={product.mainImg} alt={product.title} />
      </Link>
      <div className="product-card-body">
        <div className="product-meta">
          <span>{product.category}</span>
          <span className="rating"><Star size={14} fill="currentColor" /> {product.rating || 0}</span>
        </div>
        <Link to={`/products/${product._id}`} className="product-title">{product.title}</Link>
        <p>{product.description}</p>
        <div className="price-row">
          <strong>{formatCurrency(discountedPrice(product))}</strong>
          {product.discount > 0 && (
            <>
              <del>{formatCurrency(product.price)}</del>
              <span>{product.discount}% off</span>
            </>
          )}
        </div>
        <div className="product-actions">
          <button type="button" className="secondary-button" onClick={handleAdd}>
            <ShoppingCart size={16} />
            Add
          </button>
          <Link className="primary-button" to={`/checkout?product=${product._id}`}>
            Shop Now
          </Link>
        </div>
      </div>
    </article>
  );
}
