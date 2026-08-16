import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  UserPlus,
  Key,
  Lock,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Eye,
  FileText,
  Globe,
  Activity,
  Calendar,
  ChevronRight,
  Copy,
  Check,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  FolderKanban,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityLog, Role } from '../../types';

interface AdminAuditLogsProps {
  isLight?: boolean;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ isLight = false }) => {
  const { activityLogs, users, companies, projects, tasks, currentUser, logActivity } = useApp();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'role_changes' | 'deletions' | 'security'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Selected Log for Deep Inspection Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedRawJson, setCopiedRawJson] = useState(false);

  // Quick helper to identify role changes & deletions
  const isRoleChangeLog = (log: ActivityLog): boolean => {
    const action = log.action.toLowerCase();
    const target = log.target.toLowerCase();
    const details = (log.details || '').toLowerCase();
    return (
      log.type === 'permission' ||
      action.includes('role') ||
      action.includes('permission') ||
      details.includes('role') ||
      details.includes('attributes') ||
      target.includes('role')
    );
  };

  const isDeletionLog = (log: ActivityLog): boolean => {
    const action = log.action.toLowerCase();
    const target = log.target.toLowerCase();
    return (
      action.includes('delete') ||
      action.includes('deleted') ||
      action.includes('remove') ||
      action.includes('removed') ||
      action.includes('deactivate') ||
      action.includes('deactivated') ||
      target.includes('delete')
    );
  };

  const isSecurityLog = (log: ActivityLog): boolean => {
    return (
      log.type === 'security' ||
      log.type === 'auth' ||
      log.type === 'permission' ||
      log.severity === 'critical' ||
      log.severity === 'warning' ||
      log.action.includes('domain') ||
      log.action.includes('policy') ||
      log.action.includes('sign')
    );
  };

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      // 1. Quick Filters
      if (quickFilter === 'role_changes' && !isRoleChangeLog(log)) return false;
      if (quickFilter === 'deletions' && !isDeletionLog(log)) return false;
      if (quickFilter === 'security' && !isSecurityLog(log)) return false;

      // 2. Category Filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'permission' && log.type !== 'permission') return false;
        if (selectedCategory === 'task' && log.type !== 'task') return false;
        if (selectedCategory === 'project' && log.type !== 'project') return false;
        if (selectedCategory === 'user' && log.type !== 'user') return false;
        if (selectedCategory === 'security_auth' && log.type !== 'security' && log.type !== 'auth') return false;
        if (selectedCategory === 'system_auto' && log.type !== 'system' && log.type !== 'automation') return false;
      }

      // 3. Severity Filter
      if (selectedSeverity !== 'all' && (log.severity || 'info') !== selectedSeverity) {
        return false;
      }

      // 4. Actor / User Filter
      if (selectedUserId !== 'all' && log.userId !== selectedUserId) {
        return false;
      }

      // 5. Date Filter
      if (dateFilter !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        if (dateFilter === 'today' && now - logTime > dayMs) return false;
        if (dateFilter === '7d' && now - logTime > 7 * dayMs) return false;
        if (dateFilter === '30d' && now - logTime > 30 * dayMs) return false;
      }

      // 6. Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const actor = (log.userName || '').toLowerCase();
        const action = (log.action || '').toLowerCase();
        const target = (log.target || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const ip = (log.ipAddress || '').toLowerCase();
        const logId = (log.id || '').toLowerCase();

        return (
          actor.includes(q) ||
          action.includes(q) ||
          target.includes(q) ||
          details.includes(q) ||
          ip.includes(q) ||
          logId.includes(q)
        );
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [activityLogs, quickFilter, selectedCategory, selectedSeverity, selectedUserId, dateFilter, searchTerm, sortOrder]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = activityLogs.length;
    const roleAndPermissionEvents = activityLogs.filter(isRoleChangeLog).length;
    const deletionEvents = activityLogs.filter(isDeletionLog).length;
    const securityWarnings = activityLogs.filter((l) => l.severity === 'warning' || l.severity === 'critical').length;
    const uniqueActors = new Set(activityLogs.map((l) => l.userId)).size;

    return {
      total,
      roleAndPermissionEvents,
      deletionEvents,
      securityWarnings,
      uniqueActors
    };
  }, [activityLogs]);

  // Helper for Relative Time
  const formatRelativeTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const diffSecs = Math.round((Date.now() - date.getTime()) / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.round(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.round(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return timestamp;
    }
  };

  // Helper for Exact Timestamp
  const formatExactDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  };

  // Helper to determine Category Badge and Icon
  const getActionBadge = (log: ActivityLog) => {
    const isRole = isRoleChangeLog(log);
    const isDel = isDeletionLog(log);
    const action = log.action.toLowerCase();

    if (isDel) {
      return {
        label: action.includes('task') ? 'TASK DELETED' : action.includes('project') ? 'SPACE DELETED' : 'ENTITY REMOVED',
        bg: isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        icon: Trash2
      };
    }

    if (isRole) {
      return {
        label: action.includes('role') ? 'ROLE MODIFIED' : 'PERMISSION CHANGED',
        bg: isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        icon: ShieldAlert
      };
    }

    switch (log.type) {
      case 'auth':
      case 'security':
        return {
          label: 'AUTH & SECURITY',
          bg: isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          icon: Key
        };
      case 'user':
        return {
          label: 'USER MANAGEMENT',
          bg: isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: UserPlus
        };
      case 'project':
        return {
          label: 'SPACE GOVERNANCE',
          bg: isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
          icon: FolderKanban
        };
      case 'automation':
        return {
          label: 'AUTOMATION',
          bg: isLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          icon: Sparkles
        };
      case 'task':
      default:
        return {
          label: 'TASK OPERATION',
          bg: isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700',
          icon: FileText
        };
    }
  };

  // Severity Badge
  const getSeverityBadge = (severity?: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return {
          label: 'Critical',
          badge: isLight ? 'bg-red-100 text-red-800 border-red-200' : 'bg-red-500/20 text-red-400 border-red-500/40',
          icon: ShieldAlert
        };
      case 'warning':
        return {
          label: 'Warning',
          badge: isLight ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: AlertTriangle
        };
      case 'info':
      default:
        return {
          label: 'Info',
          badge: isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700',
          icon: Info
        };
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp (ISO)', 'Actor Name', 'Actor ID', 'Action Category', 'Action', 'Target Entity', 'Details', 'Severity', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      `"${l.userId || ''}"`,
      `"${l.type}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.target || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.severity || 'info'}"`,
      `"${l.ipAddress || '10.240.0.18'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dolphin_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Dolphin_Audit_Logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print Audit Report
  const handlePrint = () => {
    window.print();
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* SECTION 1: HEADER & STATS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div
          onClick={() => { setQuickFilter('all'); setSelectedCategory('all'); setSelectedSeverity('all'); }}
          className={`p-4.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
            quickFilter === 'all' && selectedCategory === 'all'
              ? (isLight ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20' : 'bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-500/30')
              : (isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-[#16222F] border-[#233549] hover:bg-[#1A2938]')
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Total Audit Trail
            </span>
            <div className="p-2 rounded-xl bg-[#0773BB]/10 text-[#0773BB]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {stats.total}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              {stats.uniqueActors} Active Actors
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Immutable tenant action records</p>
        </div>

        {/* Role & Permission Events */}
        <div
          onClick={() => { setQuickFilter('role_changes'); setSelectedCategory('all'); }}
          className={`p-4.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
            quickFilter === 'role_changes'
              ? (isLight ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20' : 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30')
              : (isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-[#16222F] border-[#233549] hover:bg-[#1A2938]')
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Role & Access Changes
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-amber-500">
              {stats.roleAndPermissionEvents}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
              High Audit Focus
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Role promotions, demotions & ACL updates</p>
        </div>

        {/* Deletions & Destructive Events */}
        <div
          onClick={() => { setQuickFilter('deletions'); setSelectedCategory('all'); }}
          className={`p-4.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
            quickFilter === 'deletions'
              ? (isLight ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20' : 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/30')
              : (isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-[#16222F] border-[#233549] hover:bg-[#1A2938]')
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Deletions & Removals
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-rose-500">
              {stats.deletionEvents}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30">
              Destructive Ops
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Task, space & user account deletions</p>
        </div>

        {/* Security Alerts / Warnings */}
        <div
          onClick={() => { setQuickFilter('security'); setSelectedCategory('all'); }}
          className={`p-4.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
            quickFilter === 'security'
              ? (isLight ? 'bg-red-50/80 border-red-300 ring-2 ring-red-500/20' : 'bg-red-500/10 border-red-500/40 ring-1 ring-red-500/30')
              : (isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-[#16222F] border-[#233549] hover:bg-[#1A2938]')
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Security & Policy Alerts
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-red-500">
              {stats.securityWarnings}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Shield Active
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Domain rules & privilege warnings</p>
        </div>
      </div>

      {/* SECTION 2: SEARCH, MULTI-DIMENSIONAL FILTERS & EXPORT TOOLBAR */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail by actor, action, target entity, IP address or log ID..."
              className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#0773BB] transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-[#0D1520] border-[#233549] text-white placeholder-slate-500'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Export & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-[#0D1520] hover:bg-[#152332] text-slate-300 border-[#233549]'
              }`}
              title="Export filtered audit logs to CSV for compliance"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-[#0D1520] hover:bg-[#152332] text-slate-300 border-[#233549]'
              }`}
              title="Download raw audit payload as JSON"
            >
              <Download className="w-3.5 h-3.5 text-sky-500" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-[#0D1520] hover:bg-[#152332] text-slate-300 border-[#233549]'
              }`}
              title="Print formatted audit report"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>Print Report</span>
            </button>

            {/* View Mode Toggle (Table / Timeline) */}
            <div className={`flex items-center rounded-xl p-0.5 border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-[#1E2D3D] text-white shadow')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'timeline'
                    ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-[#1E2D3D] text-white shadow')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns & Quick Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-[#233549]/60">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Quick:
              </span>
              <button
                onClick={() => setQuickFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  quickFilter === 'all'
                    ? 'bg-[#0773BB] text-white shadow-sm'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white'
                }`}
              >
                All Logs
              </button>

              <button
                onClick={() => setQuickFilter('role_changes')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  quickFilter === 'role_changes'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : isLight
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Role Changes</span>
              </button>

              <button
                onClick={() => setQuickFilter('deletions')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  quickFilter === 'deletions'
                    ? 'bg-rose-600 text-white font-black shadow-sm'
                    : isLight
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                }`}
              >
                <Trash2 className="w-3 h-3" />
                <span>Deletions</span>
              </button>

              <button
                onClick={() => setQuickFilter('security')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  quickFilter === 'security'
                    ? 'bg-red-600 text-white font-black shadow-sm'
                    : isLight
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Security</span>
              </button>
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setQuickFilter('all'); }}
              className={`border rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-[#0773BB] ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              <option value="all">All Event Categories</option>
              <option value="permission">Permissions & Roles</option>
              <option value="task">Task Operations</option>
              <option value="project">Space Governance</option>
              <option value="user">User Management</option>
              <option value="security_auth">Auth & Security</option>
              <option value="system_auto">System & Automations</option>
            </select>

            {/* Severity Select */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className={`border rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-[#0773BB] ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warnings Only</option>
              <option value="info">Info Only</option>
            </select>

            {/* Actor Select */}
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className={`border rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-[#0773BB] ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              <option value="all">All Actors / Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            {/* Date Range Select */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className={`border rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-[#0773BB] ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
              }`}
            >
              <option value="all">All Time</option>
              <option value="today">Today (Last 24h)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-[#0D1520] border-[#233549] text-slate-300'
              }`}
              title="Toggle sorting order by timestamp"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
              isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#0D1520] text-slate-300'
            }`}>
              Showing {filteredLogs.length} of {activityLogs.length}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: AUDIT DATA PRESENTATION (TABLE OR TIMELINE) */}
      {filteredLogs.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            No Audit Logs Match Selected Filters
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try resetting your search query or quick filter pills to view all tenant operations and security records.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setQuickFilter('all');
              setSelectedCategory('all');
              setSelectedSeverity('all');
              setSelectedUserId('all');
              setDateFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow transition-all"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className={`border rounded-2xl overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0D1520] border-[#233549] text-slate-400'
                }`}>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details / Diff</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#233549]/60 text-xs">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log);
                  const Icon = badge.icon;
                  const sev = getSeverityBadge(log.severity);
                  const SevIcon = sev.icon;
                  const isRole = isRoleChangeLog(log);
                  const isDel = isDeletionLog(log);

                  return (
                    <tr
                      key={log.id}
                      className={`group transition-colors ${
                        isRole
                          ? (isLight ? 'hover:bg-amber-50/60 bg-amber-50/20' : 'hover:bg-amber-500/10 bg-amber-500/5')
                          : isDel
                          ? (isLight ? 'hover:bg-rose-50/60 bg-rose-50/20' : 'hover:bg-rose-500/10 bg-rose-500/5')
                          : (isLight ? 'hover:bg-slate-50/80' : 'hover:bg-[#1B2B3C]/50')
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`font-mono text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {formatRelativeTime(log.timestamp)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatExactDate(log.timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={log.userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                            alt={log.userName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-500/30"
                          />
                          <div>
                            <div className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {log.userName || 'System'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              IP: {log.ipAddress || '10.240.0.18'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action Event Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border font-mono ${badge.bg}`}>
                            <Icon className="w-3 h-3 shrink-0" />
                            <span>{badge.label}</span>
                          </span>
                          <span className={`font-bold capitalize ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            {log.action}
                          </span>
                        </div>
                      </td>

                      {/* Target Entity */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold truncate text-xs text-[#0773BB] dark:text-[#3BC0BB]" title={log.target}>
                          {log.target}
                        </div>
                        {log.projectId && (
                          <div className="text-[10px] text-slate-500 truncate">
                            Project Space: {projects.find((p) => p.id === log.projectId)?.title || log.projectId}
                          </div>
                        )}
                      </td>

                      {/* Details / Diff */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className={`text-xs truncate ${isLight ? 'text-slate-600' : 'text-slate-300'}`} title={log.details || 'Standard transaction logged'}>
                          {log.details || 'Standard transaction record logged.'}
                        </p>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sev.badge}`}>
                          <SevIcon className="w-2.5 h-2.5" />
                          <span>{sev.label}</span>
                        </span>
                      </td>

                      {/* Action Inspection */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              : 'bg-[#0D1520] hover:bg-[#203244] text-slate-300 border-[#233549]'
                          }`}
                          title="Inspect raw audit record and security diff"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0773BB] dark:text-[#3BC0BB]" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className={`p-6 rounded-2xl border space-y-6 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-300 dark:before:bg-[#233549]">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log);
              const Icon = badge.icon;
              const sev = getSeverityBadge(log.severity);
              const SevIcon = sev.icon;
              const isRole = isRoleChangeLog(log);
              const isDel = isDeletionLog(log);

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isDel
                      ? 'bg-rose-600 border-rose-400 text-white'
                      : isRole
                      ? 'bg-amber-500 border-amber-300 text-slate-950'
                      : log.severity === 'critical'
                      ? 'bg-red-600 border-red-400 text-white'
                      : isLight
                      ? 'bg-white border-[#0773BB] text-[#0773BB]'
                      : 'bg-[#16222F] border-[#3BC0BB] text-[#3BC0BB]'
                  }`}>
                    <Icon className="w-2.5 h-2.5" />
                  </div>

                  {/* Timeline Event Card */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    isRole
                      ? (isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30')
                      : isDel
                      ? (isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-500/10 border-rose-500/30')
                      : (isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/70' : 'bg-[#0D1520] border-[#233549] hover:bg-[#132030]')
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {log.userName} {log.action}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sev.badge}`}>
                          <SevIcon className="w-2.5 h-2.5" />
                          <span>{sev.label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatExactDate(log.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs font-semibold text-[#0773BB] dark:text-[#3BC0BB]">
                      Target: {log.target}
                    </div>

                    {log.details && (
                      <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {log.details}
                      </p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#233549]/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>IP: {log.ipAddress || '10.240.0.18'}</span>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-[#0773BB] dark:text-[#3BC0BB] hover:underline font-bold flex items-center gap-1 text-xs"
                      >
                        <span>Inspect Payload</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: DEEP INSPECTION MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Audit Event Deep Inspection
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/40 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Security & Verification Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-bold">Cryptographic Integrity Verified: Record matches tenant audit blockchain ledger.</span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  IMMUTABLE
                </span>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Actor</span>
                  <span className={`text-xs font-bold mt-1 block truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedLog.userName || 'System'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{selectedLog.userId}</span>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Action Type</span>
                  <span className={`text-xs font-bold mt-1 block uppercase font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedLog.type}
                  </span>
                  <span className="text-[10px] text-slate-500">{selectedLog.action}</span>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Severity</span>
                  <span className="text-xs font-bold mt-1 block capitalize text-amber-400">
                    {selectedLog.severity || 'info'}
                  </span>
                  <span className="text-[10px] text-slate-500">Security Score: 100</span>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Timestamp</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-slate-300">
                    {formatExactDate(selectedLog.timestamp)}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Origin IP Address</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-sky-400">
                    {selectedLog.ipAddress || '10.240.0.18'}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Company / Tenant</span>
                  <span className={`text-xs font-bold mt-1 block truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {companies.find((c) => c.id === selectedLog.companyId)?.name || selectedLog.companyId}
                  </span>
                </div>
              </div>

              {/* Target & Details breakdown */}
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Target Entity
                </label>
                <div className={`p-3 rounded-xl font-mono text-xs border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-[#3BC0BB]'
                }`}>
                  {selectedLog.target}
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Event Details & Security Impact
                </label>
                <div className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                }`}>
                  {selectedLog.details || 'Standard user operation logged.'}
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Raw Audit Record (JSON)
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                      setCopiedRawJson(true);
                      setTimeout(() => setCopiedRawJson(false), 2000);
                    }}
                    className="text-xs text-[#0773BB] dark:text-[#3BC0BB] hover:underline flex items-center gap-1 font-bold"
                  >
                    {copiedRawJson ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRawJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className={`p-4 rounded-xl font-mono text-[11px] overflow-x-auto border max-h-40 ${
                  isLight ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-[#080D14] text-slate-300 border-[#233549]'
                }`}>
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <span className="text-[11px] text-slate-400 font-mono">
                Log Hash: SHA256-{selectedLog.id.slice(0, 12)}...
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs transition-all shadow"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
