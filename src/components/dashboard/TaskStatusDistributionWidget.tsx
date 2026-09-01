import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart2,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  HelpCircle,
  Filter,
  Check,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import { Task, Project } from '../../types';
import { normalizeTaskStatus } from '../../lib/statusUtils';

interface TaskStatusDistributionWidgetProps {
  tasks: Task[];
  projects: Project[];
  theme?: 'light' | string;
}

const STATUS_COLORS: Record<string, { color: string; label: string; bgLight: string; bgDark: string; icon: React.ComponentType<{ className?: string }> }> = {
  Done: { color: '#10b981', label: 'Done / Completed', bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200', bgDark: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  'In Progress': { color: '#0773BB', label: 'In Progress', bgLight: 'bg-sky-50 text-[#0773BB] border-sky-200', bgDark: 'bg-sky-500/15 text-sky-300 border-sky-500/30', icon: PlayCircle },
  'In Review': { color: '#f59e0b', label: 'In Review', bgLight: 'bg-amber-50 text-amber-700 border-amber-200', bgDark: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: HelpCircle },
  'To Do': { color: '#6366f1', label: 'To Do', bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200', bgDark: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', icon: Clock },
  Backlog: { color: '#94a3b8', label: 'Backlog', bgLight: 'bg-slate-100 text-slate-700 border-slate-200', bgDark: 'bg-slate-700/30 text-slate-400 border-slate-600/30', icon: AlertCircle }
};

export const TaskStatusDistributionWidget: React.FC<TaskStatusDistributionWidgetProps> = ({
  tasks = [],
  projects = [],
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const [chartType, setChartType] = useState<'donut' | 'bar' | 'horizontal_bar'>('donut');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const distributionData = useMemo(() => {
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

    const total = filteredTasks.length || 1;

    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      label: STATUS_COLORS[status]?.label || status,
      value: count,
      percentage: Math.round((count / total) * 100),
      color: STATUS_COLORS[status]?.color || '#94a3b8'
    }));
  }, [filteredTasks]);

  const totalTasks = filteredTasks.length;
  const completedTasks = distributionData.find((d) => d.name === 'Done')?.value || 0;
  const inProgressTasks = distributionData.find((d) => d.name === 'In Progress')?.value || 0;
  const inReviewTasks = distributionData.find((d) => d.name === 'In Review')?.value || 0;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs space-y-1.5 font-mono ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
              : 'bg-[#101923]/95 border-[#233549] text-slate-100 shadow-black/80'
          }`}
        >
          <div className="flex items-center gap-2 font-bold border-b border-slate-200/20 pb-1.5">
            <span
              className="w-3 h-3 rounded-full inline-block shrink-0 shadow-xs"
              style={{ backgroundColor: data.color }}
            />
            <span className={isLight ? 'text-slate-900' : 'text-white'}>{data.label}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Task Count:</span>
            <span className="font-extrabold text-sm">{data.value} tasks</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Share of Total:</span>
            <span className="font-bold text-[#3BC0BB]">{data.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border space-y-5 transition-all shadow-xl relative overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#16222F] border-[#233549] text-slate-100'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200/20">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-purple-500/20 border-purple-500/40 text-purple-400'
          }`}>
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Task Status Breakdown & Metrics
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40">
                PIE & BAR CHARTS
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Real-time distribution across active workflow stages and project scopes.
            </p>
          </div>
        </div>

        {/* Chart View Toggle & Project Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-[#0773BB] ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Workspace Tasks ({tasks.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Toggle buttons for Donut vs Vertical Bar vs Horizontal Bar */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            <button
              type="button"
              onClick={() => setChartType('donut')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-[#0773BB] text-white shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Donut / Pie Chart View"
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Pie/Donut</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-[#0773BB] text-white shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vertical Bar Chart View"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('horizontal_bar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'horizontal_bar'
                  ? 'bg-[#0773BB] text-white shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Horizontal Bar Chart View"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ranked</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Quick Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Scope</span>
            <span className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalTasks}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400 font-bold text-xs">
            Tasks
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          isLight ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
        }`}>
          <div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">Completed</span>
            <span className="text-lg font-black">{completedTasks}</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
            {completionPercent}%
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          isLight ? 'bg-sky-50/70 border-sky-200 text-sky-900' : 'bg-sky-950/30 border-sky-500/30 text-sky-300'
        }`}>
          <div>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider block">In Flight</span>
            <span className="text-lg font-black">{inProgressTasks + inReviewTasks}</span>
          </div>
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs">
            Active
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          isLight ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300'
        }`}>
          <div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">Pending / Backlog</span>
            <span className="text-lg font-black">{pendingTasks}</span>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs">
            Open
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-1">
        <div className="md:col-span-7 h-64 sm:h-72 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'donut' ? (
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={800}
                >
                  {distributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={hoveredStatus === entry.name ? '#ffffff' : 'transparent'}
                      strokeWidth={hoveredStatus === entry.name ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : chartType === 'bar' ? (
              <BarChart data={distributionData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#233549'} vertical={false} />
                <XAxis dataKey="name" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart
                data={[...distributionData].sort((a, b) => b.value - a.value)}
                layout="vertical"
                margin={{ top: 10, right: 25, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#233549'} horizontal={false} />
                <XAxis type="number" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} width={75} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={800}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`hbar-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>

          {chartType === 'donut' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {completionPercent}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Completed</span>
            </div>
          )}
        </div>

        {/* Legend & Breakdown List */}
        <div className="md:col-span-5 space-y-2">
          {distributionData.map((d) => {
            const IconComp = STATUS_COLORS[d.name]?.icon || Clock;
            return (
              <div
                key={d.name}
                onMouseEnter={() => setHoveredStatus(d.name)}
                onMouseLeave={() => setHoveredStatus(null)}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  hoveredStatus === d.name
                    ? isLight
                      ? 'bg-slate-100 border-slate-400 shadow-sm'
                      : 'bg-[#1E2C3D] border-[#3BC0BB] shadow-sm'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    : 'bg-[#0D1520] border-[#233549] hover:bg-[#16222F]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: d.color }}
                  />
                  <IconComp className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {d.label}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                  <span className={`font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {d.value} <span className="text-[10px] font-normal text-slate-400">tasks</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 font-bold border border-slate-500/20">
                    {d.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
