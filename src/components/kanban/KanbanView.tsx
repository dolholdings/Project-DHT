import React from 'react';
import { Columns, Plus, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskStatus } from '../../types';

export const KanbanView: React.FC = () => {
  const { tasks, updateTask, users, activeCompany, selectedProjectId } = useApp();

  const statuses: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId && t.projectId !== selectedProjectId) return false;
    return t.companyId === activeCompany.id;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Columns className="w-6 h-6 text-[#3BC0BB]" />
            <span>Agile Kanban Board</span>
          </h1>
          <p className="text-xs text-slate-400">
            Interactive workflow columns for stage transitions and active status management.
          </p>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
        {statuses.map((status) => {
          const colTasks = filteredTasks.filter((t) => t.status === status);

          return (
            <div
              key={status}
              className="p-4 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] flex flex-col h-[650px] space-y-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-[#233549] pb-3">
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
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {status}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#0D1520] text-[#3BC0BB] border border-[#233549]">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colTasks.map((task) => {
                  const assignee = users.find((u) => task.assigneeIds.includes(u.id));

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] hover:border-[#0773BB] transition-all space-y-3 group shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            task.priority === 'Urgent'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : task.priority === 'High'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-700/30 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>

                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateTask(task.id, {
                              status: e.target.value as TaskStatus,
                            })
                          }
                          className="bg-[#16222F] text-[10px] text-slate-300 rounded border border-[#233549] px-1.5 py-0.5"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              Move to {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-[#3BC0BB] transition-colors">
                        {task.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[#233549] text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          {assignee && (
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-[#0773BB]"
                            />
                          )}
                          <span className="truncate max-w-[80px]">{assignee?.name}</span>
                        </div>

                        <div>{task.dueDate}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
