import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Package,
  MapPin,
  CreditCard,
  Clock,
  ChevronRight,
  Eye,
} from 'lucide-react';

const EXCHANGE_RATES = {
  USD: 1,
  UGX: 3650,
  KES: 150,
  EUR: 0.92,
  GBP: 0.79,
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  UGX: 'USh',
  KES: 'KSh',
  EUR: '€',
  GBP: '£',
};

const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currency, setCurrency] = useState('UGX');

  // Determine currency based on user's address
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const defaultAddress =
        user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
      const country = (defaultAddress.country || '').toLowerCase();

      if (country === 'uganda') {
        setCurrency('UGX');
      } else if (country === 'kenya') {
        setCurrency('KES');
      } else if (country === 'uk' || country === 'united kingdom') {
        setCurrency('GBP');
      } else if (
        country === 'germany' ||
        country === 'france' ||
        country === 'spain' ||
        country === 'italy'
      ) {
        setCurrency('EUR');
      } else {
        setCurrency('UGX');
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!token) return;
    fetchOrders();
  }, [isAuthenticated, navigate, token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/v1/order', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];
      setOrders(list);
    } catch (err) {
      console.error('Failed to fetch orders:', err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    const symbol = CURRENCY_SYMBOLS[currency] || 'USh';
    const converted = (price || 0) * rate;
    return currency === 'UGX'
      ? `${symbol} ${Math.round(converted).toLocaleString()}`
      : `${symbol}${converted.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 px-8">
        <div className="max-w-[1400px] mx-auto text-center">
          <div className="text-gray-500">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Orders Yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your
              orders here.
            </p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id || order.id}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Order #
                      {order.orderNumber || order._id?.slice(-8) || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(order.createdAt || order.orderDate)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      ORDER_STATUS_COLORS[order.status?.toLowerCase()] ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.status || 'Pending'}
                  </span>
                </div>

                {/* Order Items Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex -space-x-2">
                    {(order.items || order.products || [])
                      .slice(0, 3)
                      .map((item, idx) => {
                        const imgUrl =
                          item.image ||
                          item.product?.image?.url ||
                          item.product?.images?.[0]?.url;
                        return (
                        <div
                          key={idx}
                          className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-white overflow-hidden"
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={item.name || item.product?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No IMG
                            </div>
                          )}
                        </div>
                        );
                      })}
                    {(order.items || order.products || []).length > 3 && (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center">
                        <span className="text-sm text-gray-500">
                          +{(order.items || order.products || []).length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      {(order.items || order.products || []).length} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-500">
                      {formatPrice(order.totalAmount || order.totalPrice || order.total || 0)}
                    </p>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() =>
                      setSelectedOrder(
                        selectedOrder === order._id ? null : order._id
                      )
                    }
                    className="flex items-center text-orange-500 hover:text-orange-600 font-medium"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {selectedOrder === order._id
                      ? 'Hide Details'
                      : 'View Details'}
                  </button>
                  <Link
                    to={`/orders/${order._id}`}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    View Full Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>

                {/* Order Details */}
                {selectedOrder === order._id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Order Details
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Shipping Address */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Shipping Address
                        </h5>
                        <div className="text-sm text-gray-600">
                          <p>{order.shippingAddress?.street || 'N/A'}</p>
                          <p>
                            {order.shippingAddress?.city},{' '}
                            {order.shippingAddress?.state}
                          </p>
                          <p>{order.shippingAddress?.country}</p>
                          <p>{order.shippingAddress?.zipCode}</p>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <CreditCard className="w-4 h-4 mr-1" />
                          Payment
                        </h5>
                        <div className="text-sm text-gray-600">
                          <p className="capitalize">
                            {(order.payment?.method || 'credit_card').replace(/_/g, ' ')}
                          </p>
                          <p className="capitalize">
                            {order.payment?.status || 'pending'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="mt-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Items
                      </h5>
                      <div className="space-y-3">
                        {(order.items || order.products || []).map(
                          (item, idx) => {
                            const detailImgUrl =
                              item.image ||
                              item.product?.image?.url ||
                              item.product?.images?.[0]?.url;
                            return (
                            <div
                              key={idx}
                              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="w-12 h-12 bg-white rounded-lg overflow-hidden">
                                {detailImgUrl ? (
                                  <img
                                    src={detailImgUrl}
                                    alt={item.name || item.product?.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    IMG
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {item.name || item.product?.name || 'Product'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity || 1}
                                </p>
                              </div>
                              <p className="font-medium text-gray-900">
                                {formatPrice(item.price * (item.quantity || 1))}
                              </p>
                            </div>
                          );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
