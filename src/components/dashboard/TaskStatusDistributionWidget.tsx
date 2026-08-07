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
  CartesianGrid
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
  Check
} from 'lucide-react';
import { Task, Project } from '../../types';

interface TaskStatusDistributionWidgetProps {
  tasks: Task[];
  projects: Project[];
  theme?: 'light' | string;
}

const STATUS_COLORS: Record<string, { color: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  Done: { color: '#10b981', label: 'Done / Completed', icon: CheckCircle2 },
  'In Progress': { color: '#0773BB', label: 'In Progress', icon: PlayCircle },
  'To Do': { color: '#3BC0BB', label: 'To Do', icon: Clock },
  Review: { color: '#8b5cf6', label: 'In Review', icon: HelpCircle },
  Blocked: { color: '#f43f5e', label: 'Blocked', icon: AlertCircle }
};

export const TaskStatusDistributionWidget: React.FC<TaskStatusDistributionWidgetProps> = ({
  tasks = [],
  projects = [],
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const distributionData = useMemo(() => {
    const counts: Record<string, number> = {
      Done: 0,
      'In Progress': 0,
      'To Do': 0,
      Review: 0,
      Blocked: 0
    };

    filteredTasks.forEach((t) => {
      const st = t.status || 'To Do';
      if (counts[st] !== undefined) {
        counts[st]++;
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
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs space-y-1 font-mono ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
              : 'bg-[#101923]/95 border-[#233549] text-slate-100 shadow-black/80'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-200/20 pb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            <span>{data.label}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-slate-400">Total Count:</span>
            <span className="font-extrabold text-white text-sm">{data.value} tasks</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Share of Scope:</span>
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
                Task Status Breakdown
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#0773BB] border border-[#0773BB]/40">
                RECHARTS
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Real-time task breakdown by execution status across projects.
            </p>
          </div>
        </div>

        {/* Chart View Toggle & Project Selector */}
        <div className="flex items-center gap-2">
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

          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            <button
              type="button"
              onClick={() => setChartType('donut')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-[#0773BB] text-white shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Donut Chart View"
            >
              <PieIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-[#0773BB] text-white shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Bar Chart View"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Donut + Detailed Status Legend */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-6 h-56 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'donut' ? (
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#233549'} vertical={false} />
                <XAxis dataKey="name" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>

          {chartType === 'donut' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {completionPercent}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Done</span>
            </div>
          )}
        </div>

        {/* Legend & Breakdown */}
        <div className="md:col-span-6 space-y-2">
          {distributionData.map((d) => {
            const IconComp = STATUS_COLORS[d.name]?.icon || Clock;
            return (
              <div
                key={d.name}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <IconComp className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {d.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {d.value}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 font-semibold border border-slate-500/20">
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
