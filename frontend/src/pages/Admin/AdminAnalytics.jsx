import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Activity, Eye, ShoppingCart, Heart, Star, Search, MousePointer } from 'lucide-react';
import { getActivitySummary, getActivities } from '../../utils/adminApi';

const ACTIVITY_ICONS = {
  view: Eye, click: MousePointer, add_to_cart: ShoppingCart,
  purchase: ShoppingCart, wishlist_add: Heart, review: Star, search: Search,
};

const ACTIVITY_COLORS = {
  view: 'bg-blue-100 text-blue-600',
  click: 'bg-indigo-100 text-indigo-600',
  add_to_cart: 'bg-orange-100 text-orange-600',
  purchase: 'bg-green-100 text-green-600',
  wishlist_add: 'bg-pink-100 text-pink-600',
  review: 'bg-amber-100 text-amber-600',
  search: 'bg-purple-100 text-purple-600',
};

// Simple horizontal bar
function HBar({ label, count, max, color = 'bg-orange-400' }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-gray-600 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-medium text-gray-700">{count}</span>
    </div>
  );
}

// Vertical bar chart (daily activity)
function DailyChart({ data }) {
  if (!data?.length) return <p className="text-gray-400 text-sm text-center py-6">No data yet</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full bg-orange-400 hover:bg-orange-500 rounded-t-sm transition-colors cursor-default"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: '2px' }}
          />
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
            {d._id}: {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// Live activity feed (latest events)
function ActivityFeed({ activities }) {
  if (!activities?.length) return <p className="text-gray-400 text-sm">No recent activity</p>;
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {activities.map((a) => {
        const Icon = ACTIVITY_ICONS[a.activityType] || Activity;
        const colorClass = ACTIVITY_COLORS[a.activityType] || 'bg-gray-100 text-gray-600';
        return (
          <div key={a._id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${colorClass}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">
                <span className="font-medium">{a.user?.firstName} {a.user?.lastName}</span>
                {' '}<span className="text-gray-500 capitalize">{a.activityType?.replace('_', ' ')}</span>
                {a.product?.name && (
                  <> <span className="text-gray-700 truncate">"{a.product.name}"</span></>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(a.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getActivitySummary(days);
      setSummary(res.data.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [days]);

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const res = await getActivities({ page: 1, limit: 30 });
      setFeed(res.data.data);
    } catch { /* non-critical */ }
    finally { setFeedLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadFeed(); }, [loadFeed]);

  const totalActivity = summary?.byType?.reduce((s, t) => s + t.count, 0) || 0;
  const maxType = Math.max(...(summary?.byType?.map((t) => t.count) || [1]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm">User behaviour and activity tracking</p>
        </div>
        {/* Period selector */}
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                days === d ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : summary ? (
        <>
          {/* Total events stat */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-5">
              <p className="text-3xl font-bold">{totalActivity.toLocaleString()}</p>
              <p className="text-sm text-orange-100 mt-1">Total events in last {days} days</p>
            </div>
            {summary.byType?.slice(0, 3).map((t) => {
              const Icon = ACTIVITY_ICONS[t._id] || Activity;
              const colorClass = ACTIVITY_COLORS[t._id] || 'bg-gray-100 text-gray-600';
              return (
                <div key={t._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{t.count.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 capitalize mt-1">{t._id?.replace('_', ' ')}</p>
                </div>
              );
            })}
          </div>

          {/* Daily activity + by type */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-1">Daily Activity</h2>
              <p className="text-xs text-gray-400 mb-4">Events per day — last {days} days</p>
              <DailyChart data={summary.dailyActivity} />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{summary.dailyActivity?.[0]?._id}</span>
                <span>{summary.dailyActivity?.at(-1)?._id}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">By Activity Type</h2>
              <div className="space-y-3">
                {summary.byType?.map((t) => (
                  <HBar key={t._id} label={t._id?.replace('_', ' ')} count={t.count} max={maxType} />
                ))}
              </div>
            </div>
          </div>

          {/* Most active users + most viewed products */}
          <div className="grid grid-cols-2 gap-6">
            {/* Most active users */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Most Active Users</h2>
                <p className="text-xs text-gray-400">By total events, last {days} days</p>
              </div>
              <div className="p-4 space-y-3">
                {summary.mostActiveUsers?.map((u, i) => (
                  <div key={u._id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold flex-shrink-0">
                      {u.user?.firstName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {u.user?.firstName} {u.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{u.user?.email}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                      {u.actions} actions
                    </span>
                  </div>
                ))}
                {(!summary.mostActiveUsers || summary.mostActiveUsers.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
                )}
              </div>
            </div>

            {/* Most viewed products */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Most Viewed Products</h2>
                <p className="text-xs text-gray-400">Views + clicks, last {days} days</p>
              </div>
              <div className="p-4 space-y-3">
                {summary.mostViewedProducts?.map((item, i) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0]?.url ? (
                        <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">USh {Math.round(Number(item.product?.price || 0) * 3650).toLocaleString()}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                      {item.views} views
                    </span>
                  </div>
                ))}
                {(!summary.mostViewedProducts || summary.mostViewedProducts.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Live activity feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Live Activity Feed</h2>
            <p className="text-xs text-gray-400">Most recent 30 events</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
        <div className="p-5">
          {feedLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ActivityFeed activities={feed} />
          )}
        </div>
      </div>
    </div>
  );
}
