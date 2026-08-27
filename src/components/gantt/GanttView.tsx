import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  GanttChart,
  Calendar,
  ZoomIn,
  ZoomOut,
  Filter,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Plus,
  Workflow,
  CheckCircle2,
  X,
  Link as LinkIcon,
  ArrowRight,
  Lock,
  MousePointer,
  Printer,
  Diamond,
  Flame,
  Tag,
  ShieldAlert,
  GitFork,
  Sliders,
  Trash2,
  Eye,
  Zap,
  HelpCircle,
  Search,
  Check,
  Flag,
  User,
  Users,
  Maximize2,
  Download,
  MoreHorizontal,
  Settings,
  DollarSign,
  Columns,
  PanelLeftClose,
  PanelLeftOpen,
  List as ListIcon,
  Folder,
  Layers,
  Clock,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Project } from '../../types';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { ProjectCsvImportModal } from '../projects/ProjectCsvImportModal';
import { CriticalPathBanner } from './CriticalPathBanner';
import { ClickUpTaskDetailModal } from '../tasks/ClickUpTaskDetailModal';

type ZoomMode = 'day' | '4days' | 'week' | 'month' | 'year';

interface DragState {
  isDragging: boolean;
  sourceTaskId: string | null;
  startPos: { x: number; y: number } | null;
  currentPos: { x: number; y: number } | null;
}

interface TaskBarDragState {
  isDragging: boolean;
  taskId: string | null;
  mode: 'move' | 'resize-start' | 'resize-end';
  startScreenX: number;
  initialStart: string;
  initialDue: string;
  previewDaysDelta: number;
}

