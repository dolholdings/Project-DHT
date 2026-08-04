import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CalendarView: React.FC = () => {
  const { tasks } = useApp();
  const [currentMonth, setCurrentMonth] = useState('August 2026');

  // Days matrix for August 2026
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#0773BB]" />
            <span>Master Schedule Calendar</span>
          </h1>
          <p className="text-xs text-slate-400">
            Monthly delivery schedule and project task due date calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-[#16222F] border border-[#233549] text-slate-300 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white font-mono">{currentMonth}</span>
          <button className="p-2 rounded-xl bg-[#16222F] border border-[#233549] text-slate-300 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4 shadow-xl">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-[#233549]">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const dateStr = `2026-08-${d.toString().padStart(2, '0')}`;
            const dayTasks = tasks.filter((t) => t.dueDate === dateStr);

            return (
              <div
                key={d}
                className={`min-h-[100px] p-2 rounded-xl border flex flex-col justify-between ${
                  d === 3
                    ? 'bg-[#0773BB]/10 border-[#0773BB]'
                    : 'bg-[#0D1520] border-[#233549]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold font-mono ${
                      d === 3 ? 'text-[#3BC0BB]' : 'text-slate-400'
                    }`}
                  >
                    {d}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </div>

                <div className="space-y-1 mt-1">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-1 rounded bg-[#16222F] border border-[#233549] text-[9px] font-bold text-white truncate"
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
    </div>
  );
};
