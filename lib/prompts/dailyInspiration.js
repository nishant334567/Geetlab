/**
 * Complete prompt for Daily Songwriting Inspiration Pack.
 * Use with Gemini (or GPT-4o-mini) for structured JSON output.
 */

const TONES = [
  "melancholic",
  "hopeful",
  "nostalgic",
  "mysterious",
  "wistful",
  "dreamy",
  "raw",
  "gentle",
];
const GENRES = ["indie", "acoustic", "pop", "folk", "singer-songwriter", "alternative"];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getDailyInspirationPrompt() {
  const tone = getRandom(TONES);
  const genre = getRandom(GENRES);

  return `You are a professional Hindi/Hinglish songwriter helping inspire Indian singer-songwriters.

Generate a "Daily Songwriting Inspiration Pack" for writing songs in HINGLISH (Hindi + English mix). All text content must be in Hinglish — natural mix of Hindi (romanized or Devanagari) and English, like real Hindi film or indie Hindi songs.

All elements must be related to the same core idea so the songwriter can easily start writing a song.

Rules:
- Write title, situation, emotion, vibe, lyric_starter, word_bank, and songwriting_tip in Hinglish. Use words and phrases that sound natural in Hindi songs (e.g. "yaad", "dil", "raat", "chhod ke", "ab bhi", "kabhi" mixed with English where it fits).
- The lyric starter must feel natural and poetic in Hinglish — something you could actually sing.
- chord_progression stays in standard notation (e.g. Am - F - C - G).
- word_bank: 5 words in Hindi/Hinglish that fit the theme.
- reference_songs: exactly 5 existing song titles (Hindi/Indie/Bollywood/international) that match this pack's vibe — songwriter can listen for inspiration.
- Everything must feel emotionally connected. Situation should feel like a cinematic moment.
- Avoid generic "pyaar" unless the situation is specific and vivid. Prefer scenes and moments.
- Keep text concise and inspiring. Avoid clichés.

Tone for this pack: ${tone}
Genre: ${genre}

Return ONLY valid JSON with the following structure. No markdown, no code block, no extra text:

{"title":"...","situation":"...","emotion":"...","vibe":"...","chord_progression":"...","lyric_starter":"...","word_bank":["...","...","...","...","..."],"reference_songs":["Song 1","Song 2","Song 3","Song 4","Song 5"],"songwriting_tip":"..."}`;
}
