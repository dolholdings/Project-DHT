import React, { useState, useMemo } from 'react';
import {
  Columns,
  Plus,
  GripVertical,
  Move,
  Printer,
  ArrowUpDown,
  Pencil,
  Check,
  X,
  Calendar,
  ListTodo,
  AlignLeft,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskStatus, Task, Priority } from '../../types';
import { PriorityPicker } from '../tasks/PriorityPicker';
import { ClickUpTaskDetailModal } from '../tasks/ClickUpTaskDetailModal';
import { DolphinTooltip } from '../common/DolphinTooltip';
import { getAccessibleTasks, getAccessibleProjects } from '../../lib/permissions';
import { getDisplayTaskTitle, getTaskSubtext } from '../../lib/taskUtils';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { ProjectCsvImportModal } from '../projects/ProjectCsvImportModal';
import { AssigneeFilterDropdown } from '../common/AssigneeFilterDropdown';
import {
  normalizeTaskStatus,
  getStatusBadgeStyle,
  getStatusDotColor,
  getStatusHeaderAccent,
  getStatusTextColor
} from '../../lib/statusUtils';

export {
  normalizeTaskStatus,
  getStatusBadgeStyle,
  getStatusDotColor,
  getStatusHeaderAccent,
  getStatusTextColor
};

const PRIORITY_RANK: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

