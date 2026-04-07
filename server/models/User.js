import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // plain for now (simple)
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);