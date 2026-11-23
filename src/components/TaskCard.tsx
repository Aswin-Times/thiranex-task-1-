import { format, isBefore, isToday, parseISO, startOfToday } from 'date-fns';
import { CalendarDays, Check, Circle, Clock3, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Task, TaskStatus } from '../types';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' }, { value: 'in_progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }
];

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const due = task.dueDate ? parseISO(task.dueDate) : null;
  const overdue = due && isBefore(due, startOfToday()) && task.status !== 'completed';
  const StatusIcon = task.status === 'completed' ? Check : task.status === 'in_progress' ? Clock3 : Circle;

  return (
    <article className={`task-card task-card--${task.status}`}>
      <button className={`status-check status-check--${task.status}`} onClick={() => onStatusChange(task, task.status === 'completed' ? 'todo' : 'completed')} aria-label={task.status === 'completed' ? 'Mark task as to do' : 'Mark task complete'}><StatusIcon size={17} /></button>
      <div className="task-card__body">
        <div className="task-card__top">
          <span className={`priority priority--${task.priority}`}>{task.priority}</span>
          <div className="task-menu">
            <button className="icon-button" aria-label="Task actions" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={20} /></button>
            {menuOpen && <div className="task-menu__popover"><button onClick={() => { onEdit(task); setMenuOpen(false); }}><Pencil size={15} /> Edit</button><button className="danger" onClick={() => { onDelete(task); setMenuOpen(false); }}><Trash2 size={15} /> Delete</button></div>}
          </div>
        </div>
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
        <div className="task-card__meta">
          <select aria-label="Task status" value={task.status} onChange={(event) => onStatusChange(task, event.target.value as TaskStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          {due && <span className={overdue ? 'date-chip date-chip--overdue' : 'date-chip'}><CalendarDays size={14} />{isToday(due) ? 'Today' : format(due, 'MMM d')}</span>}
        </div>
      </div>
    </article>
  );
}

