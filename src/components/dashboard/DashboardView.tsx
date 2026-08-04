import React from 'react';
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
  FileCheck2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APPROVED_DOMAINS } from '../../types';

export const DashboardView: React.FC = () => {
  const {
    projects,
    tasks,
    users,
    activeCompany,
    activityLogs,
    setActiveTab,
    timeEntries
  } = useApp();

  // Filter tasks & projects by company
  const companyProjects = projects.filter((p) => p.companyId === activeCompany.id);
  const companyTasks = tasks.filter((t) => t.companyId === activeCompany.id);

  const completedTasks = companyTasks.filter((t) => t.status === 'Done');
  const inProgressTasks = companyTasks.filter((t) => t.status === 'In Progress');
  const urgentTasks = companyTasks.filter((t) => t.priority === 'Urgent' && t.status !== 'Done');

  const now = new Date();
  const overdueTasks = companyTasks.filter(
    (t) => t.status !== 'Done' && new Date(t.dueDate) < now
  );

  const totalLoggedHours = timeEntries.reduce((acc, curr) => acc + curr.hours, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#16222F] via-[#1A2838] to-[#0D1520] border border-[#233549] shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#0773BB]/10 to-transparent pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-[#3BC0BB] text-xs font-semibold tracking-wider uppercase">
            <Zap className="w-4 h-4 fill-current" />
            <span>Executive Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {activeCompany.name}
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            {activeCompany.description} — Real-time project execution, workload analytics, and corporate compliance monitor.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setActiveTab('tasks')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg shadow-[#0773BB]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16222F] hover:bg-[#233549] border border-[#233549] text-slate-200 font-medium text-xs transition-all"
          >
            <FolderKanban className="w-4 h-4 text-[#3BC0BB]" />
            <span>View Projects</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Projects */}
        <div className="p-5 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] hover:border-[#0773BB]/50 transition-all group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Projects
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0773BB]/20 text-[#0773BB] flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">
              {companyProjects.length}
            </span>
            <span className="text-xs font-medium text-[#3BC0BB] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> On Track
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {companyProjects.filter((p) => p.status === 'In Progress').length} in active execution phase
          </div>
        </div>

        {/* Task Velocity / Completion */}
        <div className="p-5 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] hover:border-[#3BC0BB]/50 transition-all group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Task Completion Rate
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#3BC0BB]/20 text-[#3BC0BB] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">
              {companyTasks.length > 0
                ? Math.round((completedTasks.length / companyTasks.length) * 100)
                : 0}
              %
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {completedTasks.length}/{companyTasks.length} Done
            </span>
          </div>
          <div className="mt-2 w-full bg-[#0D1520] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#3BC0BB] h-full transition-all duration-500"
              style={{
                width: `${
                  companyTasks.length > 0
                    ? (completedTasks.length / companyTasks.length) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Overdue / Urgent Risks */}
        <div className="p-5 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] hover:border-amber-500/50 transition-all group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Risks & Overdue
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-amber-400 tracking-tight">
              {overdueTasks.length}
            </span>
            <span className="text-xs text-rose-400 font-medium">
              {urgentTasks.length} Urgent Tasks
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Automated alerts active for overdue milestones
          </div>
        </div>

        {/* Total Logged Hours */}
        <div className="p-5 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] hover:border-indigo-500/50 transition-all group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Logged Effort Hours
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">
              {totalLoggedHours} <span className="text-sm font-normal text-slate-400">hrs</span>
            </span>
            <span className="text-xs text-slate-400">Billable</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Across {users.length} active Dolphin Group team members
          </div>
        </div>
      </div>

      {/* Main Content Grid: Projects Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Projects Health & Task Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Portfolio Summary Cards */}
          <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  Active Projects Health
                </h2>
                <p className="text-xs text-slate-400">
                  {companyProjects.length} strategic initiatives under {activeCompany.code}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs font-semibold text-[#3BC0BB] hover:underline flex items-center gap-1"
              >
                <span>All Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {companyProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setActiveTab('gantt')}
                  className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] hover:border-[#0773BB] transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0773BB]/20 text-[#3BC0BB] font-semibold">
                          {p.code}
                        </span>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#3BC0BB] transition-colors">
                          {p.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {p.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="text-slate-400">Budget Spent</div>
                        <div className="font-mono text-slate-200">
                          ${p.spentBudget.toLocaleString()} / ${p.budget.toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.status === 'In Progress'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 bg-[#16222F] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] h-full transition-all duration-500"
                        style={{ width: `${p.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#3BC0BB]">
                      {p.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Pending Action Items */}
          <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Urgent Action Items</span>
              </h2>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-semibold text-[#3BC0BB] hover:underline"
              >
                Task Board
              </button>
            </div>

            <div className="space-y-2">
              {urgentTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <div>
                      <div className="text-xs font-bold text-white">{t.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Due: {t.dueDate}</span>
                        <span>•</span>
                        <span>Est: {t.estimatedHours} hrs</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Urgent
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Team Activity Audit Stream & Domain Security Info */}
        <div className="space-y-6">
          {/* Audit Stream */}
          <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#3BC0BB]" />
                <span>Real-Time Activity Stream</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Audit Trail</span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] flex items-start gap-3"
                >
                  <img
                    src={log.userAvatar}
                    alt={log.userName}
                    className="w-7 h-7 rounded-full object-cover mt-0.5 ring-1 ring-[#0773BB]"
                  />
                  <div className="text-xs space-y-0.5 flex-1">
                    <div className="text-slate-200">
                      <span className="font-semibold text-white">{log.userName}</span>{' '}
                      <span className="text-slate-400">{log.action}</span>
                    </div>
                    <div className="text-[#3BC0BB] font-medium truncate max-w-[200px]">
                      {log.target}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Domain Whitelist Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#16222F] to-[#0D1520] border border-[#3BC0BB]/30 space-y-3">
            <div className="flex items-center gap-2 text-[#3BC0BB]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Domain Whitelist Governance
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enforcing restricted access across official corporate email domains:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {APPROVED_DOMAINS.map((d) => (
                <span
                  key={d}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#0D1520] border border-[#233549] font-mono text-slate-300"
                >
                  @{d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
