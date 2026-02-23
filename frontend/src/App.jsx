// import React from "react";
// // import Navbar from "././components/common/Header/Header2";
// import Navbar from "./components/Navbar";
// import { BrowserRouter as Router } from "react-router-dom";
// // import FeaturedProducts from "./pages/Home/FeaturedProducts";

// const App = () => {
//   return (
//     <Router>
//       {" "}
//       {/* ← WRAP EVERYTHING IN ROUTER */}
//       <Navbar />
//       {/* <FeaturedProducts /> */}
//       {/* <Header/> */}
//       {/* Your routes and other components */}
//     </Router>
//   );
// };

// export default App;

// import React, { useState, useEffect } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Header from "./Header";
// import HomePage from "./pages/Home/HomePage";
// import "./App.css";

// function App() {
//   // Cart state
//   const [cartCount, setCartCount] = useState(0);

//   // Authentication state
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [user, setUser] = useState(null);

//   // Categories for header
//   const categories = [
//     { id: 1, name: "Electronics", slug: "electronics" },
//     { id: 2, name: "Fashion", slug: "fashion" },
//     { id: 3, name: "Home & Living", slug: "home-living" },
//     { id: 4, name: "Books", slug: "books" },
//     { id: 5, name: "Sports", slug: "sports" },
//     { id: 6, name: "Art & Crafts", slug: "art-crafts" }
//   ];

//   // Load user data on mount (e.g., from localStorage)
//   useEffect(() => {
//     // Check if user is logged in
//     const savedUser = localStorage.getItem("user");
//     const savedAuth = localStorage.getItem("isAuthenticated");

//     if (savedUser && savedAuth === "true") {
//       setUser(JSON.parse(savedUser));
//       setIsAuthenticated(true);
//     }

//     // Load cart count
//     const savedCartCount = localStorage.getItem("cartCount");
//     if (savedCartCount) {
//       setCartCount(parseInt(savedCartCount, 10));
//     }
//   }, []);

//   // Handle logout
//   const handleLogout = () => {
//     setIsAuthenticated(false);
//     setUser(null);
//     localStorage.removeItem("user");
//     localStorage.removeItem("isAuthenticated");
//     localStorage.setItem("cartCount", "0");
//     setCartCount(0);
//   };

//   // Handle search
//   const handleSearch = (query) => {
//     console.log("Searching for:", query);
//     // You can add custom search logic here
//   };

//   return (
//     <Router>
//       <div className="app">
//         {/* Header Component */}
//         <Header
//           cartItemCount={cartCount}
//           isAuthenticated={isAuthenticated}
//           user={user}
//           onLogout={handleLogout}
//           categories={categories}
//           onSearch={handleSearch}
//         />

//         {/* Main Content */}
//         <main className="app__content">
//           <Routes>
//             {/* Home Page */}
//             <Route path="/" element={<HomePage />} />

//             {/* Other Routes - Add these as you create them */}
//             <Route
//               path="/products"
//               element={<div className="page-placeholder">Products Page</div>}
//             />
//             <Route
//               path="/category/:slug"
//               element={<div className="page-placeholder">Category Page</div>}
//             />
//             <Route
//               path="/product/:id"
//               element={
//                 <div className="page-placeholder">Product Detail Page</div>
//               }
//             />
//             <Route
//               path="/cart"
//               element={<div className="page-placeholder">Cart Page</div>}
//             />
//             <Route
//               path="/wishlist"
//               element={<div className="page-placeholder">Wishlist Page</div>}
//             />
//             <Route
//               path="/deals"
//               element={<div className="page-placeholder">Deals Page</div>}
//             />
//             <Route
//               path="/about"
//               element={<div className="page-placeholder">About Page</div>}
//             />
//             <Route
//               path="/login"
//               element={<div className="page-placeholder">Login Page</div>}
//             />
//             <Route
//               path="/register"
//               element={<div className="page-placeholder">Register Page</div>}
//             />
//             <Route
//               path="/profile"
//               element={<div className="page-placeholder">Profile Page</div>}
//             />
//             <Route
//               path="/orders"
//               element={<div className="page-placeholder">Orders Page</div>}
//             />
//             <Route
//               path="/settings"
//               element={<div className="page-placeholder">Settings Page</div>}
//             />
//             <Route
//               path="/search"
//               element={
//                 <div className="page-placeholder">Search Results Page</div>
//               }
//             />

//             {/* 404 Not Found */}
//             <Route
//               path="*"
//               element={
//                 <div className="page-placeholder">404 - Page Not Found</div>
//               }
//             />
//           </Routes>
//         </main>

//         {/* Footer Component - Add this later */}
//         <footer className="app__footer">
//           <div className="footer__content">
//             <p>&copy; 2025 ShopHub. All rights reserved.</p>
//           </div>
//         </footer>
//       </div>
//     </Router>
//   );
// }

// export default App;
import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import Categories from "./components/Categories";
import AIRecommendations from "./components/AIRecommendations";
import Features from "./components/Features";
import TrendingProducts from "./components/TrendingProducts";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import Login from "./components/auth/LoginForm/LoginForm";
import RegisterForm from "./components/auth/RegisterForm/RegisterForm";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* <Navbar />
      <Hero />
      <Stats />
      <Categories />
      <AIRecommendations />
      <Features />
      <TrendingProducts />
      <CTASection />
      <Footer /> */}
      {/* <Login /> */}
      <RegisterForm />

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
