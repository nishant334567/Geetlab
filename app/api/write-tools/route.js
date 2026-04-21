import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const MODES = ["rhyme", "meaning", "alternates", "emotion", "selection"];

function parseLLMJson(text) {
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  return JSON.parse(jsonStr);
}

function buildPrompt(mode, q) {
  const base =
    "Respond ONLY with valid JSON, no markdown, no code fences. User writes in Hindi/Hinglish context for songs.\n\n";

  switch (mode) {
    case "rhyme":
      return (
        base +
        `User word or phrase: "${q}"\nSuggest 10–12 rhyming or near-rhyming words/phrases useful for Hindi/Hinglish lyrics (mix Hindi sounds and common lyric patterns). JSON shape:\n{"words":["...","..."]}`
      );
    case "meaning":
      return (
        base +
        `Explain the meaning of this word or phrase in simple Hinglish (1–3 short sentences). JSON shape:\n{"meaning":"..."}\n\nWord/phrase: "${q}"`
      );
    case "alternates":
      return (
        base +
        `Give exactly 5 alternate words or short phrases the songwriter could use instead of: "${q}". Same vibe, for lyrics. JSON shape:\n{"words":["...","...","...","...","..."]}`
      );
    case "emotion":
      return (
        base +
        `The songwriter wants words that fit this emotion or mood: "${q}". Suggest 12–15 concrete words or short phrases in Hinglish useful in lyrics. JSON shape:\n{"words":["...","..."]}`
      );
    case "selection":
      return (
        base +
        `The user selected this word or short phrase from their lyrics: "${q}"\n\nReturn exactly this JSON shape with exactly 3 rhymes and exactly 3 alternates (short words or phrases for Hindi/Hinglish songs):\n{"meaning":"1-3 short sentences in Hinglish explaining what this word/phrase means in a lyric context","rhymes":["...","...","..."],"alternates":["...","...","..."]}`
      );
    default:
      return null;
  }
}

export async function GET(request) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API_KEY in environment" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "";
  const q = (searchParams.get("q") || "").trim();

  if (!MODES.includes(mode)) {
    return NextResponse.json(
      { error: `Invalid mode. Use one of: ${MODES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!q) {
    return NextResponse.json(
      { error: "Missing query parameter q" },
      { status: 400 }
    );
  }

  const prompt = buildPrompt(mode, q);
  if (!prompt) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = parseLLMJson(text);

    if (mode === "meaning") {
      return NextResponse.json({
        mode,
        meaning: typeof data.meaning === "string" ? data.meaning : "",
        words: [],
      });
    }

    if (mode === "selection") {
      const rhymes = Array.isArray(data.rhymes)
        ? data.rhymes.filter(Boolean).slice(0, 3)
        : [];
      const alternates = Array.isArray(data.alternates)
        ? data.alternates.filter(Boolean).slice(0, 3)
        : [];
      return NextResponse.json({
        mode,
        meaning: typeof data.meaning === "string" ? data.meaning : "",
        rhymes,
        alternates,
        words: [],
      });
    }

    const words = Array.isArray(data.words) ? data.words.filter(Boolean) : [];
    return NextResponse.json({
      mode,
      meaning: "",
      words,
    });
  } catch (err) {
    console.error("write-tools error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
