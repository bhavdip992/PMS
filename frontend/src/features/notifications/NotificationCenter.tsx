import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/useNotificationStore.tsx';
import api from '../../services/api.tsx';
import {
  requestNotificationPermission,
  sendTestDesktopNotification,
  getNotificationPermission,
} from '../../services/desktopNotification';
import {
  Bell, Check, CheckCheck, Trash2, Settings, Mail, AtSign, UserPlus,
  MessageSquare, Zap, ExternalLink, Loader2, Eye, EyeOff, ShieldAlert,
  Info, CheckSquare, Layers, FileUp, Sparkles, BellRing, BellOff, Beaker
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  Mention:             { icon: AtSign,        color: 'text-violet-400', bg: 'bg-violet-950/20', label: 'Mention' },
  Task_Assign:         { icon: UserPlus,      color: 'text-blue-400',   bg: 'bg-blue-950/20',   label: 'Assigned' },
  Comm_Update:         { icon: MessageSquare, color: 'text-emerald-400',bg: 'bg-emerald-950/20',label: 'Comment' },
  Due_Reminder:        { icon: Bell,          color: 'text-orange-400', bg: 'bg-orange-950/20', label: 'Reminder' },
  System:              { icon: Zap,           color: 'text-slate-400',  bg: 'bg-slate-800/40',  label: 'System' },
  // Phase 6 event types
  'task:assigned':     { icon: UserPlus,      color: 'text-blue-400',   bg: 'bg-blue-950/20',   label: 'Task Assigned' },
  'task:updated':       { icon: CheckSquare,   color: 'text-sky-400',    bg: 'bg-sky-950/20',    label: 'Task Update' },
  'task:commented':     { icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-950/20', label: 'Comment' },
  'task:overdue':       { icon: ShieldAlert,   color: 'text-red-400',    bg: 'bg-red-950/20',    label: 'Overdue Alert' },
  'task:status_changed':{ icon: Layers,        color: 'text-purple-400', bg: 'bg-purple-950/20', label: 'Status' },
  'file:uploaded':     { icon: FileUp,        color: 'text-teal-400',   bg: 'bg-teal-950/20',   label: 'File Upload' },
  'sprint:updated':     { icon: Zap,           color: 'text-yellow-400', bg: 'bg-yellow-950/20', label: 'Sprint Update' },
  'mention:created':    { icon: AtSign,        color: 'text-violet-400', bg: 'bg-violet-950/20', label: 'Mention' },
  'communication:updated': { icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-950/20', label: 'Comm Update' }
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function groupByDay(notifications: any[]): Record<string, any[]> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  return notifications.reduce((groups, n) => {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    let key;
    if (d.getTime() === today.getTime()) key = 'Today';
    else if (d.getTime() === yesterday.getTime()) key = 'Yesterday';
    else key = d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' });
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
    return groups;
  }, {} as Record<string, any[]>);
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotificationStore() as any;
  
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [permissionState, setPermissionState] = useState<string>(getNotificationPermission());

  // Refresh permission state whenever tab becomes visible
  useEffect(() => {
    const refresh = () => setPermissionState(getNotificationPermission());
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Permissions handler — MUST be called from onClick (real user gesture)
  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermissionState(result);
    if (result === 'denied') {
      alert(
        'Notifications are blocked.\n\n' +
        'To fix this:\n' +
        '1. Click the 🔒 / ℹ️ icon in your browser address bar\n' +
        '2. Find "Notifications" and set it to "Allow"\n' +
        '3. Reload the page'
      );
    }
  };

  // Test handler — fires immediately regardless of tab state
  const handleTestNotification = () => {
    const notif = sendTestDesktopNotification();
    if (notif) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    } else {
      alert('Could not send test notification. Make sure you have clicked "Enable Notifications" first.');
    }
  };

  // Preferences State
  const [prefs, setPrefs] = useState({
    inApp: true,
    email: true,
    popups: true
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchNotifications();
      try {
        const res = await api.get('/notifications/preferences');
        if (res.data?.data?.preferences) {
          setPrefs(res.data.data.preferences);
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await api.patch('/notifications/preferences', prefs);
      if (res.data?.data?.preferences) {
        setPrefs(res.data.data.preferences);
        alert('Notification preferences updated successfully!');
      }
    } catch (err) {
      console.error('Failed to update notification preferences:', err);
      alert('Error updating preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleOpenLink = (n: any) => {
    markAsRead(n._id);
    if (n.link || n.actionUrl) {
      const targetUrl = n.link || n.actionUrl;
      const path = targetUrl.startsWith('/') ? targetUrl.slice(1) : targetUrl;
      navigate('/' + path);
    }
  };

  // Filter notifications
  let filtered = notifications;
  if (showUnreadOnly) {
    filtered = filtered.filter((n: any) => !n.isRead);
  }

  const grouped = groupByDay(filtered);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--espark-border))] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[hsl(var(--espark-text))] flex items-center gap-2">
            <Bell size={24} className="text-[hsl(var(--espark-primary))]" />
            Notification Hub
          </h1>
          <p className="text-xs text-[hsl(var(--espark-muted))] mt-1">
            Real-time operational alerts, tasks actions, and notification configuration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="bg-[hsl(var(--espark-primary))] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
          {activeTab === 'notifications' && notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[hsl(var(--espark-surface-2))] border border-[hsl(var(--espark-border))] text-xs font-bold text-[hsl(var(--espark-text))] hover:bg-[hsl(var(--espark-border))] transition-all"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[hsl(var(--espark-border))]">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'notifications'
              ? 'border-[hsl(var(--espark-primary))] text-[hsl(var(--espark-primary))]'
              : 'border-transparent text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))]'
          }`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'preferences'
              ? 'border-[hsl(var(--espark-primary))] text-[hsl(var(--espark-primary))]'
              : 'border-transparent text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))]'
          }`}
        >
          Delivery Preferences
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[hsl(var(--espark-primary))]" />
        </div>
      ) : activeTab === 'notifications' ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-center bg-[hsl(var(--espark-surface-2))] p-3.5 rounded-2xl border border-[hsl(var(--espark-border))]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[hsl(var(--espark-muted))]">Filters:</span>
              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showUnreadOnly
                    ? 'bg-[hsl(var(--espark-primary))] border-transparent text-white'
                    : 'bg-transparent border-[hsl(var(--espark-border))] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))]'
                }`}
              >
                {showUnreadOnly ? <EyeOff size={13} /> : <Eye size={13} />}
                Unread Only
              </button>
            </div>
            <div className="text-[11px] font-bold text-[hsl(var(--espark-muted))]">
              Showing {filtered.length} of {notifications.length} alerts
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl">
              <Bell size={40} className="text-[hsl(var(--espark-border))]" />
              <p className="text-[hsl(var(--espark-muted))] font-medium text-sm">
                No notifications found.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--espark-muted))]">{day}</span>
                    <div className="flex-1 h-px bg-[hsl(var(--espark-border))]" />
                    <span className="text-[9px] text-[hsl(var(--espark-muted))] font-bold">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((n) => {
                      const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.System;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={n._id}
                          onClick={() => handleOpenLink(n)}
                          className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                            n.isRead
                              ? 'bg-[hsl(var(--espark-surface))/0.5] border-[hsl(var(--espark-border))/0.6] hover:border-[hsl(var(--espark-border))]'
                              : 'bg-[hsl(var(--espark-surface))] border-[hsl(var(--espark-primary))/0.3] hover:border-[hsl(var(--espark-primary))] shadow-sm'
                          }`}
                        >
                          {/* Left Icon */}
                          <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={16} className={cfg.color} />
                          </div>

                          {/* Main Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-wider ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--espark-primary))] flex-shrink-0 animate-pulse" />}
                            </div>
                            <p className="text-xs font-bold text-[hsl(var(--espark-text))] mt-0.5">{n.title}</p>
                            <p className="text-[11px] text-[hsl(var(--espark-muted))] leading-relaxed mt-0.5">
                              {n.message}
                            </p>
                          </div>

                          {/* Actions Panel */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0 self-center">
                            <span className="text-[9px] text-[hsl(var(--espark-muted))] font-medium">
                              {timeAgo(n.createdAt)}
                            </span>
                            <div className="flex items-center gap-1">
                              {(n.link || n.actionUrl) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenLink(n);
                                  }}
                                  className="p-1 rounded-lg hover:bg-[hsl(var(--espark-surface-2))] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-primary))] transition-all"
                                  title="View action link"
                                >
                                  <ExternalLink size={12} />
                                </button>
                              )}
                              {!n.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(n._id);
                                  }}
                                  className="p-1 rounded-lg hover:bg-[hsl(var(--espark-surface-2))] text-[hsl(var(--espark-muted))] hover:text-green-500 transition-all"
                                  title="Mark as read"
                                >
                                  <Check size={12} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n._id);
                                }}
                                className="p-1 rounded-lg hover:bg-[hsl(var(--espark-surface-2))] text-[hsl(var(--espark-muted))] hover:text-red-500 transition-all"
                                title="Delete Notification"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSavePreferences} className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-extrabold text-[hsl(var(--espark-text))] flex items-center gap-2">
              <Settings size={16} className="text-[hsl(var(--espark-primary))]" />
              Manage Delivery Channels
            </h3>
            <p className="text-xs text-[hsl(var(--espark-muted))] mt-1">
              Select how you would like to be notified about updates to projects, tasks, and sprints.
            </p>
          </div>

          {/* ── Desktop Notification Permission Card ────────────────── */}
          <div className={`p-5 rounded-2xl border-2 ${
            permissionState === 'granted'
              ? 'border-emerald-500/40 bg-emerald-950/20'
              : permissionState === 'denied'
              ? 'border-red-500/40 bg-red-950/20'
              : 'border-amber-500/40 bg-amber-950/20'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                permissionState === 'granted' ? 'bg-emerald-500/20 text-emerald-400'
                : permissionState === 'denied' ? 'bg-red-500/20 text-red-400'
                : 'bg-amber-500/20 text-amber-400'
              }`}>
                {permissionState === 'granted' ? <BellRing size={20} />
                  : permissionState === 'denied' ? <BellOff size={20} />
                  : <Bell size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-[hsl(var(--espark-text))]">
                  OS Desktop Notifications
                  <span className={`ml-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    permissionState === 'granted' ? 'bg-emerald-500/20 text-emerald-400'
                    : permissionState === 'denied' ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {permissionState === 'unsupported' ? 'Not Supported' : permissionState}
                  </span>
                </p>
                <p className="text-[11px] text-[hsl(var(--espark-muted))] mt-1 leading-relaxed">
                  {permissionState === 'granted'
                    ? 'System notifications are active. You will receive OS-level alerts when this tab is in the background.'
                    : permissionState === 'denied'
                    ? 'Notifications are blocked. Click the 🔒 icon in your browser address bar → Notifications → Allow, then reload.'
                    : 'Click "Enable Notifications" to allow esparkPM to show system alerts when you are in another window.'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4">
              {permissionState !== 'granted' && permissionState !== 'denied' && (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--espark-primary))] hover:brightness-110 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-[hsl(var(--espark-primary)/0.3)]"
                >
                  <BellRing size={13} />
                  Enable Notifications
                </button>
              )}
              {permissionState === 'granted' && (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all border ${
                    testSent
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-[hsl(var(--espark-surface-2))] border-[hsl(var(--espark-border))] text-[hsl(var(--espark-text))] hover:bg-[hsl(var(--espark-border))]'
                  }`}
                >
                  <Beaker size={13} />
                  {testSent ? '✅ Notification Sent!' : 'Send Test Notification'}
                </button>
              )}
              {permissionState === 'denied' && (
                <a
                  href="https://support.google.com/chrome/answer/3220216"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[hsl(var(--espark-primary))] hover:underline font-bold"
                >
                  How to unblock →
                </a>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* In-App Notifications */}
            <div className="flex items-start justify-between p-4 bg-[hsl(var(--espark-surface-2))] rounded-xl border border-[hsl(var(--espark-border))]">
              <div className="flex items-start gap-3">
                <Bell size={18} className="text-[hsl(var(--espark-primary))] mt-0.5" />
                <div>
                  <label className="text-xs font-bold text-[hsl(var(--espark-text))] block">In-App Notifications</label>
                  <span className="text-[10px] text-[hsl(var(--espark-muted))] block mt-0.5">
                    Real-time alerts directly within the esparkPM dashboard bell menu.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.inApp}
                onChange={(e) => setPrefs({ ...prefs, inApp: e.target.checked })}
                className="w-4 h-4 rounded border-[hsl(var(--espark-border))] text-[hsl(var(--espark-primary))] focus:ring-[hsl(var(--espark-primary))] cursor-pointer"
              />
            </div>

            {/* Email Notifications */}
            <div className="flex items-start justify-between p-4 bg-[hsl(var(--espark-surface-2))] rounded-xl border border-[hsl(var(--espark-border))]">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-emerald-500 mt-0.5" />
                <div>
                  <label className="text-xs font-bold text-[hsl(var(--espark-text))] block">Email Notifications</label>
                  <span className="text-[10px] text-[hsl(var(--espark-muted))] block mt-0.5">
                    Receive HTML reports and deadline reminders via Nodemailer.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.email}
                onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })}
                className="w-4 h-4 rounded border-[hsl(var(--espark-border))] text-[hsl(var(--espark-primary))] focus:ring-[hsl(var(--espark-primary))] cursor-pointer"
              />
            </div>

            {/* Popup Notifications */}
            <div className="flex items-start justify-between p-4 bg-[hsl(var(--espark-surface-2))] rounded-xl border border-[hsl(var(--espark-border))]">
              <div className="flex items-start gap-3">
                <Sparkles size={18} className="text-violet-400 mt-0.5" />
                <div>
                  <label className="text-xs font-bold text-[hsl(var(--espark-text))] block">Browser Desktop Popups</label>
                  <span className="text-[10px] text-[hsl(var(--espark-muted))] block mt-0.5">
                    Render immediate toast popups at the bottom-right corner when events trigger.
                  </span>
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
                    <span className="text-[10px] text-red-400 font-bold block mt-1.5 animate-pulse">
                      ⚠️ Notifications are blocked in your browser settings. Please allow notifications for this site.
                    </span>
                  )}
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.popups}
                onChange={(e) => {
                  const val = e.target.checked;
                  setPrefs({ ...prefs, popups: val });
                  if (val && typeof window !== 'undefined' && 'Notification' in window) {
                    if (Notification.permission === 'default') {
                      Notification.requestPermission().then(perm => {
                        if (perm !== 'granted') {
                          alert('Desktop notification permission was not granted.');
                        }
                      });
                    } else if (Notification.permission === 'denied') {
                      alert('Desktop notifications are blocked by your browser settings. Please open your browser site settings and allow notifications for this site.');
                    }
                  }
                }}
                className="w-4 h-4 rounded border-[hsl(var(--espark-border))] text-[hsl(var(--espark-primary))] focus:ring-[hsl(var(--espark-primary))] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPrefs}
              className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--espark-primary))] hover:bg-[hsl(var(--espark-primary-dark))] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              {savingPrefs && <Loader2 size={13} className="animate-spin" />}
              Save Preferences
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
