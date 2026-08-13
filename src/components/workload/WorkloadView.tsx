import React, { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Flame,
  Filter,
  Grid,
  BarChart3,
  Calendar,
  Search,
  Info,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  GripVertical,
  Move,
  ArrowRight,
  Sparkles,
  Check,
  Sliders,
  Settings,
  Edit2,
  Plus,
  Minus,
  Save,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  X,
  UserCheck,
  Percent
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, Task } from '../../types';
import { getAccessibleTasks } from '../../lib/permissions';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { getStatusBadgeStyle } from '../../lib/statusUtils';

// Helper to determine the Teal-to-Red heat gradient based on capacity percentage
export interface HeatColor {
  bg: string;
  text: string;
  border: string;
  badge: string;
  hex: string;
  label: string;
  ring?: string;
}

export const getHeatColor = (percent: number, isLight: boolean): HeatColor => {
  if (percent === 0) {
    return {
      bg: isLight ? 'bg-teal-50' : 'bg-teal-950/30',
      text: isLight ? 'text-teal-700' : 'text-teal-400',
      border: isLight ? 'border-teal-200' : 'border-teal-800/40',
      badge: isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-900/60 text-teal-300 border-teal-700/50',
      hex: '#14b8a6',
      label: 'Unallocated (0%)'
    };
  }
  if (percent <= 50) {
    return {
      bg: isLight ? 'bg-teal-100/80' : 'bg-teal-900/50',
      text: isLight ? 'text-teal-900' : 'text-teal-200',
      border: isLight ? 'border-teal-300' : 'border-teal-700',
      badge: isLight ? 'bg-teal-200 text-teal-900 border-teal-400' : 'bg-teal-800/80 text-teal-200 border-teal-600',
      hex: '#0d9488',
      label: 'Light Load (1-50%)'
    };
  }
  if (percent <= 80) {
    return {
      bg: isLight ? 'bg-teal-500' : 'bg-teal-600',
      text: 'text-white',
      border: isLight ? 'border-teal-600' : 'border-teal-500',
      badge: isLight ? 'bg-teal-600 text-white border-teal-700' : 'bg-teal-500 text-white border-teal-400',
      hex: '#0284c7',
      label: 'Optimal Load (51-80%)'
    };
  }
  if (percent <= 95) {
    return {
      bg: isLight ? 'bg-amber-400' : 'bg-amber-500/90',
      text: isLight ? 'text-amber-950' : 'text-slate-950',
      border: isLight ? 'border-amber-500' : 'border-amber-400',
      badge: isLight ? 'bg-amber-200 text-amber-900 border-amber-400' : 'bg-amber-500/30 text-amber-200 border-amber-500/50',
      hex: '#f59e0b',
      label: 'High Capacity (81-95%)'
    };
  }
  if (percent <= 100) {
    return {
      bg: isLight ? 'bg-orange-500' : 'bg-orange-600',
      text: 'text-white',
      border: isLight ? 'border-orange-600' : 'border-orange-500',
      badge: isLight ? 'bg-orange-600 text-white border-orange-700' : 'bg-orange-500 text-white border-orange-400',
      hex: '#f97316',
      label: 'At Capacity (96-100%)'
    };
  }
  // OVERLOADED (>100%) -> Crimson Flashing Alert Intensity
  return {
    bg: isLight ? 'bg-rose-600' : 'bg-rose-600',
    text: 'text-white',
    border: isLight ? 'border-rose-700' : 'border-rose-500',
    ring: 'ring-4 ring-rose-500 animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.6)]',
    badge: 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400 animate-pulse font-extrabold',
    hex: '#e11d48',
    label: 'OVERLOADED (>100%)'
  };
};

