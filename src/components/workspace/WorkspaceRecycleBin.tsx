import React, { useState, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Clock,
  Building2,
  FolderKanban,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Info,
  ChevronRight,
  Eye,
  X,
  Sparkles,
  Layers,
  DollarSign,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, Company } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { WorkspaceCleanupJobModal } from './WorkspaceCleanupJobModal';

interface WorkspaceRecycleBinProps {
  isLight: boolean;
  onBackToDashboard?: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface RetentionDetails {
  daysLeft: number;
  hoursLeft: number;
  percentElapsed: number;
  isExpired: boolean;
  purgeDateStr: string;
}

export function compute30DayRetention(deletedAt?: string): RetentionDetails {
  if (!deletedAt) {
    return {
      daysLeft: 30,
      hoursLeft: 720,
      percentElapsed: 0,
      isExpired: false,
      purgeDateStr: 'In 30 days'
    };
  }

  const delTime = new Date(deletedAt).getTime();
  const purgeTime = delTime + THIRTY_DAYS_MS;
  const now = Date.now();
  const remainingMs = Math.max(0, purgeTime - now);
  const elapsedMs = Math.max(0, now - delTime);

  const daysLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.ceil(remainingMs / (60 * 60 * 1000));
  const percentElapsed = Math.min(100, Math.max(0, (elapsedMs / THIRTY_DAYS_MS) * 100));
  const isExpired = remainingMs <= 0;

  const purgeDate = new Date(purgeTime);
  const purgeDateStr = purgeDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    daysLeft,
    hoursLeft,
    percentElapsed,
    isExpired,
    purgeDateStr
  };
}

type RecycleItem =
  | { type: 'workspace'; item: Company; id: string; title: string; code: string; deletedAt?: string }
  | { type: 'space'; item: Project; id: string; title: string; code: string; deletedAt?: string };

