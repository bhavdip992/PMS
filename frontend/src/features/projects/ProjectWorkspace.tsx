import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import { useTimeLogStore } from '../../store/useTimeLogStore.tsx';
import Modal from '../../components/Modal.tsx';
import KanbanView from './views/KanbanView.tsx';
import ListView from './views/ListView.tsx';
import TimelineView from './views/TimelineView.tsx';
import CalendarView from './views/CalendarView.tsx';
import SprintBoard from './SprintBoard.tsx';
import MilestoneTracker from './MilestoneTracker.tsx';
import TaskDetailsDrawer from '../tasks/TaskDetailsDrawer.tsx';

import { 
  FolderKanban, 
  Clock, 
  Calendar, 
  CheckSquare, 
  AlertCircle, 
  Building2, 
  User, 
  Users, 
  BarChart3, 
  Plus, 
  ArrowLeft,
  Settings,
  MessageSquare,
  Paperclip,
  Activity,
  Layers
} from 'lucide-react';

export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore() as any;
  const { startTimer } = useTimeLogStore() as any;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [taskView, setTaskView] = useState('kanban'); // kanban, list, timeline, calendar

  // Detail/Create drawer state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('Todo');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskEstHours, setTaskEstHours] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);

  // Team Management form/modal state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Task Filters
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [taskSortBy, setTaskSortBy] = useState('dueDateAsc'); // dueDateAsc, dueDateDesc, priority, none
  const [subtasks, setSubtasks] = useState<any[]>([]);

  useEffect(() => {
    if (projectId) {
      fetchWorkspaceData();
      fetchUsersList();
    }
  }, [projectId]);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes, actRes, subtasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?project=${projectId}`),
        api.get(`/projects/${projectId}/activities`).catch(() => ({ data: { data: { activities: [] } } })),
        api.get('/subtasks').catch(() => ({ data: { data: { subtasks: [] } } }))
      ]);

      setProject(projRes.data.data.project);
      setTasks(tasksRes.data.data.tasks || []);
      setActivities(actRes.data.data.activities || []);
      
      const allSub = subtasksRes.data.data.subtasks || [];
      const projectSub = allSub.filter((sub: any) => {
        const parentProj = sub.parentTask?.project?._id || sub.parentTask?.project;
        return parentProj === projectId;
      });
      setSubtasks(projectSub);

      const members = projRes.data.data.project.assignees || [];
      setTeamMembers(members);
      setSelectedMembers(members.map((m: any) => m._id || m));
    } catch (err) {
      console.error('Failed to load project workspace', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await api.get('/users');
      setAllUsers(res.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch user directory', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: taskTitle,
        description: taskDesc,
        status: taskStatus,
        priority: taskPriority,
        project: projectId,
        estimatedHours: Number(taskEstHours) || 0,
        dueDate: taskDueDate || undefined,
        startDate: taskStartDate || undefined,
        assignees: taskAssignees
      };

      await api.post('/tasks', payload);
      setCreateModalOpen(false);
      
      // Reset Task Form
      setTaskTitle('');
      setTaskDesc('');
      setTaskStatus('Todo');
      setTaskPriority('Medium');
      setTaskEstHours('');
      setTaskDueDate('');
      setTaskStartDate('');
      setTaskAssignees([]);

      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTeamMembers = async () => {
    try {
      await api.put(`/projects/${projectId}`, {
        assignees: selectedMembers
      });
      setTeamModalOpen(false);
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update project team');
    }
  };

  const handleStartTimer = async (taskId: string, title: string) => {
    const res = await startTimer(taskId, `Project Task: ${title}`);
    if (res.success) {
      alert('Stopwatch timer started successfully!');
    } else {
      alert(res.message);
    }
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDrawerOpen(true);
  };

  const handleToggleAssignee = (userId: string) => {
    setTaskAssignees(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleTaskStatusDirect = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Done' ? 'Todo' : 'Done';
    try {
      await api.put(`/tasks/${taskId}`, { status: nextStatus });
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleToggleSubtaskStatusDirect = async (subtaskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Done' ? 'Todo' : 'Done';
    try {
      await api.put(`/subtasks/${subtaskId}`, { status: nextStatus });
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update subtask status');
    }
  };

  const renderTargetTaskItem = (item: any, isOverdue = false) => {
    const isSub = item.isSubtask;
    return (
      <div 
        key={item._id} 
        className={`bg-[hsl(var(--espark-bg))]/80 border ${isSub ? 'border-violet-950/60 hover:border-violet-700/50' : 'border-[hsl(var(--espark-border))]'} rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-[hsl(var(--espark-primary))/0.4] transition-colors`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start space-x-2 truncate">
            <input 
              type="checkbox"
              checked={item.status === 'Done'}
              onChange={() => isSub ? handleToggleSubtaskStatusDirect(item._id, item.status) : handleToggleTaskStatusDirect(item._id, item.status)}
              className="mt-0.5 rounded border-slate-700 text-[hsl(var(--espark-primary))] focus:ring-0 cursor-pointer"
            />
            <button
              onClick={() => isSub ? navigate(`/tasks/${item.parentTask?._id || item.parentTask}`) : handleTaskClick(item._id)}
              className="text-xs font-bold text-[hsl(var(--espark-text))] hover:text-[hsl(var(--espark-primary))] hover:underline truncate text-left"
            >
              {isSub && <span className="text-[9px] text-violet-400 font-extrabold mr-1">[SUBTASK]</span>}
              {item.title}
            </button>
          </div>
          
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
            item.priority === 'Critical' ? 'bg-red-950 text-red-400 border border-red-900' :
            item.priority === 'High' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
            'bg-slate-800 text-slate-400'
          }`}>
            {item.priority}
          </span>
        </div>

        <div className="flex justify-between items-center pt-1.5 border-t border-[hsl(var(--espark-border))/0.3] text-[9px] text-[hsl(var(--espark-muted))]">
          <span className={`flex items-center space-x-1 font-medium ${isOverdue ? 'text-red-400 font-bold' : ''}`}>
            <Clock size={10} />
            <span>
              {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No date'}
            </span>
          </span>

          <button
            onClick={() => handleStartTimer(item._id, item.title)}
            className="p-1 rounded bg-[hsl(var(--espark-surface))] hover:bg-[hsl(var(--espark-surface-2))] border border-[hsl(var(--espark-border))] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-primary))] transition-colors"
            title="Start time tracking"
          >
            <Clock size={10} className="animate-pulse" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[hsl(var(--espark-primary))/0.2] border-t-[hsl(var(--espark-primary))] rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-2xl text-center text-red-400">
        Workspace could not be resolved or project not found.
      </div>
    );
  }

  // Calculate Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const totalEstHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  // Personalized Goals for the logged-in user (including both Tasks and Subtasks)
  const myTasks = tasks.filter(task => 
    task.assignees?.some((a: any) => (a._id || a) === user?._id)
  );

  const mySub = subtasks.filter(sub => 
    (sub.assignee?._id || sub.assignee) === user?._id
  );

  const unifiedActionItems = [
    ...myTasks.map(t => ({ ...t, isSubtask: false })),
    ...mySub.map(s => ({
      ...s,
      isSubtask: true,
      project: s.parentTask?.project || project,
      priority: s.priority || 'Medium',
    }))
  ];

  const myPendingItems = unifiedActionItems.filter(item => item.status !== 'Done');
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Items due today
  const myItemsDueToday = myPendingItems.filter(item => {
    if (!item.dueDate) return false;
    return new Date(item.dueDate).toISOString().split('T')[0] === todayStr;
  });

  // Overdue items
  const myOverdueItems = myPendingItems.filter(item => {
    if (!item.dueDate) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const itemDue = new Date(item.dueDate);
    itemDue.setHours(0,0,0,0);
    return itemDue < today;
  });

  // Active Focus items (In Progress, but not due today/overdue)
  const myActiveFocusItems = myPendingItems.filter(item => 
    item.status === 'In Progress' && 
    (!item.dueDate || (
      new Date(item.dueDate).toISOString().split('T')[0] !== todayStr &&
      new Date(item.dueDate).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)
    ))
  );

  // Sort them by due date / priority so users know what to do first today
  const sortedItemsDueToday = [...myItemsDueToday].sort((a, b) => {
    const priorityWeight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
  });

  const sortedOverdueItems = [...myOverdueItems].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const sortedActiveFocusItems = [...myActiveFocusItems].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Filter tasks for the Task Matrix Tab
  const filteredTasks = tasks.filter(task => {
    // 1. Assignee Filter
    if (assigneeFilter === 'me') {
      const isAssigned = task.assignees?.some((a: any) => (a._id || a) === user?._id);
      if (!isAssigned) return false;
    } else if (assigneeFilter !== 'all') {
      const isAssigned = task.assignees?.some((a: any) => (a._id || a) === assigneeFilter);
      if (!isAssigned) return false;
    }

    // 2. Due Date Filter
    if (dueFilter === 'today') {
      if (!task.dueDate) return false;
      const taskDueStr = new Date(task.dueDate).toISOString().split('T')[0];
      if (taskDueStr !== todayStr) return false;
    } else if (dueFilter === 'overdue') {
      if (!task.dueDate || task.status === 'Done') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDue = new Date(task.dueDate);
      taskDue.setHours(0, 0, 0, 0);
      if (taskDue >= today) return false;
    }

    // 3. Priority Filter
    if (priorityFilter === 'high_critical') {
      if (task.priority !== 'High' && task.priority !== 'Critical') return false;
    } else if (priorityFilter !== 'all') {
      if (task.priority !== priorityFilter) return false;
    }

    return true;
  });

  // Apply sorting options to filteredTasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (taskSortBy === 'dueDateAsc') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (taskSortBy === 'dueDateDesc') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    if (taskSortBy === 'priority') {
      const priorityWeight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    }
    return 0; // none
  });

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[hsl(var(--espark-surface))] p-5 rounded-2xl border border-[hsl(var(--espark-border))] shadow-sm">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center space-x-1.5 text-xs text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Projects</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-black text-[hsl(var(--espark-text))] flex items-center space-x-2">
              <FolderKanban className="text-[hsl(var(--espark-primary))]" />
              <span>{project.name} Workspace</span>
            </h1>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
              project.status === 'In Review' ? 'bg-indigo-500/10 text-indigo-400' :
              project.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {project.status}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {['Super Admin', 'Admin', 'Project Manager'].includes(user?.role) && (
            <button
              onClick={() => setTeamModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[hsl(var(--espark-surface-2))] border border-[hsl(var(--espark-border))] hover:border-[hsl(var(--espark-primary))/0.6] text-xs font-bold rounded-xl transition-all"
            >
              <Users size={14} />
              <span>Manage Team</span>
            </button>
          )}

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-[hsl(var(--espark-border))] flex overflow-x-auto gap-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'tasks', label: 'Tasks Matrix', icon: CheckSquare },
          { id: 'sprints', label: 'Sprint Board', icon: Layers },
          { id: 'milestones', label: 'Milestones', icon: MilestoneTracker },
          { id: 'activity', label: 'Activity Logs', icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                isCurrent 
                  ? 'border-[hsl(var(--espark-primary))] text-[hsl(var(--espark-primary))]' 
                  : 'border-transparent text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Description & Client Card */}
              <div className="md:col-span-2 bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-5 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-[hsl(var(--espark-muted))] uppercase tracking-wider">Project Objectives</h4>
                  <p className="text-xs text-[hsl(var(--espark-text))] mt-1.5 leading-relaxed font-medium">
                    {project.description || 'No description configured for this project.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[hsl(var(--espark-border))/0.4]">
                  <div>
                    <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] block uppercase">Timeline Calendar</span>
                    <span className="text-xs font-bold text-[hsl(var(--espark-text))] flex items-center space-x-1.5 mt-1">
                      <Calendar size={13} className="text-[hsl(var(--espark-primary))]" />
                      <span>
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] block uppercase">Overall Progress</span>
                    <span className="text-xs font-bold text-[hsl(var(--espark-text))] block mt-1">{project.progress || 0}% Complete</span>
                  </div>
                </div>
              </div>

              {/* Client Info Card */}
              <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] uppercase tracking-wider flex items-center space-x-1">
                  <Building2 size={12} />
                  <span>Client Parameters</span>
                </span>
                
                <div className="text-xs space-y-2 font-medium flex-1 pt-2">
                  <p className="text-[hsl(var(--espark-text))] font-bold text-sm">{project.client?.company || 'Internal Project'}</p>
                  <p className="text-[hsl(var(--espark-muted))] flex items-center space-x-1.5">
                    <User size={12} />
                    <span>{project.client?.name || 'N/A'}</span>
                  </p>
                  {project.client?.email && (
                    <p className="text-[hsl(var(--espark-muted))] flex items-center space-x-1.5">
                      <Clock size={12} />
                      <span className="underline">{project.client.email}</span>
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* PERSONAL TARGETS & TODAY'S GOALS FOR LOGGED-IN USER */}
            <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[hsl(var(--espark-border))/0.4] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🎯</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-[hsl(var(--espark-text))]">My Today's Goals & Active Focus</h3>
                    <p className="text-[10px] text-[hsl(var(--espark-muted))] mt-0.5">Personalized checklist of tasks assigned to you that need attention today.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 bg-[hsl(var(--espark-primary))/0.15] text-[hsl(var(--espark-primary))] rounded-full">
                    {myPendingItems.length} Pending Items
                  </span>
                </div>
              </div>

              {myPendingItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-[hsl(var(--espark-muted))] font-medium italic">
                  🎉 All your tasks and subtasks for this project are completed. Great work!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Column 1: Due Today */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>Due Today ({sortedItemsDueToday.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {sortedItemsDueToday.length === 0 ? (
                        <p className="text-[10px] text-[hsl(var(--espark-muted))] italic bg-[hsl(var(--espark-bg))]/45 p-3 rounded-xl border border-[hsl(var(--espark-border))/0.3]">No items due today.</p>
                      ) : (
                        sortedItemsDueToday.map(item => renderTargetTaskItem(item))
                      )}
                    </div>
                  </div>

                  {/* Column 2: Overdue Targets */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Overdue Action Items ({sortedOverdueItems.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {sortedOverdueItems.length === 0 ? (
                        <p className="text-[10px] text-[hsl(var(--espark-muted))] italic bg-[hsl(var(--espark-bg))]/45 p-3 rounded-xl border border-[hsl(var(--espark-border))/0.3]">No overdue items. Excellent!</p>
                      ) : (
                        sortedOverdueItems.map(item => renderTargetTaskItem(item, true))
                      )}
                    </div>
                  </div>

                  {/* Column 3: Active Focus */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Active Work Focus ({sortedActiveFocusItems.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {sortedActiveFocusItems.length === 0 ? (
                        <p className="text-[10px] text-[hsl(var(--espark-muted))] italic bg-[hsl(var(--espark-bg))]/45 p-3 rounded-xl border border-[hsl(var(--espark-border))/0.3]">No active items in progress.</p>
                      ) : (
                        sortedActiveFocusItems.map(item => renderTargetTaskItem(item))
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] uppercase">Completion Progress</span>
                <span className="text-2xl font-black text-[hsl(var(--espark-text))] my-2">{project.progress || 0}%</span>
                <div className="w-full bg-[hsl(var(--espark-bg))] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[hsl(var(--espark-primary))] to-[hsl(var(--espark-secondary))] h-full" style={{ width: `${project.progress || 0}%` }} />
                </div>
              </div>

              <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] uppercase">Total Tasks</span>
                <span className="text-2xl font-black text-[hsl(var(--espark-text))] block my-2">{totalTasks}</span>
                <span className="text-[9px] font-bold text-[hsl(var(--espark-muted))]">{completedTasks} completed · {inProgressTasks} in progress</span>
              </div>

              <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] uppercase">Hours Allocation</span>
                <span className="text-2xl font-black text-[hsl(var(--espark-text))] block my-2">{totalEstHours}h</span>
                <span className="text-[9px] font-bold text-[hsl(var(--espark-muted))]">Estimated total across all tasks</span>
              </div>

              <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] uppercase">Project Budget Limit</span>
                <span className="text-2xl font-black text-[hsl(var(--espark-text))] block my-2">{project.budgetHours || 0}h</span>
                {project.budgetHours > 0 && totalEstHours > project.budgetHours ? (
                  <span className="text-[9px] bg-red-950/60 border border-red-900/60 text-red-400 font-bold px-1.5 py-0.5 rounded">Over budget</span>
                ) : (
                  <span className="text-[9px] bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 font-bold px-1.5 py-0.5 rounded">Within budget limit</span>
                )}
              </div>
            </div>

            {/* Team Members List */}
            <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-5 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-[hsl(var(--espark-text))]">Assigned Team Members</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--espark-muted))] italic">No team members assigned.</p>
                ) : (
                  teamMembers.map((member: any) => (
                    <div key={member._id} className="bg-[hsl(var(--espark-bg))]/60 p-3 rounded-xl border border-[hsl(var(--espark-border))/0.4] flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--espark-primary))/0.15] border border-[hsl(var(--espark-primary))/0.4] flex items-center justify-center font-bold text-[hsl(var(--espark-primary))] uppercase">
                        {member.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[hsl(var(--espark-text))] truncate">{member.name}</p>
                        <p className="text-[9px] text-[hsl(var(--espark-muted))] uppercase mt-0.5">{member.role}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TASKS PANEL */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* View Switchers & Filters Bar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[hsl(var(--espark-surface))] p-4 rounded-2xl border border-[hsl(var(--espark-border))]">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'kanban', label: 'Kanban board' },
                  { id: 'list', label: 'List matrix' },
                  { id: 'timeline', label: 'Gantt timeline' },
                  { id: 'calendar', label: 'Calendar dates' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setTaskView(v.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      taskView === v.id 
                        ? 'bg-[hsl(var(--espark-surface-2))] text-[hsl(var(--espark-primary))] border border-[hsl(var(--espark-border))]' 
                        : 'text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))]'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Filters Controls */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Assignee Filter select */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-[hsl(var(--espark-muted))] font-black uppercase">Assignee:</span>
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[11px] text-[hsl(var(--espark-text))] font-bold px-2.5 py-1.5 rounded-xl outline-none focus:border-[hsl(var(--espark-primary))]"
                  >
                    <option value="all">All Members</option>
                    <option value="me">Assigned to Me 🎯</option>
                    {teamMembers.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date Filter select */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-[hsl(var(--espark-muted))] font-black uppercase">Timeline:</span>
                  <select
                    value={dueFilter}
                    onChange={(e) => setDueFilter(e.target.value)}
                    className="bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[11px] text-[hsl(var(--espark-text))] font-bold px-2.5 py-1.5 rounded-xl outline-none focus:border-[hsl(var(--espark-primary))]"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Due Today 📅</option>
                    <option value="overdue">Overdue ⚠️</option>
                  </select>
                </div>

                {/* Priority Filter select */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-[hsl(var(--espark-muted))] font-black uppercase">Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[11px] text-[hsl(var(--espark-text))] font-bold px-2.5 py-1.5 rounded-xl outline-none focus:border-[hsl(var(--espark-primary))]"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high_critical">High & Critical 🔥</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Sort select */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-[hsl(var(--espark-muted))] font-black uppercase">Sort By:</span>
                  <select
                    value={taskSortBy}
                    onChange={(e) => setTaskSortBy(e.target.value)}
                    className="bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[11px] text-[hsl(var(--espark-text))] font-bold px-2.5 py-1.5 rounded-xl outline-none focus:border-[hsl(var(--espark-primary))]"
                  >
                    <option value="dueDateAsc">Due Date: Soonest first 📅</option>
                    <option value="dueDateDesc">Due Date: Latest first</option>
                    <option value="priority">Priority: Highest first 🔥</option>
                    <option value="none">Default order</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(assigneeFilter !== 'all' || dueFilter !== 'all' || priorityFilter !== 'all' || taskSortBy !== 'dueDateAsc') && (
                  <button
                    onClick={() => { setAssigneeFilter('all'); setDueFilter('all'); setPriorityFilter('all'); setTaskSortBy('dueDateAsc'); }}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold underline transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Task Matrix Renderers */}
            {taskView === 'kanban' && (
              <KanbanView 
                tasks={sortedTasks} 
                onTaskUpdated={fetchWorkspaceData} 
                teamMembers={teamMembers} 
                onTaskClick={handleTaskClick} 
                onStartTimer={handleStartTimer}
              />
            )}
            {taskView === 'list' && (
              <ListView 
                tasks={sortedTasks} 
                onTaskUpdated={fetchWorkspaceData} 
                onTaskClick={handleTaskClick} 
                onStartTimer={handleStartTimer}
              />
            )}
            {taskView === 'timeline' && (
              <TimelineView 
                tasks={sortedTasks} 
                onTaskClick={handleTaskClick}
              />
            )}
            {taskView === 'calendar' && (
              <CalendarView 
                tasks={sortedTasks} 
                onTaskClick={handleTaskClick}
              />
            )}
          </div>
        )}

        {/* SPRINTS PANEL */}
        {activeTab === 'sprints' && (
          <SprintBoard 
            projectId={projectId!}
            projectTasks={tasks}
            onTaskUpdated={fetchWorkspaceData}
            teamMembers={teamMembers}
          />
        )}

        {/* MILESTONES PANEL */}
        {activeTab === 'milestones' && (
          <MilestoneTracker 
            projectId={projectId!}
            projectTasks={tasks}
            onTaskUpdated={fetchWorkspaceData}
          />
        )}

        {/* ACTIVITY LOGS PANEL */}
        {activeTab === 'activity' && (
          <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-5 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-[hsl(var(--espark-text))]">Project Activity stream</h3>
            <div className="divide-y divide-[hsl(var(--espark-border))/0.4] max-h-[60vh] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-center py-8 text-[hsl(var(--espark-muted))] italic">No actions logged yet in this workspace.</p>
              ) : (
                activities.map((act) => (
                  <div key={act._id} className="py-3 flex justify-between items-start gap-4">
                    <div>
                      <p className="text-xs text-[hsl(var(--espark-text))] font-semibold">
                        <strong className="text-[hsl(var(--espark-primary))]">{act.user?.name || 'System'}</strong>: {act.action?.replace('_', ' ')}
                      </p>
                      {act.details && (
                        <p className="text-[10px] text-[hsl(var(--espark-muted))] mt-1">
                          Changed {act.details.fieldName} from "{act.details.oldValue || 'none'}" to "{act.details.newValue}"
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] text-[hsl(var(--espark-muted))] whitespace-nowrap font-medium">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* CREATE TASK DRAWER/MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add Task to Workspace">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Task Title</label>
            <input 
              type="text" 
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Wireframe User Signup flow"
              className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2.5 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Description</label>
            <textarea 
              rows={3}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Provide detail description / instructions..."
              className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Start Date</label>
              <input 
                type="date" 
                value={taskStartDate}
                onChange={(e) => setTaskStartDate(e.target.value)}
                className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2.5 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Due Date</label>
              <input 
                type="date" 
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2.5 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Status</label>
              <select 
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-3 py-2.5 text-xs text-[hsl(var(--espark-text))]"
              >
                {['Backlog', 'Todo', 'In Progress', 'In Review', 'QA Ready', 'Done'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Priority</label>
              <select 
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-3 py-2.5 text-xs text-[hsl(var(--espark-text))]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Hours Est.</label>
              <input 
                type="number" 
                value={taskEstHours}
                placeholder="e.g. 4"
                onChange={(e) => setTaskEstHours(e.target.value)}
                className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-3 py-2.5 text-xs text-[hsl(var(--espark-text))]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-2">Assign Team Members</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {teamMembers.map(member => (
                <button
                  type="button"
                  key={member._id}
                  onClick={() => handleToggleAssignee(member._id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                    taskAssignees.includes(member._id)
                      ? 'bg-[hsl(var(--espark-primary))] border-[hsl(var(--espark-primary))] text-white'
                      : 'bg-[hsl(var(--espark-bg))] border-[hsl(var(--espark-border))] text-[hsl(var(--espark-muted))] hover:text-white'
                  }`}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Create Task
          </button>
        </form>
      </Modal>

      {/* TEAM MEMBERS CONFIGURATION MODAL */}
      <Modal isOpen={teamModalOpen} onClose={() => setTeamModalOpen(false)} title="Configure Project Team">
        <div className="space-y-4">
          <p className="text-[10px] text-[hsl(var(--espark-muted))]">Add or remove team members allowed access to this workspace.</p>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {allUsers.filter(u => u.isActive !== false).map(u => {
              const isSelected = selectedMembers.includes(u._id);
              return (
                <div 
                  key={u._id}
                  onClick={() => {
                    setSelectedMembers(prev => 
                      prev.includes(u._id) ? prev.filter(id => id !== u._id) : [...prev, u._id]
                    );
                  }}
                  className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-colors ${
                    isSelected 
                      ? 'bg-[hsl(var(--espark-primary))/0.1] border-[hsl(var(--espark-primary))]' 
                      : 'bg-[hsl(var(--espark-surface))] border-[hsl(var(--espark-border))/0.6]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-full bg-[hsl(var(--espark-primary))/0.1] flex items-center justify-center font-bold text-[hsl(var(--espark-primary))] text-xs uppercase">
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[hsl(var(--espark-text))]">{u.name}</p>
                      <p className="text-[9px] text-[hsl(var(--espark-muted))] mt-0.5">{u.role}</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="rounded border-slate-700 text-[hsl(var(--espark-primary))] focus:ring-0"
                  />
                </div>
              );
            })}
          </div>

          <button
            onClick={handleUpdateTeamMembers}
            className="w-full py-2.5 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Update Team Assignees
          </button>
        </div>
      </Modal>

      {/* NESTED TASK DETAIL VIEW DRAWER */}
      <TaskDetailsDrawer 
        taskId={selectedTaskId}
        isOpen={taskDrawerOpen}
        onClose={() => { setTaskDrawerOpen(false); setSelectedTaskId(null); fetchWorkspaceData(); }}
        teamMembers={teamMembers}
        projects={[project]}
        onTaskUpdated={fetchWorkspaceData}
      />
    </div>
  );
}
