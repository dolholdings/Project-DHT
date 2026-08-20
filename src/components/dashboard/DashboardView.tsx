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
import { APPROVED_DOMAINS, Task, Project, TaskDependency, AIDailyBrief } from '../../types';
import { isAbortError } from '../../lib/errorUtils';
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
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import { MyTasksWidget } from './MyTasksWidget';
import { HighPriorityOverdueWidget } from './HighPriorityOverdueWidget';
import { DailyBriefWidget } from './DailyBriefWidget';
import { QuickStatsWidget } from './QuickStatsWidget';
import { ProjectTimelineWidget } from './ProjectTimelineWidget';
import { UrgentDependenciesWidget } from './UrgentDependenciesWidget';
import { ProjectsHealthWidget } from './ProjectsHealthWidget';
import { WorkloadSummaryWidget } from './WorkloadSummaryWidget';
import { DomainWhitelistWidget } from './DomainWhitelistWidget';
import { KPIOverviewRow } from './KPIOverviewRow';
import { DolphinLogo } from '../common/DolphinLogo';
import { LogoPlaceholder } from '../common/LogoPlaceholder';

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

export interface DailyBriefData extends AIDailyBrief {
  keyProgress: string[];
  upcomingDeadlines: string[];
  urgentBlockers: string[];
  actionPlan?: string[];
}

