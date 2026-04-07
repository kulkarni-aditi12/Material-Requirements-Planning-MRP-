// server/models/PO.js
import mongoose from "mongoose";

const poSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  supplier: { type: String, required: true },
  items: [
    {
      materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
      quantity: { type: Number, required: true },
      unitCost: { type: Number, required: true },
      totalCost: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["draft", "pending", "received"], default: "draft" },
  date: { type: Date, default: Date.now },
  deliveryDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.PO || mongoose.model("PO", poSchema);
