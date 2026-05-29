import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import Modal from '../../components/Modal.tsx';
import { 
  Milestone as MilestoneIcon, 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Trash2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface MilestoneTrackerProps {
  projectId: string;
  projectTasks: any[];
  onTaskUpdated: () => void;
}

export default function MilestoneTracker({ projectId, projectTasks, onTaskUpdated }: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/milestones?project=${projectId}`);
      setMilestones(res.data.data.milestones || []);
    } catch (err) {
      console.error('Failed to fetch milestones', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        dueDate: dueDate || undefined,
        project: projectId
      };
      await api.post('/milestones', payload);
      setModalOpen(false);
      setName('');
      setDescription('');
      setDueDate('');
      fetchMilestones();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create milestone');
    }
  };

  const handleToggleMilestoneStatus = async (milestoneId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Achieved' : 'Active';
    try {
      await api.put(`/milestones/${milestoneId}`, { status: nextStatus });
      fetchMilestones();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update milestone status');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      try {
        await api.delete(`/milestones/${milestoneId}`);
        fetchMilestones();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete milestone');
      }
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-[hsl(var(--espark-primary))/0.2] border-t-[hsl(var(--espark-primary))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-[hsl(var(--espark-text))] flex items-center space-x-2">
            <MilestoneIcon className="text-[hsl(var(--espark-primary))]" />
            <span>Project Milestones</span>
          </h2>
          <p className="text-[10px] text-[hsl(var(--espark-muted))] mt-1">Track high-level achievements, billing targets, and final phase deadlines.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] text-white text-xs font-bold rounded-xl transition-all"
        >
          <Plus size={14} />
          <span>New Milestone</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {milestones.length === 0 ? (
          <div className="col-span-2 bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] p-8 rounded-2xl text-center text-xs text-[hsl(var(--espark-muted))]">
            No milestones defined for this project.
          </div>
        ) : (
          milestones.map((m) => {
            const milestoneTasks = projectTasks.filter(t => t.milestone?._id === m._id || t.milestone === m._id);
            const completedMilestoneTasks = milestoneTasks.filter(t => t.status === 'Done');
            const percentComplete = milestoneTasks.length > 0 
              ? Math.round((completedMilestoneTasks.length / milestoneTasks.length) * 100)
              : 0;

            return (
              <div 
                key={m._id}
                className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          m.status === 'Achieved' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                            : 'bg-blue-950 text-blue-400 border border-blue-900'
                        }`}>
                          {m.status}
                        </span>
                        <h4 className="text-sm font-bold text-[hsl(var(--espark-text))]">{m.name}</h4>
                      </div>
                      {m.description && (
                        <p className="text-xs text-[hsl(var(--espark-muted))] leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteMilestone(m._id)}
                      className="p-1 rounded bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[hsl(var(--espark-muted))] hover:text-red-400 transition-colors"
                      title="Delete Milestone"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-[hsl(var(--espark-muted))] font-bold">
                    <span>Task Completion</span>
                    <span>{completedMilestoneTasks.length} / {milestoneTasks.length} Tasks ({percentComplete}%)</span>
                  </div>
                  <div className="w-full bg-[hsl(var(--espark-bg))] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${m.status === 'Achieved' ? 'bg-[hsl(var(--espark-success))]' : 'bg-[hsl(var(--espark-primary))]'}`}
                      style={{ width: `${percentComplete}%` }}
                    />
                  </div>
                </div>

                {/* Footer panel */}
                <div className="pt-3 border-t border-[hsl(var(--espark-border))/0.4] flex justify-between items-center text-[10px] text-[hsl(var(--espark-muted))] font-medium">
                  <span className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}</span>
                  </span>

                  <button
                    onClick={() => handleToggleMilestoneStatus(m._id, m.status)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                      m.status === 'Achieved'
                        ? 'bg-[hsl(var(--espark-success))/0.1] border-[hsl(var(--espark-success))/0.3] text-[hsl(var(--espark-success))]'
                        : 'bg-[hsl(var(--espark-primary))/0.1] border-[hsl(var(--espark-primary))/0.3] text-[hsl(var(--espark-primary))]'
                    }`}
                  >
                    {m.status === 'Achieved' ? (
                      <>
                        <CheckCircle2 size={11} />
                        <span>Achieved</span>
                      </>
                    ) : (
                      <>
                        <Clock size={11} />
                        <span>Mark Achieved</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Milestone Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Configure Milestone Target">
        <form onSubmit={handleCreateMilestone} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Milestone Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Phase 1 - Alpha Release Demo"
              className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2.5 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Description</label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail milestone goals and specifications..."
              className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[hsl(var(--espark-muted))] uppercase mb-1.5">Target Due Date</label>
            <input 
              type="date" 
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] rounded-xl px-4 py-2.5 text-xs text-[hsl(var(--espark-text))] outline-none focus:border-[hsl(var(--espark-primary))]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Create Milestone
          </button>
        </form>
      </Modal>
    </div>
  );
}
