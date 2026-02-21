import React from "react";
import { Sparkles } from "lucide-react";
import ProductCard from "./ProductCard";

export default function AIRecommendations() {
  const aiProducts = [
    {
      id: 1,
      name: "Wireless Headphones",
      subtitle: "Premium Audio",
      price: 249,
      rating: 4.9,
      reviews: 2547,
      match: 98,
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      subtitle: "Health Tracker Pro",
      price: 349,
      rating: 4.8,
      reviews: 1892,
      match: 95,
    },
    {
      id: 3,
      name: "Leather Backpack",
      subtitle: "Luxury Collection",
      price: 189,
      rating: 4.7,
      reviews: 987,
      match: 93,
    },
    {
      id: 4,
      name: "Mirrorless Camera",
      subtitle: "Professional Kit",
      price: 1299,
      rating: 4.9,
      reviews: 3241,
      match: 91,
    },
  ];

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center space-x-3 mb-6 px-6 py-3 bg-white border-2 border-orange-200 rounded-full shadow-sm">
            <Sparkles className="w-6 h-6 text-orange-500" />
            <span className="text-sm font-bold text-orange-600 uppercase tracking-wide">
              AI Powered
            </span>
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Picked Just for You
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our AI analyzed your preferences and found these perfect matches
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-4 gap-6">
          {aiProducts.map((product) => (
            <ProductCard key={product.id} product={product} showMatch={true} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <button className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            See More AI Picks
          </button>
        </div>
      </div>
    </section>
  );
}
