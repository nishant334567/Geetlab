"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/app/lib/rte";
import { BookOpen, Loader2, PenLine, RefreshCcw, Sparkles } from "lucide-react";

export default function DailyPage() {
  const router = useRouter();
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenning, setRegenning] = useState(false);
  const [draftHtml, setDraftHtml] = useState("<p></p>");
  const [savingIdea, setSavingIdea] = useState(false);
  const [saveError, setSaveError] = useState(null);

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

  async function handleSaveAsIdea() {
    try {
      setSavingIdea(true);
      setSaveError(null);

      const createRes = await fetch("/api/ideas", { method: "POST" });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Could not create idea");

      const id = createData.id;
      const saveRes = await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draftHtml }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Could not save idea");

      router.push(`/write/${id}`);
    } catch (e) {
      setSaveError(e.message || "Failed to save");
    } finally {
      setSavingIdea(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100/80 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">
          Loading today’s inspiration…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100/80 dark:bg-zinc-950 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <Link
            href="/"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline mb-6 inline-block"
          >
            ← Back
          </Link>
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-zinc-100/80 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">
          No inspiration for today.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100/80 dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 grid gap-5 rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/40 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <Image
                src="/geetlab_logo.png"
                alt="GeetLab"
                fill
                className="object-cover scale-[1.08]"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                <BookOpen className="h-3.5 w-3.5" />
                Daily inspiration
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {pack.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                A connected pack to kickstart your next song. Try “Regen” if you want a fresh vibe.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="relative hidden h-12 w-[14.5rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:block">
              <Image
                src="/geetlab_logo_2.png"
                alt="GeetLab banner"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={handleRegen}
              disabled={regenning}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white sm:w-auto"
            >
              <RefreshCcw className={`h-4 w-4 ${regenning ? "animate-spin" : ""}`} />
              {regenning ? "Regening…" : "Regen"}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              ← Back to ideas
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          <section className="space-y-6">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Situation
              </p>
              <p className="text-lg leading-relaxed text-zinc-900 dark:text-zinc-100">
                {pack.situation}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Emotion
                </p>
                <p className="text-zinc-900 dark:text-zinc-100">{pack.emotion}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Vibe
                </p>
                <p className="text-zinc-900 dark:text-zinc-100">{pack.vibe}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-orange-50/30 p-6 shadow-sm dark:border-amber-900/50 dark:from-amber-950/40 dark:to-orange-950/20">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/70 dark:bg-zinc-900/70 dark:text-amber-200 dark:ring-amber-900/50">
                <Sparkles className="h-3.5 w-3.5" />
                Lyric starter
              </div>
              <p className="text-lg italic leading-relaxed text-zinc-900 dark:text-zinc-100">
                &ldquo;{pack.lyric_starter}&rdquo;
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Chord progression
              </p>
              <p className="font-mono text-lg text-zinc-900 dark:text-zinc-100">
                {pack.chord_progression}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                  <PenLine className="h-4 w-4" />
                  <p className="text-sm font-semibold">Write on this inspiration</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAsIdea}
                  disabled={savingIdea}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white sm:w-auto"
                >
                  {savingIdea ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 opacity-90" />
                      Save as new idea
                    </>
                  )}
                </button>
              </div>

              <RichTextEditor
                value={draftHtml}
                onChange={(v) => {
                  setDraftHtml(v);
                }}
                placeholder="Start writing your lyrics here…"
              />

              {saveError ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {saveError}
                </p>
              ) : (
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                  Tip: write here, then save to create a shareable idea link for collaboration.
                </p>
              )}
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Word bank
              </p>
              <div className="flex flex-wrap gap-2">
                {(pack.word_bank || []).map((word, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {Array.isArray(pack.reference_songs) && pack.reference_songs.length > 0 ? (
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Songs to inspire
                </p>
                <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Listen for vibe and hook ideas.
                </p>
                <ul className="space-y-2">
                  {pack.reference_songs.map((song, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      {song}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Songwriting tip
              </p>
              <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {pack.songwriting_tip}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
