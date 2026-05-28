import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import { CheckSquare, Clock, Flag, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

const STATUS_COLS = [
  { key: 'Todo',        label: 'To Do',       color: 'text-slate-400',  bg: 'bg-slate-800/40',   dot: 'bg-slate-500' },
  { key: 'In Progress', label: 'In Progress', color: 'text-blue-400',   bg: 'bg-blue-950/20',    dot: 'bg-blue-500'  },
  { key: 'In Review',   label: 'In Review',   color: 'text-amber-400',  bg: 'bg-amber-950/20',   dot: 'bg-amber-500' },
  { key: 'Done',        label: 'Done',        color: 'text-emerald-400',bg: 'bg-emerald-950/20', dot: 'bg-emerald-500' },
];

const PRIORITY_COLORS = {
  Critical: 'text-red-400 bg-red-950/30 border-red-800',
  High:     'text-orange-400 bg-orange-950/30 border-orange-800',
  Medium:   'text-yellow-400 bg-yellow-950/30 border-yellow-800',
  Low:      'text-slate-400 bg-slate-800/40 border-slate-700',
};

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date() ;
}

function TaskCard({ task, onOpen }) {
  const overdue = isOverdue(task.dueDate);
  return (
    <div
      onClick={() => onOpen(task._id)}
      className="bg-slate-900 border border-slate-800 hover:border-violet-500/40 rounded-xl p-3.5 cursor-pointer transition-all group hover:shadow-lg hover:shadow-violet-900/10"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-200 leading-snug group-hover:text-white line-clamp-2">{task.title}</p>
        <ChevronRight size={13} className="text-slate-600 group-hover:text-violet-400 flex-shrink-0 mt-0.5 transition-colors" />
      </div>

      {task.project?.name && (
        <p className="text-[9px] text-violet-400 font-bold uppercase tracking-wider mt-1.5">{task.project.name}</p>
      )}

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {task.priority && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </span>
        )}
        {task.dueDate && (
          <span className={`flex items-center gap-0.5 text-[9px] font-semibold ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
            <Clock size={9} />
            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            {overdue && ' · Overdue'}
          </span>
        )}
        {task.tags?.length > 0 && task.tags.slice(0, 2).map(tag => (
          <span key={tag} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-medium">#{tag}</span>
        ))}
      </div>

      {task.estimatedHours > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[9px] text-slate-600">
          <Flag size={9} />
          {task.estimatedHours}h estimated
        </div>
      )}
    </div>
  );
}

export default function MyTasks() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/tasks');
        const allTasks = res.data.data.tasks || [];
        // Filter tasks assigned to the current user
        const mine = allTasks.filter(t =>
          t.assignees?.some(a => (a._id || a) === user?._id || (a._id || a).toString() === user?._id?.toString())
        );
        setTasks(mine);
      } catch (err) {
        setError('Failed to load your tasks.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const openTask = (id) => {
    navigate('/tasks/' + id);
  };

  const filtered = filterPriority === 'all' ? tasks : tasks.filter(t => t.priority === filterPriority);

  const grouped = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = filtered.filter(t => t.status === col.key);
    return acc;
  }, {});

  const totalOpen = tasks.filter(t => t.status !== 'Done').length;
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'Done').length;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 size={28} className="animate-spin text-violet-500" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center space-y-2">
        <AlertCircle size={24} className="text-red-400 mx-auto" />
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <CheckSquare size={22} className="text-violet-400" />
            My Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Tasks assigned to you across all projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-violet-950/40 border border-violet-800/40 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-violet-300">{totalOpen} open</span>
          </div>
          {overdueTasks > 0 && (
            <div className="bg-red-950/40 border border-red-800/40 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-red-400">{overdueTasks} overdue</span>
            </div>
          )}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {['all', 'Critical', 'High', 'Medium', 'Low'].map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
              filterPriority === p
                ? 'bg-violet-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {p === 'all' ? 'All Priorities' : p}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <CheckSquare size={40} className="text-slate-700" />
          <p className="text-slate-500 font-medium text-sm">No tasks assigned to you yet.</p>
        </div>
      ) : (
        /* Kanban columns */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUS_COLS.map(col => (
            <div key={col.key} className={`${col.bg} border border-slate-800/60 rounded-2xl p-3 space-y-3`}>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className={`text-xs font-black uppercase tracking-wider ${col.color}`}>{col.label}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-bold">{grouped[col.key]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(grouped[col.key] || []).length === 0 ? (
                  <p className="text-center text-[10px] text-slate-700 py-4">No tasks</p>
                ) : (
                  (grouped[col.key] || []).map(task => (
                    <TaskCard key={task._id} task={task} onOpen={openTask} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
