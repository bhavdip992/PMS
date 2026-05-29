import React, { useState } from 'react';
import { ShieldAlert, Trash2, Plus, GitMerge, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Dependency {
  _id: string;
  title: string;
  status: string;
  dueDate?: string;
}

interface TaskDependencyGraphProps {
  dependencies: Dependency[];
  availableTasks: { _id: string; title: string; status: string }[];
  onAddDependency: (dependencyId: string) => void;
  onRemoveDependency: (dependencyId: string) => void;
}

export default function TaskDependencyGraph({
  dependencies,
  availableTasks,
  onAddDependency,
  onRemoveDependency
}: TaskDependencyGraphProps) {
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const handleLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return;
    onAddDependency(selectedTaskId);
    setSelectedTaskId('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-950 text-emerald-400 border-emerald-900/50';
      case 'In Progress':
        return 'bg-blue-950 text-blue-400 border-blue-900/50';
      case 'In Review':
        return 'bg-amber-950 text-amber-400 border-amber-905';
      case 'Todo':
        return 'bg-slate-900 text-slate-400 border-slate-800';
      default:
        return 'bg-slate-950 text-slate-500 border-slate-900';
    }
  };

  const isBlocked = dependencies.some(d => d.status !== 'Done');

  return (
    <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-850">
      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
        <div className="flex items-center space-x-2">
          <GitMerge size={14} className="text-rose-400" />
          <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
            Blocking Dependencies
          </h4>
        </div>
        {isBlocked ? (
          <span className="flex items-center space-x-1 text-[9px] font-black uppercase text-rose-400 bg-rose-950/60 border border-rose-900 px-2.5 py-0.5 rounded-full animate-pulse">
            <AlertCircle size={10} />
            <span>BLOCKED</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1 text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 size={10} />
            <span>Clear to Work</span>
          </span>
        )}
      </div>

      {/* Grid of Dependencies */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {dependencies.length === 0 ? (
          <p className="text-[10px] text-slate-500 py-3 italic">This task is not blocked by any other tasks.</p>
        ) : (
          dependencies.map((dep) => (
            <div
              key={dep._id}
              className="flex justify-between items-center bg-slate-950/50 border border-slate-850/60 hover:bg-slate-950/80 p-3 rounded-xl text-xs transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-lg ${getStatusColor(dep.status)}`}>
                  {dep.status}
                </span>
                <span className="font-bold text-slate-200 truncate max-w-[250px]">{dep.title}</span>
              </div>
              <div className="flex items-center space-x-3">
                {dep.dueDate && (
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Due: {new Date(dep.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveDependency(dep._id)}
                  className="text-slate-550 hover:text-red-400 p-1 hover:bg-slate-900 rounded-lg transition-colors"
                  aria-label="Remove dependency"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Link new dependency form */}
      <form onSubmit={handleLink} className="flex space-x-2 mt-2">
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-rose-500/50"
        >
          <option value="">Select task that this task depends on...</option>
          {availableTasks
            .filter(t => !dependencies.some(d => d._id === t._id))
            .map(t => (
              <option key={t._id} value={t._id}>
                [{t.status}] {t.title}
              </option>
            ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center space-x-1 border border-slate-750 transition-all"
        >
          <Plus size={14} />
          <span>Link</span>
        </button>
      </form>
    </div>
  );
}
