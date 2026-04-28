import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Idea from "@/models/Idea";
import { previewFromHtml, titleFromHtml, wordCountFromHtml } from "@/lib/previewFromHtml";

export async function GET() {
  try {
    await connectDB();
    const ideas = await Idea.find()
      .sort({ updatedAt: -1 })
      .lean()
      .limit(100);

    const list = ideas.map((doc) => ({
      id: doc._id.toString(),
      title: titleFromHtml(doc.content),
      preview: previewFromHtml(doc.content),
      wordCount: wordCountFromHtml(doc.content),
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json({ ideas: list });
  } catch (err) {
    console.error("ideas GET:", err);
    return NextResponse.json(
      { error: err.message || "Failed to list ideas" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectDB();
    const doc = await Idea.create({ content: "<p></p>" });
    return NextResponse.json({ id: doc._id.toString() });
  } catch (err) {
    console.error("ideas POST:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create idea" },
      { status: 500 }
    );
  }
}
