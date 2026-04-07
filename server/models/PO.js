import mongoose from "mongoose";

const poSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    supplier: { type: String, required: true },
    items: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "pending", "sent", "approved", "received"],
      default: "draft",
    },
    date: { type: Date, default: Date.now },
    deliveryDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.PO || mongoose.model("PO", poSchema);