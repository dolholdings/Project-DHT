import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Circle,
  CheckCircle2,
  Clock,
  Play,
  Square,
  ArrowUpDown,
  User as UserIcon,
  Calendar,
  Sparkles,
  Repeat,
  Sliders,
  MoreHorizontal,
  Trash2,
  Tag,
  Check,
  AlertTriangle,
  Flame,
  Zap,
  Activity,
  Layers,
  Percent,
  SlidersHorizontal,
  X,
  Flag,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, Priority, User, CustomFieldDefinition } from '../../types';
import { TaskQuickPreviewPopover } from './TaskQuickPreviewPopover';
import { AssigneePicker } from './AssigneePicker';
import { PriorityBadge } from '../common/PriorityBadge';
import { PriorityPicker } from './PriorityPicker';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { calculatePriorityScore } from '../../lib/priorityScore';
import { TaskInteractiveProgressBar } from './TaskInteractiveProgressBar';
import { canModifyDueDate, canDeleteTask } from '../../lib/permissions';
import { TeamMemberRightsModal } from './TeamMemberRightsModal';

interface ClickUpGroupedListViewProps {
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  selectedTaskId: string | null;
  onOpenCustomFieldsModal: () => void;
  onOpenCreateTaskModal: () => void;
}

type SortField = 'name' | 'createdAt' | 'dueDate' | 'priority' | 'status' | 'progress';
type SortDirection = 'asc' | 'desc';

