import React, { useState, useMemo } from 'react';
import {
  X,
  Workflow,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Plus,
  Trash2,
  Calendar,
  Zap,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';

interface TaskDependencyModalProps {
  task: Task;
  onClose: () => void;
  onOpenTaskDetails?: (taskId: string) => void;
}

export const TaskDependencyModal: React.FC<TaskDependencyModalProps> = ({
  task,
  onClose,
  onOpenTaskDetails,
}) => {
  const {
    tasks,
    dependencies,
    addDependency,
    removeDependency,
    recalculateProjectTimeline,
    theme,
    users,
  } = useApp();

  const isLight = theme === 'light';
  const [selectedBlockerId, setSelectedBlockerId] = useState<string>('');
  const [selectedBlockedId, setSelectedBlockedId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // All tasks in the same project
  const projectTasks = useMemo(() => {
    return tasks.filter((t) => t.projectId === task.projectId);
  }, [tasks, task.projectId]);

  // Current task's blockers (Tasks that this task depends on / is blocked by)
  const currentBlockerIds = useMemo(() => {
    const fromDependencies = dependencies
      .filter((d) => d.taskId === task.id)
      .map((d) => d.dependsOnTaskId);
    const fromTaskProps = task.dependencies || task.predecessors || [];
    return Array.from(new Set([...fromDependencies, ...fromTaskProps]));
  }, [dependencies, task]);

  const currentBlockers = useMemo(() => {
    return currentBlockerIds
      .map((id) => projectTasks.find((t) => t.id === id))
      .filter((t): t is Task => Boolean(t));
  }, [currentBlockerIds, projectTasks]);

  // Current task's dependents (Tasks that are blocked by this task)
  const currentBlockedIds = useMemo(() => {
    const fromDependencies = dependencies
      .filter((d) => d.dependsOnTaskId === task.id)
      .map((d) => d.taskId);
    const fromTaskProps = task.successors || [];
    return Array.from(new Set([...fromDependencies, ...fromTaskProps]));
  }, [dependencies, task]);

  const currentBlockedTasks = useMemo(() => {
    return currentBlockedIds
      .map((id) => projectTasks.find((t) => t.id === id))
      .filter((t): t is Task => Boolean(t));
  }, [currentBlockedIds, projectTasks]);

  // Available tasks to add as blocker (Exclude self, already added blockers, and tasks blocked by this task to avoid direct cycles)
  const availableBlockerCandidates = useMemo(() => {
    return projectTasks.filter(
      (t) =>
        t.id !== task.id &&
        !currentBlockerIds.includes(t.id) &&
        !currentBlockedIds.includes(t.id)
    );
  }, [projectTasks, task.id, currentBlockerIds, currentBlockedIds]);

  // Available tasks to add as dependent (Exclude self, already added dependents, and current blockers)
  const availableBlockedCandidates = useMemo(() => {
    return projectTasks.filter(
      (t) =>
        t.id !== task.id &&
        !currentBlockedIds.includes(t.id) &&
        !currentBlockerIds.includes(t.id)
    );
  }, [projectTasks, task.id, currentBlockedIds, currentBlockerIds]);

  const hasActiveBlockers = useMemo(() => {
    return currentBlockers.some((b) => b.status !== 'Done');
  }, [currentBlockers]);

  // Handle adding a Blocker (Predecessor: chosenTask -> current task)
  const handleAddBlocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockerId) return;

    // The current task depends on selectedBlockerId
    const success = addDependency(task.id, selectedBlockerId);
    if (success) {
      const res = recalculateProjectTimeline(task.projectId);
      setStatusMessage({
        text: `Successfully added blocker! Finish-to-Start dependency linked. ${
          res.adjustedCount > 0 ? `Adjusted ${res.adjustedCount} project task dates.` : ''
        }`,
        type: 'success',
      });
      setSelectedBlockerId('');
    } else {
      setStatusMessage({
        text: 'Failed to add dependency: direct or circular dependency detected.',
        type: 'error',
      });
    }
  };

  // Handle adding a Dependent (Successor: current task -> chosenTask)
  const handleAddBlockedTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockedId) return;

    // The selectedBlockedId depends on current task
    const success = addDependency(selectedBlockedId, task.id);
    if (success) {
      const res = recalculateProjectTimeline(task.projectId);
      setStatusMessage({
        text: `Successfully added dependent task! ${
          res.adjustedCount > 0 ? `Adjusted ${res.adjustedCount} project task dates.` : ''
        }`,
        type: 'success',
      });
      setSelectedBlockedId('');
    } else {
      setStatusMessage({
        text: 'Failed to add dependency: direct or circular dependency detected.',
        type: 'error',
      });
    }
  };

  // Remove a blocker link
  const handleRemoveBlocker = (blockerId: string) => {
    const dep = dependencies.find(
      (d) => d.taskId === task.id && d.dependsOnTaskId === blockerId
    );
    if (dep) {
      removeDependency(dep.id);
    } else {
      // Fallback removal
      const fallbackDep = dependencies.find(
        (d) => (d.taskId === task.id && d.dependsOnTaskId === blockerId) ||
               (d.taskId === blockerId && d.dependsOnTaskId === task.id)
      );
      if (fallbackDep) removeDependency(fallbackDep.id);
    }

    recalculateProjectTimeline(task.projectId);
    setStatusMessage({
      text: 'Dependency blocker link removed.',
      type: 'success',
    });
  };

  // Remove a dependent link
  const handleRemoveBlockedTask = (dependentId: string) => {
    const dep = dependencies.find(
      (d) => d.taskId === dependentId && d.dependsOnTaskId === task.id
    );
    if (dep) {
      removeDependency(dep.id);
    }
    recalculateProjectTimeline(task.projectId);
    setStatusMessage({
      text: 'Successor dependency link removed.',
      type: 'success',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121B26] border-[#233549] text-white'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-[#3BC0BB] text-black font-extrabold flex items-center justify-center shadow-lg">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Task Dependency & Blocker Manager</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30">
                  Finish-to-Start (FS)
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Define blocker/blocked-by relationships to maintain scheduling integrity and render connecting Gantt lines.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isLight
                ? 'hover:bg-slate-200 border-slate-300 text-slate-600'
                : 'hover:bg-[#16222F] border-[#233549] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Task Summary Banner */}
        <div
          className={`p-4 mx-5 mt-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            hasActiveBlockers
              ? 'bg-rose-500/10 border-rose-500/30'
              : isLight
              ? 'bg-slate-100/70 border-slate-200'
              : 'bg-[#16222F]/60 border-[#233549]'
          }`}
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Target Task:
              </span>
              <span className="font-bold text-sm truncate">{task.title}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#3BC0BB]" />
                <span>{task.startDate} ➔ {task.dueDate}</span>
              </span>
              <span>•</span>
              <span className="capitalize">{task.status}</span>
              <span>•</span>
              <span className="capitalize">{task.priority} Priority</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {hasActiveBlockers ? (
              <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Task is Blocked ({currentBlockers.filter((b) => b.status !== 'Done').length} unresolved)</span>
              </span>
            ) : currentBlockers.length > 0 ? (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Blockers Resolved</span>
              </span>
            ) : (
              <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#0D1520] text-slate-300'}`}>
                No Blockers Assigned
              </span>
            )}
          </div>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`mx-5 mt-3 p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main 2-Column Section for Blockers and Blocked Tasks */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION 1: Blocked By (Prerequisites) */}
          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-[#16222F]/40 border-amber-500/30'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-amber-400">Blocked By (Predecessors)</h3>
                    <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Tasks that must FINISH before this task can start
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300">
                  {currentBlockers.length}
                </span>
              </div>

              {/* List of Blockers */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentBlockers.map((blocker) => {
                  const isDone = blocker.status === 'Done';
                  const assignee = users.find((u) => blocker.assigneeIds?.includes(u.id));

                  return (
                    <div
                      key={blocker.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                        isLight
                          ? 'bg-white border-slate-200 shadow-xs'
                          : 'bg-[#0D1520] border-[#233549] hover:border-amber-500/50'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isDone ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
                            }`}
                          />
                          <span className="font-bold truncate">{blocker.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>Due: {blocker.dueDate}</span>
                          <span>•</span>
                          <span className={isDone ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {blocker.status}
                          </span>
                          {assignee && (
                            <>
                              <span>•</span>
                              <span className="truncate">{assignee.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onOpenTaskDetails && (
                          <button
                            type="button"
                            onClick={() => onOpenTaskDetails(blocker.id)}
                            className="p-1 text-slate-400 hover:text-[#3BC0BB] transition-colors"
                            title="View Blocker Details"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveBlocker(blocker.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove Blocker Dependency"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {currentBlockers.length === 0 && (
                  <div
                    className={`p-4 rounded-xl border border-dashed text-center text-xs italic ${
                      isLight ? 'border-slate-300 text-slate-500 bg-white/50' : 'border-slate-700 text-slate-500 bg-[#0D1520]/40'
                    }`}
                  >
                    No prerequisite blockers defined. This task can begin at any scheduled start time.
                  </div>
                )}
              </div>
            </div>

            {/* Add Blocker Form */}
            <form onSubmit={handleAddBlocker} className="pt-3 border-t border-[#233549]/60 space-y-2">
              <label className="block text-xs font-bold text-amber-300">
                + Add New Blocker Task
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedBlockerId}
                  onChange={(e) => setSelectedBlockerId(e.target.value)}
                  className={`flex-1 text-xs rounded-xl px-3 py-2 border focus:outline-none focus:border-amber-400 transition-all ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-[#0D1520] border-[#233549] text-slate-100'
                  }`}
                >
                  <option value="">Select prerequisite task...</option>
                  {availableBlockerCandidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.title} (Due: {cand.dueDate} | {cand.status})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedBlockerId}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs transition-all shadow-md shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: Blocks (Dependents / Successors) */}
          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isLight ? 'bg-teal-50/50 border-teal-200' : 'bg-[#16222F]/40 border-[#3BC0BB]/30'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#3BC0BB]/20 text-[#3BC0BB] flex items-center justify-center">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#3BC0BB]">Blocks (Dependents)</h3>
                    <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Tasks WAITING for this task to complete before they can begin
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#3BC0BB]/20 text-[#3BC0BB]">
                  {currentBlockedTasks.length}
                </span>
              </div>

              {/* List of Blocked Tasks */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentBlockedTasks.map((blocked) => {
                  const assignee = users.find((u) => blocked.assigneeIds?.includes(u.id));

                  return (
                    <div
                      key={blocked.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                        isLight
                          ? 'bg-white border-slate-200 shadow-xs'
                          : 'bg-[#0D1520] border-[#233549] hover:border-[#3BC0BB]/50'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#3BC0BB] shrink-0" />
                          <span className="font-bold truncate">{blocked.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>Starts: {blocked.startDate}</span>
                          <span>•</span>
                          <span>{blocked.status}</span>
                          {assignee && (
                            <>
                              <span>•</span>
                              <span className="truncate">{assignee.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onOpenTaskDetails && (
                          <button
                            type="button"
                            onClick={() => onOpenTaskDetails(blocked.id)}
                            className="p-1 text-slate-400 hover:text-[#3BC0BB] transition-colors"
                            title="View Dependent Details"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedTask(blocked.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove Dependent Dependency"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {currentBlockedTasks.length === 0 && (
                  <div
                    className={`p-4 rounded-xl border border-dashed text-center text-xs italic ${
                      isLight ? 'border-slate-300 text-slate-500 bg-white/50' : 'border-slate-700 text-slate-500 bg-[#0D1520]/40'
                    }`}
                  >
                    No dependent tasks waiting on this deliverable.
                  </div>
                )}
              </div>
            </div>

            {/* Add Blocked Task Form */}
            <form onSubmit={handleAddBlockedTask} className="pt-3 border-t border-[#233549]/60 space-y-2">
              <label className="block text-xs font-bold text-[#3BC0BB]">
                + Add Task Blocked by This
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedBlockedId}
                  onChange={(e) => setSelectedBlockedId(e.target.value)}
                  className={`flex-1 text-xs rounded-xl px-3 py-2 border focus:outline-none focus:border-[#3BC0BB] transition-all ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-[#0D1520] border-[#233549] text-slate-100'
                  }`}
                >
                  <option value="">Select successor task...</option>
                  {availableBlockedCandidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.title} (Starts: {cand.startDate} | {cand.status})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedBlockedId}
                  className="px-3.5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#3BC0BB] hover:text-black text-white font-extrabold text-xs transition-all shadow-md shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Finish-to-Start links automatically shift child task start dates when parent dates change.</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                const res = recalculateProjectTimeline(task.projectId);
                setStatusMessage({
                  text: `Recalculated timeline! Adjusted ${res.adjustedCount} task schedules.`,
                  type: 'success',
                });
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-[#16222F] hover:bg-[#233549] border-[#233549] text-slate-300'
              }`}
            >
              Recalculate Schedule
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-black font-extrabold text-xs transition-all shadow-md hover:opacity-95"
            >
              Done & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
