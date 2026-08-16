import React, { useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Project, Task } from '../../types';
import { StatCardTooltip } from './StatCardTooltip';

export interface QuickStatsWidgetProps {
  theme?: 'dark' | 'light';
  projects: Project[];
  tasks: Task[];
}

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({
  theme = 'dark',
  projects,
  tasks
}) => {
  const [hoveredStatCard, setHoveredStatCard] = useState<string | null>(null);

  const inProgressProjects = projects.filter((p) => p.status === 'In Progress');
  const completedProjects = projects.filter((p) => p.status === 'Completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const completedTasks = tasks.filter((t) => t.status === 'Done');

  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlinesTasks = tasks.filter((t) => {
    if (t.status === 'Done') return false;
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d <= next7Days;
  });

  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'Done') return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < now;
  });

  return (
    <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Projects */}
      <div
        onMouseEnter={() => setHoveredStatCard('total_projects')}
        onMouseLeave={() => setHoveredStatCard(null)}
        className={`p-4 rounded-xl border transition-all group shadow-sm relative cursor-pointer ${
          theme === 'light'
            ? 'bg-slate-50 border-slate-200 hover:border-[#0773BB]'
            : 'bg-[#0D1520] border-[#233549] hover:border-[#0773BB]'
        }`}
      >
        <StatCardTooltip
          isVisible={hoveredStatCard === 'total_projects'}
          title="Total Projects Portfolio"
          subtitle="Distribution & Capital Breakdown"
          icon={FolderKanban}
          accentColor="#0773BB"
          items={[
            {
              label: 'In Progress Projects',
              value: inProgressProjects.length,
              subtext: `${inProgressProjects.length} active initiatives`,
              progress: projects.length > 0 ? (inProgressProjects.length / projects.length) * 100 : 0,
              color: '#0773BB'
            },
            {
              label: 'Completed Projects',
              value: completedProjects.length,
              subtext: `${completedProjects.length} delivered`,
              progress: projects.length > 0 ? (completedProjects.length / projects.length) * 100 : 0,
              color: '#3BC0BB'
            },
            {
              label: 'Total Capital Budget',
              value: `$${projects.reduce((s, p) => s + (p.budget || 0), 0).toLocaleString()}`,
              subtext: `Spent: $${projects.reduce((s, p) => s + (p.spentBudget || 0), 0).toLocaleString()}`,
              color: '#10b981'
            }
          ]}
          footerNote="Portfolio breakdown"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Projects
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#0773BB]/20 text-[#0773BB] flex items-center justify-center group-hover:scale-110 transition-transform">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between">
          <span className={`text-2xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            {projects.length}
          </span>
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-3 h-3" /> +12.5%
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0773BB]"></span>
          <span>{inProgressProjects.length} active • {completedProjects.length} done</span>
        </div>
      </div>

      {/* Card 2: In Progress */}
      <div
        onMouseEnter={() => setHoveredStatCard('in_progress')}
        onMouseLeave={() => setHoveredStatCard(null)}
        className={`p-4 rounded-xl border transition-all group shadow-sm relative cursor-pointer ${
          theme === 'light'
            ? 'bg-slate-50 border-slate-200 hover:border-sky-500'
            : 'bg-[#0D1520] border-[#233549] hover:border-sky-500'
        }`}
      >
        <StatCardTooltip
          isVisible={hoveredStatCard === 'in_progress'}
          title="In Progress Workloads"
          subtitle="Active Execution Metrics"
          icon={Activity}
          accentColor="#38bdf8"
          items={[
            {
              label: 'Active Execution Tasks',
              value: inProgressTasks.length,
              subtext: `Out of ${tasks.length} total tasks`,
              progress: tasks.length > 0 ? (inProgressTasks.length / tasks.length) * 100 : 0,
              color: '#38bdf8'
            },
            {
              label: 'Urgent & High Priority',
              value: tasks.filter((t) => t.status === 'In Progress' && (t.priority === 'Urgent' || t.priority === 'High')).length,
              subtext: 'Critical path active work',
              color: '#ef4444'
            }
          ]}
          footerNote="Real-time execution analytics"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            In Progress
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between">
          <span className={`text-2xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            {inProgressProjects.length}
          </span>
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <TrendingUp className="w-3 h-3" /> +8.4%
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          <span>{inProgressTasks.length} active tasks</span>
        </div>
      </div>

      {/* Card 3: Completed */}
      <div
        onMouseEnter={() => setHoveredStatCard('completed')}
        onMouseLeave={() => setHoveredStatCard(null)}
        className={`p-4 rounded-xl border transition-all group shadow-sm relative cursor-pointer ${
          theme === 'light'
            ? 'bg-slate-50 border-slate-200 hover:border-emerald-500'
            : 'bg-[#0D1520] border-[#233549] hover:border-emerald-500'
        }`}
      >
        <StatCardTooltip
          isVisible={hoveredStatCard === 'completed'}
          title="Completed Deliverables"
          subtitle="Delivered Projects & Tasks"
          icon={CheckCircle2}
          accentColor="#10b981"
          items={[
            {
              label: 'Delivered Tasks',
              value: completedTasks.length,
              subtext: `Out of ${tasks.length} total tasks`,
              progress: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
              color: '#10b981'
            }
          ]}
          footerNote="Deliverables overview"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Completed
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            {completedProjects.length}
          </span>
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-3 h-3" /> +24%
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>{completedTasks.length} tasks completed</span>
        </div>
      </div>

      {/* Card 4: Upcoming Deadlines */}
      <div
        onMouseEnter={() => setHoveredStatCard('upcoming_deadlines')}
        onMouseLeave={() => setHoveredStatCard(null)}
        className={`p-4 rounded-xl border transition-all group shadow-sm relative cursor-pointer ${
          theme === 'light'
            ? 'bg-slate-50 border-slate-200 hover:border-amber-500'
            : 'bg-[#0D1520] border-[#233549] hover:border-amber-500'
        }`}
      >
        <StatCardTooltip
          isVisible={hoveredStatCard === 'upcoming_deadlines'}
          title="Upcoming Deadlines & Schedule"
          subtitle="Milestones & Due Tasks"
          icon={Clock}
          accentColor="#f59e0b"
          items={[
            {
              label: 'Due in 7 Days',
              value: upcomingDeadlinesTasks.length,
              subtext: 'Pending deliverables',
              color: '#f59e0b'
            },
            {
              label: 'Overdue Items',
              value: overdueTasks.length,
              subtext: 'Requires escalation',
              color: '#ef4444'
            }
          ]}
          footerNote="Schedule radar"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Due in 7 Days
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-amber-400 tracking-tight">
            {upcomingDeadlinesTasks.length}
          </span>
          {overdueTasks.length > 0 ? (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-3 h-3" /> {overdueTasks.length} overdue
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> On Time
            </span>
          )}
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>{upcomingDeadlinesTasks.length} due soon • {overdueTasks.length} overdue</span>
        </div>
      </div>
    </div>
  );
};
