'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, X, Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createManyTasks } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';

type State = 'idle' | 'recording' | 'processing' | 'result' | 'error';

interface ExtractedTask {
  title: string;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
  list?: string | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function VoiceModal({ open, onClose }: Props) {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(new Array(16).fill(0));
  const [adding, setAdding] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  // Cleanup helpers
  function stopVisualization() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;
  }
  function teardownStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }
  function reset() {
    stopVisualization();
    teardownStream();
    setState('idle');
    setError(null);
    setTranscript('');
    setTasks([]);
    setElapsed(0);
    setLevels(new Array(16).fill(0));
    chunksRef.current = [];
  }

  useEffect(() => {
    if (!open) {
      reset();
    }
    return () => {
      stopVisualization();
      teardownStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio for live levels
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx: AudioContext = new Ctx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = handleStopped;
      recorder.start();

      setState('recording');
      startedAtRef.current = Date.now();
      setElapsed(0);

      // Live waveform
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const bands = 16;
        const step = Math.floor(data.length / bands);
        const out: number[] = [];
        for (let i = 0; i < bands; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += data[i * step + j];
          out.push(sum / step / 255);
        }
        setLevels(out);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      // Timer
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 200);
    } catch (err: any) {
      setError(err?.message ?? 'Could not access microphone');
      setState('error');
    }
  }

  async function handleStopped() {
    stopVisualization();
    teardownStream();

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    if (blob.size === 0) {
      setError('No audio captured');
      setState('error');
      return;
    }

    setState('processing');
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'voice.webm');
      const res = await fetch('/api/voice', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setTranscript(data.transcript ?? '');
      setTasks(data.tasks ?? []);
      setState('result');
    } catch (err: any) {
      setError(err?.message ?? 'Processing failed');
      setState('error');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function addAll() {
    if (tasks.length === 0) return;
    setAdding(true);
    try {
      await createManyTasks(tasks);
      onClose();
    } finally {
      setAdding(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        className="relative w-full max-w-md rounded-3xl bg-bg p-6 shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted hover:bg-card"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="mb-1 text-lg font-semibold">Create by voice</h2>
        <p className="mb-6 text-sm text-muted">
          {state === 'idle' && 'Tap to record. We’ll turn your speech into tasks.'}
          {state === 'recording' && 'Listening… speak naturally.'}
          {state === 'processing' && 'Transcribing and extracting tasks…'}
          {state === 'result' && (tasks.length === 0 ? 'No tasks detected.' : `Found ${tasks.length} task${tasks.length === 1 ? '' : 's'}.`)}
          {state === 'error' && 'Something went wrong.'}
        </p>

        {/* IDLE */}
        {state === 'idle' && (
          <div className="grid place-items-center py-8">
            <button
              onClick={startRecording}
              className="grid size-28 place-items-center rounded-full bg-primary text-primary-fg shadow-lg shadow-primary/30 transition-transform active:scale-95"
              aria-label="Start recording"
            >
              <Mic size={36} strokeWidth={1.6} />
            </button>
            <p className="mt-6 max-w-xs text-center text-xs text-muted">
              Try: &ldquo;Call Alex tomorrow at 10 a.m., buy groceries, prepare slides for the workshop on Friday.&rdquo;
            </p>
          </div>
        )}

        {/* RECORDING */}
        {state === 'recording' && (
          <div className="grid place-items-center py-6">
            <div className="relative grid size-32 place-items-center">
              <span className="absolute inset-0 rounded-full border border-primary/30 ring-pulse" />
              <span className="absolute inset-0 rounded-full border border-primary/30 ring-pulse" style={{ animationDelay: '0.8s' }} />
              <span className="absolute inset-0 rounded-full border border-primary/30 ring-pulse" style={{ animationDelay: '1.6s' }} />
              <div className="z-10 grid size-20 place-items-center rounded-full bg-primary text-primary-fg shadow-lg">
                <Mic size={28} strokeWidth={1.6} />
              </div>
            </div>

            {/* Waveform */}
            <div className="mt-8 flex h-16 items-center justify-center text-primary">
              {levels.map((l, i) => (
                <span
                  key={i}
                  className="wave-bar"
                  style={{ height: `${Math.max(4, l * 64)}px` }}
                />
              ))}
            </div>

            <p className="mt-4 text-sm tabular-nums text-muted">
              <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-red-500" />
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { reset(); }}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted hover:bg-card"
              >
                Cancel
              </button>
              <button
                onClick={stopRecording}
                className="rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg"
              >
                Stop &amp; transcribe
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {state === 'processing' && (
          <div className="grid place-items-center py-12">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="mt-6 text-sm text-muted">This usually takes a few seconds…</p>
          </div>
        )}

        {/* RESULT */}
        {state === 'result' && (
          <div className="space-y-4 py-2">
            {transcript && (
              <details className="rounded-xl bg-card px-4 py-3 text-sm text-muted">
                <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider">
                  Transcript
                </summary>
                <p className="mt-2 leading-relaxed">{transcript}</p>
              </details>
            )}

            {tasks.length > 0 ? (
              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {tasks.map((t, i) => (
                  <li key={i} className="rounded-xl border border-border bg-card p-3">
                    <p className="text-sm font-medium">{t.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                      {t.dueDate && <Pill>{formatPretty(t.dueDate)}</Pill>}
                      {t.priority && t.priority !== 'medium' && <Pill tone={t.priority}>{t.priority}</Pill>}
                      {t.list && <Pill>{t.list}</Pill>}
                    </div>
                    {t.notes && <p className="mt-1.5 text-xs text-muted">{t.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl bg-card p-8 text-center text-sm text-muted">
                We didn&apos;t detect any actionable tasks. Try speaking more directly.
              </div>
            )}

            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={() => { reset(); }}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted hover:bg-card"
              >
                Try again
              </button>
              <button
                onClick={addAll}
                disabled={tasks.length === 0 || adding}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg disabled:opacity-50"
              >
                {adding ? <Loader2 className="size-4 animate-spin" /> : <Check size={16} />}
                Add {tasks.length || ''}
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div className="grid place-items-center py-10">
            <AlertCircle className="size-10 text-red-500" />
            <p className="mt-4 text-center text-sm text-muted">{error}</p>
            <button
              onClick={() => { reset(); }}
              className="mt-6 inline-flex items-center gap-1 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg"
            >
              Try again <ArrowRight size={14} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: 'low' | 'medium' | 'high' }) {
  const toneClass = tone === 'high'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    : tone === 'low'
    ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  return (
    <span className={cn('rounded-full px-2 py-0.5 font-medium', toneClass)}>
      {children}
    </span>
  );
}

function formatPretty(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
