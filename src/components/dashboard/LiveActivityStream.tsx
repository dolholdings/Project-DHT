import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  FileText,
  RefreshCw,
  Zap,
  ShieldCheck,
  Search,
  Filter,
  Play,
  Pause,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileUp,
  UserCheck,
  Building2,
  Terminal,
  Radio,
  SlidersHorizontal,
  FolderKanban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityLog } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

export const LiveActivityStream: React.FC = () => {
  const {
    activityLogs,
    projects,
    tasks,
    users,
    currentUser,
    logActivity,
    setActiveTab,
    setSelectedProjectId,
    setIsActivityDrawerOpen,
    theme
  } = useApp();

  // Component state
  const [filterCategory, setFilterCategory] = useState<'all' | 'completion' | 'document' | 'status' | 'system'>('all');
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveAutoStreaming, setIsLiveAutoStreaming] = useState<boolean>(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Monitor real-time incoming activity logs to flash visual pulse on newest entry
  useEffect(() => {
    if (!isLiveAutoStreaming || activityLogs.length === 0) return;
    const topId = activityLogs[0]?.id;
    if (topId) {
      setHighlightedId(topId);
      const timer = setTimeout(() => setHighlightedId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [activityLogs, isLiveAutoStreaming]);

  // Helper to categorize log item
  const getCategory = (log: ActivityLog): 'completion' | 'document' | 'status' | 'system' => {
    const act = log.action.toLowerCase();
    const type = log.type;

    if (type === 'document' || act.includes('document') || act.includes('file') || act.includes('upload')) {
      return 'document';
    }
    if (act.includes('completed') || act.includes('done') || act.includes('finish')) {
      return 'completion';
    }
    if (act.includes('status') || act.includes('moved') || act.includes('changed status')) {
      return 'status';
    }
    return 'system';
  };

  // Filter activity logs
  const filteredLogs = activityLogs.filter((log) => {
    const cat = getCategory(log);

    if (filterCategory !== 'all' && cat !== filterCategory) return false;
    if (selectedProjectIdFilter !== 'all' && log.projectId !== selectedProjectIdFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = log.userName.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchTarget = log.target.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q) || false;
      if (!matchName && !matchAction && !matchTarget && !matchDetails) return false;
    }

    return true;
  });

  // Calculate quick metrics for tech HUD header
  const totalCompletions = activityLogs.filter((l) => getCategory(l) === 'completion').length;
  const totalUploads = activityLogs.filter((l) => getCategory(l) === 'document').length;
  const totalStatusChanges = activityLogs.filter((l) => getCategory(l) === 'status').length;

  // Format relative timestamp
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 45) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return `${Math.floor(diffSecs / 86400)}d ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="bg-[#0D1520] border border-[#233549] rounded-2xl overflow-hidden shadow-2xl space-y-0 text-slate-100 font-sans">
      {/* TECH-DARK HUD HEADER */}
      <div className="bg-[#16222F] border-b border-[#233549] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-[#3BC0BB]/10 text-[#3BC0BB] border border-[#3BC0BB]/30">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wide text-white uppercase font-mono">
                Live Activity Telemetry Stream
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isLiveAutoStreaming ? 'STREAMING ACTIVE' : 'STREAM PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time audit log of task completions, document uploads & workflow status transitions.
            </p>
          </div>
        </div>

        {/* Live Stream Controls & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pause / Play Toggle */}
          <button
            onClick={() => setIsLiveAutoStreaming(!isLiveAutoStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
              isLiveAutoStreaming
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isLiveAutoStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLiveAutoStreaming ? 'Auto-Stream ON' : 'Resume Feed'}</span>
          </button>

          {/* Open Activity Log Drawer */}
          <button
            onClick={() => setIsActivityDrawerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#3BC0BB] hover:bg-[#32a8a4] text-[#020712] text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md"
            title="Open Full Real-Time Activity Log Drawer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Open Drawer</span>
          </button>
        </div>
      </div>

      {/* TECH METRICS SUB-BAR */}
      <div className="bg-[#0D1520] border-b border-[#233549] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3BC0BB]" />
            <span>Total Events: <strong className="text-white">{activityLogs.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completions: <strong className="text-emerald-400">{totalCompletions}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Uploads: <strong className="text-[#3BC0BB]">{totalUploads}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Status Updates: <strong className="text-amber-400">{totalStatusChanges}</strong></span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <Terminal className="w-3 h-3 text-[#3BC0BB]" />
          <span>SOCKET PROTOCOL: WSS://EVENT-STREAM-SSL</span>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTERS BAR */}
      <div className="p-4 bg-[#16222F]/60 border-b border-[#233549] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              filterCategory === 'all'
                ? 'bg-[#0773BB] text-white shadow-lg border border-[#0773BB]'
                : 'bg-[#0D1520] text-slate-400 border border-[#233549] hover:text-white'
            }`}
          >
            All Feeds ({activityLogs.length})
          </button>
          <button
            onClick={() => setFilterCategory('completion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              filterCategory === 'completion'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg'
                : 'bg-[#0D1520] text-slate-400 border border-[#233549] hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Task Completions</span>
          </button>
          <button
            onClick={() => setFilterCategory('document')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              filterCategory === 'document'
                ? 'bg-[#0773BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/50 shadow-lg'
                : 'bg-[#0D1520] text-slate-400 border border-[#233549] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Doc Uploads</span>
          </button>
          <button
            onClick={() => setFilterCategory('status')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              filterCategory === 'status'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-lg'
                : 'bg-[#0D1520] text-slate-400 border border-[#233549] hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Status Changes</span>
          </button>
        </div>

        {/* Search & Project Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Project Dropdown */}
          <select
            value={selectedProjectIdFilter}
            onChange={(e) => setSelectedProjectIdFilter(e.target.value)}
            className="bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#3BC0BB] font-mono"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.title.slice(0, 20)}...
              </option>
            ))}
          </select>

          {/* Keyword Search */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity feed..."
              className="w-full bg-[#0D1520] border border-[#233549] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#3BC0BB]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STREAM FEED CONTAINER */}
      <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-[#0D1520]/50 border border-dashed border-[#233549] rounded-2xl space-y-3">
            <Activity className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <div className="text-xs text-slate-400 font-mono">
              NO TELEMETRY MATCHES FOR CURRENT FILTER SCOPE
            </div>
            <button
              onClick={() => {
                setFilterCategory('all');
                setSelectedProjectIdFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 bg-[#16222F] border border-[#233549] hover:bg-[#233549] text-xs text-slate-200 rounded-xl transition-all"
            >
              Reset Stream Filters
            </button>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const cat = getCategory(log);
            const isHighlighted = highlightedId === log.id;
            const isExpanded = expandedLogId === log.id;
            const project = projects.find((p) => p.id === log.projectId);

            return (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                  isHighlighted
                    ? 'bg-[#16222F] border-[#3BC0BB] shadow-[0_0_15px_rgba(59,192,187,0.3)] scale-[1.01]'
                    : 'bg-[#16222F]/80 border-[#233549] hover:border-[#0773BB]/60 hover:bg-[#16222F]'
                }`}
              >
                {/* Visual Left Category Highlight Stripe */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    cat === 'completion'
                      ? 'bg-emerald-400'
                      : cat === 'document'
                      ? 'bg-[#3BC0BB]'
                      : cat === 'status'
                      ? 'bg-amber-400'
                      : 'bg-[#0773BB]'
                  }`}
                />

                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* User Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <UserAvatar
                        name={log.userName}
                        size="sm"
                        theme="dark"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-slate-950 ${
                          cat === 'completion'
                            ? 'bg-emerald-400'
                            : cat === 'document'
                            ? 'bg-[#3BC0BB]'
                            : cat === 'status'
                            ? 'bg-amber-400'
                            : 'bg-[#0773BB]'
                        }`}
                      >
                        {cat === 'completion' && <CheckCircle2 className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                        {cat === 'document' && <FileText className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                        {cat === 'status' && <RefreshCw className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                        {cat === 'system' && <Zap className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-white tracking-tight">{log.userName}</span>
                        <span className="text-slate-400 font-normal">{log.action}</span>

                        {/* Event Category Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                            cat === 'completion'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : cat === 'document'
                              ? 'bg-[#0773BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40'
                              : cat === 'status'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {cat === 'completion' && 'TASK DONE'}
                          {cat === 'document' && 'DOC UPLOAD'}
                          {cat === 'status' && 'STATUS CHANGE'}
                          {cat === 'system' && 'SYSTEM AUDIT'}
                        </span>

                        {/* Project Code Badge */}
                        {project && (
                          <button
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setActiveTab('projects');
                            }}
                            className="px-2 py-0.5 rounded bg-[#0D1520] hover:bg-[#233549] text-slate-300 border border-[#233549] text-[10px] font-mono font-bold transition-all flex items-center gap-1"
                          >
                            <FolderKanban className="w-2.5 h-2.5 text-[#3BC0BB]" />
                            <span>[{project.code}]</span>
                          </button>
                        )}
                      </div>

                      {/* Target Headline */}
                      <div className="text-xs font-medium text-[#3BC0BB] truncate font-mono">
                        {log.target}
                      </div>

                      {/* Optional details text preview */}
                      {log.details && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right side: Timestamp & Expand button */}
                  <div className="flex flex-col items-end gap-1 shrink-0 font-mono">
                    <span
                      className="text-[10px] text-slate-400 flex items-center gap-1"
                      title={new Date(log.timestamp).toLocaleString()}
                    >
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatTimeAgo(log.timestamp)}
                    </span>

                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-1 text-slate-500 hover:text-slate-300 hover:bg-[#0D1520] rounded-lg transition-all"
                      title="Toggle Telemetry Audit Details"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Telemetry Technical Metadata Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#233549] bg-[#0D1520]/90 p-3 rounded-xl space-y-2 text-xs font-mono animate-in fade-in">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold border-b border-[#233549]/50 pb-1">
                      <span>AUDIT LOG TELEMETRY METADATA</span>
                      <span>LOG ID: {log.id}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">Exact Timestamp: </span>
                        <span className="text-slate-200">{new Date(log.timestamp).toISOString()}</span>
                      </div>

                      {log.ipAddress && (
                        <div>
                          <span className="text-slate-500">Origin IP / Location: </span>
                          <span className="text-amber-300 font-bold">{log.ipAddress}</span>
                        </div>
                      )}

                      <div>
                        <span className="text-slate-500">User ID: </span>
                        <span className="text-slate-300">{log.userId}</span>
                      </div>

                      {log.projectId && (
                        <div>
                          <span className="text-slate-500">Project ID: </span>
                          <span className="text-[#3BC0BB]">{log.projectId}</span>
                        </div>
                      )}
                    </div>

                    {log.details && (
                      <div className="bg-[#16222F] p-2 rounded-lg border border-[#233549] text-slate-300 text-[11px]">
                        <span className="text-slate-500 block text-[10px] font-bold uppercase mb-0.5">Event Execution Summary:</span>
                        {log.details}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* TECH-DARK FOOTER STREAM TELEMETRY STATUS */}
      <div className="bg-[#16222F] border-t border-[#233549] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#3BC0BB]" />
          <span>Showing {filteredLogs.length} activity records across workspace</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">
            AUTO-SYNC: <strong className="text-emerald-400">ENCRYPTION ACTIVE</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
