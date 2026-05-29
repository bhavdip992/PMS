import { useParams, useNavigate, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import {
  X,
  Play,
  Trash2,
  Save,
  GitBranch,
  Clock,
  Sparkles,
  Paperclip,
  Lock,
  MessageSquare,
  ChevronLeft,
  CalendarDays,
  Download,
  FileText,
  Video,
  Phone,
  Mail,
  Globe,
  Layers,
  History,
  Tag
} from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor.tsx';
import BreadcrumbNav from './components/BreadcrumbNav.tsx';
import ActivityTimeline from './components/ActivityTimeline.tsx';
import FileUploadZone from '../files/FileUploadZone.tsx';
import FilePreviewModal from '../files/FilePreviewModal.tsx';
import FileVersionHistory from '../files/FileVersionHistory.tsx';

export default function SubtaskDetailView() {
  const navigate = useNavigate();
  const { taskId, subtaskId } = useParams();
  const { user } = useAuthStore();

  // Core Entity States
  const [subtask, setSubtask] = useState<any>(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab State: 'details' | 'comments' | 'files' | 'activity' | 'time-logs' | 'communication'
  const [activeTab, setActiveTab] = useState('details');

  // Edit fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Todo');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [actualHours, setActualHours] = useState('');

  // Comment composer fields
  const [newCommentText, setNewCommentText] = useState('');
  const [commentIsInternal, setCommentIsInternal] = useState(false);
  const [commentMentions, setCommentMentions] = useState([]);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');

  // Phase 5 file preview & versions states
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [versionHistoryAttachmentId, setVersionHistoryAttachmentId] = useState<string | null>(null);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);

  // Time logging states
  const [timeLogs, setTimeLogs] = useState([]);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [timerDurationText, setTimerDurationText] = useState('00:00:00');
  const [timerDesc, setTimerDesc] = useState('');
  const [timerBillable, setTimerBillable] = useState(true);
  
  // Manual time fields
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualBillable, setManualBillable] = useState(true);

  // Communication states
  const [communications, setCommunications] = useState([]);
  const [commTitle, setCommTitle] = useState('');
  const [commType, setCommType] = useState('Email');
  const [commDetails, setCommDetails] = useState('');
  const [commDate, setCommDate] = useState('');
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  useEffect(() => {
    if (subtaskId) {
      fetchSubtaskData();
      fetchSecondaryData();
      fetchTimeLogs();
      fetchActiveTimer();
      fetchCommunications();
    }
  }, [subtaskId]);

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
      const usersRes = await api.get('/users');
      setTeamMembers(usersRes.data.data.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const fetchSubtaskData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, commsRes, actRes] = await Promise.all([
        api.get(`/subtasks/${subtaskId}`),
        api.get(`/subtasks/${subtaskId}/comments`),
        api.get(`/subtasks/${subtaskId}/activities`)
      ]);

      const s = subRes.data.data.subtask;
      setSubtask(s);
      setComments(commsRes.data.data.comments || []);
      setActivities(actRes.data.data.activities || []);

      // Populate form
      setTitle(s.title || '');
      setDescription(s.description || '');
      setStatus(s.status || 'Todo');
      setAssignee(s.assignee?._id || s.assignee || '');
      setDueDate(s.dueDate ? s.dueDate.split('T')[0] : '');
      setEstimatedHours(s.estimatedHours || 0);
      setActualHours(s.actualHours || 0);

      // Load subtask attachments
      try {
        const attRes = await api.get(`/attachments/subtask/${subtaskId}`);
        setAttachments(attRes.data.data.attachments || []);
      } catch (_) {}

    } catch (err) {
      console.error('Failed to load subtask details', err);
      setError(err.response?.data?.message || 'Failed to load subtask workspace.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeLogs = async () => {
    try {
      const res = await api.get(`/time-logs?subtask=${subtaskId}`);
      setTimeLogs(res.data.data.timeLogs || []);
    } catch (err) {
      console.error('Failed to load subtask time logs', err);
    }
  };

  const fetchActiveTimer = async () => {
    try {
      const res = await api.get('/time-logs/active');
      const timer = res.data.data.activeTimer;
      if (timer && (timer.subtask === subtaskId || timer.subtask?._id === subtaskId)) {
        setActiveTimer(timer);
      } else {
        setActiveTimer(null);
      }
    } catch (_) {}
  };

  const fetchCommunications = async () => {
    try {
      const res = await api.get(`/communications?subtask=${subtaskId}`);
      setCommunications(res.data.data.communications || []);
    } catch (err) {
      console.error('Failed to load subtask communications', err);
    }
  };

  // Timer handlers
  const handleStartTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/time-logs/start', {
        taskId: subtaskId, // Passes subtask ID to start endpoint
        description: timerDesc || 'Working on subtask',
        isBillable: timerBillable
      });
      setTimerDesc('');
      fetchActiveTimer();
      fetchTimeLogs();
    } catch (err) {
      alert('Failed to start subtask timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await api.post('/time-logs/stop');
      setActiveTimer(null);
      fetchActiveTimer();
      fetchTimeLogs();
      fetchSubtaskData(); // recalculate actual hours
    } catch (err) {
      alert('Failed to stop subtask timer');
    }
  };

  const handleManualTimeLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStart || !manualEnd) return;
    try {
      await api.post('/time-logs', {
        taskId: subtaskId, // Passes subtask ID
        startTime: new Date(manualStart).toISOString(),
        endTime: new Date(manualEnd).toISOString(),
        description: manualDesc || 'Subtask manual entry log',
        isBillable: manualBillable
      });
      setManualStart('');
      setManualEnd('');
      setManualDesc('');
      fetchTimeLogs();
      fetchSubtaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to manually log time for subtask');
    }
  };

  const handleDeleteTimeLog = async (id: string) => {
    if (!window.confirm('Delete this time log?')) return;
    try {
      await api.delete(`/time-logs/${id}`);
      fetchTimeLogs();
      fetchSubtaskData();
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
        subtask: subtaskId,
        task: taskId,
        project: subtask?.parentTask?.project?._id || subtask?.parentTask?.project,
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
      alert('Failed to log communication record');
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
      alert('Failed to summarize communication');
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
      alert('Failed to delete communication');
    }
  };

  // Properties Save
  const handleSaveProperties = async () => {
    try {
      const payload = {
        title,
        description,
        status,
        assignee: assignee || null,
        dueDate: dueDate || null,
        estimatedHours: Number(estimatedHours) || 0,
        actualHours: Number(actualHours) || 0
      };
      await api.put(`/subtasks/${subtaskId}`, payload);
      fetchSubtaskData();
      alert('Subtask details saved successfully!');
    } catch (err) {
      alert('Failed to save subtask details');
    }
  };

  // Attachment Actions
  const handleAddAttachment = async () => {
    if (!newAttachmentUrl.trim()) return;
    const name = newAttachmentName.trim() || newAttachmentUrl.trim().split('/').pop();
    const ext = newAttachmentUrl.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const fileType = imageExts.includes(ext || '') ? 'image' : 'link';
    try {
      await api.post('/attachments', {
        name,
        fileUrl: newAttachmentUrl.trim(),
        fileType,
        subtask: subtaskId,
        project: subtask?.parentTask?.project?._id || subtask?.parentTask?.project,
      });
      setNewAttachmentName('');
      setNewAttachmentUrl('');
      fetchSubtaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add attachment');
    }
  };

  const fetchAttachments = async () => {
    try {
      const attRes = await api.get(`/attachments/subtask/${subtaskId}`);
      setAttachments(attRes.data.data.attachments || []);
    } catch (_) {}
  };

  const handleDeleteAttachment = async (id) => {
    if (!window.confirm('Remove this attachment?')) return;
    try {
      await api.delete(`/attachments/${id}`);
      fetchSubtaskData();
    } catch (err) {
      alert('Failed to delete attachment');
    }
  };

  // Comments Handlers
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
      await api.post(`/subtasks/${subtaskId}/comments`, payload);
      setNewCommentText('');
      setCommentMentions([]);
      setCommentIsInternal(false);
      fetchSubtaskData();
    } catch (err) {
      alert('Failed to post subtask comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      fetchSubtaskData();
    } catch (_) {
      alert('Failed to delete comment');
    }
  };

  const handleBackToParent = () => {
    navigate(`/tasks/${taskId}`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBackToParent}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700/50 shadow-inner"
            aria-label="Back to parent task"
          >
            <ChevronLeft size={16} />
            <span>Parent</span>
          </button>
          
          <div className="h-5 w-[1px] bg-slate-800" />
          
          <BreadcrumbNav
            project={subtask?.parentTask?.project}
            task={subtask?.parentTask}
            subtask={{ _id: subtaskId || '', title: subtask?.title || '' }}
          />
        </div>

        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1">
          <Layers size={14} className="text-indigo-400" />
          <span>Subtask Space</span>
        </h2>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider animate-pulse">Syncing Subtask...</span>
        </div>
      ) : error ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-950/40 flex items-center justify-center text-rose-500 border border-rose-900/50 animate-pulse">
            <X size={24} />
          </div>
          <h3 className="text-sm font-black text-rose-400 uppercase">Subtask Failed to Load</h3>
          <p className="text-xs text-slate-405 max-w-sm">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: TABS & LEFT CONTENT PANEL (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs List */}
            <div className="flex flex-wrap gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 shadow-md">
              {[
                { id: 'details', label: 'Details', icon: <FileText size={13} /> },
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
                      ? 'bg-gradient-to-r from-indigo-650 to-violet-650 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content Container */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6 min-h-[400px]">
              
              {/* DETAILS TAB */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Subtask Name</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-105 mt-1.5 focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Breakdown Details</label>
                      <button
                        onClick={handleSaveProperties}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                      >
                        <Save size={12} />
                        <span>Save Scope</span>
                      </button>
                    </div>
                    <RichTextEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Document specifications or implementation constraints on subtask..."
                      onTaskClick={(linkedId) => navigate('/tasks/' + linkedId)}
                    />
                  </div>
                </div>
              )}

              {/* COMMENTS TAB */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <MessageSquare size={14} className="text-indigo-400" />
                      <span>Subtask Discussions ({comments.length})</span>
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
                          <div className="flex justify-between items-center text-[10px] text-slate-455">
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
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="absolute top-3 right-3 text-slate-650 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {showMentionDropdown && (
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden max-h-36 overflow-y-auto divide-y divide-slate-855">
                      <button
                        type="button"
                        onClick={() => handleSelectMention('all')}
                        className="w-full px-4.5 py-2.5 text-left text-xs font-bold text-violet-400 hover:bg-slate-900 transition-colors"
                      >
                        📢 Mention Everyone (@all)
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
                            <span>{member.name}</span>
                          </button>
                        ))}
                    </div>
                  )}

                  <form onSubmit={handlePostComment} className="p-4 border border-slate-850 bg-slate-950/40 rounded-2xl space-y-2">
                    <input
                      type="text"
                      placeholder="Comment on this subtask... Use @ to tag"
                      value={newCommentText}
                      onChange={(e) => handleCommentTextChange(e.target.value)}
                      className="w-full bg-slate-955/60 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                      required
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">Tagging: {commentMentions.length} user(s)</span>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all"
                      >
                        Send comment
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* FILES TAB */}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <Paperclip size={14} className="text-indigo-400" />
                      <span>Subtask Attachments ({attachments.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                    {attachments.length === 0 ? (
                      <div className="sm:col-span-2 text-center py-10 bg-slate-950/10 rounded-2xl border border-slate-900 text-slate-500 italic text-xs">
                        No attachments linked yet. Drag/drop or link assets below.
                      </div>
                    ) : (
                      attachments.map((att: any) => {
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
                              <span className="text-xs font-bold text-slate-200 hover:text-indigo-400 truncate block">
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
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-indigo-400 transition-colors"
                                title="View Versions"
                              >
                                <GitBranch size={13} />
                              </button>
                              <a href={att.fileUrl} download target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-indigo-400 transition-colors">
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
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Link Subtask Attachment</h4>
                        <p className="text-[10px] text-slate-550 mb-3">Reference external assets like Figma prototypes, Miro boards, or Google Docs.</p>
                      </div>
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={newAttachmentName}
                          onChange={e => setNewAttachmentName(e.target.value)}
                          placeholder="Document display title (e.g., Figma board)"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={newAttachmentUrl}
                            onChange={e => setNewAttachmentUrl(e.target.value)}
                            placeholder="https://example.com/asset..."
                            className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-205 outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddAttachment}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold rounded-xl transition-all shadow-md"
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
                        project={subtask?.parentTask?.project?._id || subtask?.parentTask?.project}
                        subtask={subtaskId}
                        onUploadComplete={() => {
                          fetchAttachments();
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVITY TAB */}
              {activeTab === 'activity' && (
                <ActivityTimeline activities={activities} />
              )}

              {/* TIME LOG TAB */}
              {activeTab === 'time-logs' && (
                <div className="space-y-6">
                  {/* Timer Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Timer */}
                    <div className="bg-slate-950/45 p-5 rounded-2xl border border-slate-855 space-y-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${activeTimer ? 'bg-rose-500 animate-ping' : 'bg-slate-700'}`} />
                          {activeTimer ? 'Timer Tracking Subtask' : 'No Active Timer'}
                        </span>
                        {activeTimer && (
                          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-905">
                            {timerDurationText}
                          </span>
                        )}
                      </div>

                      {activeTimer ? (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-300 font-bold">"{activeTimer.description}"</p>
                          <button
                            onClick={handleStopTimer}
                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-505 text-white text-xs font-extrabold rounded-xl transition-colors shadow-lg flex items-center justify-center space-x-1.5"
                          >
                            <span className="w-2.5 h-2.5 bg-white rounded-sm" />
                            <span>Stop tracking</span>
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleStartTimer} className="space-y-3">
                          <input
                            type="text"
                            placeholder="Detail your subtask focus segment..."
                            value={timerDesc}
                            onChange={(e) => setTimerDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-202 outline-none focus:border-indigo-500"
                            required
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 text-[10px] text-slate-550 font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={timerBillable}
                                onChange={(e) => setTimerBillable(e.target.checked)}
                                className="rounded border-slate-800 text-indigo-650 bg-slate-950 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span>Billable segment</span>
                            </label>
                            <button
                              type="submit"
                              className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-1"
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
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Manual Log subtask Hours</span>
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
                        placeholder="Segment description logs..."
                        value={manualDesc}
                        onChange={(e) => setManualDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-202 outline-none"
                      />
                      <div className="flex justify-between items-center pt-1">
                        <label className="flex items-center space-x-2 text-[10px] text-slate-550 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={manualBillable}
                            onChange={(e) => setManualBillable(e.target.checked)}
                            className="rounded border-slate-800 text-indigo-650 bg-slate-950 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>Billable entry</span>
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

                  {/* Sessions grid */}
                  <div className="border-t border-slate-850 pt-5 space-y-3">
                    <h4 className="font-bold text-xs text-slate-205 uppercase tracking-wider">Subtask time sessions</h4>
                    <div className="overflow-x-auto rounded-2xl border border-slate-850">
                      <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-850">
                        <thead className="bg-slate-950/60 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Member</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Billable</th>
                            <th className="px-4 py-3">Span</th>
                            <th className="px-4 py-3 text-right">Hours</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 bg-slate-950/20">
                          {timeLogs.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-slate-505 italic">No hours logged directly against subtask.</td>
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
                                        className="text-slate-550 hover:text-red-400 transition-colors p-1"
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

              {/* COMMUNICATION TAB */}
              {activeTab === 'communication' && (
                <div className="space-y-6">
                  {/* Log new comm */}
                  <form onSubmit={handleLogCommunication} className="bg-slate-950/45 p-5 rounded-2xl border border-slate-855 space-y-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-850 pb-2">Log Client interaction for subtask</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="md:col-span-2">
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">Interaction Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Call regarding layout alignment"
                          value={commTitle}
                          onChange={(e) => setCommTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-205 outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">Type</label>
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
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">Interaction details / transcripts</label>
                        <textarea
                          rows={3}
                          placeholder="Log meeting minutes or copy client requests here..."
                          value={commDetails}
                          onChange={(e) => setCommDetails(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">Date</label>
                        <input
                          type="datetime-local"
                          value={commDate}
                          onChange={(e) => setCommDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          className="w-full mt-3.5 py-2.5 bg-indigo-650 hover:bg-indigo-600 bg-indigo-650 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-955/20"
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
                        <div className="text-center py-10 bg-slate-955/15 rounded-2xl border border-slate-900 text-slate-505 italic text-xs">
                          No communications logged specifically under this subtask.
                        </div>
                      ) : (
                        communications.map((c: any) => (
                          <div key={c._id} className="bg-slate-950/35 border border-slate-855 rounded-2xl p-5 hover:border-slate-800 transition-colors space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center">
                                  {c.type === 'Meeting' ? <Video size={14} className="text-blue-450 text-indigo-400" /> : c.type === 'Call' ? <Phone size={14} className="text-emerald-400" /> : <Mail size={14} className="text-violet-400" />}
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
                                  className="text-[9px] font-black uppercase bg-indigo-950 border border-indigo-850 text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
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

                            <p className="text-xs text-slate-300 bg-slate-955/75 p-3 rounded-xl border border-slate-850 font-medium whitespace-pre-wrap leading-relaxed">
                              {c.details}
                            </p>

                            {aiSummaries[c._id] && (
                              <div className="bg-indigo-950/15 border border-indigo-900/35 p-3.5 rounded-xl text-xs space-y-1.5 animate-fadeIn">
                                <span className="font-extrabold text-[10px] text-indigo-400 flex items-center space-x-1">
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
                  onClick={handleSaveProperties}
                  className="text-[10px] font-bold text-indigo-450 text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
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
                    className="w-full bg-slate-955/65 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-205 outline-none focus:border-indigo-500/50"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Assignee</label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-205 outline-none focus:border-indigo-505"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-1 flex items-center gap-1 uppercase tracking-wider"><CalendarDays size={10} />Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-1 text-slate-200 outline-none focus:border-indigo-500"
                  />
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
                      className="w-full bg-slate-955 bg-slate-955/40 border border-slate-850 rounded-xl px-2 py-1 text-slate-200 outline-none"
                      disabled
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850/65 space-y-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Parent Task Reference</span>
                  <div className="p-3 bg-slate-950/70 border border-slate-850 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Title</span>
                    <Link to={`/tasks/${taskId}`} className="text-xs font-black text-indigo-400 hover:text-indigo-350 hover:underline transition-colors block truncate">
                      {subtask?.parentTask?.title || 'Loading...'}
                    </Link>
                  </div>
                </div>
              </div>
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
          projectId={subtask?.parentTask?.project?._id || subtask?.parentTask?.project}
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
