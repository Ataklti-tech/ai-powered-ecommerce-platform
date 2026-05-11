import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Sparkles, ShoppingCart, Star, Package } from 'lucide-react';

const EXCHANGE_RATES = { USD: 1, UGX: 3650, KES: 150, EUR: 0.92, GBP: 0.79 };
const CURRENCY_SYMBOLS = { USD: '$', UGX: 'USh', KES: 'KSh', EUR: '€', GBP: '£' };

function formatPrice(price, currency = 'UGX') {
  const rate = EXCHANGE_RATES[currency] || 1;
  const symbol = CURRENCY_SYMBOLS[currency] || 'USh';
  const converted = (price || 0) * rate;
  return currency === 'UGX'
    ? `${symbol} ${Math.round(converted).toLocaleString()}`
    : `${symbol}${converted.toFixed(2)}`;
}

export default function Recommendations() {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useSelector((s) => s.auth);

  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile]         = useState(null);
  const [recType, setRecType]                 = useState('');
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');

  const currency = (() => {
    if (!user?.addresses?.length) return 'UGX';
    const country = (
      (user.addresses.find((a) => a.isDefault) || user.addresses[0]).country || ''
    ).toLowerCase();
    if (country === 'kenya') return 'KES';
    if (country === 'uk' || country === 'united kingdom') return 'GBP';
    if (['germany', 'france', 'spain', 'italy'].includes(country)) return 'EUR';
    return 'UGX';
  })();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!token) return;

    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          'http://localhost:5000/api/v1/ai/my-recommendations?limit=12',
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        const data = res.data.data;
        setRecommendations(data.recommendations || []);
        setUserProfile(data.userProfile || null);
        setRecType(data.type || '');
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, token, navigate]);

  const isPersonalized = recType === 'recommended_for_you';

  if (loading) {
    return (
      <div className="pt-32 pb-24 px-8 bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-10">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-3" />
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 flex gap-5 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-24 px-8 bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <Link to="/" className="mt-4 inline-block text-orange-500 hover:underline">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isPersonalized ? 'Recommended For You' : 'Popular Right Now'}
          </h1>
          <p className="text-gray-500">
            {isPersonalized
              ? 'Picked by our AI model based on your orders, wishlist, and browsing history'
              : 'You haven\'t placed any orders yet — here are the most popular products'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Left — Product List */}
          <div className="lg:col-span-3 space-y-4">
            {recommendations.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No recommendations available right now.</p>
                <Link to="/products" className="mt-4 inline-block text-orange-500 hover:underline">
                  Browse all products
                </Link>
              </div>
            ) : (
              recommendations.map((product, idx) => (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Rank */}
                  <span className="text-2xl font-bold text-gray-200 w-8 text-center flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                        ✨
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                    {product.shortDescription && (
                      <p className="text-sm text-gray-400 truncate">
                        {product.shortDescription}
                      </p>
                    )}
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-gray-500">
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div className="flex-shrink-0 text-right">
                    <div className="mb-1">
                      <span className="text-xl font-bold text-orange-500">
                        {formatPrice(product.price, currency)}
                      </span>
                      {product.discount > 0 && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/product/${product._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right — User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-28">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Your Profile
              </h3>

              {userProfile ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Orders placed</span>
                    <span className="font-bold text-gray-900">{userProfile.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Items purchased</span>
                    <span className="font-bold text-gray-900">{userProfile.itemsPurchased}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Wishlist items</span>
                    <span className="font-bold text-gray-900">{userProfile.wishlistCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-500">Items viewed</span>
                    <span className="font-bold text-gray-900">{userProfile.viewCount}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No activity data yet.</p>
              )}

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isPersonalized
                    ? 'Recommendations update as you shop more.'
                    : 'Place an order to get personalized picks.'}
                </p>
              </div>

              <Link
                to="/products"
                className="mt-4 block w-full text-center py-2.5 border border-orange-300 text-orange-500 font-semibold rounded-lg hover:bg-orange-50 transition-colors text-sm"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
