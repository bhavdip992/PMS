import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import StatsCard from './widgets/StatsCard.tsx';
import WorkloadBar from './widgets/WorkloadBar.tsx';
import ChartCard from './widgets/ChartCard.tsx';
import { Layers, CheckSquare, CheckCircle, AlertCircle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [workload, setWorkload] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, workloadRes, summaryRes, logsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/team-workload'),
        api.get('/dashboard/project-summary'),
        api.get('/timelogs')
      ]);
      setStats(statsRes.data.data.stats);
      setWorkload(workloadRes.data.data.workload);
      setSummary(summaryRes.data.data.summary);
      setTimeLogs(logsRes.data.data.timeLogs || []);
    } catch (err) {
      console.error('Failed to fetch Admin dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyTimeLogged = () => {
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    timeLogs.forEach(log => {
      const day = weekday[new Date(log.startTime).getDay()];
      if (day in map) {
        map[day] += (log.duration || 0) / 60;
      }
    });
    return Object.keys(map).map(day => ({
      name: day,
      hours: parseFloat(map[day].toFixed(1))
    }));
  };

  if (loading || !stats || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Loading Analytics...</span>
      </div>
    );
  }

  const weeklyLogged = getWeeklyTimeLogged();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Managed Projects" 
          value={stats.managedProjects} 
          icon={Layers} 
          colorClass="text-violet-400 bg-violet-500/10" 
        />
        <StatsCard 
          title="Unfinished Tasks" 
          value={stats.openTasks} 
          icon={CheckSquare} 
          colorClass="text-amber-400 bg-amber-500/10" 
        />
        <StatsCard 
          title="QA Closed Tasks" 
          value={stats.completedTasks} 
          icon={CheckCircle} 
          colorClass="text-emerald-400 bg-emerald-500/10" 
        />
        <StatsCard 
          title="Critical Deadlines" 
          value={`${stats.overdueTasks} Overdue`} 
          icon={AlertCircle} 
          colorClass="text-rose-400 bg-rose-500/10" 
          delta={stats.overdueTasks > 0 ? 'Action required' : 'All clear'}
          deltaType={stats.overdueTasks > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly team hours */}
        <ChartCard title="Team Weekly Hours Logged" icon={TrendingUp} iconColorClass="text-indigo-400">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyLogged} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="hours" stroke="#6366f1" fillOpacity={1} fill="url(#adminHours)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Project Pipeline */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Project Progress Circles</h3>
            <a href="#/projects" className="text-xs text-indigo-400 hover:text-indigo-350 font-bold flex items-center space-x-0.5">
              <span>View All</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {summary.pipeline?.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500">No managed projects found</p>
            ) : (
              summary.pipeline.slice(0, 5).map((p: any) => (
                <div key={p._id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Status: {p.status}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-slate-850 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-500 h-1.5 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 w-8 text-right">{p.progress || 0}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Team Workload list */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider">
          Active Team Workloads
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workload.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500 col-span-2">No staff workloads mapped</p>
          ) : (
            workload.slice(0, 6).map((member: any) => (
              <WorkloadBar 
                key={member.name} 
                name={member.name} 
                tasksCount={member.Tasks} 
                hoursCount={member.Hours} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
