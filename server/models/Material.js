import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    unit: { type: String, required: true },
    supplier: { type: String, required: true },
    minStock: { type: Number, required: true },
    currentStock: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
  },
  { collection: "materials", timestamps: true }
);

export default mongoose.models.Material ||
  mongoose.model("Material", MaterialSchema);