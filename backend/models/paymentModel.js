const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema({
  order: {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
    required: [true, "Payment must belong to an order"],
    index: true,
  },

  user: {},
});
