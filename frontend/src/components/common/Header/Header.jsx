import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
} from "lucide-react";
import "../../../Header.css";

const Header = ({
  cartItemCount = 0,
  isAuthenticated = false,
  user = null,
  onLogout,
  categories = [],
  onSearch, // Optional callback for search
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Safely use navigate only if within Router context
  let navigate;
  let location;
  try {
    navigate = useNavigate();
    location = useLocation();
  } catch (error) {
    // If not in Router context, navigation will use window.location
    navigate = null;
    location = null;
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Use callback if provided
      if (onSearch) {
        onSearch(searchQuery);
      } else if (navigate) {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      } else {
        // Fallback to window location if not in Router context
        window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
      }
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isSearchOpen) setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    setIsUserMenuOpen(false);
    if (navigate) {
      navigate("/");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <header className={`header ${isScrolled ? "header--scrolled" : ""}`}>
      <div className="header__container">
        {/* Logo */}
        <div className="header__logo">
          <Link to="/" className="header__logo-link">
            <ShoppingCart className="header__logo-icon" />
            <span className="header__logo-text">PickPerfect</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="header__nav">
          <Link to="/" className="header__nav-link">
            Home
          </Link>
          <Link to="/products" className="header__nav-link">
            Products
          </Link>
          <div className="header__nav-dropdown">
            <button className="header__nav-link">Categories</button>
            {categories.length > 0 && (
              <div className="header__dropdown-menu">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className="header__dropdown-item"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/deals" className="header__nav-link">
            Deals
          </Link>
          <Link to="/about" className="header__nav-link">
            About
          </Link>
        </nav>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="header__search">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header__search-input"
          />
          <button type="submit" className="header__search-btn">
            <Search size={20} />
          </button>
        </form>

        {/* Right Actions */}
        <div className="header__actions">
          {/* Mobile Search Toggle */}
          <button
            className="header__icon-btn header__icon-btn--mobile"
            onClick={toggleSearch}
            aria-label="Toggle search"
          >
            <Search size={22} />
          </button>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="header__icon-btn"
            aria-label="Wishlist"
          >
            <Heart size={22} />
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="header__icon-btn header__cart"
            aria-label="Shopping cart"
          >
            <ShoppingCart size={22} />
            {cartItemCount > 0 && (
              <span className="header__badge">{cartItemCount}</span>
            )}
          </Link>

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="header__user-menu">
              <button
                className="header__icon-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="User menu"
              >
                <User size={22} />
              </button>
              {isUserMenuOpen && (
                <div className="header__user-dropdown">
                  <div className="header__user-info">
                    <p className="header__user-name">{user?.name || "User"}</p>
                    <p className="header__user-email">{user?.email}</p>
                  </div>
                  <div className="header__user-divider" />
                  <Link to="/profile" className="header__user-item">
                    <User size={18} />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/orders" className="header__user-item">
                    <Package size={18} />
                    <span>Orders</span>
                  </Link>
                  <Link to="/settings" className="header__user-item">
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                  <div className="header__user-divider" />
                  <button onClick={handleLogout} className="header__user-item">
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="header__login-btn">
              Login
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="header__menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="header__mobile-search">
          <form onSubmit={handleSearch} className="header__mobile-search-form">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header__mobile-search-input"
              autoFocus
            />
            <button type="submit" className="header__mobile-search-btn">
              <Search size={20} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="header__mobile-nav">
          <Link to="/" className="header__mobile-link">
            Home
          </Link>
          <Link to="/products" className="header__mobile-link">
            Products
          </Link>
          <Link to="/deals" className="header__mobile-link">
            Deals
          </Link>
          <Link to="/about" className="header__mobile-link">
            About
          </Link>
          {categories.length > 0 && (
            <>
              <div className="header__mobile-divider" />
              <p className="header__mobile-title">Categories</p>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="header__mobile-link header__mobile-link--sub"
                >
                  {category.name}
                </Link>
              ))}
            </>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;

// import React, { useState } from 'react';
// import { Menu, X } from 'lucide-react';

// const Header = () => {
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   const toggleMobileMenu = () => {
//     setIsMobileMenuOpen(!isMobileMenuOpen);
//   };

//   return (
//     <nav className="bg-[#1a1a1a] text-white">
//       <div className="max-w-7xl mx-auto px-6 lg:px-8">
//         <div className="flex items-center justify-between h-20">
//           {/* Logo */}
//           <div className="flex-shrink-0">
//             <a href="/" className="text-3xl font-light tracking-wide">
//               ease
//             </a>
//           </div>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center space-x-12">
//             <a
//               href="/products"
//               className="text-base font-normal hover:text-gray-300 transition-colors duration-200"
//             >
//               Products
//             </a>
//             <a
//               href="/about"
//               className="text-base font-normal hover:text-gray-300 transition-colors duration-200"
//             >
//               About
//             </a>
//             <a
//               href="/blog"
//               className="text-base font-normal hover:text-gray-300 transition-colors duration-200"
//             >
//               Blog
//             </a>
//             <a
//               href="/contacts"
//               className="text-base font-normal hover:text-gray-300 transition-colors duration-200"
//             >
//               Contacts
//             </a>
//           </div>

//           {/* Desktop Auth Buttons */}
//           <div className="hidden md:flex items-center space-x-4">
//             <a
//               href="/signup"
//               className="px-6 py-2.5 bg-white text-black rounded-md font-medium hover:bg-gray-100 transition-colors duration-200"
//             >
//               SIGN UP
//             </a>
//             <a
//               href="/login"
//               className="px-6 py-2.5 border border-white text-white rounded-md font-medium hover:bg-white hover:text-black transition-all duration-200"
//             >
//               LOGIN
//             </a>
//           </div>

//           {/* Mobile Menu Button */}
//           <div className="md:hidden">
//             <button
//               onClick={toggleMobileMenu}
//               className="text-white hover:text-gray-300 focus:outline-none"
//               aria-label="Toggle menu"
//             >
//               {isMobileMenuOpen ? (
//                 <X size={28} />
//               ) : (
//                 <Menu size={28} />
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       {isMobileMenuOpen && (
//         <div className="md:hidden bg-[#252525] border-t border-gray-700">
//           <div className="px-6 py-4 space-y-4">
//             <a
//               href="/products"
//               className="block text-base font-normal hover:text-gray-300 transition-colors duration-200 py-2"
//               onClick={() => setIsMobileMenuOpen(false)}
//             >
//               Products
//             </a>
//             <a
//               href="/about"
//               className="block text-base font-normal hover:text-gray-300 transition-colors duration-200 py-2"
//               onClick={() => setIsMobileMenuOpen(false)}
//             >
//               About
//             </a>
//             <a
//               href="/blog"
//               className="block text-base font-normal hover:text-gray-300 transition-colors duration-200 py-2"
//               onClick={() => setIsMobileMenuOpen(false)}
//             >
//               Blog
//             </a>
//             <a
//               href="/contacts"
//               className="block text-base font-normal hover:text-gray-300 transition-colors duration-200 py-2"
//               onClick={() => setIsMobileMenuOpen(false)}
//             >
//               Contacts
//             </a>

//             <div className="pt-4 space-y-3 border-t border-gray-700">
//               <a
//                 href="/signup"
//                 className="block w-full px-6 py-2.5 bg-white text-black text-center rounded-md font-medium hover:bg-gray-100 transition-colors duration-200"
//                 onClick={() => setIsMobileMenuOpen(false)}
//               >
//                 SIGN UP
//               </a>
//               <a
//                 href="/login"
//                 className="block w-full px-6 py-2.5 border border-white text-white text-center rounded-md font-medium hover:bg-white hover:text-black transition-all duration-200"
//                 onClick={() => setIsMobileMenuOpen(false)}
//               >
//                 LOGIN
//               </a>
//             </div>
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// };

// export default Header;
