import React, { useState, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Clock,
  User as UserIcon,
  FolderKanban,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Info,
  Layers,
  ChevronRight,
  Eye,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Priority } from '../../types';

interface AdminRecycleBinProps {
  isLight: boolean;
}

export const AdminRecycleBin: React.FC<AdminRecycleBinProps> = ({ isLight }) => {
  const {
    deletedTasks,
    restoreTask,
    bulkRestoreTasks,
    purgeTask,
    bulkPurgeTasks,
    emptyRecycleBin,
    purgeExpiredTasks,
    projects,
    users,
    companies
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deleted_recent' | 'deleted_oldest' | 'purge_soon' | 'title'>('deleted_recent');
  
  // Selection for bulk actions
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  // Modals & confirmation state
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [taskToPurge, setTaskToPurge] = useState<Task | null>(null);
  const [isEmptyModalOpen, setIsEmptyModalOpen] = useState(false);
  const [isBulkPurgeModalOpen, setIsBulkPurgeModalOpen] = useState(false);
  const [autoPurgeMessage, setAutoPurgeMessage] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  // Helper to calculate days remaining before 30-day auto purge
  const getRetentionInfo = (deletedAt?: string) => {
    if (!deletedAt) {
      return { daysLeft: 30, isUrgent: false, formattedDate: 'Unknown' };
    }
    const delDate = new Date(deletedAt);
    const now = new Date();
    const ageMs = now.getTime() - delDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const daysLeft = Math.max(0, Math.ceil(30 - ageDays));
    const isUrgent = daysLeft <= 5;

    return {
      daysLeft,
      isUrgent,
      ageDays: Math.floor(ageDays),
      formattedDate: isNaN(delDate.getTime()) ? deletedAt : delDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  // Filter and sort soft-deleted tasks
  const filteredTasks = useMemo(() => {
    let result = [...deletedTasks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const idMatch = t.id.toLowerCase().includes(q);
        const userMatch = (t.deletedByName || t.deletedBy || '').toLowerCase().includes(q);
        return titleMatch || descMatch || idMatch || userMatch;
      });
    }

    if (selectedProjectId !== 'all') {
      result = result.filter((t) => t.projectId === selectedProjectId);
    }

    if (selectedPriority !== 'all') {
      result = result.filter((t) => t.priority === selectedPriority);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'deleted_recent') {
        const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'deleted_oldest') {
        const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return timeA - timeB;
      }
      if (sortBy === 'purge_soon') {
        const infoA = getRetentionInfo(a.deletedAt);
        const infoB = getRetentionInfo(b.deletedAt);
        return infoA.daysLeft - infoB.daysLeft;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [deletedTasks, searchQuery, selectedProjectId, selectedPriority, sortBy]);

  // Handle select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkRestore = () => {
    if (selectedTaskIds.length === 0) return;
    bulkRestoreTasks(selectedTaskIds);
    setSelectedTaskIds([]);
  };

  const handleExecuteBulkPurge = () => {
    if (selectedTaskIds.length === 0) return;
    bulkPurgeTasks(selectedTaskIds);
    setSelectedTaskIds([]);
    setIsBulkPurgeModalOpen(false);
  };

  const handleTriggerAutoPurge = async () => {
    setIsPurging(true);
    setAutoPurgeMessage(null);
    try {
      const purgedCount = await purgeExpiredTasks();
      if (purgedCount > 0) {
        setAutoPurgeMessage(`Auto-purge completed: ${purgedCount} task(s) older than 30 days were permanently removed.`);
      } else {
        setAutoPurgeMessage(`Retention check complete: All ${deletedTasks.length} soft-deleted tasks are within the 30-day retention window.`);
      }
    } catch (err) {
      console.error(err);
      setAutoPurgeMessage('Auto-purge check encountered an error. Please try again.');
    } finally {
      setIsPurging(false);
      setTimeout(() => {
        setAutoPurgeMessage(null);
      }, 5000);
    }
  };

  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
      case 'Medium':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Overview Cards & Retention Policy Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Soft Deleted */}
        <div className={`p-5 rounded-2xl border ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tasks in Recycle Bin
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {deletedTasks.length}
            </span>
            <span className="text-xs text-slate-500">soft-deleted items</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Restorable at any time with full metadata and history intact.
          </p>
        </div>

        {/* 30-Day Auto Purge Policy */}
        <div className={`p-5 rounded-2xl border ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Auto-Purge Policy
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              30 Days
            </span>
            <span className="text-xs text-slate-500">retention window</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Items older than 30 days are automatically purged permanently.
          </p>
        </div>

        {/* Action / Maintenance Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recycle Bin Governance
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={handleTriggerAutoPurge}
              disabled={isPurging}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-[#1D2C3F] hover:bg-[#25374E] text-slate-200'
              }`}
              title="Runs retention algorithm to check and purge tasks older than 30 days"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isPurging ? 'animate-spin' : ''}`} />
              <span>{isPurging ? 'Scanning...' : 'Run Auto-Purge'}</span>
            </button>

            <button
              onClick={() => setIsEmptyModalOpen(true)}
              disabled={deletedTasks.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Bin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Purge Status Feedback */}
      {autoPurgeMessage && (
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{autoPurgeMessage}</span>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
      }`}>
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deleted tasks, ID, deleted by..."
              className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#0773BB] transition-all ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#0D1520] border-[#233549] text-white placeholder-slate-500'
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Space/Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#0773BB] ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
              }`}
            >
              <option value="all">All Projects / Spaces</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#0773BB] ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
              }`}
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#0773BB] ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
              }`}
            >
              <option value="deleted_recent">Recently Deleted</option>
              <option value="deleted_oldest">Oldest Deleted</option>
              <option value="purge_soon">Purge Due Soonest</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedTaskIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-400">
                {selectedTaskIds.length} task(s) selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkRestore}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 transition-all shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Selected</span>
              </button>
              <button
                onClick={() => setIsBulkPurgeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Permanently</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deleted Tasks Table View */}
      <div className={`border rounded-2xl overflow-hidden shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#111B27] border-[#233549] text-slate-400'
              }`}>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-400 text-teal-500 focus:ring-teal-400 cursor-pointer"
                  />
                </th>
                <th className="p-4">Task Details</th>
                <th className="p-4">Project / Space</th>
                <th className="p-4">Deleted By</th>
                <th className="p-4">Deleted At</th>
                <th className="p-4">Auto-Purge Countdown</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#233549] text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-3 shadow-inner">
                        <Trash2 className="w-6 h-6" />
                      </div>
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {searchQuery || selectedProjectId !== 'all' || selectedPriority !== 'all'
                          ? 'No matching deleted tasks found'
                          : 'Recycle Bin is Empty'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery || selectedProjectId !== 'all' || selectedPriority !== 'all'
                          ? 'Try resetting the search filters or view all projects.'
                          : 'When tasks are deleted, they will be preserved here for 30 days before permanent auto-purge.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const proj = projects.find((p) => p.id === task.projectId);
                  const retention = getRetentionInfo(task.deletedAt);
                  const isSelected = selectedTaskIds.includes(task.id);

                  return (
                    <tr
                      key={task.id}
                      className={`transition-colors ${
                        isSelected
                          ? isLight ? 'bg-teal-50/70' : 'bg-teal-950/20'
                          : isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1A2838]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTask(task.id)}
                          className="rounded border-slate-400 text-teal-500 focus:ring-teal-400 cursor-pointer"
                        />
                      </td>

                      {/* Task Details */}
                      <td className="p-4">
                        <div className="flex items-start gap-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {task.title}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${getPriorityBadgeClass(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span className="font-mono">{task.id}</span>
                              <span>•</span>
                              <span>Status prior to delete: <strong className="text-slate-400">{task.status}</strong></span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Project / Space */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <FolderKanban className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            {proj?.title || task.projectId}
                          </span>
                        </div>
                      </td>

                      {/* Deleted By */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {(task.deletedByName || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              {task.deletedByName || 'Workspace Admin'}
                            </div>
                            {task.deletedBy && (
                              <div className="text-[10px] font-mono text-slate-500">
                                {task.deletedBy}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Deleted At */}
                      <td className="p-4">
                        <div className="text-[11px]">
                          <div className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            {retention.formattedDate}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            {retention.ageDays === 0 ? 'Deleted today' : `${retention.ageDays} day(s) ago`}
                          </div>
                        </div>
                      </td>

                      {/* Auto-Purge Countdown */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                            retention.isUrgent
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                              : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{retention.daysLeft} day(s) left</span>
                          </span>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Details */}
                          <button
                            onClick={() => setPreviewTask(task)}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-[#233549] text-slate-300'
                            }`}
                            title="Inspect Task Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Restore Task */}
                          <button
                            onClick={() => restoreTask(task.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-500/15 hover:bg-teal-500/25 text-teal-400 border border-teal-500/30 transition-all cursor-pointer"
                            title="Restore Task to Active Status"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>

                          {/* Purge Task */}
                          <button
                            onClick={() => setTaskToPurge(task)}
                            className="p-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                            title="Permanently Purge"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PREVIEW DELETED TASK */}
      {previewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131E2B] border-[#233549] text-white'
          }`}>
            {/* Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182738] border-[#223548]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Soft-Deleted Task Inspection
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ID: {previewTask.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewTask(null)}
                className={`p-1.5 rounded-lg ${isLight ? 'hover:bg-slate-200' : 'hover:bg-[#223548]'}`}
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Title</label>
                <div className={`text-base font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {previewTask.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#223549]'}`}>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Priority</div>
                  <div className="text-xs font-bold text-amber-400 mt-0.5">{previewTask.priority}</div>
                </div>
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#223549]'}`}>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Status</div>
                  <div className="text-xs font-bold text-teal-400 mt-0.5">{previewTask.status}</div>
                </div>
              </div>

              {/* Deletion Details */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Deletion Audit Metadata</span>
                </div>
                <div className="text-xs space-y-1 text-slate-400">
                  <div><strong>Deleted By:</strong> {previewTask.deletedByName || 'Workspace Admin'} ({previewTask.deletedBy || 'usr_admin'})</div>
                  <div><strong>Deleted At:</strong> {getRetentionInfo(previewTask.deletedAt).formattedDate}</div>
                  <div><strong>Retention:</strong> {getRetentionInfo(previewTask.deletedAt).daysLeft} day(s) remaining before automatic database purge.</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</label>
                <div className={`p-3 rounded-xl border text-xs whitespace-pre-wrap mt-1 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0D1520] border-[#223549] text-slate-300'
                }`}>
                  {previewTask.description || 'No description provided.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182738] border-[#223548]'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setTaskToPurge(previewTask);
                  setPreviewTask(null);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/15 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Permanently</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTask(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    restoreTask(previewTask.id);
                    setPreviewTask(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE PURGE CONFIRMATION */}
      {taskToPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131E2B] border-[#233549] text-white'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-500">
                Permanently Purge Task?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This action is <strong className="text-rose-400">irreversible</strong>. The task &quot;{taskToPurge.title}&quot; and its subtasks, dependencies, and Firestore documents will be permanently erased.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskToPurge(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  purgeTask(taskToPurge.id);
                  setTaskToPurge(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Purge Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK PURGE CONFIRMATION */}
      {isBulkPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131E2B] border-[#233549] text-white'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-500">
                Purge {selectedTaskIds.length} Selected Tasks?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                You are about to permanently erase {selectedTaskIds.length} tasks from Firestore and memory. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkPurgeModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkPurge}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Bulk Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EMPTY RECYCLE BIN CONFIRMATION */}
      {isEmptyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131E2B] border-[#233549] text-white'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-500">
                Empty Recycle Bin?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This will permanently delete all <strong className="text-white">{deletedTasks.length} soft-deleted tasks</strong> in the system. None of these tasks will be recoverable.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmptyModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  emptyRecycleBin();
                  setIsEmptyModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Empty Entire Bin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
