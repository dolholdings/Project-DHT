import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SnoozeRecord } from '../../types';
import { CustomSnoozeModal } from './CustomSnoozeModal';

export const NotificationsDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
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
    setActiveTab,
    setSelectedProjectId,
  } = useApp();

  const [activeTab, setActiveDrawerTab] = useState<'all' | 'snoozed' | 'settings'>('all');
  const [activeSnoozeDropdownId, setActiveSnoozeDropdownId] = useState<string | null>(null);
  const [customSnoozeTask, setCustomSnoozeTask] = useState<{ id: string; title: string } | null>(null);

  const snoozedRecords: SnoozeRecord[] = Object.values(snoozedTasks);
  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const currentPermission =
    'Notification' in window ? window.Notification.permission : 'unsupported';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="w-full max-w-md bg-[#16222F] border-l border-[#233549] h-full p-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#233549] pb-4">
            <div className="flex items-center gap-2.5 text-white font-bold">
              <div className="p-2 rounded-xl bg-[#0773BB]/20 border border-[#0773BB]/40 text-[#3BC0BB]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Notifications Center</h3>
                <p className="text-[11px] text-slate-400 font-normal">
                  Due dates, reminders & snooze settings
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#233549] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D1520] border border-[#233549]">
            <button
              onClick={() => setActiveDrawerTab('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#0773BB] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Active</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#3BC0BB] text-black text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveDrawerTab('snoozed')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'snoozed'
                  ? 'bg-[#0773BB] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
              }`}
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>Snoozed</span>
              {snoozedRecords.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-bold">
                  {snoozedRecords.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveDrawerTab('settings')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-[#0773BB] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>

          {/* TAB 1: ALL ACTIVE NOTIFICATIONS */}
          {activeTab === 'all' && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                <span>Recent Alerts ({notifications.length})</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-3 bg-[#0D1520] rounded-2xl border border-[#233549]">
                  <CheckCircle2 className="w-8 h-8 text-[#3BC0BB] mx-auto opacity-80" />
                  <div>
                    <h4 className="text-xs font-bold text-white">All Caught Up!</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      No pending task reminders or due alerts right now.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => {
                  const task = tasks.find((t) => t.id === n.taskId);
                  const project = projects.find((p) => p.id === (n.projectId || task?.projectId));
                  const isSnoozed = n.taskId ? !!snoozedTasks[n.taskId] : false;

                  return (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2.5 transition-all relative ${
                        n.read
                          ? 'bg-[#0D1520] border-[#233549] text-slate-400 opacity-80'
                          : 'bg-[#0773BB]/10 border-[#0773BB] text-white shadow-lg'
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {n.type === 'overdue' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-[#3BC0BB] shrink-0" />
                          )}
                          <span className="font-bold text-white truncate max-w-[210px]">
                            {n.title}
                          </span>
                        </div>

                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#3BC0BB] shrink-0 mt-1"></span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {n.message}
                      </p>

                      {project && (
                        <div className="text-[10px] text-slate-400 font-mono bg-[#0D1520] px-2 py-0.5 rounded border border-[#233549] inline-block">
                          Project: {project.code} - {project.title}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-[#233549]/60 flex items-center justify-between gap-2">
                        {n.taskId ? (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveSnoozeDropdownId(
                                  activeSnoozeDropdownId === n.id ? null : n.id
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#16222F] hover:bg-[#233549] text-[11px] text-slate-300 hover:text-white border border-[#233549] font-medium flex items-center gap-1 transition-all"
                            >
                              <BellOff className="w-3 h-3 text-[#3BC0BB]" />
                              <span>{isSnoozed ? 'Resnooze' : 'Snooze'}</span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>

                            {activeSnoozeDropdownId === n.id && (
                              <div className="absolute left-0 bottom-full mb-1 w-44 bg-[#16222F] border border-[#233549] rounded-xl shadow-2xl p-1.5 space-y-1 z-50">
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '15m')}
                                  className="w-full text-left px-2 py-1 rounded hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-xs text-slate-300"
                                >
                                  15 Minutes
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '1h')}
                                  className="w-full text-left px-2 py-1 rounded hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-xs text-slate-300"
                                >
                                  1 Hour
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '4h')}
                                  className="w-full text-left px-2 py-1 rounded hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-xs text-slate-300"
                                >
                                  4 Hours
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '1d')}
                                  className="w-full text-left px-2 py-1 rounded hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-xs text-slate-300"
                                >
                                  1 Day (Tomorrow)
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, '2d')}
                                  className="w-full text-left px-2 py-1 rounded hover:bg-[#0773BB]/20 hover:text-[#3BC0BB] text-xs text-slate-300"
                                >
                                  2 Days
                                </button>
                                <button
                                  onClick={() => handleQuickSnooze(n.taskId!, 'custom')}
                                  className="w-full text-left px-2 py-1 rounded hover:bg-[#3BC0BB]/20 hover:text-[#3BC0BB] text-xs text-slate-200 font-bold"
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

          {/* TAB 2: SNOOZED NOTIFICATIONS */}
          {activeTab === 'snoozed' && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="text-[11px] text-slate-400 font-semibold px-1">
                Currently Snoozed Task Alerts ({snoozedRecords.length})
              </div>

              {snoozedRecords.length === 0 ? (
                <div className="p-8 text-center space-y-3 bg-[#0D1520] rounded-2xl border border-[#233549]">
                  <BellOff className="w-8 h-8 text-slate-500 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-white">No Snoozed Alerts</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      When you snooze a task reminder, it will appear here with its wake-up countdown.
                    </p>
                  </div>
                </div>
              ) : (
                snoozedRecords.map((rec) => {
                  const task = tasks.find((t) => t.id === rec.taskId);
                  const untilDate = new Date(rec.snoozedUntil);
                  const isExpired = untilDate.getTime() <= Date.now();

                  return (
                    <div
                      key={rec.taskId}
                      className="p-4 rounded-2xl bg-[#0D1520] border border-[#233549] text-xs space-y-2.5 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-xs">
                            {rec.taskTitle || task?.title || 'Task'}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono mt-1 inline-block">
                            {rec.snoozeDurationLabel || 'Snoozed'}
                          </span>
                        </div>

                        <button
                          onClick={() => unsnoozeTaskNotification(rec.taskId)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#0773BB]/20 hover:bg-[#0773BB]/40 text-[#3BC0BB] border border-[#0773BB]/40 text-xs font-bold transition-all"
                        >
                          Unsnooze
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono bg-[#16222F] p-2 rounded-xl border border-[#233549]">
                        <span>Wakes up:</span>
                        <span className="text-slate-200 font-bold">
                          {untilDate.toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: NOTIFICATION SETTINGS */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              <div className="space-y-4 bg-[#0D1520] p-4 rounded-2xl border border-[#233549]">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Browser & Desktop Notifications</span>
                </h4>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#16222F] border border-[#233549]">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Desktop Push Alerts
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Permission Status: <span className="font-bold text-[#3BC0BB]">{currentPermission}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => requestBrowserNotificationPermission()}
                    className="px-3 py-1.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-md transition-all"
                  >
                    {currentPermission === 'granted' ? 'Enabled ✓' : 'Enable Push'}
                  </button>
                </div>
              </div>

              {/* Lead Days Settings */}
              <div className="space-y-3 bg-[#0D1520] p-4 rounded-2xl border border-[#233549]">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Due Date Reminder Lead Time</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Trigger task notifications when tasks are due within this lead window:
                </p>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[1, 2, 3, 5].map((days) => (
                    <button
                      key={days}
                      onClick={() => updateNotificationSettings({ leadDays: days })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        notificationSettings.leadDays === days
                          ? 'bg-[#0773BB] text-white border-[#3BC0BB]'
                          : 'bg-[#16222F] text-slate-300 border-[#233549] hover:bg-[#233549]'
                      }`}
                    >
                      {days} {days === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Alerts Settings */}
              <div className="space-y-3 bg-[#0D1520] p-4 rounded-2xl border border-[#233549]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Volume2 className="w-4 h-4 text-[#3BC0BB]" />
                    <span>Sound Alerts</span>
                  </div>

                  <button
                    onClick={() =>
                      updateNotificationSettings({
                        soundAlerts: !notificationSettings.soundAlerts,
                      })
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      notificationSettings.soundAlerts ? 'bg-[#0773BB]' : 'bg-[#233549]'
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
