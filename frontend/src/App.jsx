// // // import React from "react";
// // // // import Navbar from "././components/common/Header/Header2";
// // // import Navbar from "./components/Navbar";
// // // import { BrowserRouter as Router } from "react-router-dom";
// // // // import FeaturedProducts from "./pages/Home/FeaturedProducts";

// // // const App = () => {
// // //   return (
// // //     <Router>
// // //       {" "}
// // //       {/* ← WRAP EVERYTHING IN ROUTER */}
// // //       <Navbar />
// // //       {/* <FeaturedProducts /> */}
// // //       {/* <Header/> */}
// // //       {/* Your routes and other components */}
// // //     </Router>
// // //   );
// // // };

// // // export default App;

// // // import React, { useState, useEffect } from "react";
// // // import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// // // import Header from "./Header";
// // // import HomePage from "./pages/Home/HomePage";
// // // import "./App.css";

// // // function App() {
// // //   // Cart state
// // //   const [cartCount, setCartCount] = useState(0);

// // //   // Authentication state
// // //   const [isAuthenticated, setIsAuthenticated] = useState(false);
// // //   const [user, setUser] = useState(null);

// // //   // Categories for header
// // //   const categories = [
// // //     { id: 1, name: "Electronics", slug: "electronics" },
// // //     { id: 2, name: "Fashion", slug: "fashion" },
// // //     { id: 3, name: "Home & Living", slug: "home-living" },
// // //     { id: 4, name: "Books", slug: "books" },
// // //     { id: 5, name: "Sports", slug: "sports" },
// // //     { id: 6, name: "Art & Crafts", slug: "art-crafts" }
// // //   ];

// // //   // Load user data on mount (e.g., from localStorage)
// // //   useEffect(() => {
// // //     // Check if user is logged in
// // //     const savedUser = localStorage.getItem("user");
// // //     const savedAuth = localStorage.getItem("isAuthenticated");

// // //     if (savedUser && savedAuth === "true") {
// // //       setUser(JSON.parse(savedUser));
// // //       setIsAuthenticated(true);
// // //     }

// // //     // Load cart count
// // //     const savedCartCount = localStorage.getItem("cartCount");
// // //     if (savedCartCount) {
// // //       setCartCount(parseInt(savedCartCount, 10));
// // //     }
// // //   }, []);

// // //   // Handle logout
// // //   const handleLogout = () => {
// // //     setIsAuthenticated(false);
// // //     setUser(null);
// // //     localStorage.removeItem("user");
// // //     localStorage.removeItem("isAuthenticated");
// // //     localStorage.setItem("cartCount", "0");
// // //     setCartCount(0);
// // //   };

// // //   // Handle search
// // //   const handleSearch = (query) => {
// // //     console.log("Searching for:", query);
// // //     // You can add custom search logic here
// // //   };

// // //   return (
// // //     <Router>
// // //       <div className="app">
// // //         {/* Header Component */}
// // //         <Header
// // //           cartItemCount={cartCount}
// // //           isAuthenticated={isAuthenticated}
// // //           user={user}
// // //           onLogout={handleLogout}
// // //           categories={categories}
// // //           onSearch={handleSearch}
// // //         />

// // //         {/* Main Content */}
// // //         <main className="app__content">
// // //           <Routes>
// // //             {/* Home Page */}
// // //             <Route path="/" element={<HomePage />} />

