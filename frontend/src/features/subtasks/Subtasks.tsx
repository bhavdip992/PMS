import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import Modal from '../../components/Modal.tsx';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileText,
  User,
  Trash2,
  Lock,
  ChevronRight,
  MessageSquare,
  X,
  Search,
  Filter,
  Layers,
  LayoutGrid,
  List,
  Calendar,
  UserCheck,
  TrendingUp,
  FolderKanban
} from 'lucide-react';

export default function Subtasks() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isKanban, setIsKanban] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [parentTaskFilter, setParentTaskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Modal / Drawer States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [logTimeModalOpen, setLogTimeModalOpen] = useState(false);
  const [activeSubtask, setActiveSubtask] = useState<any>(null);

  // New subtask fields
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDesc, setNewSubtaskDesc] = useState('');
  const [newSubtaskParentId, setNewSubtaskParentId] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
  const [newSubtaskEstimates, setNewSubtaskEstimates] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');

  // Log Time fields
  const [hoursToLog, setHoursToLog] = useState('');
  const [timeLogDescription, setTimeLogDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, tasksRes, usersRes, projRes] = await Promise.all([
        api.get('/subtasks'),
        api.get('/tasks'),
        api.get('/users'),
        api.get('/projects')
      ]);

      setSubtasks(subRes.data.data.subtasks || []);
      setAllTasks(tasksRes.data.data.tasks || []);
      setTeamMembers(usersRes.data.data.users || []);
      setProjects(projRes.data.data.projects || []);
    } catch (err) {
      console.error('Failed to load subtask workspace data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !newSubtaskParentId) {
      alert('Title and Parent Task are required');
      return;
    }
    try {
      const payload = {
        title: newSubtaskTitle,
        description: newSubtaskDesc,
        assignee: newSubtaskAssignee || null,
        estimatedHours: Number(newSubtaskEstimates) || 0,
        dueDate: newSubtaskDueDate || null
      };

      await api.post(`/subtasks/task/${newSubtaskParentId}`, payload);
      setNewSubtaskTitle('');
      setNewSubtaskDesc('');
      setNewSubtaskParentId('');
      setNewSubtaskAssignee('');
      setNewSubtaskEstimates('');
      setNewSubtaskDueDate('');
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to create subtask');
    }
  };

  const handleUpdateStatus = async (subId: string, status: string) => {
    try {
      await api.put(`/subtasks/${subId}`, { status });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleUpdateDueDate = async (subId: string, dueDate: string) => {
    try {
      await api.put(`/subtasks/${subId}`, { dueDate });
      fetchData();
    } catch (err) {
      alert('Failed to update due date');
    }
  };

  const handleDeleteSubtask = async (subId: string) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) return;
    try {
      await api.delete(`/subtasks/${subId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete subtask');
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoursToLog || isNaN(Number(hoursToLog))) {
      alert('Please enter a valid number of hours');
      return;
    }
    try {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + Number(hoursToLog) * 60 * 60 * 1000);

      // Create a time log entry under the subtask
      await api.post('/timelogs', {
        taskId: activeSubtask._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        description: timeLogDescription || `Time logged on sub-task: ${activeSubtask.title}`,
        isBillable: true
      });

      setHoursToLog('');
      setTimeLogDescription('');
      setLogTimeModalOpen(false);
      setActiveSubtask(null);
      fetchData();
      alert('Time logged successfully!');
    } catch (err) {
      alert('Failed to log time');
    }
  };

  const handleToggleCompleted = async (sub: any) => {
    try {
      await api.put(`/subtasks/${sub._id}/toggle`);
      fetchData();
    } catch (err) {
      alert('Failed to toggle completion status');
    }
  };

  // Filtering Logic
  const filteredSubtasks = subtasks.filter(sub => {
    const parent = sub.parentTask;
    const parentProjId = parent?.project?._id || parent?.project;

    // Search query matches subtask title or parent task title
    const matchesSearch = 
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (parent?.title && parent.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // Project match
    const matchesProject = !projectFilter || parentProjId === projectFilter;

    // Parent task match
    const matchesParent = !parentTaskFilter || parent?._id === parentTaskFilter;

    // Status match
    const matchesStatus = !statusFilter || sub.status === statusFilter;

    // Assignee match
    const matchesAssignee = !assigneeFilter || sub.assignee?._id === assigneeFilter;

    return matchesSearch && matchesProject && matchesParent && matchesStatus && matchesAssignee;
  });

  // Calculate Metrics
  const totalCount = filteredSubtasks.length;
  const completedCount = filteredSubtasks.filter(s => s.status === 'Done').length;
  const pendingCount = totalCount - completedCount;
  const totalLoggedHours = filteredSubtasks.reduce((sum, s) => sum + (s.actualHours || 0), 0);
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group subtasks for Kanban columns
  const todoSubtasks = filteredSubtasks.filter(s => s.status === 'Todo');
  const inProgressSubtasks = filteredSubtasks.filter(s => s.status === 'In Progress');
  const inReviewSubtasks = filteredSubtasks.filter(s => s.status === 'In Review');
  const doneSubtasks = filteredSubtasks.filter(s => s.status === 'Done');

  return (
    <div className="space-y-6 max-w-8xl text-slate-100">
      
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center space-x-2.5">
            <Layers className="text-violet-400" size={24} />
            <span>Sub-Tasks Workspace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage granular sub-tasks, assign modules, log direct hours, and navigate to main tasks.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-lg self-start md:self-auto"
        >
          <Plus size={14} />
          <span>New Sub-Task</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-violet-600/15 text-violet-400 rounded-xl">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Subtasks</div>
            <div className="text-xl font-black text-slate-200 mt-0.5">{totalCount}</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl">
            <CheckCircle size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</div>
            <div className="text-xl font-black text-slate-200 mt-0.5">{completedCount}</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-blue-500/15 text-blue-400 rounded-xl">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</div>
            <div className="text-xl font-black text-slate-200 mt-0.5">{completionRate}%</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged Hours</div>
            <div className="text-xl font-black text-slate-200 mt-0.5">{totalLoggedHours.toFixed(1)} hrs</div>
          </div>
        </div>

      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search subtask or main task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-violet-500 transition-all placeholder-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-violet-500"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>

            {/* Parent Task Filter */}
            <select
              value={parentTaskFilter}
              onChange={(e) => setParentTaskFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-violet-500"
            >
              <option value="">All Main Tasks</option>
              {allTasks.map(t => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-violet-500"
            >
              <option value="">All Statuses</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-violet-500"
            >
              <option value="">All Assignees</option>
              {teamMembers.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex border border-slate-850 rounded-xl overflow-hidden self-start lg:self-auto">
            <button
              onClick={() => setIsKanban(true)}
              className={`p-2 transition-all ${isKanban ? 'bg-violet-600 text-white' : 'bg-slate-950/65 text-slate-500 hover:text-slate-200'}`}
              title="Kanban Board"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setIsKanban(false)}
              className={`p-2 transition-all ${!isKanban ? 'bg-violet-600 text-white' : 'bg-slate-950/65 text-slate-500 hover:text-slate-200'}`}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <span className="text-xs text-slate-500 font-bold">Synchronizing modules...</span>
        </div>
      ) : (
        <>
          {/* Kanban View */}
          {isKanban ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Todo Column */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl space-y-3 flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Todo</h3>
                  </div>
                  <span className="text-[10px] bg-slate-900 border border-slate-850 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">{todoSubtasks.length}</span>
                </div>
                
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {todoSubtasks.map(sub => (
                    <SubtaskCard 
                      key={sub._id} 
                      sub={sub} 
                      onToggle={() => handleToggleCompleted(sub)}
                      onDelete={() => handleDeleteSubtask(sub._id)}
                      onLogTime={() => { setActiveSubtask(sub); setLogTimeModalOpen(true); }}
                      onStatusChange={(status) => handleUpdateStatus(sub._id, status)}
                    />
                  ))}
                  {todoSubtasks.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-slate-600">No tasks in Todo.</div>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl space-y-3 flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">In Progress</h3>
                  </div>
                  <span className="text-[10px] bg-slate-900 border border-slate-850 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">{inProgressSubtasks.length}</span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {inProgressSubtasks.map(sub => (
                    <SubtaskCard 
                      key={sub._id} 
                      sub={sub} 
                      onToggle={() => handleToggleCompleted(sub)}
                      onDelete={() => handleDeleteSubtask(sub._id)}
                      onLogTime={() => { setActiveSubtask(sub); setLogTimeModalOpen(true); }}
                      onStatusChange={(status) => handleUpdateStatus(sub._id, status)}
                    />
                  ))}
                  {inProgressSubtasks.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-slate-600">No tasks in Progress.</div>
                  )}
                </div>
              </div>

              {/* In Review Column */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl space-y-3 flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">In Review</h3>
                  </div>
                  <span className="text-[10px] bg-slate-900 border border-slate-850 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">{inReviewSubtasks.length}</span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {inReviewSubtasks.map(sub => (
                    <SubtaskCard 
                      key={sub._id} 
                      sub={sub} 
                      onToggle={() => handleToggleCompleted(sub)}
                      onDelete={() => handleDeleteSubtask(sub._id)}
                      onLogTime={() => { setActiveSubtask(sub); setLogTimeModalOpen(true); }}
                      onStatusChange={(status) => handleUpdateStatus(sub._id, status)}
                    />
                  ))}
                  {inReviewSubtasks.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-slate-600">No tasks in Review.</div>
                  )}
                </div>
              </div>

              {/* Done Column */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl space-y-3 flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Done</h3>
                  </div>
                  <span className="text-[10px] bg-slate-900 border border-slate-850 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">{doneSubtasks.length}</span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {doneSubtasks.map(sub => (
                    <SubtaskCard 
                      key={sub._id} 
                      sub={sub} 
                      onToggle={() => handleToggleCompleted(sub)}
                      onDelete={() => handleDeleteSubtask(sub._id)}
                      onLogTime={() => { setActiveSubtask(sub); setLogTimeModalOpen(true); }}
                      onStatusChange={(status) => handleUpdateStatus(sub._id, status)}
                    />
                  ))}
                  {doneSubtasks.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-slate-600">No completed tasks.</div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            
            /* List/Table View */
            <div className="bg-slate-900/50 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="p-4 w-12 text-center">Done</th>
                      <th className="p-4">Sub-Task Module</th>
                      <th className="p-4">Parent Task / Project</th>
                      <th className="p-4">Assignee</th>
                      <th className="p-4 text-center">Estimate</th>
                      <th className="p-4 text-center">Logged</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {filteredSubtasks.map(sub => {
                      const parent = sub.parentTask;
                      const parentTaskId = parent?._id || parent;
                      const projectName = parent?.project?.name || 'No Project';

                      return (
                        <tr 
                          key={sub._id} 
                          className="hover:bg-slate-950/30 group transition-colors cursor-pointer text-xs"
                          onClick={() => navigate(`/tasks/${parentTaskId}?subtaskId=${sub._id}`)}
                        >
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={sub.isCompleted}
                              onChange={() => handleToggleCompleted(sub)}
                              className="rounded border-slate-800 bg-slate-950 text-violet-600 w-4 h-4 cursor-pointer focus:ring-0"
                            />
                          </td>
                          <td className="p-4 font-bold text-slate-200">
                            <span className={sub.isCompleted ? 'line-through text-slate-500' : ''}>
                              {sub.title}
                            </span>
                            {sub.description && (
                              <p className="text-[10px] font-medium text-slate-500 mt-0.5 line-clamp-1">{sub.description}</p>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-350 hover:text-violet-400 transition-colors flex items-center">
                                {parent?.title || 'Unknown Parent Task'}
                                <ChevronRight size={10} className="mx-1 text-slate-500" />
                              </span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center mt-0.5">
                                <FolderKanban size={9} className="mr-1 text-slate-600" />
                                {projectName}
                              </span>
                            </div>
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            {sub.assignee ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-[9px] font-black text-violet-400 uppercase">
                                  {sub.assignee.name[0]}
                                </div>
                                <span className="text-[10px] font-semibold text-slate-300">{sub.assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600">Unassigned</span>
                            )}
                          </td>
                          <td className="p-4 text-center text-slate-400 font-medium">
                            {sub.estimatedHours ? `${sub.estimatedHours}h` : '-'}
                          </td>
                          <td className="p-4 text-center text-violet-400 font-bold">
                            {sub.actualHours ? `${sub.actualHours}h` : '-'}
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="date"
                              value={sub.dueDate ? sub.dueDate.split('T')[0] : ''}
                              onChange={(e) => handleUpdateDueDate(sub._id, e.target.value)}
                              className="bg-slate-950 border border-slate-850 text-slate-450 rounded px-1.5 py-0.5 text-[10px] outline-none focus:border-violet-500 transition-colors"
                            />
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={sub.status}
                              onChange={(e) => handleUpdateStatus(sub._id, e.target.value)}
                              className="bg-slate-950 border border-slate-850 text-slate-450 rounded px-1.5 py-0.5 text-[10px] outline-none focus:border-violet-500 transition-colors font-bold"
                            >
                              <option value="Todo">Todo</option>
                              <option value="In Progress">In Progress</option>
                              <option value="In Review">In Review</option>
                              <option value="Done">Done</option>
                            </select>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setActiveSubtask(sub); setLogTimeModalOpen(true); }}
                                className="p-1.5 rounded bg-slate-950 text-slate-400 hover:text-amber-400 hover:bg-slate-850 transition-all"
                                title="Log hours"
                              >
                                <Clock size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteSubtask(sub._id)}
                                className="p-1.5 rounded bg-slate-950 text-slate-400 hover:text-red-400 hover:bg-slate-850 transition-all"
                                title="Delete Sub-task"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSubtasks.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-20 text-slate-500 font-medium">
                          No subtasks found matching the filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          )}
        </>
      )}

      {/* CREATE SUBTASK MODAL */}
      {createModalOpen && (
        <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Sub-Task">
          <form onSubmit={handleCreateSubtask} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Parent Task *</label>
              <select
                required
                value={newSubtaskParentId}
                onChange={(e) => setNewSubtaskParentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              >
                <option value="">Select main task...</option>
                {allTasks.map(t => {
                  const projName = t.project?.name || 'No Project';
                  return (
                    <option key={t._id} value={t._id}>
                      [{projName}] {t.title}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Sub-Task Title *</label>
              <input
                type="text"
                required
                value={newSubtaskTitle}
                placeholder="e.g. Design UI Layout Modules"
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description</label>
              <textarea
                value={newSubtaskDesc}
                placeholder="Details of the sub-task module..."
                onChange={(e) => setNewSubtaskDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Assignee</label>
                <select
                  value={newSubtaskAssignee}
                  onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Estimate (Hrs)</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={newSubtaskEstimates}
                  onChange={(e) => setNewSubtaskEstimates(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={newSubtaskDueDate}
                  onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-850 bg-slate-950 hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-bold text-white transition-all shadow-md"
              >
                Create Sub-task
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* LOG TIME MODAL */}
      {logTimeModalOpen && activeSubtask && (
        <Modal isOpen={logTimeModalOpen} onClose={() => { setLogTimeModalOpen(false); setActiveSubtask(null); }} title="Log Sub-Task Hours">
          <form onSubmit={handleLogTime} className="space-y-4">
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Sub-Task Module</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">{activeSubtask.title}</div>
              <div className="text-[9px] text-slate-400 mt-1">
                Estimate: <span className="font-bold text-slate-200">{activeSubtask.estimatedHours || 0} hrs</span> | Currently logged: <span className="font-bold text-violet-400">{activeSubtask.actualHours || 0} hrs</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Hours to Log *</label>
              <input
                type="text"
                required
                value={hoursToLog}
                placeholder="e.g. 2.5"
                onChange={(e) => setHoursToLog(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Work Description</label>
              <textarea
                value={timeLogDescription}
                placeholder="What did you work on? (Optional)"
                onChange={(e) => setTimeLogDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors h-20 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-850">
              <button
                type="button"
                onClick={() => { setLogTimeModalOpen(false); setActiveSubtask(null); }}
                className="px-4 py-2 border border-slate-850 bg-slate-950 hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Submit Time Log
              </button>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
}

// Kanban Card Component helper
function SubtaskCard({ 
  sub, 
  onToggle, 
  onDelete, 
  onLogTime, 
  onStatusChange 
}: { 
  sub: any; 
  onToggle: () => void; 
  onDelete: () => void; 
  onLogTime: () => void;
  onStatusChange: (status: string) => void;
}) {
  const navigate = useNavigate();
  const parent = sub.parentTask;
  const parentTaskId = parent?._id || parent;
  const projectName = parent?.project?.name || 'No Project';

  return (
    <div 
      onClick={() => navigate(`/tasks/${parentTaskId}?subtaskId=${sub._id}`)}
      className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl hover:border-violet-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer relative group flex flex-col justify-between space-y-3"
    >
      
      {/* Top details */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black uppercase tracking-wider text-violet-400 bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-900/40">
            {projectName}
          </span>
          
          {/* Quick Actions overlay */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onLogTime}
              className="p-1 rounded bg-slate-950 text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors"
              title="Log hours"
            >
              <Clock size={9} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded bg-slate-950 text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Delete subtask"
            >
              <Trash2 size={9} />
            </button>
          </div>
        </div>

        <h4 className="text-xs font-bold text-slate-250 leading-relaxed">
          {sub.title}
        </h4>
        
        {sub.description && (
          <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-normal">
            {sub.description}
          </p>
        )}
      </div>

      {/* Bottom details */}
      <div className="pt-2 border-t border-slate-850/60 flex items-center justify-between text-[9px] text-slate-400 font-semibold" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={sub.isCompleted}
            onChange={onToggle}
            className="rounded border-slate-800 bg-slate-950 text-violet-600 w-3 h-3 focus:ring-0"
          />
          <select
            value={sub.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-transparent border-none p-0 text-slate-400 text-[9px] font-bold focus:ring-0 outline-none"
          >
            <option value="Todo" className="bg-slate-900">Todo</option>
            <option value="In Progress" className="bg-slate-900">In Progress</option>
            <option value="In Review" className="bg-slate-900">In Review</option>
            <option value="Done" className="bg-slate-900">Done</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {sub.dueDate && (
            <span className="flex items-center text-slate-500 text-[8px] bg-slate-950 px-1 py-0.2 rounded border border-slate-850">
              <Calendar size={8} className="mr-0.5" />
              {new Date(sub.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}

          {sub.assignee ? (
            <div 
              className="w-4 h-4 rounded-full bg-violet-950 border border-violet-800 text-[8px] font-black text-violet-400 flex items-center justify-center uppercase" 
              title={`Assigned to ${sub.assignee.name}`}
            >
              {sub.assignee.name[0]}
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-850 text-[8px] font-bold text-slate-600 flex items-center justify-center">
              ?
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
