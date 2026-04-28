"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Clock,
  FileText,
} from "lucide-react";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadIdeas = useCallback(() => {
    setLoading(true);
    setListError(null);
    fetch("/api/ideas")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setIdeas(data.ideas || []);
      })
      .catch((err) => setListError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  async function handleNewIdea() {
    setCreating(true);
    try {
      const res = await fetch("/api/ideas", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create idea");
      router.push(`/write/${data.id}`);
    } catch (e) {
      setListError(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100/80 dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-10 grid gap-5 rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/40 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
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
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Your ideas
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Write. Create. Inspire. Start a new idea or continue an old one.
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
              onClick={handleNewIdea}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              )}
              New idea
            </button>
          </div>
        </div>

        {listError && (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {listError}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your ideas…</span>
          </div>
        ) : ideas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">
              No lyrics yet
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Start your first idea — it opens in a fresh writing space.
            </p>
            <button
              type="button"
              onClick={handleNewIdea}
              disabled={creating}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              New idea
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <Link
                key={idea.id}
                href={`/write/${idea.id}`}
                className="group rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="line-clamp-1 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {idea.title || "Untitled idea"}
                  </h2>
                  <div className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {idea.wordCount ?? 0} words
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {idea.preview}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(idea.updatedAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Idea
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
