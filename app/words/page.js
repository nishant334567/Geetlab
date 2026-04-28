"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  ExternalLink,
  Loader2,
  Sparkles,
  MessageSquareText,
  ArrowLeftRight,
  EqualNot,
  Music2,
} from "lucide-react";

function rekhtaSlug(q) {
  return encodeURIComponent(
    String(q || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
  );
}

function rekhtaUrl(q) {
  const slug = rekhtaSlug(q);
  if (!slug) return null;
  return `https://www.rekhtadictionary.com/meaning-of-${slug}`;
}

async function runTool({ mode, q }) {
  const res = await fetch("/api/write-tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, q }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function WordsPage() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");

  const [activeWord, setActiveWord] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const [toolLoading, setToolLoading] = useState(false);
  const [toolError, setToolError] = useState(null);
  const [toolResult, setToolResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/words")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setWords(data.words || []);
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return words;
    return words.filter((w) => String(w.word).toLowerCase().includes(query));
  }, [words, q]);

  async function handleAction(word, mode) {
    setActiveWord(word);
    setActiveMode(mode);
    setToolLoading(true);
    setToolError(null);
    setToolResult(null);
    try {
      const data = await runTool({ mode, q: word });
      setToolResult(data);
    } catch (e) {
      setToolError(e.message || "Failed");
    } finally {
      setToolLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100/80 dark:bg-zinc-950">
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/"
              className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 transition hover:bg-white hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Word bookmarks
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Shared word cloud (global). Click a word to generate helpers.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/daily"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <BookOpen className="h-4 w-4 opacity-70" />
              Daily
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Bookmark className="h-4 w-4" />
              Ideas
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8 md:grid-cols-[1fr_1fr] md:items-start">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Saved words
            </h2>
            <div className="text-xs text-zinc-500">
              {filtered.length} / {words.length}
            </div>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search words…"
            className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />

          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {loading ? (
            <div className="mt-6 flex items-center gap-3 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {filtered.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setActiveWord(w.word)}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  title={`Saved ${w.count}x`}
                >
                  {w.word}
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {w.count}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="mt-3 text-sm text-zinc-500">No matches.</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Tools
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Pick a word and run actions.
          </p>

          <div className="mt-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
              <span className="text-zinc-500 dark:text-zinc-400">Word: </span>
              <span className="font-semibold">
                {activeWord || "Select a word"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!activeWord}
                onClick={() => handleAction(activeWord, "meaning")}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <MessageSquareText className="inline h-4 w-4 mr-2 opacity-70" />
                Meaning
              </button>
              <button
                type="button"
                disabled={!activeWord}
                onClick={() => handleAction(activeWord, "poeticNuance")}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <Sparkles className="inline h-4 w-4 mr-2 opacity-70" />
                Poetic
              </button>
              <button
                type="button"
                disabled={!activeWord}
                onClick={() => handleAction(activeWord, "synonyms")}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeftRight className="inline h-4 w-4 mr-2 opacity-70" />
                Synonyms
              </button>
              <button
                type="button"
                disabled={!activeWord}
                onClick={() => handleAction(activeWord, "antonyms")}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <EqualNot className="inline h-4 w-4 mr-2 opacity-70" />
                Antonyms
              </button>
              <button
                type="button"
                disabled={!activeWord}
                onClick={() => handleAction(activeWord, "rhyme")}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <Music2 className="inline h-4 w-4 mr-2 opacity-70" />
                Rhymes
              </button>
              <button
                type="button"
                disabled={!activeWord || !rekhtaUrl(activeWord)}
                onClick={() => {
                  const url = rekhtaUrl(activeWord);
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                }}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <ExternalLink className="inline h-4 w-4 mr-2 opacity-70" />
                Rekhta
              </button>
            </div>
          </div>

          <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            {toolLoading ? (
              <div className="flex items-center gap-3 text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating…
              </div>
            ) : toolError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {toolError}
              </p>
            ) : toolResult ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {activeMode}
                </p>
                {toolResult.meaning ? (
                  <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {toolResult.meaning}
                  </p>
                ) : null}
                {toolResult.nuance ? (
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {toolResult.nuance}
                  </p>
                ) : null}
                {Array.isArray(toolResult.related_words) &&
                toolResult.related_words.length ? (
                  <ul className="list-disc list-inside text-sm text-zinc-800 dark:text-zinc-200">
                    {toolResult.related_words.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                ) : null}
                {Array.isArray(toolResult.examples) && toolResult.examples.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Examples
                    </p>
                    <ul className="list-disc list-inside text-sm text-zinc-800 dark:text-zinc-200">
                      {toolResult.examples.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {Array.isArray(toolResult.words) && toolResult.words.length ? (
                  <ul className="list-disc list-inside text-sm text-zinc-800 dark:text-zinc-200">
                    {toolResult.words.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Run an action to see results here.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