export const KanbanView: React.FC = () => {
  const {
    tasks,
    subtasks,
    addTask,
    updateTask,
    reorderTasks,
    seedDemoTasksForProject,
    users,
    activeCompany,
    projects,
    selectedProjectId,
    selectedListFilter,
    setSelectedListFilter,
    searchQuery,
    setSearchQuery,
    theme,
    currentUser
  } = useApp();

  const isLight = theme === 'light';

  // Task detail drawer/modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Quick inline add task per column
  const [activeQuickAddStatus, setActiveQuickAddStatus] = useState<TaskStatus | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState<string>('');

  const [sortByPriority, setSortByPriority] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);

  // HTML5 Drag-and-Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [dragOverCardInfo, setDragOverCardInfo] = useState<{
    status: TaskStatus;
    index: number;
    position: 'top' | 'bottom';
  } | null>(null);

  const statuses: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

  const handleCreateDefaultTask = (status: TaskStatus = 'To Do', customTitle?: string) => {
    const newTask = addTask({
      projectId: selectedProjectId || projects[0]?.id || 'proj_1',
      companyId: activeCompany?.id || 'comp_1',
      title: customTitle || 'New Deliverable Task',
      description: 'Defined via ClickUp Board view',
      status,
      priority: 'High',
      assigneeIds: [currentUser?.id || 'usr_pk'],
      reporterId: currentUser?.id || 'usr_1',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      estimatedHours: 8,
      tags: ['Board', 'Task'],
      listName: selectedListFilter || undefined
    });
    
    // Automatically select the newly created task to open its details
    if (newTask && newTask.id) {
      setSelectedTaskId(newTask.id);
    }
  };

  const handleQuickAddSubmit = (status: TaskStatus) => {
    if (quickAddTitle.trim()) {
      handleCreateDefaultTask(status, quickAddTitle.trim());
      setQuickAddTitle('');
      setActiveQuickAddStatus(null);
    }
  };

  const accessibleProjects = useMemo(() => {
    return getAccessibleProjects(currentUser, projects);
  }, [currentUser, projects]);

  const accessibleTasks = useMemo(() => {
    return getAccessibleTasks(currentUser, tasks, projects);
  }, [currentUser, tasks, projects]);

  const activeProject = accessibleProjects.find((p) => p.id === selectedProjectId) || accessibleProjects[0];

  const filteredTasks = accessibleTasks.filter((t) => {
    if (selectedProjectId && t.projectId !== selectedProjectId) return false;
    if (selectedListFilter) {
      if (selectedListFilter === '__root__') {
        if (t.listName && t.listName.trim() !== '') return false;
      } else if (t.listName !== selectedListFilter) {
        return false;
      }
    }
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        if (t.assigneeIds && t.assigneeIds.length > 0 && t.assigneeIds.some((id) => id && id.trim() !== '')) {
          return false;
        }
      } else {
        if (!t.assigneeIds || !t.assigneeIds.includes(assigneeFilter)) {
          return false;
        }
      }
    }
    if (searchQuery) {
      const q = String(searchQuery || '').toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchTag = (t.tags || []).some((tag) => (tag || '').toLowerCase().includes(q));
      const assignees = users.filter((u) => u && t.assigneeIds && t.assigneeIds.includes(u.id));
      const matchAssignee = assignees.some(
        (u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      );
      if (!matchTitle && !matchDesc && !matchTag && !matchAssignee) return false;
    }
    return true;
  });

  // --- HTML5 Drag and Drop Event Handlers ---

  const handleDragStart = (e: React.DragEvent, taskId: string, sourceStatus: TaskStatus) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId, sourceStatus }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
    setDragOverCardInfo(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent, status: TaskStatus) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverStatus === status) {
        setDragOverStatus(null);
      }
    }
  };

  const handleDragOverCard = (e: React.DragEvent, status: TaskStatus, cardIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'top' : 'bottom';

    setDragOverStatus(status);
    setDragOverCardInfo({ status, index: cardIndex, position });
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();

    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) {
      handleDragEnd();
      return;
    }

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) {
      handleDragEnd();
      return;
    }

    const sourceStatus = normalizeTaskStatus(draggedTask.status);
    const isStatusChanged = sourceStatus !== targetStatus;

    // Filter tasks belonging to current board filter
    const matchesFilter = (t: Task) => {
      if (selectedProjectId && t.projectId !== selectedProjectId) return false;
      if (selectedListFilter) {
        if (selectedListFilter === '__root__') {
          if (t.listName && t.listName.trim() !== '') return false;
        } else if (t.listName !== selectedListFilter) {
          return false;
        }
      }
      return true;
    };

    const boardTasks = tasks.filter(matchesFilter);
    const nonBoardTasks = tasks.filter((t) => !matchesFilter(t));

    // Group board tasks by column status
    const colTasksMap: Record<TaskStatus, Task[]> = {
      'Backlog': boardTasks.filter((t) => normalizeTaskStatus(t.status) === 'Backlog'),
      'To Do': boardTasks.filter((t) => normalizeTaskStatus(t.status) === 'To Do'),
      'In Progress': boardTasks.filter((t) => normalizeTaskStatus(t.status) === 'In Progress'),
      'In Review': boardTasks.filter((t) => normalizeTaskStatus(t.status) === 'In Review'),
      'Done': boardTasks.filter((t) => normalizeTaskStatus(t.status) === 'Done'),
    };

    // Remove task from source column
    const sourceCol = Array.from(colTasksMap[sourceStatus] || []);
    const sourceIndex = sourceCol.findIndex((t) => t.id === taskId);
    if (sourceIndex !== -1) {
      sourceCol.splice(sourceIndex, 1);
    }
    colTasksMap[sourceStatus] = sourceCol;

    // Determine insertion index in target column
    const targetCol = Array.from(colTasksMap[targetStatus] || []);
    let insertIndex = targetCol.length;

    if (dragOverCardInfo && dragOverCardInfo.status === targetStatus) {
      let baseIdx = dragOverCardInfo.index;
      if (sourceStatus === targetStatus && sourceIndex !== -1 && sourceIndex < baseIdx) {
        baseIdx = Math.max(0, baseIdx - 1);
      }
      insertIndex = dragOverCardInfo.position === 'bottom' ? baseIdx + 1 : baseIdx;
    }

    // Updated task object with target status
    const updatedTask: Task = {
      ...draggedTask,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    };

    targetCol.splice(insertIndex, 0, updatedTask);
    colTasksMap[targetStatus] = targetCol;

    // 1. Update task via AppProvider context (triggers Firestore sync, activity log, automations)
    if (isStatusChanged) {
      updateTask(taskId, { status: targetStatus });
    }

    // 2. Reorder task sequence via AppProvider context
    const newBoardTasks = statuses.flatMap((s) => colTasksMap[s] || []);
    const allUpdatedTasks = [...nonBoardTasks, ...newBoardTasks];

    reorderTasks(allUpdatedTasks);

    handleDragEnd();
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1750px] mx-auto animate-in fade-in kanban-print-wrapper ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Executive Print Report Header for A4 Landscape PDF Export */}
      <div className="hidden print:block mb-6 p-5 border-b-2 border-slate-900 bg-white text-slate-900 rounded-none print-executive-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold tracking-wider text-slate-600 uppercase">
              {activeCompany?.name || 'DOLPHIN INDUSTRIAL PROJECTS'} — CLICKUP BOARD WORKFLOW REPORT
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Agile Task Stage Matrix & Work-In-Progress Board
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Project Code: <span className="font-bold text-slate-900">{activeProject?.code}</span> — <span className="font-bold text-slate-900">{activeProject?.title}</span> | Manager: <span className="font-semibold text-slate-800">{users.find((u) => u.id === activeProject?.managerId)?.name || 'Project Manager'}</span>
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-600 space-y-1">
            <div><span className="font-semibold text-slate-700">Generated:</span> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div><span className="font-semibold text-slate-700">Format:</span> A4 Executive Landscape</div>
            <div className="px-2.5 py-1 rounded border border-slate-400 bg-slate-100 text-slate-800 font-bold inline-block mt-1 text-[10px] tracking-wider uppercase">
              OFFICIAL WORKFLOW RECORD
            </div>
          </div>
        </div>
      </div>

      {/* Top Header Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <Columns className="w-6 h-6 text-[#3BC0BB]" />
            <span>ClickUp Board View</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Click on any task card to open the full task inspector drawer. Drag cards across columns to update workflow status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Assignee Filter Dropdown */}
          <AssigneeFilterDropdown
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            users={users}
            tasks={accessibleTasks.filter((t) => !selectedProjectId || t.projectId === selectedProjectId)}
          />

          <button
            type="button"
            onClick={() => setSortByPriority(!sortByPriority)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
              sortByPriority
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : theme === 'light'
                ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                : 'bg-[#16222F] text-slate-300 border-[#233549] hover:bg-[#1f2f40]'
            }`}
            title="Toggle ordering tasks inside Kanban columns by Priority"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Sort Priority: {sortByPriority ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              try {
                window.print();
              } catch (_) {}
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
              theme === 'light'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-[#16222F] border-[#233549] text-white hover:bg-[#1f2f40]'
            }`}
            title="Export formatted A4 Landscape Executive Report PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Print PDF</span>
          </button>

          <DolphinTooltip
            title="Click to Open Task"
            badge="Full Detail Modal"
            content="Click on any task card in the board to view and edit its complete details, assignees, subtasks, custom fields, dependencies, and time tracking."
            position="bottom"
            variant="glass"
          >
            <span className="px-3 py-1 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 text-xs font-mono flex items-center gap-1.5 cursor-help">
              <Sparkles className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>Click Card to Open</span>
            </span>
          </DolphinTooltip>
        </div>
      </div>

      {/* Board Content or Overall Empty State */}
      {filteredTasks.length === 0 ? (
        <EmptyStateCard
          variant="kanban"
          theme={theme === 'light' ? 'light' : 'dark'}
          hasActiveFilters={Boolean(searchQuery || selectedListFilter || assigneeFilter !== 'all')}
          onPrimaryAction={() => handleCreateDefaultTask('To Do')}
          primaryActionLabel="Create Deliverable Task"
          onSecondaryAction={() => setShowCsvImportModal(true)}
          secondaryActionLabel="Import Tasks (CSV)"
          onSeedDemoData={() => seedDemoTasksForProject(selectedProjectId || undefined)}
          seedDemoLabel="Load Demo Deliverables"
          onResetFilters={() => {
            if (setSearchQuery) setSearchQuery('');
            if (setSelectedListFilter) setSelectedListFilter(null);
            setAssigneeFilter('all');
          }}
        />
      ) : (
        /* Kanban Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 kanban-board-grid">
          {statuses.map((status) => {
            let colTasks = filteredTasks.filter((t) => normalizeTaskStatus(t.status) === status);
            if (sortByPriority) {
              colTasks = [...colTasks].sort((a, b) => {
                const wA = PRIORITY_RANK[a.priority] || 1;
                const wB = PRIORITY_RANK[b.priority] || 1;
                return wB - wA;
              });
            }

            const isColumnHovered = dragOverStatus === status;

            return (
              <div
                key={status}
                onDragOver={(e) => handleDragOverColumn(e, status)}
                onDragLeave={(e) => handleDragLeaveColumn(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                className={`p-3.5 rounded-2xl border flex flex-col min-h-[640px] max-h-[calc(100vh-220px)] space-y-3 shadow-sm transition-all duration-150 kanban-column ${getStatusHeaderAccent(
                  status
                )} ${
                  isColumnHovered
                    ? theme === 'light'
                      ? 'bg-[#0773BB]/10 border-[#0773BB] ring-2 ring-[#0773BB]/30 shadow-md'
                      : 'bg-[#0773BB]/20 border-[#3BC0BB] ring-2 ring-[#3BC0BB]/40 shadow-lg'
                    : theme === 'light'
                    ? 'bg-[#F8FAFC] border-slate-200'
                    : 'bg-[#121B26] border-[#233549]'
                }`}
              >
                {/* ClickUp Column Header */}
                <div className={`flex items-center justify-between pb-2 border-b kanban-column-header ${
                  theme === 'light' ? 'border-slate-200' : 'border-[#233549]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(status)}`}></span>
                    <h3 className={`text-xs font-bold uppercase tracking-wider kanban-column-title ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      {status}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border kanban-column-badge ${getStatusBadgeStyle(
                      status,
                      theme === 'light'
                    )}`}>
                      {colTasks.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveQuickAddStatus(activeQuickAddStatus === status ? null : status);
                        setQuickAddTitle('');
                      }}
                      className={`p-1 rounded-lg border transition-colors ${
                        theme === 'light'
                          ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white hover:bg-[#1f2f40]'
                      }`}
                      title={`Quick add task to ${status}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Quick Add Task Input */}
                {activeQuickAddStatus === status && (
                  <div className={`p-2.5 rounded-xl border space-y-2 animate-in fade-in ${
                    isLight ? 'bg-white border-[#0D9488]/40 shadow-xs' : 'bg-[#16222F] border-[#3BC0BB]/40 shadow-md'
                  }`}>
                    <input
                      type="text"
                      placeholder="What needs to be done?..."
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddSubmit(status);
                        if (e.key === 'Escape') setActiveQuickAddStatus(null);
                      }}
                      autoFocus
                      className={`w-full text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                      }`}
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveQuickAddStatus(null)}
                        className="px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAddSubmit(status)}
                        disabled={!quickAddTitle.trim()}
                        className="px-2.5 py-1 rounded-lg bg-[#0D9488] text-white font-bold text-[10px] disabled:opacity-50"
                      >
                        Save Task
                      </button>
                    </div>
                  </div>
                )}

                {/* Column Droppable Area */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 rounded-xl kanban-column-droppable">
                  {colTasks.length === 0 ? (
                    <div className={`h-full min-h-[140px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all ${
                      isColumnHovered
                        ? 'border-[#3BC0BB] bg-[#0773BB]/10 text-[#3BC0BB]'
                        : theme === 'light'
                        ? 'border-slate-200 bg-white/60 text-slate-400'
                        : 'border-[#233549]/60 bg-[#0D1520]/30 text-slate-500'
                    }`}>
                      <p className="text-xs font-bold mb-1">No {status} Tasks</p>
                      <p className="text-[10px] text-slate-500 mb-2.5">Drag cards here or create new task.</p>
                      <button
                        type="button"
                        onClick={() => handleCreateDefaultTask(status)}
                        className="px-2.5 py-1 rounded-lg bg-[#0773BB]/15 hover:bg-[#0773BB]/30 text-[#3BC0BB] border border-[#3BC0BB]/30 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add Task</span>
                      </button>
                    </div>
                  ) : (
                    colTasks.map((task, index) => {
                      const taskAssignees = users.filter((u) => task.assigneeIds.includes(u.id));
                      const taskSubtasks = subtasks.filter((s) => s.taskId === task.id);
                      const completedSubtasks = taskSubtasks.filter((s) => s.completed).length;

                      const isDragging = draggedTaskId === task.id;
                      const isDropTargetCard =
                        dragOverCardInfo?.status === status && dragOverCardInfo?.index === index;

                      const isOverdue =
                        task.dueDate &&
                        new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
                        task.status !== 'Done';

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id, status)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOverCard(e, status, index)}
                          onDrop={(e) => handleDrop(e, status)}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`relative p-3.5 rounded-xl border transition-all space-y-2.5 group shadow-xs kanban-task-card cursor-pointer ${
                            isDragging
                              ? 'opacity-40 border-dashed border-[#3BC0BB] bg-slate-800/40 scale-95'
                              : isLight
                              ? 'bg-white border-slate-200 hover:border-[#0D9488] hover:shadow-md hover:-translate-y-0.5'
                              : 'bg-[#16222F] border-[#233549] hover:border-[#3BC0BB] hover:shadow-md hover:-translate-y-0.5'
                          }`}
                        >
                          {/* HTML5 Drop Insertion Line Indicator */}
                          {isDropTargetCard && (
                            <div
                              className={`absolute left-0 right-0 h-1 bg-[#3BC0BB] rounded-full z-20 shadow-md shadow-[#3BC0BB]/50 ${
                                dragOverCardInfo.position === 'top' ? '-top-1.5' : '-bottom-1.5'
                              }`}
                            />
                          )}

                          {/* Card Top: List Name Badge & Drag Handle */}
                          <div className="flex items-center justify-between gap-1.5 text-[10px]">
                            {task.listName ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#7B68EE]/10 text-[#7B68EE] border border-[#7B68EE]/20 font-bold font-mono truncate max-w-[140px]">
                                {task.listName}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400">
                                #{task.id.slice(-5).toUpperCase()}
                              </span>
                            )}

                            <div
                              className="text-slate-400 group-hover:text-slate-200 p-0.5 rounded hover:bg-[#233549] transition-colors drag-handle cursor-grab active:cursor-grabbing no-print"
                              onDragStart={(e) => e.stopPropagation()}
                              title="Drag to reorder or move column"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Task Title */}
                          <h4
                            className={`text-xs font-bold leading-snug tracking-tight transition-colors kanban-task-title ${
                              isDragging
                                ? 'text-white'
                                : isLight
                                ? 'text-slate-900 group-hover:text-[#0D9488]'
                                : 'text-slate-100 group-hover:text-[#3BC0BB]'
                            }`}
                          >
                            {getDisplayTaskTitle(task)}
                          </h4>

                          {/* Description Snippet indicator if available */}
                          {task.description && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <AlignLeft className="w-3 h-3 text-slate-400 shrink-0" />
                              <p className="truncate text-[10px] text-slate-500">
                                {task.description}
                              </p>
                            </div>
                          )}

                          {/* Subtasks Count Pill (if any) */}
                          {taskSubtasks.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#7B68EE]/10 text-[#7B68EE] border border-[#7B68EE]/20 text-[10px] font-bold font-mono">
                                <ListTodo className="w-3 h-3" />
                                <span>
                                  {completedSubtasks}/{taskSubtasks.length} subtasks
                                </span>
                              </span>
                            </div>
                          )}

                          {/* Card Footer: Assignees, Due Date, Priority Flag */}
                          <div
                            className={`flex items-center justify-between pt-2 border-t text-[10px] kanban-task-footer ${
                              isDragging
                                ? 'border-white/20 text-slate-200'
                                : isLight
                                ? 'border-slate-100 text-slate-500'
                                : 'border-[#233549] text-slate-400'
                            }`}
                          >
                            {/* Assignee Avatar Stack */}
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                              {taskAssignees.length > 0 ? (
                                taskAssignees.slice(0, 3).map((u) => (
                                  <div
                                    key={u.id}
                                    className="w-5 h-5 rounded-full ring-1 ring-[#0D9488] bg-[#0773BB] text-white flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0"
                                    title={u.name}
                                  >
                                    {u.avatar ? (
                                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                    ) : (
                                      u.name.slice(0, 2).toUpperCase()
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                              )}
                              {taskAssignees.length > 3 && (
                                <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[8px] font-bold flex items-center justify-center">
                                  +{taskAssignees.length - 3}
                                </span>
                              )}
                            </div>

                            {/* Due Date & Priority Flag */}
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {task.dueDate && (
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                                    isOverdue
                                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                      : isLight
                                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                                      : 'bg-[#0D1520] text-slate-300 border-[#233549]'
                                  }`}
                                  title={`Due date: ${task.dueDate}`}
                                >
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>{task.dueDate.split('-').slice(1).join('/')}</span>
                                </span>
                              )}

                              {/* Priority Picker Interactive Flag */}
                              <div onDragStart={(e) => e.stopPropagation()} draggable={false}>
                                <PriorityPicker task={task} compact={true} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Quick Add Action */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveQuickAddStatus(status);
                    setQuickAddTitle('');
                  }}
                  className={`w-full py-1.5 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isLight
                      ? 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400'
                      : 'border-[#233549] text-slate-400 hover:bg-[#16222F] hover:text-slate-200 hover:border-[#3BC0BB]/40'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ClickUp Task Detail Modal / Inspector Drawer */}
      <ClickUpTaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* CSV Import Modal */}
      {showCsvImportModal && (
        <ProjectCsvImportModal
          projectId={selectedProjectId || projects[0]?.id || 'proj_1'}
          onClose={() => setShowCsvImportModal(false)}
        />
      )}
    </div>
  );
};

