const axios = require('axios');

const BASE_URL = process.env.PESAPAL_BASE_URL; // sandbox: https://cybqa.pesapal.com/pesapalv3 | prod: https://pay.pesapal.com/v3

let _cachedToken = null;
let _tokenExpiry = null;

const getAccessToken = async () => {
  if (_cachedToken && _tokenExpiry && Date.now() < _tokenExpiry) {
    return _cachedToken;
  }

  const res = await axios.post(`${BASE_URL}/api/Auth/RequestToken`, {
    consumer_key: process.env.PESAPAL_CONSUMER_KEY,
    consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
  });

  _cachedToken = res.data.token;
  // Pesapal tokens expire in 5 minutes; refresh 30s early
  _tokenExpiry = Date.now() + 4.5 * 60 * 1000;
  return _cachedToken;
};

// Register IPN URL once (idempotent — safe to call on every server start)
exports.registerIPN = async () => {
  const token = await getAccessToken();
  const res = await axios.post(
    `${BASE_URL}/api/URLSetup/RegisterIPN`,
    {
      url: process.env.PESAPAL_IPN_URL, // e.g. https://yourapi.com/api/webhooks/pesapal
      ipn_notification_type: 'POST',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.ipn_id;
};

exports.startPayment = async (order, customer) => {
  const token = await getAccessToken();
  const ipnId = await exports.registerIPN();

  const res = await axios.post(
    `${BASE_URL}/api/Transactions/SubmitOrderRequest`,
    {
      id: order._id.toString(),
      currency: 'UGX',
      amount: Math.round(order.totalAmount),
      description: `Order #${order.orderNumber}`,
      callback_url: `${process.env.FRONTEND_URL}/payment-callback`,
      notification_id: ipnId,
      billing_address: {
        email_address: customer.email,
        phone_number: customer.phone,
        first_name: customer.name.split(' ')[0] || '',
        last_name: customer.name.split(' ').slice(1).join(' ') || '',
      },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return {
    gateway: 'pesapal',
    reference: res.data.order_tracking_id,
    redirectUrl: res.data.redirect_url,
    merchantReference: res.data.merchant_reference,
    amount: order.totalAmount,
  };
};

exports.verifyPayment = async (orderTrackingId) => {
  const token = await getAccessToken();

  const res = await axios.get(
    `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const d = res.data;
  // status_code 1 = Completed, 2 = Failed, 3 = Invalid, 0 = Pending
  return {
    success: d.status_code === 1,
    transactionId: d.confirmation_code || orderTrackingId,
    amount: d.amount,
    data: d,
  };
};
