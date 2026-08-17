import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Play,
  Square,
  Filter,
  Search,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calendar as CalendarIcon,
  User as UserIcon,
  X,
  Link,
  Tag,
  SlidersHorizontal,
  MoreHorizontal,
  Circle,
  Flame,
  Zap,
  Activity,
  Repeat,
  RefreshCw,
  RotateCw,
  GitCommit,
  ArrowRightCircle,
  ArrowUpRight,
  Lock,
  Unlock,
  AlertTriangle,
  Workflow,
  Sparkles,
  TrendingUp,
  BarChart3,
  ListOrdered,
  Loader2,
  ShieldAlert,
  Layers,
  Award,
  Check,
  ArrowUpDown,
  Eye,
  Shield,
  Download,
  Sliders,
  FileSpreadsheet,
  Table,
  FolderKanban,
  Pencil
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, Priority, RecurrenceType, RecurrenceConfig } from '../../types';
import { isAbortError } from '../../lib/errorUtils';
import { calculatePriorityScore } from '../../lib/priorityScore';
import { TaskQuickPreviewPopover } from './TaskQuickPreviewPopover';
import { AssigneePicker } from './AssigneePicker';
import { getSpaceRole, canEditSpace, getAccessibleProjects, getAccessibleTasks, canDeleteTask } from '../../lib/permissions';
import { PermissionGuard } from '../common/PermissionGuard';
import { ProjectCsvImportModal } from '../projects/ProjectCsvImportModal';
import { AssigneeFilterDropdown } from '../common/AssigneeFilterDropdown';
import { TasksDataTable } from './TasksDataTable';
import { PriorityBadge } from '../common/PriorityBadge';
import { getDisplayTaskTitle } from '../../lib/taskUtils';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { SprintPlanningView } from '../sprints/SprintPlanningView';
import { CustomFieldsManagerModal } from '../customFields/CustomFieldsManagerModal';

