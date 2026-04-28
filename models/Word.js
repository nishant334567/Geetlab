import mongoose from "mongoose";

const wordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, trim: true },
    count: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// normalize uniqueness by lowercasing in code (keeps original casing if you want later)
wordSchema.index({ word: 1 }, { unique: true });
wordSchema.index({ updatedAt: -1 });

export default mongoose.models.Word || mongoose.model("Word", wordSchema);

