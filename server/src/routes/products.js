const express = require("express");
const Product = require("../models/Product");
const auth    = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────

// Fetch a product from Open Food Facts and normalise the shape
async function fetchFromOFF(barcode) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

  let res;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "IngredientIQ/1.0 (https://github.com/mehulbhakuni/ingredientiq)" },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });
  } catch {
    return null; // network error or timeout — treat as not found
  }

  if (!res.ok) return null;

  const data = await res.json();
  if (data.status === 0 || !data.product) return null;

  const p = data.product;
  const ingredients = (p.ingredients_text || p.ingredients_text_en || "").trim();
  if (!ingredients) return null; // product exists but has no ingredient data — useless for us

  return {
    productName: [p.product_name, p.product_name_en].find(Boolean)?.trim() || "Unknown Product",
    brandName:   p.brands?.split(",")[0]?.trim() || "",
    ingredients,
    frontImageUrl: p.image_front_url || p.image_url || "",
    allergens:     p.allergens_tags  || [],
    nutriments:    p.nutriments      || {},
  };
}

// Shape a Product document into the response the frontend expects
function formatProduct(doc) {
  return {
    barcode:      doc.barcode,
    productName:  doc.productName,
    brandName:    doc.brandName,
    ingredients:  doc.ingredients,
    imageUrl:     doc.frontImageUrl,
    allergens:    doc.allergens,
    nutriments:   doc.nutriments,
    source:       doc.source,
    verified:     doc.verified,
  };
}

// ── GET /api/products/:barcode ────────────────────────────
// Priority lookup:
//   1. IngredientIQ Product collection
//   2. Open Food Facts (auto-saves on hit)
//   3. 404 with notFound flag
router.get("/:barcode", async (req, res) => {
  const { barcode } = req.params;

  if (!barcode || barcode.trim().length < 4)
    return res.status(400).json({ error: "Invalid barcode." });

  // ── Step 1: Check our own database first ─────────────────
  try {
    const existing = await Product.findOne({ barcode: barcode.trim() });
    if (existing && existing.ingredients) {
      return res.json({ product: formatProduct(existing), foundIn: "database" });
    }
  } catch (err) {
    console.error("Product DB lookup error:", err.message);
    // Don't fail — fall through to Open Food Facts
  }

  // ── Step 2: Try Open Food Facts ───────────────────────────
  const offData = await fetchFromOFF(barcode.trim());

  if (offData) {
    // Step 3: Save to our database for future lookups
    try {
      const saved = await Product.findOneAndUpdate(
        { barcode: barcode.trim() },
        {
          $setOnInsert: {
            barcode:      barcode.trim(),
            productName:  offData.productName,
            brandName:    offData.brandName,
            ingredients:  offData.ingredients,
            frontImageUrl: offData.frontImageUrl,
            allergens:    offData.allergens,
            nutriments:   offData.nutriments,
            source:       "openfoodfacts",
            verified:     true,   // Open Food Facts data is trusted
            contributorUserId: null,
          },
        },
        { upsert: true, new: true }
      );
      return res.json({ product: formatProduct(saved), foundIn: "openfoodfacts" });
    } catch (err) {
      // Save failed (e.g. race condition on duplicate) — still return the data
      console.error("Product save error:", err.message);
      return res.json({
        product: { barcode, ...offData, imageUrl: offData.frontImageUrl, source: "openfoodfacts", verified: true },
        foundIn: "openfoodfacts",
      });
    }
  }

  // ── Step 4: Not found anywhere ────────────────────────────
  return res.status(404).json({
    error:    "Product not found in database.",
    notFound: true,
    barcode,
  });
});

// ── POST /api/products ────────────────────────────────────
// User contribution: submit a new product manually.
// Requires authentication — only logged-in users can contribute.
router.post("/", auth, async (req, res) => {
  const {
    barcode,
    productName,
    brandName,
    ingredients,
    frontImageData,      // base64 data URI from frontend
    ingredientImageData, // base64 data URI from frontend
  } = req.body;

  // ── Validation ────────────────────────────────────────────
  if (!barcode || barcode.trim().length < 4)
    return res.status(400).json({ error: "A valid barcode is required." });
  if (!productName || productName.trim().length < 1)
    return res.status(400).json({ error: "Product name is required." });
  if (!ingredients || ingredients.trim().length < 5)
    return res.status(400).json({ error: "Ingredients text is required." });

  // ── Duplicate check ───────────────────────────────────────
  const existing = await Product.findOne({ barcode: barcode.trim() });
  if (existing) {
    return res.status(409).json({
      error: "This product barcode already exists in our database.",
      product: formatProduct(existing),
    });
  }

  // ── Upload images ─────────────────────────────────────────
  let frontImageUrl      = "";
  let ingredientImageUrl = "";

  try {
    if (frontImageData)      frontImageUrl      = await uploadImage(frontImageData);
    if (ingredientImageData) ingredientImageUrl = await uploadImage(ingredientImageData);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // ── Save product ──────────────────────────────────────────
  try {
    const product = await Product.create({
      barcode:           barcode.trim(),
      productName:       productName.trim(),
      brandName:         (brandName || "").trim(),
      ingredients:       ingredients.trim(),
      frontImageUrl,
      ingredientImageUrl,
      source:            "user",
      verified:          false,             // pending admin review
      contributorUserId: req.user._id,
    });

    return res.status(201).json({
      message: "Product added successfully. Thank you for contributing!",
      product: formatProduct(product),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "This barcode was just submitted by someone else." });
    }
    console.error("Product create error:", err.message);
    return res.status(500).json({ error: "Failed to save product." });
  }
});

module.exports = router;
