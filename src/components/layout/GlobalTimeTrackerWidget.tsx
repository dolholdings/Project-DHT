import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Play,
  Square,
  ChevronDown,
  X,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Briefcase,
  UserCheck,
  Tag,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Project, TimeEntry, Priority } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';

export const formatTimeSeconds = (sec: number): string => {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const GlobalTimeTrackerWidget: React.FC = () => {
  const {
    timer,
    startTimer,
    stopTimer,
    discardTimer,
    logTimeManual,
    deleteTimeEntry,
    timeEntries,
    tasks,
    projects,
    currentUser,
    theme
  } = useApp();

  const isLight = theme === 'light';

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'manual' | 'history'>('stopwatch');
  const [taskSearch, setTaskSearch] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [workDescription, setWorkDescription] = useState('');

  // Manual Log Form State
  const [manualTaskId, setManualTaskId] = useState<string>('');
  const [manualHours, setManualHours] = useState<string>('1.0');
  const [manualDate, setManualDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [manualDescription, setManualDescription] = useState<string>('Task execution and deliverable work');
  const [manualBillable, setManualBillable] = useState<boolean>(true);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Current active task details
  const activeTask = useMemo(() => {
    if (!timer.taskId) return null;
    return tasks.find((t) => t.id === timer.taskId) || null;
  }, [timer.taskId, tasks]);

  const activeProject = useMemo(() => {
    if (!activeTask) return null;
    return projects.find((p) => p.id === activeTask.projectId) || null;
  }, [activeTask, projects]);

  // Filter tasks for task selection
  const availableTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Filter out completed tasks if not searching
      const matchesSearch =
        taskSearch.trim() === '' ||
        t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(taskSearch.toLowerCase());

      const matchesProject = selectedProjectFilter === 'all' || t.projectId === selectedProjectFilter;

      return matchesSearch && matchesProject;
    });
  }, [tasks, taskSearch, selectedProjectFilter]);

  // Filter today's time logs
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayEntries = useMemo(() => {
    return timeEntries.filter((e) => e.date === todayDateStr && (e.userId === currentUser.id || !e.userId));
  }, [timeEntries, todayDateStr, currentUser.id]);

  const todayTotalHours = useMemo(() => {
    return todayEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  }, [todayEntries]);

  const todayBillableHours = useMemo(() => {
    return todayEntries.filter((e) => e.billable).reduce((sum, e) => sum + (e.hours || 0), 0);
  }, [todayEntries]);

  // Set default manual task when tasks change
  useEffect(() => {
    if (!manualTaskId && tasks.length > 0) {
      setManualTaskId(tasks[0].id);
    }
  }, [tasks, manualTaskId]);

  const handleStopTimer = () => {
    const desc = workDescription.trim() || 'Stopwatch timer session';
    stopTimer(desc);
    setWorkDescription('');
  };

  const handleDiscardTimer = () => {
    if (window.confirm('Discard active timer without logging hours?')) {
      if (discardTimer) {
        discardTimer();
      } else {
        stopTimer('Discarded');
      }
      setWorkDescription('');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(manualHours);
    if (isNaN(hrs) || hrs <= 0) {
      alert('Please enter a valid number of hours (e.g., 0.5, 1.5).');
      return;
    }
    if (!manualTaskId) {
      alert('Please select a task to log time against.');
      return;
    }

    logTimeManual(manualTaskId, hrs, manualDescription.trim() || 'Manual time log', manualDate);
    setManualSuccessMsg(`Logged ${hrs} hrs successfully!`);
    setTimeout(() => setManualSuccessMsg(null), 3000);
  };

  return (
    <div id="tour-time-tracker" ref={containerRef} className="relative inline-block text-left">
      {/* 1. TOP NAVBAR TRIGGER BUTTON */}
      {timer.active ? (
        // Active Running Timer Pill
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all shadow-xs ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-500/10'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-emerald-950/30'
          }`}
        >
          {/* Pulsing Beacon & Click to Open Details */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity focus:outline-hidden"
            title={`Active Timer: ${timer.taskTitle || 'Task'} — Click for controls`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            <span className="font-mono font-bold text-xs tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatTimeSeconds(timer.seconds)}
            </span>

            <span className="hidden lg:inline text-[11px] font-semibold max-w-[110px] truncate text-slate-700 dark:text-slate-200">
              {timer.taskTitle || 'Tracking...'}
            </span>

            <ChevronDown className={`w-3 h-3 text-emerald-600 dark:text-emerald-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Quick Direct Stop Action on Navbar */}
          <button
            type="button"
            onClick={handleStopTimer}
            className="p-1 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
            title="Stop & Log Time"
          >
            <Square className="w-2.5 h-2.5 fill-current" />
          </button>
        </div>
      ) : (
        // Inactive / Idle Timer Pill
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-[#16222F] hover:bg-[#1E2E3E] border-[#233549] text-slate-300 hover:text-white'
          }`}
          title="Open Global Time Tracking & Stopwatch"
        >
          <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
          <span className="hidden sm:inline">Time Tracker</span>
          <Play className="w-2.5 h-2.5 text-emerald-400 fill-current ml-0.5" />
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* 2. FLOATING TIME TRACKER POPOVER MODAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
                : 'bg-[#16222F] border-[#233549] text-slate-100 shadow-black/60'
            }`}
            style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className={`p-3.5 border-b flex items-center justify-between gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#3BC0BB]/15 text-[#3BC0BB] border border-[#3BC0BB]/30">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs flex items-center gap-1.5">
                    <span>Global Time Tracking</span>
                    {timer.active && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        LIVE
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Track billable hours & sprint productivity
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className={`flex border-b px-2 pt-1 text-xs font-semibold ${
              isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#111A24] border-[#233549]'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('stopwatch')}
                className={`flex-1 py-2 px-2 text-center rounded-t-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'stopwatch'
                    ? isLight
                      ? 'bg-white text-[#0D9488] border-t-2 border-[#0D9488] shadow-xs'
                      : 'bg-[#16222F] text-[#3BC0BB] border-t-2 border-[#3BC0BB]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Play className="w-3 h-3" />
                <span>{timer.active ? 'Active Timer' : 'Stopwatch'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 px-2 text-center rounded-t-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'manual'
                    ? isLight
                      ? 'bg-white text-[#0D9488] border-t-2 border-[#0D9488] shadow-xs'
                      : 'bg-[#16222F] text-[#3BC0BB] border-t-2 border-[#3BC0BB]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>Manual Log</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 px-2 text-center rounded-t-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'history'
                    ? isLight
                      ? 'bg-white text-[#0D9488] border-t-2 border-[#0D9488] shadow-xs'
                      : 'bg-[#16222F] text-[#3BC0BB] border-t-2 border-[#3BC0BB]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Today ({todayTotalHours.toFixed(1)}h)</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-3.5 space-y-3 overflow-y-auto flex-1 max-h-[60vh]">
              {/* ============================================================
                  TAB 1: STOPWATCH / LIVE TRACKER
                 ============================================================ */}
              {activeTab === 'stopwatch' && (
                <div className="space-y-3.5">
                  {timer.active ? (
                    // Running Timer View
                    <div className="space-y-3">
                      {/* Big Digital Display Card */}
                      <div className={`p-4 rounded-2xl border text-center relative overflow-hidden ${
                        isLight
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-emerald-950/20 border-emerald-500/30'
                      }`}>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Stopwatch Running</span>
                        </div>

                        <div className="text-3xl sm:text-4xl font-mono font-black tracking-wider text-emerald-700 dark:text-emerald-300 my-1">
                          {formatTimeSeconds(timer.seconds)}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          ~{(timer.seconds / 3600).toFixed(2)} Billable Hours
                        </div>
                      </div>

                      {/* Active Task Details */}
                      {activeTask && (
                        <div className={`p-3 rounded-xl border space-y-1.5 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                        }`}>
                          <div className="flex items-center justify-between gap-1 text-[10px]">
                            <span className="font-bold text-[#3BC0BB] font-mono truncate max-w-[160px]">
                              {activeProject?.title || 'Project Space'}
                            </span>
                            <PriorityBadge priority={activeTask.priority} />
                          </div>

                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                            {activeTask.title}
                          </div>

                          {/* Progress indicator */}
                          <div className="pt-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                              <span>Logged: {activeTask.loggedHours || 0}h</span>
                              <span>Est: {activeTask.estimatedHours || 0}h</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, (((activeTask.loggedHours || 0) + (timer.seconds / 3600)) / (activeTask.estimatedHours || 1)) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Optional Notes Input */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Work Session Notes:
                        </label>
                        <input
                          type="text"
                          value={workDescription}
                          onChange={(e) => setWorkDescription(e.target.value)}
                          placeholder="What deliverable or subtask are you working on?"
                          className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-hidden transition-all ${
                            isLight
                              ? 'bg-white border-slate-300 focus:border-[#0D9488]'
                              : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#3BC0BB]'
                          }`}
                        />
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleStopTimer}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop & Log Time</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDiscardTimer}
                          className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs transition-all cursor-pointer"
                          title="Discard session without recording"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Inactive - Pick a Task to Start Timer
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Select Task to Track:</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {availableTasks.length} tasks
                        </span>
                      </div>

                      {/* Task Search & Filter */}
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={taskSearch}
                            onChange={(e) => setTaskSearch(e.target.value)}
                            placeholder="Search tasks..."
                            className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-hidden transition-all ${
                              isLight
                                ? 'bg-white border-slate-300 focus:border-[#0D9488]'
                                : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#3BC0BB]'
                            }`}
                          />
                        </div>

                        {projects.length > 1 && (
                          <select
                            value={selectedProjectFilter}
                            onChange={(e) => setSelectedProjectFilter(e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-hidden ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-700'
                                : 'bg-[#0D1520] border-[#233549] text-slate-300'
                            }`}
                          >
                            <option value="all">All Projects & Spaces</option>
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Task List */}
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {availableTasks.length === 0 ? (
                          <div className="p-4 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-700/50">
                            No matching tasks found.
                          </div>
                        ) : (
                          availableTasks.slice(0, 15).map((t) => {
                            const prj = projects.find((p) => p.id === t.projectId);
                            return (
                              <div
                                key={t.id}
                                className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all hover:border-[#3BC0BB]/60 ${
                                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 text-[10px] mb-0.5">
                                    <span className="font-bold text-[#3BC0BB] font-mono truncate max-w-[120px]">
                                      {prj?.title || 'Project'}
                                    </span>
                                    <PriorityBadge priority={t.priority} />
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-500/20 text-slate-400">
                                      {t.status}
                                    </span>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={t.title}>
                                    {t.title}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    startTimer(t.id, t.title);
                                  }}
                                  className="p-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
                                  title={`Start tracking "${t.title}"`}
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span className="hidden sm:inline">Start</span>
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================
                  TAB 2: MANUAL TIME ENTRY FORM
                 ============================================================ */}
              {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  {manualSuccessMsg && (
                    <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{manualSuccessMsg}</span>
                    </div>
                  )}

                  {/* Select Task */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Task:
                    </label>
                    <select
                      value={manualTaskId}
                      onChange={(e) => setManualTaskId(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-hidden ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800'
                          : 'bg-[#0D1520] border-[#233549] text-white'
                      }`}
                      required
                    >
                      {tasks.map((t) => {
                        const prj = projects.find((p) => p.id === t.projectId);
                        return (
                          <option key={t.id} value={t.id}>
                            [{prj?.code || 'PRJ'}] {t.title} ({t.status})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Hours Duration & Quick Presets */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Duration (Hours):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.25"
                        min="0.1"
                        max="24"
                        value={manualHours}
                        onChange={(e) => setManualHours(e.target.value)}
                        className={`w-28 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs outline-hidden ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900'
                            : 'bg-[#0D1520] border-[#233549] text-white'
                        }`}
                        required
                      />

                      {/* Quick Chips */}
                      <div className="flex items-center gap-1 text-[10px] font-semibold font-mono">
                        {['0.5', '1.0', '2.0', '4.0'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setManualHours(chip)}
                            className={`px-2 py-1 rounded-lg border transition-colors ${
                              manualHours === chip
                                ? 'bg-[#3BC0BB]/20 border-[#3BC0BB] text-[#3BC0BB]'
                                : isLight
                                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
                                : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] text-slate-400'
                            }`}
                          >
                            {chip}h
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Date:
                    </label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-hidden ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800'
                          : 'bg-[#0D1520] border-[#233549] text-white'
                      }`}
                      required
                    />
                  </div>

                  {/* Work Description Notes */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Work Description:
                    </label>
                    <textarea
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      rows={2}
                      placeholder="Briefly describe what was accomplished..."
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-hidden resize-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-[#0D9488]'
                          : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#3BC0BB]'
                      }`}
                    />
                  </div>

                  {/* Billable Toggle */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualBillable}
                      onChange={(e) => setManualBillable(e.target.checked)}
                      className="rounded text-[#0D9488] focus:ring-[#0D9488]"
                    />
                    <span>Billable Deliverable Work</span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-[#0773BB]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Manual Time Log</span>
                  </button>
                </form>
              )}

              {/* ============================================================
                  TAB 3: TODAY'S LOGS & SUMMARY
                 ============================================================ */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {/* KPI Summary Card */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                  }`}>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Today's Total
                      </div>
                      <div className="text-xl font-bold font-mono text-[#3BC0BB]">
                        {todayTotalHours.toFixed(2)} hrs
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Billable
                      </div>
                      <div className="text-sm font-bold font-mono text-emerald-500">
                        {todayBillableHours.toFixed(2)} hrs
                      </div>
                    </div>
                  </div>

                  {/* Entries List */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {todayEntries.length === 0 ? (
                      <div className="p-4 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-700/50">
                        No time tracked yet today. Start the stopwatch above!
                      </div>
                    ) : (
                      todayEntries.map((entry) => {
                        const task = tasks.find((t) => t.id === entry.taskId);
                        const proj = projects.find((p) => p.id === entry.projectId);

                        return (
                          <div
                            key={entry.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5">
                                <span className="font-bold text-[#3BC0BB] truncate max-w-[100px]">
                                  {proj?.title || 'Project'}
                                </span>
                                <span>•</span>
                                <span className="font-mono font-bold text-emerald-400">
                                  {entry.hours} hrs
                                </span>
                                {entry.billable && (
                                  <span className="px-1 py-0.2 rounded-full text-[8px] bg-emerald-500/20 text-emerald-400">
                                    Billable
                                  </span>
                                )}
                              </div>

                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {task?.title || 'Task #' + entry.taskId}
                              </div>

                              {entry.description && (
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {entry.description}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Resume button */}
                              {task && (
                                <button
                                  type="button"
                                  onClick={() => startTimer(task.id, task.title)}
                                  className="p-1.5 rounded-lg bg-[#3BC0BB]/10 hover:bg-[#3BC0BB]/20 text-[#3BC0BB] transition-colors"
                                  title="Resume timer on this task"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                </button>
                              )}

                              {/* Delete button */}
                              {deleteTimeEntry && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Delete time entry (${entry.hours} hrs)?`)) {
                                      deleteTimeEntry(entry.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Popover Footer with Quick Shortcut Tip */}
            <div className={`p-2.5 border-t flex items-center justify-between text-[10px] text-slate-500 ${
              isLight ? 'bg-slate-100/60 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-[#3BC0BB]" />
                <span>User: {currentUser.name}</span>
              </div>
              <span className="font-mono text-slate-400">
                Rate: ${currentUser.hourlyRate || 85}/hr
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