// // //             {/* Other Routes - Add these as you create them */}
// // //             <Route
// // //               path="/products"
// // //               element={<div className="page-placeholder">Products Page</div>}
// // //             />
// // //             <Route
// // //               path="/category/:slug"
// // //               element={<div className="page-placeholder">Category Page</div>}
// // //             />
// // //             <Route
// // //               path="/product/:id"
// // //               element={
// // //                 <div className="page-placeholder">Product Detail Page</div>
// // //               }
// // //             />
// // //             <Route
// // //               path="/cart"
// // //               element={<div className="page-placeholder">Cart Page</div>}
// // //             />
// // //             <Route
// // //               path="/wishlist"
// // //               element={<div className="page-placeholder">Wishlist Page</div>}
// // //             />
// // //             <Route
// // //               path="/deals"
// // //               element={<div className="page-placeholder">Deals Page</div>}
// // //             />
// // //             <Route
// // //               path="/about"
// // //               element={<div className="page-placeholder">About Page</div>}
// // //             />
// // //             <Route
// // //               path="/login"
// // //               element={<div className="page-placeholder">Login Page</div>}
// // //             />
// // //             <Route
// // //               path="/register"
// // //               element={<div className="page-placeholder">Register Page</div>}
// // //             />
// // //             <Route
// // //               path="/profile"
// // //               element={<div className="page-placeholder">Profile Page</div>}
// // //             />
// // //             <Route
// // //               path="/orders"
// // //               element={<div className="page-placeholder">Orders Page</div>}
// // //             />
// // //             <Route
// // //               path="/settings"
// // //               element={<div className="page-placeholder">Settings Page</div>}
// // //             />
// // //             <Route
// // //               path="/search"
// // //               element={
// // //                 <div className="page-placeholder">Search Results Page</div>
// // //               }
// // //             />

// // //             {/* 404 Not Found */}
// // //             <Route
// // //               path="*"
// // //               element={
// // //                 <div className="page-placeholder">404 - Page Not Found</div>
// // //               }
// // //             />
// // //           </Routes>
// // //         </main>

// // //         {/* Footer Component - Add this later */}
// // //         <footer className="app__footer">
// // //           <div className="footer__content">
// // //             <p>&copy; 2025 ShopHub. All rights reserved.</p>
// // //           </div>
// // //         </footer>
// // //       </div>
// // //     </Router>
// // //   );
// // // }

// // // export default App;
// // import React from "react";
// // import Navbar from "./components/Navbar";
// // import Hero from "./components/Hero";
// // import Stats from "./components/Stats";
// // import Categories from "./components/Categories";
// // import AIRecommendations from "./components/AIRecommendations";
// // import Features from "./components/Features";
// // import TrendingProducts from "./components/TrendingProducts";
// // import CTASection from "./components/CTASection";
// // import Footer from "./components/Footer";
// // import Login from "./components/auth/LoginForm/LoginForm";
// // import RegisterForm from "./components/auth/RegisterForm/RegisterForm";

// // export default function App() {
// //   return (
// //     <div className="min-h-screen bg-white">
// //       {/* <Navbar />
// //       <Hero />
// //       <Stats />
// //       <Categories />
// //       <AIRecommendations />
// //       <Features />
// //       <TrendingProducts />
// //       <CTASection />
// //       <Footer /> */}
// //       {/* <Login /> */}
// //       <RegisterForm />

// //       <style jsx>{`
// //         @keyframes float {
// //           0%,
// //           100% {
// //             transform: translateY(0);
// //           }
// //           50% {
// //             transform: translateY(-8px);
// //           }
// //         }

// //         .animate-float {
// //           animation: float 2s ease-in-out infinite;
// //         }
// //       `}</style>
// //     </div>
// //   );
// // }

// // //////////////////////////////////////////////////////////////////////////////
// // ═══════════════════════════════════════════════════════════
// // App.jsx
// // Main application with public/protected routing
// // Users can browse without login, but need auth for checkout/orders
// // ═══════════════════════════════════════════════════════════

// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { Provider } from 'react-redux';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { Toaster } from 'react-hot-toast';
// // import { store } from "./store";

// // ─────────────────────────────────────────────────────────
// // Layout Components
// // ─────────────────────────────────────────────────────────
// import Navbar from './components/layout/Navbar';
// import Footer from './components/layout/Footer';

