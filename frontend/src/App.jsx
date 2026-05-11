import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Categories from './components/Categories';
import AIRecommendations from './components/AIRecommendations';
import Features from './components/Features';
import TrendingProducts from './components/TrendingProducts';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import Login from './components/auth/LoginForm/LoginForm';
import RegisterForm from './components/auth/RegisterForm/RegisterForm';
import ProductCard from './components/ProductCard';
import Profile from './pages/User/Profile';
import Orders from './pages/User/Orders';
import Checkout from './pages/Checkout/Checkout';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
} from './features/cart/cartSlice';
import {
  removeFromWishlist,
  removeFromWishlistAsync,
} from './features/wishlist/wishlistSlice';
import { Plus, Minus, Star, ArrowLeft, ShoppingCart } from 'lucide-react';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminProductForm from './pages/Admin/AdminProductForm';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminCategories from './pages/Admin/AdminCategories';
import HelpCenter from './pages/Support/HelpCenter';
import Shipping from './pages/Support/Shipping';
import Returns from './pages/Support/Returns';
import Contact from './pages/Support/Contact';
import Recommendations from './pages/User/Recommendations';

// Currency conversion rates
const EXCHANGE_RATES = {
  USD: 1,
  UGX: 3650,
  KES: 150,
  EUR: 0.92,
  GBP: 0.79,
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  UGX: 'USh',
  KES: 'KSh',
  EUR: '€',
  GBP: '£',
};

// Helper to get currency based on user address
const getCurrencyFromUser = (user) => {
  if (user && user.addresses && user.addresses.length > 0) {
    const defaultAddress =
      user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
    const country = (defaultAddress.country || '').toLowerCase();

    if (country === 'uganda') return 'UGX';
    if (country === 'kenya') return 'KES';
    if (country === 'uk' || country === 'united kingdom') return 'GBP';
    if (['germany', 'france', 'spain', 'italy'].includes(country)) return 'EUR';
  }
  return 'UGX';
};

// Helper to format price with currency
const formatPrice = (price, currency = 'UGX') => {
  const rate = EXCHANGE_RATES[currency] || 1;
  const symbol = CURRENCY_SYMBOLS[currency] || 'USh';
  const converted = (price || 0) * rate;
  return currency === 'UGX'
    ? `${symbol} ${Math.round(converted).toLocaleString()}`
    : `${symbol}${converted.toFixed(2)}`;
};

// Home Page Component
function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Categories />
      <Features />
      <TrendingProducts />
      <AIRecommendations />
      <CTASection />
    </>
  );
}

