import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Fetch AI recommendations
export const fetchRecommendations = createAsyncThunk(
  'recommendations/fetch',
  async (limit = 10, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await fetch(
        `${API_URL}/ai/recommendations?limit=${limit}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(
          error.message || 'Failed to fetch recommendations'
        );
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch smart "For You" recommendations (auth required)
// Returns "trending_for_you" for new users, "recommended_for_you" for returning users
export const fetchForYouRecommendations = createAsyncThunk(
  'recommendations/fetchForYou',
  async (limit = 10, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await fetch(
        `${API_URL}/ai/for-you?limit=${limit}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch recommendations');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch homepage recommendations (public)
export const fetchHomepageRecommendations = createAsyncThunk(
  'recommendations/fetchHomepage',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/ai/homepage?limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(
          error.message || 'Failed to fetch recommendations'
        );
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch similar products
export const fetchSimilarProducts = createAsyncThunk(
  'recommendations/fetchSimilar',
  async ({ productId, limit = 5 }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/ai/similar/${productId}?limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(
          error.message || 'Failed to fetch similar products'
        );
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Track user event
export const trackRecommendationEvent = createAsyncThunk(
  'recommendations/trackEvent',
  async ({ eventType, productId, metadata = {} }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      if (!token) {
        return rejectWithValue('User not authenticated');
      }

      const response = await fetch(`${API_URL}/ai/track`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          productId,
          metadata,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to track event');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const recommendationSlice = createSlice({
  name: 'recommendations',
  initialState: {
    items: [],
    homepageItems: [],
    similarItems: [],
    loading: false,
    homepageLoading: false,
    similarLoading: false,
    error: null,
    homepageError: null,
    similarError: null,
    type: null,
    homepageType: null,
  },
  reducers: {
    clearRecommendations: (state) => {
      state.items = [];
      state.type = null;
      state.error = null;
    },
    clearHomepageRecommendations: (state) => {
      state.homepageItems = [];
      state.homepageType = null;
      state.homepageError = null;
    },
    clearSimilarProducts: (state) => {
      state.similarItems = [];
      state.similarError = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.homepageError = null;
      state.similarError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch personalized recommendations
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.recommendations || [];
        state.type = action.payload.type;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch "for you" recommendations (new-user vs returning-user smart endpoint)
      .addCase(fetchForYouRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForYouRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.recommendations || [];
        state.type = action.payload.type;
      })
      .addCase(fetchForYouRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch homepage recommendations
      .addCase(fetchHomepageRecommendations.pending, (state) => {
        state.homepageLoading = true;
        state.homepageError = null;
      })
      .addCase(fetchHomepageRecommendations.fulfilled, (state, action) => {
        state.homepageLoading = false;
        state.homepageItems = action.payload.recommendations || [];
        state.homepageType = action.payload.type;
      })
      .addCase(fetchHomepageRecommendations.rejected, (state, action) => {
        state.homepageLoading = false;
        state.homepageError = action.payload;
      })

      // Fetch similar products
      .addCase(fetchSimilarProducts.pending, (state) => {
        state.similarLoading = true;
        state.similarError = null;
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
        state.similarLoading = false;
        state.similarItems = action.payload || [];
      })
      .addCase(fetchSimilarProducts.rejected, (state, action) => {
        state.similarLoading = false;
        state.similarError = action.payload;
      })

      // Track event
      .addCase(trackRecommendationEvent.fulfilled, () => {
      })
      .addCase(trackRecommendationEvent.rejected, (state, action) => {
        // Silently fail - don't show error to user
        console.warn('Failed to track event:', action.payload);
      });
  },
});

export const {
  clearRecommendations,
  clearHomepageRecommendations,
  clearSimilarProducts,
  clearErrors,
} = recommendationSlice.actions;

export default recommendationSlice.reducer;
