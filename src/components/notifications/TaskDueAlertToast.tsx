import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronDown,
  ExternalLink,
  BellOff,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { CustomSnoozeModal } from './CustomSnoozeModal';

export const TaskDueAlertToast: React.FC = () => {
  const {
    tasks,
    projects,
    snoozedTasks,
    notificationSettings,
    snoozeTaskNotification,
    updateTask,
    setActiveTab,
    setSelectedProjectId,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  const [dismissedTaskIds, setDismissedTaskIds] = useState<string[]>([]);
  const [activeSnoozeTaskId, setActiveSnoozeTaskId] = useState<string | null>(null);
  const [customSnoozeTask, setCustomSnoozeTask] = useState<{ id: string; title: string } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const now = new Date();
  const leadMs = (notificationSettings.leadDays || 3) * 24 * 60 * 60 * 1000;

  // Filter tasks that need active due alert toast
  const activeAlertTasks = tasks.filter((t) => {
    if (t.status === 'Done' || !t.dueDate) return false;
    if (dismissedTaskIds.includes(t.id)) return false;

    // Check snooze
    const snoozeRecord = snoozedTasks[t.id];
    if (snoozeRecord) {
      if (new Date(snoozeRecord.snoozedUntil) > now) {
        return false; // Currently snoozed
      }
    }

    const due = new Date(t.dueDate);
    const isOverdue = due.getTime() < now.getTime();
    const isUpcoming = due.getTime() >= now.getTime() && (due.getTime() - now.getTime() <= leadMs);

    return isOverdue || isUpcoming;
  });

  if (activeAlertTasks.length === 0) return null;

  const handleDismiss = (taskId: string) => {
    setDismissedTaskIds((prev) => [...prev, taskId]);
  };

  const handleQuickSnooze = (taskId: string, preset: string) => {
    if (preset === 'custom') {
      const task = tasks.find((t) => t.id === taskId);
      setCustomSnoozeTask({ id: taskId, title: task?.title || 'Task' });
    } else {
      snoozeTaskNotification(taskId, preset);
    }
    setActiveSnoozeTaskId(null);
  };

  const handleMarkTaskDone = (task: Task) => {
    updateTask(task.id, { status: 'Done' });
    handleDismiss(task.id);
  };

  const handleNavigateToTask = (task: Task) => {
    setSelectedProjectId(task.projectId);
    setActiveTab('tasks');
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full space-y-3 pointer-events-auto animate-in slide-in-from-bottom-5">
        {/* Minimized Pill Toggle */}
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-2xl transition-all group ml-auto ${
              isLight
                ? 'bg-white border-[#0D9488] text-slate-800 hover:bg-slate-50'
                : 'bg-[#16222F] border-[#0773BB] text-white hover:bg-[#1A2838]'
            }`}
          >
            <div className="relative">
              <Bell className="w-4 h-4 text-[#3BC0BB] animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
            </div>
            <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {activeAlertTasks.length} Task Alert{activeAlertTasks.length > 1 ? 's' : ''}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              isLight ? 'bg-teal-100 text-teal-800' : 'bg-[#0773BB]/30 text-[#3BC0BB]'
            }`}>
              View
            </span>
          </button>
        ) : (
          <div className="space-y-3">
            {/* Header / Collapse Bar */}
            <div className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs backdrop-blur-md shadow-md ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-800'
                : 'bg-[#0D1520]/90 border-[#233549] text-white'
            }`}>
              <div className={`flex items-center gap-2 font-bold text-[11px] ${
                isLight ? 'text-slate-800' : 'text-white'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-[#3BC0BB]" />
                <span>Task Due Alerts ({activeAlertTasks.length})</span>
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-[#233549]'
                }`}
              >
                Minimize
              </button>
            </div>

            {/* Display up to 3 active alert toasts */}
            {activeAlertTasks.slice(0, 3).map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const due = new Date(task.dueDate);
              const diffMs = due.getTime() - now.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const isOverdue = diffMs < 0;

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all relative space-y-3 ${
                    isLight
                      ? isOverdue
                        ? 'bg-rose-50/95 border-rose-300 text-slate-900 shadow-rose-100/80'
                        : 'bg-white/95 border-teal-300 text-slate-900 shadow-slate-200/80'
                      : isOverdue
                        ? 'bg-[#1C1217]/95 border-rose-500/50 shadow-rose-950/20 text-white'
                        : 'bg-[#16222F]/95 border-[#0773BB]/60 shadow-[#0773BB]/10 text-white'
                  }`}
                >
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isOverdue ? (
                        <div className={`p-1.5 rounded-lg border ${
                          isLight
                            ? 'bg-rose-100 text-rose-700 border-rose-300'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        }`}>
                          <AlertTriangle className="w-4 h-4 animate-pulse" />
                        </div>
                      ) : (
                        <div className={`p-1.5 rounded-lg border ${
                          isLight
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : 'bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40'
                        }`}>
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isOverdue
                                ? isLight
                                  ? 'bg-rose-200 text-rose-800 border border-rose-300'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : isLight
                                  ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                  : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40'
                            }`}
                          >
                            {isOverdue
                              ? `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`
                              : diffDays === 0
                              ? 'Due Today'
                              : `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`}
                          </span>
                          <span className={`text-[10px] font-mono ${
                            isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'
                          }`}>
                            {project?.code || 'PROJECT'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismiss(task.id)}
                      className={`p-1 rounded-lg transition-all ${
                        isLight
                          ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                      title="Dismiss Alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Task Info */}
                  <div>
                    <h4
                      onClick={() => handleNavigateToTask(task)}
                      className={`text-xs font-bold cursor-pointer transition-colors line-clamp-2 ${
                        isLight
                          ? 'text-slate-900 hover:text-teal-700'
                          : 'text-white hover:text-[#3BC0BB]'
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p className={`text-[11px] mt-0.5 line-clamp-1 ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      {task.description || 'No additional details.'}
                    </p>
                  </div>

                  {/* Action Row & Snooze Control */}
                  <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
                    isLight ? 'border-slate-200' : 'border-[#233549]/60'
                  }`}>
                    {/* Snooze Dropdown Button */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveSnoozeTaskId(
                            activeSnoozeTaskId === task.id ? null : task.id
                          )
                        }
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            : 'bg-[#0D1520] hover:bg-[#233549] text-slate-300 hover:text-white border-[#233549]'
                        }`}
                      >
                        <BellOff className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-[#3BC0BB]'}`} />
                        <span>Snooze</span>
                        <ChevronDown className={`w-3 h-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeSnoozeTaskId === task.id && (
                        <div className={`absolute bottom-full mb-1 left-0 w-44 rounded-xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in slide-in-from-bottom-2 border ${
                          isLight
                            ? 'bg-white border-slate-200 text-slate-800 shadow-2xl'
                            : 'bg-[#16222F] border-[#233549] text-slate-300 shadow-2xl'
                        }`}>
                          <div className={`text-[10px] font-bold px-2 py-1 uppercase tracking-wider ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Snooze Interval
                          </div>
                          <button
                            onClick={() => handleQuickSnooze(task.id, '15m')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                              isLight
                                ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800'
                                : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                            }`}
                          >
                            <span>15 Minutes</span>
                            <span className="text-[10px] opacity-60">+15m</span>
                          </button>
                          <button
                            onClick={() => handleQuickSnooze(task.id, '1h')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                              isLight
                                ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800'
                                : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                            }`}
                          >
                            <span>1 Hour</span>
                            <span className="text-[10px] opacity-60">+1h</span>
                          </button>
                          <button
                            onClick={() => handleQuickSnooze(task.id, '4h')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                              isLight
                                ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800'
                                : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                            }`}
                          >
                            <span>4 Hours</span>
                            <span className="text-[10px] opacity-60">+4h</span>
                          </button>
                          <button
                            onClick={() => handleQuickSnooze(task.id, '1d')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                              isLight
                                ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800'
                                : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                            }`}
                          >
                            <span>1 Day (Tomorrow)</span>
                            <span className="text-[10px] opacity-60">+24h</span>
                          </button>
                          <button
                            onClick={() => handleQuickSnooze(task.id, '2d')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                              isLight
                                ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800'
                                : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                            }`}
                          >
                            <span>2 Days</span>
                            <span className="text-[10px] opacity-60">+48h</span>
                          </button>
                          <div className={`border-t my-1 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}></div>
                          <button
                            onClick={() => handleQuickSnooze(task.id, 'custom')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between ${
                              isLight
                                ? 'hover:bg-teal-100 text-teal-900'
                                : 'hover:bg-[#3BC0BB]/20 text-[#3BC0BB]'
                            }`}
                          >
                            <span>Custom Date...</span>
                            <Clock className={`w-3 h-3 ${isLight ? 'text-teal-700' : 'text-[#3BC0BB]'}`} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right side buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleNavigateToTask(task)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all flex items-center gap-1 ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            : 'bg-[#0D1520] hover:bg-[#233549] text-slate-300 hover:text-white border-[#233549]'
                        }`}
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleMarkTaskDone(task)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1 ${
                          isLight
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 shadow-sm'
                            : 'bg-[#0773BB]/20 hover:bg-[#0773BB]/40 text-[#3BC0BB] border-[#0773BB]/50'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Snooze Picker Modal */}
      {customSnoozeTask && (
        <CustomSnoozeModal
          taskId={customSnoozeTask.id}
          taskTitle={customSnoozeTask.title}
          onClose={() => setCustomSnoozeTask(null)}
        />
      )}
    </>
  );
};
