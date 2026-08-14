import React, { useState, useEffect, useMemo } from 'react';
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
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Milestone,
  Flag,
  ShieldAlert,
  Info,
  HelpCircle,
  Download,
  Printer,
  FileText,
  GripVertical,
  Trash2,
  Search,
  PieChart,
  BarChart2,
  Gauge
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APPROVED_DOMAINS, Task, Project, TaskDependency } from '../../types';
import { calculatePriorityScore } from '../../lib/priorityScore';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { getStatusBadgeStyle } from '../../lib/statusUtils';
import { LiveActivityStream } from './LiveActivityStream';
import { RecentActivityPanel } from './RecentActivityPanel';
import { StatCardTooltip } from './StatCardTooltip';
import { BudgetTrackingWidget } from './BudgetTrackingWidget';
import { TaskCompletionTrendWidget } from './TaskCompletionTrendWidget';
import { TaskQuickPreviewPopover } from '../tasks/TaskQuickPreviewPopover';
import { BurnDownChartWidget } from './BurnDownChartWidget';
import { TaskStatusDistributionWidget } from './TaskStatusDistributionWidget';
import { PriorityRiskDistributionWidget } from './PriorityRiskDistributionWidget';
import { D3CapacityVelocityGaugeWidget } from './D3CapacityVelocityGaugeWidget';
import { ProjectSpaceDashboard } from './ProjectSpaceDashboard';
import { QuickAddFAB } from '../common/QuickAddFAB';

export interface ProjectHealthInfo {
  status: 'On-Track' | 'At-Risk' | 'Blocked';
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotBg: string;
  icon: React.ComponentType<{ className?: string }>;
  explanation: string;
}

