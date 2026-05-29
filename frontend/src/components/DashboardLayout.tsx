import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.tsx';
import { useNotificationStore } from '../store/useNotificationStore.tsx';
import { useTimeLogStore } from '../store/useTimeLogStore.tsx';
import { useThemeStore } from '../store/useThemeStore.tsx';
import api from '../services/api.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission } from '../services/desktopNotification';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Mail, Key, Users, Layers,
  LogOut, Bell, Search, Clock, Menu, X, Square, Shield, Sparkles,
  Calendar, Settings, Activity, Sun, Moon, Monitor, UserCircle,
  Inbox, ClipboardList, ChevronDown, ExternalLink, AtSign, UserPlus,
  MessageSquare, ShieldAlert, FileUp, Zap
} from 'lucide-react';

const navItems = (role: string) => [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/my-tasks', label: 'My Tasks', icon: ClipboardList },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/tasks', label: 'Tasks & Boards', icon: CheckSquare },
  { path: '/subtasks', label: 'Sub-Tasks Matrix', icon: Layers },
  { path: '/timesheet', label: 'Timesheet Matrix', icon: Clock },
  { path: '/inbox', label: 'Inbox', icon: Inbox },
  { path: '/calendar', label: 'Personal Calendar', icon: Calendar },
  ...(['Super Admin', 'Admin', 'Project Manager'].includes(role)
    ? [{ path: '/workload', label: 'Team Workload', icon: Activity }]
    : []),
  { path: '/communications', label: 'Communications', icon: Mail },
  { path: '/vault', label: 'Credential Vault', icon: Key },
  { path: '/team', label: 'Team Members', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
  ...(role === 'Super Admin'
    ? [{ path: '/admin/users', label: 'User Management', icon: Shield }]
    : []),
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore() as any;
  const { notifications, unreadCount, initSocket, disconnectSocket, fetchNotifications, markAsRead, markAllAsRead, activeToast, setActiveToast } = useNotificationStore() as any;
  const { activeTimer, stopTimer, fetchActiveTimer } = useTimeLogStore() as any;
  const { theme, setTheme } = useThemeStore() as any;
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [askingAI, setAskingAI] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<any>(null);
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [toasts, setToasts] = useState<any[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeToast) {
      const id = activeToast._id || Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { ...activeToast, toastId: id }]);
      setActiveToast(null);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== id));
      }, 5000);
    }
  }, [activeToast, setActiveToast]);

  useEffect(() => {
    if (user) {
      initSocket(user._id);
      fetchActiveTimer();
      fetchNotifications();
    }
    return () => disconnectSocket();
  }, [user]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const fetchAIAlerts = async () => {
    try {
      const res = await api.get('/ai/notification-alerts');
      setAiAlerts(res.data.data.alerts || []);
    } catch (_) { /* ignore */ }
  };

  useEffect(() => {
    if (user) {
      fetchAIAlerts();
      const interval = setInterval(fetchAIAlerts, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);


  useEffect(() => {
    if (!activeTimer) { setSecondsElapsed(0); return; }
    const start = new Date((activeTimer as any).startTime).getTime();
    const upd = () => setSecondsElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    upd(); const iv = setInterval(upd, 1000); return () => clearInterval(iv);
  }, [activeTimer]);

  useEffect(() => {
    setAiAnswer(null);
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      try { const r = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`); setSearchResults(r.data.data); }
      catch { /* silent */ }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    setAskingAI(true);
    setAiAnswer(null);
    try {
      const res = await api.post('/ai/search-assistant', { query: searchQuery });
      setAiAnswer(res.data.data.answer);
    } catch (err) {
      alert('Failed to get answer from AI Search Assistant.');
    } finally {
      setAskingAI(false);
    }
  };


  const handleStopTimer = async () => {
    const res = await stopTimer();
    if (res.success) alert(`Timer logged: ${res.data.duration} minute(s)`);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const items = navItems(user?.role || '');

  return (
    <div className="min-h-screen bg-[hsl(var(--espark-bg))] text-[hsl(var(--espark-text))] flex flex-col font-sans">

      {/* HEADER */}
      <header role="banner" className="sticky top-0 z-40 bg-[hsl(var(--espark-surface)/0.85)] backdrop-blur-md border-b border-[hsl(var(--espark-border))] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 rounded-lg bg-[hsl(var(--espark-surface-2))] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))]">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="esparkPM" className="w-8 h-8 object-contain rounded-lg" />
            <span className="hidden sm:inline font-extrabold text-xl tracking-tight bg-gradient-to-r from-[hsl(var(--espark-primary))] to-[hsl(var(--espark-secondary))] bg-clip-text text-transparent">
              esparkPM
            </span>
          </div>
        </div>

        {activeTimer && (
          <div className="flex items-center gap-3 bg-red-950/40 border border-red-800/60 px-3 py-1.5 rounded-full animate-pulse">
            <Clock size={16} className="text-red-400" />
            <span className="text-sm font-mono font-semibold text-red-300">{fmt(secondsElapsed)}</span>
            <button onClick={handleStopTimer} className="p-1 rounded-full bg-red-600 hover:bg-red-500 text-white" title="Stop Timer">
              <Square size={12} fill="white" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={() => { setSearchOpen(true); setSearchQuery(''); }} className="p-2 rounded-xl bg-[hsl(var(--espark-surface-2))] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))] transition-all" title="Search (Ctrl+K)">
            <Search size={18} />
          </button>

          <div className="relative" ref={notifRef}>
            <button onClick={() => { setNotifOpen(!notifOpen); fetchNotifications(); }} className="relative p-2 rounded-xl bg-[hsl(var(--espark-surface-2))] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))] transition-all">
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce border-2 border-[hsl(var(--espark-bg))]">{unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] shadow-2xl rounded-2xl overflow-hidden z-50">
                <div className="px-4 py-3 bg-[hsl(var(--espark-surface-2))] border-b border-[hsl(var(--espark-border))] flex justify-between items-center">
                  <h4 className="font-bold text-sm">Notifications</h4>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigate('/inbox'); setNotifOpen(false); }} className="text-[10px] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-primary-light))] font-semibold">View Inbox</button>
                    <button onClick={markAllAsRead} className="text-[10px] text-[hsl(var(--espark-primary))] hover:underline font-semibold">Mark all read</button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[hsl(var(--espark-border)/0.4)]">
                  {aiAlerts.length > 0 && (
                    <div className="bg-violet-950/20 p-3 border-b border-[hsl(var(--espark-border)/0.8)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles size={11} />
                          <span>AI Operational Intelligence</span>
                        </span>
                        <span className="text-[8px] bg-violet-600 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase">{aiAlerts.length} Alerts</span>
                      </div>
                      <div className="space-y-1.5">
                        {aiAlerts.map((alert: any, idx: number) => (
                          <div key={idx} className="bg-slate-950/60 border border-slate-900 p-2 rounded-lg text-[10px] space-y-1">
                            <div className="flex justify-between items-center">
                              <span className={`font-black text-[9px] uppercase ${alert.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}>{alert.type}</span>
                              <span className="text-slate-500 font-bold">Severity: {alert.severity}</span>
                            </div>
                            <p className="text-slate-350 leading-relaxed">{alert.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {notifications.length === 0
                    ? <p className="p-4 text-center text-xs text-[hsl(var(--espark-muted))]">No notifications yet</p>
                    : notifications.slice(0, 20).map((n: any) => (
                      <div key={n._id} onClick={() => { markAsRead(n._id); setNotifOpen(false); if (n.link) navigate(n.link); }}
                        className={`p-3 text-xs hover:bg-[hsl(var(--espark-surface-2))] cursor-pointer transition-colors ${!n.isRead ? 'border-l-2 border-[hsl(var(--espark-primary))]' : 'opacity-60'}`}>
                        <p className="font-bold text-[hsl(var(--espark-text))] truncate">{n.title}</p>
                        <p className="text-[hsl(var(--espark-muted))] mt-0.5 leading-snug">{n.message}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative hidden sm:block" ref={userMenuRef}>
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 bg-[hsl(var(--espark-surface-2))] px-3 py-1.5 rounded-xl border border-[hsl(var(--espark-border))] hover:border-[hsl(var(--espark-primary)/0.5)] transition-all">
              <div className="w-6 h-6 rounded-full bg-[hsl(var(--espark-primary)/0.2)] border border-[hsl(var(--espark-primary)/0.5)] flex items-center justify-center">
                <span className="text-xs font-bold text-[hsl(var(--espark-primary-light))]">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-left leading-none">
                <p className="text-xs font-bold text-[hsl(var(--espark-text))]">{user?.name}</p>
                <p className="text-[9px] text-[hsl(var(--espark-primary))] uppercase font-semibold tracking-wider mt-0.5">{user?.role}</p>
              </div>
              <ChevronDown size={12} className={`text-[hsl(var(--espark-muted))] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-[hsl(var(--espark-surface-2))] border-b border-[hsl(var(--espark-border))]">
                  <p className="text-xs font-black text-[hsl(var(--espark-text))]">{user?.name}</p>
                  <p className="text-[10px] text-[hsl(var(--espark-muted))] mt-0.5">{user?.email}</p>
                </div>
                <div className="p-2 space-y-0.5">
                  <button onClick={() => { navigate('/settings'); setUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[hsl(var(--espark-muted))] hover:bg-[hsl(var(--espark-surface-2))] hover:text-[hsl(var(--espark-text))] transition-colors">
                    <UserCircle size={14} className="text-[hsl(var(--espark-primary))]" /> My Profile / Settings
                  </button>
                  <button onClick={() => { navigate('/my-tasks'); setUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[hsl(var(--espark-muted))] hover:bg-[hsl(var(--espark-surface-2))] hover:text-[hsl(var(--espark-text))] transition-colors">
                    <ClipboardList size={14} className="text-[hsl(var(--espark-primary))]" /> My Tasks
                  </button>
                </div>
                <div className="px-3 pb-2">
                  <p className="text-[9px] text-[hsl(var(--espark-border))] uppercase font-bold tracking-wider mb-1.5 px-1">Theme</p>
                  <div className="flex gap-1">
                    {([['light', Sun, 'Light'], ['dark', Moon, 'Dark'], ['system', Monitor, 'Auto']] as const).map(([val, Icon, label]) => (
                      <button key={val} onClick={() => setTheme(val)} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[9px] font-bold transition-all ${theme === val ? 'bg-[hsl(var(--espark-primary))] text-white' : 'bg-[hsl(var(--espark-surface-2))] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))]'}`}>
                        <Icon size={12} />{label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-[hsl(var(--espark-border))] p-2">
                  <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors">
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
          <button onClick={logout} className="sm:hidden p-2 rounded-xl bg-red-950/20 text-red-400 hover:bg-red-900/30 transition-all border border-red-900/35" title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (desktop) */}
        <aside role="complementary" className="hidden md:flex flex-col w-64 bg-[hsl(var(--espark-surface))] border-r border-[hsl(var(--espark-border))] p-4 justify-between">
          <nav role="navigation" aria-label="Main Navigation" className="space-y-1">
            {items.map(({ path, label, icon: Icon }) => (
              <button key={path} onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive(path) ? 'bg-[hsl(var(--espark-primary))] text-white shadow-lg shadow-[hsl(var(--espark-primary)/0.2)]' : 'text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))] hover:bg-[hsl(var(--espark-surface-2))]'}`}>
                <Icon size={18} /><span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* SIDEBAR (mobile) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 bg-[hsl(var(--espark-surface))] p-5 flex flex-col justify-between z-10">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <img src="/logo.png" alt="esparkPM" className="h-8" />
                  <button onClick={() => setMobileMenuOpen(false)} className="text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))]"><X size={20} /></button>
                </div>
                <nav className="space-y-1">
                  {items.map(({ path, label, icon: Icon }) => (
                    <button key={path} onClick={() => { navigate(path); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive(path) ? 'bg-[hsl(var(--espark-primary))] text-white' : 'text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))] hover:bg-[hsl(var(--espark-surface-2))]'}`}>
                      <Icon size={18} /><span>{label}</span>
                    </button>
                  ))}
                </nav>
              </div>
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/30 transition-all">
                <LogOut size={18} /><span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* MAIN CONTENT – react-router Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[hsl(var(--espark-bg))]">
          <Outlet />
        </main>
      </div>

      {/* GLOBAL SEARCH MODAL */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl shadow-2xl overflow-hidden z-10">
            <div className="flex items-center px-4 py-3 bg-[hsl(var(--espark-surface-2))] border-b border-[hsl(var(--espark-border))]">
              <Search size={18} className="text-[hsl(var(--espark-muted))] mr-3" />
              <input type="text" placeholder="Search projects, tasks, communications…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-[hsl(var(--espark-text))] border-none outline-none w-full text-sm placeholder:text-[hsl(var(--espark-muted))]" autoFocus />
              <button onClick={() => setSearchOpen(false)} className="text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))]"><X size={16} /></button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
              {!searchQuery.trim()
                ? <p className="text-center py-8 text-[hsl(var(--espark-muted))]">Type to search the workspace…</p>
                : searchResults
                  ? <>
                    {/* AI Search Assistant Action */}
                    <div className="bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border border-violet-900/30 p-3.5 rounded-xl space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles size={11} />
                          <span>AI Search Assistant</span>
                        </span>
                        {!askingAI && !aiAnswer && (
                          <button
                            onClick={handleAISearch}
                            className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[9px] rounded-lg transition-colors"
                          >
                            Ask Gemini
                          </button>
                        )}
                      </div>

                      {askingAI && (
                        <div className="flex items-center space-x-2 py-2">
                          <div className="w-3.5 h-3.5 border-2 border-violet-500/20 border-t-violet-400 rounded-full animate-spin" />
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gemini is searching tasks & discussions...</span>
                        </div>
                      )}

                      {aiAnswer && (
                        <div className="space-y-2 mt-1.5 animate-fadeIn">
                          <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/45 p-3 rounded-lg border border-slate-900 font-medium">
                            {aiAnswer.directAnswer}
                          </div>
                          {aiAnswer.suggestedFollowUpQueries && aiAnswer.suggestedFollowUpQueries.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {aiAnswer.suggestedFollowUpQueries.map((q: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => setSearchQuery(q)}
                                  className="text-[9px] bg-slate-950/70 hover:bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {searchResults.projects?.length > 0 && <section>
                      <h5 className="text-[10px] font-bold text-[hsl(var(--espark-primary))] uppercase tracking-wider mb-1">Projects</h5>
                      {searchResults.projects.map((p: any) => (
                        <div key={p._id} onClick={() => { navigate('/projects'); setSearchOpen(false); }} className="p-2.5 rounded-lg bg-[hsl(var(--espark-surface-2))] hover:bg-[hsl(var(--espark-border))] cursor-pointer mb-1">
                          <p className="font-bold text-[hsl(var(--espark-text))]">{p.name}</p>
                          <p className="text-[hsl(var(--espark-muted))] truncate">{p.description}</p>
                        </div>
                      ))}
                    </section>}
                    {searchResults.tasks?.length > 0 && <section>
                      <h5 className="text-[10px] font-bold text-[hsl(var(--espark-primary))] uppercase tracking-wider mb-1">Tasks</h5>
                      {searchResults.tasks.map((t: any) => (
                        <div key={t._id} onClick={() => { navigate(`/tasks/${t._id}`); setSearchOpen(false); }} className="p-2.5 rounded-lg bg-[hsl(var(--espark-surface-2))] hover:bg-[hsl(var(--espark-border))] cursor-pointer mb-1">
                          <p className="font-bold text-[hsl(var(--espark-text))]">{t.title}</p>
                        </div>
                      ))}
                    </section>}
                  </>
                  : <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[hsl(var(--espark-primary)/0.2)] border-t-[hsl(var(--espark-primary))] rounded-full animate-spin" /></div>}
            </div>
          </div>
        </div>
      )}

      {/* TOAST STACK */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            let IconComponent = Bell;
            let iconColor = 'text-[hsl(var(--espark-primary))]';
            let iconBg = 'bg-[hsl(var(--espark-primary)/0.15)]';
            let borderColor = 'border-[hsl(var(--espark-primary)/0.4)]';

            if (t.type === 'Task_Assign' || t.type === 'task:assigned') {
              IconComponent = UserPlus;
              iconColor = 'text-blue-400';
              iconBg = 'bg-blue-950/30';
              borderColor = 'border-blue-500/30';
            } else if (t.type === 'Comm_Update' || t.type === 'task:commented' || t.type === 'communication:updated') {
              IconComponent = MessageSquare;
              iconColor = 'text-emerald-400';
              iconBg = 'bg-emerald-950/30';
              borderColor = 'border-emerald-500/30';
            } else if (t.type === 'task:overdue') {
              IconComponent = ShieldAlert;
              iconColor = 'text-red-400';
              iconBg = 'bg-red-950/30';
              borderColor = 'border-red-500/30';
            } else if (t.type === 'file:uploaded') {
              IconComponent = FileUp;
              iconColor = 'text-teal-400';
              iconBg = 'bg-teal-950/30';
              borderColor = 'border-teal-500/30';
            } else if (t.type === 'System') {
              IconComponent = Zap;
              iconColor = 'text-amber-400';
              iconBg = 'bg-amber-950/30';
              borderColor = 'border-amber-500/30';
            }

            return (
              <motion.div
                key={t.toastId}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`pointer-events-auto w-full bg-[hsl(var(--espark-surface))]/90 backdrop-blur-xl border ${borderColor} rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 flex gap-3.5 items-start relative group transition-all duration-300 hover:-translate-y-0.5`}
              >
                {/* Decorative background glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                
                {/* Icon Container */}
                <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} flex-shrink-0 shadow-inner`}>
                  <IconComponent size={18} className="animate-pulse" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-wider ${iconColor}`}>
                      {t.type?.replace('task:', '').replace('_', ' ') || 'Update'}
                    </span>
                    <button
                      onClick={() => setToasts(prev => prev.filter(item => item.toastId !== t.toastId))}
                      className="text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))] transition-colors p-0.5 rounded-lg hover:bg-white/5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <h4 className="text-xs font-extrabold text-[hsl(var(--espark-text))] mt-1 leading-snug">
                    {t.title || 'esparkPM Update'}
                  </h4>
                  <p className="text-[11px] text-[hsl(var(--espark-muted))] mt-0.5 leading-relaxed">
                    {t.message}
                  </p>
                  
                  {/* Action Link */}
                  {(t.link || t.actionUrl) && (
                    <button
                      onClick={() => {
                        const path = t.link || t.actionUrl;
                        navigate(path.startsWith('/') ? path : '/' + path);
                        setToasts(prev => prev.filter(item => item.toastId !== t.toastId));
                      }}
                      className="text-[10px] text-[hsl(var(--espark-primary))] hover:underline font-extrabold mt-2 block"
                    >
                      View details →
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
