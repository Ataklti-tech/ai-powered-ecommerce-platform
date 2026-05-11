import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchForYouRecommendations,
  fetchHomepageRecommendations,
} from '../features/recommendations/recommendationSlice';
import ProductCard from './ProductCard';

export default function AIRecommendations() {
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.auth);

  const {
    items: personalItems,
    homepageItems,
    loading: personalLoading,
    homepageLoading,
    type: personalType,
    homepageType,
  } = useSelector((state) => state.recommendations);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchForYouRecommendations(10));
    } else {
      dispatch(fetchHomepageRecommendations(10));
    }
  }, [dispatch, isAuthenticated]);

  const loading = isAuthenticated ? personalLoading : homepageLoading;
  const rawProducts = isAuthenticated ? personalItems : homepageItems;
  const type = isAuthenticated ? personalType : homepageType;

  // "Recommended For You" vs "Trending For You" vs homepage fallback
  const isPersonalized =
    type === 'recommended_for_you' || type === 'personalized';
  const isTrending =
    type === 'trending_for_you' || type === 'trending_fallback' ||
    type === 'ai_homepage' || type === 'homepage_fallback' ||
    type === 'homepage_trending';

  const heading = isPersonalized
    ? 'Recommended For You'
    : isTrending && isAuthenticated
      ? 'Trending For You'
      : 'Popular Products';

  const subheading = isPersonalized
    ? 'Based on your orders and browsing history'
    : 'Discover what others are loving right now';

  if (loading) {
    return (
      <section className="py-24 px-8 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">{heading}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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

  if (!rawProducts || rawProducts.length === 0) return null;

  const products = rawProducts.map((p) => ({
    ...p,
    id: p._id || p.id,
    subtitle: p.shortDescription || p.category?.name || 'Premium Quality',
    image: p.images?.[0]?.url || p.primaryImage?.url,
  }));

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">{heading}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subheading}</p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showMatch={isPersonalized}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
