const mongoose = require("mongoose");

const visitServiceSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    chargedPrice: {
      type: Number,
      required: true,
    },
    lineTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);


const visitSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    visitDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    services: {
      type: [visitServiceSchema ],
      required: true,
      validate: v => v.length > 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    // Optional but realistic
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visit", visitSchema);
