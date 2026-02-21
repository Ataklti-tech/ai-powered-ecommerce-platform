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