// Helper to format created dates cleanly like ClickUp (e.g., '2/25/26' or '2 days ago')
const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '–';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} days ago`;

    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  } catch {
    return dateStr;
  }
};

// Helper to resolve task completion percentage
export const getTaskProgress = (task: Task): number => {
  if (task.progress !== undefined && task.progress !== null) {
    return Math.max(0, Math.min(100, Math.round(task.progress)));
  }
  if (task.customFields?.progress !== undefined && task.customFields?.progress !== null) {
    const p = Number(task.customFields.progress);
    if (!isNaN(p)) return Math.max(0, Math.min(100, Math.round(p)));
  }
  if (task.status === 'Done') return 100;
  if (task.subtaskCount && task.subtaskCount > 0) {
    return Math.round(((task.completedSubtasks || 0) / task.subtaskCount) * 100);
  }
  if (task.estimatedHours && task.estimatedHours > 0 && task.loggedHours > 0) {
    return Math.min(100, Math.round((task.loggedHours / task.estimatedHours) * 100));
  }
  if (task.status === 'In Progress') return 35;
  if (task.status === 'In Review') return 75;
  return 0;
};

interface StatusGroupConfig {
  key: string;
  label: string;
  statusMatch: TaskStatus[];
  defaultStatus: TaskStatus;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  icon: React.ReactNode;
}

export const ClickUpGroupedListView: React.FC<ClickUpGroupedListViewProps> = ({
  tasks,
  onSelectTask,
  selectedTaskId,
  onOpenCustomFieldsModal,
  onOpenCreateTaskModal
}) => {
  const {
    users,
    projects,
    updateTask,
    addTask,
    deleteTask,
    startTimer,
    stopTimer,
    timer,
    theme,
    customFields,
    dependencies,
    currentUser,
    selectedProjectId
  } = useApp();

  const isLight = theme === 'light';

  // Group Collapsing States
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    complete: false,
    update_required: false,
    in_progress: false,
    to_do: false,
    backlog: false
  });

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Inline Add Task State
  const [inlineAddStatus, setInlineAddStatus] = useState<TaskStatus | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');

  // Status Dropdown open state per task
  const [activeStatusDropdownTaskId, setActiveStatusDropdownTaskId] = useState<string | null>(null);

  // Rights Modal State
  const [showRightsModal, setShowRightsModal] = useState<boolean>(false);
  const [selectedRightsTask, setSelectedRightsTask] = useState<Task | null>(null);
  const [rightsModalAction, setRightsModalAction] = useState<'due_date' | 'delete_task' | null>(null);

  // Toggle group collapse
  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Toggle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Status Group Categories matching the ClickUp Screenshot
  const statusGroups: StatusGroupConfig[] = [
    {
      key: 'complete',
      label: 'COMPLETE',
      statusMatch: ['Done'],
      defaultStatus: 'Done',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
      accentColor: '#10B981',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    },
    {
      key: 'update_required',
      label: 'UPDATE REQUIRED',
      statusMatch: ['In Review'],
      defaultStatus: 'In Review',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
      accentColor: '#F59E0B',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />
    },
    {
      key: 'in_progress',
      label: 'IN PROGRESS',
      statusMatch: ['In Progress'],
      defaultStatus: 'In Progress',
      badgeBg: 'bg-[#7B68EE]/20',
      badgeText: 'text-[#9D8CFF]',
      badgeBorder: 'border-[#7B68EE]/40',
      accentColor: '#7B68EE',
      icon: <Play className="w-3.5 h-3.5 text-[#7B68EE] fill-current" />
    },
    {
      key: 'to_do',
      label: 'TO DO',
      statusMatch: ['To Do'],
      defaultStatus: 'To Do',
      badgeBg: 'bg-sky-500/15',
      badgeText: 'text-sky-400',
      badgeBorder: 'border-sky-500/30',
      accentColor: '#0284C7',
      icon: <Circle className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />
    },
    {
      key: 'backlog',
      label: 'BACKLOG',
      statusMatch: ['Backlog'],
      defaultStatus: 'Backlog',
      badgeBg: 'bg-slate-500/15',
      badgeText: 'text-slate-400',
      badgeBorder: 'border-slate-500/30',
      accentColor: '#64748B',
      icon: <Circle className="w-3.5 h-3.5 text-slate-400" />
    }
  ];

  // Sort helper function
  const sortGroupTasks = (taskList: Task[]): Task[] => {
    const list = [...taskList];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          comparison = timeA - timeB;
          break;
        case 'dueDate':
          const dueA = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
          const dueB = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
          comparison = dueA - dueB;
          break;
        case 'progress':
          comparison = getTaskProgress(a) - getTaskProgress(b);
          break;
        case 'priority':
          const pWeights: Record<Priority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          comparison = (pWeights[a.priority] || 0) - (pWeights[b.priority] || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  };

  // Handle inline quick add task
  const handleSaveInlineTask = (status: TaskStatus) => {
    if (!inlineTaskTitle.trim()) {
      setInlineAddStatus(null);
      return;
    }

    const targetProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
    const newT: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      projectId: targetProject ? targetProject.id : 'proj_chairman',
      companyId: targetProject ? targetProject.companyId : 'comp_corp',
      title: inlineTaskTitle.trim(),
      description: '',
      status: status,
      priority: 'Medium',
      assigneeIds: currentUser ? [currentUser.id] : ['usr_pk'],
      reporterId: currentUser ? currentUser.id : 'usr_pk',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      estimatedHours: 10,
      loggedHours: 0,
      progress: status === 'Done' ? 100 : 0,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addTask(newT);
    setInlineTaskTitle('');
    setInlineAddStatus(null);
  };

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-dropdown-container')) {
        setActiveStatusDropdownTaskId(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div className="space-y-6 select-none font-sans">
      {statusGroups.map((group) => {
        const groupTasks = tasks.filter((t) => group.statusMatch.includes(t.status));
        const sortedTasks = sortGroupTasks(groupTasks);
        const isCollapsed = !!collapsedGroups[group.key];

        // If no tasks in this group and group is Backlog or In Review, only render if there are tasks or it's high level
        if (groupTasks.length === 0 && (group.key === 'backlog' || group.key === 'update_required')) {
          // Keep structure ready or collapsible
        }

        return (
          <div
            key={group.key}
            className={`rounded-2xl border transition-all shadow-sm ${
              isLight
                ? 'bg-white border-slate-200 shadow-slate-100'
                : 'bg-[#121B26] border-[#233549] shadow-xl'
            }`}
          >
            {/* GROUP ACCORDION HEADER BAR */}
            <div
              onClick={() => toggleGroup(group.key)}
              className={`px-4 sm:px-5 py-3 flex items-center justify-between cursor-pointer border-b transition-colors ${
                isLight
                  ? 'border-slate-200/80 hover:bg-slate-50'
                  : 'border-[#233549]/70 hover:bg-[#16222F]/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Chevron Collapse Indicator */}
                <button
                  type="button"
                  className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Status Pill Badge with icon & count */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase border ${group.badgeBg} ${group.badgeText} ${group.badgeBorder} shadow-xs`}
                >
                  {group.icon}
                  <span>{group.label}</span>
                </div>

                {/* Total Task Count in Group */}
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#0D1520] text-slate-400'
                  }`}
                >
                  {groupTasks.length}
                </span>
              </div>

              {/* Fast Add Task action in group header */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInlineAddStatus(group.defaultStatus);
                  if (collapsedGroups[group.key]) {
                    toggleGroup(group.key);
                  }
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 active:scale-95 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-[#0D1520] hover:bg-[#1A2634] border-[#233549] text-slate-300 hover:text-white'
                }`}
                title={`Quick add task to ${group.label}`}
              >
                <Plus className="w-3.5 h-3.5" style={{ color: group.accentColor }} />
                <span>Add Task</span>
              </button>
            </div>

            {/* EXPANDED TABLE CONTENT */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[980px]">
                  {/* CLICKUP EXACT COLUMN HEADERS */}
                  <thead>
                    <tr
                      className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                        isLight
                          ? 'bg-slate-50/90 text-slate-500 border-slate-200'
                          : 'bg-[#0D1520]/50 text-slate-400 border-[#233549]/70'
                      }`}
                    >
                      {/* Name Column (Wide) */}
                      <th
                        onClick={() => handleSort('name')}
                        className="py-3 px-4 pl-6 cursor-pointer hover:text-[#00AEA9] transition-colors select-none min-w-[280px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Name</span>
                          {sortField === 'name' && (
                            <ArrowUpDown className="w-3 h-3 text-[#00AEA9]" />
                          )}
                        </div>
                      </th>

                      {/* Date created Column with Sorting Indicator */}
                      <th
                        onClick={() => handleSort('createdAt')}
                        className="py-3 px-3 cursor-pointer hover:text-[#00AEA9] transition-colors select-none w-32"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Date created</span>
                          <span className="text-[10px] text-slate-400">
                            {sortField === 'createdAt' ? (sortDirection === 'asc' ? '⇡' : '⇣') : '⇣'}
                          </span>
                        </div>
                      </th>

                      {/* Assignee Column */}
                      <th className="py-3 px-3 w-28">
                        <span>Assignee</span>
                      </th>

                      {/* Status Column */}
                      <th className="py-3 px-3 w-36">
                        <span>Status</span>
                      </th>

                      {/* Priority Column */}
                      <th
                        onClick={() => handleSort('priority')}
                        className="py-3 px-3 cursor-pointer hover:text-[#00AEA9] transition-colors select-none w-28"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Priority</span>
                          {sortField === 'priority' && (
                            <ArrowUpDown className="w-3 h-3 text-[#00AEA9]" />
                          )}
                        </div>
                      </th>

                      {/* Created by Column */}
                      <th className="py-3 px-3 w-28">
                        <span>Created by</span>
                      </th>

                      {/* Percentage Line Column (Progress) */}
                      <th
                        onClick={() => handleSort('progress')}
                        className="py-3 px-3 cursor-pointer hover:text-[#00AEA9] transition-colors select-none w-36"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Progress</span>
                          {sortField === 'progress' && (
                            <ArrowUpDown className="w-3 h-3 text-[#00AEA9]" />
                          )}
                        </div>
                      </th>

                      {/* Date (Due Date) Column */}
                      <th
                        onClick={() => handleSort('dueDate')}
                        className="py-3 px-3 cursor-pointer hover:text-[#00AEA9] transition-colors select-none w-28"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Due Date</span>
                          {sortField === 'dueDate' && (
                            <ArrowUpDown className="w-3 h-3 text-[#00AEA9]" />
                          )}
                        </div>
                      </th>

                      {/* Custom Fields Dynamic Headers */}
                      {customFields.map((cf) => (
                        <th
                          key={cf.id}
                          className="py-3 px-3 whitespace-nowrap min-w-[110px] text-slate-400 font-semibold"
                        >
                          <span title={cf.description || cf.name}>{cf.name}</span>
                        </th>
                      ))}

                      {/* + Add Custom Field Button (Far Right Header) */}
                      <th className="py-3 px-4 text-right w-24">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCustomFieldsModal();
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            isLight
                              ? 'bg-slate-200/80 hover:bg-[#00AEA9] text-slate-700 hover:text-white'
                              : 'bg-[#16222F] hover:bg-[#00AEA9] text-slate-300 hover:text-slate-950 border border-[#233549]'
                          }`}
                          title="Add custom column / custom field"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </th>
                    </tr>
                  </thead>

                  {/* TABLE BODY ROWS */}
                  <tbody
                    className={`divide-y text-xs font-medium ${
                      isLight ? 'divide-slate-200' : 'divide-[#233549]/50'
                    }`}
                  >
                    {sortedTasks.map((task) => {
                      const isSelected = selectedTaskId === task.id;
                      const progress = getTaskProgress(task);
                      const assignees = users.filter((u) => task.assigneeIds?.includes(u.id));
                      const creator =
                        users.find((u) => u.id === task.reporterId) ||
                        users[0] ||
                        currentUser;

                      const isTimerRunning = timer.active && timer.taskId === task.id;

                      return (
                        <tr
                          key={task.id}
                          onClick={() => onSelectTask(task.id)}
                          className={`transition-colors cursor-pointer group ${
                            isLight
                              ? isSelected
                                ? 'bg-teal-50/90 border-l-4 border-l-[#00AEA9]'
                                : 'hover:bg-slate-50/90'
                              : isSelected
                              ? 'bg-[#00AEA9]/10 border-l-4 border-l-[#00AEA9]'
                              : 'hover:bg-[#16222F]/70'
                          }`}
                        >
                          {/* 1. NAME COLUMN (Task Title, Status Bullet, Badges) */}
                          <td className="py-3 px-4 pl-6">
                            <div className="flex items-center gap-3">
                              {/* ClickUp Status Bullet Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextStatus: TaskStatus =
                                    task.status === 'Done'
                                      ? 'To Do'
                                      : task.status === 'To Do'
                                      ? 'In Progress'
                                      : task.status === 'In Progress'
                                      ? 'In Review'
                                      : 'Done';
                                  updateTask(task.id, {
                                    status: nextStatus,
                                    progress: nextStatus === 'Done' ? 100 : task.progress
                                  });
                                }}
                                className="shrink-0 transition-transform active:scale-90"
                                title={`Click to advance status from ${task.status}`}
                              >
                                {task.status === 'Done' ? (
                                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                ) : task.status === 'In Review' ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 hover:bg-amber-500/20 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  </div>
                                ) : task.status === 'In Progress' ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-[#7B68EE] hover:bg-[#7B68EE]/20 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#7B68EE]" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-400 hover:border-[#00AEA9]" />
                                )}
                              </button>

                              {/* Task Title & Popover Preview */}
                              <TaskQuickPreviewPopover
                                task={task}
                                onOpenFullTask={(id) => onSelectTask(id)}
                              >
                                <span
                                  className={`font-semibold tracking-tight transition-colors cursor-pointer ${
                                    task.status === 'Done'
                                      ? 'line-through text-slate-400 dark:text-slate-500'
                                      : isLight
                                      ? 'text-slate-900 hover:text-[#0773BB]'
                                      : 'text-slate-100 hover:text-[#00AEA9]'
                                  }`}
                                >
                                  {getDisplayTaskTitle(task)}
                                </span>
                              </TaskQuickPreviewPopover>

                              {/* Recurring badge */}
                              {task.recurrence && task.recurrence.type !== 'none' && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00AEA9]/15 text-[#00AEA9] border border-[#00AEA9]/30 shrink-0"
                                  title={`Recurring Schedule: Every ${task.recurrence.interval || 1} ${task.recurrence.type}`}
                                >
                                  <Repeat className="w-2.5 h-2.5" />
                                  <span className="capitalize text-[9px]">
                                    {task.recurrence.type}
                                  </span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. DATE CREATED COLUMN (e.g., "2/25/26" or "2 days ago") */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            <span>{formatDisplayDate(task.createdAt)}</span>
                          </td>

                          {/* 3. ASSIGNEE COLUMN (Avatar Initial Circles) */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <AssigneePicker
                                assigneeIds={task.assigneeIds || []}
                                users={users}
                                onUpdateAssignees={(newIds) =>
                                  updateTask(task.id, { assigneeIds: newIds })
                                }
                              />
                            </div>
                          </td>

                          {/* 4. STATUS COLUMN (ClickUp Pill Badge with 1-Click Dropdown) */}
                          <td
                            className="py-3 px-3 relative status-dropdown-container"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setActiveStatusDropdownTaskId((prev) =>
                                  prev === task.id ? null : task.id
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all border ${
                                task.status === 'Done'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                                  : task.status === 'In Review'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                                  : task.status === 'In Progress'
                                  ? 'bg-[#7B68EE]/20 text-[#9D8CFF] border-[#7B68EE]/40 hover:bg-[#7B68EE]/30'
                                  : 'bg-sky-500/20 text-sky-400 border-sky-500/40 hover:bg-sky-500/30'
                              }`}
                            >
                              {task.status === 'Done' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : task.status === 'In Review' ? (
                                <Clock className="w-3 h-3" />
                              ) : task.status === 'In Progress' ? (
                                <Play className="w-3 h-3 fill-current" />
                              ) : (
                                <Circle className="w-3 h-3 stroke-[2.5]" />
                              )}
                              <span>{task.status === 'In Review' ? 'UPDATE REQUIRED' : task.status === 'Done' ? 'COMPLETE' : task.status}</span>
                            </button>

                            {/* Dropdown Menu */}
                            {activeStatusDropdownTaskId === task.id && (
                              <div
                                className={`absolute left-0 top-full mt-1 z-30 w-44 rounded-xl border p-1.5 shadow-2xl animate-in fade-in zoom-in-95 ${
                                  isLight
                                    ? 'bg-white border-slate-200 text-slate-800'
                                    : 'bg-[#16222F] border-[#233549] text-slate-100'
                                }`}
                              >
                                {(
                                  [
                                    'To Do',
                                    'In Progress',
                                    'In Review',
                                    'Done',
                                    'Backlog'
                                  ] as TaskStatus[]
                                ).map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                      updateTask(task.id, {
                                        status: st,
                                        progress: st === 'Done' ? 100 : task.progress
                                      });
                                      setActiveStatusDropdownTaskId(null);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      task.status === st
                                        ? 'bg-[#00AEA9]/20 text-[#00AEA9]'
                                        : isLight
                                        ? 'hover:bg-slate-100 text-slate-700'
                                        : 'hover:bg-[#0D1520] text-slate-300'
                                    }`}
                                  >
                                    <span className="uppercase text-[10px]">
                                      {st === 'In Review'
                                        ? 'UPDATE REQUIRED'
                                        : st === 'Done'
                                        ? 'COMPLETE'
                                        : st}
                                    </span>
                                    {task.status === st && <Check className="w-3.5 h-3.5" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* 5. PRIORITY COLUMN (Color-Coded Flags with 1-Click Toggle / Dropdown) */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <PriorityPicker task={task} />
                          </td>

                          {/* 6. CREATED BY COLUMN (Creator Avatar Bubble e.g. "S") */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <div
                              className="flex items-center gap-2"
                              title={`Created by: ${creator?.name || 'Workspace User'} (${creator?.email || 'N/A'})`}
                            >
                              <div
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7B68EE] to-[#00AEA9] text-white flex items-center justify-center font-bold text-[10px] shadow-xs border border-white/20"
                              >
                                {creator?.name
                                  ? creator.name.charAt(0).toUpperCase()
                                  : 'S'}
                              </div>
                            </div>
                          </td>

                          {/* 6. PERCENTAGE LINE (INTERACTIVE MINI PROGRESS BAR & DRAG-TO-UPDATE) */}
                          <td
                            className="py-3 px-3 relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TaskInteractiveProgressBar task={task} />
                          </td>

                          {/* 7. DATE (DUE DATE) COLUMN */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const taskProject = projects.find((p) => p.id === task.projectId);
                              const canEditDue = canModifyDueDate(currentUser, task, taskProject);

                              if (canEditDue) {
                                return (
                                  <div className="flex items-center gap-1 text-[11px] font-mono">
                                    <input
                                      type="date"
                                      value={task.dueDate || ''}
                                      onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                                      className={`bg-transparent border border-transparent hover:border-[#233549] focus:border-[#00AEA9] rounded px-1 py-0.5 font-mono text-[11px] cursor-pointer focus:outline-none transition-colors ${
                                        task.dueDate
                                          ? isLight
                                            ? 'text-slate-800'
                                            : 'text-slate-200'
                                          : 'text-slate-500'
                                      }`}
                                      title="Click to edit due date"
                                    />
                                  </div>
                                );
                              }

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRightsTask(task);
                                    setRightsModalAction('due_date');
                                    setShowRightsModal(true);
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-amber-400 px-1 py-0.5 rounded cursor-pointer group/date transition-colors"
                                  title="Due date is locked for Team Members. Click to view rights or request date extension."
                                >
                                  <span>{task.dueDate || '–'}</span>
                                  <Lock className="w-2.5 h-2.5 text-amber-500/70 group-hover/date:text-amber-400" />
                                </button>
                              );
                            })()}
                          </td>

                          {/* 8. CUSTOM FIELDS COLUMNS */}
                          {customFields.map((cf) => {
                            const val = task.customFields?.[cf.id];
                            return (
                              <td
                                key={cf.id}
                                className="py-3 px-3 text-[11px] font-mono text-slate-300"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {cf.type === 'checkbox' ? (
                                  <input
                                    type="checkbox"
                                    checked={!!val}
                                    onChange={(e) => {
                                      const next = { ...(task.customFields || {}), [cf.id]: e.target.checked };
                                      updateTask(task.id, { customFields: next });
                                    }}
                                    className="rounded accent-[#00AEA9] cursor-pointer"
                                  />
                                ) : (
                                  <input
                                    type={cf.type === 'number' ? 'number' : 'text'}
                                    value={val !== undefined ? String(val) : ''}
                                    placeholder="–"
                                    onChange={(e) => {
                                      const next = {
                                        ...(task.customFields || {}),
                                        [cf.id]: cf.type === 'number' ? Number(e.target.value) : e.target.value
                                      };
                                      updateTask(task.id, { customFields: next });
                                    }}
                                    className="bg-transparent border border-transparent hover:border-[#233549] focus:border-[#00AEA9] rounded px-1 py-0.5 text-[11px] w-24 truncate focus:outline-none transition-colors"
                                  />
                                )}
                              </td>
                            );
                          })}

                          {/* 9. QUICK TIMER / ACTION MENU */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Delete task button on hover */}
                              {(() => {
                                const taskProject = projects.find((p) => p.id === task.projectId);
                                const canDelete = canDeleteTask(currentUser, task, taskProject);

                                return canDelete ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete task "${task.title}"?`)) {
                                        deleteTask(task.id);
                                      }
                                    }}
                                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRightsTask(task);
                                      setRightsModalAction('delete_task');
                                      setShowRightsModal(true);
                                    }}
                                    className="p-1 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-amber-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    title="Task deletion is locked for Team Members (PM only). Click to view rights."
                                  >
                                    <Lock className="w-3.5 h-3.5 text-amber-500/60" />
                                  </button>
                                );
                              })()}

                              {isTimerRunning ? (
                                <button
                                  type="button"
                                  onClick={() => stopTimer('Logged time')}
                                  className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white transition-all shadow-xs"
                                  title="Stop Time Tracking"
                                >
                                  <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startTimer(task.id, task.title)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-[#00AEA9] hover:bg-[#00AEA9]/10 transition-all opacity-0 group-hover:opacity-100"
                                  title="Start timer on task"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* INLINE + ADD TASK ROW */}
                    {inlineAddStatus === group.defaultStatus ? (
                      <tr
                        className={`${
                          isLight ? 'bg-slate-100/90' : 'bg-[#0D1520]/80'
                        } border-t border-[#00AEA9]/50`}
                      >
                        <td colSpan={7 + customFields.length + 1} className="py-3 px-4 pl-6">
                          <div className="flex items-center gap-3">
                            <Plus className="w-4 h-4 text-[#00AEA9]" />
                            <input
                              type="text"
                              autoFocus
                              placeholder={`Type a task name to add in ${group.label} and press Enter...`}
                              value={inlineTaskTitle}
                              onChange={(e) => setInlineTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineTask(group.defaultStatus);
                                if (e.key === 'Escape') setInlineAddStatus(null);
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-none font-medium ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-[#00AEA9]'
                                  : 'bg-[#16222F] border-[#233549] text-white focus:border-[#00AEA9]'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineTask(group.defaultStatus)}
                              className="px-4 py-1.5 rounded-xl bg-[#00AEA9] hover:bg-[#009691] text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                            >
                              Save Task
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineAddStatus(null)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        onClick={() => setInlineAddStatus(group.defaultStatus)}
                        className={`cursor-pointer transition-colors ${
                          isLight
                            ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                            : 'hover:bg-[#16222F]/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <td
                          colSpan={7 + customFields.length + 1}
                          className="py-2.5 px-4 pl-6 text-xs font-semibold"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5 text-[#00AEA9]" />
                            <span>Add Task</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Team Member Rights & Task Permissions Modal */}
      <TeamMemberRightsModal
        isOpen={showRightsModal}
        onClose={() => {
          setShowRightsModal(false);
          setSelectedRightsTask(null);
          setRightsModalAction(null);
        }}
        task={selectedRightsTask}
        project={projects.find((p) => p.id === selectedRightsTask?.projectId) || projects[0]}
        initialTab={rightsModalAction === 'due_date' ? 'request_date' : 'overview'}
        restrictedActionAttempted={rightsModalAction}
      />
    </div>
  );
};
