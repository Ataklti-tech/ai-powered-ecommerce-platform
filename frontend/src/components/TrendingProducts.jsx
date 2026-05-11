import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHomepageRecommendations } from '../features/recommendations/recommendationSlice';
import ProductCard from './ProductCard';

export default function TrendingProducts() {
  const dispatch = useDispatch();
  const {
    homepageItems: products,
    homepageLoading: loading,
  } = useSelector((state) => state.recommendations);

  useEffect(() => {
    // Only fetch if not already loaded
    if (products.length === 0) {
      dispatch(fetchHomepageRecommendations(8));
    }
  }, [dispatch]);

  if (loading) {
    return (
      <section className="py-24 px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Popular This Week</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-xl mb-4" />
                <div className="bg-gray-200 h-4 w-3/4 rounded mb-2" />
                <div className="bg-gray-200 h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Popular This Week</h2>
          <p className="text-xl text-gray-600">What our community is loving right now</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
              showMatch={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
