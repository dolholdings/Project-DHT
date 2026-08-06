import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  SlidersHorizontal,
  Pin,
  PinOff,
  MoveUp,
  MoveDown,
  RotateCcw,
  Check,
  Flame,
  UserCheck,
  Sparkles,
  X,
  Eye,
  EyeOff,
  Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APPROVED_DOMAINS, Task } from '../../types';
import { calculatePriorityScore } from '../../lib/priorityScore';
import { LiveActivityStream } from './LiveActivityStream';

export interface DailyBriefData {
  summary: string;
  keyProgress: string[];
  upcomingDeadlines: string[];
  urgentBlockers: string[];
  actionPlan: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DashboardWidgetConfig {
  id: string;
  name: string;
  description: string;
  category: 'Overview' | 'Tasks' | 'Analytics' | 'Security' | 'AI Insights';
  pinned: boolean;
  order: number;
}

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: 'daily_brief',
    name: 'Gemini AI Executive Daily Brief',
    description: 'AI-generated summary of key daily progress, upcoming deadlines, and urgent blockers based on task history.',
    category: 'AI Insights',
    pinned: true,
    order: 0,
  },
  {
    id: 'quick_stats',
    name: 'KPI Overview Stats Cards',
    description: 'Summary indicators for active projects, completion rate, risks, and total effort hours.',
    category: 'Overview',
    pinned: true,
    order: 1,
  },
  {
    id: 'my_tasks',
    name: 'My Assigned Tasks',
    description: 'Personal task queue with calculated Priority Scores and quick status toggles.',
    category: 'Tasks',
    pinned: true,
    order: 2,
  },
  {
    id: 'urgent_deps',
    name: 'Urgent Dependencies & Blockers',
    description: 'Critical path tasks that block downstream work or have overdue deadlines.',
    category: 'Tasks',
    pinned: true,
    order: 3,
  },
  {
    id: 'workload_summary',
    name: 'Team Workload & Effort Summary',
    description: 'Breakdown of logged hours, billable effort, and team workload capacity.',
    category: 'Analytics',
    pinned: true,
    order: 4,
  },
  {
    id: 'projects_health',
    name: 'Active Projects Portfolio Health',
    description: 'Strategic project list with progress indicators and budget allocation.',
    category: 'Overview',
    pinned: true,
    order: 5,
  },
  {
    id: 'activity_stream',
    name: 'Real-Time Activity Audit',
    description: 'Live audit trail showing recent team actions, updates, and timestamps.',
    category: 'Analytics',
    pinned: true,
    order: 6,
  },
  {
    id: 'domain_whitelist',
    name: 'Domain Security Governance',
    description: 'Approved corporate email domain whitelist for workspace access control.',
    category: 'Security',
    pinned: true,
    order: 7,
  },
];

