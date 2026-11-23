import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import type { Task, User } from '../types';

const user: User = { id: 'u1', name: 'Alex Morgan', email: 'alex@example.com', createdAt: new Date().toISOString() };
const tasks: Task[] = [
  { id: 't1', userId: 'u1', title: 'Prepare project demo', description: 'Show the completed dashboard', status: 'in_progress', priority: 'high', dueDate: '2027-01-10', createdAt: '', updatedAt: '' },
  { id: 't2', userId: 'u1', title: 'Send weekly update', description: '', status: 'completed', priority: 'low', dueDate: null, createdAt: '', updatedAt: '' }
];

function renderDashboard() {
  return render(<Dashboard user={user} tasks={tasks} connected onLogout={vi.fn()} onCreate={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
}

describe('Dashboard', () => {
  it('shows progress and filters tasks by status', () => {
    renderDashboard();
    expect(screen.getAllByText('50%')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /Completed/ }));
    expect(screen.getByText('Send weekly update')).toBeInTheDocument();
    expect(screen.queryByText('Prepare project demo')).not.toBeInTheDocument();
  });

  it('searches task titles and opens the create dialog', () => {
    renderDashboard();
    fireEvent.change(screen.getByLabelText('Search tasks'), { target: { value: 'demo' } });
    expect(screen.getByText('Prepare project demo')).toBeInTheDocument();
    expect(screen.queryByText('Send weekly update')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /New task/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

