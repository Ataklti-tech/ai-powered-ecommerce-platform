import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { deleteProduct, getProductStats, getLowStockProducts } from '../../utils/adminApi';

function authHeaders() {
  try {
    const { token } = JSON.parse(localStorage.getItem('auth') || '{}');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  out_of_stock: 'bg-red-100 text-red-500',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [tab, setTab] = useState('all'); // 'all' | 'low-stock'

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('keyword', search);
      const res = await axios.get(
        `http://localhost:5000/api/v1/products?${params}`,
        { headers: authHeaders() }
      );
      const data = res.data;
      setProducts(data.data || []);
      setTotal(data.totalProducts || data.total || 0);
      setPages(Math.ceil((data.totalProducts || data.total || 1) / 15));
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadStats = useCallback(async () => {
    try {
      const [statsRes, lowRes] = await Promise.all([
        getProductStats(),
        getLowStockProducts(10),
      ]);
      setStats(statsRes.data.data);
      setLowStock(lowRes.data.data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      setDeleteId(null);
      loadProducts();
      loadStats();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const displayProducts = tab === 'low-stock' ? lowStock : products;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{total} total products</p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Stats mini cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.totalProducts, color: 'border-blue-200 bg-blue-50', text: 'text-blue-700' },
            { label: 'Active', value: stats.activeProducts, color: 'border-green-200 bg-green-50', text: 'text-green-700' },
            { label: 'Out of Stock', value: stats.outOfStock, color: 'border-red-200 bg-red-50', text: 'text-red-600' },
            { label: 'Low Stock', value: stats.lowStock, color: 'border-amber-200 bg-amber-50', text: 'text-amber-700' },
          ].map((s) => (
            <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + search */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'all' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}
          >
            All Products
          </button>
          <button
            onClick={() => setTab('low-stock')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'low-stock' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock {lowStock.length > 0 && `(${lowStock.length})`}
          </button>
        </div>
        {tab === 'all' && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : displayProducts.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No products found</td></tr>
              ) : (
                displayProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-48">{p.name}</p>
                          {p.discount > 0 && (
                            <span className="text-xs text-orange-500 font-medium">{p.discount}% off</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{p.category?.name || p.category || '—'}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">USh {Math.round(Number(p.price || 0) * 3650).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`font-medium ${p.stock <= 0 ? 'text-red-500' : p.stock <= 10 ? 'text-amber-600' : 'text-gray-700'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {p.status || 'active'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/admin/products/${p._id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(p._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {tab === 'all' && pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Delete Product</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone. The product will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