export const getProjectHealthInfo = (
  project: Project,
  tasks: Task[],
  dependencies: TaskDependency[]
): ProjectHealthInfo => {
  const projTasks = tasks.filter((t) => t.projectId === project.id);
  const overdueTasks = projTasks.filter((t) => t.status !== 'Done' && new Date(t.dueDate) < new Date());
  const budgetRatio = project.budget > 0 ? project.spentBudget / project.budget : 0;

  // Check if any task in this project is blocked by an uncompleted dependency
  const isAnyTaskBlocked = projTasks.some((t) => {
    if (t.status === 'Done') return false;
    const deps = dependencies.filter((d) => d.taskId === t.id);
    return deps.some((dep) => {
      const prereq = tasks.find((pt) => pt.id === dep.dependsOnTaskId);
      return prereq && prereq.status !== 'Done';
    });
  });

  if (project.status === 'On Hold' || isAnyTaskBlocked) {
    return {
      status: 'Blocked',
      label: 'Blocked',
      badgeBg: 'bg-rose-500/20',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/40',
      dotBg: 'bg-rose-500',
      icon: ShieldAlert,
      explanation: project.status === 'On Hold'
        ? 'Project execution is explicitly placed On Hold by management.'
        : `Execution blocked: ${projTasks.filter((t) => t.status !== 'Done').length} task(s) in this project have unresolved prerequisite dependencies.`,
    };
  }

  if (budgetRatio > 0.95 || overdueTasks.length > 0 || (project.progress < 30 && project.status === 'In Progress' && budgetRatio > 0.6)) {
    return {
      status: 'At-Risk',
      label: 'At-Risk',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/40',
      dotBg: 'bg-amber-500',
      icon: AlertTriangle,
      explanation: overdueTasks.length > 0
        ? `At-Risk: ${overdueTasks.length} overdue task(s) require urgent attention.`
        : budgetRatio > 0.95
        ? `At-Risk: Spent budget ($${project.spentBudget.toLocaleString()}) has reached ${(budgetRatio * 100).toFixed(0)}% of total allocated budget ($${project.budget.toLocaleString()}).`
        : 'At-Risk: Project completion velocity is lagging behind allocated budget consumption.',
    };
  }

  return {
    status: 'On-Track',
    label: 'On-Track',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/40',
    dotBg: 'bg-emerald-500',
    icon: CheckCircle2,
    explanation: 'On-Track: Milestones, task completion rates, and budget expenditures are all within target operating thresholds.',
  };
};

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
    description: 'Summary indicators for Total Projects, In Progress, Completed, and Upcoming Deadlines with trend indicators.',
    category: 'Overview',
    pinned: true,
    order: 1,
  },
  {
    id: 'burndown_chart',
    name: 'Sprint Burn-Down Chart (Recharts)',
    description: 'Interactive Recharts area/line chart comparing actual remaining work scope vs ideal linear burn rate line.',
    category: 'Analytics',
    pinned: true,
    order: 2,
  },
  {
    id: 'task_status_distribution',
    name: 'Task Status Breakdown (Recharts Donut/Bar)',
    description: 'Interactive Recharts Donut & Bar chart showing task breakdown by status (Done, In Progress, To Do, Blocked, Review).',
    category: 'Analytics',
    pinned: true,
    order: 3,
  },
  {
    id: 'priority_risk_distribution',
    name: 'Priority & Risk Score Breakdown (Recharts)',
    description: 'Recharts stacked bar chart evaluating priority levels (Urgent, High, Medium, Low) vs completed status and risk scores.',
    category: 'Analytics',
    pinned: true,
    order: 4,
  },
  {
    id: 'd3_team_velocity_gauge',
    name: 'Team Capacity & Velocity Gauge (D3.js)',
    description: 'Custom D3.js SVG arc gauge displaying overall team capacity utilization percentage and member workload velocity.',
    category: 'Analytics',
    pinned: true,
    order: 5,
  },
  {
    id: 'task_completion_trend',
    name: 'Tasks Completion Rate (7-Day Trend)',
    description: 'Recharts summary card tracking 7-day completion rate velocity, completed task counts, and backlog metrics.',
    category: 'Analytics',
    pinned: true,
    order: 6,
  },
  {
    id: 'project_timeline',
    name: 'Project Timeline & Milestones',
    description: 'Visual timeline displaying project milestones and upcoming due dates in a scrollable horizontal format.',
    category: 'Overview',
    pinned: true,
    order: 7,
  },
  {
    id: 'my_tasks',
    name: 'My Assigned Tasks',
    description: 'Personal task queue with calculated Priority Scores and quick status toggles.',
    category: 'Tasks',
    pinned: true,
    order: 8,
  },
  {
    id: 'budget_tracking',
    name: 'Project Budget & Burn Rate Tracker',
    description: 'Recharts visual analytics tracking cumulative spend, burn rates, and predicted budget vs timeline forecasts.',
    category: 'Analytics',
    pinned: true,
    order: 9,
  },
  {
    id: 'urgent_deps',
    name: 'Urgent Dependencies & Blockers',
    description: 'Critical path tasks that block downstream work or have overdue deadlines.',
    category: 'Tasks',
    pinned: true,
    order: 10,
  },
  {
    id: 'workload_summary',
    name: 'Team Workload & Effort Summary',
    description: 'Breakdown of logged hours, billable effort, and team workload capacity.',
    category: 'Analytics',
    pinned: true,
    order: 11,
  },
  {
    id: 'projects_health',
    name: 'Active Projects Portfolio Health',
    description: 'Strategic project list with progress indicators and budget allocation.',
    category: 'Overview',
    pinned: true,
    order: 12,
  },
  {
    id: 'recent_activity',
    name: 'Recent Team Activity Timeline',
    description: 'Real-time timeline of team actions including task status changes, comments, and document updates.',
    category: 'Overview',
    pinned: true,
    order: 13,
  },
  {
    id: 'activity_stream',
    name: 'Real-Time Activity Audit',
    description: 'Live audit trail showing recent team actions, updates, and timestamps.',
    category: 'Analytics',
    pinned: true,
    order: 14,
  },
  {
    id: 'domain_whitelist',
    name: 'Domain Security Governance',
    description: 'Approved corporate email domain whitelist for workspace access control.',
    category: 'Security',
    pinned: true,
    order: 15,
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
    theme,
    selectedProjectId,
    setSelectedProjectId
  } = useApp();

  const [isCustomizeOpen, setCustomizeOpen] = useState(false);
  const [widgetSearchQuery, setWidgetSearchQuery] = useState('');
  const [widgetCategoryFilter, setWidgetCategoryFilter] = useState<string>('All');
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem('dolphin_pinned_widgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((w: any) => w.id));
          const missingDefaults = DEFAULT_WIDGETS.filter((dw) => !existingIds.has(dw.id));
          if (missingDefaults.length > 0) {
            return [...parsed, ...missingDefaults];
          }
          return parsed;
        }
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

  // Filter tasks & projects by space assignment and workspace
  const userAccessibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (currentUser?.role === 'Admin') return true;
      return (
        p.managerId === currentUser?.id ||
        (p.members && p.members.includes(currentUser?.id || '')) ||
        (p.memberRoles && Boolean(p.memberRoles[currentUser?.id || '']))
      );
    });
  }, [projects, currentUser?.role, currentUser?.id]);

  const companyProjects = useMemo(() => {
    const filtered = userAccessibleProjects.filter((p) => p.companyId === activeCompany?.id);
    return filtered.length > 0 ? filtered : userAccessibleProjects;
  }, [userAccessibleProjects, activeCompany?.id]);

  const companyTasks = useMemo(() => {
    const filtered = tasks.filter((t) => t.companyId === activeCompany?.id);
    return filtered.length > 0 ? filtered : tasks;
  }, [tasks, activeCompany?.id]);

  const [dailyBrief, setDailyBrief] = useState<DailyBriefData | null>(null);
  const [briefLoading, setBriefLoading] = useState<boolean>(false);
  const [briefGeneratedAt, setBriefGeneratedAt] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [hoveredStatCard, setHoveredStatCard] = useState<string | null>(null);

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

  const completedTasks = useMemo(() => companyTasks.filter((t) => t.status === 'Done'), [companyTasks]);
  const inProgressTasks = useMemo(() => companyTasks.filter((t) => t.status === 'In Progress'), [companyTasks]);
  const urgentTasks = useMemo(() => companyTasks.filter((t) => t.priority === 'Urgent' && t.status !== 'Done'), [companyTasks]);

  const completedProjects = useMemo(() => companyProjects.filter((p) => p.status === 'Completed' || p.progress === 100), [companyProjects]);
  const inProgressProjects = useMemo(() => companyProjects.filter((p) => p.status === 'In Progress' || (p.status !== 'Completed' && p.progress < 100)), [companyProjects]);

  const { upcomingDeadlinesTasks, overdueTasks } = useMemo(() => {
    const nowDate = new Date();
    const next7 = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = companyTasks.filter((t) => {
      if (t.status === 'Done') return false;
      const d = new Date(t.dueDate);
      return d >= nowDate && d <= next7;
    });
    const overdue = companyTasks.filter((t) => t.status !== 'Done' && new Date(t.dueDate) < nowDate);
    return { upcomingDeadlinesTasks: upcoming, overdueTasks: overdue };
  }, [companyTasks]);

  const totalLoggedHours = useMemo(() => timeEntries.reduce((acc, curr) => acc + curr.hours, 0), [timeEntries]);

  // My Tasks
  const myTasks = useMemo(() => companyTasks.filter((t) => (currentUser?.id ? t.assigneeIds.includes(currentUser.id) : false)), [companyTasks, currentUser?.id]);

  // Urgent / Dependent tasks
  const urgentAndBlockers = useMemo(() => {
    return companyTasks.filter((t) => {
      if (t.status === 'Done') return false;
      const pScore = calculatePriorityScore(t, dependencies, companyTasks);
      return pScore.score >= 50 || t.priority === 'Urgent';
    });
  }, [companyTasks, dependencies]);

  // Calculate workload breakdown per user
  const userWorkload = useMemo(() => {
    return users.map((u) => {
      const userHours = timeEntries.filter((te) => te.userId === u.id).reduce((acc, te) => acc + te.hours, 0);
      const userAssignedTasks = companyTasks.filter((t) => t.assigneeIds.includes(u.id) && t.status !== 'Done');
      return {
        user: u,
        hours: userHours,
        activeTaskCount: userAssignedTasks.length,
      };
    });
  }, [users, timeEntries, companyTasks]);

  // Project Timeline State & Events
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'project' | 'task'>('all');
  const timelineScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (timelineScrollRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      timelineScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const timelineEvents = React.useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      dateStr: string;
      dateObj: Date;
      type: 'project' | 'task';
      status: 'Completed' | 'In Progress' | 'Upcoming' | 'Overdue';
      code?: string;
      progress?: number;
      assigneeName?: string;
      assigneeAvatar?: string;
      daysDiff: number;
      priority?: string;
    }> = [];

    const nowMs = new Date().setHours(0,0,0,0);

    companyProjects.forEach((p) => {
      const targetDateStr = p.dueDate || p.startDate;
      if (targetDateStr) {
        const d = new Date(targetDateStr);
        if (!isNaN(d.getTime())) {
          const diffDays = Math.ceil((d.getTime() - nowMs) / (1000 * 60 * 60 * 24));
          const status = p.status === 'Completed' || p.progress === 100
            ? 'Completed'
            : diffDays < 0
            ? 'Overdue'
            : diffDays <= 14
            ? 'In Progress'
            : 'Upcoming';

          const mgr = users.find((u) => u.id === p.managerId);

          events.push({
            id: `proj-${p.id}`,
            title: p.title,
            dateStr: targetDateStr,
            dateObj: d,
            type: 'project',
            status,
            code: p.code,
            progress: p.progress || 0,
            assigneeName: mgr?.name,
            assigneeAvatar: mgr?.avatar,
            daysDiff: diffDays,
          });
        }
      }
    });

    companyTasks.forEach((t) => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime())) {
          const diffDays = Math.ceil((d.getTime() - nowMs) / (1000 * 60 * 60 * 24));
          const status = t.status === 'Done'
            ? 'Completed'
            : diffDays < 0
            ? 'Overdue'
            : diffDays <= 7
            ? 'In Progress'
            : 'Upcoming';

          const parentProj = companyProjects.find((p) => p.id === t.projectId);
          const assigneeId = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds[0] : undefined;
          const assignee = users.find((u) => u.id === assigneeId);

          events.push({
            id: `task-${t.id}`,
            title: t.title,
            dateStr: t.dueDate,
            dateObj: d,
            type: 'task',
            status,
            code: parentProj?.code || 'TSK',
            assigneeName: assignee?.name,
            assigneeAvatar: assignee?.avatar,
            daysDiff: diffDays,
            priority: t.priority,
          });
        }
      }
    });

    return events.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [companyProjects, companyTasks, users]);

  const pinnedWidgetIds = new Set(
    widgets.filter((w) => w.pinned).sort((a, b) => a.order - b.order).map((w) => w.id)
  );

  const isWidgetPinned = (id: string) => pinnedWidgetIds.has(id);

  if (selectedProjectId) {
    return (
      <div className={`p-3.5 sm:p-6 space-y-4 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-400">Active View: Space Dashboard</span>
          </div>
          <button
            onClick={() => setSelectedProjectId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              theme === 'light'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#16222F] border-[#233549] text-slate-200 hover:bg-[#233549]'
            }`}
          >
            ← Switch to All Workspace Dashboard
          </button>
        </div>
        <ProjectSpaceDashboard />
      </div>
    );
  }

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
          {/* Download Report Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
              theme === 'light'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
            }`}
            title="Export print-friendly PDF status & timeline report"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>

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
          {/* Card 1: Total Projects */}
          <div
            onMouseEnter={() => setHoveredStatCard('total_projects')}
            onMouseLeave={() => setHoveredStatCard(null)}
            className={`p-5 rounded-2xl border transition-all group shadow-xl relative cursor-pointer ${
              theme === 'light' ? 'bg-white border-slate-200 hover:border-[#0773BB]' : 'bg-[#16222F]/80 border-[#233549] hover:border-[#0773BB]/50'
            }`}
          >
            <StatCardTooltip
              isVisible={hoveredStatCard === 'total_projects'}
              title="Total Projects Portfolio"
              subtitle="Distribution & Capital Breakdown"
              icon={FolderKanban}
              accentColor="#0773BB"
              items={[
                {
                  label: 'In Progress Projects',
                  value: inProgressProjects.length,
                  subtext: `${inProgressProjects.length} active workspace initiatives`,
                  progress: companyProjects.length > 0 ? (inProgressProjects.length / companyProjects.length) * 100 : 0,
                  color: '#0773BB'
                },
                {
                  label: 'Completed Projects',
                  value: completedProjects.length,
                  subtext: `${completedProjects.length} delivered successfully`,
                  progress: companyProjects.length > 0 ? (completedProjects.length / companyProjects.length) * 100 : 0,
                  color: '#3BC0BB'
                },
                {
                  label: 'Total Capital Budget',
                  value: `$${companyProjects.reduce((s, p) => s + (p.budget || 0), 0).toLocaleString()}`,
                  subtext: `Spent: $${companyProjects.reduce((s, p) => s + (p.spentBudget || 0), 0).toLocaleString()}`,
                  color: '#10b981'
                }
              ]}
              footerNote="Hover metrics to inspect portfolio status"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Projects
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#0773BB]/20 text-[#0773BB] flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className={`text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {companyProjects.length}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <TrendingUp className="w-3.5 h-3.5" /> +12.5%
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0773BB]"></span>
              <span>{inProgressProjects.length} active • {completedProjects.length} completed</span>
            </div>
          </div>

          {/* Card 2: In Progress */}
          <div
            onMouseEnter={() => setHoveredStatCard('in_progress')}
            onMouseLeave={() => setHoveredStatCard(null)}
            className={`p-5 rounded-2xl border transition-all group shadow-xl relative cursor-pointer ${
              theme === 'light' ? 'bg-white border-slate-200 hover:border-sky-500' : 'bg-[#16222F]/80 border-[#233549] hover:border-sky-500/50'
            }`}
          >
            <StatCardTooltip
              isVisible={hoveredStatCard === 'in_progress'}
              title="In Progress Workloads"
              subtitle="Active Execution Metrics"
              icon={Activity}
              accentColor="#38bdf8"
              items={[
                {
                  label: 'Active Execution Tasks',
                  value: inProgressTasks.length,
                  subtext: `Out of ${companyTasks.length} overall workspace tasks`,
                  progress: companyTasks.length > 0 ? (inProgressTasks.length / companyTasks.length) * 100 : 0,
                  color: '#38bdf8'
                },
                {
                  label: 'High & Urgent Priority',
                  value: companyTasks.filter((t) => t.status === 'In Progress' && (t.priority === 'Urgent' || t.priority === 'High')).length,
                  subtext: 'Critical path active work items',
                  color: '#ef4444'
                },
                {
                  label: 'Active Team Assignees',
                  value: new Set(companyTasks.filter((t) => t.status === 'In Progress').flatMap((t) => t.assigneeIds)).size,
                  subtext: 'Team members actively assigned',
                  color: '#8b5cf6'
                }
              ]}
              footerNote="Real-time execution analytics"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                In Progress
              </span>
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className={`text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {inProgressProjects.length}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <TrendingUp className="w-3.5 h-3.5" /> +8.4%
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>{inProgressTasks.length} active task(s) in execution</span>
            </div>
          </div>

          {/* Card 3: Completed */}
          <div
            onMouseEnter={() => setHoveredStatCard('completed')}
            onMouseLeave={() => setHoveredStatCard(null)}
            className={`p-5 rounded-2xl border transition-all group shadow-xl relative cursor-pointer ${
              theme === 'light' ? 'bg-white border-slate-200 hover:border-[#3BC0BB]' : 'bg-[#16222F]/80 border-[#233549] hover:border-[#3BC0BB]/50'
            }`}
          >
            <StatCardTooltip
              isVisible={hoveredStatCard === 'completed'}
              title="Completion & Delivery"
              subtitle="Efficiency & Milestones"
              icon={CheckCircle2}
              accentColor="#3BC0BB"
              items={[
                {
                  label: 'Completed Tasks',
                  value: completedTasks.length,
                  subtext: `${companyTasks.length > 0 ? Math.round((completedTasks.length / companyTasks.length) * 100) : 0}% completion rate`,
                  progress: companyTasks.length > 0 ? (completedTasks.length / companyTasks.length) * 100 : 0,
                  color: '#3BC0BB'
                },
                {
                  label: 'Completed Projects',
                  value: completedProjects.length,
                  subtext: 'Delivered projects',
                  color: '#10b981'
                },
                {
                  label: 'Milestones Reached',
                  value: companyTasks.filter((t) => t.isMilestone && t.status === 'Done').length,
                  subtext: 'Key delivery targets achieved',
                  color: '#06b6d4'
                }
              ]}
              footerNote="Historical completion tracking"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Completed
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#3BC0BB]/20 text-[#3BC0BB] flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className={`text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {completedProjects.length}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/10 text-[#3BC0BB] border border-teal-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> +18.2%
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3BC0BB]"></span>
              <span>{completedTasks.length} task(s) completed ({companyTasks.length > 0 ? Math.round((completedTasks.length / companyTasks.length) * 100) : 0}%)</span>
            </div>
          </div>

          {/* Card 4: Upcoming Deadlines */}
          <div
            onMouseEnter={() => setHoveredStatCard('upcoming_deadlines')}
            onMouseLeave={() => setHoveredStatCard(null)}
            className={`p-5 rounded-2xl border transition-all group shadow-xl relative cursor-pointer ${
              theme === 'light' ? 'bg-white border-slate-200 hover:border-amber-500' : 'bg-[#16222F]/80 border-[#233549] hover:border-amber-500/50'
            }`}
          >
            <StatCardTooltip
              isVisible={hoveredStatCard === 'upcoming_deadlines'}
              title="Deadline Risk Breakdown"
              subtitle="Imminent Tasks & Overdue Audit"
              icon={Clock}
              accentColor="#f59e0b"
              items={[
                {
                  label: 'Due Next 7 Days',
                  value: upcomingDeadlinesTasks.length,
                  subtext: 'Tasks requiring delivery this week',
                  color: '#f59e0b'
                },
                {
                  label: 'Overdue Items',
                  value: overdueTasks.length,
                  subtext: overdueTasks.length > 0 ? 'Requires immediate supervisor review' : 'No overdue tasks detected',
                  color: overdueTasks.length > 0 ? '#ef4444' : '#10b981'
                },
                {
                  label: 'Critical Path Items',
                  value: companyTasks.filter((t) => t.isCriticalPath && t.status !== 'Done').length,
                  subtext: 'Active critical path tasks',
                  color: '#f43f5e'
                }
              ]}
              footerNote="Automated timeline risk breakdown"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Upcoming Deadlines
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
                {upcomingDeadlinesTasks.length}
              </span>
              {overdueTasks.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" /> {overdueTasks.length} overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> On Schedule
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Tasks due within 7 days • {overdueTasks.length} overdue</span>
            </div>
          </div>
        </div>
      )}

      {/* WIDGET: SPRINT BURN-DOWN CHART (Recharts) */}
      {isWidgetPinned('burndown_chart') && (
        <BurnDownChartWidget
          tasks={companyTasks}
          projects={companyProjects}
          theme={theme}
        />
      )}

      {/* WIDGET: TASK STATUS BREAKDOWN (Recharts Donut/Bar) */}
      {isWidgetPinned('task_status_distribution') && (
        <TaskStatusDistributionWidget
          tasks={companyTasks}
          projects={companyProjects}
          theme={theme}
        />
      )}

      {/* WIDGET: PRIORITY & RISK SCORE BREAKDOWN (Recharts) */}
      {isWidgetPinned('priority_risk_distribution') && (
        <PriorityRiskDistributionWidget
          tasks={companyTasks}
          dependencies={dependencies}
          theme={theme}
        />
      )}

      {/* WIDGET: TEAM CAPACITY & VELOCITY GAUGE (D3.js) */}
      {isWidgetPinned('d3_team_velocity_gauge') && (
        <D3CapacityVelocityGaugeWidget
          users={users}
          timeEntries={timeEntries}
          tasks={companyTasks}
          theme={theme}
        />
      )}

      {/* WIDGET: TASKS COMPLETION RATE 7-DAY TREND */}
      {isWidgetPinned('task_completion_trend') && (
        <TaskCompletionTrendWidget
          tasks={companyTasks}
          activityLogs={activityLogs}
          theme={theme}
        />
      )}

      {/* WIDGET: PROJECT TIMELINE & MILESTONES (Scrollable Horizontal Timeline) */}
      {isWidgetPinned('project_timeline') && (
        <div className={`p-6 rounded-2xl border space-y-4 shadow-xl animate-in fade-in ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F]/80 border-[#233549]'
        }`}>
          {/* Timeline Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#233549]/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] text-white flex items-center justify-center shadow-md">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-extrabold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Project Timeline & Milestones
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40">
                    {timelineEvents.length} Events
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Scrollable chronological view of upcoming project milestones and due dates
                </p>
              </div>
            </div>

            {/* Timeline Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-[#0D1520] rounded-xl border border-[#233549] text-[11px] font-bold">
                <button
                  onClick={() => setTimelineFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    timelineFilter === 'all' ? 'bg-[#0773BB] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTimelineFilter('project')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    timelineFilter === 'project' ? 'bg-[#0773BB] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => setTimelineFilter('task')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    timelineFilter === 'task' ? 'bg-[#0773BB] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tasks
                </button>
              </div>

              {/* Scroll Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollTimeline('left')}
                  className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#16222F] text-slate-300 hover:text-white border border-[#233549] transition-all"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTimeline('right')}
                  className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#16222F] text-slate-300 hover:text-white border border-[#233549] transition-all"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Full Timeline Button */}
              <button
                onClick={() => setActiveTab('timeline')}
                className="px-3 py-1.5 rounded-xl bg-[#0773BB]/20 hover:bg-[#0773BB]/30 text-[#3BC0BB] border border-[#0773BB]/40 font-bold text-xs flex items-center gap-1 transition-all ml-1"
              >
                <span>Full Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Horizontal Timeline Content */}
          {(() => {
            const filteredEvents = timelineEvents.filter((ev) => {
              if (timelineFilter === 'all') return true;
              return ev.type === timelineFilter;
            });

            if (filteredEvents.length === 0) {
              return (
                <div className="p-8 text-center rounded-xl bg-[#0D1520]/50 border border-dashed border-[#233549] text-xs text-slate-400 space-y-1">
                  <Milestone className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="font-semibold text-slate-300">No upcoming milestones found for this filter.</p>
                  <p>Assign due dates to projects or tasks to populate the timeline.</p>
                </div>
              );
            }

            return (
              <div
                ref={timelineScrollRef}
                className="overflow-x-auto pb-3 pt-2 no-scrollbar scroll-smooth"
              >
                <div className="inline-flex items-start gap-5 min-w-full px-1">
                  {filteredEvents.map((ev, index) => {
                    const isOverdue = ev.status === 'Overdue';
                    const isCompleted = ev.status === 'Completed';
                    const isInProgress = ev.status === 'In Progress';

                    // Node styles
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
                        {/* Top Date Header & Status Pill */}
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-mono text-slate-300 font-bold text-[11px] flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-[#3BC0BB]" />
                            {formattedDate}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeColor}`}>
                            {isCompleted ? 'Done' : isOverdue ? `Overdue (${Math.abs(ev.daysDiff)}d)` : ev.daysDiff === 0 ? 'Due Today' : `In ${ev.daysDiff}d`}
                          </span>
                        </div>

                        {/* Timeline Horizontal Line & Node Marker */}
                        <div className="relative flex items-center py-2 mb-3">
                          {/* Horizontal connecting line */}
                          <div className={`absolute left-0 right-0 h-0.5 ${
                            index === filteredEvents.length - 1 ? 'w-1/2' : 'w-full'
                          } ${
                            isCompleted ? 'bg-emerald-500/50' : 'bg-[#233549]'
                          }`} />

                          {/* Central node dot */}
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

                        {/* Milestone Card Container */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                          theme === 'light'
                            ? 'bg-slate-50 border-slate-200 hover:border-[#0773BB] shadow-sm'
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

                          {/* Card Footer */}
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
            );
          })()}
        </div>
      )}

      {/* WIDGET: PROJECT BUDGET & BURN RATE TRACKER (Recharts Analytics) */}
      {isWidgetPinned('budget_tracking') && (
        <BudgetTrackingWidget
          projects={companyProjects}
          tasks={companyTasks}
          timeEntries={timeEntries}
          theme={theme}
          onNavigateToProjects={() => setActiveTab('projects')}
        />
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
                            <TaskQuickPreviewPopover task={t} onOpenFullTask={() => setActiveTab('tasks')}>
                              <h4 className={`text-xs font-bold truncate cursor-pointer hover:underline ${isDone ? 'line-through text-slate-500' : theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {getDisplayTaskTitle(t)}
                              </h4>
                            </TaskQuickPreviewPopover>
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
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(
                            t.status,
                            theme === 'light'
                          )}`}>
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
                            <TaskQuickPreviewPopover task={t} onOpenFullTask={() => setActiveTab('tasks')}>
                              <div className={`text-xs font-bold cursor-pointer hover:underline ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{getDisplayTaskTitle(t)}</div>
                            </TaskQuickPreviewPopover>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#233549]/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-base font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      Active Projects Health
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">
                      ({companyProjects.length})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Strategic initiatives under <span className="text-[#3BC0BB] font-semibold">{activeCompany.code}</span> with real-time health diagnostics
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-xs font-semibold text-[#3BC0BB] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>All Projects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Color-Coded Health Legend & Status Overview Bar */}
              <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Activity className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Health Diagnostics Legend:</span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* On-Track Legend item with hover explanation */}
                  <div className="relative group/legend cursor-help flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>On-Track</span>
                    <HelpCircle className="w-3 h-3 text-emerald-400/70" />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/legend:block w-64 p-2.5 rounded-xl bg-[#0D1520] border border-[#233549] text-[11px] text-slate-200 shadow-2xl z-30 pointer-events-none">
                      <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        On-Track
                      </div>
                      <p className="text-slate-300 font-normal leading-tight">
                        Timeline, milestone deliverables, task velocity, and budget expenditures are proceeding as planned.
                      </p>
                    </div>
                  </div>

                  {/* At-Risk Legend item with hover explanation */}
                  <div className="relative group/legend cursor-help flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>At-Risk</span>
                    <HelpCircle className="w-3 h-3 text-amber-400/70" />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/legend:block w-64 p-2.5 rounded-xl bg-[#0D1520] border border-[#233549] text-[11px] text-slate-200 shadow-2xl z-30 pointer-events-none">
                      <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        At-Risk
                      </div>
                      <p className="text-slate-300 font-normal leading-tight">
                        High budget consumption (&gt;95%), overdue tasks, or progress velocity lagging behind spent capital.
                      </p>
                    </div>
                  </div>

                  {/* Blocked Legend item with hover explanation */}
                  <div className="relative group/legend cursor-help flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Blocked</span>
                    <HelpCircle className="w-3 h-3 text-rose-400/70" />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/legend:block w-64 p-2.5 rounded-xl bg-[#0D1520] border border-[#233549] text-[11px] text-slate-200 shadow-2xl z-30 pointer-events-none">
                      <div className="font-bold text-rose-400 mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Blocked
                      </div>
                      <p className="text-slate-300 font-normal leading-tight">
                        Project execution is halted or severely obstructed by unresolved task dependencies or management hold.
                      </p>
                    </div>
                  </div>
                </div>
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
                  companyProjects.map((p) => {
                    const health = getProjectHealthInfo(p, companyTasks, dependencies);
                    const HealthIcon = health.icon;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setActiveTab('gantt')}
                        className={`p-4 rounded-xl border transition-all cursor-pointer group relative ${
                          theme === 'light' ? 'bg-slate-50 border-slate-200 hover:border-[#0773BB]' : 'bg-[#0D1520] border-[#233549] hover:border-[#0773BB]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0773BB]/20 text-[#3BC0BB] font-semibold">
                                {p.code}
                              </span>
                              <h3 className={`text-sm font-bold group-hover:text-[#3BC0BB] transition-colors truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {p.title}
                              </h3>

                              {/* VISUAL HEALTH STATUS BADGE WITH HOVER EXPLANATION */}
                              <div className="relative group/health badge-container">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border transition-all ${health.badgeBg} ${health.badgeText} ${health.badgeBorder}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${health.dotBg} animate-pulse`} />
                                  <HealthIcon className="w-3 h-3" />
                                  <span>{health.label}</span>
                                  <Info className="w-3 h-3 opacity-60 hover:opacity-100 ml-0.5" />
                                </span>

                                {/* Hover-over Explanation Tooltip */}
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/health:block w-72 p-3 rounded-xl bg-[#16222F] border border-[#233549] text-[11px] text-slate-200 shadow-2xl z-40 pointer-events-none animate-in fade-in zoom-in-95">
                                  <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: health.badgeText.replace('text-', '') }}>
                                    <HealthIcon className="w-4 h-4" />
                                    <span>Health Assessment: {health.label}</span>
                                  </div>
                                  <p className="text-slate-300 font-medium leading-relaxed">
                                    {health.explanation}
                                  </p>
                                  <div className="mt-2 pt-1.5 border-t border-[#233549] text-[10px] font-mono text-slate-400 flex justify-between">
                                    <span>Budget: ${p.spentBudget.toLocaleString()} / ${p.budget.toLocaleString()}</span>
                                    <span>Prog: {p.progress}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                              {p.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-xs shrink-0">
                            <div className="text-right">
                              <div className="text-slate-400 text-[11px]">Budget Spent</div>
                              <div className="font-mono font-semibold text-slate-200">
                                ${p.spentBudget.toLocaleString()} / ${p.budget.toLocaleString()}
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                p.status === 'In Progress'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : p.status === 'Completed'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar with health status color accent */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 bg-slate-700/30 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                health.status === 'Blocked'
                                  ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                                  : health.status === 'At-Risk'
                                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                  : 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB]'
                              }`}
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className={`text-xs font-mono font-bold ${
                            health.status === 'Blocked'
                              ? 'text-rose-400'
                              : health.status === 'At-Risk'
                              ? 'text-amber-400'
                              : 'text-[#3BC0BB]'
                          }`}>
                            {p.progress}%
                          </span>
                        </div>
                      </div>
                    );
                  })
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

          {/* WIDGET 6: RECENT TEAM ACTIVITY TIMELINE PANEL */}
          {isWidgetPinned('recent_activity') && (
            <div className="animate-in fade-in">
              <RecentActivityPanel />
            </div>
          )}

          {/* WIDGET 7: REAL-TIME ACTIVITY AUDIT STREAM */}
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-2xl border rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16222F] border-[#233549] text-slate-100'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-200/20">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  theme === 'light' ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-[#3BC0BB]/20 border-[#3BC0BB]/40 text-[#3BC0BB]'
                }`}>
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Customize Dashboard & Chart Widgets
                  </h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Add, remove, or reorder Recharts and D3 analytics widgets on your dashboard workspace.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCustomizeOpen(false)}
                className={`p-1.5 rounded-xl transition-colors ${
                  theme === 'light' ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-800' : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Category Filter Controls */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search charts and widgets (e.g., Burn-Down, D3, Status, Budget)..."
                  value={widgetSearchQuery}
                  onChange={(e) => setWidgetSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:border-[#0773BB] ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400'
                      : 'bg-[#0D1520] border-[#233549] text-slate-100 placeholder:text-slate-500'
                  }`}
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['All', 'Analytics', 'Overview', 'Tasks', 'AI Insights', 'Security'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setWidgetCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      widgetCategoryFilter === cat
                        ? 'bg-[#0773BB] text-white shadow'
                        : theme === 'light'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-[#0D1520] text-slate-400 hover:bg-[#1A2838] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Widget Items List */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[280px]">
              {widgets
                .sort((a, b) => a.order - b.order)
                .filter((w) => {
                  const matchesSearch =
                    w.name.toLowerCase().includes(widgetSearchQuery.toLowerCase()) ||
                    w.description.toLowerCase().includes(widgetSearchQuery.toLowerCase());
                  const matchesCat =
                    widgetCategoryFilter === 'All' || w.category === widgetCategoryFilter;
                  return matchesSearch && matchesCat;
                })
                .map((w, index) => (
                  <div
                    key={w.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      w.pinned
                        ? theme === 'light'
                          ? 'bg-teal-50/50 border-teal-200'
                          : 'bg-[#0D1520] border-[#3BC0BB]/50'
                        : theme === 'light'
                        ? 'bg-slate-50/80 border-slate-200 opacity-60'
                        : 'bg-[#0D1520]/40 border-[#233549] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="cursor-grab text-slate-500 hover:text-slate-300">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <button
                        onClick={() => togglePinWidget(w.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          w.pinned
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                            : theme === 'light'
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-[#1A2838] text-slate-400 hover:text-white'
                        }`}
                        title={w.pinned ? 'Remove Widget from Dashboard' : 'Add Widget to Dashboard'}
                      >
                        {w.pinned ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Pinned</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add</span>
                          </>
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {w.name}
                          </h4>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold border ${
                            theme === 'light' ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-[#16222F] text-slate-400 border-[#233549]'
                          }`}>
                            {w.category}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {w.description}
                        </p>
                      </div>
                    </div>

                    {/* Order Move & Trash Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveWidget(w.id, 'up')}
                        disabled={index === 0}
                        className={`p-1.5 rounded-lg border transition-all disabled:opacity-30 ${
                          theme === 'light' ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white'
                        }`}
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveWidget(w.id, 'down')}
                        disabled={index === widgets.length - 1}
                        className={`p-1.5 rounded-lg border transition-all disabled:opacity-30 ${
                          theme === 'light' ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white'
                        }`}
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      {w.pinned && (
                        <button
                          onClick={() => togglePinWidget(w.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-all"
                          title="Remove Widget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200/20 pt-4">
              <button
                onClick={resetWidgetsToDefault}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>

              <button
                onClick={() => setCustomizeOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white font-bold text-xs shadow-lg transition-all"
              >
                Done ({widgets.filter((w) => w.pinned).length} Active)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE EXECUTIVE STATUS & TIMELINE REPORT MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          {/* Inject print styles */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-dashboard-report, #printable-dashboard-report * {
                visibility: visible !important;
              }
              #printable-dashboard-report {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 32px !important;
                background: #ffffff !important;
                color: #0f172a !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="w-full max-w-4xl bg-[#16222F] border border-[#233549] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header / Toolbar (No-Print) */}
            <div className="no-print p-4 sm:p-5 bg-[#0D1520] border-b border-[#233549] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Executive Status & Timeline Report</h2>
                  <p className="text-xs text-slate-400">Print-friendly PDF summary of active project health, metrics, and timeline events</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1A2838] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-white text-slate-900" id="printable-dashboard-report">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-mono font-bold tracking-wider">
                      DOLPHIN WORKSPACE
                    </span>
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
                      {activeCompany?.code} • {activeCompany?.name}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Executive Status & Project Timeline Report
                  </h1>
                </div>

                <div className="text-right text-xs text-slate-600 space-y-0.5 font-mono">
                  <div><strong>Date Generated:</strong> {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div><strong>Prepared By:</strong> {currentUser?.name || 'Workspace Administrator'} ({currentUser?.role || 'Admin'})</div>
                  <div><strong>System ID:</strong> RPT-{Math.floor(100000 + Math.random() * 900000)}</div>
                </div>
              </div>

              {/* Section 1: Executive KPI Metrics */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-teal-600 pl-2">
                  1. Strategic Workspace Key Performance Indicators
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Active Projects</div>
                    <div className="text-xl font-black text-slate-900 mt-1">{companyProjects.length}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{companyProjects.filter(p => p.status === 'In Progress').length} In Progress</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Budget Allocation</div>
                    <div className="text-xl font-black text-teal-700 mt-1">
                      ${companyProjects.reduce((acc, p) => acc + p.spentBudget, 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      of ${companyProjects.reduce((acc, p) => acc + p.budget, 0).toLocaleString()} Total Allocated
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Task Execution</div>
                    <div className="text-xl font-black text-slate-900 mt-1">
                      {companyTasks.filter(t => t.status === 'Done').length} / {companyTasks.length}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {companyTasks.length > 0 ? Math.round((companyTasks.filter(t => t.status === 'Done').length / companyTasks.length) * 100) : 0}% Complete Rate
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Overdue Items</div>
                    <div className="text-xl font-black text-rose-600 mt-1">
                      {companyTasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length}
                    </div>
                    <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Requires Immediate Attention</div>
                  </div>
                </div>
              </div>

              {/* Section 2: Active Projects Health Matrix */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-teal-600 pl-2">
                  2. Active Projects Health & Diagnostic Matrix
                </h3>

                <table className="w-full text-left text-xs border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="p-2.5 border-r border-slate-200">Code</th>
                      <th className="p-2.5 border-r border-slate-200">Project Title</th>
                      <th className="p-2.5 border-r border-slate-200">Health Diagnostics</th>
                      <th className="p-2.5 border-r border-slate-200">Progress</th>
                      <th className="p-2.5 border-r border-slate-200">Budget Spent</th>
                      <th className="p-2.5">Target End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyProjects.map((p, idx) => {
                      const health = getProjectHealthInfo(p, companyTasks, dependencies);
                      return (
                        <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                          <td className="p-2.5 font-mono font-bold text-teal-800 border-r border-b border-slate-200">{p.code}</td>
                          <td className="p-2.5 font-bold text-slate-900 border-r border-b border-slate-200">{p.title}</td>
                          <td className="p-2.5 border-r border-b border-slate-200">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              health.status === 'On-Track' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              health.status === 'At-Risk' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                              'bg-rose-100 text-rose-800 border-rose-300'
                            }`}>
                              {health.label}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-800 border-r border-b border-slate-200">{p.progress}%</td>
                          <td className="p-2.5 font-mono text-slate-700 border-r border-b border-slate-200">
                            ${p.spentBudget.toLocaleString()} / ${p.budget.toLocaleString()}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 border-b border-slate-200">
                            {p.dueDate || p.startDate || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Section 3: Chronological Timeline & Upcoming Milestones */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-teal-600 pl-2">
                  3. Chronological Project Timeline & Milestones Schedule
                </h3>

                <table className="w-full text-left text-xs border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="p-2.5 border-r border-slate-200">Due Date</th>
                      <th className="p-2.5 border-r border-slate-200">Category</th>
                      <th className="p-2.5 border-r border-slate-200">Title & Code</th>
                      <th className="p-2.5 border-r border-slate-200">Status</th>
                      <th className="p-2.5">Assignee / Manager</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineEvents.slice(0, 12).map((ev, idx) => (
                      <tr key={ev.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                        <td className="p-2.5 font-mono font-bold text-slate-800 border-r border-b border-slate-200 whitespace-nowrap">
                          {new Date(ev.dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-2.5 border-r border-b border-slate-200 uppercase font-bold text-[10px] text-teal-800">
                          {ev.type}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900 border-r border-b border-slate-200">
                          <span className="font-mono text-[10px] text-teal-700 mr-1.5">[{ev.code}]</span>
                          {ev.title}
                        </td>
                        <td className="p-2.5 border-r border-b border-slate-200">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            ev.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700 border-b border-slate-200">
                          {ev.assigneeName || 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 4: AI Executive Brief Summary (if available) */}
              {dailyBrief && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-purple-600 pl-2">
                    4. Gemini AI Executive Chief-of-Staff Summary
                  </h3>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-800 font-medium">
                    {dailyBrief.summary}
                  </div>
                </div>
              )}

              {/* Report Footer */}
              <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <div>Dolphin Project Management Platform • Confidential Strategic Report</div>
                <div>Page 1 of 1</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
