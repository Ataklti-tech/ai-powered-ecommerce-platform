const Order = require("../../models/orderModel");
const Cart = require("../../models/cartModel");

const stripeService = require("./../../services/payment/stripeService");
const paypalService = require("./../../services/payment/paypalService");
const mtn_momoService = require("./../../services/payment/mtn_momoService");
const catchAsync = require("../../utils/constants/catchAsync");
const { Rewind } = require("lucide-react");

// paypal service webhook handler
// POST /api/webhooks/paypal
exports.handlePaypalWebhook = catchAsync(async (req, res) => {
  try {
    const payload = req.body;

    // Verify PayPal webhook signature for production

    console.log("PayPal webhook received:", payload.event_type);

    // Handle successful payment capture
    if (payload.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderNumber = payload.resource.purchase_units[0].reference_id;
      const transactionId = payload.resource.id;

      if (!orderNumber) {
        console.error("No order reference in PayPal webhook payload");
        return res.status(400).json({
          status: "error",
          message: "Order reference not found",
        });
      }

      const order = await Order.findOne({ orderNumber: orderNumber });

      if (!order) {
        console.error("Order not found:", orderNumber);
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      // Only update if not already paid
      if (order.payment.status !== "paid") {
        // Use PayPal service to verify (extra security)
        try {
          const verificationResult = await paypalService.verifyPayment(
            payload.resource.id
          );

          if (verificationResult.success) {
            order.payment.status = "paid";
            order.payment.transactionId = transactionId;
            order.payment.paidAt = new Date();
            order.payment.gatewayResponse = payload.resource;
            order.status = "confirmed";

            order.statusHistory.push({
              status: "confirmed",
              timestamp: new Date(),
              note: "Payment confirmed via PayPal webhook",
            });

            await order.save();

            // Clear user's cart
            await Cart.findOneAndDelete({ user: order.user });

            console.log(
              "Order updated successfully via PayPal webhook:",
              order._id
            );

            // Send confirmation email
            // await sendOrderConfirmationEmail(order);
          }
        } catch (verifyError) {
          console.error("PayPal verification error:", verifyError);
          // Continue anyway as webhook is already from PayPal
        }
      }
    }

    // Handle failed payment
    if (payload.event_type === "PAYMENT.CAPTURE.DENIED") {
      const orderNumber = payload.resource.purchase_units[0].reference_id;

      if (orderNumber) {
        const order = await Order.findOne({ orderNumber: orderNumber });

        if (order && order.payment.status !== "failed") {
          order.payment.status = "failed";
          order.payment.failedAt = new Date();
          order.payment.failureReason = "Payment denied by PayPal";
          order.payment.gatewayResponse = payload.resource;
          order.status = "cancelled";

          await order.save();

          console.log("Order marked as failed via PayPal webhook:", order._id);
        }
      }
    }

    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    res.status(200).json({ status: "error", message: error.message });
  }
});

// stripe service webhook handler
// POST /api/webhooks/stripe
exports.handleStripeWebhook = catchAsync(async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripeService.verifyWebhookSignature(req.body, sig);
    } catch (err) {
      console.error(
        "Stripe webhook signature verification failed: ",
        err.message
      );
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("Stripe webhook received: ", event.type);

    // Handle successful payment
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      if (!orderId) {
        console.error("No orderId in Stripe payment intent metadata");
        return res.status(400).json({ error: "Order ID not found" });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        console.error("Order not found:", orderId);
        return res.status(404).json({ error: "Order not found" });
      }

      // Only update if not already paid
      if (order.payment.status !== "paid") {
        // Use Stripe service to verify (extra security)
        const verificationResult = await stripeService.verifyPayment(
          paymentIntent.id
        );

        if (verificationResult.success) {
          order.payment.status = "paid";
          order.payment.transactionId = paymentIntent.id;
          order.payment.paidAt = new Date();
          order.payment.gatewayResponse = paymentIntent;
          order.status = "confirmed";

          order.statusHistory.push({
            status: "confirmed",
            timestamp: new Date(),
            note: "Payment confirmed via Stripe webhook",
          });

          await order.save();

          // Clear user's cart
          await Cart.findOneAndDelete({ user: order.user });

          console.log(
            "Order updated successfully via Stripe webhook:",
            orderId
          );

          // Send confirmation email
          // await sendOrderConfirmationEmail(order);
        }
      }
    }

    // Handle failed payment
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        const order = await Order.findById(orderId);

        if (order && order.payment.status !== "failed") {
          order.payment.status = "failed";
          order.payment.failedAt = new Date();
          order.payment.failureReason =
            paymentIntent.last_payment_error?.message || "Payment failed";
          order.payment.gatewayResponse = paymentIntent;
          order.status = "cancelled";

          await order.save();

          console.log("Order marked as failed via Stripe webhook:", orderId);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    res.status(400).json({ error: error.message });
  }
});

