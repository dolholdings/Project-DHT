import React from 'react';
import { Columns, Plus, AlertCircle, Clock, CheckCircle2, GripVertical, Move } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useApp } from '../../context/AppContext';
import { TaskStatus } from '../../types';

const SafeDraggable = Draggable as React.FC<any>;
const SafeDroppable = Droppable as React.FC<any>;


export const KanbanView: React.FC = () => {
  const { tasks, updateTask, users, activeCompany, selectedProjectId, theme } = useApp();

  const statuses: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

  const filteredTasks = tasks.filter((t) => {
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

    const targetStatus = destination.droppableId as TaskStatus;
    updateTask(draggableId, {
      status: targetStatus,
    });
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <Columns className="w-6 h-6 text-[#3BC0BB]" />
            <span>Agile Kanban Board</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Seamless drag-and-drop workflow columns for effortless task stage transitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 text-xs font-mono flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Drag & Drop Enabled</span>
          </span>
        </div>
      </div>

      {/* Kanban Drag and Drop Context */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const colTasks = filteredTasks.filter((t) => t.status === status);

            return (
              <div
                key={status}
                className={`p-4 rounded-2xl border flex flex-col h-[680px] space-y-3 shadow-md ${
                  theme === 'light' ? 'bg-slate-100/90 border-slate-200' : 'bg-[#16222F]/80 backdrop-blur-md border-[#233549]'
                }`}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between border-b pb-3 ${
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
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      {status}
                    </h3>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
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
                      className={`flex-1 overflow-y-auto space-y-3 pr-1 rounded-xl transition-colors p-1 ${
                        snapshot.isDraggingOver
                          ? theme === 'light'
                            ? 'bg-[#0773BB]/10 ring-2 ring-[#0773BB]/40'
                            : 'bg-[#0773BB]/20 ring-2 ring-[#3BC0BB]/40'
                          : ''
                      }`}
                    >
                      {colTasks.map((task, index) => {
                        const assignee = users.find((u) => task.assigneeIds.includes(u.id));

                        return (
                          <SafeDraggable key={task.id} draggableId={task.id} index={index}>
                            {(draggableProvided: any, draggableSnapshot: any) => (
                              <div
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                className={`p-4 rounded-xl border transition-all space-y-3 group shadow-md ${
                                  draggableSnapshot.isDragging
                                    ? 'bg-[#0773BB]/95 border-[#3BC0BB] text-white shadow-2xl scale-105 ring-2 ring-[#3BC0BB] z-50'
                                    : theme === 'light'
                                    ? 'bg-white border-slate-200 hover:border-[#0773BB]'
                                    : 'bg-[#0D1520] border-[#233549] hover:border-[#0773BB]'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      {...draggableProvided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-white p-0.5 rounded hover:bg-[#233549] transition-colors"
                                      title="Drag to move column"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <span
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                        task.priority === 'Urgent'
                                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                          : task.priority === 'High'
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-slate-700/40 text-slate-300'
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>

                                  <select
                                    value={task.status}
                                    onChange={(e) =>
                                      updateTask(task.id, {
                                        status: e.target.value as TaskStatus,
                                      })
                                    }
                                    className={`text-[10px] rounded border px-1.5 py-0.5 ${
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

                                <h4 className={`text-xs font-bold transition-colors ${
                                  draggableSnapshot.isDragging
                                    ? 'text-white'
                                    : theme === 'light'
                                    ? 'text-slate-900 group-hover:text-[#0D9488]'
                                    : 'text-white group-hover:text-[#3BC0BB]'
                                }`}>
                                  {task.title}
                                </h4>

                                <p className={`text-[11px] line-clamp-2 ${
                                  draggableSnapshot.isDragging
                                    ? 'text-slate-100'
                                    : theme === 'light'
                                    ? 'text-slate-600'
                                    : 'text-slate-400'
                                }`}>
                                  {task.description}
                                </p>

                                <div className={`flex items-center justify-between pt-2 border-t text-[10px] font-mono ${
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
                                    <select
                                      value={task.assigneeIds[0] || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) {
                                          updateTask(task.id, { assigneeIds: [val] });
                                        }
                                      }}
                                      className="bg-[#16222F] text-[10px] text-slate-300 rounded border border-[#233549] px-1 py-0.5 focus:outline-none focus:border-[#3BC0BB]"
                                    >
                                      <option value="">Unassigned</option>
                                      {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                          {u.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>{task.dueDate}</div>
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

