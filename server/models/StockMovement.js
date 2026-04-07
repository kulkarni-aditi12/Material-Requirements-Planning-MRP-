import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      default: null,
    },
    materialName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    source: {
      type: String,
      default: "manual",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.StockMovement ||
  mongoose.model("StockMovement", stockMovementSchema);