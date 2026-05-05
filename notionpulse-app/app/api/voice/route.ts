import { NextRequest, NextResponse } from 'next/server';
import { transcribe, extractTasks } from '@/lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/voice
 * Body: multipart/form-data with field `audio` (Blob)
 * Response: { transcript, tasks: [...] }
 *
 * Pipeline:
 *   1. Whisper transcribes the audio.
 *   2. GPT-4o-mini extracts a structured list of tasks (JSON mode).
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio');
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: 'audio (Blob) is required' }, { status: 400 });
    }

    if (audio.size > 25 * 1024 * 1024) {
      // Whisper API limit is 25 MB
      return NextResponse.json({ error: 'audio too large (>25 MB)' }, { status: 413 });
    }

    const transcript = await transcribe(audio);
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ transcript: '', tasks: [] });
    }

    const tasks = await extractTasks(transcript);
    return NextResponse.json({ transcript, tasks });
  } catch (err: any) {
    console.error('[voice] error', err);
    return NextResponse.json(
      { error: err?.message ?? 'unknown error' },
      { status: 500 }
    );
  }
}
