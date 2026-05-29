import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import { Users, UserPlus, Mail, Shield, Trash2, Key, ToggleLeft, ToggleRight, X, Save, Edit3, Search, PlusCircle } from 'lucide-react';

const ROLES = ['Super Admin', 'Admin', 'Project Manager', 'Developer', 'Designer', 'QA', 'Client'];
const DEPARTMENTS = ['Engineering', 'Design', 'QA', 'Management', 'Operations', 'Client'];

export default function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetPwUser, setResetPwUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [projects, setProjects] = useState([]);
  const [taskUser, setTaskUser] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', project: '', description: '', priority: 'Medium', dueDate: '', estimatedHours: '' });
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Developer', department: 'Engineering' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data.projects || []);
      if (res.data.data.projects.length > 0) {
        setTaskForm(prev => ({ ...prev, project: res.data.data.projects[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post('/users', form);
      setShowCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'Developer', department: 'Engineering' });
      fetchUsers();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.put(`/users/${editUser._id}`, { name: editUser.name, role: editUser.role, department: editUser.department });
      setEditUser(null);
      fetchUsers();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update user'); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (userId) => {
    try { await api.put(`/users/${userId}/toggle-active`); fetchUsers(); }
    catch (err) { alert('Failed to toggle user status'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.put(`/users/${resetPwUser._id}/reset-password`, { password: newPassword });
      setResetPwUser(null); setNewPassword('');
      alert('Password reset successfully');
    } catch (err) { setError(err.response?.data?.message || 'Failed to reset password'); }
    finally { setSaving(false); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = {
        title: taskForm.title,
        project: taskForm.project,
        description: taskForm.description,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || null,
        estimatedHours: Number(taskForm.estimatedHours) || 0,
        assignees: [taskUser._id]
      };
      await api.post('/tasks', payload);
      setTaskUser(null);
      setTaskForm({ title: '', project: projects[0]?._id || '', description: '', priority: 'Medium', dueDate: '', estimatedHours: '' });
      alert('Task assigned successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try { await api.delete(`/users/${userId}`); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete user'); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role) => {
    const colors = {
      'Super Admin': 'bg-red-950 text-red-400 border-red-800',
      'Admin': 'bg-amber-950 text-amber-400 border-amber-800',
      'Project Manager': 'bg-blue-950 text-blue-400 border-blue-800',
      'Developer': 'bg-emerald-950 text-emerald-400 border-emerald-800',
      'Designer': 'bg-pink-950 text-pink-400 border-pink-800',
      'QA': 'bg-violet-950 text-violet-400 border-violet-800',
      'Client': 'bg-slate-800 text-slate-400 border-slate-700',
    };
    return colors[role] || 'bg-slate-800 text-slate-400 border-slate-700';
  };

  if (currentUser?.role !== 'Super Admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Shield size={40} className="text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-200">Access Denied</h2>
          <p className="text-xs text-slate-500">Only Super Admins can access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
            <Shield className="text-violet-400" />
            <span>User Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Create, manage, and control access for all platform users.</p>
        </div>
        <button onClick={() => { setShowCreateModal(true); setError(''); }} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors shadow-lg shadow-violet-600/10">
          <UserPlus size={14} />
          <span>Create New User</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 max-w-md">
        <Search size={14} className="text-slate-500" />
        <input type="text" placeholder="Search by name, email, or role..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-slate-200 outline-none w-full placeholder-slate-500" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: users.length, color: 'violet' },
          { label: 'Active', value: users.filter(u => u.isActive).length, color: 'emerald' },
          { label: 'Inactive', value: users.filter(u => !u.isActive).length, color: 'red' },
          { label: 'Admins', value: users.filter(u => ['Super Admin', 'Admin'].includes(u.role)).length, color: 'amber' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</span>
            <p className={`text-2xl font-black text-${s.color}-400 mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(u => (
                  <tr key={u._id} className={`hover:bg-slate-800/30 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-sm">
                          {u.name?.charAt(0).toUpperCase()}{u.name?.split(" ")[1]?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${roleBadge(u.role)}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.department || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${u.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => { setTaskUser(u); setError(''); }} title="Assign Quick Task" className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-450 transition-colors"><PlusCircle size={13} /></button>
                        <button onClick={() => { setEditUser({ ...u }); setError(''); }} title="Edit" className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"><Edit3 size={13} /></button>
                        <button onClick={() => { setResetPwUser(u); setNewPassword(''); setError(''); }} title="Reset Password" className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"><Key size={13} /></button>
                        <button onClick={() => handleToggleActive(u._id)} title={u.isActive ? 'Suspend' : 'Activate'} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-violet-400 transition-colors">
                          {u.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        </button>
                        {u.role !== 'Super Admin' && (
                          <button onClick={() => handleDelete(u._id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-950/50 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <Modal title="Create New User" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-2 rounded-lg">{error}</p>}
            <Field label="Full Name" type="text" required value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="John Doe" />
            <Field label="Email" type="email" required value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="john@company.com" />
            <Field label="Password" type="password" required value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="Min 6 characters" />
            <SelectField label="Role" value={form.role} options={ROLES} onChange={v => setForm({ ...form, role: v })} />
            <SelectField label="Department" value={form.department} options={DEPARTMENTS} onChange={v => setForm({ ...form, department: v })} />
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><UserPlus size={13} /><span>Create User</span></>}
            </button>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <Modal title={`Edit — ${editUser.name}`} onClose={() => setEditUser(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-2 rounded-lg">{error}</p>}
            <Field label="Full Name" type="text" required value={editUser.name} onChange={v => setEditUser({ ...editUser, name: v })} />
            <SelectField label="Role" value={editUser.role} options={ROLES} onChange={v => setEditUser({ ...editUser, role: v })} />
            <SelectField label="Department" value={editUser.department} options={DEPARTMENTS} onChange={v => setEditUser({ ...editUser, department: v })} />
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Save size={13} /><span>Save Changes</span></>}
            </button>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetPwUser && (
        <Modal title={`Reset Password — ${resetPwUser.name}`} onClose={() => setResetPwUser(null)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-2 rounded-lg">{error}</p>}
            <p className="text-[10px] text-slate-400">Set a new password for <strong className="text-slate-200">{resetPwUser.email}</strong></p>
            <Field label="New Password" type="password" required value={newPassword} onChange={setNewPassword} placeholder="Min 6 characters" />
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Key size={13} /><span>Reset Password</span></>}
            </button>
          </form>
        </Modal>
      )}

      {/* Assign Task Modal */}
      {taskUser && (
        <Modal title={`Assign Task to ${taskUser.name}`} onClose={() => setTaskUser(null)}>
          <form onSubmit={handleCreateTask} className="space-y-4">
            {error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-2 rounded-lg">{error}</p>}

            <Field label="Task Title" type="text" required value={taskForm.title} onChange={v => setTaskForm({ ...taskForm, title: v })} placeholder="E.g., Review PR or setup database" />

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Project</label>
              <select
                value={taskForm.project}
                onChange={e => setTaskForm({ ...taskForm, project: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                required
              >
                <option value="">Select Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
              <textarea
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Scope of work details..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <Field label="Est. Hours" type="number" value={taskForm.estimatedHours} onChange={v => setTaskForm({ ...taskForm, estimatedHours: v })} placeholder="4" />
            </div>

            <Field label="Due Date" type="date" value={taskForm.dueDate} onChange={v => setTaskForm({ ...taskForm, dueDate: v })} />

            <button type="submit" disabled={saving} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><PlusCircle size={13} /><span>Assign & Create Task</span></>}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ── Reusable tiny components ─────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 z-10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-sm text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, type, required, value, onChange, placeholder }: { label: any; type: any; required?: any; value: any; onChange: any; placeholder?: any }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500 transition-colors" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
