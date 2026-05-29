import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useTimeLogStore } from '../../store/useTimeLogStore.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import Modal from '../../components/Modal.tsx';

import { 
  CheckSquare, 
  Plus, 
  Clock, 
  Play, 
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileText,
  User,
  Paperclip,
  Trash2,
  Lock,
  ChevronRight,
  MessageSquare,
  X,
  Search,
  Filter,
  FolderKanban,
  UserCheck
} from 'lucide-react';

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeTimer, startTimer } = useTimeLogStore() as any;

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isKanban, setIsKanban] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // New Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Todo');
  const [priority, setPriority] = useState('Medium');
  const [project, setProject] = useState('');
  const [milestone, setMilestone] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [dependencies, setDependencies] = useState([]);

  // Task Details Panel/State
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([]);

  // Subtask form state inside detail modal
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskAssignee, setSubtaskAssignee] = useState('');
  const [subtaskEstimates, setSubtaskEstimates] = useState('');

  useEffect(() => {
    fetchTasksProjectsAndTeam();
  }, []);

  useEffect(() => {
    if (project) {
      fetchProjectMilestones(project);
    } else {
      setMilestones([]);
    }
  }, [project]);

  const fetchProjectMilestones = async (projectId) => {
    try {
      const res = await api.get(`/milestones?projectId=${projectId}`);
      setMilestones(res.data.data.milestones || []);
    } catch (err) {
      console.error('Failed to load project milestones', err);
    }
  };



  const fetchTasksProjectsAndTeam = async () => {
    setLoading(true);
    try {
      const [tasksRes, projRes, usersRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/users')
      ]);
      setTasks(tasksRes.data.data.tasks);
      setProjects(projRes.data.data.projects);
      const activeUsers = (usersRes.data.data.users || []).filter(u => u.isActive !== false);
      setTeamMembers(activeUsers);
      
      if (projRes.data.data.projects.length > 0) {
        setProject(projRes.data.data.projects[0]._id);
      }
    } catch (err) {
      console.error('Failed to load tasks workspace', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        description,
        status,
        priority,
        project,
        milestone: milestone || null,
        estimatedHours: Number(estimatedHours) || 0,
        dueDate: dueDate || undefined,
        startDate: startDate || undefined,
        assignees,
        dependencies
      };

      await api.post('/tasks', payload);
      setCreateModalOpen(false);

      // Reset
      setTitle('');
      setDescription('');
      setStatus('Todo');
      setPriority('Medium');
      setMilestone('');
      setEstimatedHours('');
      setDueDate('');
      setStartDate('');
      setAssignees([]);
      setDependencies([]);

      fetchTasksProjectsAndTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasksProjectsAndTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleOpenDetailModal = (task) => {
    navigate('/tasks/' + task._id);
  };

  const handleCloseDetailModal = () => {
    navigate('/tasks');
  };

  const handleAddChecklistItem = async () => {
    if (newChecklistTitle.trim() === '') return;
    try {
      const response = await api.post(`/tasks/${selectedTaskId}/checklist`, { title: newChecklistTitle });
      setSelectedTaskId(response.data.data.task);
      setNewChecklistTitle('');
      fetchTasksProjectsAndTeam();
    } catch (err) {
      alert('Failed to add item');
    }
  };

  const handleToggleChecklistItem = async (itemId) => {
    try {
      const response = await api.put(`/tasks/${selectedTaskId}/checklist/${itemId}`);
      setSelectedTaskId(response.data.data.task);
      fetchTasksProjectsAndTeam();
    } catch (err) {
      alert('Failed to update item');
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (subtaskTitle.trim() === '') return;
    try {
      const payload = {
        title: subtaskTitle,
        assignee: subtaskAssignee || null,
        estimatedHours: Number(subtaskEstimates) || 0
      };
      const response = await api.post(`/subtasks/task/${selectedTaskId}`, payload);
      // Refetch the full task details to render subtask updates
      const updatedTaskRes = await api.get(`/tasks/${selectedTaskId}`);
      setSelectedTaskId(updatedTaskRes.data.data.task);
      
      // Reset subtask inputs
      setSubtaskTitle('');
      setSubtaskAssignee('');
      setSubtaskEstimates('');
      fetchTasksProjectsAndTeam();
    } catch (err) {
      alert('Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await api.put(`/subtasks/${subtaskId}/toggle`);
      const updatedTaskRes = await api.get(`/tasks/${selectedTaskId}`);
      setSelectedTaskId(updatedTaskRes.data.data.task);
      fetchTasksProjectsAndTeam();
    } catch (err) {
      alert('Failed to toggle subtask status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newCommentText.trim() === '') return;
    try {
      const response = await api.post(`/tasks/${selectedTaskId}/comments`, { text: newCommentText });
      setSelectedTaskId(response.data.data.task);
      setNewCommentText('');
      fetchTasksProjectsAndTeam();
    } catch (err) {
      alert('Failed to save comment');
    }
  };

  const handleStartTimer = async (taskId, title) => {
    const res = await startTimer(taskId, `Working on task: ${title}`);
    if (res.success) {
      alert('Stopwatch timer started!');
    } else {
      alert(res.message);
    }
  };

  const handleToggleAssignee = (userId) => {
    setAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleToggleDependency = (taskId) => {
    setDependencies(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  const getSortedTasks = (taskList) => {
    let sorted = [...taskList];
    if (sortBy === 'lastCommented') {
      sorted.sort((a, b) => {
        const da = a.lastCommentedAt ? new Date(a.lastCommentedAt).getTime() : 0;
        const db = b.lastCommentedAt ? new Date(b.lastCommentedAt).getTime() : 0;
        return db - da;
      });
    } else if (sortBy === 'clientCommented') {
      sorted.sort((a, b) => {
        const aClient = a.lastCommentedByClient ? 1 : 0;
        const bClient = b.lastCommentedByClient ? 1 : 0;
        if (aClient !== bClient) return bClient - aClient;
        const da = a.lastCommentedAt ? new Date(a.lastCommentedAt).getTime() : 0;
        const db = b.lastCommentedAt ? new Date(b.lastCommentedAt).getTime() : 0;
        return db - da;
      });
    }
    return sorted;
  };

  const filteredTasks = tasks.filter((t: any) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const projId = t.project?._id || t.project;
    const matchesProject = !projectFilter || projId === projectFilter;

    const matchesPriority = !priorityFilter || t.priority === priorityFilter;

    const matchesAssignee = !assigneeFilter || t.assignees?.some((a: any) => (a._id || a) === assigneeFilter);

    const matchesStatus = !statusFilter || t.status === statusFilter;

    return matchesSearch && matchesProject && matchesPriority && matchesAssignee && matchesStatus;
  });

  const columns = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done'];

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
            <CheckSquare className="text-violet-400" />
            <span>Tasks & Sprint Board</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage task cycles, checklist items, subtasks, and track timesheet hours.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sorting Option */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-violet-500 transition-colors"
          >
            <option value="default">Default Sort</option>
            <option value="lastCommented">Recently Commented</option>
            <option value="clientCommented">Client Feed First</option>
          </select>

          {/* View switcher */}
          <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex space-x-1">
            <button 
              onClick={() => setIsKanban(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isKanban ? 'bg-slate-850 text-violet-400' : 'text-slate-500 hover:text-slate-350'}`}
            >
              Kanban
            </button>
            <button 
              onClick={() => setIsKanban(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isKanban ? 'bg-slate-850 text-violet-400' : 'text-slate-500 hover:text-slate-350'}`}
            >
              List View
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
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
              placeholder="Search tasks by title or description..."
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
              {projects.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-violet-500"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-violet-500"
            >
              <option value="">All Statuses</option>
              {columns.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-violet-500"
            >
              <option value="">All Assignees</option>
              {teamMembers.map((m: any) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* KANBAN BOARD */}
      {isKanban ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = getSortedTasks(filteredTasks.filter(t => t.status === col));
            return (
              <div key={col} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 min-h-[500px] flex flex-col space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-300">{col}</span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">{colTasks.length}</span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[70vh]">
                  {colTasks.map((t) => (
                    <div 
                      key={t._id} 
                      onClick={() => handleOpenDetailModal(t)}
                      className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 hover:border-slate-700/80 cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div>
                        {/* Priority Badge */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              t.priority === 'Critical' ? 'bg-red-500/10 text-red-400' :
                              t.priority === 'High' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {t.priority}
                            </span>
                            {t.lastCommentedByClient && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-pink-950/80 text-pink-400 border border-pink-800/30 animate-pulse">
                                Client Feed
                              </span>
                            )}
                          </div>

                          {/* Quick action buttons */}
                          <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartTimer(t._id, t.title); }}
                              className="p-1 rounded bg-slate-900 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                              title="Start Timer"
                            >
                              <Play size={10} fill="currentColor" />
                            </button>
                            <button
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                if (window.confirm('Are you sure you want to delete this task?')) {
                                  try {
                                    await api.delete(`/tasks/${t._id}`);
                                    fetchTasksProjectsAndTeam();
                                  } catch (err) {
                                    alert(err.response?.data?.message || 'Failed to delete task');
                                  }
                                }
                              }}
                              className="p-1 rounded bg-slate-905 text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors leading-snug">{t.title}</h4>
                          {t.updatedAt && (new Date().getTime() - new Date(t.updatedAt).getTime()) < 24 * 60 * 60 * 1000 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Updated in last 24 hours" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{t.description}</p>
                      </div>

                      {/* Info footer */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-900/60">
                        <span className="font-semibold">{t.project?.name || 'Workspace'}</span>
                        {t.dueDate && (
                          <span className="flex items-center space-x-1 text-slate-400">
                            <Clock size={10} />
                            <span>{new Date(t.dueDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // LIST VIEW
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-4">Task Name</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {getSortedTasks(filteredTasks).map((t) => (
                  <tr 
                    key={t._id}
                    onClick={() => handleOpenDetailModal(t)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1.5">
                          <span>{t.title}</span>
                          {t.updatedAt && (new Date().getTime() - new Date(t.updatedAt).getTime()) < 24 * 60 * 60 * 1000 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Updated in last 24 hours" />
                          )}
                        </span>
                        {t.lastCommentedByClient && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-pink-950/80 text-pink-400 border border-pink-800/30 animate-pulse">
                            Client Feed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">{t.project?.name}</td>
                    <td className="p-4">
                      <select 
                        value={t.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateStatus(t._id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 outline-none text-[11px]"
                      >
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        t.priority === 'Critical' ? 'bg-red-500/10 text-red-400' :
                        t.priority === 'High' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-850 text-slate-500'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartTimer(t._id, t.title); }}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-400 hover:text-white rounded-lg transition-all"
                        >
                          <Play size={10} fill="currentColor" />
                          <span>Track</span>
                        </button>
                        <button
                          onClick={async (e) => { 
                            e.stopPropagation(); 
                            if (window.confirm('Are you sure you want to delete this task?')) {
                              try {
                                await api.delete(`/tasks/${t._id}`);
                                fetchTasksProjectsAndTeam();
                              } catch (err) {
                                alert(err.response?.data?.message || 'Failed to delete task');
                              }
                            }
                          }}
                          className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-900/40 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {/* CREATE TASK DRAWER */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity">
          {/* Backdrop click handler */}
          <div className="absolute inset-0 -z-10" onClick={() => setCreateModalOpen(false)} />

          {/* Drawer Container */}
          <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl relative animate-slideLeft">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-850 flex justify-between items-center z-10">
              <div className="flex items-center space-x-3">
                <span className="bg-violet-950 text-violet-400 border border-violet-900 px-2.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">
                  Create Task Workspace
                </span>
                <span className="text-xs text-slate-500 font-medium">Add new item to project roadmap</span>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form onSubmit={handleCreateTask} className="space-y-6">
                
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Task Title</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Design Landing Page Mockup"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Description / Specifications</label>
                  <textarea 
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed description or criteria..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Project Workspace</label>
                    <select 
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                    >
                      {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Milestone Target</label>
                    <select 
                      value={milestone}
                      onChange={(e) => setMilestone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                    >
                      <option value="">No Milestone</option>
                      {milestones.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
                    <input 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500"
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Hours Est.</label>
                    <input 
                      type="number" 
                      value={estimatedHours}
                      placeholder="e.g. 8"
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">Assign Task To</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {teamMembers.map(member => (
                      <button
                        type="button"
                        key={member._id}
                        onClick={() => handleToggleAssignee(member._id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                          assignees.includes(member._id)
                            ? 'bg-violet-600 border-violet-500 text-white'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4 pb-6">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">Blocking Dependencies (Blockers)</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {tasks.filter(t => t.status !== 'Done' && (t.project?._id || t.project) === project).map(t => (
                      <button
                        type="button"
                        key={t._id}
                        onClick={() => handleToggleDependency(t._id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                          dependencies.includes(t._id)
                            ? 'bg-red-950 border-red-800 text-red-400'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  Create Task
                </button>
              </form>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
