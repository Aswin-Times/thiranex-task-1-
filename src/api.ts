import type { Task, TaskInput, User } from './types';

const TOKEN_KEY = 'taskflow_token';

export const session = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = session.get();
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed.' }));
    throw new Error(error.message || 'Request failed.');
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const apiClient = {
  register: (input: { name: string; email: string; password: string }) =>
    api<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: () => api<{ user: User }>('/auth/me'),
  tasks: () => api<{ tasks: Task[] }>('/tasks'),
  createTask: (input: TaskInput) => api<{ task: Task }>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
  updateTask: (id: string, input: Partial<TaskInput>) =>
    api<{ task: Task }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteTask: (id: string) => api<void>(`/tasks/${id}`, { method: 'DELETE' })
};