// // ─────────────────────────────────────────────────────────
// // PUBLIC PAGES (No Authentication Required)
// // Anyone can access these pages
// // ─────────────────────────────────────────────────────────
// import HomePage from './pages/public/HomePage';
// import ProductsPage from './pages/public/ProductsPage';
// import ProductDetailPage from './pages/public/ProductDetailPage';
// import CategoryPage from './pages/public/CategoryPage';
// import CartPage from './pages/public/CartPage';
// import AboutPage from './pages/public/AboutPage';
// import ContactPage from './pages/public/ContactPage';
// import SearchPage from './pages/public/SearchPage';

// // ─────────────────────────────────────────────────────────
// // AUTHENTICATION PAGES (Guest Only)
// // Redirect to home if already logged in
// // ─────────────────────────────────────────────────────────
// import LoginPage from './pages/auth/LoginPage';
// import RegisterPage from './pages/auth/RegisterPage';
// import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
// import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// // ─────────────────────────────────────────────────────────
// // PROTECTED PAGES (Authentication Required)
// // Users must be logged in to access these
// // ─────────────────────────────────────────────────────────
// import CheckoutPage from './pages/protected/CheckoutPage';
// import OrdersPage from './pages/protected/OrdersPage';
// import OrderDetailPage from './pages/protected/OrderDetailPage';
// import ProfilePage from './pages/protected/ProfilePage';
// import WishlistPage from './pages/protected/WishlistPage';
// import AddressesPage from './pages/protected/AddressesPage';
// import AccountSettingsPage from './pages/protected/AccountSettingsPage';

// // ─────────────────────────────────────────────────────────
// // ADMIN PAGES (Admin Only)
// // Requires admin role
// // ─────────────────────────────────────────────────────────
// import AdminLayout from './pages/admin/AdminLayout';
// import AdminDashboard from './pages/admin/AdminDashboard';
// import AdminProducts from './pages/admin/AdminProducts';
// import AdminOrders from './pages/admin/AdminOrders';
// import AdminCustomers from './pages/admin/AdminCustomers';
// import AdminCategories from './pages/admin/AdminCategories';
// import AdminSettings from './pages/admin/AdminSettings';

// // ─────────────────────────────────────────────────────────
// // Route Guards
// // ─────────────────────────────────────────────────────────
// import ProtectedRoute from './components/auth/ProtectedRoute';
// import AdminRoute from './components/auth/AdminRoute';
// import GuestRoute from './components/auth/GuestRoute';

// // ─────────────────────────────────────────────────────────
// // Other Pages
// // ─────────────────────────────────────────────────────────
// import NotFoundPage from './pages/NotFoundPage';
// import ErrorBoundary from './components/ErrorBoundary';

// // ─────────────────────────────────────────────────────────
// // React Query Configuration
// // ─────────────────────────────────────────────────────────
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 5 * 60 * 1000, // 5 minutes
//       cacheTime: 10 * 60 * 1000, // 10 minutes
//       retry: 1,
//       refetchOnWindowFocus: false,
//     },
//   },
// });

// function App() {
//   return (
//     <ErrorBoundary>
//       <Provider store={store}>
//         <QueryClientProvider client={queryClient}>
//           <BrowserRouter>
//             <AppContent />
//           </BrowserRouter>

//           {/* Toast Notifications */}
//           <Toaster
//             position="top-right"
//             toastOptions={{
//               duration: 3000,
//               style: {
//                 background: '#1e2749',
//                 color: '#fff',
//                 borderRadius: '12px',
//                 padding: '16px',
//               },
//               success: {
//                 iconTheme: { primary: '#3fb950', secondary: '#fff' },
//               },
//               error: {
//                 iconTheme: { primary: '#f85149', secondary: '#fff' },
//               },
//             }}
//           />
//         </QueryClientProvider>
//       </Provider>
//     </ErrorBoundary>
//   );
// }

// // ═══════════════════════════════════════════════════════════
// // Main App Content with Layout
// // ═══════════════════════════════════════════════════════════
// function AppContent() {
//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* Navbar - Always visible */}
//       <Navbar />

