import React, { useState, useRef } from 'react';
import { User, Task } from '../../types';
import { WorkloadDayColumn, UserWorkloadStats, DayAllocation } from './types';
import { WorkloadCellPopover } from './WorkloadCellPopover';
import { UserAvatar } from '../common/UserAvatar';
import {
  Eye,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Move,
  Plus,
  Flame,
  Info,
  Calendar,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { getDisplayTaskTitle } from '../../lib/taskUtils';

interface ClickUpWorkloadGridProps {
  days: WorkloadDayColumn[];
  userStats: UserWorkloadStats[];
  isLight: boolean;
  onCellClick: (user: User, dayAlloc: DayAllocation, dayCol: WorkloadDayColumn) => void;
  onUserClick: (user: User) => void;
  onAddTaskToDay: (user: User, date: string) => void;
  onTaskReassign: (taskId: string, targetUserId: string, targetDate?: string) => void;
  onSelectTask: (task: Task) => void;
}

export const ClickUpWorkloadGrid: React.FC<ClickUpWorkloadGridProps> = ({
  days,
  userStats,
  isLight,
  onCellClick,
  onUserClick,
  onAddTaskToDay,
  onTaskReassign,
  onSelectTask
}) => {
  // State for hovered cell popover
  const [hoveredCell, setHoveredCell] = useState<{
    user: User;
    dayAlloc: DayAllocation;
    dayCol: WorkloadDayColumn;
    rect: DOMRect;
  } | null>(null);

  // Drag and Drop state
  const [dragOverCell, setDragOverCell] = useState<{ userId: string; date: string } | null>(null);
  const [isCollapsedAll, setIsCollapsedAll] = useState<boolean>(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCellMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    user: User,
    dayAlloc: DayAllocation,
    dayCol: WorkloadDayColumn
  ) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCell({
      user,
      dayAlloc,
      dayCol,
      rect
    });
  };

  const handleCellMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCell(null);
    }, 200);
  };

  const handleDragOver = (e: React.DragEvent, userId: string, date: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverCell || dragOverCell.userId !== userId || dragOverCell.date !== date) {
      setDragOverCell({ userId, date });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, userId: string, date: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCell(null);

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed && parsed.taskId) {
          onTaskReassign(parsed.taskId, userId, date);
        }
      }
    } catch (err) {
      // Fallback
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border overflow-hidden shadow-sm relative select-none ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#111923] border-[#233549]'
      }`}
    >
      {/* Scrollable Container */}
      <div className="overflow-x-auto w-full custom-scrollbar">
        <div className="min-w-[1200px] w-full">
          
          {/* TABLE HEADER ROW */}
          <div
            className={`flex items-stretch border-b text-xs font-semibold ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#16222F] border-[#233549] text-slate-300'
            }`}
          >
            {/* Left Sticky Column Header */}
            <div
              className={`w-64 sm:w-72 shrink-0 px-4 py-3 border-r flex items-center justify-between sticky left-0 z-20 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider">
                  Assignees {userStats.length}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  className="p-1 rounded-md hover:text-slate-200 hover:bg-slate-700/30 transition-colors"
                  title="Column visibility"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCollapsedAll(!isCollapsedAll)}
                  className="p-1 rounded-md hover:text-slate-200 hover:bg-slate-700/30 transition-colors"
                  title={isCollapsedAll ? 'Expand All Rows' : 'Collapse All Rows'}
                >
                  {isCollapsedAll ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Date Columns Header (28 Days) */}
            <div className="flex-1 flex items-stretch">
              {days.map((col) => (
                <div
                  key={col.date}
                  className={`flex-1 min-w-[42px] py-2.5 px-1 border-r text-center flex flex-col items-center justify-center transition-colors relative ${
                    isLight ? 'border-slate-200' : 'border-[#233549]'
                  } ${
                    col.isWeekend
                      ? isLight
                        ? 'bg-slate-100/60 text-slate-400'
                        : 'bg-[#0D1520]/80 text-slate-500'
                      : ''
                  } ${
                    col.isToday
                      ? isLight
                        ? 'bg-blue-50/80 font-bold'
                        : 'bg-blue-950/40 font-bold'
                      : ''
                  }`}
                >
                  {/* Day Number / Label (e.g. 12, 13, 1st) */}
                  <span
                    className={`inline-flex items-center justify-center text-xs font-mono transition-all ${
                      col.isToday
                        ? 'w-6 h-6 rounded-full bg-[#0096C7] text-white font-extrabold shadow-sm'
                        : col.isFirstOfMonth
                        ? 'font-bold text-teal-500'
                        : ''
                    }`}
                  >
                    {col.dayLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TABLE BODY: ASSIGNEE ROWS */}
          <div className="divide-y divide-slate-700/20">
            {userStats.map((stat) => {
              const { user, totalAllocatedHours, totalAllocatedMinutes, windowMaxHours, capacityPercent, isOverloaded, excessHours, dailyAllocations } = stat;

              // Format total allocated text e.g. "103h 5m/160h"
              const formattedAllocationText = totalAllocatedMinutes > 0
                ? `${Math.floor(totalAllocatedHours)}h ${totalAllocatedMinutes}m/${windowMaxHours}h`
                : `${totalAllocatedHours}h/${windowMaxHours}h`;

              return (
                <div
                  key={user.id}
                  className={`flex items-stretch transition-colors group ${
                    isLight ? 'hover:bg-slate-50/60' : 'hover:bg-[#16222F]/40'
                  }`}
                >
                  {/* Left Sticky Column: User Profile & Progress Bar */}
                  <div
                    onClick={() => onUserClick(user)}
                    className={`w-64 sm:w-72 shrink-0 px-4 py-3 border-r sticky left-0 z-10 cursor-pointer flex flex-col justify-center gap-1.5 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#111923] border-[#233549]'
                    }`}
                  >
                    {/* User Avatar + Name + Hours */}
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <UserAvatar
                          name={user.name}
                          email={user.email}
                          role={user.role}
                          size="md"
                          theme={isLight ? 'light' : 'dark'}
                        />
                        {isOverloaded && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full border-2 border-white animate-pulse" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={`text-xs font-bold truncate group-hover:text-teal-400 transition-colors ${
                              isLight ? 'text-slate-800' : 'text-white'
                            }`}
                          >
                            {user.name}
                          </h4>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {formattedAllocationText}
                        </div>
                      </div>
                    </div>

                    {/* Blue / Teal Progress Bar under name (matches ClickUp) */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverloaded
                            ? 'bg-rose-500'
                            : capacityPercent > 85
                            ? 'bg-amber-500'
                            : 'bg-[#0096C7]'
                        }`}
                        style={{ width: `${Math.min(100, capacityPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Daily Allocation Columns (28 Days) */}
                  <div className="flex-1 flex items-stretch">
                    {days.map((col) => {
                      const alloc = dailyAllocations[col.date] || {
                        date: col.date,
                        hours: 0,
                        dailyMaxHours: col.isWeekend ? 0 : 8,
                        percent: 0,
                        isOverloaded: false,
                        excessHours: 0,
                        excessMinutes: 0,
                        formattedOverloadBadge: '',
                        tasks: []
                      };

                      const isDragTarget = dragOverCell?.userId === user.id && dragOverCell?.date === col.date;
                      const hasWork = alloc.hours > 0;

                      // Fill height in percentage for tube (capped at 100% for container, height proportional to 8h)
                      const fillHeightPercent = Math.min(100, Math.max(15, (alloc.hours / (alloc.dailyMaxHours || 8)) * 100));

                      return (
                        <div
                          key={col.date}
                          onMouseEnter={(e) => handleCellMouseEnter(e, user, alloc, col)}
                          onMouseLeave={handleCellMouseLeave}
                          onClick={() => onCellClick(user, alloc, col)}
                          onDragOver={(e) => handleDragOver(e, user.id, col.date)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, user.id, col.date)}
                          className={`flex-1 min-w-[42px] min-h-[72px] border-r flex items-center justify-center p-1 relative transition-all cursor-pointer ${
                            isLight ? 'border-slate-200' : 'border-[#233549]'
                          } ${
                            col.isWeekend
                              ? isLight
                                ? 'bg-[repeating-linear-gradient(45deg,rgba(226,232,240,0.6),rgba(226,232,240,0.6)_6px,transparent_6px,transparent_12px)]'
                                : 'bg-[repeating-linear-gradient(45deg,rgba(15,23,42,0.6),rgba(15,23,42,0.6)_6px,transparent_6px,transparent_12px)] opacity-70'
                              : ''
                          } ${
                            isDragTarget
                              ? 'bg-teal-500/30 ring-2 ring-teal-400 z-10'
                              : isLight
                              ? 'hover:bg-slate-100/50'
                              : 'hover:bg-[#16222F]/60'
                          }`}
                        >
                          {/* Workload Pill/Tube Container for Workdays */}
                          {!col.isWeekend && hasWork && (
                            <div
                              className={`w-full h-[62px] rounded-lg overflow-hidden relative flex flex-col justify-end transition-all shadow-2xs group-hover:scale-102 ${
                                alloc.isOverloaded
                                  ? 'bg-[#FEE2E2] dark:bg-rose-950/40 border border-rose-400/40'
                                  : alloc.percent > 85
                                  ? 'bg-[#FEF3C7] dark:bg-amber-950/40 border border-amber-400/40'
                                  : 'bg-[#A7F3D0] dark:bg-emerald-950/40 border border-emerald-400/40'
                              }`}
                            >
                              {/* Bottom-up solid color fill tube */}
                              <div
                                className={`w-full rounded-b-md transition-all duration-300 ${
                                  alloc.isOverloaded
                                    ? 'bg-[#EF4444] dark:bg-rose-600'
                                    : alloc.percent > 85
                                    ? 'bg-[#F59E0B] dark:bg-amber-500'
                                    : 'bg-[#10B981] dark:bg-emerald-500'
                                }`}
                                style={{ height: `${fillHeightPercent}%` }}
                              />

                              {/* Overload White Badge Text inside Pill Header (Exactly as in ClickUp) */}
                              {alloc.isOverloaded && (
                                <div className="absolute top-1 inset-x-0 flex flex-col items-center justify-center text-center z-10 leading-tight px-0.5">
                                  <span className="text-[9.5px] font-black text-rose-700 dark:text-rose-200 uppercase tracking-tighter drop-shadow-xs">
                                    {alloc.excessHours > 0 ? `${alloc.excessHours}h` : ''}
                                    {alloc.excessMinutes > 0 ? ` ${alloc.excessMinutes}m` : ''}
                                  </span>
                                  <span className="text-[7.5px] font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-widest -mt-0.5">
                                    OVER
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Empty Workday subtle plus button on hover */}
                          {!col.isWeekend && !hasWork && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="p-1 rounded-md bg-slate-700/20 text-slate-400 hover:text-teal-400 hover:bg-slate-700/40 flex items-center justify-center">
                                <Plus className="w-3 h-3" />
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Hover Popover Portal/Card */}
      {hoveredCell && (
        <div
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleCellMouseLeave}
          className="fixed z-50 pointer-events-auto"
          style={{
            top: Math.min(window.innerHeight - 300, hoveredCell.rect.bottom + 8),
            left: Math.max(16, Math.min(window.innerWidth - 340, hoveredCell.rect.left - 120))
          }}
        >
          <WorkloadCellPopover
            user={hoveredCell.user}
            dayAllocation={hoveredCell.dayAlloc}
            dayLabel={hoveredCell.dayCol.dayLabel}
            weekdayShort={hoveredCell.dayCol.weekdayShort}
            isLight={isLight}
            onAddTaskToDay={onAddTaskToDay}
            onSelectTask={onSelectTask}
          />
        </div>
      )}
    </div>
  );
};
