import mongoose from "mongoose";

const MaterialInBOMSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: "pcs" },
  unitCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  supplier: { type: String, default: "" },
  leadTimeDays: { type: Number, default: 0 }
});

const BOMSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  version: { type: String, default: "" },
  lastUpdated: { type: Date, default: Date.now },
  totalCost: { type: Number, default: 0 },
  materials: { type: [MaterialInBOMSchema], default: [] }
}, { timestamps: true });

BOMSchema.pre("save", function(next) {
  this.totalCost = this.materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
  next();
});

export default mongoose.models.BOM || mongoose.model("BOM", BOMSchema);
