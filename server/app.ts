import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError, z } from 'zod';
import { type AuthenticatedRequest, requireAuth, signToken } from './auth.js';
import { JsonStore } from './store.js';
import type { PublicUser, TaskRecord, UserRecord } from './types.js';

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72)
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(50)
});

const taskSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).default(''),
  status: z.enum(['todo', 'in_progress', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().date().nullable().default(null)
});

const taskUpdateSchema = taskSchema.partial();

function publicUser(user: UserRecord): PublicUser {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export interface AppOptions {
  store?: JsonStore;
  onTaskChange?: (userId: string, event: { type: string; task?: TaskRecord; taskId?: string }) => void;
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const store = options.store ?? new JsonStore(process.env.DATABASE_FILE);

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

  app.post('/api/auth/register', async (request, response) => {
    const input = registerSchema.parse(request.body);
    const existing = await store.read((database) => database.users.find((user) => user.email === input.email));
    if (existing) return response.status(409).json({ message: 'An account with this email already exists.' });

    const user: UserRecord = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      createdAt: new Date().toISOString()
    };
    await store.update((database) => database.users.push(user));
    response.status(201).json({ token: signToken(user.id), user: publicUser(user) });
  });

  app.post('/api/auth/login', async (request, response) => {
    const input = credentialsSchema.parse(request.body);
    const user = await store.read((database) => database.users.find((candidate) => candidate.email === input.email));
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' });
    }
    response.json({ token: signToken(user.id), user: publicUser(user) });
  });

  app.get('/api/auth/me', requireAuth, async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    const user = await store.read((database) => database.users.find((candidate) => candidate.id === userId));
    if (!user) return response.status(404).json({ message: 'Account not found.' });
    response.json({ user: publicUser(user) });
  });

  app.get('/api/tasks', requireAuth, async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    const tasks = await store.read((database) =>
      database.tasks
        .filter((task) => task.userId === userId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
    response.json({ tasks });
  });

  app.post('/api/tasks', requireAuth, async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    const input = taskSchema.parse(request.body);
    const now = new Date().toISOString();
    const task: TaskRecord = { id: randomUUID(), userId, ...input, createdAt: now, updatedAt: now };
    await store.update((database) => database.tasks.push(task));
    options.onTaskChange?.(userId, { type: 'task.created', task });
    response.status(201).json({ task });
  });

  app.patch('/api/tasks/:id', requireAuth, async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    const taskId = String(request.params.id);
    const input = taskUpdateSchema.parse(request.body);
    const task = await store.update((database) => {
      const match = database.tasks.find((candidate) => candidate.id === taskId && candidate.userId === userId);
      if (!match) return null;
      Object.assign(match, input, { updatedAt: new Date().toISOString() });
      return match;
    });
    if (!task) return response.status(404).json({ message: 'Task not found.' });
    options.onTaskChange?.(userId, { type: 'task.updated', task });
    response.json({ task });
  });

  app.delete('/api/tasks/:id', requireAuth, async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    const taskId = String(request.params.id);
    const removed = await store.update((database) => {
      const index = database.tasks.findIndex((task) => task.id === taskId && task.userId === userId);
      if (index === -1) return false;
      database.tasks.splice(index, 1);
      return true;
    });
    if (!removed) return response.status(404).json({ message: 'Task not found.' });
    options.onTaskChange?.(userId, { type: 'task.deleted', taskId });
    response.status(204).end();
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      return response.status(400).json({ message: error.issues[0]?.message ?? 'Invalid request.' });
    }
    console.error(error);
    response.status(500).json({ message: 'Something went wrong. Please try again.' });
  });

  return app;
}

