import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { getAdminOrders, updateOrderStatus } from '../../utils/adminApi';

const STATUSES = ['', 'pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned'];

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipping: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
  returned: 'bg-gray-100 text-gray-600',
};

const PAYMENT_COLORS = {
  pending: 'text-amber-600',
  completed: 'text-green-600',
  failed: 'text-red-500',
  refunded: 'text-blue-500',
};

// ── Order detail modal ────────────────────────────────────────────────────────
function OrderModal({ order, onClose, onStatusUpdate }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOrderStatus(order._id, status, note);
      toast.success('Order status updated');
      onStatusUpdate();
      onClose();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => `USh ${Math.round(Number(n || 0) * 3650).toLocaleString()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-900">Order #{order.orderNumber?.slice(-10)}</h2>
            <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {/* Customer */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Customer</p>
            <p className="text-sm text-gray-800">{order.user?.firstName} {order.user?.lastName}</p>
            <p className="text-sm text-gray-500">{order.user?.email}</p>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0]?.url ? (
                      <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.product?.name || 'Product'}</p>
                    <p className="text-xs text-gray-400">× {item.quantity} @ {fmt(item.price)}</p>
                  </div>
                  <p className="text-sm font-semibold">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Tax</span><span>{fmt(order.tax)}</span></div>
            {order.discount?.amount > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>-{fmt(order.discount.amount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t pt-1"><span>Total</span><span>{fmt(order.totalAmount)}</span></div>
          </div>

          {/* Update status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Status</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2"
            >
              {STATUSES.slice(1).map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders({ page, limit: 20, status: statusFilter });
      setOrders(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n) => `USh ${Math.round(Number(n || 0) * 3650).toLocaleString()}`;

  const filtered = search
    ? orders.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
          `${o.user?.firstName} ${o.user?.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{total} total orders</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order # or customer…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No orders found</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">#{o.orderNumber?.slice(-8)}</td>
                    <td className="px-5 py-3 text-gray-600">{o.user?.firstName} {o.user?.lastName}</td>
                    <td className="px-5 py-3 text-gray-500">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{fmt(o.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium capitalize ${PAYMENT_COLORS[o.payment?.status] || 'text-gray-500'}`}>
                        {o.payment?.status || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-xs font-medium text-orange-500 hover:text-orange-600"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
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

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusUpdate={load} />
      )}
    </div>
  );
}
