import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  AlertCircle,
  Sparkles,
  TrendingUp,
  FileText
} from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  project: {
    _id: string;
    name: string;
  };
  isSubtask?: boolean;
  parentTitle?: string;
}

interface TimeLog {
  _id: string;
  task?: {
    _id: string;
    title: string;
  };
  subtask?: {
    _id: string;
    title: string;
  };
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  description: string;
}

export default function Timesheet() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [loading, setLoading] = useState(true);
  const [selectedTaskForGrid, setSelectedTaskForGrid] = useState('');
  const [gridRows, setGridRows] = useState<string[]>([]); // list of taskIds in grid

  // Quick Log Modal State
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [logTaskId, setLogTaskId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logHours, setLogHours] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cell Edit state
  const [editingCell, setEditingCell] = useState<{ taskId: string; dateStr: string } | null>(null);
  const [editingHours, setEditingHours] = useState('');

  // Get list of 7 days of the week starting from selectedWeekStart
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(selectedWeekStart);
    d.setDate(selectedWeekStart.getDate() + i);
    return d;
  });

  useEffect(() => {
    fetchTasksAndTimeLogs();
  }, [selectedWeekStart]);

  const fetchTasksAndTimeLogs = async () => {
    setLoading(true);
    try {
      // Fetch user's tasks, timelogs and subtasks
      const [tasksRes, logsRes, subtasksRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/timelogs'),
        api.get('/subtasks').catch(() => ({ data: { data: { subtasks: [] } } }))
      ]);

      const fetchedTasks = tasksRes.data.data.tasks || [];
      const fetchedLogs = logsRes.data.data.timeLogs || [];
      const fetchedSubtasks = subtasksRes.data.data.subtasks || [];

      // Map subtasks to match Task interface
      const mappedSubtasks = fetchedSubtasks.map((s: any) => ({
        _id: s._id,
        title: `[Subtask] ${s.title}`,
        project: {
          _id: s.parentTask?.project?._id || 'internal',
          name: s.parentTask?.project?.name || 'Internal Project'
        },
        isSubtask: true,
        parentTitle: s.parentTask?.title || 'Parent Task'
      }));

      const combinedTasks = [
        ...fetchedTasks.map((t: any) => ({ ...t, isSubtask: false })),
        ...mappedSubtasks
      ];

      setTasks(combinedTasks);
      setTimeLogs(fetchedLogs);

      // Auto-populate grid rows with tasks that have logs in the current week, or tasks assigned to user
      const loggedTaskIds = new Set<string>();

      // Filter logs belonging to current selected week
      const weekStartMs = selectedWeekStart.getTime();
      const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;

      fetchedLogs.forEach((log: any) => {
        const logTime = new Date(log.startTime).getTime();
        if (logTime >= weekStartMs && logTime < weekEndMs) {
          if (log.task) {
            loggedTaskIds.add(log.task._id || log.task);
          } else if (log.subtask) {
            loggedTaskIds.add(log.subtask._id || log.subtask);
          }
        }
      });

      // Also add user's assigned tasks
      fetchedTasks.forEach((task: any) => {
        const isAssignee = task.assignees?.some((a: any) => (a._id || a) === user?._id);
        if (isAssignee) {
          loggedTaskIds.add(task._id);
        }
      });

      // Also add user's assigned subtasks
      fetchedSubtasks.forEach((sub: any) => {
        const subAssigneeId = sub.assignee?._id || sub.assignee;
        if (subAssigneeId === user?._id) {
          loggedTaskIds.add(sub._id);
        }
      });

      setGridRows(Array.from(loggedTaskIds));
    } catch (err) {
      console.error('Failed to load timesheet data', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevWeek = () => {
    const d = new Date(selectedWeekStart);
    d.setDate(d.getDate() - 7);
    setSelectedWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedWeekStart);
    d.setDate(d.getDate() + 7);
    setSelectedWeekStart(d);
  };

  const handleTodayWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setSelectedWeekStart(monday);
  };

  const addRowToGrid = () => {
    if (!selectedTaskForGrid) return;
    if (!gridRows.includes(selectedTaskForGrid)) {
      setGridRows([...gridRows, selectedTaskForGrid]);
    }
    setSelectedTaskForGrid('');
  };

  // Get time log logs for a specific task and day
  const getLogsForTaskAndDay = (taskId: string, date: Date) => {
    const startOfTargetDay = new Date(date);
    startOfTargetDay.setHours(0, 0, 0, 0);
    const endOfTargetDay = new Date(date);
    endOfTargetDay.setHours(23, 59, 59, 999);

    return timeLogs.filter(log => {
      const logTaskId = log.task?._id || log.task;
      const logSubtaskId = log.subtask?._id || log.subtask;
      if (logTaskId !== taskId && logSubtaskId !== taskId) return false;
      const logTime = new Date(log.startTime).getTime();
      return logTime >= startOfTargetDay.getTime() && logTime <= endOfTargetDay.getTime();
    });
  };

  // Calculate sum of hours for a specific task and day
  const getHoursForTaskAndDay = (taskId: string, date: Date) => {
    const dailyLogs = getLogsForTaskAndDay(taskId, date);
    const totalMinutes = dailyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    return parseFloat((totalMinutes / 60).toFixed(2));
  };

  // Log or update hours for a task on a specific day
  const handleCellClick = (taskId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const currentHours = getHoursForTaskAndDay(taskId, date);
    setEditingCell({ taskId, dateStr });
    setEditingHours(currentHours > 0 ? currentHours.toString() : '');
  };

  const handleSaveCell = async (taskId: string, dateStr: string) => {
    const targetDate = new Date(dateStr);
    targetDate.setHours(9, 0, 0, 0); // start logging at 9 AM

    const hoursNum = parseFloat(editingHours) || 0;

    try {
      // Find existing logs for this task on this day
      const existingLogs = getLogsForTaskAndDay(taskId, targetDate);

      // 1. If user entered 0 hours, delete any existing logs
      if (hoursNum <= 0) {
        if (existingLogs.length > 0) {
          await Promise.all(existingLogs.map(log => api.delete(`/timelogs/${log._id}`)));
        }
      } else {
        // 2. If existing logs exist, delete them first to overwrite with the new single log
        if (existingLogs.length > 0) {
          await Promise.all(existingLogs.map(log => api.delete(`/timelogs/${log._id}`)));
        }

        // 3. Create new log
        const startTime = targetDate.toISOString();
        const endTime = new Date(targetDate.getTime() + hoursNum * 60 * 60 * 1000).toISOString();

        await api.post('/timelogs', {
          taskId,
          startTime,
          endTime,
          description: 'Logged via Timesheet Matrix',
          isBillable: true
        });
      }

      setEditingCell(null);
      fetchTasksAndTimeLogs();
    } catch (err) {
      alert('Failed to log time. Please check your inputs.');
    }
  };

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTaskId || !logHours || Number(logHours) <= 0) {
      alert('Please select a task and enter valid hours.');
      return;
    }

    setSubmitting(true);
    try {
      const targetDate = new Date(logDate);
      targetDate.setHours(9, 0, 0, 0);

      const startTime = targetDate.toISOString();
      const endTime = new Date(targetDate.getTime() + Number(logHours) * 60 * 60 * 1000).toISOString();

      await api.post('/timelogs', {
        taskId: logTaskId,
        startTime,
        endTime,
        description: logDescription || 'Manual Log Entry',
        isBillable: true
      });

      setQuickLogOpen(false);
      setLogTaskId('');
      setLogHours('');
      setLogDescription('');
      fetchTasksAndTimeLogs();
    } catch (err) {
      alert('Failed to save manual log.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate Column Totals (Sum per day of the week)
  const getDayTotalHours = (date: Date) => {
    const startOfTargetDay = new Date(date);
    startOfTargetDay.setHours(0, 0, 0, 0);
    const endOfTargetDay = new Date(date);
    endOfTargetDay.setHours(23, 59, 59, 999);

    const dailyLogs = timeLogs.filter(log => {
      const logTime = new Date(log.startTime).getTime();
      return logTime >= startOfTargetDay.getTime() && logTime <= endOfTargetDay.getTime();
    });

    const totalMinutes = dailyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    return parseFloat((totalMinutes / 60).toFixed(2));
  };

  // Calculate Week Total Hours
  const getWeekTotalHours = () => {
    const weekStartMs = selectedWeekStart.getTime();
    const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;

    const weeklyLogs = timeLogs.filter(log => {
      const logTime = new Date(log.startTime).getTime();
      return logTime >= weekStartMs && logTime < weekEndMs;
    });

    const totalMinutes = weeklyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    return parseFloat((totalMinutes / 60).toFixed(2));
  };

  // Today's total logged hours
  const todayTotal = getDayTotalHours(new Date());

  return (
    <div className="space-y-6">
      {/* Header Widget */}
      <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Clock size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-100 flex items-center space-x-2">
              <span>Interactive Weekly Timesheet</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Log your daily hours, review weekly metrics, and manage workloads instantly.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setQuickLogOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-950/20 transition-all border border-violet-500/30"
          >
            <Plus size={14} />
            <span>Add Manual Log</span>
          </button>
        </div>
      </div>

      {/* Grid of Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's logged hours widget */}
        <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Logged Today</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-100">{todayTotal} hrs</span>
              <span className="text-[9px] font-bold text-slate-400">/ 8 hrs target</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium block">
              {todayTotal >= 8 ? '🎉 Day Target Completed!' : `${(8 - todayTotal).toFixed(1)} hrs remaining`}
            </span>
          </div>
          <div className="relative w-14 h-14">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="22" className="stroke-slate-800" strokeWidth="4" fill="transparent" />
              <circle
                cx="28"
                cy="28"
                r="22"
                className="stroke-violet-500 transition-all duration-500"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - Math.min(todayTotal, 8) / 8)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-300">
              {Math.round((Math.min(todayTotal, 8) / 8) * 100)}%
            </div>
          </div>
        </div>

        {/* Weekly Total hours widget */}
        <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Weekly Summary</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-100">{getWeekTotalHours()} hrs</span>
              <span className="text-[9px] font-bold text-slate-400">logged</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium block">Across all tasks in selected week</span>
          </div>
          <div className="w-12 h-12 bg-indigo-950/40 text-indigo-400 border border-indigo-900 rounded-2xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Active Workspace Tasks count */}
        <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Assigned Workspace Tasks</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-100">{tasks.length} tasks</span>
              <span className="text-[9px] font-bold text-slate-400">in scope</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium block">Available to log hours directly</span>
          </div>
          <div className="w-12 h-12 bg-emerald-950/40 text-emerald-400 border border-emerald-900 rounded-2xl flex items-center justify-center">
            <Sparkles size={18} />
          </div>
        </div>
      </div>

      {/* Week Navigation bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900/40 border border-slate-850 p-3.5 rounded-2xl">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
            title="Previous Week"
          >
            <ChevronLeft size={14} />
          </button>

          <span className="text-xs font-bold text-slate-200 px-3 py-1.5 bg-slate-950/50 border border-slate-850 rounded-xl">
            Week of {selectedWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>

          <button
            onClick={handleNextWeek}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
            title="Next Week"
          >
            <ChevronRight size={14} />
          </button>

          <button
            onClick={handleTodayWeek}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-xl transition-all"
          >
            This Week
          </button>
        </div>

        {/* Task Grid Adder */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedTaskForGrid}
            onChange={(e) => setSelectedTaskForGrid(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500 w-full sm:w-64"
          >
            <option value="">-- Add Task to Matrix Grid --</option>
            {tasks.map(t => (
              <option key={t._id} value={t._id}>
                [{t.project?.name || 'No Project'}] {t.title}
              </option>
            ))}
          </select>
          <button
            onClick={addRowToGrid}
            disabled={!selectedTaskForGrid}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shrink-0"
          >
            <Plus size={13} />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Main Timesheet Table Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-850">
                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-80">Task / Workspace Project</th>
                {weekDays.map((day, idx) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <th
                      key={idx}
                      className={`px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider transition-colors ${isToday ? 'text-violet-400 bg-violet-950/10' : 'text-slate-400'
                        }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <span className={`text-[11px] font-bold ${isToday ? 'text-violet-400' : 'text-slate-500'}`}>
                          {day.getDate()}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Syncing Timesheet Grid...</span>
                  </td>
                </tr>
              ) : gridRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-xs text-slate-500 font-medium">
                    No active tasks added to this week's grid. Select a task above to build your daily hours matrix.
                  </td>
                </tr>
              ) : (
                gridRows.map(taskId => {
                  const taskObj = tasks.find(t => t._id === taskId);
                  if (!taskObj) return null;

                  let taskWeeklyTotal = 0;

                  return (
                    <tr key={taskId} className="hover:bg-slate-950/20 transition-colors">
                      {/* Task Info Cell */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <p className="text-xs font-bold text-slate-200 line-clamp-1">{taskObj.title}</p>
                            {taskObj.isSubtask && (
                              <span className="text-[7px] bg-indigo-950 text-indigo-400 border border-indigo-900 font-extrabold px-1 rounded uppercase shrink-0">Subtask</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-400">
                              {taskObj.project?.name || 'Unassigned Workspace'}
                            </span>
                            {taskObj.isSubtask && taskObj.parentTitle && (
                              <span className="text-[8px] text-slate-500 font-medium truncate max-w-[120px]" title={`Parent: ${taskObj.parentTitle}`}>
                                Parent: {taskObj.parentTitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 7 Daily Cells */}
                      {weekDays.map((day, dIdx) => {
                        const dateStr = day.toISOString().split('T')[0];
                        const hours = getHoursForTaskAndDay(taskId, day);
                        taskWeeklyTotal += hours;

                        const isEditing = editingCell?.taskId === taskId && editingCell?.dateStr === dateStr;

                        return (
                          <td
                            key={dIdx}
                            className="px-2 py-3 text-center border-l border-slate-850/50"
                            onClick={() => !isEditing && handleCellClick(taskId, day)}
                          >
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-1">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingHours}
                                  onChange={(e) => setEditingHours(e.target.value)}
                                  onBlur={() => handleSaveCell(taskId, dateStr)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell(taskId, dateStr);
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  placeholder="0.0"
                                  className="w-12 text-center bg-slate-950 border border-violet-500 rounded px-1 py-1 text-xs text-slate-100 font-bold outline-none"
                                />
                              </div>
                            ) : (
                              <div className={`py-1.5 rounded-xl cursor-pointer hover:bg-slate-800/40 hover:border-slate-700/50 border border-transparent transition-all ${hours > 0
                                  ? 'bg-violet-600/10 border-violet-500/20 text-violet-400 font-black text-xs'
                                  : 'text-slate-600 hover:text-slate-400 text-xs font-semibold'
                                }`}>
                                {hours > 0 ? `${hours}h` : '-'}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Task Row Weekly Total */}
                      <td className="px-5 py-4 text-right border-l border-slate-850">
                        <span className="text-xs font-black text-slate-200">
                          {taskWeeklyTotal > 0 ? `${taskWeeklyTotal.toFixed(2)}h` : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer containing day/weekly totals */}
            {!loading && gridRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-950/60 border-t-2 border-slate-800 font-black">
                  <td className="px-5 py-4 text-xs text-slate-300 font-black uppercase">Daily Sum Totals</td>
                  {weekDays.map((day, idx) => {
                    const total = getDayTotalHours(day);
                    return (
                      <td key={idx} className="px-2 py-4 text-center border-l border-slate-850/50">
                        <span className={`text-xs ${total > 0 ? 'text-violet-400 font-black' : 'text-slate-500'}`}>
                          {total > 0 ? `${total}h` : '-'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-5 py-4 text-right border-l border-slate-800">
                    <span className="text-sm text-slate-100 font-black">
                      {getWeekTotalHours() > 0 ? `${getWeekTotalHours()}h` : '-'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Manual Quick Log Modal */}
      {quickLogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setQuickLogOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                <Clock size={16} className="text-violet-400" />
                <span>Add Quick Manual Log</span>
              </h3>
              <button
                onClick={() => setQuickLogOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleQuickLog} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Task Workspace</label>
                <select
                  value={logTaskId}
                  onChange={(e) => setLogTaskId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                >
                  <option value="">Select Task...</option>
                  {tasks.map(t => (
                    <option key={t._id} value={t._id}>[{t.project?.name || 'No Project'}] {t.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Date Logged</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Hours Logged</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3.5"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Log Work Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Completed authorization schema layout and tested local cookies API."
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all"
              >
                {submitting ? 'Saving Time Log...' : 'Confirm Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
