import { ChevronLeft, ShoppingCart, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/http";
import { useAuth } from "../context/authStore";
import { useShop } from "../context/shopStore";
import { discountedPrice, formatCurrency } from "../utils/money";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useShop();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setActiveImage(data.product.mainImg);
        setSelectedSize(data.product.sizes?.[0] || "");
      })
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [id]);

  const images = useMemo(() => {
    if (!product) return [];
    return [product.mainImg, ...(product.carousel || [])].filter(Boolean);
  }, [product]);

  const handleAdd = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    await addToCart({ productId: product._id, quantity: 1, size: selectedSize });
  };

  if (error) {
    return <main className="page-shell"><div className="empty-state">{error}</div></main>;
  }

  if (!product) {
    return <main className="page-shell"><div className="loading">Loading product...</div></main>;
  }

  return (
    <main className="page-shell">
      <Link className="back-link" to="/products"><ChevronLeft size={18} /> Products</Link>
      <section className="product-detail-layout">
        <div className="product-gallery">
          <img className="detail-image" src={activeImage} alt={product.title} />
          <div className="thumbnail-row">
            {images.map((image, index) => (
              <button
                className={activeImage === image ? "active" : ""}
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt={`${product.title} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-copy">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.title}</h1>
          <div className="detail-rating">
            <Star size={18} fill="currentColor" />
            <strong>{product.rating || 0}</strong>
            <span>{product.numReviews || product.reviews?.length || 0} reviews</span>
          </div>
          <p>{product.description}</p>
          <div className="detail-price">
            <strong>{formatCurrency(discountedPrice(product))}</strong>
            {product.discount > 0 && (
              <>
                <del>{formatCurrency(product.price)}</del>
                <span>{product.discount}% off</span>
              </>
            )}
          </div>

          {product.sizes?.length > 0 && (
            <div className="size-picker">
              <span>Available size</span>
              <div>
                {product.sizes.map((size) => (
                  <button
                    className={selectedSize === size ? "active" : ""}
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="detail-actions">
            <button type="button" className="secondary-button large" onClick={handleAdd}>
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <Link className="primary-button large" to={`/checkout?product=${product._id}&size=${encodeURIComponent(selectedSize)}`}>
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      <section className="page-section flush">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Customer feedback</span>
            <h2>Reviews</h2>
          </div>
        </div>
        <div className="review-list">
          {(product.reviews || []).map((review) => (
            <article className="review-item" key={review._id || `${review.username}-${review.comment}`}>
              <strong>{review.username}</strong>
              <span>{review.rating}/5</span>
              <p>{review.comment}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
