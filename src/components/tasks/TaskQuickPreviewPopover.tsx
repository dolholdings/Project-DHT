import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User as UserIcon,
  Calendar,
  Clock,
  CheckSquare,
  Paperclip,
  AlertTriangle,
  Flame,
  Zap,
  CheckCircle2,
  FileText,
  Download,
  Eye,
  Tag,
  Briefcase,
  ChevronRight,
  ShieldAlert,
  Repeat,
  Layers,
  ArrowUpRight,
  Circle,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, Priority, Subtask, ProjectFile, User, Project } from '../../types';
import { AssigneePicker } from './AssigneePicker';

export interface TaskQuickPreviewPopoverProps {
  task: Task;
  children: React.ReactNode;
  onOpenFullTask?: (taskId: string) => void;
  className?: string;
  disabled?: boolean;
}

export const TaskQuickPreviewPopover: React.FC<TaskQuickPreviewPopoverProps> = ({
  task,
  children,
  onOpenFullTask,
  className = '',
  disabled = false
}) => {
  const {
    users,
    projects,
    subtasks,
    files,
    dependencies,
    tasks,
    toggleSubtask,
    updateTask,
    theme,
    customFields
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subtasks' | 'files'>('overview');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  // Derived task metadata
  const project = projects.find((p) => p.id === task.projectId);
  const taskAssignees = users.filter((u) => (task.assigneeIds || []).includes(u.id));
  const reporter = users.find((u) => u.id === task.reporterId);
  const taskSubtasks = subtasks.filter((st) => st.taskId === task.id);
  const completedSubtasksCount = taskSubtasks.filter((st) => st.completed).length;
  const subtaskProgressPct =
    taskSubtasks.length > 0 ? Math.round((completedSubtasksCount / taskSubtasks.length) * 100) : 0;

  // Attached files matching project or containing task title/ID
  const attachedFiles = files.filter(
    (f) =>
      f.projectId === task.projectId ||
      (f.name && f.name.toLowerCase().includes(task.title.substring(0, 8).toLowerCase()))
  );

  // Check blockers / prerequisites
  const taskDependencies = dependencies.filter((d) => d.taskId === task.id);
  const prerequisiteTaskIds = taskDependencies.map((d) => d.dependsOnTaskId);
  const prerequisiteTasks = tasks.filter((t) => prerequisiteTaskIds.includes(t.id));
  const isBlocked = prerequisiteTasks.some((t) => t.status !== 'Done');

  // Days remaining calculation
  const getDueStatus = () => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (task.status === 'Done') {
      return { text: 'Completed', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
    }
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d Overdue`, color: 'text-rose-400 bg-rose-500/20 border-rose-500/30 font-bold' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30 font-bold' };
    }
    if (diffDays <= 3) {
      return { text: `Due in ${diffDays}d`, color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' };
    }
    return { text: `Due ${task.dueDate}`, color: 'text-slate-400 bg-slate-800/60 border-slate-700' };
  };

  const dueInfo = getDueStatus();

  // Mouse hover handlers with grace delay
  const handleMouseEnter = () => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Medium':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-400';
      case 'In Progress':
        return 'bg-sky-400';
      case 'In Review':
        return 'bg-amber-400';
      case 'To Do':
        return 'bg-indigo-400';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div
      className={`relative inline-block w-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Wrapped Target Item */}
      {children}

      {/* Popover Preview Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 left-0 sm:left-auto bottom-full mb-2 w-80 sm:w-96 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ring-1 ring-white/10 ${
              isLight
                ? 'bg-white/95 border-slate-300 text-slate-800 shadow-slate-900/10'
                : 'bg-[#0D1520]/95 border-[#233549] text-slate-100 shadow-black/80'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header: Status, Priority & Codes */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#233549]/70">
              <div className="space-y-1 pr-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Indicator */}
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                    {task.status}
                  </span>

                  {/* Priority Indicator */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>

                  {/* Critical Path or Milestone Pinned Badges */}
                  {task.isCriticalPath && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-400" />
                      Critical
                    </span>
                  )}

                  {task.isMilestone && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-300" />
                      Milestone
                    </span>
                  )}
                </div>

                {/* Task Title */}
                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 mt-1">
                  {task.title}
                </h3>

                {/* Project Name */}
                {project && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Briefcase className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    <span>{project.code}</span>
                    <span className="text-slate-600">•</span>
                    <span className="truncate">{project.title}</span>
                  </div>
                )}
              </div>

              {/* Quick Status & Priority Selectors inside popover */}
              <div className="shrink-0 flex items-center gap-1.5">
                <select
                  value={task.priority}
                  onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
                  className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
                    task.priority === 'Urgent'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : task.priority === 'High'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : task.priority === 'Medium'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-700/40 text-slate-300 border-slate-600/40'
                  }`}
                >
                  <option value="Urgent" className="bg-[#0D1520] text-rose-300">Urgent</option>
                  <option value="High" className="bg-[#0D1520] text-amber-300">High</option>
                  <option value="Medium" className="bg-[#0D1520] text-cyan-300">Medium</option>
                  <option value="Low" className="bg-[#0D1520] text-slate-300">Low</option>
                </select>

                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-[#16222F] border border-[#233549] text-slate-200 focus:outline-none cursor-pointer hover:border-[#3BC0BB]"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            {/* Navigation Tabs (Overview, Subtasks, Files) */}
            <div className="flex items-center gap-1 my-2.5 p-1 rounded-xl bg-[#16222F]/80 border border-[#233549] text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-1 rounded-lg transition-all text-center ${
                  activeTab === 'overview' ? 'bg-[#3BC0BB] text-[#020712] font-extrabold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('subtasks')}
                className={`flex-1 py-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                  activeTab === 'subtasks' ? 'bg-[#3BC0BB] text-[#020712] font-extrabold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Subtasks</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-200 font-mono">
                  {taskSubtasks.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className={`flex-1 py-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                  activeTab === 'files' ? 'bg-[#3BC0BB] text-[#020712] font-extrabold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Files</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-200 font-mono">
                  {attachedFiles.length}
                </span>
              </button>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-3 text-xs">
                {/* Description snippet */}
                {task.description && (
                  <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed bg-[#16222F]/50 p-2.5 rounded-xl border border-[#233549]/60 italic">
                    "{task.description}"
                  </p>
                )}

                {/* Assignees Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-[#3BC0BB]" />
                      Assigned Team Members ({taskAssignees.length})
                    </span>
                  </div>

                  <div className="pt-0.5">
                    <AssigneePicker
                      assigneeIds={task.assigneeIds || []}
                      users={users}
                      onUpdateAssignees={(newIds) => updateTask(task.id, { assigneeIds: newIds })}
                      size="sm"
                      showLabel={true}
                    />
                  </div>
                </div>

                {/* Dates & Effort Progress */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Due Date Card */}
                  <div className="p-2 rounded-xl bg-[#16222F] border border-[#233549] space-y-1">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#3BC0BB]" />
                        <span>Due Date</span>
                      </span>
                      {dueInfo && (
                        <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${dueInfo.color}`}>
                          {dueInfo.text}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={task.dueDate || ''}
                      onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                      className="w-full bg-[#0D1520] border border-[#233549] text-rose-300 font-mono font-bold text-xs rounded px-2 py-0.5 focus:outline-none focus:border-[#3BC0BB] cursor-pointer"
                    />
                  </div>

                  {/* Logged Hours vs Estimated */}
                  <div className="p-2 rounded-xl bg-[#16222F] border border-[#233549] space-y-1">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span>Work Effort</span>
                      </span>
                      <span className="font-mono text-white font-bold text-[10px]">
                        {task.loggedHours || 0} / {task.estimatedHours || 0}h
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-sky-400 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            task.estimatedHours > 0 ? ((task.loggedHours || 0) / task.estimatedHours) * 100 : 0
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Fields in Popover */}
                {customFields.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#233549]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-[#3BC0BB]" />
                        Custom Fields ({customFields.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 bg-[#16222F]/60 p-2.5 rounded-xl border border-[#233549]">
                      {customFields.map((cf) => {
                        const val = task.customFields?.[cf.id] ?? (cf.defaultValue ?? '');
                        return (
                          <div key={cf.id} className="flex items-center justify-between text-xs gap-2">
                            <span className="text-slate-400 font-semibold truncate max-w-[120px]" title={cf.name}>
                              {cf.name}:
                            </span>
                            {cf.type === 'dropdown' ? (
                              <select
                                value={String(val)}
                                onChange={(e) => {
                                  const updated = { ...(task.customFields || {}), [cf.id]: e.target.value };
                                  updateTask(task.id, { customFields: updated });
                                }}
                                className="bg-[#0D1520] border border-[#233549] text-white text-[11px] rounded px-2 py-0.5 focus:outline-none font-medium"
                              >
                                <option value="">-- None --</option>
                                {cf.options?.map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={cf.type === 'number' ? 'number' : 'text'}
                                value={val}
                                placeholder="Empty"
                                onChange={(e) => {
                                  const v =
                                    cf.type === 'number'
                                      ? e.target.value === ''
                                        ? ''
                                        : Number(e.target.value)
                                      : e.target.value;
                                  const updated = { ...(task.customFields || {}), [cf.id]: v };
                                  updateTask(task.id, { customFields: updated });
                                }}
                                className="bg-[#0D1520] border border-[#233549] text-white text-[11px] rounded px-2 py-0.5 w-28 focus:outline-none font-medium"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dependencies or Blockers Notice */}
                {isBlocked && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Blocked by unfinished prerequisite tasks</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SUBTASKS */}
            {activeTab === 'subtasks' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Subtask Progress:</span>
                  <span className="font-bold text-[#3BC0BB]">
                    {completedSubtasksCount} / {taskSubtasks.length} ({subtaskProgressPct}%)
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-[#3BC0BB] rounded-full transition-all"
                    style={{ width: `${subtaskProgressPct}%` }}
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {taskSubtasks.length > 0 ? (
                    taskSubtasks.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => toggleSubtask(st.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          st.completed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300 line-through'
                            : 'bg-[#16222F] border-[#233549] text-white hover:border-[#3BC0BB]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <CheckSquare
                            className={`w-4 h-4 shrink-0 ${st.completed ? 'text-emerald-400' : 'text-slate-500'}`}
                          />
                          <span className="text-xs truncate">{st.title}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          st.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {st.completed ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs italic bg-[#16222F]/50 rounded-xl border border-[#233549]">
                      No subtasks added yet for this task item.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ATTACHED FILES */}
            {activeTab === 'files' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Task & Project Attachments:</span>
                  <span className="font-bold text-white">{attachedFiles.length} File(s)</span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {attachedFiles.length > 0 ? (
                    attachedFiles.map((f) => (
                      <div
                        key={f.id}
                        className="p-2.5 rounded-xl bg-[#16222F] border border-[#233549] flex items-center justify-between gap-2 hover:border-[#3BC0BB] transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-teal-500/20 text-[#3BC0BB] shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">{f.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                              <span>{f.size}</span>
                              <span>•</span>
                              <span>v{f.currentVersion || 1}</span>
                              <span>•</span>
                              <span>{f.uploadedByName || 'Team Member'}</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={f.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#3BC0BB] hover:text-[#020712] text-slate-300 transition-colors shrink-0"
                          title="Download or Preview File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs italic bg-[#16222F]/50 rounded-xl border border-[#233549]">
                      No attachments or documents uploaded for this task.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Popover Footer: Open Full Task Action */}
            <div className="mt-3 pt-2.5 border-t border-[#233549]/70 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                ID: {task.id.substring(0, 10)}
              </span>

              {onOpenFullTask && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullTask(task.id);
                  }}
                  className="px-3 py-1 rounded-xl bg-[#3BC0BB]/20 hover:bg-[#3BC0BB] text-[#3BC0BB] hover:text-[#020712] border border-[#3BC0BB]/40 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                >
                  <span>Open Detailed View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Arrow Pointer */}
            <div className="absolute top-full left-6 -mt-[1px] w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#0D1520]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
