import React from 'react';

interface WorkloadBarProps {
  name: string;
  tasksCount: number;
  hoursCount: number;
  maxHours?: number;
}

export default function WorkloadBar({
  name,
  tasksCount,
  hoursCount,
  maxHours = 40 // assume 40 hours is 100% load
}: WorkloadBarProps) {
  const percentage = Math.min((hoursCount / maxHours) * 100, 100);
  
  // Color code load levels
  const getProgressColor = (percent: number) => {
    if (percent > 90) return 'from-rose-600 to-red-500';
    if (percent > 65) return 'from-amber-600 to-amber-500';
    return 'from-violet-600 to-indigo-500';
  };

  const getLoadText = (percent: number) => {
    if (percent > 90) return 'Overloaded';
    if (percent > 65) return 'Balanced (High)';
    if (percent > 30) return 'Balanced';
    return 'Underutilized';
  };

  const getLoadColorClass = (percent: number) => {
    if (percent > 90) return 'text-rose-400 bg-rose-950/30 border-rose-900/40';
    if (percent > 65) return 'text-amber-400 bg-amber-950/30 border-amber-900/40';
    return 'text-emerald-400 bg-emerald-950/30 border-emerald-900/40';
  };

  return (
    <div className="space-y-2 p-4 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-850 hover:border-slate-800 transition-all rounded-xl">
      <div className="flex justify-between items-center text-xs">
        <div>
          <span className="font-extrabold text-slate-200">{name}</span>
          <span className="text-[10px] text-slate-500 ml-2">({tasksCount} active tasks)</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getLoadColorClass(percentage)}`}>
          {getLoadText(percentage)}
        </span>
      </div>
      <div className="space-y-1">
        <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
          <div 
            className={`bg-gradient-to-r ${getProgressColor(percentage)} h-full rounded-full transition-all duration-1000`} 
            style={{ width: `${percentage}%` }} 
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
          <span>{hoursCount} hrs assigned</span>
          <span>{Math.round(percentage)}% of weekly limit ({maxHours}h)</span>
        </div>
      </div>
    </div>
  );
}
