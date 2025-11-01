const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        subtotal: Number,
      },
    ],
    // Pricing
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    discount: {
      code: String,
      amount: {
        type: Number,
        default: 0,
      },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    // Shipping Address
    shippingAddress: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String,
    },
    // Billing Address
    billingAddress: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    // Payment
    payment: {
      method: {
        type: String,
        enum: [
          "credit_card",
          "debit_card",
          "paypal",
          "mobile_money",
          "cash_on_delivery",
        ],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
    },
    // Shipping
    shipping: {
      carrier: String,
      trackingNumber: String,
      estimatedDelivery: Date,
      actualDelivery: Date,
    },
    // Order Status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],

    // Additional
    notes: String,
    cancelledAt: Date,
    cancelReason: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
