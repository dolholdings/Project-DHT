import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  X,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Briefcase,
  Layers,
  ArrowRight,
  Download,
  Trash2,
  Radio,
  Flame,
  Zap,
  ShieldAlert,
  FileText,
  Bot,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityLog, Priority, TaskStatus } from '../../types';

export interface ActivityLogDrawerProps {
  onClose: () => void;
}

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({ onClose }) => {
  const {
    activityLogs,
    projects,
    tasks,
    users,
    theme,
    setActiveTab,
    setSelectedProjectId,
    logActivity,
    clearActivityLogs
  } = useApp();

  const isLight = theme === 'light';

  // Local state for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectIdFilter] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(true);
  const [newLogPings, setNewLogPings] = useState<Set<string>>(new Set());

  // Track initial count to highlight new real-time logs
  useEffect(() => {
    if (activityLogs.length > 0) {
      const newestId = activityLogs[0].id;
      setNewLogPings((prev) => new Set(prev).add(newestId));
      const timer = setTimeout(() => {
        setNewLogPings((prev) => {
          const next = new Set(prev);
          next.delete(newestId);
          return next;
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activityLogs]);

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'task' && log.type !== 'task') return false;
        if (selectedCategory === 'project' && log.type !== 'project') return false;
        if (selectedCategory === 'user' && !['user', 'auth', 'permission'].includes(log.type)) return false;
        if (selectedCategory === 'automation' && !['automation', 'ai', 'system'].includes(log.type)) return false;
      }

      // Project filter
      if (selectedProjectId !== 'all' && log.projectId !== selectedProjectId) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesUserName = log.userName?.toLowerCase().includes(query);
        const matchesAction = log.action?.toLowerCase().includes(query);
        const matchesTarget = log.target?.toLowerCase().includes(query);
        const matchesDetails = log.details?.toLowerCase().includes(query);
        return matchesUserName || matchesAction || matchesTarget || matchesDetails;
      }

      return true;
    });
  }, [activityLogs, selectedCategory, selectedProjectId, selectedSeverity, searchQuery]);

  // Helper: Format relative timestamp
  const getRelativeTime = (isoString: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Helper: Parse status transitions like "To Do -> In Progress" or "In Progress to Done"
  const parseStatusTransition = (log: ActivityLog) => {
    const text = `${log.action} ${log.target} ${log.details || ''}`;
    const statusRegex = /(Backlog|To Do|In Progress|In Review|Done)\s*(?:->|to|➔)\s*(Backlog|To Do|In Progress|In Review|Done)/i;
    const match = text.match(statusRegex);

    if (match) {
      return {
        fromStatus: match[1],
        toStatus: match[2]
      };
    }
    return null;
  };

  // Helper: Export Activity Logs as CSV file
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp', 'User', 'Type', 'Action', 'Target', 'Severity', 'Project ID', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.type}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.target.replace(/"/g, '""')}"`,
      `"${l.severity || 'info'}"`,
      `"${l.projectId || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dolphin_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Navigate to task or project when clicking log card
  const handleNavigateFromLog = (log: ActivityLog) => {
    if (log.projectId) {
      const projExists = projects.some((p) => p.id === log.projectId);
      if (projExists) {
        setSelectedProjectId(log.projectId);
        setActiveTab('tasks');
        onClose();
      }
    }
  };

  // Get type icon
  const getTypeIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-[#3BC0BB]" />;
      case 'project':
        return <Briefcase className="w-4 h-4 text-sky-400" />;
      case 'user':
      case 'auth':
      case 'permission':
        return <UserIcon className="w-4 h-4 text-indigo-400" />;
      case 'automation':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-emerald-400" />;
    }
  };

  // Get status color chip
  const getStatusBadgeClass = (statusStr: string) => {
    const clean = statusStr.trim();
    if (clean === 'Done' || clean === 'Completed') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (clean === 'In Progress') return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    if (clean === 'In Review') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (clean === 'To Do' || clean === 'Backlog') return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className={`w-full max-w-lg sm:max-w-xl h-full p-6 shadow-2xl flex flex-col justify-between border-l backdrop-blur-xl ${
          isLight
            ? 'bg-white/95 border-slate-300 text-slate-800'
            : 'bg-[#16222F]/95 border-[#233549] text-white'
        }`}
      >
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* HEADER BAR */}
          <div className="flex items-center justify-between border-b border-[#233549] pb-4">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 rounded-xl bg-gradient-to-tr from-[#0773BB]/30 to-[#3BC0BB]/20 border border-[#3BC0BB]/40 text-[#3BC0BB]">
                <Activity className="w-5 h-5" />
                {isLiveFeedActive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide">Real-Time Activity Stream</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40">
                    {filteredLogs.length} Events
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Live project updates, task transitions & team audit trail
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Live Feed Toggle */}
              <button
                type="button"
                onClick={() => setIsLiveFeedActive(!isLiveFeedActive)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  isLiveFeedActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title={isLiveFeedActive ? 'Live activity monitoring is active' : 'Click to enable live stream monitoring'}
              >
                <Radio className={`w-3.5 h-3.5 ${isLiveFeedActive ? 'animate-pulse text-emerald-400' : ''}`} />
                <span className="hidden sm:inline">{isLiveFeedActive ? 'Live' : 'Paused'}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#233549] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SEARCH & PROJECT FILTER BAR */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by user, task, action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0D1520] border border-[#233549] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3BC0BB]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Project Filter Selector */}
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectIdFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#0D1520] border border-[#233549] text-xs text-slate-200 focus:outline-none focus:border-[#3BC0BB] cursor-pointer"
              >
                <option value="all">All Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title.substring(0, 22)}...
                  </option>
                ))}
              </select>
            </div>

            {/* CATEGORY FILTER PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#3BC0BB] text-[#020712] shadow'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                All Events
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('task')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedCategory === 'task'
                    ? 'bg-[#3BC0BB] text-[#020712] shadow'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                <CheckSquare className="w-3 h-3" />
                Task Transitions
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('project')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedCategory === 'project'
                    ? 'bg-[#3BC0BB] text-[#020712] shadow'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                <Briefcase className="w-3 h-3" />
                Project Updates
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('user')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedCategory === 'user'
                    ? 'bg-[#3BC0BB] text-[#020712] shadow'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                <UserIcon className="w-3 h-3" />
                Team Actions
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('automation')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedCategory === 'automation'
                    ? 'bg-[#3BC0BB] text-[#020712] shadow'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                <Zap className="w-3 h-3" />
                Automations & System
              </button>
            </div>
          </div>

          {/* ACTIVITY STREAM LIST CONTAINER */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const project = projects.find((p) => p.id === log.projectId);
                const task = tasks.find((t) => t.id === log.taskId);
                const isPingNew = newLogPings.has(log.id);
                const transition = parseStatusTransition(log);

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleNavigateFromLog(log)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isPingNew
                        ? 'bg-[#3BC0BB]/10 border-[#3BC0BB] ring-1 ring-[#3BC0BB]/50'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-[#0773BB] hover:shadow-md'
                        : 'bg-[#0D1520] border-[#233549] hover:border-[#3BC0BB] hover:bg-[#121D2B]'
                    }`}
                  >
                    {/* Top Row: User Avatar, Name, Timestamp & Type Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={log.userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                          alt={log.userName}
                          className="w-7 h-7 rounded-full object-cover border border-[#3BC0BB]/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white truncate">
                              {log.userName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              • {getRelativeTime(log.timestamp)}
                            </span>
                          </div>
                          {project && (
                            <span className="text-[10px] text-[#3BC0BB] font-mono flex items-center gap-1">
                              <span>[{project.code}]</span>
                              <span className="truncate max-w-[120px]">{project.title}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Type Pill */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="p-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                          {getTypeIcon(log.type)}
                        </span>
                        {log.severity && log.severity !== 'info' && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              log.severity === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {log.severity.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action & Target Description */}
                    <div className="text-xs text-slate-200 leading-relaxed font-medium">
                      <span className="text-[#3BC0BB] font-bold capitalize">{log.action}: </span>
                      <span className="text-white font-bold">"{log.target}"</span>
                    </div>

                    {/* Status Transition Visualizer Badge (e.g. To Do -> In Progress) */}
                    {transition && (
                      <div className="mt-2 pt-2 border-t border-[#233549]/60 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">Status Transition:</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(transition.fromStatus)}`}>
                          {transition.fromStatus}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(transition.toStatus)}`}>
                          {transition.toStatus}
                        </span>
                      </div>
                    )}

                    {/* Additional Details snippet if provided */}
                    {log.details && !transition && (
                      <div className="mt-2 pt-1.5 border-t border-[#233549]/40 text-[11px] text-slate-400 italic line-clamp-2">
                        {log.details}
                      </div>
                    )}

                    {/* Click-to-open indicator on hover */}
                    <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[#3BC0BB]">
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              /* EMPTY STATE */
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#0D1520]/60 rounded-2xl border border-[#233549]">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-400 mb-3">
                  <Activity className="w-8 h-8 text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">No Activity Logs Found</h4>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  No matching team updates or task transitions found for the selected filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedProjectIdFilter('all');
                    setSelectedSeverity('all');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#3BC0BB] text-[#020712] font-bold text-xs hover:bg-[#32a8a4] transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-4 pt-3 border-t border-[#233549] flex items-center justify-between">
          <button
            type="button"
            onClick={clearActivityLogs}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Clear saved activity log history"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear Logs</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="px-4 py-1.5 rounded-xl bg-[#0773BB] hover:bg-[#06619e] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            title="Download activity log report as CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
