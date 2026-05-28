import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { Users, Search, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

export default function Workload() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      const [usersRes, tasksRes] = await Promise.all([
        api.get('/users'),
        api.get('/tasks')
      ]);
      setTeamMembers(usersRes.data.data.users || []);
      setTasks(tasksRes.data.data.tasks || []);
    } catch (err) {
      console.error('Failed to load workload metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const getMemberWorkload = (memberId) => {
    const activeTasks = tasks.filter(t =>
      t.status !== 'Done' &&
      (t.assignees || []).some(assignee =>
        (assignee._id ? assignee._id.toString() : assignee.toString()) === memberId.toString()
      )
    );

    const totalHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    let status = 'High Availability';
    let color = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (totalHours > 40) {
      status = 'Overloaded';
      color = 'bg-red-500/10 text-red-400 border-red-500/20';
    } else if (totalHours >= 10) {
      status = 'Optimal';
      color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }

    return { activeTasks, totalHours, status, color };
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
          <Users className="text-violet-400" />
          <span>Workload & Team Availability</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Monitor developer tasks counts, estimated hours, and current allocations status.</p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredMembers.map(member => {
            const { activeTasks, totalHours, status, color } = getMemberWorkload(member._id);

            return (
              <div
                key={member._id}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col space-y-4"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  {/* Member Info */}
                  <div className="flex items-center space-x-4">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-800" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-violet-650 text-sm flex items-center justify-center font-bold text-white uppercase border-2 border-slate-800">
                        {member.name[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{member.name}</h3>
                      <p className="text-xs text-slate-400">{member.role}</p>
                      <p className="text-[10px] text-slate-500">{member.email}</p>
                    </div>
                  </div>

                  {/* Workload Stats */}
                  <div className="flex items-center space-x-6">
                    {/* Active Tasks */}
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Tasks</span>
                      <span className="text-lg font-black text-slate-200">{activeTasks.length}</span>
                    </div>

                    {/* Estimated Hours */}
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Est. Workload</span>
                      <span className="text-lg font-black text-slate-200 flex items-center justify-center space-x-1">
                        <Clock size={14} className="text-slate-500" />
                        <span>{totalHours}h</span>
                      </span>
                    </div>

                    {/* Allocation Status Badge */}
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${color}`}>
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Tasks Summary */}
                  <div className="flex-1 md:max-w-xs w-full bg-slate-950/40 rounded-xl p-3 border border-slate-850 max-h-28 overflow-y-auto">
                    <span className="block text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1.5">Tasks Breakdown</span>
                    {activeTasks.length === 0 ? (
                      <span className="text-[10px] text-slate-600 block">No active tasks assigned. Ready for allocation!</span>
                    ) : (
                      <div className="space-y-1">
                        {activeTasks.map(t => (
                          <div
                            key={t._id}
                            className="flex justify-between items-center text-[10px] py-1 border-b border-slate-900/50 hover:bg-slate-900/40 px-1 rounded transition-colors"
                          >
                            <span className="text-slate-350 truncate max-w-[150px] font-semibold">{t.title}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded ${t.priority === 'Critical' ? 'bg-red-500/10 text-red-400' :
                                t.priority === 'High' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                              {t.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Capacity progress bar */}
                <div className="border-t border-slate-850/60 pt-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1.5">
                    <span>Weekly Capacity Allocation</span>
                    <span className="font-bold text-slate-400">{totalHours}h / 40h ({Math.round((totalHours / 40) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalHours > 40 ? 'bg-red-500' :
                        totalHours >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((totalHours / 40) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
