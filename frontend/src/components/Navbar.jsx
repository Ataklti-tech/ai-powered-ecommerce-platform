import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  Heart,
  LogOut,
  Package,
  Settings,
  Globe,
  Sparkles,
} from 'lucide-react';
import { logoutUser } from '../features/auth/authSlice';
import { fetchCart, clearCart } from '../features/cart/cartSlice';
import {
  fetchWishlist,
  clearWishlist,
} from '../features/wishlist/wishlistSlice';

// Currency conversion rates (you can fetch these from an API)
const EXCHANGE_RATES = {
  USD: 1,
  UGX: 3650,
  KES: 150,
  EUR: 0.92,
  GBP: 0.79,
};

// Helper function to convert price based on currency
const convertPrice = (price, currency) => {
  const rate = EXCHANGE_RATES[currency] || 1;
  const converted = (price || 0) * rate;
  return currency === 'UGX'
    ? Math.round(converted).toLocaleString()
    : converted.toFixed(2);
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  UGX: 'USh',
  KES: 'KSh',
  EUR: '€',
  GBP: '£',
};

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currency, setCurrency] = useState('UGX');
  const [categories, setCategories] = useState([]);

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items, totalItems } = useSelector((state) => state.cart);

  // Fetch categories for navigation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/v1/categories');
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setCategories(list.slice(0, 6)); // Limit to 6 categories
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch cart and wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated, dispatch]);

  // Determine currency based on user's address
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const defaultAddress =
        user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
      const country = (defaultAddress.country || '').toLowerCase();

      if (country === 'uganda') {
        setCurrency('UGX');
      } else if (country === 'kenya') {
        setCurrency('KES');
      } else if (country === 'uk' || country === 'united kingdom') {
        setCurrency('GBP');
      } else if (
        country === 'germany' ||
        country === 'france' ||
        country === 'spain' ||
        country === 'italy'
      ) {
        setCurrency('EUR');
      } else {
        setCurrency('UGX');
      }
    }
  }, [user]);

  const cartItemsCount =
    totalItems || items.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(clearCart());
    dispatch(clearWishlist());
    setUserMenuOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-light tracking-tight text-gray-900">
              Agel<span className="font-medium text-orange-500">gil</span>
            </h1>
          </Link>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-8"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </form>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Currency Display */}
            <div
              className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-lg"
              title={`Currency: ${currency}`}
            >
              <Globe className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {currency}
              </span>
            </div>

            {/* Wishlist (only if authenticated) */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                title="Wishlist"
              >
                <Heart className="w-6 h-6 text-gray-700" />
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.firstName?.charAt(0)?.toUpperCase() ||
                        user?.email?.charAt(0)?.toUpperCase() ||
                        'U'}
                    </span>
                  </div>
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">My Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Package className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">My Orders</span>
                    </Link>

                    <Link
                      to="/recommendations"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-700">For You</span>
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Wishlist</span>
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors border-t border-gray-200"
                      >
                        <Settings className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          Admin Dashboard
                        </span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors text-left border-t border-gray-200"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Categories Bar (Desktop) */}
        <div className="hidden md:flex items-center space-x-6 py-3 border-t border-gray-200">
          <Link
            to="/products"
            className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
          >
            All Products
          </Link>
          {categories.map((category) => (
            <Link
              key={category._id || category.id}
              to={`/products?category=${encodeURIComponent(category.name)}`}
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          {/* Search (Mobile) */}
          <form
            onSubmit={handleSearch}
            className="p-4 border-b border-gray-200"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </form>

          {/* Categories (Mobile) */}
          <div className="px-4 py-2 space-y-2">
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-orange-600"
            >
              All Products
            </Link>
            {categories.map((category) => (
              <Link
                key={category._id || category.id}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700 hover:text-orange-600"
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Auth Links (Mobile) */}
          {!isAuthenticated && (
            <div className="px-4 py-4 border-t border-gray-200 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