export const GanttView: React.FC = () => {
  const {
    tasks,
    addTask,
    projects,
    dependencies,
    users,
    activeCompany,
    addDependency,
    removeDependency,
    recalculateProjectTimeline,
    updateTask,
    searchQuery,
    setSearchQuery,
    selectedProjectId: globalProjectId,
    setSelectedProjectId: setGlobalProjectId,
    selectedListFilter,
    setSelectedListFilter,
    currentUser,
    theme
  } = useApp();

  const isLight = theme === 'light';

  // Selected Space / Project
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    globalProjectId && globalProjectId !== 'all' ? globalProjectId : projects[0]?.id || 'proj_1'
  );

  useEffect(() => {
    if (globalProjectId && globalProjectId !== 'all') {
      setSelectedProjectId(globalProjectId);
    }
  }, [globalProjectId]);

  // View & Layout State
  const [zoomMode, setZoomMode] = useState<ZoomMode>('week');
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(300);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isSpaceExpanded, setIsSpaceExpanded] = useState<Record<string, boolean>>({ default: true });
  const [isListExpanded, setIsListExpanded] = useState<Record<string, boolean>>({ default: true });

  // Filters & Toggles
  const [ganttSearch, setGanttSearch] = useState('');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [showClosedTasks, setShowClosedTasks] = useState(true);
  const [highlightCriticalPath, setHighlightCriticalPath] = useState(true);
  const [showOnlyMilestones, setShowOnlyMilestones] = useState(false);
  const [showBudgetOverlay, setShowBudgetOverlay] = useState(false);

  // Modals & Inspector Drawers
  const [detailModalTaskId, setDetailModalTaskId] = useState<string | null>(null);
  const [showAddDepModal, setShowAddDepModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showBlockerInspector, setShowBlockerInspector] = useState(false);
  const [predTaskId, setPredTaskId] = useState('');
  const [succTaskId, setSuccTaskId] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Inline Quick Add Task state
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [isAddingInlineTask, setIsAddingInlineTask] = useState(false);

  // Task Dependency Visualization & Connector Tool States
  const [isDrawModeActive, setIsDrawModeActive] = useState<boolean>(false);
  const [selectedSourceTaskId, setSelectedSourceTaskId] = useState<string | null>(null);
  const [lineRoutingStyle, setLineRoutingStyle] = useState<'curved' | 'orthogonal' | 'straight'>('curved');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredDropTaskId, setHoveredDropTaskId] = useState<string | null>(null);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    sourceTaskId: null,
    startPos: null,
    currentPos: null
  });

  const [barDragState, setBarDragState] = useState<TaskBarDragState>({
    isDragging: false,
    taskId: null,
    mode: 'move',
    startScreenX: 0,
    initialStart: '',
    initialDue: '',
    previewDaysDelta: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const treeListScrollRef = useRef<HTMLDivElement>(null);

  // Sync active project
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Filter tasks for active space
  const projectTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.projectId === activeProject?.id);

    if (ganttSearch.trim()) {
      const q = ganttSearch.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (selectedAssigneeFilter !== 'all') {
      filtered = filtered.filter((t) => t.assigneeIds?.includes(selectedAssigneeFilter));
    }

    if (selectedPriorityFilter !== 'all') {
      filtered = filtered.filter((t) => t.priority === selectedPriorityFilter);
    }

    if (!showClosedTasks) {
      filtered = filtered.filter((t) => t.status !== 'Done');
    }

    return filtered;
  }, [tasks, activeProject, ganttSearch, selectedAssigneeFilter, selectedPriorityFilter, showClosedTasks]);

  // Critical path & Milestone checks
  const isTaskCritical = (t: Task): boolean => {
    if (t.isCriticalPath) return true;
    if (t.tags?.some((tag) => tag.toLowerCase().includes('critical'))) return true;
    if (t.priority === 'Urgent') return true;
    return false;
  };

  const isTaskMilestone = (t: Task): boolean => {
    if (t.isMilestone) return true;
    if (t.tags?.some((tag) => tag.toLowerCase().includes('milestone'))) return true;
    if (isTaskCritical(t)) return true;
    return false;
  };

  const displayedTasks = useMemo(() => {
    if (showOnlyMilestones) {
      return projectTasks.filter(isTaskMilestone);
    }
    return projectTasks;
  }, [projectTasks, showOnlyMilestones]);

  const criticalCount = projectTasks.filter(isTaskCritical).length;
  const milestoneCount = projectTasks.filter(isTaskMilestone).length;

  // Time calculations based on reference screenshot (Aug 2026 anchor or project dates)
  // Base date anchor: August 20, 2026 (matches reference image displaying W34 Aug 23 - 29 / Th 20 .. Th 27 .. Th 3)
  const timelineConfig = useMemo(() => {
    const today = new Date();
    // Default anchor to 10 days before today
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    let totalDays = 35; // default 5 weeks
    let cellWidth = 44; // pixels per day

    if (zoomMode === 'day') {
      totalDays = 21;
      cellWidth = 72;
    } else if (zoomMode === '4days') {
      totalDays = 28;
      cellWidth = 56;
    } else if (zoomMode === 'week') {
      totalDays = 35;
      cellWidth = 44;
    } else if (zoomMode === 'month') {
      totalDays = 90;
      cellWidth = 24;
    } else if (zoomMode === 'year') {
      totalDays = 180;
      cellWidth = 14;
    }

    const daysArray: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      daysArray.push(d);
    }

    // Group days into weeks for header tier 1
    const weekGroups: { weekNum: number; label: string; startIndex: number; count: number }[] = [];
    let currentWeekNum = -1;
    let currentGroup: { weekNum: number; label: string; startIndex: number; count: number } | null = null;

    daysArray.forEach((d, idx) => {
      // Calculate ISO week number
      const dCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = dCopy.getUTCDay() || 7;
      dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((dCopy.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

      if (weekNo !== currentWeekNum) {
        if (currentGroup) {
          weekGroups.push(currentGroup);
        }
        const weekEnd = new Date(d);
        weekEnd.setDate(d.getDate() + 6);
        const startMonthStr = d.toLocaleDateString('en-US', { month: 'short' });
        const endMonthStr = weekEnd.toLocaleDateString('en-US', { month: 'short' });
        const dateRangeStr =
          startMonthStr === endMonthStr
            ? `${startMonthStr} ${d.getDate()} - ${weekEnd.getDate()}`
            : `${startMonthStr} ${d.getDate()} - ${endMonthStr} ${weekEnd.getDate()}`;

        currentWeekNum = weekNo;
        currentGroup = {
          weekNum: weekNo,
          label: `W${weekNo}  ${dateRangeStr}`,
          startIndex: idx,
          count: 1
        };
      } else if (currentGroup) {
        currentGroup.count += 1;
      }
    });

    if (currentGroup) {
      weekGroups.push(currentGroup);
    }

    const todayStr = today.toISOString().split('T')[0];
    const todayIndex = daysArray.findIndex((d) => d.toISOString().split('T')[0] === todayStr);

    return {
      startDate,
      totalDays,
      cellWidth,
      daysArray,
      weekGroups,
      todayIndex: todayIndex !== -1 ? todayIndex : 7,
      totalWidth: totalDays * cellWidth
    };
  }, [zoomMode]);

  // Helper to calculate pixel left and width on the timeline for any task
  const getTaskBarPixels = (startDateStr: string, dueDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(dueDateStr);
    const base = timelineConfig.startDate;

    const diffStartMs = start.getTime() - base.getTime();
    const daysFromStart = diffStartMs / (1000 * 3600 * 24);

    const diffDurationMs = end.getTime() - start.getTime();
    const durationDays = Math.max(1, diffDurationMs / (1000 * 3600 * 24));

    const left = daysFromStart * timelineConfig.cellWidth;
    const width = Math.max(timelineConfig.cellWidth * 0.8, durationDays * timelineConfig.cellWidth);

    return { left, width };
  };

  const addDaysHelper = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleShiftTaskDate = (taskId: string, newStart: string, newDue: string) => {
    updateTask(taskId, { startDate: newStart, dueDate: newDue });
    const res = recalculateProjectTimeline(selectedProjectId);
    const taskTitle = projectTasks.find((t) => t.id === taskId)?.title || 'Task';

    if (res.adjustedCount > 0) {
      setToastMsg(
        `Moved "${taskTitle}" schedule (${newStart} ➔ ${newDue}). Automatically adjusted ${res.adjustedCount} child task(s) to respect dependencies.`
      );
    } else {
      setToastMsg(`Updated "${taskTitle}" timeline (${newStart} ➔ ${newDue}).`);
    }
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleStartBarDrag = (e: React.MouseEvent, task: Task, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    setBarDragState({
      isDragging: true,
      taskId: task.id,
      mode,
      startScreenX: e.clientX,
      initialStart: task.startDate,
      initialDue: task.dueDate,
      previewDaysDelta: 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizingSidebar) {
      const newWidth = Math.max(180, Math.min(500, e.clientX - 60));
      setLeftSidebarWidth(newWidth);
    }

    if (dragState.isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragState((prev) => ({ ...prev, currentPos: { x, y } }));
    }

    if (barDragState.isDragging) {
      const deltaX = e.clientX - barDragState.startScreenX;
      const daysDelta = Math.round(deltaX / timelineConfig.cellWidth);
      setBarDragState((prev) => ({ ...prev, previewDaysDelta: daysDelta }));
    }
  };

  const handleMouseUp = () => {
    if (isResizingSidebar) {
      setIsResizingSidebar(false);
    }

    if (dragState.isDragging) {
      if (dragState.sourceTaskId && hoveredDropTaskId && dragState.sourceTaskId !== hoveredDropTaskId) {
        const success = addDependency(hoveredDropTaskId, dragState.sourceTaskId);
        if (success) {
          const res = recalculateProjectTimeline(selectedProjectId);
          const sourceName = projectTasks.find((t) => t.id === dragState.sourceTaskId)?.title;
          const targetName = projectTasks.find((t) => t.id === hoveredDropTaskId)?.title;
          setToastMsg(
            `Dependency Linked: "${targetName}" now depends on "${sourceName}". ${
              res.adjustedCount > 0 ? `Auto-adjusted ${res.adjustedCount} dependent schedules!` : ''
            }`
          );
          setTimeout(() => setToastMsg(null), 5000);
        } else {
          setToastMsg('Link already exists or creates a circular dependency loop.');
          setTimeout(() => setToastMsg(null), 3500);
        }
      }
      setDragState({
        isDragging: false,
        sourceTaskId: null,
        startPos: null,
        currentPos: null
      });
      setHoveredDropTaskId(null);
    }

    if (barDragState.isDragging && barDragState.taskId) {
      const days = barDragState.previewDaysDelta;
      if (days !== 0) {
        let newStart = barDragState.initialStart;
        let newDue = barDragState.initialDue;

        if (barDragState.mode === 'move') {
          newStart = addDaysHelper(barDragState.initialStart, days);
          newDue = addDaysHelper(barDragState.initialDue, days);
        } else if (barDragState.mode === 'resize-end') {
          newDue = addDaysHelper(barDragState.initialDue, days);
          if (new Date(newDue).getTime() <= new Date(newStart).getTime()) {
            newDue = addDaysHelper(newStart, 1);
          }
        } else if (barDragState.mode === 'resize-start') {
          newStart = addDaysHelper(barDragState.initialStart, days);
          if (new Date(newStart).getTime() >= new Date(newDue).getTime()) {
            newStart = addDaysHelper(newDue, -1);
          }
        }

        handleShiftTaskDate(barDragState.taskId, newStart, newDue);
      }

      setBarDragState({
        isDragging: false,
        taskId: null,
        mode: 'move',
        startScreenX: 0,
        initialStart: '',
        initialDue: '',
        previewDaysDelta: 0
      });
    }
  };

  const handleScrollToToday = () => {
    if (timelineScrollRef.current) {
      const todayPx = timelineConfig.todayIndex * timelineConfig.cellWidth;
      timelineScrollRef.current.scrollTo({
        left: Math.max(0, todayPx - timelineScrollRef.current.clientWidth / 2 + 100),
        behavior: 'smooth'
      });
    }
  };

  const handleCreateInlineTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const dueStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    addTask({
      projectId: selectedProjectId,
      companyId: activeCompany?.id || 'comp_1',
      title: inlineTaskTitle.trim(),
      description: 'Scheduled deliverable from ClickUp Gantt View',
      status: 'To Do',
      priority: 'Medium',
      assigneeIds: [currentUser?.id || 'usr_pk'],
      reporterId: currentUser?.id || 'usr_1',
      startDate: todayStr,
      dueDate: dueStr,
      estimatedHours: 8,
      tags: ['Gantt', 'Deliverable']
    });

    setInlineTaskTitle('');
    setIsAddingInlineTask(false);
    setToastMsg(`Created task "${inlineTaskTitle.trim()}" in Gantt schedule!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Helper for status badge colors matching ClickUp
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Done':
      case 'Complete':
        return 'bg-emerald-500 text-emerald-400';
      case 'In Progress':
        return 'bg-[#0773BB] text-[#3BC0BB]';
      case 'In Review':
      case 'Review':
        return 'bg-amber-400 text-amber-300';
      case 'Blocked':
        return 'bg-rose-500 text-rose-400';
      default:
        return 'bg-slate-400 text-slate-300';
    }
  };

  const getPriorityFlag = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <Flag className="w-3 h-3 text-rose-500 fill-rose-500" />;
      case 'High':
        return <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />;
      case 'Normal':
        return <Flag className="w-3 h-3 text-blue-500 fill-blue-500" />;
      case 'Low':
        return <Flag className="w-3 h-3 text-slate-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full min-h-screen flex flex-col font-sans select-none animate-in fade-in ${
        isLight ? 'bg-[#F8FAFC] text-slate-800' : 'bg-[#0D1520] text-slate-100'
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1. ClickUp Gantt Action Sub-Toolbar */}
      <div
        className={`px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 border-b shrink-0 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#121B26] border-[#233549]'
        }`}
      >
        {/* Left Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Left List Sidebar */}
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className={`p-1.5 rounded-lg border transition-all ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300 hover:text-white'
            }`}
            title={showLeftSidebar ? 'Collapse Tree Column' : 'Expand Tree Column'}
          >
            {showLeftSidebar ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
          </button>

          {/* Today Button */}
          <button
            onClick={handleScrollToToday}
            className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-200'
            }`}
            title="Jump view to today's red marker"
          >
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>Today</span>
          </button>

          {/* Zoom Selector Dropdown */}
          <div className="relative">
            <select
              value={zoomMode}
              onChange={(e) => setZoomMode(e.target.value as ZoomMode)}
              className={`appearance-none pl-3 pr-7 py-1 rounded-lg border text-xs font-semibold focus:outline-none cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                  : 'bg-[#16222F] border-[#233549] text-slate-200 hover:bg-[#1f2f40]'
              }`}
            >
              <option value="day">Day</option>
              <option value="4days">4 Days</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Auto Fit Button */}
          <button
            onClick={handleScrollToToday}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300'
            }`}
            title="Auto fit timeline to project scope"
          >
            Auto fit
          </button>

          {/* Export Button */}
          <button
            onClick={() => {
              try {
                window.print();
              } catch (_) {
                setToastMsg('Export/Print is restricted inside iframe. Open the app in a new tab to print.');
                setTimeout(() => setToastMsg(null), 4000);
              }
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300'
            }`}
            title="Export Gantt Chart / Print Executive PDF"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>Export</span>
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-[#233549] mx-1 hidden md:block" />

          {/* Space / Project Selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setGlobalProjectId(e.target.value);
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-[#16222F] border-[#233549] text-slate-200'
            }`}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} • {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Draw / Link Dependency Lines Tool */}
          <button
            onClick={() => {
              setIsDrawModeActive(!isDrawModeActive);
              if (isDrawModeActive) setSelectedSourceTaskId(null);
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              isDrawModeActive
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                : isLight
                ? 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white'
            }`}
            title={isDrawModeActive ? 'Exit Dependency Connector Tool' : 'Draw Dependency Lines'}
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Critical Path Toggle */}
          <button
            onClick={() => setHighlightCriticalPath(!highlightCriticalPath)}
            className={`p-1.5 rounded-lg border transition-all ${
              highlightCriticalPath
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-400'
                : isLight
                ? 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white'
            }`}
            title={`Critical Path Highlighting (${criticalCount} zero-slack tasks)`}
          >
            <Zap className={`w-3.5 h-3.5 ${highlightCriticalPath ? 'fill-current' : ''}`} />
          </button>

          {/* Show Closed Tasks Toggle */}
          <button
            onClick={() => setShowClosedTasks(!showClosedTasks)}
            className={`p-1.5 rounded-lg border transition-all ${
              showClosedTasks
                ? isLight
                  ? 'bg-slate-200 border-slate-400 text-slate-900'
                  : 'bg-[#233549] border-slate-600 text-white'
                : isLight
                ? 'bg-white border-slate-300 text-slate-400'
                : 'bg-[#16222F] border-[#233549] text-slate-500'
            }`}
            title={showClosedTasks ? 'Hide Completed Tasks' : 'Show Completed Tasks'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>

          {/* Assignee Filter Dropdown */}
          <select
            value={selectedAssigneeFilter}
            onChange={(e) => setSelectedAssigneeFilter(e.target.value)}
            className={`px-2 py-1 rounded-lg border text-xs font-medium focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700'
                : 'bg-[#16222F] border-[#233549] text-slate-300'
            }`}
            title="Filter by Assignee"
          >
            <option value="all">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            className={`px-2 py-1 rounded-lg border text-xs font-medium focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700'
                : 'bg-[#16222F] border-[#233549] text-slate-300'
            }`}
            title="Filter by Priority"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={ganttSearch}
              onChange={(e) => setGanttSearch(e.target.value)}
              className={`pl-8 pr-3 py-1 rounded-lg border text-xs focus:outline-none w-32 sm:w-40 transition-all ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-[#0D9488]'
                  : 'bg-[#16222F] border-[#233549] text-slate-200 placeholder-slate-500 focus:border-[#3BC0BB]'
              }`}
            />
          </div>

          {/* Recalculate Auto Schedule */}
          <button
            onClick={() => {
              const res = recalculateProjectTimeline(selectedProjectId);
              setToastMsg(
                res.adjustedCount > 0
                  ? `Auto-Scheduled! Adjusted ${res.adjustedCount} dependent task timelines.`
                  : 'All Finish-to-Start dependency dates are aligned.'
              );
              setTimeout(() => setToastMsg(null), 4000);
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white'
            }`}
            title="Auto-Schedule Finish-to-Start dependencies"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Primary ClickUp + Task Button */}
          <button
            onClick={() => setIsAddingInlineTask(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0773BB] hover:bg-[#0096C7] text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Task</span>
            <ChevronDown className="w-3 h-3 text-white/70" />
          </button>
        </div>
      </div>

      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="px-6 py-2 bg-[#0773BB] text-white text-xs font-medium flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3BC0BB] shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="p-1 hover:bg-black/20 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Draw Mode Banner */}
      {isDrawModeActive && (
        <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold">
              {selectedSourceTaskId
                ? `Prerequisite Selected: "${projectTasks.find((t) => t.id === selectedSourceTaskId)?.title}". Now click the successor task to connect.`
                : 'Click any task to select as Prerequisite, or drag from the orange output port dot to connect.'}
            </span>
          </div>
          <button
            onClick={() => {
              setIsDrawModeActive(false);
              setSelectedSourceTaskId(null);
            }}
            className="px-2.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-white font-bold text-[11px]"
          >
            Done
          </button>
        </div>
      )}

      {/* 2. Main Gantt Workspace (Split Tree Table on Left + Timeline Canvas on Right) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANEL: Hierarchical Space & List Tree Table */}
        {showLeftSidebar && (
          <div
            style={{ width: `${leftSidebarWidth}px` }}
            className={`shrink-0 flex flex-col border-r relative select-none ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'
            }`}
          >
            {/* Left Header Row */}
            <div
              className={`h-12 px-4 flex items-center justify-between border-b text-xs font-bold uppercase tracking-wider ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0D1520] border-[#233549] text-slate-400'
              }`}
            >
              <span>Name</span>
              <button
                onClick={() => setIsAddingInlineTask(true)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#1E2B3A] rounded text-slate-400 hover:text-white"
                title="Add Column or Task"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tree Hierarchy Items Scroll Area */}
            <div
              ref={treeListScrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-transparent text-xs"
            >
              {/* Space Group Row */}
              <div
                onClick={() =>
                  setIsSpaceExpanded((prev) => ({ ...prev, [activeProject?.id || 'def']: !prev[activeProject?.id || 'def'] }))
                }
                className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-slate-100 bg-slate-50/50' : 'hover:bg-[#16222F] bg-[#121B26]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      isSpaceExpanded[activeProject?.id || 'def'] === false ? '-rotate-90' : ''
                    }`}
                  />
                  <div className="w-4 h-4 rounded bg-rose-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                    !
                  </div>
                  <span className="font-bold truncate text-slate-800 dark:text-slate-100">
                    {activeProject?.code || 'ICT'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{projectTasks.length}</span>
              </div>

              {/* List Group Row */}
              {isSpaceExpanded[activeProject?.id || 'def'] !== false && (
                <div
                  onClick={() => setIsListExpanded((prev) => ({ ...prev, def: !prev.def }))}
                  className={`pl-7 pr-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-slate-100' : 'hover:bg-[#16222F]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ChevronDown
                      className={`w-3 h-3 text-slate-400 transition-transform ${
                        isListExpanded.def === false ? '-rotate-90' : ''
                      }`}
                    />
                    <ListIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {selectedListFilter || 'List'}
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#1A2838] text-slate-600 dark:text-slate-400 font-mono">
                    {displayedTasks.length}
                  </span>
                </div>
              )}

              {/* Task Rows in Left Pane */}
              {isSpaceExpanded[activeProject?.id || 'def'] !== false &&
                isListExpanded.def !== false &&
                displayedTasks.map((task) => {
                  const isSelected = selectedTaskId === task.id;
                  const isCritical = isTaskCritical(task);

                  return (
                    <div
                      key={`tree_${task.id}`}
                      onClick={() => setDetailModalTaskId(task.id)}
                      className={`h-10 pl-10 pr-3 flex items-center justify-between gap-2 border-b transition-colors cursor-pointer group ${
                        isSelected
                          ? isLight
                            ? 'bg-[#0773BB]/10 border-[#0773BB]/30'
                            : 'bg-[#0773BB]/20 border-[#0773BB]/40'
                          : isLight
                          ? 'border-slate-100 hover:bg-slate-50'
                          : 'border-[#233549]/40 hover:bg-[#16222F]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Status color indicator dot */}
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(task.status).split(' ')[0]}`}
                          title={`Status: ${task.status}`}
                        />
                        <span
                          className={`font-medium text-xs truncate ${
                            task.status === 'Done'
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : isLight
                              ? 'text-slate-800'
                              : 'text-slate-200'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                        {getPriorityFlag(task.priority)}
                        {isCritical && (
                          <span title="Critical Path Task">
                            <Diamond className="w-3 h-3 text-rose-500 fill-rose-500" />
                          </span>
                        )}
                        {task.assigneeIds?.[0] && (
                          <img
                            src={
                              users.find((u) => u.id === task.assigneeIds[0])?.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                            }
                            alt="Assignee"
                            className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-400"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Inline Quick Add Task Input */}
              {isAddingInlineTask ? (
                <form onSubmit={handleCreateInlineTask} className="p-2 border-t border-slate-200 dark:border-[#233549]">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter task name..."
                    value={inlineTaskTitle}
                    onChange={(e) => setInlineTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsAddingInlineTask(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-[#0D9488]'
                        : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB]'
                    }`}
                  />
                  <div className="flex justify-end gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingInlineTask(false)}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!inlineTaskTitle.trim()}
                      className="px-2.5 py-1 rounded bg-[#0773BB] text-white text-[11px] font-bold disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingInlineTask(true)}
                  className={`w-full text-left pl-10 pr-3 py-2 flex items-center gap-2 text-xs font-semibold transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                  <span>New Task</span>
                </button>
              )}
            </div>

            {/* Draggable Divider Handle */}
            <div
              onMouseDown={() => setIsResizingSidebar(true)}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0773BB] active:bg-[#0773BB] transition-colors z-20"
              title="Drag to resize column"
            />
          </div>
        )}

        {/* RIGHT PANEL: Gantt Timeline Canvas */}
        <div
          ref={timelineScrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative"
          style={{ minWidth: 0 }}
        >
          <div style={{ width: `${timelineConfig.totalWidth}px` }} className="min-h-full relative flex flex-col">
            {/* Header Tier 1: Weeks */}
            <div
              className={`h-6 flex border-b sticky top-0 z-30 ${
                isLight ? 'bg-[#F1F5F9] border-slate-200 text-slate-600' : 'bg-[#0D1520] border-[#233549] text-slate-400'
              }`}
            >
              {timelineConfig.weekGroups.map((group, idx) => (
                <div
                  key={`week_${group.weekNum}_${idx}`}
                  style={{ width: `${group.count * timelineConfig.cellWidth}px` }}
                  className="px-2 border-r border-slate-200 dark:border-[#233549] text-[11px] font-bold flex items-center truncate"
                >
                  {group.label}
                </div>
              ))}
            </div>

            {/* Header Tier 2: Days */}
            <div
              className={`h-6 flex border-b sticky top-6 z-30 ${
                isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#121B26] border-[#233549] text-slate-400'
              }`}
            >
              {timelineConfig.daysArray.map((day, idx) => {
                const dayName = day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
                const dayNumber = day.getDate();
                const isToday = idx === timelineConfig.todayIndex;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div
                    key={`day_hdr_${idx}`}
                    style={{ width: `${timelineConfig.cellWidth}px` }}
                    className={`border-r border-slate-200 dark:border-[#233549]/60 text-[11px] font-medium flex items-center justify-center shrink-0 ${
                      isWeekend ? (isLight ? 'bg-slate-100/70' : 'bg-[#0A1017]') : ''
                    }`}
                  >
                    {isToday ? (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                        {dayNumber}
                      </span>
                    ) : (
                      <span className="truncate">
                        {dayName} {dayNumber}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Timeline Grid Background with Weekend Shading & Today Line */}
            <div className="absolute inset-0 top-12 pointer-events-none flex z-0">
              {timelineConfig.daysArray.map((day, idx) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isToday = idx === timelineConfig.todayIndex;

                return (
                  <div
                    key={`grid_col_${idx}`}
                    style={{ width: `${timelineConfig.cellWidth}px` }}
                    className={`border-r border-slate-200/60 dark:border-[#233549]/30 h-full shrink-0 relative ${
                      isWeekend
                        ? isLight
                          ? 'bg-slate-100/50 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,#e2e8f0_6px,#e2e8f0_7px)]'
                          : 'bg-[#0A1017] bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,#16222F_6px,#16222F_7px)]'
                        : ''
                    }`}
                  >
                    {/* Vertical Red Today Line extending down entire height */}
                    {isToday && (
                      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-rose-500 shadow-sm z-10" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Task Rows and Interactive Gantt Bars */}
            <div className="relative z-10 pt-0">
              {/* Space spacer row */}
              <div className="h-9 border-b border-transparent" />
              {/* List spacer row */}
              <div className="h-8 border-b border-transparent" />

              {/* D3 SVG Dependency Link Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                <defs>
                  <marker id="gantt-arrow-amber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#F59E0B" />
                  </marker>
                  <marker id="gantt-arrow-cyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#3BC0BB" />
                  </marker>
                  <marker id="gantt-arrow-rose" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#F43F5E" />
                  </marker>
                </defs>

                {displayedTasks.map((targetTask, targetIdx) => {
                  const prereqIds = [
                    ...(targetTask.dependencies || []),
                    ...dependencies.filter((d) => d.taskId === targetTask.id).map((d) => d.dependsOnTaskId)
                  ];

                  return prereqIds.map((prereqId) => {
                    const sourceIdx = displayedTasks.findIndex((t) => t.id === prereqId);
                    if (sourceIdx === -1) return null;

                    const sourceTask = displayedTasks[sourceIdx];
                    const sourcePos = getTaskBarPixels(sourceTask.startDate, sourceTask.dueDate);
                    const targetPos = getTaskBarPixels(targetTask.startDate, targetTask.dueDate);

                    // Row Heights: spacer (68px) + index * 40px + 20px center
                    const y1 = 68 + sourceIdx * 40 + 20;
                    const y2 = 68 + targetIdx * 40 + 20;
                    const x1 = sourcePos.left + sourcePos.width;
                    const x2 = targetPos.left;

                    const isCritical = (isTaskCritical(sourceTask) || isTaskCritical(targetTask)) && highlightCriticalPath;
                    const strokeColor = isCritical ? '#F43F5E' : '#F59E0B';
                    const markerId = isCritical ? 'url(#gantt-arrow-rose)' : 'url(#gantt-arrow-amber)';

                    const midX = (x1 + x2) / 2;

                    return (
                      <path
                        key={`dep_${prereqId}_${targetTask.id}`}
                        d={`M ${x1} ${y1} C ${x1 + 16} ${y1}, ${x2 - 16} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2"
                        strokeDasharray={isCritical ? '4 2' : 'none'}
                        markerEnd={markerId}
                      />
                    );
                  });
                })}
              </svg>

              {/* Task Bar Elements */}
              {displayedTasks.map((task, idx) => {
                const { left, width } = getTaskBarPixels(task.startDate, task.dueDate);
                const isSelected = selectedTaskId === task.id;
                const isCritical = isTaskCritical(task);
                const isMilestone = isTaskMilestone(task);
                const isDraggingThis = barDragState.isDragging && barDragState.taskId === task.id;
                const deltaPx = isDraggingThis ? barDragState.previewDaysDelta * timelineConfig.cellWidth : 0;

                return (
                  <div
                    key={`bar_row_${task.id}`}
                    className="h-10 border-b border-slate-200/40 dark:border-[#233549]/30 relative flex items-center"
                  >
                    {/* The Gantt Bar */}
                    <div
                      onClick={() => setDetailModalTaskId(task.id)}
                      style={{
                        left: `${Math.max(0, left + deltaPx)}px`,
                        width: `${Math.max(30, width)}px`
                      }}
                      className={`h-6 rounded-md absolute flex items-center px-2 shadow-sm transition-shadow cursor-pointer group select-none ${
                        isCritical && highlightCriticalPath
                          ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-rose-900/50'
                          : task.status === 'Done'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0773BB] text-white hover:bg-[#0096C7]'
                      }`}
                      title={`${task.title} (${task.startDate} ➔ ${task.dueDate}) • Click to inspect details`}
                    >
                      {/* Left Resize Handle */}
                      <div
                        onMouseDown={(e) => handleStartBarDrag(e, task, 'resize-start')}
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-0.5 h-3 bg-white/80" />
                      </div>

                      {/* Middle Drag & Info */}
                      <div
                        onMouseDown={(e) => handleStartBarDrag(e, task, 'move')}
                        className="flex-1 flex items-center justify-between gap-1.5 overflow-hidden cursor-grab active:cursor-grabbing h-full"
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          {isMilestone && <Diamond className="w-2.5 h-2.5 text-amber-300 fill-amber-300 shrink-0" />}
                          <span className="text-[11px] font-semibold truncate leading-none">{task.title}</span>
                        </div>
                        {task.progress !== undefined && task.progress > 0 && (
                          <span className="text-[9px] font-bold text-white/80 shrink-0">{task.progress}%</span>
                        )}
                      </div>

                      {/* Right Resize Handle */}
                      <div
                        onMouseDown={(e) => handleStartBarDrag(e, task, 'resize-end')}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-r flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-0.5 h-3 bg-white/80" />
                      </div>

                      {/* Dependency Output Connector Port (Orange Dot) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectedSourceTaskId) {
                            setSelectedSourceTaskId(task.id);
                            setIsDrawModeActive(true);
                            setToastMsg(`Selected "${task.title}". Click target task to link dependency.`);
                          } else if (selectedSourceTaskId !== task.id) {
                            addDependency(task.id, selectedSourceTaskId);
                            recalculateProjectTimeline(selectedProjectId);
                            setSelectedSourceTaskId(null);
                            setIsDrawModeActive(false);
                            setToastMsg('Dependency established!');
                          }
                        }}
                        className={`absolute -right-2 top-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow cursor-crosshair opacity-0 group-hover:opacity-100 hover:scale-125 transition-all z-30 ${
                          selectedSourceTaskId === task.id ? 'opacity-100 ring-2 ring-amber-300 animate-ping' : ''
                        }`}
                        title="Click or drag to connect dependency to another task"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating Zoom Buttons on Canvas */}
          <div className="fixed bottom-6 right-6 flex items-center gap-1 p-1 bg-[#121B26] border border-[#233549] rounded-xl shadow-xl z-40">
            <button
              onClick={() => {
                if (zoomMode === 'year') setZoomMode('month');
                else if (zoomMode === 'month') setZoomMode('week');
                else if (zoomMode === 'week') setZoomMode('4days');
                else if (zoomMode === '4days') setZoomMode('day');
              }}
              className="p-1.5 hover:bg-[#1E2B3A] rounded-lg text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (zoomMode === 'day') setZoomMode('4days');
                else if (zoomMode === '4days') setZoomMode('week');
                else if (zoomMode === 'week') setZoomMode('month');
                else if (zoomMode === 'month') setZoomMode('year');
              }}
              className="p-1.5 hover:bg-[#1E2B3A] rounded-lg text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. ClickUp Task Detail Modal / Inspector Drawer */}
      <ClickUpTaskDetailModal
        taskId={detailModalTaskId}
        onClose={() => setDetailModalTaskId(null)}
      />

      {/* 4. CSV Import Modal */}
      {showCsvImportModal && (
        <ProjectCsvImportModal
          projectId={selectedProjectId}
          onClose={() => setShowCsvImportModal(false)}
        />
      )}
    </div>
  );
};
