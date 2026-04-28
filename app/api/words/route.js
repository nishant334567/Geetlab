import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Word from "@/models/Word";

function normalizeWord(w) {
  return String(w || "").trim().toLowerCase();
}

export async function GET() {
  try {
    await connectDB();
    const words = await Word.find().sort({ updatedAt: -1 }).lean().limit(500);
    return NextResponse.json({
      words: words.map((w) => ({
        id: w._id.toString(),
        word: w.word,
        count: w.count || 1,
        updatedAt: w.updatedAt,
      })),
    });
  } catch (err) {
    console.error("words GET:", err);
    return NextResponse.json(
      { error: err.message || "Failed to list words" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const wordRaw = body?.word;
  const word = normalizeWord(wordRaw);
  if (!word) {
    return NextResponse.json({ error: "Missing word" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await Word.findOneAndUpdate(
      { word },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      id: doc._id.toString(),
      word: doc.word,
      count: doc.count || 1,
    });
  } catch (err) {
    console.error("words POST:", err);
    return NextResponse.json(
      { error: err.message || "Failed to bookmark" },
      { status: 500 }
    );
  }
}

