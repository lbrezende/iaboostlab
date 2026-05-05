'use client';

import { Check } from 'lucide-react';
import { useTransition, useState } from 'react';
import { toggleComplete } from '@/app/actions';
import { cn, formatTaskDate } from '@/lib/utils';
import type { Task } from '@prisma/client';
import { TaskEditModal } from './task-edit-modal';

export function TaskRow({ task }: { task: Task }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const due = formatTaskDate(task.dueDate);

  return (
    <>
      <li
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-card cursor-pointer',
          pending && 'opacity-50',
          task.completed && 'task-row--done'
        )}
        onClick={() => setEditing(true)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            start(() => toggleComplete(task.id));
          }}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          className={cn(
            'grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
            task.completed
              ? 'border-primary bg-primary text-primary-fg'
              : 'border-border hover:border-primary'
          )}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className={cn('strike', task.completed && 'strike--on')}>
              {task.title}
            </span>
          </p>
          {(due || task.list !== 'Personal' || task.priority !== 'medium') && (
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              {due && <span>⏱ {due}</span>}
              {task.list !== 'Personal' && <span>· {task.list}</span>}
              {task.priority === 'high' && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  high
                </span>
              )}
            </div>
          )}
        </div>
      </li>
      {editing && <TaskEditModal task={task} onClose={() => setEditing(false)} />}
    </>
  );
}
