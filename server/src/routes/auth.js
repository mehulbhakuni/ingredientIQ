const express = require("express");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const auth    = require("../middleware/auth");

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Basic email format check — catches typos, not a full RFC validator
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== "string") return "Email is required.";
  if (!EMAIL_RE.test(email.trim()))        return "Enter a valid email address.";
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== "string") return "Password is required.";
  if (password.length < 6)   return "Password must be at least 6 characters.";
  // bcrypt silently truncates at 72 bytes — cap input to prevent CPU abuse
  if (password.length > 128) return "Password must be under 128 characters.";
  return null;
}

// Validates that a value is an array containing only plain strings,
// each under maxLen characters. Rejects objects, numbers, nested arrays.
function validateStringArray(value, fieldName, maxLen = 100) {
  if (!Array.isArray(value))
    return `${fieldName} must be an array.`;
  const invalid = value.find((v) => typeof v !== "string" || v.length > maxLen);
  if (invalid !== undefined)
    return `Each item in ${fieldName} must be a string under ${maxLen} characters.`;
  return null;
}

// ── POST /api/auth/register ───────────────────────────────
router.post("/register", async (req, res) => {
  // Only destructure expected fields — ignore anything else in the body
  const { name, email, password } = req.body;

  // Name validation
  if (!name || typeof name !== "string" || name.trim().length < 2)
    return res.status(400).json({ error: "Name must be at least 2 characters." });
  if (name.trim().length > 50)
    return res.status(400).json({ error: "Name must be under 50 characters." });

  // Email validation
  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ error: emailErr });

  // Password validation
  const passErr = validatePassword(password);
  if (passErr) return res.status(400).json({ error: passErr });

  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered." });

    const user  = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed." });
  }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate format before touching the database
  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ error: emailErr });

  if (!password || typeof password !== "string")
    return res.status(400).json({ error: "Password is required." });

  // Cap password length — same bcrypt DoS protection as register
  if (password.length > 128)
    return res.status(400).json({ error: "Invalid credentials." });

  try {
    // .select("+password") needed because password is excluded by default in the model
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");

    // Return the same error for wrong email or wrong password — prevents user enumeration
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: "Invalid email or password." });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed." });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

// ── PUT /api/auth/profile ─────────────────────────────────
router.put("/profile", auth, async (req, res) => {
  // Only accept the four expected fields — discard everything else
  const { conditions, allergies, diets, custom } = req.body;

  // Validate each array field
  const condErr = validateStringArray(conditions || [], "conditions");
  if (condErr) return res.status(400).json({ error: condErr });

  const allergErr = validateStringArray(allergies || [], "allergies");
  if (allergErr) return res.status(400).json({ error: allergErr });

  const dietErr = validateStringArray(diets || [], "diets");
  if (dietErr) return res.status(400).json({ error: dietErr });

  // Validate custom text field
  if (custom !== undefined && custom !== null) {
    if (typeof custom !== "string")
      return res.status(400).json({ error: "Custom notes must be a string." });
    if (custom.length > 500)
      return res.status(400).json({ error: "Custom notes must be under 500 characters." });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profile: {
          conditions:  (conditions  || []).map((s) => s.trim()).filter(Boolean),
          allergies:   (allergies   || []).map((s) => s.trim()).filter(Boolean),
          diets:       (diets       || []).map((s) => s.trim()).filter(Boolean),
          custom:      (custom      || "").trim().slice(0, 500),
        },
      },
      { new: true }
    );
    res.json({ user });
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

module.exports = router;