import React from 'react';
import { User, Task } from '../../types';
import { DayAllocation } from './types';
import { Clock, AlertTriangle, CheckCircle2, Plus, ArrowRight, Sparkles, User as UserIcon } from 'lucide-react';
import { getPriorityBadgeStyle } from '../../lib/priorityUtils';
import { getStatusBadgeStyle } from '../../lib/statusUtils';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { UserAvatar } from '../common/UserAvatar';

interface WorkloadCellPopoverProps {
  user: User;
  dayAllocation: DayAllocation;
  dayLabel: string;
  weekdayShort: string;
  isLight: boolean;
  onAddTaskToDay?: (user: User, date: string) => void;
  onSelectTask?: (task: Task) => void;
  onQuickReassign?: (task: Task, fromUser: User) => void;
}

export const WorkloadCellPopover: React.FC<WorkloadCellPopoverProps> = ({
  user,
  dayAllocation,
  dayLabel,
  weekdayShort,
  isLight,
  onAddTaskToDay,
  onSelectTask,
  onQuickReassign
}) => {
  const { hours, dailyMaxHours, percent, isOverloaded, formattedOverloadBadge, tasks } = dayAllocation;

  return (
    <div
      className={`w-72 sm:w-80 p-3.5 rounded-2xl shadow-2xl border text-xs space-y-3 z-50 animate-in fade-in zoom-in-95 pointer-events-auto ${
        isLight
          ? 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800 shadow-slate-300/50'
          : 'bg-[#121B26]/95 backdrop-blur-md border-[#233549] text-slate-100 shadow-black/80'
      }`}
    >
      {/* Header with User and Date */}
      <div className="flex items-center justify-between gap-2 border-b pb-2 border-slate-700/20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">
            <UserAvatar
              name={user.name}
              email={user.email}
              role={user.role}
              size="xs"
              theme={isLight ? 'light' : 'dark'}
            />
          </div>
          <div className="min-w-0">
            <div className="font-bold truncate text-xs">{user.name}</div>
            <div className="text-[10px] text-slate-400">
              {weekdayShort}, {dayAllocation.date}
            </div>
          </div>
        </div>

        {/* Capacity status pill */}
        <div
          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
            isOverloaded
              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
              : percent > 85
              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
          }`}
        >
          {hours}h / {dailyMaxHours}h ({percent}%)
        </div>
      </div>

      {/* Overload Alert Badge if overloaded */}
      {isOverloaded && (
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-between text-[11px] font-medium">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
            <span>{formattedOverloadBadge}</span>
          </div>
          <span className="text-[10px] opacity-90">Exceeds 8h Limit</span>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
          <span>Scheduled Tasks ({tasks.length})</span>
          <span>Hours</span>
        </div>

        {tasks.length === 0 ? (
          <div className="py-3 text-center text-slate-400 italic text-[11px]">
            No specific tasks allocated for this day.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onSelectTask?.(task)}
              className={`p-2 rounded-xl border transition-all cursor-pointer group flex items-center justify-between gap-2 ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-200'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[11px] truncate group-hover:text-teal-400 transition-colors">
                  {getDisplayTaskTitle(task)}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400">
                  <span className="px-1.5 py-0.2 rounded bg-slate-700/40 text-slate-300 font-mono">
                    {task.priority || 'Medium'}
                  </span>
                  <span className="truncate">{task.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-bold text-[11px] text-teal-400">
                  {task.estimatedHours || 4}h
                </span>
                {onQuickReassign && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickReassign(task, user);
                    }}
                    title="Quick Reassign to another member"
                    className="p-1 rounded-lg hover:bg-teal-500/20 text-slate-400 hover:text-teal-300 transition-colors"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Quick Actions */}
      <div className="pt-2 border-t border-slate-700/20 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onAddTaskToDay?.(user, dayAllocation.date)}
          className="flex-1 py-1.5 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-3 h-3" />
          <span>Add Task to Day</span>
        </button>
      </div>
    </div>
  );
};
