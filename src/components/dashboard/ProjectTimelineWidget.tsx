import React, { useState, useRef } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Milestone,
  Check,
  AlertTriangle,
  Flag
} from 'lucide-react';
import { Project, Task, User, Priority } from '../../types';

export interface ProjectTimelineWidgetProps {
  theme?: 'dark' | 'light';
  projects: Project[];
  tasks: Task[];
  users: User[];
  onNavigateToTimeline?: () => void;
}

export const ProjectTimelineWidget: React.FC<ProjectTimelineWidgetProps> = ({
  theme = 'dark',
  projects,
  tasks,
  users,
  onNavigateToTimeline
}) => {
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'project' | 'task'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const userMap = new Map<string, { name: string; avatar: string }>();
  users.forEach((u) => userMap.set(u.id, { name: u.name, avatar: u.avatar }));

  const now = new Date();

  // Combine projects and tasks into chronological timeline events
  const timelineEvents: Array<{
    id: string;
    title: string;
    code: string;
    dateStr: string;
    daysDiff: number;
    type: 'project' | 'task';
    status: string;
    progress?: number;
    priority?: Priority;
    assigneeName?: string;
    assigneeAvatar?: string;
  }> = [
    ...projects
      .filter((p) => p.dueDate || p.startDate)
      .map((p) => {
        const dateStr = p.dueDate || p.startDate;
        const d = new Date(dateStr);
        const daysDiff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const mgr = p.managerId ? userMap.get(p.managerId) : undefined;
        return {
          id: `p-${p.id}`,
          title: p.title,
          code: p.code || 'PROJ',
          dateStr,
          daysDiff,
          type: 'project' as const,
          status: p.status === 'Completed' ? 'Completed' : daysDiff < 0 ? 'Overdue' : 'In Progress',
          progress: p.progress,
          assigneeName: mgr?.name,
          assigneeAvatar: mgr?.avatar
        };
      }),
    ...tasks
      .filter((t) => t.dueDate)
      .map((t) => {
        const d = new Date(t.dueDate);
        const daysDiff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const firstAssignee = t.assigneeIds && t.assigneeIds.length > 0 ? userMap.get(t.assigneeIds[0]) : undefined;
        return {
          id: `t-${t.id}`,
          title: t.title,
          code: `TASK-${t.id.slice(-4).toUpperCase()}`,
          dateStr: t.dueDate,
          daysDiff,
          type: 'task' as const,
          status: t.status === 'Done' ? 'Completed' : daysDiff < 0 ? 'Overdue' : 'In Progress',
          priority: t.priority,
          assigneeName: firstAssignee?.name,
          assigneeAvatar: firstAssignee?.avatar
        };
      })
  ].sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());

  const filteredEvents = timelineEvents.filter((ev) => {
    if (timelineFilter === 'all') return true;
    return ev.type === timelineFilter;
  });

  return (
    <div className="p-5 sm:p-6 space-y-4">
      {/* Timeline Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">
            {filteredEvents.length} chronological milestones scheduled
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-[#0D1520] rounded-xl border border-[#233549] text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setTimelineFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timelineFilter === 'all'
                  ? 'bg-[#0773BB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('project')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timelineFilter === 'project'
                  ? 'bg-[#0773BB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Projects
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('task')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timelineFilter === 'task'
                  ? 'bg-[#0773BB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tasks
            </button>
          </div>

          {/* Scroll Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollTimeline('left')}
              className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#16222F] text-slate-300 hover:text-white border border-[#233549] transition-all"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTimeline('right')}
              className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#16222F] text-slate-300 hover:text-white border border-[#233549] transition-all"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onNavigateToTimeline && (
            <button
              type="button"
              onClick={onNavigateToTimeline}
              className="px-3 py-1.5 rounded-xl bg-[#0773BB]/20 hover:bg-[#0773BB]/30 text-[#3BC0BB] border border-[#0773BB]/40 font-bold text-xs flex items-center gap-1 transition-all ml-1"
            >
              <span>Full Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#0D1520]/50 border border-dashed border-[#233549] text-xs text-slate-400 space-y-1">
          <Milestone className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="font-semibold text-slate-300">No upcoming milestones found for this filter.</p>
          <p>Assign due dates to projects or tasks to populate the timeline.</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="overflow-x-auto pb-3 pt-2 no-scrollbar scroll-smooth"
        >
          <div className="inline-flex items-start gap-5 min-w-full px-1">
            {filteredEvents.map((ev, index) => {
              const isOverdue = ev.status === 'Overdue';
              const isCompleted = ev.status === 'Completed';
              const isInProgress = ev.status === 'In Progress';

              const nodeBg = isCompleted
                ? 'bg-emerald-500 text-white border-emerald-400'
                : isOverdue
                ? 'bg-rose-500 text-white border-rose-400'
                : isInProgress
                ? 'bg-sky-500 text-white border-sky-400'
                : 'bg-purple-500 text-white border-purple-400';

              const badgeColor = isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isOverdue
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : isInProgress
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-purple-500/20 text-purple-400 border-purple-500/40';

              const formattedDate = new Date(ev.dateStr).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={ev.id} className="w-72 shrink-0 flex flex-col group">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-slate-300 font-bold text-[11px] flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-[#3BC0BB]" />
                      {formattedDate}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeColor}`}>
                      {isCompleted ? 'Done' : isOverdue ? `Overdue (${Math.abs(ev.daysDiff)}d)` : ev.daysDiff === 0 ? 'Due Today' : `In ${ev.daysDiff}d`}
                    </span>
                  </div>

                  <div className="relative flex items-center py-2 mb-3">
                    <div
                      className={`absolute left-0 right-0 h-0.5 ${
                        index === filteredEvents.length - 1 ? 'w-1/2' : 'w-full'
                      } ${isCompleted ? 'bg-emerald-500/50' : 'bg-[#233549]'}`}
                    />

                    <div className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${nodeBg}`}>
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : isOverdue ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : ev.type === 'project' ? (
                        <Milestone className="w-3.5 h-3.5" />
                      ) : (
                        <Flag className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 hover:border-[#0773BB] shadow-xs'
                      : 'bg-[#0D1520] border-[#233549] hover:border-[#3BC0BB] hover:bg-[#121C28]'
                  }`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                          @{ev.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          ev.type === 'project' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {ev.type}
                        </span>
                      </div>

                      <h4 className={`text-xs font-bold line-clamp-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {ev.title}
                      </h4>
                    </div>

                    <div className="pt-2.5 border-t border-[#233549]/60 flex items-center justify-between text-[11px]">
                      {ev.assigneeName ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <img
                            src={ev.assigneeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={ev.assigneeName}
                            className="w-4 h-4 rounded-full object-cover border border-[#3BC0BB]"
                          />
                          <span className="text-slate-300 truncate font-medium text-[10px]">{ev.assigneeName.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[10px]">Unassigned</span>
                      )}

                      {ev.progress !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-[#3BC0BB] font-bold">{ev.progress}%</span>
                          <div className="w-12 bg-slate-800 rounded-full h-1 overflow-hidden">
                            <div className="bg-[#3BC0BB] h-1 rounded-full" style={{ width: `${ev.progress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-mono font-semibold ${
                          ev.priority === 'Urgent' ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {ev.priority || 'Normal'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
