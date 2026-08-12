import React, { useState, useMemo } from 'react';
import { Columns, Plus, AlertCircle, Clock, CheckCircle2, GripVertical, Move, Printer, ArrowUpDown, Flame, Zap } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useApp } from '../../context/AppContext';
import { TaskStatus, Task, Priority } from '../../types';
import { TaskQuickPreviewPopover } from '../tasks/TaskQuickPreviewPopover';
import { DolphinTooltip } from '../common/DolphinTooltip';
import { PriorityBadge } from '../common/PriorityBadge';
import { getAccessibleTasks, getAccessibleProjects } from '../../lib/permissions';

const SafeDraggable = Draggable as React.FC<any>;
const SafeDroppable = Droppable as React.FC<any>;

const PRIORITY_RANK: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

export const KanbanView: React.FC = () => {
  const { tasks, updateTask, reorderTasks, users, activeCompany, projects, selectedProjectId, theme, currentUser } = useApp();
  const [sortByPriority, setSortByPriority] = useState(true);

  const statuses: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

  const accessibleProjects = useMemo(() => {
    return getAccessibleProjects(currentUser, projects);
  }, [currentUser, projects]);

  const accessibleTasks = useMemo(() => {
    return getAccessibleTasks(currentUser, tasks, projects);
  }, [currentUser, tasks, projects]);

  const activeProject = accessibleProjects.find((p) => p.id === selectedProjectId) || accessibleProjects[0];

  const filteredTasks = accessibleTasks.filter((t) => {
    if (selectedProjectId && t.projectId !== selectedProjectId) return false;
    return t.companyId === activeCompany.id;
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    // Isolate tasks belonging to the current board filter vs other boards/spaces
    const boardTasks = tasks.filter((t) => {
      if (selectedProjectId && t.projectId !== selectedProjectId) return false;
      return t.companyId === activeCompany.id;
    });

    const nonBoardTasks = tasks.filter((t) => {
      if (selectedProjectId && t.projectId !== selectedProjectId) return true;
      return t.companyId !== activeCompany.id;
    });

    // Group current board tasks by column status
    const colTasksMap: Record<TaskStatus, Task[]> = {
      'Backlog': boardTasks.filter((t) => t.status === 'Backlog'),
      'To Do': boardTasks.filter((t) => t.status === 'To Do'),
      'In Progress': boardTasks.filter((t) => t.status === 'In Progress'),
      'In Review': boardTasks.filter((t) => t.status === 'In Review'),
      'Done': boardTasks.filter((t) => t.status === 'Done'),
    };

    if (sourceStatus === destStatus) {
      // Reorder tasks within the same column
      const sourceCol = Array.from(colTasksMap[sourceStatus] || []);
      const [movedTask] = sourceCol.splice(source.index, 1);
      if (movedTask) {
        sourceCol.splice(destination.index, 0, movedTask);
        colTasksMap[sourceStatus] = sourceCol;
      }
    } else {
      // Move task across columns and place at target index
      const sourceCol = Array.from(colTasksMap[sourceStatus] || []);
      const [movedTask] = sourceCol.splice(source.index, 1);
      if (movedTask) {
        const updatedMovedTask: Task = {
          ...movedTask,
          status: destStatus,
          updatedAt: new Date().toISOString(),
        };
        const destCol = Array.from(colTasksMap[destStatus] || []);
        destCol.splice(destination.index, 0, updatedMovedTask);

        colTasksMap[sourceStatus] = sourceCol;
        colTasksMap[destStatus] = destCol;

        // Trigger side effects (activity log, notifications, automations, firestore sync)
        updateTask(draggableId, { status: destStatus });
      }
    }

    // Reconstruct full ordered tasks list
    const newBoardTasks = statuses.flatMap((s) => colTasksMap[s] || []);
    const newTasks = [...nonBoardTasks, ...newBoardTasks];

    reorderTasks(newTasks);
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
            Seamless drag-and-drop workflow columns for effortless task stage transitions and reordering.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
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
            badge="Drag & Drop"
            content="Drag any task card up or down to reorder priority within a column, or drag between columns to change status."
            position="bottom"
            variant="glass"
          >
            <span className="px-3 py-1 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 text-xs font-mono flex items-center gap-1.5 cursor-help">
              <Move className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>Drag & Drop Reordering Enabled</span>
            </span>
          </DolphinTooltip>
        </div>
      </div>

      {/* Kanban Drag and Drop Context */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 kanban-board-grid">
          {statuses.map((status) => {
            let colTasks = filteredTasks.filter((t) => t.status === status);
            if (sortByPriority) {
              colTasks = [...colTasks].sort((a, b) => {
                const wA = PRIORITY_RANK[a.priority] || 1;
                const wB = PRIORITY_RANK[b.priority] || 1;
                return wB - wA;
              });
            }

            return (
              <div
                key={status}
                className={`p-4 rounded-2xl border flex flex-col h-[680px] space-y-3 shadow-md kanban-column ${
                  theme === 'light' ? 'bg-slate-100/90 border-slate-200' : 'bg-[#16222F]/80 backdrop-blur-md border-[#233549]'
                }`}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between border-b pb-3 kanban-column-header ${
                  theme === 'light' ? 'border-slate-300' : 'border-[#233549]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        status === 'Done'
                          ? 'bg-emerald-400'
                          : status === 'In Progress'
                          ? 'bg-[#0773BB]'
                          : status === 'In Review'
                          ? 'bg-amber-400'
                          : 'bg-slate-500'
                      }`}
                    ></span>
                    <h3 className={`text-xs font-bold uppercase tracking-wider kanban-column-title ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      {status}
                    </h3>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border kanban-column-badge ${
                    theme === 'light' ? 'bg-white text-[#0D9488] border-slate-300' : 'bg-[#0D1520] text-[#3BC0BB] border-[#233549]'
                  }`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Droppable Column Area */}
                <SafeDroppable droppableId={status}>
                  {(provided: any, snapshot: any) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto space-y-3 pr-1 rounded-xl transition-colors p-1 kanban-column-droppable ${
                        snapshot.isDraggingOver
                          ? theme === 'light'
                            ? 'bg-[#0773BB]/10 ring-2 ring-[#0773BB]/40'
                            : 'bg-[#0773BB]/20 ring-2 ring-[#3BC0BB]/40'
                          : ''
                      }`}
                    >
                      {colTasks.map((task, index) => {
                        const assignee = users.find((u) => task.assigneeIds.includes(u.id));

                        const priorityCardBorder =
                          task.priority === 'Urgent'
                            ? 'border-l-4 border-l-rose-500 shadow-rose-500/10'
                            : task.priority === 'High'
                            ? 'border-l-4 border-l-amber-500 shadow-amber-500/10'
                            : task.priority === 'Medium'
                            ? 'border-l-4 border-l-sky-500'
                            : 'border-l-4 border-l-slate-600';

                        return (
                          <SafeDraggable key={task.id} draggableId={task.id} index={index}>
                            {(draggableProvided: any, draggableSnapshot: any) => (
                              <div
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                className={`p-4 rounded-xl border transition-all space-y-3 group shadow-md kanban-task-card ${priorityCardBorder} ${
                                  draggableSnapshot.isDragging
                                    ? 'bg-[#0773BB]/95 border-[#3BC0BB] text-white shadow-2xl scale-105 ring-2 ring-[#3BC0BB] z-50'
                                    : theme === 'light'
                                    ? 'bg-white border-slate-200 hover:border-[#0773BB]'
                                    : 'bg-[#0D1520] border-[#233549] hover:border-[#0773BB]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <DolphinTooltip
                                      title="Reorder Task"
                                      badge="Priority Drag"
                                      content="Drag vertically to reorder task priority, or drop into a different column to transition workflow status."
                                      position="top"
                                      variant="glass"
                                    >
                                      <div
                                        {...draggableProvided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-white p-0.5 rounded hover:bg-[#233549] transition-colors drag-handle no-print"
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                    </DolphinTooltip>
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

                                  <select
                                    value={task.status}
                                    onChange={(e) =>
                                      updateTask(task.id, {
                                        status: e.target.value as TaskStatus,
                                      })
                                    }
                                    className={`text-[10px] rounded border px-1.5 py-0.5 no-print ${
                                      theme === 'light'
                                        ? 'bg-slate-50 border-slate-300 text-slate-800'
                                        : 'bg-[#16222F] border-[#233549] text-slate-300'
                                    }`}
                                  >
                                    {statuses.map((s) => (
                                      <option key={s} value={s}>
                                        Move to {s}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <TaskQuickPreviewPopover task={task}>
                                  <h4 className={`text-xs font-bold transition-colors cursor-pointer kanban-task-title ${
                                    draggableSnapshot.isDragging
                                      ? 'text-white'
                                      : theme === 'light'
                                      ? 'text-slate-900 group-hover:text-[#0D9488]'
                                      : 'text-white group-hover:text-[#3BC0BB]'
                                  }`}>
                                    {task.title}
                                  </h4>

                                  <p className={`text-[11px] line-clamp-2 mt-1 cursor-pointer kanban-task-desc ${
                                    draggableSnapshot.isDragging
                                      ? 'text-slate-100'
                                      : theme === 'light'
                                      ? 'text-slate-600'
                                      : 'text-slate-400'
                                  }`}>
                                    {task.description}
                                  </p>
                                </TaskQuickPreviewPopover>

                                <div className={`flex items-center justify-between pt-2 border-t text-[10px] font-mono kanban-task-footer ${
                                  draggableSnapshot.isDragging
                                    ? 'border-white/20 text-slate-200'
                                    : theme === 'light'
                                    ? 'border-slate-200 text-slate-500'
                                    : 'border-[#233549] text-slate-400'
                                }`}>
                                  <div className="flex items-center gap-1.5">
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

                                  <div className="no-print">
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
                            )}
                          </SafeDraggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </SafeDroppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
