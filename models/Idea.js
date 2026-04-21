import mongoose from "mongoose";

const voiceNoteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    path: { type: String, required: true },
    mimeType: { type: String, default: "audio/webm" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ideaSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      default: "<p></p>",
    },
    voiceNotes: {
      type: [voiceNoteSchema],
      default: [],
    },
  },
  { timestamps: true }
);

ideaSchema.index({ updatedAt: -1 });

export default mongoose.models.Idea || mongoose.model("Idea", ideaSchema);
