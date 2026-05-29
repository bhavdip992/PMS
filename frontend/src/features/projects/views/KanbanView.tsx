import React from 'react';
import { Play, Trash2, Clock, Calendar } from 'lucide-react';
import api from '../../../services/api.tsx';

interface KanbanViewProps {
  tasks: any[];
  onTaskUpdated: () => void;
  teamMembers: any[];
  onTaskClick: (taskId: string) => void;
  onStartTimer: (taskId: string, title: string) => void;
}

export default function KanbanView({ tasks, onTaskUpdated, teamMembers, onTaskClick, onStartTimer }: KanbanViewProps) {
  const columns = ['Backlog', 'Todo', 'In Progress', 'In Review', 'QA Ready', 'Done'];

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter(t => t.status === col);
        return (
          <div key={col} className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl p-4 min-h-[400px] flex flex-col space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[hsl(var(--espark-border))/0.6]">
              <span className="font-black text-[11px] uppercase tracking-wider text-[hsl(var(--espark-text))]">{col}</span>
              <span className="bg-[hsl(var(--espark-bg))] px-2 py-0.5 rounded text-[10px] font-bold text-[hsl(var(--espark-muted))]">{colTasks.length}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[60vh] pr-1">
              {colTasks.length === 0 ? (
                <div className="text-center py-6 text-[10px] text-[hsl(var(--espark-muted))] italic">
                  No tasks
                </div>
              ) : (
                colTasks.map((t) => (
                  <div 
                    key={t._id} 
                    onClick={() => onTaskClick(t._id)}
                    className="bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))/0.6] rounded-xl p-3 hover:border-[hsl(var(--espark-primary))/0.6] cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      {/* Priority and Actions */}
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          t.priority === 'Critical' ? 'bg-red-500/10 text-red-400' :
                          t.priority === 'High' ? 'bg-amber-500/10 text-amber-400' : 
                          t.priority === 'Medium' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {t.priority}
                        </span>

                        <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => { e.stopPropagation(); onStartTimer(t._id, t.title); }}
                            className="p-1 rounded bg-[hsl(var(--espark-surface))] text-[hsl(var(--espark-muted))] hover:text-emerald-400 hover:bg-[hsl(var(--espark-surface-2))] transition-colors"
                            title="Start Timer"
                          >
                            <Play size={9} fill="currentColor" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTask(e, t._id)}
                            className="p-1 rounded bg-[hsl(var(--espark-surface))] text-[hsl(var(--espark-muted))] hover:text-red-400 hover:bg-[hsl(var(--espark-surface-2))] transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 size={9} />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-[hsl(var(--espark-text))] group-hover:text-[hsl(var(--espark-primary))] transition-colors leading-snug">
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-[10px] text-[hsl(var(--espark-muted))] mt-1 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-[hsl(var(--espark-muted))] pt-2 border-t border-[hsl(var(--espark-border))/0.4]">
                      <span className="font-semibold">{t.estimatedHours || 0}h est</span>
                      {t.dueDate && (
                        <span className="flex items-center space-x-1">
                          <Clock size={10} />
                          <span>{new Date(t.dueDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
