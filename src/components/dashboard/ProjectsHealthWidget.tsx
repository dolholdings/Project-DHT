import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import {
  FolderKanban,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  PieChart as PieIcon,
  Filter,
  Activity,
  Layers,
  Clock,
  PlayCircle,
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  BarChart2,
  Sparkles
} from 'lucide-react';
import { Project, Task, TaskDependency } from '../../types';
import { normalizeTaskStatus } from '../../lib/statusUtils';
import { ProjectHealthTooltip } from './ProjectHealthTooltip';

export interface ProjectsHealthWidgetProps {
  theme?: 'dark' | 'light' | string;
  projects: Project[];
  tasks: Task[];
  dependencies?: TaskDependency[];
  onNavigateToProjects?: () => void;
  onSelectProject?: (projectId: string) => void;
}

interface StatusConfig {
  key: string;
  label: string;
  color: string;
  lightBg: string;
  darkBg: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TASK_STATUS_CONFIGS: Record<string, StatusConfig> = {
  Done: {
    key: 'Done',
    label: 'Completed / Done',
    color: '#10b981', // Emerald
    lightBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    darkBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2
  },
  'In Progress': {
    key: 'In Progress',
    label: 'In Progress',
    color: '#0773BB', // ClickUp Blue / Cyan
    lightBg: 'bg-sky-50 text-[#0773BB] border-sky-200',
    darkBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    icon: PlayCircle
  },
  'In Review': {
    key: 'In Review',
    label: 'In Review / QA',
    color: '#f59e0b', // Amber
    lightBg: 'bg-amber-50 text-amber-700 border-amber-200',
    darkBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: HelpCircle
  },
  'To Do': {
    key: 'To Do',
    label: 'To Do / Planned',
    color: '#6366f1', // Indigo
    lightBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    darkBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: Clock
  },
  Backlog: {
    key: 'Backlog',
    label: 'Backlog / Deferred',
    color: '#94a3b8', // Slate
    lightBg: 'bg-slate-100 text-slate-700 border-slate-200',
    darkBg: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
    icon: AlertCircle
  }
};

export const ProjectsHealthWidget: React.FC<ProjectsHealthWidgetProps> = ({
  theme = 'dark',
  projects = [],
  tasks = [],
  dependencies = [],
  onNavigateToProjects,
  onSelectProject
}) => {
  const isLight = theme === 'light';
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  // Filter tasks based on selected project
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const activeProject = useMemo(() => {
    if (selectedProjectId === 'all') return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Compute Task Status Distribution for the Recharts Pie Chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Done: 0,
      'In Progress': 0,
      'In Review': 0,
      'To Do': 0,
      Backlog: 0
    };

    filteredTasks.forEach((t) => {
      const norm = normalizeTaskStatus(t.status);
      if (counts[norm] !== undefined) {
        counts[norm]++;
      } else {
        counts['To Do']++;
      }
    });

    const total = filteredTasks.length;

    return Object.entries(counts).map(([statusKey, count]) => {
      const config = TASK_STATUS_CONFIGS[statusKey] || {
        key: statusKey,
        label: statusKey,
        color: '#94a3b8',
        lightBg: 'bg-slate-100 text-slate-700 border-slate-200',
        darkBg: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
        icon: Clock
      };

      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      return {
        name: statusKey,
        label: config.label,
        value: count,
        percentage,
        color: config.color,
        icon: config.icon,
        lightBg: config.lightBg,
        darkBg: config.darkBg
      };
    });
  }, [filteredTasks]);

