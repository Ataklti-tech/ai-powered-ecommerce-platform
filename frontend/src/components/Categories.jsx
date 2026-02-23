// import React, { useState } from "react";
// import { useEffect } from "react";
// // import {
// //   Smartphone,
// //   Shirt,
// //   Home,
// //   Dumbbell,
// //   BookOpen,
// //   Palette,
// //   Gamepad2,
// //   Sparkles as SparklesIcon,
// // } from "lucide-react";

// export default function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await fetch(
//           `${import.meta.env.VITE_API_URL}/api/v1/categories`,
//         );
//         if (!res.ok) {
//           throw new Error(`Server responded with ${res.status}`);
//         }
//         const data = await res.json();

//         const list = Array.isArray(data)
//           ? data
//           : (data.categories ?? data.data ?? []);

//         setCategories(list);
//         // setCategories(data);
//       } catch (error) {
//         console.error(error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCategories();
//   }, []);

//   if (loading) {
//     return (
//       <section className="py-24 text-center text-gray-500">
//         Loading categories...
//       </section>
//     );
//   }

//   if (categories.length === 0) {
//     return (
//       <section className="py-24 px-8">
//         <div className="max-w-[1400px] mx-auto text-center text-gray-500">
//           No categories found.
//         </div>
//       </section>
//     );
//   }
//   return (
//     <section className="py-24 px-8 bg-gradient-to-b from-gray-50 to-white">
//       <div className="max-w-[1400px] mx-auto">
//         <div className="mb-16 text-center">
//           <h2 className="text-5xl font-bold text-gray-900 mb-4">
//             Browse Categories
//           </h2>
//           <p className="text-xl text-gray-600">
//             Curated collections for every need
//           </p>
//         </div>

//         <div className="grid grid-cols-4 gap-6">
//           {categories.map((category) => {
//             {
//               /* const Icon = category.icon; */
//             }
//             return (
//               <button
//                 key={category._id}
//                 className="group relative bg-white border-2 border-gray-100 hover:border-orange-300 rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 text-left overflow-hidden"
//               >
//                 {/* Background gradient on hover */}
//                 <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

//                 {/* Content */}
//                 <div className="relative z-10">
//                   <div
//                     className={`w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
//                   >
//                     {/* <Icon className="w-8 h-8 text-white" /> */}
//                   </div>
//                   <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
//                     {category.name}
//                   </h3>
//                   <p className="text-sm text-gray-500">
//                     {category.count.toLocaleString()} items
//                   </p>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// }

// // components/Categories.jsx
// // ✅ FIXED: Icon mapping, error handling, navigation, skeleton loader

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// // import {
// //   Smartphone,
// //   Shirt,
// //   Home,
// //   Dumbbell,
// //   BookOpen,
// //   Palette,
// //   Gamepad2,
// //   Sparkles,
// //   ShoppingBag,
// //   Headphones,
// //   Watch,
// //   Coffee,
// //   Camera,
// //   Car,
// //   Music,
// //   Baby,
// //   Leaf,
// //   Globe,
// // } from "lucide-react";

// // ─────────────────────────────────────────────────────────
// // BUG FIX #1: Icon is undefined because `category.icon` is
// // a STRING from the API (e.g. "Smartphone"), not a component.
// // We map the string → actual Lucide component here.
// // ─────────────────────────────────────────────────────────
// // const ICON_MAP = {
// //   Smartphone,
// //   Shirt,
// //   Home,
// //   Dumbbell,
// //   BookOpen,
// //   Palette,
// //   Gamepad2,
// //   Sparkles,
// //   ShoppingBag,
// //   Headphones,
// //   Watch,
// //   Coffee,
// //   Camera,
// //   Car,
// //   Music,
// //   Baby,
// //   Leaf,
// //   Globe,
// // };

