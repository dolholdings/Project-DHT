import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Check,
  Clock,
  ArrowRight,
  Filter,
  Flame,
  AlertTriangle,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { calculatePriorityScore } from '../../lib/priorityScore';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { getStatusBadgeStyle } from '../../lib/statusUtils';
import { TaskQuickPreviewPopover } from '../tasks/TaskQuickPreviewPopover';

export interface MyTasksWidgetProps {
  theme?: 'dark' | 'light';
  onNavigateToTasks?: () => void;
}

export const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({
  theme = 'dark',
  onNavigateToTasks
}) => {
  const {
    tasks,
    currentUser,
    updateTask,
    dependencies,
    setActiveTab,
    projects,
    activeCompany
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'urgent' | 'due_soon' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'due_date' | 'title'>('priority');

  // Filter tasks assigned to current user in active company
  const userTasks = useMemo(() => {
    if (!currentUser?.id) return [];
    return tasks.filter((t) => {
      const isAssigned = t.assigneeIds && t.assigneeIds.includes(currentUser.id);
      const isCompanyMatch = !activeCompany?.id || t.companyId === activeCompany.id;
      return isAssigned && isCompanyMatch;
    });
  }, [tasks, currentUser?.id, activeCompany?.id]);

  // Filtered & Sorted items
  const displayTasks = useMemo(() => {
    let list = [...userTasks];
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (activeFilter === 'in_progress') {
      list = list.filter((t) => t.status === 'In Progress');
    } else if (activeFilter === 'urgent') {
      list = list.filter((t) => t.priority === 'Urgent' || t.priority === 'High');
    } else if (activeFilter === 'due_soon') {
      list = list.filter((t) => {
        if (t.status === 'Done') return false;
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d <= next7Days;
      });
    } else if (activeFilter === 'done') {
      list = list.filter((t) => t.status === 'Done');
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'priority') {
        const scoreA = calculatePriorityScore(a, dependencies, tasks).score;
        const scoreB = calculatePriorityScore(b, dependencies, tasks).score;
        return scoreB - scoreA;
      }
      if (sortBy === 'due_date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    return list;
  }, [userTasks, activeFilter, sortBy, dependencies, tasks]);

  const stats = useMemo(() => {
    const total = userTasks.length;
    const completed = userTasks.filter((t) => t.status === 'Done').length;
    const pending = total - completed;
    const urgent = userTasks.filter((t) => (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Done').length;
    return { total, completed, pending, urgent };
  }, [userTasks]);

  const handleToggleTask = (task: Task) => {
    const isDone = task.status === 'Done';
    updateTask(task.id, {
      status: isDone ? 'In Progress' : 'Done'
    });
  };

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.code || p.title));
    return map;
  }, [projects]);

  return (
    <div className="p-5 sm:p-6 flex flex-col h-full space-y-4">
      {/* Subheader & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/20">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D1520] border border-[#233549] text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#0773BB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('in_progress')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'in_progress'
                  ? 'bg-[#0773BB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('urgent')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'urgent'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-rose-400 hover:text-white'
              }`}
            >
              Urgent ({stats.urgent})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('due_soon')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'due_soon'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-400 hover:text-white'
              }`}
            >
              Due Soon
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('done')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'done'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              Done ({stats.completed})
            </button>
          </div>
        </div>

        {/* Sort & Full Board Link */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`text-xs px-2.5 py-1 rounded-lg border focus:outline-none focus:border-[#0773BB] ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-700'
                : 'bg-[#0D1520] border-[#233549] text-slate-300'
            }`}
          >
            <option value="priority">Sort by Priority Score</option>
            <option value="due_date">Sort by Due Date</option>
            <option value="title">Sort Alphabetically</option>
          </select>

          <button
            type="button"
            onClick={onNavigateToTasks || (() => setActiveTab('tasks'))}
            className="text-xs font-semibold text-[#3BC0BB] hover:underline flex items-center gap-1 shrink-0 ml-1"
          >
            <span>Full Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Items List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-1">
        {displayTasks.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#0D1520]/40 border border-dashed border-[#233549] text-center space-y-2">
            <UserCheck className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">
              No tasks found for the selected filter.
            </p>
            <p className="text-[11px] text-slate-500">
              Assigned tasks will appear in your real-time queue.
            </p>
          </div>
        ) : (
          displayTasks.map((t) => {
            const pScore = calculatePriorityScore(t, dependencies, tasks);
            const isDone = t.status === 'Done';
            const projCode = projectMap.get(t.projectId) || 'PROJECT';
            const isOverdue = !isDone && t.dueDate && new Date(t.dueDate) < new Date();

            return (
              <div
                key={t.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all group ${
                  theme === 'light'
                    ? isDone
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-[#0773BB] shadow-xs'
                    : isDone
                    ? 'bg-[#0D1520]/40 border-[#233549] opacity-60'
                    : 'bg-[#0D1520] border-[#233549] hover:border-[#3BC0BB]/60 hover:bg-[#121C28]'
                }`}
              >
                {/* Checkbox & Task info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(t)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-500 hover:border-[#3BC0BB] hover:bg-[#3BC0BB]/10'
                    }`}
                    title={isDone ? 'Mark as In Progress' : 'Mark as Done'}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                        @{projCode}
                      </span>
                      <TaskQuickPreviewPopover task={t} onOpenFullTask={() => setActiveTab('tasks')}>
                        <h4
                          className={`text-xs font-bold truncate cursor-pointer hover:underline ${
                            isDone
                              ? 'line-through text-slate-500'
                              : theme === 'light'
                              ? 'text-slate-900 group-hover:text-[#0D9488]'
                              : 'text-slate-100 group-hover:text-[#3BC0BB]'
                          }`}
                        >
                          {getDisplayTaskTitle(t)}
                        </h4>
                      </TaskQuickPreviewPopover>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                      <span
                        className={`flex items-center gap-1 ${
                          isOverdue ? 'text-rose-400 font-bold' : ''
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {t.dueDate ? t.dueDate : 'No Due Date'}
                        {isOverdue && ' (Overdue)'}
                      </span>
                      <span>•</span>
                      <span>Est: {t.estimatedHours || 0}h</span>
                      {Boolean(t.subtaskCount && t.subtaskCount > 0) && (
                        <>
                          <span>•</span>
                          <span>
                            {t.completedSubtasks || 0}/{t.subtaskCount} Subtasks
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Priority & Status Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${pScore.bgColor} ${pScore.color} ${pScore.borderColor}`}
                    title={`Priority Score: ${pScore.score} (${pScore.tier})`}
                  >
                    {pScore.score} {pScore.tier}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(
                      t.status,
                      theme === 'light'
                    )}`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
