const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = () => process.env.MTN_MOMO_BASE_URL;
const SUBSCRIPTION_KEY = () => process.env.MTN_MOMO_SUBSCRIPTION_KEY;

const getAccessToken = async () => {
  const credentials = Buffer.from(
    `${process.env.MTN_MOMO_API_USER}:${process.env.MTN_MOMO_API_KEY}`
  ).toString('base64');

  const res = await axios.post(
    `${BASE_URL()}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY(),
      },
    }
  );
  return res.data.access_token;
};

exports.startPayment = async (order, customer) => {
  const token = await getAccessToken();
  const referenceId = uuidv4();

  // Strip non-digits and normalise to international format for Uganda
  const phone = (customer.phone || '').replace(/\D/g, '').replace(/^0/, '256');

  await axios.post(
    `${BASE_URL()}/collection/v1_0/requesttopay`,
    {
      amount: String(Math.round(order.totalAmount)),
      currency: 'UGX',
      externalId: order._id.toString(),
      payer: { partyIdType: 'MSISDN', partyId: phone },
      payerMessage: `Payment for order #${order.orderNumber}`,
      payeeNote: `Order #${order.orderNumber}`,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': process.env.MTN_MOMO_ENV || 'sandbox', // 'sandbox' | 'mtnuganda'
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY(),
        'Content-Type': 'application/json',
        ...(process.env.MTN_MOMO_CALLBACK_URL && {
          'X-Callback-Url': process.env.MTN_MOMO_CALLBACK_URL,
        }),
      },
    }
  );

  return {
    gateway: 'mtn_momo',
    reference: referenceId,
    amount: order.totalAmount,
    // 202 Accepted — customer will get USSD prompt on their phone
    message: 'USSD payment request sent. Customer must approve on their phone.',
  };
};

exports.verifyPayment = async (referenceId) => {
  const token = await getAccessToken();

  const res = await axios.get(
    `${BASE_URL()}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Target-Environment': process.env.MTN_MOMO_ENV || 'sandbox',
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY(),
      },
    }
  );

  const d = res.data;
  return {
    success: d.status === 'SUCCESSFUL',
    transactionId: d.financialTransactionId || referenceId,
    amount: parseFloat(d.amount),
    data: d,
  };
};
