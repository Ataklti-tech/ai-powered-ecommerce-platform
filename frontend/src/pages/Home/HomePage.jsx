import React, { useState, useEffect } from "react";
import HeroSection from "./HeroSection";
import FeaturedProducts from "./FeaturedProducts";
import "./HomePage.css";

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate fetching featured products
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        // Replace with your actual API call
        // const response = await fetch('/api/products/featured');
        // const data = await response.json();

        // Mock data for demonstration
        const mockProducts = [
          {
            id: 1,
            name: "Wireless Headphones",
            price: 129.99,
            originalPrice: 199.99,
            image:
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
            rating: 4.5,
            reviews: 128,
            badge: "Best Seller",
            discount: 35
          },
          {
            id: 2,
            name: "Smart Watch Pro",
            price: 299.99,
            originalPrice: 399.99,
            image:
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
            rating: 4.8,
            reviews: 256,
            badge: "New",
            discount: 25
          },
          {
            id: 3,
            name: "Laptop Backpack",
            price: 49.99,
            originalPrice: 79.99,
            image:
              "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
            rating: 4.3,
            reviews: 89,
            badge: "Hot Deal",
            discount: 38
          },
          {
            id: 4,
            name: "Bluetooth Speaker",
            price: 79.99,
            originalPrice: 129.99,
            image:
              "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
            rating: 4.6,
            reviews: 174,
            badge: "Sale",
            discount: 38
          },
          {
            id: 5,
            name: "Fitness Tracker",
            price: 89.99,
            originalPrice: 149.99,
            image:
              "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500",
            rating: 4.4,
            reviews: 203,
            badge: "Popular",
            discount: 40
          },
          {
            id: 6,
            name: "Mechanical Keyboard",
            price: 149.99,
            originalPrice: 219.99,
            image:
              "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
            rating: 4.7,
            reviews: 142,
            badge: "Featured",
            discount: 32
          }
        ];

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setFeaturedProducts(mockProducts);
        setLoading(false);
      } catch (err) {
        setError("Failed to load featured products");
        setLoading(false);
        console.error("Error fetching products:", err);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="home-page">
      <HeroSection />

      <main className="home-page__main">
        {/* Categories Section */}
        <section className="home-page__categories">
          <div className="container">
            <h2 className="section-title">Shop by Category</h2>
            <div className="categories-grid">
              <div className="category-card">
                <div className="category-card__icon">📱</div>
                <h3 className="category-card__title">Electronics</h3>
                <p className="category-card__count">2,500+ items</p>
              </div>
              <div className="category-card">
                <div className="category-card__icon">👕</div>
                <h3 className="category-card__title">Fashion</h3>
                <p className="category-card__count">5,200+ items</p>
              </div>
              <div className="category-card">
                <div className="category-card__icon">🏠</div>
                <h3 className="category-card__title">Home & Living</h3>
                <p className="category-card__count">1,800+ items</p>
              </div>
              <div className="category-card">
                <div className="category-card__icon">📚</div>
                <h3 className="category-card__title">Books</h3>
                <p className="category-card__count">3,400+ items</p>
              </div>
              <div className="category-card">
                <div className="category-card__icon">⚽</div>
                <h3 className="category-card__title">Sports</h3>
                <p className="category-card__count">1,200+ items</p>
              </div>
              <div className="category-card">
                <div className="category-card__icon">🎨</div>
                <h3 className="category-card__title">Art & Crafts</h3>
                <p className="category-card__count">900+ items</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <FeaturedProducts
          products={featuredProducts}
          loading={loading}
          error={error}
        />

        {/* Promotional Banner */}
        <section className="home-page__promo">
          <div className="container">
            <div className="promo-banner">
              <div className="promo-banner__content">
                <span className="promo-banner__tag">Limited Time</span>
                <h2 className="promo-banner__title">Summer Sale</h2>
                <p className="promo-banner__text">
                  Up to 50% off on selected items. Don't miss out!
                </p>
                <button className="promo-banner__btn">Shop Now</button>
              </div>
              <div className="promo-banner__image">
                <img
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800"
                  alt="Summer Sale"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="home-page__benefits">
          <div className="container">
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-card__icon">🚚</div>
                <h3 className="benefit-card__title">Free Shipping</h3>
                <p className="benefit-card__text">On orders over $50</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-card__icon">🔒</div>
                <h3 className="benefit-card__title">Secure Payment</h3>
                <p className="benefit-card__text">100% secure transactions</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-card__icon">↩️</div>
                <h3 className="benefit-card__title">Easy Returns</h3>
                <p className="benefit-card__text">30-day return policy</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-card__icon">💬</div>
                <h3 className="benefit-card__title">24/7 Support</h3>
                <p className="benefit-card__text">Dedicated customer service</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