export const TasksView: React.FC = () => {
  const {
    tasks,
    subtasks,
    dependencies,
    addTask,
    updateTask,
    deleteTask,
    addListToProject,
    addSubtask,
    toggleSubtask,
    addDependency,
    removeDependency,
    recalculateProjectTimeline,
    projects,
    users,
    startTimer,
    stopTimer,
    timer,
    logTimeManual,
    selectedProjectId,
    setSelectedProjectId,
    selectedListFilter,
    setSelectedListFilter,
    searchQuery,
    setSearchQuery,
    seedDemoTasksForProject,
    theme,
    currentUser,
    customFields,
    sprints
  } = useApp();

  const isLight = theme === 'light';

  const accessibleProjects = useMemo(() => {
    return getAccessibleProjects(currentUser, projects);
  }, [currentUser, projects]);

  const accessibleTasks = useMemo(() => {
    return getAccessibleTasks(currentUser, tasks, projects);
  }, [currentUser, tasks, projects]);

  const currentProject = useMemo(() => {
    return accessibleProjects.find((p) => p.id === (selectedProjectId || accessibleProjects[0]?.id)) || null;
  }, [accessibleProjects, selectedProjectId]);

  const currentSpaceRole = useMemo(() => {
    return getSpaceRole(currentUser, currentProject);
  }, [currentUser, currentProject]);

  const userCanEdit = useMemo(() => {
    return canEditSpace(currentUser, currentProject);
  }, [currentUser, currentProject]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [inProgressOpen, setInProgressOpen] = useState(true);
  const [toDoOpen, setToDoOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(true);

  // Inline Task Add input
  const [inlineAddGroup, setInlineAddGroup] = useState<TaskStatus | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');

  // Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState(selectedProjectId || projects[0]?.id || 'proj_chairman');
  const [newPriority, setNewPriority] = useState<Priority>('High');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(['usr_pk']);
  const [newEstHours, setNewEstHours] = useState(20);
  const [newDueDate, setNewDueDate] = useState('2026-08-30');

  // Recurrence configuration state
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<string[]>(['Mon']);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number>(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');
  const [autoRegenerateOnComplete, setAutoRegenerateOnComplete] = useState<boolean>(true);

  // Predecessors & Successors creation state
  const [selectedPredecessorIds, setSelectedPredecessorIds] = useState<string[]>([]);
  const [selectedSuccessorIds, setSelectedSuccessorIds] = useState<string[]>([]);

  // Drawer list management state
  const [drawerSelectedList, setDrawerSelectedList] = useState<string>('');
  const [drawerNewListInput, setDrawerNewListInput] = useState<string>('');
  const [newListName, setNewListName] = useState<string>('');
  const [editingDrawerDesc, setEditingDrawerDesc] = useState<boolean>(false);
  const [drawerDescValue, setDrawerDescValue] = useState<string>('');
  const [newPredTaskId, setNewPredTaskId] = useState('');
  const [newSuccTaskId, setNewSuccTaskId] = useState('');
  const [timelineToast, setTimelineToast] = useState<string | null>(null);

  // AI Smart Priority State
  const [showSmartPriorityModal, setShowSmartPriorityModal] = useState(false);
  const [isAnalyzingPriority, setIsAnalyzingPriority] = useState(false);
  const [priorityRecommendations, setPriorityRecommendations] = useState<Array<{
    id: string;
    title: string;
    suggestedPriority: string;
    impactScore: number;
    suggestedOrder: number;
    reasoning: string;
    riskFactor: string;
  }>>([]);
  const [smartPriorityToast, setSmartPriorityToast] = useState<string | null>(null);
  const [sortBySmartPriority, setSortBySmartPriority] = useState(false);
  const [singleAnalyzingTaskId, setSingleAnalyzingTaskId] = useState<string | null>(null);
  const [filterUnassignedModal, setFilterUnassignedModal] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [tasksViewMode, setTasksViewMode] = useState<'table' | 'list' | 'sprints'>('table');
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false);

  // Unassigned tasks helper
  const unassignedTasks = useMemo(() => {
    return tasks.filter((t) => !t.assigneeIds || t.assigneeIds.length === 0 || !t.assigneeIds[0]);
  }, [tasks]);

  const handleOpenSmartPriorityModal = async (unassignedOnly = false) => {
    setShowSmartPriorityModal(true);
    setIsAnalyzingPriority(true);
    setFilterUnassignedModal(unassignedOnly);
    setPriorityRecommendations([]);

    const currentProject = projects.find((p) => p.id === (selectedProjectId || projects[0]?.id));
    const baseTasks = filteredTasks.length > 0 ? filteredTasks : tasks;
    const tasksToAnalyze = unassignedOnly
      ? baseTasks.filter((t) => !t.assigneeIds || t.assigneeIds.length === 0 || !t.assigneeIds[0])
      : baseTasks;

    try {
      const res = await fetch('/api/ai/smart-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: currentProject?.title || 'Dolphin Group Scope',
          projectScope: currentProject?.description || 'Industrial Fabrication & DEWA Quality Audit',
          tasks: tasksToAnalyze,
          unassignedOnly
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setPriorityRecommendations(data.recommendations);
      } else {
        throw new Error('No recommendations in response');
      }
    } catch (err: any) {
      if (isAbortError(err)) return;
      console.warn('Smart Priority API fallback active:', err?.message || err);
      const fallbackRecs = tasksToAnalyze.map((t, idx) => {
        const estH = t.estimatedHours || 10;
        const dueDays = t.dueDate ? Math.max(1, Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / 86400000)) : 10;
        const priorityTag = (dueDays <= 7 || estH >= 20) ? 'High' : (dueDays <= 14 || estH >= 10) ? 'Medium' : 'Low';

        return {
          id: t.id,
          title: t.title,
          isUnassigned: !t.assigneeIds || t.assigneeIds.length === 0 || !t.assigneeIds[0],
          suggestedPriority: priorityTag,
          impactScore: priorityTag === 'High' ? 88 : priorityTag === 'Medium' ? 65 : 40,
          suggestedOrder: idx + 1,
          reasoning: `Evaluated ${estH}h effort estimate against due date (${t.dueDate || 'Upcoming'}). Suggested '${priorityTag}' priority tag.`,
          riskFactor: priorityTag === 'High' ? 'Tight Deadline / High Effort' : 'Low Risk'
        };
      });
      setPriorityRecommendations(fallbackRecs);
    } finally {
      setIsAnalyzingPriority(false);
    }
  };

  const handleSingleTaskSmartPriority = async (task: Task) => {
    setSingleAnalyzingTaskId(task.id);
    try {
      const currentProject = projects.find((p) => p.id === (selectedProjectId || projects[0]?.id));
      const res = await fetch('/api/ai/smart-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: currentProject?.title || 'Dolphin Group Scope',
          projectScope: currentProject?.description || 'Dolphin Global Enterprise Project',
          tasks: [task]
        })
      });

      let suggestedTag = 'Medium';
      if (res.ok) {
        const data = await res.json();
        const rec = data.recommendations?.[0];
        if (rec && rec.suggestedPriority) {
          suggestedTag = rec.suggestedPriority;
        }
      } else {
        const estH = task.estimatedHours || 10;
        const dueDays = task.dueDate ? Math.max(1, Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000)) : 10;
        suggestedTag = (dueDays <= 7 || estH >= 20) ? 'High' : (dueDays <= 14 || estH >= 10) ? 'Medium' : 'Low';
      }

      updateTask(task.id, { priority: suggestedTag as Priority });
      setSmartPriorityToast(`Gemini AI evaluated deadline (${task.dueDate || 'Upcoming'}) & ${task.estimatedHours || 10}h effort: Auto-tagged as '${suggestedTag}' priority.`);
      setTimeout(() => setSmartPriorityToast(null), 5000);
    } catch (e) {
      const estH = task.estimatedHours || 10;
      const dueDays = task.dueDate ? Math.max(1, Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000)) : 10;
      const suggestedTag = (dueDays <= 7 || estH >= 20) ? 'High' : (dueDays <= 14 || estH >= 10) ? 'Medium' : 'Low';
      updateTask(task.id, { priority: suggestedTag as Priority });
      setSmartPriorityToast(`Evaluated deadline & effort estimate: Auto-tagged task as '${suggestedTag}' priority.`);
      setTimeout(() => setSmartPriorityToast(null), 5000);
    } finally {
      setSingleAnalyzingTaskId(null);
    }
  };

  const handleApplySmartPriorities = (unassignedOnly = false) => {
    if (priorityRecommendations.length === 0) return;

    let appliedCount = 0;
    priorityRecommendations.forEach((rec) => {
      const existing = tasks.find((t) => t.id === rec.id);
      const isUnassigned = existing && (!existing.assigneeIds || existing.assigneeIds.length === 0 || !existing.assigneeIds[0]);

      if (existing && (!unassignedOnly || isUnassigned)) {
        updateTask(rec.id, {
          priority: rec.suggestedPriority as Priority,
        });
        appliedCount++;
      }
    });

    setSortBySmartPriority(true);
    setSmartPriorityToast(
      unassignedOnly
        ? `Successfully applied Gemini High/Medium/Low priority tags to ${appliedCount} unassigned tasks based on deadlines & effort estimates!`
        : `Successfully reordered & updated priorities for ${appliedCount} tasks based on business impact and dependencies!`
    );
    setShowSmartPriorityModal(false);
    setTimeout(() => setSmartPriorityToast(null), 5000);
  };

  // Helper map for reordering tasks by Smart Priority score
  const recommendationsMap = new Map<string, {
    id: string;
    title: string;
    suggestedPriority: string;
    impactScore: number;
    suggestedOrder: number;
    reasoning: string;
    riskFactor: string;
  }>(
    priorityRecommendations.map((r) => [r.id, r])
  );

  const getTaskSmartScore = (t: Task): number => {
    const rec = recommendationsMap.get(t.id);
    if (rec && typeof rec.impactScore === 'number') {
      return rec.impactScore;
    }
    return calculatePriorityScore(t, dependencies, tasks).score;
  };

  const PRIORITY_RANK: Record<string, number> = {
    Urgent: 4,
    High: 3,
    Medium: 2,
    Low: 1
  };

  const sortTasksList = (list: Task[]) => {
    return [...list].sort((a, b) => {
      // Priority rank weight comparison first (Urgent > High > Medium > Low)
      const weightA = PRIORITY_RANK[a.priority] || 1;
      const weightB = PRIORITY_RANK[b.priority] || 1;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return getTaskSmartScore(b) - getTaskSmartScore(a);
    });
  };

  // Helper functions for predecessors & successors
  const getPredecessorTasks = (task: Task): Task[] => {
    const directPreds = task.predecessors || [];
    const depPreds = dependencies.filter((d) => d.taskId === task.id).map((d) => d.dependsOnTaskId);
    const allPredIds = Array.from(new Set([...directPreds, ...depPreds]));
    return tasks.filter((t) => allPredIds.includes(t.id));
  };

  const getSuccessorTasks = (task: Task): Task[] => {
    const directSuccs = task.successors || [];
    const depSuccs = dependencies.filter((d) => d.dependsOnTaskId === task.id).map((d) => d.taskId);
    const taskPredSuccs = tasks.filter((t) => t.predecessors?.includes(task.id)).map((t) => t.id);
    const allSuccIds = Array.from(new Set([...directSuccs, ...depSuccs, ...taskPredSuccs]));
    return tasks.filter((t) => allSuccIds.includes(t.id));
  };

  const isTaskBlocked = (task: Task): boolean => {
    const preds = getPredecessorTasks(task);
    if (preds.length === 0) return false;
    return preds.some((p) => p.status !== 'Done');
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Drawer states
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [depTaskIdToLink, setDepTaskIdToLink] = useState('');
  const [manualHours, setManualHours] = useState<number>(2);
  const [manualNote, setManualNote] = useState('');

  // Filter tasks
  const filteredTasks = accessibleTasks.filter((t) => {
    if (selectedProjectId && t.projectId !== selectedProjectId) return false;
    if (selectedListFilter) {
      if (selectedListFilter === '__root__') {
        if (t.listName && t.listName.trim() !== '') return false;
      } else if (t.listName !== selectedListFilter) {
        return false;
      }
    }
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        if (t.assigneeIds && t.assigneeIds.length > 0 && t.assigneeIds.some((id) => id && id.trim() !== '')) {
          return false;
        }
      } else {
        if (!t.assigneeIds || !t.assigneeIds.includes(assigneeFilter)) {
          return false;
        }
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchTag = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
      const assignees = users.filter((u) => t.assigneeIds.includes(u.id));
      const matchAssignee = assignees.some(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchDesc && !matchTag && !matchAssignee) return false;
    }
    return true;
  });

  const inProgressTasks = sortTasksList(filteredTasks.filter((t) => t.status === 'In Progress'));
  const toDoTasks = sortTasksList(filteredTasks.filter((t) => t.status === 'To Do' || t.status === 'Backlog'));
  const doneTasks = sortTasksList(filteredTasks.filter((t) => t.status === 'Done' || t.status === 'In Review'));

  // CSV Export for external auditing
  const handleDownloadCsv = () => {
    const exportTasksList = filteredTasks.length > 0 ? filteredTasks : tasks;

    const cfHeaders = customFields.map((cf) => `Custom: ${cf.name}`);

    const headers = [
      'Task ID',
      'Title',
      'Space / Project',
      'Status',
      'Priority',
      'Assignees',
      'Reporter',
      'Start Date',
      'Due Date',
      'Estimated Hours',
      'Logged Hours',
      'Tags',
      'Milestone',
      'Critical Path',
      ...cfHeaders,
      'Created At',
      'Updated At'
    ];

    const rows = exportTasksList.map((t) => {
      const proj = projects.find((p) => p.id === t.projectId);
      const projName = proj ? `${proj.code} - ${proj.title}` : t.projectId;
      const assigneesStr = (t.assigneeIds || [])
        .map((aid) => {
          const u = users.find((usr) => usr.id === aid || usr.email.toLowerCase() === aid.toLowerCase());
          return u ? u.name : aid;
        })
        .join('; ');
      const reporterUser = users.find((u) => u.id === t.reporterId);
      const reporterStr = reporterUser ? reporterUser.name : t.reporterId || 'System';
      const tagsStr = (t.tags || []).join('; ');

      const safeTitle = `"${(t.title || '').replace(/"/g, '""')}"`;

      const cfValues = customFields.map((cf) => {
        const rawVal = t.customFields?.[cf.id] ?? (cf.defaultValue ?? '');
        return `"${String(rawVal).replace(/"/g, '""')}"`;
      });

      return [
        t.id,
        safeTitle,
        `"${projName.replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        `"${assigneesStr.replace(/"/g, '""')}"`,
        `"${reporterStr.replace(/"/g, '""')}"`,
        t.startDate || '',
        t.dueDate || '',
        t.estimatedHours || 0,
        t.loggedHours || 0,
        `"${tagsStr.replace(/"/g, '""')}"`,
        t.isMilestone ? 'Yes' : 'No',
        t.isCriticalPath ? 'Yes' : 'No',
        ...cfValues,
        t.createdAt || '',
        t.updatedAt || ''
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const projCode = currentProject?.code || 'all';
    link.setAttribute('download', `tasks_export_${projCode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInlineAdd = (statusGroup: TaskStatus) => {
    if (!inlineTaskTitle.trim()) return;
    addTask({
      projectId: selectedProjectId || 'proj_chairman',
      companyId: 'comp_1',
      title: inlineTaskTitle.trim(),
      description: 'New ClickUp task item',
      status: statusGroup,
      priority: 'Medium',
      assigneeIds: ['usr_pk'],
      reporterId: users[0]?.id || 'usr_1',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '2025-08-30',
      estimatedHours: 10,
      tags: ['ClickUp', 'Task'],
      listName: selectedListFilter || undefined
    });
    setInlineTaskTitle('');
    setInlineAddGroup(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const proj = projects.find((p) => p.id === newProjectId);
    const finalAssignees = selectedAssigneeIds.length > 0 ? selectedAssigneeIds : [users[0]?.id || 'usr_pk'];

    const recurrenceConfig: RecurrenceConfig | undefined =
      recurrenceType !== 'none'
        ? {
            type: recurrenceType,
            interval: Number(recurrenceInterval) || 1,
            daysOfWeek: recurrenceType === 'weekly' ? recurrenceDaysOfWeek : undefined,
            dayOfMonth: recurrenceType === 'monthly' ? Number(recurrenceDayOfMonth) : undefined,
            endDate: recurrenceEndDate || undefined,
            autoRegenerateOnComplete,
          }
        : undefined;

    const taskTags = ['ClickUp', 'Task'];
    if (recurrenceConfig) taskTags.push('Recurring');

    const finalListName = newListName || selectedListFilter || undefined;
    if (finalListName) {
      addListToProject(newProjectId, finalListName);
    }

    const createdTask = addTask({
      projectId: newProjectId,
      companyId: proj ? proj.companyId : 'comp_1',
      title: newTitle,
      description: newDesc || 'ClickUp executive task deliverable',
      status: 'To Do',
      priority: newPriority,
      assigneeIds: finalAssignees,
      reporterId: users[0]?.id || 'usr_1',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      estimatedHours: Number(newEstHours),
      tags: taskTags,
      listName: finalListName,
      predecessors: selectedPredecessorIds,
      successors: selectedSuccessorIds,
      dependencies: selectedPredecessorIds,
      recurrence: recurrenceConfig,
    });

    if (createdTask && createdTask.id) {
      selectedPredecessorIds.forEach((predId) => {
        addDependency(createdTask.id, predId);
      });
      selectedSuccessorIds.forEach((succId) => {
        addDependency(succId, createdTask.id);
      });
    }

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setSelectedPredecessorIds([]);
    setSelectedSuccessorIds([]);
    setRecurrenceType('none');
    setRecurrenceInterval(1);
    setRecurrenceDaysOfWeek(['Mon']);
    setRecurrenceDayOfMonth(1);
    setRecurrenceEndDate('');
    setAutoRegenerateOnComplete(true);
  };

  const activeTask = tasks.find((t) => t.id === selectedTaskId);
  const activeTaskSubtasks = subtasks.filter((s) => s.taskId === selectedTaskId);
  const activeTaskDeps = dependencies.filter((d) => d.taskId === selectedTaskId);

  // Helper renderer for table row visual indicators
  const renderDependencyIndicators = (t: Task) => {
    const preds = getPredecessorTasks(t);
    const succs = getSuccessorTasks(t);
    const blocked = isTaskBlocked(t);

    if (preds.length === 0 && succs.length === 0) return null;

    return (
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {/* Blocked Badge */}
        {blocked && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 shrink-0"
            title={`Blocked by: ${preds.filter((p) => p.status !== 'Done').map((p) => `${p.title} (${p.status})`).join(', ')}`}
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Blocked</span>
          </span>
        )}

        {/* Predecessors Badge */}
        {preds.length > 0 && (
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border shrink-0 ${
              blocked
                ? 'bg-[#0D1520] text-cyan-300 border-cyan-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
            title={`Predecessors: ${preds.map((p) => `${p.title} [${p.status}]`).join(' • ')}`}
          >
            <GitCommit className="w-3 h-3 text-cyan-400" />
            <span>Pred: {preds.length}</span>
          </span>
        )}

        {/* Successors Badge */}
        {succs.length > 0 && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0"
            title={`Successors (Unlocks): ${succs.map((s) => `${s.title} [${s.status}]`).join(' • ')}`}
          >
            <ArrowUpRight className="w-3 h-3 text-purple-400" />
            <span>Succ: {succs.length}</span>
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      
      {/* Finish-to-Start Auto-Recalculation Header Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border shadow-lg ${
        theme === 'light'
          ? 'bg-white border-slate-200 shadow-slate-200/50'
          : 'bg-gradient-to-r from-[#121B26] via-[#1A2634] to-[#121B26] border-[#233549]'
      }`}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            theme === 'light' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          }`}>
            <Workflow className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className={`text-base font-bold flex flex-wrap items-center gap-2.5 ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              <span>Task Management & Dependencies</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold whitespace-nowrap border ${
                theme === 'light' ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                Finish-to-Start (FS)
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
              Define predecessor/successor tasks and automatically propagate timeline schedule changes across dependencies.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              const res = recalculateProjectTimeline(selectedProjectId || undefined);
              if (res.adjustedCount > 0) {
                setTimelineToast(`Auto-adjusted ${res.adjustedCount} dependent task start & due dates based on Finish-to-Start constraints.`);
              } else {
                setTimelineToast('All task timelines are fully aligned with Finish-to-Start predecessor constraints!');
              }
              setTimeout(() => setTimelineToast(null), 5000);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap ${
              theme === 'light'
                ? 'bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-800'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-200'
            }`}
            title="Automatically adjust schedule dates for successor tasks according to predecessor finish dates"
          >
            <RefreshCw className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
            <span>Auto-Recalculate Timeline (FS)</span>
          </button>
          
          <button
            onClick={() => {
              if (!userCanEdit) return;
              setShowCreateModal(true);
            }}
            disabled={!userCanEdit}
            title={!userCanEdit ? 'Task creation is disabled in Viewer mode' : 'Create a new task'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap ${
              !userCanEdit
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                : 'bg-[#7B68EE] hover:bg-[#6854e4] text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Task View Toolbar & Filters Strip */}
      <div className={`p-3 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-3 ${
        theme === 'light'
          ? 'bg-slate-50 border-slate-200'
          : 'bg-[#121B26] border-[#233549]'
      }`}>
        {/* Left: View Mode Toggle Switch (Data Table vs Grouped List vs Sprints) */}
        <div className={`p-1 rounded-xl border flex items-center gap-1 shrink-0 ${
          theme === 'light' ? 'bg-slate-200/70 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <button
            type="button"
            onClick={() => setTasksViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tasksViewMode === 'table'
                ? theme === 'light'
                  ? 'bg-white text-teal-900 shadow-sm border border-slate-200 font-extrabold'
                  : 'bg-[#3BC0BB] text-slate-950 shadow-md shadow-[#3BC0BB]/30 font-extrabold'
                : theme === 'light'
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
                : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
            }`}
            title="Interactive Data Table with multi-select checkboxes, batch status/priority operations, and sorting"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Data Table</span>
          </button>
          <button
            type="button"
            onClick={() => setTasksViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tasksViewMode === 'list'
                ? theme === 'light'
                  ? 'bg-white text-[#0773BB] shadow-sm border border-slate-200 font-extrabold'
                  : 'bg-[#0773BB] text-white shadow-md shadow-[#0773BB]/30 font-extrabold'
                : theme === 'light'
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
                : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
            }`}
            title="Grouped Accordions view by status"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Grouped List</span>
          </button>
          <button
            type="button"
            onClick={() => setTasksViewMode('sprints')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tasksViewMode === 'sprints'
                ? theme === 'light'
                  ? 'bg-white text-amber-900 shadow-sm border border-slate-200 font-extrabold'
                  : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-extrabold'
                : theme === 'light'
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
                : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
            }`}
            title="Agile Scrum Sprint Planning, Backlog Estimations, and Velocity Management"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Sprint Planning</span>
          </button>
        </div>

        {/* Right: Filters & Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Assignee Filter Dropdown */}
          <AssigneeFilterDropdown
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            users={users}
            tasks={accessibleTasks.filter((t) => !selectedProjectId || t.projectId === selectedProjectId)}
          />

          {/* Custom Fields Manager Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowCustomFieldsModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap ${
              theme === 'light'
                ? 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800'
                : 'bg-purple-950/40 hover:bg-purple-900/40 border-purple-500/40 text-purple-300'
            }`}
            title="Configure and manage custom fields across all tasks"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Custom Fields</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
              {customFields.length}
            </span>
          </button>

          {/* AI Smart Priority */}
          <button
            type="button"
            onClick={() => handleOpenSmartPriorityModal(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90 text-white text-xs font-bold transition-all shadow-xs active:scale-95 border border-[#3BC0BB]/40 whitespace-nowrap"
            title="Analyze deadlines, effort estimates, and critical path to reorder all tasks"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
            <span>AI Smart Priority</span>
          </button>

          {/* Smart Priority (Unassigned) */}
          <button
            type="button"
            onClick={() => handleOpenSmartPriorityModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-90 text-white text-xs font-bold transition-all shadow-xs active:scale-95 border border-amber-400/40 whitespace-nowrap"
            title="Use Gemini to analyze deadlines and effort estimates to tag unassigned tasks High/Medium/Low"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-current" />
            <span>Smart Priority (Unassigned)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-amber-100 text-[10px] font-mono font-extrabold">
              {unassignedTasks.length}
            </span>
          </button>

          {/* CSV Export & Import */}
          <button
            type="button"
            onClick={handleDownloadCsv}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-[#0D1520] hover:bg-[#233549] border-[#233549] text-cyan-300'
            }`}
            title="Export current tasks view to CSV for external auditing"
          >
            <Download className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCsvImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90 text-white text-xs font-bold transition-all shadow-xs active:scale-95 border border-[#3BC0BB]/40 whitespace-nowrap"
            title="Import tasks or Action Tracker directly from CSV or Excel file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            <span>Import Tracker</span>
          </button>
        </div>
      </div>

      {/* Read-Only Space Access Banner */}
      {!userCanEdit && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-300">Read-Only Space Access (Viewer Role):</span>
              <span className="ml-1 text-slate-300">
                You are viewing <strong>{currentProject?.title || 'this Space'}</strong> in read-only mode. Task creation and modification are restricted to Editors and Admins.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1">
            <Eye className="w-3 h-3" /> Viewer Mode
          </span>
        </div>
      )}

      {/* Smart Priority Toast Notification */}
      {smartPriorityToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{smartPriorityToast}</span>
          </div>
          <button
            onClick={() => setSmartPriorityToast(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Timeline Recalculation Toast Notification */}
      {timelineToast && (
        <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs font-medium flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{timelineToast}</span>
          </div>
          <button
            onClick={() => setTimelineToast(null)}
            className="text-cyan-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Space List Navigation Tabs Bar */}
      <div className={`p-2 rounded-2xl border flex items-center gap-1.5 overflow-x-auto text-xs font-semibold scrollbar-none ${
        theme === 'light' ? 'bg-slate-100/80 border-slate-200' : 'bg-[#121B26] border-[#233549]'
      }`}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 shrink-0 flex items-center gap-1">
          <FolderKanban className="w-3.5 h-3.5 text-[#3BC0BB]" />
          <span>Lists:</span>
        </span>

        {/* Tab 1: All Space Tasks */}
        <button
          onClick={() => setSelectedListFilter(null)}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            selectedListFilter === null
              ? theme === 'light'
                ? 'bg-[#0D9488] text-white font-bold shadow-xs'
                : 'bg-[#3BC0BB] text-slate-950 font-extrabold shadow-xs'
              : theme === 'light'
              ? 'text-slate-700 hover:bg-slate-200'
              : 'text-slate-300 hover:bg-[#16222F]'
          }`}
        >
          <span>All Tasks in Space</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
            {accessibleTasks.filter((t) => !selectedProjectId || t.projectId === selectedProjectId).length}
          </span>
        </button>

        {/* Tab 2: General Tasks */}
        <button
          onClick={() => setSelectedListFilter('__root__')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            selectedListFilter === '__root__'
              ? theme === 'light'
                ? 'bg-[#0D9488] text-white font-bold shadow-xs'
                : 'bg-[#3BC0BB] text-slate-950 font-extrabold shadow-xs'
              : theme === 'light'
              ? 'text-slate-700 hover:bg-slate-200'
              : 'text-slate-300 hover:bg-[#16222F]'
          }`}
        >
          <span>📂 General Tasks</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
            {accessibleTasks.filter((t) => (!selectedProjectId || t.projectId === selectedProjectId) && (!t.listName || t.listName.trim() === '')).length}
          </span>
        </button>

        {/* Tabs for each List in the current space / projects */}
        {(selectedProjectId
          ? (projects.find((p) => p.id === selectedProjectId)?.lists || [])
          : Array.from(new Set(projects.flatMap((p) => p.lists || [])))
        ).map((listName) => {
          const count = accessibleTasks.filter(
            (t) => (!selectedProjectId || t.projectId === selectedProjectId) && t.listName === listName
          ).length;
          const isActive = selectedListFilter === listName;

          return (
            <button
              key={listName}
              onClick={() => setSelectedListFilter(listName)}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                isActive
                  ? theme === 'light'
                    ? 'bg-[#0D9488] text-white font-bold shadow-xs'
                    : 'bg-[#3BC0BB] text-slate-950 font-extrabold shadow-xs'
                  : theme === 'light'
                  ? 'text-slate-700 hover:bg-slate-200'
                  : 'text-slate-300 hover:bg-[#16222F]'
              }`}
            >
              <span>📋 {listName}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
                {count}
              </span>
            </button>
          );
        })}

        {/* Add List Button */}
        <button
          type="button"
          onClick={() => {
            const targetSpaceId = selectedProjectId || projects[0]?.id;
            if (!targetSpaceId) return;
            const newLName = prompt('Enter name for new list in space:');
            if (newLName?.trim()) {
              addListToProject(targetSpaceId, newLName.trim());
              setSelectedListFilter(newLName.trim());
            }
          }}
          className="px-2.5 py-1.5 rounded-xl border border-dashed border-[#3BC0BB]/50 text-[#3BC0BB] hover:bg-[#3BC0BB]/10 transition-all flex items-center gap-1 text-xs shrink-0 font-bold ml-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TASK VIEW BODY (DATA TABLE OR SPRINT PLANNING OR GROUPED ACCORDIONS) */}
        <div className={`${selectedTaskId && tasksViewMode !== 'sprints' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          {tasksViewMode === 'sprints' ? (
            <SprintPlanningView />
          ) : tasksViewMode === 'table' ? (
            <TasksDataTable
              onSelectTask={(id) => setSelectedTaskId(id)}
              selectedTaskId={selectedTaskId}
            />
          ) : filteredTasks.length === 0 ? (
            <EmptyStateCard
              variant="list"
              theme={theme === 'light' ? 'light' : 'dark'}
              hasActiveFilters={Boolean(searchQuery || selectedListFilter || assigneeFilter !== 'all')}
              onPrimaryAction={() => setShowCreateModal(true)}
              primaryActionLabel="Create Deliverable Task"
              onSecondaryAction={() => setShowCsvImportModal(true)}
              secondaryActionLabel="Import Tasks (CSV)"
              onSeedDemoData={() => seedDemoTasksForProject(selectedProjectId || undefined)}
              seedDemoLabel="Load Demo Deliverables"
              onResetFilters={() => {
                if (setSearchQuery) setSearchQuery('');
                if (setSelectedListFilter) setSelectedListFilter(null);
                setAssigneeFilter('all');
              }}
            />
          ) : (
            <>
              {/* GROUP 1: IN PROGRESS */}
          <div className={`rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121B26] border-[#233549] shadow-xl'} overflow-hidden`}>
            {/* Group Header Bar */}
            <div
              onClick={() => setInProgressOpen(!inProgressOpen)}
              className="px-4 py-3 bg-[#7B68EE]/10 border-b border-[#233549]/60 flex items-center justify-between cursor-pointer select-none hover:bg-[#7B68EE]/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                {inProgressOpen ? <ChevronDown className="w-4 h-4 text-[#7B68EE]" /> : <ChevronRight className="w-4 h-4 text-[#7B68EE]" />}
                <span className="px-2.5 py-0.5 rounded-full bg-[#7B68EE] text-white text-[10px] font-extrabold uppercase tracking-wider">
                  IN PROGRESS
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {inProgressTasks.length}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInlineAddGroup('In Progress');
                }}
                className="text-xs font-semibold text-[#7B68EE] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Task</span>
              </button>
            </div>

            {/* Task Table */}
            {inProgressOpen && (
              <div className="overflow-x-auto">
                <table className={`w-full text-left text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                  <thead className={`font-semibold uppercase tracking-wider border-b text-[10px] ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0D1520]/40 text-slate-400 border-[#233549]/40'
                  }`}>
                    <tr>
                      <th className="p-3 pl-6">Name</th>
                      <th className="p-3">Assignee</th>
                      <th className="p-3 text-center">Priority</th>
                      <th className="p-3 text-center">Priority Score</th>
                      <th className="p-3">Due date</th>
                      <th className="p-3 text-right">Logged/Est</th>
                      <th className="p-3 text-center">Timer</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-medium ${isLight ? 'divide-slate-200' : 'divide-[#233549]/40'}`}>
                    {inProgressTasks.map((t) => {
                      const assignee = users.find((u) => t.assigneeIds.includes(u.id));
                      const isTimerRunning = timer.active && timer.taskId === t.id;
                      const isSelected = selectedTaskId === t.id;
                      const pScore = calculatePriorityScore(t, dependencies, tasks);

                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTaskId(t.id)}
                          className={`transition-colors cursor-pointer ${
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-[#16222F]/80'
                          } ${
                            isSelected ? (isLight ? 'bg-indigo-50/80 border-l-4 border-l-[#7B68EE]' : 'bg-[#7B68EE]/10 border-l-4 border-l-[#7B68EE]') : ''
                          }`}
                        >
                          <td className="p-3 pl-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTask(t.id, { status: 'Done' });
                                }}
                                className="w-4 h-4 rounded-full border-2 border-[#7B68EE] hover:bg-[#7B68EE] transition-all shrink-0 cursor-pointer"
                                title="Click to complete task"
                              />
                              <TaskQuickPreviewPopover task={t} onOpenFullTask={(id) => setSelectedTaskId(id)}>
                                <span className={`font-bold transition-colors cursor-pointer ${
                                  isLight ? 'text-slate-900 hover:text-[#0773BB]' : 'text-slate-100 hover:text-[#7B68EE]'
                                }`}>
                                  {getDisplayTaskTitle(t)}
                                </span>
                              </TaskQuickPreviewPopover>
                              {t.recurrence && t.recurrence.type !== 'none' && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#3BC0BB]/15 text-[#3BC0BB] border border-[#3BC0BB]/30 shrink-0"
                                  title={`Recurring Schedule: Every ${t.recurrence.interval || 1} ${t.recurrence.type}`}
                                >
                                  <Repeat className="w-3 h-3 text-[#3BC0BB]" />
                                  <span className="capitalize text-[9px]">{t.recurrence.type}</span>
                                </span>
                              )}
                              {renderDependencyIndicators(t)}
                            </div>
                          </td>

                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <AssigneePicker
                                assigneeIds={t.assigneeIds || []}
                                users={users}
                                onUpdateAssignees={(newIds) => updateTask(t.id, { assigneeIds: newIds })}
                              />
                              {(!t.assigneeIds || t.assigneeIds.length === 0) && (
                                <button
                                  type="button"
                                  onClick={() => handleSingleTaskSmartPriority(t)}
                                  disabled={singleAnalyzingTaskId === t.id}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-600/30 to-amber-500/30 hover:from-amber-600 hover:to-amber-500 text-amber-200 hover:text-white border border-amber-500/40 text-[10px] font-bold transition-all shrink-0"
                                  title="Analyze deadline & effort estimate with Gemini to auto-tag High/Medium/Low priority"
                                >
                                  <Sparkles className={`w-3 h-3 text-amber-300 ${singleAnalyzingTaskId === t.id ? 'animate-spin' : ''}`} />
                                  <span>{singleAnalyzingTaskId === t.id ? 'Analyzing...' : 'AI Tag Priority'}</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Color-Coded Priority Selector */}
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <PriorityBadge
                              priority={t.priority}
                              onChange={(newPriority) => updateTask(t.id, { priority: newPriority })}
                              interactive
                              size="sm"
                            />
                          </td>

                          {/* Priority Score Badge Cell */}
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${pScore.bgColor} ${pScore.color} ${pScore.borderColor}`}
                              title={pScore.reasons.join(' • ')}
                            >
                              {pScore.tier === 'CRITICAL' ? (
                                <Flame className="w-3 h-3 text-rose-400" />
                              ) : pScore.tier === 'HIGH' ? (
                                <Zap className="w-3 h-3 text-amber-400" />
                              ) : (
                                <Activity className="w-3 h-3 text-blue-400" />
                              )}
                              <span>{pScore.score}</span>
                              <span className="text-[9px] opacity-75 uppercase">{pScore.tier}</span>
                            </span>
                          </td>

                          <td className="p-3 font-mono text-rose-400 font-bold" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="date"
                              value={t.dueDate || ''}
                              onChange={(e) => updateTask(t.id, { dueDate: e.target.value })}
                              className="bg-transparent border border-transparent hover:border-[#233549] focus:border-[#3BC0BB] focus:bg-[#0D1520] text-rose-300 font-bold rounded px-1 py-0.5 font-mono text-xs cursor-pointer focus:outline-none transition-colors"
                              title="Click to change due date"
                            />
                          </td>

                          <td className="p-3 text-right font-mono">
                            <span className="text-[#3BC0BB] font-bold">{t.loggedHours}h</span> / {t.estimatedHours}h
                          </td>

                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {isTimerRunning ? (
                              <button
                                onClick={() => stopTimer('Logged time')}
                                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white transition-all"
                              >
                                <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                              </button>
                            ) : (
                              <button
                                onClick={() => startTimer(t.id, t.title)}
                                className="p-1.5 rounded-lg bg-[#7B68EE]/20 hover:bg-[#7B68EE] text-[#7B68EE] hover:text-white transition-all"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Inline Add Task Row */}
                    {inlineAddGroup === 'In Progress' ? (
                      <tr className="bg-[#16222F]/60">
                        <td colSpan={5} className="p-3 pl-6">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Task Name..."
                              value={inlineTaskTitle}
                              onChange={(e) => setInlineTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineAdd('In Progress');
                                if (e.key === 'Escape') setInlineAddGroup(null);
                              }}
                              className="flex-1 bg-[#0D1520] border border-[#7B68EE] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleInlineAdd('In Progress')}
                              className="px-3 py-1.5 bg-[#7B68EE] text-white font-bold rounded-lg text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setInlineAddGroup(null)}
                              className="p-1.5 text-slate-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        onClick={() => setInlineAddGroup('In Progress')}
                        className="hover:bg-[#16222F]/40 cursor-pointer text-slate-400 hover:text-white"
                      >
                        <td colSpan={5} className="p-2.5 pl-6 text-xs font-medium flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-[#7B68EE]" />
                          <span>Add Task</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* GROUP 2: TO DO */}
          <div className={`rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121B26] border-[#233549] shadow-xl'} overflow-hidden`}>
            {/* Group Header Bar */}
            <div
              onClick={() => setToDoOpen(!toDoOpen)}
              className="px-4 py-3 bg-slate-800/20 border-b border-[#233549]/60 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                {toDoOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span className="px-2.5 py-0.5 rounded-full bg-slate-700/60 text-slate-200 text-[10px] font-extrabold uppercase tracking-wider border border-slate-600/40 flex items-center gap-1">
                  <Circle className="w-2.5 h-2.5 stroke-[3] text-slate-400" />
                  TO DO
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {toDoTasks.length}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInlineAddGroup('To Do');
                }}
                className="text-xs font-semibold text-slate-300 hover:text-white hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Task</span>
              </button>
            </div>

            {/* Task Table */}
            {toDoOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`font-semibold uppercase tracking-wider border-b text-[10px] ${
                    theme === 'light' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#0D1520]/40 text-slate-400 border-[#233549]/40'
                  }`}>
                    <tr>
                      <th className="p-3 pl-6">Name</th>
                      <th className="p-3">Assignee</th>
                      <th className="p-3 text-center">Priority</th>
                      <th className="p-3 text-center">Priority Score</th>
                      <th className="p-3">Due date</th>
                      <th className="p-3 text-right">Logged/Est</th>
                      <th className="p-3 text-center">Timer</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-medium ${theme === 'light' ? 'divide-slate-200' : 'divide-[#233549]/40'}`}>
                    {toDoTasks.map((t) => {
                      const assignee = users.find((u) => t.assigneeIds.includes(u.id));
                      const isTimerRunning = timer.active && timer.taskId === t.id;
                      const isSelected = selectedTaskId === t.id;
                      const pScore = calculatePriorityScore(t, dependencies, tasks);

                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTaskId(t.id)}
                          className={`transition-colors cursor-pointer ${
                            theme === 'light'
                              ? isSelected ? 'bg-teal-50/80 border-l-4 border-l-[#0D9488]' : 'hover:bg-slate-50'
                              : isSelected ? 'bg-[#0773BB]/10 border-l-4 border-l-[#0773BB]' : 'hover:bg-[#16222F]/80'
                          }`}
                        >
                          <td className="p-3 pl-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTask(t.id, { status: 'In Progress' });
                                }}
                                className="w-4 h-4 rounded-full border-2 border-slate-400 hover:border-[#7B68EE] transition-all shrink-0"
                                title="Click to set In Progress"
                              />
                              <TaskQuickPreviewPopover task={t} onOpenFullTask={(id) => setSelectedTaskId(id)}>
                                <span className={`font-medium transition-colors cursor-pointer ${
                                  theme === 'light' ? 'text-slate-800 hover:text-teal-700' : 'text-slate-200 hover:text-white'
                                }`}>
                                  {getDisplayTaskTitle(t)}
                                </span>
                              </TaskQuickPreviewPopover>
                              {t.recurrence && t.recurrence.type !== 'none' && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#3BC0BB]/15 text-[#3BC0BB] border border-[#3BC0BB]/30 shrink-0"
                                  title={`Recurring Schedule: Every ${t.recurrence.interval || 1} ${t.recurrence.type}`}
                                >
                                  <Repeat className="w-3 h-3 text-[#3BC0BB]" />
                                  <span className="capitalize text-[9px]">{t.recurrence.type}</span>
                                </span>
                              )}
                              {renderDependencyIndicators(t)}
                            </div>
                          </td>

                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <AssigneePicker
                                assigneeIds={t.assigneeIds || []}
                                users={users}
                                onUpdateAssignees={(newIds) => updateTask(t.id, { assigneeIds: newIds })}
                              />
                              {(!t.assigneeIds || t.assigneeIds.length === 0) && (
                                <button
                                  type="button"
                                  onClick={() => handleSingleTaskSmartPriority(t)}
                                  disabled={singleAnalyzingTaskId === t.id}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-600/30 to-amber-500/30 hover:from-amber-600 hover:to-amber-500 text-amber-200 hover:text-white border border-amber-500/40 text-[10px] font-bold transition-all shrink-0"
                                  title="Analyze deadline & effort estimate with Gemini to auto-tag High/Medium/Low priority"
                                >
                                  <Sparkles className={`w-3 h-3 text-amber-300 ${singleAnalyzingTaskId === t.id ? 'animate-spin' : ''}`} />
                                  <span>{singleAnalyzingTaskId === t.id ? 'Analyzing...' : 'AI Tag Priority'}</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Color-Coded Priority Selector */}
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <PriorityBadge
                              priority={t.priority}
                              onChange={(newPriority) => updateTask(t.id, { priority: newPriority })}
                              interactive
                              size="sm"
                            />
                          </td>

                          {/* Priority Score Badge Cell */}
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${pScore.bgColor} ${pScore.color} ${pScore.borderColor}`}
                              title={pScore.reasons.join(' • ')}
                            >
                              {pScore.tier === 'CRITICAL' ? (
                                <Flame className="w-3 h-3 text-rose-400" />
                              ) : pScore.tier === 'HIGH' ? (
                                <Zap className="w-3 h-3 text-amber-400" />
                              ) : (
                                <Activity className="w-3 h-3 text-blue-400" />
                              )}
                              <span>{pScore.score}</span>
                              <span className="text-[9px] opacity-75 uppercase">{pScore.tier}</span>
                            </span>
                          </td>

                          <td className="p-3 font-mono text-slate-400" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="date"
                              value={t.dueDate || ''}
                              onChange={(e) => updateTask(t.id, { dueDate: e.target.value })}
                              className="bg-transparent border border-transparent hover:border-[#233549] focus:border-[#3BC0BB] focus:bg-[#0D1520] text-rose-300 font-bold rounded px-1 py-0.5 font-mono text-xs cursor-pointer focus:outline-none transition-colors"
                              title="Click to change due date"
                            />
                          </td>

                          <td className="p-3 text-right font-mono">
                            <span className="text-slate-400">{t.loggedHours}h</span> / {t.estimatedHours}h
                          </td>

                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {isTimerRunning ? (
                              <button
                                onClick={() => stopTimer('Logged time')}
                                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white transition-all"
                              >
                                <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                              </button>
                            ) : (
                              <button
                                onClick={() => startTimer(t.id, t.title)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#0773BB] text-slate-400 hover:text-white transition-all"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Inline Add Task Row */}
                    {inlineAddGroup === 'To Do' ? (
                      <tr className="bg-[#16222F]/60">
                        <td colSpan={5} className="p-3 pl-6">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Task Name..."
                              value={inlineTaskTitle}
                              onChange={(e) => setInlineTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineAdd('To Do');
                                if (e.key === 'Escape') setInlineAddGroup(null);
                              }}
                              className="flex-1 bg-[#0D1520] border border-[#0773BB] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleInlineAdd('To Do')}
                              className="px-3 py-1.5 bg-[#0773BB] text-white font-bold rounded-lg text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setInlineAddGroup(null)}
                              className="p-1.5 text-slate-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        onClick={() => setInlineAddGroup('To Do')}
                        className="hover:bg-[#16222F]/40 cursor-pointer text-slate-400 hover:text-white"
                      >
                        <td colSpan={5} className="p-2.5 pl-6 text-xs font-medium flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                          <span>Add Task</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* GROUP 3: COMPLETED */}
          {doneTasks.length > 0 && (
            <div className={`rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121B26] border-[#233549] shadow-xl'} overflow-hidden`}>
              <div
                onClick={() => setCompletedOpen(!completedOpen)}
                className="px-4 py-3 bg-emerald-500/10 border-b border-[#233549]/60 flex items-center justify-between cursor-pointer select-none hover:bg-emerald-500/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {completedOpen ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-emerald-400" />}
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                    COMPLETE
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {doneTasks.length}
                  </span>
                </div>
              </div>

              {completedOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-[#233549]/40 font-medium">
                      {doneTasks.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTaskId(t.id)}
                          className="hover:bg-[#16222F]/80 transition-colors cursor-pointer opacity-75"
                        >
                          <td className="p-3 pl-6 text-slate-400 font-medium">
                            <div className="flex items-center gap-2">
                              <TaskQuickPreviewPopover task={t} onOpenFullTask={(id) => setSelectedTaskId(id)}>
                                <span className="line-through cursor-pointer hover:text-slate-200">{getDisplayTaskTitle(t)}</span>
                              </TaskQuickPreviewPopover>
                              {renderDependencyIndicators(t)}
                            </div>
                          </td>
                          <td className="p-3 text-emerald-400 font-bold text-[10px]">
                            COMPLETED
                          </td>
                          <td className="p-3 font-mono text-slate-500">{t.dueDate}</td>
                          <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                            {t.loggedHours}h / {t.estimatedHours}h
                          </td>
                          <td className="p-3 text-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
            </>
          )}

        </div>

        {/* CLICKUP TASK DETAIL DRAWER */}
        {activeTask && (() => {
          const activePScore = calculatePriorityScore(activeTask, dependencies, tasks);

          return (
            <div className="p-6 rounded-2xl bg-[#16222F] border border-[#233549] space-y-6 shadow-2xl animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between border-b border-[#233549] pb-4">
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#7B68EE]/20 text-[#7B68EE] font-bold">
                    CLICKUP TASK INSPECTOR
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

              {/* Space & List Location Routing Card */}
              <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-[#3BC0BB]" />
                    <span>Space & List Location</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3BC0BB]/10 text-[#3BC0BB] border border-[#3BC0BB]/30">
                    {activeTask.listName ? `List: ${activeTask.listName}` : 'General Tasks'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Space Selection */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-semibold mb-1">Move to Space / Project</label>
                    <select
                      value={activeTask.projectId}
                      onChange={(e) => {
                        const newPId = e.target.value;
                        const newP = projects.find((p) => p.id === newPId);
                        updateTask(activeTask.id, {
                          projectId: newPId,
                          companyId: newP?.companyId || activeTask.companyId
                        });
                      }}
                      className="w-full bg-[#16222F] border border-[#233549] text-white rounded-lg px-2.5 py-1.5 font-medium focus:border-[#3BC0BB] focus:outline-none"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* List Selection */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-semibold mb-1">Move to List within Space</label>
                    <select
                      value={drawerSelectedList === '__new__' ? '__new__' : (activeTask.listName || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__new__') {
                          setDrawerSelectedList('__new__');
                        } else {
                          setDrawerSelectedList(val);
                          updateTask(activeTask.id, { listName: val || undefined });
                        }
                      }}
                      className="w-full bg-[#16222F] border border-[#233549] text-white rounded-lg px-2.5 py-1.5 font-medium focus:border-[#3BC0BB] focus:outline-none"
                    >
                      <option value="">-- General / Main List --</option>
                      {(projects.find((p) => p.id === activeTask.projectId)?.lists || []).map((l) => (
                        <option key={l} value={l}>
                          List: "{l}"
                        </option>
                      ))}
                      <option value="__new__">+ Create New List in Space...</option>
                    </select>
                  </div>
                </div>

                {drawerSelectedList === '__new__' && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Type new list name (e.g. Website Dev, SEO & Ads)..."
                      value={drawerNewListInput}
                      onChange={(e) => setDrawerNewListInput(e.target.value)}
                      className="flex-1 bg-[#16222F] border border-[#3BC0BB] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = drawerNewListInput.trim();
                        if (trimmed) {
                          addListToProject(activeTask.projectId, trimmed);
                          updateTask(activeTask.id, { listName: trimmed });
                          setDrawerSelectedList(trimmed);
                          setDrawerNewListInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#3BC0BB] text-slate-950 font-bold text-xs hover:bg-[#32a8a4] transition-all shrink-0"
                    >
                      Create & Move Task
                    </button>
                  </div>
                )}
              </div>

              {/* Calculated Priority Score Gauge Card */}
              <div className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activePScore.tier === 'CRITICAL' ? (
                      <Flame className="w-4 h-4 text-rose-400" />
                    ) : activePScore.tier === 'HIGH' ? (
                      <Zap className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="text-xs font-bold text-white">Calculated Priority Score</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold border ${activePScore.bgColor} ${activePScore.color} ${activePScore.borderColor}`}
                  >
                    {activePScore.score} / 100 ({activePScore.tier})
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      activePScore.tier === 'CRITICAL'
                        ? 'bg-rose-500'
                        : activePScore.tier === 'HIGH'
                        ? 'bg-amber-400'
                        : activePScore.tier === 'MEDIUM'
                        ? 'bg-blue-400'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${activePScore.score}%` }}
                  />
                </div>

                {/* Factor Breakdown List */}
                <div className="space-y-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Score Factors:</span>
                  <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px]">
                    {activePScore.reasons.map((r, idx) => (
                      <li key={idx} className="text-slate-300">{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Schedule Dates: Start Date & Due Date */}
              <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-[#0D1520] border border-[#233549]">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={activeTask.startDate || ''}
                    onChange={(e) => updateTask(activeTask.id, { startDate: e.target.value })}
                    className="w-full bg-[#16222F] border border-[#233549] text-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:border-[#3BC0BB] focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>Due Date</span>
                  </label>
                  <input
                    type="date"
                    value={activeTask.dueDate || ''}
                    onChange={(e) => updateTask(activeTask.id, { dueDate: e.target.value })}
                    className="w-full bg-[#16222F] border border-rose-500/40 text-rose-300 font-bold rounded-lg px-2.5 py-1.5 font-mono text-xs focus:border-[#3BC0BB] focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Status</label>
                <select
                  value={activeTask.status}
                  onChange={(e) =>
                    updateTask(activeTask.id, { status: e.target.value as TaskStatus })
                  }
                  className="w-full bg-[#0D1520] border border-[#233549] text-white rounded-xl px-3 py-2 font-bold"
                >
                  <option value="To Do">TO DO</option>
                  <option value="In Progress">IN PROGRESS</option>
                  <option value="In Review">IN REVIEW</option>
                  <option value="Done">COMPLETE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Priority</label>
                <PriorityBadge
                  priority={activeTask.priority}
                  onChange={(newPriority) => updateTask(activeTask.id, { priority: newPriority })}
                  interactive
                  size="md"
                  className="w-full justify-between"
                />
              </div>
            </div>

            {/* Assignees Section */}
            <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-[#3BC0BB]" />
                  Assigned Team Members ({activeTask.assigneeIds?.length || 0})
                </span>
                <span className="text-[10px] text-slate-400">Click to add or modify assignees</span>
              </div>
              <div className="pt-1">
                <AssigneePicker
                  assigneeIds={activeTask.assigneeIds || []}
                  users={users}
                  onUpdateAssignees={(newIds) => updateTask(activeTask.id, { assigneeIds: newIds })}
                  size="md"
                  showLabel={true}
                />
              </div>
            </div>

            {/* Description */}
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Description</span>
                {!editingDrawerDesc && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerDescValue(activeTask.description || '');
                      setEditingDrawerDesc(true);
                    }}
                    className="text-[10px] text-[#3BC0BB] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit Description
                  </button>
                )}
              </div>
              {editingDrawerDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={drawerDescValue}
                    onChange={(e) => setDrawerDescValue(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-[#0D1520] border border-[#3BC0BB] text-slate-200 text-xs focus:outline-none resize-none"
                    placeholder="Enter task description..."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingDrawerDesc(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateTask(activeTask.id, { description: drawerDescValue.trim() });
                        setEditingDrawerDesc(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#3BC0BB] text-[#020712] text-xs font-extrabold hover:bg-[#32a8a4]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] text-slate-300 leading-relaxed italic">
                  {activeTask.description || <span className="text-slate-500 font-normal">No description provided. Click edit to add one.</span>}
                </p>
              )}
            </div>

            {/* Task Custom Fields Section */}
            {customFields.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-3 text-xs shadow-lg">
                <div className="flex items-center justify-between border-b border-[#233549] pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Sliders className="w-4 h-4 text-[#3BC0BB]" />
                    <span>Task Custom Fields</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {customFields.length} {customFields.length === 1 ? 'Field' : 'Fields'}
                  </span>
                </div>

                <div className="space-y-3">
                  {customFields.map((cf) => {
                    const currentVal = activeTask.customFields?.[cf.id] ?? (cf.defaultValue ?? '');
                    return (
                      <div key={cf.id} className="space-y-1">
                        <label className="block text-slate-300 font-semibold text-xs flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            {cf.name}
                            {cf.required && <span className="text-rose-400 font-bold">*</span>}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono uppercase bg-[#16222F] px-1.5 py-0.5 rounded border border-[#233549]">
                            {cf.type}
                          </span>
                        </label>

                        {cf.type === 'dropdown' ? (
                          <select
                            value={String(currentVal)}
                            onChange={(e) => {
                              const updatedCustomFields = {
                                ...(activeTask.customFields || {}),
                                [cf.id]: e.target.value
                              };
                              updateTask(activeTask.id, { customFields: updatedCustomFields });
                            }}
                            className="w-full bg-[#16222F] border border-[#233549] text-white rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-[#3BC0BB]"
                          >
                            <option value="">-- Select {cf.name} --</option>
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
                              const updatedCustomFields = {
                                ...(activeTask.customFields || {}),
                                [cf.id]: val
                              };
                              updateTask(activeTask.id, { customFields: updatedCustomFields });
                            }}
                            className="w-full bg-[#16222F] border border-[#233549] text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#3BC0BB]"
                          />
                        )}
                        {cf.description && <p className="text-[10px] text-slate-500">{cf.description}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recurrence Settings in Drawer */}
            <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Repeat className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Recurrence Schedule</span>
                </div>
                {activeTask.recurrence && activeTask.recurrence.type !== 'none' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 font-bold">
                    {activeTask.recurrence.type.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">One-time Task</span>
                )}
              </div>

              {activeTask.recurrence && activeTask.recurrence.type !== 'none' ? (
                <div className="space-y-1.5 text-[11px] text-slate-300 bg-[#16222F] p-2.5 rounded-lg border border-[#233549]">
                  <div className="flex items-center justify-between">
                    <span>Repeat Frequency:</span>
                    <span className="font-mono text-[#3BC0BB] font-bold">Every {activeTask.recurrence.interval || 1} {activeTask.recurrence.type}(s)</span>
                  </div>
                  {activeTask.recurrence.daysOfWeek && (
                    <div className="flex items-center justify-between">
                      <span>Days:</span>
                      <span className="font-mono text-slate-200">{activeTask.recurrence.daysOfWeek.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Auto-regenerate:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {activeTask.recurrence.autoRegenerateOnComplete !== false ? 'On Completion' : 'Disabled'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateTask(activeTask.id, { recurrence: undefined })}
                    className="w-full mt-1 pt-1.5 border-t border-[#233549] text-rose-400 hover:text-rose-300 text-[10px] text-center font-bold"
                  >
                    Remove Recurrence Schedule
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Add schedule:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateTask(activeTask.id, {
                          recurrence: { type: 'daily', interval: 1, autoRegenerateOnComplete: true }
                        })
                      }
                      className="px-2 py-0.5 rounded bg-[#16222F] hover:bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#233549] text-[10px] font-bold font-mono"
                    >
                      + Daily
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateTask(activeTask.id, {
                          recurrence: { type: 'weekly', interval: 1, daysOfWeek: ['Mon'], autoRegenerateOnComplete: true }
                        })
                      }
                      className="px-2 py-0.5 rounded bg-[#16222F] hover:bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#233549] text-[10px] font-bold font-mono"
                    >
                      + Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateTask(activeTask.id, {
                          recurrence: { type: 'monthly', interval: 1, dayOfMonth: 1, autoRegenerateOnComplete: true }
                        })
                      }
                      className="px-2 py-0.5 rounded bg-[#16222F] hover:bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#233549] text-[10px] font-bold font-mono"
                    >
                      + Monthly
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Task Dependencies Card (Predecessors & Successors) */}
            {(() => {
              const activePreds = getPredecessorTasks(activeTask);
              const activeSuccs = getSuccessorTasks(activeTask);
              const blocked = isTaskBlocked(activeTask);
              const availableTasksForPred = tasks.filter(
                (t) => t.id !== activeTask.id && !activePreds.some((p) => p.id === t.id)
              );
              const availableTasksForSucc = tasks.filter(
                (t) => t.id !== activeTask.id && !activeSuccs.some((s) => s.id === t.id)
              );

              return (
                <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-[#233549] pb-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <GitCommit className="w-4 h-4 text-[#7B68EE]" />
                      <span>Task Dependencies</span>
                    </div>
                    {blocked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Blocked</span>
                      </span>
                    ) : activePreds.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <Unlock className="w-3 h-3 text-emerald-400" />
                        <span>Ready</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Predecessors (Prerequisites) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300 flex items-center gap-1">
                        <ArrowRightCircle className="w-3.5 h-3.5 text-cyan-400" />
                        Predecessors ({activePreds.length})
                      </span>
                      <span className="text-[10px] text-slate-400">Prerequisites for this task</span>
                    </div>

                    {activePreds.length > 0 ? (
                      <div className="space-y-1.5">
                        {activePreds.map((pred) => {
                          const isDone = pred.status === 'Done';
                          const depLink = dependencies.find(
                            (d) => d.taskId === activeTask.id && d.dependsOnTaskId === pred.id
                          );

                          return (
                            <div
                              key={pred.id}
                              className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                                isDone
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                                  : 'bg-[#16222F] border-[#233549] text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                                <span
                                  onClick={() => setSelectedTaskId(pred.id)}
                                  className="truncate hover:underline cursor-pointer font-medium"
                                  title={pred.title}
                                >
                                  {pred.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                    isDone
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {pred.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (depLink) {
                                      removeDependency(depLink.id);
                                    } else {
                                      updateTask(activeTask.id, {
                                        predecessors: (activeTask.predecessors || []).filter((id) => id !== pred.id),
                                        dependencies: (activeTask.dependencies || []).filter((id) => id !== pred.id),
                                      });
                                    }
                                  }}
                                  className="text-slate-500 hover:text-rose-400 p-0.5"
                                  title="Remove predecessor link"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic bg-[#16222F]/50 p-2 rounded-lg text-center border border-[#233549]/50">
                        No predecessors defined (This task has no prerequisites).
                      </div>
                    )}

                    {/* Add Predecessor selector */}
                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={newPredTaskId}
                        onChange={(e) => setNewPredTaskId(e.target.value)}
                        className="flex-1 bg-[#16222F] border border-[#233549] rounded-lg px-2 py-1 text-[11px] text-white focus:border-[#7B68EE]"
                      >
                        <option value="">+ Add Predecessor Task...</option>
                        {availableTasksForPred.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.status})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (newPredTaskId) {
                            addDependency(activeTask.id, newPredTaskId);
                            setNewPredTaskId('');
                            const res = recalculateProjectTimeline(activeTask.projectId);
                            if (res.adjustedCount > 0) {
                              setTimelineToast(`Linked Finish-to-Start dependency! Auto-adjusted ${res.adjustedCount} downstream task dates.`);
                              setTimeout(() => setTimelineToast(null), 5000);
                            }
                          }
                        }}
                        disabled={!newPredTaskId}
                        className="px-2.5 py-1 rounded-lg bg-[#7B68EE] disabled:opacity-40 text-white text-[11px] font-bold shrink-0 hover:bg-[#6854e4] transition-colors"
                      >
                        Link
                      </button>
                    </div>
                  </div>

                  {/* Successors (Dependent Tasks) */}
                  <div className="space-y-2 pt-2 border-t border-[#233549]/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
                        Successors ({activeSuccs.length})
                      </span>
                      <span className="text-[10px] text-slate-400">Tasks unlocked by this task</span>
                    </div>

                    {activeSuccs.length > 0 ? (
                      <div className="space-y-1.5">
                        {activeSuccs.map((succ) => {
                          const depLink = dependencies.find(
                            (d) => d.taskId === succ.id && d.dependsOnTaskId === activeTask.id
                          );

                          return (
                            <div
                              key={succ.id}
                              className="p-2 rounded-lg border bg-[#16222F] border-[#233549] flex items-center justify-between gap-2 text-[11px] text-slate-200"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Workflow className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span
                                  onClick={() => setSelectedTaskId(succ.id)}
                                  className="truncate hover:underline cursor-pointer font-medium"
                                  title={succ.title}
                                >
                                  {succ.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-800 text-slate-300">
                                  {succ.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (depLink) {
                                      removeDependency(depLink.id);
                                    } else {
                                      updateTask(succ.id, {
                                        predecessors: (succ.predecessors || []).filter((id) => id !== activeTask.id),
                                        dependencies: (succ.dependencies || []).filter((id) => id !== activeTask.id),
                                      });
                                    }
                                  }}
                                  className="text-slate-500 hover:text-rose-400 p-0.5"
                                  title="Remove successor link"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic bg-[#16222F]/50 p-2 rounded-lg text-center border border-[#233549]/50">
                        No successors defined (No other task depends on this one).
                      </div>
                    )}

                    {/* Add Successor selector */}
                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={newSuccTaskId}
                        onChange={(e) => setNewSuccTaskId(e.target.value)}
                        className="flex-1 bg-[#16222F] border border-[#233549] rounded-lg px-2 py-1 text-[11px] text-white focus:border-[#7B68EE]"
                      >
                        <option value="">+ Add Successor Task...</option>
                        {availableTasksForSucc.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.status})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (newSuccTaskId) {
                            addDependency(newSuccTaskId, activeTask.id);
                            setNewSuccTaskId('');
                            const res = recalculateProjectTimeline(activeTask.projectId);
                            if (res.adjustedCount > 0) {
                              setTimelineToast(`Linked Finish-to-Start successor! Auto-adjusted ${res.adjustedCount} downstream task dates.`);
                              setTimeout(() => setTimelineToast(null), 5000);
                            }
                          }
                        }}
                        disabled={!newSuccTaskId}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 disabled:opacity-40 text-white text-[11px] font-bold shrink-0 hover:bg-purple-500 transition-colors"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Subtasks */}
            <div className="space-y-3 pt-2 border-t border-[#233549]">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Subtasks ({activeTaskSubtasks.length})</span>
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
                      className="w-4 h-4 rounded text-[#7B68EE] cursor-pointer"
                    />
                    <span className={`flex-1 ${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button
                  onClick={() => {
                    if (newSubtaskTitle) {
                      addSubtask(activeTask.id, newSubtaskTitle);
                      setNewSubtaskTitle('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#7B68EE] text-white font-bold text-xs"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Log Hours */}
            <div className="space-y-3 pt-2 border-t border-[#233549]">
              <span className="text-xs font-bold text-white">Log Hours</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={manualHours}
                  onChange={(e) => setManualHours(Number(e.target.value))}
                  className="w-20 bg-[#0D1520] border border-[#233549] rounded-xl px-2 py-1.5 text-xs text-white font-mono"
                />
                <input
                  type="text"
                  placeholder="Note..."
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
                  className="px-3 py-1.5 rounded-xl bg-[#3BC0BB] text-[#0D1520] font-bold text-xs"
                >
                  Log
                </button>
              </div>
            </div>

            {/* Delete */}
            <PermissionGuard action="delete_task" target={activeTask}>
              <div className="pt-2 border-t border-[#233549]">
                <button
                  onClick={() => {
                    deleteTask(activeTask.id);
                    setSelectedTaskId(null);
                  }}
                  className="w-full py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
                >
                  Delete Task
                </button>
              </div>
            </PermissionGuard>
          </div>
        );
      })()}
      </div>

      {/* Modal: Create Task */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-slate-100'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isLight ? 'border-slate-200' : 'border-[#233549]'
            }`}>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#7B68EE]" />
                <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Create New ClickUp Task</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className={`${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dolphin Catalogue (Light Duty & Heavy Duty)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#7B68EE] border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Space / Project *</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 font-medium border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>List within Space</label>
                  <select
                    value={newListName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__new__') {
                        const customName = prompt('Enter name for new list in space:');
                        if (customName?.trim()) {
                          addListToProject(newProjectId, customName.trim());
                          setNewListName(customName.trim());
                        }
                      } else {
                        setNewListName(val);
                      }
                    }}
                    className={`w-full rounded-xl px-3 py-2 font-medium border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  >
                    <option value="">-- General / Main List --</option>
                    {(projects.find((p) => p.id === newProjectId)?.lists || []).map((l) => (
                      <option key={l} value={l}>
                        List: "{l}"
                      </option>
                    ))}
                    <option value="__new__">+ Create New List...</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Assign Team Members *</label>
                <div className={`grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-xl ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
                }`}>
                  {users.map((u) => {
                    const isSelected = selectedAssigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? (isLight ? 'bg-indigo-100 border-[#7B68EE] text-slate-900 font-bold' : 'bg-[#7B68EE]/20 border-[#7B68EE] text-white font-bold')
                            : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-[#16222F]/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#16222F]')
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <div className="truncate min-w-0">
                          <div className="text-[11px] truncate">{u.name}</div>
                          <div className={`text-[9px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{u.department}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className={`w-full rounded-xl px-3 py-2 font-medium border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 font-mono border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Recurrence Configuration Option */}
              <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <Repeat className="w-4 h-4 text-[#3BC0BB]" />
                    <span>Recurrence Schedule</span>
                  </div>
                  {recurrenceType !== 'none' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin-slow" />
                      <span>Recurring Active</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] font-medium mb-1">Frequency</label>
                    <select
                      value={recurrenceType}
                      onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                      className="w-full bg-[#16222F] border border-[#233549] rounded-xl px-3 py-1.5 text-white font-medium focus:border-[#3BC0BB]"
                    >
                      <option value="none">Does Not Repeat</option>
                      <option value="daily">Daily Schedule</option>
                      <option value="weekly">Weekly Schedule</option>
                      <option value="monthly">Monthly Schedule</option>
                    </select>
                  </div>

                  {recurrenceType !== 'none' && (
                    <div>
                      <label className="block text-slate-400 text-[11px] font-medium mb-1">
                        Repeat Interval
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">Every</span>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={recurrenceInterval}
                          onChange={(e) => setRecurrenceInterval(Math.max(1, Number(e.target.value)))}
                          className="w-16 bg-[#16222F] border border-[#233549] rounded-xl px-2 py-1 text-white text-center font-mono font-bold"
                        />
                        <span className="text-slate-400 text-[11px]">
                          {recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? 'week(s)' : 'month(s)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {recurrenceType === 'weekly' && (
                  <div>
                    <label className="block text-slate-400 text-[11px] font-medium mb-1">Repeat On Days</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const isSelected = recurrenceDaysOfWeek.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                if (recurrenceDaysOfWeek.length > 1) {
                                  setRecurrenceDaysOfWeek(recurrenceDaysOfWeek.filter((d) => d !== day));
                                }
                              } else {
                                setRecurrenceDaysOfWeek([...recurrenceDaysOfWeek, day]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              isSelected
                                ? 'bg-[#3BC0BB] text-[#0D1520] shadow-sm'
                                : 'bg-[#16222F] text-slate-400 hover:text-white border border-[#233549]'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {recurrenceType === 'monthly' && (
                  <div>
                    <label className="block text-slate-400 text-[11px] font-medium mb-1">Day of Month</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={recurrenceDayOfMonth}
                        onChange={(e) => setRecurrenceDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
                        className="w-20 bg-[#16222F] border border-[#233549] rounded-xl px-3 py-1 text-white font-mono font-bold"
                      />
                      <span className="text-slate-400 text-[11px]">Day of each month</span>
                    </div>
                  </div>
                )}

                {recurrenceType !== 'none' && (
                  <div className="space-y-2 pt-2 border-t border-[#233549]/60">
                    <div>
                      <label className="block text-slate-400 text-[11px] font-medium mb-1">End Recurrence Date (Optional)</label>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="w-full bg-[#16222F] border border-[#233549] rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="autoRegenCheck"
                        checked={autoRegenerateOnComplete}
                        onChange={(e) => setAutoRegenerateOnComplete(e.target.checked)}
                        className="rounded bg-[#16222F] border-[#233549] text-[#3BC0BB] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="autoRegenCheck" className="text-slate-300 text-[11px] cursor-pointer font-medium">
                        Automatically regenerate next task on completion
                      </label>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-[11px] text-[#3BC0BB] flex items-start gap-2">
                      <RotateCw className="w-4 h-4 text-[#3BC0BB] mt-0.5 shrink-0" />
                      <span>
                        <strong>Regeneration Schedule:</strong> Task automatically creates the next instance every {recurrenceInterval} {recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? `week(s) on ${recurrenceDaysOfWeek.join(', ')}` : `month(s) on day ${recurrenceDayOfMonth}`}.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Task Dependencies (Predecessors & Successors) Selection */}
              <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <GitCommit className="w-4 h-4 text-[#7B68EE]" />
                  <span>Task Dependencies (Predecessors & Successors)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Predecessors selector */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-medium mb-1">
                      Predecessors (Prerequisites)
                    </label>
                    <div className="max-h-28 overflow-y-auto p-2 bg-[#16222F] border border-[#233549] rounded-xl space-y-1">
                      {tasks.length === 0 ? (
                        <div className="text-[10px] text-slate-500 italic">No existing tasks</div>
                      ) : (
                        tasks.map((t) => {
                          const isSelected = selectedPredecessorIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setSelectedPredecessorIds((prev) =>
                                  prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                                );
                              }}
                              className={`w-full text-left p-1.5 rounded-lg text-[10px] truncate flex items-center justify-between gap-1 transition-all ${
                                isSelected
                                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D1520]'
                              }`}
                            >
                              <span className="truncate">{t.title}</span>
                              <span className="text-[9px] opacity-75 shrink-0">{t.status}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Successors selector */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-medium mb-1">
                      Successors (Tasks waiting on this)
                    </label>
                    <div className="max-h-28 overflow-y-auto p-2 bg-[#16222F] border border-[#233549] rounded-xl space-y-1">
                      {tasks.length === 0 ? (
                        <div className="text-[10px] text-slate-500 italic">No existing tasks</div>
                      ) : (
                        tasks.map((t) => {
                          const isSelected = selectedSuccessorIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setSelectedSuccessorIds((prev) =>
                                  prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                                );
                              }}
                              className={`w-full text-left p-1.5 rounded-lg text-[10px] truncate flex items-center justify-between gap-1 transition-all ${
                                isSelected
                                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D1520]'
                              }`}
                            >
                              <span className="truncate">{t.title}</span>
                              <span className="text-[9px] opacity-75 shrink-0">{t.status}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7B68EE] hover:bg-[#6853E0] text-white font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GEMINI AI SMART PRIORITY OPTIMIZATION MODAL */}
      {showSmartPriorityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-4xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-4 ${
              isLight ? 'border-slate-200' : 'border-[#233549]'
            }`}>
              <div className="flex items-center gap-3 font-bold">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] flex items-center justify-center text-white shadow-lg shadow-[#0773BB]/30">
                  <Sparkles className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <span>AI Smart Priority Task Reordering Engine</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                      @google/genai v3.6
                    </span>
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Evaluates project scope, business impact, critical path blockers, and upcoming deadlines to suggest optimal task prioritization.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSmartPriorityModal(false)}
                className={`p-1 rounded-lg ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-[#233549]'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope info & Filter bar */}
            <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3BC0BB]" />
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Active Scope:</span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {projects.find((p) => p.id === selectedProjectId)?.title || 'All Projects Scope'}
                </span>
              </div>

              {/* Filter mode switcher */}
              <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                isLight ? 'bg-white border-slate-300' : 'bg-[#16222F] border-[#233549]'
              }`}>
                <button
                  type="button"
                  onClick={() => handleOpenSmartPriorityModal(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    !filterUnassignedModal
                      ? 'bg-[#0773BB] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Tasks ({filteredTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSmartPriorityModal(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    filterUnassignedModal
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Unassigned Only ({unassignedTasks.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-[#3BC0BB]">
                <Clock className="w-3.5 h-3.5" />
                <span>Evaluating {priorityRecommendations.length || filteredTasks.length} Tasks</span>
              </div>
            </div>

            {/* Content Body */}
            {isAnalyzingPriority ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-[#3BC0BB] border-t-transparent animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#3BC0BB] animate-pulse" />
                    <span>Gemini AI Analyzing Deadlines & Effort Estimates...</span>
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Evaluating task due dates, estimated hours, critical path dependencies, and unassigned status to suggest optimal High/Medium/Low priority tags.
                  </p>
                </div>
              </div>
            ) : priorityRecommendations.length > 0 ? (
              <div className="space-y-4">
                {/* AI Rationale Summary Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#0773BB]/20 to-[#3BC0BB]/20 border border-[#3BC0BB]/40 text-slate-200 text-xs flex items-start gap-3 shadow-md">
                  <TrendingUp className="w-5 h-5 text-[#3BC0BB] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span>Gemini Smart Priority Analysis Complete</span>
                      {filterUnassignedModal && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                          Unassigned Focus Mode
                        </span>
                      )}
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Tasks analyzed using lightweight Gemini prompt evaluating deadline urgency against estimated effort (hours). Unassigned tasks are highlighted with recommended High/Medium/Low priority tags prior to team delegation.
                    </p>
                  </div>
                </div>

                {/* Recommendations Table */}
                <div className="overflow-x-auto border border-[#233549] rounded-xl bg-[#0D1520]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#16222F] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#233549] text-[10px]">
                      <tr>
                        <th className="p-3 pl-4">Suggested Rank</th>
                        <th className="p-3">Task Deliverable</th>
                        <th className="p-3 text-center font-mono">Assignee Status</th>
                        <th className="p-3 text-center">Suggested Priority Tag</th>
                        <th className="p-3">Risk & Effort Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#233549]">
                      {priorityRecommendations.map((rec, idx) => {
                        const originalTask = tasks.find((t) => t.id === rec.id);
                        const isUnassignedTask = originalTask && (!originalTask.assigneeIds || originalTask.assigneeIds.length === 0 || !originalTask.assigneeIds[0]);

                        return (
                          <tr key={rec.id || idx} className={`hover:bg-[#16222F]/60 transition-colors ${idx === 0 ? 'bg-[#0773BB]/10' : ''}`}>
                            <td className="p-3 pl-4 font-mono font-bold">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  idx === 0
                                    ? 'bg-amber-500 text-slate-900 shadow-md'
                                    : idx === 1
                                    ? 'bg-slate-300 text-slate-900'
                                    : idx === 2
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-[#233549] text-slate-300'
                                }`}>
                                  #{idx + 1}
                                </span>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="font-bold text-white text-xs">{rec.title}</div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>Due: {originalTask?.dueDate || 'Upcoming'}</span>
                                <span>•</span>
                                <span className="text-[#3BC0BB] font-bold">Est: {originalTask?.estimatedHours || 10}h</span>
                              </div>
                            </td>

                            <td className="p-3 text-center">
                              {isUnassignedTask ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Unassigned
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                                  Assigned
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  rec.suggestedPriority === 'Urgent'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : rec.suggestedPriority === 'High'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : rec.suggestedPriority === 'Medium'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}>
                                  {rec.suggestedPriority}
                                </span>
                                {originalTask && originalTask.priority !== rec.suggestedPriority && (
                                  <span className="text-[9px] text-slate-400 font-mono line-through">
                                    Was {originalTask.priority}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-3 text-slate-300 text-[11px] leading-relaxed max-w-sm">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>{rec.riskFactor || 'Tight Deadline / High Effort'}</span>
                                </span>
                                <p className="text-slate-300">{rec.reasoning}</p>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Master Action Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#233549]">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-[#3BC0BB]" />
                    <span>Applying will automatically update task priorities in TasksView.</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSmartPriorityModal(false)}
                      className="px-4 py-2 rounded-xl bg-[#233549] text-slate-300 hover:text-white font-bold text-xs"
                    >
                      Cancel
                    </button>
                    {unassignedTasks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleApplySmartPriorities(true)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 hover:brightness-110 transition-all border border-amber-400/40"
                      >
                        <Sparkles className="w-4 h-4 fill-current text-amber-200" />
                        <span>Tag Unassigned Tasks Only</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApplySmartPriorities(false)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-lg flex items-center gap-2 hover:brightness-110 transition-all"
                    >
                      <Sparkles className="w-4 h-4 fill-current" />
                      <span>Apply All AI Priorities ({priorityRecommendations.length} Tasks)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p>No tasks found in current scope for Smart Priority evaluation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV / Action Tracker Import Modal */}
      {showCsvImportModal && (
        <ProjectCsvImportModal onClose={() => setShowCsvImportModal(false)} />
      )}

      {/* Custom Fields Manager Modal */}
      <CustomFieldsManagerModal
        isOpen={showCustomFieldsModal}
        onClose={() => setShowCustomFieldsModal(false)}
      />
    </div>
  );
};