export const WorkspaceRecycleBin: React.FC<WorkspaceRecycleBinProps> = ({
  isLight,
  onBackToDashboard
}) => {
  const {
    companies,
    deletedCompanies,
    restoreCompany,
    bulkRestoreCompanies,
    purgeCompany,
    bulkPurgeCompanies,
    emptyWorkspacesRecycleBin,
    projects,
    deletedProjects,
    restoreProject,
    bulkRestoreProjects,
    purgeProject,
    bulkPurgeProjects,
    emptyProjectsRecycleBin,
    purgeExpiredWorkspacesAndProjects,
    allTasks,
    users,
    showRestorationToast,
    runAutomatedWorkspaceCleanup
  } = useApp();

  // Active Filter Controls
  const [entityFilter, setEntityFilter] = useState<'all' | 'workspaces' | 'spaces'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'expiring_soon' | 'deleted_recent' | 'deleted_oldest' | 'title'>('expiring_soon');

  // Multi-selection states
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);

  // Modals & Feedback
  const [itemToPurge, setItemToPurge] = useState<RecycleItem | null>(null);
  const [previewItem, setPreviewItem] = useState<RecycleItem | null>(null);
  const [isBulkPurgeModalOpen, setIsBulkPurgeModalOpen] = useState(false);
  const [isEmptyAllModalOpen, setIsEmptyAllModalOpen] = useState(false);
  const [isCleanupJobModalOpen, setIsCleanupJobModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isActionInProgress, setIsActionInProgress] = useState(false);

  // Combine deleted workspaces and projects into a unified list
  const allDeletedItems = useMemo<RecycleItem[]>(() => {
    const list: RecycleItem[] = [];

    deletedCompanies.forEach((comp) => {
      list.push({
        type: 'workspace',
        item: comp,
        id: comp.id,
        title: comp.name,
        code: comp.code,
        deletedAt: comp.deletedAt
      });
    });

    deletedProjects.forEach((proj) => {
      list.push({
        type: 'space',
        item: proj,
        id: proj.id,
        title: proj.title,
        code: proj.code,
        deletedAt: proj.deletedAt
      });
    });

    return list;
  }, [deletedCompanies, deletedProjects]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = [...allDeletedItems];

    // Entity type filter
    if (entityFilter === 'workspaces') {
      result = result.filter((x) => x.type === 'workspace');
    } else if (entityFilter === 'spaces') {
      result = result.filter((x) => x.type === 'space');
    }

    // Company filter for spaces
    if (companyFilter !== 'all') {
      result = result.filter((x) => {
        if (x.type === 'workspace') return x.item.id === companyFilter;
        return (x.item as Project).companyId === companyFilter;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((x) => {
        const titleMatch = x.title.toLowerCase().includes(q);
        const codeMatch = x.code.toLowerCase().includes(q);
        const delByName = ((x.item as any).deletedByName || (x.item as any).deletedBy || '').toLowerCase();
        const delByMatch = delByName.includes(q);
        const descMatch = ((x.item as any).description || '').toLowerCase().includes(q);
        const catMatch = x.type === 'space' ? ((x.item as Project).category || '').toLowerCase().includes(q) : false;
        return titleMatch || codeMatch || delByMatch || descMatch || catMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'expiring_soon') {
        const retA = compute30DayRetention(a.deletedAt);
        const retB = compute30DayRetention(b.deletedAt);
        return retA.daysLeft - retB.daysLeft;
      }
      if (sortBy === 'deleted_recent') {
        const tA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const tB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return tB - tA;
      }
      if (sortBy === 'deleted_oldest') {
        const tA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const tB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return tA - tB;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [allDeletedItems, entityFilter, companyFilter, searchQuery, sortBy]);

  // Expiring soon count (< 7 days)
  const expiringSoonCount = useMemo(() => {
    return allDeletedItems.filter((x) => {
      const ret = compute30DayRetention(x.deletedAt);
      return ret.daysLeft <= 7;
    }).length;
  }, [allDeletedItems]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // Selection handlers
  const handleToggleSelect = (compositeKey: string) => {
    setSelectedItemKeys((prev) =>
      prev.includes(compositeKey) ? prev.filter((k) => k !== compositeKey) : [...prev, compositeKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemKeys.length === filteredItems.length) {
      setSelectedItemKeys([]);
    } else {
      setSelectedItemKeys(filteredItems.map((x) => `${x.type}_${x.id}`));
    }
  };

  // Single Item Restore
  const handleRestoreItem = (itemObj: RecycleItem) => {
    setIsActionInProgress(true);
    if (itemObj.type === 'workspace') {
      restoreCompany(itemObj.id);
      showFeedback(`Workspace entity "${itemObj.title}" and its spaces were successfully restored.`);
    } else {
      restoreProject(itemObj.id);
      showFeedback(`Space "${itemObj.title}" and its active tasks were successfully restored.`);
    }
    setSelectedItemKeys((prev) => prev.filter((k) => k !== `${itemObj.type}_${itemObj.id}`));
    setIsActionInProgress(false);
  };

  // Bulk Restore
  const handleBulkRestore = () => {
    if (selectedItemKeys.length === 0) return;
    setIsActionInProgress(true);

    const workspaceIdsToRestore: string[] = [];
    const spaceIdsToRestore: string[] = [];

    selectedItemKeys.forEach((k) => {
      const [type, id] = k.split('_');
      if (type === 'workspace') workspaceIdsToRestore.push(id);
      else if (type === 'space') spaceIdsToRestore.push(id);
    });

    if (workspaceIdsToRestore.length > 0 && spaceIdsToRestore.length > 0) {
      workspaceIdsToRestore.forEach((id) => restoreCompany(id, true));
      spaceIdsToRestore.forEach((id) => restoreProject(id, true));
      showRestorationToast({
        title: 'Workspace Data Recovered',
        itemType: 'multiple',
        count: workspaceIdsToRestore.length + spaceIdsToRestore.length,
        details: `Successfully recovered ${workspaceIdsToRestore.length} workspace(s) and ${spaceIdsToRestore.length} space(s) from the 30-day Recycle Bin.`
      });
    } else if (workspaceIdsToRestore.length > 0) {
      bulkRestoreCompanies(workspaceIdsToRestore);
    } else if (spaceIdsToRestore.length > 0) {
      bulkRestoreProjects(spaceIdsToRestore);
    }

    showFeedback(
      `Restored ${workspaceIdsToRestore.length} workspaces and ${spaceIdsToRestore.length} spaces back to active registry.`
    );
    setSelectedItemKeys([]);
    setIsActionInProgress(false);
  };

  // Single Item Purge Confirmation & Execution
  const handleExecuteSinglePurge = () => {
    if (!itemToPurge) return;
    setIsActionInProgress(true);

    if (itemToPurge.type === 'workspace') {
      purgeCompany(itemToPurge.id);
      showFeedback(`Permanently deleted workspace entity "${itemToPurge.title}".`);
    } else {
      purgeProject(itemToPurge.id);
      showFeedback(`Permanently deleted space "${itemToPurge.title}".`);
    }

    setSelectedItemKeys((prev) => prev.filter((k) => k !== `${itemToPurge.type}_${itemToPurge.id}`));
    setItemToPurge(null);
    setIsActionInProgress(false);
  };

  // Bulk Purge Execution
  const handleExecuteBulkPurge = () => {
    if (selectedItemKeys.length === 0) return;
    setIsActionInProgress(true);

    const workspaceIdsToPurge: string[] = [];
    const spaceIdsToPurge: string[] = [];

    selectedItemKeys.forEach((k) => {
      const [type, id] = k.split('_');
      if (type === 'workspace') workspaceIdsToPurge.push(id);
      else if (type === 'space') spaceIdsToPurge.push(id);
    });

    if (workspaceIdsToPurge.length > 0) {
      bulkPurgeCompanies(workspaceIdsToPurge);
    }
    if (spaceIdsToPurge.length > 0) {
      bulkPurgeProjects(spaceIdsToPurge);
    }

    showFeedback(
      `Permanently purged ${workspaceIdsToPurge.length} workspaces and ${spaceIdsToPurge.length} spaces.`
    );
    setSelectedItemKeys([]);
    setIsBulkPurgeModalOpen(false);
    setIsActionInProgress(false);
  };

  // Empty Entire Recycle Bin Execution
  const handleExecuteEmptyAll = () => {
    setIsActionInProgress(true);
    emptyWorkspacesRecycleBin();
    emptyProjectsRecycleBin();
    showFeedback('Recycle Bin has been completely emptied. All deleted workspaces and spaces have been purged.');
    setSelectedItemKeys([]);
    setIsEmptyAllModalOpen(false);
    setIsActionInProgress(false);
  };

  // Manual Trigger for 30-Day Auto Purge
  const handleRunAutoPurgeCheck = () => {
    const result = runAutomatedWorkspaceCleanup(true);
    if (result.workspacesPurged > 0) {
      showFeedback(
        `30-day retention cleanup executed: Permanently deleted ${result.workspacesPurged} expired workspace(s) exceeding 30-day retention.`
      );
    } else {
      showFeedback(
        `30-day retention scan completed: Evaluated ${result.workspacesEvaluated} workspace(s). All items are within the 30-day retention window.`
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HEADER BANNER & BREADCRUMB */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#16222F] border-[#233549]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {onBackToDashboard && (
                  <button
                    onClick={onBackToDashboard}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-[#3BC0BB] transition-colors mr-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Spaces</span>
                  </button>
                )}
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  30-DAY RETENTION RECOVERY
                </span>
              </div>
              <h1 className={`text-2xl font-black tracking-tight mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Workspace & Space Recycle Bin
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1 max-w-2xl">
                Deleted workspace entities and project spaces are safely retained here for <strong className="text-slate-200">30 days</strong> with all associated members, task structures, and settings intact before permanent automatic erasure.
              </p>
            </div>
          </div>

          {/* Quick Global Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCleanupJobModalOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
              }`}
              title="Automated 30-Day Retention Cleanup Background Daemon settings and audit logs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Cleanup Daemon</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={handleRunAutoPurgeCheck}
              disabled={isActionInProgress}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#0D1520] hover:bg-[#1b2b3a] border-[#233549] text-slate-300'
              }`}
              title="Run 30-day retention engine to purge items older than 30 days"
            >
              <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>Auto-Purge Check</span>
            </button>

            {allDeletedItems.length > 0 && (
              <button
                onClick={() => setIsEmptyAllModalOpen(true)}
                disabled={isActionInProgress}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 transition-all cursor-pointer"
                title="Permanently erase all items currently held in this Recycle Bin"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Empty Recycle Bin</span>
              </button>
            )}

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0773BB] hover:bg-[#06619e] text-white transition-all shadow-sm cursor-pointer"
              >
                <span>Done & Return</span>
              </button>
            )}
          </div>
        </div>

        {/* FEEDBACK NOTIFICATION BANNER */}
        {feedbackMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-emerald-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. STATS & POLICY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total In Recycle Bin</span>
            <Trash2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`text-2xl font-black mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {allDeletedItems.length} Items
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {deletedCompanies.length} Workspaces + {deletedProjects.length} Spaces
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Deleted Workspaces</span>
            <Building2 className="w-4 h-4 text-[#3BC0BB]" />
          </div>
          <div className={`text-2xl font-black mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {deletedCompanies.length}
          </div>
          <p className="text-[11px] text-[#3BC0BB] font-medium mt-1">
            Holding sub-spaces & entity configs
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Deleted Spaces (Projects)</span>
            <FolderKanban className="w-4 h-4 text-[#0773BB]" />
          </div>
          <div className={`text-2xl font-black mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {deletedProjects.length}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Holding task dependencies & boards
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Expiring Soon (&le; 7 Days)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-black mt-2 ${expiringSoonCount > 0 ? 'text-amber-400' : isLight ? 'text-slate-900' : 'text-white'}`}>
            {expiringSoonCount} Items
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Scheduled for automatic deletion
          </p>
        </div>
      </div>

      {/* 3. TOOLBAR CONTROLS (SEARCH, FILTERS, ENTITY TABS, BULK ACTIONS) */}
      <div
        className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Entity Tab Pills */}
          <div className="flex items-center gap-1 p-1 bg-[#0D1520] rounded-xl border border-[#233549]">
            <button
              onClick={() => setEntityFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entityFilter === 'all'
                  ? 'bg-[#0773BB] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Items ({allDeletedItems.length})
            </button>
            <button
              onClick={() => setEntityFilter('workspaces')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                entityFilter === 'workspaces'
                  ? 'bg-[#0773BB] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Workspaces ({deletedCompanies.length})</span>
            </button>
            <button
              onClick={() => setEntityFilter('spaces')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                entityFilter === 'spaces'
                  ? 'bg-[#0773BB] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Spaces ({deletedProjects.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, code, category, or deleted by..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border focus:outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0773BB]'
                  : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#3BC0BB]'
              }`}
            />
          </div>

          {/* Company Filter (for filtering projects) */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800'
                : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Workspaces</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                @{c.code} - {c.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800'
                : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="expiring_soon">Expiring Soonest (30d Limit)</option>
            <option value="deleted_recent">Recently Deleted</option>
            <option value="deleted_oldest">Oldest Deleted</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedItemKeys.length > 0 && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl animate-in fade-in">
            <span className="text-xs font-bold text-rose-300">
              {selectedItemKeys.length} selected
            </span>
            <button
              onClick={handleBulkRestore}
              disabled={isActionInProgress}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore ({selectedItemKeys.length})</span>
            </button>
            <button
              onClick={() => setIsBulkPurgeModalOpen(true)}
              disabled={isActionInProgress}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge ({selectedItemKeys.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. ITEMS LISTING */}
      {filteredItems.length === 0 ? (
        <div
          className={`p-12 text-center rounded-2xl border flex flex-col items-center justify-center ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-slate-400 mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#3BC0BB]" />
          </div>
          <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Recycle Bin is Empty
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
            {searchQuery
              ? 'No deleted workspaces or spaces match your current search and filter criteria.'
              : 'There are currently no deleted workspaces or spaces in retention. When you delete items, they will be held here safely for 30 days before permanent erasure.'}
          </p>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0773BB] hover:bg-[#06619e] text-white transition-all shadow-sm cursor-pointer"
            >
              Return to Workspace Dashboard
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select all header */}
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedItemKeys.length === filteredItems.length && filteredItems.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-[#0773BB] focus:ring-0 cursor-pointer"
              />
              <span>Select All {filteredItems.length} Items</span>
            </label>
            <span>Retained for 30 Days</span>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 gap-3">
            {filteredItems.map((itemObj) => {
              const compositeKey = `${itemObj.type}_${itemObj.id}`;
              const isSelected = selectedItemKeys.includes(compositeKey);
              const retention = compute30DayRetention(itemObj.deletedAt);
              const isWorkspace = itemObj.type === 'workspace';
              const rawItem = itemObj.item as any;

              // Associated counts
              const associatedSpaces = isWorkspace
                ? projects.filter((p) => p.companyId === itemObj.id)
                : [];
              const parentCompany = !isWorkspace
                ? companies.find((c) => c.id === (rawItem as Project).companyId)
                : null;
              const associatedTasksCount = !isWorkspace
                ? allTasks.filter((t) => t.projectId === itemObj.id).length
                : 0;

              return (
                <div
                  key={compositeKey}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-[#0773BB] bg-[#0773BB]/10 shadow-md'
                      : isLight
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      : 'bg-[#16222F] border-[#233549] hover:border-[#354f6b]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Checkbox & Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(compositeKey)}
                        className="w-4 h-4 mt-1 rounded border-slate-600 bg-slate-800 text-[#0773BB] focus:ring-0 cursor-pointer shrink-0"
                      />

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isWorkspace
                            ? 'bg-[#0773BB]/15 border-[#0773BB]/30 text-[#3BC0BB]'
                            : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                        }`}
                      >
                        {isWorkspace ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <FolderKanban className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              isWorkspace
                                ? 'bg-[#0773BB]/20 text-[#3BC0BB] border-[#0773BB]/40'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            }`}
                          >
                            {isWorkspace ? 'WORKSPACE ENTITY' : 'PROJECT SPACE'}
                          </span>

                          <span className="text-xs font-mono font-bold text-slate-400">
                            {isWorkspace ? `@${itemObj.code}` : `[${itemObj.code}]`}
                          </span>

                          {!isWorkspace && parentCompany && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                              @{parentCompany.code} {parentCompany.name}
                            </span>
                          )}

                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold">
                            Soft-Deleted
                          </span>
                        </div>

                        <h4 className={`text-sm font-extrabold mt-1 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {itemObj.title}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {rawItem.description || (isWorkspace ? `Business domain: ${rawItem.domain}` : 'No description provided')}
                        </p>

                        {/* Extra Metadata Badges */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                          {isWorkspace ? (
                            <>
                              <span>Domain: <strong className="text-slate-300">{rawItem.domain || 'N/A'}</strong></span>
                              <span>Type: <strong className="text-slate-300">{rawItem.type || 'Subsidiary'}</strong></span>
                              <span>Child Spaces: <strong className="text-slate-300">{associatedSpaces.length}</strong></span>
                            </>
                          ) : (
                            <>
                              <span>Category: <strong className="text-slate-300">{rawItem.category}</strong></span>
                              <span>Budget: <strong className="text-emerald-400">${((rawItem.budget || 0) / 1000).toFixed(0)}k</strong></span>
                              <span>Tasks: <strong className="text-slate-300">{associatedTasksCount} tasks</strong></span>
                            </>
                          )}

                          {rawItem.deletedByName && (
                            <span className="flex items-center gap-1">
                              <span>Deleted by:</span>
                              <strong className="text-slate-300">{rawItem.deletedByName}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: 30-Day Retention Indicator & Progress Bar */}
                    <div className="lg:w-64 shrink-0 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>30-Day Retention</span>
                        </span>
                        <span
                          className={`font-mono ${
                            retention.daysLeft <= 3
                              ? 'text-rose-400 font-extrabold'
                              : retention.daysLeft <= 7
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {retention.daysLeft} {retention.daysLeft === 1 ? 'day' : 'days'} left
                        </span>
                      </div>

                      {/* Retention Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden border border-slate-700/50">
                        <div
                          className={`h-full rounded-full transition-all ${
                            retention.daysLeft <= 3
                              ? 'bg-rose-500'
                              : retention.daysLeft <= 7
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.max(5, retention.percentElapsed)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                        <span>Day {Math.min(30, 30 - retention.daysLeft + 1)} of 30</span>
                        <span>Purge on {retention.purgeDateStr}</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setPreviewItem(itemObj)}
                        className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                            : 'bg-[#0D1520] hover:bg-[#1b2b3a] border-[#233549] text-slate-300'
                        }`}
                        title="Inspect item configuration and deletion metadata"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRestoreItem(itemObj)}
                        disabled={isActionInProgress}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                        title={isWorkspace ? 'Restore this workspace and its spaces' : 'Restore this space and tasks'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={() => setItemToPurge(itemObj)}
                        disabled={isActionInProgress}
                        className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                        title="Permanently purge now (Cannot be undone)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. CONFIRM PURGE SINGLE ITEM MODAL */}
      {itemToPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Permanently Purge {itemToPurge.type === 'workspace' ? 'Workspace' : 'Space'}?
            </h3>

            <p className="text-xs text-slate-400 mt-2">
              Are you sure you want to permanently erase{' '}
              <strong className="text-rose-400">"{itemToPurge.title}" [{itemToPurge.code}]</strong>?
            </p>

            <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>IRREVERSIBLE OPERATION:</span>
              </div>
              <p className="text-[11px] font-normal leading-relaxed text-rose-200/90">
                {itemToPurge.type === 'workspace'
                  ? 'This will immediately purge the workspace entity, all associated project spaces, and all related tasks across local cache, memory, and Firestore database. It cannot be recovered.'
                  : 'This will immediately purge the project space and all associated tasks across local cache, memory, and Firestore database. It cannot be recovered.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToPurge(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-[#0D1520] hover:bg-[#1b2b3a] border-[#233549] text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSinglePurge}
                disabled={isActionInProgress}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Erase</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONFIRM BULK PURGE MODAL */}
      {isBulkPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Permanently Purge {selectedItemKeys.length} Selected Items?
            </h3>

            <p className="text-xs text-slate-400 mt-2">
              You are about to permanently erase {selectedItemKeys.length} selected items from the Recycle Bin.
            </p>

            <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>PERMANENT DATA LOSS:</span>
              </div>
              <p className="text-[11px] font-normal leading-relaxed text-rose-200/90">
                These workspaces and spaces will be purged permanently from Firestore and local storage. They cannot be restored.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkPurgeModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-[#0D1520] hover:bg-[#1b2b3a] border-[#233549] text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkPurge}
                disabled={isActionInProgress}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Purge Selected</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIRM EMPTY ALL RECYCLE BIN MODAL */}
      {isEmptyAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Empty Entire Recycle Bin?
            </h3>

            <p className="text-xs text-slate-400 mt-2">
              This will permanently erase all <strong className="text-rose-400">{allDeletedItems.length}</strong> deleted workspaces and spaces.
            </p>

            <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>CANNOT BE UNDONE:</span>
              </div>
              <p className="text-[11px] font-normal leading-relaxed text-rose-200/90">
                All deleted items in the 30-day retention pool will be wiped permanently without waiting for the 30-day expiration period.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEmptyAllModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-[#0D1520] hover:bg-[#1b2b3a] border-[#233549] text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteEmptyAll}
                disabled={isActionInProgress}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Empty Recycle Bin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PREVIEW / INSPECT MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    previewItem.type === 'workspace'
                      ? 'bg-[#0773BB]/20 text-[#3BC0BB] border-[#0773BB]/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {previewItem.type === 'workspace' ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <FolderKanban className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {previewItem.title}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    ID: {previewItem.id} &bull; Code: {previewItem.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Item Type</span>
                  <strong className="text-slate-200 capitalize">{previewItem.type}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">30-Day Expiration</span>
                  <strong className="text-amber-400">
                    {compute30DayRetention(previewItem.deletedAt).daysLeft} days remaining
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block">Deletion Audit</span>
                <p className="text-slate-300">
                  Deleted on:{' '}
                  <strong>
                    {previewItem.deletedAt
                      ? new Date(previewItem.deletedAt).toLocaleString()
                      : 'Recently'}
                  </strong>
                </p>
                <p className="text-slate-300">
                  Deleted by:{' '}
                  <strong>
                    {(previewItem.item as any).deletedByName ||
                      (previewItem.item as any).deletedBy ||
                      'Administrator'}
                  </strong>
                </p>
              </div>

              {previewItem.type === 'space' && (
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Space Properties</span>
                  <p className="text-slate-300">
                    Category: <strong>{(previewItem.item as Project).category}</strong>
                  </p>
                  <p className="text-slate-300">
                    Budget: <strong>${(previewItem.item as Project).budget?.toLocaleString()}</strong>
                  </p>
                  <p className="text-slate-300">
                    Assigned Members: <strong>{(previewItem.item as Project).members?.length || 0} users</strong>
                  </p>
                </div>
              )}

              {previewItem.type === 'workspace' && (
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Workspace Properties</span>
                  <p className="text-slate-300">
                    Domain: <strong>{(previewItem.item as Company).domain}</strong>
                  </p>
                  <p className="text-slate-300">
                    Entity Type: <strong>{(previewItem.item as Company).type || 'Corporate Subsidiary'}</strong>
                  </p>
                  <p className="text-slate-300">
                    Contact: <strong>{(previewItem.item as Company).contactEmail || 'N/A'}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-700/40">
              <button
                type="button"
                onClick={() => {
                  const toPurge = previewItem;
                  setPreviewItem(null);
                  setItemToPurge(toPurge);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
              >
                Permanently Purge
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toRestore = previewItem;
                    setPreviewItem(null);
                    handleRestoreItem(toRestore);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <WorkspaceCleanupJobModal
        isOpen={isCleanupJobModalOpen}
        onClose={() => setIsCleanupJobModalOpen(false)}
        isLight={isLight}
      />
    </div>
  );
};
