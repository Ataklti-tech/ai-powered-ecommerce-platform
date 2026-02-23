import React, { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import ProductCard from "./ProductCard";
import axios from "axios";

export default function TrendingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        // `${import.meta.env.VITE_API_URL}/api/v1/products`,
        "http://localhost:5000/api/v1/products",
      );
      // if (!res.ok) {
      //   throw new Error(`Server responded with ${res.status}`);
      // }
      const data = res.data;

      const list = Array.isArray(data)
        ? data
        : (data.products ?? data.data ?? []);

      console.log(list);

      setProducts(list);
    } catch (err) {
      console.log(err);
      // if (err.response) {
      //   // Server responded with error status (4xx, 5xx)
      //   console.log("Status:", err.response.status);
      //   console.log("Data:", err.response.data);
      // } else if (err.request) {
      //   // Request made but no response
      //   console.log("No response received");
      // } else {
      //   // Request setup error
      //   console.log("Error:", err.message);
      // }
    } finally {
      // console.log("hello");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24 text-center text-gray-500">
        Loading products...
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-24 px-8">
        <div className="max-w-[1400px] mx-auto text-center text-gray-500">
          No products found.
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center space-x-2 mb-6 px-6 py-3 bg-white border-2 border-blue-200 rounded-full shadow-sm">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">
              Trending Now
            </span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Popular This Week
          </h2>
          <p className="text-xl text-gray-600">
            What our community is loving right now
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id || product._id}
              product={product}
              showMatch={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
