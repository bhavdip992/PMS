import React from 'react';
import { Clock, User, Settings, ArrowRight, Activity, MessageSquare } from 'lucide-react';

interface ActivityLog {
  _id: string;
  user?: { name: string; email: string };
  action: string;
  details?: {
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
  };
  createdAt: string;
}

interface ActivityTimelineProps {
  activities: ActivityLog[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGE':
        return <ArrowRight size={12} className="text-violet-400" />;
      case 'PRIORITY_CHANGE':
        return <Activity size={12} className="text-rose-400" />;
      case 'COMMENT_ADDED':
        return <MessageSquare size={12} className="text-indigo-400" />;
      case 'ASSIGNED':
        return <User size={12} className="text-emerald-400" />;
      default:
        return <Settings size={12} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-850 pb-3">
        <Clock size={14} className="text-slate-400" />
        <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
          Activity History Logs
        </h4>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-slate-900">
          <p className="text-[10px] text-slate-500 italic">No activity history logs recorded yet.</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l border-slate-850/80 space-y-5 ml-2.5">
          {activities.map((act) => {
            const formattedTime = new Date(act.createdAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={act._id} className="relative">
                {/* Timeline node icon */}
                <div className="absolute -left-[33px] top-1 w-[15px] h-[15px] rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
                  {getActionIcon(act.action)}
                </div>

                <div className="bg-slate-900/40 border border-slate-850/50 hover:bg-slate-900/70 px-4 py-3.5 rounded-2xl transition-all space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-black text-slate-350">
                      {act.user?.name || 'System'}
                    </span>
                    <span className="font-bold text-slate-500">{formattedTime}</span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <span className="font-extrabold text-[9px] text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded mr-2 uppercase tracking-wide">
                      {act.action.replace('_', ' ')}
                    </span>
                    {act.details?.fieldName ? (
                      <span className="font-medium">
                        Changed <strong className="text-slate-200">{act.details.fieldName}</strong> from{' '}
                        <span className="text-red-400 line-through font-bold bg-red-950/10 px-1 rounded">
                          {String(act.details.oldValue ?? 'none')}
                        </span>{' '}
                        to{' '}
                        <span className="text-emerald-400 font-bold bg-emerald-950/15 px-1 rounded">
                          {String(act.details.newValue ?? 'none')}
                        </span>
                      </span>
                    ) : (
                      <span className="font-medium text-slate-400">Performed generic modification</span>
                    )}
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
