"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Loader2,
  PenLine,
  Plus,
  Sparkles,
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
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              GeetLab
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Your lyrics
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Every idea has its own space. Open one to keep writing — we save
              as you go.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
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
            <Link
              href="/daily"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <BookOpen className="h-4 w-4 opacity-70" />
              Daily inspiration
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
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
            <PenLine className="mx-auto mb-4 h-10 w-10 text-zinc-400" />
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
          <ul className="space-y-3">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <Link
                  href={`/write/${idea.id}`}
                  className="block rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <p className="line-clamp-2 text-sm font-medium leading-relaxed text-zinc-900 dark:text-zinc-100">
                    {idea.preview}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    Updated {formatDate(idea.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
