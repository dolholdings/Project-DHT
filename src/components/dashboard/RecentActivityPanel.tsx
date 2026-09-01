import React, { useState, useMemo } from 'react';
import {
  Activity,
  MessageSquare,
  CheckCircle2,
  FileText,
  RefreshCw,
  Plus,
  Clock,
  Filter,
  Search,
  Sparkles,
  ArrowRight,
  User,
  Zap,
  FolderKanban,
  Check,
  Send,
  Radio,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityLog, TaskComment } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

export interface UnifiedActivityItem {
  id: string;
  type: 'status' | 'comment' | 'task_action' | 'document' | 'other';
  userId: string;
  userName: string;
  userAvatar: string;
  actionText: string;
  targetTitle: string;
  timestamp: string;
  projectId?: string;
  taskId?: string;
  details?: string;
  commentContent?: string;
  oldStatus?: string;
  newStatus?: string;
}

export const RecentActivityPanel: React.FC = () => {
  const {
    activityLogs,
    taskComments,
    tasks,
    projects,
    users,
    currentUser,
    logActivity,
    addTaskComment,
    updateTask,
    setActiveTab,
    setSelectedProjectId,
    theme
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'status' | 'comment' | 'task_action' | 'document'>('all');
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [quickCommentText, setQuickCommentText] = useState<string>('');
  const [quickCommentTaskId, setQuickCommentTaskId] = useState<string>(tasks[0]?.id || '');

  // Convert activityLogs and taskComments into unified timeline items
  const unifiedActivities = useMemo(() => {
    const items: UnifiedActivityItem[] = [];

    // 1. Process activityLogs
    activityLogs.forEach((log) => {
      let type: UnifiedActivityItem['type'] = 'other';
      const actionLower = log.action.toLowerCase();

      if (actionLower.includes('status') || actionLower.includes('moved')) {
        type = 'status';
      } else if (log.type === 'document' || actionLower.includes('document') || actionLower.includes('file')) {
        type = 'document';
      } else if (log.type === 'task' || actionLower.includes('task') || actionLower.includes('created') || actionLower.includes('completed')) {
        type = 'task_action';
      } else if (actionLower.includes('comment')) {
        type = 'comment';
      }

      // Extract old & new status if present in action or target or details
      let oldStatus: string | undefined;
      let newStatus: string | undefined;
      if (type === 'status') {
        const match = log.target.match(/(?:from\s+)?([A-Za-z\s]+)\s*➔\s*([A-Za-z\s]+)/) ||
                      log.action.match(/(?:to\s+)([A-Za-z\s]+)/);
        if (match) {
          if (match[2]) {
            oldStatus = match[1]?.trim();
            newStatus = match[2]?.trim();
          } else if (match[1]) {
            newStatus = match[1]?.trim();
          }
        }
      }

      items.push({
        id: `log-${log.id}`,
        type,
        userId: log.userId,
        userName: log.userName || 'Team Member',
        userAvatar: log.userAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        actionText: log.action,
        targetTitle: log.target,
        timestamp: log.timestamp,
        projectId: log.projectId,
        taskId: log.taskId,
        details: log.details,
        oldStatus,
        newStatus
      });
    });

    // 2. Process taskComments
    taskComments.forEach((cmt) => {
      const parentTask = tasks.find((t) => t.id === cmt.taskId);
      const targetTitle = parentTask ? parentTask.title : 'Task Discussion';

      items.push({
        id: `cmt-${cmt.id}`,
        type: 'comment',
        userId: cmt.userId,
        userName: cmt.userName || 'Team Member',
        userAvatar: cmt.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        actionText: 'commented on',
        targetTitle,
        timestamp: cmt.createdAt,
        taskId: cmt.taskId,
        projectId: parentTask?.projectId,
        commentContent: cmt.content
      });
    });

    // Sort descending by timestamp
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activityLogs, taskComments, tasks]);

  // Filtered timeline items
  const filteredActivities = useMemo(() => {
    return unifiedActivities.filter((item) => {
      if (activeFilter !== 'all' && item.type !== activeFilter) return false;
      if (selectedProjectIdFilter !== 'all' && item.projectId !== selectedProjectIdFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUser = item.userName.toLowerCase().includes(q);
        const matchAction = item.actionText.toLowerCase().includes(q);
        const matchTarget = item.targetTitle.toLowerCase().includes(q);
        const matchComment = item.commentContent?.toLowerCase().includes(q) || false;
        const matchDetails = item.details?.toLowerCase().includes(q) || false;
        if (!matchUser && !matchAction && !matchTarget && !matchComment && !matchDetails) return false;
      }

      return true;
    });
  }, [unifiedActivities, activeFilter, selectedProjectIdFilter, searchQuery]);

  // Relative timestamp calculation
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (isNaN(diffSecs) || diffSecs < 0) return 'Just now';
      if (diffSecs < 45) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Quick action: Add quick comment right from panel
  const handlePostQuickComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCommentText.trim() || !quickCommentTaskId) return;

    addTaskComment(quickCommentTaskId, quickCommentText.trim());
    setQuickCommentText('');
  };

  // Quick action: Simulate team activity
  const handleSimulateTeamAction = (actionType: 'status' | 'comment' | 'task_action') => {
    const randomUser = users[Math.floor(Math.random() * users.length)] || currentUser;
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)] || tasks[0];
    const taskTitle = randomTask ? randomTask.title : 'Project Deliverable';
    const projId = randomTask ? randomTask.projectId : projects[0]?.id;

    if (actionType === 'status') {
      const statuses = ['To Do', 'In Progress', 'In Review', 'Done'];
      const fromS = statuses[Math.floor(Math.random() * 2)];
      const toS = statuses[Math.floor(Math.random() * 2) + 2];

      logActivity(
        'changed task status',
        `Updated "${taskTitle}" status from ${fromS} ➔ ${toS}`,
        'task',
        projId,
        randomTask?.id,
        `Workflow status updated by ${randomUser.name}`,
        'info'
      );
    } else if (actionType === 'comment') {
      const sampleComments = [
        'Reviewed technical design spec - looks solid for deployment.',
        'Please verify pressure testing calculations before signoff.',
        'Pushed updated wireframes to shared Drive folder.',
        'Subcontractor safety signoff completed for this deliverable.'
      ];
      const commentText = sampleComments[Math.floor(Math.random() * sampleComments.length)];
      if (randomTask) {
        addTaskComment(randomTask.id, commentText);
      }
    } else {
      logActivity(
        'completed task',
        `Completed "${taskTitle}"`,
        'task',
        projId,
        randomTask?.id,
        `Verified and marked Done by ${randomUser.name}`,
        'info'
      );
    }
  };

  const isLight = theme === 'light';

  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-xl transition-all font-sans ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#16222F] border-[#233549] text-slate-100'
      }`}
    >
      {/* HEADER BAR */}
      <div
        className={`p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520]/80 border-[#233549]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#0773BB]/10 text-[#3BC0BB] border border-[#3BC0BB]/30 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Recent Team Activity
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                REAL-TIME FEED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live timeline of team status updates, comments, and project milestones.
            </p>
          </div>
        </div>

        {/* SIMULATE & CONTROL ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#0D1520] border border-[#233549] rounded-xl p-1 gap-1">
            <span className="text-[10px] font-mono text-slate-400 px-2 font-bold uppercase">
              Simulate Activity:
            </span>
            <button
              onClick={() => handleSimulateTeamAction('status')}
              className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-mono font-bold border border-amber-500/30 transition-all"
              title="Simulate task status transition"
            >
              +Status
            </button>
            <button
              onClick={() => handleSimulateTeamAction('comment')}
              className="px-2 py-1 rounded bg-[#0773BB]/20 text-[#3BC0BB] hover:bg-[#0773BB]/30 text-[10px] font-mono font-bold border border-[#0773BB]/40 transition-all"
              title="Simulate team comment"
            >
              +Comment
            </button>
            <button
              onClick={() => handleSimulateTeamAction('task_action')}
              className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-mono font-bold border border-emerald-500/30 transition-all"
              title="Simulate task completion"
            >
              +Done
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div
        className={`p-4 border-b flex flex-col md:flex-row items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-100' : 'bg-[#16222F]/60 border-[#233549]'
        }`}
      >
        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-[#0773BB] text-white shadow-md'
                : isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
            }`}
          >
            All ({unifiedActivities.length})
          </button>
          <button
            onClick={() => setActiveFilter('status')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'status'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-md'
                : isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Status Changes</span>
          </button>
          <button
            onClick={() => setActiveFilter('comment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'comment'
                ? 'bg-[#0773BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 shadow-md'
                : isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Comments</span>
          </button>
          <button
            onClick={() => setActiveFilter('task_action')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'task_action'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-md'
                : isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Task Actions</span>
          </button>
          <button
            onClick={() => setActiveFilter('document')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'document'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md'
                : isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Docs</span>
          </button>
        </div>

        {/* Project Selector & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedProjectIdFilter}
            onChange={(e) => setSelectedProjectIdFilter(e.target.value)}
            className={`rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none border ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-[#0D1520] border-[#233549] text-slate-200 focus:border-[#3BC0BB]'
            }`}
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.title.slice(0, 20)}...
              </option>
            ))}
          </select>

          <div className="relative flex-1 md:w-44">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity..."
              className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none border ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400'
                  : 'bg-[#0D1520] border-[#233549] text-slate-200 placeholder-slate-500 focus:border-[#3BC0BB]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TIMELINE VIEW CONTAINER */}
      <div className="p-5 max-h-[560px] overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div
            className={`p-10 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 ${
              isLight ? 'border-slate-300 bg-slate-50' : 'border-[#233549] bg-[#0D1520]/40'
            }`}
          >
            <Activity className="w-8 h-8 text-slate-500 animate-pulse" />
            <p className="text-xs font-mono text-slate-400">No activity items match your filter criteria.</p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setSelectedProjectIdFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0773BB] text-white text-xs font-bold font-mono hover:bg-[#0773BB]/80 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[#0773BB] before:via-slate-600/40 before:to-transparent">
            {filteredActivities.map((item) => {
              const project = projects.find((p) => p.id === item.projectId);
              const isExpanded = expandedItemId === item.id;

              return (
                <div key={item.id} className="relative group">
                  {/* TIMELINE NODE ICON */}
                  <div
                    className={`absolute -left-6 top-1.5 -translate-x-1/2 w-6 h-6 rounded-full border flex items-center justify-center shadow-md transition-all ${
                      item.type === 'status'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : item.type === 'comment'
                        ? 'bg-[#0773BB]/20 border-[#3BC0BB] text-[#3BC0BB]'
                        : item.type === 'task_action'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : item.type === 'document'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-700 border-slate-500 text-slate-300'
                    }`}
                  >
                    {item.type === 'status' && <RefreshCw className="w-3 h-3" />}
                    {item.type === 'comment' && <MessageSquare className="w-3 h-3" />}
                    {item.type === 'task_action' && <CheckCircle2 className="w-3 h-3" />}
                    {item.type === 'document' && <FileText className="w-3 h-3" />}
                    {item.type === 'other' && <Zap className="w-3 h-3" />}
                  </div>

                  {/* TIMELINE CONTENT CARD */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isLight
                        ? 'bg-slate-50/90 border-slate-200 hover:border-[#0773BB]/50 hover:bg-white shadow-sm'
                        : 'bg-[#0D1520]/80 border-[#233549] hover:border-[#3BC0BB]/50 hover:bg-[#16222F]/90 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* User Avatar */}
                        <div className="shrink-0 mt-0.5">
                          <UserAvatar
                            name={item.userName}
                            size="sm"
                            theme={theme}
                          />
                        </div>

                        <div className="space-y-1 min-w-0">
                          {/* User & Action Header */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.userName}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-normal">
                              {item.actionText}
                            </span>

                            {/* Project Badge */}
                            {project && (
                              <button
                                onClick={() => {
                                  setSelectedProjectId(project.id);
                                  setActiveTab('projects');
                                }}
                                className="px-2 py-0.5 rounded bg-[#0773BB]/10 text-[#3BC0BB] border border-[#3BC0BB]/30 text-[10px] font-mono font-bold hover:bg-[#0773BB]/30 transition-all inline-flex items-center gap-1"
                              >
                                <FolderKanban className="w-2.5 h-2.5" />
                                <span>[{project.code}]</span>
                              </button>
                            )}
                          </div>

                          {/* Target Headline / Task Title */}
                          <div
                            onClick={() => {
                              if (item.taskId) {
                                if (item.projectId) setSelectedProjectId(item.projectId);
                                setActiveTab('tasks');
                              }
                            }}
                            className={`text-xs font-bold cursor-pointer transition-colors ${
                              item.taskId
                                ? 'text-[#0773BB] dark:text-[#3BC0BB] hover:underline'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {item.targetTitle}
                          </div>

                          {/* Status Transition Badge */}
                          {item.type === 'status' && item.newStatus && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold mt-1">
                              {item.oldStatus && (
                                <>
                                  <span className="line-through text-slate-400">{item.oldStatus}</span>
                                  <ArrowRight className="w-3 h-3 text-amber-400" />
                                </>
                              )}
                              <span>{item.newStatus}</span>
                            </div>
                          )}

                          {/* Comment Content Preview */}
                          {item.type === 'comment' && item.commentContent && (
                            <div
                              className={`p-2.5 rounded-lg border text-xs font-sans italic mt-1.5 ${
                                isLight
                                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                                  : 'bg-[#16222F] border-[#233549] text-slate-300'
                              }`}
                            >
                              "{item.commentContent}"
                            </div>
                          )}

                          {/* Additional details snippet */}
                          {item.details && item.type !== 'comment' && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 font-mono">
                              {item.details}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Timestamp & Expand toggle */}
                      <div className="flex flex-col items-end gap-1 shrink-0 font-mono text-[10px]">
                        <span
                          className="text-slate-400 flex items-center gap-1"
                          title={new Date(item.timestamp).toLocaleString()}
                        >
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatTimeAgo(item.timestamp)}
                        </span>

                        <button
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="p-1 text-slate-500 hover:text-slate-200 rounded hover:bg-slate-700/30 transition-all"
                          title="Toggle details"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS */}
                    {isExpanded && (
                      <div
                        className={`mt-3 pt-3 border-t text-xs font-mono space-y-2 animate-in fade-in ${
                          isLight ? 'border-slate-200' : 'border-[#233549]'
                        }`}
                      >
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>TIMELINE ID: {item.id}</span>
                          <span>{new Date(item.timestamp).toISOString()}</span>
                        </div>
                        {item.taskId && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Task Reference:</span>
                            <button
                              onClick={() => {
                                if (item.projectId) setSelectedProjectId(item.projectId);
                                setActiveTab('tasks');
                              }}
                              className="px-2 py-0.5 rounded bg-[#0773BB] text-white text-[10px] font-bold flex items-center gap-1 hover:bg-[#0773BB]/80 transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Task Details</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK COMMENT / QUICK POST BAR */}
      <div
        className={`p-4 border-t ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}
      >
        <form onSubmit={handlePostQuickComment} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-mono font-bold text-slate-400 whitespace-nowrap">
              Quick Comment:
            </span>
            <select
              value={quickCommentTaskId}
              onChange={(e) => setQuickCommentTaskId(e.target.value)}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-mono border max-w-[160px] truncate ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-[#16222F] border-[#233549] text-slate-200 focus:border-[#3BC0BB]'
              }`}
            >
              {tasks.slice(0, 10).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={quickCommentText}
              onChange={(e) => setQuickCommentText(e.target.value)}
              placeholder="Post a comment to recent activity timeline..."
              className={`w-full rounded-xl pl-3 pr-10 py-1.5 text-xs focus:outline-none border ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                  : 'bg-[#16222F] border-[#233549] text-slate-100 placeholder-slate-500 focus:border-[#3BC0BB]'
              }`}
            />
            <button
              type="submit"
              disabled={!quickCommentText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-[#0773BB] hover:bg-[#0773BB]/80 text-white disabled:opacity-40 transition-all"
              title="Post Comment"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
