import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import Modal from '../../components/Modal.tsx';
import { 
  Key, 
  Plus, 
  Database, 
  Globe, 
  Terminal, 
  Layout, 
  Lock, 
  Eye, 
  EyeOff, 
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function Vault() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // New Credential Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('API Key');
  const [details, setDetails] = useState('');

  // Eye toggle for passwords
  const [revealMap, setRevealMap] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchCredentials(selectedProject);
    } else {
      setCredentials([]);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      const projs = response.data.data.projects;
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProject(projs[0]._id);
      }
    } catch (err) {
      console.error('Failed to load projects list in vault', err);
    }
  };

  const fetchCredentials = async (projectId) => {
    setLoading(true);
    try {
      const response = await api.get(`/credentials/project/${projectId}`);
      setCredentials(response.data.data.credentials);
    } catch (err) {
      console.error('Failed to load project credentials', err);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCredential = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        type,
        details
      };
      await api.post(`/credentials/project/${selectedProject}`, payload);
      setModalOpen(false);

      // Reset
      setTitle('');
      setType('API Key');
      setDetails('');

      fetchCredentials(selectedProject);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to secure credential');
    }
  };

  const handleDeleteCredential = async (credId) => {
    if (!window.confirm('Are you sure you want to delete this secret?')) return;
    try {
      await api.delete(`/credentials/${credId}`);
      fetchCredentials(selectedProject);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete secret');
    }
  };

  const toggleReveal = (id) => {
    setRevealMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Database': return <Database className="text-emerald-400" size={18} />;
      case 'Hosting': return <Globe className="text-blue-400" size={18} />;
      case 'SSH': return <Terminal className="text-amber-400" size={18} />;
      case 'Figma': return <Layout className="text-rose-400" size={18} />;
      default: return <Key className="text-violet-400" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
            <Lock className="text-violet-400" size={24} />
            <span>Secure Credential Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Store environment configurations, SSH credentials, database connection strings, and figma details under AES-256 encryption.</p>
        </div>

        <div className="flex items-center space-x-3">
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
          >
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>

          {selectedProject && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all whitespace-nowrap"
            >
              <Plus size={14} />
              <span>Add Secret</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning Notice */}
      <div className="bg-amber-950/15 border border-amber-900/35 p-4 rounded-xl flex items-start space-x-3">
        <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={16} />
        <p className="text-[11px] text-amber-300 leading-relaxed">
          <strong>Security Notice</strong>: Access logs are recorded whenever secrets are decrypted. Always practice safety and avoid storing long-lived personal production passwords.
        </p>
      </div>

      {/* Credentials Grid */}
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-500 text-sm">
          No secure credentials logged for this project.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentials.map((c) => (
            <div key={c._id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-850">
                    {getIcon(c.type)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{c.title}</h4>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase">{c.type}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleDeleteCredential(c._id)}
                  className="p-1 rounded bg-slate-950 hover:bg-red-950/30 text-slate-500 hover:text-red-400 border border-slate-850 transition-all"
                  title="Remove credential"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Secure content details container */}
              <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-300 truncate max-w-[200px] select-all">
                  {revealMap[c._id] ? c.decryptedDetails : '••••••••••••••••'}
                </span>
                <button
                  onClick={() => toggleReveal(c._id)}
                  className="text-slate-400 hover:text-slate-200 transition-colors ml-2"
                >
                  {revealMap[c._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Stored by: <strong className="text-slate-400">{c.createdBy?.name || 'Admin'}</strong></span>
                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Secure New Project Credential">
        <form onSubmit={handleCreateCredential} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Credential Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g. AWS Production Database Link"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Credential Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              >
                <option value="Database">Database Link</option>
                <option value="Hosting">Hosting Service</option>
                <option value="SSH">SSH Key / Keys</option>
                <option value="Figma">Figma Mockup</option>
                <option value="API Key">API Secret Key</option>
                <option value="Other">Other Connection Details</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Secret Parameter Value (Details)</label>
            <textarea 
              rows={4}
              required
              placeholder="Paste password, ssh-rsa key, or connection string here..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 font-mono outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Encrypt & Save Secret
          </button>
        </form>
      </Modal>

    </div>
  );
}
