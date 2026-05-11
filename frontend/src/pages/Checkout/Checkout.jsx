import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  MapPin,
  CreditCard,
  Package,
  ArrowLeft,
  Check,
  ShoppingCart,
} from 'lucide-react';
import { clearCart } from '../../features/cart/cartSlice';

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

function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  const { items, totalPrice: dbTotal } = useSelector((state) => state.cart);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('UGX');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const total = items.reduce((sum, item) => {
    const itemPrice = item.product?.price || item.price || 0;
    const itemQty = item.quantity || 1;
    return sum + itemPrice * itemQty;
  }, 0);

  const displayTotal = dbTotal > 0 ? dbTotal : total;

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

      if (!selectedAddress && defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (items.length === 0 && !orderPlaced) {
      navigate('/cart');
    }
  }, [isAuthenticated, items, navigate, orderPlaced]);

  const formatPrice = (price) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    const symbol = CURRENCY_SYMBOLS[currency] || 'USh';
    const converted = (price || 0) * rate;
    return currency === 'UGX'
      ? `${symbol} ${Math.round(converted).toLocaleString()}`
      : `${symbol}${converted.toFixed(2)}`;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const paymentMethodMap = {
        card: 'credit_card',
        mobile: 'mobile_money',
        cod: 'cash_on_delivery',
      };

      const orderData = {
        items: items.map((item) => ({
          product: item.product?._id || item.id || item.product?.id,
          quantity: item.quantity || 1,
          price: item.product?.price || item.price,
        })),
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethodMap[paymentMethod] || paymentMethod,
        currency,
      };

      const res = await axios.post(
        'http://localhost:5000/api/v1/order',
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      setOrderId(res.data.data?._id || res.data.orderId);
      setOrderPlaced(true);
      dispatch(clearCart());
      toast.success('Order placed successfully!');
    } catch (err) {
      console.error('Failed to place order:', err);
      const message =
        err?.response?.data?.message || 'Failed to place order. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="pt-32 pb-24 px-8 bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Placed Successfully!
            </h1>
            <p className="text-gray-600 mb-2">
              Thank you for your purchase. Your order has been confirmed.
            </p>
            <p className="text-gray-600 mb-6">
              Order ID: <span className="font-semibold">{orderId}</span>
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/orders"
                className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                View Orders
              </Link>
              <Link
                to="/products"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  const addresses = user?.addresses || [];

  return (
    <div className="pt-32 pb-24 px-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center text-gray-600 hover:text-orange-500 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              1
            </div>
            <span className="ml-2 font-medium">Shipping</span>
          </div>
          <div className="w-20 h-1 bg-gray-200 mx-4">
            <div
              className={`h-full bg-orange-500 transition-all ${
                step > 1 ? 'w-full' : 'w-0'
              }`}
            />
          </div>
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Payment</span>
          </div>
          <div className="w-20 h-1 bg-gray-200 mx-4">
            <div
              className={`h-full bg-orange-500 transition-all ${
                step > 2 ? 'w-full' : 'w-0'
              }`}
            />
          </div>
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 3
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              3
            </div>
            <span className="ml-2 font-medium">Confirm</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Address
                </h2>

                {addresses.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {addresses.map((address) => (
                      <label
                        key={address._id}
                        className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          selectedAddress?._id === address._id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddress?._id === address._id}
                          onChange={() => setSelectedAddress(address)}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">
                            {address.label}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.street}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.country}
                          </p>
                          {address.isDefault && (
                            <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 mb-6">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No addresses saved</p>
                    <Link
                      to="/profile"
                      className="text-orange-500 hover:underline"
                    >
                      Add an address in your profile
                    </Link>
                  </div>
                )}

                <button
                  onClick={() => selectedAddress && setStep(2)}
                  disabled={!selectedAddress}
                  className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Method
                </h2>

                <div className="space-y-4 mb-6">
                  <label
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Credit/Debit Card
                      </p>
                      <p className="text-sm text-gray-600">
                        Pay with Visa, Mastercard, or other cards
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === 'mobile'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="mobile"
                      checked={paymentMethod === 'mobile'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="w-5 h-5 mr-3 flex items-center justify-center text-gray-600 font-bold">
                      M
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Mobile Money
                      </p>
                      <p className="text-sm text-gray-600">
                        Pay with MTN MoMo, Airtel Money
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === 'cod'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="w-5 h-5 mr-3 flex items-center justify-center text-gray-600 font-bold">
                      $
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Cash on Delivery
                      </p>
                      <p className="text-sm text-gray-600">
                        Pay when you receive your order
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Continue to Review
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Review Your Order
                </h2>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Shipping To:
                  </h3>
                  <p className="text-gray-600">
                    {selectedAddress?.street}
                    <br />
                    {selectedAddress?.city}, {selectedAddress?.state}{' '}
                    {selectedAddress?.zipCode}
                    <br />
                    {selectedAddress?.country}
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Payment Method:
                  </h3>
                  <p className="text-gray-600 capitalize">
                    {paymentMethod === 'card' && 'Credit/Debit Card'}
                    {paymentMethod === 'mobile' && 'Mobile Money'}
                    {paymentMethod === 'cod' && 'Cash on Delivery'}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Order Items:
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const itemId = item.id || item.product?._id;
                      const itemName =
                        item.name || item.product?.name || 'Product';
                      const itemPrice = item.product?.price || item.price || 0;
                      const itemImage = item.image || item.product?.image;
                      const itemQty = item.quantity || 1;

                      return (
                        <div key={itemId} className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            {itemImage ? (
                              <img
                                src={itemImage}
                                alt={itemName}
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
                              {itemName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {itemQty}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900">
                            {formatPrice(itemPrice * itemQty)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {loading
                      ? 'Placing Order...'
                      : `Place Order - ${formatPrice(displayTotal)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatPrice(displayTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(displayTotal * 0.1)}</span>
                </div>
              </div>

              <div className="border-t pt-3 mb-4">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-orange-500">
                    {formatPrice(displayTotal * 1.1)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex -space-x-2 mb-2">
                  {items.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 bg-gray-100 rounded-lg border-2 border-white overflow-hidden"
                    >
                      {item.image || item.product?.image ? (
                        <img
                          src={item.image || item.product.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          IMG
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-gray-500">
                        +{items.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
