"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DailyPage() {
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenning, setRegenning] = useState(false);

  async function handleRegen() {
    try {
      setRegenning(true);
      setError(null);
      const res = await fetch("/api/daily", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regen failed");
      setPack(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenning(false);
    }
  }

  useEffect(() => {
    async function fetchDaily() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/daily");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setPack(data);
      } catch (err) {
        setError(err.message);
        setPack(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDaily();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Loading today’s inspiration…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <Link href="/" className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline mb-6 inline-block">
            ← Back
          </Link>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">No inspiration for today.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 inline-block"
        >
          ← Back
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Daily inspiration
            </p>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {pack.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleRegen}
            disabled={regenning}
            className="px-4 py-2 rounded-lg bg-zinc-800 dark:bg-zinc-700 text-white text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:pointer-events-none"
          >
            {regenning ? "Regening…" : "Regen"}
          </button>
        </div>

        <section className="space-y-8">
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Situation
            </h2>
            <p className="text-zinc-800 dark:text-zinc-200 text-lg leading-relaxed">
              {pack.situation}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Emotion
              </h2>
              <p className="text-zinc-800 dark:text-zinc-200">{pack.emotion}</p>
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Vibe
              </h2>
              <p className="text-zinc-800 dark:text-zinc-200">{pack.vibe}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Chord progression
            </h2>
            <p className="text-zinc-800 dark:text-zinc-200 font-mono text-lg">
              {pack.chord_progression}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
            <h2 className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2">
              Lyric starter
            </h2>
            <p className="text-zinc-800 dark:text-zinc-200 text-lg italic">
              &ldquo;{pack.lyric_starter}&rdquo;
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Word bank
            </h2>
            <div className="flex flex-wrap gap-2">
              {(pack.word_bank || []).map((word, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {(pack.reference_songs && pack.reference_songs.length > 0) && (
            <div>
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Songs to inspire
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
                Listen for vibe and ideas
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-800 dark:text-zinc-200">
                {pack.reference_songs.map((song, i) => (
                  <li key={i}>{song}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Songwriting tip
            </h2>
            <p className="text-zinc-800 dark:text-zinc-200">
              {pack.songwriting_tip}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
