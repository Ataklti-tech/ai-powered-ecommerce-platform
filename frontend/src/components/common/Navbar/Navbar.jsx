import React, { useState } from "react";
const [cart, setCart] = useState(0);
const Navbar = () => {
  return (
    <div>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-16">
              <h1 className="text-2xl font-light tracking-tight text-gray-900">
                Pick<span className="font-medium text-black">Perfect</span>
              </h1>

              <div className="hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products"
                    className="w-[420px] pl-4 pr-12 py-2.5 bg-gray-50 border-none rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-8">
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>AI Picks</span>
              </button>

              <button className="relative text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                <ShoppingCart className="w-5 h-5" />
                {cart > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {cart}
                  </span>
                )}
              </button>

              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      ;
    </div>
  );
};

export default Navbar;
