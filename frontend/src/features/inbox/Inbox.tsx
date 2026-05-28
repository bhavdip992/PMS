import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '../../store/useNotificationStore.tsx';
import { Inbox as InboxIcon, Bell, AtSign, UserPlus, MessageSquare, Zap, Check, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';

const TYPE_CONFIG = {
  Mention:     { icon: AtSign,       color: 'text-violet-400', bg: 'bg-violet-950/20', label: 'Mention' },
  Task_Assign: { icon: UserPlus,     color: 'text-blue-400',   bg: 'bg-blue-950/20',   label: 'Assigned' },
  Comm_Update: { icon: MessageSquare,color: 'text-emerald-400',bg: 'bg-emerald-950/20',label: 'Comment' },
  Due_Reminder:{ icon: Bell,         color: 'text-orange-400', bg: 'bg-orange-950/20', label: 'Reminder' },
  System:      { icon: Zap,          color: 'text-slate-400',  bg: 'bg-slate-800/40',  label: 'System' },
};

function timeAgo(dateStr) {
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
  }, {});
}

export default function Inbox() {
  const navigate = useNavigate();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore() as any;
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    load();
  }, []);

  const openLink = (n) => {
    markAsRead(n._id);
    if (n.link) {
      const path = n.link.startsWith('/') ? n.link.slice(1) : n.link;
      navigate('/' + path);
    }
  };

  // Filter to last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let visible = notifications.filter(n => new Date(n.createdAt).getTime() > sevenDaysAgo);
  if (filter !== 'all') visible = visible.filter(n => n.type === filter);

  const grouped = groupByDay(visible);
  const unread = notifications.filter(n => !n.isRead).length;

  const typeFilters = [
    { key: 'all', label: 'All' },
    { key: 'Mention', label: 'Mentions' },
    { key: 'Task_Assign', label: 'Assigned' },
    { key: 'Comm_Update', label: 'Comments' },
    { key: 'System', label: 'System' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <InboxIcon size={22} className="text-violet-400" />
            Inbox
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Your last 7 days of activity and updates</p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <span className="bg-violet-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{unread} unread</span>
          )}
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {typeFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
              filter === f.key
                ? 'bg-violet-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-violet-500" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <InboxIcon size={40} className="text-slate-700" />
          <p className="text-slate-500 font-medium text-sm">No updates in the last 7 days.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{day}</span>
                <div className="flex-1 h-px bg-slate-800/80" />
                <span className="text-[9px] text-slate-700 font-bold">{items.length} update{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {items.map(n => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.System;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n._id}
                      onClick={() => openLink(n)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                        n.isRead
                          ? 'bg-slate-900/40 border-slate-800/40 hover:border-slate-700'
                          : 'bg-slate-900 border-violet-800/30 hover:border-violet-500/50 shadow-sm'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={14} className={cfg.color} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs font-bold text-slate-200 mt-0.5">{n.title}</p>
                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{n.message}</p>
                      </div>
                      {/* Meta */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-slate-600">{timeAgo(n.createdAt)}</span>
                        {n.link && (
                          <ExternalLink size={11} className="text-slate-700 group-hover:text-violet-400 transition-colors" />
                        )}
                        {n.isRead ? (
                          <CheckCheck size={11} className="text-slate-700" />
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                            className="p-0.5 rounded hover:bg-slate-800 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={11} className="text-slate-600 hover:text-violet-400" />
                          </button>
                        )}
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
  );
}
