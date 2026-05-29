import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.tsx';
import Modal from '../../components/Modal.tsx';
import { 
  FolderKanban, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Mail,
  AlertCircle
} from 'lucide-react';
import ProjectOverviewDrawer from './ProjectOverviewDrawer.tsx';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Overview Drawer States
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [overviewOpen, setOverviewOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [budgetHours, setBudgetHours] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('In Progress');
  const [assignees, setAssignees] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  useEffect(() => {
    fetchProjectsAndTeam();
    fetchAvailableTags();
  }, []);

  const fetchAvailableTags = async () => {
    try {
      const res = await api.get('/tags');
      setAvailableTags(res.data.data.tags || []);
    } catch (err) {
      console.error('Failed to load available tags', err);
    }
  };

  const fetchProjectsAndTeam = async () => {
    setLoading(true);
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users')
      ]);
      setProjects(projRes.data.data.projects);
      const activeUsers = (usersRes.data.data.users || []).filter(u => u.isActive !== false);
      setTeamMembers(activeUsers);
    } catch (err) {
      console.error('Failed to load project page data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        client: {
          name: clientName,
          company: clientCompany,
          email: clientEmail
        },
        budgetHours: Number(budgetHours) || 0,
        priority,
        status,
        assignees,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        tags
      };

      await api.post('/projects', payload);
      setModalOpen(false);
      
      // Reset Form
      setName('');
      setDescription('');
      setClientName('');
      setClientCompany('');
      setClientEmail('');
      setBudgetHours('');
      setPriority('Medium');
      setStatus('In Progress');
      setAssignees([]);
      setStartDate('');
      setEndDate('');
      setTags([]);

      fetchProjectsAndTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleToggleAssignee = (userId) => {
    setAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
            <FolderKanban className="text-violet-400" />
            <span>Agency Projects</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage deliverables, budgets, client data, and status progress.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
        >
          <Plus size={14} />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-500 text-sm">
            No projects created yet. Click the "New Project" button to get started.
          </div>
        ) : (
          projects.map((p) => (
            <div 
              key={p._id} 
              onClick={() => navigate(`/projects/${p._id}`)}
              className="cursor-pointer bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-950/15 transition-all duration-200"
            >
              <div>
                {/* Status + Priority Header */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    p.status === 'In Review' ? 'bg-indigo-500/10 text-indigo-400' :
                    p.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {p.status}
                  </span>
                  
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.priority === 'Critical' ? 'bg-red-500/10 text-red-400' :
                    p.priority === 'High' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {p.priority}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-lg text-slate-100">{p.name}</h3>
                  {p.updatedAt && (new Date().getTime() - new Date((p as any).updatedAt).getTime()) < 24 * 60 * 60 * 1000 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Updated in last 24 hours" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
              </div>

              {/* Progress Tracker */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold">Completion progress</span>
                  <span className="font-black text-slate-200">{p.progress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              {/* Specs & Info */}
              <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Clock size={12} className="text-slate-500" />
                  <span>Budget: <strong className="text-slate-200">{p.budgetHours} hrs</strong></span>
                </div>
                
                {p.client?.company && (
                  <div className="flex items-center space-x-1">
                    <Building2 size={11} className="text-slate-500" />
                    <span className="truncate max-w-[100px] text-slate-200">{p.client.company}</span>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Creation Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Rebrand"
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about project objectives..."
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Budget Hours</label>
              <input 
                type="number" 
                value={budgetHours}
                onChange={(e) => setBudgetHours(e.target.value)}
                placeholder="e.g. 120"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">End Date (Due Date)</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">Client Parameters</h4>
            <div className="grid grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
              <input 
                type="text" 
                placeholder="Company"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
              <input 
                type="email" 
                placeholder="Email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign Team Members</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {teamMembers.length === 0 ? (
                <p className="text-[10px] text-slate-500">No team members registered yet</p>
              ) : (
                teamMembers.map(member => (
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
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Tags</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {availableTags.length === 0 ? (
                <p className="text-[10px] text-slate-500">No workspace tags created. Define them in Profile Settings.</p>
              ) : (
                availableTags.map(tag => {
                  const isSelected = tags.includes(tag.name);
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
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors flex items-center space-x-1"
                      style={{
                        backgroundColor: isSelected ? `${tag.color}25` : 'transparent',
                        borderColor: isSelected ? tag.color : '#334155',
                        color: isSelected ? tag.color : '#64748b'
                      }}
                    >
                      <span>{tag.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Create Project
          </button>
        </form>
      </Modal>

      {/* Project Overview Drawer */}
      <ProjectOverviewDrawer 
        projectId={selectedProjectId}
        isOpen={overviewOpen}
        onClose={() => { setOverviewOpen(false); setSelectedProjectId(null); fetchProjectsAndTeam(); }}
        teamMembers={teamMembers}
        projects={projects}
        onProjectUpdated={fetchProjectsAndTeam}
      />

    </div>
  );
}
