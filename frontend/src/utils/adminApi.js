import axios from 'axios';

const BASE = 'http://localhost:5000/api/v1/admin';

function authHeaders() {
  try {
    const raw = localStorage.getItem('auth');
    const { token } = raw ? JSON.parse(raw) : {};
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

const get = (url, params = {}) =>
  axios.get(url, { headers: authHeaders(), params });

const post = (url, data, isFormData = false) =>
  axios.post(url, data, {
    headers: {
      ...authHeaders(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
  });

const patch = (url, data, isFormData = false) =>
  axios.patch(url, data, {
    headers: {
      ...authHeaders(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
  });

const del = (url) => axios.delete(url, { headers: authHeaders() });

// ── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = () => get(`${BASE}/dashboard`);
export const getRevenueAnalytics = (params) => get(`${BASE}/revenue`, params);

// ── Users ────────────────────────────────────────────────────────────────────
export const getUsers = (params) => get(`${BASE}/users`, params);
export const getUserDetail = (id) => get(`${BASE}/users/${id}`);
export const updateUserRole = (id, role) => patch(`${BASE}/users/${id}/role`, { role });
export const deactivateUser = (id) => patch(`${BASE}/users/${id}/deactivate`, {});
export const activateUser = (id) => patch(`${BASE}/users/${id}/activate`, {});

// ── Products ─────────────────────────────────────────────────────────────────
export const getProductStats = () => get(`${BASE}/products/stats`);
export const getLowStockProducts = (threshold = 10) =>
  get(`${BASE}/products/low-stock`, { threshold });
export const createProduct = (formData) =>
  post(`${BASE}/products`, formData, true);
export const updateProduct = (id, formData) =>
  patch(`${BASE}/products/${id}`, formData, true);
export const deleteProduct = (id) => del(`${BASE}/products/${id}`);

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = () =>
  get('http://localhost:5000/api/v1/categories');
export const createCategory = (formData) =>
  post(`${BASE}/categories`, formData, true);
export const updateCategory = (id, formData) =>
  patch(`${BASE}/categories/${id}`, formData, true);

// ── Orders ───────────────────────────────────────────────────────────────────
export const getAdminOrders = (params) => get(`${BASE}/orders`, params);
export const updateOrderStatus = (id, status, note = '') =>
  patch(`${BASE}/orders/${id}/status`, { status, note });

// ── Activities ────────────────────────────────────────────────────────────────
export const getActivities = (params) => get(`${BASE}/activities`, params);
export const getActivitySummary = (days = 7) =>
  get(`${BASE}/activities/summary`, { days });
