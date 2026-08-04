import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Play,
  Square,
  AlertCircle,
  Filter,
  Search,
  CheckCircle2,
  Trash2,
  ChevronRight,
  Link,
  Tag,
  X,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, Priority } from '../../types';

export const TasksView: React.FC = () => {
  const {
    tasks,
    subtasks,
    dependencies,
    addTask,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    addDependency,
    removeDependency,
    projects,
    users,
    startTimer,
    stopTimer,
    timer,
    logTimeManual,
    selectedProjectId,
    setSelectedProjectId,
    searchQuery
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // New Task Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || 'proj_1');
  const [newPriority, setNewPriority] = useState<Priority>('Medium');
  const [newAssigneeId, setNewAssigneeId] = useState(users[0]?.id || 'usr_1');
  const [newEstHours, setNewEstHours] = useState(20);
  const [newDueDate, setNewDueDate] = useState('2026-08-25');
  const [newTags, setNewTags] = useState('Engineering, Quality');

  // Subtask Input State inside Drawer
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Dependency Select State inside Drawer
  const [depTaskIdToLink, setDepTaskIdToLink] = useState('');

  // Manual Time Input State inside Drawer
  const [manualHours, setManualHours] = useState<number>(2);
  const [manualNote, setManualNote] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId && t.projectId !== selectedProjectId) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchTag) return false;
    }
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const proj = projects.find((p) => p.id === newProjectId);

    addTask({
      projectId: newProjectId,
      companyId: proj ? proj.companyId : 'comp_1',
      title: newTitle,
      description: newDesc || 'Engineering task deliverable',
      status: 'To Do',
      priority: newPriority,
      assigneeIds: [newAssigneeId],
      reporterId: users[0]?.id || 'usr_1',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      estimatedHours: Number(newEstHours),
      tags: newTags.split(',').map((s) => s.trim()).filter(Boolean),
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const activeTask = tasks.find((t) => t.id === selectedTaskId);
  const activeTaskSubtasks = subtasks.filter((s) => s.taskId === selectedTaskId);
  const activeTaskDeps = dependencies.filter((d) => d.taskId === selectedTaskId);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#3BC0BB]" />
            <span>Task Management Suite</span>
          </h1>
          <p className="text-xs text-slate-400">
            Task execution with subtask decomposition, prerequisite dependency mapping, and time tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Scope Filter */}
          <select
            value={selectedProjectId || 'all'}
            onChange={(e) =>
              setSelectedProjectId(e.target.value === 'all' ? null : e.target.value)
            }
            className="bg-[#16222F] border border-[#233549] text-xs font-medium text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB]"
          >
            <option value="all">All Projects Scope</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#16222F] border border-[#233549] text-xs font-medium text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB]"
          >
            <option value="all">All Statuses</option>
            <option value="Backlog">Backlog</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg shadow-[#0773BB]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Main Table / Detail Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Table List (Span 2 or 3) */}
        <div className={`${selectedTaskId ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3`}>
          <div className="p-4 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0D1520] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#233549]">
                  <tr>
                    <th className="p-3">Task Deliverable</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Assignee</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Logged / Est</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233549]/50">
                  {filteredTasks.map((t) => {
                    const isTimerRunning = timer.active && timer.taskId === t.id;
                    const isSelected = selectedTaskId === t.id;
                    const assignee = users.find((u) => t.assigneeIds.includes(u.id));

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={`hover:bg-[#0D1520]/80 transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#0773BB]/10 border-l-4 border-l-[#0773BB]' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-bold text-white max-w-xs truncate">
                            {t.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {t.tags.map((tg) => (
                              <span
                                key={tg}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-[#233549] text-slate-300"
                              >
                                {tg}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              t.status === 'Done'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : t.status === 'In Progress'
                                ? 'bg-[#0773BB]/20 text-[#3BC0BB]'
                                : t.status === 'In Review'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-700/40 text-slate-300'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`font-semibold ${
                              t.priority === 'Urgent'
                                ? 'text-rose-400'
                                : t.priority === 'High'
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {assignee && (
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-6 h-6 rounded-full object-cover ring-1 ring-[#0773BB]"
                              />
                            )}
                            <span className="truncate max-w-[100px]">
                              {assignee?.name || 'Unassigned'}
                            </span>
                          </div>
                        </td>

                        <td className="p-3 font-mono text-slate-300">{t.dueDate}</td>

                        <td className="p-3 text-right font-mono font-semibold">
                          <span className="text-[#3BC0BB]">{t.loggedHours}h</span> / {t.estimatedHours}h
                        </td>

                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {isTimerRunning ? (
                            <button
                              onClick={() => stopTimer('Logged work')}
                              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white transition-all"
                              title="Stop Stopwatch"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                            </button>
                          ) : (
                            <button
                              onClick={() => startTimer(t.id, t.title)}
                              className="p-1.5 rounded-lg bg-[#0773BB]/20 hover:bg-[#0773BB] text-[#3BC0BB] hover:text-white transition-all"
                              title="Start Stopwatch Timer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Task Inspector & Drawer Panel */}
        {activeTask && (
          <div className="p-6 rounded-2xl bg-[#16222F] border border-[#233549] space-y-6 shadow-2xl animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between border-b border-[#233549] pb-4">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0773BB]/20 text-[#3BC0BB] font-bold">
                  TASK INSPECTOR
                </span>
                <h2 className="text-base font-bold text-white mt-1">{activeTask.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status & Priority Edit */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Status</label>
                <select
                  value={activeTask.status}
                  onChange={(e) =>
                    updateTask(activeTask.id, { status: e.target.value as TaskStatus })
                  }
                  className="w-full bg-[#0D1520] border border-[#233549] text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0773BB]"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Priority</label>
                <select
                  value={activeTask.priority}
                  onChange={(e) =>
                    updateTask(activeTask.id, { priority: e.target.value as Priority })
                  }
                  className="w-full bg-[#0D1520] border border-[#233549] text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0773BB]"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs space-y-1">
              <span className="text-slate-400 font-medium">Description</span>
              <p className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] text-slate-300 leading-relaxed">
                {activeTask.description}
              </p>
            </div>

            {/* Subtasks Hierarchy Manager */}
            <div className="space-y-3 pt-2 border-t border-[#233549]">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Subtasks Breakdown ({activeTaskSubtasks.length})</span>
              </div>

              <div className="space-y-2">
                {activeTaskSubtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-[#0D1520] border border-[#233549] text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleSubtask(st.id)}
                      className="w-4 h-4 rounded bg-[#16222F] border-[#233549] text-[#0773BB] focus:ring-0 cursor-pointer"
                    />
                    <span
                      className={`flex-1 ${
                        st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add subtask step..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#0773BB]"
                />
                <button
                  onClick={() => {
                    if (newSubtaskTitle) {
                      addSubtask(activeTask.id, newSubtaskTitle);
                      setNewSubtaskTitle('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0773BB] text-white text-xs font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Task Dependencies Manager */}
            <div className="space-y-3 pt-2 border-t border-[#233549]">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-[#3BC0BB]" />
                  <span>Prerequisite Dependencies</span>
                </span>
              </div>

              <div className="space-y-2">
                {activeTaskDeps.map((dep) => {
                  const reqTask = tasks.find((x) => x.id === dep.dependsOnTaskId);
                  return (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#0D1520] border border-[#233549] text-xs text-slate-300"
                    >
                      <span className="truncate max-w-[200px]">
                        Blocked by: <span className="text-amber-400 font-bold">{reqTask?.title || dep.dependsOnTaskId}</span>
                      </span>
                      <button
                        onClick={() => removeDependency(dep.id)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={depTaskIdToLink}
                  onChange={(e) => setDepTaskIdToLink(e.target.value)}
                  className="flex-1 bg-[#0D1520] border border-[#233549] rounded-xl px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value="">Select prerequisite task...</option>
                  {tasks
                    .filter((x) => x.id !== activeTask.id)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.title}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    if (depTaskIdToLink) {
                      addDependency(activeTask.id, depTaskIdToLink);
                      setDepTaskIdToLink('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#233549] hover:bg-[#0773BB] text-white text-xs font-medium"
                >
                  Link
                </button>
              </div>
            </div>

            {/* Manual Time Logger */}
            <div className="space-y-3 pt-2 border-t border-[#233549]">
              <span className="text-xs font-bold text-white">Log Work Hours</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={manualHours}
                  onChange={(e) => setManualHours(Number(e.target.value))}
                  className="w-20 bg-[#0D1520] border border-[#233549] rounded-xl px-2 py-1.5 text-xs text-white font-mono"
                />
                <input
                  type="text"
                  placeholder="Note (e.g., Welded joint couplings)..."
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="flex-1 bg-[#0D1520] border border-[#233549] rounded-xl px-2 py-1.5 text-xs text-white"
                />
                <button
                  onClick={() => {
                    if (manualHours > 0) {
                      logTimeManual(activeTask.id, manualHours, manualNote || 'Manual log');
                      setManualNote('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#3BC0BB] hover:bg-[#3BC0BB]/80 text-[#0D1520] font-bold text-xs"
                >
                  Log
                </button>
              </div>
            </div>

            {/* Delete Task Button */}
            <div className="pt-4 border-t border-[#233549]">
              <button
                onClick={() => {
                  deleteTask(activeTask.id);
                  setSelectedTaskId(null);
                }}
                className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-xs font-medium transition-all"
              >
                Delete Task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Task */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <h2 className="text-base font-bold text-white">Create New Task Deliverable</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pressure test radiator matrix assembly"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Scope</label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assignee</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newEstHours}
                    onChange={(e) => setNewEstHours(Number(e.target.value))}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#0773BB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Testing, Welding, Quality"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] text-white font-medium"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
