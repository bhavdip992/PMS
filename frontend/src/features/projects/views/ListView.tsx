import React from 'react';
import { Play, Trash2, Clock } from 'lucide-react';
import api from '../../../services/api.tsx';

interface ListViewProps {
  tasks: any[];
  onTaskUpdated: () => void;
  onTaskClick: (taskId: string) => void;
  onStartTimer: (taskId: string, title: string) => void;
}

export default function ListView({ tasks, onTaskUpdated, onTaskClick, onStartTimer }: ListViewProps) {
  const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        onTaskUpdated();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  const handleUpdateStatus = async (e: React.ChangeEvent<HTMLSelectElement>, taskId: string) => {
    e.stopPropagation();
    try {
      await api.put(`/tasks/${taskId}`, { status: e.target.value });
      onTaskUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  return (
    <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[hsl(var(--espark-surface-2))] border-b border-[hsl(var(--espark-border))] text-[hsl(var(--espark-muted))] uppercase tracking-wider font-bold">
              <th className="p-4">Task Name</th>
              <th className="p-4">Status</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Est. Hours</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--espark-border))/0.4]">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[hsl(var(--espark-muted))] font-medium">
                  No tasks in this workspace.
                </td>
              </tr>
            ) : (
              tasks.map((t) => (
                <tr 
                  key={t._id}
                  onClick={() => onTaskClick(t._id)}
                  className="hover:bg-[hsl(var(--espark-surface-2))/0.4] cursor-pointer transition-colors"
                >
                  <td className="p-4 font-bold text-[hsl(var(--espark-text))] max-w-xs truncate">
                    {t.title}
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <select 
                      value={t.status}
                      onChange={(e) => handleUpdateStatus(e, t._id)}
                      className="bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[hsl(var(--espark-text))] rounded-lg px-2 py-1 outline-none text-xs"
                    >
                      {['Backlog', 'Todo', 'In Progress', 'In Review', 'QA Ready', 'Done'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'Critical' ? 'bg-red-500/10 text-red-400' :
                      t.priority === 'High' ? 'bg-amber-500/10 text-amber-400' :
                      t.priority === 'Medium' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-4 text-[hsl(var(--espark-text))] font-mono">{t.estimatedHours || 0}h</td>
                  <td className="p-4 text-[hsl(var(--espark-muted))]">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onStartTimer(t._id, t.title)}
                        className="flex items-center space-x-1 px-2 py-1 bg-[hsl(var(--espark-primary))/0.1] hover:bg-[hsl(var(--espark-primary))/0.2] border border-[hsl(var(--espark-primary))/0.3] text-[hsl(var(--espark-primary))] rounded-lg transition-all"
                      >
                        <Play size={10} fill="currentColor" />
                        <span>Track</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteTask(e, t._id)}
                        className="p-1 rounded bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[hsl(var(--espark-muted))] hover:text-red-400 hover:border-red-900/40 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
