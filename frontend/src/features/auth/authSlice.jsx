import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { loadState, saveState, clearState } from '../../utils/storage';

const persistedAuth = loadState('auth');

const initialState = persistedAuth || {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

// Async thunk for logout
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await axios.post(
      'http://localhost:5000/api/v1/auth/logout',
      {},
      { withCredentials: true }
    );
    return true;
  } catch {
    // Even if API call fails, we still want to clear local state
    return true;
  }
});

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.get('http://localhost:5000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      return res.data.data || res.data.user || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch profile'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
      saveState('auth', state);
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      clearState('auth');
    },

    updateUserAddress: (state, action) => {
      if (state.user) {
        state.user.addresses = action.payload;
        saveState('auth', state);
      }
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = null;
        clearState('auth');
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        // Still logout locally even if API fails
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        clearState('auth');
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        saveState('auth', state);
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { loginSuccess, logout, updateUserAddress, clearError } =
  authSlice.actions;
export default authSlice.reducer;
