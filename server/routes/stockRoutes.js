import express from "express";
import {
  getStockMovements,
  createStockMovement
} from "../controllers/stockController.js";
import Stock from "../models/stock.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const stock = await Stock.find();
    res.json({ success: true, data: stock });
  } catch (err) {
    res.status(500).json({ success: false, message: "Stock fetch error" });
  }
});


router.post("/movement", createStockMovement);
router.put("/:id", (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Direct stock edit disabled. Use BOM / PO / Manual Adjustment."
  });
});

export default router;
