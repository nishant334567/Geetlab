import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Idea from "@/models/Idea";
import { uploadToBucket, getSignedReadUrl, bucket } from "@/lib/gcs";

const MAX_BYTES = 25 * 1024 * 1024;
const AUDIO_RE = /^audio\/(webm|mpeg|mp4|wav|ogg|x-m4a|mp3|aac)$/i;

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function extFromMime(mime) {
  const m = (mime || "").toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  if (m.includes("wav")) return "wav";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("aac")) return "aac";
  return "webm";
}

export async function POST(request, { params }) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  if (!bucket) {
    return NextResponse.json(
      { error: "File storage is not configured (GCS bucket / credentials)." },
      { status: 503 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const nameRaw = String(formData.get("name") || "").trim();
  const name = nameRaw || "Voice note";
  const file = formData.get("file");

  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  const mimeType = file.type || "audio/webm";
  if (!AUDIO_RE.test(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported audio type. Use webm, mp3, m4a, wav, or ogg." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 25 MB)" },
      { status: 413 }
    );
  }

  const noteId = randomUUID();
  const ext = extFromMime(mimeType);
  const gcsPath = `geetlab/ideas/${id}/voices/${noteId}.${ext}`;

  try {
    await connectDB();
    const exists = await Idea.exists({ _id: id });
    if (!exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const url = await uploadToBucket(gcsPath, buffer, mimeType);
    if (!url) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const note = {
      id: noteId,
      name,
      path: gcsPath,
      mimeType,
      createdAt: new Date(),
    };

    await Idea.findByIdAndUpdate(id, { $push: { voiceNotes: note } });

    const playUrl = (await getSignedReadUrl(gcsPath)) || url;

    return NextResponse.json({
      voiceNote: {
        id: note.id,
        name: note.name,
        mimeType: note.mimeType,
        createdAt: note.createdAt,
        url: playUrl,
      },
    });
  } catch (err) {
    console.error("voice-notes POST:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}
