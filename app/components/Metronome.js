"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, SlidersHorizontal, Volume2 } from "lucide-react";

const RHYTHMS = [
  { id: "4-4", label: "4/4", beatsPerBar: 4, accentBeats: [1] },
  { id: "3-4", label: "3/4", beatsPerBar: 3, accentBeats: [1] },
  // Common feel: accent on 1 and 4 (1-2-3 4-5-6)
  { id: "6-8", label: "6/8", beatsPerBar: 6, accentBeats: [1, 4] },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function Metronome() {
  const [bpm, setBpm] = useState(92);
  const [rhythmId, setRhythmId] = useState("4-4");
  const [subdivision, setSubdivision] = useState(1); // 1 = quarter (or 8th in 6/8 counting), 2 = eighths, 3 = triplets
  const [volume, setVolume] = useState(0.6);
  const [running, setRunning] = useState(false);

  const rhythm = useMemo(
    () => RHYTHMS.find((r) => r.id === rhythmId) || RHYTHMS[0],
    [rhythmId]
  );

  // Audio refs
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);

  // Scheduler refs
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const timerIdRef = useRef(null);

  const lookaheadMs = 25;
  const scheduleAheadSec = 0.12;

  function ensureAudio() {
    if (audioCtxRef.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    audioCtxRef.current = ctx;
    masterGainRef.current = gain;
  }

  function tick({ time, accent }) {
    const ctx = audioCtxRef.current;
    const gain = masterGainRef.current;
    if (!ctx || !gain) return;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    // Accent click is slightly higher + louder
    const freq = accent ? 1200 : 850;
    const amp = accent ? 0.9 : 0.55;

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, time);

    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(amp, time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(env);
    env.connect(gain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  function stepDurationSec() {
    // Base beat duration is quarter-note at BPM.
    // For 6/8 we still treat BPM as quarter-note feel; this is "good enough" for now.
    const beatSec = 60 / clamp(Number(bpm) || 92, 40, 220);
    return beatSec / clamp(Number(subdivision) || 1, 1, 4);
  }

  function schedule() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const stepSec = stepDurationSec();
    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadSec) {
      const step = currentStepRef.current;
      const beatIndex = Math.floor(step / subdivision) % rhythm.beatsPerBar; // 0-based
      const onBeatBoundary = step % subdivision === 0;
      const beatNumber = beatIndex + 1;
      const accent =
        onBeatBoundary && rhythm.accentBeats.includes(beatNumber);

      // Only click on each subdivision step.
      tick({ time: nextNoteTimeRef.current, accent });

      nextNoteTimeRef.current += stepSec;
      currentStepRef.current += 1;
    }
  }

  async function start() {
    ensureAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();

    currentStepRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.06;

    if (timerIdRef.current) clearInterval(timerIdRef.current);
    timerIdRef.current = setInterval(schedule, lookaheadMs);
    setRunning(true);
  }

  function stop() {
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    timerIdRef.current = null;
    setRunning(false);
  }

  // Update volume live
  useEffect(() => {
    if (masterGainRef.current) masterGainRef.current.gain.value = volume;
  }, [volume]);

  // Restart scheduler when timing params change while running
  useEffect(() => {
    if (!running) return;
    // Soft restart: reset timeline so it feels responsive
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    currentStepRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.06;
  }, [bpm, rhythmId, subdivision, running]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      timerIdRef.current = null;
      try {
        audioCtxRef.current?.close?.();
      } catch {}
      audioCtxRef.current = null;
      masterGainRef.current = null;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Metronome
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Keep tempo while writing melodies and lyrics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => (running ? stop() : start())}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
            running
              ? "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          }`}
        >
          {running ? (
            <>
              <Pause className="h-4 w-4" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start
            </>
          )}
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            BPM
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={40}
              max={220}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full"
            />
            <input
              type="number"
              min={40}
              max={220}
              value={bpm}
              onChange={(e) => setBpm(clamp(Number(e.target.value) || 92, 40, 220))}
              className="w-20 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Rhythm
          </label>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
            <select
              value={rhythmId}
              onChange={(e) => setRhythmId(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {RHYTHMS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Subdivision
          </label>
          <select
            value={subdivision}
            onChange={(e) => setSubdivision(Number(e.target.value))}
            className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value={1}>Quarter notes</option>
            <option value={2}>Eighth notes</option>
            <option value={3}>Triplets</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Volume
          </label>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-zinc-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

