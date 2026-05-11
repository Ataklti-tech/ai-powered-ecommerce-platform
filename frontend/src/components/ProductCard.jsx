import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Star, Heart, Check, ShoppingCart } from 'lucide-react';
import { addToCart, addToCartAsync } from '../features/cart/cartSlice';
import {
  addToWishlist,
  addToWishlistAsync,
  removeFromWishlist,
} from '../features/wishlist/wishlistSlice';
import { toast } from 'react-hot-toast';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isAdded, setIsAdded] = useState(false);

  // Safety guard (prevents runtime crashes)
  if (!product || typeof product !== 'object') {
    return null;
  }

  const productId = product.id || product._id;
  const isInWishlist = wishlistItems.some((item) => item.id === productId);

  // Normalize backend data safely
  const {
    name = 'Product Name',
    shortDescription = '',
    price = 0,
    discountedPrice,
    rating = {},
    images = [],
  } = product;

  // Rating normalization (backend sends object)
  const ratingValue =
    typeof rating === 'number' ? rating : Number(rating?.average ?? 0);

  const reviewsCount =
    typeof rating === 'object' ? Number(rating?.count ?? 0) : 0;

  // Price handling
  const finalPrice =
    discountedPrice !== undefined ? Number(discountedPrice) : Number(price);

  // Get product image
  const productImage = images?.[0]?.url || product.image;

  const handleAddToCart = () => {
    if (isAuthenticated) {
      // Use async action to save to database
      dispatch(addToCartAsync({ productId, quantity: 1 }))
        .then(() => {
          setIsAdded(true);
          toast.success('Added to cart!');
          setTimeout(() => setIsAdded(false), 2000);
        })
        .catch((error) => {
          toast.error(error.payload || 'Failed to add to cart');
        });
    } else {
      // Use local storage for guest users
      dispatch(
        addToCart({
          id: productId,
          name,
          price: finalPrice,
          image: productImage,
        })
      );
      setIsAdded(true);
      toast.success('Added to cart!');
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      if (isAuthenticated) {
        dispatch(removeFromWishlist(productId));
      } else {
        dispatch(removeFromWishlist(productId));
      }
      toast.success('Removed from wishlist');
    } else {
      if (isAuthenticated) {
        dispatch(addToWishlistAsync(productId))
          .then(() => {
            toast.success('Added to wishlist!');
          })
          .catch((error) => {
            toast.error(error.payload || 'Failed to add to wishlist');
          });
      } else {
        dispatch(
          addToWishlist({
            id: productId,
            name,
            price: finalPrice,
            image: productImage,
          })
        );
        toast.success('Added to wishlist!');
      }
    }
  };

  return (
    <Link
      to={`/product/${productId}`}
      className="block group relative bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3"
    >
      {/* Image Placeholder */}
      <div
        className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center overflow-hidden"
        onClick={(e) => e.preventDefault()}
      >
        {productImage ? (
          <img
            src={productImage}
            alt={name}
            className="w-full h-full object-cover rounded-2xl"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center">
            <span className="text-orange-300 text-4xl">✨</span>
          </div>
        )}

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition"
        >
          <Heart
            className={`w-5 h-5 ${
              isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {name}
          </h3>

          {shortDescription && (
            <p className="text-sm text-gray-500">{shortDescription}</p>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-gray-900">
              {ratingValue.toFixed(1)}
            </span>
          </div>

          <span className="text-sm text-gray-400">
            ({reviewsCount.toLocaleString()})
          </span>
        </div>

        {/* Price + Action */}
        <div
          className="flex items-center justify-between"
          onClick={(e) => e.preventDefault()}
        >
          <div className="text-3xl font-bold text-gray-900">
            USh {Math.round(finalPrice * 3650).toLocaleString()}
          </div>

          <button
            onClick={handleAddToCart}
            className={`p-3 rounded-xl transition-all ${
              isAdded
                ? 'bg-green-500 text-white'
                : 'bg-gray-900 text-white hover:bg-orange-500 hover:shadow-lg'
            }`}
          >
            {isAdded ? (
              <Check className="w-5 h-5" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
};
