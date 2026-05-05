'use client';

import { useState, useTransition } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateTask, deleteTask } from '@/app/actions';
import { cn } from '@/lib/utils';
import type { Task } from '@prisma/client';

interface Props {
  task: Task;
  onClose: () => void;
}

export function TaskEditModal({ task, onClose }: Props) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    task.priority as 'low' | 'medium' | 'high'
  );
  const [list, setList] = useState(task.list);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
  );
  const [pending, start] = useTransition();
  const [removing, startRemove] = useTransition();

  function save() {
    start(async () => {
      await updateTask({
        id: task.id,
        title,
        notes: notes || null,
        priority,
        list: list || 'Personal',
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      onClose();
    });
  }

  function remove() {
    if (!confirm('Delete this task?')) return;
    startRemove(async () => {
      await deleteTask(task.id);
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md rounded-t-3xl bg-bg p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted hover:bg-card"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="mb-5 text-lg font-semibold">Edit task</h2>

        <div className="space-y-4">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Task title"
              autoFocus
            />
          </Field>

          <Field label="Due date &amp; time">
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Priority">
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors',
                    priority === p
                      ? 'bg-primary text-primary-fg'
                      : 'bg-card text-muted hover:bg-card/70'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>

          <Field label="List">
            <input
              value={list}
              onChange={(e) => setList(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Personal"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Add details…"
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={remove}
            disabled={removing || pending}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
          >
            {removing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-card"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={pending || !title.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-fg disabled:opacity-50"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}
