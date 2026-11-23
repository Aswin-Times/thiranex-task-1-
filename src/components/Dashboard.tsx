import { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, ClipboardList, Clock3, LayoutGrid, ListFilter, LogOut, Menu, Plus, Search, Sparkles, X } from 'lucide-react';
import { Brand } from './Brand';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import type { Task, TaskInput, TaskStatus, User } from '../types';

type Filter = 'all' | TaskStatus;

interface Props {
  user: User;
  tasks: Task[];
  connected: boolean;
  onLogout: () => void;
  onCreate: (input: TaskInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<TaskInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const filters: { value: Filter; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'all', label: 'All tasks', icon: LayoutGrid },
  { value: 'todo', label: 'To do', icon: ClipboardList },
  { value: 'in_progress', label: 'In progress', icon: Clock3 },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 }
];

export function Dashboard({ user, tasks, connected, onLogout, onCreate, onUpdate, onDelete }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const normalizedQuery = query.trim().toLowerCase();
    return matchesFilter && (!normalizedQuery || `${task.title} ${task.description}`.toLowerCase().includes(normalizedQuery));
  }), [tasks, filter, query]);

  const completed = tasks.filter((task) => task.status === 'completed').length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const counts = Object.fromEntries(filters.map(({ value }) => [value, value === 'all' ? tasks.length : tasks.filter((task) => task.status === value).length]));

  function chooseFilter(value: Filter) {
    setFilter(value);
    setSidebarOpen(false);
  }

  function openCreate() {
    setEditingTask(null);
    setModalOpen(true);
  }

  async function saveTask(input: TaskInput) {
    if (editingTask) await onUpdate(editingTask.id, input);
    else await onCreate(input);
  }

  async function deleteTask(task: Task) {
    if (window.confirm(`Delete “${task.title}”? This cannot be undone.`)) await onDelete(task.id);
  }

  return (
    <main className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand"><Brand /><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <nav className="sidebar-nav" aria-label="Task filters">
          <span className="sidebar-label">WORKSPACE</span>
          {filters.map(({ value, label, icon: Icon }) => (
            <button key={value} className={filter === value ? 'active' : ''} onClick={() => chooseFilter(value)}><Icon size={18} /><span>{label}</span><strong>{counts[value]}</strong></button>
          ))}
        </nav>
        <div className="progress-card">
          <div className="progress-card__heading"><span><Sparkles size={15} /> Weekly progress</span><strong>{progress}%</strong></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <p>{completed} of {tasks.length} tasks completed</p>
        </div>
        <div className="sidebar__profile">
          <span className="avatar">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
          <span><strong>{user.name}</strong><small>{user.email}</small></span>
          <button className="icon-button" onClick={onLogout} aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div className="search-box"><Search size={18} /><input aria-label="Search tasks" placeholder="Search your tasks…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search"><X size={17} /></button>}</div>
          <span className={`connection-status ${connected ? 'online' : ''}`}><i />{connected ? 'Live' : 'Reconnecting'}</span>
          <button className="primary-button topbar-add" onClick={openCreate}><Plus size={18} /> Add task</button>
        </header>

        <div className="workspace__content">
          <div className="page-heading">
            <div><span className="eyebrow">MY WORKSPACE</span><h1>{filter === 'all' ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user.name.split(' ')[0]}.` : filters.find((item) => item.value === filter)?.label}</h1><p>{filter === 'all' ? 'Here’s what deserves your attention today.' : `${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'} in this view.`}</p></div>
            <button className="primary-button page-add" onClick={openCreate}><Plus size={18} /> New task</button>
          </div>

          <div className="overview-grid">
            <div className="overview-card"><span className="overview-icon overview-icon--purple"><ClipboardList size={20} /></span><span><small>Total tasks</small><strong>{tasks.length}</strong></span></div>
            <div className="overview-card"><span className="overview-icon overview-icon--amber"><Clock3 size={20} /></span><span><small>In progress</small><strong>{counts.in_progress}</strong></span></div>
            <div className="overview-card"><span className="overview-icon overview-icon--green"><CheckCircle2 size={20} /></span><span><small>Completed</small><strong>{completed}</strong></span></div>
            <div className="overview-card overview-card--progress"><span className="overview-icon overview-icon--blue"><BarChart3 size={20} /></span><span><small>Completion</small><strong>{progress}%</strong></span><div className="mini-progress"><i style={{ width: `${progress}%` }} /></div></div>
          </div>

          <div className="tasks-heading"><div><h2>{query ? 'Search results' : filters.find((item) => item.value === filter)?.label}</h2><span>{visibleTasks.length} task{visibleTasks.length === 1 ? '' : 's'}</span></div><button className="filter-chip"><ListFilter size={15} /> {filter === 'all' ? 'All' : filters.find((item) => item.value === filter)?.label}</button></div>

          {visibleTasks.length ? (
            <div className="task-grid">{visibleTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={(selected) => { setEditingTask(selected); setModalOpen(true); }} onDelete={deleteTask} onStatusChange={(selected, status) => onUpdate(selected.id, { status })} />)}</div>
          ) : (
            <div className="empty-state"><span><ClipboardList size={28} /></span><h3>{query ? 'No tasks match your search' : filter === 'all' ? 'A clear slate. Let’s begin.' : 'Nothing here yet'}</h3><p>{query ? 'Try a different keyword or clear the search.' : 'Create a task and turn your next intention into progress.'}</p>{!query && <button className="primary-button" onClick={openCreate}><Plus size={18} /> Create your first task</button>}</div>
          )}
        </div>
      </section>

      {modalOpen && <TaskModal task={editingTask} onClose={() => setModalOpen(false)} onSave={saveTask} />}
    </main>
  );
}

