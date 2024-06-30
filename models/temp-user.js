const mongoose = require("mongoose");
const { InternshipStatus } = require("./internship-status");

const TempUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
      unique: true,
      required: [true, "Please provide your email"],
    },
    number: {
      type: Number,
      match: [/^([+]\d{2})?\d{10}$/, "Please provide a valid phone number"],
    },
    name: {
      first: { type: String, required: [true, "Please provide first name"] },
      last: { type: String, required: [true, "Please provide last name"] },
    },
    internshipDomain: {
      type: String,
      required: [true, "Please provide internship domain"],
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
    },
    resume: {
      type: String,
      required: [true, "Please provide resume"],
    },
    status: { type: InternshipStatus, default: {} },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TempUser", TempUserSchema);
