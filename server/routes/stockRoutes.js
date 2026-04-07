import express from "express";
import {
  getStockMovements,
  createStockMovement
} from "../controllers/stockController.js";
import Stock from "../models/stock.js";

const router = express.Router();

/**
 * GET all stock (used by dashboard)
 * GET /api/stocks
 */
router.get("/", async (req, res) => {
  try {
    const stock = await Stock.find();
    res.json({ success: true, data: stock });
  } catch (err) {
    res.status(500).json({ success: false, message: "Stock fetch error" });
  }
});

/**
 * ✅ CREATE stock movement
 * POST /api/stocks/movement
 * THIS IS WHAT TRIGGERS:
 * - DB update
 * - socket event
 * - notifications
 */
router.post("/movement", createStockMovement);

/**
 * ❌ BLOCK direct stock overwrite
 */
router.put("/:id", (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Direct stock edit disabled. Use BOM / PO / Manual Adjustment."
  });
});

export default router;
