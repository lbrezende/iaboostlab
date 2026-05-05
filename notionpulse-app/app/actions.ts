'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const NewTask = z.object({
  title: z.string().min(1).max(280),
  notes: z.string().max(2000).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  list: z.string().max(60).nullable().optional(),
});

export async function createTask(input: z.input<typeof NewTask>) {
  const data = NewTask.parse(input);
  const task = await prisma.task.create({
    data: {
      title: data.title,
      notes: data.notes ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority,
      list: data.list ?? 'Personal',
    },
  });
  revalidatePath('/');
  return task;
}

export async function createManyTasks(input: z.input<typeof NewTask>[]) {
  const tasks = input.map((t) => NewTask.parse(t));
  // SQLite + Prisma: createMany is fine but no return. We re-fetch IDs for client.
  for (const t of tasks) {
    await prisma.task.create({
      data: {
        title: t.title,
        notes: t.notes ?? null,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        priority: t.priority,
        list: t.list ?? 'Personal',
      },
    });
  }
  revalidatePath('/');
}

export async function toggleComplete(id: string) {
  const current = await prisma.task.findUnique({ where: { id } });
  if (!current) return;
  await prisma.task.update({
    where: { id },
    data: { completed: !current.completed },
  });
  revalidatePath('/');
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath('/');
}

const UpdateTask = NewTask.partial().extend({ id: z.string() });
export async function updateTask(input: z.input<typeof UpdateTask>) {
  const { id, ...rest } = UpdateTask.parse(input);
  // Build a clean update payload: only include fields the caller actually
  // sent, and coerce nullable string fields away from null where the schema
  // doesn't allow it ("list" is non-null with a default).
  const data: Record<string, unknown> = {};
  if (rest.title !== undefined) data.title = rest.title;
  if (rest.notes !== undefined) data.notes = rest.notes;
  if (rest.priority !== undefined) data.priority = rest.priority;
  if (rest.list !== undefined && rest.list !== null) data.list = rest.list;
  if (rest.dueDate !== undefined) {
    data.dueDate = rest.dueDate ? new Date(rest.dueDate) : null;
  }
  await prisma.task.update({ where: { id }, data });
  revalidatePath('/');
  revalidatePath(`/task/${id}`);
}
