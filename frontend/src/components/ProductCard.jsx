// import React, { useState } from "react";
// import { Star, Heart, Check, ShoppingCart } from "lucide-react";

// export default function ProductCard({ product, showMatch = false }) {
//   const [isFavorite, setIsFavorite] = useState(false);
//   const [isAdded, setIsAdded] = useState(false);

//   const handleAddToCart = () => {
//     setIsAdded(true);
//     setTimeout(() => setIsAdded(false), 2000);
//   };

//   return (
//     <div className="group relative bg-white border-2 border-gray-100 rounded-3xl overflow-hidden hover:border-orange-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
//       {/* Product Image */}
//       <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center">
//         {/* Placeholder for product image */}
//         <div className="w-full h-full bg-white/50 rounded-2xl"></div>

//         {/* AI Match Badge */}
//         {showMatch && (
//           <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center space-x-1">
//             <Star className="w-3 h-3 fill-white" />
//             <span>{product.match}% MATCH</span>
//           </div>
//         )}

//         {/* Favorite Button */}
//         <button
//           onClick={() => setIsFavorite(!isFavorite)}
//           className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all"
//         >
//           <Heart
//             className={`w-5 h-5 transition-all ${
//               isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
//             }`}
//           />
//         </button>
//       </div>

//       {/* Product Info */}
//       <div className="p-6">
//         <div className="mb-4">
//           <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
//             {product.name}
//           </h3>
//           <p className="text-sm text-gray-500">{product.subtitle}</p>
//         </div>

//         {/* Rating */}
//         <div className="flex items-center space-x-2 mb-4">
//           <div className="flex items-center space-x-1">
//             <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
//             <span className="text-sm font-semibold text-gray-900">
//               {product.rating}
//             </span>
//           </div>
//           <span className="text-sm text-gray-400">
//             ({product.reviews.toLocaleString()})
//           </span>
//         </div>

//         {/* Price and Action */}
//         <div className="flex items-center justify-between">
//           <div className="text-3xl font-bold text-gray-900">
//             ${product.price}
//           </div>

//           <button
//             onClick={handleAddToCart}
//             className={`p-3 rounded-xl font-semibold transition-all ${
//               isAdded
//                 ? "bg-green-500 text-white"
//                 : "bg-gray-900 text-white hover:bg-orange-500 hover:shadow-lg"
//             }`}
//           >
//             {isAdded ? (
//               <Check className="w-5 h-5" />
//             ) : (
//               <ShoppingCart className="w-5 h-5" />
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import React, { useState } from "react";
// import { Star, Heart, Check, ShoppingCart } from "lucide-react";

// export default function ProductCard({ product, showMatch = false }) {
//   const [isFavorite, setIsFavorite] = useState(false);
//   const [isAdded, setIsAdded] = useState(false);

//   // Safely access product properties with defaults
//   const {
//     name = "Product Name",
//     subtitle = "",
//     price = 0,
//     rating = 0,
//     reviews = 0,
//     match = 95,
//   } = product || {};

//   const handleAddToCart = () => {
//     setIsAdded(true);
//     setTimeout(() => setIsAdded(false), 2000);
//   };

//   return (
//     <div className="group relative bg-white border-2 border-gray-100 rounded-3xl overflow-hidden hover:border-orange-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
//       {/* Product Image */}
//       <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center">
//         {/* Placeholder for product image - replace with actual image later */}
//         <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center">
//           <span className="text-orange-300 text-4xl">✨</span>
//         </div>

//         {/* AI Match Badge */}
//         {showMatch && (
//           <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center space-x-1">
//             <Star className="w-3 h-3 fill-white" />
//             <span>{match}% MATCH</span>
//           </div>
//         )}

//         {/* Favorite Button */}
//         <button
//           onClick={() => setIsFavorite(!isFavorite)}
//           className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all"
//         >
//           <Heart
//             className={`w-5 h-5 transition-all ${
//               isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
//             }`}
//           />
//         </button>
//       </div>

//       {/* Product Info */}
//       <div className="p-6">
//         <div className="mb-4">
//           <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
//             {name}
//           </h3>
//           {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
//         </div>

//         {/* Rating */}
//         <div className="flex items-center space-x-2 mb-4">
//           <div className="flex items-center space-x-1">
//             <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
//             <span className="text-sm font-semibold text-gray-900">
//               {rating}
//             </span>
//           </div>
//           <span className="text-sm text-gray-400">
//             ({reviews.toLocaleString()})
//           </span>
//         </div>

//         {/* Price and Action */}
//         <div className="flex items-center justify-between">
//           <div className="text-3xl font-bold text-gray-900">
//             ${price.toFixed(2)}
//           </div>

//           <button
//             onClick={handleAddToCart}
//             className={`p-3 rounded-xl font-semibold transition-all ${
//               isAdded
//                 ? "bg-green-500 text-white"
//                 : "bg-gray-900 text-white hover:bg-orange-500 hover:shadow-lg"
//             }`}
//           >
//             {isAdded ? (
//               <Check className="w-5 h-5" />
//             ) : (
//               <ShoppingCart className="w-5 h-5" />
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Optional: Add PropTypes for better development experience
// import PropTypes from "prop-types";

// ProductCard.propTypes = {
//   product: PropTypes.shape({
//     name: PropTypes.string,
//     subtitle: PropTypes.string,
//     price: PropTypes.number,
//     rating: PropTypes.number,
//     reviews: PropTypes.number,
//     match: PropTypes.number,
//   }).isRequired,
//   showMatch: PropTypes.bool,
// };

import React, { useState } from "react";
import PropTypes from "prop-types";
import { Star, Heart, Check, ShoppingCart } from "lucide-react";

export default function ProductCard({ product, showMatch = false }) {
  // Safety guard (prevents runtime crashes)
  if (!product || typeof product !== "object") {
    return null;
  }

  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Normalize backend data safely
  const {
    name = "Product Name",
    shortDescription = "",
    price = 0,
    discountedPrice,
    rating = {},
  } = product;

  // Rating normalization (backend sends object)
  const ratingValue =
    typeof rating === "number" ? rating : Number(rating?.average ?? 0);

  const reviewsCount =
    typeof rating === "object" ? Number(rating?.count ?? 0) : 0;

  // Price handling
  const finalPrice =
    discountedPrice !== undefined ? Number(discountedPrice) : Number(price);

  const handleAddToCart = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="group relative bg-white border-2 border-gray-100 rounded-3xl overflow-hidden hover:border-orange-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
      {/* Image Placeholder */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center">
        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center">
          <span className="text-orange-300 text-4xl">✨</span>
        </div>

        {/* Favorite */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
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
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-gray-900">
            ${finalPrice.toFixed(2)}
          </div>

          <button
            onClick={handleAddToCart}
            className={`p-3 rounded-xl transition-all ${
              isAdded
                ? "bg-green-500 text-white"
                : "bg-gray-900 text-white hover:bg-orange-500 hover:shadow-lg"
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
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  showMatch: PropTypes.bool,
};
