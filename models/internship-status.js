const mongoose = require("mongoose");

const InternshipStatus = new mongoose.Schema({
  submissionDeadline: {
    type: Date,
  },
  offerLetter: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  tasks: [{ taskName: String, keyPoints: [String] }],
  taskSubmission: [
    { taskName: String, linkedIn: String, github: String, liveLink: String },
  ],
  taskVerified: {
    type: Boolean,
    default: false,
  },
  completionCertificate: {
    type: String,
  },
});

module.exports = { InternshipStatus };