//       {/* Main Content */}
//       <main className="flex-1">
//         <Routes>
//           {/* ═══════════════════════════════════════════════
//               PUBLIC ROUTES
//               Anyone can access without authentication
//           ═══════════════════════════════════════════════ */}

//           {/* Home Page */}
//           <Route path="/" element={<HomePage />} />

//           {/* Products */}
//           <Route path="/products" element={<ProductsPage />} />
//           <Route path="/products/:productId" element={<ProductDetailPage />} />

//           {/* Categories */}
//           <Route path="/categories" element={<CategoryPage />} />
//           <Route path="/category/:categorySlug" element={<CategoryPage />} />

//           {/* Search */}
//           <Route path="/search" element={<SearchPage />} />

//           {/* Cart - Anyone can view, checkout requires auth */}
//           <Route path="/cart" element={<CartPage />} />

//           {/* Static Pages */}
//           <Route path="/about" element={<AboutPage />} />
//           <Route path="/contact" element={<ContactPage />} />

//           {/* ═══════════════════════════════════════════════
//               AUTHENTICATION ROUTES
//               Guest only - redirect if already logged in
//           ═══════════════════════════════════════════════ */}

//           <Route
//             path="/login"
//             element={
//               <GuestRoute>
//                 <LoginPage />
//               </GuestRoute>
//             }
//           />

//           <Route
//             path="/register"
//             element={
//               <GuestRoute>
//                 <RegisterPage />
//               </GuestRoute>
//             }
//           />

//           <Route
//             path="/forgot-password"
//             element={
//               <GuestRoute>
//                 <ForgotPasswordPage />
//               </GuestRoute>
//             }
//           />

//           <Route
//             path="/reset-password/:token"
//             element={
//               <GuestRoute>
//                 <ResetPasswordPage />
//               </GuestRoute>
//             }
//           />

//           {/* ═══════════════════════════════════════════════
//               PROTECTED ROUTES
//               Authentication required
//           ═══════════════════════════════════════════════ */}

//           {/* Checkout */}
//           <Route
//             path="/checkout"
//             element={
//               <ProtectedRoute>
//                 <CheckoutPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Orders */}
//           <Route
//             path="/orders"
//             element={
//               <ProtectedRoute>
//                 <OrdersPage />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/orders/:orderId"
//             element={
//               <ProtectedRoute>
//                 <OrderDetailPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Profile & Account */}
//           <Route
//             path="/profile"
//             element={
//               <ProtectedRoute>
//                 <ProfilePage />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/account/settings"
//             element={
//               <ProtectedRoute>
//                 <AccountSettingsPage />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/account/addresses"
//             element={
//               <ProtectedRoute>
//                 <AddressesPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Wishlist */}
//           <Route
//             path="/wishlist"
//             element={
//               <ProtectedRoute>
//                 <WishlistPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* ═══════════════════════════════════════════════
//               ADMIN ROUTES
//               Admin authentication required
//           ═══════════════════════════════════════════════ */}

//           <Route
//             path="/admin"
//             element={
//               <AdminRoute>
//                 <AdminLayout />
//               </AdminRoute>
//             }
//           >
//             <Route index element={<AdminDashboard />} />
//             <Route path="products" element={<AdminProducts />} />
//             <Route path="orders" element={<AdminOrders />} />
//             <Route path="customers" element={<AdminCustomers />} />
//             <Route path="categories" element={<AdminCategories />} />
//             <Route path="settings" element={<AdminSettings />} />
//           </Route>

//           {/* ═══════════════════════════════════════════════
//               ERROR ROUTES
//           ═══════════════════════════════════════════════ */}

//           <Route path="/404" element={<NotFoundPage />} />
//           <Route path="*" element={<Navigate to="/404" replace />} />
//         </Routes>
//       </main>

//       {/* Footer - Always visible */}
//       <Footer />
//     </div>
//   );
// }

// export default App;
