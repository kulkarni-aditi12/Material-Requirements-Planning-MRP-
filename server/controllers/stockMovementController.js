import StockMovement from "../models/StockMovement.js";

export const getAllStockMovements = async (req, res) => {
  try {
    const movements = await StockMovement.find().sort({ createdAt: -1 });
    res.json(movements);
  } catch (err) {
    console.error("Error fetching stock movements:", err);
    res.status(500).json({
      message: "Failed to fetch stock movements",
      error: err.message,
    });
  }
};