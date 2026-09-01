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
  AlertCircle,
  Users,
  Shield,
  Building2,
  Mail,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Priority, User, Role } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

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
    deletedUsers,
    restoreUser,
    bulkRestoreUsers,
    purgeUser,
    bulkPurgeUsers,
    purgeExpiredUsers,
    projects,
    users,
    companies
  } = useApp();

  // Active Entity Tab in Recycle Bin: 'tasks' | 'users'
  const [activeEntityTab, setActiveEntityTab] = useState<'tasks' | 'users'>('users');

  // Search & Filter for Tasks
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [taskSortBy, setTaskSortBy] = useState<'deleted_recent' | 'deleted_oldest' | 'purge_soon' | 'title'>('deleted_recent');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [taskToPurge, setTaskToPurge] = useState<Task | null>(null);
  const [isEmptyTasksModalOpen, setIsEmptyTasksModalOpen] = useState(false);
  const [isBulkPurgeTasksModalOpen, setIsBulkPurgeTasksModalOpen] = useState(false);

  // Search & Filter for Users (180-Day Retention)
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userCompanyFilter, setUserCompanyFilter] = useState<string>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSortBy, setUserSortBy] = useState<'deleted_recent' | 'deleted_oldest' | 'purge_soon' | 'name'>('deleted_recent');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  const [userToPurge, setUserToPurge] = useState<User | null>(null);
  const [isBulkPurgeUsersModalOpen, setIsBulkPurgeUsersModalOpen] = useState(false);

  // System Action feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to calculate days remaining before 30-day task auto purge
  const getTaskRetentionInfo = (deletedAt?: string) => {
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

  // Helper to calculate days remaining before 180-day USER auto purge
  const getUserRetentionInfo = (deletedAt?: string) => {
    if (!deletedAt) {
      return { daysLeft: 180, isUrgent: false, formattedDate: 'Unknown' };
    }
    const delDate = new Date(deletedAt);
    const now = new Date();
    const ageMs = now.getTime() - delDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const daysLeft = Math.max(0, Math.ceil(180 - ageDays));
    const isUrgent = daysLeft <= 14;

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

  // Filter and sort soft-deleted tasks (30 days)
  const filteredTasks = useMemo(() => {
    let result = [...deletedTasks];

    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase().trim();
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

    result.sort((a, b) => {
      if (taskSortBy === 'deleted_recent') {
        const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return timeB - timeA;
      }
      if (taskSortBy === 'deleted_oldest') {
        const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return timeA - timeB;
      }
      if (taskSortBy === 'purge_soon') {
        const infoA = getTaskRetentionInfo(a.deletedAt);
        const infoB = getTaskRetentionInfo(b.deletedAt);
        return infoA.daysLeft - infoB.daysLeft;
      }
      if (taskSortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [deletedTasks, taskSearchQuery, selectedProjectId, selectedPriority, taskSortBy]);

  // Filter and sort soft-deleted users (180 days)
  const filteredUsers = useMemo(() => {
    let result = [...deletedUsers];

    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase().trim();
      result = result.filter((u) => {
        const nameMatch = (u.name || '').toLowerCase().includes(q);
        const emailMatch = (u.email || '').toLowerCase().includes(q);
        const deptMatch = (u.department || '').toLowerCase().includes(q);
        const roleMatch = (u.role || '').toLowerCase().includes(q);
        const deletedByMatch = (u.deletedByName || u.deletedBy || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || deptMatch || roleMatch || deletedByMatch;
      });
    }

    if (userCompanyFilter !== 'all') {
      result = result.filter((u) => u.companyId === userCompanyFilter);
    }

    if (userRoleFilter !== 'all') {
      result = result.filter((u) => u.role === userRoleFilter);
    }

    result.sort((a, b) => {
      if (userSortBy === 'deleted_recent') {
        const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return timeB - timeA;
      }
      if (userSortBy === 'deleted_oldest') {
        const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return timeA - timeB;
      }
      if (userSortBy === 'purge_soon') {
        const infoA = getUserRetentionInfo(a.deletedAt);
        const infoB = getUserRetentionInfo(b.deletedAt);
        return infoA.daysLeft - infoB.daysLeft;
      }
      if (userSortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return result;
  }, [deletedUsers, userSearchQuery, userCompanyFilter, userRoleFilter, userSortBy]);

  // Bulk Selection Handlers for Tasks
  const handleSelectAllTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Bulk Selection Handlers for Users
  const handleSelectAllUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // User Actions
  const handleRestoreUser = (userId: string) => {
    restoreUser(userId);
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    setFeedbackMessage('User account restored successfully. Active permissions reinstated.');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleBulkRestoreUsers = () => {
    if (selectedUserIds.length === 0) return;
    bulkRestoreUsers(selectedUserIds);
    setSelectedUserIds([]);
    setFeedbackMessage(`Successfully restored ${selectedUserIds.length} user account(s).`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleExecutePurgeUser = () => {
    if (!userToPurge) return;
    purgeUser(userToPurge.id);
    setSelectedUserIds((prev) => prev.filter((id) => id !== userToPurge.id));
    setUserToPurge(null);
    setFeedbackMessage(`Permanently erased user account "${userToPurge.name}".`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleExecuteBulkPurgeUsers = () => {
    if (selectedUserIds.length === 0) return;
    bulkPurgeUsers(selectedUserIds);
    setSelectedUserIds([]);
    setIsBulkPurgeUsersModalOpen(false);
    setFeedbackMessage(`Permanently erased ${selectedUserIds.length} user account(s) from database.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handlePurgeExpiredUsers = async () => {
    setIsProcessing(true);
    try {
      const count = await purgeExpiredUsers();
      if (count > 0) {
        setFeedbackMessage(`Auto-purged ${count} user(s) past the 180-day retention window.`);
      } else {
        setFeedbackMessage('No users found past the 180-day retention limit.');
      }
    } catch (e) {
      setFeedbackMessage('Auto-purge check completed.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // Task Actions
  const handleBulkRestoreTasks = () => {
    if (selectedTaskIds.length === 0) return;
    bulkRestoreTasks(selectedTaskIds);
    setSelectedTaskIds([]);
    setFeedbackMessage(`Restored ${selectedTaskIds.length} task(s).`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleExecuteBulkPurgeTasks = () => {
    if (selectedTaskIds.length === 0) return;
    bulkPurgeTasks(selectedTaskIds);
    setSelectedTaskIds([]);
    setIsBulkPurgeTasksModalOpen(false);
    setFeedbackMessage(`Permanently erased ${selectedTaskIds.length} task(s).`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handlePurgeExpiredTasks = async () => {
    setIsProcessing(true);
    try {
      const count = await purgeExpiredTasks();
      if (count > 0) {
        setFeedbackMessage(`Cleaned up ${count} task(s) exceeding 30 days retention.`);
      } else {
        setFeedbackMessage('All soft-deleted tasks are within the 30-day retention period.');
      }
    } catch (e) {
      setFeedbackMessage('Task retention scan completed.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* HEADER BANNER */}
      <div className={`border rounded-2xl p-6 shadow-sm relative overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Workspace Recycle Bin & Retention Governance
                </h1>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Soft-deleted users and tasks are safely held in retention before permanent database purge.
                </p>
              </div>
            </div>

            {/* Retention Policies Info Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium border ${
                isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>User Accounts Retention: <strong>180 Days</strong></span>
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium border ${
                isLight ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
              }`}>
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                <span>Tasks Retention: <strong>30 Days</strong></span>
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium border ${
                isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant 1-Click Restore Supported</span>
              </span>
            </div>
          </div>

          {/* Tab Navigation Switcher */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <div className={`p-1.5 rounded-2xl border flex items-center gap-1 ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <button
                onClick={() => setActiveEntityTab('users')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeEntityTab === 'users'
                    ? 'bg-[#0773BB] text-white shadow-md'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Deleted Users</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeEntityTab === 'users' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-500'
                }`}>
                  {deletedUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveEntityTab('tasks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeEntityTab === 'tasks'
                    ? 'bg-[#0773BB] text-white shadow-md'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Deleted Tasks</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeEntityTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-500'
                }`}>
                  {deletedTasks.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB: DELETED USERS (180-DAY RETENTION)                    */}
      {/* ========================================================= */}
      {activeEntityTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Controls Bar for Users */}
          <div className={`border rounded-2xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
          }`}>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search deleted user name, email, role..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#0773BB] transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-[#0D1520] border-[#233549] text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters:</span>
                </div>

                <select
                  value={userCompanyFilter}
                  onChange={(e) => setUserCompanyFilter(e.target.value)}
                  className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                  }`}
                >
                  <option value="all">All Tenant Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.domain})
                    </option>
                  ))}
                </select>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                  }`}
                >
                  <option value="all">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Team Member">Team Member</option>
                  <option value="Viewer">Viewer</option>
                </select>

                <select
                  value={userSortBy}
                  onChange={(e) => setUserSortBy(e.target.value as any)}
                  className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                  }`}
                >
                  <option value="deleted_recent">Deleted: Most Recent</option>
                  <option value="deleted_oldest">Deleted: Oldest</option>
                  <option value="purge_soon">Expiring / Purge Soonest</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions for Users */}
            <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight ? 'border-slate-200' : 'border-[#233549]'
            }`}>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                    onChange={handleSelectAllUsers}
                    className="rounded text-[#0773BB] focus:ring-[#0773BB] w-4 h-4 cursor-pointer"
                  />
                  <span>Select All ({filteredUsers.length})</span>
                </label>

                {selectedUserIds.length > 0 && (
                  <span className="font-semibold text-[#0773BB]">
                    {selectedUserIds.length} user(s) selected
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedUserIds.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkRestoreUsers}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Selected ({selectedUserIds.length})</span>
                    </button>

                    <button
                      onClick={() => setIsBulkPurgeUsersModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Purge Selected ({selectedUserIds.length})</span>
                    </button>
                  </>
                )}

                <button
                  onClick={handlePurgeExpiredUsers}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-[#0D1520] hover:bg-[#1C2C3D] text-slate-300 border-[#233549]'
                  }`}
                  title="Automatically sweep and clean up users soft-deleted over 180 days ago"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-amber-500' : 'text-slate-400'}`} />
                  <span>Sweep Expired (&gt;180 Days)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Deleted Users Table */}
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b font-bold tracking-wider uppercase text-[10px] ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#0D1520] border-[#233549] text-slate-400'
                  }`}>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                        onChange={handleSelectAllUsers}
                        className="rounded text-[#0773BB] focus:ring-[#0773BB] w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">User Profile & Email</th>
                    <th className="py-3 px-4">Role & Tenant Company</th>
                    <th className="py-3 px-4">Deleted By & Date</th>
                    <th className="py-3 px-4">180-Day Retention Countdown</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#233549]'}`}>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const retInfo = getUserRetentionInfo(u.deletedAt);
                      const isSelected = selectedUserIds.includes(u.id);
                      const userComp = companies.find((c) => c.id === u.companyId);

                      return (
                        <tr
                          key={u.id}
                          className={`transition-colors ${
                            isSelected
                              ? isLight ? 'bg-sky-50/70' : 'bg-[#0773BB]/10'
                              : isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1C2C3D]/50'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(u.id)}
                              className="rounded text-[#0773BB] focus:ring-[#0773BB] w-4 h-4 cursor-pointer"
                            />
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                name={u.name}
                                email={u.email}
                                role={u.role}
                                size="md"
                                theme={isLight ? 'light' : 'dark'}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                    {u.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold">
                                    In Recycle Bin
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {u.email}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Dept: {u.department || 'General'} • ID: {u.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div>
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  u.role === 'Admin'
                                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/30'
                                    : u.role === 'Project Manager'
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                }`}>
                                  {u.role}
                                </span>
                              </div>
                              <div className={`text-[11px] font-medium flex items-center gap-1 ${
                                isLight ? 'text-slate-700' : 'text-slate-300'
                              }`}>
                                <Building2 className="w-3 h-3 text-[#00AEA9]" />
                                <span>{userComp ? userComp.name : u.companyId}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                                <UserIcon className="w-3 h-3 text-slate-400" />
                                <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                                  {u.deletedByName || u.deletedBy || 'Administrator'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{retInfo.formattedDate}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                retInfo.isUrgent
                                  ? 'bg-rose-500/15 text-rose-500 border-rose-500/30 animate-pulse'
                                  : isLight
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{retInfo.daysLeft} days left</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                180-day retention window
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewUser(u)}
                                className={`p-1.5 rounded-lg text-xs transition-all border ${
                                  isLight
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                    : 'bg-[#0D1520] hover:bg-[#1C2C3D] text-slate-300 border-[#233549]'
                                }`}
                                title="Inspect User Information"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-500" />
                              </button>

                              <button
                                onClick={() => handleRestoreUser(u.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                                title="Restore User to Active Directory"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>

                              <button
                                onClick={() => setUserToPurge(u)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs transition-all cursor-pointer"
                                title="Permanently Erase User from Database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center mb-3">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>
                          No Deleted Users in Recycle Bin
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          When users are deactivated from the Admin Portal, they will be safely held here for 180 days before permanent cleanup.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={`p-3 border-t flex items-center justify-between text-xs ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0D1520] border-[#233549] text-slate-400'
            }`}>
              <div>
                Showing <strong>{filteredUsers.length}</strong> of <strong>{deletedUsers.length}</strong> soft-deleted user accounts
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                180-Day Automated Retention Governance
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: DELETED TASKS (30-DAY RETENTION)                     */}
      {/* ========================================================= */}
      {activeEntityTab === 'tasks' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Controls Bar for Tasks */}
          <div className={`border rounded-2xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
          }`}>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder="Search deleted task title, ID, author..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#0773BB] transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-[#0D1520] border-[#233549] text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters:</span>
                </div>

                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                  }`}
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                  }`}
                >
                  <option value="all">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  value={taskSortBy}
                  onChange={(e) => setTaskSortBy(e.target.value as any)}
                  className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                  }`}
                >
                  <option value="deleted_recent">Deleted: Most Recent</option>
                  <option value="deleted_oldest">Deleted: Oldest</option>
                  <option value="purge_soon">Purge: Expiring Soonest</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions for Tasks */}
            <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight ? 'border-slate-200' : 'border-[#233549]'
            }`}>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                    onChange={handleSelectAllTasks}
                    className="rounded text-[#0773BB] focus:ring-[#0773BB] w-4 h-4 cursor-pointer"
                  />
                  <span>Select All ({filteredTasks.length})</span>
                </label>

                {selectedTaskIds.length > 0 && (
                  <span className="font-semibold text-[#0773BB]">
                    {selectedTaskIds.length} task(s) selected
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedTaskIds.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkRestoreTasks}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Selected ({selectedTaskIds.length})</span>
                    </button>

                    <button
                      onClick={() => setIsBulkPurgeTasksModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Selected ({selectedTaskIds.length})</span>
                    </button>
                  </>
                )}

                <button
                  onClick={handlePurgeExpiredTasks}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-[#0D1520] hover:bg-[#1C2C3D] text-slate-300 border-[#233549]'
                  }`}
                  title="Sweep and purge tasks deleted over 30 days ago"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-amber-500' : 'text-slate-400'}`} />
                  <span>Sweep Expired (&gt;30 Days)</span>
                </button>

                {deletedTasks.length > 0 && (
                  <button
                    onClick={() => setIsEmptyTasksModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Empty Tasks Bin ({deletedTasks.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Deleted Tasks Table */}
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b font-bold tracking-wider uppercase text-[10px] ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#0D1520] border-[#233549] text-slate-400'
                  }`}>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                        onChange={handleSelectAllTasks}
                        className="rounded text-[#0773BB] focus:ring-[#0773BB] w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Task Details</th>
                    <th className="py-3 px-4">Project Space</th>
                    <th className="py-3 px-4">Deleted By & Date</th>
                    <th className="py-3 px-4">Retention Countdown</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#233549]'}`}>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((t) => {
                      const retInfo = getTaskRetentionInfo(t.deletedAt);
                      const isSelected = selectedTaskIds.includes(t.id);
                      const prj = projects.find((p) => p.id === t.projectId);

                      return (
                        <tr
                          key={t.id}
                          className={`transition-colors ${
                            isSelected
                              ? isLight ? 'bg-sky-50/70' : 'bg-[#0773BB]/10'
                              : isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1C2C3D]/50'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectTask(t.id)}
                              className="rounded text-[#0773BB] focus:ring-[#0773BB] w-4 h-4 cursor-pointer"
                            />
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                  {t.title}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500">#{t.id}</span>
                              </div>
                              {t.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                                  {t.description}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-xs">
                              <FolderKanban className="w-3.5 h-3.5 text-[#0773BB]" />
                              <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                {prj ? prj.title : t.projectId}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                                <UserIcon className="w-3 h-3 text-slate-400" />
                                <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                                  {t.deletedByName || t.deletedBy || 'Administrator'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{retInfo.formattedDate}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                retInfo.isUrgent
                                  ? 'bg-rose-500/15 text-rose-500 border-rose-500/30 animate-pulse'
                                  : isLight
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{retInfo.daysLeft} days left</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                30-day auto-purge policy
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewTask(t)}
                                className={`p-1.5 rounded-lg text-xs transition-all border ${
                                  isLight
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                    : 'bg-[#0D1520] hover:bg-[#1C2C3D] text-slate-300 border-[#233549]'
                                }`}
                                title="Preview Task Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-500" />
                              </button>

                              <button
                                onClick={() => {
                                  restoreTask(t.id);
                                  setSelectedTaskIds((prev) => prev.filter((id) => id !== t.id));
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                                title="Restore Task"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>

                              <button
                                onClick={() => setTaskToPurge(t)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs transition-all cursor-pointer"
                                title="Purge Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center mb-3">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>
                          Recycle Bin is Empty
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          No soft-deleted tasks found. Deleted tasks remain recoverable here for 30 days.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS SECTION                                            */}
      {/* ========================================================= */}

      {/* MODAL: PREVIEW USER DETAILS */}
      {previewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131E2B] border-[#233549] text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#233549]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">User Account in Retention</h3>
                  <p className="text-xs text-slate-400">180-Day Soft-Delete Status</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0D1520] border border-slate-200 dark:border-[#233549]">
                <UserAvatar
                  name={previewUser.name}
                  email={previewUser.email}
                  role={previewUser.role}
                  size="lg"
                  theme={isLight ? 'light' : 'dark'}
                />
                <div>
                  <h4 className="font-bold text-sm">{previewUser.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">{previewUser.email}</p>
                  <p className="text-[11px] text-[#0773BB] font-semibold">{previewUser.role} • {previewUser.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1520] border border-slate-200 dark:border-[#233549]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Moved to Bin By</span>
                  <span className="font-semibold">{previewUser.deletedByName || previewUser.deletedBy || 'Admin'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1520] border border-slate-200 dark:border-[#233549]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Deletion Date</span>
                  <span className="font-semibold">{getUserRetentionInfo(previewUser.deletedAt).formattedDate}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1520] border border-slate-200 dark:border-[#233549]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Retention Policy</span>
                  <span className="font-bold text-amber-500">180 Days Preservation</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1520] border border-slate-200 dark:border-[#233549]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Time Remaining</span>
                  <span className="font-bold text-rose-500">{getUserRetentionInfo(previewUser.deletedAt).daysLeft} Days</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#233549]">
              <button
                onClick={() => setPreviewUser(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleRestoreUser(previewUser.id);
                  setPreviewUser(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore User Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE USER PERMANENT PURGE */}
      {userToPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131E2B] border-[#233549] text-white'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-500">
                Permanently Purge User Account?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                You are about to permanently erase <strong className="text-white">{userToPurge.name} ({userToPurge.email})</strong> from the database. This action is <strong>irreversible</strong> and cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToPurge(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePurgeUser}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Permanently Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK USERS PERMANENT PURGE */}
      {isBulkPurgeUsersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131E2B] border-[#233549] text-white'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-500">
                Purge {selectedUserIds.length} Selected User Accounts?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                You are about to permanently erase {selectedUserIds.length} user accounts from the tenant database. All authentication records will be erased irreversibly.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkPurgeUsersModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkPurgeUsers}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Bulk Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE TASK PURGE */}
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
                Task <strong className="text-white">"{taskToPurge.title}"</strong> (#{taskToPurge.id}) will be permanently erased. This cannot be undone.
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
                <span>Yes, Purge Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK TASK PURGE */}
      {isBulkPurgeTasksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131E2B] border-[#233549] text-white'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-500">
                Purge {selectedTaskIds.length} Selected Tasks?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                You are about to permanently erase {selectedTaskIds.length} tasks from Firestore.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkPurgeTasksModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkPurgeTasks}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Bulk Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EMPTY TASKS BIN */}
      {isEmptyTasksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131E2B] border-[#233549] text-white'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-500">
                Empty Tasks Recycle Bin?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This will permanently delete all <strong className="text-white">{deletedTasks.length} soft-deleted tasks</strong> in the system.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmptyTasksModalOpen(false)}
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
                  setIsEmptyTasksModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Empty Tasks Bin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
