import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Idea from "@/models/Idea";
import { deleteFile } from "@/lib/gcs";

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function DELETE(_request, { params }) {
  const { id, noteId } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid idea id" }, { status: 400 });
  }
  if (!noteId || typeof noteId !== "string") {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await Idea.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const note = (doc.voiceNotes || []).find((n) => n.id === noteId);
    if (!note) {
      return NextResponse.json({ error: "Voice note not found" }, { status: 404 });
    }

    await deleteFile(note.path);
    await Idea.findByIdAndUpdate(id, { $pull: { voiceNotes: { id: noteId } } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("voice-notes DELETE:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete" },
      { status: 500 }
    );
  }
}
