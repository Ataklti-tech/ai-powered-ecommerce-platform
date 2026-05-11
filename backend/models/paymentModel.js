const mongoose = require('mongoose');
const User = require('./userModel');

const paymentSchema = mongoose.Schema({
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    required: [true, 'Payment must belong to an order'],
    index: true,
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Payment must belong to a user'],
    index: true,
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['mobile_money', 'card', 'paypal', 'stripe'],
    },
    message: '{VALUE} is not supported',
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: [
        'pending',
        'processing',
        'succeeded',
        'failed',
        'cancelled',
        'refunded',
      ],
    },
  },
});
