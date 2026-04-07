import mongoose from "mongoose";

const mrpRunSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    demandQuantity: {
      type: Number,
      required: true,
    },
    results: [
      {
        materialId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
          default: null,
        },
        materialName: String,
        requiredQty: Number,
        currentStock: Number,
        shortage: Number,
        enoughStock: Boolean,
        suggestedOrderQty: Number,
        unitCost: Number,
        estimatedPurchaseCost: Number,
      },
    ],
    status: {
      type: String,
      enum: ["planned", "po_created", "production_started", "completed"],
      default: "planned",
    },
  },
  { timestamps: true }
);

export default mongoose.models.MRPRun || mongoose.model("MRPRun", mrpRunSchema);