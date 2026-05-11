import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Eye,
} from 'lucide-react';
import { getDashboardStats, getRevenueAnalytics } from '../../utils/adminApi';

// ── Mini bar chart (CSS only) ────────────────────────────────────────────────
function BarChart({ data }) {
  if (!data || data.length === 0) return <p className="text-gray-400 text-sm">No data</p>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.slice(-30).map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-orange-400 rounded-sm hover:bg-orange-500 transition-colors"
            style={{ height: `${(d.revenue / max) * 100}%`, minHeight: '2px' }}
            title={`${d._id}: USh ${Math.round((d.revenue || 0) * 3650).toLocaleString()}`}
          />
        </div>
      ))}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, growth }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {growth !== undefined && (
          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              growth >= 0
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {growth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipping: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
  returned: 'bg-gray-100 text-gray-600',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getRevenueAnalytics({ period: 'daily', year: new Date().getFullYear() }),
    ])
      .then(([statsRes, revenueRes]) => {
        setStats(statsRes.data.data);
        setRevenue(revenueRes.data.data);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const { overview, recentOrders, topProducts, ordersByStatus, dailyRevenue } =
    stats;

  const fmt = (n) => `USh ${Math.round(Number(n || 0) * 3650).toLocaleString()}`;
  const fmtNum = (n) => Number(n || 0).toLocaleString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back — here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={fmt(overview.totalRevenue)}
          sub={`This month: ${fmt(overview.revenueThisMonth)}`}
          color="bg-orange-500"
          growth={overview.revenueGrowthPercent}
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={fmtNum(overview.totalOrders)}
          sub={`This month: ${fmtNum(overview.ordersThisMonth)}`}
          color="bg-blue-500"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={fmtNum(overview.totalUsers)}
          sub={`New this month: ${fmtNum(overview.newUsersThisMonth)}`}
          color="bg-purple-500"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={fmtNum(overview.totalProducts)}
          sub={`Active: ${fmtNum(overview.activeProducts)}`}
          color="bg-green-500"
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={fmtNum(overview.pendingOrders)}
          color="bg-amber-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={fmtNum(overview.lowStockProducts)}
          color="bg-red-500"
        />
      </div>

      {/* ── Revenue chart + Order status ── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Daily Revenue chart */}
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Daily Revenue</h2>
              <p className="text-xs text-gray-400">Last 30 days</p>
            </div>
            <span className="text-2xl font-bold text-orange-500">
              {fmt(overview.revenueThisMonth)}
            </span>
          </div>
          <BarChart data={dailyRevenue} />
        </div>

        {/* Orders by status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {Object.entries(ordersByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}
                >
                  {status}
                </span>
                <span className="text-sm font-semibold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Revenue by category ── */}
      {revenue?.revenueByCategory?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue by Category</h2>
          <div className="space-y-3">
            {revenue.revenueByCategory.slice(0, 6).map((cat) => {
              const max = revenue.revenueByCategory[0].revenue || 1;
              const pct = Math.round((cat.revenue / max) * 100);
              return (
                <div key={cat._id} className="flex items-center gap-4">
                  <span className="w-28 text-sm text-gray-600 truncate">
                    {cat._id || 'Uncategorized'}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-orange-400 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 text-sm text-right font-medium text-gray-700">
                    {fmt(cat.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent orders + Top products ── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Order', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders?.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      #{order.orderNumber?.slice(-8)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {order.user?.firstName} {order.user?.lastName}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900">
                      {fmt(order.totalAmount)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Top Products</h2>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className="p-4 space-y-3">
            {topProducts?.map((item, i) => (
              <div key={item._id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {item.product?.images?.[0]?.url ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product?.name}
                  </p>
                  <p className="text-xs text-gray-400">{item.totalSold} sold</p>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {fmt(item.revenue)}
                </span>
              </div>
            ))}
            {(!topProducts || topProducts.length === 0) && (
              <p className="text-center text-gray-400 text-sm py-4">
                No sales data yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
