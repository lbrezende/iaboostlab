import OpenAI from 'openai';
import { z } from 'zod';

let _client: OpenAI | null = null;

function client() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

/**
 * Transcribe an audio Blob/File via Whisper.
 * Accepts a File-like object with arrayBuffer() so it works in Next.js Route Handlers.
 */
export async function transcribe(audio: File | Blob, filename = 'audio.webm') {
  const file = audio instanceof File ? audio : new File([audio], filename, { type: audio.type });
  const result = await client().audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });
  return result.text;
}

const TaskOut = z.object({
  title: z.string().min(1),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  list: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const TasksOut = z.object({
  tasks: z.array(TaskOut),
});

export type ExtractedTask = z.infer<typeof TaskOut>;

const SYSTEM_PROMPT = `You convert spoken voice transcripts into actionable tasks.

Return strict JSON shaped exactly:
{ "tasks": [{ "title": "string", "dueDate": "ISO 8601 or null", "priority": "low" | "medium" | "high", "list": "string or null", "notes": "string or null" }] }

Rules:
- Split compound utterances ("X and Y and also Z") into separate tasks.
- Resolve relative dates against the current ISO date provided in the user message. Convert "tomorrow at 10am" → ISO datetime.
- Priority defaults to "medium" unless words like urgent/asap/important suggest "high", or "later/sometime/maybe" suggest "low".
- "list" is a project/category name only when explicitly mentioned ("for work", "shopping list", "groceries"). Otherwise null.
- "notes" only when there are details beyond the title.
- Keep the title concise and imperative ("Call Alex about the trip", not "I need to call Alex about the trip").`;

export async function extractTasks(transcript: string): Promise<ExtractedTask[]> {
  const today = new Date().toISOString();
  const completion = await client().chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Current ISO datetime: ${today}\n\nTranscript:\n${transcript}` },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? '{"tasks":[]}';
  const parsed = TasksOut.safeParse(JSON.parse(raw));
  if (!parsed.success) return [];
  return parsed.data.tasks;
}
