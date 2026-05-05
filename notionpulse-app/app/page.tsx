import { prisma } from '@/lib/prisma';
import { HomeShell } from '@/components/home-shell';
import { TaskRow } from '@/components/task-row';
import { QuickAdd } from '@/components/quick-add';
import type { Task } from '@prisma/client';

export const dynamic = 'force-dynamic';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function bucketTasks(tasks: Task[]) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(startOfDay.getDate() + 1);

  const today: Task[] = [];
  const scheduled: Task[] = [];
  const next: Task[] = [];

  for (const t of tasks) {
    if (!t.dueDate) {
      next.push(t);
    } else if (t.dueDate >= startOfDay && t.dueDate < endOfDay) {
      // anything today: scheduled if it has a precise time block, else "today"
      const hasTime = t.dueDate.getHours() !== 0 || t.dueDate.getMinutes() !== 0;
      (hasTime ? scheduled : today).push(t);
    } else if (t.dueDate >= endOfDay) {
      next.push(t);
    } else {
      // overdue → bring to today
      today.push(t);
    }
  }
  return { today, scheduled, next };
}

export default async function Page() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  const { today, scheduled, next } = bucketTasks(tasks);
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <HomeShell>
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-12 md:py-12">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {greeting()}, Gil
            </h1>
            <p className="mt-1 text-sm text-muted">{todayLabel}</p>
          </div>
          <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            G
          </div>
        </header>

        <QuickAdd />

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="mt-1 text-xs text-muted">
              Type above to add one, or tap the mic to capture by voice.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <Section title="Today" tasks={today} empty="Nothing due today." />
            <Section title="Scheduled" tasks={scheduled} empty="No time-blocked tasks." />
            <Section title="Next up" tasks={next} empty="Nothing planned." className="md:col-span-2" />
          </div>
        )}
      </div>
    </HomeShell>
  );
}

function Section({
  title,
  tasks,
  empty,
  className = '',
}: {
  title: string;
  tasks: Task[];
  empty: string;
  className?: string;
}) {
  return (
    <section className={className}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {title}
      </p>
      {tasks.length === 0 ? (
        <p className="rounded-xl bg-card px-4 py-3 text-xs text-muted">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </ul>
      )}
    </section>
  );
}
