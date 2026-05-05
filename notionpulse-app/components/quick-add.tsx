'use client';

import { Plus, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { createTask } from '@/app/actions';

export function QuickAdd() {
  const [title, setTitle] = useState('');
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    start(async () => {
      await createTask({ title: t, priority: 'medium' });
      setTitle('');
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors focus-within:border-primary"
    >
      <Plus size={16} className="text-muted" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task and press Enter…"
        className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none"
        disabled={pending}
      />
      {pending && <Loader2 size={14} className="animate-spin text-muted" />}
    </form>
  );
}
