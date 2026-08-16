import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Calendar,
  User,
  Check,
  Zap,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { calculatePriorityScore } from '../../lib/priorityScore';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { getStatusBadgeStyle } from '../../lib/statusUtils';
import { TaskQuickPreviewPopover } from '../tasks/TaskQuickPreviewPopover';

export interface HighPriorityOverdueWidgetProps {
  theme?: 'dark' | 'light';
  onNavigateToTasks?: () => void;
}

export const HighPriorityOverdueWidget: React.FC<HighPriorityOverdueWidgetProps> = ({
  theme = 'dark',
  onNavigateToTasks
}) => {
  const {
    tasks,
    projects,
    users,
    dependencies,
    updateTask,
    setActiveTab,
    activeCompany
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'urgent' | 'blocked'>('all');

  const companyTasks = useMemo(() => {
    return tasks.filter((t) => !activeCompany?.id || t.companyId === activeCompany.id);
  }, [tasks, activeCompany?.id]);

  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string }>();
    users.forEach((u) => map.set(u.id, { name: u.name, avatar: u.avatar }));
    return map;
  }, [users]);

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.code || p.title));
    return map;
  }, [projects]);

  // Compute critical items: Urgent/High priority OR overdue OR blocked by prerequisite
  const criticalItems = useMemo(() => {
    const now = new Date();
    return companyTasks.filter((t) => {
      if (t.status === 'Done') return false;

      const isOverdue = t.dueDate ? new Date(t.dueDate) < now : false;
      const isUrgent = t.priority === 'Urgent' || t.priority === 'High';
      
      // Check if blocked by pending dependencies
      const deps = dependencies.filter((d) => d.taskId === t.id);
      const isBlocked = deps.some((dep) => {
        const prereq = companyTasks.find((pt) => pt.id === dep.dependsOnTaskId);
        return prereq && prereq.status !== 'Done';
      });

      const pScore = calculatePriorityScore(t, dependencies, companyTasks);
      const isHighPriorityScore = pScore.score >= 45;

      return isOverdue || isUrgent || isBlocked || isHighPriorityScore;
    });
  }, [companyTasks, dependencies]);

  // Filtered view
  const displayItems = useMemo(() => {
    const now = new Date();
    let list = [...criticalItems];

    if (filterType === 'overdue') {
      list = list.filter((t) => t.dueDate && new Date(t.dueDate) < now);
    } else if (filterType === 'urgent') {
      list = list.filter((t) => t.priority === 'Urgent');
    } else if (filterType === 'blocked') {
      list = list.filter((t) => {
        const deps = dependencies.filter((d) => d.taskId === t.id);
        return deps.some((dep) => {
          const prereq = companyTasks.find((pt) => pt.id === dep.dependsOnTaskId);
          return prereq && prereq.status !== 'Done';
        });
      });
    }

    // Sort by priority score descending
    return list.sort((a, b) => {
      const scoreA = calculatePriorityScore(a, dependencies, companyTasks).score;
      const scoreB = calculatePriorityScore(b, dependencies, companyTasks).score;
      return scoreB - scoreA;
    });
  }, [criticalItems, filterType, dependencies, companyTasks]);

  const overdueCount = useMemo(() => {
    const now = new Date();
    return criticalItems.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;
  }, [criticalItems]);

  const urgentCount = useMemo(() => {
    return criticalItems.filter((t) => t.priority === 'Urgent').length;
  }, [criticalItems]);

  const blockedCount = useMemo(() => {
    return criticalItems.filter((t) => {
      const deps = dependencies.filter((d) => d.taskId === t.id);
      return deps.some((dep) => {
        const prereq = companyTasks.find((pt) => pt.id === dep.dependsOnTaskId);
        return prereq && prereq.status !== 'Done';
      });
    }).length;
  }, [criticalItems, dependencies, companyTasks]);

  const handleMarkDone = (taskId: string) => {
    updateTask(taskId, { status: 'Done' });
  };

  return (
    <div className="p-5 sm:p-6 flex flex-col h-full space-y-4">
      {/* Alert Header & KPI Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/20">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D1520] border border-[#233549] text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Critical ({criticalItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('overdue')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'overdue'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-400 hover:text-white'
              }`}
            >
              Overdue ({overdueCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('urgent')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'urgent'
                  ? 'bg-rose-700 text-white shadow'
                  : 'text-rose-400 hover:text-white'
              }`}
            >
              Urgent ({urgentCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('blocked')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'blocked'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-400 hover:text-white'
              }`}
            >
              Blocked ({blockedCount})
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToTasks || (() => setActiveTab('tasks'))}
          className="text-xs font-semibold text-[#3BC0BB] hover:underline flex items-center gap-1 shrink-0 self-end sm:self-auto"
        >
          <span>Manage in Tasks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-1">
        {displayItems.length === 0 ? (
          <div className="p-8 rounded-xl bg-emerald-500/5 border border-dashed border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-emerald-400">
              No High Priority Overdue Tasks!
            </p>
            <p className="text-[11px] text-slate-400">
              All workspace milestones and deliverables are running on schedule.
            </p>
          </div>
        ) : (
          displayItems.map((t) => {
            const pScore = calculatePriorityScore(t, dependencies, companyTasks);
            const projCode = projectMap.get(t.projectId) || 'PROJECT';
            const now = new Date();
            const isOverdue = t.dueDate ? new Date(t.dueDate) < now : false;

            // Days overdue calculation
            let daysOverdue = 0;
            if (isOverdue && t.dueDate) {
              const diffMs = now.getTime() - new Date(t.dueDate).getTime();
              daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            }

            // Check if blocked
            const deps = dependencies.filter((d) => d.taskId === t.id);
            const isBlocked = deps.some((dep) => {
              const prereq = companyTasks.find((pt) => pt.id === dep.dependsOnTaskId);
              return prereq && prereq.status !== 'Done';
            });

            // Assignee avatars
            const assignees = (t.assigneeIds || [])
              .map((id) => userMap.get(id))
              .filter(Boolean);

            return (
              <div
                key={t.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all group ${
                  theme === 'light'
                    ? 'bg-white border-rose-200 hover:border-rose-400 shadow-xs'
                    : 'bg-[#0D1520] border-rose-500/30 hover:border-rose-500 hover:bg-[#151E2B]'
                }`}
              >
                {/* Left Indicator & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        @{projCode}
                      </span>
                      <TaskQuickPreviewPopover task={t} onOpenFullTask={() => setActiveTab('tasks')}>
                        <h4
                          className={`text-xs font-bold truncate cursor-pointer hover:underline ${
                            theme === 'light' ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {getDisplayTaskTitle(t)}
                        </h4>
                      </TaskQuickPreviewPopover>

                      {isBlocked && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          <ShieldAlert className="w-2.5 h-2.5" /> Blocked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono flex-wrap">
                      {isOverdue ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {daysOverdue} day{daysOverdue === 1 ? '' : 's'} overdue ({t.dueDate})
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due: {t.dueDate || 'No Date'}
                        </span>
                      )}
                      <span>•</span>
                      <span>Est: {t.estimatedHours || 0}h</span>

                      {assignees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {assignees.slice(0, 2).map((a, i) => (
                              <img
                                key={i}
                                src={a?.avatar}
                                alt={a?.name}
                                title={a?.name}
                                className="inline-block w-4 h-4 rounded-full ring-1 ring-slate-800 object-cover"
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-300 truncate max-w-[80px]">
                            {assignees[0]?.name.split(' ')[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action & Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${pScore.bgColor} ${pScore.color} ${pScore.borderColor}`}
                  >
                    {pScore.score} {pScore.tier}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleMarkDone(t.id)}
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all text-xs font-bold flex items-center gap-1"
                    title="Mark task completed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Done</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
