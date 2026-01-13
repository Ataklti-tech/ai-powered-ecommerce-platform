import React from "react";
import { Star, ShoppingCart, Heart, Eye } from "lucide-react";
// import "./FeaturedProducts.css";

const FeaturedProducts = ({ products = [], loading = false, error = null }) => {
  const addToCart = (product) => {
    console.log("Adding to cart:", product);
    // Implement your add to cart logic here
  };

  const addToWishlist = (product) => {
    console.log("Adding to wishlist:", product);
    // Implement your wishlist logic here
  };

  const quickView = (product) => {
    console.log("Quick view:", product);
    // Implement your quick view modal logic here
  };

  if (loading) {
    return (
      <section className="featured-products">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          <div className="featured-products__grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="product-card product-card--loading">
                <div className="product-card__skeleton product-card__skeleton--image"></div>
                <div className="product-card__skeleton product-card__skeleton--title"></div>
                <div className="product-card__skeleton product-card__skeleton--price"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="featured-products">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          <div className="featured-products__error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-products">
      <div className="container">
        <div className="featured-products__header">
          <h2 className="section-title">Featured Products</h2>
          <a href="/products" className="featured-products__view-all">
            View All Products →
          </a>
        </div>

        <div className="featured-products__grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              {/* Product Badge */}
              {product.badge && (
                <span
                  className={`product-card__badge product-card__badge--${product.badge
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {product.badge}
                </span>
              )}

              {/* Product Image */}
              <div className="product-card__image-wrapper">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-card__image"
                  loading="lazy"
                />

                {/* Quick Actions Overlay */}
                <div className="product-card__actions">
                  <button
                    className="product-card__action-btn"
                    onClick={() => addToWishlist(product)}
                    aria-label="Add to wishlist"
                  >
                    <Heart size={18} />
                  </button>
                  <button
                    className="product-card__action-btn"
                    onClick={() => quickView(product)}
                    aria-label="Quick view"
                  >
                    <Eye size={18} />
                  </button>
                </div>

                {/* Discount Badge */}
                {product.discount && (
                  <div className="product-card__discount">
                    -{product.discount}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="product-card__content">
                <h3 className="product-card__title">{product.name}</h3>

                {/* Rating */}
                <div className="product-card__rating">
                  <div className="product-card__stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= Math.floor(product.rating)
                            ? "star--filled"
                            : "star--empty"
                        }
                        fill={
                          star <= Math.floor(product.rating)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                  </div>
                  <span className="product-card__reviews">
                    ({product.reviews})
                  </span>
                </div>

                {/* Price */}
                <div className="product-card__price-wrapper">
                  <span className="product-card__price">${product.price}</span>
                  {product.originalPrice && (
                    <span className="product-card__original-price">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button
                  className="product-card__cart-btn"
                  onClick={() => addToCart(product)}
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="featured-products__empty">
            <p>No featured products available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
