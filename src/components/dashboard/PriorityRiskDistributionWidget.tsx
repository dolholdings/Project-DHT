import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ShieldAlert, AlertTriangle, AlertCircle, Clock, Zap } from 'lucide-react';
import { Task, TaskDependency } from '../../types';
import { calculatePriorityScore } from '../../lib/priorityScore';

interface PriorityRiskDistributionWidgetProps {
  tasks: Task[];
  dependencies?: TaskDependency[];
  theme?: 'light' | string;
}

export const PriorityRiskDistributionWidget: React.FC<PriorityRiskDistributionWidgetProps> = ({
  tasks = [],
  dependencies = [],
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

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
        avgScore
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
          className={`p-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs space-y-2 font-mono ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
              : 'bg-[#101923]/95 border-[#233549] text-slate-100 shadow-black/80'
          }`}
        >
          <div className="font-bold text-amber-400 border-b border-slate-200/20 pb-1 flex items-center justify-between gap-3">
            <span>{label} Priority Scope</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Avg Risk: {data.avgScore}/100
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-rose-400">
              <span>Open Pending Tasks:</span>
              <span className="font-bold">{data.Open}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Completed Tasks:</span>
              <span className="font-bold">{data.Completed}</span>
            </div>
            <div className="flex justify-between text-slate-400 border-t border-slate-200/20 pt-1">
              <span>Total Priority Scope:</span>
              <span className="font-bold">{data.Total}</span>
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#0773BB] border border-[#0773BB]/40">
                RECHARTS
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Evaluates priority distribution and open task risk exposure.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold ${
            urgentOpen > 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            <span>{urgentOpen} Urgent Open</span>
          </div>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#233549'} vertical={false} />
            <XAxis dataKey="priority" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
            <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
            <Bar dataKey="Open" name="Pending Open" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