// // ─────────────────────────────────────────────────────────
// // BUG FIX #2: `category.color` must be a full Tailwind class
// // string (e.g. "from-blue-400 to-blue-600"), not a partial.
// // We provide a fallback palette when the API doesn't return color.
// // ─────────────────────────────────────────────────────────
// // const COLOR_FALLBACKS = [
// //   "from-blue-400 to-blue-600",
// //   "from-pink-400 to-pink-600",
// //   "from-green-400 to-emerald-600",
// //   "from-orange-400 to-orange-600",
// //   "from-purple-400 to-purple-600",
// //   "from-yellow-400 to-amber-600",
// //   "from-red-400 to-rose-600",
// //   "from-cyan-400 to-cyan-600",
// // ];

// // Skeleton card while loading
// function CategorySkeleton() {
//   return (
//     <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 animate-pulse">
//       <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-6" />
//       <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-3" />
//       <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
//     </div>
//   );
// }

// export default function Categories() {
//   const navigate = useNavigate();

//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await fetch(
//           `${import.meta.env.VITE_API_URL}/api/v1/categories`,
//         );

//         // ─────────────────────────────────────────────
//         // BUG FIX #3: Always check res.ok before .json()
//         // A 404 / 500 still resolves — it won't throw —
//         // so without this check you'd try to render bad data.
//         // ─────────────────────────────────────────────
//         if (!res.ok) {
//           throw new Error(`Server responded with ${res.status}`);
//         }

//         const data = await res.json();

//         // ─────────────────────────────────────────────
//         // BUG FIX #4: Some APIs wrap the array:
//         //   { categories: [...] }  OR  { data: [...] }
//         // Unwrap if needed so we always set an array.
//         // ─────────────────────────────────────────────
//         const list = Array.isArray(data)
//           ? data
//           : (data.categories ?? data.data ?? []);

//         setCategories(list);
//       } catch (err) {
//         console.error("Failed to fetch categories:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCategories();
//   }, []);

//   // Navigate to filtered products page
//   const handleCategoryClick = (category) => {
//     navigate(`/products?category=${encodeURIComponent(category.name)}`);
//   };

//   // ── Loading state ───────────────────────────────────────
//   // if (loading) {
//   //   return (
//   //     <section className="py-24 px-8 bg-gradient-to-b from-gray-50 to-white">
//   //       <div className="max-w-[1400px] mx-auto">
//   //         <div className="mb-16 text-center">
//   //           <div className="h-12 bg-gray-200 rounded-xl w-72 mx-auto mb-4 animate-pulse" />
//   //           <div className="h-6 bg-gray-100 rounded-xl w-48 mx-auto animate-pulse" />
//   //         </div>
//   //         <div className="grid grid-cols-4 gap-6">
//   //           {Array.from({ length: 8 }).map((_, i) => (
//   //             <CategorySkeleton key={i} />
//   //           ))}
//   //         </div>
//   //       </div>
//   //     </section>
//   //   );
//   // }

//   // ── Error state ─────────────────────────────────────────
//   // if (error) {
//   //   return (
//   //     <section className="py-24 px-8 bg-gradient-to-b from-gray-50 to-white">
//   //       <div className="max-w-[1400px] mx-auto text-center">
//   //         <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
//   //           <span className="text-3xl">⚠️</span>
//   //         </div>
//   //         <h3 className="text-2xl font-bold text-gray-900 mb-2">
//   //           Could not load categories
//   //         </h3>
//   //         <p className="text-gray-600 mb-6 font-mono text-sm bg-gray-100 p-3 rounded-lg inline-block">
//   //           {error}
//   //         </p>
//   //         <br />
//   //         <button
//   //           onClick={() => window.location.reload()}
//   //           className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all"
//   //         >
//   //           Retry
//   //         </button>
//   //       </div>
//   //     </section>
//   //   );
//   // }

//   // ── Empty state ─────────────────────────────────────────
//   if (categories.length === 0) {
//     return (
//       <section className="py-24 px-8">
//         <div className="max-w-[1400px] mx-auto text-center text-gray-500">
//           No categories found.
//         </div>
//       </section>
//     );
//   }

