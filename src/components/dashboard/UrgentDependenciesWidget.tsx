import React from 'react';
import { Flame, ArrowRight } from 'lucide-react';
import { Task, TaskDependency } from '../../types';
import { calculatePriorityScore } from '../../lib/priorityScore';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { TaskQuickPreviewPopover } from '../tasks/TaskQuickPreviewPopover';

export interface UrgentDependenciesWidgetProps {
  theme?: 'dark' | 'light';
  tasks: Task[];
  dependencies: TaskDependency[];
  onNavigateToTasks?: () => void;
}

export const UrgentDependenciesWidget: React.FC<UrgentDependenciesWidgetProps> = ({
  theme = 'dark',
  tasks,
  dependencies,
  onNavigateToTasks
}) => {
  const urgentAndBlockers = tasks.filter((t) => {
    if (t.status === 'Done') return false;
    const isUrgent = t.priority === 'Urgent';
    const isOverdue = t.dueDate ? new Date(t.dueDate) < new Date() : false;
    const hasDownstream = dependencies.some((d) => d.dependsOnTaskId === t.id);
    return isUrgent || (isOverdue && hasDownstream);
  });

  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/20 pb-3">
        <span className="text-xs text-slate-400 font-medium">
          {urgentAndBlockers.length} critical path blocker{urgentAndBlockers.length === 1 ? '' : 's'}
        </span>
        {onNavigateToTasks && (
          <button
            type="button"
            onClick={onNavigateToTasks}
            className="text-xs font-semibold text-[#3BC0BB] hover:underline flex items-center gap-1"
          >
            <span>Manage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {urgentAndBlockers.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#0D1520]/50 border border-dashed border-[#233549] text-center text-xs text-slate-400">
          No urgent blockers currently detected.
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {urgentAndBlockers.slice(0, 6).map((t) => {
            const pScore = calculatePriorityScore(t, dependencies, tasks);
            return (
              <div
                key={t.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <div className="min-w-0">
                    <TaskQuickPreviewPopover task={t} onOpenFullTask={onNavigateToTasks}>
                      <div className={`text-xs font-bold cursor-pointer hover:underline truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {getDisplayTaskTitle(t)}
                      </div>
                    </TaskQuickPreviewPopover>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span>Due: {t.dueDate || 'No Date'}</span>
                      <span>•</span>
                      <span>Est: {t.estimatedHours || 0} hrs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${pScore.bgColor} ${pScore.color} ${pScore.borderColor}`}>
                    {pScore.score} {pScore.tier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