export interface DashboardWidgetConfig {
  id: string;
  name: string;
  description: string;
  category: 'Overview' | 'Tasks' | 'Analytics' | 'Security' | 'AI Insights';
  pinned: boolean;
  order: number;
  colSpan?: 1 | 2 | 3;
}

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: 'daily_brief',
    name: 'Gemini AI Executive Daily Brief',
    description: 'AI-generated summary of key daily progress, upcoming deadlines, and urgent blockers based on task history.',
    category: 'AI Insights',
    pinned: true,
    order: 0,
    colSpan: 3,
  },
  {
    id: 'quick_stats',
    name: 'KPI Overview Stats Cards',
    description: 'Summary indicators for Total Projects, In Progress, Completed, and Upcoming Deadlines with trend indicators.',
    category: 'Overview',
    pinned: true,
    order: 1,
    colSpan: 3,
  },
  {
    id: 'my_tasks',
    name: 'My Assigned Tasks',
    description: 'Personal task queue with calculated Priority Scores, quick status checkboxes, and filtering.',
    category: 'Tasks',
    pinned: true,
    order: 2,
    colSpan: 2,
  },
  {
    id: 'high_priority_overdue',
    name: 'High Priority Overdue',
    description: 'Real-time alert radar for critical path overdue tasks, urgent blockers, and high risk priorities.',
    category: 'Tasks',
    pinned: true,
    order: 3,
    colSpan: 1,
  },
  {
    id: 'recent_activity',
    name: 'Recent Team Activity Timeline',
    description: 'Real-time timeline of team actions including task status changes, comments, and document updates.',
    category: 'Overview',
    pinned: true,
    order: 4,
    colSpan: 1,
  },
  {
    id: 'urgent_deps',
    name: 'Urgent Dependencies & Blockers',
    description: 'Critical path tasks that block downstream work or have overdue deadlines.',
    category: 'Tasks',
    pinned: true,
    order: 5,
    colSpan: 1,
  },
  {
    id: 'burndown_chart',
    name: 'Sprint Burn-Down Chart (Recharts)',
    description: 'Interactive Recharts area/line chart comparing actual remaining work scope vs ideal linear burn rate line.',
    category: 'Analytics',
    pinned: true,
    order: 6,
    colSpan: 3,
  },
  {
    id: 'task_status_distribution',
    name: 'Task Status Breakdown (Recharts Donut/Bar)',
    description: 'Interactive Recharts Donut & Bar chart showing task breakdown by status (Done, In Progress, To Do, Blocked, Review).',
    category: 'Analytics',
    pinned: true,
    order: 7,
    colSpan: 2,
  },
  {
    id: 'priority_risk_distribution',
    name: 'Priority & Risk Score Breakdown (Recharts)',
    description: 'Recharts stacked bar chart evaluating priority levels (Urgent, High, Medium, Low) vs completed status and risk scores.',
    category: 'Analytics',
    pinned: true,
    order: 8,
    colSpan: 2,
  },
  {
    id: 'd3_team_velocity_gauge',
    name: 'Team Capacity & Velocity Gauge (D3.js)',
    description: 'Custom D3.js SVG arc gauge displaying overall team capacity utilization percentage and member workload velocity.',
    category: 'Analytics',
    pinned: true,
    order: 9,
    colSpan: 1,
  },
  {
    id: 'task_completion_trend',
    name: 'Tasks Completion Rate (7-Day Trend)',
    description: 'Recharts summary card tracking 7-day completion rate velocity, completed task counts, and backlog metrics.',
    category: 'Analytics',
    pinned: true,
    order: 10,
    colSpan: 1,
  },
  {
    id: 'project_timeline',
    name: 'Project Timeline & Milestones',
    description: 'Visual timeline displaying project milestones and upcoming due dates in a scrollable horizontal format.',
    category: 'Overview',
    pinned: true,
    order: 11,
    colSpan: 3,
  },
  {
    id: 'budget_tracking',
    name: 'Project Budget & Burn Rate Tracker',
    description: 'Recharts visual analytics tracking cumulative spend, burn rates, and predicted budget vs timeline forecasts.',
    category: 'Analytics',
    pinned: true,
    order: 12,
    colSpan: 3,
  },
  {
    id: 'projects_health',
    name: 'Project Health Overview (Recharts)',
    description: 'Executive project health overview with a Recharts pie chart visualizing task distribution by status (Todo, In Progress, Completed, Review).',
    category: 'Overview',
    pinned: true,
    order: 13,
    colSpan: 3,
  },
  {
    id: 'workload_summary',
    name: 'Team Workload & Effort Summary',
    description: 'Breakdown of logged hours, billable effort, and team workload capacity.',
    category: 'Analytics',
    pinned: true,
    order: 14,
    colSpan: 1,
  },
  {
    id: 'activity_stream',
    name: 'Real-Time Activity Audit',
    description: 'Live audit trail showing recent team actions, updates, and timestamps.',
    category: 'Analytics',
    pinned: true,
    order: 15,
    colSpan: 1,
  },
  {
    id: 'domain_whitelist',
    name: 'Domain Security Governance',
    description: 'Approved corporate email domain whitelist for workspace access control.',
    category: 'Security',
    pinned: true,
    order: 16,
    colSpan: 1,
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
  const [isAddWidgetDropdownOpen, setIsAddWidgetDropdownOpen] = useState(false);
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
          // Migrate default colSpan if missing
          const migrated = parsed.map((w: any) => {
            const def = DEFAULT_WIDGETS.find((dw) => dw.id === w.id);
            return {
              ...w,
              colSpan: w.colSpan || def?.colSpan || 1,
              name: def?.name || w.name,
              description: def?.description || w.description,
              category: def?.category || w.category
            };
          });
          if (missingDefaults.length > 0) {
            return [...migrated, ...missingDefaults];
          }
          return migrated;
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

  const handleResizeWidget = (id: string, colSpan: 1 | 2 | 3) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, colSpan } : w))
    );
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, pinned: false } : w))
    );
  };

  const handleAddWidget = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, pinned: true } : w))
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

  const getWidgetIcon = (id: string) => {
    switch (id) {
      case 'daily_brief': return Sparkles;
      case 'quick_stats': return TrendingUp;
      case 'my_tasks': return UserCheck;
      case 'high_priority_overdue': return Flame;
      case 'recent_activity': return Activity;
      case 'urgent_deps': return AlertTriangle;
      case 'burndown_chart': return BarChart2;
      case 'task_status_distribution': return PieChart;
      case 'priority_risk_distribution': return BarChart2;
      case 'd3_team_velocity_gauge': return Gauge;
      case 'task_completion_trend': return TrendingUp;
      case 'project_timeline': return CalendarDays;
      case 'budget_tracking': return Briefcase;
      case 'projects_health': return FolderKanban;
      case 'workload_summary': return Users;
      case 'activity_stream': return Activity;
      case 'domain_whitelist': return ShieldCheck;
      default: return Activity;
    }
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

  const fetchDailyBrief = async (signal?: AbortSignal) => {
    setBriefLoading(true);
    try {
      const res = await fetch('/api/ai/daily-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
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
      if (isAbortError(e)) return;
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
    const controller = new AbortController();
    if (!dailyBrief) {
      fetchDailyBrief(controller.signal);
    }
    return () => {
      controller.abort();
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
        <div className="flex items-center gap-4 relative z-10">
          <LogoPlaceholder
            area="dashboard"
            className="w-12 h-12 p-1.5 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-md border border-slate-200/80 ring-2 ring-[#0773BB]/10"
            imgClassName="w-full h-full object-contain"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Project Management
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-[#0773BB]/15 text-[#3BC0BB] border border-[#0773BB]/30">
                {activeCompany?.code || 'DOLPHIN'}
              </span>
            </div>
            <p className={`text-sm max-w-xl ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              Real-time project execution, customizable workspace widgets, team workload analytics, and compliance governance.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Quick Add Widget Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsAddWidgetDropdownOpen(!isAddWidgetDropdownOpen)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                  : 'bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4 text-[#3BC0BB]" />
              <span>+ Add Widget</span>
            </button>

            {isAddWidgetDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsAddWidgetDropdownOpen(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl z-40 p-3 space-y-2 animate-in fade-in zoom-in-95 ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-[#16222F] border-[#233549] text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/20 px-1">
                    <span className="text-xs font-bold text-slate-300">Add Workspace Widget</span>
                    <button
                      onClick={() => {
                        setIsAddWidgetDropdownOpen(false);
                        setCustomizeOpen(true);
                      }}
                      className="text-[11px] text-[#3BC0BB] hover:underline font-semibold"
                    >
                      Manage All
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    {widgets.filter((w) => !w.pinned).length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        All widgets are currently active on your dashboard!
                      </div>
                    ) : (
                      widgets
                        .filter((w) => !w.pinned)
                        .map((w) => {
                          const IconComp = getWidgetIcon(w.id);
                          return (
                            <button
                              key={w.id}
                              onClick={() => {
                                handleAddWidget(w.id);
                                setIsAddWidgetDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all group ${
                                theme === 'light'
                                  ? 'bg-slate-50 hover:bg-teal-50/50 border-slate-200 hover:border-teal-300'
                                  : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] hover:border-[#3BC0BB]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-1.5 rounded-lg bg-[#0773BB]/20 text-[#3BC0BB]">
                                  <IconComp className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">{w.name}</div>
                                  <div className="text-[10px] text-slate-400">{w.category}</div>
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100 shrink-0 ml-2" />
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

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
            <span>Customize Dashboard ({widgets.filter((w) => w.pinned).length} Pinned)</span>
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

      {/* KEY PERFORMANCE INDICATORS ROW */}
      <KPIOverviewRow
        theme={theme}
        tasks={companyTasks}
        projects={companyProjects}
        users={users}
        timeEntries={timeEntries}
        activityLogs={activityLogs}
        dependencies={dependencies}
        onNavigateToTasks={(filter) => {
          setActiveTab('tasks');
        }}
        onNavigateToTimeline={() => setActiveTab('timeline')}
        onNavigateToProjects={() => setActiveTab('projects')}
      />

      {/* DYNAMIC GRID CONTAINER FOR ALL PINNED & RESIZABLE WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {widgets
          .sort((a, b) => a.order - b.order)
          .filter((w) => w.pinned)
          .map((widget, index) => {
            const IconComp = getWidgetIcon(widget.id);

            const renderWidgetContent = () => {
              switch (widget.id) {
                case 'daily_brief':
                  return (
                    <DailyBriefWidget
                      theme={theme}
                      dailyBrief={dailyBrief}
                      briefLoading={briefLoading}
                      onRefresh={fetchDailyBrief}
                    />
                  );
                case 'quick_stats':
                  return (
                    <QuickStatsWidget
                      theme={theme}
                      projects={companyProjects}
                      tasks={companyTasks}
                    />
                  );
                case 'my_tasks':
                  return (
                    <MyTasksWidget
                      theme={theme}
                      onNavigateToTasks={() => setActiveTab('tasks')}
                    />
                  );
                case 'high_priority_overdue':
                  return (
                    <HighPriorityOverdueWidget
                      theme={theme}
                      onNavigateToTasks={() => setActiveTab('tasks')}
                    />
                  );
                case 'recent_activity':
                  return <RecentActivityPanel />;
                case 'urgent_deps':
                  return (
                    <UrgentDependenciesWidget
                      theme={theme}
                      tasks={companyTasks}
                      dependencies={dependencies}
                      onNavigateToTasks={() => setActiveTab('tasks')}
                    />
                  );
                case 'burndown_chart':
                  return (
                    <BurnDownChartWidget
                      tasks={companyTasks}
                      projects={companyProjects}
                      theme={theme}
                    />
                  );
                case 'task_status_distribution':
                  return (
                    <TaskStatusDistributionWidget
                      tasks={companyTasks}
                      projects={companyProjects}
                      theme={theme}
                    />
                  );
                case 'priority_risk_distribution':
                  return (
                    <PriorityRiskDistributionWidget
                      tasks={companyTasks}
                      dependencies={dependencies}
                      theme={theme}
                    />
                  );
                case 'd3_team_velocity_gauge':
                  return (
                    <D3CapacityVelocityGaugeWidget
                      users={users}
                      timeEntries={timeEntries}
                      tasks={companyTasks}
                      theme={theme}
                    />
                  );
                case 'task_completion_trend':
                  return (
                    <TaskCompletionTrendWidget
                      tasks={companyTasks}
                      activityLogs={activityLogs}
                      theme={theme}
                    />
                  );
                case 'project_timeline':
                  return (
                    <ProjectTimelineWidget
                      theme={theme}
                      projects={companyProjects}
                      tasks={companyTasks}
                      users={users}
                      onNavigateToTimeline={() => setActiveTab('timeline')}
                    />
                  );
                case 'budget_tracking':
                  return (
                    <BudgetTrackingWidget
                      projects={companyProjects}
                      tasks={companyTasks}
                      timeEntries={timeEntries}
                      theme={theme}
                      onNavigateToProjects={() => setActiveTab('projects')}
                    />
                  );
                case 'projects_health':
                  return (
                    <ProjectsHealthWidget
                      theme={theme}
                      projects={companyProjects}
                      tasks={companyTasks}
                      dependencies={dependencies}
                      onNavigateToProjects={() => setActiveTab('projects')}
                      onSelectProject={(id) => setSelectedProjectId(id)}
                    />
                  );
                case 'workload_summary':
                  return (
                    <WorkloadSummaryWidget
                      theme={theme}
                      users={users}
                      tasks={companyTasks}
                      timeEntries={timeEntries}
                    />
                  );
                case 'activity_stream':
                  return <LiveActivityStream />;
                case 'domain_whitelist':
                  return <DomainWhitelistWidget theme={theme} />;
                default:
                  return (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Widget content unavailable
                    </div>
                  );
              }
            };

            return (
              <DashboardWidgetWrapper
                key={widget.id}
                id={widget.id}
                title={widget.name}
                category={widget.category}
                icon={IconComp}
                colSpan={widget.colSpan || 1}
                theme={theme}
                onResize={handleResizeWidget}
                onRemove={handleRemoveWidget}
                onMove={moveWidget}
                canMoveUp={index > 0}
                canMoveDown={index < widgets.filter((w) => w.pinned).length - 1}
              >
                {renderWidgetContent()}
              </DashboardWidgetWrapper>
            );
          })}
      </div>

      {/* CUSTOMIZE WIDGETS DRAWER / MODAL */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div
            className={`w-full max-w-3xl border rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16222F] border-[#233549] text-slate-100'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-200/20">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    theme === 'light' ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-[#3BC0BB]/20 border-[#3BC0BB]/40 text-[#3BC0BB]'
                  }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Customize Dashboard & Chart Widgets
                  </h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Add, remove, drag-to-resize, and reorder widgets across your personal workspace.
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
                  placeholder="Search charts and widgets (e.g., My Tasks, High Priority, Burn-Down, D3, Status)..."
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
                {['All', 'Tasks', 'Analytics', 'Overview', 'AI Insights', 'Security'].map((cat) => (
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
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[300px]">
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
                .map((w, index) => {
                  const IconComp = getWidgetIcon(w.id);
                  return (
                    <div
                      key={w.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        w.pinned
                          ? theme === 'light'
                            ? 'bg-teal-50/50 border-teal-200'
                            : 'bg-[#0D1520] border-[#3BC0BB]/50'
                          : theme === 'light'
                          ? 'bg-slate-50/80 border-slate-200 opacity-60'
                          : 'bg-[#0D1520]/40 border-[#233549] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-[#0773BB]/20 text-[#3BC0BB] shrink-0">
                          <IconComp className="w-4 h-4" />
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
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold border shrink-0 ${
                                theme === 'light' ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-[#16222F] text-slate-400 border-[#233549]'
                              }`}
                            >
                              {w.category}
                            </span>
                          </div>
                          <p className={`text-[11px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {w.description}
                          </p>
                        </div>
                      </div>

                      {/* Sizing & Ordering Controls */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* ColSpan Width Selector */}
                        {w.pinned && (
                          <div className="flex items-center gap-1 bg-[#0D1520] p-1 rounded-lg border border-[#233549] text-[10px] font-mono">
                            <span className="text-slate-400 px-1 font-bold">Width:</span>
                            <button
                              onClick={() => handleResizeWidget(w.id, 1)}
                              className={`px-1.5 py-0.5 rounded transition-all ${
                                (w.colSpan || 1) === 1
                                  ? 'bg-[#0773BB] text-white font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title="1/3 Column Width"
                            >
                              1/3
                            </button>
                            <button
                              onClick={() => handleResizeWidget(w.id, 2)}
                              className={`px-1.5 py-0.5 rounded transition-all ${
                                w.colSpan === 2
                                  ? 'bg-[#0773BB] text-white font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title="2/3 Column Width"
                            >
                              2/3
                            </button>
                            <button
                              onClick={() => handleResizeWidget(w.id, 3)}
                              className={`px-1.5 py-0.5 rounded transition-all ${
                                w.colSpan === 3
                                  ? 'bg-[#0773BB] text-white font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title="Full Row Width"
                            >
                              Full
                            </button>
                          </div>
                        )}

                        {/* Order Move & Trash Controls */}
                        <div className="flex items-center gap-1">
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
                              onClick={() => handleRemoveWidget(w.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-all"
                              title="Remove Widget"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