//   // ── Main render ─────────────────────────────────────────
//   return (
//     <section className="py-24 px-8 bg-gradient-to-b from-gray-50 to-white">
//       <div className="max-w-[1400px] mx-auto">
//         <div className="mb-16 text-center">
//           <h2 className="text-5xl font-bold text-gray-900 mb-4">
//             Browse Categories
//           </h2>
//           <p className="text-xl text-gray-600">
//             Curated collections for every need
//           </p>
//         </div>

//         <div className="grid grid-cols-4 gap-6">
//           {categories.map((category, idx) => {
//             // ─────────────────────────────────────────
//             // BUG FIX #1 applied: resolve icon string → component
//             // Falls back to ShoppingBag if unknown or missing
//             // ─────────────────────────────────────────
//             {
//               /* const Icon = ICON_MAP[category.icon] ?? ShoppingBag; */
//             }

//             // ─────────────────────────────────────────
//             // BUG FIX #2 applied: use API color or cycle fallbacks
//             // ─────────────────────────────────────────
//             {
//               /* const color =
//               category.color ?? COLOR_FALLBACKS[idx % COLOR_FALLBACKS.length]; */
//             }

//             // ─────────────────────────────────────────
//             // BUG FIX #5: `category.count` may be undefined
//             // if the API returns `productCount` or similar.
//             // Guard with ?? 0.
//             // ─────────────────────────────────────────
//             const count =
//               category.count ??
//               category.productCount ??
//               category.products_count ??
//               0;

//             return (
//               <button
//                 key={category._id ?? category.id ?? idx}
//                 onClick={() => handleCategoryClick(category)}
//                 className="group relative bg-white border-2 border-gray-100 hover:border-orange-300 rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 text-left overflow-hidden"
//               >
//                 {/* Hover background */}
//                 <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

//                 {/* Content */}
//                 <div className="relative z-10">
//                   <div
//                     className={`w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
//                   >
//                     {/* <Icon className="w-8 h-8 text-white" /> */}
//                   </div>

//                   <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
//                     {category.name}
//                   </h3>

//                   <p className="text-sm text-gray-500">
//                     {count.toLocaleString()} items
//                   </p>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// }

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`http://localhost:5000/api/v1/categories`);

        // Axios already parses JSON
        const data = res.data;

        // Normalize response shape
        const list = Array.isArray(data)
          ? data
          : data.categories || data.data || [];

        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);

        if (err.response) {
          setError(`Server error: ${err.response.status}`);
        } else if (err.request) {
          setError("No response from server");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ─────────────────────────────
  // Loading state
  // ─────────────────────────────
  if (loading) {
    return (
      <section className="py-24 text-center text-gray-500">
        Loading categories...
      </section>
    );
  }

  // ─────────────────────────────
  // Error state
  // ─────────────────────────────
  if (error) {
    return (
      <section className="py-24 text-center text-red-500">{error}</section>
    );
  }

  // ─────────────────────────────
  // Empty state
  // ─────────────────────────────
  if (!categories.length) {
    return (
      <section className="py-24 px-8">
        <div className="max-w-[1400px] mx-auto text-center text-gray-500">
          No categories found.
        </div>
      </section>
    );
  }

  // ─────────────────────────────
  // Main render
  // ─────────────────────────────
  return (
    <section className="py-24 px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Browse Categories
          </h2>
          <p className="text-xl text-gray-600">
            Curated collections for every need
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {categories.map((category, index) => {
            if (!category || typeof category !== "object") return null;

            const { _id, id, name = "Unnamed Category" } = category;

            // Normalize count field
            const count =
              Number(
                category.count ??
                  category.productCount ??
                  category.products_count ??
                  0,
              ) || 0;

            return (
              <button
                key={_id || id || index}
                className="group relative bg-white border-2 border-gray-100 hover:border-orange-300 rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 text-left overflow-hidden"
              >
                {/* Hover background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <span className="text-white text-xl font-bold">
                      {name.charAt(0)}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {count.toLocaleString()} items
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
