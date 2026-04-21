import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyInspiration from "@/models/DailyInspiration";
import { getDailyInspirationPrompt } from "@/lib/prompts/dailyInspiration";

function getTodayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function parseLLMJson(text) {
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  return JSON.parse(jsonStr);
}

async function generateAndSave(apiKey, today) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = getDailyInspirationPrompt();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const data = parseLLMJson(text);
  const payload = {
    date: today,
    title: data.title,
    situation: data.situation,
    emotion: data.emotion,
    vibe: data.vibe,
    chord_progression: data.chord_progression,
    lyric_starter: data.lyric_starter,
    word_bank: Array.isArray(data.word_bank) ? data.word_bank : [],
    reference_songs: Array.isArray(data.reference_songs) ? data.reference_songs.slice(0, 5) : [],
    songwriting_tip: data.songwriting_tip,
  };
  const doc = await DailyInspiration.findOneAndUpdate(
    { date: today },
    payload,
    { upsert: true, new: true }
  ).lean();
  return doc;
}

export async function GET() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API_KEY in environment" },
      { status: 500 }
    );
  }

  try {
    await connectDB();
    const today = getTodayUTC();

    let doc = await DailyInspiration.findOne({ date: today }).lean();

    if (!doc) {
      doc = await generateAndSave(apiKey, today);
    }

    return NextResponse.json(doc);
  } catch (err) {
    console.error("Daily inspiration error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to get daily inspiration" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API_KEY in environment" },
      { status: 500 }
    );
  }

  try {
    await connectDB();
    const today = getTodayUTC();
    const doc = await generateAndSave(apiKey, today);
    return NextResponse.json(doc);
  } catch (err) {
    console.error("Daily inspiration regen error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to regenerate" },
      { status: 500 }
    );
  }
}
