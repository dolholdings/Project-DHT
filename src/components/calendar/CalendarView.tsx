import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CalendarView: React.FC = () => {
  const { tasks, theme } = useApp();
  const [currentMonth, setCurrentMonth] = useState('August 2026');

  // Days matrix for August 2026
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <CalendarDays className="w-6 h-6 text-[#0773BB]" />
            <span>Master Schedule Calendar</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Monthly delivery schedule and project task due date calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className={`p-2 rounded-xl border transition-colors ${
            theme === 'light' ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#16222F] border-[#233549] text-slate-300 hover:text-white'
          }`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`text-sm font-bold font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{currentMonth}</span>
          <button className={`p-2 rounded-xl border transition-colors ${
            theme === 'light' ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#16222F] border-[#233549] text-slate-300 hover:text-white'
          }`}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F]/80 backdrop-blur-md border-[#233549]'
      }`}>
        <div className={`grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider pb-2 border-b ${
          theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-[#233549]'
        }`}>
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
                    ? theme === 'light' ? 'bg-teal-50 border-teal-300' : 'bg-[#0773BB]/10 border-[#0773BB]'
                    : theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold font-mono ${
                      d === 3 ? 'text-[#0D9488]' : theme === 'light' ? 'text-slate-600' : 'text-slate-400'
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
                      className={`p-1 rounded border text-[9px] font-bold truncate ${
                        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16222F] border-[#233549] text-white'
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
    </div>
  );
};
