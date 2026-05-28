import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { 
  X, 
  Save, 
  Trash2, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  Lock,
  GitPullRequest
} from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor.tsx';

export default function SubtaskDetailsDrawer({ subtaskId, isOpen, onClose, teamMembers, onSubtaskUpdated, onTaskClick }) {
  const [subtask, setSubtask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Todo');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [actualHours, setActualHours] = useState('');

  // Comment states
  const [newCommentText, setNewCommentText] = useState('');
  const [commentIsInternal, setCommentIsInternal] = useState(false);
  const [commentMentions, setCommentMentions] = useState([]);

  // Custom mentions support states
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionCursorPos, setMentionCursorPos] = useState(0);

  useEffect(() => {
    if (isOpen && subtaskId) {
      fetchSubtaskData();
    }
  }, [isOpen, subtaskId]);

  const fetchSubtaskData = async () => {
    setLoading(true);
    try {
      const [subRes, commentsRes] = await Promise.all([
        api.get(`/subtasks/${subtaskId}`),
        api.get(`/subtasks/${subtaskId}/comments`)
      ]);

      const s = subRes.data.data.subtask;
      setSubtask(s);
      setComments(commentsRes.data.data.comments || []);

      // Populate form
      setTitle(s.title || '');
      setDescription(s.description || '');
      setStatus(s.status || 'Todo');
      setAssignee(s.assignee?._id || '');
      setDueDate(s.dueDate ? s.dueDate.split('T')[0] : '');
      setEstimatedHours(s.estimatedHours || 0);
      setActualHours(s.actualHours || 0);

    } catch (err) {
      console.error('Failed to fetch subtask data', err);
    } finally {
      setLoading(false);
    }
  };

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
      if (onSubtaskUpdated) onSubtaskUpdated();
    } catch (err) {
      alert('Failed to save subtask changes');
    }
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
      alert('Failed to post comment on subtask');
    }
  };

  const handleCommentChange = (e) => {
    const text = e.target.value;
    setNewCommentText(text);
    const selectionStart = e.target.selectionStart;

    const textBeforeCursor = text.slice(0, selectionStart);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1 && !/\s/.test(textBeforeCursor.slice(atIndex + 1))) {
      const search = textBeforeCursor.slice(atIndex + 1);
      setMentionSearch(search);
      setShowMentionDropdown(true);
      setMentionCursorPos(atIndex);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleSelectMention = (member) => {
    const text = newCommentText;
    const before = text.slice(0, mentionCursorPos);
    const after = text.slice(mentionCursorPos + mentionSearch.length + 1);
    const updatedText = `${before}@${member.name} ${after}`;
    setNewCommentText(updatedText);

    if (!commentMentions.includes(member._id)) {
      setCommentMentions([...commentMentions, member._id]);
    }

    setShowMentionDropdown(false);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      fetchSubtaskData();
    } catch (err) {
      alert('Failed to delete subtask comment');
    }
  };

  const handleDeleteSubtask = async () => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) return;
    try {
      await api.delete(`/subtasks/${subtaskId}`);
      onClose();
      if (onSubtaskUpdated) onSubtaskUpdated();
    } catch (err) {
      alert('Failed to delete subtask');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity">
      {/* Backdrop click handler */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-4xl h-full bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl relative animate-slideLeft">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-850 flex justify-between items-center z-10">
          <div className="flex items-center space-x-3">
            <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 px-2.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">
              Subtask Workspace
            </span>
            {subtask?._id && (
              <span className="text-[10px] font-black text-indigo-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded">
                #SUB-{subtask._id}
              </span>
            )}
            <span className="text-xs text-slate-500 font-medium">Parent: {subtask?.parentTask?.title || 'Main Task'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleDeleteSubtask}
              className="p-1.5 rounded-lg hover:bg-red-950/30 hover:border-red-900 border border-transparent text-slate-400 hover:text-red-400 transition-all mr-2"
              title="Delete Subtask"
            >
              <Trash2 size={15} />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider animate-pulse">Syncing Subtask Workspace...</span>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            
            {/* LEFT COLUMN: TITLE, DESCRIPTION, COMMENTS (65% / 8 Cols) */}
            <div className="lg:col-span-8 border-r border-slate-850 overflow-y-auto p-5 space-y-6">
              
              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Subtask Title</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 focus:border-indigo-500 outline-none mt-1 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Subtask Breakdown</label>
                    <button 
                      onClick={handleSaveProperties}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <Save size={12} />
                      <span>Save Breakdown</span>
                    </button>
                  </div>
                  <RichTextEditor 
                    value={description}
                    onChange={setDescription}
                    placeholder="Document subtask scope, specifications or technical constraints..."
                    onTaskClick={onTaskClick}
                  />
                </div>
              </div>

              {/* Subtask Discussion stream */}
              <div className="space-y-4 border-t border-slate-850 pt-5">
                <h4 className="font-bold text-xs text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                  <MessageSquare size={14} className="text-indigo-400" />
                  <span>Subtask Conversations ({comments.length})</span>
                </h4>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-[10px] text-slate-500 py-6">No discussions logged on this subtask.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c._id} className="p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl text-xs space-y-1 relative group">
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-300">{c.author?.name}</span>
                            {c.isInternal && (
                              <span className="inline-flex items-center space-x-0.5 text-[8px] bg-red-950/60 border border-red-900 text-red-400 px-1.5 py-0.5 rounded font-black uppercase">
                                <Lock size={8} className="flex-shrink-0" />
                                <span>Internal</span>
                              </span>
                            )}
                          </div>
                          <span>{new Date(c.createdAt).toLocaleDateString([], {month:'short', day:'numeric'})}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-medium">{c.content}</p>
                        <button 
                          onClick={() => handleDeleteComment(c._id)}
                          className="absolute top-2 right-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handlePostComment} className="space-y-2 relative">
                  {showMentionDropdown && (
                    <div className="absolute bottom-full mb-2 w-full max-w-xs bg-slate-950 border border-slate-800 rounded-xl p-1 max-h-36 overflow-y-auto shadow-2xl z-20">
                      {teamMembers
                        .filter(m => m.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                        .map(m => (
                          <button
                            key={m._id}
                            type="button"
                            onClick={() => handleSelectMention(m)}
                            className="w-full text-left px-2.5 py-1.5 rounded text-[10px] font-bold text-slate-300 hover:text-white hover:bg-indigo-950/80 transition-colors flex items-center space-x-2"
                          >
                            <span className="w-4 h-4 rounded-full bg-indigo-900 flex items-center justify-center text-[8px] font-bold text-indigo-300 uppercase">
                              {m.name[0]}
                            </span>
                            <span>{m.name}</span>
                          </button>
                        ))}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Write a message... Use @ to mention someone"
                      value={newCommentText}
                      onChange={handleCommentChange}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Send
                    </button>
                  </div>

                  <div className="flex items-center space-x-4 pl-0.5">
                    <label className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold cursor-pointer hover:text-slate-300 select-none">
                      <input 
                        type="checkbox"
                        checked={commentIsInternal}
                        onChange={(e) => setCommentIsInternal(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                      />
                      <span>Mark as Internal Discussion</span>
                    </label>
                  </div>
                </form>
              </div>

            </div>

            {/* RIGHT COLUMN: ATTRIBUTES (35% / 4 Cols) */}
            <div className="lg:col-span-4 p-5 space-y-6 bg-slate-950/20 overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Subtask Settings</h3>
                <button 
                  onClick={handleSaveProperties}
                  className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <Save size={12} />
                  <span>Apply Settings</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Assignee</label>
                  <select 
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Due Date</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Est. Hours</label>
                    <input 
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Actual Hours</label>
                    <input 
                      type="number"
                      value={actualHours}
                      onChange={(e) => setActualHours(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
