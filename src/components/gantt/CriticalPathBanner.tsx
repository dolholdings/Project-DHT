import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Zap,
  Info,
  Calendar,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  X,
  CheckCircle2,
  GitCommit,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateCriticalPathAnalysis, CPMProjectAnalysis } from '../../lib/criticalPath';
import { Task } from '../../types';

interface CriticalPathBannerProps {
  isCriticalPathHighlighted: boolean;
  onToggleCriticalHighlight: () => void;
  onSelectTask?: (taskId: string) => void;
}

export const CriticalPathBanner: React.FC<CriticalPathBannerProps> = ({
  isCriticalPathHighlighted,
  onToggleCriticalHighlight,
  onSelectTask
}) => {
  const { tasks, dependencies, selectedProjectId, theme } = useApp();
  const isLight = theme === 'light';

  const [showInspectorModal, setShowInspectorModal] = useState(false);

  // Filter tasks for current project
  const projectTasks = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === 'all') {
      return tasks;
    }
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const cpmAnalysis: CPMProjectAnalysis = useMemo(() => {
    return calculateCriticalPathAnalysis(projectTasks, dependencies);
  }, [projectTasks, dependencies]);

  if (projectTasks.length === 0) return null;

  const { criticalTaskIds, criticalPathOrdered, totalDurationDays, projectEndDate, bottlenecks } = cpmAnalysis;

  return (
    <>
      <div
        className={`p-4 rounded-2xl border transition-all ${
          criticalTaskIds.size > 0
            ? isLight
              ? 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-sm'
              : 'bg-gradient-to-r from-amber-950/40 via-[#16222F] to-[#121B26] border-amber-500/30 text-amber-200'
            : isLight
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-[#16222F] border-[#233549] text-slate-300'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                criticalTaskIds.size > 0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Zap className="w-5 h-5 fill-current" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs tracking-wide uppercase text-amber-400">
                  Critical Path Method (CPM)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {criticalTaskIds.size} Zero-Slack Tasks ({totalDurationDays} Days Total)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {criticalTaskIds.size > 0
                  ? `These ${criticalTaskIds.size} tasks directly dictate the overall completion date (${
                      projectEndDate ? projectEndDate.toLocaleDateString() : 'N/A'
                    }). Any delay here delays project delivery.`
                  : 'All tasks currently have positive schedule float.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowInspectorModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#16222F] hover:bg-[#1A2634] text-xs font-bold text-slate-200 border border-[#233549] transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <Info className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>Inspect Chain</span>
            </button>

            <button
              onClick={onToggleCriticalHighlight}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                isCriticalPathHighlighted
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isCriticalPathHighlighted ? 'Highlighted' : 'Highlight Path'}</span>
            </button>
          </div>
        </div>

        {/* Bottleneck Warning Strip if any bottleneck tasks exist */}
        {bottlenecks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center gap-2 text-xs text-amber-300 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Bottleneck Alert:</strong> &quot;{bottlenecks[0].task.title}&quot; has {bottlenecks[0].reason}.
            </span>
          </div>
        )}
      </div>

      {/* CRITICAL PATH INSPECTOR MODAL */}
      {showInspectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'
            }`}
          >
            {/* Header */}
            <div
              className={`p-5 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Critical Path Chain Analysis
                  </h2>
                  <p className="text-xs text-slate-400">
                    Mathematical sequence of prerequisite tasks with 0 schedule slack (Total: {totalDurationDays} days)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInspectorModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] text-center">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Critical Tasks</p>
                  <p className="text-lg font-black text-amber-400">{criticalTaskIds.size}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] text-center">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Total Duration</p>
                  <p className="text-lg font-black text-white">{totalDurationDays} Days</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] text-center">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Est. Completion</p>
                  <p className="text-xs font-bold text-[#3BC0BB] mt-1">
                    {projectEndDate ? projectEndDate.toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Step-by-Step Critical Path Sequence */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Critical Dependency Chain (Topological Sequence)
                </h3>

                {criticalPathOrdered.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 rounded-xl border border-dashed border-slate-700">
                    No critical path tasks identified. Add start dates, due dates, and dependency links.
                  </div>
                ) : (
                  <div className="space-y-2.5 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-amber-500/40">
                    {criticalPathOrdered.map((task, idx) => {
                      const res = cpmAnalysis.taskResults.get(task.id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            if (onSelectTask) {
                              onSelectTask(task.id);
                              setShowInspectorModal(false);
                            }
                          }}
                          className={`relative pl-10 p-3 rounded-xl border transition-all cursor-pointer ${
                            isLight
                              ? 'bg-slate-50 border-slate-200 hover:border-amber-400'
                              : 'bg-[#16222F] border-[#233549] hover:border-amber-500/60'
                          }`}
                        >
                          {/* Number Badge */}
                          <div className="absolute left-2.5 top-3.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md shadow-amber-500/20">
                            {idx + 1}
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white truncate">{task.title}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                  Float: 0d
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                                <span>Duration: {res?.durationDays || 1}d</span>
                                <span>
                                  {res?.earliestStart ? res.earliestStart.toLocaleDateString() : 'N/A'} →{' '}
                                  {res?.earliestFinish ? res.earliestFinish.toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 shrink-0">
                              {task.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Informational Guidance */}
              <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">💡 Critical Path Method Principle:</p>
                <p>
                  Tasks on the Critical Path have zero total float (slack). To accelerate total project completion,
                  reduce the duration or re-assign resources to these specific tasks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
