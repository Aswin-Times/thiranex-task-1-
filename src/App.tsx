import { useCallback, useEffect, useState } from 'react';
import { apiClient, session } from './api';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import type { Task, TaskInput, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(Boolean(session.get()));
  const [connected, setConnected] = useState(false);

  const refreshTasks = useCallback(async () => {
    const result = await apiClient.tasks();
    setTasks(result.tasks);
  }, []);

  useEffect(() => {
    if (!session.get()) return;
    Promise.all([apiClient.me(), apiClient.tasks()])
      .then(([profile, taskResult]) => { setUser(profile.user); setTasks(taskResult.tasks); })
      .catch(() => session.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    let socket: WebSocket | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}/ws?token=${encodeURIComponent(session.get() ?? '')}`);
      socket.onopen = () => setConnected(true);
      socket.onmessage = () => refreshTasks().catch(() => undefined);
      socket.onclose = () => {
        setConnected(false);
        if (active) retryTimer = setTimeout(connect, 2_000);
      };
    }

    connect();
    return () => {
      active = false;
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, [user, refreshTasks]);

  async function authenticate(mode: 'login' | 'register', input: { name: string; email: string; password: string }) {
    const result = mode === 'login' ? await apiClient.login(input) : await apiClient.register(input);
    session.set(result.token);
    setUser(result.user);
    setTasks([]);
  }

  function logout() {
    session.clear();
    setUser(null);
    setTasks([]);
  }

  async function createTask(input: TaskInput) {
    const { task } = await apiClient.createTask(input);
    setTasks((current) => [task, ...current]);
  }

  async function updateTask(id: string, input: Partial<TaskInput>) {
    const { task } = await apiClient.updateTask(id, input);
    setTasks((current) => current.map((item) => item.id === id ? task : item));
  }

  async function deleteTask(id: string) {
    await apiClient.deleteTask(id);
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  if (loading) return <div className="app-loader"><span /><p>Opening your workspace…</p></div>;
  if (!user) return <AuthScreen onAuthenticate={authenticate} />;
  return <Dashboard user={user} tasks={tasks} connected={connected} onLogout={logout} onCreate={createTask} onUpdate={updateTask} onDelete={deleteTask} />;
}

