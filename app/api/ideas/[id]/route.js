import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Idea from "@/models/Idea";
import { getSignedReadUrl } from "@/lib/gcs";

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await Idea.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const voiceNotes = await Promise.all(
      (doc.voiceNotes || []).map(async (n) => ({
        id: n.id,
        name: n.name,
        mimeType: n.mimeType || "audio/webm",
        createdAt: n.createdAt,
        url: (await getSignedReadUrl(n.path)) || null,
      }))
    );

    return NextResponse.json({
      id: doc._id.toString(),
      content: doc.content || "<p></p>",
      voiceNotes,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("idea GET:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content } = body;
  if (typeof content !== "string") {
    return NextResponse.json({ error: "content must be a string" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await Idea.findByIdAndUpdate(
      id,
      { content },
      { new: true }
    ).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, updatedAt: doc.updatedAt });
  } catch (err) {
    console.error("idea PATCH:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save" },
      { status: 500 }
    );
  }
}
