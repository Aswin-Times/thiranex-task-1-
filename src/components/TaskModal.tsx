import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, X } from 'lucide-react';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types';

interface Props {
  task: Task | null;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
}

const emptyTask: TaskInput = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: null };

export function TaskModal({ task, onClose, onSave }: Props) {
  const [form, setForm] = useState<TaskInput>(emptyTask);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(task ? { title: task.title, description: task.description, status: task.status, priority: task.priority, dueDate: task.dueDate } : emptyTask);
  }, [task]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save task.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="modal-header">
          <div><span className="eyebrow">{task ? 'UPDATE TASK' : 'NEW TASK'}</span><h2 id="task-modal-title">{task ? 'Edit your task' : 'What needs doing?'}</h2></div>
          <button className="icon-button icon-button--surface" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="task-form">
          <label>Task title<input autoFocus required maxLength={100} placeholder="e.g. Prepare the project demo" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Notes <span className="optional">Optional</span><textarea rows={4} maxLength={500} placeholder="Add useful context, links, or next steps…" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className="form-grid">
            <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
            <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          </div>
          <label>Due date <span className="optional">Optional</span><span className="date-input"><CalendarDays size={18} /><input type="date" value={form.dueDate ?? ''} onChange={(event) => setForm({ ...form, dueDate: event.target.value || null })} /></span></label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}</button></div>
        </form>
      </section>
    </div>
  );
}

