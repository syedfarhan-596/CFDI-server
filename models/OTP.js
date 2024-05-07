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
    expiresAfterSeconds: 60 * 10,
  },
});

async function sendVerificationEmail(email, otp) {}

OTPSchema.pre("save", async function (next) {
  if (this.isNew) {
    sendVerificationEmail(this.email, this.otp);
  }
  next();
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;
