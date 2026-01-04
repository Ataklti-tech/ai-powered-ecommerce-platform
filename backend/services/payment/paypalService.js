const axios = require("axios");

const baseURL = process.env.PAYPAL_BASEURL;
const getAccessToken = async () => {
  const response = await axios.post(
    `${baseURL}/v1/oauth2/token`,
    "grant_type = client_credentials",
    {
      auth: {
        username: process.env.PAYPAL_CLIENTID,
        password: process.env.PAYPAL_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
};

exports.startPayment = async (order, customer) => {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    `${baseURL}/v1/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.orderNumber,
          amount: {
            currency_code: "USD",
            value: order.totalAmount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${process.env.PAYPAL_REDIRECT_BASE_URL}/payment-success`,
        cancel_url: `${process.env.PAYPAL_REDIRECT_BASE_URL}/payment-cancel`,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const approvalLink = response.data.links.find(
    (l) => l.rel === "approve"
  ).href;

  return {
    gateway: "paypal",
    reference: response.data.id,
    approvalUrl: approvalLink,
    amount: order.totalAmount,
  };
};
exports.verifyPayment = async (orderId) => {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    `${baseURL}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const capture = response.data.purchase_units[0].payments.captures[0];

  return {
    success: capture.status === "COMPLETED",
    transactionId: capture.id,
    amount: parseFloat(capture.amount.value),
    data: response.data,
  };
};
