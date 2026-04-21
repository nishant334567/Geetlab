import mongoose from "mongoose";

const dailyInspirationSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true },
    situation: { type: String, required: true },
    emotion: { type: String, required: true },
    vibe: { type: String, required: true },
    chord_progression: { type: String, required: true },
    lyric_starter: { type: String, required: true },
    word_bank: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 5,
        message: "word_bank must have exactly 5 words",
      },
    },
    songwriting_tip: { type: String, required: true },
    reference_songs: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => !v || (Array.isArray(v) && v.length <= 5),
        message: "reference_songs must have at most 5 songs",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.DailyInspiration ||
  mongoose.model("DailyInspiration", dailyInspirationSchema);
