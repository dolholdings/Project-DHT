import React, { useState, useMemo } from 'react';
import { Columns, Plus, GripVertical, Move, Printer, ArrowUpDown, Pencil, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskStatus, Task, Priority } from '../../types';
import { TaskQuickPreviewPopover } from '../tasks/TaskQuickPreviewPopover';
import { DolphinTooltip } from '../common/DolphinTooltip';
import { PriorityBadge } from '../common/PriorityBadge';
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

  const [sortByPriority, setSortByPriority] = useState(true);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [editingDescTaskId, setEditingDescTaskId] = useState<string | null>(null);
  const [editingDescValue, setEditingDescValue] = useState<string>('');

  // HTML5 Drag-and-Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [dragOverCardInfo, setDragOverCardInfo] = useState<{
    status: TaskStatus;
    index: number;
    position: 'top' | 'bottom';
  } | null>(null);

  const statuses: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

  const handleCreateDefaultTask = (status: TaskStatus = 'To Do') => {
    addTask({
      projectId: selectedProjectId || projects[0]?.id || 'proj_1',
      companyId: activeCompany?.id || 'comp_1',
      title: 'New Deliverable Task',
      description: 'Defined via Kanban board quick-action',
      status,
      priority: 'High',
      assigneeIds: [currentUser?.id || 'usr_pk'],
      reporterId: currentUser?.id || 'usr_1',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      estimatedHours: 16,
      tags: ['Kanban', 'Deliverable'],
      listName: selectedListFilter || undefined
    });
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
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchTag = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
      const assignees = users.filter((u) => t.assigneeIds.includes(u.id));
      const matchAssignee = assignees.some(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
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
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in kanban-print-wrapper ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Executive Print Report Header for A4 Landscape PDF Export */}
      <div className="hidden print:block mb-6 p-5 border-b-2 border-slate-900 bg-white text-slate-900 rounded-none print-executive-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold tracking-wider text-slate-600 uppercase">
              {activeCompany?.name || 'DOLPHIN INDUSTRIAL PROJECTS'} — KANBAN WORKFLOW REPORT
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <Columns className="w-6 h-6 text-[#3BC0BB]" />
            <span>Agile Kanban Board</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Seamless HTML5 drag-and-drop workflow columns for effortless task stage transitions and reordering.
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
              sortByPriority
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-700/60 text-slate-300 border-slate-600/60 hover:bg-slate-700'
            }`}
            title="Toggle ordering tasks inside Kanban columns by Priority (Urgent > High > Medium > Low)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Priority Order: {sortByPriority ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700/80 border border-slate-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            title="Export formatted A4 Landscape Executive Report PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-300" />
            <span>Print Executive PDF (A4)</span>
          </button>

          <DolphinTooltip
            title="Interactive Reordering"
            badge="HTML5 Drag & Drop"
            content="Drag any task card up or down to reorder priority within a column, or drop into another column to transition workflow status."
            position="bottom"
            variant="glass"
          >
            <span className="px-3 py-1 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 text-xs font-mono flex items-center gap-1.5 cursor-help">
              <Move className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>HTML5 Drag & Drop Enabled</span>
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
                className={`p-4 rounded-2xl border flex flex-col h-[680px] space-y-3 shadow-md transition-all duration-150 kanban-column ${getStatusHeaderAccent(
                  status
                )} ${
                  isColumnHovered
                    ? theme === 'light'
                      ? 'bg-[#0773BB]/15 border-[#0773BB] ring-2 ring-[#0773BB]/40 shadow-lg'
                      : 'bg-[#0773BB]/25 border-[#3BC0BB] ring-2 ring-[#3BC0BB]/50 shadow-xl'
                    : theme === 'light'
                    ? 'bg-slate-100/90 border-slate-200'
                    : 'bg-[#16222F]/80 backdrop-blur-md border-[#233549]'
                }`}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between border-b pb-3 kanban-column-header ${
                  theme === 'light' ? 'border-slate-300' : 'border-[#233549]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(status)}`}></span>
                    <h3 className={`text-xs font-bold uppercase tracking-wider kanban-column-title ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      {status}
                    </h3>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border kanban-column-badge ${getStatusBadgeStyle(
                    status,
                    theme === 'light'
                  )}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Droppable Area */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 rounded-xl p-1 kanban-column-droppable">
                  {colTasks.length === 0 ? (
                    <div className={`h-full min-h-[180px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all ${
                      isColumnHovered
                        ? 'border-[#3BC0BB] bg-[#0773BB]/20 text-[#3BC0BB]'
                        : theme === 'light'
                        ? 'border-slate-300 bg-slate-50/60 text-slate-500'
                        : 'border-[#233549] bg-[#0D1520]/40 text-slate-400'
                    }`}>
                      <p className="text-xs font-bold mb-1">No {status} Tasks</p>
                      <p className="text-[10px] text-slate-500 mb-3">Drop task cards here or create a deliverable.</p>
                      <button
                        type="button"
                        onClick={() => handleCreateDefaultTask(status)}
                        className="px-3 py-1.5 rounded-lg bg-[#0773BB]/20 hover:bg-[#0773BB] text-[#3BC0BB] hover:text-white border border-[#3BC0BB]/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to {status}</span>
                      </button>
                    </div>
                  ) : (
                    colTasks.map((task, index) => {
                      const assignee = users.find((u) => task.assigneeIds.includes(u.id));

                      const priorityCardBorder =
                        task.priority === 'Urgent'
                          ? 'border-l-4 border-l-rose-500 shadow-rose-500/10'
                          : task.priority === 'High'
                          ? 'border-l-4 border-l-amber-500 shadow-amber-500/10'
                          : task.priority === 'Medium'
                          ? 'border-l-4 border-l-sky-500'
                          : 'border-l-4 border-l-slate-600';

                      const isDragging = draggedTaskId === task.id;
                      const isDropTargetCard =
                        dragOverCardInfo?.status === status && dragOverCardInfo?.index === index;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id, status)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOverCard(e, status, index)}
                          onDrop={(e) => handleDrop(e, status)}
                          className={`relative p-4 rounded-xl border transition-all space-y-3 group shadow-md kanban-task-card cursor-grab active:cursor-grabbing ${priorityCardBorder} ${
                            isDragging
                              ? 'opacity-40 border-dashed border-[#3BC0BB] bg-slate-800/40 scale-95'
                              : theme === 'light'
                              ? 'bg-white border-slate-200 hover:border-[#0773BB]'
                              : 'bg-[#0D1520] border-[#233549] hover:border-[#0773BB]'
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

                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <DolphinTooltip
                                title="Reorder Task"
                                badge="HTML5 Drag"
                                content="Drag card to reorder task priority within column or drop into a different column to update status."
                                position="top"
                                variant="glass"
                              >
                                <div className="text-slate-400 group-hover:text-white p-0.5 rounded hover:bg-[#233549] transition-colors drag-handle no-print">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                              </DolphinTooltip>

                              <div onDragStart={(e) => e.stopPropagation()} draggable={false}>
                                <PriorityBadge
                                  priority={task.priority}
                                  onChange={(newPriority) =>
                                    updateTask(task.id, {
                                      priority: newPriority,
                                    })
                                  }
                                  interactive
                                  size="sm"
                                />
                              </div>
                            </div>

                            <select
                              value={normalizeTaskStatus(task.status)}
                              onDragStart={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                updateTask(task.id, {
                                  status: e.target.value as TaskStatus,
                                })
                              }
                              className={`text-[10px] font-extrabold rounded-md border px-2 py-0.5 cursor-pointer transition-all no-print ${getStatusBadgeStyle(
                                task.status,
                                theme === 'light'
                              )}`}
                            >
                              {statuses.map((s) => (
                                <option
                                  key={s}
                                  value={s}
                                  className={theme === 'light' ? 'bg-white text-slate-900 font-medium' : 'bg-[#0D1520] text-slate-200 font-medium'}
                                >
                                  Move to {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          <TaskQuickPreviewPopover task={task}>
                            <h4 className={`text-xs font-bold transition-colors cursor-pointer kanban-task-title ${
                              isDragging
                                ? 'text-white'
                                : theme === 'light'
                                ? 'text-slate-900 group-hover:text-[#0D9488]'
                                : 'text-white group-hover:text-[#3BC0BB]'
                            }`}>
                              {getDisplayTaskTitle(task)}
                            </h4>

                            {/* Editable Task Description */}
                            {editingDescTaskId === task.id ? (
                              <div
                                className="flex items-center gap-1 mt-1.5"
                                onClick={(e) => e.stopPropagation()}
                                onDragStart={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editingDescValue}
                                  onChange={(e) => setEditingDescValue(e.target.value)}
                                  placeholder="Enter task description..."
                                  autoFocus
                                  className="px-2 py-0.5 text-[11px] rounded bg-[#0D1520] border border-[#3BC0BB] text-slate-100 focus:outline-none w-full font-sans"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateTask(task.id, { description: editingDescValue.trim() });
                                      setEditingDescTaskId(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingDescTaskId(null);
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateTask(task.id, { description: editingDescValue.trim() });
                                    setEditingDescTaskId(null);
                                  }}
                                  className="p-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shrink-0"
                                  title="Save description"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDescTaskId(null)}
                                  className="p-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 shrink-0"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1 group/kdesc mt-1">
                                <p className={`text-[11px] line-clamp-2 ${
                                  isDragging
                                    ? 'text-slate-100'
                                    : theme === 'light'
                                    ? 'text-slate-600'
                                    : 'text-slate-400'
                                }`}>
                                  {getTaskSubtext(task) || <span className="italic text-slate-500 text-[10px]">+ Add description...</span>}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingDescTaskId(task.id);
                                    setEditingDescValue(getTaskSubtext(task) || (task.description && !/^imported from csv/i.test(task.description) ? task.description : ''));
                                  }}
                                  className="p-0.5 text-slate-500 hover:text-[#3BC0BB] opacity-0 group-hover/kdesc:opacity-100 transition-opacity shrink-0"
                                  title="Edit task description"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </TaskQuickPreviewPopover>

                          <div className={`flex items-center justify-between pt-2 border-t text-[10px] font-mono kanban-task-footer ${
                            isDragging
                              ? 'border-white/20 text-slate-200'
                              : theme === 'light'
                              ? 'border-slate-200 text-slate-500'
                              : 'border-[#233549] text-slate-400'
                          }`}>
                            <div className="flex items-center gap-1.5" onDragStart={(e) => e.stopPropagation()}>
                              {assignee && (
                                <img
                                  src={assignee.avatar}
                                  alt={assignee.name}
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-[#0773BB] shrink-0"
                                />
                              )}
                              <span className="hidden print:inline-block font-sans text-[10px] font-semibold text-slate-800">
                                {assignee ? assignee.name : 'Unassigned'}
                              </span>
                              <select
                                value={task.assigneeIds[0] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val) {
                                    updateTask(task.id, { assigneeIds: [val] });
                                  }
                                }}
                                className="bg-[#16222F] text-[10px] text-slate-300 rounded border border-[#233549] px-1 py-0.5 focus:outline-none focus:border-[#3BC0BB] no-print"
                              >
                                <option value="">Unassigned</option>
                                {users.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="no-print" onDragStart={(e) => e.stopPropagation()}>
                              <input
                                type="date"
                                value={task.dueDate || ''}
                                onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                                className="bg-transparent border border-transparent hover:border-[#233549] focus:border-[#3BC0BB] focus:bg-[#16222F] text-rose-300 font-bold font-mono text-[10px] rounded px-1 py-0.5 cursor-pointer focus:outline-none transition-colors"
                                title="Click to edit due date"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
