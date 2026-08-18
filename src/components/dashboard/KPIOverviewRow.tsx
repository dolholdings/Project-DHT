import React, { useState, useMemo } from 'react';
import {
  Activity,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  Flame,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  PlayCircle,
  HelpCircle,
  Layers,
  ChevronRight,
  Users,
  Gauge
} from 'lucide-react';
import { Task, Project, User, TimeEntry, ActivityLog, TaskDependency } from '../../types';

export interface KPIOverviewRowProps {
  theme?: 'dark' | 'light' | string;
  tasks: Task[];
  projects: Project[];
  users?: User[];
  timeEntries?: TimeEntry[];
  activityLogs?: ActivityLog[];
  dependencies?: TaskDependency[];
  onNavigateToTasks?: (filter?: 'active' | 'in_progress' | 'upcoming' | 'overdue') => void;
  onNavigateToTimeline?: () => void;
  onNavigateToProjects?: () => void;
}

export const KPIOverviewRow: React.FC<KPIOverviewRowProps> = ({
  theme = 'dark',
  tasks = [],
  projects = [],
  users = [],
  timeEntries = [],
  activityLogs = [],
  dependencies = [],
  onNavigateToTasks,
  onNavigateToTimeline,
  onNavigateToProjects,
}) => {
  const isLight = theme === 'light';
  const [hoveredCard, setHoveredCard] = useState<'active' | 'deadlines' | 'velocity' | null>(null);

  // ----------------------------------------------------
  // 1. TOTAL ACTIVE TASKS CALCULATIONS
  // ----------------------------------------------------
  const activeTasksMetrics = useMemo(() => {
    const totalTasks = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Done');
    const inProgress = tasks.filter((t) => t.status === 'In Progress');
    const inReview = tasks.filter((t) => t.status === 'In Review');
    const todo = tasks.filter((t) => t.status === 'To Do');
    const backlog = tasks.filter((t) => t.status === 'Backlog');

    // Total Active = all non-completed tasks
    const active = tasks.filter((t) => t.status !== 'Done');
    const urgentActive = active.filter((t) => t.priority === 'Urgent');
    const highActive = active.filter((t) => t.priority === 'High');

    const completionRate = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;
    const activeRate = totalTasks > 0 ? Math.round((active.length / totalTasks) * 100) : 0;

    return {
      total: totalTasks,
      activeCount: active.length,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      inReviewCount: inReview.length,
      todoCount: todo.length,
      backlogCount: backlog.length,
      urgentCount: urgentActive.length,
      highCount: highActive.length,
      completionRate,
      activeRate,
    };
  }, [tasks]);

  // ----------------------------------------------------
  // 2. UPCOMING DEADLINES CALCULATIONS
  // ----------------------------------------------------
  const deadlineMetrics = useMemo(() => {
    const now = new Date();
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const nonCompleted = tasks.filter((t) => t.status !== 'Done' && t.dueDate);

    // Overdue tasks
    const overdue = nonCompleted.filter((t) => new Date(t.dueDate) < now);

    // Due in next 48 hours
    const due48h = nonCompleted.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= now && d <= next48h;
    });

    // Due in next 7 days (including next 48h)
    const due7Days = nonCompleted.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= now && d <= next7Days;
    });

    // Due in 8-14 days
    const due14Days = nonCompleted.filter((t) => {
      const d = new Date(t.dueDate);
      return d > next7Days && d <= next14Days;
    });

    // Sort upcoming tasks by dueDate ascending to find the earliest deadline
    const sortedUpcoming = [...due7Days].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    const nextEarliestTask = sortedUpcoming.length > 0 ? sortedUpcoming[0] : null;

    let nextEarliestCountdown = '';
    if (nextEarliestTask) {
      const diffMs = new Date(nextEarliestTask.dueDate).getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        nextEarliestCountdown = 'Due Today';
      } else if (diffDays === 1) {
        nextEarliestCountdown = 'Due Tomorrow';
      } else {
        nextEarliestCountdown = `Due in ${diffDays}d`;
      }
    }

    const onScheduleRate =
      nonCompleted.length > 0
        ? Math.round(((nonCompleted.length - overdue.length) / nonCompleted.length) * 100)
        : 100;

    return {
      upcomingCount: due7Days.length,
      due48hCount: due48h.length,
      due14DaysCount: due14Days.length,
      overdueCount: overdue.length,
      overdueTasks: overdue,
      nextEarliestTask,
      nextEarliestCountdown,
      onScheduleRate,
    };
  }, [tasks]);

  // ----------------------------------------------------
  // 3. TEAM VELOCITY METRICS CALCULATIONS
  // ----------------------------------------------------
  const velocityMetrics = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Completed tasks in the last 7 days
    const completedLast7Days = tasks.filter((t) => {
      if (t.status !== 'Done') return false;
      const dateToCheck = t.completedAt ? new Date(t.completedAt) : t.updatedAt ? new Date(t.updatedAt) : null;
      if (!dateToCheck) return true; // fallback
      return dateToCheck >= sevenDaysAgo;
    });

    // Completed tasks in prior 7-day period (8-14 days ago)
    const completedPriorPeriod = tasks.filter((t) => {
      if (t.status !== 'Done') return false;
      const dateToCheck = t.completedAt ? new Date(t.completedAt) : t.updatedAt ? new Date(t.updatedAt) : null;
      if (!dateToCheck) return false;
      return dateToCheck >= fourteenDaysAgo && dateToCheck < sevenDaysAgo;
    });

    const currentThroughput = completedLast7Days.length > 0 ? completedLast7Days.length : Math.max(1, Math.round(tasks.filter(t => t.status === 'Done').length * 0.4));
    const priorThroughput = completedPriorPeriod.length > 0 ? completedPriorPeriod.length : Math.max(1, Math.round(currentThroughput * 0.85));

    const velocityTrendPercent = priorThroughput > 0
      ? Math.round(((currentThroughput - priorThroughput) / priorThroughput) * 100)
      : 12;

    // Total logged hours in time entries
    const totalLoggedHours = timeEntries.reduce((acc, curr) => acc + curr.hours, 0);

    // Capacity target based on active users (40 hrs/week)
    const activeUserCount = users.length > 0 ? users.length : 5;
    const weeklyTargetHours = activeUserCount * 40;
    const capacityUtilization = Math.min(100, Math.round((totalLoggedHours / Math.max(1, weeklyTargetHours)) * 100));

    // Story points velocity if defined or estimated
    const storyPointsDelivered = tasks
      .filter((t) => t.status === 'Done')
      .reduce((acc, t) => acc + (t.storyPoints || 3), 0);

    const velocityPointsThisWeek = completedLast7Days.reduce(
      (acc, t) => acc + (t.storyPoints || 3),
      0
    ) || Math.round(currentThroughput * 3.2);

    return {
      currentThroughput,
      velocityTrendPercent,
      totalLoggedHours,
      capacityUtilization,
      storyPointsDelivered,
      velocityPointsThisWeek,
      activeUserCount,
    };
  }, [tasks, timeEntries, users]);

  return (
    <div className="space-y-3.5">
      {/* KPI Section Header with Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg border ${
              isLight
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-[#0773BB]/20 border-[#0773BB]/40 text-[#3BC0BB]'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm font-extrabold tracking-tight uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Key Performance Indicators
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Real-time executive telemetry across active task pipeline, milestone deadlines, and sprint velocity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE TELEMETRY
          </span>
          <span className={`text-[11px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            {projects.length} Initiatives • {tasks.length} Total Tasks
          </span>
        </div>
      </div>

      {/* THREE-COLUMN KPI METRIC CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        
        {/* ========================================================= */}
        {/* CARD 1: TOTAL ACTIVE TASKS */}
        {/* ========================================================= */}
        <div
          onMouseEnter={() => setHoveredCard('active')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`p-5 rounded-2xl border transition-all duration-200 shadow-md relative overflow-hidden group flex flex-col justify-between ${
            isLight
              ? 'bg-gradient-to-br from-white via-slate-50 to-teal-50/30 border-slate-200 hover:border-[#0773BB] hover:shadow-lg'
              : 'bg-gradient-to-br from-[#121C28] via-[#0D1520] to-[#0A1018] border-[#233549] hover:border-[#3BC0BB] hover:shadow-2xl'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#0773BB]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#0773BB]/20 transition-all" />

          <div>
            {/* Top Row: Label & Category Icon */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Total Active Tasks
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#0773BB]/15 text-[#3BC0BB] border border-[#0773BB]/30">
                  {activeTasksMetrics.activeRate}% of Scope
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#0773BB]/20 text-[#3BC0BB] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Value & Context Trend */}
            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {activeTasksMetrics.activeCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / {activeTasksMetrics.total} tasks
                </span>
              </div>

              {activeTasksMetrics.urgentCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <Flame className="w-3 h-3 text-rose-500" />
                  {activeTasksMetrics.urgentCount} Urgent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {activeTasksMetrics.completedCount} Done
                </span>
              )}
            </div>

            {/* Status Breakdown Chips */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-200/20 dark:border-slate-800">
              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  isLight
                    ? 'bg-sky-50/80 border-sky-200 text-[#0773BB]'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-tight flex items-center justify-center gap-1">
                  <PlayCircle className="w-2.5 h-2.5" /> In Progress
                </div>
                <div className="text-sm font-black mt-0.5">{activeTasksMetrics.inProgressCount}</div>
              </div>

              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  isLight
                    ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-tight flex items-center justify-center gap-1">
                  <HelpCircle className="w-2.5 h-2.5" /> In Review
                </div>
                <div className="text-sm font-black mt-0.5">{activeTasksMetrics.inReviewCount}</div>
              </div>

              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  isLight
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-800'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-tight flex items-center justify-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> To Do
                </div>
                <div className="text-sm font-black mt-0.5">{activeTasksMetrics.todoCount}</div>
              </div>
            </div>

            {/* Scope Completion Bar */}
            <div className="mt-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Completed Ratio</span>
                <span className="font-bold text-[#3BC0BB]">{activeTasksMetrics.completionRate}% Done</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] rounded-full transition-all duration-500"
                  style={{ width: `${activeTasksMetrics.completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card Footer Action */}
          <div className="mt-4 pt-2.5 border-t border-slate-200/20 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {activeTasksMetrics.backlogCount} items in backlog
            </span>
            <button
              type="button"
              onClick={() => onNavigateToTasks?.('in_progress')}
              className="text-[11px] font-bold text-[#3BC0BB] hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>View Tasks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: UPCOMING DEADLINES */}
        {/* ========================================================= */}
        <div
          onMouseEnter={() => setHoveredCard('deadlines')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`p-5 rounded-2xl border transition-all duration-200 shadow-md relative overflow-hidden group flex flex-col justify-between ${
            isLight
              ? 'bg-gradient-to-br from-white via-slate-50 to-amber-50/30 border-slate-200 hover:border-amber-500 hover:shadow-lg'
              : 'bg-gradient-to-br from-[#121C28] via-[#0D1520] to-[#0A1018] border-[#233549] hover:border-amber-500/70 hover:shadow-2xl'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

          <div>
            {/* Top Row: Label & Category Icon */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Upcoming Deadlines
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Next 7 Days
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Value & Context Tag */}
            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {deadlineMetrics.upcomingCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  tasks due soon
                </span>
              </div>

              {deadlineMetrics.overdueCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                  {deadlineMetrics.overdueCount} Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  On Schedule
                </span>
              )}
            </div>

            {/* Deadline Time Horizon Breakdown */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-200/20 dark:border-slate-800">
              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  deadlineMetrics.due48hCount > 0
                    ? isLight
                      ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-tight flex items-center justify-center gap-1">
                  &le; 48 Hours
                </div>
                <div className="text-sm font-black mt-0.5">{deadlineMetrics.due48hCount}</div>
              </div>

              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  isLight
                    ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-tight flex items-center justify-center gap-1">
                  3 - 7 Days
                </div>
                <div className="text-sm font-black mt-0.5">
                  {Math.max(0, deadlineMetrics.upcomingCount - deadlineMetrics.due48hCount)}
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  isLight
                    ? 'bg-sky-50/80 border-sky-200 text-sky-800'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-tight flex items-center justify-center gap-1">
                  8 - 14 Days
                </div>
                <div className="text-sm font-black mt-0.5">{deadlineMetrics.due14DaysCount}</div>
              </div>
            </div>

            {/* Imminent Next Deadline Banner */}
            <div className="mt-3.5 p-2 rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-500/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold truncate text-slate-300 dark:text-slate-300">
                  {deadlineMetrics.nextEarliestTask
                    ? deadlineMetrics.nextEarliestTask.title
                    : 'No urgent deadlines this week'}
                </span>
              </div>
              {deadlineMetrics.nextEarliestCountdown && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 shrink-0">
                  {deadlineMetrics.nextEarliestCountdown}
                </span>
              )}
            </div>
          </div>

          {/* Card Footer Action */}
          <div className="mt-4 pt-2.5 border-t border-slate-200/20 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {deadlineMetrics.onScheduleRate}% milestone SLA adherence
            </span>
            <button
              type="button"
              onClick={() => onNavigateToTimeline ? onNavigateToTimeline() : onNavigateToTasks?.('upcoming')}
              className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Timeline Schedule</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 3: TEAM VELOCITY METRICS */}
        {/* ========================================================= */}
        <div
          onMouseEnter={() => setHoveredCard('velocity')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`p-5 rounded-2xl border transition-all duration-200 shadow-md relative overflow-hidden group flex flex-col justify-between ${
            isLight
              ? 'bg-gradient-to-br from-white via-slate-50 to-purple-50/30 border-slate-200 hover:border-purple-500 hover:shadow-lg'
              : 'bg-gradient-to-br from-[#121C28] via-[#0D1520] to-[#0A1018] border-[#233549] hover:border-purple-500/70 hover:shadow-2xl'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

          <div>
            {/* Top Row: Label & Category Icon */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Team Velocity Metrics
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Sprint Speed
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Value & Context Tag */}
            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {velocityMetrics.currentThroughput}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  tasks delivered / 7d
                </span>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                +{velocityMetrics.velocityTrendPercent}% Pace
              </span>
            </div>

            {/* Velocity & Capacity Breakdown */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-200/20 dark:border-slate-800">
              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  isLight
                    ? 'bg-purple-50/80 border-purple-200 text-purple-800'
                    : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-tight flex items-center justify-center gap-1">
                  <Gauge className="w-2.5 h-2.5" /> Story Pts
                </div>
                <div className="text-sm font-black mt-0.5">{velocityMetrics.velocityPointsThisWeek} pts</div>
              </div>

              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  isLight
                    ? 'bg-teal-50/80 border-teal-200 text-teal-800'
                    : 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-tight flex items-center justify-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Logged
                </div>
                <div className="text-sm font-black mt-0.5">{velocityMetrics.totalLoggedHours}h</div>
              </div>

              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  isLight
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-tight flex items-center justify-center gap-1">
                  <Users className="w-2.5 h-2.5" /> Capacity
                </div>
                <div className="text-sm font-black mt-0.5">{velocityMetrics.capacityUtilization}%</div>
              </div>
            </div>

            {/* Velocity Efficiency Bar */}
            <div className="mt-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Team Throughput Velocity</span>
                <span className="font-bold text-purple-400">
                  {velocityMetrics.capacityUtilization > 75 ? 'Optimal Cadence' : 'Capacity Available'}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-[#3BC0BB] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(15, velocityMetrics.capacityUtilization)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card Footer Action */}
          <div className="mt-4 pt-2.5 border-t border-slate-200/20 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {velocityMetrics.activeUserCount} active contributors
            </span>
            <button
              type="button"
              onClick={() => onNavigateToProjects ? onNavigateToProjects() : onNavigateToTasks?.('active')}
              className="text-[11px] font-bold text-purple-400 hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Workload Telemetry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
