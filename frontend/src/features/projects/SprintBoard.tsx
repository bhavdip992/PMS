import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import Modal from '../../components/Modal.tsx';
import { 
  Play, 
  CheckCircle2, 
  Calendar, 
  Target, 
  Plus, 
  TrendingUp, 
  BarChart2, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Zap
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SprintBoardProps {
  projectId: string;
  projectTasks: any[];
  onTaskUpdated: () => void;
  teamMembers: any[];
}

export default function SprintBoard({ projectId, projectTasks, onTaskUpdated, teamMembers }: SprintBoardProps) {
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedSprintId, setExpandedSprintId] = useState<string | null>(null);
  const [burndownData, setBurndownData] = useState<any[]>([]);
  const [burndownSprintId, setBurndownSprintId] = useState<string | null>(null);

  // Form states for creating a Sprint
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState('');

  // Selected tasks for planning sprint
  const [selectedSprintTasks, setSelectedSprintTasks] = useState<string[]>([]);

  useEffect(() => {
    fetchSprints();
  }, [projectId]);

  const fetchSprints = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/sprints`);
      setSprints(res.data.data.sprints || []);
    } catch (err) {
      console.error('Failed to fetch sprints', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        goal,
        startDate,
        endDate,
        capacity: Number(capacity) || 0
      };
      await api.post(`/projects/${projectId}/sprints`, payload);
      setModalOpen(false);
      setName('');
      setGoal('');
      setStartDate('');
      setEndDate('');
      setCapacity('');
      fetchSprints();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create sprint');
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      await api.post(`/projects/${projectId}/sprints/${sprintId}/start`);
      fetchSprints();
      onTaskUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start sprint');
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    if (window.confirm('Completing this sprint will calculate velocity and move all unfinished tasks back to the backlog. Continue?')) {
      try {
        await api.post(`/projects/${projectId}/sprints/${sprintId}/complete`);
        setBurndownSprintId(null);
        setBurndownData([]);
        fetchSprints();
        onTaskUpdated();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to complete sprint');
      }
    }
  };

  const loadBurndown = async (sprintId: string) => {
    try {
      const res = await api.get(`/projects/${projectId}/sprints/${sprintId}/burndown`);
      setBurndownData(res.data.data.burndown.burndownData || []);
      setBurndownSprintId(sprintId);
    } catch (err) {
      console.error('Failed to load burndown data', err);
    }
  };

  const handleSaveSprintTasks = async (sprintId: string) => {
    try {
      await api.patch(`/projects/${projectId}/sprints/${sprintId}`, {
        tasks: selectedSprintTasks
      });
      alert('Sprint tasks updated successfully!');
      fetchSprints();
      onTaskUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save sprint tasks');
    }
  };

  const toggleExpandSprint = (sprintId: string, currentTasks: any[], status: string) => {
    if (expandedSprintId === sprintId) {
      setExpandedSprintId(null);
    } else {
      setExpandedSprintId(sprintId);
      setSelectedSprintTasks(currentTasks.map(t => t._id || t));
      if (status === 'active') {
        loadBurndown(sprintId);
      }
    }
  };

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedSprintTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-[hsl(var(--espark-primary))/0.2] border-t-[hsl(var(--espark-primary))] rounded-full animate-spin" />
      </div>
    );
  }

  const activeSprint = sprints.find(s => s.status === 'active');
  const planningSprints = sprints.filter(s => s.status === 'planning');
  const completedSprints = sprints.filter(s => s.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-[hsl(var(--espark-text))] flex items-center space-x-2">
            <Zap className="text-[hsl(var(--espark-warning))]" />
            <span>Sprint Control Board</span>
          </h2>
          <p className="text-[10px] text-[hsl(var(--espark-muted))] mt-1">Plan iterations, track active burndown logs, and monitor team velocity.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] text-white text-xs font-bold rounded-xl transition-all"
        >
          <Plus size={14} />
          <span>New Sprint</span>
        </button>
      </div>

      {/* Active Sprint Section */}
      {activeSprint && (
        <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[hsl(var(--espark-border))/0.6]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-[hsl(var(--espark-warning))/0.15] text-[hsl(var(--espark-warning))] border border-[hsl(var(--espark-warning))/0.3] px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">
                  Active Sprint
                </span>
                <span className="text-sm font-bold text-[hsl(var(--espark-text))]">{activeSprint.name}</span>
              </div>
              {activeSprint.goal && (
                <p className="text-xs text-[hsl(var(--espark-muted))] mt-1.5 flex items-center space-x-1">
                  <Target size={12} />
                  <span>Goal: {activeSprint.goal}</span>
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] flex items-center space-x-1 bg-[hsl(var(--espark-bg))] px-3 py-1.5 rounded-xl border border-[hsl(var(--espark-border))/0.5]">
                <Calendar size={12} />
                <span>{new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}</span>
              </span>

              <button
                onClick={() => handleCompleteSprint(activeSprint._id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[hsl(var(--espark-success))] hover:bg-[hsl(var(--espark-success))] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <CheckCircle2 size={13} />
                <span>Complete Sprint</span>
              </button>
            </div>
          </div>

          {/* Burndown and Telemetry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Burndown Chart */}
            <div className="lg:col-span-2 bg-[hsl(var(--espark-bg))]/40 border border-[hsl(var(--espark-border))/0.6] p-4 rounded-2xl h-[260px] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] uppercase flex items-center space-x-1.5">
                <BarChart2 size={12} />
                <span>Sprint Burndown (Hours)</span>
              </span>

              {burndownData.length > 0 ? (
                <div className="w-full h-[200px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={burndownData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} />
                      <YAxis stroke="#94a3b8" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', fontSize: '10px' }} />
                      <Legend fontSize={9} />
                      <Line type="monotone" dataKey="remainingHours" name="Remaining" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="idealHours" name="Ideal" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-[hsl(var(--espark-muted))] italic">
                  Loading burndown charts...
                </div>
              )}
            </div>

            {/* Active Sprint Summary Stats */}
            <div className="bg-[hsl(var(--espark-bg))]/45 border border-[hsl(var(--espark-border))/0.6] p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[hsl(var(--espark-muted))] uppercase">Telemetry Summary</span>
              
              <div className="space-y-4 my-2.5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-[hsl(var(--espark-muted))]">Sprint Completion</span>
                    <span className="text-[hsl(var(--espark-text))]">
                      {projectTasks.filter(t => t.sprintId === activeSprint._id && t.status === 'Done').length} / {projectTasks.filter(t => t.sprintId === activeSprint._id).length} Tasks
                    </span>
                  </div>
                  <div className="w-full bg-[hsl(var(--espark-surface))] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ 
                        width: `${
                          projectTasks.filter(t => t.sprintId === activeSprint._id).length > 0 
                            ? (projectTasks.filter(t => t.sprintId === activeSprint._id && t.status === 'Done').length / projectTasks.filter(t => t.sprintId === activeSprint._id).length) * 100 
                            : 0
                        }%` 
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[hsl(var(--espark-surface))] p-3 rounded-xl border border-[hsl(var(--espark-border))/0.5]">
                    <span className="text-[9px] font-bold text-[hsl(var(--espark-muted))] block uppercase">Capacity</span>
                    <span className="text-lg font-black text-[hsl(var(--espark-text))]">{activeSprint.capacity || 0}h</span>
                  </div>
                  <div className="bg-[hsl(var(--espark-surface))] p-3 rounded-xl border border-[hsl(var(--espark-border))/0.5]">
                    <span className="text-[9px] font-bold text-[hsl(var(--espark-muted))] block uppercase">Est. Allocated</span>
                    <span className="text-lg font-black text-[hsl(var(--espark-text))]">
                      {projectTasks.filter(t => t.sprintId === activeSprint._id).reduce((sum, t) => sum + (t.estimatedHours || 0), 0)}h
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-[hsl(var(--espark-muted))] leading-relaxed">
                * Tasks that remain unfinished at completion will automatically revert to the project backlog.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planning / Sprints List */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-xs text-[hsl(var(--espark-muted))] uppercase tracking-wider">
          Sprints Planning & Backlog
        </h3>

        {planningSprints.length === 0 && !activeSprint && (
          <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-8 rounded-2xl text-center text-xs text-[hsl(var(--espark-muted))]">
            No sprints planned. Click "New Sprint" to configure your first iteration.
          </div>
        )}

        {planningSprints.map((s) => {
          const isExpanded = expandedSprintId === s._id;
          const sprintAllocatedTasks = projectTasks.filter(t => t.sprintId === s._id);
          const totalSprintHours = sprintAllocatedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

          return (
            <div 
              key={s._id}
              className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Sprint Header Panel */}
              <div 
                onClick={() => toggleExpandSprint(s._id, s.tasks || [], s.status)}
                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-[hsl(var(--espark-surface-2))]/30 transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-950 text-blue-400 border border-blue-900 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">
                      Planning
                    </span>
                    <span className="text-xs font-bold text-[hsl(var(--espark-text))]">{s.name}</span>
                  </div>
                  {s.goal && <p className="text-[10px] text-[hsl(var(--espark-muted))] mt-1">Goal: {s.goal}</p>}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-[10px] text-[hsl(var(--espark-muted))] text-right font-medium">
                    <div>Timeline: {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</div>
                    <div className="mt-0.5">Capacity: <strong className="text-[hsl(var(--espark-text))]">{s.capacity}h</strong> | Allocated: <strong className="text-[hsl(var(--espark-text))]">{totalSprintHours}h</strong></div>
                  </div>

                  <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleStartSprint(s._id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <Play size={12} fill="white" />
                      <span>Start</span>
                    </button>
                    <button className="p-1 rounded bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[hsl(var(--espark-muted))]">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Task Planning Expanded Matrix */}
              {isExpanded && (
                <div className="p-5 bg-[hsl(var(--espark-bg))]/30 border-t border-[hsl(var(--espark-border))/0.6] space-y-4">
                  <div>
                    <h4 className="text-[11px] font-black text-[hsl(var(--espark-muted))] uppercase tracking-wider mb-2">Configure tasks in sprint</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {projectTasks.map((t) => {
                        const isAllocatedToThis = selectedSprintTasks.includes(t._id);
                        return (
                          <div 
                            key={t._id}
                            onClick={() => handleToggleTaskSelection(t._id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex justify-between items-center text-xs ${
                              isAllocatedToThis 
                                ? 'bg-[hsl(var(--espark-primary))/0.1] border-[hsl(var(--espark-primary))]' 
                                : 'bg-[hsl(var(--espark-surface))] border-[hsl(var(--espark-border))/0.6] hover:border-[hsl(var(--espark-border))]'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <input 
                                type="checkbox"
                                checked={isAllocatedToThis}
                                readOnly
                                className="rounded border-slate-700 text-[hsl(var(--espark-primary))] focus:ring-0"
                              />
                              <span className="font-bold text-[hsl(var(--espark-text))] truncate">{t.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[hsl(var(--espark-muted))]">{t.estimatedHours || 0}h</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleSaveSprintTasks(s._id)}
                      className="px-3.5 py-1.5 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Save Allocation
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completed Sprints telemetry history */}
      {completedSprints.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-xs text-[hsl(var(--espark-muted))] uppercase tracking-wider flex items-center space-x-2">
            <TrendingUp size={13} className="text-[hsl(var(--espark-success))]" />
            <span>Velocity & Completed Iterations</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {completedSprints.map((s) => (
              <div 
                key={s._id}
                className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-[hsl(var(--espark-text))]">{s.name}</span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.2 rounded font-black text-[8px] uppercase">
                      Completed
                    </span>
                  </div>
                  {s.goal && <p className="text-[10px] text-[hsl(var(--espark-muted))] mt-1 line-clamp-1">Goal: {s.goal}</p>}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[hsl(var(--espark-border))/0.4]">
                  <span className="text-[10px] text-[hsl(var(--espark-muted))] font-bold">Velocity (Est. Hours Done):</span>
                  <span className="text-sm font-black text-[hsl(var(--espark-success))]">{s.velocity || 0}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Sprint Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Configure Iteration Sprint">
        <form onSubmit={handleCreateSprint} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Sprint Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 1 - V1.0 Release"
              className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2.5 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Sprint Goal</label>
            <textarea 
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Finalize backend service layer authentication"
              className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Start Date</label>
              <input 
                type="date" 
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">End Date</label>
              <input 
                type="date" 
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Total Capacity (Hours)</label>
            <input 
              type="number" 
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 80"
              className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Create Sprint
          </button>
        </form>
      </Modal>
    </div>
  );
}