// mtn momo service webhook handler
// POST /api/webhooks/mtn-momo
exports.handleMTNMoMoWebhook = catchAsync(async (req, res) => {
  try {
    const payload = req.body;

    console.log("MTN MoMo webhook received:", payload);

    // Verify webhook (if MTN provides signature)
    // const signature = req.headers['x-mtn-signature'];
    // if (!signature || !verifyMTNSignature(payload, signature)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Handle successful payment
    if (payload.status === "SUCCESSFUL") {
      const referenceId = payload.referenceId;

      // Find order by gateway reference
      const order = await Order.findOne({
        "payment.gatewayReference": referenceId,
      });

      if (!order) {
        console.error("Order not found for MTN MoMo reference:", referenceId);
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      // Only update if not already paid
      if (order.payment.status !== "paid") {
        // Use MTN MoMo service to verify (extra security)
        try {
          const verificationResult = await mtnMomoService.verifyPayment(
            referenceId
          );

          if (verificationResult.success) {
            order.payment.status = "paid";
            order.payment.transactionId = referenceId;
            order.payment.paidAt = new Date();
            order.payment.gatewayResponse = payload;
            order.status = "confirmed";

            order.statusHistory.push({
              status: "confirmed",
              timestamp: new Date(),
              note: "Payment confirmed via MTN MoMo webhook",
            });

            await order.save();

            // Clear user's cart
            await Cart.findOneAndDelete({ user: order.user });

            console.log(
              "Order updated successfully via MTN MoMo webhook:",
              order._id
            );

            // Send confirmation email
            // await sendOrderConfirmationEmail(order);
          }
        } catch (verifyError) {
          console.error("MTN MoMo verification error:", verifyError);
        }
      }
    }

    // Handle failed payment
    if (payload.status === "FAILED") {
      const referenceId = payload.referenceId;

      const order = await Order.findOne({
        "payment.gatewayReference": referenceId,
      });

      if (order && order.payment.status !== "failed") {
        order.payment.status = "failed";
        order.payment.failedAt = new Date();
        order.payment.failureReason = payload.reason || "Payment failed";
        order.payment.gatewayResponse = payload;
        order.status = "cancelled";

        await order.save();

        console.log("Order marked as failed via MTN MoMo webhook:", order._id);
      }
    }

    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("MTN MoMo webhook error:", error);
    res.status(200).json({ status: "error", message: error.message });
  }
});

// handling a testing webhook
// POST /api/webhooks/test

exports.handleTestWebhook = catchAsync(async (req, res) => {
  try {
    console.log("Test webhook received:");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);

    res.status(200).json({
      status: "success",
      message: "Test webhook received",
      data: {
        headers: req.headers,
        body: req.body,
      },
    });
  } catch (error) {
    console.error("Test webhook error:", error);
    res.status(200).json({
      status: "error",
      message: error.message,
    });
  }
});

// module.exports = exports