export const DashboardView: React.FC = () => {
  const {
    projects,
    tasks,
    users,
    activeCompany,
    activityLogs,
    setActiveTab,
    timeEntries,
    currentUser,
    updateTask,
    dependencies,
    theme
  } = useApp();

  const [isCustomizeOpen, setCustomizeOpen] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem('dolphin_pinned_widgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved widget preferences', e);
    }
    return DEFAULT_WIDGETS;
  });

  // Sync widgets with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dolphin_pinned_widgets', JSON.stringify(widgets));
    } catch (e) {
      console.error('Failed to save widget preferences', e);
    }
  }, [widgets]);

  const togglePinWidget = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, pinned: !w.pinned } : w))
    );
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    setWidgets((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((w) => w.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === sorted.length - 1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const tempOrder = sorted[index].order;
      sorted[index].order = sorted[targetIndex].order;
      sorted[targetIndex].order = tempOrder;

      return [...sorted].sort((a, b) => a.order - b.order);
    });
  };

  const resetWidgetsToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  // Filter tasks & projects by workspace
  const companyProjects = projects.filter((p) => p.companyId === activeCompany?.id).length > 0
    ? projects.filter((p) => p.companyId === activeCompany?.id)
    : projects;
  const companyTasks = tasks.filter((t) => t.companyId === activeCompany?.id).length > 0
    ? tasks.filter((t) => t.companyId === activeCompany?.id)
    : tasks;

  const [dailyBrief, setDailyBrief] = useState<DailyBriefData | null>(null);
  const [briefLoading, setBriefLoading] = useState<boolean>(false);
  const [briefGeneratedAt, setBriefGeneratedAt] = useState<string | null>(null);

  const fetchDailyBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await fetch('/api/ai/daily-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: companyTasks,
          projects: companyProjects,
          activityLogs,
          userName: currentUser?.name || 'Team Member'
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.brief) {
        setDailyBrief(data.brief);
        setBriefGeneratedAt(
          data.generatedAt
            ? new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } else {
        throw new Error(data.error || 'Failed to generate brief');
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.warn('Daily brief API fallback used:', e?.message || e);
      const doneCount = companyTasks.filter(t => t.status === 'Done').length;
      const urgentList = companyTasks.filter(t => t.priority === 'Urgent' && t.status !== 'Done');
      const overdueList = companyTasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date());

      setDailyBrief({
        summary: `Workspace execution is active with ${doneCount} tasks completed out of ${companyTasks.length} overall. Priority is focused on upcoming milestones and critical path dependencies.`,
        keyProgress: [
          `${doneCount} tasks completed across active workspace projects.`,
          `Execution progressing on ${companyProjects.length} initiative(s).`
        ],
        upcomingDeadlines: overdueList.length > 0
          ? overdueList.slice(0, 3).map(t => `${t.title} (Overdue: ${t.dueDate})`)
          : ['All project milestones currently on schedule.'],
        urgentBlockers: urgentList.length > 0
          ? urgentList.slice(0, 3).map(t => `${t.title} flagged as Urgent`)
          : ['No critical path blockers reported.'],
        actionPlan: [
          'Review calculated Priority Scores on open tasks.',
          'Synchronize logged hours and task status updates before end of day.'
        ],
        riskLevel: urgentList.length > 1 || overdueList.length > 1 ? 'HIGH' : 'LOW'
      });
      setBriefGeneratedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setBriefLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!dailyBrief) {
      fetchDailyBrief();
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const completedTasks = companyTasks.filter((t) => t.status === 'Done');
  const inProgressTasks = companyTasks.filter((t) => t.status === 'In Progress');
  const urgentTasks = companyTasks.filter((t) => t.priority === 'Urgent' && t.status !== 'Done');

  const now = new Date();
  const overdueTasks = companyTasks.filter(
    (t) => t.status !== 'Done' && new Date(t.dueDate) < now
  );

  const totalLoggedHours = timeEntries.reduce((acc, curr) => acc + curr.hours, 0);

  // My Tasks
  const myTasks = companyTasks.filter((t) => currentUser?.id ? t.assigneeIds.includes(currentUser.id) : false);

  // Urgent / Dependent tasks
  const urgentAndBlockers = companyTasks.filter((t) => {
    if (t.status === 'Done') return false;
    const pScore = calculatePriorityScore(t, dependencies, companyTasks);
    return pScore.score >= 50 || t.priority === 'Urgent';
  });

  // Calculate workload breakdown per user
  const userWorkload = users.map((u) => {
    const userHours = timeEntries.filter((te) => te.userId === u.id).reduce((acc, te) => acc + te.hours, 0);
    const userAssignedTasks = companyTasks.filter((t) => t.assigneeIds.includes(u.id) && t.status !== 'Done');
    return {
      user: u,
      hours: userHours,
      activeTaskCount: userAssignedTasks.length,
    };
  });

  const pinnedWidgetIds = new Set(
    widgets.filter((w) => w.pinned).sort((a, b) => a.order - b.order).map((w) => w.id)
  );

  const isWidgetPinned = (id: string) => pinnedWidgetIds.has(id);

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Header Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
        theme === 'light' 
          ? 'bg-gradient-to-r from-white via-slate-50 to-teal-50/40 border-slate-200' 
          : 'bg-gradient-to-r from-[#16222F] via-[#1A2838] to-[#0D1520] border-[#233549]'
      }`}>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#0773BB]/10 to-transparent pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-[#0D9488]' : 'text-[#3BC0BB]'}`}>
            Dolphin Project Management
          </h1>
          <p className={`text-sm max-w-xl ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
            Real-time project execution, customizable workspace widgets, team workload analytics, and compliance governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Customize Widgets Button */}
          <button
            onClick={() => setCustomizeOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm ${
              theme === 'light'
                ? 'bg-[#0D9488]/10 hover:bg-[#0D9488]/20 text-[#0D9488] border border-[#0D9488]/30'
                : 'bg-[#3BC0BB]/20 hover:bg-[#3BC0BB]/30 text-[#3BC0BB] border border-[#3BC0BB]/40'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Customize Dashboard ({pinnedWidgetIds.size} Pinned)</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white font-bold text-xs shadow-md shadow-[#0773BB]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-xs transition-all ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#233549] border-[#233549] text-slate-200'
            }`}
          >
            <FolderKanban className={`w-4 h-4 ${theme === 'light' ? 'text-[#0D9488]' : 'text-[#3BC0BB]'}`} />
            <span>View Projects</span>
          </button>
        </div>
      </div>

      {/* WIDGET: GEMINI AI DAILY BRIEF */}
      {isWidgetPinned('daily_brief') && (
        <div className={`p-6 rounded-2xl border space-y-4 shadow-2xl relative overflow-hidden transition-all animate-in fade-in ${
          theme === 'light'
            ? 'bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200'
            : 'bg-gradient-to-r from-[#16222F] via-[#1A2838] to-[#0D1520] border-[#3BC0BB]/40'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#233549]/60 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0773BB] to-[#3BC0BB] text-white shadow-lg">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-bold tracking-tight ${theme === 'light' ? 'text-[#0D9488]' : 'text-[#3BC0BB]'}`}>
                    AI Chief of Staff • Daily Brief
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40">
                    GEMINI 3.6 FLASH
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated executive summary synthesized from task history, deadlines, and team activity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {dailyBrief?.riskLevel && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                  dailyBrief.riskLevel === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : dailyBrief.riskLevel === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}>
                  Risk Level: {dailyBrief.riskLevel}
                </span>
              )}

              <button
                onClick={fetchDailyBrief}
                disabled={briefLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
                title="Refresh Daily AI Brief"
              >
                <Sparkles className={`w-3.5 h-3.5 text-[#3BC0BB] ${briefLoading ? 'animate-spin' : ''}`} />
                <span>{briefLoading ? 'Analyzing...' : 'Refresh AI Brief'}</span>
              </button>
            </div>
          </div>

          {briefLoading && !dailyBrief ? (
            <div className="p-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#3BC0BB] animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Synthesizing workspace task history with Gemini API...</p>
            </div>
          ) : dailyBrief ? (
            <div className="space-y-4">
              {/* Executive Summary paragraph */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed font-medium ${
                theme === 'light' ? 'bg-slate-100/70 border-slate-200 text-slate-800' : 'bg-[#0D1520]/80 border-[#233549] text-slate-200'
              }`}>
                {dailyBrief.summary}
              </div>

              {/* 3 Columns for Progress, Deadlines, Blockers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Key Progress */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520]/50 border-[#233549]'
                }`}>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Key Daily Progress</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4 font-mono">
                    {dailyBrief.keyProgress.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Upcoming Deadlines */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520]/50 border-[#233549]'
                }`}>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Upcoming Deadlines</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4 font-mono">
                    {dailyBrief.upcomingDeadlines.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Urgent Blockers & Action Plan */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520]/50 border-[#233549]'
                }`}>
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Urgent Blockers & Actions</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4 font-mono">
                    {[...dailyBrief.urgentBlockers, ...dailyBrief.actionPlan].slice(0, 3).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {briefGeneratedAt && (
                <div className="text-[10px] text-slate-500 font-mono text-right pt-1">
                  Last generated at {briefGeneratedAt} via Gemini 3.6 Flash
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* WIDGET 1: KPI STATS CARDS */}
      {isWidgetPinned('quick_stats') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
          {/* Total Active Projects */}
          <div className={`p-5 rounded-2xl border transition-all group shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200 hover:border-[#0773BB]' : 'bg-[#16222F]/80 border-[#233549] hover:border-[#0773BB]/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Projects
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#0773BB]/20 text-[#0773BB] flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className={`text-3xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {companyProjects.length}
              </span>
              <span className="text-xs font-medium text-[#3BC0BB] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> On Track
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {companyProjects.filter((p) => p.status === 'In Progress').length} in active execution phase
            </div>
          </div>

          {/* Task Velocity / Completion */}
          <div className={`p-5 rounded-2xl border transition-all group shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200 hover:border-[#3BC0BB]' : 'bg-[#16222F]/80 border-[#233549] hover:border-[#3BC0BB]/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Task Completion Rate
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#3BC0BB]/20 text-[#3BC0BB] flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className={`text-3xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {companyTasks.length > 0
                  ? Math.round((completedTasks.length / companyTasks.length) * 100)
                  : 0}
                %
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {completedTasks.length}/{companyTasks.length} Done
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-800/40 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#3BC0BB] h-full transition-all duration-500"
                style={{
                  width: `${
                    companyTasks.length > 0
                      ? (completedTasks.length / companyTasks.length) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Overdue / Urgent Risks */}
          <div className={`p-5 rounded-2xl border transition-all group shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200 hover:border-amber-500' : 'bg-[#16222F]/80 border-[#233549] hover:border-amber-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Risks & Overdue
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-amber-400 tracking-tight">
                {overdueTasks.length}
              </span>
              <span className="text-xs text-rose-400 font-medium">
                {urgentTasks.length} Urgent Tasks
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Automated alerts active for overdue milestones
            </div>
          </div>

          {/* Total Logged Hours */}
          <div className={`p-5 rounded-2xl border transition-all group shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200 hover:border-indigo-500' : 'bg-[#16222F]/80 border-[#233549] hover:border-indigo-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Logged Effort Hours
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className={`text-3xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {totalLoggedHours} <span className="text-sm font-normal text-slate-400">hrs</span>
              </span>
              <span className="text-xs text-slate-400">Billable</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Across {users.length} active team members
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC PINNED WIDGETS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pinned Primary Widgets */}
        <div className="lg:col-span-2 space-y-6">
          {/* WIDGET 2: MY ASSIGNED TASKS */}
          {isWidgetPinned('my_tasks') && (
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl animate-in fade-in ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F]/80 border-[#233549]'
            }`}>
              <div className="flex items-center justify-between border-b border-[#233549]/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0773BB]/20 text-[#3BC0BB] flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className={`text-base font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      My Assigned Tasks ({myTasks.length})
                    </h2>
                    <p className="text-xs text-slate-400">
                      Logged in as <span className="text-[#3BC0BB] font-semibold">{currentUser.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs font-semibold text-[#3BC0BB] hover:underline flex items-center gap-1"
                >
                  <span>Full Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {myTasks.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#0D1520]/50 border border-dashed border-[#233549] text-center text-xs text-slate-400">
                  No pending tasks assigned to you. Enjoy your clean queue!
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {myTasks.map((t) => {
                    const pScore = calculatePriorityScore(t, dependencies, companyTasks);
                    const isDone = t.status === 'Done';

                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          theme === 'light'
                            ? isDone ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-200 hover:border-[#0773BB]'
                            : isDone ? 'bg-[#0D1520]/40 border-[#233549] opacity-60' : 'bg-[#0D1520] border-[#233549] hover:border-[#0773BB]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => updateTask(t.id, { status: isDone ? 'In Progress' : 'Done' })}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500 hover:border-[#3BC0BB]'
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                          <div className="min-w-0">
                            <h4 className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-500' : theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                              {t.title}
                            </h4>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Due: {t.dueDate || 'No Date'}</span>
                              <span>•</span>
                              <span>Est: {t.estimatedHours}h</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${pScore.bgColor} ${pScore.color} ${pScore.borderColor}`}>
                            Score: {pScore.score} ({pScore.tier})
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            t.status === 'Done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#0773BB]/20 text-[#3BC0BB]'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* WIDGET 3: URGENT DEPENDENCIES & BLOCKERS */}
          {isWidgetPinned('urgent_deps') && (
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl animate-in fade-in ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F]/80 border-[#233549]'
            }`}>
              <div className="flex items-center justify-between border-b border-[#233549]/60 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-400" />
                  <h2 className={`text-base font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Urgent Dependencies & Blockers ({urgentAndBlockers.length})
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs font-semibold text-[#3BC0BB] hover:underline"
                >
                  Manage Dependencies
                </button>
              </div>

              {urgentAndBlockers.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#0D1520]/50 border border-dashed border-[#233549] text-center text-xs text-slate-400">
                  No urgent blockers currently detected.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {urgentAndBlockers.slice(0, 5).map((t) => {
                    const pScore = calculatePriorityScore(t, dependencies, companyTasks);
                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                          <div>
                            <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.title}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Due: {t.dueDate}</span>
                              <span>•</span>
                              <span>Est: {t.estimatedHours} hrs</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${pScore.bgColor} ${pScore.color} ${pScore.borderColor}`}>
                            {pScore.score} {pScore.tier}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* WIDGET 5: ACTIVE PROJECTS HEALTH */}
          {isWidgetPinned('projects_health') && (
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl animate-in fade-in ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F]/80 border-[#233549]'
            }`}>
              <div className="flex items-center justify-between border-b border-[#233549]/60 pb-3">
                <div>
                  <h2 className={`text-base font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Active Projects Health
                  </h2>
                  <p className="text-xs text-slate-400">
                    {companyProjects.length} strategic initiatives under {activeCompany.code}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-xs font-semibold text-[#3BC0BB] hover:underline flex items-center gap-1"
                >
                  <span>All Projects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {companyProjects.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#0D1520] border border-dashed border-[#233549] text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0773BB]/20 text-[#3BC0BB] mx-auto flex items-center justify-center">
                      <FolderKanban className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Your Workspace is Ready for Real Projects</h3>
                      <p className="text-xs text-slate-400 mt-1">Start by creating your first project.</p>
                    </div>
                  </div>
                ) : (
                  companyProjects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setActiveTab('gantt')}
                      className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                        theme === 'light' ? 'bg-slate-50 border-slate-200 hover:border-[#0773BB]' : 'bg-[#0D1520] border-[#233549] hover:border-[#0773BB]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0773BB]/20 text-[#3BC0BB] font-semibold">
                              {p.code}
                            </span>
                            <h3 className={`text-sm font-bold group-hover:text-[#3BC0BB] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                              {p.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {p.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <div className="text-slate-400">Budget Spent</div>
                            <div className="font-mono font-semibold">
                              ${p.spentBudget.toLocaleString()} / ${p.budget.toLocaleString()}
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              p.status === 'In Progress'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 bg-slate-700/30 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] h-full transition-all duration-500"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-[#3BC0BB]">
                          {p.progress}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Secondary Pinned Widgets */}
        <div className="space-y-6">
          {/* WIDGET 4: TEAM WORKLOAD & EFFORT */}
          {isWidgetPinned('workload_summary') && (
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl animate-in fade-in ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F]/80 border-[#233549]'
            }`}>
              <div className="flex items-center justify-between border-b border-[#233549]/60 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                  <h2 className={`text-base font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Team Workload & Effort
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{totalLoggedHours}h Total</span>
              </div>

              <div className="space-y-3">
                {userWorkload.map(({ user, hours, activeTaskCount }) => {
                  const maxHours = Math.max(40, totalLoggedHours || 1);
                  const percentage = Math.min(100, Math.round((hours / maxHours) * 100));

                  return (
                    <div
                      key={user.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 ${
                        theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                      }`}
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-[#0773BB]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{user.name}</span>
                          <span className="font-mono font-bold text-[#3BC0BB]">{hours} hrs</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>{user.role}</span>
                          <span>{activeTaskCount} Active Task(s)</span>
                        </div>
                        <div className="mt-1.5 w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full transition-all"
                            style={{ width: `${Math.max(10, percentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WIDGET 6: REAL-TIME ACTIVITY AUDIT STREAM */}
          {isWidgetPinned('activity_stream') && (
            <div className="animate-in fade-in">
              <LiveActivityStream />
            </div>
          )}

          {/* WIDGET 7: DOMAIN SECURITY GOVERNANCE */}
          {isWidgetPinned('domain_whitelist') && (
            <div className={`p-6 rounded-2xl border space-y-3 shadow-xl animate-in fade-in ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-300'
                : 'bg-gradient-to-br from-[#16222F] to-[#0D1520] border-[#3BC0BB]/30'
            }`}>
              <div className="flex items-center gap-2 text-[#3BC0BB]">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Domain Whitelist Governance
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Restricted authorization access across official corporate email domains:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {APPROVED_DOMAINS.map((d) => (
                  <span
                    key={d}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#0D1520] border border-[#233549] font-mono text-slate-300"
                  >
                    @{d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMIZE WIDGETS DRAWER / MODAL */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-[#16222F] border border-[#233549] rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#233549] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Customize Workspace Widgets</h2>
                  <p className="text-xs text-slate-400">Pin, unpin, or reorder widgets on your main workspace dashboard.</p>
                </div>
              </div>
              <button
                onClick={() => setCustomizeOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1A2838]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {widgets
                .sort((a, b) => a.order - b.order)
                .map((w, index) => (
                  <div
                    key={w.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      w.pinned
                        ? 'bg-[#0D1520] border-[#3BC0BB]/50'
                        : 'bg-[#0D1520]/40 border-[#233549] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePinWidget(w.id)}
                        className={`p-2 rounded-xl transition-all ${
                          w.pinned
                            ? 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40'
                            : 'bg-[#1A2838] text-slate-400 hover:text-white'
                        }`}
                        title={w.pinned ? 'Unpin Widget' : 'Pin Widget'}
                      >
                        {w.pinned ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{w.name}</h4>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#16222F] text-slate-400 border border-[#233549]">
                            {w.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{w.description}</p>
                      </div>
                    </div>

                    {/* Order Move Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveWidget(w.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-[#16222F] hover:bg-[#233549] text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveWidget(w.id, 'down')}
                        disabled={index === widgets.length - 1}
                        className="p-1.5 rounded-lg bg-[#16222F] hover:bg-[#233549] text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#233549] pt-4">
              <button
                onClick={resetWidgetsToDefault}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Layout</span>
              </button>

              <button
                onClick={() => setCustomizeOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-lg transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
