const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = process.env.AIRTEL_BASE_URL; // sandbox: https://openapiuat.airtel.africa | prod: https://openapi.airtel.africa

let _cachedToken = null;
let _tokenExpiry = null;

const getAccessToken = async () => {
  if (_cachedToken && _tokenExpiry && Date.now() < _tokenExpiry) {
    return _cachedToken;
  }

  const res = await axios.post(
    `${BASE_URL}/auth/oauth2/token`,
    {
      client_id: process.env.AIRTEL_CLIENT_ID,
      client_secret: process.env.AIRTEL_CLIENT_SECRET,
      grant_type: 'client_credentials',
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  _cachedToken = res.data.access_token;
  // expires_in is in seconds; refresh 30s early
  _tokenExpiry = Date.now() + (res.data.expires_in - 30) * 1000;
  return _cachedToken;
};

exports.startPayment = async (order, customer) => {
  const token = await getAccessToken();
  const transactionId = uuidv4();

  // Normalise phone: strip non-digits, remove leading 0, ensure 256 prefix
  const phone = (customer.phone || '').replace(/\D/g, '').replace(/^0/, '256');

  const res = await axios.post(
    `${BASE_URL}/merchant/v2/payments/`,
    {
      reference: order.orderNumber,
      subscriber: {
        country: 'UG',
        currency: 'UGX',
        msisdn: phone,
      },
      transaction: {
        amount: Math.round(order.totalAmount),
        country: 'UG',
        currency: 'UGX',
        id: transactionId,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Country': 'UG',
        'X-Currency': 'UGX',
        'Content-Type': 'application/json',
      },
    }
  );

  const d = res.data;
  return {
    gateway: 'airtel',
    reference: transactionId,
    amount: order.totalAmount,
    status: d.status?.response_code,
    message: d.status?.message || 'USSD prompt sent to customer phone.',
  };
};

exports.verifyPayment = async (transactionId) => {
  const token = await getAccessToken();

  const res = await axios.get(
    `${BASE_URL}/standard/v1/payments/${transactionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Country': 'UG',
        'X-Currency': 'UGX',
      },
    }
  );

  const d = res.data;
  // DP00800001006 = success
  const success = d.status?.response_code === 'DP00800001006' || d.data?.transaction?.status === 'TS';

  return {
    success,
    transactionId: d.data?.transaction?.id || transactionId,
    amount: d.data?.transaction?.amount,
    data: d,
  };
};
