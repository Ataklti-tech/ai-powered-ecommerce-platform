// import React, { useState } from "react";
// import { ShoppingCart, User, Search, Sparkles } from "lucide-react";

// export default function Navbar() {
//   const [cart, setCart] = useState(0);

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
//       <div className="max-w-[1400px] mx-auto px-8 py-5">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-16">
//             <h1 className="text-2xl font-light tracking-tight text-gray-900">
//               Pick<span className="font-medium text-orange-500">Perfect</span>
//             </h1>

//             <div className="hidden md:block">
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Search products"
//                   className="w-[420px] pl-4 pr-12 py-2.5 bg-gray-50 border-none rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
//                 />
//                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//               </div>
//             </div>
//           </div>

//           <div className="flex items-center space-x-8">
//             {/* <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1.5">
//               <Sparkles className="w-4 h-4" />
//               <span>AI Picks</span>
//             </button> */}

//             <button className="relative text-gray-600 hover:text-gray-900 transition-colors">
//               <ShoppingCart className="w-5 h-5" />
//               {cart > 0 && (
//                 <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
//                   {cart}
//                 </span>
//               )}
//             </button>

//             <button className="text-gray-600 hover:text-gray-900 transition-colors">
//               <User className="w-5 h-5" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import React, { useState } from "react";
import { ShoppingCart, User, Search, Sparkles, Heart } from "lucide-react";

