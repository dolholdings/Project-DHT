import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar,
  User as UserIcon,
  Flag,
  CheckSquare,
  Check,
  Plus,
  Trash2,
  Clock,
  Flame,
  Zap,
  Activity,
  Repeat,
  GitCommit,
  Lock,
  Unlock,
  MessageSquare,
  Send,
  Sliders,
  FolderKanban,
  Tag,
  AlertCircle,
  Pencil,
  Percent,
  Layers,
  Sparkles,
  RefreshCw,
  Maximize2,
  Minimize2,
  ListTodo
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, Priority, RecurrenceType } from '../../types';
import { AssigneePicker } from './AssigneePicker';
import { PriorityPicker } from './PriorityPicker';
import { TaskInteractiveProgressBar } from './TaskInteractiveProgressBar';
import { calculatePriorityScore } from '../../lib/priorityScore';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { normalizeTaskStatus, getStatusBadgeStyle } from '../../lib/statusUtils';

interface ClickUpTaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
}

export const ClickUpTaskDetailModal: React.FC<ClickUpTaskDetailModalProps> = ({
  taskId,
  onClose
}) => {
  const {
    tasks,
    updateTask,
    deleteTask,
    subtasks,
    addSubtask,
    toggleSubtask,
    dependencies,
    addDependency,
    removeDependency,
    customFields,
    taskComments,
    addTaskComment,
    logTimeManual,
    projects,
    users,
    currentUser,
    activeCompany,
    theme,
    addListToProject
  } = useApp();

  const isLight = theme === 'light';

  // Find task
  const task = useMemo(() => {
    if (!taskId) return null;
    return tasks.find((t) => t.id === taskId) || null;
  }, [tasks, taskId]);

  // Local state for editing fields
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [manualHours, setManualHours] = useState<number>(1);
  const [manualNote, setManualNote] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [showTagInput, setShowTagInput] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Space & list management
  const [selectedList, setSelectedList] = useState<string>('');
  const [newListNameInput, setNewListNameInput] = useState<string>('');

  // Sync state with selected task
  useEffect(() => {
    if (task) {
      setTitleValue(getDisplayTaskTitle(task));
      setDescValue(task.description || '');
      setSelectedList(task.listName || '');
    }
  }, [task]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!task) return null;

  const currentProject = projects.find((p) => p.id === task.projectId) || projects[0];
  const taskSubtasks = subtasks.filter((s) => s.taskId === task.id);
  const completedSubtasksCount = taskSubtasks.filter((s) => s.completed).length;
  const subtaskProgressPercent =
    taskSubtasks.length > 0
      ? Math.round((completedSubtasksCount / taskSubtasks.length) * 100)
      : 0;

  // Task comments
  const taskCommentsList = taskComments.filter((c) => c.taskId === task.id);

  // Priority Score
  const pScore = calculatePriorityScore(task, dependencies, tasks);

  // Dependencies
  const blockerDeps = dependencies.filter((d) => d.taskId === task.id);
  const blockedDeps = dependencies.filter((d) => d.dependsOnTaskId === task.id);
  const blockerTasks = tasks.filter((t) => blockerDeps.some((d) => d.dependsOnTaskId === t.id));
  const blockedTasks = tasks.filter((t) => blockedDeps.some((d) => d.taskId === t.id));
  const isBlocked = blockerTasks.some((t) => t.status !== 'Done');

  const availablePrereqTasks = tasks.filter(
    (t) => t.id !== task.id && !blockerTasks.some((b) => b.id === t.id)
  );

  const statuses: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

  // Handlers
  const handleSaveTitle = () => {
    if (titleValue.trim() && titleValue !== task.title) {
      updateTask(task.id, { title: titleValue.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    updateTask(task.id, { description: descValue.trim() });
    setIsEditingDesc(false);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, newSubtaskTitle.trim(), currentUser?.id);
      setNewSubtaskTitle('');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommentText.trim()) {
      addTaskComment(task.id, newCommentText.trim());
      setNewCommentText('');
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed) {
      const existingTags = task.tags || [];
      if (!existingTags.includes(trimmed)) {
        updateTask(task.id, { tags: [...existingTags, trimmed] });
      }
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const existingTags = task.tags || [];
    updateTask(task.id, { tags: existingTags.filter((t) => t !== tagToRemove) });
  };

  // Due date status styling
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
    task.status !== 'Done';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col rounded-2xl border shadow-2xl transition-all overflow-hidden ${
          isExpanded
            ? 'w-[98vw] h-[96vh] max-w-none'
            : 'w-full max-w-4xl max-h-[92vh]'
        } ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#121B26] border-[#233549] text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ClickUp Breadcrumb & Quick Actions Bar */}
        <div
          className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold overflow-hidden">
            <span
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono text-[11px] ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700'
                  : 'bg-[#16222F] border-[#233549] text-[#3BC0BB]'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>{currentProject?.code || 'SPACE'}</span>
            </span>
            <span className="text-slate-400">/</span>
            <span className="truncate max-w-[150px] sm:max-w-xs text-slate-500">
              {currentProject?.title || 'Main Workspace'}
            </span>
            {task.listName && (
              <>
                <span className="text-slate-400">/</span>
                <span className="px-2 py-0.5 rounded-md bg-[#7B68EE]/10 text-[#7B68EE] border border-[#7B68EE]/30 font-mono text-[10px] font-bold">
                  {task.listName}
                </span>
              </>
            )}
            <span className="text-slate-400">/</span>
            <span className="font-mono text-[10px] text-slate-400">
              #{task.id.slice(-6).toUpperCase()}
            </span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status Dropdown */}
            <select
              value={normalizeTaskStatus(task.status)}
              onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
              className={`text-xs font-bold px-3 py-1 rounded-xl border cursor-pointer transition-all ${getStatusBadgeStyle(
                task.status,
                isLight
              )}`}
            >
              {statuses.map((s) => (
                <option
                  key={s}
                  value={s}
                  className={isLight ? 'bg-white text-slate-900 font-medium' : 'bg-[#0D1520] text-white font-medium'}
                >
                  {s.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Priority Picker */}
            <div className="shrink-0">
              <PriorityPicker task={task} />
            </div>

            {/* Expand / Minimize Window */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg border transition-colors hidden sm:inline-flex ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                  : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white'
              }`}
              title={isExpanded ? 'Restore size' : 'Maximize'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                  : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30'
              }`}
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Large Title with In-place Edit */}
          <div className="space-y-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTitleValue(getDisplayTaskTitle(task));
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className={`w-full text-lg sm:text-xl font-bold rounded-xl px-3 py-2 border focus:outline-none ${
                    isLight
                      ? 'bg-white border-[#0D9488] text-slate-900'
                      : 'bg-[#0D1520] border-[#3BC0BB] text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="px-3 py-2 rounded-xl bg-[#0D9488] text-white font-bold text-xs shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-start justify-between gap-3 cursor-pointer py-1 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-500/10 transition-colors"
                title="Click to edit task title"
              >
                <h1
                  className={`text-lg sm:text-xl font-bold tracking-tight leading-snug ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {getDisplayTaskTitle(task)}
                </h1>
                <span className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#3BC0BB] transition-opacity p-1">
                  <Pencil className="w-4 h-4" />
                </span>
              </div>
            )}
          </div>

          {/* 2. Metadata Quick Attributes Strip */}
          <div
            className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}
          >
            {/* Assignees */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#3BC0BB]" />
                <span>Assignees</span>
              </label>
              <div>
                <AssigneePicker
                  assigneeIds={task.assigneeIds || []}
                  users={users}
                  onUpdateAssignees={(newIds) => updateTask(task.id, { assigneeIds: newIds })}
                  size="md"
                  showLabel={true}
                />
              </div>
            </div>

            {/* Due Date & Overdue Alert */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span>Due Date</span>
                </span>
                {isOverdue && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold uppercase font-mono">
                    Overdue
                  </span>
                )}
              </label>
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold border transition-colors cursor-pointer ${
                  isOverdue
                    ? 'border-rose-500 text-rose-500 bg-rose-500/10'
                    : isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB]'
                }`}
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#3BC0BB]" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={task.startDate || ''}
                onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
                className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB]'
                }`}
              />
            </div>

            {/* Priority Score Indicator */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Priority Score</span>
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${pScore.bgColor} ${pScore.color} ${pScore.borderColor}`}
                >
                  {pScore.score}/100
                </span>
              </label>
              <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden mt-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    pScore.tier === 'CRITICAL'
                      ? 'bg-rose-500'
                      : pScore.tier === 'HIGH'
                      ? 'bg-amber-400'
                      : 'bg-sky-400'
                  }`}
                  style={{ width: `${pScore.score}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 truncate">{pScore.tier} Priority Tier</p>
            </div>
          </div>

          {/* 3. Interactive Progress Bar (Draggable / Clickable Slider) */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Percent className="w-4 h-4 text-[#3BC0BB]" />
                <span>Task Execution Progress</span>
              </span>
              <span className="font-mono text-xs font-bold text-[#3BC0BB]">
                {task.progress ?? 0}%
              </span>
            </div>
            <TaskInteractiveProgressBar
              task={task}
            />
          </div>

          {/* 4. Space & List Hierarchy Route */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-300">
                <FolderKanban className="w-4 h-4 text-[#3BC0BB]" />
                <span>Space & List Organization</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Space Selector */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Space / Project</label>
                <select
                  value={task.projectId}
                  onChange={(e) => {
                    const newPId = e.target.value;
                    const newP = projects.find((p) => p.id === newPId);
                    updateTask(task.id, {
                      projectId: newPId,
                      companyId: newP?.companyId || task.companyId
                    });
                  }}
                  className={`w-full rounded-xl px-3 py-2 font-medium border focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB]'
                  }`}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* List Selector */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">List in Space</label>
                <select
                  value={selectedList === '__new__' ? '__new__' : task.listName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__new__') {
                      setSelectedList('__new__');
                    } else {
                      setSelectedList(val);
                      updateTask(task.id, { listName: val || undefined });
                    }
                  }}
                  className={`w-full rounded-xl px-3 py-2 font-medium border focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB]'
                  }`}
                >
                  <option value="">-- General / Main List --</option>
                  {(currentProject?.lists || []).map((l) => (
                    <option key={l} value={l}>
                      List: "{l}"
                    </option>
                  ))}
                  <option value="__new__">+ Create New List...</option>
                </select>
              </div>
            </div>

            {selectedList === '__new__' && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Enter new list name (e.g. ERP Fixes, Catalogues)..."
                  value={newListNameInput}
                  onChange={(e) => setNewListNameInput(e.target.value)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none ${
                    isLight
                      ? 'bg-white border-[#0D9488] text-slate-900'
                      : 'bg-[#16222F] border-[#3BC0BB] text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newListNameInput.trim();
                    if (trimmed) {
                      addListToProject(task.projectId, trimmed);
                      updateTask(task.id, { listName: trimmed });
                      setSelectedList(trimmed);
                      setNewListNameInput('');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0D9488] text-white font-bold text-xs shrink-0"
                >
                  Create & Move
                </button>
              </div>
            )}
          </div>

          {/* 5. Description Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Task Description</span>
              {!isEditingDesc && (
                <button
                  type="button"
                  onClick={() => setIsEditingDesc(true)}
                  className="text-[#0D9488] dark:text-[#3BC0BB] hover:underline flex items-center gap-1 font-bold text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Description</span>
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  rows={4}
                  placeholder="Add details, markdown, specifications, or notes about this task..."
                  className={`w-full p-3 rounded-2xl border text-xs focus:outline-none resize-y ${
                    isLight
                      ? 'bg-white border-[#0D9488] text-slate-900'
                      : 'bg-[#0D1520] border-[#3BC0BB] text-slate-100'
                  }`}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDescValue(task.description || '');
                      setIsEditingDesc(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-700'
                        : 'bg-[#16222F] border-[#233549] text-slate-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDescription}
                    className="px-4 py-1.5 rounded-xl bg-[#0D9488] text-white font-bold text-xs shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDesc(true)}
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-colors leading-relaxed min-h-[60px] ${
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                    : 'bg-[#0D1520] border-[#233549] text-slate-300 hover:bg-[#16222F]'
                }`}
              >
                {task.description ? (
                  <p className="whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="italic text-slate-500 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Click to add task description or notes...</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 6. Subtasks Checklist with Real-time Count */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#7B68EE]" />
                <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Subtasks Checklist
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#7B68EE]/20 text-[#7B68EE] border border-[#7B68EE]/30">
                {completedSubtasksCount} / {taskSubtasks.length} ({subtaskProgressPercent}%)
              </span>
            </div>

            {/* Subtask Progress Mini Bar */}
            {taskSubtasks.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-[#7B68EE] transition-all duration-300"
                  style={{ width: `${subtaskProgressPercent}%` }}
                />
              </div>
            )}

            {/* Subtask Item List */}
            <div className="space-y-1.5">
              {taskSubtasks.map((st) => (
                <div
                  key={st.id}
                  className={`flex items-center justify-between gap-3 p-2 rounded-xl border transition-all ${
                    st.completed
                      ? isLight
                        ? 'bg-slate-100 border-slate-200 opacity-60'
                        : 'bg-[#16222F]/40 border-transparent opacity-60'
                      : isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-[#16222F] border-[#233549]'
                  }`}
                >
                  <label className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleSubtask(st.id)}
                      className="w-4 h-4 rounded border-slate-400 text-[#7B68EE] focus:ring-[#7B68EE] cursor-pointer"
                    />
                    <span
                      className={`text-xs truncate ${
                        st.completed ? 'line-through text-slate-500' : isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {st.assignedTo ? users.find((u) => u.id === st.assignedTo)?.name || 'Assignee' : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Add Subtask Form */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add new subtask item..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className={`flex-1 rounded-xl px-3 py-1.5 text-xs border focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-[#7B68EE]'
                    : 'bg-[#16222F] border-[#233549] text-white focus:border-[#7B68EE]'
                }`}
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-[#7B68EE] text-white font-bold text-xs hover:bg-[#6853e6] disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* 7. Tags Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#3BC0BB]" />
                <span>Tags & Labels</span>
              </span>
              {!showTagInput && (
                <button
                  type="button"
                  onClick={() => setShowTagInput(true)}
                  className="text-xs text-[#0D9488] dark:text-[#3BC0BB] hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Tag</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(task.tags || []).map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-[#16222F] text-slate-300 border-[#233549]'
                  }`}
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {showTagInput && (
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') setShowTagInput(false);
                    }}
                    placeholder="Tag name..."
                    autoFocus
                    className={`px-2 py-0.5 text-xs rounded-lg border focus:outline-none w-28 ${
                      isLight
                        ? 'bg-white border-[#0D9488] text-slate-900'
                        : 'bg-[#16222F] border-[#3BC0BB] text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="p-1 rounded-lg bg-[#0D9488] text-white text-xs font-bold"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 8. Custom Fields */}
          {customFields.length > 0 && (
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2 border-slate-500/20">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Sliders className="w-4 h-4 text-[#3BC0BB]" />
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>Custom Fields</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {customFields.length} Defined
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customFields.map((cf) => {
                  const currentVal = task.customFields?.[cf.id] ?? (cf.defaultValue ?? '');
                  return (
                    <div key={cf.id} className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                        <span>{cf.name}</span>
                        <span className="text-[9px] uppercase font-mono text-slate-500">{cf.type}</span>
                      </label>
                      {cf.type === 'dropdown' ? (
                        <select
                          value={String(currentVal)}
                          onChange={(e) => {
                            updateTask(task.id, {
                              customFields: {
                                ...(task.customFields || {}),
                                [cf.id]: e.target.value
                              }
                            });
                          }}
                          className={`w-full rounded-xl px-2.5 py-1.5 text-xs font-medium border ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900'
                              : 'bg-[#16222F] border-[#233549] text-white'
                          }`}
                        >
                          <option value="">-- Select --</option>
                          {cf.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={cf.type === 'number' ? 'number' : 'text'}
                          value={currentVal}
                          placeholder={cf.description || `Enter ${cf.name}...`}
                          onChange={(e) => {
                            const val =
                              cf.type === 'number'
                                ? e.target.value === ''
                                  ? ''
                                  : Number(e.target.value)
                                : e.target.value;
                            updateTask(task.id, {
                              customFields: {
                                ...(task.customFields || {}),
                                [cf.id]: val
                              }
                            });
                          }}
                          className={`w-full rounded-xl px-2.5 py-1.5 text-xs border ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900'
                              : 'bg-[#16222F] border-[#233549] text-white'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 9. Time Tracking & Activity Comments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time Tracking Log */}
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Clock className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Time Logged</span>
                </span>
                <span className="font-mono text-xs font-bold text-[#3BC0BB]">
                  {task.loggedHours || 0}h / {task.estimatedHours || 0}h
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={manualHours}
                  onChange={(e) => setManualHours(Math.max(0.5, Number(e.target.value)))}
                  className={`w-16 rounded-xl px-2 py-1 text-xs font-mono text-center border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-[#16222F] border-[#233549] text-white'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Activity note..."
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className={`flex-1 rounded-xl px-2.5 py-1 text-xs border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-[#16222F] border-[#233549] text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualHours > 0) {
                      logTimeManual(task.id, manualHours, manualNote || 'Direct work log');
                      setManualNote('');
                    }
                  }}
                  className="px-3 py-1 rounded-xl bg-[#0D9488] text-white font-bold text-xs shadow-xs"
                >
                  Log
                </button>
              </div>
            </div>

            {/* Recurrence Status */}
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Repeat className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Recurrence</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                  {task.recurrence?.type?.toUpperCase() || 'ONE-TIME'}
                </span>
              </div>
              <div className="flex items-center gap-1 pt-1">
                {(['none', 'daily', 'weekly', 'monthly'] as RecurrenceType[]).map((rtype) => (
                  <button
                    key={rtype}
                    type="button"
                    onClick={() => {
                      if (rtype === 'none') {
                        updateTask(task.id, { recurrence: undefined });
                      } else {
                        updateTask(task.id, {
                          recurrence: { type: rtype, interval: 1, autoRegenerateOnComplete: true }
                        });
                      }
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      (task.recurrence?.type || 'none') === rtype
                        ? 'bg-[#0D9488] text-white'
                        : isLight
                        ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-[#16222F] border border-[#233549] text-slate-400 hover:text-white'
                    }`}
                  >
                    {rtype}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 10. Activity & Comments Section */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold border-b pb-2 border-slate-500/20">
              <span className="flex items-center gap-1.5 text-slate-300">
                <MessageSquare className="w-4 h-4 text-[#3BC0BB]" />
                <span>Comments & Discussion ({taskCommentsList.length})</span>
              </span>
            </div>

            {/* Comment Stream */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {taskCommentsList.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic py-2 text-center">
                  No comments yet. Write an update or tag a teammate below.
                </p>
              ) : (
                taskCommentsList.map((c) => {
                  const author = users.find((u) => u.id === c.userId);
                  return (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-[#3BC0BB]">{author?.name || 'Teammate'}</span>
                        <span className="font-mono">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className={isLight ? 'text-slate-800' : 'text-slate-200'}>{c.content}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Post Comment */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Write a comment or status note..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-[#0D9488]'
                    : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB]'
                }`}
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#0D9488] text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div
          className={`px-4 sm:px-6 py-3 border-t flex items-center justify-between gap-3 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Are you sure you want to permanently delete task "${task.title}"?`)) {
                deleteTask(task.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Task</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-200 text-slate-800 hover:bg-slate-300 border-slate-300'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
              }`}
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
