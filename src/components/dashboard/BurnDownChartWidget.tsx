import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Flame,
  TrendingDown,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Layers,
  ArrowDownRight
} from 'lucide-react';
import { Task, Project } from '../../types';

interface BurnDownChartWidgetProps {
  tasks: Task[];
  projects: Project[];
  theme?: 'light' | string;
}

export const BurnDownChartWidget: React.FC<BurnDownChartWidgetProps> = ({
  tasks = [],
  projects = [],
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [sprintDays, setSprintDays] = useState<7 | 14 | 30>(14);
  const [showArea, setShowArea] = useState<boolean>(true);

  // Filter tasks based on selected project
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // Calculate Burndown Data (Ideal vs Actual Remaining Tasks)
  const burndownData = useMemo(() => {
    const dataPoints = [];
    const now = new Date();
    const totalScope = filteredTasks.length > 0 ? filteredTasks.length : 10;

    // Days interval
    for (let dayIndex = 0; dayIndex <= sprintDays; dayIndex++) {
      const dayObj = new Date();
      dayObj.setDate(now.getDate() - (sprintDays - dayIndex));
      
      const dayEnd = new Date(dayObj);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLabel = dayIndex === sprintDays
        ? 'Today'
        : dayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Ideal linear burndown line
      const idealRemaining = Math.max(
        0,
        Math.round(totalScope - (totalScope / sprintDays) * dayIndex)
      );

      // Actual remaining tasks up to dayIndex
      const completedByDay = filteredTasks.filter((t) => {
        if (t.status !== 'Done') return false;
        if (!t.updatedAt) return true;
        const updatedDate = new Date(t.updatedAt);
        return updatedDate <= dayEnd;
      }).length;

      const actualRemaining = Math.max(0, totalScope - completedByDay);

      dataPoints.push({
        dayIndex: `Day ${dayIndex}`,
        dayLabel,
        idealRemaining,
        actualRemaining,
        completedCount: completedByDay,
        totalScope,
        isToday: dayIndex === sprintDays,
        formattedDate: dayObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }

    return dataPoints;
  }, [filteredTasks, sprintDays]);

  // Burndown summary metrics
  const totalScope = filteredTasks.length;
  const completedCount = filteredTasks.filter((t) => t.status === 'Done').length;
  const currentRemaining = totalScope - completedCount;
  const todayPoint = burndownData[burndownData.length - 1];
  const idealToday = todayPoint ? todayPoint.idealRemaining : 0;
  const isAheadOfSchedule = currentRemaining <= idealToday;
  const variance = Math.abs(idealToday - currentRemaining);

  // Estimated burn velocity
  const burnVelocity = sprintDays > 0 ? ((totalScope - currentRemaining) / sprintDays).toFixed(1) : '0';

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/30 pb-1.5">
            <span className="font-bold text-slate-400">{data.formattedDate} ({data.dayIndex})</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              data.actualRemaining <= data.idealRemaining
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {data.actualRemaining <= data.idealRemaining ? 'On Target' : 'Behind Schedule'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-[#3BC0BB]">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Actual Remaining Tasks:
              </span>
              <span className="font-bold text-sm">{data.actualRemaining}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                Ideal Guideline Target:
              </span>
              <span className="font-bold">{data.idealRemaining}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-emerald-400 pt-1 border-t border-slate-200/20">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed to Date:
              </span>
              <span className="font-bold">{data.completedCount} / {data.totalScope}</span>
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200/20">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
          }`}>
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Sprint Burn-Down Chart
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#0773BB] border border-[#0773BB]/40">
                RECHARTS
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Tracks actual remaining work scope vs ideal linear burn rate line.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Dropdown */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-[#0773BB] ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.code})
              </option>
            ))}
          </select>

          {/* Days Toggle */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                onClick={() => setSprintDays(days)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  sprintDays === days
                    ? 'bg-[#0773BB] text-white shadow'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Remaining Tasks</span>
          <span className={`text-xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {currentRemaining} <span className="text-xs font-normal text-slate-400">/ {totalScope}</span>
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Burn Velocity</span>
          <span className="text-xl font-extrabold text-[#3BC0BB]">
            {burnVelocity} <span className="text-xs font-normal text-slate-400">tasks/day</span>
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Ideal Target Today</span>
          <span className="text-xl font-extrabold text-amber-500">
            {idealToday} <span className="text-xs font-normal text-slate-400">tasks</span>
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${
          isAheadOfSchedule
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <span className="text-[10px] uppercase font-mono font-bold block opacity-80">Sprint Schedule Status</span>
          <span className="text-sm font-extrabold flex items-center gap-1 mt-1">
            {isAheadOfSchedule ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Ahead by {variance} task(s)</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span>Behind by {variance} task(s)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Burndown Chart Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={burndownData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualBurnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3BC0BB" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3BC0BB" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isLight ? '#e2e8f0' : '#233549'}
              vertical={false}
            />

            <XAxis
              dataKey="dayLabel"
              stroke={isLight ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
            />

            <YAxis
              stroke={isLight ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />

            {/* Ideal Guideline Line */}
            <Line
              type="linear"
              dataKey="idealRemaining"
              name="Ideal Burndown Target"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* Actual Remaining Area / Line */}
            <Area
              type="monotone"
              dataKey="actualRemaining"
              name="Actual Remaining Scope"
              stroke="#3BC0BB"
              strokeWidth={3}
              fill="url(#actualBurnGrad)"
              dot={{ r: 3, fill: '#3BC0BB' }}
              activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
