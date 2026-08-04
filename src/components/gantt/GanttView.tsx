import React, { useState } from 'react';
import { GanttChart, Calendar, ZoomIn, ZoomOut, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GanttView: React.FC = () => {
  const { tasks, projects, dependencies, users, activeCompany } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'proj_1');
  const [zoomLevel, setZoomLevel] = useState<'weeks' | 'months'>('weeks');

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectTasks = tasks.filter((t) => t.projectId === activeProject?.id);

  // Timeline dates range calculation
  const months = ['Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'];
  const weeks = [
    'W27 (Jul 01)',
    'W28 (Jul 08)',
    'W29 (Jul 15)',
    'W30 (Jul 22)',
    'W31 (Jul 29)',
    'W32 (Aug 05)',
    'W33 (Aug 12)',
    'W34 (Aug 19)',
    'W35 (Aug 26)',
    'W36 (Sep 02)',
    'W37 (Sep 09)',
    'W38 (Sep 16)'
  ];

  const columns = zoomLevel === 'weeks' ? weeks : months;

  // Helper to map date to bar offset
  const getTaskOffset = (startDateStr: string, dueDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(dueDateStr);
    const baseDate = new Date('2026-07-01');

    const daysFromStart = Math.max(0, Math.floor((start.getTime() - baseDate.getTime()) / (1000 * 3600 * 24)));
    const durationDays = Math.max(5, Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

    if (zoomLevel === 'weeks') {
      const leftPercent = Math.min(85, (daysFromStart / 84) * 100);
      const widthPercent = Math.min(100 - leftPercent, (durationDays / 84) * 100);
      return { left: `${Math.max(2, leftPercent)}%`, width: `${Math.max(8, widthPercent)}%` };
    } else {
      const leftPercent = Math.min(85, (daysFromStart / 180) * 100);
      const widthPercent = Math.min(100 - leftPercent, (durationDays / 180) * 100);
      return { left: `${Math.max(2, leftPercent)}%`, width: `${Math.max(10, widthPercent)}%` };
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <GanttChart className="w-6 h-6 text-[#0773BB]" />
            <span>Gantt Chart & Dependency Scheduler</span>
          </h1>
          <p className="text-xs text-slate-400">
            Visual timeline chart for critical path tracking and prerequisite task dependencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[#16222F] border border-[#233549] text-xs font-medium text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.title}
              </option>
            ))}
          </select>

          {/* Zoom Toggle */}
          <div className="flex items-center rounded-xl bg-[#16222F] border border-[#233549] p-1 text-xs">
            <button
              onClick={() => setZoomLevel('weeks')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                zoomLevel === 'weeks'
                  ? 'bg-[#0773BB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setZoomLevel('months')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                zoomLevel === 'months'
                  ? 'bg-[#0773BB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4 shadow-xl overflow-x-auto">
        {/* Project Header Banner */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#0D1520] border border-[#233549]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#0773BB]/20 text-[#3BC0BB]">
              {activeProject?.code}
            </span>
            <h2 className="text-base font-bold text-white">{activeProject?.title}</h2>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {activeProject?.startDate} ➔ {activeProject?.dueDate}
          </div>
        </div>

        {/* Timeline Header Row */}
        <div className="grid grid-cols-12 min-w-[900px] border-b border-[#233549] pb-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-3 text-left pl-3">Task Deliverable</div>
          <div className="col-span-9 grid grid-cols-6 gap-1 font-mono text-[11px] text-[#3BC0BB]">
            {columns.slice(0, 6).map((c) => (
              <div key={c} className="border-l border-[#233549] pl-1">
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Task Gantt Rows */}
        <div className="space-y-3 min-w-[900px]">
          {projectTasks.map((t) => {
            const hasDep = dependencies.some((d) => d.taskId === t.id);
            const offset = getTaskOffset(t.startDate, t.dueDate);
            const assignee = users.find((u) => t.assigneeIds.includes(u.id));

            return (
              <div
                key={t.id}
                className="grid grid-cols-12 items-center p-2 rounded-xl bg-[#0D1520] border border-[#233549] hover:border-[#0773BB] transition-all group"
              >
                {/* Left Task Title */}
                <div className="col-span-3 pl-2 pr-4">
                  <div className="flex items-center gap-2">
                    {hasDep && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Has Prerequisite Dependency"></span>
                    )}
                    <span className="text-xs font-bold text-white truncate group-hover:text-[#3BC0BB]">
                      {t.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{assignee?.name || 'Team'}</span>
                    <span>•</span>
                    <span className="font-mono">{t.estimatedHours}h est</span>
                  </div>
                </div>

                {/* Right Timeline Bar Stage */}
                <div className="col-span-9 relative h-10 bg-[#16222F]/60 rounded-lg overflow-hidden flex items-center px-1 border border-[#233549]/50">
                  {/* Task Timeline Bar */}
                  <div
                    className={`absolute h-7 rounded-lg shadow-lg flex items-center justify-between px-2 text-[10px] font-bold text-white transition-all cursor-pointer ${
                      t.status === 'Done'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        : t.priority === 'Urgent'
                        ? 'bg-gradient-to-r from-rose-600 to-amber-500'
                        : 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB]'
                    }`}
                    style={{ left: offset.left, width: offset.width }}
                    title={`${t.title} (${t.startDate} to ${t.dueDate})`}
                  >
                    <span className="truncate max-w-[120px]">{t.title}</span>
                    <span className="font-mono text-[9px] bg-black/30 px-1 rounded">
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
