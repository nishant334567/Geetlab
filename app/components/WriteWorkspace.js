"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import RichTextEditor from "@/app/lib/rte";
import {
  ArrowLeft,
  PenLine,
  MousePointerClick,
  Loader2,
  Sparkles,
  Wand2,
  BookOpen,
  ChevronDown,
  Mic,
  Trash2,
} from "lucide-react";

const MODE_OPTIONS = [
  { value: "rhyme", label: "Rhyme", hint: "Near-rhymes for lyrics" },
  { value: "meaning", label: "Meaning", hint: "Explain a word or phrase" },
  { value: "alternates", label: "Alternate words", hint: "Swap-in ideas" },
  { value: "emotion", label: "Emotion based words", hint: "Mood → vocabulary" },
];

const SAVE_DEBOUNCE_MS = 900;

function SectionCard({ icon: Icon, title, description, accent = "zinc", children }) {
  const ring =
    accent === "amber"
      ? "border-amber-200/70 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/90 to-orange-50/30 dark:from-amber-950/40 dark:to-orange-950/20"
      : accent === "violet"
        ? "border-violet-200/70 dark:border-violet-900/50 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/30 dark:from-violet-950/35 dark:to-fuchsia-950/15"
        : accent === "emerald"
          ? "border-emerald-200/70 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/90 to-teal-50/30 dark:from-emerald-950/40 dark:to-teal-950/20"
          : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40";

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm shadow-zinc-900/[0.03] dark:shadow-none ${ring}`}
    >
      <div className="flex items-start gap-3 mb-4">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 ring-1 ring-zinc-200/60 dark:ring-zinc-700">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0 pt-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function ResultList({ label, items }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4 first:mt-0">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <ul className="space-y-2 border-l-2 border-zinc-300/80 pl-3 dark:border-zinc-600">
        {items.map((w, i) => (
          <li
            key={i}
            className="text-sm leading-snug text-zinc-800 dark:text-zinc-200"
          >
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WriteWorkspace({ ideaId }) {
  const [html, setHtml] = useState("<p></p>");
  const [loadError, setLoadError] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");

  const [mode, setMode] = useState("rhyme");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [selectedText, setSelectedText] = useState("");
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [selectionError, setSelectionError] = useState(null);
  const [selectionResult, setSelectionResult] = useState(null);

  const [manualOpen, setManualOpen] = useState(true);
  const prevSelectedRef = useRef("");
  const saveTimerRef = useRef(null);

  const [voiceNotes, setVoiceNotes] = useState([]);
  const [vnName, setVnName] = useState("");
  const [vnUploading, setVnUploading] = useState(false);
  const [vnError, setVnError] = useState(null);
  const audioFileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingDoc(true);
    setLoadError(null);
    fetch(`/api/ideas/${ideaId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setLoadError(data.error);
          return;
        }
        setHtml(data.content || "<p></p>");
        setVoiceNotes(Array.isArray(data.voiceNotes) ? data.voiceNotes : []);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoadingDoc(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ideaId]);

  useEffect(() => {
    if (loadingDoc || loadError) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      setSaveStatus("saving");
      fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: html }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        })
        .catch(() => {
          setSaveStatus("error");
        });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [html, ideaId, loadingDoc, loadError]);

  const handleWordSelect = useCallback((text) => {
    setSelectedText(text);
  }, []);

  useEffect(() => {
    const prev = prevSelectedRef.current;
    const had = prev.length > 0;
    const has = selectedText.length > 0;
    prevSelectedRef.current = selectedText;
    if (!had && has) setManualOpen(false);
    if (had && !has) setManualOpen(true);
  }, [selectedText]);

  useEffect(() => {
    if (!selectedText) {
      setSelectionResult(null);
      setSelectionError(null);
      setSelectionLoading(false);
      return;
    }

    const ac = new AbortController();
    setSelectionLoading(true);
    setSelectionError(null);
    setSelectionResult(null);

    const params = new URLSearchParams({
      mode: "selection",
      q: selectedText,
    });
    fetch(`/api/write-tools?${params.toString()}`, { signal: ac.signal })
      .then((res) => res.json())
      .then((data) => {
        if (ac.signal.aborted) return;
        if (data.error) {
          setSelectionError(data.error);
          setSelectionResult(null);
        } else {
          setSelectionResult(data);
        }
      })
      .catch((err) => {
        if (ac.signal.aborted || err.name === "AbortError") return;
        setSelectionError(err.message || "Failed");
        setSelectionResult(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setSelectionLoading(false);
      });

    return () => ac.abort();
  }, [selectedText]);

  async function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError("Type something first.");
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({ mode, q });
      const res = await fetch(`/api/write-tools?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const modeMeta = MODE_OPTIONS.find((m) => m.value === mode);

  async function handleUploadVoiceNote() {
    const file = audioFileRef.current?.files?.[0];
    if (!file) {
      setVnError("Choose an audio file.");
      return;
    }
    setVnUploading(true);
    setVnError(null);
    try {
      const fd = new FormData();
      fd.append("name", vnName.trim() || "Voice note");
      fd.append("file", file);
      const res = await fetch(`/api/ideas/${ideaId}/voice-notes`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setVoiceNotes((prev) => [...prev, data.voiceNote]);
      setVnName("");
      if (audioFileRef.current) audioFileRef.current.value = "";
    } catch (e) {
      setVnError(e.message || "Upload failed");
    } finally {
      setVnUploading(false);
    }
  }

  async function handleDeleteVoiceNote(noteId) {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/voice-notes/${noteId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setVoiceNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (e) {
      setVnError(e.message || "Delete failed");
    }
  }

  if (loadingDoc) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-zinc-100/80 dark:bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your idea…</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-zinc-100/80 px-4 py-16 dark:bg-zinc-950">
        <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900/40 dark:bg-zinc-900">
          <p className="text-red-700 dark:text-red-400">{loadError}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
          >
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100/80 dark:bg-zinc-950">
      <div className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Link
              href="/"
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                  Write
                </h1>
                {saveStatus === "saving" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200/80 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Saved
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/50 dark:text-red-300">
                    Save failed
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Autosaves as you type. Add voice notes in the panel — highlight
                text for meaning, rhymes, and alternates.
              </p>
            </div>
          </div>
          <Link
            href="/daily"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 sm:self-center"
          >
            <BookOpen className="h-4 w-4 opacity-70" />
            Daily inspiration
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="grid gap-8 xl:grid-cols-[1fr_min(22rem,100%)] xl:items-start">
          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <PenLine className="h-4 w-4" strokeWidth={2} />
              <span className="text-sm font-medium">Your draft</span>
            </div>
            <RichTextEditor
              value={html}
              onChange={setHtml}
              onWordSelect={handleWordSelect}
              placeholder="Start writing…"
            />
          </div>

          <div className="flex flex-col gap-5 xl:sticky xl:top-6 xl:self-start">
            <SectionCard
              icon={MousePointerClick}
              title="From your selection"
              description="Select a word or short phrase in the editor. We fetch meaning, 3 rhymes, and 3 alternates."
              accent="amber"
            >
              {selectionLoading && (
                <div className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-700 dark:text-amber-400" />
                  <span>Getting ideas for your selection…</span>
                </div>
              )}
              {selectionError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {selectionError}
                </p>
              )}
              {!selectionLoading &&
                !selectionError &&
                selectedText &&
                selectionResult && (
                  <div className="space-y-4">
                    <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-800 ring-1 ring-amber-200/80 dark:bg-zinc-900/90 dark:text-zinc-200 dark:ring-amber-900/50">
                      <span className="truncate" title={selectedText}>
                        “{selectedText}”
                      </span>
                    </div>
                    {selectionResult.meaning ? (
                      <div>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Meaning
                        </p>
                        <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                          {selectionResult.meaning}
                        </p>
                      </div>
                    ) : null}
                    <ResultList label="Rhymes" items={selectionResult.rhymes} />
                    <ResultList
                      label="Alternates"
                      items={selectionResult.alternates}
                    />
                  </div>
                )}
              {!selectedText && !selectionLoading && (
                <div className="rounded-xl border border-dashed border-amber-300/60 bg-white/50 px-4 py-8 text-center dark:border-amber-900/40 dark:bg-zinc-950/30">
                  <MousePointerClick className="mx-auto mb-2 h-8 w-8 text-amber-700/50 dark:text-amber-500/40" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Highlight a word or phrase in the editor to see suggestions
                    here.
                  </p>
                </div>
              )}
            </SectionCard>

            <section
              className={`rounded-2xl border border-violet-200/70 dark:border-violet-900/50 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/30 dark:from-violet-950/35 dark:to-fuchsia-950/15 shadow-sm shadow-zinc-900/[0.03] dark:shadow-none ${manualOpen ? "p-5" : "p-3"}`}
            >
              <button
                type="button"
                onClick={() => setManualOpen((o) => !o)}
                className="flex w-full items-start gap-3 rounded-xl text-left transition-colors hover:bg-white/40 dark:hover:bg-zinc-900/30 -m-1 p-1"
                aria-expanded={manualOpen}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-zinc-700 ring-1 ring-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-200 dark:ring-zinc-700">
                  <Wand2 className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Manual lookup
                  </h2>
                  {manualOpen ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      Pick a mode, type a word or mood, then get suggestions.
                    </p>
                  ) : selectedText ? (
                    <p className="mt-0.5 text-xs text-violet-700/90 dark:text-violet-300/90">
                      Collapsed while you have text selected — tap to expand.
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                      Tap to expand
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`mt-2 h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-400 ${manualOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {manualOpen && (
                <div className="mt-4 space-y-0 border-t border-violet-200/60 pt-4 dark:border-violet-900/40">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Mode
                      </label>
                      <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400/20 transition-shadow focus:border-violet-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-violet-600 dark:focus:ring-violet-900/30"
                      >
                        {MODE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {modeMeta?.hint && (
                        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
                          {modeMeta.hint}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Input
                      </label>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                          mode === "emotion"
                            ? "e.g. nostalgia, heartbreak"
                            : "Word or phrase…"
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400/20 placeholder:text-zinc-400 focus:border-violet-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-violet-600 dark:focus:ring-violet-900/30"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 opacity-90" />
                          Suggest
                        </>
                      )}
                    </button>
                  </form>

                  {error && (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                      {error}
                    </p>
                  )}

                  {result && !error && (
                    <div className="mt-5 border-t border-violet-200/60 pt-5 dark:border-violet-900/40">
                      {result.meaning ? (
                        <div>
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Meaning
                          </p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                            {result.meaning}
                          </p>
                        </div>
                      ) : null}
                      {result.words && result.words.length > 0 ? (
                        <ResultList
                          label={
                            mode === "rhyme"
                              ? "Rhyming ideas"
                              : mode === "alternates"
                                ? "Alternates"
                                : "Words"
                          }
                          items={result.words}
                        />
                      ) : null}
                      {result.mode === "meaning" && !result.meaning && (
                        <p className="text-sm text-zinc-500">
                          No meaning returned.
                        </p>
                      )}
                      {result.words?.length === 0 &&
                        result.mode !== "meaning" &&
                        !result.meaning && (
                          <p className="text-sm text-zinc-500">
                            No suggestions.
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <SectionCard
              icon={Mic}
              title="Voice notes"
              description="Upload recordings (webm, mp3, m4a, wav, ogg). Give each one a name."
              accent="emerald"
            >
              <div className="space-y-3">
                {voiceNotes.length === 0 && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    No voice notes yet — add a take below.
                  </p>
                )}
                {voiceNotes.map((vn) => (
                  <div
                    key={vn.id}
                    className="rounded-xl border border-emerald-200/60 bg-white/80 p-3 dark:border-emerald-900/40 dark:bg-zinc-950/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {vn.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDeleteVoiceNote(vn.id)}
                        className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        aria-label={`Delete ${vn.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {vn.url ? (
                      <audio
                        controls
                        src={vn.url}
                        className="mt-2 h-10 w-full"
                        preload="metadata"
                      />
                    ) : (
                      <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
                        Playback link unavailable — check GCS credentials and
                        bucket.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3 border-t border-emerald-200/60 pt-4 dark:border-emerald-900/40">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Name
                  </label>
                  <input
                    type="text"
                    value={vnName}
                    onChange={(e) => setVnName(e.target.value)}
                    placeholder="e.g. Chorus melody idea"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Audio file
                  </label>
                  <input
                    ref={audioFileRef}
                    type="file"
                    accept="audio/*,.webm,.mp3,.m4a,.wav,.ogg"
                    className="w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-900 dark:text-zinc-300 dark:file:bg-emerald-950 dark:file:text-emerald-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUploadVoiceNote}
                  disabled={vnUploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  {vnUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Add voice note
                    </>
                  )}
                </button>
                {vnError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {vnError}
                  </p>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}
