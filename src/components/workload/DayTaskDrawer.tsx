import React, { useState } from 'react';
import { User, Task, Project } from '../../types';
import { DayAllocation, WorkloadDayColumn } from './types';
import {
  X,
  Plus,
  Clock,
  AlertTriangle,
  Check,
  Calendar,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { getPriorityBadgeStyle } from '../../lib/priorityUtils';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { UserAvatar } from '../common/UserAvatar';

interface DayTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  dayAlloc: DayAllocation | null;
  dayCol: WorkloadDayColumn | null;
  allUsers: User[];
  projects: Project[];
  isLight: boolean;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>) => Task;
  onReassignTask: (taskId: string, targetUserId: string, targetDate?: string) => void;
}

export const DayTaskDrawer: React.FC<DayTaskDrawerProps> = ({
  isOpen,
  onClose,
  user,
  dayAlloc,
  dayCol,
  allUsers,
  projects,
  isLight,
  onUpdateTask,
  onAddTask,
  onReassignTask
}) => {
  if (!isOpen || !user || !dayAlloc || !dayCol) return null;

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskHours, setNewTaskHours] = useState(4);
  const [newTaskProjectId, setNewTaskProjectId] = useState(projects[0]?.id || '');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('Medium');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      projectId: newTaskProjectId,
      companyId: user.companyId,
      title: newTaskTitle.trim(),
      description: `Task scheduled for ${user.name} on ${dayAlloc.date}`,
      status: 'To Do',
      priority: newTaskPriority,
      assigneeIds: [user.id],
      reporterId: user.id,
      startDate: dayAlloc.date,
      dueDate: dayAlloc.date,
      estimatedHours: Number(newTaskHours) || 4,
      tags: ['Workload', 'Scheduled']
    });

    setNewTaskTitle('');
    setNewTaskHours(4);
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121B26] border-[#233549] text-white'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <UserAvatar
              name={user.name}
              email={user.email}
              role={user.role}
              size="md"
              theme={isLight ? 'light' : 'dark'}
            />
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>{user.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-mono font-normal">
                  {user.department}
                </span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#0096C7]" />
                <span>
                  {dayCol.weekdayShort}, {dayCol.monthName} {dayCol.dayNum}, {dayCol.year}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-700/30 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CAPACITY STATUS SUMMARY CARD */}
        <div className="p-4 border-b border-slate-700/20">
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
              dayAlloc.isOverloaded
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : dayAlloc.percent > 85
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5" />
              <div>
                <div className="font-bold text-xs uppercase tracking-wider">
                  Daily Allocation: {dayAlloc.hours}h / {dayAlloc.dailyMaxHours}h ({dayAlloc.percent}%)
                </div>
                <div className="text-[11px] opacity-85">
                  {dayAlloc.isOverloaded
                    ? `Exceeds max 8h daily limit by ${dayAlloc.formattedOverloadBadge}`
                    : `${Math.max(0, 8 - dayAlloc.hours)}h available capacity remaining`}
                </div>
              </div>
            </div>

            {dayAlloc.isOverloaded && (
              <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-extrabold text-xs font-mono shadow-sm">
                {dayAlloc.formattedOverloadBadge}
              </span>
            )}
          </div>
        </div>

        {/* TASK LIST BODY */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assigned Tasks for this Day ({dayAlloc.tasks.length})
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNew ? 'Cancel' : 'Schedule New Task'}</span>
            </button>
          </div>

          {/* Inline Add Task Form */}
          {isAddingNew && (
            <form
              onSubmit={handleCreateTask}
              className={`p-3.5 rounded-2xl border space-y-3 animate-in zoom-in-95 ${
                isLight ? 'bg-slate-50 border-teal-500/40' : 'bg-[#16222F] border-teal-500/50'
              }`}
            >
              <div className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Schedule Task for {dayCol.weekdayShort} ({dayAlloc.date})</span>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'
                      : 'bg-[#0D1520] border-[#233549] text-white focus:border-teal-500'
                  }`}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Project</label>
                  <select
                    value={newTaskProjectId}
                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none ${
                      isLight ? 'bg-white border-slate-300' : 'bg-[#0D1520] border-[#233549]'
                    }`}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none font-mono font-bold ${
                      isLight ? 'bg-white border-slate-300' : 'bg-[#0D1520] border-[#233549]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none ${
                      isLight ? 'bg-white border-slate-300' : 'bg-[#0D1520] border-[#233549]'
                    }`}
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          )}

          {/* Tasks List */}
          {dayAlloc.tasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No tasks currently scheduled for {user.name} on this day.
            </div>
          ) : (
            <div className="space-y-2.5">
              {dayAlloc.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-2xl border space-y-2 transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#16222F] border-[#233549]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-xs text-slate-200 dark:text-white">
                        {getDisplayTaskTitle(task)}
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {task.description || 'No description provided.'}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-500/20 text-teal-400 shrink-0">
                      {task.estimatedHours || 4}h
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-700/20 text-xs">
                    {/* Inline Reassign User */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Reassign:</span>
                      <select
                        value={task.assigneeIds[0] || user.id}
                        onChange={(e) => onReassignTask(task.id, e.target.value, dayAlloc.date)}
                        className={`px-2 py-1 rounded-lg text-[11px] border outline-none cursor-pointer ${
                          isLight ? 'bg-white border-slate-300' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                        }`}
                      >
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Adjust hours */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Hours:</span>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={task.estimatedHours || 4}
                        onChange={(e) => onUpdateTask(task.id, { estimatedHours: Number(e.target.value) })}
                        className={`w-14 px-2 py-0.5 rounded-md text-xs font-mono font-bold text-center border outline-none ${
                          isLight ? 'bg-white border-slate-300' : 'bg-[#0D1520] border-[#233549] text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <div className="text-xs text-slate-400 font-mono">
            {dayAlloc.tasks.length} task(s) • Total: {dayAlloc.hours}h
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