// Days of work week
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const WorkloadView: React.FC = () => {
  const { users, tasks, projects, updateTask, updateUser, theme, currentUser } = useApp();
  const isLight = theme === 'light';

  const accessibleTasks = useMemo(() => {
    return getAccessibleTasks(currentUser, tasks, projects);
  }, [currentUser, tasks, projects]);

  // Local state for controls
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOverloadedOnly, setShowOverloadedOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'weekly' | 'cards'>('heatmap');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Manager Capacity Settings Modal & Inline Editing
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState<boolean>(false);
  const [inlineEditingUserId, setInlineEditingUserId] = useState<string | null>(null);
  const [tempMaxHours, setTempMaxHours] = useState<number>(40);

  // Drag and Drop state
  const [draggingTaskInfo, setDraggingTaskInfo] = useState<{
    taskId: string;
    title: string;
    hours: number;
    fromUserId: string;
  } | null>(null);
  const [dragOverUserId, setDragOverUserId] = useState<string | null>(null);
  const [reassignToast, setReassignToast] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  // Capacity Threshold Toast
  const [capacityToast, setCapacityToast] = useState<string | null>(null);

  // Quick reassign menu target task ID
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);

  // Departments list
  const departments = ['All', ...Array.from(new Set(users.map((u) => u.department || 'General')))];

  // Task Reassignment Handler
  const handleTaskReassign = (taskId: string, targetUserId: string, fromUserId?: string) => {
    const taskToMove = accessibleTasks.find((t) => t.id === taskId);
    if (!taskToMove) return;

    const targetUser = users.find((u) => u.id === targetUserId);
    const fromUser = users.find((u) => u.id === fromUserId);

    if (!targetUser) return;
    if (fromUserId === targetUserId) return;

    let newAssigneeIds = [...taskToMove.assigneeIds];
    if (fromUserId && newAssigneeIds.includes(fromUserId)) {
      newAssigneeIds = newAssigneeIds.filter((id) => id !== fromUserId);
      if (!newAssigneeIds.includes(targetUserId)) {
        newAssigneeIds.push(targetUserId);
      }
    } else {
      newAssigneeIds = [targetUserId];
    }

    updateTask(taskId, { assigneeIds: newAssigneeIds });

    const fromName = fromUser ? fromUser.name : 'previous assignee';
    setReassignToast({
      message: `Reassigned "${taskToMove.title}" (${taskToMove.estimatedHours || 0}h) from ${fromName} to ${targetUser.name}`,
      type: 'success'
    });

    setTimeout(() => {
      setReassignToast(null);
    }, 4500);
  };

  // Capacity Threshold Update Handler
  const handleUpdateUserMaxHours = (userId: string, newMaxHours: number) => {
    const clampedHours = Math.max(1, Math.min(100, newMaxHours));
    updateUser(userId, { maxWeeklyHours: clampedHours });
    const targetU = users.find((u) => u.id === userId);
    const name = targetU ? targetU.name : 'Team Member';
    setCapacityToast(`Updated max weekly threshold for ${name} to ${clampedHours} hours/week.`);
    setTimeout(() => setCapacityToast(null), 3500);
  };

  // Bulk Apply Max Weekly Hours
  const handleBatchUpdateMaxHours = (targetHours: number) => {
    users.forEach((u) => {
      updateUser(u.id, { maxWeeklyHours: targetHours });
    });
    setCapacityToast(`Set maximum weekly workload threshold to ${targetHours}h for all ${users.length} team members.`);
    setTimeout(() => setCapacityToast(null), 4000);
  };

  // Drag Event Handlers
  const handleDragStart = (e: React.DragEvent, task: Task, fromUserId: string) => {
    e.stopPropagation();
    const info = { taskId: task.id, title: task.title, hours: task.estimatedHours || 0, fromUserId };
    setDraggingTaskInfo(info);
    e.dataTransfer.setData('text/plain', JSON.stringify(info));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetUserId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverUserId !== targetUserId) {
      setDragOverUserId(targetUserId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetUserId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverUserId === targetUserId) {
      setDragOverUserId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetUserId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverUserId(null);

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed && parsed.taskId) {
          handleTaskReassign(parsed.taskId, targetUserId, parsed.fromUserId);
        }
      } else if (draggingTaskInfo) {
        handleTaskReassign(draggingTaskInfo.taskId, targetUserId, draggingTaskInfo.fromUserId);
      }
    } catch (err) {
      if (draggingTaskInfo) {
        handleTaskReassign(draggingTaskInfo.taskId, targetUserId, draggingTaskInfo.fromUserId);
      }
    }
    setDraggingTaskInfo(null);
  };

  const handleDragEnd = () => {
    setDraggingTaskInfo(null);
    setDragOverUserId(null);
  };

  // Process user workload statistics
  const userStats = users.map((u) => {
    const userTasks = accessibleTasks.filter((t) => t.assigneeIds.includes(u.id) && t.status !== 'Done');
    const totalAssignedHours = userTasks.reduce((acc, curr) => acc + (curr.estimatedHours || 0), 0);
    const maxHours = u.maxWeeklyHours || 40;
    const capacityPercent = Math.round((totalAssignedHours / maxHours) * 100);
    const isOverloaded = capacityPercent > 100;
    const excessHours = Math.max(0, totalAssignedHours - maxHours);

    // Estimate daily distribution (Mon - Fri) based on task due dates or equal split
    const dailyHours = WEEK_DAYS.map((_, dayIdx) => {
      const dayTasks = userTasks.filter((t, tIdx) => (tIdx % 5) === dayIdx || t.dueDate?.includes(WEEK_DAYS[dayIdx].substring(0, 3)));
      const dayHoursSum = dayTasks.length > 0 
        ? dayTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
        : Math.round((totalAssignedHours / 5) * (0.8 + (dayIdx % 3) * 0.2));
      const dailyMaxHours = maxHours / 5;
      const dailyCapPercent = Math.round((dayHoursSum / dailyMaxHours) * 100);
      return {
        day: WEEK_DAYS[dayIdx],
        hours: dayHoursSum,
        percent: dailyCapPercent,
        isDayOverloaded: dailyCapPercent > 100,
        taskCount: dayTasks.length
      };
    });

    return {
      user: u,
      tasks: userTasks,
      totalAssignedHours,
      maxHours,
      capacityPercent,
      isOverloaded,
      excessHours,
      dailyHours,
      heat: getHeatColor(capacityPercent, isLight)
    };
  });

  // Filtered stats
  const filteredUserStats = userStats.filter((stat) => {
    const matchesDept = selectedDept === 'All' || (stat.user.department || 'General') === selectedDept;
    const matchesSearch = stat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stat.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stat.user.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOverloaded = !showOverloadedOnly || stat.isOverloaded;
    return matchesDept && matchesSearch && matchesOverloaded;
  });

  // Overloaded count & general summary
  const overloadedCount = userStats.filter((s) => s.isOverloaded).length;
  const totalAllocatedHours = userStats.reduce((acc, s) => acc + s.totalAssignedHours, 0);
  const totalMaxHours = userStats.reduce((acc, s) => acc + s.maxHours, 0);
  const avgCapacityPercent = totalMaxHours > 0 ? Math.round((totalAllocatedHours / totalMaxHours) * 100) : 0;

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
      
      {/* Active Drag Indicator Banner */}
      {draggingTaskInfo && (
        <div className="sticky top-2 z-40 p-3.5 rounded-2xl bg-teal-600 text-white shadow-2xl border-2 border-teal-300 flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <Move className="w-5 h-5 animate-spin" />
            <div>
              <div className="font-bold text-sm">
                Dragging Task: "{draggingTaskInfo.title}" ({draggingTaskInfo.hours}h)
              </div>
              <div className="text-xs text-teal-100">
                Drop onto any team member heatmap card to reassign immediately.
              </div>
            </div>
          </div>
          <button
            onClick={() => setDraggingTaskInfo(null)}
            className="px-3 py-1 rounded-xl bg-teal-800 hover:bg-teal-900 text-xs font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Toast Notifications */}
      {reassignToast && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl border border-emerald-400 flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="font-bold text-xs sm:text-sm">{reassignToast.message}</span>
          </div>
          <button
            onClick={() => setReassignToast(null)}
            className="p-1 rounded-lg hover:bg-emerald-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {capacityToast && (
        <div className="p-4 rounded-2xl bg-teal-700 text-white shadow-2xl border border-teal-400 flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-teal-200 animate-pulse" />
            <span className="font-bold text-xs sm:text-sm">{capacityToast}</span>
          </div>
          <button
            onClick={() => setCapacityToast(null)}
            className="p-1 rounded-lg hover:bg-teal-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isLight ? 'bg-teal-50 text-teal-600 border border-teal-200' : 'bg-teal-950/80 text-teal-400 border border-teal-800/60'}`}>
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>Resource Workload & Heatmap Intensity</span>
              </h1>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Real-time capacity tracking, manager maximum weekly hour thresholds & drag-and-drop task rebalancing.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Overview Stat Badges */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Manager Capacity Threshold Settings Trigger Button */}
          <button
            onClick={() => setIsCapacityModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-teal-500/20 transition-all cursor-pointer transform active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Set Max Weekly Hours</span>
            <span className="px-1.5 py-0.5 rounded-md bg-teal-800 text-[10px] font-mono">{users.length} members</span>
          </button>

          <div className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2.5 text-xs ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F]/90 border-[#233549]'
          }`}>
            <Clock className="w-4 h-4 text-teal-500" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Allocation</div>
              <div className="font-bold text-sm font-mono">{totalAllocatedHours}h / {totalMaxHours}h ({avgCapacityPercent}%)</div>
            </div>
          </div>

          <div className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2.5 text-xs ${
            overloadedCount > 0 
              ? 'bg-rose-950/60 border-rose-500 text-rose-100 ring-2 ring-rose-500/80 animate-pulse'
              : (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200')
          }`}>
            <AlertTriangle className={`w-4 h-4 ${overloadedCount > 0 ? 'text-rose-400 animate-bounce' : 'text-emerald-500'}`} />
            <div>
              <div className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Exceeding Capacity</div>
              <div className="font-bold text-sm font-mono flex items-center gap-1">
                <span>{overloadedCount} {overloadedCount === 1 ? 'member' : 'members'}</span>
                {overloadedCount > 0 && <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full uppercase">Alert</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Rebalancing Instruction Banner */}
      <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
        isLight ? 'bg-teal-50/80 border-teal-200 text-teal-900' : 'bg-teal-950/30 border-teal-800/50 text-teal-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <Move className="w-4 h-4 text-teal-500 shrink-0" />
          <span>
            <strong>Manager Controls:</strong> Click <strong>"Set Max Weekly Hours"</strong> to configure per-user threshold limits. Users exceeding their defined max weekly hours are flagged on the heatmap with a <strong>pulsating crimson alert effect</strong>.
          </span>
        </div>
      </div>

      {/* Heatmap Color Scale Indicator Legend */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F]/90 border-[#233549]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Flame className="w-4 h-4 text-teal-500" />
            <span>Resource Intensity Scale (Teal → Yellow → Orange → Pulsating Red Alert)</span>
          </div>
          <span className="text-[11px] text-slate-400">Pulsating crimson indicates team members exceeding defined max weekly hours threshold</span>
        </div>

        {/* Gradient Bar with step markers */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded-full overflow-hidden p-0.5 border border-slate-700/20 bg-slate-900/10 flex">
            <div className="h-full w-1/5 bg-teal-500/90 flex items-center justify-center text-[10px] font-bold text-white transition-all hover:opacity-90 cursor-default" title="0 - 50% Capacity (Teal)">0 - 50%</div>
            <div className="h-full w-1/5 bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white transition-all hover:opacity-90 cursor-default" title="51 - 80% Capacity (Optimal)">51 - 80%</div>
            <div className="h-full w-1/5 bg-amber-400 flex items-center justify-center text-[10px] font-bold text-slate-950 transition-all hover:opacity-90 cursor-default" title="81 - 95% Capacity (High Load)">81 - 95%</div>
            <div className="h-full w-1/5 bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white transition-all hover:opacity-90 cursor-default" title="96 - 100% Capacity (At Limit)">96 - 100%</div>
            <div className="h-full w-1/5 bg-rose-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-rose-400 transition-all hover:opacity-90 cursor-default animate-pulse shadow-[0_0_12px_rgba(225,29,72,0.8)]" title=">100% Capacity (CRITICAL ALERT - Exceeding Max Hours Threshold)">&gt;100% OVERLOAD</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] pt-1">
            <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
              <span>Light Load (0-50%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
              <span>Optimal (51-80%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>High Load (81-95%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>At Capacity (96-100%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-extrabold animate-pulse">
              <span className="w-3 h-3 rounded-full bg-rose-600 ring-2 ring-rose-400 animate-ping"></span>
              <span>Exceeding Threshold (&gt;100%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Overload Warning Alert Banner */}
      {overloadedCount > 0 && (
        <div className="p-4 rounded-2xl border border-rose-500/80 bg-rose-950/70 text-rose-100 shadow-[0_0_25px_rgba(225,29,72,0.4)] ring-2 ring-rose-500/60 animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5 animate-bounce shadow-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2 text-white">
                <span>Threshold Alert: {overloadedCount} {overloadedCount === 1 ? 'Team Member' : 'Team Members'} Exceeding Max Weekly Hours</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-rose-600 text-white font-mono animate-pulse">ACTION REQUIRED</span>
              </h3>
              <p className="text-xs text-rose-200 mt-0.5">
                The heatmap below is actively highlighting members with assigned tasks beyond their defined weekly capacity limit. Drag task cards onto members with available teal capacity to resolve bottlenecks.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {userStats.filter((s) => s.isOverloaded).map((s) => (
                  <button
                    key={s.user.id}
                    onClick={() => setSelectedUser(s.user)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-rose-900/80 hover:bg-rose-800 border border-rose-400/60 text-white font-medium transition-all shadow"
                  >
                    <img src={s.user.avatar} alt="" className="w-4 h-4 rounded-full ring-1 ring-rose-300" />
                    <span>{s.user.name}</span>
                    <span className="font-mono font-bold text-rose-200 bg-rose-700/80 px-1.5 py-0.2 rounded">
                      {s.totalAssignedHours}h / {s.maxHours}h (+{s.excessHours}h)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCapacityModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-rose-950 hover:bg-rose-100 transition-all shadow flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-600" />
              <span>Adjust Thresholds</span>
            </button>
            <button
              onClick={() => setShowOverloadedOnly(!showOverloadedOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                showOverloadedOnly
                  ? 'bg-rose-600 text-white border border-rose-400'
                  : 'bg-rose-900/60 hover:bg-rose-800 text-white border border-rose-500/50'
              }`}
            >
              {showOverloadedOnly ? 'Show All Members' : 'Filter Overloaded Only'}
            </button>
          </div>
        </div>
      )}

      {/* Filter and View Toggle Toolbar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F]/90 border-[#233549]'
      }`}>
        
        {/* Search & Department Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search team member or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-500 focus:bg-white' 
                  : 'bg-[#0D1520] border-[#233549] text-slate-200 focus:border-teal-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={`w-full sm:w-auto px-3 py-2 rounded-xl text-xs border outline-none cursor-pointer ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800' 
                  : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  Dept: {dept}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={showOverloadedOnly}
              onChange={(e) => setShowOverloadedOnly(e.target.checked)}
              className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
            />
            <span className={showOverloadedOnly ? 'text-rose-500 font-bold flex items-center gap-1' : ''}>
              {showOverloadedOnly && <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />}
              Only Overloaded
            </span>
          </label>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D1520] border border-[#233549] self-start md:self-auto">
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'heatmap'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Intensity Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'weekly'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekly Heatmap</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cards'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Detailed Cards</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTENSITY MATRIX HEATMAP GRID */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Team Resource Heatmap Blocks ({filteredUserStats.length} members)</span>
            <span>Click pencil to edit max weekly capacity inline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredUserStats.map((stat) => {
              const { user, totalAssignedHours, maxHours, capacityPercent, isOverloaded, excessHours, heat, tasks: userTasks } = stat;
              const isDropTarget = dragOverUserId === user.id;

              return (
                <div
                  key={user.id}
                  onDragOver={(e) => handleDragOver(e, user.id)}
                  onDragLeave={(e) => handleDragLeave(e, user.id)}
                  onDrop={(e) => handleDrop(e, user.id)}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer transform hover:-translate-y-1 shadow-md relative overflow-hidden group ${
                    isDropTarget
                      ? 'ring-4 ring-teal-400 bg-teal-500/20 border-teal-400 shadow-2xl scale-[1.02]'
                      : isOverloaded
                      ? 'bg-rose-950/70 border-rose-500 ring-4 ring-rose-500 shadow-[0_0_25px_rgba(225,29,72,0.5)] animate-pulse'
                      : isLight
                      ? 'bg-white border-slate-200 hover:border-teal-500'
                      : 'bg-[#16222F] border-[#233549] hover:border-teal-500'
                  }`}
                >
                  {/* Drop Target Visual Overlay */}
                  {isDropTarget && (
                    <div className="absolute inset-0 z-30 bg-teal-600/30 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center border-2 border-dashed border-teal-300 rounded-2xl animate-pulse">
                      <Move className="w-8 h-8 text-teal-200 animate-bounce mb-1" />
                      <div className="font-bold text-xs text-white">Drop to Reassign Task</div>
                      <div className="text-[10px] text-teal-100">Assign to {user.name}</div>
                    </div>
                  )}

                  {/* Overloaded Pulsating Alert Top Stripe */}
                  {isOverloaded && !isDropTarget && (
                    <div className="absolute top-0 inset-x-0 bg-rose-600 text-white text-[9.5px] font-extrabold uppercase tracking-widest px-3 py-1 flex items-center justify-between shadow-lg animate-pulse">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-yellow-300 animate-bounce" />
                        OVERLOADED: Exceeding Threshold
                      </span>
                      <span className="font-mono bg-rose-800 px-1.5 py-0.2 rounded text-[9px]">+ {excessHours}h</span>
                    </div>
                  )}

                  <div className={`flex items-start gap-3 ${isOverloaded ? 'pt-4' : ''}`}>
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className={`w-12 h-12 rounded-xl object-cover ring-2 ${
                          isOverloaded ? 'ring-rose-500 ring-offset-2 ring-offset-rose-950' : 'ring-teal-500'
                        }`}
                      />
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                        isLight ? 'border-white' : 'border-[#16222F]'
                      } ${isOverloaded ? 'bg-rose-600 animate-ping' : 'bg-teal-500'}`}></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {user.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">{user.role}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/40 text-teal-400 font-mono mt-1 inline-block border border-slate-700/30">
                        {user.department || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Heatmap Cell Display Block */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Capacity Usage:</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${heat.badge} ${isOverloaded ? 'animate-pulse' : ''}`}>
                        {capacityPercent}%
                      </span>
                    </div>

                    {/* Color Intensity Bar */}
                    <div className="w-full bg-[#0D1520] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#233549] relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${heat.bg} ${isOverloaded ? 'animate-pulse' : ''}`}
                        style={{ width: `${Math.min(100, capacityPercent)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                      <span>Assigned: <strong className={isOverloaded ? 'text-rose-400 font-bold' : 'text-teal-400'}>{totalAssignedHours}h</strong></span>
                      
                      {/* Inline Capacity Edit trigger */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setInlineEditingUserId(inlineEditingUserId === user.id ? null : user.id);
                          setTempMaxHours(maxHours);
                        }}
                        className="flex items-center gap-1 text-slate-300 hover:text-teal-400 cursor-pointer bg-slate-800/40 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50 transition-colors"
                        title="Click to change max weekly hours threshold"
                      >
                        <span>Max: <strong>{maxHours}h</strong></span>
                        <Edit2 className="w-3 h-3 text-teal-400" />
                      </div>
                    </div>

                    {/* Inline Capacity Edit Popover */}
                    {inlineEditingUserId === user.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="p-3 rounded-xl bg-slate-900 border border-teal-500 shadow-2xl space-y-2 animate-in zoom-in-95"
                      >
                        <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Set Max Hours ({user.name})</span>
                          <button onClick={() => setInlineEditingUserId(null)} className="text-slate-400 hover:text-white">&times;</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={tempMaxHours}
                            onChange={(e) => setTempMaxHours(Number(e.target.value))}
                            className="w-20 px-2 py-1 rounded bg-slate-950 border border-teal-600 text-white text-xs font-mono font-bold text-center outline-none"
                          />
                          <span className="text-xs text-slate-400 font-mono">hrs/wk</span>
                          <button
                            onClick={() => {
                              handleUpdateUserMaxHours(user.id, tempMaxHours);
                              setInlineEditingUserId(null);
                            }}
                            className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
                          >
                            Save
                          </button>
                        </div>
                        <div className="flex gap-1 pt-1">
                          {[30, 35, 40, 45, 50].map((h) => (
                            <button
                              key={h}
                              onClick={() => {
                                handleUpdateUserMaxHours(user.id, h);
                                setInlineEditingUserId(null);
                              }}
                              className={`flex-1 text-[10px] py-0.5 rounded font-mono ${tempMaxHours === h ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                            >
                              {h}h
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Draggable Task Chips in Matrix Grid */}
                    <div className="pt-2 border-t border-slate-700/20 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Active Tasks ({userTasks.length})</span>
                        <span className="text-teal-400 font-semibold text-[9px]">⋮⋮ Drag to move</span>
                      </div>

                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {userTasks.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, t, user.id)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => e.stopPropagation()}
                            className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing transition-all hover:border-teal-400 ${
                              isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <GripVertical className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate font-medium">{getDisplayTaskTitle(t)}</span>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-teal-400 shrink-0">
                              {t.estimatedHours || 0}h
                            </span>
                          </div>
                        ))}
                        {userTasks.length > 3 && (
                          <div className="text-[10px] text-slate-400 text-center italic font-mono pt-0.5">
                            +{userTasks.length - 3} more tasks
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY HEATMAP MATRIX (Mon - Fri Days Breakdown) */}
      {activeTab === 'weekly' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F]/90 border-[#233549]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/20 pb-3">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" />
                <span>Weekly Resource Intensity Heatmap (Mon - Fri)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Daily estimated workload intensity vs team members' defined maximum weekly hours.
              </p>
            </div>
            <div className="text-xs text-teal-400 font-mono flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5" />
              <span>Drag & drop rows supported</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-slate-400 font-mono ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#233549] bg-[#0D1520]'}`}>
                  <th className="p-3 font-semibold">Team Member</th>
                  <th className="p-3 font-semibold">Weekly Capacity Threshold</th>
                  {WEEK_DAYS.map((day) => (
                    <th key={day} className="p-3 font-semibold text-center">{day}</th>
                  ))}
                  <th className="p-3 font-semibold text-center">Heatmap Alert Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {filteredUserStats.map((stat) => {
                  const { user, totalAssignedHours, maxHours, capacityPercent, isOverloaded, excessHours, dailyHours } = stat;
                  const isDropTarget = dragOverUserId === user.id;

                  return (
                    <tr
                      key={user.id}
                      onDragOver={(e) => handleDragOver(e, user.id)}
                      onDragLeave={(e) => handleDragLeave(e, user.id)}
                      onDrop={(e) => handleDrop(e, user.id)}
                      className={`transition-all ${
                        isDropTarget 
                          ? 'bg-teal-500/20 border-2 border-teal-400' 
                          : isOverloaded
                          ? 'bg-rose-950/40 border-l-4 border-l-rose-500 hover:bg-rose-950/60'
                          : 'hover:bg-slate-500/5'
                      }`}
                    >
                      {/* User Info */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar}
                            alt=""
                            className={`w-8 h-8 rounded-lg object-cover ring-1 ${isOverloaded ? 'ring-rose-500 ring-2' : 'ring-teal-500'}`}
                          />
                          <div>
                            <div className="font-bold text-slate-200 dark:text-white flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isOverloaded && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />}
                            </div>
                            <div className="text-[10px] text-slate-400">{user.role} • {user.department}</div>
                          </div>
                        </div>
                      </td>

                      {/* Total Allocation & Max Hours Edit */}
                      <td className="p-3 font-mono">
                        <div className="font-bold flex items-center gap-1.5">
                          <span className={isOverloaded ? 'text-rose-400 font-extrabold' : 'text-teal-400'}>
                            {totalAssignedHours}h
                          </span>
                          <span className="text-slate-500">/</span>
                          <button
                            onClick={() => {
                              const newMax = prompt(`Enter max weekly hours threshold for ${user.name}:`, String(maxHours));
                              if (newMax) {
                                handleUpdateUserMaxHours(user.id, Number(newMax));
                              }
                            }}
                            className="text-slate-300 hover:text-teal-400 border-b border-dashed border-slate-600 px-1 hover:border-teal-400"
                            title="Click to edit max threshold"
                          >
                            {maxHours}h max
                          </button>
                        </div>
                        <div className={`text-[10px] ${isOverloaded ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                          {capacityPercent}% Cap {isOverloaded ? `(+${excessHours}h over limit)` : ''}
                        </div>
                      </td>

                      {/* Day Heatmap Cells */}
                      {dailyHours.map((dh, idx) => {
                        const dayHeat = getHeatColor(dh.percent, isLight);
                        return (
                          <td key={idx} className="p-2 text-center">
                            <div
                              title={`${user.name} - ${dh.day}: ${dh.hours} hours assigned (${dh.percent}% daily load)`}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-mono transform hover:scale-105 shadow-sm ${
                                dh.isDayOverloaded ? 'ring-2 ring-rose-500 animate-pulse bg-rose-600 text-white font-bold' : dayHeat.bg + ' ' + dayHeat.text + ' ' + dayHeat.border
                              }`}
                            >
                              <div className="font-bold text-xs">{dh.hours}h</div>
                              <div className="text-[9px] opacity-80">{dh.percent}%</div>
                            </div>
                          </td>
                        );
                      })}

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono inline-flex items-center gap-1 ${
                          isOverloaded 
                            ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400' 
                            : capacityPercent > 80 
                            ? 'bg-amber-400 text-slate-950' 
                            : 'bg-teal-600 text-white'
                        }`}>
                          {isOverloaded && <Flame className="w-3 h-3 text-yellow-300 animate-bounce" />}
                          {isOverloaded ? `CRITICAL (+${excessHours}h)` : `${capacityPercent}% Cap`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DETAILED CAPACITY CARDS VIEW WITH DRAGGABLE TASKS */}
      {(activeTab === 'cards') && (
        <div className="space-y-4 pt-2">
          <div className="text-xs font-semibold text-slate-400 px-1">
            Detailed Workload Cards ({filteredUserStats.length} members)
          </div>

          <div className="space-y-4">
            {filteredUserStats.map((stat) => {
              const { user, totalAssignedHours, maxHours, capacityPercent, isOverloaded, excessHours, heat, tasks: userTasks } = stat;
              const isDropTarget = dragOverUserId === user.id;

              return (
                <div
                  key={user.id}
                  onDragOver={(e) => handleDragOver(e, user.id)}
                  onDragLeave={(e) => handleDragLeave(e, user.id)}
                  onDrop={(e) => handleDrop(e, user.id)}
                  className={`p-5 rounded-2xl border transition-all space-y-4 shadow-xl relative ${
                    isDropTarget
                      ? 'ring-4 ring-teal-400 bg-teal-500/20 border-teal-400 shadow-2xl scale-[1.01]'
                      : isOverloaded
                      ? 'bg-rose-950/50 border-rose-500 ring-4 ring-rose-500/80 shadow-[0_0_20px_rgba(225,29,72,0.4)] animate-pulse'
                      : isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-[#16222F]/80 border-[#233549] hover:border-[#0773BB]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className={`w-12 h-12 rounded-2xl object-cover ring-2 ${
                          isOverloaded ? 'ring-rose-500 ring-offset-2 ring-offset-rose-950' : 'ring-teal-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-[#0D1520] text-[#3BC0BB] border border-[#233549] font-mono">
                            {user.role}
                          </span>
                          {isOverloaded && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold animate-pulse flex items-center gap-1 shadow">
                              <AlertTriangle className="w-3.5 h-3.5" /> Exceeding Max Capacity (+{excessHours}h)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          {user.email} • {user.department || 'General'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <div className="text-slate-400">Allocated / Weekly Max Limit</div>
                        <div className="font-bold flex items-center justify-end gap-1">
                          <span className={isOverloaded ? 'text-rose-400 font-extrabold text-sm' : 'text-[#3BC0BB]'}>
                            {totalAssignedHours}h
                          </span>{' '}
                          /
                          <button
                            onClick={() => {
                              const val = prompt(`Change weekly threshold for ${user.name}:`, String(maxHours));
                              if (val) handleUpdateUserMaxHours(user.id, Number(val));
                            }}
                            className="hover:text-teal-400 border-b border-dashed border-slate-600 px-1"
                          >
                            {maxHours}h max
                          </button>
                        </div>
                      </div>

                      {/* Heatmap intensity badge */}
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${heat.badge} ${heat.ring || ''}`}>
                        {capacityPercent}% Capacity
                      </span>
                    </div>
                  </div>

                  {/* Gradient Heatmap Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Load Level: {heat.label}</span>
                      <span className={isOverloaded ? 'text-rose-400 font-bold' : 'text-teal-400'}>
                        {totalAssignedHours} hrs assigned
                      </span>
                    </div>

                    <div className="w-full bg-[#0D1520] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#233549]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${heat.bg} ${isOverloaded ? 'animate-pulse' : ''}`}
                        style={{ width: `${Math.min(100, capacityPercent)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Active Tasks Assigned list with Drag Handles */}
                  <div className="pt-2 border-t border-[#233549]">
                    <div className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>Active Tasks Assigned ({userTasks.length})</span>
                        <span className="text-[10px] text-teal-400 font-normal">⋮⋮ Drag task to reassign</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Estimated duration total: {totalAssignedHours} hours</span>
                    </div>

                    {userTasks.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-2 border-2 border-dashed border-slate-700/40 rounded-xl text-center">
                        No active tasks assigned. Drop tasks here to assign work to {user.name}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {userTasks.map((t) => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, t, user.id)}
                            onDragEnd={handleDragEnd}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all cursor-grab active:cursor-grabbing hover:border-teal-400 group/card relative ${
                              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 font-bold truncate text-slate-200 dark:text-white">
                                <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover/card:text-teal-400 shrink-0" />
                                <span className="truncate">{getDisplayTaskTitle(t)}</span>
                              </div>

                              {/* Quick Reassign Dropdown Selector */}
                              <div className="relative shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReassigningTaskId(reassigningTaskId === t.id ? null : t.id);
                                  }}
                                  title="Quick Reassign"
                                  className="p-1 rounded bg-slate-800/60 text-slate-400 hover:text-teal-300 text-[10px] flex items-center gap-0.5"
                                >
                                  <span>Reassign</span>
                                  <ChevronDown className="w-2.5 h-2.5" />
                                </button>

                                {reassigningTaskId === t.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-6 z-50 w-48 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-1 text-xs"
                                  >
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                                      Reassign to:
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                                      {users.map((targetU) => (
                                        <button
                                          key={targetU.id}
                                          onClick={() => {
                                            handleTaskReassign(t.id, targetU.id, user.id);
                                            setReassigningTaskId(null);
                                          }}
                                          disabled={targetU.id === user.id}
                                          className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between gap-2 transition-colors ${
                                            targetU.id === user.id
                                              ? 'opacity-40 cursor-not-allowed text-slate-500'
                                              : 'hover:bg-teal-600 hover:text-white text-slate-200'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 truncate">
                                            <img src={targetU.avatar} alt="" className="w-3.5 h-3.5 rounded-full" />
                                            <span className="truncate">{targetU.name}</span>
                                          </div>
                                          {targetU.id === user.id && <Check className="w-3 h-3 text-teal-400" />}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span>Est: {t.estimatedHours || 0}h</span>
                              <span className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold ${getStatusBadgeStyle(t.status, theme === 'light')}`}>{t.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MANAGER CAPACITY SETTINGS MODAL */}
      {isCapacityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-3xl p-6 rounded-3xl border shadow-2xl space-y-6 max-h-[90vh] flex flex-col ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-700/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-600 text-white shadow-lg">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>Manager Capacity & Maximum Weekly Hours Settings</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define maximum weekly working hours per team member to monitor workload intensity and flag overloaded resources on heatmaps.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCapacityModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Bulk Batch Action Controls */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div>
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">Batch Capacity Presets</div>
                <div className="text-[11px] text-slate-400">Apply standard weekly capacity hours to all team members at once</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBatchUpdateMaxHours(35)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                >
                  Set All to 35h
                </button>
                <button
                  onClick={() => handleBatchUpdateMaxHours(40)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow transition-all"
                >
                  Set All to 40h (Std)
                </button>
                <button
                  onClick={() => handleBatchUpdateMaxHours(45)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                >
                  Set All to 45h
                </button>
              </div>
            </div>

            {/* Members Capacity List Table */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Team Member Capacities ({users.length} members)
              </div>

              <div className="space-y-2">
                {users.map((u) => {
                  const stat = userStats.find((s) => s.user.id === u.id);
                  const assigned = stat ? stat.totalAssignedHours : 0;
                  const maxH = u.maxWeeklyHours || 40;
                  const isOver = assigned > maxH;
                  const pct = Math.round((assigned / maxH) * 100);

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isOver
                          ? 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/40'
                          : isLight
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-[#0D1520] border-[#233549]'
                      }`}
                    >
                      {/* User details */}
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt="" className="w-10 h-10 rounded-xl object-cover ring-1 ring-teal-500" />
                        <div>
                          <div className="font-bold text-sm text-slate-200 dark:text-white flex items-center gap-2">
                            <span>{u.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-mono">
                              {u.role}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {u.department || 'General'} • Current assigned: <strong className={isOver ? 'text-rose-400' : 'text-teal-400'}>{assigned}h</strong>
                          </div>
                        </div>
                      </div>

                      {/* Threshold Controls */}
                      <div className="flex items-center gap-3 sm:justify-end">
                        
                        {/* Status pill */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          isOver ? 'bg-rose-600 text-white animate-pulse' : 'bg-teal-900/60 text-teal-300 border border-teal-700/60'
                        }`}>
                          {isOver ? `OVERLOAD (+${assigned - maxH}h)` : `${pct}% Load`}
                        </span>

                        {/* Numeric Input & Steppers */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                          <button
                            onClick={() => handleUpdateUserMaxHours(u.id, maxH - 5)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="-5 hours"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center px-1">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={maxH}
                              onChange={(e) => handleUpdateUserMaxHours(u.id, Number(e.target.value))}
                              className="w-12 text-center text-xs font-mono font-bold text-teal-400 bg-transparent outline-none"
                            />
                            <span className="text-[10px] text-slate-400 font-mono">h/wk</span>
                          </div>

                          <button
                            onClick={() => handleUpdateUserMaxHours(u.id, maxH + 5)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="+5 hours"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-700/20 pt-4">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-400" />
                <span>Threshold changes immediately update heatmap alert visualizations.</span>
              </div>

              <button
                onClick={() => setIsCapacityModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-lg transition-all"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* USER DETAIL MODAL WITH DRAGGABLE ACTIVE TASKS */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl space-y-5 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={selectedUser.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-500" />
                <div>
                  <h2 className="text-lg font-bold">{selectedUser.name}</h2>
                  <p className="text-xs text-slate-400">{selectedUser.role} • {selectedUser.department}</p>
                  <p className="text-xs text-teal-500 font-mono mt-0.5">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-full bg-slate-800/40 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            {/* User Capacity Heat Status */}
            {(() => {
              const userStat = userStats.find((s) => s.user.id === selectedUser.id);
              if (!userStat) return null;

              return (
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${userStat.heat.bg} ${userStat.heat.text} ${userStat.heat.border}`}>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">Capacity Status</div>
                      <div className="text-lg font-bold">{userStat.heat.label}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-2xl font-bold">{userStat.capacityPercent}%</div>
                      <div className="text-xs opacity-90">{userStat.totalAssignedHours}h / {userStat.maxHours}h max</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span>Assigned Active Tasks ({userStat.tasks.length})</span>
                      <span className="text-[10px] text-teal-400">Reassign tasks below</span>
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {userStat.tasks.map((t) => (
                        <div key={t.id} className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                        }`}>
                          <div>
                            <div className="font-bold text-slate-200 dark:text-white flex items-center gap-1">
                              <GripVertical className="w-3 h-3 text-slate-500" />
                              <span>{getDisplayTaskTitle(t)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 pl-4">{t.status} • Priority: {t.priority || 'Medium'}</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-teal-400 text-xs shrink-0">
                              {t.estimatedHours || 0} hrs
                            </span>

                            {/* Quick reassign select inside modal */}
                            <select
                              value={selectedUser.id}
                              onChange={(e) => {
                                handleTaskReassign(t.id, e.target.value, selectedUser.id);
                              }}
                              className="px-2 py-1 rounded text-[11px] bg-slate-800 text-slate-200 border border-slate-700 outline-none"
                            >
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} {u.id === selectedUser.id ? '(Current)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
