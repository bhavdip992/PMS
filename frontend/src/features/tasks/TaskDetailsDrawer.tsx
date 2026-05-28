import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import {
  X,
  Play,
  Plus,
  Trash2,
  Save,
  GitBranch,
  GitPullRequest,
  ShieldAlert,
  CheckCircle2,
  Clock,
  PlusCircle,
  CheckSquare,
  Sparkles,
  Paperclip,
  Lock,
  Globe,
  MessageSquare,
  ChevronRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import SubtaskDetailsDrawer from './SubtaskDetailsDrawer.tsx';
import RichTextEditor from '../../components/RichTextEditor.tsx';

export default function TaskDetailsDrawer({ taskId: propTaskId, isOpen, onClose, teamMembers, projects, onTaskUpdated }) {
  const [taskId, setTaskId] = useState(propTaskId);

  useEffect(() => {
    setTaskId(propTaskId);
  }, [propTaskId]);
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('comments'); // 'comments' | 'history'

  // Subtask drawer states
  const [subtaskDrawerOpen, setSubtaskDrawerOpen] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);

  const handleOpenSubtaskDetails = (subId) => {
    setSelectedSubtaskId(subId);
    setSubtaskDrawerOpen(true);
  };

  // Edit fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [watchers, setWatchers] = useState([]);

  // Requirements fields
  const [acceptanceCriteria, setAcceptanceCriteria] = useState([]);
  const [newCriteriaText, setNewCriteriaText] = useState('');
  const [businessLogic, setBusinessLogic] = useState('');
  const [testingInstructions, setTestingInstructions] = useState('');

  // Development fields
  const [gitBranch, setGitBranch] = useState('');
  const [newPrUrl, setNewPrUrl] = useState('');
  const [pullRequests, setPullRequests] = useState([]);
  const [qaStatus, setQaStatus] = useState('Pending');

  // Subtask fields
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskAssignee, setSubtaskAssignee] = useState('');
  const [subtaskEstimates, setSubtaskEstimates] = useState('');
  const [subtasks, setSubtasks] = useState([]);

  // Checklist fields
  const [newChecklistText, setNewChecklistText] = useState('');

  // Comment fields
  const [newCommentText, setNewCommentText] = useState('');
  const [commentIsInternal, setCommentIsInternal] = useState(false);
  const [commentMentions, setCommentMentions] = useState([]);

  // Attachment fields
  const [attachments, setAttachments] = useState([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');

  // Milestones & Dependencies
  const [milestones, setMilestones] = useState([]);
  const [milestoneId, setMilestoneId] = useState('');
  const [projectTasks, setProjectTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);

  const fetchMilestones = async (projectId) => {
    try {
      const res = await api.get(`/milestones?projectId=${projectId}`);
      setMilestones(res.data.data.milestones || []);
    } catch (err) {
      console.error('Failed to load project milestones', err);
    }
  };

  const fetchProjectTasks = async (projectId) => {
    try {
      const res = await api.get(`/tasks?project=${projectId}`);
      setProjectTasks((res.data.data.tasks || []).filter(tk => tk._id !== taskId));
    } catch (err) {
      console.error('Failed to load project tasks', err);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskData();
    }
  }, [isOpen, taskId]);

  const fetchTaskData = async () => {
    setLoading(true);
    try {
      const [taskRes, commsRes, actRes, subtasksRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/comments`),
        api.get(`/tasks/${taskId}/activities`),
        api.get(`/subtasks/task/${taskId}`)
      ]);

      const t = taskRes.data.data.task;
      setTask(t);
      setComments(commsRes.data.data.comments || []);
      setActivities(actRes.data.data.activities || []);
      setSubtasks(subtasksRes.data.data.subtasks || []);

      // Populate form fields
      setTitle(t.title || '');
      setDescription(t.description || '');
      setStatus(t.status || 'Todo');
      setPriority(t.priority || 'Medium');
      setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');
      setEstimatedHours(t.estimatedHours || '');
      setActualHours(t.actualHours || '');
      setSprintId(t.sprintId || '');
      setAssignees(t.assignees?.map(a => a._id) || []);
      setWatchers(t.watchers?.map(w => w._id) || []);
      setMilestoneId(t.milestone?._id || t.milestone || '');
      setDependencies(t.dependencies?.map(d => d._id || d) || []);

      // Populate Requirements
      setAcceptanceCriteria(t.requirements?.acceptanceCriteria || []);
      setBusinessLogic(t.requirements?.businessLogic || '');
      setTestingInstructions(t.requirements?.testingInstructions || '');

      // Populate Dev Tracking
      setGitBranch(t.devTracking?.branch || '');
      setPullRequests(t.devTracking?.pullRequests || []);
      setQaStatus(t.devTracking?.qaStatus || 'Pending');

      const pId = t.project?._id || t.project;
      if (pId) {
        fetchMilestones(pId);
        fetchProjectTasks(pId);
      }

    } catch (err) {
      console.error('Failed to load task details in drawer', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasic = async () => {
    try {
      const updated = {
        title,
        description,
        status,
        priority,
        dueDate: dueDate || null,
        estimatedHours: Number(estimatedHours) || 0,
        actualHours: Number(actualHours) || 0,
        sprintId: sprintId || null,
        assignees,
        watchers,
        milestone: milestoneId || null,
        dependencies
      };
      await api.put(`/tasks/${taskId}`, updated);
      fetchTaskData();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task properties');
    }
  };

  const handleSaveRequirements = async () => {
    try {
      const payload = {
        requirements: {
          acceptanceCriteria,
          businessLogic,
          testingInstructions
        }
      };
      await api.put(`/tasks/${taskId}`, payload);
      fetchTaskData();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Failed to update requirements specifications');
    }
  };

  const handleSaveDevTracking = async () => {
    try {
      const payload = {
        devTracking: {
          branch: gitBranch,
          pullRequests,
          qaStatus
        }
      };
      await api.put(`/tasks/${taskId}`, payload);
      fetchTaskData();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Failed to update dev tracking metrics');
    }
  };

  const handleAddCriteria = () => {
    if (newCriteriaText.trim() === '') return;
    setAcceptanceCriteria([...acceptanceCriteria, newCriteriaText]);
    setNewCriteriaText('');
  };

  const handleRemoveCriteria = (index) => {
    setAcceptanceCriteria(acceptanceCriteria.filter((_, idx) => idx !== index));
  };

  const handleAddPr = () => {
    if (newPrUrl.trim() === '') return;
    setPullRequests([...pullRequests, newPrUrl]);
    setNewPrUrl('');
  };

  const handleRemovePr = (url) => {
    setPullRequests(pullRequests.filter(p => p !== url));
  };

  // Checklist handler
  const handleAddChecklist = async () => {
    if (newChecklistText.trim() === '') return;
    try {
      await api.post(`/tasks/${taskId}/checklist`, { title: newChecklistText });
      setNewChecklistText('');
      fetchTaskData();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Failed to add checklist item');
    }
  };

  const handleToggleChecklist = async (itemId) => {
    try {
      await api.put(`/tasks/${taskId}/checklist/${itemId}`);
      fetchTaskData();
    } catch (err) {
      alert('Failed to toggle checklist item');
    }
  };

  const handleRemoveChecklist = async (itemId) => {
    try {
      await api.delete(`/tasks/${taskId}/checklist/${itemId}`);
      fetchTaskData();
    } catch (err) {
      alert('Failed to delete checklist item');
    }
  };

  // Subtask handlers
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (subtaskTitle.trim() === '') return;
    try {
      const payload = {
        title: subtaskTitle,
        assignee: subtaskAssignee || null,
        estimatedHours: Number(subtaskEstimates) || 0
      };
      await api.post(`/subtasks/task/${taskId}`, payload);
      setSubtaskTitle('');
      setSubtaskAssignee('');
      setSubtaskEstimates('');
      fetchTaskData();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await api.put(`/subtasks/${subtaskId}/toggle`);
      fetchTaskData();
    } catch (err) {
      alert('Failed to toggle subtask status');
    }
  };

  // Threaded Comments handlers
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (newCommentText.trim() === '') return;
    try {
      const payload = {
        content: newCommentText,
        isInternal: commentIsInternal,
        mentions: commentMentions
      };
      await api.post(`/tasks/${taskId}/comments`, payload);
      setNewCommentText('');
      setCommentMentions([]);
      setCommentIsInternal(false);
      fetchTaskData();
    } catch (err) {
      alert('Failed to submit comment thread');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      fetchTaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleToggleAssignee = (memberId) => {
    setAssignees(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleToggleWatcher = (memberId) => {
    setWatchers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleToggleDependency = (depId) => {
    setDependencies(prev =>
      prev.includes(depId) ? prev.filter(id => id !== depId) : [...prev, depId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
      {/* Click outside backdrop handler */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Drawer Body Container */}
      <div className="w-full max-w-7xl h-full bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl relative overflow-hidden animate-slideLeft">

        {/* Drawer Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-850 flex justify-between items-center z-10">
          <div className="flex items-center space-x-3.5">
            <span className="bg-violet-950 text-violet-400 border border-violet-850 px-2.5 py-0.5 rounded font-black text-[10px] uppercase tracking-wider">
              {task?.project?.name || 'Task Workspace'}
            </span>
            <h2 className="text-sm font-extrabold text-slate-200">ClickUp Task Workspace</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-slate-950/20">
            <div className="w-10 h-10 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider animate-pulse">Retexturing Task Workspace...</span>
          </div>
        ) : (
          /* 2-Column Workspace Main Screen */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">

            {/* COLUMN 1: MAIN CONTENT (Left: 66.6% / 8 Cols) */}
            <div className="lg:col-span-8 overflow-y-auto p-6 space-y-6">

              {/* Task Title & Description Edit */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 focus:border-violet-500 outline-none mt-1 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Description Breakdown</label>
                    <button
                      onClick={handleSaveBasic}
                      className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center space-x-1"
                    >
                      <Save size={12} />
                      <span>Save Description</span>
                    </button>
                  </div>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Break down task scope details here..."
                    onTaskClick={(linkedId) => setTaskId(linkedId)}
                  />
                </div>
              </div>

              {/* Requirement specifications */}
              <div className="p-5 bg-slate-950/30 border border-slate-850 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                  <h3 className="font-bold text-xs text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                    <Sparkles size={14} className="text-violet-400" />
                    <span>Product Requirement Specs</span>
                  </h3>
                  <button
                    onClick={handleSaveRequirements}
                    className="text-[10px] font-bold bg-violet-950/60 hover:bg-violet-900 border border-violet-850 px-2 py-1 rounded-lg text-violet-300 transition-all flex items-center space-x-1"
                  >
                    <Save size={11} />
                    <span>Save Specs</span>
                  </button>
                </div>

                {/* Acceptance criteria checklist builder */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Acceptance Criteria</label>
                  <div className="space-y-1.5 mb-2.5">
                    {acceptanceCriteria.map((crit, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-lg text-xs">
                        <span className="text-slate-300 font-medium">{crit}</span>
                        <button onClick={() => handleRemoveCriteria(idx)} className="text-slate-500 hover:text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      placeholder="Add acceptance metric..."
                      value={newCriteriaText}
                      onChange={(e) => setNewCriteriaText(e.target.value)}
                      className="flex-1 bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCriteria}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Business Logic Rules</label>
                    <textarea
                      rows={3}
                      value={businessLogic}
                      onChange={(e) => setBusinessLogic(e.target.value)}
                      placeholder="E.g. Only active users can check out..."
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Testing Instructions</label>
                    <textarea
                      rows={3}
                      value={testingInstructions}
                      onChange={(e) => setTestingInstructions(e.target.value)}
                      placeholder="E.g. Verify Stripe token is authenticated..."
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Subtask Section */}
              <div className="border-t border-slate-850 pt-5 space-y-4">
                <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Subtask Breakdown</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subtasks.length === 0 ? (
                    <p className="text-[10px] text-slate-500 py-2">No subtasks assigned yet.</p>
                  ) : (
                    subtasks.map(sub => (
                      <div key={sub._id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            checked={sub.status === 'Done'}
                            onChange={() => handleToggleSubtask(sub._id)}
                            className="rounded border-slate-800 text-violet-600 focus:ring-0 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenSubtaskDetails(sub._id)}
                            className={`hover:underline text-left outline-none ${sub.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}
                          >
                            {sub.title}
                          </button>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">{sub.estimatedHours}h est</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddSubtask} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/80">
                  <input
                    type="text"
                    placeholder="Subtask name..."
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-violet-500 md:col-span-2"
                  />
                  <input
                    type="number"
                    placeholder="Hours"
                    value={subtaskEstimates}
                    onChange={(e) => setSubtaskEstimates(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    className="py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg transition-all"
                  >
                    Add Subtask
                  </button>
                </form>
              </div>

              {/* Checklist Parameters Section */}
              <div className="border-t border-slate-850 pt-5 space-y-4">
                <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Acceptance Checklists</h3>
                <div className="space-y-2">
                  {task?.checklist?.map(item => (
                    <div key={item._id} className="flex justify-between items-center p-2.5 bg-slate-950/50 border border-slate-850 rounded-lg text-xs">
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleChecklist(item._id)}
                          className="rounded border-slate-800 text-violet-600 focus:ring-0 cursor-pointer"
                        />
                        <span className={item.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}>{item.title}</span>
                      </div>
                      <button onClick={() => handleRemoveChecklist(item._id)} className="text-slate-500 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add checklist item..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      className="flex-1 bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklist}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Dev Environment section */}
              <div className="border-t border-slate-850 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <h3 className="font-bold text-xs text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                      <GitBranch size={14} className="text-indigo-400" />
                      <span>Dev Environment</span>
                    </h3>
                    <button
                      onClick={handleSaveDevTracking}
                      className="text-[9px] font-bold bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 px-2 py-0.5 rounded text-indigo-300 transition-colors"
                    >
                      Save Dev
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Git Branch Name</label>
                    <input
                      type="text"
                      placeholder="e.g. feature/auth-roles"
                      value={gitBranch}
                      onChange={(e) => setGitBranch(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">QA Approval Status</label>
                    <select
                      value={qaStatus}
                      onChange={(e) => setQaStatus(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="Pending">Pending QA</option>
                      <option value="In QA">In QA Testing</option>
                      <option value="Passed">Passed / Verified</option>
                      <option value="Failed">Failed / Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Linked Pull Requests</label>
                    <div className="space-y-1.5 mb-2.5">
                      {pullRequests.map((pr, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950/50 border border-slate-900 px-2 py-1 rounded text-[11px]">
                          <a href={pr} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate max-w-[150px] font-medium flex items-center space-x-1">
                            <GitPullRequest size={10} />
                            <span>PR #{pr.split('/').pop()}</span>
                          </a>
                          <button onClick={() => handleRemovePr(pr)} className="text-slate-500 hover:text-red-400">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        placeholder="PR Url (GitHub)..."
                        value={newPrUrl}
                        onChange={(e) => setNewPrUrl(e.target.value)}
                        className="flex-1 bg-slate-950/60 border border-slate-850 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddPr}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                </div>

                {/* File Attachments */}
                <div className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl space-y-4">
                  <h3 className="font-bold text-xs text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider border-b border-slate-850 pb-2">
                    <Paperclip size={14} className="text-violet-400" />
                    <span>Attachments ({attachments?.length})</span>
                  </h3>
                  <div className="space-y-2.5">
                    {attachments?.length === 0 ? (
                      <p className="text-[10px] text-slate-500">No mockups or documents linked.</p>
                    ) : (
                      attachments.map((file, idx) => (
                        <div key={idx} className="p-2 bg-slate-950/60 border border-slate-850 rounded-lg flex justify-between items-center text-xs">
                          <a href={file.url} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline truncate max-w-[120px]">{file.name}</a>
                          <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-400">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))
                    )}

                    <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 space-y-2">
                      <input
                        type="text"
                        placeholder="File Name (e.g. Figma Link)"
                        value={newAttachmentName}
                        onChange={(e) => setNewAttachmentName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs outline-none"
                      />
                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          placeholder="Link URL..."
                          value={newAttachmentUrl}
                          onChange={(e) => setNewAttachmentUrl(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newAttachmentName && newAttachmentUrl) {
                              setAttachments([...attachments, { name: newAttachmentName, url: newAttachmentUrl }]);
                              setNewAttachmentName('');
                              setNewAttachmentUrl('');
                            }
                          }}
                          className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMN 2: SIDEBAR METADATA & CHAT (Right: 33.3% / 4 Cols) */}
            <div className="lg:col-span-4 flex flex-col h-full bg-slate-950/20 border-l border-slate-850">

              {/* Properties Section */}
              <div className="p-4 border-b border-slate-850 space-y-4 max-h-[50%] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Properties Dashboard</h3>
                  <button
                    onClick={handleSaveBasic}
                    className="text-[9px] font-bold text-violet-400 hover:text-violet-300 flex items-center space-x-1"
                  >
                    <Save size={11} />
                    <span>Apply Properties</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-slate-200 outline-none"
                    >
                      <option value="Backlog">Backlog</option>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-slate-200 outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">Sprint Timeline</label>
                    <select
                      value={sprintId}
                      onChange={(e) => setSprintId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-slate-200 outline-none"
                    >
                      <option value="">No Active Sprint</option>
                      {task?.project?.sprints?.map(spr => (
                        <option key={spr._id} value={spr._id}>{spr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">Milestone</label>
                    <select
                      value={milestoneId}
                      onChange={(e) => setMilestoneId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-slate-200 outline-none"
                    >
                      <option value="">No Milestone</option>
                      {milestones.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">Est. Hours</label>
                    <input
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">Actual Hours</label>
                    <input
                      type="number"
                      value={actualHours}
                      onChange={(e) => setActualHours(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-slate-200 outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">Blocked By (Dependencies)</label>
                    <div className="flex flex-wrap gap-1 bg-slate-900 p-2 rounded-lg border border-slate-850 max-h-24 overflow-y-auto">
                      {projectTasks.length === 0 ? (
                        <span className="text-[9px] text-slate-600 italic">No other tasks in project</span>
                      ) : (
                        projectTasks.map(t => (
                          <button
                            key={t._id}
                            type="button"
                            onClick={() => handleToggleDependency(t._id)}
                            className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${dependencies.includes(t._id)
                              ? 'bg-red-950/80 border-red-800 text-red-400'
                              : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
                              }`}
                          >
                            {t.title}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Assignees Mutator */}
                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-1">Assignees</label>
                  <div className="flex flex-wrap gap-1 bg-slate-900 p-2 rounded-lg border border-slate-850 max-h-24 overflow-y-auto">
                    {teamMembers.map(member => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => handleToggleAssignee(member._id)}
                        className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${assignees.includes(member._id)
                          ? 'bg-violet-950 border-violet-800 text-violet-400'
                          : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Watchers Mutator */}
                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-1">Ticket Watchers</label>
                  <div className="flex flex-wrap gap-1 bg-slate-900 p-2 rounded-lg border border-slate-850 max-h-24 overflow-y-auto">
                    {teamMembers.map(member => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => handleToggleWatcher(member._id)}
                        className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${watchers.includes(member._id)
                          ? 'bg-indigo-950 border-indigo-800 text-indigo-400'
                          : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Threaded Discussion Streams */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-950/20">
                <div className="px-4 py-3 border-b border-slate-850 bg-slate-950/30 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setActiveSection('comments')}
                      className={`font-black text-[10px] uppercase tracking-wider pb-1 transition-colors ${activeSection === 'comments' ? 'text-violet-400 border-b border-violet-500' : 'text-slate-500 hover:text-slate-355'
                        }`}
                    >
                      Comments ({comments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('history')}
                      className={`font-black text-[10px] uppercase tracking-wider pb-1 transition-colors ${activeSection === 'history' ? 'text-violet-400 border-b border-violet-500' : 'text-slate-500 hover:text-slate-355'
                        }`}
                    >
                      History Log ({activities.length})
                    </button>
                  </div>
                  {activeSection === 'comments' && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCommentIsInternal(!commentIsInternal)}
                        className={`p-1 rounded text-[9px] font-bold uppercase transition-colors flex items-center space-x-0.5 ${commentIsInternal ? 'bg-amber-950/80 text-amber-400 border border-amber-800' : 'bg-slate-900 text-slate-500'
                          }`}
                        title="Toggle Internal Only comment"
                      >
                        <Lock size={10} />
                        <span>{commentIsInternal ? 'Internal' : 'Public'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {activeSection === 'comments' ? (
                  <>
                    {/* Comment streams scroll container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                      {comments.length === 0 ? (
                        <p className="text-center text-[10px] text-slate-500 py-10">No discussion notes logged.</p>
                      ) : (
                        comments.map(c => (
                          <div
                            key={c._id}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 relative group ${c.isInternal
                              ? 'bg-amber-950/15 border-amber-950/40'
                              : 'bg-slate-900/60 border-slate-850/80'
                              }`}
                          >
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-black text-slate-300 flex items-center space-x-1">
                                <span>{c.author?.name}</span>
                                {c.isInternal && (
                                  <span className="text-[8px] bg-amber-950 text-amber-400 px-1 rounded flex items-center space-x-0.5">
                                    <Lock size={7} />
                                    <span>Internal</span>
                                  </span>
                                )}
                              </span>
                              <span className="text-slate-500 font-semibold">{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <p className="text-slate-300 font-medium leading-relaxed">{c.content}</p>

                            {/* Mention list tags if any */}
                            {c.mentions?.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {c.mentions.map(men => (
                                  <span key={men._id} className="text-[8px] font-bold bg-violet-950/40 text-violet-400 px-1 py-0.2 rounded">
                                    @{men.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => handleDeleteComment(c._id)}
                              className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Mentions dropdown in comment field */}
                    {commentMentions.length > 0 && (
                      <div className="px-4 py-1.5 bg-slate-900/80 border-t border-slate-850 flex flex-wrap gap-1 text-[9px]">
                        <span className="text-slate-500 font-bold">Mentions:</span>
                        {commentMentions.map(mId => (
                          <span key={mId} className="bg-violet-950 text-violet-400 px-1 rounded font-bold">
                            @{teamMembers.find(t => t._id === mId)?.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Comment composer form */}
                    <form onSubmit={handlePostComment} className="p-3 border-t border-slate-850 bg-slate-950/50 space-y-2">
                      <input
                        type="text"
                        placeholder="Write a message to your team..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                      />
                      <div className="flex justify-between items-center">
                        {/* Mentions Picker trigger */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-slate-500 font-bold">Mention:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value && !commentMentions.includes(e.target.value)) {
                                setCommentMentions([...commentMentions, e.target.value]);
                              }
                              e.target.value = '';
                            }}
                            className="bg-slate-900 border border-slate-850 text-slate-400 rounded px-1.5 py-0.5 text-[10px] outline-none"
                          >
                            <option value="">Choose User</option>
                            {teamMembers.map(member => (
                              <option key={member._id} value={member._id}>{member.name}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold rounded-lg text-xs transition-all shadow-md"
                        >
                          Post Note
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activities.length === 0 ? (
                      <p className="text-center text-[10px] text-slate-500 py-10">No history logged on this task.</p>
                    ) : (
                      activities.map(act => (
                        <div key={act._id} className="flex items-start space-x-2.5 text-xs text-slate-300 p-2.5 bg-slate-900/40 border border-slate-850/60 rounded-xl leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-violet-950 text-violet-400 flex items-center justify-center text-[8px] font-black uppercase flex-shrink-0">
                            {act.user?.name ? act.user.name[0] : 'S'}
                          </span>
                          <div className="flex-1 space-y-0.5">
                            <p className="font-semibold text-slate-200">
                              <span className="font-black text-slate-350">{act.user?.name || 'System'}</span> &nbsp;
                              <span className="text-[8px] text-violet-400 bg-violet-950/40 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{act.action}</span>
                            </p>
                            {act.details?.fieldName && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                Changed <span className="font-bold text-slate-300">{act.details.fieldName}</span> from &nbsp;
                                <span className="text-red-400 line-through">{String(act.details.oldValue || 'none')}</span> to &nbsp;
                                <span className="text-emerald-400">{String(act.details.newValue || 'none')}</span>
                              </p>
                            )}
                            <p className="text-[9px] text-slate-600 font-semibold">{new Date(act.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Subtask Details Drawer Overlay */}
      <SubtaskDetailsDrawer
        subtaskId={selectedSubtaskId}
        isOpen={subtaskDrawerOpen}
        onClose={() => { setSubtaskDrawerOpen(false); setSelectedSubtaskId(null); }}
        teamMembers={teamMembers}
        onSubtaskUpdated={fetchTaskData}
        onTaskClick={(linkedId) => {
          setSubtaskDrawerOpen(false);
          setSelectedSubtaskId(null);
          setTaskId(linkedId);
        }}
      />
    </div>
  );
}
