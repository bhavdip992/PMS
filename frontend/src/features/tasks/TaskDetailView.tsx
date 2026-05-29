import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
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
  ChevronLeft,
  Eye,
  AlertCircle,
  Tag,
  CalendarDays,
  UserCheck,
  Download,
  FileText,
  Video,
  Phone,
  Mail,
  Calendar,
  Layers,
  Activity,
  History,
  FileUp,
  FolderOpen
} from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor.tsx';
import BreadcrumbNav from './components/BreadcrumbNav.tsx';
import AcceptanceCriteria from './components/AcceptanceCriteria.tsx';
import QAChecklist from './components/QAChecklist.tsx';
import ActivityTimeline from './components/ActivityTimeline.tsx';
import TaskDependencyGraph from './components/TaskDependencyGraph.tsx';
import FileUploadZone from '../files/FileUploadZone.tsx';
import FilePreviewModal from '../files/FilePreviewModal.tsx';
import FileVersionHistory from '../files/FileVersionHistory.tsx';

export default function TaskDetailView() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  // Core Entity States
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab State: 'details' | 'subtasks' | 'comments' | 'files' | 'activity' | 'time-logs' | 'communication'
  const [activeTab, setActiveTab] = useState('details');

  // Edit fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [watchers, setWatchers] = useState([]);
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Requirements fields
  const [businessLogic, setBusinessLogic] = useState('');
  const [testingInstructions, setTestingInstructions] = useState('');
  const [deploymentNotes, setDeploymentNotes] = useState('');
  const [requirementNotes, setRequirementNotes] = useState('');
  const [richDescription, setRichDescription] = useState('');

  // Development fields
  const [gitBranch, setGitBranch] = useState('');
  const [newPrUrl, setNewPrUrl] = useState('');
  const [pullRequests, setPullRequests] = useState([]);
  const [qaStatus, setQaStatus] = useState('Pending');

  // Subtask creation fields
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskAssignee, setSubtaskAssignee] = useState('');
  const [subtaskEstimates, setSubtaskEstimates] = useState('');

  // Comment composer fields
  const [newCommentText, setNewCommentText] = useState('');
  const [commentIsInternal, setCommentIsInternal] = useState(false);
  const [commentMentions, setCommentMentions] = useState([]);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);

  // Attachments state
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentType, setNewAttachmentType] = useState('link');

  // Phase 5 file preview & versions states
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [versionHistoryAttachmentId, setVersionHistoryAttachmentId] = useState<string | null>(null);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);

  // AI Spec Generator States
  const [generatingSpecs, setGeneratingSpecs] = useState(false);
  const [devRequestType, setDevRequestType] = useState<'explain' | 'refactor' | 'breakdown'>('explain');
  const [devUserInstruction, setDevUserInstruction] = useState('');
  const [devAssistantResponse, setDevAssistantResponse] = useState<any>(null);
  const [generatingDevAssistant, setGeneratingDevAssistant] = useState(false);

  // Milestone list & Dependency Management
  const [milestones, setMilestones] = useState([]);
  const [milestoneId, setMilestoneId] = useState('');
  const [projectTasks, setProjectTasks] = useState([]);
  const [dependencies, setDependencies] = useState<any[]>([]);

  // Time logging feature states
  const [timeLogs, setTimeLogs] = useState([]);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [timerDurationText, setTimerDurationText] = useState('00:00:00');
  const [timerDesc, setTimerDesc] = useState('');
  const [timerBillable, setTimerBillable] = useState(true);
  
  // Manual log fields
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualBillable, setManualBillable] = useState(true);

  // Communication logs states
  const [communications, setCommunications] = useState([]);
  const [commTitle, setCommTitle] = useState('');
  const [commType, setCommType] = useState('Email');
  const [commDetails, setCommDetails] = useState('');
  const [commDate, setCommDate] = useState('');
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

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
    if (taskId) {
      fetchTaskData();
      fetchSecondaryData();
      fetchTimeLogs();
      fetchActiveTimer();
      fetchCommunications();
    }
  }, [taskId]);

  // Handle active timer interval tick
  useEffect(() => {
    let intervalId: any;
    if (activeTimer) {
      const updateTimerText = () => {
        const start = new Date(activeTimer.startTime).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        const pad = (num) => String(num).padStart(2, '0');
        setTimerDurationText(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      };
      
      updateTimerText();
      intervalId = setInterval(updateTimerText, 1000);
    } else {
      setTimerDurationText('00:00:00');
    }
    return () => clearInterval(intervalId);
  }, [activeTimer]);

  const fetchSecondaryData = async () => {
    try {
      const [usersRes, projRes, tagsRes] = await Promise.all([
        api.get('/users'),
        api.get('/projects'),
        api.get('/tags')
      ]);
      setProjects(projRes.data.data.projects || []);
      setTeamMembers(usersRes.data.data.users || []);
      setAvailableTags(tagsRes.data.data.tags || []);
    } catch (err) {
      console.error('Failed to load secondary details', err);
    }
  };

  const fetchTaskData = async () => {
    setLoading(true);
    setError(null);
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
      setStartDate(t.startDate ? t.startDate.split('T')[0] : '');
      setEstimatedHours(t.estimatedHours || '');
      setActualHours(t.actualHours || '');
      setSprintId(t.sprintId || '');
      setAssignees(t.assignees?.map(a => a._id) || []);
      setWatchers(t.watchers?.map(w => w._id) || []);
      setMilestoneId(t.milestone?._id || t.milestone || '');
      setDependencies(t.dependencies || []);
      setTags(t.tags || []);
      setDeploymentNotes(t.deploymentNotes || '');
      setRequirementNotes(t.requirementNotes || '');
      setRichDescription(t.richDescription || '');

      // Load task attachments
      try {
        const attRes = await api.get(`/attachments/task/${taskId}`);
        setTaskAttachments(attRes.data.data.attachments || []);
      } catch (_) { /* non-critical */ }

      // Populate Requirements
      setBusinessLogic(t.requirements?.businessLogic || '');
      setTestingInstructions(t.requirements?.testingInstructions || '');

      // Populate Dev Tracking
      setGitBranch(t.devTracking?.gitBranch || '');
      setPullRequests(t.devTracking?.pullRequests?.map(pr => pr.prUrl || pr) || []);
      setQaStatus(t.devTracking?.qaStatus || 'Pending');

      const pId = t.project?._id || t.project;
      if (pId) {
        fetchMilestones(pId);
        fetchProjectTasks(pId);
      }

    } catch (err) {
      console.error('Failed to load task details in view', err);
      setError(err.response?.data?.message || 'Access denied or failed to load task details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeLogs = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}/time-logs`);
      setTimeLogs(res.data.data.timeLogs || []);
    } catch (err) {
      console.error('Failed to load time logs', err);
    }
  };

  const fetchActiveTimer = async () => {
    try {
      const res = await api.get('/time-logs/active');
      const timer = res.data.data.activeTimer;
      if (timer && (timer.task === taskId || timer.task?._id === taskId)) {
        setActiveTimer(timer);
      } else {
        setActiveTimer(null);
      }
    } catch (_) {}
  };

  const fetchCommunications = async () => {
    try {
      const res = await api.get(`/communications?task=${taskId}`);
      setCommunications(res.data.data.communications || []);
    } catch (err) {
      console.error('Failed to load communications', err);
    }
  };

  // Timer Handlers
  const handleStartTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/time-logs/start', {
        taskId,
        description: timerDesc || 'Working on task',
        isBillable: timerBillable
      });
      setTimerDesc('');
      fetchActiveTimer();
      fetchTimeLogs();
    } catch (err) {
      alert('Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await api.post('/time-logs/stop');
      setActiveTimer(null);
      fetchActiveTimer();
      fetchTimeLogs();
      fetchTaskData(); // Recalculates hours
    } catch (err) {
      alert('Failed to stop timer');
    }
  };

  const handleManualTimeLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStart || !manualEnd) return;
    try {
      await api.post('/time-logs', {
        taskId,
        startTime: new Date(manualStart).toISOString(),
        endTime: new Date(manualEnd).toISOString(),
        description: manualDesc || 'Manual entry logs',
        isBillable: manualBillable
      });
      setManualStart('');
      setManualEnd('');
      setManualDesc('');
      fetchTimeLogs();
      fetchTaskData(); // Recalculates hours
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to manually log time');
    }
  };

  const handleDeleteTimeLog = async (id: string) => {
    if (!window.confirm('Delete this time log?')) return;
    try {
      await api.delete(`/time-logs/${id}`);
      fetchTimeLogs();
      fetchTaskData();
    } catch (err) {
      alert('Failed to delete time log');
    }
  };

  // Communication Handlers
  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTitle || !commDetails) return;
    try {
      await api.post('/communications', {
        task: taskId,
        project: task?.project?._id || task?.project,
        title: commTitle,
        type: commType,
        details: commDetails,
        date: commDate ? new Date(commDate).toISOString() : new Date().toISOString()
      });
      setCommTitle('');
      setCommDetails('');
      setCommDate('');
      fetchCommunications();
    } catch (err) {
      alert('Failed to log communication');
    }
  };

  const handleSummarizeComm = async (commId: string, details: string) => {
    setSummarizingId(commId);
    try {
      const res = await api.post('/ai/summarize', { text: details });
      setAiSummaries(prev => ({
        ...prev,
        [commId]: res.data.data.summary
      }));
    } catch (err) {
      alert('Failed to summarize communication details');
    } finally {
      setSummarizingId(null);
    }
  };

  const handleDeleteComm = async (commId: string) => {
    if (!window.confirm('Delete this communication record?')) return;
    try {
      await api.delete(`/communications/${commId}`);
      fetchCommunications();
    } catch (err) {
      alert('Failed to delete communication record');
    }
  };

  // Save changes
  const handleSaveBasic = async () => {
    try {
      const updated = {
        title,
        description,
        status,
        priority,
        dueDate: dueDate || null,
        startDate: startDate || null,
        estimatedHours: Number(estimatedHours) || 0,
        actualHours: Number(actualHours) || 0,
        sprintId: sprintId || null,
        assignees,
        watchers,
        milestone: milestoneId || null,
        tags,
        deploymentNotes,
        requirementNotes,
        richDescription
      };
      await api.put(`/tasks/${taskId}`, updated);
      fetchTaskData();
      alert('Properties saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task properties');
    }
  };

  // Requirement metrics modifiers
  const handleSaveRequirements = async () => {
    try {
      const payload = {
        requirements: {
          acceptanceCriteria: task?.requirements?.acceptanceCriteria || [],
          businessLogic,
          testingInstructions
        },
        requirementNotes
      };
      await api.put(`/tasks/${taskId}`, payload);
      fetchTaskData();
      alert('Specifications saved successfully!');
    } catch (err) {
      alert('Failed to update specifications');
    }
  };

  const handleAddCriteria = async (text: string) => {
    try {
      const current = task?.requirements?.acceptanceCriteria || [];
      const payload = {
        requirements: {
          ...task?.requirements,
          acceptanceCriteria: [...current, text]
        }
      };
      await api.put(`/tasks/${taskId}`, payload);
      fetchTaskData();
    } catch (_) {
      alert('Failed to add acceptance criteria');
    }
  };

  const handleRemoveCriteria = async (idx: number) => {
    try {
      const current = task?.requirements?.acceptanceCriteria || [];
      const payload = {
        requirements: {
          ...task?.requirements,
          acceptanceCriteria: current.filter((_, i) => i !== idx)
        }
      };
      await api.put(`/tasks/${taskId}`, payload);
      fetchTaskData();
    } catch (_) {
      alert('Failed to remove acceptance criteria');
    }
  };

  const handleAIGenerateSpecs = async () => {
    setGeneratingSpecs(true);
    try {
      const res = await api.post('/ai/task-summary', { taskId });
      const data = res.data.data.summary;
      if (data) {
        if (data.acceptanceCriteria && Array.isArray(data.acceptanceCriteria)) {
          const current = task?.requirements?.acceptanceCriteria || [];
          const payload = {
            requirements: {
              ...task?.requirements,
              acceptanceCriteria: Array.from(new Set([...current, ...data.acceptanceCriteria]))
            }
          };
          await api.put(`/tasks/${taskId}`, payload);
        }
        if (data.technicalExplanation) {
          setBusinessLogic(prev => prev ? prev + '\n\n' + data.technicalExplanation : data.technicalExplanation);
        }
        if (data.edgeCases && Array.isArray(data.edgeCases)) {
          setTestingInstructions(prev => {
            const edgeStr = 'AI Edge Cases:\n' + data.edgeCases.map((e: string) => `- ${e}`).join('\n');
            return prev ? prev + '\n\n' + edgeStr : edgeStr;
          });
        }
        fetchTaskData();
        alert('Specs generated successfully by Gemini AI!');
      }
    } catch (err) {
      alert('Failed to generate specs with AI.');
    } finally {
      setGeneratingSpecs(false);
    }
  };

  // QA Checklist Handlers
  const handleToggleQaItem = async (itemId: string) => {
    try {
      const current = task?.qaChecklist || [];
      const updated = current.map(item => {
        if (item._id === itemId) {
          return { ...item, isCompleted: !item.isCompleted };
        }
        return item;
      });
      await api.put(`/tasks/${taskId}`, { qaChecklist: updated });
      fetchTaskData();
    } catch (_) {
      alert('Failed to toggle QA Checklist item');
    }
  };

  const handleAddQaItem = async (text: string) => {
    try {
      const current = task?.qaChecklist || [];
      const updated = [...current, { item: text, isCompleted: false }];
      await api.put(`/tasks/${taskId}`, { qaChecklist: updated });
      fetchTaskData();
    } catch (_) {
      alert('Failed to add QA Checklist item');
    }
  };

  const handleRemoveQaItem = async (itemId: string) => {
    try {
      const current = task?.qaChecklist || [];
      const updated = current.filter(item => item._id !== itemId);
      await api.put(`/tasks/${taskId}`, { qaChecklist: updated });
      fetchTaskData();
    } catch (_) {
      alert('Failed to remove QA Checklist item');
    }
  };

  // Dependency Graph Handlers
  const handleAddDependency = async (depId: string) => {
    try {
      await api.post(`/tasks/${taskId}/dependencies`, { dependencyId: depId });
      fetchTaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add dependency');
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      const filtered = dependencies.filter(d => d._id !== depId).map(d => d._id);
      await api.put(`/tasks/${taskId}`, { dependencies: filtered });
      fetchTaskData();
    } catch (err) {
      alert('Failed to remove dependency');
    }
  };

  // Attachment helpers
  const fetchAttachments = async () => {
    try {
      const res = await api.get(`/attachments/task/${taskId}`);
      setTaskAttachments(res.data.data.attachments || []);
    } catch (_) { }
  };

  const handleAddAttachment = async () => {
    if (!newAttachmentUrl.trim()) return;
    const name = newAttachmentName.trim() || newAttachmentUrl.trim().split('/').pop();
    const ext = newAttachmentUrl.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const fileType = imageExts.includes(ext || '') ? 'image' : (ext === 'pdf' ? 'pdf' : newAttachmentType);
    try {
      await api.post('/attachments', {
        name,
        fileUrl: newAttachmentUrl.trim(),
        fileType,
        task: taskId,
        project: task?.project?._id || task?.project,
      });
      setNewAttachmentName('');
      setNewAttachmentUrl('');
      fetchAttachments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add attachment');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Remove this attachment?')) return;
    try {
      await api.delete(`/attachments/${attachmentId}`);
      fetchAttachments();
    } catch (err) {
      alert('Failed to delete attachment');
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
      await api.post(`/tasks/${taskId}/subtasks`, payload);
      setSubtaskTitle('');
      setSubtaskAssignee('');
      setSubtaskEstimates('');
      fetchTaskData();
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

  // Comment Handlers
  const handleCommentTextChange = (text: string) => {
    setNewCommentText(text);
    const lastAtOffset = text.lastIndexOf('@');
    if (lastAtOffset !== -1 && lastAtOffset >= text.lastIndexOf(' ')) {
      const searchStr = text.substring(lastAtOffset + 1);
      setMentionSearch(searchStr);
      setShowMentionDropdown(true);
    } else {
      setMentionSearch(null);
      setShowMentionDropdown(false);
    }
  };

  const handleSelectMention = (member: any) => {
    const lastAtOffset = newCommentText.lastIndexOf('@');
    if (lastAtOffset === -1) return;

    const baseText = newCommentText.substring(0, lastAtOffset);
    if (member === 'all') {
      const allIds = teamMembers.map(m => m._id);
      setCommentMentions(prev => Array.from(new Set([...prev, ...allIds])));
      setNewCommentText(baseText + '@all ');
    } else {
      if (!commentMentions.includes(member._id)) {
        setCommentMentions(prev => [...prev, member._id]);
      }
      setNewCommentText(baseText + `@${member.name.replace(/\s+/g, '')} `);
    }
    setMentionSearch(null);
    setShowMentionDropdown(false);
  };

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
      alert('Failed to submit comment');
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

  // Dev assistant AI
  const handleAIDevAssistant = async () => {
    if (!devUserInstruction.trim()) return;
    setGeneratingDevAssistant(true);
    setDevAssistantResponse(null);
    try {
      const res = await api.post('/ai/dev-assistant', {
        requestType: devRequestType,
        codeContext: `Task Title: ${title}\nDescription: ${description}`,
        userInstruction: devUserInstruction
      });
      setDevAssistantResponse(res.data.data.response);
    } catch (err) {
      alert('Failed to get response from Dev Assistant.');
    } finally {
      setGeneratingDevAssistant(false);
    }
  };

  const handleSaveDevTracking = async () => {
    try {
      const payload = {
        devTracking: {
          gitBranch,
          pullRequests: pullRequests.map(pr => ({ prUrl: pr, prTitle: pr.split('/').pop() })),
          qaStatus
        },
        deploymentNotes
      };
      await api.put(`/tasks/${taskId}`, payload);
      fetchTaskData();
      alert('Dev tracking saved successfully!');
    } catch (err) {
      alert('Failed to update dev tracking metrics');
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

  const handleBackToBoard = () => {
    navigate('/tasks');
  };

  return (
    <div className="space-y-6">
      {/* View Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBackToBoard}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700/50 shadow-inner"
            aria-label="Back to tasks board"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
          
          <div className="h-5 w-[1px] bg-slate-800" />
          
          <BreadcrumbNav
            project={task?.project}
            task={{ _id: taskId || '', title: task?.title || '' }}
          />
        </div>

        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1">
          <Layers size={14} className="text-violet-500" />
          <span>Ticket Space</span>
        </h2>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider animate-pulse">Syncing Workspace...</span>
        </div>
      ) : error ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center px-4">
          <div className="w-14 h-14 rounded-full bg-rose-950/40 flex items-center justify-center text-rose-500 border border-rose-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-sm font-black text-rose-400 tracking-wide uppercase">Permission Refused</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition-all"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMN 1: TABS & LEFT CONTENT PANEL (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs Bar */}
            <div className="flex flex-wrap gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 shadow-md">
              {[
                { id: 'details', label: 'Details', icon: <FileText size={13} /> },
                { id: 'subtasks', label: 'Subtasks', icon: <Layers size={13} /> },
                { id: 'comments', label: 'Comments', icon: <MessageSquare size={13} /> },
                { id: 'files', label: 'Files', icon: <Paperclip size={13} /> },
                { id: 'activity', label: 'Activity', icon: <History size={13} /> },
                { id: 'time-logs', label: 'Time Log', icon: <Clock size={13} /> },
                { id: 'communication', label: 'Communication', icon: <Globe size={13} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTAINER CONTENT */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6 min-h-[400px]">
              
              {/* 1. DETAILS TAB */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Title & Description */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Task Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 focus:border-violet-500 outline-none mt-1.5 transition-colors"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Scope Description</label>
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
                        placeholder="Define scope requirements..."
                        onTaskClick={(linkedId) => navigate('/tasks/' + linkedId)}
                      />
                    </div>
                  </div>

                  {/* Requirements Specs */}
                  <div className="border-t border-slate-850 pt-5 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-850/60">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                        <Sparkles size={14} className="text-violet-400" />
                        <span>Specifications & Guidelines</span>
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleAIGenerateSpecs}
                          disabled={generatingSpecs}
                          className="text-[10px] font-bold bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 px-2.5 py-1 rounded-lg text-white transition-all flex items-center space-x-1"
                        >
                          <Sparkles size={11} className={generatingSpecs ? 'animate-spin' : ''} />
                          <span>{generatingSpecs ? 'Generating...' : 'AI Spec Autofill'}</span>
                        </button>
                        <button
                          onClick={handleSaveRequirements}
                          className="text-[10px] font-bold bg-violet-950/60 hover:bg-violet-900 border border-violet-850 px-2.5 py-1 rounded-lg text-violet-300 transition-all flex items-center space-x-1"
                        >
                          <Save size={11} />
                          <span>Save Specs</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Requirement Notes</label>
                        <textarea
                          rows={3}
                          value={requirementNotes}
                          onChange={(e) => setRequirementNotes(e.target.value)}
                          placeholder="General requirements context or business demands..."
                          className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Business Logic & Rules</label>
                        <textarea
                          rows={3}
                          value={businessLogic}
                          onChange={(e) => setBusinessLogic(e.target.value)}
                          placeholder="E.g. Only active users can check out..."
                          className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Technical Guidelines</label>
                        <textarea
                          rows={3}
                          value={testingInstructions}
                          onChange={(e) => setTestingInstructions(e.target.value)}
                          placeholder="E.g. Ensure we mock the Stripe API endpoints..."
                          className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Deployment Instructions</label>
                        <textarea
                          rows={3}
                          value={deploymentNotes}
                          onChange={(e) => setDeploymentNotes(e.target.value)}
                          placeholder="E.g. Set system variables for prod database before deployment..."
                          className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* Acceptance Criteria component */}
                    <AcceptanceCriteria
                      criteria={task?.requirements?.acceptanceCriteria || []}
                      onAdd={handleAddCriteria}
                      onRemove={handleRemoveCriteria}
                    />

                    {/* QA Checklist */}
                    <QAChecklist
                      items={task?.qaChecklist || []}
                      onToggle={handleToggleQaItem}
                      onAdd={handleAddQaItem}
                      onRemove={handleRemoveQaItem}
                    />
                  </div>

                  {/* Dev tracking environment */}
                  <div className="border-t border-slate-850 pt-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-850/60 pb-2">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                        <GitBranch size={14} className="text-indigo-400" />
                        <span>Development Integration</span>
                      </h4>
                      <button
                        onClick={handleSaveDevTracking}
                        className="text-[10px] font-bold bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-850 px-2.5 py-1 rounded-lg text-indigo-300 transition-all flex items-center space-x-1"
                      >
                        <Save size={11} />
                        <span>Save Dev tracking</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Branch Name</label>
                        <input
                          type="text"
                          value={gitBranch}
                          onChange={(e) => setGitBranch(e.target.value)}
                          placeholder="feature/payment-methods"
                          className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">QA Verification</label>
                        <select
                          value={qaStatus}
                          onChange={(e) => setQaStatus(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        >
                          <option value="Pending">Pending Validation</option>
                          <option value="In QA">Under Testing</option>
                          <option value="Passed">Verified & Passed</option>
                          <option value="Failed">Failed (Issues Found)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Associated Pull Requests</label>
                      <div className="space-y-1.5 mb-2">
                        {pullRequests.map((pr, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-950/50 border border-slate-900 px-3 py-2 rounded-xl text-xs">
                            <a href={pr} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate max-w-[300px] flex items-center space-x-1.5">
                              <GitPullRequest size={12} />
                              <span>PR Link #{pr.split('/').pop()}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setPullRequests(prev => prev.filter(p => p !== pr))}
                              className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-900 rounded-lg"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="GitHub Pull Request URL..."
                          value={newPrUrl}
                          onChange={(e) => setNewPrUrl(e.target.value)}
                          className="flex-1 bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newPrUrl.trim()) return;
                            setPullRequests([...pullRequests, newPrUrl.trim()]);
                            setNewPrUrl('');
                          }}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-750"
                        >
                          Link
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Task Dependency Graph Section */}
                  <TaskDependencyGraph
                    dependencies={dependencies}
                    availableTasks={projectTasks}
                    onAddDependency={handleAddDependency}
                    onRemoveDependency={handleRemoveDependency}
                  />
                </div>
              )}

              {/* 2. SUBTASKS TAB */}
              {activeTab === 'subtasks' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Subtask Breakdown</h3>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">
                      {subtasks.filter(s => s.status === 'Done').length} of {subtasks.length} Completed
                    </span>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {subtasks.length === 0 ? (
                      <div className="text-center py-8 bg-slate-955/10 rounded-2xl border border-slate-900 text-slate-500 italic text-xs">
                        No subtasks assigned yet. Add some items below.
                      </div>
                    ) : (
                      subtasks.map(sub => (
                        <div key={sub._id} className="p-3.5 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-850/80 hover:border-slate-800 rounded-2xl flex justify-between items-center text-xs transition-all">
                          <div className="flex items-center space-x-3.5">
                            <input
                              type="checkbox"
                              checked={sub.status === 'Done'}
                              onChange={() => handleToggleSubtask(sub._id)}
                              className="rounded border-slate-800 text-violet-600 focus:ring-0 cursor-pointer"
                            />
                            <Link
                              to={`/tasks/${taskId}/subtasks/${sub._id}`}
                              className={`hover:underline hover:text-violet-400 font-bold text-left outline-none ${sub.status === 'Done' ? 'line-through text-slate-550' : 'text-slate-250'}`}
                            >
                              {sub.title}
                            </Link>
                          </div>
                          <div className="flex items-center space-x-3">
                            {sub.assignee && (
                              <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full font-bold">
                                @{sub.assignee.name || teamMembers.find(m => m._id === sub.assignee)?.name}
                              </span>
                            )}
                            <span className="text-[9px] font-black text-slate-500 bg-slate-900 border border-slate-850/50 px-2.5 py-0.5 rounded-lg">
                              {sub.estimatedHours}h est
                            </span>
                            <Link
                              to={`/tasks/${taskId}/subtasks/${sub._id}`}
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                            >
                              Details &rarr;
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddSubtask} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-850/80">
                    <input
                      type="text"
                      placeholder="Subtask item name..."
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 md:col-span-2"
                      required
                    />
                    <select
                      value={subtaskAssignee}
                      onChange={(e) => setSubtaskAssignee(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-300 outline-none"
                    >
                      <option value="">Assignee...</option>
                      {teamMembers.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Hrs est"
                        value={subtaskEstimates}
                        onChange={(e) => setSubtaskEstimates(e.target.value)}
                        className="w-20 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                      />
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 3. COMMENTS TAB */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <MessageSquare size={14} className="text-violet-400" />
                      <span>Comments Thread ({comments.length})</span>
                    </h3>
                    <button
                      onClick={() => setCommentIsInternal(!commentIsInternal)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 ${commentIsInternal ? 'bg-amber-950/80 text-amber-400 border border-amber-805' : 'bg-slate-950 text-slate-500 border border-transparent'}`}
                    >
                      <Lock size={11} />
                      <span>{commentIsInternal ? 'Internal Note' : 'Public Note'}</span>
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3.5 pr-1">
                    {comments.length === 0 ? (
                      <p className="text-center text-xs text-slate-550 py-12 italic">No notes logged. Start discussions below.</p>
                    ) : (
                      comments.map(c => (
                        <div
                          key={c._id}
                          className={`p-4 rounded-2xl border text-xs space-y-2 relative group transition-colors ${c.isInternal
                            ? 'bg-amber-950/10 border-amber-950/30'
                            : 'bg-slate-950/40 border-slate-850/60'
                            }`}
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-450">
                            <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                              <span>{c.author?.name}</span>
                              {c.isInternal && (
                                <span className="text-[8px] bg-amber-950 text-amber-400 px-1.5 py-0.2 rounded font-black uppercase flex items-center space-x-0.5">
                                  <Lock size={8} />
                                  <span>Internal</span>
                                </span>
                              )}
                            </span>
                            <span className="font-semibold text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-medium">{c.content}</p>

                          {c.mentions?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {c.mentions.map(men => (
                                <span key={men._id} className="text-[8px] font-extrabold bg-violet-950/50 text-violet-400 px-1.5 py-0.5 rounded">
                                  @{men.name}
                                </span>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="absolute top-3 right-3 text-slate-650 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            aria-label="Delete comment"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Autocomplete mention dropdown */}
                  {showMentionDropdown && (
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden max-h-36 overflow-y-auto divide-y divide-slate-855">
                      <button
                        type="button"
                        onClick={() => handleSelectMention('all')}
                        className="w-full px-4.5 py-2.5 text-left text-xs font-bold text-violet-400 hover:bg-slate-900 transition-colors flex items-center justify-between"
                      >
                        <span>📢 Mention Everyone (@all)</span>
                      </button>
                      {teamMembers
                        .filter(m => !mentionSearch || m.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                        .map(member => (
                          <button
                            type="button"
                            key={member._id}
                            onClick={() => handleSelectMention(member)}
                            className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-900 transition-colors flex items-center space-x-2"
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">
                              {member.name[0]}
                            </span>
                            <span className="font-bold text-slate-200">{member.name}</span>
                          </button>
                        ))}
                    </div>
                  )}

                  <form onSubmit={handlePostComment} className="p-4 border border-slate-850 bg-slate-950/40 rounded-2xl space-y-2">
                    <input
                      type="text"
                      placeholder="Discuss progress here... Use @ to tag colleagues"
                      value={newCommentText}
                      onChange={(e) => handleCommentTextChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                      required
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">Mentions logged: {commentMentions.length}</span>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                      >
                        Submit note
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 4. FILES TAB */}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <Paperclip size={14} className="text-violet-400" />
                      <span>Workspace Attachments ({taskAttachments.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                    {taskAttachments.length === 0 ? (
                      <div className="sm:col-span-2 text-center py-10 bg-slate-950/10 rounded-2xl border border-slate-900 text-slate-500 italic text-xs">
                        No attachments linked yet. Drag/drop or link assets below.
                      </div>
                    ) : (
                      taskAttachments.map(att => {
                        const isImage = ['image', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(att.fileType || '');
                        return (
                          <div
                            key={att._id}
                            className="flex items-center gap-3 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-850 hover:border-slate-800 rounded-2xl p-3.5 transition-all group cursor-pointer"
                            onClick={() => {
                              setPreviewAttachmentId(att._id);
                              setShowPreviewModal(true);
                            }}
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {isImage ? (
                                <img src={att.fileUrl} alt={att.name} className="w-full h-full object-cover animate-fadeIn" />
                              ) : (
                                <FileText size={16} className="text-indigo-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-slate-200 hover:text-violet-400 truncate block">
                                {att.name}
                              </span>
                              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <span>v{att.version || 1}</span>
                                <span>·</span>
                                <span className="truncate max-w-[80px]">By {att.uploadedBy?.name || 'User'}</span>
                                <span>·</span>
                                <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                              </p>
                            </div>
                            <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setVersionHistoryAttachmentId(att._id);
                                  setShowVersionHistoryModal(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-violet-400 transition-colors"
                                title="View Versions"
                              >
                                <GitBranch size={13} />
                              </button>
                              <a href={att.fileUrl} download target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-violet-400 transition-colors">
                                <Download size={13} />
                              </a>
                              <button onClick={() => handleDeleteAttachment(att._id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Link form */}
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/80 space-y-3 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Link File / URL Asset</h4>
                        <p className="text-[10px] text-slate-550 mb-3">Reference external assets like Figma prototypes, Miro boards, or Google Docs.</p>
                      </div>
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={newAttachmentName}
                          onChange={e => setNewAttachmentName(e.target.value)}
                          placeholder="Document display title (e.g., Figma board)"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-violet-500"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={newAttachmentUrl}
                            onChange={e => setNewAttachmentUrl(e.target.value)}
                            placeholder="https://example.com/asset..."
                            className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-violet-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddAttachment}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                          >
                            Attach
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Drag-drop zone */}
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/80 space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Drag & Drop Upload Assets</h4>
                      <FileUploadZone
                        project={task?.project?._id || task?.project}
                        task={taskId}
                        onUploadComplete={() => {
                          fetchAttachments();
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. ACTIVITY TAB */}
              {activeTab === 'activity' && (
                <ActivityTimeline activities={activities} />
              )}

              {/* 6. TIME LOG TAB */}
              {activeTab === 'time-logs' && (
                <div className="space-y-6">
                  {/* Timer Tracker Widget */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Timer */}
                    <div className="bg-slate-950/45 p-5 rounded-2xl border border-slate-855 space-y-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${activeTimer ? 'bg-rose-500 animate-ping' : 'bg-slate-700'}`} />
                          {activeTimer ? 'Timer Active' : 'No Active Timer'}
                        </span>
                        {activeTimer && (
                          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-900/50">
                            {timerDurationText}
                          </span>
                        )}
                      </div>

                      {activeTimer ? (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-300 font-bold">"{activeTimer.description}"</p>
                          <button
                            onClick={handleStopTimer}
                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition-colors shadow-lg shadow-rose-950/30 flex items-center justify-center space-x-1.5"
                          >
                            <span className="w-2.5 h-2.5 bg-white rounded-sm" />
                            <span>Stop Timer & Log Hours</span>
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleStartTimer} className="space-y-3">
                          <input
                            type="text"
                            placeholder="What task segment are you targeting?"
                            value={timerDesc}
                            onChange={(e) => setTimerDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
                            required
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 text-[10px] text-slate-550 font-bold select-none cursor-pointer">
                              <input
                                type="checkbox"
                                checked={timerBillable}
                                onChange={(e) => setTimerBillable(e.target.checked)}
                                className="rounded border-slate-800 text-violet-650 bg-slate-950 w-3.5 h-3.5"
                              />
                              <span>Billable Task</span>
                            </label>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-1"
                            >
                              <Play size={12} fill="white" />
                              <span>Start Timer</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Manual Logger */}
                    <form onSubmit={handleManualTimeLog} className="bg-slate-950/45 p-5 rounded-2xl border border-slate-855 space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Manual Log Hours</span>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[9px] text-slate-500 font-bold block mb-1">Start Time</label>
                          <input
                            type="datetime-local"
                            value={manualStart}
                            onChange={(e) => setManualStart(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 font-bold block mb-1">End Time</label>
                          <input
                            type="datetime-local"
                            value={manualEnd}
                            onChange={(e) => setManualEnd(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none"
                            required
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Log notes / context..."
                        value={manualDesc}
                        onChange={(e) => setManualDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none"
                      />
                      <div className="flex justify-between items-center pt-1">
                        <label className="flex items-center space-x-2 text-[10px] text-slate-550 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={manualBillable}
                            onChange={(e) => setManualBillable(e.target.checked)}
                            className="rounded border-slate-800 text-violet-650 bg-slate-950 w-3.5 h-3.5"
                          />
                          <span>Billable log</span>
                        </label>
                        <button
                          type="submit"
                          className="px-4.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-xs border border-slate-700/60"
                        >
                          Submit Log
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Logged List Table */}
                  <div className="border-t border-slate-850 pt-5 space-y-3">
                    <h4 className="font-bold text-xs text-slate-205 uppercase tracking-wider">Logged Sessions</h4>
                    <div className="overflow-x-auto rounded-2xl border border-slate-850">
                      <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-850">
                        <thead className="bg-slate-950/60 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Team Member</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Billable</th>
                            <th className="px-4 py-3">Time Span</th>
                            <th className="px-4 py-3 text-right">Hours</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 bg-slate-950/20">
                          {timeLogs.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">No logged hours found.</td>
                            </tr>
                          ) : (
                            timeLogs.map((log: any) => {
                              const start = new Date(log.startTime);
                              const end = log.endTime ? new Date(log.endTime) : null;
                              return (
                                <tr key={log._id} className="hover:bg-slate-950/40">
                                  <td className="px-4 py-3 font-semibold text-slate-350">{start.toLocaleDateString()}</td>
                                  <td className="px-4 py-3">{log.user?.name}</td>
                                  <td className="px-4 py-3 font-medium text-slate-200">{log.description}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.isBillable ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                                      {log.isBillable ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">
                                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Running'}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-100">
                                    {((log.duration || 0) / 60).toFixed(2)}h
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {log.user?._id === user?._id && (
                                      <button
                                        onClick={() => handleDeleteTimeLog(log._id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. COMMUNICATION TAB */}
              {activeTab === 'communication' && (
                <div className="space-y-6">
                  {/* Log New Comm form */}
                  <form onSubmit={handleLogCommunication} className="bg-slate-950/45 p-5 rounded-2xl border border-slate-855 space-y-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-850 pb-2">Log Client Interaction</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="md:col-span-2">
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">Interaction Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Call regarding layout alignment"
                          value={commTitle}
                          onChange={(e) => setCommTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-205 outline-none focus:border-violet-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">Method Type</label>
                        <select
                          value={commType}
                          onChange={(e) => setCommType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                        >
                          <option value="Email">Email Thread</option>
                          <option value="Meeting">Meeting Transcript</option>
                          <option value="Call">Phone Call Log</option>
                          <option value="Discussion">Agency Discussion</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="md:col-span-2">
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">Interaction details / Notes transcript</label>
                        <textarea
                          rows={3}
                          placeholder="Log meeting minutes or copy client requests here..."
                          value={commDetails}
                          onChange={(e) => setCommDetails(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">Date</label>
                        <input
                          type="datetime-local"
                          value={commDate}
                          onChange={(e) => setCommDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500"
                        />
                        <button
                          type="submit"
                          className="w-full mt-3.5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-violet-955/20"
                        >
                          Log Interaction
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* List of Interactions */}
                  <div className="border-t border-slate-850 pt-5 space-y-4">
                    <h4 className="font-bold text-xs text-slate-205 uppercase tracking-wider">Historical Logs</h4>
                    
                    <div className="space-y-4">
                      {communications.length === 0 ? (
                        <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-slate-900 text-slate-500 italic text-xs">
                          No communication interactions registered yet.
                        </div>
                      ) : (
                        communications.map((c: any) => (
                          <div key={c._id} className="bg-slate-950/35 border border-slate-855 rounded-2xl p-5 hover:border-slate-800 transition-colors space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center">
                                  {c.type === 'Meeting' ? <Video size={14} className="text-blue-400" /> : c.type === 'Call' ? <Phone size={14} className="text-emerald-400" /> : <Mail size={14} className="text-violet-400" />}
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-slate-200">{c.title}</h5>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{c.type} · Logged by {c.createdBy?.name || 'System'} on {new Date(c.date).toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSummarizeComm(c._id, c.details)}
                                  disabled={summarizingId === c._id}
                                  className="text-[9px] font-black uppercase bg-violet-950/60 border border-violet-850 text-violet-300 hover:bg-violet-900 hover:text-white px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
                                >
                                  <Sparkles size={11} className={summarizingId === c._id ? 'animate-spin' : ''} />
                                  <span>AI Summarize</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteComm(c._id)}
                                  className="p-1 text-slate-500 hover:text-red-400 border border-slate-850 bg-slate-950 hover:border-red-950 rounded-lg transition-all"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-850 font-medium whitespace-pre-wrap leading-relaxed">
                              {c.details}
                            </p>

                            {aiSummaries[c._id] && (
                              <div className="bg-violet-950/15 border border-violet-900/35 p-3.5 rounded-xl text-xs space-y-1.5 animate-fadeIn">
                                <span className="font-extrabold text-[10px] text-violet-400 flex items-center space-x-1">
                                  <Sparkles size={12} />
                                  <span>AI DIGEST SUMMARY</span>
                                </span>
                                <p className="text-slate-400 font-mono text-[10px] bg-slate-950/40 p-2.5 border border-slate-850 rounded-lg whitespace-pre-line leading-relaxed">
                                  {aiSummaries[c._id]}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* COLUMN 2: PROPERTIES SIDEBAR PANELS (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Properties Control Panel */}
            <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-3xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <h3 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-widest">Metadata Props</h3>
                <button
                  onClick={handleSaveBasic}
                  className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center space-x-1"
                >
                  <Save size={12} />
                  <span>Apply changes</span>
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-205 outline-none focus:border-violet-500/50"
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-205 outline-none focus:border-violet-500/50"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1 flex items-center gap-1 uppercase tracking-wider"><CalendarDays size={10} />Start</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-1 text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1 flex items-center gap-1 uppercase tracking-wider"><CalendarDays size={10} />Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-1 text-slate-200 outline-none"
                    />
                  </div>
                </div>

                {/* Workspace tags */}
                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-1 flex items-center gap-1 uppercase tracking-wider"><Tag size={10} />Tags</label>
                  <div className="flex flex-wrap gap-1 bg-slate-950 p-2 border border-slate-850 rounded-xl max-h-24 overflow-y-auto">
                    {availableTags.length === 0 ? (
                      <p className="text-[9px] text-slate-600 italic">No workspace tags found.</p>
                    ) : (
                      availableTags.map((tag: any) => {
                        const isAssigned = tags.includes(tag.name);
                        return (
                          <button
                            type="button"
                            key={tag._id}
                            onClick={() => {
                              setTags(prev =>
                                prev.includes(tag.name)
                                  ? prev.filter(t => t !== tag.name)
                                  : [...prev, tag.name]
                              );
                            }}
                            className="px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer"
                            style={{
                              backgroundColor: isAssigned ? `${tag.color}25` : 'transparent',
                              borderColor: isAssigned ? tag.color : '#334155',
                              color: isAssigned ? tag.color : '#64748b'
                            }}
                          >
                            <span>{tag.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Sprint Timeline</label>
                  <select
                    value={sprintId}
                    onChange={(e) => setSprintId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-205 outline-none focus:border-violet-500/50"
                  >
                    <option value="">No Active Sprint</option>
                    {task?.project?.sprints?.map(spr => (
                      <option key={spr._id} value={spr._id}>{spr.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Milestone</label>
                  <select
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-205 outline-none focus:border-violet-500/50"
                  >
                    <option value="">No Milestone Linked</option>
                    {milestones.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Est. Hours</label>
                    <input
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-1 text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Logged Hours</label>
                    <input
                      type="number"
                      value={actualHours}
                      onChange={(e) => setActualHours(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-1 text-slate-200 outline-none"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Assignees Control */}
            <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-3xl space-y-3 shadow-xl">
              <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <UserCheck size={11} className="text-violet-400" />
                <span>Assignees</span>
              </label>
              <div className="flex flex-wrap gap-1 bg-slate-950 p-2 rounded-xl border border-slate-850 max-h-28 overflow-y-auto">
                {teamMembers.map(member => (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => handleToggleAssignee(member._id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] border transition-colors ${assignees.includes(member._id)
                      ? 'bg-violet-950 border-violet-800 text-violet-400 font-bold'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
              {assignees.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-850/60">
                  {assignees.map(aId => {
                    const m = teamMembers.find(tm => tm._id === aId);
                    if (!m) return null;
                    return (
                      <span key={aId} className="flex items-center gap-1 px-2.5 py-0.5 bg-violet-950/40 border border-violet-800/40 rounded-full text-[9px] font-bold text-violet-300">
                        <div className="w-3.5 h-3.5 rounded-full bg-violet-600 flex items-center justify-center text-[7px] font-black text-white">{m.name.charAt(0)}</div>
                        {m.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ticket Watchers control */}
            <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-3xl space-y-2 shadow-xl">
              <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Watchers List</label>
              <div className="flex flex-wrap gap-1 bg-slate-950 p-2 rounded-xl border border-slate-850 max-h-24 overflow-y-auto">
                {teamMembers.map(member => (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => handleToggleWatcher(member._id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] border transition-colors ${watchers.includes(member._id)
                      ? 'bg-indigo-950 border-indigo-800 text-indigo-400 font-bold'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>

            {/* AI developer assistant */}
            <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center space-x-1.5 border-b border-slate-850 pb-2">
                <Sparkles size={13} className="text-violet-400" />
                <h4 className="font-extrabold text-[9px] text-slate-400 uppercase tracking-widest">AI DEV ASSISTANT</h4>
              </div>
              
              <div className="flex bg-slate-950 p-1 rounded-xl">
                {(['explain', 'refactor', 'breakdown'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDevRequestType(type)}
                    className={`flex-1 text-center py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
                      devRequestType === type
                        ? 'bg-violet-600 text-white shadow'
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <textarea
                  value={devUserInstruction}
                  onChange={(e) => setDevUserInstruction(e.target.value)}
                  placeholder={
                    devRequestType === 'explain'
                      ? 'E.g. Explain how to handle database updates...'
                      : devRequestType === 'refactor'
                      ? 'E.g. Refactor description for clarity...'
                      : 'E.g. Technical tasks breakdown checklist...'
                  }
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-[10px] text-slate-200 outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={handleAIDevAssistant}
                  disabled={generatingDevAssistant || !devUserInstruction.trim()}
                  className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-850 disabled:to-indigo-850 text-white text-[10px] font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <Sparkles size={11} className={generatingDevAssistant ? 'animate-spin' : ''} />
                  <span>{generatingDevAssistant ? 'Consulting AI...' : 'Consult AI Assistant'}</span>
                </button>
              </div>

              {devAssistantResponse && (
                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl space-y-2 max-h-52 overflow-y-auto">
                  <div className="text-[9px] text-slate-450 font-bold uppercase tracking-wider border-b border-slate-850 pb-1.5 flex justify-between items-center">
                    <span>AI Assistant Digest</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950/40 px-1.5 rounded font-black">Impact: {devAssistantResponse.complexityImpact || 'Low'}</span>
                  </div>
                  <div className="text-[10px] text-slate-300 space-y-2 leading-relaxed">
                    <p className="font-semibold">{devAssistantResponse.explanation}</p>
                    {devAssistantResponse.suggestedCode && (
                      <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[9px] font-mono overflow-x-auto text-slate-300 select-all whitespace-pre-wrap">
                        {devAssistantResponse.suggestedCode}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      {/* File Preview and Version History Modals */}
      {previewAttachmentId && (
        <FilePreviewModal
          attachmentId={previewAttachmentId}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewAttachmentId(null);
          }}
          onVersionHistoryTrigger={() => {
            setVersionHistoryAttachmentId(previewAttachmentId);
            setShowVersionHistoryModal(true);
            setShowPreviewModal(false);
          }}
        />
      )}
      {versionHistoryAttachmentId && (
        <FileVersionHistory
          attachmentId={versionHistoryAttachmentId}
          projectId={task?.project?._id || task?.project}
          isOpen={showVersionHistoryModal}
          onClose={() => {
            setShowVersionHistoryModal(false);
            setVersionHistoryAttachmentId(null);
            fetchAttachments();
          }}
          onVersionUpdated={() => {
            fetchAttachments();
          }}
        />
      )}
    </div>
  );
}
