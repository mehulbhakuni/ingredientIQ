const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Primary lookup key — must be unique across the collection
    barcode: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
      trim:     true,
    },

    productName: { type: String, required: true, trim: true },
    brandName:   { type: String, default: "",    trim: true },
    ingredients: { type: String, required: true },

    // Image URLs only — never raw bytes in MongoDB
    // In dev: data URI strings. In production: Cloudinary URLs.
    frontImageUrl:      { type: String, default: "" },
    ingredientImageUrl: { type: String, default: "" },

    // "openfoodfacts" = auto-saved from OFF API
    // "user"          = contributed manually by a user
    source: {
      type:    String,
      enum:    ["openfoodfacts", "user"],
      default: "user",
    },

    // false = pending admin review (user-contributed products)
    // true  = trusted (auto-sourced from Open Food Facts, or admin-approved)
    verified: { type: Boolean, default: false, index: true },

    // null for auto-sourced products, ObjectId for user contributions
    contributorUserId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "User",
      default: null,
    },

    // Raw data from Open Food Facts (stored for reference, not displayed)
    allergens:  { type: [String], default: [] },
    nutriments: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
