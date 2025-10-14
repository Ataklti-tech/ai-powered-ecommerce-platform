const mongoose = require("mongoose");
const validator = require("validator");

const User = mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "name is required"]
  }
});
