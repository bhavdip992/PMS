import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface TimelineViewProps {
  tasks: any[];
  onTaskClick: (taskId: string) => void;
}

export default function TimelineView({ tasks, onTaskClick }: TimelineViewProps) {
  // Filter tasks that have at least a due date or start date
  const datedTasks = tasks.filter(t => t.dueDate || t.startDate);

  // Sort by start date (or due date if start date is missing)
  datedTasks.sort((a, b) => {
    const dateA = new Date(a.startDate || a.dueDate).getTime();
    const dateB = new Date(b.startDate || b.dueDate).getTime();
    return dateA - dateB;
  });

  return (
    <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-[hsl(var(--espark-border))/0.6]">
        <div>
          <h3 className="font-extrabold text-sm text-[hsl(var(--espark-text))] flex items-center space-x-2">
            <CalendarIcon size={16} className="text-[hsl(var(--espark-primary))]" />
            <span>Gantt-Style Task Timeline</span>
          </h3>
          <p className="text-[10px] text-[hsl(var(--espark-muted))] mt-1">Visualize task dates, start schedules, and final deadlines.</p>
        </div>
      </div>

      <div className="space-y-4">
        {datedTasks.length === 0 ? (
          <div className="text-center py-12 text-[11px] text-[hsl(var(--espark-muted))] italic">
            No scheduled tasks found. Assign Start Dates or Due Dates to tasks to populate the timeline.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {datedTasks.map((t) => {
              const start = t.startDate ? new Date(t.startDate) : null;
              const due = t.dueDate ? new Date(t.dueDate) : null;
              
              const startFmt = start ? start.toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Not set';
              const dueFmt = due ? due.toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Not set';

              // Calculate progress representation
              let progressColor = 'bg-[hsl(var(--espark-primary))]';
              if (t.status === 'Done') progressColor = 'bg-[hsl(var(--espark-success))]';
              else if (t.status === 'In Progress') progressColor = 'bg-[hsl(var(--espark-warning))]';
              else if (t.status === 'In Review') progressColor = 'bg-purple-500';

              return (
                <div 
                  key={t._id}
                  onClick={() => onTaskClick(t._id)}
                  className="bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))/0.6] p-4 rounded-xl hover:border-[hsl(var(--espark-primary))/0.6] transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                        t.status === 'Done' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                        t.status === 'In Review' ? 'bg-indigo-950 text-indigo-400 border-indigo-800' :
                        t.status === 'In Progress' ? 'bg-blue-950 text-blue-400 border-blue-800' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-xs font-bold text-[hsl(var(--espark-text))] truncate">
                        {t.title}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-[10px] text-[hsl(var(--espark-muted))] line-clamp-1 leading-relaxed">
                        {t.description}
                      </p>
                    )}
                  </div>

                  {/* Date range representation */}
                  <div className="flex-1 w-full md:max-w-xs space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-[hsl(var(--espark-muted))]">
                      <span>Start: {startFmt}</span>
                      <span>Due: {dueFmt}</span>
                    </div>
                    <div className="relative w-full bg-[hsl(var(--espark-surface))] h-2.5 rounded-full overflow-hidden border border-[hsl(var(--espark-border))/0.6]">
                      <div 
                        className={`h-full rounded-full ${progressColor} transition-all duration-300`}
                        style={{ 
                          width: t.status === 'Done' ? '100%' : t.status === 'In Progress' ? '50%' : t.status === 'In Review' ? '75%' : '15%',
                          marginLeft: start && due ? '0' : '0'
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-[10px] text-[hsl(var(--espark-muted))] bg-[hsl(var(--espark-surface))] px-2.5 py-1 rounded-lg border border-[hsl(var(--espark-border))/0.5] font-mono">
                    <Clock size={11} />
                    <span>{t.estimatedHours || 0}h est</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
