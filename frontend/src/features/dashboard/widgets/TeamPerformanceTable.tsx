import React from 'react';

interface TeamPerformanceItem {
  id: string;
  name: string;
  capacity: number;
  performanceScore: number;
  workloadPercentage: number;
  membersCount: number;
}

interface TeamPerformanceTableProps {
  teams: TeamPerformanceItem[];
}

export default function TeamPerformanceTable({ teams }: TeamPerformanceTableProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
      <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider">
        Team Performance & Capacity
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold pb-2">
              <th className="py-3 pr-4">Team Name</th>
              <th className="py-3 px-4">Members</th>
              <th className="py-3 px-4">Capacity</th>
              <th className="py-3 px-4">Workload</th>
              <th className="py-3 pl-4 text-right">Perf Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-xs">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                  No team performance logs available.
                </td>
              </tr>
            ) : (
              teams.map(t => (
                <tr key={t.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3.5 pr-4 font-bold text-slate-200">{t.name}</td>
                  <td className="py-3.5 px-4 text-slate-400">{t.membersCount} members</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">{t.capacity}%</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div 
                          className={`h-full rounded-full ${
                            t.workloadPercentage > 90 
                              ? 'bg-rose-500' 
                              : t.workloadPercentage > 65 
                                ? 'bg-amber-500' 
                                : 'bg-violet-500'
                          }`}
                          style={{ width: `${Math.min(t.workloadPercentage, 100)}%` }} 
                        />
                      </div>
                      <span className="font-extrabold text-[10px] text-slate-400">{t.workloadPercentage}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 pl-4 text-right font-black text-emerald-400">{t.performanceScore}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
