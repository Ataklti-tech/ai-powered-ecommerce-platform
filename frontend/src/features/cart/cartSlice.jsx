import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { loadState, saveState, clearState } from '../../utils/storage';

const persistedCart = loadState('cart');

const initialState = persistedCart || {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  loading: false,
  error: null,
};

// Async thunk for fetching cart from database
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.get('http://localhost:5000/api/v1/cart', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch cart'
      );
    }
  }
);

// Async thunk for adding item to cart
export const addToCartAsync = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.post(
        'http://localhost:5000/api/v1/cart/add',
        { productId, quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add to cart'
      );
    }
  }
);

// Async thunk for updating cart item quantity
export const updateCartItemAsync = createAsyncThunk(
  'cart/updateItem',
  async ({ productId, quantity }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.put(
        `http://localhost:5000/api/v1/cart/${productId}`,
        { productId, quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update cart'
      );
    }
  }
);

// Async thunk for removing item from cart
export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.delete(
        `http://localhost:5000/api/v1/cart/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return { productId, cart: res.data.data || res.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove from cart'
      );
    }
  }
);

// Async thunk for merging guest cart into authenticated user's DB cart
export const mergeCartAsync = createAsyncThunk(
  'cart/mergeCarts',
  async (guestItems, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.post(
        'http://localhost:5000/api/v1/cart/merge',
        { guestCartItems: guestItems },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to merge cart'
      );
    }
  }
);

// Async thunk for clearing cart
export const clearCartAsync = createAsyncThunk(
  'cart/clearCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      // Use deleteCart endpoint if available, otherwise just clear local state
      await axios.delete('http://localhost:5000/api/v1/cart/delete', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      return true;
    } catch (error) {
      // Even if API fails, clear local state
      return true;
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existing = state.items.find(
        (i) => i.id === item.id || i.product?._id === item.id
      );

      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }

      // Recalculate totals
      state.totalItems = state.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.totalPrice = state.items.reduce(
        (sum, item) =>
          sum + (item.product?.price || item.price) * item.quantity,
        0
      );
      saveState('cart', state);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        (item) =>
          item.id !== action.payload && item.product?._id !== action.payload
      );
      // Recalculate totals
      state.totalItems = state.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.totalPrice = state.items.reduce(
        (sum, item) =>
          sum + (item.product?.price || item.price) * item.quantity,
        0
      );
      saveState('cart', state);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.id === id || i.product?._id === id
      );
      if (item) {
        item.quantity = quantity;
        // Recalculate totals
        state.totalItems = state.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        state.totalPrice = state.items.reduce(
          (sum, item) =>
            sum + (item.product?.price || item.price) * item.quantity,
          0
        );
        saveState('cart', state);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      clearState('cart');
    },

    setCartFromDB: (state, action) => {
      const cartData = action.payload;
      if (cartData && cartData.items) {
        state.items = cartData.items;
        state.totalItems = cartData.totalItems || cartData.items.length;
        state.totalPrice = cartData.totalPrice || 0;
        saveState('cart', state);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        const cartData = action.payload;
        // Handle case when cart is empty or doesn't exist
        if (cartData && cartData.items && cartData.items.length > 0) {
          state.items = cartData.items;
          state.totalItems = cartData.totalItems || cartData.items.length;
          state.totalPrice = cartData.totalPrice || 0;
          saveState('cart', state);
        } else {
          // Cart is empty or doesn't exist - reset to empty state
          state.items = [];
          state.totalItems = 0;
          state.totalPrice = 0;
          clearState('cart');
        }
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to cart
      .addCase(addToCartAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        const cartData = action.payload;
        if (cartData && cartData.items) {
          state.items = cartData.items;
          state.totalItems = cartData.totalItems || 0;
          state.totalPrice = cartData.totalPrice || 0;
          saveState('cart', state);
        }
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update cart item
      .addCase(updateCartItemAsync.fulfilled, (state, action) => {
        const cartData = action.payload;
        if (cartData && cartData.items) {
          state.items = cartData.items;
          state.totalItems = cartData.totalItems || 0;
          state.totalPrice = cartData.totalPrice || 0;
          saveState('cart', state);
        }
      })
      // Remove from cart
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        const { productId, cart } = action.payload;
        state.items = state.items.filter(
          (item) => item.product?._id !== productId && item.id !== productId
        );
        if (cart) {
          state.totalItems = cart.totalItems || 0;
          state.totalPrice = cart.totalPrice || 0;
        }
        saveState('cart', state);
      })
      // Merge cart
      .addCase(mergeCartAsync.fulfilled, (state, action) => {
        const cartData = action.payload;
        if (cartData && cartData.items) {
          state.items = cartData.items;
          state.totalItems = cartData.totalItems || 0;
          state.totalPrice = cartData.totalPrice || 0;
          saveState('cart', state);
        }
      })
      // Clear cart
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
        clearState('cart');
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCartFromDB,
} = cartSlice.actions;
export default cartSlice.reducer;
