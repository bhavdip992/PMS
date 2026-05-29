import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  tasks: any[];
  onTaskClick: (taskId: string) => void;
}

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get start of month and total days
  const startOfMonth = new Date(year, month, 1);
  const startDayOfWeek = startOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Generate days array
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Pad the start with empty slots
  const padding = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const allSlots = [...padding, ...days];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getTasksForDay = (dayNum: number) => {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate.getDate() === dayNum && 
             dueDate.getMonth() === month && 
             dueDate.getFullYear() === year;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-[hsl(var(--espark-surface))] border border-[hsl(var(--espark-border))] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[hsl(var(--espark-border))/0.6]">
        <div className="flex items-center space-x-2">
          <CalendarIcon size={16} className="text-[hsl(var(--espark-primary))]" />
          <h3 className="font-extrabold text-sm text-[hsl(var(--espark-text))]">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex space-x-2">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-[hsl(var(--espark-bg))] border border-[hsl(var(--espark-border))] text-[hsl(var(--espark-muted))] hover:text-[hsl(var(--espark-text))] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs">
        {/* Days of week */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="font-bold text-[hsl(var(--espark-muted))] uppercase py-1 tracking-wider text-[10px]">
            {day}
          </div>
        ))}

        {/* Days numbers */}
        {allSlots.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-[hsl(var(--espark-bg))]/30 min-h-[80px] rounded-xl border border-transparent" />;
          }

          const dayTasks = getTasksForDay(day);

          return (
            <div 
              key={`day-${day}`}
              className="bg-[hsl(var(--espark-bg))]/70 border border-[hsl(var(--espark-border))/0.4] min-h-[80px] p-2 rounded-xl text-left flex flex-col justify-between hover:border-[hsl(var(--espark-primary))/0.4] transition-all"
            >
              <span className="font-bold text-[10px] text-[hsl(var(--espark-muted))]">
                {day}
              </span>

              <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[60px] pr-0.5">
                {dayTasks.map(t => (
                  <div
                    key={t._id}
                    onClick={() => onTaskClick(t._id)}
                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded truncate cursor-pointer border ${
                      t.status === 'Done' 
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40' 
                        : 'bg-blue-950/80 text-blue-400 border-blue-800/40'
                    }`}
                    title={t.title}
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
