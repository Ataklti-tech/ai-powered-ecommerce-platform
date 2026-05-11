import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Shield, UserX, UserCheck, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { getUsers, updateUserRole, deactivateUser, activateUser, getUserDetail } from '../../utils/adminApi';

function Avatar({ name }) {
  const initials = name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  return (
    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

// ── User detail drawer ────────────────────────────────────────────────────────
function UserDetailDrawer({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getUserDetail(userId)
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load user'))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <div className="p-5 space-y-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 text-xl font-bold flex items-center justify-center">
                {data.user.firstName?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{data.user.firstName} {data.user.lastName}</p>
                <p className="text-sm text-gray-500">{data.user.email}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${data.user.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  {data.user.role}
                </span>
              </div>
            </div>

            {/* Recent orders */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Orders ({data.orders?.length || 0})</h3>
              <div className="space-y-2">
                {data.orders?.slice(0, 5).map((o) => (
                  <div key={o._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-500">#{o.orderNumber?.slice(-8)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${o.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{o.status}</span>
                    <span className="text-xs font-medium">${Number(o.totalAmount || 0).toFixed(2)}</span>
                  </div>
                ))}
                {(!data.orders || data.orders.length === 0) && (
                  <p className="text-xs text-gray-400">No orders yet</p>
                )}
              </div>
            </div>

            {/* Recent activity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity ({data.activities?.length || 0})</h3>
              <div className="space-y-1">
                {data.activities?.slice(0, 8).map((a) => (
                  <div key={a._id} className="flex items-center justify-between text-xs text-gray-500 py-1 border-b border-gray-100">
                    <span className="capitalize">{a.activityType?.replace('_', ' ')}</span>
                    <span className="text-gray-400 truncate max-w-28">{a.product?.name}</span>
                    <span>{new Date(a.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
                {(!data.activities || data.activities.length === 0) && (
                  <p className="text-xs text-gray-400">No activity recorded</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page, limit: 15, search, role: roleFilter });
      setUsers(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleRoleToggle = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRole(id, newRole);
      toast.success(`Role changed to ${newRole}`);
      load();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      if (isActive) {
        await deactivateUser(id);
        toast.success('User deactivated');
      } else {
        await activateUser(id);
        toast.success('User activated');
      }
      load();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Email', 'Role', 'Orders', 'Spent', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${u.firstName} ${u.lastName}`} />
                        <span className="font-medium text-gray-900">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.orders || 0}</td>
                    <td className="px-5 py-3 font-medium text-gray-700">${Number(u.totalSpent || 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedUserId(u._id)}
                          title="View details"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRoleToggle(u._id, u.role)}
                          title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-500 hover:text-orange-500"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u._id, true)}
                          title="Deactivate"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedUserId && (
        <UserDetailDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
