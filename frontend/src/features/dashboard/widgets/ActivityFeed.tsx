import React from 'react';
import { Activity } from 'lucide-react';

interface ActivityItem {
  _id: string;
  user?: {
    name: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  maxHeightClass?: string;
}

export default function ActivityFeed({
  activities,
  title = 'Recent Activity Feed',
  maxHeightClass = 'max-h-96'
}: ActivityFeedProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
      <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
        <Activity size={16} className="text-violet-400" />
        <span>{title}</span>
      </h3>
      <div className={`space-y-3.5 overflow-y-auto pr-1 ${maxHeightClass}`}>
        {activities.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-500">No activity logged today</p>
        ) : (
          activities.map(a => (
            <div key={a._id} className="text-xs border-b border-slate-855 pb-3 flex items-start space-x-3 group">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 text-[10px] font-black text-slate-350 flex items-center justify-center shrink-0 group-hover:border-violet-500/40 transition-colors duration-200">
                {a.user?.name?.substring(0, 2).toUpperCase() || 'AI'}
              </div>
              <div className="flex-1">
                <p className="text-slate-300">
                  <span className="font-extrabold text-slate-200">{a.user?.name || 'System'}</span>
                  <span className="mx-1 text-slate-500 font-semibold">{a.action?.toLowerCase().replace(/_/g, ' ')}</span>
                  {a.details && <span className="font-bold text-violet-400">"{a.details}"</span>}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">
                  {(() => {
                    const dateVal = a.createdAt || (a as any).timestamp;
                    if (!dateVal) return 'N/A';
                    const d = new Date(dateVal);
                    return isNaN(d.getTime()) ? 'N/A' : `${d.toLocaleTimeString()} - ${d.toLocaleDateString()}`;
                  })()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
