import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  delta?: string | number;
  deltaType?: 'positive' | 'negative' | 'neutral';
  colorClass?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  delta,
  deltaType = 'neutral',
  colorClass = 'text-violet-400 bg-violet-500/10'
}: StatsCardProps) {
  return (
    <div className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 p-6 rounded-2xl flex items-center justify-between shadow-md hover:shadow-lg relative overflow-hidden group">
      {/* Background glow on hover */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 rounded-full filter blur-xl group-hover:scale-150 transition-all duration-500" />
      
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-100 mt-1">{value}</h3>
          {delta && (
            <p className="text-[10px] font-semibold mt-1">
              <span className={`px-2 py-0.5 rounded-full ${
                deltaType === 'positive' 
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                  : deltaType === 'negative' 
                    ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' 
                    : 'bg-slate-950/40 text-slate-400 border border-slate-800/40'
              }`}>
                {delta}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
