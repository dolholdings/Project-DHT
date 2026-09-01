import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { ShieldAlert, AlertTriangle, AlertCircle, Clock, Zap, BarChart2, Layers } from 'lucide-react';
import { Task, TaskDependency } from '../../types';
import { calculatePriorityScore } from '../../lib/priorityScore';

interface PriorityRiskDistributionWidgetProps {
  tasks: Task[];
  dependencies?: TaskDependency[];
  theme?: 'light' | string;
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981'
};

export const PriorityRiskDistributionWidget: React.FC<PriorityRiskDistributionWidgetProps> = ({
  tasks = [],
  dependencies = [],
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const [viewMode, setViewMode] = useState<'grouped' | 'stacked'>('grouped');

  // Compute breakdown of Priority levels vs Done/Open
  const priorityData = useMemo(() => {
    const priorities = ['Urgent', 'High', 'Medium', 'Low'];

    return priorities.map((p) => {
      const match = tasks.filter((t) => t.priority === p);
      const openCount = match.filter((t) => t.status !== 'Done').length;
      const doneCount = match.filter((t) => t.status === 'Done').length;

      // Avg Priority Score for this bucket
      const scores = match.map((t) => calculatePriorityScore(t, dependencies, tasks).score);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      return {
        priority: p,
        Open: openCount,
        Completed: doneCount,
        Total: match.length,
        avgScore,
        color: PRIORITY_COLORS[p] || '#3BC0BB'
      };
    });
  }, [tasks, dependencies]);

  const urgentOpen = tasks.filter((t) => t.priority === 'Urgent' && t.status !== 'Done').length;
  const highRiskTasks = tasks.filter((t) => {
    if (t.status === 'Done') return false;
    const s = calculatePriorityScore(t, dependencies, tasks);
    return s.score >= 60;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs space-y-2 font-mono ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
              : 'bg-[#101923]/95 border-[#233549] text-slate-100 shadow-black/80'
          }`}
        >
          <div className="font-bold border-b border-slate-200/20 pb-1.5 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
              <span className={isLight ? 'text-slate-900' : 'text-white'}>{label} Priority</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300">
              Avg Risk: {data.avgScore}/100
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-rose-400">
              <span>Open Pending:</span>
              <span className="font-extrabold">{data.Open} tasks</span>
            </div>
            <div className="flex justify-between gap-4 text-emerald-400">
              <span>Completed:</span>
              <span className="font-extrabold">{data.Completed} tasks</span>
            </div>
            <div className={`flex justify-between gap-4 border-t border-slate-200/20 pt-1 font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <span>Total in Category:</span>
              <span>{data.Total} tasks</span>
            </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200/20">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Priority & Risk Score Breakdown
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40">
                BAR CHARTS
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Evaluates priority level distribution and open task risk exposure.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-[#0773BB] text-white shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Grouped</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('stacked')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'stacked'
                  ? 'bg-[#0773BB] text-white shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stacked</span>
            </button>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold ${
            urgentOpen > 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            <span>{urgentOpen} Urgent</span>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#233549'} vertical={false} />
            <XAxis dataKey="priority" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
            <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
            <Bar
              dataKey="Open"
              name="Pending Open"
              stackId={viewMode === 'stacked' ? 'a' : undefined}
              fill="#f43f5e"
              radius={viewMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
              animationDuration={800}
            />
            <Bar
              dataKey="Completed"
              name="Completed"
              stackId={viewMode === 'stacked' ? 'a' : undefined}
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
