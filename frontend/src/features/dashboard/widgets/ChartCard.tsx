import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  icon: LucideIcon;
  iconColorClass?: string;
  children: React.ReactNode;
}

export default function ChartCard({
  title,
  icon: Icon,
  iconColorClass = 'text-violet-400',
  children
}: ChartCardProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
      <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center space-x-2">
        <Icon size={16} className={iconColorClass} />
        <span>{title}</span>
      </h3>
      <div className="h-72 w-full">
        {children}
      </div>
    </div>
  );
}
