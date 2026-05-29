import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import StatsCard from './widgets/StatsCard.tsx';
import ChartCard from './widgets/ChartCard.tsx';
import ActivityFeed from './widgets/ActivityFeed.tsx';
import TeamPerformanceTable from './widgets/TeamPerformanceTable.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, Users, AlertCircle, Clock, TrendingUp, Layers, ArrowUpRight } from 'lucide-react';

const COLORS = ['#8b5cf6', '#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [workload, setWorkload] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [productivity, setProductivity] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, workloadRes, summaryRes, prodRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/team-workload'),
        api.get('/dashboard/project-summary'),
        api.get('/dashboard/productivity')
      ]);
      setStats(statsRes.data.data.stats);
      setWorkload(workloadRes.data.data.workload);
      setSummary(summaryRes.data.data.summary);
      setProductivity(prodRes.data.data.productivity);
    } catch (err) {
      console.error('Failed to fetch Super Admin dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Loading Analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Enterprise Projects" 
          value={stats.totalProjects} 
          icon={Briefcase} 
          colorClass="text-violet-400 bg-violet-500/10" 
        />
        <StatsCard 
          title="Active Staff" 
          value={`${stats.activeStaff} Users`} 
          icon={Users} 
          colorClass="text-indigo-400 bg-indigo-500/10" 
        />
        <StatsCard 
          title="Overdue Tasks" 
          value={stats.overdueTasks} 
          icon={AlertCircle} 
          colorClass="text-rose-400 bg-rose-500/10" 
          delta={stats.overdueTasks > 0 ? `${stats.overdueTasks} critical` : 'None'}
          deltaType={stats.overdueTasks > 0 ? 'negative' : 'positive'}
        />
        <StatsCard 
          title="Total Time Tracked" 
          value={`${stats.totalHours} hrs`} 
          icon={Clock} 
          colorClass="text-emerald-400 bg-emerald-500/10" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload bar chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Developer Workload Distribution" icon={TrendingUp} iconColorClass="text-violet-400">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Bar dataKey="Tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Project status pie */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
            <Layers size={16} className="text-indigo-400" />
            <span>Project Health Status</span>
          </h3>
          <div className="h-72 flex flex-col items-center justify-center">
            {summary.statusPie?.length === 0 ? (
              <p className="text-xs text-slate-500">No projects available</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={summary.statusPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {summary.statusPie.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2 text-[10px] font-semibold text-slate-400">
                  {summary.statusPie.map((entry: any, index: number) => (
                    <span key={entry.name} className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name} ({entry.value})</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Tracker */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Active Project Pipeline</h3>
            <a href="#/projects" className="text-xs text-violet-400 hover:text-violet-350 font-bold flex items-center space-x-0.5">
              <span>View All</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {summary.pipeline?.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-500">No active projects logged</p>
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

        {/* Team Performance capacity table */}
        <div className="lg:col-span-2">
          {productivity && <TeamPerformanceTable teams={productivity.teamPerformance} />}
        </div>
      </div>

      {/* Activity logs */}
      {productivity && (
        <ActivityFeed activities={productivity.recentAudits} title="Recent Security & System Logs" />
      )}
    </div>
  );
}
