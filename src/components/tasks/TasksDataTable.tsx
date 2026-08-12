import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Play,
  Square,
  CheckSquare,
  Calendar,
  User as UserIcon,
  Clock,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Lock,
  GitCommit,
  ArrowUpRight,
  Sparkles,
  Shield,
  Layers,
  ArrowRightCircle,
  Tag,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Check,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, Priority, Project, User } from '../../types';
import { calculatePriorityScore } from '../../lib/priorityScore';
import { PriorityBadge } from '../common/PriorityBadge';
import { canEditSpace } from '../../lib/permissions';

type SortField = 'title' | 'status' | 'priority' | 'dueDate' | 'estimatedHours' | 'projectId' | 'priorityScore' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface TasksDataTableProps {
  onSelectTask?: (taskId: string) => void;
  selectedTaskId?: string | null;
}

export const TasksDataTable: React.FC<TasksDataTableProps> = ({ onSelectTask, selectedTaskId }) => {
  const {
    tasks,
    projects,
    users,
    dependencies,
    subtasks,
    updateTask,
    deleteTask,
    selectedProjectId,
    selectedListFilter,
    searchQuery: globalSearchQuery,
    theme,
    currentUser,
    customFields
  } = useApp();

  const isLight = theme === 'light';

  // Table-specific Filter States
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>(selectedProjectId || 'all');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Multi-select state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Bulk action confirmation dialogs / states
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkAssigneeMenu, setShowBulkAssigneeMenu] = useState(false);
  const [showBulkStatusMenu, setShowBulkStatusMenu] = useState(false);
  const [showBulkPriorityMenu, setShowBulkPriorityMenu] = useState(false);
  const [bulkActionToast, setBulkActionToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setBulkActionToast(msg);
    setTimeout(() => setBulkActionToast(null), 4000);
  };

  const PRIORITY_WEIGHTS: Record<Priority, number> = {
    Urgent: 4,
    High: 3,
    Medium: 2,
    Low: 1
  };

  const STATUS_WEIGHTS: Record<TaskStatus, number> = {
    'In Progress': 4,
    'To Do': 3,
    'In Review': 2,
    'Backlog': 1,
    'Done': 0
  };

  // Predecessor & Successor helpers
  const getPredecessorTasks = (task: Task): Task[] => {
    const directPreds = task.predecessors || [];
    const depPreds = dependencies.filter((d) => d.taskId === task.id).map((d) => d.dependsOnTaskId);
    const allPredIds = Array.from(new Set([...directPreds, ...depPreds]));
    return tasks.filter((t) => allPredIds.includes(t.id));
  };

  const isTaskBlocked = (task: Task): boolean => {
    const preds = getPredecessorTasks(task);
    if (preds.length === 0) return false;
    return preds.some((p) => p.status !== 'Done');
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Space/Project filter
      const effectiveProjId = projectFilter !== 'all' ? projectFilter : selectedProjectId;
      if (effectiveProjId && effectiveProjId !== 'all' && t.projectId !== effectiveProjId) {
        return false;
      }

      // List filter
      if (selectedListFilter && t.listName !== selectedListFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }

      // Priority Filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
        return false;
      }

      // Assignee Filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned') {
          if (t.assigneeIds && t.assigneeIds.length > 0 && t.assigneeIds[0]) return false;
        } else {
          if (!t.assigneeIds || !t.assigneeIds.includes(assigneeFilter)) return false;
        }
      }

      // Search Query (combine global search and table local search)
      const q = (localSearch || globalSearchQuery || '').toLowerCase().trim();
      if (q) {
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchTag = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        const assignees = users.filter((u) => t.assigneeIds?.includes(u.id));
        const matchAssignee = assignees.some(
          (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
        const proj = projects.find((p) => p.id === t.projectId);
        const matchProject = proj ? proj.title.toLowerCase().includes(q) || proj.code.toLowerCase().includes(q) : false;

        if (!matchTitle && !matchDesc && !matchTag && !matchAssignee && !matchProject) {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    projectFilter,
    selectedProjectId,
    selectedListFilter,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    localSearch,
    globalSearchQuery,
    users,
    projects
  ]);

  // Sort Tasks
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;

        case 'status':
          comparison = (STATUS_WEIGHTS[a.status] || 0) - (STATUS_WEIGHTS[b.status] || 0);
          break;

        case 'priority':
          comparison = (PRIORITY_WEIGHTS[a.priority] || 1) - (PRIORITY_WEIGHTS[b.priority] || 1);
          break;

        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
          comparison = dateA - dateB;
          break;

        case 'estimatedHours':
          comparison = (a.estimatedHours || 0) - (b.estimatedHours || 0);
          break;

        case 'projectId':
          const projA = projects.find((p) => p.id === a.projectId)?.title || '';
          const projB = projects.find((p) => p.id === b.projectId)?.title || '';
          comparison = projA.localeCompare(projB);
          break;

        case 'priorityScore':
          const scoreA = calculatePriorityScore(a, dependencies, tasks).score;
          const scoreB = calculatePriorityScore(b, dependencies, tasks).score;
          comparison = scoreA - scoreB;
          break;

        case 'createdAt':
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          comparison = timeA - timeB;
          break;

        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [filteredTasks, sortField, sortDirection, projects, dependencies, tasks]);

  // Paginated Tasks
  const totalItems = sortedTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedTasks = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, safePage, pageSize]);

  // Selection state helpers
  const currentPageTaskIds = useMemo(() => paginatedTasks.map((t) => t.id), [paginatedTasks]);
  const isAllCurrentPageSelected =
    currentPageTaskIds.length > 0 && currentPageTaskIds.every((id) => selectedTaskIds.includes(id));
  const isSomeCurrentPageSelected =
    currentPageTaskIds.some((id) => selectedTaskIds.includes(id)) && !isAllCurrentPageSelected;

  const handleToggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      // Unselect all on current page
      setSelectedTaskIds((prev) => prev.filter((id) => !currentPageTaskIds.includes(id)));
    } else {
      // Select all on current page
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...currentPageTaskIds])));
    }
  };

  const handleToggleSelectAllFiltered = () => {
    const allFilteredIds = filteredTasks.map((t) => t.id);
    if (selectedTaskIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(allFilteredIds);
    }
  };

  const handleToggleTaskSelection = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Header Sort Click Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // BULK OPERATIONS
  const handleBulkUpdateStatus = (newStatus: TaskStatus) => {
    if (selectedTaskIds.length === 0) return;
    let count = 0;
    selectedTaskIds.forEach((id) => {
      updateTask(id, { status: newStatus });
      count++;
    });
    showToast(`Successfully moved ${count} selected tasks to "${newStatus}"!`);
    setShowBulkStatusMenu(false);
  };

  const handleBulkUpdatePriority = (newPriority: Priority) => {
    if (selectedTaskIds.length === 0) return;
    let count = 0;
    selectedTaskIds.forEach((id) => {
      updateTask(id, { priority: newPriority });
      count++;
    });
    showToast(`Successfully updated priority of ${count} tasks to "${newPriority}"!`);
    setShowBulkPriorityMenu(false);
  };

  const handleBulkUpdateAssignee = (userId: string) => {
    if (selectedTaskIds.length === 0) return;
    const assigneeUser = users.find((u) => u.id === userId);
    let count = 0;
    selectedTaskIds.forEach((id) => {
      updateTask(id, { assigneeIds: [userId] });
      count++;
    });
    showToast(`Assigned ${count} selected tasks to ${assigneeUser?.name || 'user'}!`);
    setShowBulkAssigneeMenu(false);
  };

  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    let count = 0;
    selectedTaskIds.forEach((id) => {
      deleteTask(id);
      count++;
    });
    showToast(`Deleted ${count} selected tasks.`);
    setSelectedTaskIds([]);
    setShowBulkDeleteConfirm(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      
      {/* Toast Notification Banner */}
      {bulkActionToast && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-950 via-emerald-950 to-cyan-950 border border-teal-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bulkActionToast}</span>
          </div>
          <button onClick={() => setBulkActionToast(null)} className="text-teal-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH CONTROL BAR */}
      <div
        className={`p-4 rounded-2xl border ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#121B26] border-[#233549] shadow-xl'
        } flex flex-col lg:flex-row lg:items-center justify-between gap-4`}
      >
        {/* Left: Search & Quick Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search tasks, codes, tags, assignees..."
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-[#0773BB]'
                  : 'bg-[#0D1520] border-[#233549] text-white focus:ring-[#3BC0BB]'
              }`}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-[11px] font-bold text-slate-400 hidden sm:inline">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done / Completed</option>
              <option value="Backlog">Backlog</option>
            </select>
          </div>

          {/* Priority Dropdown Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-[11px] font-bold text-slate-400 hidden sm:inline">Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-[11px] font-bold text-slate-400 hidden sm:inline">Assignee:</label>
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              <option value="all">All Team Members</option>
              <option value="unassigned">Unassigned Tasks</option>
              <optgroup label="Specific Team Members">
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Space / Project Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-[11px] font-bold text-slate-400 hidden sm:inline">Project:</label>
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none max-w-[180px] truncate ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              <option value="all">All Projects & Spaces</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Table Info & Select All toggle */}
        <div className="flex items-center gap-2 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-[#233549]">
          <span className="text-xs font-medium text-slate-400">
            Total: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{totalItems}</strong> tasks
          </span>

          {selectedTaskIds.length > 0 ? (
            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Deselect ({selectedTaskIds.length})</span>
            </button>
          ) : (
            <button
              onClick={handleToggleSelectAllFiltered}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#0D1520] hover:bg-[#1A2634] border-[#233549] text-slate-300'
              }`}
            >
              Select All ({filteredTasks.length})
            </button>
          )}
        </div>
      </div>

      {/* FLOATING BULK ACTIONS TOOLBAR (Appears when 1+ tasks selected) */}
      {selectedTaskIds.length > 0 && (
        <div className="sticky top-4 z-30 p-4 rounded-2xl bg-gradient-to-r from-[#0D1520] via-[#16222F] to-[#0D1520] border-2 border-[#3BC0BB] shadow-2xl shadow-[#0773BB]/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#3BC0BB] text-slate-950 font-black text-xs shadow-md">
              {selectedTaskIds.length}
            </span>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Selected Tasks Bulk Actions</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#3BC0BB]/20 text-[#3BC0BB] font-mono border border-[#3BC0BB]/40">
                  Batch Multi-Select
                </span>
              </h4>
              <p className="text-[11px] text-slate-300">
                Execute batch status updates, priority assignments, or deletions across all selected records.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Direct One-Click Status Action Buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0D1520] border border-[#233549]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden md:inline">
                Set Status:
              </span>
              <button
                type="button"
                onClick={() => handleBulkUpdateStatus('To Do')}
                className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
                title="Move selected tasks to To Do"
              >
                <Square className="w-3.5 h-3.5" />
                <span>To-Do</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdateStatus('In Progress')}
                className="px-2.5 py-1.5 rounded-lg bg-[#7B68EE]/15 hover:bg-[#7B68EE]/30 border border-[#7B68EE]/40 text-[#7B68EE] font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
                title="Move selected tasks to In Progress"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>In-Progress</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdateStatus('Done')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-emerald-500/10"
                title="Mark selected tasks as Completed / Done"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </button>
            </div>

            {/* Quick Action: Change Priority */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowBulkPriorityMenu(!showBulkPriorityMenu);
                  setShowBulkStatusMenu(false);
                  setShowBulkAssigneeMenu(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#1A2634] hover:bg-[#233549] border border-[#3BC0BB]/40 text-[#3BC0BB] font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Priority</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showBulkPriorityMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-[#16222F] border border-[#233549] shadow-2xl p-1.5 z-40 space-y-1">
                  {(['Urgent', 'High', 'Medium', 'Low'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleBulkUpdatePriority(p)}
                      className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between ${
                        p === 'Urgent'
                          ? 'text-rose-400 hover:bg-rose-500/20'
                          : p === 'High'
                          ? 'text-amber-400 hover:bg-amber-500/20'
                          : p === 'Medium'
                          ? 'text-sky-400 hover:bg-sky-500/20'
                          : 'text-slate-400 hover:bg-slate-500/20'
                      }`}
                    >
                      <span>{p}</span>
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action: Assign User */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowBulkAssigneeMenu(!showBulkAssigneeMenu);
                  setShowBulkStatusMenu(false);
                  setShowBulkPriorityMenu(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#1A2634] hover:bg-[#233549] border border-[#233549] text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assignee</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showBulkAssigneeMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 max-h-60 overflow-y-auto rounded-xl bg-[#16222F] border border-[#233549] shadow-2xl p-1.5 z-40 space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleBulkUpdateAssignee(u.id)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#0773BB]/20 hover:text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                      <div className="min-w-0 truncate">
                        <p className="font-bold truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Selected Button */}
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95"
              title="Delete all selected tasks permanently"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedTaskIds([])}
              className="p-2 rounded-xl bg-[#0D1520] hover:bg-[#1A2634] text-slate-400 hover:text-white border border-[#233549] transition-all"
              title="Cancel Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM BULK DELETE MODAL */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Selected Tasks?</h3>
                <p className="text-xs text-slate-400">
                  You are about to delete <strong className="text-rose-400">{selectedTaskIds.length} tasks</strong>.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-[#0D1520] p-3 rounded-xl border border-[#233549]">
              This action will remove the selected tasks, their logged hours, and subtasks from your workspace. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#1A2634] text-slate-300 font-bold text-xs border border-[#233549] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete ({selectedTaskIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA TABLE CONTAINER */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-xl ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#121B26] border-[#233549]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* TABLE HEADER WITH SORTING CONTROL */}
            <thead>
              <tr
                className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#16222F] text-slate-300 border-[#233549]'
                }`}
              >
                {/* Selection Checkbox Header */}
                <th className="p-3.5 w-12 text-center">
                  <button
                    onClick={handleToggleSelectAllCurrentPage}
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                    title={isAllCurrentPageSelected ? 'Deselect current page' : 'Select all tasks on this page'}
                  >
                    {isAllCurrentPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#3BC0BB]" />
                    ) : isSomeCurrentPageSelected ? (
                      <Square className="w-4 h-4 text-[#3BC0BB]/70" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </th>

                {/* Task Title Column */}
                <th
                  onClick={() => handleSort('title')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Task Title & ID</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'title' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                {/* Status Column */}
                <th
                  onClick={() => handleSort('status')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] transition-colors select-none w-32"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'status' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                {/* Priority Column */}
                <th
                  onClick={() => handleSort('priority')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] transition-colors select-none w-28"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'priority' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                {/* Assignees Column */}
                <th className="p-3.5 w-36">Assignees</th>

                {/* Project / Space Column */}
                <th
                  onClick={() => handleSort('projectId')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Project / Space</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'projectId' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                {/* Due Date Column */}
                <th
                  onClick={() => handleSort('dueDate')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] transition-colors select-none w-28"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Due Date</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'dueDate' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                {/* Estimated Hours Column */}
                <th
                  onClick={() => handleSort('estimatedHours')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] transition-colors select-none w-24 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Hours</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'estimatedHours' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                {/* Priority Score Column */}
                <th
                  onClick={() => handleSort('priorityScore')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] transition-colors select-none w-24 text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Score</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'priorityScore' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                {/* Quick Actions Header */}
                <th className="p-3.5 w-20 text-center">Actions</th>
              </tr>
            </thead>

            {/* TABLE BODY ROWS */}
            <tbody className="divide-y divide-[#233549]/60">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <SlidersHorizontal className="w-8 h-8 text-slate-500" />
                      <p className="text-sm font-bold text-slate-300">No tasks match your filter criteria.</p>
                      <p className="text-xs text-slate-500">Try adjusting your search keywords or status filter options.</p>
                      <button
                        onClick={() => {
                          setLocalSearch('');
                          setStatusFilter('all');
                          setPriorityFilter('all');
                          setAssigneeFilter('all');
                          setProjectFilter('all');
                        }}
                        className="mt-2 px-3 py-1.5 rounded-xl bg-[#0773BB] text-white font-bold text-xs hover:bg-[#0773BB]/80 transition-all"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((t) => {
                  const isSelected = selectedTaskIds.includes(t.id);
                  const isCurrentActive = selectedTaskId === t.id;
                  const proj = projects.find((p) => p.id === t.projectId);
                  const assignees = users.filter((u) => t.assigneeIds?.includes(u.id));
                  const scoreObj = calculatePriorityScore(t, dependencies, tasks);
                  const taskSubtasks = subtasks.filter((s) => s.taskId === t.id);
                  const completedSubtasksCount = taskSubtasks.filter((s) => s.completed).length;
                  const blocked = isTaskBlocked(t);

                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTask && onSelectTask(t.id)}
                      className={`group transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? isLight
                            ? 'bg-teal-50/80 border-l-4 border-l-[#0D9488]'
                            : 'bg-[#3BC0BB]/10 border-l-4 border-l-[#3BC0BB]'
                          : isCurrentActive
                          ? isLight
                            ? 'bg-sky-50'
                            : 'bg-[#0773BB]/15'
                          : isLight
                          ? 'hover:bg-slate-50'
                          : 'hover:bg-[#16222F]/60'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleTaskSelection(t.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#3BC0BB]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Task Title & Tags */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#3BC0BB] px-1.5 py-0.5 rounded bg-[#3BC0BB]/10 border border-[#3BC0BB]/20 shrink-0">
                              {t.id.replace('task_', 'T-')}
                            </span>
                            <span
                              className={`font-bold transition-colors truncate max-w-md ${
                                t.status === 'Done'
                                  ? 'line-through text-slate-500'
                                  : isLight
                                  ? 'text-slate-900 group-hover:text-[#0773BB]'
                                  : 'text-white group-hover:text-[#3BC0BB]'
                              }`}
                            >
                              {t.title}
                            </span>
                            {blocked && (
                              <span className="p-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Blocked by predecessor tasks">
                                <Lock className="w-3 h-3 text-amber-400" />
                              </span>
                            )}
                          </div>

                          {/* Tags & Subtasks count */}
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400">
                            {t.tags && t.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {t.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="px-1.5 py-0.2 rounded bg-[#0D1520] border border-[#233549] text-slate-300">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {taskSubtasks.length > 0 && (
                              <span className="font-mono text-cyan-400">
                                Subtasks: {completedSubtasksCount}/{taskSubtasks.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown/Badge */}
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={t.status}
                          onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer transition-all ${
                            t.status === 'Done'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : t.status === 'In Progress'
                              ? 'bg-[#7B68EE]/15 text-[#7B68EE] border-[#7B68EE]/30 hover:bg-[#7B68EE]/25'
                              : t.status === 'In Review'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25'
                          }`}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="In Review">In Review</option>
                          <option value="Done">Done / Complete</option>
                          <option value="Backlog">Backlog</option>
                        </select>
                      </td>

                      {/* Priority Tag */}
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <PriorityBadge
                          priority={t.priority}
                          onChange={(newPriority) => updateTask(t.id, { priority: newPriority })}
                          interactive
                          size="sm"
                        />
                      </td>

                      {/* Assignees */}
                      <td className="p-3.5">
                        {assignees.length > 0 ? (
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {assignees.map((u) => (
                              <img
                                key={u.id}
                                src={u.avatar}
                                alt={u.name}
                                title={`${u.name} (${u.role})`}
                                className="w-6 h-6 rounded-full border-2 border-[#121B26] object-cover shrink-0"
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Project / Space */}
                      <td className="p-3.5">
                        {proj ? (
                          <div className="truncate max-w-[140px]">
                            <span className="font-bold text-slate-300 truncate block">{proj.code}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{proj.title}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">General Workspace</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="p-3.5">
                        <span className="font-mono text-slate-300">
                          {t.dueDate ? t.dueDate : 'No Date'}
                        </span>
                      </td>

                      {/* Estimated Hours */}
                      <td className="p-3.5 text-right font-mono font-bold text-cyan-400">
                        {t.estimatedHours || 0}h
                      </td>

                      {/* Priority Score */}
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                          {scoreObj.score}
                        </span>
                      </td>

                      {/* Quick Row Actions */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectTask && onSelectTask(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#16222F] transition-colors"
                            title="Preview / Edit Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTask(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-[#16222F] border-[#233549] text-slate-300'
          }`}
        >
          {/* Items count & Page Size selector */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Showing <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                {totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1}
              </strong> to{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                {Math.min(safePage * pageSize, totalItems)}
              </strong> of <strong className={isLight ? 'text-slate-900' : 'text-white'}>{totalItems}</strong> entries
            </span>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-400 text-[11px]">Per Page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-[#0D1520] border-[#233549] text-white'
                }`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-[#233549] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-[#233549] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 px-2.5 font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            {/* Page number indicators */}
            <span className="px-3 py-1 font-mono font-bold text-xs rounded-lg bg-[#0D1520] border border-[#233549] text-[#3BC0BB]">
              Page {safePage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-[#233549] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 px-2.5 font-bold"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-[#233549] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