// Products Page Component
function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category') || '';

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, categoryQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/v1/products';

      // Add search parameter
      if (searchQuery) {
        url += `/search?keyword=${encodeURIComponent(searchQuery)}`;
      }
      // Add category parameter
      if (categoryQuery) {
        const catUrl = `http://localhost:5000/api/v1/products/category-name/${encodeURIComponent(categoryQuery)}`;
        const res = await axios.get(catUrl);
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : (data.products ?? data.data ?? []);
        setProducts(list);
        setLoading(false);
        return;
      }

      const res = await axios.get(url);
      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : (data.products ?? data.data ?? []);
      setProducts(list);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 px-8 text-center">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  const pageTitle = searchQuery
    ? `Search Results for "${searchQuery}"`
    : categoryQuery
      ? `${categoryQuery.charAt(0).toUpperCase() + categoryQuery.slice(1)}`
      : 'All Products';

  return (
    <div className="pt-32 pb-24 px-8 bg-gray-50">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-8">{pageTitle}</h2>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found.</p>
            <Link
              to="/products"
              className="text-orange-500 hover:underline mt-2 inline-block"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                showMatch={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Product Details Page Component
function ProductDetailsPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/v1/products/${productId}`
      );
      setProduct(res.data.data || res.data);
    } catch (err) {
      console.log(err);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: product._id || product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url || product.image,
        quantity: quantity,
      })
    );
    toast.success('Added to cart!');
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 px-8 text-center">
        <div className="text-gray-500">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const productPrice = product.price || 0;
  const productImage = product.images?.[0]?.url || product.image;
  const ratingValue = product.rating?.average || 0;
  const reviewsCount = product.rating?.count || 0;

  return (
    <div className="pt-32 pb-24 px-8 bg-gray-50">
      <div className="max-w-[1400px] mx-auto">
        <Link
          to="/products"
          className="inline-flex items-center text-gray-600 hover:text-orange-500 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="grid grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              {productImage ? (
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                  ✨
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="ml-1 font-semibold">
                    {ratingValue.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-400">({reviewsCount} reviews)</span>
              </div>

              <p className="text-3xl font-bold text-orange-500 mb-6">
                USh {Math.round(productPrice * 3650).toLocaleString()}
              </p>

              {product.description && (
                <p className="text-gray-600 mb-6">{product.description}</p>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-gray-700 font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart — USh{' '}
                {Math.round(productPrice * quantity * 3650).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart Page Component
function CartPage() {
  const { items, totalPrice: dbTotal } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Calculate total from items (handles both local and DB cart)
  const total = items.reduce((sum, item) => {
    const itemPrice = item.product?.price || item.price || 0;
    const itemQty = item.quantity || 1;
    return sum + itemPrice * itemQty;
  }, 0);

  const displayTotal = dbTotal > 0 ? dbTotal : total;

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleQuantityChange = (id, change) => {
    const item = items.find((i) => i.id === id || i.product?._id === id);
    if (item) {
      const newQty = (item.quantity || 1) + change;
      if (newQty > 0) {
        dispatch(updateQuantity({ id, quantity: newQty }));
      }
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 px-8">
        <div className="max-w-[1400px] mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your Cart is Empty
          </h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/products"
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-8">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h2>

        <div className="grid grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="col-span-2 space-y-4">
            {items.map((item) => {
              const itemId = item.id || item.product?._id;
              const itemName = item.name || item.product?.name || 'Product';
              const itemPrice = item.product?.price || item.price || 0;
              const itemImage =
                item.image ||
                item.product?.image ||
                item.product?.images?.[0]?.url;
              const itemQty = item.quantity || 1;

              return (
                <div
                  key={itemId}
                  className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{itemName}</h3>
                    <p className="text-gray-600">
                      USh {Math.round(itemPrice * 3650).toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(itemId, -1)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-medium text-gray-900">
                      {itemQty}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(itemId, 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="w-20 text-right font-semibold text-gray-900">
                    USh{' '}
                    {Math.round(itemPrice * itemQty * 3650).toLocaleString()}
                  </div>

                  <button
                    onClick={() => handleRemove(itemId)}
                    className="text-red-500 hover:text-red-600 font-medium"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Order Summary
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>
                  USh {Math.round(displayTotal * 3650).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>
                  USh {Math.round(displayTotal * 3650).toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wishlist Page Component
function WishlistPage() {
  const { items } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();

  const { token } = useSelector((state) => state.auth);

  const handleRemove = (productId) => {
    if (token) {
      dispatch(removeFromWishlistAsync(productId));
    } else {
      dispatch(removeFromWishlist(productId));
    }
  };

  const handleAddToCart = (product) => {
    dispatch(
      addToCart({
        id: product.id || product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url || product.image,
      })
    );
    toast.success('Added to cart!');
  };

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 px-8">
        <div className="max-w-[1400px] mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your Wishlist is Empty
          </h2>
          <p className="text-gray-600 mb-8">
            Save items you love to your wishlist.
          </p>
          <Link
            to="/products"
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-8 bg-gray-50">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h2>
        <div className="grid grid-cols-4 gap-6">
          {items.map((item) => {
            const product = item.product || item;
            const itemId = product._id || product.id || item.id;
            const itemName = product.name || item.name;
            const itemPrice = product.price || item.price || 0;
            const itemImage =
              product.images?.[0]?.url || product.image || item.image;

            return (
              <div
                key={itemId}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="h-48 bg-gray-100">
                  {itemImage ? (
                    <img
                      src={itemImage}
                      alt={itemName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {itemName}
                  </h3>
                  <p className="text-orange-500 font-bold mb-4">
                    USh {Math.round((itemPrice || 0) * 3650).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(itemId)}
                      className="py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const toasterOptions = {
  duration: 3000,
  style: {
    background: '#1e2749',
    color: '#fff',
    borderRadius: '12px',
    padding: '16px',
  },
  success: { iconTheme: { primary: '#3fb950', secondary: '#fff' } },
  error: { iconTheme: { primary: '#f85149', secondary: '#fff' } },
};

// Main App Component
export default function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // ── Admin section: own layout, no Navbar/Footer ───────────────────────────
  if (isAdminPath) {
    return (
      <>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="categories" element={<AdminCategories />} />
          </Route>
        </Routes>
        <Toaster position="top-right" toastOptions={toasterOptions} />
      </>
    );
  }

  // ── Storefront: Navbar + Footer ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:productId" element={<ProductDetailsPage />} />
          <Route path="/category/:category" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="top-right" toastOptions={toasterOptions} />
    </div>
  );
}
