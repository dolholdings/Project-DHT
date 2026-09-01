import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  CalendarCheck2,
  CalendarX2,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  User,
  FolderKanban,
  MessageSquare,
  Send,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  ListChecks,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, DueDateRequest, Priority } from '../../types';
import { TaskQuickPreviewPopover } from '../tasks/TaskQuickPreviewPopover';
import { UserAvatar } from '../common/UserAvatar';

export interface DueDateRequestsPanelProps {
  theme?: 'dark' | 'light';
  projectId?: string;
  onNavigateToTasks?: (taskId?: string) => void;
  compact?: boolean;
}

const DECLINE_PRESETS = [
  'Client milestone deadline cannot be shifted.',
  'Prerequisite downstream tasks depend on this target date.',
  'Please coordinate in daily standup before rescheduling.',
  'Overtime allocation approved instead of date extension.',
  'Requires client change order authorization.'
];

export const DueDateRequestsPanel: React.FC<DueDateRequestsPanelProps> = ({
  theme = 'dark',
  projectId,
  onNavigateToTasks,
  compact = false
}) => {
  const {
    tasks,
    projects,
    users,
    currentUser,
    approveDueDateChange,
    rejectDueDateChange,
    setActiveTab,
    activeCompany
  } = useApp();

  const isLight = theme === 'light';

  const [activeStatusTab, setActiveStatusTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>(projectId || 'all');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  // Review actions state per card
  const [activeReviewTaskId, setActiveReviewTaskId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Extract all tasks with due date requests
  const companyTasks = useMemo(() => {
    return tasks.filter((t) => !activeCompany?.id || t.companyId === activeCompany.id);
  }, [tasks, activeCompany?.id]);

  const tasksWithRequests = useMemo(() => {
    return companyTasks
      .filter((t) => t.dueDateRequest && t.dueDateRequest.id)
      .map((t) => ({
        task: t,
        request: t.dueDateRequest as DueDateRequest,
        project: projects.find((p) => p.id === t.projectId)
      }));
  }, [companyTasks, projects]);

  // Counts by status
  const pendingCount = useMemo(() => {
    return tasksWithRequests.filter((item) => item.request.status === 'pending').length;
  }, [tasksWithRequests]);

  const approvedCount = useMemo(() => {
    return tasksWithRequests.filter((item) => item.request.status === 'approved').length;
  }, [tasksWithRequests]);

  const rejectedCount = useMemo(() => {
    return tasksWithRequests.filter((item) => item.request.status === 'rejected').length;
  }, [tasksWithRequests]);

  const totalCount = tasksWithRequests.length;

  // Filtered list based on tab, project, and search
  const filteredItems = useMemo(() => {
    return tasksWithRequests.filter((item) => {
      // Status tab
      if (activeStatusTab !== 'all' && item.request.status !== activeStatusTab) {
        return false;
      }

      // Project filter
      if (selectedProjectFilter !== 'all' && item.task.projectId !== selectedProjectFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.task.title.toLowerCase().includes(q);
        const reqNameMatch = item.request.requestedByName?.toLowerCase().includes(q);
        const reasonMatch = item.request.reason?.toLowerCase().includes(q);
        const projectMatch = (item.project?.title || item.project?.code || '').toLowerCase().includes(q);
        return titleMatch || reqNameMatch || reasonMatch || projectMatch;
      }

      return true;
    }).sort((a, b) => {
      // Pending first, then by requestedAt desc
      if (a.request.status === 'pending' && b.request.status !== 'pending') return -1;
      if (b.request.status === 'pending' && a.request.status !== 'pending') return 1;
      return new Date(b.request.requestedAt).getTime() - new Date(a.request.requestedAt).getTime();
    });
  }, [tasksWithRequests, activeStatusTab, selectedProjectFilter, searchQuery]);

  // Calculate schedule shift days
  const getDaysDifference = (currentDateStr?: string, proposedDateStr?: string) => {
    if (!proposedDateStr) return 0;
    if (!currentDateStr) return 0;
    const current = new Date(currentDateStr).getTime();
    const proposed = new Date(proposedDateStr).getTime();
    const diffDays = Math.round((proposed - current) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper for priority badge colors
  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'Urgent':
        return isLight ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'High':
        return isLight ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Medium':
        return isLight ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Low':
      default:
        return isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  const handleQuickApprove = (taskId: string, taskTitle: string) => {
    approveDueDateChange(taskId, 'Approved by Project Manager.');
    setSuccessToast(`Approved due date extension for "${taskTitle}"`);
    setTimeout(() => setSuccessToast(null), 4000);
    setActiveReviewTaskId(null);
  };

  const handleConfirmReview = (taskId: string, taskTitle: string) => {
    if (reviewMode === 'approve') {
      approveDueDateChange(taskId, reviewComment.trim() || 'Approved by Project Manager.');
      setSuccessToast(`Approved schedule change for "${taskTitle}"`);
    } else if (reviewMode === 'reject') {
      rejectDueDateChange(taskId, reviewComment.trim() || 'Declined. Project schedule constraint must be maintained.');
      setSuccessToast(`Declined due date change for "${taskTitle}"`);
    }
    setTimeout(() => setSuccessToast(null), 4000);
    setActiveReviewTaskId(null);
    setReviewMode(null);
    setReviewComment('');
  };

  const handleBulkApprove = () => {
    if (selectedTaskIds.length === 0) return;
    selectedTaskIds.forEach((id) => {
      approveDueDateChange(id, 'Bulk approved by Project Manager.');
    });
    setSuccessToast(`Bulk approved ${selectedTaskIds.length} due date change requests.`);
    setSelectedTaskIds([]);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSelectAll = () => {
    const pendingIds = filteredItems
      .filter((i) => i.request.status === 'pending')
      .map((i) => i.task.id);
    if (selectedTaskIds.length === pendingIds.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(pendingIds);
    }
  };

  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleOpenTaskModal = (taskId: string) => {
    if (onNavigateToTasks) {
      onNavigateToTasks(taskId);
    } else {
      setActiveTab('tasks');
    }
  };

  return (
    <div
      id="due-date-requests-panel"
      className={`rounded-2xl border transition-all shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#121B26] border-[#233549] text-white'
      }`}
    >
      {/* Toast Banner */}
      {successToast && (
        <div
          id="due-date-request-toast"
          className="p-3 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center justify-between animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight ? 'border-slate-100 bg-slate-50/70' : 'border-[#233549] bg-[#0E1722]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
            isLight
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base">
                Due Date Change Requests
              </h3>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                  {pendingCount} Pending Review
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Team member schedule change submissions requiring Project Manager approval
            </p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold self-start md:self-auto overflow-x-auto max-w-full ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <button
            id="tab-requests-pending"
            onClick={() => setActiveStatusTab('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeStatusTab === 'pending'
                ? isLight
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pending</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeStatusTab === 'pending'
                ? 'bg-white/20 text-white'
                : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            id="tab-requests-approved"
            onClick={() => setActiveStatusTab('approved')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeStatusTab === 'approved'
                ? isLight
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Approved</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeStatusTab === 'approved'
                ? 'bg-white/20 text-white'
                : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
            }`}>
              {approvedCount}
            </span>
          </button>

          <button
            id="tab-requests-rejected"
            onClick={() => setActiveStatusTab('rejected')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeStatusTab === 'rejected'
                ? isLight
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Declined</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeStatusTab === 'rejected'
                ? 'bg-white/20 text-white'
                : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
            }`}>
              {rejectedCount}
            </span>
          </button>

          <button
            id="tab-requests-all"
            onClick={() => setActiveStatusTab('all')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeStatusTab === 'all'
                ? isLight
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-[#0773BB] text-white'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeStatusTab === 'all'
                ? 'bg-white/20 text-white'
                : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
            }`}>
              {totalCount}
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
        isLight ? 'border-slate-100 bg-white' : 'border-[#233549] bg-[#121B26]'
      }`}>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by task, requester, project, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-[#0773BB]'
                  : 'bg-[#0E1722] border-[#233549] text-white focus:border-[#3BC0BB]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Project dropdown filter */}
          {!projectId && (
            <div className="relative shrink-0">
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className={`py-1.5 px-3 rounded-xl border text-xs outline-none cursor-pointer pr-8 appearance-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-[#0E1722] border-[#233549] text-slate-300'
                }`}
              >
                <option value="all">All Projects & Spaces</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `[${p.code}] ` : ''}{p.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Batch action / count indicator */}
        {activeStatusTab === 'pending' && filteredItems.some((i) => i.request.status === 'pending') && (
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleSelectAll}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#16222F] hover:bg-[#233549] border-[#233549] text-slate-300'
              }`}
            >
              {selectedTaskIds.length === filteredItems.filter((i) => i.request.status === 'pending').length
                ? 'Deselect All'
                : 'Select All Pending'}
            </button>

            {selectedTaskIds.length > 0 && (
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Selected ({selectedTaskIds.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Requests List Container */}
      <div className="p-4 sm:p-5 space-y-4 max-h-[680px] overflow-y-auto pr-2">
        {filteredItems.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0E1722] border-[#233549] text-slate-400'
          }`}>
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {activeStatusTab === 'pending'
                  ? 'No Pending Due Date Requests'
                  : 'No Requests Found'}
              </h4>
              <p className="text-xs max-w-md mx-auto mt-1">
                {activeStatusTab === 'pending'
                  ? 'All team member due date extension submissions have been reviewed and resolved.'
                  : 'Try selecting a different filter tab or clearing your search keywords.'}
              </p>
            </div>
            {activeStatusTab !== 'all' && (
              <button
                onClick={() => setActiveStatusTab('all')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold mt-2 inline-flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#16222F] border-[#233549] text-slate-200 hover:bg-[#233549]'
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                <span>View All History ({totalCount})</span>
              </button>
            )}
          </div>
        ) : (
          filteredItems.map(({ task, request, project }) => {
            const shiftDays = getDaysDifference(request.currentDueDate || task.dueDate, request.proposedDueDate);
            const isSelected = selectedTaskIds.includes(task.id);
            const isReviewingThis = activeReviewTaskId === task.id;
            const requesterUser = users.find((u) => u.id === request.requestedBy);

            // Project deadline check
            const projectDeadline = project?.dueDate;
            const exceedsProjectDeadline = projectDeadline && request.proposedDueDate > projectDeadline;

            return (
              <div
                key={request.id || task.id}
                id={`due-date-req-card-${task.id}`}
                className={`rounded-2xl border transition-all text-xs overflow-hidden ${
                  request.status === 'pending'
                    ? isLight
                      ? 'bg-white border-amber-200 shadow-md hover:border-amber-400'
                      : 'bg-[#0E1722] border-amber-500/40 shadow-lg hover:border-amber-500/70'
                    : isLight
                      ? 'bg-slate-50/50 border-slate-200'
                      : 'bg-[#0D1520] border-[#233549] opacity-90'
                } ${isSelected ? (isLight ? 'ring-2 ring-[#0773BB]' : 'ring-2 ring-[#3BC0BB]') : ''}`}
              >
                {/* Top Row: Selection / Status / Priority / Project */}
                <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isLight ? 'border-slate-100 bg-slate-50/60' : 'border-[#1E2E40] bg-[#121B26]/80'
                }`}>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Checkbox for pending */}
                    {request.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTask(task.id)}
                        className="rounded border-slate-400 text-amber-500 focus:ring-amber-400 cursor-pointer w-4 h-4"
                      />
                    )}

                    {/* Status Pill */}
                    {request.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Awaiting PM Review</span>
                      </span>
                    )}
                    {request.status === 'approved' && (
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Approved</span>
                      </span>
                    )}
                    {request.status === 'rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>Declined</span>
                      </span>
                    )}

                    {/* Priority Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(task.priority)}`}>
                      {task.priority} Priority
                    </span>

                    {/* Project & List Badges */}
                    {project && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${
                        isLight
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-[#0773BB]/20 text-[#38BDF8] border-[#0773BB]/40'
                      }`}>
                        <FolderKanban className="w-2.5 h-2.5" />
                        <span>{project.code ? `${project.code} • ` : ''}{project.title}</span>
                      </span>
                    )}

                    {task.listName && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                        isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {task.listName}
                      </span>
                    )}
                  </div>

                  {/* Submission date */}
                  <div className={`text-[11px] flex items-center gap-1 shrink-0 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    <span>Submitted: {new Date(request.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Task Title & Action Link */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4
                        onClick={() => handleOpenTaskModal(task.id)}
                        className={`font-bold text-sm sm:text-base hover:underline cursor-pointer flex items-center gap-1.5 group ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        <span>{task.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      {task.description && (
                        <p className={`text-xs mt-1 line-clamp-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenTaskModal(task.id)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold shrink-0 transition-all flex items-center gap-1 ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          : 'bg-[#16222F] hover:bg-[#233549] border-[#233549] text-slate-300'
                      }`}
                    >
                      <span>Task Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Visual Date Shift Comparison Box */}
                  <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLight ? 'bg-amber-50/60 border-amber-200/80' : 'bg-[#16222F] border-[#233549]'
                  }`}>
                    <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
                      {/* Current Due Date */}
                      <div>
                        <div className={`text-[10px] uppercase font-bold tracking-wider ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          Current Due Date
                        </div>
                        <div className={`font-bold text-xs sm:text-sm font-mono mt-0.5 ${
                          isLight ? 'text-slate-700' : 'text-slate-300'
                        }`}>
                          {request.currentDueDate || task.dueDate ? (
                            new Date(request.currentDueDate || task.dueDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          ) : (
                            <span className="text-slate-400 italic">None Set</span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className={`p-1.5 rounded-full ${
                        isLight ? 'bg-amber-200/70 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        <ArrowRight className="w-4 h-4" />
                      </div>

                      {/* Proposed Due Date */}
                      <div>
                        <div className={`text-[10px] uppercase font-bold tracking-wider ${
                          isLight ? 'text-amber-800' : 'text-amber-400'
                        }`}>
                          Proposed New Date
                        </div>
                        <div className="font-bold text-xs sm:text-sm font-mono text-amber-500 dark:text-amber-300 mt-0.5 flex items-center gap-2">
                          <span>
                            {new Date(request.proposedDueDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Delta Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                        shiftDays > 0
                          ? isLight
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : isLight
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}>
                        {shiftDays > 0 ? `+${shiftDays} Days Extension` : shiftDays === 0 ? 'Same Day' : `${shiftDays} Days Earlier`}
                      </span>

                      {exceedsProjectDeadline && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1" title={`Project final target deadline is ${projectDeadline}`}>
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          <span>Approaches Project Target</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Requester Identity & Reason */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121B26] border-[#1E2E40]'
                  }`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={request.requestedByName}
                          email={requesterUser?.email}
                          role={request.requestedByRole || requesterUser?.role}
                          size="xs"
                          theme={theme}
                        />
                        <div>
                          <span className="font-bold text-xs">{request.requestedByName}</span>
                          <span className={`text-[10px] ml-1.5 px-1.5 py-0.2 rounded border font-semibold ${
                            isLight ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-[#16222F] text-slate-300 border-[#233549]'
                          }`}>
                            {request.requestedByRole || 'Team Member'}
                          </span>
                        </div>
                      </div>

                      <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Reason text */}
                    <div className="flex items-start gap-2 pt-1">
                      <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        isLight ? 'text-amber-600' : 'text-amber-400'
                      }`} />
                      <div className={`text-xs italic leading-relaxed ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}>
                        "{request.reason || 'No detailed reason provided.'}"
                      </div>
                    </div>
                  </div>

                  {/* Review Audit History (If Approved or Rejected) */}
                  {request.status !== 'pending' && (
                    <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                      request.status === 'approved'
                        ? isLight
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : isLight
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}>
                      {request.status === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold">
                          {request.status === 'approved' ? 'Approved by' : 'Declined by'}{' '}
                          {request.reviewedByName || 'Project Manager'}
                          {request.reviewedAt && (
                            <span className="font-normal opacity-80 text-[11px] ml-1.5">
                              on {new Date(request.reviewedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                              {new Date(request.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        {request.reviewComment && (
                          <div className="text-[11px] mt-0.5 opacity-90">
                            Notes: "{request.reviewComment}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Inline PM Action Bar for Pending Requests */}
                  {request.status === 'pending' && (
                    <div className="pt-2 border-t border-[#1E2E40]/60 space-y-3">
                      {!isReviewingThis ? (
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Project Manager Decision:
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Decline Button */}
                            <button
                              id={`btn-decline-req-${task.id}`}
                              onClick={() => {
                                setActiveReviewTaskId(task.id);
                                setReviewMode('reject');
                                setReviewComment('');
                              }}
                              className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 ${
                                isLight
                                  ? 'bg-white hover:bg-rose-50 border-rose-300 text-rose-700'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>

                            {/* Approve with Notes */}
                            <button
                              id={`btn-approve-note-req-${task.id}`}
                              onClick={() => {
                                setActiveReviewTaskId(task.id);
                                setReviewMode('approve');
                                setReviewComment('Approved. Schedule updated.');
                              }}
                              className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 ${
                                isLight
                                  ? 'bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-700'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Approve with Note</span>
                            </button>

                            {/* 1-Click Instant Approve */}
                            <button
                              id={`btn-quick-approve-req-${task.id}`}
                              onClick={() => handleQuickApprove(task.id, task.title)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Set Date</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Expanded Review Form (Approve or Decline with comments) */
                        <div className={`p-4 rounded-xl border space-y-3 animate-in fade-in ${
                          reviewMode === 'approve'
                            ? isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'
                            : isLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-500/10 border-rose-500/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <h5 className={`font-bold text-xs flex items-center gap-1.5 ${
                              reviewMode === 'approve' ? 'text-emerald-500 dark:text-emerald-300' : 'text-rose-500 dark:text-rose-300'
                            }`}>
                              {reviewMode === 'approve' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Approve Schedule Extension to {request.proposedDueDate}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  <span>Decline Schedule Extension Request</span>
                                </>
                              )}
                            </h5>

                            <button
                              onClick={() => {
                                setActiveReviewTaskId(null);
                                setReviewMode(null);
                              }}
                              className="text-slate-400 hover:text-slate-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Preset suggestions for Decline */}
                          {reviewMode === 'reject' && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Quick Decline Reasons:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {DECLINE_PRESETS.map((preset, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setReviewComment(preset)}
                                    className={`text-[10px] px-2 py-1 rounded-lg border transition-all text-left ${
                                      reviewComment === preset
                                        ? 'bg-rose-500 text-white border-rose-600'
                                        : isLight
                                          ? 'bg-white hover:bg-rose-100 border-rose-200 text-rose-800'
                                          : 'bg-[#16222F] hover:bg-[#233549] border-[#233549] text-slate-300'
                                    }`}
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Custom notes input */}
                          <div>
                            <textarea
                              rows={2}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder={
                                reviewMode === 'approve'
                                  ? 'Add optional review note for the team member...'
                                  : 'Provide specific reason why extension cannot be granted...'
                              }
                              className={`w-full p-2.5 rounded-xl border text-xs outline-none transition-all resize-none ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-800 focus:border-[#0773BB]'
                                  : 'bg-[#0E1722] border-[#233549] text-white focus:border-[#3BC0BB]'
                              }`}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReviewTaskId(null);
                                setReviewMode(null);
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                                isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#16222F] border-[#233549] text-slate-300'
                              }`}
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={() => handleConfirmReview(task.id, task.title)}
                              className={`px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-1.5 ${
                                reviewMode === 'approve'
                                  ? 'bg-emerald-600 hover:bg-emerald-500'
                                  : 'bg-rose-600 hover:bg-rose-500'
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{reviewMode === 'approve' ? 'Confirm Approval' : 'Confirm Decline'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Strip */}
      <div className={`p-3.5 border-t flex items-center justify-between text-xs ${
        isLight ? 'border-slate-100 bg-slate-50/50 text-slate-500' : 'border-[#233549] bg-[#0E1722] text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Approving immediately shifts task deadline and notifies requester via in-app & email.</span>
        </div>

        <div className="font-mono text-[11px] font-semibold">
          Showing {filteredItems.length} of {totalCount} total submissions
        </div>
      </div>
    </div>
  );
};
