const mongoose = require("mongoose");

const OTPSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

OTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;