export default function Navbar() {
  const [cart, setCart] = useState(0);
  const [wishlist, setWishlist] = useState(5);

  const navLinks = ["Home", "Products", "Categories", "About"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-light tracking-tight text-gray-900">
              Pick<span className="font-medium text-black">Perfect</span>
            </h1>
          </div>

          {/* Center: Nav Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="px-5 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all font-normal"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Right: Search and Actions */}
          <div className="flex items-center space-x-6">
            {/* Search Bar */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products"
                  className="w-[280px] pl-4 pr-10 py-2 bg-gray-50 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* AI Picks Button */}
            {/* <button className="hidden md:flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
              <Sparkles className="w-4 h-4" />
              <span>AI Picks</span>
            </button> */}

            {/* Wishlist Icon */}
            <button className="relative text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
              <Heart className="w-5 h-5" />
              {wishlist > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {wishlist}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button className="relative text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
              <ShoppingCart className="w-5 h-5" />
              {cart > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {cart}
                </span>
              )}
            </button>

            {/* User Icon */}
            <button className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ═══════════════════════════════════════════════════════════
// src/components/layout/Navbar.jsx
// E-commerce navbar with cart, auth status, and categories
// ═══════════════════════════════════════════════════════════

// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import {
//   ShoppingCart,
//   User,
//   Search,
//   Menu,
//   X,
//   Heart,
//   LogOut,
//   Package,
//   Settings,
// } from "lucide-react";
// // import { logout } from "../../store/slices/authSlice";

// const Navbar = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [userMenuOpen, setUserMenuOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   const { isAuthenticated, user } = useSelector((state) => state.auth);
//   const { items } = useSelector((state) => state.cart);

//   const cartItemsCount = items.reduce(
//     (total, item) => total + item.quantity,
//     0,
//   );

//   // const handleLogout = () => {
//   //   dispatch(logout());
//   //   setUserMenuOpen(false);
//   //   navigate("/");
//   // };

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (searchQuery.trim()) {
//       navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
//       setSearchQuery("");
//     }
//   };

//   return (
//     <nav className="bg-white shadow-sm sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4">
//         {/* Top Bar */}
//         <div className="flex items-center justify-between h-16">
//           {/* Logo */}
//           <Link to="/" className="flex items-center space-x-2">
//             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
//               <ShoppingCart className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-xl font-bold text-gray-900">YourStore</span>
//           </Link>

//           {/* Search Bar (Desktop) */}
//           <form
//             onSubmit={handleSearch}
//             className="hidden md:flex flex-1 max-w-xl mx-8"
//           >
//             <div className="relative w-full">
//               <input
//                 type="text"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 placeholder="Search products..."
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
//               />
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             </div>
//           </form>

//           {/* Right Side Icons */}
//           <div className="flex items-center space-x-4">
//             {/* Wishlist (only if authenticated) */}
//             {isAuthenticated && (
//               <Link
//                 to="/wishlist"
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
//                 title="Wishlist"
//               >
//                 <Heart className="w-6 h-6 text-gray-700" />
//               </Link>
//             )}

//             {/* Cart */}
//             <Link
//               to="/cart"
//               className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
//               title="Shopping Cart"
//             >
//               <ShoppingCart className="w-6 h-6 text-gray-700" />
//               {cartItemsCount > 0 && (
//                 <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
//                   {cartItemsCount}
//                 </span>
//               )}
//             </Link>

//             {/* User Menu */}
//             {isAuthenticated ? (
//               <div className="relative">
//                 <button
//                   onClick={() => setUserMenuOpen(!userMenuOpen)}
//                   className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
//                     <span className="text-white text-sm font-semibold">
//                       {user?.name?.charAt(0)?.toUpperCase() || "U"}
//                     </span>
//                   </div>
//                 </button>

//                 {/* User Dropdown */}
//                 {userMenuOpen && (
//                   <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
//                     <div className="px-4 py-3 border-b border-gray-200">
//                       <p className="text-sm font-semibold text-gray-900">
//                         {user?.name}
//                       </p>
//                       <p className="text-xs text-gray-500">{user?.email}</p>
//                     </div>

//                     <Link
//                       to="/profile"
//                       onClick={() => setUserMenuOpen(false)}
//                       className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
//                     >
//                       <User className="w-4 h-4 text-gray-600" />
//                       <span className="text-sm text-gray-700">My Profile</span>
//                     </Link>

//                     <Link
//                       to="/orders"
//                       onClick={() => setUserMenuOpen(false)}
//                       className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
//                     >
//                       <Package className="w-4 h-4 text-gray-600" />
//                       <span className="text-sm text-gray-700">My Orders</span>
//                     </Link>

//                     <Link
//                       to="/wishlist"
//                       onClick={() => setUserMenuOpen(false)}
//                       className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
//                     >
//                       <Heart className="w-4 h-4 text-gray-600" />
//                       <span className="text-sm text-gray-700">Wishlist</span>
//                     </Link>

//                     {user?.role === "admin" && (
//                       <Link
//                         to="/admin"
//                         onClick={() => setUserMenuOpen(false)}
//                         className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors border-t border-gray-200"
//                       >
//                         <Settings className="w-4 h-4 text-gray-600" />
//                         <span className="text-sm text-gray-700">
//                           Admin Dashboard
//                         </span>
//                       </Link>
//                     )}

//                     <button
//                       onClick={handleLogout}
//                       className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors text-left border-t border-gray-200"
//                     >
//                       <LogOut className="w-4 h-4 text-red-600" />
//                       <span className="text-sm text-red-600">Logout</span>
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="hidden md:flex items-center space-x-2">
//                 <Link
//                   to="/login"
//                   className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
//                 >
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Register
//                 </Link>
//               </div>
//             )}

//             {/* Mobile Menu Button */}
//             <button
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//               className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
//             >
//               {mobileMenuOpen ? (
//                 <X className="w-6 h-6 text-gray-700" />
//               ) : (
//                 <Menu className="w-6 h-6 text-gray-700" />
//               )}
//             </button>
//           </div>
//         </div>

//         {/* Categories Bar (Desktop) */}
//         <div className="hidden md:flex items-center space-x-6 py-3 border-t border-gray-200">
//           <Link
//             to="/products"
//             className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
//           >
//             All Products
//           </Link>
//           <Link
//             to="/category/electronics"
//             className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
//           >
//             Electronics
//           </Link>
//           <Link
//             to="/category/fashion"
//             className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
//           >
//             Fashion
//           </Link>
//           <Link
//             to="/category/home"
//             className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
//           >
//             Home & Garden
//           </Link>
//           <Link
//             to="/category/sports"
//             className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
//           >
//             Sports
//           </Link>
//           <Link
//             to="/category/books"
//             className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
//           >
//             Books
//           </Link>
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       {mobileMenuOpen && (
//         <div className="md:hidden border-t border-gray-200 bg-white">
//           {/* Search (Mobile) */}
//           <form
//             onSubmit={handleSearch}
//             className="p-4 border-b border-gray-200"
//           >
//             <div className="relative">
//               <input
//                 type="text"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 placeholder="Search products..."
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
//               />
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             </div>
//           </form>

//           {/* Categories (Mobile) */}
//           <div className="px-4 py-2 space-y-2">
//             <Link
//               to="/products"
//               onClick={() => setMobileMenuOpen(false)}
//               className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
//             >
//               All Products
//             </Link>
//             <Link
//               to="/category/electronics"
//               onClick={() => setMobileMenuOpen(false)}
//               className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
//             >
//               Electronics
//             </Link>
//             <Link
//               to="/category/fashion"
//               onClick={() => setMobileMenuOpen(false)}
//               className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
//             >
//               Fashion
//             </Link>
//             <Link
//               to="/category/home"
//               onClick={() => setMobileMenuOpen(false)}
//               className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
//             >
//               Home & Garden
//             </Link>
//           </div>

//           {/* Auth Links (Mobile) */}
//           {!isAuthenticated && (
//             <div className="px-4 py-4 border-t border-gray-200 space-y-2">
//               <Link
//                 to="/login"
//                 onClick={() => setMobileMenuOpen(false)}
//                 className="block w-full py-2 text-center text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
//               >
//                 Login
//               </Link>
//               <Link
//                 to="/register"
//                 onClick={() => setMobileMenuOpen(false)}
//                 className="block w-full py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
//               >
//                 Register
//               </Link>
//             </div>
//           )}
//         </div>
//       )}
//     </nav>
//   );
// };

// export default Navbar;
