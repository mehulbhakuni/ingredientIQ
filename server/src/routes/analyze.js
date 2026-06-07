const express = require("express");
const Groq = require("groq-sdk");
const auth = require("../middleware/auth");
const Scan = require("../models/Scan");

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a personalized food safety assistant. Analyze an ingredient list against a user's health profile.

Your job:
1. Product name: Use the provided productName if given, otherwise infer from the ingredient list. If truly unknown, use "Unknown Product".
2. Give a health score 0–100 for THIS specific user based on how safe the product is for their conditions.
3. Flag ONLY ingredients problematic FOR THIS SPECIFIC PERSON with evidence-based reasons.
4. Give a verdict and summary.

Score guidance:
- 85–100: Safe, no concerns for this user
- 60–84: Minor concerns, consume occasionally
- 35–59: Moderate concerns, use caution
- 0–34: Significant concerns, avoid

Verdict: safe = 70+, caution = 35–69, avoid = 0–34
Severity: "high" = direct allergen/clearly harmful, "medium" = may trigger symptoms, "low" = worth noting
Respond ONLY with valid JSON, nothing outside it.

Response format:
{
  "productName": "Brand Product Name",
  "healthScore": 75,
  "verdict": "safe" | "caution" | "avoid",
  "summary": "One sentence summary personalized to the user",
  "flagged": [{ "ingredient": "name", "reason": "reason for this user", "severity": "high|medium|low" }],
  "safe_note": "Optional note if safe/mostly safe"
}`;

router.post("/", auth, async (req, res) => {
  const { ingredients, scanType, productName: knownProductName, brandName, barcode, imageUrl } = req.body;
  const profile = req.user.profile;

  if (!ingredients || typeof ingredients !== "string" || ingredients.trim().length < 3)
    return res.status(400).json({ error: "Please provide an ingredient list." });

  if (!profile || (!profile.conditions?.length && !profile.allergies?.length && !profile.diets?.length && !profile.custom))
    return res.status(400).json({ error: "Please set up your health profile first." });

  const profileText = [
    profile.conditions?.length ? `Medical conditions: ${profile.conditions.join(", ")}` : "",
    profile.allergies?.length  ? `Allergies: ${profile.allergies.join(", ")}` : "",
    profile.diets?.length      ? `Dietary restrictions: ${profile.diets.join(", ")}` : "",
    profile.custom?.trim()     ? `Additional notes: ${profile.custom}` : "",
  ].filter(Boolean).join("\n");

  // If we already know the product name (from barcode), tell the AI
  const productContext = knownProductName
    ? `Product name (already known): ${knownProductName}${brandName ? ` by ${brandName}` : ""}`
    : "Product name: unknown, please infer from ingredients if possible";

  const userPrompt = `USER HEALTH PROFILE:\n${profileText}\n\n${productContext}\n\nINGREDIENT LIST TO ANALYZE:\n${ingredients.trim()}\n\nRespond with JSON only.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return res.status(502).json({ error: "AI returned an empty response. Please try again." });

    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      console.error("Groq returned non-JSON:", text);
      return res.status(502).json({ error: "AI returned an unexpected response. Please try again." });
    }

    const productName = knownProductName?.trim() || (parsed.productName?.trim()) || "Unknown Product";
    const healthScore = typeof parsed.healthScore === "number"
      ? Math.min(100, Math.max(0, Math.round(parsed.healthScore))) : null;

    const fullResult = {
      ...parsed,
      productName,
      brandName:  brandName || "",
      imageUrl:   imageUrl  || "",
      scanType:   scanType  || "paste",
      healthScore,
    };

    await Scan.create({
      user:        req.user._id,
      scanType:    scanType  || "paste",
      productName,
      brandName:   brandName || "",
      barcode:     barcode   || "",
      imageUrl:    imageUrl  || "",
      healthScore,
      ingredients: ingredients.trim(),
      verdict:     parsed.verdict,
      summary:     parsed.summary,
      flagged:     parsed.flagged || [],
      safe_note:   parsed.safe_note,
      profileSnapshot: {
        conditions: profile.conditions,
        allergies:  profile.allergies,
        diets:      profile.diets,
        custom:     profile.custom,
      },
    });

    return res.json(fullResult);
  } catch (err) {
    console.error("Groq API error:", err.message);
    if (err.message?.includes("API_KEY") || err.status === 401)
      return res.status(500).json({ error: "API key not configured correctly." });
    if (err.status === 429)
      return res.status(429).json({ error: "Rate limit reached. Please wait a moment and try again." });
    return res.status(502).json({ error: "AI service unavailable. Please try again shortly." });
  }
});

module.exports = router;
