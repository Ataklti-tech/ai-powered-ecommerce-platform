import React from "react";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Search,
  Heart,
  Package,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-32 pb-24 px-8 bg-gradient-to-b from-orange-50/30 to-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          {/* Left Content */}
          <div>
            {/* <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-100 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-semibold text-orange-700 tracking-wide uppercase">AI-Powered Shopping</span>
            </div>
             */}
            <h1 className="text-7xl font-light tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Discover products
              <br />
              {/* <span className="font-semibold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                made for you
              </span> */}
              <span className="font-semibold bg-gradient-to-r from-black to-black bg-clip-text text-transparent">
                made for you
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl">
              Experience shopping with AI-powered recommendations that
              understand your style, preferences, and needs.
            </p>

            <div className="flex items-center space-x-4 mb-12">
              <button className="px-8 py-4 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer">
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="px-8 py-4 text-gray-700 text-sm font-semibold hover:text-gray-900 transition-colors cursor-pointer">
                How It Works
              </button>
            </div>

            {/* Stats - Scattered Layout */}
            {/* <div className="relative mt-16 h-32">
              <div className="absolute top-0 left-0 bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-orange-500">50k+</div>
                <div className="text-xs text-gray-500 mt-1">Products</div>
              </div>

              <div className="absolute top-8 left-40 bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-blue-500">10k+</div>
                <div className="text-xs text-gray-500 mt-1">
                  Happy Customers
                </div>
              </div>

              <div className="absolute top-16 left-80 bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-green-500">98%</div>
                <div className="text-xs text-gray-500 mt-1">Match Rate</div>
              </div>
            </div> */}
          </div>

          {/* Right Visual - Large Icons Grid */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-6">
              {/* Icon Card 1 */}
              <div className="group relative bg-white border-2 border-gray-100 rounded-3xl p-10 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                {/* <div className="absolute top-6 right-6 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </div>
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Instant Match
                </h3>
                <p className="text-sm text-gray-600">
                  AI finds your perfect products in seconds
                </p> */}
              </div>

              {/* Icon Card 2 */}
              <div className="group relative bg-white border-2 border-gray-100 rounded-3xl p-10 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 mt-12">
                {/* <div className="absolute top-6 right-6 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Search className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Smart Search
                </h3>
                <p className="text-sm text-gray-600">
                  Discover exactly what you're looking for
                </p> */}
              </div>

              {/* Icon Card 3 */}
              <div className="group relative bg-white border-2 border-gray-100 rounded-3xl p-10 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                {/* <div className="absolute top-6 right-6 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Personalized
                </h3>
                <p className="text-sm text-gray-600">
                  Curated picks based on your taste
                </p> */}
              </div>

              {/* Icon Card 4 */}
              <div className="group relative bg-white border-2 border-gray-100 rounded-3xl p-10 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 mt-12">
                {/* <div className="absolute top-6 right-6 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Secure & Safe
                </h3>
                <p className="text-sm text-gray-600">
                  Your privacy is our top priority
                </p> */}
              </div>
            </div>

            {/* Floating accent elements */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-orange-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
            <div
              className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-50 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}
