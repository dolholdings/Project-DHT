import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
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
  Legend,
  ReferenceLine
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Calendar,
  Zap,
  BarChart3,
  Sliders,
  Briefcase,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Project, Task, TimeEntry } from '../../types';

interface BudgetTrackingWidgetProps {
  projects: Project[];
  tasks: Task[];
  timeEntries?: TimeEntry[];
  theme?: 'light' | string;
  onNavigateToProjects?: () => void;
}

export const BudgetTrackingWidget: React.FC<BudgetTrackingWidgetProps> = ({
  projects,
  tasks,
  timeEntries = [],
  theme = 'dark',
  onNavigateToProjects
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'comparison' | 'runway'>('timeline');
  const [whatIfModifier, setWhatIfModifier] = useState<number>(1.0); // 1.0 = normal burn rate, 1.25 = +25% cost

  const isLight = theme === 'light';

  // Selected project or overall portfolio
  const selectedProject = useMemo(() => {
    if (selectedProjectId === 'all') return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  // Aggregate totals
  const portfolioBudget = useMemo(() => {
    if (selectedProject) return selectedProject.budget;
    return projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  }, [selectedProject, projects]);

  const portfolioSpent = useMemo(() => {
    if (selectedProject) return selectedProject.spentBudget;
    return projects.reduce((sum, p) => sum + (p.spentBudget || 0), 0);
  }, [selectedProject, projects]);

  const portfolioProgress = useMemo(() => {
    if (selectedProject) return selectedProject.progress;
    if (projects.length === 0) return 0;
    const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
    return Math.round(totalProgress / projects.length);
  }, [selectedProject, projects]);

  // Calculated Forecast & Burn Velocity
  const forecastSpend = useMemo(() => {
    const rawForecast = portfolioProgress > 0 ? (portfolioSpent / (portfolioProgress / 100)) * whatIfModifier : portfolioBudget * whatIfModifier;
    return Math.round(rawForecast);
  }, [portfolioSpent, portfolioProgress, portfolioBudget, whatIfModifier]);

  const variance = portfolioBudget - forecastSpend;
  const isOverBudget = variance < 0;
  const burnPercent = portfolioBudget > 0 ? Math.round((portfolioSpent / portfolioBudget) * 100) : 0;

  // Generate Recharts timeline data points (Month 1 -> Month 6 / Start -> Due Date)
  const timelineChartData = useMemo(() => {
    const activeProjectsList = selectedProject ? [selectedProject] : projects;
    if (activeProjectsList.length === 0) return [];

    // Define 6 timeline checkpoints (e.g. Month 1..6 or 6 Phases)
    const points = [
      { month: 'M1 (Start)', pct: 15 },
      { month: 'M2', pct: 30 },
      { month: 'M3 (Midpoint)', pct: 50 },
      { month: 'M4', pct: 70 },
      { month: 'M5', pct: 85 },
      { month: 'M6 (Due Date)', pct: 100 }
    ];

    const currentPct = Math.min(100, Math.max(10, portfolioProgress));

    return points.map((p) => {
      // Planned baseline is linear portion of total budget
      const plannedSpend = Math.round((portfolioBudget * p.pct) / 100);

      // Actual spend curve up to current progress point
      let actualSpend: number | null = null;
      if (p.pct <= currentPct || p.pct === 15) {
        // Interpolate actual spend up to current progress point
        const ratio = Math.min(1, p.pct / (currentPct || 1));
        actualSpend = Math.round(portfolioSpent * ratio);
      }

      // Projected burn curve based on current velocity and what-if modifier
      const burnVelocity = currentPct > 0 ? (portfolioSpent / currentPct) * whatIfModifier : (portfolioBudget / 100) * whatIfModifier;
      const projectedSpend = Math.round(burnVelocity * p.pct);

      // Monthly burn delta
      const monthlyBurn = Math.round((burnVelocity * 15));

      return {
        checkpoint: p.month,
        plannedSpend,
        actualSpend,
        projectedSpend,
        monthlyBurn,
        budgetCeiling: portfolioBudget,
        completionPct: p.pct
      };
    });
  }, [selectedProject, projects, portfolioBudget, portfolioSpent, portfolioProgress, whatIfModifier]);

  // Project comparison chart data
  const comparisonChartData = useMemo(() => {
    return projects.map((p) => {
      const pForecast = p.progress > 0 ? Math.round((p.spentBudget / (p.progress / 100)) * whatIfModifier) : p.budget;
      return {
        name: p.code || p.title.substring(0, 12),
        fullTitle: p.title,
        budget: p.budget,
        spent: p.spentBudget,
        forecast: pForecast,
        progress: p.progress,
        variance: p.budget - pForecast
      };
    });
  }, [projects, whatIfModifier]);

  // Runway & Burn Velocity Data
  const burnVelocityData = useMemo(() => {
    return projects.map((p) => {
      const projTasks = tasks.filter((t) => t.projectId === p.id);
      const estHours = projTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
      const actHours = projTasks.reduce((s, t) => s + (t.loggedHours || 0), 0);
      const costPerHour = p.budget > 0 && estHours > 0 ? p.budget / estHours : 85;
      const estimatedCost = Math.round(estHours * costPerHour);
      const actualCost = Math.round(actHours * costPerHour);

      return {
        name: p.code || p.title.substring(0, 10),
        estimatedHours: estHours,
        actualHours: actHours,
        estimatedCost,
        actualCost,
        spentBudget: p.spentBudget,
        burnRateIdx: actHours > 0 && estHours > 0 ? parseFloat((actHours / estHours).toFixed(2)) : 1.0
      };
    });
  }, [projects, tasks]);

  // Recharts Custom Tooltip renderer
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] text-slate-100 shadow-2xl font-mono text-xs z-50 space-y-1.5 min-w-[200px]">
        <div className="font-bold text-white border-b border-[#233549] pb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-[#3BC0BB] font-sans">Burn Analytics</span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 font-sans" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {typeof entry.value === 'number' ? `$${entry.value.toLocaleString()}` : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`p-6 rounded-2xl border space-y-5 shadow-xl transition-all animate-in fade-in ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16222F]/80 border-[#233549] text-slate-100'
      }`}
    >
      {/* Widget Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#233549]/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-[#3BC0BB] text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Project Budget & Burn Rate Tracker
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                RECHARTS ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize cumulative spend, project burn velocity, and predicted budget timeline variance
            </p>
          </div>
        </div>

        {/* Top Control Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Project Dropdown Selector */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-[#0D1520] border-[#233549] text-slate-200'
          }`}>
            <Briefcase className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className={isLight ? 'text-slate-900' : 'bg-[#0D1520] text-white'}>
                All Projects Portfolio ({projects.length})
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className={isLight ? 'text-slate-900' : 'bg-[#0D1520] text-white'}>
                  {p.code} - {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-bold ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'timeline'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Burn Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'comparison'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Portfolio Compare</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('runway')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'runway'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Burn Velocity</span>
            </button>
          </div>

          {/* What-If Scenario Modifiers */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${
            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-slate-400 font-mono uppercase hidden sm:inline">Forecast Scenario:</span>
            <select
              value={whatIfModifier}
              onChange={(e) => setWhatIfModifier(parseFloat(e.target.value))}
              className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value={1.0} className={isLight ? 'text-slate-900' : 'bg-[#0D1520] text-white'}>Baseline Velocity (1.0x)</option>
              <option value={1.15} className={isLight ? 'text-slate-900' : 'bg-[#0D1520] text-white'}>+15% Cost Overrun Risk</option>
              <option value={1.30} className={isLight ? 'text-slate-900' : 'bg-[#0D1520] text-white'}>+30% Severe Overrun Scenario</option>
              <option value={0.85} className={isLight ? 'text-slate-900' : 'bg-[#0D1520] text-white'}>-15% Optimized Efficiency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Allocated Budget Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Allocated Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold font-mono text-white">
              ${portfolioBudget.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              100% Target
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            {selectedProject ? `Project: ${selectedProject.title}` : `Across ${projects.length} workspace projects`}
          </p>
        </div>

        {/* Spent To Date Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Actual Spent To Date</span>
            <PieChart className="w-4 h-4 text-[#3BC0BB]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold font-mono text-[#3BC0BB]">
              ${portfolioSpent.toLocaleString()}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
              burnPercent > 90
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-teal-500/20 text-[#3BC0BB] border-teal-500/40'
            }`}>
              {burnPercent}% Consumed
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all ${burnPercent > 90 ? 'bg-rose-500' : 'bg-[#3BC0BB]'}`}
              style={{ width: `${Math.min(100, burnPercent)}%` }}
            />
          </div>
        </div>

        {/* Forecasted Spend Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Predicted Final Spend</span>
            <TrendingUp className={`w-4 h-4 ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-xl font-extrabold font-mono ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
              ${forecastSpend.toLocaleString()}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
              isOverBudget
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {isOverBudget ? 'Over Budget' : 'Within Budget'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            {isOverBudget ? `Projected Cost Overrun: $${Math.abs(variance).toLocaleString()}` : `Under Budget Margin: $${variance.toLocaleString()}`}
          </p>
        </div>

        {/* Burn Efficiency & Health Index */}
        <div className={`p-4 rounded-xl border transition-all ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Burn Efficiency Index</span>
            <ShieldAlert className={`w-4 h-4 ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold font-mono text-amber-400">
              {portfolioProgress > 0 ? (portfolioSpent / (portfolioProgress || 1) / 100).toFixed(0) : '1.0x'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
              {portfolioProgress}% Progress
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            Spend vs Progress ratio: {portfolioProgress}% completed vs {burnPercent}% budget used
          </p>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520]/90 border-[#233549]'}`}>
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-xs uppercase tracking-wide">
              {viewMode === 'timeline' && 'Predicted Burn Rate Curve vs Planned Baseline ($)'}
              {viewMode === 'comparison' && 'Portfolio Projects Budget vs Spent vs Forecast ($)'}
              {viewMode === 'runway' && 'Task Labor Hours vs Cost Burn Velocity ($)'}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Interactive Recharts Visualization
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'timeline' ? (
              <ComposedChart data={timelineChartData} margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#233549" opacity={0.5} />
                <XAxis dataKey="checkpoint" stroke="#81E6D9" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#81E6D9"
                  fontSize={10}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {/* Planned Baseline Target Area */}
                <Area
                  type="monotone"
                  dataKey="plannedSpend"
                  name="Planned Baseline Target"
                  fill="#0773BB"
                  stroke="#0773BB"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />

                {/* Actual Cumulative Spent Line */}
                <Line
                  type="monotone"
                  dataKey="actualSpend"
                  name="Actual Spent To Date"
                  stroke="#00F5D4"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#00F5D4', stroke: '#020712' }}
                  activeDot={{ r: 7 }}
                />

                {/* Forecasted Burn Projection */}
                <Line
                  type="monotone"
                  dataKey="projectedSpend"
                  name="Predicted Burn Curve"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#f59e0b' }}
                />

                {/* Monthly Burn Delta Bars */}
                <Bar
                  dataKey="monthlyBurn"
                  name="Monthly Burn Rate"
                  fill="#38bdf8"
                  opacity={0.3}
                  radius={[4, 4, 0, 0]}
                />

                {/* Total Budget Ceiling Reference Line */}
                <ReferenceLine
                  y={portfolioBudget}
                  label={{ value: `Max Budget Ceiling: $${portfolioBudget.toLocaleString()}`, fill: '#ef4444', fontSize: 10, position: 'top' }}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
              </ComposedChart>
            ) : viewMode === 'comparison' ? (
              <BarChart data={comparisonChartData} margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#233549" opacity={0.5} />
                <XAxis dataKey="name" stroke="#81E6D9" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#81E6D9"
                  fontSize={10}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                <Bar dataKey="budget" name="Allocated Budget" fill="#0773BB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name="Spent To Date" fill="#00F5D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forecast" name="Predicted Total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <ComposedChart data={burnVelocityData} margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#233549" opacity={0.5} />
                <XAxis dataKey="name" stroke="#81E6D9" fontSize={11} tickLine={false} />
                <YAxis stroke="#81E6D9" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                <Bar dataKey="estimatedHours" name="Estimated Labor Hours" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actualHours" name="Logged Labor Hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="spentBudget" name="Spent Budget ($)" stroke="#00F5D4" strokeWidth={3} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Info & Quick Navigate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#3BC0BB] shrink-0" />
          <span>
            {isOverBudget ? (
              <span className="text-rose-400 font-bold">
                Warning: Predicted spend exceeds total allocated budget by ${Math.abs(variance).toLocaleString()}.
              </span>
            ) : (
              <span>
                Burn velocity is currently operating within expected baseline margins.
              </span>
            )}
          </span>
        </div>

        {onNavigateToProjects && (
          <button
            type="button"
            onClick={onNavigateToProjects}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition-all w-fit ml-auto"
          >
            <span>Manage Project Budgets</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
