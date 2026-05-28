import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Clock,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  FileText,
  Calendar,
  Users,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Shield,
  Layers,
  CheckSquare
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Data State
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [standup, setStandup] = useState<any>('');
  const [generatingStandup, setGeneratingStandup] = useState(false);
  const [productivityInsights, setProductivityInsights] = useState<any>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes, commRes, logsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/communications'),
        api.get('/timelogs')
      ]);

      const loadedProjects = projRes.data.data.projects || [];
      const loadedTasks = taskRes.data.data.tasks || [];
      const loadedComms = commRes.data.data.communications || [];
      const loadedLogs = logsRes.data.data.timeLogs || [];

      setProjects(loadedProjects);
      setTasks(loadedTasks);
      setCommunications(loadedComms);
      setTimeLogs(loadedLogs);

      // Fetch activity log for the first active project if any exists
      if (loadedProjects.length > 0) {
        try {
          const actRes = await api.get(`/projects/${loadedProjects[0]._id}/activities`);
          setActivities(actRes.data.data.activities || []);
        } catch (actErr) {
          console.warn('Failed to load activity logs for project', actErr);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStandup = async () => {
    setGeneratingStandup(true);
    setStandup('');
    try {
      const response = await api.get('/ai/standup');
      setStandup(response.data.data.standup);
    } catch (err) {
      console.error(err);
      setStandup('Failed to generate daily standup summary. Please check your network connection.');
    } finally {
      setGeneratingStandup(false);
    }
  };

  const handleFetchInsights = async () => {
    setGeneratingInsights(true);
    setProductivityInsights(null);
    try {
      const response = await api.post('/ai/productivity-insights', {});
      setProductivityInsights(response.data.data.insights);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch productivity insights.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  // ----------------------------------------------------
  // DATA PARSERS & COMPUTATIONS
  // ----------------------------------------------------
  const totalHours = parseFloat(
    (timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / 60).toFixed(1)
  );

  const openTasks = tasks.filter(t => t.status !== 'Done');
  const completedTasks = tasks.filter(t => t.status === 'Done');
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'Done' || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  });

  // Developer specific filtering
  const myAssignedTasks = tasks.filter(t =>
    t.assignees?.some(a => a._id === user?._id)
  );
  const myOpenTasks = myAssignedTasks.filter(t => t.status !== 'Done');
  const myCompletedTasks = myAssignedTasks.filter(t => t.status === 'Done');
  const myOverdueTasks = myOpenTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());

  // Workload mapping for chart
  const getWorkloadData = () => {
    const workload = {};
    tasks.forEach(t => {
      if (t.status !== 'Done' && t.assignees) {
        t.assignees.forEach(a => {
          if (!workload[a.name]) {
            workload[a.name] = { name: a.name, Tasks: 0, Hours: 0 };
          }
          workload[a.name].Tasks += 1;
          workload[a.name].Hours += t.estimatedHours || 0;
        });
      }
    });
    return Object.values(workload).slice(0, 8);
  };

  // Status mapping for projects
  const getProjectStatusPie = () => {
    const statusMap = {};
    projects.forEach(p => {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    });
    return Object.keys(statusMap).map(name => ({
      name,
      value: statusMap[name]
    }));
  };

  // Standup dummy / calculated activity logs representation
  const getWeeklyTimeLogged = () => {
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    timeLogs.forEach(log => {
      const day = weekday[new Date(log.startTime).getDay()];
      map[day] += (log.duration || 0) / 60;
    });
    return Object.keys(map).map(day => ({
      name: day,
      hours: parseFloat(map[day].toFixed(1))
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Loading Dashboard Metrics...</span>
      </div>
    );
  }

  // ----------------------------------------------------
  // SUB-DASHBOARD: SUPER ADMIN
  // ----------------------------------------------------
  const renderSuperAdminDashboard = () => {
    const workload = getWorkloadData();
    const projectPie = getProjectStatusPie();

    return (
      <div className="space-y-6">
        {/* KPI Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Briefcase size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Enterprise Projects</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{projects.length}</h3>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Staff</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{workload.length} Users</h3>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overdue Tasks</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{overdueTasks.length}</h3>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Time Tracked</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{totalHours} hrs</h3>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workload distribution */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl lg:col-span-2">
            <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp size={16} className="text-violet-400" />
              <span>Developer Workload Distribution</span>
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                  <Bar dataKey="Tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project statuses */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
              <Layers size={16} className="text-indigo-400" />
              <span>Project Health Status</span>
            </h3>
            <div className="h-72 flex flex-col items-center justify-center">
              {projectPie.length === 0 ? (
                <p className="text-xs text-slate-500">No projects available</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={projectPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {projectPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2 text-[10px] font-semibold text-slate-400">
                    {projectPie.map((entry, index) => (
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

        {/* Audits & Active Projects Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Projects Tracker */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Active Project Pipeline</h3>
              <a href="/projects" className="text-xs text-violet-400 hover:text-violet-300 font-bold flex items-center space-x-0.5">
                <span>View All</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">No active projects logged</p>
              ) : (
                projects.slice(0, 5).map(p => (
                  <div key={p._id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{p.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Client: {p.client?.name || 'N/A'} | Sprints: {p.sprints?.length || 0}</p>
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

          {/* Audit Logs */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
              <Activity size={16} className="text-emerald-400 animate-pulse" />
              <span>Security & Operation Audit Logs</span>
            </h3>
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">No audit activity logged today</p>
              ) : (
                activities.map(a => (
                  <div key={a._id} className="text-xs border-b border-slate-850 pb-2.5 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center shrink-0">
                      {a.user?.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-slate-300">
                        <span className="font-bold text-slate-100">{a.user?.name}</span>
                        <span className="mx-1 text-slate-500 font-semibold">{a.action?.toLowerCase().replace('_', ' ')}</span>
                        <span className="font-bold text-violet-400">"{a.task?.title || 'task'}"</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(a.createdAt).toLocaleTimeString()} - {new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // SUB-DASHBOARD: ADMIN / TEAM LEAD / PM
  // ----------------------------------------------------
  const renderAdminDashboard = () => {
    const weeklyLogged = getWeeklyTimeLogged();

    return (
      <div className="space-y-6">
        {/* KPI Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Layers size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Managed Projects</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{projects.length}</h3>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CheckSquare size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Unfinished Tasks</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{openTasks.length}</h3>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">QA Closed Tasks</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{completedTasks.length}</h3>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Critical Deadlines</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{overdueTasks.length} Overdue</h3>
            </div>
          </div>
        </div>

        {/* Dynamic charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly team hours logged */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
              <Clock size={16} className="text-violet-400" />
              <span>Team Weekly Hours Logged</span>
            </h3>
            <div className="h-64 w-full">
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
            </div>
          </div>

          {/* Pending items timeline */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
              <AlertCircle size={16} className="text-rose-400 animate-pulse" />
              <span>Team Overdue Deliverables ({overdueTasks.length})</span>
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {overdueTasks.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-500">Perfect! No overdue tasks in your queue.</p>
              ) : (
                overdueTasks.map(t => (
                  <div key={t._id} className="p-3 bg-slate-950/60 border border-red-950/40 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{t.title}</h4>
                      <p className="text-[10px] text-red-400 mt-1">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[9px] bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded-full font-bold uppercase">
                      {t.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Client updates & Team workloads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Client Communications */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <MessageSquare size={16} className="text-indigo-400" />
                <span>Client Communications</span>
              </h3>
              <a href="#/communications" className="text-xs text-indigo-400 hover:underline font-bold">Go logs</a>
            </div>
            <div className="space-y-3">
              {communications.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-500">No communication logs recorded</p>
              ) : (
                communications.slice(0, 4).map(c => (
                  <div key={c._id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200">{c.title}</span>
                      <span className="text-[9px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.2 rounded uppercase">{c.type}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{c.summary || c.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Workload list */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
              <Users size={16} className="text-violet-400" />
              <span>Team Workload Summary</span>
            </h3>
            <div className="space-y-3.5">
              {getWorkloadData().length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-500">No tasks assigned to staff</p>
              ) : (
                getWorkloadData().slice(0, 5).map(member => (
                  <div key={(member as any).name} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">{(member as any).name}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-slate-400 font-semibold">{(member as any).Tasks} active tasks</span>
                      <span className="bg-slate-800 px-2.5 py-0.5 rounded font-bold text-slate-300">{(member as any).Hours} est hrs</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // SUB-DASHBOARD: DEVELOPER / DESIGNER / QA
  // ----------------------------------------------------
  const renderDeveloperDashboard = () => {
    const weeklyLogged = getWeeklyTimeLogged();

    return (
      <div className="space-y-6">
        {/* KPI Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <CheckSquare size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">My Active Tasks</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{myOpenTasks.length}</h3>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">My Finished Tasks</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{myCompletedTasks.length}</h3>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">My Overdue Tasks</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1 text-rose-400">{myOverdueTasks.length}</h3>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">My Logged Hours</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{totalHours} hrs</h3>
            </div>
          </div>
        </div>

        {/* Charts & Tasks Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work board */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl lg:col-span-2">
            <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
              <CheckSquare size={16} className="text-violet-400" />
              <span>Assigned To Me ({myOpenTasks.length})</span>
            </h3>
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {myOpenTasks.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-500">No open tasks assigned. Good work!</p>
              ) : (
                myOpenTasks.map(t => (
                  <div key={t._id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{t.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Project: {t.project?.name} | Priority: {t.priority}</p>
                    </div>
                    <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Productivity Log chart */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
              <Clock size={16} className="text-emerald-400" />
              <span>My Time Analysis</span>
            </h3>
            <div className="h-60 w-full">
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
            </div>
          </div>
        </div>

        {/* Activity timelines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications / Linked project updates */}
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
                      <span className="text-[10px] text-slate-500 mt-0.5 inline-block">Sprints Scheduled: {p.sprints?.length || 0}</span>
                    </div>
                    <span className="text-[10px] font-bold text-violet-400">{p.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activities log related directly to developer */}
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
                  <div key={a._id} className="text-[11px] pb-2 border-b border-slate-850 text-slate-300">
                    <span className="font-bold text-slate-100">{a.user?.name}</span>
                    <span className="mx-1 text-slate-500 font-semibold">{a.action?.toLowerCase().replace('_', ' ')}</span>
                    <span className="font-bold text-indigo-400">"{a.task?.title || 'task'}"</span>
                    <span className="text-[9px] text-slate-500 ml-2">({new Date(a.createdAt).toLocaleTimeString()})</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER SWITCHER BASED ON USER ROLE
  // ----------------------------------------------------
  const renderDashboardByRole = () => {
    switch (user?.role) {
      case 'Super Admin':
        return renderSuperAdminDashboard();
      case 'Admin':
      case 'Project Manager':
        return renderAdminDashboard();
      default:
        return renderDeveloperDashboard();
    }
  };

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-violet-950/20 p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/10 text-white font-black text-lg">
            {user?.name?.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">Welcome back, {user?.name}!</h1>
              <span className="bg-violet-950 text-violet-400 border border-violet-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Shield size={10} />
                <span>{user?.role}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Here is a synthesized overview of your organization workspace metrics today.</p>
          </div>
        </div>
        <button
          onClick={handleGenerateStandup}
          disabled={generatingStandup}
          className="mt-4 md:mt-0 flex items-center justify-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold rounded-xl shadow-lg shadow-violet-600/15 transition-all text-xs border border-violet-500/20"
        >
          <Sparkles size={13} className={generatingStandup ? 'animate-spin' : ''} />
          <span>{generatingStandup ? 'Synthesizing...' : 'Generate Daily Standup'}</span>
        </button>
      </div>

      {/* Standup Result Panel */}
      {(() => {
        if (!standup) return null;

        let parsedStandup: any = null;
        if (typeof standup === 'object' && standup !== null) {
          parsedStandup = standup;
        } else if (typeof standup === 'string') {
          try {
            parsedStandup = JSON.parse(standup);
          } catch (e) {
            // fall back to string rendering
          }
        }

        return (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden animate-fadeIn space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl" />
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-xs text-violet-400 flex items-center space-x-2 uppercase tracking-wider">
                <Sparkles size={14} className="text-violet-400" />
                <span>AI Generated Daily Standup Report</span>
              </h3>
              <button
                onClick={() => setStandup('')}
                className="text-xs text-slate-500 hover:text-slate-300 font-semibold"
              >
                Clear
              </button>
            </div>

            {parsedStandup ? (
              <div className="space-y-4 text-xs sm:text-sm text-slate-350">
                {/* Summary */}
                <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl">
                  <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider block mb-1">Executive Summary</span>
                  <p className="font-medium text-slate-200">{parsedStandup.summary}</p>
                </div>

                {/* Updates grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Completed */}
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block border-b border-emerald-900/30 pb-1">Completed Yesterday</span>
                    <ul className="list-disc ml-4 space-y-1 text-slate-300">
                      {parsedStandup.updates?.completed?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      )) || <li>No tasks recorded.</li>}
                    </ul>
                  </div>

                  {/* Today Focus */}
                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block border-b border-indigo-900/30 pb-1">Focus for Today</span>
                    <ul className="list-disc ml-4 space-y-1 text-slate-300">
                      {parsedStandup.updates?.todayFocus?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      )) || <li>No focus items defined.</li>}
                    </ul>
                  </div>

                  {/* Reviewing */}
                  <div className="p-4 bg-violet-950/20 border border-violet-900/30 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider block border-b border-violet-900/30 pb-1">In Review</span>
                    <ul className="list-disc ml-4 space-y-1 text-slate-300">
                      {parsedStandup.updates?.reviewing?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      )) || <li>No tasks in review.</li>}
                    </ul>
                  </div>
                </div>

                {/* Blockers & Sprint Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Blockers */}
                  <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block mb-1">Blockers & Impediments</span>
                    <p className="text-slate-300">{parsedStandup.blockersSummary}</p>
                  </div>

                  {/* Sprint Status */}
                  <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block mb-1">Sprint Impact</span>
                    <p className="text-slate-300">{parsedStandup.sprintStatus}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-slate-950/80 p-4 rounded-xl border border-slate-800/85">
                {standup}
              </div>
            )}
          </div>
        );
      })()}

      {/* AI Productivity Insights */}
      {!productivityInsights && !generatingInsights ? (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/20 p-5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Workplace Productivity Insights</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Let Gemini AI analyze sprint delays, team workloads, and project bottleneck risks.</p>
            </div>
          </div>
          <button
            onClick={handleFetchInsights}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Sparkles size={12} className="text-violet-400" />
            <span>Analyze Workspace</span>
          </button>
        </div>
      ) : generatingInsights ? (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider animate-pulse">Gemini AI is analyzing sprint telemetry...</span>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden space-y-5 animate-fadeIn">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-600/5 rounded-full filter blur-3xl" />
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-xs text-indigo-400 flex items-center space-x-2 uppercase tracking-wider">
              <Sparkles size={14} className="text-indigo-400" />
              <span>AI Productivity & Risk Insights</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFetchInsights}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-300 flex items-center space-x-1"
              >
                <Sparkles size={11} />
                <span>Re-analyze</span>
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => setProductivityInsights(null)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Performance Score & Summary */}
            <div className="lg:col-span-4 bg-slate-950/60 border border-slate-850 p-4.5 rounded-xl flex flex-col items-center text-center space-y-3">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">Sprint Health Score</span>
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-500 transition-all duration-1000"
                    strokeDasharray={`${productivityInsights.performanceScore || 0}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-2xl font-black text-slate-100">{productivityInsights.performanceScore || 0}%</div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">{productivityInsights.productivitySummary}</p>
            </div>

            {/* Right: Detailed breakdown tabs */}
            <div className="lg:col-span-8 space-y-4">
              {/* Delayed tasks analysis */}
              <div>
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block mb-2">Delay Analysis</span>
                <div className="space-y-2">
                  {productivityInsights.delayedTaskAnalysis && productivityInsights.delayedTaskAnalysis.length > 0 ? (
                    productivityInsights.delayedTaskAnalysis.map((task: any, idx: number) => (
                      <div key={idx} className="p-3 bg-rose-950/10 border border-rose-900/20 rounded-lg text-xs flex justify-between items-start gap-4">
                        <div>
                          <span className="font-bold text-slate-200 block">{task.title || 'Task'}</span>
                          <span className="text-slate-400 block mt-0.5">{task.reasonForDelay}</span>
                        </div>
                        <span className="text-[9px] bg-rose-950 text-rose-400 border border-rose-900 px-2 py-0.5 rounded font-black uppercase shrink-0">Impact: {task.impact || 'Medium'}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No delayed deliverables identified.</p>
                  )}
                </div>
              </div>

              {/* Risks & Mitigations */}
              <div>
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block mb-2">Imminent Risks</span>
                <div className="space-y-2">
                  {productivityInsights.risks && productivityInsights.risks.length > 0 ? (
                    productivityInsights.risks.map((risk: any, idx: number) => (
                      <div key={idx} className="p-3 bg-amber-950/10 border border-amber-900/20 rounded-lg text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-200">{risk.description}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${risk.severity === 'High' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-amber-950 text-amber-400 border border-amber-900'}`}>{risk.severity} Severity</span>
                        </div>
                        <span className="text-slate-400 mt-1 block"><strong className="text-[9px] text-amber-500 uppercase tracking-wider mr-1">Mitigation:</strong> {risk.mitigation}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No current timeline risks flagged.</p>
                  )}
                </div>
              </div>

              {/* Workload assessment */}
              <div>
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider block mb-2">Workload Balancing</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {productivityInsights.workloadInsights && productivityInsights.workloadInsights.length > 0 ? (
                    productivityInsights.workloadInsights.map((work: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-[11px] flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-200 block">{work.userName}</span>
                          <span className="text-slate-500 text-[10px] block mt-0.5">{work.details}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold bg-violet-950 text-violet-400 px-1.5 py-0.5 rounded block">{work.trackedHours} hrs</span>
                          <span className={`text-[8px] font-black uppercase mt-1 inline-block ${work.loadAssessment === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>{work.loadAssessment} load</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No workload insights available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render selected dashboard */}
      {renderDashboardByRole()}

    </div>
  );
}
