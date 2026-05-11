// // ═══════════════════════════════════════════════════════════
// // src/store/index.js
// // Redux store configuration with all slices
// // ═══════════════════════════════════════════════════════════

// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './authSlice';
// import cartReducer from './cartSlice';

// // ─────────────────────────────────────────────────────────
// // Configure Redux Store
// // ─────────────────────────────────────────────────────────
// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     cart: cartReducer,
//   },

//   // Middleware configuration
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         // Ignore these action types for serialization check
//         ignoredActions: ['persist/PERSIST'],
//       },
//     }),

//   // Enable Redux DevTools in development
//   // eslint-disable-next-line no-undef
//   devTools: process.env.NODE_ENV !== 'production',
// });

// export default store;

// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from '../features/auth/authSlice';
// import cartReducer from '../features/cart/cartSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     cart: cartReducer,
//   },
//   devTools: import.meta.env.MODE !== 'production',
// });

// export default store;

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';
import recommendationReducer from '../features/recommendations/recommendationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    recommendations: recommendationReducer,
  },
  devTools: import.meta.env.MODE !== 'production',
});

export default store;
