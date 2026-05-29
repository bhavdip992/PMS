import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import StatsCard from './widgets/StatsCard.tsx';
import ChartCard from './widgets/ChartCard.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import { CheckSquare, CheckCircle, AlertCircle, Clock, Calendar, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DeveloperDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, projRes, taskRes, logsRes, subtasksRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/timelogs'),
        api.get('/subtasks').catch(() => ({ data: { data: { subtasks: [] } } }))
      ]);

      setStats(statsRes.data.data.stats);
      
      const loadedProjects = projRes.data.data.projects || [];
      setProjects(loadedProjects);
      
      const allTasks = taskRes.data.data.tasks || [];
      const assigned = allTasks.filter((t: any) =>
        t.assignees?.some((a: any) => a._id === user?._id)
      );
      
      const allSubtasks = subtasksRes.data.data.subtasks || [];
      const assignedSubtasks = allSubtasks.filter((s: any) =>
        (s.assignee?._id || s.assignee) === user?._id && s.status !== 'Done'
      );

      const mappedSubtasks = assignedSubtasks.map((s: any) => ({
        _id: s._id,
        isSubtask: true,
        title: s.title,
        parentTitle: s.parentTask?.title || 'Parent Task',
        project: { name: s.parentTask?.project?.name || 'Internal' },
        priority: 'Medium',
        status: s.status,
        dueDate: s.dueDate
      }));

      const combinedTasks = [
        ...assigned.filter((t: any) => t.status !== 'Done').map((t: any) => ({
          _id: t._id,
          isSubtask: false,
          title: t.title,
          project: t.project,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate
        })),
        ...mappedSubtasks
      ];

      // Sort by due date ascending (soonest due first, items without due date last)
      combinedTasks.sort((a: any, b: any) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setMyTasks(combinedTasks);
      
      setTimeLogs(logsRes.data.data.timeLogs || []);

      if (loadedProjects.length > 0) {
        try {
          const actRes = await api.get(`/projects/${loadedProjects[0]._id}/activities`);
          setActivities(actRes.data.data.activities || []);
        } catch (actErr) {
          console.warn('Failed to load activity logs for project', actErr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Developer dashboard metrics', err);
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

  if (loading || !stats) {
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
          title="My Active Tasks" 
          value={stats.myOpenTasks} 
          icon={CheckSquare} 
          colorClass="text-violet-400 bg-violet-500/10" 
        />
        <StatsCard 
          title="My Finished Tasks" 
          value={stats.myCompletedTasks} 
          icon={CheckCircle} 
          colorClass="text-emerald-400 bg-emerald-500/10" 
        />
        <StatsCard 
          title="My Overdue Tasks" 
          value={stats.myOverdueTasks} 
          icon={AlertCircle} 
          colorClass="text-rose-400 bg-rose-500/10" 
          delta={stats.myOverdueTasks > 0 ? `${stats.myOverdueTasks} critical` : 'None'}
          deltaType={stats.myOverdueTasks > 0 ? 'negative' : 'positive'}
        />
        <StatsCard 
          title="My Logged Hours" 
          value={`${stats.totalHours} hrs`} 
          icon={Clock} 
          colorClass="text-indigo-400 bg-indigo-500/10" 
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work board */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl lg:col-span-2">
          <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
            <CheckSquare size={16} className="text-violet-400" />
            <span>Assigned To Me ({myTasks.length})</span>
          </h3>
          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {myTasks.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500">No open tasks assigned. Good work!</p>
            ) : (
              myTasks.map(t => (
                <div key={t._id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex justify-between items-center hover:border-slate-800 transition-colors">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-200">{t.title}</h4>
                      {t.isSubtask && (
                        <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-900 font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wide">Subtask</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center flex-wrap gap-2">
                      {t.isSubtask ? (
                        <span>Parent task: <strong className="text-slate-400">{t.parentTitle}</strong> | Project: {t.project?.name || 'Internal'}</span>
                      ) : (
                        <span>Project: {t.project?.name || 'Unassigned'} | Priority: {t.priority}</span>
                      )}
                      {t.dueDate && (
                        <span className={`pl-2 border-l border-slate-800 flex items-center gap-1 ${
                          new Date(t.dueDate) < new Date() && t.status !== 'Done' ? 'text-red-400 font-bold' : 'text-slate-400'
                        }`}>
                          <Clock size={10} />
                          <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-[9px] bg-slate-800 text-slate-350 border border-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Time Analysis Chart */}
        <ChartCard title="My Time Analysis" icon={Clock} iconColorClass="text-emerald-400">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyLogged} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="devHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="hours" stroke="#34d399" fillOpacity={1} fill="url(#devHours)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Projects and Sprints / Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Project Sprints */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
            <Calendar size={16} className="text-indigo-400" />
            <span>Active Project Sprints</span>
          </h3>
          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {projects.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">No projects linked to your account</p>
            ) : (
              projects.map(p => (
                <div key={p._id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{p.name}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 inline-block">Status: {p.status}</span>
                  </div>
                  <span className="text-[10px] font-bold text-violet-400">{p.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
            <Activity size={16} className="text-violet-400" />
            <span>Recent Activity Feed</span>
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">No recent activities on your projects</p>
            ) : (
              activities.map(a => (
                <div key={a._id} className="text-[11px] pb-2 border-b border-slate-850 text-slate-350 flex justify-between">
                  <div>
                    <span className="font-extrabold text-slate-200">{a.user?.name}</span>
                    <span className="mx-1 text-slate-500 font-semibold">{a.action?.toLowerCase().replace(/_/g, ' ')}</span>
                    <span className="font-bold text-indigo-400">"{a.task?.title || 'task'}"</span>
                  </div>
                  <span className="text-[9px] text-slate-500">
                    {(() => {
                      const d = new Date(a.createdAt);
                      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleTimeString();
                    })()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
