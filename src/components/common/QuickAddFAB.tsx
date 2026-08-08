import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Zap,
  X,
  Check,
  Calendar,
  Clock,
  User as UserIcon,
  FolderKanban,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskStatus, Priority } from '../../types';

export const QuickAddFAB: React.FC = () => {
  const {
    projects,
    users,
    activeCompany,
    selectedProjectId,
    setSelectedProjectId,
    addTask,
    theme,
    setActiveTab
  } = useApp();

  const isLight = theme === 'light';

  const [isOpen, setIsOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<{ title: string; projName: string; taskId: string } | null>(null);

  // Form State
  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [priority, setPriority] = useState<Priority>('High');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Set default project on open or change
  useEffect(() => {
    if (projects.length > 0) {
      if (selectedProjectId && projects.some((p) => p.id === selectedProjectId)) {
        setProjectId(selectedProjectId);
      } else {
        setProjectId(projects[0].id);
      }
    }
  }, [selectedProjectId, projects, isOpen]);

  // Set default assignee (first admin or user)
  useEffect(() => {
    if (users.length > 0 && assigneeIds.length === 0) {
      setAssigneeIds([users[0].id]);
    }
  }, [users]);

  // Default due date to 7 days from now
  useEffect(() => {
    if (!dueDate) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [dueDate]);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard shortcut (Alt+N or Cmd+Shift+A to open Quick Add)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'n') || (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !projectId) return;

    setIsSubmitting(true);

    const targetProj = projects.find((p) => p.id === projectId) || projects[0];

    try {
      addTask({
        companyId: targetProj?.companyId || activeCompany?.id || 'comp_corp',
        projectId: projectId,
        title: title.trim(),
        description: description.trim() || 'Created via Dashboard Quick Add FAB.',
        status: status,
        priority: priority,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : [users[0]?.id || 'usr_pk'],
        startDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        estimatedHours: Number(estimatedHours) || 8,
        dependencies: [],
        predecessors: [],
        progress: 0,
      });

      setSuccessToast({
        title: title.trim(),
        projName: targetProj?.title || 'Project',
        taskId: `task_${Date.now()}`
      });

      // Clear input fields for next quick add
      setTitle('');
      setDescription('');
      
      // Auto-hide success toast after 4s
      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);

    } catch (err) {
      console.error('Failed to quick add task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 no-print flex flex-col items-end gap-2">
        {/* Floating Success Notification Toast */}
        {successToast && (
          <div className="mb-2 p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 max-w-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Task Created!</div>
              <div className="text-xs font-semibold text-white truncate">{successToast.title}</div>
              <div className="text-[10px] text-slate-400">Project: {successToast.projName}</div>
            </div>
            <button
              onClick={() => {
                setSelectedProjectId(projectId);
                setActiveTab('tasks');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-all"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex items-center gap-2 px-4 py-3.5 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer border ${
            isOpen
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 ring-4 ring-rose-500/30'
              : 'bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white border-cyan-300/40 shadow-cyan-500/25 ring-4 ring-cyan-500/20'
          }`}
          title="Quick Add Task in any Project (Alt+N)"
        >
          {isOpen ? (
            <X className="w-5 h-5 transition-transform duration-300 rotate-90" />
          ) : (
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-300 animate-bounce" />
              <span className="text-xs font-extrabold tracking-wide uppercase pr-1">Quick Add</span>
              <Plus className="w-4 h-4 text-white/90" />
            </div>
          )}

          {/* Pulse Glow Background Ring */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            </span>
          )}
        </button>
      </div>

      {/* Quick Add Flyout Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in no-print">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 animate-in zoom-in-95 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#121E2B] border-[#223548] text-slate-100'
            }`}
          >
            {/* Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182738] border-[#223548]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Quick Add Task</h3>
                  <p className="text-[11px] text-slate-400">Create a task in any project without leaving this view</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Alt + N
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Target Project Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5" />
                  Target Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={`w-full text-xs font-semibold rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-[#182738] border-[#223548] text-white'
                  }`}
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Inspect Pressure Relief Valves on Skid #4..."
                  className={`w-full text-xs font-medium rounded-xl border px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                      : 'bg-[#182738] border-[#223548] text-white placeholder:text-slate-500'
                  }`}
                  required
                />
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Description / Notes (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add quick details, scope, or safety notes..."
                  className={`w-full text-xs font-medium rounded-xl border px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                      : 'bg-[#182738] border-[#223548] text-white placeholder:text-slate-500'
                  }`}
                />
              </div>

              {/* Priority & Status Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Priority
                  </label>
                  <div className="flex gap-1">
                    {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map((p) => {
                      const active = priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                            active
                              ? p === 'Urgent'
                                ? 'bg-rose-500 text-white border-rose-400'
                                : p === 'High'
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : p === 'Medium'
                                ? 'bg-sky-500 text-slate-950 border-sky-400'
                                : 'bg-slate-500 text-white border-slate-400'
                              : isLight
                              ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                              : 'bg-[#182738] border-[#223548] text-slate-400 hover:bg-[#223548]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className={`w-full text-xs font-semibold rounded-xl border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#182738] border-[#223548] text-white'
                    }`}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Backlog">Backlog</option>
                    <option value="In Review">In Review</option>
                  </select>
                </div>
              </div>

              {/* Assignees Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                  Assign Team Members
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl border border-slate-700/50 bg-[#182738]/50">
                  {users.map((u) => {
                    const isAssigned = assigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleToggleAssignee(u.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                          isAssigned
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{u.name.split(' ')[0]}</span>
                        {isAssigned && <Check className="w-3 h-3 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due Date & Est Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full text-xs font-mono font-medium rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#182738] border-[#223548] text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className={`w-full text-xs font-mono font-medium rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#182738] border-[#223548] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
