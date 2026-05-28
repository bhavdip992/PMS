import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import Modal from '../../components/Modal.tsx';
import { 
  Mail, 
  MessageSquare, 
  Plus, 
  Video, 
  Phone, 
  Sparkles, 
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function Communications() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // New Log Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Email');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');

  // AI states
  const [summarizingId, setSummarizingId] = useState(null);
  const [aiSummaries, setAiSummaries] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchCommunications();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      const projs = response.data.data.projects;
      setProjects(projs);
    } catch (err) {
      console.error('Failed to load projects list', err);
    }
  };

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const url = selectedProject 
        ? `/communications?project=${selectedProject}`
        : '/communications';
      const response = await api.get(url);
      setCommunications(response.data.data.communications);
    } catch (err) {
      console.error('Failed to load communications logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        project: selectedProject || null,
        title,
        type,
        details,
        date: date || new Date()
      };
      await api.post('/communications', payload);
      setModalOpen(false);

      // Reset
      setTitle('');
      setType('Email');
      setDetails('');
      setDate('');

      fetchCommunications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log communication');
    }
  };

  const handleSummarize = async (commId, textContent) => {
    setSummarizingId(commId);
    try {
      const response = await api.post('/ai/summarize', { text: textContent });
      setAiSummaries(prev => ({
        ...prev,
        [commId]: response.data.data.summary
      }));
    } catch (err) {
      console.error(err);
      alert('AI Summarization failed.');
    } finally {
      setSummarizingId(null);
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    try {
      await api.delete(`/communications/${id}`);
      fetchCommunications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete communication log');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Meeting': return <Video size={16} className="text-blue-400" />;
      case 'Call': return <Phone size={16} className="text-emerald-400" />;
      default: return <Mail size={16} className="text-violet-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
            <MessageSquare className="text-violet-400" size={24} />
            <span>Communications Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Log client calls, email updates, and meeting notes, and use AI to auto-summarize transcripts.</p>
        </div>

        <div className="flex items-center space-x-3">
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Log Communication</span>
          </button>
        </div>
      </div>

      {/* Communications stream */}
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : communications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-500 text-sm">
          No communication logs registered.
        </div>
      ) : (
        <div className="space-y-4">
          {communications.map((c) => (
            <div key={c._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4 hover:border-slate-700/60 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-850">
                    {getTypeIcon(c.type)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">{c.title}</h3>
                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500">
                      <span className="font-semibold">{c.type}</span>
                      <span>•</span>
                      <span>{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleSummarize(c._id, c.details)}
                    disabled={summarizingId === c._id}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-violet-600/10 hover:bg-violet-600/25 border border-violet-500/30 text-violet-400 hover:text-white rounded-lg transition-all text-[10px] font-bold"
                  >
                    <Sparkles size={11} />
                    <span>{summarizingId === c._id ? 'Summarizing...' : 'AI Summarize'}</span>
                  </button>

                  <button 
                    onClick={() => handleDeleteLog(c._id)}
                    className="p-1 text-slate-500 hover:text-red-400 bg-slate-950 rounded border border-slate-850 hover:border-red-950 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Main notes content */}
              <div className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                {c.details}
              </div>

              {/* Render AI summary if present */}
              {aiSummaries[c._id] && (
                <div className="bg-violet-950/10 border border-violet-900/30 p-4 rounded-xl text-xs text-slate-300 space-y-2 animate-fadeIn">
                  <div className="flex items-center space-x-1.5 text-violet-400 font-bold">
                    <Sparkles size={13} />
                    <span>AI Assistant Digest</span>
                  </div>
                  <div className="whitespace-pre-line font-mono text-[11px] leading-relaxed text-slate-400 bg-slate-950/50 p-2.5 rounded border border-slate-800">
                    {aiSummaries[c._id]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Log Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Communication Detail">
        <form onSubmit={handleCreateLog} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Log Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Kickoff call client notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Log Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              >
                <option value="Email">Email</option>
                <option value="Meeting">Meeting Transcript</option>
                <option value="Call">Call Log</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Transcript / Content Details</label>
            <textarea 
              rows={5}
              required
              placeholder="Copy emails or meeting transcripts here..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Log Entry
          </button>
        </form>
      </Modal>

    </div>
  );
}
