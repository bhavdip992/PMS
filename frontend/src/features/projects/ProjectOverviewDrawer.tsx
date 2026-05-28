import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { 
  X, 
  Clock, 
  Calendar, 
  CheckSquare, 
  AlertCircle, 
  Building2, 
  User, 
  BarChart3, 
  Plus, 
  ArrowRight, 
  Eye, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import TaskDetailsDrawer from '../tasks/TaskDetailsDrawer.tsx';
import SubtaskDetailsDrawer from '../tasks/SubtaskDetailsDrawer.tsx';

export default function ProjectOverviewDrawer({ projectId, isOpen, onClose, teamMembers, projects, onProjectUpdated }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [subtasksMap, setSubtasksMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // Nested Drawers
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [subtaskDrawerOpen, setSubtaskDrawerOpen] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectOverviewData();
    }
  }, [isOpen, projectId]);

  const fetchProjectOverviewData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Project Details
      const projRes = await api.get(`/projects/${projectId}`);
      setProject(projRes.data.data.project);

      // 2. Fetch Tasks belonging to Project
      const tasksRes = await api.get(`/tasks?project=${projectId}`);
      const projectTasks = tasksRes.data.data.tasks || [];
      setTasks(projectTasks);

      // 3. Fetch Subtasks for each task in parallel
      const subtaskPromises = projectTasks.map(t => 
        api.get(`/subtasks/task/${t._id}`)
          .then(res => ({ taskId: t._id, subtasks: res.data.data.subtasks || [] }))
          .catch(() => ({ taskId: t._id, subtasks: [] }))
      );
      
      const subtaskResults = await Promise.all(subtaskPromises);
      const newSubtasksMap = {};
      subtaskResults.forEach(res => {
        newSubtasksMap[res.taskId] = res.subtasks;
      });
      setSubtasksMap(newSubtasksMap);

    } catch (err) {
      console.error('Error fetching project overview dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle checklist/subtask toggling wrapper if needed
  const handleToggleSubtaskStatus = async (subtaskId) => {
    try {
      await api.put(`/subtasks/${subtaskId}/toggle`);
      fetchProjectOverviewData();
    } catch (err) {
      console.error('Failed to toggle subtask status', err);
    }
  };

  if (!isOpen) return null;

  // Calculations for Overview Dashboard Metrics
  const totalTasks = tasks.length;
  const statusCounts = {
    'Todo': tasks.filter(t => t.status === 'Todo').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'In Review': tasks.filter(t => t.status === 'In Review').length,
    'Done': tasks.filter(t => t.status === 'Done').length,
  };

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalSubtasks = Object.values(subtasksMap).reduce((sum, list) => sum + list.length, 0);
  const completedSubtasks = Object.values(subtasksMap).reduce(
    (sum, list) => sum + list.filter(s => s.status === 'Done').length, 0
  );

  return (
    <div className="fixed inset-0 z-45 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slideout Panel */}
      <div className="relative w-full max-w-4xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-45">
        
        {/* Panel Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-800">
                Project Dashboard
              </span>
              {project && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                  project.priority === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' :
                  project.priority === 'High' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {project.priority} Priority
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-100">{project?.name || 'Project Overview'}</h2>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Client & Description Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {project?.description || 'No description provided for this project.'}
                  </p>
                </div>
                
                {project?.client && (
                  <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                      <Building2 size={11} />
                      <span>Client Details</span>
                    </h4>
                    <div className="text-xs space-y-1.5 font-medium">
                      <p className="text-slate-200 font-bold">{project.client.company || 'N/A'}</p>
                      <p className="text-slate-400 flex items-center space-x-1.5">
                        <User size={10} className="text-slate-500" />
                        <span>{project.client.name || 'N/A'}</span>
                      </p>
                      {project.client.email && (
                        <p className="text-slate-400 truncate flex items-center space-x-1.5">
                          <Clock size={10} className="text-slate-500" />
                          <span className="underline">{project.client.email}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress & Estimates Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Progress Card */}
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Progress</span>
                  <div className="my-2.5 flex items-baseline space-x-1.5">
                    <span className="text-2xl font-black text-slate-100">{project?.progress || 0}%</span>
                    <span className="text-[9px] font-bold text-emerald-400">Complete</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full"
                      style={{ width: `${project?.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Tasks Count */}
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tasks Breakdown</span>
                  <div className="mt-2.5 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-slate-100">{totalTasks}</span>
                      <span className="text-[9px] font-bold text-slate-400">Total Tickets</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] font-bold text-slate-400">
                      <span className="text-blue-400">{statusCounts['In Progress']} In-Progress</span>
                      <span className="text-emerald-400">{statusCounts['Done']} Completed</span>
                      <span className="text-violet-400">{statusCounts['In Review']} In-Review</span>
                      <span className="text-slate-500">{statusCounts['Todo']} Backlog</span>
                    </div>
                  </div>
                </div>

                {/* Subtask Stats */}
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Subtasks Breakdown</span>
                  <div className="mt-2.5 flex items-baseline space-x-1.5">
                    <span className="text-2xl font-black text-slate-100">{completedSubtasks}/{totalSubtasks}</span>
                    <span className="text-[9px] font-bold text-slate-400">completed</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 mt-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full"
                      style={{ width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Hours Stats & Budget Status */}
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Budget Estimation</span>
                  <div className="my-1 flex items-baseline space-x-1.5">
                    <span className="text-2xl font-black text-slate-100">{totalEstimatedHours}h</span>
                    <span className="text-[9px] font-medium text-slate-400">est. / {project?.budgetHours || 0}h budget</span>
                  </div>
                  {project?.budgetHours > 0 && totalEstimatedHours > project.budgetHours ? (
                    <span className="text-[8px] bg-red-950/60 border border-red-900 text-red-400 font-bold px-1.5 py-0.5 rounded w-max">
                      Over budget by {totalEstimatedHours - project.budgetHours}h
                    </span>
                  ) : (
                    <span className="text-[8px] bg-emerald-950/60 border border-emerald-900 text-emerald-400 font-bold px-1.5 py-0.5 rounded w-max">
                      Within Hour Limit
                    </span>
                  )}
                </div>

              </div>

              {/* Tasks Breakdown Stream */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xs text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <CheckSquare size={13} className="text-violet-400" />
                    <span>Project Workspace Tasks & Subtasks</span>
                  </h3>
                </div>

                {tasks.length === 0 ? (
                  <div className="bg-slate-950/30 border border-slate-850 p-10 rounded-2xl text-center text-xs text-slate-500">
                    No tasks assigned to this project yet.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {tasks.map(task => {
                      const taskSubs = subtasksMap[task._id] || [];
                      const completedSubs = taskSubs.filter(s => s.status === 'Done').length;
                      
                      return (
                        <div 
                          key={task._id} 
                          className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 hover:border-slate-800 transition-colors space-y-3"
                        >
                          {/* Task Header */}
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                  task.status === 'Done' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                  task.status === 'In Review' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                                  task.status === 'In Progress' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {task.status}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  task.priority === 'Critical' ? 'bg-red-950/80 text-red-400' :
                                  task.priority === 'High' ? 'bg-amber-950/80 text-amber-400' : 'bg-slate-900 text-slate-500'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                              <button 
                                onClick={() => { setSelectedTaskId(task._id); setTaskDrawerOpen(true); }}
                                className="text-sm font-bold text-slate-200 hover:text-violet-400 hover:underline text-left transition-colors"
                              >
                                {task.title}
                              </button>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                                {task.estimatedHours}h est
                              </span>
                              <button 
                                onClick={() => { setSelectedTaskId(task._id); setTaskDrawerOpen(true); }}
                                className="p-1 rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 transition-colors"
                                title="Open Task Workspace"
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Task Description snippet */}
                          {task.description && (
                            <p className="text-xs text-slate-400 font-medium line-clamp-1">
                              {task.description}
                            </p>
                          )}

                          {/* Subtasks breakdown under the Task */}
                          {taskSubs.length > 0 && (
                            <div className="border-t border-slate-850/60 pt-2.5 space-y-2">
                              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                <span>Subtasks ({completedSubs}/{taskSubs.length})</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {taskSubs.map(sub => (
                                  <div 
                                    key={sub._id} 
                                    className="p-2.5 bg-slate-900/40 border border-slate-850 rounded-xl flex justify-between items-center text-[11px] font-medium"
                                  >
                                    <div className="flex items-center space-x-2 truncate">
                                      <input 
                                        type="checkbox"
                                        checked={sub.status === 'Done'}
                                        onChange={() => handleToggleSubtaskStatus(sub._id)}
                                        className="rounded border-slate-800 text-violet-600 focus:ring-0 cursor-pointer"
                                      />
                                      <button 
                                        onClick={() => { setSelectedSubtaskId(sub._id); setSubtaskDrawerOpen(true); }}
                                        className={`hover:underline truncate text-left ${sub.status === 'Done' ? 'line-through text-slate-500 font-semibold' : 'text-slate-300'}`}
                                      >
                                        {sub.title}
                                      </button>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 px-1 bg-slate-950 border border-slate-850 rounded">
                                      {sub.estimatedHours}h
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Task Details Drawer */}
      <TaskDetailsDrawer 
        taskId={selectedTaskId}
        isOpen={taskDrawerOpen}
        onClose={() => { setTaskDrawerOpen(false); setSelectedTaskId(null); fetchProjectOverviewData(); }}
        teamMembers={teamMembers}
        projects={projects}
        onTaskUpdated={fetchProjectOverviewData}
      />

      {/* Subtask Details Drawer */}
      <SubtaskDetailsDrawer 
        subtaskId={selectedSubtaskId}
        isOpen={subtaskDrawerOpen}
        onClose={() => { setSubtaskDrawerOpen(false); setSelectedSubtaskId(null); fetchProjectOverviewData(); }}
        teamMembers={teamMembers}
        onSubtaskUpdated={fetchProjectOverviewData}
        onTaskClick={(linkedId) => {
          setSubtaskDrawerOpen(false);
          setSelectedSubtaskId(null);
          setSelectedTaskId(linkedId);
          setTaskDrawerOpen(true);
        }}
      />

    </div>
  );
}
