import React, { useState, useMemo } from 'react';
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Clock,
  Settings,
  BellOff,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Volume2,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Mail,
  Send,
  Calendar,
  User as UserIcon,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SnoozeRecord } from '../../types';
import { CustomSnoozeModal } from './CustomSnoozeModal';
import { normalizeRole } from '../../lib/permissions';

export const NotificationsDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    currentUser,
    notifications,
    snoozedTasks,
    tasks,
    projects,
    notificationSettings,
    markNotificationRead,
    clearAllNotifications,
    snoozeTaskNotification,
    unsnoozeTaskNotification,
    updateNotificationSettings,
    requestBrowserNotificationPermission,
    triggerDailyOverdueCheck,
    setActiveTab,
    setSelectedProjectId,
    approveDueDateChange,
    rejectDueDateChange,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  const [activeDrawerTab, setActiveDrawerTab] = useState<'all' | 'requests' | 'snoozed' | 'settings'>('all');
  const [activeSnoozeDropdownId, setActiveSnoozeDropdownId] = useState<string | null>(null);
  const [customSnoozeTask, setCustomSnoozeTask] = useState<{ id: string; title: string } | null>(null);
  const [dailyStatusMsg, setDailyStatusMsg] = useState<string | null>(null);
  const [requestsFilter, setRequestsFilter] = useState<'pending' | 'all' | 'resolved'>('pending');
  const [decliningTaskId, setDecliningTaskId] = useState<string | null>(null);
  const [declineReasonText, setDeclineReasonText] = useState<string>('');

  const snoozedRecords: SnoozeRecord[] = Object.values(snoozedTasks);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentRole = currentUser?.role || 'Team Member';
  const normRole = normalizeRole(currentRole);
  const isManagerOrAdmin = normRole === 'admin' || normRole === 'project manager';

  // All tasks with date extension requests
  const tasksWithDateRequests = useMemo(() => {
    return tasks.filter((t) => !!t.dueDateRequest);
  }, [tasks]);

  const pendingDateRequestsCount = useMemo(() => {
    return tasks.filter((t) => t.dueDateRequest && t.dueDateRequest.status === 'pending').length;
  }, [tasks]);

  const handleQuickSnooze = (taskId: string, preset: string) => {
    if (preset === 'custom') {
      const task = tasks.find((t) => t.id === taskId);
      setCustomSnoozeTask({ id: taskId, title: task?.title || 'Task' });
    } else {
      snoozeTaskNotification(taskId, preset);
    }
    setActiveSnoozeDropdownId(null);
  };

  const handleNavigateToTask = (taskId?: string, projectId?: string) => {
    if (projectId) setSelectedProjectId(projectId);
    if (taskId) setActiveTab('tasks');
    onClose();
  };

  const handleApproveRequest = (taskId: string, notifId?: string) => {
    approveDueDateChange(taskId);
    if (notifId) markNotificationRead(notifId);
  };

  const handleRejectRequest = (taskId: string, notifId?: string) => {
    rejectDueDateChange(taskId, declineReasonText.trim() || undefined);
    setDecliningTaskId(null);
    setDeclineReasonText('');
    if (notifId) markNotificationRead(notifId);
  };

  const currentPermission =
    'Notification' in window ? window.Notification.permission : 'unsupported';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className={`w-full max-w-lg h-full p-5 sm:p-6 shadow-2xl flex flex-col justify-between border-l ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#16222F] border-[#233549] text-white'
      }`}>
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className={`flex items-center justify-between border-b pb-4 ${
            isLight ? 'border-slate-200' : 'border-[#233549]'
          }`}>
            <div className="flex items-center gap-2.5 font-bold">
              <div className={`p-2 rounded-xl border ${
                isLight ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-[#0773BB]/20 border-[#0773BB]/40 text-[#3BC0BB]'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Notifications Center</h3>
                <p className={`text-[11px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Due dates, PM approval requests & reminders
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-all ${
                isLight
                  ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-[#233549]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            <button
              onClick={() => setActiveDrawerTab('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                activeDrawerTab === 'all'
                  ? isLight
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'bg-[#0773BB] text-white shadow-md'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Active</span>
              {unreadCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isLight ? 'bg-teal-100 text-teal-900' : 'bg-[#3BC0BB] text-black'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Date Requests Tab */}
            <button
              onClick={() => setActiveDrawerTab('requests')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                activeDrawerTab === 'requests'
                  ? isLight
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-amber-600 text-white shadow-md'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Requests</span>
              {pendingDateRequestsCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold animate-pulse">
                  {pendingDateRequestsCount}
                </span>
              ) : (
                tasksWithDateRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-500/20 text-[10px] font-bold">
                    {tasksWithDateRequests.length}
                  </span>
                )
              )}
            </button>

            <button
              onClick={() => setActiveDrawerTab('snoozed')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                activeDrawerTab === 'snoozed'
                  ? isLight
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'bg-[#0773BB] text-white shadow-md'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
              }`}
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>Snoozed</span>
              {snoozedRecords.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                  {snoozedRecords.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveDrawerTab('settings')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                activeDrawerTab === 'settings'
                  ? isLight
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'bg-[#0773BB] text-white shadow-md'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>

          {/* TAB 1: ALL ACTIVE NOTIFICATIONS */}
          {activeDrawerTab === 'all' && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold px-1">
                <span>Recent Alerts ({notifications.length})</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className={`p-8 text-center space-y-3 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}>
                  <CheckCircle2 className={`w-8 h-8 mx-auto ${isLight ? 'text-teal-600' : 'text-[#3BC0BB] opacity-80'}`} />
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>All Caught Up!</h4>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      No pending task reminders or due alerts right now.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => {
                  const task = tasks.find((t) => t.id === n.taskId);
                  const project = projects.find((p) => p.id === (n.projectId || task?.projectId));
                  const isSnoozed = n.taskId ? !!snoozedTasks[n.taskId] : false;
                  const isDateRequest = n.type === 'date_request' || (task?.dueDateRequest && task.dueDateRequest.status === 'pending');
                  const hasPendingReq = task?.dueDateRequest?.status === 'pending';

                  return (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2.5 transition-all relative ${
                        isDateRequest
                          ? isLight
                            ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-md'
                            : 'bg-amber-950/20 border-amber-500/50 text-white shadow-lg'
                          : isLight
                            ? n.read
                              ? 'bg-slate-50 border-slate-200 text-slate-600 opacity-80'
                              : n.type === 'overdue'
                                ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-md'
                                : 'bg-teal-50/60 border-teal-200 text-slate-900 shadow-md'
                            : n.read
                              ? 'bg-[#0D1520] border-[#233549] text-slate-400 opacity-80'
                              : 'bg-[#0773BB]/10 border-[#0773BB] text-white shadow-lg'
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isDateRequest ? (
                            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : n.type === 'overdue' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          ) : (
                            <Clock className={`w-4 h-4 shrink-0 ${isLight ? 'text-teal-600' : 'text-[#3BC0BB]'}`} />
                          )}
                          <span className={`font-bold truncate max-w-[210px] ${
                            isDateRequest
                              ? isLight ? 'text-amber-900' : 'text-amber-300'
                              : isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            {n.title}
                          </span>
                        </div>

                        {!n.read && (
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                            isDateRequest
                              ? 'bg-amber-500'
                              : isLight ? 'bg-teal-600' : 'bg-[#3BC0BB]'
                          }`}></span>
                        )}
                      </div>

                      <p className={`text-[11px] leading-relaxed ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}>
                        {n.message}
                      </p>

                      {/* Request Details pill if date_request */}
                      {task?.dueDateRequest && (
                        <div className={`p-2 rounded-xl text-[11px] space-y-1.5 border ${
                          isLight
                            ? 'bg-white/80 border-amber-200 text-slate-700'
                            : 'bg-[#0D1520]/80 border-amber-500/30 text-slate-200'
                        }`}>
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-slate-400">Current: {task.dueDateRequest.currentDueDate || 'None'}</span>
                            <ArrowRight className="w-3 h-3 text-amber-500" />
                            <span className="font-bold text-amber-500">Proposed: {task.dueDateRequest.proposedDueDate}</span>
                          </div>
                          {task.dueDateRequest.reason && (
                            <div className="text-[10px] italic text-slate-500 dark:text-slate-400">
                              "{task.dueDateRequest.reason}"
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                            <span>Requested by: <strong>{task.dueDateRequest.requestedByName}</strong> ({task.dueDateRequest.requestedByRole})</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                              task.dueDateRequest.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-500'
                                : task.dueDateRequest.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-rose-500/20 text-rose-500'
                            }`}>
                              {task.dueDateRequest.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {project && (
                        <div className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-block ${
                          isLight
                            ? 'bg-white border-slate-200 text-slate-600'
                            : 'bg-[#0D1520] border-[#233549] text-slate-400'
                        }`}>
                          Project: {project.code} - {project.title}
                        </div>
                      )}

                      {/* If PM and task has pending request, show Approval Action Bar */}
                      {isManagerOrAdmin && task && hasPendingReq && (
                        <div className="pt-2 border-t border-amber-500/30 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(task.id, n.id)}
                            className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(task.id, n.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve ({task.dueDateRequest?.proposedDueDate})</span>
                          </button>
                        </div>
                      )}

                      {/* Standard Action Bar */}
                      <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
                        isLight ? 'border-slate-200' : 'border-[#233549]/60'
                      }`}>
                        {n.taskId ? (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveSnoozeDropdownId(
                                  activeSnoozeDropdownId === n.id ? null : n.id
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all border ${
                                isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                  : 'bg-[#16222F] hover:bg-[#233549] text-slate-300 hover:text-white border-[#233549]'
                              }`}
                            >
                              <BellOff className={`w-3 h-3 ${isLight ? 'text-teal-700' : 'text-[#3BC0BB]'}`} />
                              <span>{isSnoozed ? 'Resnooze' : 'Snooze'}</span>
                              <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>

                            {activeSnoozeDropdownId === n.id && (
                              <div className={`absolute left-0 bottom-full mb-1 w-44 border rounded-xl shadow-2xl p-1.5 space-y-1 z-50 ${
                                isLight
                                  ? 'bg-white border-slate-200 text-slate-800 shadow-2xl'
                                  : 'bg-[#16222F] border-[#233549] text-slate-300 shadow-2xl'
                              }`}>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '15m')}
                                  className={`w-full text-left px-2 py-1 rounded text-xs ${
                                    isLight ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800' : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                                  }`}
                                >
                                  15 Minutes
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '1h')}
                                  className={`w-full text-left px-2 py-1 rounded text-xs ${
                                    isLight ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800' : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                                  }`}
                                >
                                  1 Hour
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '4h')}
                                  className={`w-full text-left px-2 py-1 rounded text-xs ${
                                    isLight ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800' : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                                  }`}
                                >
                                  4 Hours
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '1d')}
                                  className={`w-full text-left px-2 py-1 rounded text-xs ${
                                    isLight ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800' : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                                  }`}
                                >
                                  1 Day (Tomorrow)
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '2d')}
                                  className={`w-full text-left px-2 py-1 rounded text-xs ${
                                    isLight ? 'hover:bg-teal-50 hover:text-teal-900 text-slate-800' : 'hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-slate-300'
                                  }`}
                                >
                                  2 Days
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, 'custom')}
                                  className={`w-full text-left px-2 py-1 rounded text-xs font-bold ${
                                    isLight ? 'hover:bg-teal-100 text-teal-900' : 'hover:bg-[#3BC0BB]/20 text-[#3BC0BB] text-slate-200'
                                  }`}
                                >
                                  Custom Date...
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div></div>
                        )}

                        <div className="flex items-center gap-1.5">
                          {n.taskId && (
                            <button
                              onClick={() => handleNavigateToTask(n.taskId, n.projectId)}
                              className="px-2.5 py-1 rounded-lg bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40 text-[11px] font-semibold hover:bg-[#0773BB]/40 transition-all flex items-center gap-1"
                            >
                              <span>Task</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          {!n.read && (
                            <button
                              onClick={() => markNotificationRead(n.id)}
                              className="px-2 py-1 rounded-lg bg-[#16222F] hover:bg-[#233549] text-[11px] text-slate-400 hover:text-slate-200 transition-all"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: DEDICATED DATE REQUESTS MANAGER */}
          {activeDrawerTab === 'requests' && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold px-1">
                <span>Due Date Extension Requests</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRequestsFilter('pending')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      requestsFilter === 'pending'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-500/20 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pending ({pendingDateRequestsCount})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      requestsFilter === 'all'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-500/20 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({tasksWithDateRequests.length})
                  </button>
                </div>
              </div>

              {tasksWithDateRequests.filter((t) => {
                if (requestsFilter === 'pending') return t.dueDateRequest?.status === 'pending';
                if (requestsFilter === 'resolved') return t.dueDateRequest?.status !== 'pending';
                return true;
              }).length === 0 ? (
                <div className={`p-8 text-center space-y-3 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}>
                  <Calendar className={`w-8 h-8 mx-auto ${isLight ? 'text-amber-600' : 'text-amber-400 opacity-80'}`} />
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>No Date Extension Requests</h4>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {requestsFilter === 'pending'
                        ? 'There are no pending due date change requests requiring PM approval.'
                        : 'No due date requests logged.'}
                    </p>
                  </div>
                </div>
              ) : (
                tasksWithDateRequests
                  .filter((t) => {
                    if (requestsFilter === 'pending') return t.dueDateRequest?.status === 'pending';
                    if (requestsFilter === 'resolved') return t.dueDateRequest?.status !== 'pending';
                    return true;
                  })
                  .map((task) => {
                    const req = task.dueDateRequest!;
                    const project = projects.find((p) => p.id === task.projectId);
                    const isPending = req.status === 'pending';

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
                          isPending
                            ? isLight
                              ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-md ring-1 ring-amber-400/30'
                              : 'bg-amber-950/20 border-amber-500/50 text-white shadow-lg ring-1 ring-amber-500/20'
                            : isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-700'
                              : 'bg-[#0D1520] border-[#233549] text-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {task.title}
                              </span>
                            </div>
                            {project && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                Project: {project.code} - {project.title}
                              </div>
                            )}
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                            req.status === 'pending'
                              ? 'bg-amber-500 text-slate-950 animate-pulse'
                              : req.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        {/* Date Difference Banner */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs ${
                          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
                        }`}>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-sans">Current Deadline</div>
                            <div className="font-semibold text-slate-600 dark:text-slate-300">
                              {req.currentDueDate || 'No Due Date'}
                            </div>
                          </div>

                          <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />

                          <div className="text-right">
                            <div className="text-[10px] text-amber-500 font-bold uppercase font-sans">Proposed New Date</div>
                            <div className="font-bold text-amber-600 dark:text-amber-300">
                              {req.proposedDueDate}
                            </div>
                          </div>
                        </div>

                        {/* Requester & Reason */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3 text-[#3BC0BB]" />
                              <span>Requester: <strong>{req.requestedByName}</strong> ({req.requestedByRole})</span>
                            </span>
                            <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                          </div>

                          {req.reason && (
                            <div className={`p-2 rounded-lg text-[11px] italic ${
                              isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#07111E] text-slate-300'
                            }`}>
                              "{req.reason}"
                            </div>
                          )}
                        </div>

                        {/* Reviewer info if resolved */}
                        {req.status !== 'pending' && req.reviewedByName && (
                          <div className="text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-1.5 flex items-center justify-between">
                            <span>Reviewed by {req.reviewedByName}</span>
                            {req.reviewComment && <span>Note: {req.reviewComment}</span>}
                          </div>
                        )}

                        {/* Action Buttons for PM */}
                        {isPending && isManagerOrAdmin && (
                          <div className="space-y-2 pt-1 border-t border-amber-500/30">
                            {decliningTaskId === task.id ? (
                              <div className="space-y-2 p-2 rounded-xl bg-black/20 border border-rose-500/30">
                                <label className="text-[10px] font-semibold text-rose-300">Reason for Declining (Optional):</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Milestone delivery timeline cannot slip..."
                                  value={declineReasonText}
                                  onChange={(e) => setDeclineReasonText(e.target.value)}
                                  className="w-full text-xs p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none"
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setDecliningTaskId(null);
                                      setDeclineReasonText('');
                                    }}
                                    className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(task.id)}
                                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                                  >
                                    Confirm Decline
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleNavigateToTask(task.id, task.projectId)}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  View Task
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setDecliningTaskId(task.id)}
                                    className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveRequest(task.id)}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve & Set Date</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* TAB 3: SNOOZED NOTIFICATIONS */}
          {activeDrawerTab === 'snoozed' && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="text-[11px] text-slate-400 font-semibold px-1">
                Currently Snoozed Task Alerts ({snoozedRecords.length})
              </div>

              {snoozedRecords.length === 0 ? (
                <div className={`p-8 text-center space-y-3 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}>
                  <BellOff className={`w-8 h-8 mx-auto ${isLight ? 'text-teal-600' : 'text-[#3BC0BB] opacity-80'}`} />
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>No Snoozed Alerts</h4>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      When you snooze task notifications, they will be listed here until their snooze duration expires.
                    </p>
                  </div>
                </div>
              ) : (
                snoozedRecords.map((rec) => {
                  const task = tasks.find((t) => t.id === rec.taskId);
                  const project = projects.find((p) => p.id === task?.projectId);
                  const untilDate = new Date(rec.snoozedUntil);
                  const isExpired = Date.now() > (typeof rec.snoozedUntil === 'number' ? rec.snoozedUntil : untilDate.getTime());

                  return (
                    <div
                      key={rec.taskId}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {task?.title || 'Unknown Task'}
                          </h4>
                          {project && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {project.code} - {project.title}
                            </span>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isExpired
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isLight
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {isExpired ? 'Snooze Expired' : 'Snoozed'}
                        </span>
                      </div>

                      <div className={`p-2 rounded-xl text-[11px] flex items-center justify-between border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
                      }`}>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-[#3BC0BB]'}`} />
                          <span>Resumes alert at:</span>
                        </div>
                        <span className={`font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {untilDate.toLocaleDateString()} {untilDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => unsnoozeTaskNotification(rec.taskId)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            isLight
                              ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                              : 'bg-[#0773BB]/20 hover:bg-[#0773BB]/40 text-[#3BC0BB] border-[#0773BB]/40'
                          }`}
                        >
                          Wake Up Alert Now
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeDrawerTab === 'settings' && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Daily Overdue Trigger */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#3BC0BB]'}`} />
                    <h4 className="text-xs font-bold">Daily Overdue Auto-Check</h4>
                  </div>
                  <button
                    onClick={() => {
                      const count = triggerDailyOverdueCheck();
                      setDailyStatusMsg(`Scanned workspace tasks: ${count} notifications generated.`);
                      setTimeout(() => setDailyStatusMsg(null), 4000);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      isLight
                        ? 'bg-white hover:bg-teal-50 text-teal-800 border-slate-200 shadow-xs'
                        : 'bg-[#16222F] hover:bg-[#233549] text-[#3BC0BB] border-[#233549]'
                    }`}
                  >
                    Run Scan Now
                  </button>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Runs daily at 09:00 AM workspace time to flag past-due milestones.
                </p>
                {dailyStatusMsg && (
                  <div className={`p-2 rounded-xl text-[11px] font-bold ${
                    isLight ? 'bg-teal-100 text-teal-900' : 'bg-[#3BC0BB]/20 text-[#3BC0BB]'
                  }`}>
                    {dailyStatusMsg}
                  </div>
                )}
              </div>

              {/* Browser Push Notifications */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      Desktop Push Alerts
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Permission Status: <span className={`font-bold ${isLight ? 'text-teal-700' : 'text-[#3BC0BB]'}`}>{currentPermission}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => requestBrowserNotificationPermission()}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                      isLight ? 'bg-teal-700 hover:bg-teal-800 text-white' : 'bg-[#0773BB] hover:bg-[#0773BB]/80 text-white'
                    }`}
                  >
                    {currentPermission === 'granted' ? 'Enabled ✓' : 'Enable Push'}
                  </button>
                </div>
              </div>

              {/* Lead Days Settings */}
              <div className={`space-y-3 p-4 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-white'
              }`}>
                <h4 className="text-xs font-bold flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#3BC0BB]'}`} />
                  <span>Due Date Reminder Lead Time</span>
                </h4>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Trigger task notifications when tasks are due within this lead window:
                </p>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[1, 2, 3, 5].map((days) => (
                    <button
                      key={days}
                      onClick={() => updateNotificationSettings({ leadDays: days })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        notificationSettings.leadDays === days
                          ? isLight
                            ? 'bg-teal-700 text-white border-teal-800'
                            : 'bg-[#0773BB] text-white border-[#3BC0BB]'
                          : isLight
                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            : 'bg-[#16222F] text-slate-300 border-[#233549] hover:bg-[#233549]'
                      }`}
                    >
                      {days} {days === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Alerts Settings */}
              <div className={`space-y-3 p-4 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Volume2 className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#3BC0BB]'}`} />
                    <span>Sound Alerts</span>
                  </div>

                  <button
                    onClick={() =>
                      updateNotificationSettings({
                        soundAlerts: !notificationSettings.soundAlerts,
                      })
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      notificationSettings.soundAlerts
                        ? isLight ? 'bg-teal-600' : 'bg-[#0773BB]'
                        : isLight ? 'bg-slate-300' : 'bg-[#233549]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        notificationSettings.soundAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#233549]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-xs font-semibold text-slate-300 transition-all"
          >
            Close Notifications
          </button>
        </div>
      </div>

      {/* Custom Snooze Modal */}
      {customSnoozeTask && (
        <CustomSnoozeModal
          taskId={customSnoozeTask.id}
          taskTitle={customSnoozeTask.title}
          onClose={() => setCustomSnoozeTask(null)}
        />
      )}
    </div>
  );
};
