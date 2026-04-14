import mongoose from "mongoose";

const StockSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
  name: String,
  currentStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 20 },
  unit: String,
  supplier: String,
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Stock || mongoose.model("Stock", StockSchema);