  // Overall Health Analytics for Projects
  const projectDiagnostics = useMemo(() => {
    const now = new Date();

    return projects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      const completed = pTasks.filter((t) => t.status === 'Done').length;
      const overdue = pTasks.filter(
        (t) => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now
      ).length;
      const urgent = pTasks.filter((t) => t.status !== 'Done' && t.priority === 'Urgent').length;
      const isBudgetOverrun =
        p.spentBudget && p.budget ? p.spentBudget > p.budget : false;

      // Dependency blockers
      const hasBlockers = pTasks.some((t) => {
        if (t.status === 'Done') return false;
        const deps = dependencies.filter((d) => d.taskId === t.id);
        return deps.some((dep) => {
          const prereq = tasks.find((pt) => pt.id === dep.dependsOnTaskId);
          return prereq && prereq.status !== 'Done';
        });
      });

      let health: 'On-Track' | 'At-Risk' | 'Critical' = 'On-Track';
      if (p.status === 'On Hold' || hasBlockers || overdue > 2 || (isBudgetOverrun && (p.spentBudget / (p.budget || 1)) > 1.2)) {
        health = 'Critical';
      } else if (overdue > 0 || isBudgetOverrun || (p.progress < 30 && p.status === 'In Progress' && p.spentBudget / (p.budget || 1) > 0.6)) {
        health = 'At-Risk';
      }

      return {
        project: p,
        taskCount: pTasks.length,
        completedTasks: completed,
        overdueTasks: overdue,
        urgentTasks: urgent,
        isBudgetOverrun,
        hasBlockers,
        health
      };
    });
  }, [projects, tasks, dependencies]);

  // Summary counts
  const healthStats = useMemo(() => {
    const onTrack = projectDiagnostics.filter((d) => d.health === 'On-Track').length;
    const atRisk = projectDiagnostics.filter((d) => d.health === 'At-Risk').length;
    const critical = projectDiagnostics.filter((d) => d.health === 'Critical').length;
    const totalTasks = filteredTasks.length;
    const doneTasks = filteredTasks.filter((t) => t.status === 'Done').length;
    const overallRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return { onTrack, atRisk, critical, totalTasks, doneTasks, overallRate };
  }, [projectDiagnostics, filteredTasks]);

  // Custom Pie Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs space-y-1.5 font-mono ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60'
              : 'bg-[#0D1520]/95 border-[#233549] text-white shadow-black/80'
          }`}
        >
          <div className="flex items-center gap-2 font-bold border-b border-slate-200/20 pb-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: data.color }}
            />
            <span className="truncate">{data.label}</span>
          </div>
          <div className="flex items-center justify-between gap-6 pt-0.5">
            <span className="text-slate-400">Task Count:</span>
            <span className="font-extrabold text-sm text-[#0773BB]">{data.value} tasks</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-400">Share of Scope:</span>
            <span className="font-bold text-emerald-500">{data.percentage}%</span>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/20">
            {selectedProjectId === 'all'
              ? 'Scope: Entire Workspace Portfolio'
              : `Initiative: ${activeProject?.title || 'Selected Project'}`}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 space-y-6">
      {/* Top Filter & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/20 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isLight
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-[#0773BB]/20 border-[#0773BB]/40 text-[#3BC0BB]'
            }`}
          >
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Project Health & Task Status Overview
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                RECHARTS PIE
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Visualizing execution distribution across Todo, In Progress, Review, and Completed milestones.
            </p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-[#0773BB] transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              <option value="all">🌐 All Workspace Initiatives ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  @{p.code || 'PROJ'}: {p.title}
                </option>
              ))}
            </select>
          </div>

          {onNavigateToProjects && (
            <button
              type="button"
              onClick={onNavigateToProjects}
              className="text-xs font-bold text-[#3BC0BB] hover:underline flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#3BC0BB]/10 transition-colors"
            >
              <span>Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isLight
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              On-Track Initiatives
            </div>
            <div className="text-xl font-black mt-0.5">{healthStats.onTrack}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
        </div>

        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isLight
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              At-Risk Initiatives
            </div>
            <div className="text-xl font-black mt-0.5">{healthStats.atRisk}</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500 opacity-80" />
        </div>

        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isLight
              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Critical / Blocked
            </div>
            <div className="text-xl font-black mt-0.5">{healthStats.critical}</div>
          </div>
          <ShieldAlert className="w-6 h-6 text-rose-500 opacity-80" />
        </div>

        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isLight
              ? 'bg-sky-50/70 border-sky-200 text-sky-950'
              : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-[#0773BB] uppercase tracking-wider">
              Completion Velocity
            </div>
            <div className="text-xl font-black mt-0.5">{healthStats.overallRate}%</div>
          </div>
          <TrendingUp className="w-6 h-6 text-[#0773BB] opacity-80" />
        </div>
      </div>

      {/* Main Section: Left = Recharts Pie Chart & Status Breakdown; Right = Active Initiatives Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Recharts Pie Chart & Distribution Legend (5 cols) */}
        <div
          className={`lg:col-span-5 p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm flex flex-col justify-between ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#3BC0BB]" />
              <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Task Status Distribution
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {filteredTasks.length} Total Task{filteredTasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Recharts Pie Chart Container */}
          <div className="relative w-full h-56 flex items-center justify-center">
            {filteredTasks.length === 0 ? (
              <div className="text-center text-xs text-slate-400 space-y-1">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
                <p>No tasks found for the selected project.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie
                      data={statusDistribution.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                      animationDuration={800}
                    >
                      {statusDistribution
                        .filter((d) => d.value > 0)
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={entry.color}
                            stroke={isLight ? '#ffffff' : '#0D1520'}
                            strokeWidth={2}
                            opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.6}
                          />
                        ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Stats Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black tracking-tight text-[#3BC0BB]">
                    {healthStats.overallRate}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Completed
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Status Breakdown Legend & Counter Chips */}
          <div className="space-y-2 pt-2 border-t border-slate-200/20">
            {statusDistribution.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    isLight ? item.lightBg : item.darkBg
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="font-semibold truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="font-bold">{item.value}</span>
                    <span className="text-[10px] opacity-75 font-semibold">({item.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Active Projects Health & Diagnostics Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-400">
              Active Project Diagnostics ({projectDiagnostics.length} Initiatives)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Click initiative to focus pie chart
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {projectDiagnostics.map(
              ({ project, taskCount, completedTasks, overdueTasks, urgentTasks, health }) => {
                const isSelected = selectedProjectId === project.id;
                const pTasks = tasks.filter((t) => t.projectId === project.id);

                return (
                  <div
                    key={project.id}
                    onMouseEnter={() => setHoveredProjectId(project.id)}
                    onMouseLeave={() => setHoveredProjectId(null)}
                    onClick={() => {
                      setSelectedProjectId(isSelected ? 'all' : project.id);
                      onSelectProject?.(project.id);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? isLight
                          ? 'bg-teal-50/80 border-[#0773BB] ring-2 ring-[#0773BB]/30'
                          : 'bg-[#121C28] border-[#3BC0BB] ring-2 ring-[#3BC0BB]/30'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-[#0773BB] hover:bg-slate-100/80 shadow-xs'
                        : 'bg-[#0D1520] border-[#233549] hover:border-[#3BC0BB] hover:bg-[#121C28]'
                    }`}
                  >
                    <ProjectHealthTooltip
                      isVisible={hoveredProjectId === project.id}
                      project={project}
                      tasks={pTasks}
                    />

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30 shrink-0">
                          @{project.code || 'PROJ'}
                        </span>
                        <h4
                          className={`text-xs font-bold truncate ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {project.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                            health === 'On-Track'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : health === 'At-Risk'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          }`}
                        >
                          {health}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Task Count */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>
                        {completedTasks} of {taskCount} tasks completed
                      </span>
                      <span className="font-bold text-[#3BC0BB]">{project.progress}%</span>
                    </div>

                    <div className="mt-1.5 w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          health === 'Critical'
                            ? 'bg-rose-500'
                            : health === 'At-Risk'
                            ? 'bg-amber-500'
                            : 'bg-[#3BC0BB]'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>

                    {/* Footer Stats: Budget & Overdue Indicators */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/10 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-slate-500" />
                        Budget: ${project.spentBudget?.toLocaleString() || 0} / $
                        {project.budget?.toLocaleString() || 0}
                      </span>

                      <div className="flex items-center gap-3">
                        {urgentTasks > 0 && (
                          <span className="text-amber-400 font-bold flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" /> {urgentTasks} Urgent
                          </span>
                        )}
                        {overdueTasks > 0 && (
                          <span className="text-rose-400 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> {overdueTasks} Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
