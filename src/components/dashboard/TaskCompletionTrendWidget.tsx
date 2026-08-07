import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  BarChart2,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Task, ActivityLog } from '../../types';

interface TaskCompletionTrendWidgetProps {
  tasks: Task[];
  activityLogs?: ActivityLog[];
  theme?: 'light' | string;
}

export const TaskCompletionTrendWidget: React.FC<TaskCompletionTrendWidgetProps> = ({
  tasks = [],
  activityLogs = [],
  theme = 'dark'
}) => {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
  const isLight = theme === 'light';

  // Compute historical daily completion rate over selected range
  const trendData = useMemo(() => {
    const dataPoints = [];
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    for (let i = rangeDays - 1; i >= 0; i--) {
      const dayObj = new Date(now);
      dayObj.setDate(now.getDate() - i);
      
      const dayStart = new Date(dayObj);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayObj);
      dayEnd.setHours(23, 59, 59, 999);

      // Short day label e.g., 'Mon', 'Tue', or 'Today'
      const isToday = i === 0;
      const dayLabel = isToday
        ? 'Today'
        : dayObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const shortDayName = isToday
        ? 'Today'
        : dayObj.toLocaleDateString('en-US', { weekday: 'short' });

      // Calculate tasks existing on/before this day
      const existingTasks = tasks.filter((t) => {
        if (!t.createdAt) return true;
        const createdDate = new Date(t.createdAt);
        return createdDate <= dayEnd;
      });

      // Total tasks in scope at end of this day
      const totalCount = Math.max(existingTasks.length, tasks.length > 0 ? tasks.length : 1);

      // Completed tasks on or before this day
      const completedTasks = existingTasks.filter((t) => {
        if (t.status !== 'Done') return false;
        if (!t.updatedAt) return true; // If no timestamp, count as completed
        const updatedDate = new Date(t.updatedAt);
        return updatedDate <= dayEnd;
      });

      const completedCount = completedTasks.length;
      const pendingCount = Math.max(0, totalCount - completedCount);
      const completionRate = Math.round((completedCount / totalCount) * 100);

      dataPoints.push({
        dateKey: dayObj.toISOString().split('T')[0],
        dayLabel,
        shortDayName,
        completionRate,
        completedCount,
        pendingCount,
        totalCount,
        formattedDate: dayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }

    return dataPoints;
  }, [tasks, rangeDays]);

  // Key Statistics calculations
  const currentRate = trendData.length > 0 ? trendData[trendData.length - 1].completionRate : 0;
  const startRate = trendData.length > 0 ? trendData[0].completionRate : 0;
  const rateDelta = currentRate - startRate;

  const currentCompleted = trendData.length > 0 ? trendData[trendData.length - 1].completedCount : 0;
  const currentTotal = trendData.length > 0 ? trendData[trendData.length - 1].totalCount : 0;
  const currentPending = trendData.length > 0 ? trendData[trendData.length - 1].pendingCount : 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs space-y-2 font-mono ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
              : 'bg-[#101923]/95 border-[#233549] text-slate-100 shadow-black/60'
          }`}
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/40 pb-1.5">
            <span className="font-bold text-slate-400">{data.formattedDate}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40">
              {data.completionRate}% Rate
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-emerald-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed Tasks:
              </span>
              <span>{data.completedCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-amber-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Pending / In Progress:
              </span>
              <span>{data.pendingCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-slate-400 pt-1 border-t border-slate-200/20">
              <span>Total Active Queue:</span>
              <span className="font-bold text-slate-200">{data.totalCount} tasks</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`p-5 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 hover:border-[#0D9488]/40'
          : 'bg-gradient-to-br from-[#16222F] via-[#1A2838] to-[#0D1520] border-[#233549] hover:border-[#3BC0BB]/40'
      }`}
    >
      {/* Background Accent Mesh */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0773BB] to-[#3BC0BB] text-white shadow-md shadow-[#0773BB]/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Tasks Completion Rate Trend
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Last {rangeDays} Days
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Historical 7-day completion velocity calculated from active project task queue.
            </p>
          </div>
        </div>

        {/* Filters and View Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Day Range Selector */}
          <div className={`p-0.5 rounded-lg border flex items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setRangeDays(d as 7 | 14 | 30)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                  rangeDays === d
                    ? 'bg-[#0773BB] text-white shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className={`p-0.5 rounded-lg border flex items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
            <button
              onClick={() => setChartType('area')}
              title="Area Gradient View"
              className={`p-1.5 rounded-md text-xs transition-all ${
                chartType === 'area'
                  ? 'bg-[#3BC0BB] text-slate-950 font-bold'
                  : isLight ? 'text-slate-600' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              title="Bar Chart View"
              className={`p-1.5 rounded-md text-xs transition-all ${
                chartType === 'bar'
                  ? 'bg-[#3BC0BB] text-slate-950 font-bold'
                  : isLight ? 'text-slate-600' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Highlight Bar */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border mb-5 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520]/80 border-[#233549]'
      }`}>
        <div>
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
            Current Rate
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={`text-xl sm:text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {currentRate}%
            </span>
            <span
              className={`inline-flex items-center text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${
                rateDelta >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {rateDelta >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
              {rateDelta >= 0 ? `+${rateDelta}%` : `${rateDelta}%`}
            </span>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
            Completed Tasks
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {currentCompleted}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {currentTotal}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
            In Progress / Open
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
              {currentPending}
            </span>
            <span className="text-xs text-slate-500 font-mono">pending</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
            7-Day Momentum
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-[#3BC0BB]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{rateDelta >= 0 ? 'Positive Velocity' : 'Backlog Accumulation'}</span>
          </div>
        </div>
      </div>

      {/* Recharts Trend Chart Container */}
      <div className="h-56 sm:h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="completionRateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3BC0BB" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#0773BB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} opacity={0.6} />
              <XAxis
                dataKey="shortDayName"
                stroke={isLight ? '#64748B' : '#94A3B8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                unit="%"
                stroke={isLight ? '#64748B' : '#94A3B8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={50} stroke={isLight ? '#CBD5E1' : '#334155'} strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="completionRate"
                stroke="#3BC0BB"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#completionRateGrad)"
                activeDot={{ r: 6, fill: '#101923', stroke: '#3BC0BB', strokeWidth: 3 }}
              />
            </AreaChart>
          ) : chartType === 'bar' ? (
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} opacity={0.6} />
              <XAxis
                dataKey="shortDayName"
                stroke={isLight ? '#64748B' : '#94A3B8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                unit="%"
                stroke={isLight ? '#64748B' : '#94A3B8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completionRate" fill="#3BC0BB" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#233549'} opacity={0.6} />
              <XAxis
                dataKey="shortDayName"
                stroke={isLight ? '#64748B' : '#94A3B8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                unit="%"
                stroke={isLight ? '#64748B' : '#94A3B8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="completionRate"
                stroke="#0773BB"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3BC0BB' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Details */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-[#233549]/40 text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-[#3BC0BB]" />
          Real-time metrics synced from current company workspace task queue
        </span>
        <span>Target Threshold: 75%+</span>
      </div>
    </div>
  );
};
