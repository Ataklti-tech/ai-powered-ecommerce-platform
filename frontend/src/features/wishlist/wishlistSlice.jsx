import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { loadState, saveState, clearState } from '../../utils/storage';

const persistedWishlist = loadState('wishlist');

const initialState = persistedWishlist || {
  items: [],
  loading: false,
  error: null,
};

// Async thunk for fetching wishlist from database
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.get(
        'http://localhost:5000/api/v1/wishlist',
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wishlist'
      );
    }
  }
);

// Async thunk for adding item to wishlist
export const addToWishlistAsync = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.post(
        'http://localhost:5000/api/v1/wishlist/add',
        { productId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add to wishlist'
      );
    }
  }
);

// Async thunk for removing item from wishlist
export const removeFromWishlistAsync = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.delete(
        `http://localhost:5000/api/v1/wishlist/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return { productId, wishlist: res.data.data || res.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove from wishlist'
      );
    }
  }
);

// Async thunk for clearing wishlist
export const clearWishlistAsync = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.delete('http://localhost:5000/api/v1/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to clear wishlist'
      );
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const item = action.payload;
      const exists = state.items.find(
        (i) => i.id === item.id || i._id === item.id
      );
      if (!exists) {
        state.items.push(item);
        saveState('wishlist', state);
      }
    },

    removeFromWishlist: (state, action) => {
      state.items = state.items.filter(
        (item) => item.id !== action.payload && item._id !== action.payload
      );
      saveState('wishlist', state);
    },

    clearWishlist: (state) => {
      state.items = [];
      clearState('wishlist');
    },

    setWishlistFromDB: (state, action) => {
      const wishlistData = action.payload;
      if (wishlistData && wishlistData.items) {
        state.items = wishlistData.items;
        saveState('wishlist', state);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        const wishlistData = action.payload;
        // Handle both response formats: { data: [...] } or { items: [...] }
        if (wishlistData && Array.isArray(wishlistData)) {
          state.items = wishlistData;
          saveState('wishlist', state);
        } else if (wishlistData && wishlistData.items) {
          state.items = wishlistData.items;
          saveState('wishlist', state);
        } else if (
          wishlistData &&
          wishlistData.data &&
          Array.isArray(wishlistData.data)
        ) {
          state.items = wishlistData.data;
          saveState('wishlist', state);
        }
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to wishlist
      .addCase(addToWishlistAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        state.loading = false;
        const wishlistData = action.payload;
        // Handle both response formats
        if (wishlistData && Array.isArray(wishlistData)) {
          state.items = wishlistData;
          saveState('wishlist', state);
        } else if (wishlistData && wishlistData.items) {
          state.items = wishlistData.items;
          saveState('wishlist', state);
        } else if (
          wishlistData &&
          wishlistData.data &&
          Array.isArray(wishlistData.data)
        ) {
          state.items = wishlistData.data;
          saveState('wishlist', state);
        }
      })
      .addCase(addToWishlistAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove from wishlist
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        const { wishlist, productId } = action.payload;
        if (Array.isArray(wishlist)) {
          state.items = wishlist;
        } else {
          state.items = state.items.filter((item) => {
            const id =
              item.product?._id?.toString() ||
              item.product?.toString() ||
              item._id?.toString() ||
              item.id;
            return id !== productId;
          });
        }
        saveState('wishlist', state);
      })
      // Clear wishlist
      .addCase(clearWishlistAsync.fulfilled, (state) => {
        state.items = [];
        clearState('wishlist');
      });
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  setWishlistFromDB,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
