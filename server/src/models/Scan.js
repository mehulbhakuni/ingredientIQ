const mongoose = require("mongoose");

const flaggedItemSchema = new mongoose.Schema({
  ingredient: String,
  reason:     String,
  severity:   { type: String, enum: ["high", "medium", "low"] },
}, { _id: false });

const scanSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scanType:    { type: String, enum: ["ocr", "barcode", "paste"], default: "paste" },
    productName: { type: String, default: "Unknown Product" },
    brandName:   { type: String, default: "" },
    barcode:     { type: String, default: "" },
    imageUrl:    { type: String, default: "" },
    healthScore: { type: Number, min: 0, max: 100, default: null },
    ingredients: { type: String, required: true },
    verdict:     { type: String, enum: ["safe", "caution", "avoid"], required: true },
    summary:     { type: String },
    flagged:     { type: [flaggedItemSchema], default: [] },
    safe_note:   { type: String },
    profileSnapshot: {
      conditions: [String],
      allergies:  [String],
      diets:      [String],
      custom:     String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scan", scanSchema);
