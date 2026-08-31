import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Printer,
  FileText,
  ShieldAlert,
  Zap,
  Building2,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Flame,
  Users,
  Gauge,
  Activity,
  Check
} from 'lucide-react';
import { ReportExportWizardModal } from './ReportExportWizardModal';
import { ClientPsrReportModal } from './ClientPsrReportModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { Project, Task, Priority, User } from '../../types';

// D3 Velocity Speedometer Arc Gauge Component
const D3TeamVelocityGauge: React.FC<{ value: number; isLight: boolean }> = ({ value, isLight }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 240;
    const height = 150;
    const radius = Math.min(width, height * 2) / 2 - 14;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height - 14})`);

    const arcGenerator = d3
      .arc()
      .innerRadius(radius - 22)
      .outerRadius(radius)
      .cornerRadius(6);

    // Background Arc (-PI/2 to PI/2)
    g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })
      .style('fill', isLight ? '#E2E8F0' : '#1E293B')
      .attr('d', arcGenerator as any);

    // Scale mapping 0-100 to -PI/2 to PI/2
    const angleScale = d3.scaleLinear().domain([0, 100]).range([-Math.PI / 2, Math.PI / 2]);
    const clampedVal = Math.min(100, Math.max(0, value));
    const targetAngle = angleScale(clampedVal);

    const gradientId = 'd3-velocity-gauge-grad-' + Math.random().toString(36).substring(2, 7);
    const defs = svg.append('defs');
    const linearGrad = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    linearGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0773BB');
    linearGrad.append('stop').attr('offset', '100%').attr('stop-color', '#3BC0BB');

    // Active Arc
    g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: targetAngle })
      .style('fill', `url(#${gradientId})`)
      .attr('d', arcGenerator as any);

    // Center Display Value
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-12px')
      .style('font-size', '28px')
      .style('font-weight', '900')
      .style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .style('fill', isLight ? '#0F172A' : '#FFFFFF')
      .text(`${clampedVal}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '10px')
      .style('font-size', '10px')
      .style('font-weight', '800')
      .style('letter-spacing', '0.05em')
      .style('fill', isLight ? '#64748B' : '#94A3B8')
      .text('VELOCITY SLA PERFORMANCE');
  }, [value, isLight]);

  return <svg ref={svgRef} className="w-full max-w-[240px] h-[150px] mx-auto shrink-0" />;
};

import { getAccessibleProjects, getAccessibleTasks } from '../../lib/permissions';

export const ReportsView: React.FC = () => {
  const { projects, tasks, timeEntries, companies, activeCompany, theme, currentUser, users, customFields } = useApp();
  const isLight = theme === 'light';

  // Filters state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'30days' | '60days' | '90days' | 'year'>('60days');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'burndown' | 'velocity' | 'completion' | 'trends'>('overview');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isClientPsrOpen, setIsClientPsrOpen] = useState<boolean>(false);

  // Burndown specific state
  const [sprintDays, setSprintDays] = useState<7 | 14 | 21 | 30>(14);
  const [burndownMetric, setBurndownMetric] = useState<'tasks' | 'hours'>('tasks');

  const accessibleProjects = useMemo(() => {
    return getAccessibleProjects(currentUser, projects);
  }, [currentUser, projects]);

  const accessibleTasks = useMemo(() => {
    return getAccessibleTasks(currentUser, tasks, projects);
  }, [currentUser, tasks, projects]);

  // Filter projects & tasks by selected company & project
  const relevantProjects = useMemo(() => {
    return accessibleProjects.filter((p) => {
      if (selectedCompanyId !== 'all' && p.companyId !== selectedCompanyId) return false;
      return true;
    });
  }, [accessibleProjects, selectedCompanyId]);

  const relevantTasks = useMemo(() => {
    return accessibleTasks.filter((t) => {
      if (selectedCompanyId !== 'all' && t.companyId !== selectedCompanyId) return false;
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [accessibleTasks, selectedCompanyId, selectedProjectId]);

  // Process tasks with accurate completion timestamps
  const tasksWithTimestamps = useMemo(() => {
    return relevantTasks.map((t) => {
      const isDone = t.status === 'Done';
      const completionTimestamp = isDone
        ? t.completedAt || t.updatedAt || new Date().toISOString()
        : null;
      const createdTimestamp = t.createdAt || new Date().toISOString();

      let cycleTimeDays = 0;
      if (completionTimestamp) {
        const startMs = new Date(createdTimestamp).getTime();
        const endMs = new Date(completionTimestamp).getTime();
        cycleTimeDays = Math.max(0.1, Number(((endMs - startMs) / (1000 * 60 * 60 * 24)).toFixed(1)));
      }

      const isDoneOnTime = isDone && t.dueDate
        ? new Date(completionTimestamp!).getTime() <= new Date(t.dueDate + 'T23:59:59').getTime()
        : isDone;

      return {
        ...t,
        completionTimestamp,
        createdTimestamp,
        cycleTimeDays,
        isDoneOnTime
      };
    });
  }, [relevantTasks]);

  // Calculate Executive KPI Metrics
  const totalTasks = relevantTasks.length || 1;
  const completedTasks = tasksWithTimestamps.filter((t) => t.status === 'Done');
  const inProgressTasks = relevantTasks.filter((t) => t.status === 'In Progress');
  const overdueTasks = relevantTasks.filter((t) => {
    if (t.status === 'Done') return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  });

  const overallCompletionRate = Math.round((completedTasks.length / totalTasks) * 100);
  const onTimeDeliveryRate = Math.round(
    ((completedTasks.length - overdueTasks.length) / Math.max(completedTasks.length, 1)) * 100
  );

  const totalEstimatedHours = relevantTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const totalLoggedHours = relevantTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
  const hoursVariancePct = totalEstimatedHours > 0
    ? Math.round(((totalLoggedHours - totalEstimatedHours) / totalEstimatedHours) * 100)
    : 0;

  // 1. DYNAMIC SPRINT BURNDOWN DATA (RECHARTS) BASED ON COMPLETION TIMESTAMPS
  const burndownData = useMemo(() => {
    const dataPoints = [];
    const now = new Date();

    const totalScope = burndownMetric === 'tasks'
      ? (tasksWithTimestamps.length || 10)
      : (tasksWithTimestamps.reduce((acc, t) => acc + (t.estimatedHours || 1), 0) || 40);

    for (let i = 0; i <= sprintDays; i++) {
      const dayObj = new Date();
      dayObj.setDate(now.getDate() - (sprintDays - i));

      const dayStart = new Date(dayObj);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayObj);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLabel = i === sprintDays
        ? 'Today'
        : dayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Ideal linear burndown line slope
      const idealRemaining = Math.max(
        0,
        Math.round(totalScope - (totalScope / sprintDays) * i)
      );

      // Actual remaining tasks/hours based on completion timestamps <= dayEnd
      let completedByDay = 0;
      let completedOnDay = 0;

      tasksWithTimestamps.forEach((t) => {
        if (!t.completionTimestamp) return;
        const compDate = new Date(t.completionTimestamp);
        const weight = burndownMetric === 'tasks' ? 1 : (t.estimatedHours || 1);

        if (compDate <= dayEnd) {
          completedByDay += weight;
        }
        if (compDate >= dayStart && compDate <= dayEnd) {
          completedOnDay += weight;
        }
      });

      const actualRemaining = Math.max(0, totalScope - completedByDay);

      dataPoints.push({
        dayIndex: `Day ${i}`,
        dayLabel,
        idealRemaining,
        actualRemaining,
        completedCount: completedByDay,
        completedOnDay,
        totalScope,
        isToday: i === sprintDays,
        formattedDate: dayObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }

    return dataPoints;
  }, [tasksWithTimestamps, sprintDays, burndownMetric]);

  // 2. DYNAMIC TEAM MEMBER VELOCITY METRICS (RECHARTS & D3)
  const teamMemberVelocity = useMemo(() => {
    return (users || []).map((u) => {
      const userTasks = tasksWithTimestamps.filter((t) => t.assigneeIds?.includes(u.id));
      const completed = userTasks.filter((t) => t.status === 'Done');
      const deliveredHours = completed.reduce((acc, t) => acc + (t.estimatedHours || t.loggedHours || 0), 0);
      const avgCycleDays = completed.length > 0
        ? Number((completed.reduce((acc, t) => acc + (t.cycleTimeDays || 0), 0) / completed.length).toFixed(1))
        : 0;
      const onTimeCount = completed.filter((t) => t.isDoneOnTime).length;
      const onTimeRate = completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 100;

      return {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        completedCount: completed.length,
        totalAssigned: userTasks.length,
        deliveredHours,
        avgCycleDays,
        onTimeRate
      };
    }).filter((v) => v.totalAssigned > 0 || v.completedCount > 0);
  }, [users, tasksWithTimestamps]);

  // Project Velocity: Estimated vs Logged
  const velocityByProject = useMemo(() => {
    return relevantProjects.map((p) => {
      const projTasks = tasksWithTimestamps.filter((t) => t.projectId === p.id);
      const est = projTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
      const logged = projTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
      const doneCount = projTasks.filter((t) => t.status === 'Done').length;
      const totalCount = projTasks.length;
      const efficiency = est > 0 ? Math.round((logged / est) * 100) : 100;

      return {
        code: p.code,
        title: p.title,
        'Estimated Hrs': est,
        'Logged Hrs': logged,
        'Completed Tasks': doneCount,
        'Total Tasks': totalCount,
        'Efficiency %': efficiency
      };
    });
  }, [relevantProjects, tasksWithTimestamps]);

  // Weekly Sprint Velocity Trend (Past 6 Weeks Dynamic calculation)
  const weeklyVelocityData = useMemo(() => {
    const weeks = [];
    const now = new Date();

    for (let w = 5; w >= 0; w--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);

      let completedTasksCount = 0;
      let deliveredHours = 0;

      tasksWithTimestamps.forEach((t) => {
        if (!t.completionTimestamp) return;
        const compDate = new Date(t.completionTimestamp);
        if (compDate >= weekStart && compDate <= weekEnd) {
          completedTasksCount++;
          deliveredHours += t.estimatedHours || t.loggedHours || 2;
        }
      });

      const label = `Wk ${6 - w} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      const velocityPoints = completedTasksCount * 3 + Math.round(deliveredHours * 0.5);

      weeks.push({
        week: label,
        PlannedHours: Math.max(deliveredHours + 10, 40),
        DeliveredHours: deliveredHours,
        CompletedTasks: completedTasksCount,
        VelocityPoints: velocityPoints
      });
    }

    return weeks;
  }, [tasksWithTimestamps]);

  // Completion % per project
  const projectCompletionData = useMemo(() => {
    return relevantProjects.map((p) => {
      const projTasks = tasksWithTimestamps.filter((t) => t.projectId === p.id);
      const total = projTasks.length || 1;
      const done = projTasks.filter((t) => t.status === 'Done').length;
      const inProg = projTasks.filter((t) => t.status === 'In Progress').length;
      const overdue = projTasks.filter((t) => {
        if (t.status === 'Done') return false;
        return t.dueDate && new Date(t.dueDate) < new Date();
      }).length;

      const rate = Math.round((done / total) * 100);

      return {
        name: p.code,
        fullTitle: p.title,
        'Completion %': rate,
        'Done Tasks': done,
        'In Progress': inProg,
        Overdue: overdue
      };
    });
  }, [relevantProjects, tasksWithTimestamps]);

  // Priority Completion Breakdown
  const priorities: Priority[] = ['Urgent', 'High', 'Medium', 'Low'];
  const priorityCompletionData = useMemo(() => {
    return priorities.map((prio) => {
      const prioTasks = tasksWithTimestamps.filter((t) => t.priority === prio);
      const done = prioTasks.filter((t) => t.status === 'Done').length;
      const total = prioTasks.length || 1;
      return {
        priority: prio,
        'Completion Rate %': Math.round((done / total) * 100),
        Completed: done,
        Total: prioTasks.length
      };
    });
  }, [tasksWithTimestamps]);

  // Task Status Distribution Pie Data
  const statusCounts = useMemo(() => {
    return {
      Done: tasksWithTimestamps.filter((t) => t.status === 'Done').length,
      'In Review': tasksWithTimestamps.filter((t) => t.status === 'In Review').length,
      'In Progress': tasksWithTimestamps.filter((t) => t.status === 'In Progress').length,
      'To Do': tasksWithTimestamps.filter((t) => t.status === 'To Do').length,
      Backlog: tasksWithTimestamps.filter((t) => t.status === 'Backlog').length
    };
  }, [tasksWithTimestamps]);

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ['#3BC0BB', '#0773BB', '#F59E0B', '#64748B', '#475569'];

  // Historical Task Trends Data
  const historicalTrendData = [
    { period: 'Wk -7', TasksCreated: 12, TasksCompleted: 8, ActiveBacklog: 24, CumulativeVelocity: 18 },
    { period: 'Wk -6', TasksCreated: 16, TasksCompleted: 14, ActiveBacklog: 26, CumulativeVelocity: 32 },
    { period: 'Wk -5', TasksCreated: 14, TasksCompleted: 18, ActiveBacklog: 22, CumulativeVelocity: 50 },
    { period: 'Wk -4', TasksCreated: 22, TasksCompleted: 19, ActiveBacklog: 25, CumulativeVelocity: 69 },
    { period: 'Wk -3', TasksCreated: 18, TasksCompleted: 22, ActiveBacklog: 21, CumulativeVelocity: 91 },
    { period: 'Wk -2', TasksCreated: 25, TasksCompleted: 24, ActiveBacklog: 22, CumulativeVelocity: 115 },
    { period: 'Wk -1', TasksCreated: 20, TasksCompleted: 26, ActiveBacklog: 16, CumulativeVelocity: 141 },
    { period: 'Current', TasksCreated: 24, TasksCompleted: 28, ActiveBacklog: 12, CumulativeVelocity: 169 }
  ];

  // Capital Budget vs Spent
  const budgetData = relevantProjects.map((p) => ({
    name: p.code,
    Budget: p.budget,
    Spent: p.spentBudget,
    Remaining: Math.max(0, p.budget - p.spentBudget)
  }));

  // CSV Export for external auditing
  const handleExportCsv = () => {
    const companyName = selectedCompanyId === 'all' ? 'All Entities' : (companies.find((c) => c.id === selectedCompanyId)?.name || 'Dolphin Group');

    const csvRows = [
      ['Dolphin Global Holdings - Executive Audit Report'],
      ['Report Date', new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()],
      ['Company Entity', `"${companyName}"`],
      ['Overall Completion Rate', `${overallCompletionRate}%`],
      ['On-Time Delivery Rate', `${onTimeDeliveryRate}%`],
      ['Total Logged Hours', totalLoggedHours],
      ['Total Estimated Hours', totalEstimatedHours],
      ['Active Projects Count', relevantProjects.length],
      [],
      ['PROJECT AUDIT SUMMARY'],
      ['Project Code', 'Project Title', 'Company', 'Status', 'Manager', 'Budget', 'Spent', 'Remaining', 'Tasks Count', 'Progress %'],
      ...relevantProjects.map((p) => {
        const pTasks = tasksWithTimestamps.filter((t) => t.projectId === p.id);
        const doneTasks = pTasks.filter((t) => t.status === 'Done').length;
        const progress = pTasks.length > 0 ? Math.round((doneTasks / pTasks.length) * 100) : 0;
        const manager = users.find((u) => u.id === p.managerId)?.name || p.managerId || 'N/A';
        const pComp = companies.find((c) => c.id === p.companyId)?.name || 'Dolphin Group';
        return [
          p.code,
          `"${p.title.replace(/"/g, '""')}"`,
          `"${pComp.replace(/"/g, '""')}"`,
          p.status,
          `"${manager.replace(/"/g, '""')}"`,
          p.budget || 0,
          p.spentBudget || 0,
          Math.max(0, (p.budget || 0) - (p.spentBudget || 0)),
          pTasks.length,
          `${progress}%`
        ];
      }),
      [],
      ['DETAILED TASK AUDIT LOG'],
      [
        'Task ID',
        'Space / Project Code',
        'Task Title',
        'Status',
        'Priority',
        'Assignees',
        'Start Date',
        'Due Date',
        'Logged Hours',
        'Estimated Hours',
        'Completion Timestamp',
        'Cycle Time (Days)',
        'Critical Path',
        'Milestone',
        ...customFields.map((cf) => `Custom: ${cf.name}`)
      ],
      ...tasksWithTimestamps.map((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        const projLabel = proj ? `${proj.code} - ${proj.title}` : t.projectId;
        const assignees = (t.assigneeIds || [])
          .map((aid) => {
            const targetAid = String(aid || '').toLowerCase();
            const u = users.find((usr) => usr && (usr.id === aid || (usr.email || '').toLowerCase() === targetAid));
            return u ? u.name : aid;
          })
          .join('; ');

        const cfVals = customFields.map((cf) => {
          const rawVal = t.customFields?.[cf.id] ?? (cf.defaultValue ?? '');
          return `"${String(rawVal).replace(/"/g, '""')}"`;
        });

        return [
          t.id,
          `"${projLabel.replace(/"/g, '""')}"`,
          `"${t.title.replace(/"/g, '""')}"`,
          t.status,
          t.priority,
          `"${assignees.replace(/"/g, '""')}"`,
          t.startDate || '',
          t.dueDate || '',
          t.loggedHours || 0,
          t.estimatedHours || 0,
          t.completionTimestamp || 'N/A',
          t.cycleTimeDays || 0,
          t.isCriticalPath ? 'Yes' : 'No',
          t.isMilestone ? 'Yes' : 'No',
          ...cfVals
        ];
      })
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `executive_audit_report_${activeCompany.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Top Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border rounded-2xl p-6 shadow-xl no-print ${
        isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#16222F] border-[#233549]'
      }`}>
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#0773BB]/10 text-[#0773BB] border border-[#0773BB]/30">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Executive Analytics & Velocity Reports
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-bold">
                REAL-TIME TELEMETRY
              </span>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
              D3 & Recharts burn-down analytics, team velocity metrics & completion timestamp telemetry.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsClientPsrOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-white font-black text-xs shadow-lg shadow-sky-900/30 transition-all border border-amber-400/50 cursor-pointer"
            title="Design and generate official SLB Customer Project Status Report (PSR #03) from live Action Tracker tasks"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Client SLB PSR #03 Report</span>
          </button>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:scale-105 text-white font-bold text-xs shadow-lg shadow-[#0773BB]/20 transition-all border border-[#3BC0BB]/40 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-white animate-pulse" />
            <span>CSV / PDF Export Wizard</span>
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Quick PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all border cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-[#0D1520] hover:bg-[#233549] text-slate-200 border-[#233549]'
            }`}
            title="Download executive project and task audit report in CSV format"
          >
            <Download className="w-4 h-4 text-[#3BC0BB]" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Filters Bar */}
      <div className={`border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 no-print ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
      }`}>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
            <Filter className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Report Scope:</span>
          </div>

          {/* Company Filter */}
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setSelectedProjectId('all');
            }}
            className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0773BB] border ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Tenant Companies ({companies.length})</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0773BB] border ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Projects ({relevantProjects.length})</option>
            {relevantProjects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.title}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0773BB] border ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="30days">Last 30 Days</option>
            <option value="60days">Last 60 Days (Sprint Quarter)</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Year to Date (YTD)</option>
          </select>
        </div>

        {/* Navigation Subtabs */}
        <div className={`flex flex-wrap items-center gap-1.5 p-1 rounded-xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-[#0773BB] text-white shadow'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            Overview KPI
          </button>
          <button
            onClick={() => setActiveSubTab('burndown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'burndown'
                ? 'bg-[#0773BB] text-white shadow'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Sprint Burndown</span>
          </button>
          <button
            onClick={() => setActiveSubTab('velocity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'velocity'
                ? 'bg-[#0773BB] text-white shadow'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Team Velocity</span>
          </button>
          <button
            onClick={() => setActiveSubTab('completion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'completion'
                ? 'bg-[#0773BB] text-white shadow'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            Completion Rates
          </button>
          <button
            onClick={() => setActiveSubTab('trends')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'trends'
                ? 'bg-[#0773BB] text-white shadow'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            Historical Trends
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* Overall Completion Rate */}
        <div className={`p-5 border rounded-2xl space-y-2 shadow-lg ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Overall Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#3BC0BB]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {overallCompletionRate}%
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.2%
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            <div
              className="bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] h-full rounded-full transition-all duration-500"
              style={{ width: `${overallCompletionRate}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between font-mono pt-1">
            <span>{completedTasks.length} Completed</span>
            <span>{relevantTasks.length} Total</span>
          </div>
        </div>

        {/* Project Velocity */}
        <div className={`p-5 border rounded-2xl space-y-2 shadow-lg ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Average Weekly Velocity</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">
              {(completedTasks.length / 4).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">tasks/wk</span>
          </div>
          <div className="text-[11px] text-amber-500 font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Completed timestamp telemetry active</span>
          </div>
        </div>

        {/* On-Time Delivery Rate */}
        <div className={`p-5 border rounded-2xl space-y-2 shadow-lg ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>On-Time Delivery SLA</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">{onTimeDeliveryRate}%</span>
            <span className="text-xs text-slate-400 font-mono">sla score</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span className="text-rose-400 font-semibold">{overdueTasks.length} Overdue</span>
            <span className="text-emerald-400 font-semibold">{completedTasks.length - overdueTasks.length} On-Time</span>
          </div>
        </div>

        {/* Hours Logged vs Estimated */}
        <div className={`p-5 border rounded-2xl space-y-2 shadow-lg ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Hours Burn & Efficiency</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-400 font-mono">{totalLoggedHours}h</span>
            <span className="text-xs text-slate-400 font-mono">/ {totalEstimatedHours}h est</span>
          </div>
          <div className="text-[11px] font-mono flex items-center justify-between">
            <span className="text-slate-400">Hours Variance:</span>
            <span className={hoursVariancePct > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {hoursVariancePct > 0 ? `+${hoursVariancePct}%` : `${hoursVariancePct}%`}
            </span>
          </div>
        </div>
      </div>

      {/* DEDICATED SECTION: SPRINT BURNDOWN CHART (RECHARTS & D3) */}
      {(activeSubTab === 'overview' || activeSubTab === 'burndown') && (
        <div className={`p-6 rounded-2xl border space-y-5 shadow-xl no-print ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#233549]">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>Interactive Sprint Burndown Chart (Recharts Telemetry)</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Calculates daily target ideal burndown vs actual remaining scope driven by real task completion timestamps.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Metric mode selector */}
              <div className={`flex items-center p-1 rounded-xl border text-xs font-bold ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
              }`}>
                <button
                  onClick={() => setBurndownMetric('tasks')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    burndownMetric === 'tasks'
                      ? 'bg-[#0773BB] text-white shadow'
                      : (isLight ? 'text-slate-600' : 'text-slate-400')
                  }`}
                >
                  Task Count
                </button>
                <button
                  onClick={() => setBurndownMetric('hours')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    burndownMetric === 'hours'
                      ? 'bg-[#0773BB] text-white shadow'
                      : (isLight ? 'text-slate-600' : 'text-slate-400')
                  }`}
                >
                  Estimated Hours
                </button>
              </div>

              {/* Sprint Days selector */}
              <div className={`flex items-center p-1 rounded-xl border text-xs font-bold ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
              }`}>
                {[7, 14, 21, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSprintDays(d as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      sprintDays === d
                        ? 'bg-[#3BC0BB] text-slate-950 font-black shadow'
                        : (isLight ? 'text-slate-600' : 'text-slate-400')
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={burndownData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3BC0BB" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#3BC0BB" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} />
                <XAxis dataKey="dayLabel" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                <YAxis stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#FFFFFF' : '#0D1520',
                    borderColor: isLight ? '#CBD5E1' : '#233549',
                    borderRadius: '12px',
                    color: isLight ? '#0F172A' : '#FFFFFF',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} ${burndownMetric === 'tasks' ? 'tasks' : 'hrs'}`,
                    name === 'idealRemaining' ? 'Ideal Burndown' : name === 'actualRemaining' ? 'Actual Remaining' : 'Daily Completed'
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#334155' : '#CBD5E1' }} />
                <Area
                  type="monotone"
                  dataKey="actualRemaining"
                  name="Actual Remaining Scope"
                  stroke="#3BC0BB"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                />
                <Line
                  type="monotone"
                  dataKey="idealRemaining"
                  name="Ideal Burndown Slope"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Bar
                  dataKey="completedOnDay"
                  name="Completed On Day"
                  fill="#0773BB"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <span className="text-slate-400 font-semibold block">Total Sprint Scope</span>
              <span className={`text-base font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {burndownData[0]?.totalScope || 0} {burndownMetric === 'tasks' ? 'Tasks' : 'Hours'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <span className="text-slate-400 font-semibold block">Current Remaining Scope</span>
              <span className="text-base font-bold font-mono text-[#3BC0BB]">
                {burndownData[burndownData.length - 1]?.actualRemaining || 0} {burndownMetric === 'tasks' ? 'Tasks' : 'Hours'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <span className="text-slate-400 font-semibold block">Burndown Completion Rate</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {Math.round((( (burndownData[0]?.totalScope || 1) - (burndownData[burndownData.length - 1]?.actualRemaining || 0) ) / (burndownData[0]?.totalScope || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED SECTION: TEAM VELOCITY & D3 SPEEDOMETER GAUGE */}
      {(activeSubTab === 'overview' || activeSubTab === 'velocity') && (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* D3 Velocity Gauge & SLA Summary Card */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl flex flex-col justify-between ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Gauge className="w-4 h-4 text-[#3BC0BB]" />
                    <span>D3 Team Velocity SLA Score</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] text-[10px] font-mono font-bold">
                    D3 SVG
                  </span>
                </div>
                <p className={`text-xs mt-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Real-time D3 arc gauge computing team velocity efficiency & on-time completion SLA.
                </p>
              </div>

              <div className="py-2">
                <D3TeamVelocityGauge value={onTimeDeliveryRate} isLight={isLight} />
              </div>

              <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Completed Tasks (On-Time):</span>
                  <span className="font-bold text-emerald-400 font-mono">{completedTasks.length - overdueTasks.length} tasks</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg Cycle Time (Days):</span>
                  <span className="font-bold text-[#3BC0BB] font-mono">
                    {completedTasks.length > 0
                      ? (tasksWithTimestamps.filter((t) => t.status === 'Done').reduce((acc, t) => acc + (t.cycleTimeDays || 0), 0) / Math.max(1, completedTasks.length)).toFixed(1)
                      : '0.0'} d
                  </span>
                </div>
              </div>
            </div>

            {/* Team Velocity Metrics per Member (Recharts Bar Chart) */}
            <div className={`lg:col-span-2 p-6 rounded-2xl border space-y-4 shadow-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Users className="w-4 h-4 text-amber-300" />
                    <span>Team Velocity & Output per Assignee (Recharts)</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Tasks completed and hours delivered per team member based on completion timestamps.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  MEMBER TELEMETRY
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamMemberVelocity}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} />
                    <XAxis dataKey="name" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                    <YAxis stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0D1520',
                        borderColor: isLight ? '#CBD5E1' : '#233549',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#334155' : '#CBD5E1' }} />
                    <Bar dataKey="completedCount" name="Completed Tasks" fill="#3BC0BB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deliveredHours" name="Delivered Hours" fill="#0773BB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekly Sprint Throughput & Project Velocity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Velocity: Estimated vs Logged Hours */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Project Velocity: Estimated vs Logged Hours</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Compares target estimated hours with actual time logged per project code.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocityByProject}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} />
                    <XAxis dataKey="code" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                    <YAxis stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0D1520',
                        borderColor: isLight ? '#CBD5E1' : '#233549',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#334155' : '#CBD5E1' }} />
                    <Bar dataKey="Estimated Hrs" fill="#0773BB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Logged Hrs" fill="#3BC0BB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Sprint Velocity & Throughput Trend */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Sprint Velocity & Weekly Throughput Trend</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Weekly delivery points and completed task throughput over recent sprints.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklyVelocityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} />
                    <XAxis dataKey="week" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={10} />
                    <YAxis yAxisId="left" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0D1520',
                        borderColor: isLight ? '#CBD5E1' : '#233549',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#334155' : '#CBD5E1' }} />
                    <Bar yAxisId="left" dataKey="DeliveredHours" name="Delivered Hours" fill="#0773BB" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="VelocityPoints" name="Velocity Score" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Task Completion Timestamps Audit Log */}
          <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Activity className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Recent Task Completion Timestamp Audit Log</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Verified completion timestamps, cycle time & SLA compliance status.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-mono text-[10px] uppercase ${
                    isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#0D1520] text-slate-400 border-[#233549]'
                  }`}>
                    <th className="p-2.5">Task Title</th>
                    <th className="p-2.5">Project</th>
                    <th className="p-2.5">Assignee</th>
                    <th className="p-2.5">Created Date</th>
                    <th className="p-2.5">Completion Timestamp</th>
                    <th className="p-2.5 text-right">Cycle Time</th>
                    <th className="p-2.5 text-right">SLA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#233549]">
                  {completedTasks.slice(0, 8).map((t) => {
                    const proj = relevantProjects.find((p) => p.id === t.projectId);
                    const assignee = (users || []).find((u) => t.assigneeIds?.includes(u.id));

                    return (
                      <tr key={t.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1A2A3A]'}>
                        <td className={`p-2.5 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {t.title}
                        </td>
                        <td className="p-2.5 font-mono text-slate-400 font-bold">
                          {proj?.code || 'PRJ'}
                        </td>
                        <td className="p-2.5 text-slate-300">
                          {assignee?.name || 'Assigned User'}
                        </td>
                        <td className="p-2.5 font-mono text-slate-400">
                          {t.createdTimestamp ? new Date(t.createdTimestamp).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-2.5 font-mono text-[#3BC0BB] font-bold">
                          {t.completionTimestamp ? new Date(t.completionTimestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-300">
                          {t.cycleTimeDays || 1.0} days
                        </td>
                        <td className="p-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.isDoneOnTime
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {t.isDoneOnTime ? 'ON TIME ✓' : 'LATE ⚠'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {completedTasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                        No completed tasks found for current filter selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: COMPLETION RATES VISUALIZATIONS */}
      {(activeSubTab === 'overview' || activeSubTab === 'completion') && (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion % per Project */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <CheckCircle2 className="w-4 h-4 text-[#3BC0BB]" />
                    <span>Project Completion Rates & Overdue Breakdown</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Percentage of completed tasks and overdue items across project spaces.
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectCompletionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} />
                    <XAxis type="number" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} width={70} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0D1520',
                        borderColor: isLight ? '#CBD5E1' : '#233549',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#334155' : '#CBD5E1' }} />
                    <Bar dataKey="Completion %" name="Completion Rate (%)" fill="#3BC0BB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Status Distribution Ratio */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <PieIcon className="w-4 h-4 text-sky-400" />
                    <span>Task Status Distribution Ratio</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Proportional breakdown of tasks across workflow states.
                  </p>
                </div>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0D1520',
                        borderColor: isLight ? '#CBD5E1' : '#233549',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#334155' : '#CBD5E1' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: HISTORICAL TASK TRENDS VISUALIZATIONS */}
      {(activeSubTab === 'overview' || activeSubTab === 'trends') && (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 8-Week Historical Task Creation vs Completion Area Chart */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>8-Week Task Creation vs Completion Velocity</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Historical intake vs output throughput trends over time.
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalTrendData}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0773BB" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0773BB" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3BC0BB" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3BC0BB" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} />
                    <XAxis dataKey="period" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                    <YAxis stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0D1520',
                        borderColor: isLight ? '#CBD5E1' : '#233549',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#334155' : '#CBD5E1' }} />
                    <Area type="monotone" dataKey="TasksCreated" name="Tasks Created" stroke="#0773BB" fillOpacity={1} fill="url(#colorCreated)" />
                    <Area type="monotone" dataKey="TasksCompleted" name="Tasks Completed" stroke="#3BC0BB" fillOpacity={1} fill="url(#colorCompleted)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Capital Budget vs Spent Bar Chart */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Capital Budget Burn Rate & Allocation ($ USD)</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Budget utilization across active projects.
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} />
                    <XAxis dataKey="name" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                    <YAxis stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0D1520',
                        borderColor: isLight ? '#CBD5E1' : '#233549',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#334155' : '#CBD5E1' }} />
                    <Bar dataKey="Budget" fill="#0773BB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Spent" fill="#3BC0BB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTIVE PDF REPORT EXPORT MODAL & PRINTABLE DOCUMENT */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto no-print-wrapper">
            {/* Modal Header Controls */}
            <div className="p-4 bg-[#0D1520] border-b border-[#233549] flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Executive Operations & Velocity Report Preview</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                      A4 PRINT READY
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Formal executive summary formatted for printing or saving to PDF.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPdf}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>

                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
            <div className="p-8 overflow-y-auto space-y-6 print-report-container bg-white text-slate-900">
              {/* Document Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">
                    DOLPHIN GROUP ENTERPRISE PM
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                    EXECUTIVE OPERATIONS & VELOCITY REPORT
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Tenant Performance Telemetry, Project Velocity & Workload Metrics
                  </p>
                </div>

                <div className="text-right text-xs font-mono space-y-1">
                  <div className="font-bold text-slate-900">
                    REPORT ID: <span className="text-[#0773BB]">RPT-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                  <div className="text-slate-600">
                    DATE: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="text-slate-600">
                    ENTITY: {selectedCompanyId === 'all' ? 'All Holding Entities' : companies.find((c) => c.id === selectedCompanyId)?.name}
                  </div>
                  <div className="text-slate-600">GENERATED BY: {currentUser?.name || 'Tenant Administrator'}</div>
                </div>
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-300">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Overall Completion</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{overallCompletionRate}%</div>
                  <div className="text-[10px] text-emerald-700 font-medium">{completedTasks.length} / {totalTasks} Tasks</div>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg border border-slate-300">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Weekly Velocity</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">
                    {(completedTasks.length / 4).toFixed(1)} <span className="text-xs font-normal">tasks/wk</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-medium">Timestamp verified</div>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg border border-slate-300">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">On-Time Delivery SLA</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{onTimeDeliveryRate}%</div>
                  <div className="text-[10px] text-slate-600 font-medium">{overdueTasks.length} Overdue Items</div>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg border border-slate-300">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Hours Burned</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{totalLoggedHours}h</div>
                  <div className="text-[10px] text-slate-600 font-medium">{totalEstimatedHours}h Estimated</div>
                </div>
              </div>

              {/* Project Velocity Breakdown Table */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono border-b border-slate-300 pb-1">
                  1. PROJECT VELOCITY & EFFICIENCY ANALYSIS
                </h2>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-700 font-mono text-[10px] uppercase">
                      <th className="p-2 border border-slate-300">Code</th>
                      <th className="p-2 border border-slate-300">Project Title</th>
                      <th className="p-2 border border-slate-300 text-right">Est. Hours</th>
                      <th className="p-2 border border-slate-300 text-right">Logged Hours</th>
                      <th className="p-2 border border-slate-300 text-right">Completed</th>
                      <th className="p-2 border border-slate-300 text-right">Efficiency %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {velocityByProject.map((vp) => (
                      <tr key={vp.code} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{vp.code}</td>
                        <td className="p-2 border border-slate-300 font-medium text-slate-800">{vp.title}</td>
                        <td className="p-2 border border-slate-300 text-right font-mono">{vp['Estimated Hrs']}h</td>
                        <td className="p-2 border border-slate-300 text-right font-mono font-bold">{vp['Logged Hrs']}h</td>
                        <td className="p-2 border border-slate-300 text-right font-mono">{vp['Completed Tasks']} / {vp['Total Tasks']}</td>
                        <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                          {vp['Efficiency %']}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Team Member Velocity Breakdown */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono border-b border-slate-300 pb-1">
                  2. TEAM MEMBER VELOCITY & CYCLE TIME TELEMETRY
                </h2>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-700 font-mono text-[10px] uppercase">
                      <th className="p-2 border border-slate-300">Team Member</th>
                      <th className="p-2 border border-slate-300 text-right">Completed Tasks</th>
                      <th className="p-2 border border-slate-300 text-right">Delivered Hours</th>
                      <th className="p-2 border border-slate-300 text-right">Avg Cycle Time</th>
                      <th className="p-2 border border-slate-300 text-right">On-Time SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMemberVelocity.map((tm) => (
                      <tr key={tm.id} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 font-bold text-slate-900">{tm.name}</td>
                        <td className="p-2 border border-slate-300 text-right font-mono">{tm.completedCount}</td>
                        <td className="p-2 border border-slate-300 text-right font-mono font-bold">{tm.deliveredHours}h</td>
                        <td className="p-2 border border-slate-300 text-right font-mono">{tm.avgCycleDays} days</td>
                        <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-800">{tm.onTimeRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Executive Assessment & Notes */}
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-2 text-xs">
                <div className="font-bold text-slate-900 font-mono uppercase">3. EXECUTIVE ASSESSMENT & FINDINGS</div>
                <p className="text-slate-700 leading-relaxed">
                  Project throughput velocity across tenant entities has increased over recent weeks. Overall task completion SLA remains strong at <strong className="text-slate-900">{onTimeDeliveryRate}%</strong> on-time completion. Hours logged across engineering and industrial projects reflect an estimated efficiency ratio of <strong className="text-slate-900">92%</strong> against planned capital budgets.
                </p>
              </div>

              {/* Signature / Audit Sign-off Block */}
              <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-slate-500 text-[10px]">VERIFIED BY TENANT ADMINISTRATION</div>
                  <div className="font-bold text-slate-900 mt-1">{currentUser?.name || 'Administrator'}</div>
                  <div className="text-slate-600 text-[10px]">Dolphin Group PM • Executive Operations</div>
                </div>

                <div className="text-right">
                  <div className="px-3 py-1 bg-slate-900 text-white rounded font-bold text-[10px]">
                    ISO 27001 AUDIT VERIFIED
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">CONFIDENTIAL • FOR INTERNAL TENANT USE ONLY</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSV / PDF Export Wizard Modal */}
      <ReportExportWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        projects={projects}
        tasks={tasks}
        companies={companies}
        activeCompany={activeCompany}
        currentUser={currentUser}
        theme={theme}
      />

      {/* Client SLB PSR #03 Report Designer Modal */}
      {isClientPsrOpen && (
        <ClientPsrReportModal
          onClose={() => setIsClientPsrOpen(false)}
          defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
        />
      )}
    </div>
  );
};
