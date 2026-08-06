import React, { useState, useRef } from 'react';
import {
  GanttChart,
  Calendar,
  ZoomIn,
  ZoomOut,
  Filter,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Plus,
  Workflow,
  CheckCircle2,
  X,
  Link,
  ArrowRight,
  Lock,
  MousePointer,
  Printer,
  Diamond,
  Flame,
  Tag,
  ShieldAlert
} from 'lucide-react';
import * as d3 from 'd3';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';

interface DragState {
  isDragging: boolean;
  sourceTaskId: string | null;
  startPos: { x: number; y: number } | null;
  currentPos: { x: number; y: number } | null;
}

export const GanttView: React.FC = () => {
  const {
    tasks,
    projects,
    dependencies,
    users,
    activeCompany,
    addDependency,
    removeDependency,
    recalculateProjectTimeline,
    updateTask,
    theme
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'proj_1');
  const [zoomLevel, setZoomLevel] = useState<'weeks' | 'months'>('weeks');
  const [showAddDepModal, setShowAddDepModal] = useState(false);
  const [predTaskId, setPredTaskId] = useState('');
  const [succTaskId, setSuccTaskId] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Critical Path & Milestone Marker View Mode States
  const [highlightCriticalPath, setHighlightCriticalPath] = useState(true);
  const [showOnlyMilestones, setShowOnlyMilestones] = useState(false);

  // Interactive D3 Graph State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    sourceTaskId: null,
    startPos: null,
    currentPos: null
  });
  const [hoveredDropTaskId, setHoveredDropTaskId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectTasks = tasks.filter((t) => t.projectId === activeProject?.id);

  // Helper functions for Critical Path & Milestone visual marker system
  const isTaskCritical = (t: Task): boolean => {
    if (t.isCriticalPath) return true;
    if (t.tags?.some((tag) => tag.toLowerCase().includes('critical'))) return true;
    if (t.priority === 'Urgent') return true;
    return false;
  };

  const isTaskMilestone = (t: Task): boolean => {
    if (t.isMilestone) return true;
    if (t.tags?.some((tag) => tag.toLowerCase().includes('milestone'))) return true;
    if (isTaskCritical(t)) return true; // Critical Path tasks automatically qualify as Milestones per requirement
    return false;
  };

  const handleToggleCriticalPath = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextCritical = !isTaskCritical(task);
    const existingTags = task.tags || [];
    let newTags = existingTags.filter(
      (tag) => !['critical path', 'milestone'].includes(tag.toLowerCase())
    );
    if (nextCritical) {
      newTags.push('Critical Path', 'Milestone');
    }

    updateTask(task.id, {
      isCriticalPath: nextCritical,
      isMilestone: nextCritical ? true : task.isMilestone,
      tags: newTags
    });

    setToastMsg(
      nextCritical
        ? `"${task.title}" flagged as Critical Path Milestone! Timeline highlighted with diamond marker.`
        : `"${task.title}" removed from Critical Path.`
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  const criticalCount = projectTasks.filter(isTaskCritical).length;
  const milestoneCount = projectTasks.filter(isTaskMilestone).length;
  const displayedTasks = showOnlyMilestones ? projectTasks.filter(isTaskMilestone) : projectTasks;

  const selectedTask = projectTasks.find((t) => t.id === selectedTaskId);

  // Calculate dependency counts for selected task
  const incomingDeps = selectedTaskId
    ? dependencies
        .filter((d) => d.taskId === selectedTaskId)
        .map((d) => projectTasks.find((t) => t.id === d.dependsOnTaskId))
        .filter(Boolean)
    : [];

  const outgoingDeps = selectedTaskId
    ? dependencies
        .filter((d) => d.dependsOnTaskId === selectedTaskId)
        .map((d) => projectTasks.find((t) => t.id === d.taskId))
        .filter(Boolean)
    : [];

  const handleAddDependency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!predTaskId || !succTaskId || predTaskId === succTaskId) return;

    const success = addDependency(succTaskId, predTaskId);
    if (success) {
      const res = recalculateProjectTimeline(selectedProjectId);
      setShowAddDepModal(false);
      setPredTaskId('');
      setSuccTaskId('');
      setToastMsg(
        `Linked Finish-to-Start dependency! ${
          res.adjustedCount > 0 ? `Auto-adjusted ${res.adjustedCount} task schedules.` : 'Timelines are aligned.'
        }`
      );
      setTimeout(() => setToastMsg(null), 5000);
    } else {
      setToastMsg('Could not add dependency (circular or duplicate link).');
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleRecalculate = () => {
    const res = recalculateProjectTimeline(selectedProjectId);
    if (res.adjustedCount > 0) {
      setToastMsg(`Timeline Auto-Scheduled! Shifted ${res.adjustedCount} dependent tasks to respect Finish-to-Start rules.`);
    } else {
      setToastMsg('All task start and due dates are fully aligned with Finish-to-Start rules.');
    }
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleRemoveLink = (taskId: string, dependsOnTaskId: string) => {
    removeDependency(taskId, dependsOnTaskId);
    setToastMsg('Dependency link removed.');
    setTimeout(() => setToastMsg(null), 3000);
  };

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

  // Helper to map date to numeric left and width percentages
  const getTaskOffsetValues = (startDateStr: string, dueDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(dueDateStr);
    const baseDate = new Date('2026-07-01');

    const daysFromStart = Math.max(0, Math.floor((start.getTime() - baseDate.getTime()) / (1000 * 3600 * 24)));
    const durationDays = Math.max(5, Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

    if (zoomLevel === 'weeks') {
      const leftPercent = Math.min(85, (daysFromStart / 84) * 100);
      const widthPercent = Math.min(100 - leftPercent, (durationDays / 84) * 100);
      return { leftVal: Math.max(2, leftPercent), widthVal: Math.max(8, widthPercent) };
    } else {
      const leftPercent = Math.min(85, (daysFromStart / 180) * 100);
      const widthPercent = Math.min(100 - leftPercent, (durationDays / 180) * 100);
      return { leftVal: Math.max(2, leftPercent), widthVal: Math.max(10, widthPercent) };
    }
  };

  const getTaskOffset = (startDateStr: string, dueDateStr: string) => {
    const { leftVal, widthVal } = getTaskOffsetValues(startDateStr, dueDateStr);
    return { left: `${leftVal}%`, width: `${widthVal}%` };
  };

  // Handle Drag-and-Drop link creation mouse events
  const handleStartDragLink = (e: React.MouseEvent, sourceTask: any) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragState({
      isDragging: true,
      sourceTaskId: sourceTask.id,
      startPos: { x, y },
      currentPos: { x, y }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragState((prev) => ({
      ...prev,
      currentPos: { x, y }
    }));
  };

  const handleMouseUp = () => {
    if (!dragState.isDragging) return;

    if (dragState.sourceTaskId && hoveredDropTaskId && dragState.sourceTaskId !== hoveredDropTaskId) {
      // Create Finish-to-Start link (hoveredDropTaskId depends on sourceTaskId)
      const success = addDependency(hoveredDropTaskId, dragState.sourceTaskId);
      if (success) {
        const res = recalculateProjectTimeline(selectedProjectId);
        const sourceName = projectTasks.find((t) => t.id === dragState.sourceTaskId)?.title;
        const targetName = projectTasks.find((t) => t.id === hoveredDropTaskId)?.title;
        setToastMsg(
          `D3 Link Created: "${targetName}" now depends on "${sourceName}". ${
            res.adjustedCount > 0 ? `Auto-adjusted ${res.adjustedCount} timelines.` : ''
          }`
        );
        setTimeout(() => setToastMsg(null), 5000);
      } else {
        setToastMsg('Link already exists or creates a circular dependency.');
        setTimeout(() => setToastMsg(null), 3000);
      }
    }

    setDragState({
      isDragging: false,
      sourceTaskId: null,
      startPos: null,
      currentPos: null
    });
    setHoveredDropTaskId(null);
  };

  return (
    <div
      className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in select-none print-report-container gantt-print-wrapper ${
        theme === 'light' ? 'text-slate-800' : 'text-slate-100'
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Specific CSS Print Media Queries for A4 Landscape Executive Report */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 10mm;
          }
          body, html, #root, main {
            background: #ffffff !important;
            color: #0f172a !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          header, nav, footer, .no-print, button, select, .clickup-banner, .task-alert-toast {
            display: none !important;
          }
          .gantt-print-wrapper {
            background: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            padding: 12px !important;
            border-radius: 8px !important;
            width: 100% !important;
            max-width: none !important;
          }
          .gantt-print-banner {
            background-color: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          .gantt-print-row {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            background-color: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            color: #0f172a !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Executive Print Report Header */}
      <div className="hidden print:block mb-6 p-5 border-b-2 border-slate-900 bg-white text-slate-900 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold tracking-wider text-slate-600 uppercase">
              {activeCompany?.name || 'DOLPHIN INDUSTRIAL PROJECTS'} — EXECUTIVE REPORT
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Project Gantt Schedule & Dependency Matrix
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Project Code: <span className="font-bold text-slate-900">{activeProject?.code}</span> — <span className="font-bold text-slate-900">{activeProject?.title}</span> | Manager: <span className="font-semibold text-slate-800">{activeProject?.manager}</span>
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-600 space-y-1">
            <div><span className="font-semibold text-slate-700">Generated:</span> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div><span className="font-semibold text-slate-700">Format:</span> A4 Executive Landscape</div>
            <div className="px-2.5 py-1 rounded border border-slate-400 bg-slate-100 text-slate-800 font-bold inline-block mt-1 text-[10px] tracking-wider uppercase">
              OFFICIAL EXECUTIVE RECORD
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            <GanttChart className="w-6 h-6 text-[#0773BB]" />
            <span>Gantt Chart & D3 Dependency Scheduler</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Interactive D3.js dependency graph. Click tasks to inspect critical path dependencies or drag connector handles to link tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 no-print">
          {/* Critical Path Highlight Toggle Button */}
          <button
            type="button"
            onClick={() => setHighlightCriticalPath((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 border ${
              highlightCriticalPath
                ? 'bg-rose-500/25 border-rose-500/60 text-rose-200 shadow-rose-950/40 ring-1 ring-rose-500/30'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle glowing timeline highlights and diamond markers for Critical Path tasks"
          >
            <Diamond
              className={`w-3.5 h-3.5 ${
                highlightCriticalPath ? 'text-amber-300 fill-amber-300 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span>Critical Path ({criticalCount})</span>
          </button>

          {/* Filter Milestones Toggle Button */}
          <button
            type="button"
            onClick={() => setShowOnlyMilestones((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 border ${
              showOnlyMilestones
                ? 'bg-amber-500/25 border-amber-500/60 text-amber-200 shadow-amber-950/40 ring-1 ring-amber-500/30'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Filter timeline view to show only Milestone & Critical Path tasks"
          >
            <Flame className={`w-3.5 h-3.5 ${showOnlyMilestones ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Milestones Only ({milestoneCount})</span>
          </button>

          {/* Print Executive PDF Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700/80 border border-slate-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            title="Export formatted A4 Landscape Executive Report PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-300" />
            <span>Print Executive PDF (A4)</span>
          </button>

          {/* Recalculate Button */}
          <button
            type="button"
            onClick={handleRecalculate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all shadow-md active:scale-95"
            title="Auto-recalculate timeline based on Finish-to-Start predecessor dependencies"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Schedule (FS)</span>
          </button>

          {/* Add Dependency Button */}
          <button
            type="button"
            onClick={() => setShowAddDepModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Workflow className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Dependency Link</span>
          </button>

          {/* Project Selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedTaskId(null);
            }}
            className={`text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] border ${
              theme === 'light'
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-[#16222F] border-[#233549] text-slate-200'
            }`}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.title}
              </option>
            ))}
          </select>

          {/* Zoom Toggle */}
          <div className="flex items-center bg-[#0D1520] p-1 rounded-xl border border-[#233549] text-xs">
            <button
              onClick={() => setZoomLevel('weeks')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                zoomLevel === 'weeks' ? 'bg-[#0773BB] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setZoomLevel('months')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                zoomLevel === 'months' ? 'bg-[#0773BB] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert Banner */}
      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs font-medium flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-amber-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Task Inspector Banner */}
      {selectedTask ? (
        <div className="p-4 rounded-xl bg-[#0773BB]/15 border border-[#0773BB]/40 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0773BB] text-white flex items-center justify-center font-bold">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Selected Task:</span>
                <span className="text-xs font-extrabold text-[#3BC0BB]">{selectedTask.title}</span>
                <span className="px-2 py-0.5 rounded bg-black/40 font-mono text-[10px] text-slate-300">
                  {selectedTask.startDate} ➔ {selectedTask.dueDate}
                </span>
                {isTaskCritical(selectedTask) && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/30 border border-rose-500/60 text-rose-200 text-[10px] font-bold flex items-center gap-1">
                    <Diamond className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse" />
                    <span>CRITICAL PATH MILESTONE</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-300 mt-1">
                <span>
                  <strong className="text-[#3BC0BB]">{incomingDeps.length}</strong> Predecessor(s) (Must Finish Before)
                </span>
                <span>•</span>
                <span>
                  <strong className="text-amber-400">{outgoingDeps.length}</strong> Successor(s) (Blocked Until Finish)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Toggle Critical Path / Milestone Button */}
            <button
              type="button"
              onClick={(e) => handleToggleCriticalPath(selectedTask, e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow border ${
                isTaskCritical(selectedTask)
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 hover:bg-rose-500/30'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30'
              }`}
            >
              <Diamond className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>
                {isTaskCritical(selectedTask) ? 'Remove Critical Path' : 'Flag as Critical Path Milestone'}
              </span>
            </button>

            <button
              onClick={() => setSelectedTaskId(null)}
              className="px-3 py-1.5 rounded-lg bg-[#233549] hover:bg-[#2d445d] text-slate-300 hover:text-white text-xs font-semibold"
            >
              Clear Selection
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-[#3BC0BB]" />
            <span>
              <strong>D3 Interactive Graph:</strong> Click any task to highlight dependency connections, or drag from a task&apos;s output handle <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span> to link Finish-to-Start dependencies directly.
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3BC0BB]"></span> Predecessor
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Successor
            </span>
          </div>
        </div>
      )}

      {/* Add Dependency Link Modal */}
      {showAddDepModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121B26] border border-[#233549] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Workflow className="w-4 h-4" />
                <span>Link Finish-to-Start Dependency</span>
              </div>
              <button onClick={() => setShowAddDepModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDependency} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1">
                  1. Predecessor Task (Must Finish First) *
                </label>
                <select
                  required
                  value={predTaskId}
                  onChange={(e) => setPredTaskId(e.target.value)}
                  className="w-full bg-[#16222F] border border-[#233549] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#0773BB]"
                >
                  <option value="">Select Predecessor Task...</option>
                  {projectTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.startDate} ➔ {t.dueDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1">
                  2. Successor Task (Starts After Predecessor Finishes) *
                </label>
                <select
                  required
                  value={succTaskId}
                  onChange={(e) => setSuccTaskId(e.target.value)}
                  className="w-full bg-[#16222F] border border-[#233549] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#0773BB]"
                >
                  <option value="">Select Successor Task...</option>
                  {projectTasks
                    .filter((t) => t.id !== predTaskId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.startDate} ➔ {t.dueDate})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowAddDepModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!predTaskId || !succTaskId}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs transition-all shadow-md"
                >
                  Link & Auto-Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Gantt Canvas with D3 Interactive Overlay */}
      <div
        ref={containerRef}
        className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4 shadow-xl overflow-x-auto relative"
      >
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

        {/* Visual Milestone & Critical Path Legend Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs px-4 py-2.5 rounded-xl bg-[#0D1520] border border-[#233549] text-slate-300 min-w-[900px]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Gantt Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rotate-45 bg-gradient-to-tr from-amber-400 via-yellow-300 to-rose-500 border border-amber-200 shadow-sm shadow-amber-400/50 inline-block" />
              <span className="font-bold text-amber-300">Critical Path Milestone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] inline-block" />
              <span>Standard Task</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-amber-400 border-t border-dashed border-amber-400 inline-block" />
              <span>Predecessor Link</span>
            </div>
          </div>
          <div className="text-slate-400 font-mono text-[11px] flex items-center gap-3">
            <span>
              Critical Tasks: <strong className="text-rose-400 font-extrabold">{criticalCount}</strong> / {projectTasks.length}
            </span>
            <span>•</span>
            <span>
              Milestones: <strong className="text-amber-300 font-extrabold">{milestoneCount}</strong>
            </span>
          </div>
        </div>

        {/* Task Rows & D3 Graph Overlay Container */}
        <div className="space-y-3 min-w-[900px] relative">
          {/* D3 SVG Interactive Overlay Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <defs>
              <marker
                id="d3-arrow-amber"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#F59E0B" />
              </marker>
              <marker
                id="d3-arrow-cyan"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#3BC0BB" />
              </marker>
              <marker
                id="d3-arrow-rose"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#F43F5E" />
              </marker>
              <marker
                id="d3-arrow-dim"
                markerWidth="7"
                markerHeight="7"
                refX="5"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 7 3.5, 0 7" fill="#475569" />
              </marker>
            </defs>

            {/* Render Existing Dependency Links via D3 Paths */}
            {displayedTasks.map((targetTask, targetIndex) => {
              const prereqIds = [
                ...(targetTask.dependencies || []),
                ...dependencies.filter((d) => d.taskId === targetTask.id).map((d) => d.dependsOnTaskId)
              ];

              return prereqIds.map((prereqId) => {
                const sourceIndex = displayedTasks.findIndex((pt) => pt.id === prereqId);
                if (sourceIndex === -1) return null;

                const sourceTask = displayedTasks[sourceIndex];
                const sourceOffset = getTaskOffsetValues(sourceTask.startDate, sourceTask.dueDate);
                const targetOffset = getTaskOffsetValues(targetTask.startDate, targetTask.dueDate);

                // Row Y positions
                const sourceY = sourceIndex * 52 + 26;
                const targetY = targetIndex * 52 + 26;

                // X positions (Col-span 3 is 25%, Col-span 9 is 75%)
                const x1Percent = 25 + (sourceOffset.leftVal + sourceOffset.widthVal) * 0.75;
                const x2Percent = 25 + targetOffset.leftVal * 0.75;

                const isSelectedLink =
                  selectedTaskId && (selectedTaskId === targetTask.id || selectedTaskId === prereqId);
                const isIncomingToSelected = selectedTaskId === targetTask.id;
                const isOutgoingFromSelected = selectedTaskId === prereqId;
                const isCriticalLink = isTaskCritical(sourceTask) || isTaskCritical(targetTask);

                const strokeColor = isCriticalLink && highlightCriticalPath
                  ? '#F43F5E'
                  : !selectedTaskId
                  ? '#F59E0B'
                  : isIncomingToSelected
                  ? '#3BC0BB'
                  : isOutgoingFromSelected
                  ? '#F59E0B'
                  : '#334155';

                const strokeWidth = isSelectedLink ? 3.5 : isCriticalLink ? 2.5 : 2;
                const markerId = isCriticalLink && highlightCriticalPath
                  ? 'url(#d3-arrow-rose)'
                  : !selectedTaskId
                  ? 'url(#d3-arrow-amber)'
                  : isIncomingToSelected
                  ? 'url(#d3-arrow-cyan)'
                  : isOutgoingFromSelected
                  ? 'url(#d3-arrow-amber)'
                  : 'url(#d3-arrow-dim)';

                const midX = (x1Percent + x2Percent) / 2;
                const midY = (sourceY + targetY) / 2;

                return (
                  <g key={`d3_dep_${prereqId}_${targetTask.id}`}>
                    <path
                      d={`M ${x1Percent}% ${sourceY} C ${x1Percent + 3}% ${sourceY}, ${x2Percent - 3}% ${targetY}, ${x2Percent}% ${targetY}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={isCriticalLink || isSelectedLink ? '6 3' : '4 2'}
                      markerEnd={markerId}
                      className="transition-all duration-300"
                    />

                    {/* Clickable Unlink Badge on hover or selection */}
                    {(isSelectedLink || hoveredTaskId === targetTask.id || hoveredTaskId === prereqId) && (
                      <g
                        transform={`translate(${midX * 8.5}, ${midY})`}
                        className="pointer-events-auto cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLink(targetTask.id, prereqId);
                        }}
                      >
                        <circle
                          r="9"
                          fill="#16222F"
                          stroke={strokeColor}
                          strokeWidth="2"
                          className="hover:scale-125 transition-all"
                        />
                        <text
                          textAnchor="middle"
                          dy="3"
                          fill="#EF4444"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          ✕
                        </text>
                      </g>
                    )}
                  </g>
                );
              });
            })}

            {/* Active Rubberband Drag Line */}
            {dragState.isDragging && dragState.startPos && dragState.currentPos && (
              <path
                d={`M ${dragState.startPos.x} ${dragState.startPos.y} C ${dragState.startPos.x + 50} ${dragState.startPos.y}, ${dragState.currentPos.x - 50} ${dragState.currentPos.y}, ${dragState.currentPos.x} ${dragState.currentPos.y}`}
                fill="none"
                stroke="#3BC0BB"
                strokeWidth="3.5"
                strokeDasharray="6 3"
                markerEnd="url(#d3-arrow-cyan)"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Task Rows */}
          {displayedTasks.map((t) => {
            const isCritical = isTaskCritical(t);
            const isMilestone = isTaskMilestone(t);
            const isHighlighted = highlightCriticalPath && isCritical;

            const hasDep =
              (t.dependencies && t.dependencies.length > 0) ||
              dependencies.some((d) => d.taskId === t.id);
            const offset = getTaskOffset(t.startDate, t.dueDate);
            const assignee = users.find((u) => t.assigneeIds.includes(u.id));

            const isSelected = selectedTaskId === t.id;
            const isHoveredTarget = hoveredDropTaskId === t.id;

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTaskId(isSelected ? null : t.id)}
                onMouseEnter={() => {
                  setHoveredTaskId(t.id);
                  if (dragState.isDragging && dragState.sourceTaskId !== t.id) {
                    setHoveredDropTaskId(t.id);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredTaskId(null);
                  if (dragState.isDragging) {
                    setHoveredDropTaskId(null);
                  }
                }}
                className={`grid grid-cols-12 items-center p-2 rounded-xl transition-all cursor-pointer relative z-0 gantt-print-row group ${
                  isSelected
                    ? 'bg-[#0773BB]/20 border-2 border-[#3BC0BB] shadow-lg shadow-[#0773BB]/20'
                    : isHoveredTarget
                    ? 'bg-emerald-950/40 border-2 border-emerald-400'
                    : isHighlighted
                    ? 'bg-rose-950/20 border-2 border-rose-500/60 shadow-lg shadow-rose-950/50'
                    : 'bg-[#0D1520] border border-[#233549] hover:border-[#0773BB]'
                }`}
              >
                {/* Left Task Title Column */}
                <div className="col-span-3 pl-2 pr-4">
                  <div className="flex items-center gap-2">
                    {hasDep && (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500 shadow-sm shadow-amber-400/50 shrink-0"
                        title="Has Prerequisite Dependency"
                      />
                    )}

                    {/* Milestone Diamond Badge */}
                    {(isCritical || isMilestone) && (
                      <span
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/25 border border-rose-500/60 text-rose-200 text-[10px] font-extrabold tracking-wider shrink-0 shadow-sm shadow-rose-950/50"
                        title="Critical Path Milestone Task"
                      >
                        <Diamond className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse" />
                        <span className="text-[9px]">MILESTONE</span>
                      </span>
                    )}

                    <span
                      className={`text-xs font-bold truncate gantt-row-title-print ${
                        isSelected ? 'text-[#3BC0BB]' : isHighlighted ? 'text-rose-200' : 'text-white'
                      }`}
                    >
                      {t.title}
                    </span>

                    {/* Quick Toggle Button on Hover */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleCriticalPath(t, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-[10px] p-1 text-slate-400 hover:text-amber-300 shrink-0"
                      title={isCritical ? 'Remove Critical Path' : 'Flag as Critical Path Milestone'}
                    >
                      <Diamond className={`w-3.5 h-3.5 ${isCritical ? 'text-amber-300 fill-amber-300' : 'text-slate-500'}`} />
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{assignee?.name || 'Team'}</span>
                    <span>•</span>
                    <span className="font-mono">{t.estimatedHours}h est</span>
                  </div>
                </div>

                {/* Right Timeline Bar Stage with D3 Drag Connection Handles */}
                <div className="col-span-9 relative h-10 bg-[#16222F]/60 rounded-lg flex items-center px-1 border border-[#233549]/50 gantt-bar-bg-print">
                  {/* Task Bar */}
                  <div
                    className={`absolute h-7 rounded-lg shadow-lg flex items-center justify-between px-2 text-[10px] font-bold text-white transition-all ${
                      isHighlighted
                        ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 border-2 border-amber-300 shadow-xl shadow-rose-600/50 ring-2 ring-rose-500/40'
                        : isMilestone
                        ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-2 border-amber-300 shadow-md shadow-amber-500/40'
                        : t.status === 'Done'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        : t.priority === 'Urgent'
                        ? 'bg-gradient-to-r from-rose-600 to-amber-500'
                        : 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB]'
                    }`}
                    style={{ left: offset.left, width: offset.width }}
                    title={`${t.title} (${t.startDate} to ${t.dueDate}) ${isCritical ? '— CRITICAL PATH MILESTONE' : ''}`}
                  >
                    <div className="flex items-center gap-1 truncate max-w-[140px]">
                      {(isCritical || isMilestone) && (
                        <Diamond className="w-3.5 h-3.5 text-amber-200 fill-amber-300 shrink-0 filter drop-shadow animate-pulse" />
                      )}
                      <span className="truncate">{t.title}</span>
                    </div>

                    <span className="font-mono text-[9px] bg-black/30 px-1 rounded shrink-0">
                      {t.status}
                    </span>

                    {/* Milestone Diamond Marker Pin on Right Edge */}
                    {(isCritical || isMilestone) && (
                      <div
                        onClick={(e) => handleToggleCriticalPath(t, e)}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 w-5.5 h-5.5 rotate-45 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-2 border-rose-950 shadow-xl shadow-amber-400/90 flex items-center justify-center z-20 hover:scale-125 transition-transform group/ms cursor-pointer"
                        title={`Critical Milestone Marker: ${t.title} (Due: ${t.dueDate})`}
                      >
                        <div className="w-1.5 h-1.5 bg-rose-950 rounded-full" />
                      </div>
                    )}

                    {/* Connector Output Port Circle (Right Side of Bar) */}
                    <div
                      onMouseDown={(e) => handleStartDragLink(e, t)}
                      title="Click & Drag to link dependency to another task"
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400 border-2 border-black cursor-crosshair hover:scale-125 transition-transform flex items-center justify-center shadow-md z-30 pointer-events-auto no-print"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                    </div>

                    {/* Connector Input Port Circle (Left Side of Bar) */}
                    <div
                      className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-black transition-transform flex items-center justify-center shadow-md z-30 no-print ${
                        isHoveredTarget
                          ? 'bg-emerald-400 scale-125 ring-4 ring-emerald-500/30'
                          : 'bg-[#3BC0BB]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                    </div>
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
