import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const MODES = [
  "rhyme",
  "meaning",
  "alternates",
  "emotion",
  "nextLine",
  "rewriteLine",
  "synonyms",
  "antonyms",
  "poeticNuance",
];

function parseLLMJson(text) {
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  return JSON.parse(jsonStr);
}

function buildPrompt(mode, q, contextText, extraPrompt) {
  const base =
    "Respond ONLY with valid JSON, no markdown, no code fences. User writes in Hindi/Hinglish context for songs.\n\n";

  const extra =
    extraPrompt && String(extraPrompt).trim()
      ? `\n\nExtra instructions from user:\n${String(extraPrompt).trim()}\n`
      : "";

  switch (mode) {
    case "rhyme":
      return (
        base +
        `User word or phrase: "${q}"\nSuggest 10–12 rhyming or near-rhyming words/phrases useful for Hindi/Hinglish lyrics (mix Hindi sounds and common lyric patterns). JSON shape:\n{"words":["...","..."]}` +
        extra
      );
    case "meaning":
      return (
        base +
        `Explain the meaning of this word or phrase in simple Hinglish (1–3 short sentences). JSON shape:\n{"meaning":"..."}\n\nWord/phrase: "${q}"` +
        extra
      );
    case "alternates":
      return (
        base +
        `Give exactly 5 alternate words or short phrases the songwriter could use instead of: "${q}". Same vibe, for lyrics. JSON shape:\n{"words":["...","...","...","...","..."]}` +
        extra
      );
    case "emotion":
      return (
        base +
        `The songwriter wants words that fit this emotion or mood: "${q}". Suggest 12–15 concrete words or short phrases in Hinglish useful in lyrics. JSON shape:\n{"words":["...","..."]}` +
        extra
      );
    case "nextLine":
      return (
        base +
        `You are helping continue a song in Hinglish. The user selected this line:\n"${q}"\n\nSong context (may be partial):\n${contextText || "(no extra context)"}\n\nWrite 5 options for the NEXT line that could come right after the selected line. Keep it singable and emotionally consistent. Avoid clichés.\nReturn JSON:\n{"lines":["...","...","...","...","..."]}` +
        extra
      );
    case "rewriteLine":
      return (
        base +
        `You are rewriting a Hinglish song line. The user selected this line:\n"${q}"\n\nSong context (may be partial):\n${contextText || "(no extra context)"}\n\nWrite 5 rewritten alternatives. Keep the same meaning/vibe but improve phrasing, rhythm, imagery. Avoid clichés.\nReturn JSON:\n{"lines":["...","...","...","...","..."]}` +
        extra
      );
    case "synonyms":
      return (
        base +
        `Give 10 synonyms / close alternatives for this word or short phrase in a songwriter-friendly Hinglish/Hindi vibe. Include a mix of Hinglish and Hindi (Devanagari) where useful. Avoid long explanations.\n\nInput: "${q}"\nReturn JSON:\n{"words":["...","..."]}` +
        extra
      );
    case "antonyms":
      return (
        base +
        `Give 8–10 antonyms / opposites for this word or short phrase, useful for songwriting contrast. Hinglish/Hindi allowed.\n\nInput: "${q}"\nReturn JSON:\n{"words":["...","..."]}` +
        extra
      );
    case "poeticNuance":
      return (
        base +
        `Give a Rekhta-style poetic help for this word/phrase (DO NOT quote any copyrighted lines).\n\nReturn JSON:\n{\n  "meaning":"1-3 short sentences in Hinglish (simple and precise)",\n  "nuance":"1-2 short sentences about poetic vibe/usage",\n  "related_words":["...","...","...","...","..."],\n  "examples":["(original mini-line 1)","(original mini-line 2)"]\n}\n\nInput: "${q}"` +
        extra
      );
    default:
      return null;
  }
}

async function handleTools({ mode, q, contextText, extraPrompt }) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { status: 500, json: { error: "Missing API_KEY in environment" } };
  }

  if (!MODES.includes(mode)) {
    return {
      status: 400,
      json: { error: `Invalid mode. Use one of: ${MODES.join(", ")}` },
    };
  }

  if (!q || !q.trim()) {
    return { status: 400, json: { error: "Missing input" } };
  }

  const prompt = buildPrompt(mode, q.trim(), contextText, extraPrompt);
  if (!prompt) {
    return { status: 400, json: { error: "Invalid mode" } };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = parseLLMJson(text);

    if (mode === "meaning") {
      return {
        status: 200,
        json: {
          mode,
          meaning: typeof data.meaning === "string" ? data.meaning : "",
          words: [],
        },
      };
    }

    if (mode === "nextLine" || mode === "rewriteLine") {
      const lines = Array.isArray(data.lines) ? data.lines.filter(Boolean) : [];
      return {
        status: 200,
        json: {
          mode,
          lines,
        },
      };
    }

    if (mode === "poeticNuance") {
      return {
        status: 200,
        json: {
          mode,
          meaning: typeof data.meaning === "string" ? data.meaning : "",
          nuance: typeof data.nuance === "string" ? data.nuance : "",
          related_words: Array.isArray(data.related_words)
            ? data.related_words.filter(Boolean).slice(0, 10)
            : [],
          examples: Array.isArray(data.examples)
            ? data.examples.filter(Boolean).slice(0, 4)
            : [],
        },
      };
    }

    const words = Array.isArray(data.words) ? data.words.filter(Boolean) : [];
    return {
      status: 200,
      json: {
        mode,
        meaning: "",
        words,
      },
    };
  } catch (err) {
    console.error("write-tools error:", err);
    return {
      status: 500,
      json: { error: err.message || "Failed to get suggestions" },
    };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "";
  const q = (searchParams.get("q") || "").trim();
  const contextText = (searchParams.get("context") || "").trim();
  const extraPrompt = (searchParams.get("extra") || "").trim();

  const { status, json } = await handleTools({
    mode,
    q,
    contextText,
    extraPrompt,
  });
  return NextResponse.json(json, { status });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const mode = body?.mode || "";
  const q = body?.q || "";
  const contextText = body?.contextText || "";
  const extraPrompt = body?.extraPrompt || "";

  const { status, json } = await handleTools({
    mode,
    q,
    contextText,
    extraPrompt,
  });
  return NextResponse.json(json, { status });
}
