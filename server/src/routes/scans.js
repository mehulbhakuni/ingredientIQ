const express  = require("express");
const mongoose = require("mongoose");
const Scan     = require("../models/Scan");
const auth     = require("../middleware/auth");

const router = express.Router();

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/scans
router.get("/", auth, async (req, res) => {
  try {
    const scans = await Scan.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ scans });
  } catch (err) {
    console.error("Fetch scans error:", err.message);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});

// GET /api/scans/:id
router.get("/:id", auth, async (req, res) => {
  if (!isValidId(req.params.id))
    return res.status(400).json({ error: "Invalid scan ID." });

  try {
    const scan = await Scan.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!scan) return res.status(404).json({ error: "Scan not found." });
    res.json({ scan });
  } catch (err) {
    console.error("Fetch scan error:", err.message);
    res.status(500).json({ error: "Failed to fetch scan." });
  }
});

// DELETE /api/scans/:id
router.delete("/:id", auth, async (req, res) => {
  if (!isValidId(req.params.id))
    return res.status(400).json({ error: "Invalid scan ID." });

  try {
    const scan = await Scan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!scan) return res.status(404).json({ error: "Scan not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Delete scan error:", err.message);
    res.status(500).json({ error: "Failed to delete scan." });
  }
});

// DELETE /api/scans
router.delete("/", auth, async (req, res) => {
  try {
    const result = await Scan.deleteMany({ user: req.user._id });
    res.json({ message: "History cleared.", deleted: result.deletedCount });
  } catch (err) {
    console.error("Clear scans error:", err.message);
    res.status(500).json({ error: "Failed to clear history." });
  }
});

module.exports = router;