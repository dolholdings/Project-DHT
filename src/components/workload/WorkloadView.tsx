import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Task } from '../../types';
import { getAccessibleTasks } from '../../lib/permissions';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { WorkloadTimescale, WorkloadViewMode, WorkloadDayColumn, DayAllocation } from './types';
import { generateTimelineDays, calculateUserWorkloadStats, formatHoursMinutes } from './workloadUtils';
import { ClickUpWorkloadGrid } from './ClickUpWorkloadGrid';
import { WorkloadToolbar } from './WorkloadToolbar';
import { DayTaskDrawer } from './DayTaskDrawer';
import { CapacitySettingsModal } from './CapacitySettingsModal';
import {
  Flame,
  Clock,
  AlertTriangle,
  Move,
  Sparkles,
  SlidersHorizontal,
  ShieldAlert,
  Edit2,
  Calendar,
  Grid,
  BarChart3,
  GripVertical
} from 'lucide-react';
import { getHeatColor } from './WorkloadHeatmapUtils';
import { UserAvatar } from '../common/UserAvatar';

export const WorkloadView: React.FC = () => {
  const { users, tasks, projects, updateTask, addTask, updateUser, theme, currentUser } = useApp();
  const isLight = theme === 'light';

  const accessibleTasks = useMemo(() => {
    return getAccessibleTasks(currentUser, tasks, projects);
  }, [currentUser, tasks, projects]);

  // Timeline Date & Window Navigation
  // Anchor date represents start of current timeline window
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    const d = new Date();
    // Start window on Monday of current week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [timescale, setTimescale] = useState<WorkloadTimescale>('4w');
  const [viewMode, setViewMode] = useState<WorkloadViewMode>('clickup_grid');

  // Filter States
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [meMode, setMeMode] = useState<boolean>(false);
  const [showClosed, setShowClosed] = useState<boolean>(false);
  const [showOverloadedOnly, setShowOverloadedOnly] = useState<boolean>(false);

  // Modals & Drawers
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState<boolean>(false);
  const [selectedDayInspector, setSelectedDayInspector] = useState<{
    user: User;
    dayAlloc: DayAllocation;
    dayCol: WorkloadDayColumn;
  } | null>(null);

  const [selectedUserModal, setSelectedUserModal] = useState<User | null>(null);

  // Drag and drop & notification toasts
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Generate Timeline Columns
  const { days, dateRangeLabel } = useMemo(() => {
    return generateTimelineDays(anchorDate, timescale);
  }, [anchorDate, timescale]);

  // Departments List
  const departments = useMemo(() => {
    return ['All', ...Array.from(new Set(users.map((u) => u.department || 'General')))];
  }, [users]);

  // Process User Statistics
  const allUserStats = useMemo(() => {
    return users.map((u) => {
      const dailyMax = (u.maxWeeklyHours || 40) / 5;
      return calculateUserWorkloadStats(u, accessibleTasks, days, dailyMax, showClosed);
    });
  }, [users, accessibleTasks, days, showClosed]);

  // Filtered User Statistics
  const filteredUserStats = useMemo(() => {
    return allUserStats.filter((stat) => {
      if (meMode && currentUser && stat.user.id !== currentUser.id) return false;
      if (selectedDept !== 'All' && stat.user.department !== selectedDept) return false;
      if (showOverloadedOnly && !stat.isOverloaded) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = stat.user.name.toLowerCase().includes(q);
        const matchesRole = stat.user.role.toLowerCase().includes(q);
        const matchesDept = stat.user.department.toLowerCase().includes(q);
        if (!matchesName && !matchesRole && !matchesDept) return false;
      }
      return true;
    });
  }, [allUserStats, meMode, currentUser, selectedDept, showOverloadedOnly, searchQuery]);

  // Aggregated Workspace Workload Summary
  const totalAllocatedHours = useMemo(() => {
    return Math.round(allUserStats.reduce((sum, s) => sum + s.totalAllocatedHours, 0) * 10) / 10;
  }, [allUserStats]);

  const totalMaxHours = useMemo(() => {
    return allUserStats.reduce((sum, s) => sum + s.windowMaxHours, 0);
  }, [allUserStats]);

  const avgCapacityPercent = totalMaxHours > 0 ? Math.round((totalAllocatedHours / totalMaxHours) * 100) : 0;
  const overloadedCount = allUserStats.filter((s) => s.isOverloaded).length;

  // Date Navigation Handlers
  const handleNavigateToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setAnchorDate(monday);
  };

  const handleNavigatePrev = () => {
    const next = new Date(anchorDate);
    const step = timescale === '1w' ? 7 : timescale === '2w' ? 14 : 28;
    next.setDate(anchorDate.getDate() - step);
    setAnchorDate(next);
  };

  const handleNavigateNext = () => {
    const next = new Date(anchorDate);
    const step = timescale === '1w' ? 7 : timescale === '2w' ? 14 : 28;
    next.setDate(anchorDate.getDate() + step);
    setAnchorDate(next);
  };

  // Task Reassignment Handlers
  const handleTaskReassign = (taskId: string, targetUserId: string, targetDate?: string) => {
    const task = accessibleTasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) return;

    const updates: Partial<Task> = {
      assigneeIds: [targetUserId]
    };

    if (targetDate) {
      updates.startDate = targetDate;
      updates.dueDate = targetDate;
    }

    updateTask(taskId, updates);
    showToast(
      `Reassigned "${task.title}" (${task.estimatedHours || 4}h) to ${targetUser.name}${targetDate ? ` on ${targetDate}` : ''}`,
      'success'
    );
  };

  const handleBatchUpdateMaxHours = (targetHours: number) => {
    users.forEach((u) => {
      updateUser(u.id, { maxWeeklyHours: targetHours });
    });
    showToast(`Set maximum weekly workload threshold to ${targetHours}h for all ${users.length} team members.`);
  };

  const handleCellClick = (user: User, dayAlloc: DayAllocation, dayCol: WorkloadDayColumn) => {
    setSelectedDayInspector({ user, dayAlloc, dayCol });
  };

  const handleAddTaskToDay = (user: User, date: string) => {
    const col = days.find((d) => d.date === date) || days[0];
    const alloc: DayAllocation = {
      date,
      hours: 0,
      dailyMaxHours: 8,
      percent: 0,
      isOverloaded: false,
      excessHours: 0,
      excessMinutes: 0,
      formattedOverloadBadge: '',
      tasks: []
    };
    setSelectedDayInspector({ user, dayAlloc: alloc, dayCol: col });
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-4 w-full max-w-[1750px] mx-auto animate-in fade-in ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
      
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl border border-emerald-400 flex items-center gap-3 animate-in slide-in-from-bottom-3">
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
          <span className="font-bold text-xs sm:text-sm">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-emerald-700 text-xs font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* CLICKUP WORKLOAD TOOLBAR & FILTER RIBBON */}
      <WorkloadToolbar
        dateRangeLabel={dateRangeLabel}
        timescale={timescale}
        setTimescale={setTimescale}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isLight={isLight}
        onNavigateToday={handleNavigateToday}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        onOpenSettingsModal={() => setIsCapacityModalOpen(true)}
        meMode={meMode}
        setMeMode={setMeMode}
        showClosed={showClosed}
        setShowClosed={setShowClosed}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
        departments={departments}
        totalAllocatedHours={totalAllocatedHours}
        totalMaxHours={totalMaxHours}
        avgCapacityPercent={avgCapacityPercent}
        overloadedCount={overloadedCount}
      />

      {/* VIEW MODE 1: AUTHENTIC CLICKUP 4-WEEK WORKLOAD GRID (MATCHING SCREENSHOT) */}
      {viewMode === 'clickup_grid' && (
        <ClickUpWorkloadGrid
          days={days}
          userStats={filteredUserStats}
          isLight={isLight}
          onCellClick={handleCellClick}
          onUserClick={(user) => setSelectedUserModal(user)}
          onAddTaskToDay={handleAddTaskToDay}
          onTaskReassign={handleTaskReassign}
          onSelectTask={(task) => {
            // Can open task modal or handle selection
          }}
        />
      )}

      {/* VIEW MODE 2: INTENSITY MATRIX HEATMAP */}
      {viewMode === 'heatmap' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Resource Intensity Matrix ({filteredUserStats.length} members)</span>
            <span>Click card to inspect user allocations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredUserStats.map((stat) => {
              const { user, totalAllocatedHours, windowMaxHours, capacityPercent, isOverloaded, excessHours, tasks: userTasks } = stat;
              const heat = getHeatColor(capacityPercent, isLight);

              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserModal(user)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer transform hover:-translate-y-1 shadow-md relative overflow-hidden group ${
                    isOverloaded
                      ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                      : isLight
                      ? 'bg-white border-slate-200 hover:border-[#0096C7]'
                      : 'bg-[#16222F] border-[#233549] hover:border-[#0096C7]'
                  }`}
                >
                  {isOverloaded && (
                    <div className="absolute top-0 inset-x-0 bg-rose-600 text-white text-[9px] font-extrabold uppercase tracking-wider px-3 py-0.5 flex items-center justify-between shadow">
                      <span>OVERLOADED</span>
                      <span className="font-mono">+{excessHours}h</span>
                    </div>
                  )}

                  <div className={`flex items-start gap-3 ${isOverloaded ? 'pt-3' : ''}`}>
                    <div className="shrink-0">
                      <UserAvatar
                        name={user.name}
                        email={user.email}
                        role={user.role}
                        size="md"
                        theme={theme}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {user.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/40 text-teal-400 font-mono mt-1 inline-block border border-slate-700/30">
                        {user.department}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Capacity Usage:</span>
                      <span className={`px-2 py-0.2 rounded-md text-[10px] font-mono font-bold ${heat.badge}`}>
                        {capacityPercent}%
                      </span>
                    </div>

                    <div className="w-full bg-[#0D1520] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#233549]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${heat.bg}`}
                        style={{ width: `${Math.min(100, capacityPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                      <span>Allocated: <strong className={isOverloaded ? 'text-rose-400' : 'text-teal-400'}>{totalAllocatedHours}h</strong></span>
                      <span>Max: <strong>{windowMaxHours}h</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: DETAILED CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 px-1">
            Detailed Workload Cards ({filteredUserStats.length} members)
          </div>

          <div className="space-y-3">
            {filteredUserStats.map((stat) => {
              const { user, totalAllocatedHours, windowMaxHours, capacityPercent, isOverloaded, excessHours, tasks: userTasks } = stat;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-2xl border transition-all shadow-sm ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        <UserAvatar
                          name={user.name}
                          email={user.email}
                          role={user.role}
                          size="md"
                          theme={theme}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-200 dark:text-white flex items-center gap-2">
                          <span>{user.name}</span>
                          {isOverloaded && (
                            <span className="px-2 py-0.2 rounded bg-rose-600 text-white text-[9px] font-mono font-extrabold">
                              +{excessHours}h OVERLOAD
                            </span>
                          )}
                        </h4>
                        <div className="text-[10px] text-slate-400">
                          {user.role} • {user.department} • Rate: ${user.hourlyRate}/h
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="text-right">
                        <div className="text-slate-400 text-[10px]">Allocation</div>
                        <div className="font-bold text-teal-400">{totalAllocatedHours}h / {windowMaxHours}h ({capacityPercent}%)</div>
                      </div>

                      <button
                        onClick={() => setSelectedUserModal(user)}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY TASK INSPECTOR MODAL */}
      {selectedDayInspector && (
        <DayTaskDrawer
          isOpen={!!selectedDayInspector}
          onClose={() => setSelectedDayInspector(null)}
          user={selectedDayInspector.user}
          dayAlloc={selectedDayInspector.dayAlloc}
          dayCol={selectedDayInspector.dayCol}
          allUsers={users}
          projects={projects}
          isLight={isLight}
          onUpdateTask={updateTask}
          onAddTask={addTask}
          onReassignTask={handleTaskReassign}
        />
      )}

      {/* CAPACITY SETTINGS MODAL */}
      {isCapacityModalOpen && (
        <CapacitySettingsModal
          isOpen={isCapacityModalOpen}
          onClose={() => setIsCapacityModalOpen(false)}
          users={users}
          isLight={isLight}
          onUpdateUser={updateUser}
          onBatchUpdateMaxHours={handleBatchUpdateMaxHours}
        />
      )}
    </div>
  );
};
