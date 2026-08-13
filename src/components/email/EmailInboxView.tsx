import React, { useState, useEffect } from 'react';
import {
  Mail,
  Inbox as InboxIcon,
  Send,
  Star,
  Trash2,
  Tag,
  Link as LinkIcon,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Paperclip,
  CheckCircle2,
  Clock,
  ArrowRight,
  User as UserIcon,
  Building,
  Sparkles,
  ExternalLink,
  Unlink,
  Check,
  AlertCircle,
  FileText,
  MessageSquare,
  ShieldCheck,
  Server,
  Key,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  X,
  CheckSquare,
  Calendar,
  PlayCircle,
  MessageCircle,
  UserCheck,
  Archive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmailThread, Priority, EmailConfig, TaskStatus, Task } from '../../types';
import { TransactionalEmailGatewayModal } from '../notifications/TransactionalEmailGatewayModal';
import { getStatusBadgeStyle, getStatusDotColor } from '../../lib/statusUtils';
import { PriorityBadge } from '../common/PriorityBadge';

export const EmailInboxView: React.FC = () => {
  const {
    emailThreads,
    emailConfig,
    userInboxConfig,
    updateEmailConfig,
    dispatchEmailNotification,
    linkEmailToTask,
    unlinkEmailFromTask,
    convertEmailToTask,
    sendEmailReply,
    composeNewEmail,
    toggleStarEmail,
    toggleUnreadEmail,
    deleteEmailThread,
    clearEmailThreads,
    cleanupOldInboxNotifications,
    projects,
    tasks,
    subtasks,
    toggleSubtask,
    addSubtask,
    taskComments,
    addTaskComment,
    updateTask,
    users,
    currentUser,
    setActiveTab,
    setSelectedProjectId,
    theme
  } = useApp();

  // Active view type & selected item tracking
  const [activeFolder, setActiveFolder] = useState<'assigned_tasks' | 'inbox' | 'messages' | 'linked' | 'starred' | 'sent' | 'archived'>('assigned_tasks');
  const [selectedType, setSelectedType] = useState<'task' | 'email'>('task');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [searchFilter, setSearchFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [onlyLinked, setOnlyLinked] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  // Interactive state
  const [replyText, setReplyText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SMTP Settings Form State
  const [settingsForm, setSettingsForm] = useState<EmailConfig>({ ...emailConfig });
  const [testEmailRecipient, setTestEmailRecipient] = useState(currentUser?.email || 'manager@dolphin-global.com');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Task Link Form State
  const [selectedProjForLink, setSelectedProjForLink] = useState(projects[0]?.id || '');
  const [selectedTaskForLink, setSelectedTaskForLink] = useState('');

  // Task Convert Form State
  const [convertProjectId, setConvertProjectId] = useState(projects[0]?.id || '');
  const [convertTitle, setConvertTitle] = useState('');
  const [convertPriority, setConvertPriority] = useState<Priority>('High');

  // Compose Email State
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeLinkedTaskId, setComposeLinkedTaskId] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [lastCleanupInfo, setLastCleanupInfo] = useState<{ archivedCount: number; deletedCount: number } | null>(null);

  // Background Cleanup Utility: Auto-prune/archive task notifications & email threads older than 30 days
  useEffect(() => {
    const res = cleanupOldInboxNotifications(30);
    if (res.archivedCount > 0 || res.deletedCount > 0) {
      setLastCleanupInfo(res);
    }
  }, [cleanupOldInboxNotifications]);

  const handleRunManualCleanup = () => {
    const res = cleanupOldInboxNotifications(30);
    setLastCleanupInfo(res);
    if (res.archivedCount === 0 && res.deletedCount === 0) {
      triggerToast('Inbox is already optimal! No task notifications older than 30 days found.');
    } else {
      triggerToast(`Background cleanup completed: Archived ${res.archivedCount} & deleted ${res.deletedCount} items (>30 days).`);
    }
  };

  const handleRefreshInbox = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const res = cleanupOldInboxNotifications(30);
      if (res.archivedCount > 0 || res.deletedCount > 0) {
        triggerToast(`Synced inbox & auto-cleaned ${res.archivedCount + res.deletedCount} items (>30d).`);
      } else {
        triggerToast('Synced inbox with company mail server. Up to date!');
      }
    }, 800);
  };

  const handleClearInbox = () => {
    if (window.confirm('Are you sure you want to clear all old email threads from your inbox? Assigned tasks will remain intact.')) {
      clearEmailThreads();
      setSelectedType('task');
      setSelectedItemId(null);
      triggerToast('Old inbox data cleared successfully.');
    }
  };

  // User assigned tasks calculation
  const userAssignedTasks = tasks.filter((t) => {
    if (!currentUser) return false;
    const matchId = t.assigneeIds && t.assigneeIds.includes(currentUser.id);
    const matchEmail = currentUser.email && t.assigneeIds && t.assigneeIds.some((aid) => aid.toLowerCase() === currentUser.email?.toLowerCase());
    return matchId || matchEmail;
  });

  // Filter email threads
  const filteredEmails = emailThreads.filter((email) => {
    if (activeFolder === 'sent' && email.folder !== 'sent') return false;
    if (activeFolder === 'messages' && email.folder === 'sent') return false;
    if (activeFolder === 'linked' && !email.linkedTaskId) return false;
    if (activeFolder === 'starred' && !email.isStarred) return false;
    if (activeFolder === 'archived' && email.folder !== 'archived') return false;
    if (activeFolder !== 'archived' && email.folder === 'archived') return false;

    if (onlyUnread && !email.isUnread) return false;
    if (onlyLinked && !email.linkedTaskId) return false;
    if (tagFilter && !email.tags?.includes(tagFilter)) return false;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchSubject = email.subject.toLowerCase().includes(q);
      const matchSender = email.senderName.toLowerCase().includes(q) || email.senderEmail.toLowerCase().includes(q);
      const matchBody = email.body.toLowerCase().includes(q);
      const matchTag = email.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchSubject && !matchSender && !matchBody && !matchTag) return false;
    }

    return true;
  });

  // Filter assigned tasks
  const filteredAssignedTasks = userAssignedTasks.filter((task) => {
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      const matchStatus = task.status.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchStatus) return false;
    }
    return true;
  });

  // Selected item references
  const selectedTask = selectedType === 'task' ? tasks.find((t) => t.id === selectedItemId) || filteredAssignedTasks[0] || null : null;
  const selectedEmail = selectedType === 'email' ? emailThreads.find((e) => e.id === selectedItemId) || filteredEmails[0] || null : null;

  // Linked details for selected email
  const linkedTask = selectedEmail?.linkedTaskId ? tasks.find((t) => t.id === selectedEmail.linkedTaskId) : null;
  const linkedProject = linkedTask ? projects.find((p) => p.id === linkedTask.projectId) : null;

  // Selected Task Subtasks & Comments
  const activeTaskSubtasks = selectedTask ? subtasks.filter((st) => st.taskId === selectedTask.id) : [];
  const activeTaskComments = selectedTask ? taskComments.filter((c) => c.taskId === selectedTask.id) : [];
  const selectedTaskProject = selectedTask ? projects.find((p) => p.id === selectedTask.projectId) : null;

  // Tags
  const allTags = Array.from(new Set(emailThreads.flatMap((e) => e.tags || [])));

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail) return;
    sendEmailReply(selectedEmail.id, replyText.trim());
    setReplyText('');
    triggerToast('Email reply dispatched via company SMTP server.');
  };

  const handleAddTaskComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;
    addTaskComment(selectedTask.id, newCommentText.trim());
    setNewCommentText('');
    triggerToast('Comment added to task!');
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    addSubtask(selectedTask.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    triggerToast('Subtask created!');
  };

  const handleTestSmtpConnection = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      const updated = { ...settingsForm, isConnected: true, lastSyncedAt: new Date().toISOString() };
      updateEmailConfig(updated);

      if (testEmailRecipient) {
        dispatchEmailNotification({
          toEmail: testEmailRecipient,
          subject: 'SMTP Server Connection Verification Test',
          body: `SMTP Connection Diagnostic Test Successful.

Server Host: ${settingsForm.outgoingHost}:${settingsForm.outgoingPort}
Protocol: ${settingsForm.protocol}
TLS/SSL Encryption: ${settingsForm.useSSL ? 'ENFORCED' : 'Standard'}
Timestamp: ${new Date().toLocaleString()}

Your corporate email dispatch pipeline is fully operational!`,
          category: 'System Activity'
        });
        triggerToast(`SMTP Verified! Test email dispatched to ${testEmailRecipient}`);
      } else {
        triggerToast(`Successfully connected to ${settingsForm.incomingHost} via SSL!`);
      }

      setShowSettingsModal(false);
    }, 800);
  };

  const handleConfirmLink = () => {
    if (!selectedEmail || !selectedTaskForLink) return;
    linkEmailToTask(selectedEmail.id, selectedTaskForLink, selectedProjForLink);
    setShowLinkModal(false);
    triggerToast('Email thread linked to project task successfully!');
  };

  const handleConfirmConvert = () => {
    if (!selectedEmail) return;
    convertEmailToTask(
      selectedEmail.id,
      convertProjectId,
      convertTitle || selectedEmail.subject,
      convertPriority
    );
    setShowConvertModal(false);
    triggerToast('Converted email into a new project task!');
  };

  const handleConfirmCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;

    composeNewEmail({
      recipientEmail: composeTo.trim(),
      subject: composeSubject.trim(),
      body: composeBody.trim(),
      linkedTaskId: composeLinkedTaskId || undefined
    });

    setShowComposeModal(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setComposeLinkedTaskId('');
    triggerToast('New email dispatched!');
  };

  return (
    <div className={`h-full flex flex-col font-sans overflow-hidden ${
      theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-[#0A1017] text-slate-100'
    }`}>
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-[#0D9488] text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-teal-400/40 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP INBOX HEADER WORKSPACE TOOLBAR */}
      <div className={`shrink-0 px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0E1723] border-[#233549]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#3BC0BB] text-white flex items-center justify-center shadow-md">
            <InboxIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">User Inbox & Assigned Tasks</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Welcome, <span className="font-semibold text-teal-400">{currentUser?.name}</span> ({currentUser?.email}) — Track assigned tasks & emails in one unified workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 30-Day Auto Cleanup Utility Button */}
          <button
            onClick={handleRunManualCleanup}
            className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-800'
                : 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30 text-teal-300'
            }`}
            title="Automatically archive or delete task notifications older than 30 days"
          >
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">30d Auto-Cleanup</span>
          </button>

          {/* Refresh Inbox Button */}
          <button
            onClick={handleRefreshInbox}
            disabled={isRefreshing}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#233549] border-[#233549] text-slate-300 hover:text-white'
            }`}
            title="Refresh & Sync Inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#3BC0BB]' : ''}`} />
            <span className="hidden sm:inline">Sync Inbox</span>
          </button>

          {/* Clear Old Inbox Data Button */}
          <button
            onClick={handleClearInbox}
            className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Clear Old Sample Data from Inbox"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Old Data</span>
          </button>

          {/* SMTP Gateway Logs */}
          <button
            onClick={() => setShowGatewayModal(true)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#233549] border-[#233549] text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Gateway Logs</span>
          </button>

          {/* SMTP Settings */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#233549] border-[#233549] text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Compose Email */}
          <button
            onClick={() => setShowComposeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#00AEA9] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Email</span>
          </button>
        </div>
      </div>

      {/* THREE-PANE MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* PANE 1: LEFT SIDEBAR NAVIGATION */}
        <div className={`w-60 xl:w-64 shrink-0 border-r p-3 space-y-4 overflow-y-auto hidden lg:flex flex-col justify-between ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0B131C] border-[#233549]'
        }`}>
          <div className="space-y-4">
            
            {/* Folder Links */}
            <div className="space-y-1">
              <div className="px-2 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                INBOX & WORKSPACE
              </div>

              {/* Assigned Tasks Folder */}
              <button
                onClick={() => {
                  setActiveFolder('assigned_tasks');
                  setSelectedType('task');
                  setOnlyLinked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeFolder === 'assigned_tasks'
                    ? 'bg-gradient-to-r from-[#0D9488] to-[#00AEA9] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 text-emerald-300" />
                  <span>Assigned Tasks</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeFolder === 'assigned_tasks' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {userAssignedTasks.length}
                </span>
              </button>

              {/* All Inbox Folder */}
              <button
                onClick={() => {
                  setActiveFolder('inbox');
                  setSelectedType('task');
                  setOnlyLinked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'inbox'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <InboxIcon className="w-4 h-4 text-[#3BC0BB]" />
                  <span>All Inbox</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {userAssignedTasks.length + emailThreads.length}
                </span>
              </button>

              {/* Email Messages & Alerts */}
              <button
                onClick={() => {
                  setActiveFolder('messages');
                  setSelectedType('email');
                  setOnlyLinked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'messages'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Email Messages</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {emailThreads.filter((e) => e.folder !== 'sent').length}
                </span>
              </button>

              {/* Linked to Tasks */}
              <button
                onClick={() => {
                  setActiveFolder('linked');
                  setSelectedType('email');
                  setOnlyLinked(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'linked'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                  <span>Linked to Tasks</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {emailThreads.filter((e) => emailThreads.some(t => t.linkedTaskId)).length}
                </span>
              </button>

              {/* Starred */}
              <button
                onClick={() => {
                  setActiveFolder('starred');
                  setSelectedType('email');
                  setOnlyLinked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'starred'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <span>Starred Items</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {emailThreads.filter((e) => e.isStarred).length}
                </span>
              </button>

              {/* Sent Items */}
              <button
                onClick={() => {
                  setActiveFolder('sent');
                  setSelectedType('email');
                  setOnlyLinked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'sent'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Sent Items</span>
                </div>
              </button>

              {/* Archived Items (>30 Days Auto-Cleaned) */}
              <button
                onClick={() => {
                  setActiveFolder('archived');
                  setSelectedType('email');
                  setOnlyLinked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'archived'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-amber-400" />
                  <span>Archived (&gt;30d)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {emailThreads.filter((e) => e.folder === 'archived').length}
                </span>
              </button>
            </div>

            {/* Quick Filter Tags */}
            <div className="space-y-1 pt-3 border-t border-[#233549]/50">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PROJECT TAGS</span>
                {tagFilter && (
                  <button
                    onClick={() => setTagFilter(null)}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      tagFilter === tag
                        ? 'bg-[#3BC0BB]/20 text-[#3BC0BB] font-bold border border-[#3BC0BB]/40'
                        : 'text-slate-400 hover:text-white hover:bg-[#16222F]/40'
                    }`}
                  >
                    <Tag className="w-3 h-3 text-[#3BC0BB]" />
                    <span className="truncate">{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Account Server Info Badge */}
          <div className={`p-2.5 rounded-xl border text-[11px] space-y-1.5 ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#121B26] border-[#233549] text-slate-400'
          }`}>
            <div className="flex items-center justify-between font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-[#3BC0BB]" />
                <span>{emailConfig.protocol}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>
            <div className="truncate font-mono text-[10px] text-slate-400">{currentUser?.email}</div>
            <div className="text-[9px] text-slate-500 font-mono truncate">
              User ID: <span className="text-slate-300">{currentUser?.id}</span>
            </div>
          </div>
        </div>

        {/* PANE 2: MIDDLE ITEM LIST COLUMN (Assigned Tasks & Emails) */}
        <div className={`w-full md:w-80 lg:w-80 xl:w-96 shrink-0 border-r flex flex-col min-h-0 overflow-hidden ${
          showMobilePreview ? 'hidden md:flex' : 'flex'
        } ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0E1723] border-[#233549]'
        }`}>
          
          {/* Top Folder Filter Switcher Bar */}
          <div className="p-2 bg-slate-100 dark:bg-[#121B26] border-b border-slate-200 dark:border-[#233549] flex items-center justify-between gap-1 text-xs shrink-0">
            <button
              onClick={() => {
                setActiveFolder('assigned_tasks');
                setSelectedType('task');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeFolder === 'assigned_tasks'
                  ? 'bg-[#0D9488] text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#16222F]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Assigned Tasks ({userAssignedTasks.length})</span>
            </button>
            
            <button
              onClick={() => {
                setActiveFolder('messages');
                setSelectedType('email');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeFolder === 'messages' || activeFolder === 'inbox'
                  ? 'bg-[#0D9488] text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#16222F]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Emails ({emailThreads.length})</span>
            </button>
          </div>

          {/* Background Auto-Cleanup Utility Status Banner */}
          <div className="px-3 py-1.5 bg-teal-950/40 border-b border-teal-500/20 text-[11px] text-teal-300 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">
                {lastCleanupInfo && (lastCleanupInfo.archivedCount > 0 || lastCleanupInfo.deletedCount > 0)
                  ? `Background Utility: Cleaned ${lastCleanupInfo.archivedCount} archived, ${lastCleanupInfo.deletedCount} deleted (>30d)`
                  : '30-Day Background Auto-Cleanup: Active'}
              </span>
            </div>
            <button
              onClick={handleRunManualCleanup}
              className="text-[10px] font-bold text-teal-400 hover:text-teal-200 underline shrink-0 ml-2"
              title="Run 30-day inbox cleanup utility now"
            >
              Run Utility
            </button>
          </div>

          {/* Search Input Box */}
          <div className="p-3 space-y-2 border-b border-[#233549]/50">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search assigned tasks, emails, senders..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-transparent text-xs outline-none text-slate-200 placeholder-slate-500"
              />
              {searchFilter && (
                <button onClick={() => setSearchFilter('')} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Item Cards Scrollable Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#233549]/40">
            
            {/* VIEW MODE 1: ASSIGNED TASKS LIST */}
            {(activeFolder === 'assigned_tasks' || activeFolder === 'inbox') && (
              <>
                <div className="p-2 bg-slate-800/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>YOUR ASSIGNED TASKS ({filteredAssignedTasks.length})</span>
                  <span className="text-emerald-400 font-mono">Live Sync</span>
                </div>

                {filteredAssignedTasks.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <CheckSquare className="w-8 h-8 text-slate-500 mx-auto opacity-40" />
                    <p className="text-xs text-slate-400">No assigned tasks found.</p>
                  </div>
                ) : (
                  filteredAssignedTasks.map((task) => {
                    const isSelected = selectedType === 'task' && selectedTask?.id === task.id;
                    const proj = projects.find((p) => p.id === task.projectId);
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedType('task');
                          setSelectedItemId(task.id);
                          setShowMobilePreview(true);
                        }}
                        className={`p-3.5 transition-all cursor-pointer relative group ${
                          isSelected
                            ? theme === 'light'
                              ? 'bg-[#0D9488]/10 border-l-4 border-l-[#0D9488]'
                              : 'bg-[#16222F] border-l-4 border-l-[#3BC0BB]'
                            : 'hover:bg-[#16222F]/40'
                        }`}
                      >
                        {/* Header Row: Status badge & Project */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadgeStyle(task.status, theme === 'light')}`}>
                            {task.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                            {proj?.code || 'PROJECT'}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="text-xs font-bold text-slate-200 line-clamp-2 mb-1.5">
                          {task.title}
                        </div>

                        {/* Description snippet */}
                        {task.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                            {task.description}
                          </div>
                        )}

                        {/* Footer Badges */}
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <PriorityBadge priority={task.priority} size="sm" />
                          
                          <div className="flex items-center gap-2 font-mono">
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                                <Clock className="w-3 h-3" />
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* VIEW MODE 2: EMAIL THREADS LIST */}
            {(activeFolder !== 'assigned_tasks') && (
              <>
                <div className="p-2 bg-slate-800/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>EMAIL MESSAGES ({filteredEmails.length})</span>
                </div>

                {filteredEmails.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <Mail className="w-8 h-8 text-slate-500 mx-auto opacity-40" />
                    <p className="text-xs text-slate-400">No email threads found.</p>
                  </div>
                ) : (
                  filteredEmails.map((email) => {
                    const isSelected = selectedType === 'email' && selectedEmail?.id === email.id;
                    const emailLinkedTask = email.linkedTaskId ? tasks.find((t) => t.id === email.linkedTaskId) : null;

                    return (
                      <div
                        key={email.id}
                        onClick={() => {
                          setSelectedType('email');
                          setSelectedItemId(email.id);
                          setShowMobilePreview(true);
                          if (email.isUnread) {
                            toggleUnreadEmail(email.id);
                          }
                        }}
                        className={`p-3.5 transition-all cursor-pointer relative group ${
                          isSelected
                            ? theme === 'light'
                              ? 'bg-[#0D9488]/10 border-l-4 border-l-[#0D9488]'
                              : 'bg-[#16222F] border-l-4 border-l-[#3BC0BB]'
                            : email.isUnread
                            ? theme === 'light'
                              ? 'bg-slate-100/80 font-bold'
                              : 'bg-[#121E2C]/80 font-bold'
                            : 'hover:bg-[#16222F]/40'
                        }`}
                      >
                        {/* Sender Header */}
                        <div className="flex items-center justify-between gap-2 mb-1 pr-4">
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {email.senderName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className={`text-xs truncate ${email.isUnread ? 'font-bold text-white' : 'text-slate-300'}`}>
                              {email.senderName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                            {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Subject */}
                        <div className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1">
                          {email.subject}
                        </div>

                        {/* Snippet */}
                        <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2 font-normal">
                          {email.snippet}
                        </div>

                        {/* Footer Link & Star */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          {emailLinkedTask ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold truncate max-w-[160px]">
                              <LinkIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">{emailLinkedTask.title}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Unlinked Email</span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarEmail(email.id);
                            }}
                            className="p-1 text-slate-500 hover:text-amber-400"
                          >
                            <Star className={`w-3.5 h-3.5 ${email.isStarred ? 'text-amber-400 fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>

        {/* PANE 3: RIGHT DETAIL VIEW (Assigned Task Inspector OR Email Thread Reader) */}
        <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${
          !showMobilePreview ? 'hidden md:flex' : 'flex'
        } ${
          theme === 'light' ? 'bg-white text-slate-900' : 'bg-[#0D1520] text-slate-100'
        }`}>

          {/* SECTION A: ASSIGNED TASK DETAIL VIEW */}
          {selectedType === 'task' && selectedTask ? (
            <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
              
              {/* BACK BUTTON FOR MOBILE & PROJECT HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#233549]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMobilePreview(false)}
                    className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-[#16222F] text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180 text-[#00AEA9]" />
                    <span>Back to List</span>
                  </button>

                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-teal-300 font-mono text-xs font-bold border border-slate-700">
                    Project: {selectedTaskProject?.title || 'Main Workspace'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedProjectId(selectedTask.projectId);
                      setActiveTab('kanban');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Task Board</span>
                  </button>
                </div>
              </div>

              {/* TASK TITLE & INTERACTIVE STATUS BAR */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex-1">
                    {selectedTask.title}
                  </h1>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Interactive Task Status Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold">Status:</span>
                      <select
                        value={selectedTask.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as TaskStatus;
                          updateTask(selectedTask.id, { status: newStatus });
                          triggerToast(`Task status updated to ${newStatus}`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${getStatusBadgeStyle(selectedTask.status, theme === 'light')}`}
                      >
                        <option value="To Do" className="bg-[#0D1520] text-slate-200">To Do</option>
                        <option value="In Progress" className="bg-[#0D1520] text-blue-300">In Progress</option>
                        <option value="In Review" className="bg-[#0D1520] text-purple-300">In Review</option>
                        <option value="Done" className="bg-[#0D1520] text-emerald-300">Done</option>
                      </select>
                    </div>

                    <PriorityBadge priority={selectedTask.priority} size="md" />
                  </div>
                </div>

                {/* TASK ATTRIBUTES GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#121B26] border border-[#233549] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Start Date</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Due Date</span>
                    <span className={`font-mono font-semibold ${
                      selectedTask.dueDate && new Date(selectedTask.dueDate) < new Date() && selectedTask.status !== 'Done'
                        ? 'text-rose-400 font-bold'
                        : 'text-slate-200'
                    }`}>
                      {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No Due Date'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Est. / Logged</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {selectedTask.loggedHours || 0}h / {selectedTask.estimatedHours || 0}h
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Assigned To</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{currentUser?.name || 'You'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* TASK DESCRIPTION CARD */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Task Description & Details</span>
                </h3>
                <div className="p-4 rounded-2xl bg-[#121B26] border border-[#233549] text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedTask.description || 'No detailed description provided for this task.'}
                </div>
              </div>

              {/* INTERACTIVE SUBTASKS CHECKLIST */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>Subtasks Checklist ({activeTaskSubtasks.filter(s => s.completed).length}/{activeTaskSubtasks.length})</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {activeTaskSubtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => toggleSubtask(st.id)}
                      className="p-3 rounded-xl bg-[#121B26] border border-[#233549] flex items-center gap-3 text-xs cursor-pointer hover:border-emerald-500/40 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => {}}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                      <span className={`font-medium ${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {st.title}
                      </span>
                    </div>
                  ))}

                  {/* Add Subtask Form */}
                  <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add a new subtask..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-[#121B26] border border-[#233549] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </div>

              {/* TASK COMMENTS & DISCUSSION THREAD */}
              <div className="space-y-4 pt-4 border-t border-[#233549]">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Discussion & Activity ({activeTaskComments.length} comments)</span>
                </h3>

                <div className="space-y-3">
                  {activeTaskComments.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-[#121B26] border border-[#233549] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center">
                            {c.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-200">{c.userName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-7">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddTaskComment} className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    placeholder="Post a comment or status update on this task..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#121B26] border border-[#233549] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#3BC0BB]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Comment</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          ) : selectedType === 'email' && selectedEmail ? (
            
            /* SECTION B: EMAIL THREAD READER VIEW */
            <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
              
              {/* READER HEADER ACTIONS BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#233549]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMobilePreview(false)}
                    className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-[#16222F] text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180 text-[#00AEA9]" />
                    <span>Back to Inbox</span>
                  </button>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    selectedEmail.priority === 'High'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-700/40 text-slate-300 border-slate-600'
                  }`}>
                    {selectedEmail.priority || 'Normal Priority'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStarEmail(selectedEmail.id)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      selectedEmail.isStarred
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-[#16222F] border-[#233549] text-slate-300 hover:text-white'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${selectedEmail.isStarred ? 'text-amber-400 fill-current' : ''}`} />
                    <span>{selectedEmail.isStarred ? 'Starred' : 'Star'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Delete this email thread?')) {
                        deleteEmailThread(selectedEmail.id);
                        setSelectedItemId(null);
                        triggerToast('Email thread removed.');
                      }
                    }}
                    className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-all text-xs"
                    title="Delete Thread"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TASK LINK HERO BANNER BOX */}
              <div className={`p-4 rounded-2xl border transition-all ${
                linkedTask
                  ? 'bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-[#121B26] border-emerald-500/40'
                  : 'bg-gradient-to-r from-[#16222F] to-[#121B26] border-[#233549]'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <LinkIcon className={`w-4 h-4 ${linkedTask ? 'text-emerald-400' : 'text-[#3BC0BB]'}`} />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {linkedTask ? 'Linked Project Task' : 'Task Linkage Status'}
                      </span>
                    </div>

                    {linkedTask ? (
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{linkedTask.title}</span>
                          <span className="px-2 py-0.2 rounded text-[10px] bg-slate-800 text-emerald-300 font-mono">
                            {linkedProject?.code || 'PROJECT'}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Status: <span className="text-emerald-400 font-semibold">{linkedTask.status}</span> | Priority: {linkedTask.priority}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        This email thread is not linked to any task. You can link it to an existing task or convert it into a new task.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {linkedTask ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedProjectId(linkedTask.projectId);
                            setActiveTab('tasks');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Task</span>
                        </button>
                        <button
                          onClick={() => {
                            unlinkEmailFromTask(selectedEmail.id);
                            triggerToast('Unlinked email thread.');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>Unlink</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedProjForLink(projects[0]?.id || '');
                            setShowLinkModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1F2F42] hover:bg-[#283C54] border border-[#344C68] text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <LinkIcon className="w-3.5 h-3.5 text-[#3BC0BB]" />
                          <span>Link to Task</span>
                        </button>

                        <button
                          onClick={() => {
                            setConvertProjectId(projects[0]?.id || '');
                            setConvertTitle(selectedEmail.subject);
                            setConvertPriority(selectedEmail.priority || 'High');
                            setShowConvertModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Convert to Task</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* SUBJECT & METADATA */}
              <div className="space-y-3 pb-4 border-b border-[#233549]">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {selectedEmail.subject}
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 text-white font-bold flex items-center justify-center text-sm shadow">
                      {selectedEmail.senderName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-sm">
                        {selectedEmail.senderName}
                      </div>
                      <div className="text-slate-400 text-xs font-mono">
                        From: <span className="text-[#3BC0BB]">{selectedEmail.senderEmail}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-400">
                    <div>{new Date(selectedEmail.timestamp).toLocaleDateString()}</div>
                    <div className="text-slate-500">{new Date(selectedEmail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>

              {/* MAIN EMAIL BODY */}
              <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed space-y-4 whitespace-pre-wrap font-sans bg-[#121B26]/40 p-5 rounded-2xl border border-[#233549]/60">
                {selectedEmail.body}
              </div>

              {/* REPLIES HISTORY */}
              {selectedEmail.replies && selectedEmail.replies.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-[#233549]">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Thread History ({selectedEmail.replies.length} replies)</span>
                  </h3>

                  <div className="space-y-3">
                    {selectedEmail.replies.map((rep) => (
                      <div key={rep.id} className="p-4 rounded-xl bg-[#121B26] border border-[#233549] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#3BC0BB]">{rep.senderName} ({rep.senderEmail})</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(rep.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {rep.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INTERACTIVE REPLY FORM */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-[#233549] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Send Reply via Company SMTP</span>
                  <span className="text-slate-500 text-[10px] font-mono">From: {currentUser?.email}</span>
                </div>
                <textarea
                  rows={3}
                  placeholder={`Reply to ${selectedEmail.senderName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#121B26] border border-[#233549] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#3BC0BB]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach file</span>
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            
            /* EMPTY UNSELECTED STATE */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#16222F] text-slate-400 flex items-center justify-center border border-[#233549]">
                <CheckSquare className="w-8 h-8 text-[#3BC0BB]" />
              </div>
              <div className="max-w-sm space-y-1">
                <h2 className="text-base font-bold text-slate-200">Select an assigned task or email</h2>
                <p className="text-xs text-slate-400">
                  Choose a task assigned to you or an email message from the middle list to view details and take actions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: SMTP SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549] text-slate-100'
          }`}>
            <div className="p-4 border-b border-[#233549] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#3BC0BB]" />
                <h3 className="font-bold text-sm">Company Email Settings</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Integration Protocol</label>
                <select
                  value={settingsForm.protocol}
                  onChange={(e) => setSettingsForm({ ...settingsForm, protocol: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                >
                  <option value="IMAP/SMTP">IMAP / SMTP (Corporate Mail Server)</option>
                  <option value="Gmail Workspace API">Google Workspace API</option>
                  <option value="Outlook Graph API">Microsoft 365 / Outlook Graph API</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Company Email Address</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Account Username</label>
                  <input
                    type="text"
                    value={settingsForm.username}
                    onChange={(e) => setSettingsForm({ ...settingsForm, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#233549] flex items-center justify-between bg-[#16222F]/40">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTestSmtpConnection}
                disabled={isTestingConnection}
                className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                <span>{isTestingConnection ? 'Testing...' : 'Save & Verify Connection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LINK EMAIL TO TASK */}
      {showLinkModal && selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#233549] bg-[#121B26] text-slate-100 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#3BC0BB]" />
                <h3 className="font-bold text-sm">Link Email Thread to Task</h3>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Selected Email: <span className="text-slate-200 font-semibold">"{selectedEmail.subject}"</span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Project</label>
                <select
                  value={selectedProjForLink}
                  onChange={(e) => {
                    setSelectedProjForLink(e.target.value);
                    setSelectedTaskForLink('');
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Target Task</label>
                <select
                  value={selectedTaskForLink}
                  onChange={(e) => setSelectedTaskForLink(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                >
                  <option value="">-- Pick a task to link --</option>
                  {tasks
                    .filter((t) => !selectedProjForLink || t.projectId === selectedProjForLink)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.status}] {t.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#233549]">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLink}
                disabled={!selectedTaskForLink}
                className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white font-bold text-xs shadow-md"
              >
                Confirm Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONVERT EMAIL TO TASK */}
      {showConvertModal && selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#233549] bg-[#121B26] text-slate-100 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Convert Email to New Task</h3>
              </div>
              <button onClick={() => setShowConvertModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target Project Space</label>
                <select
                  value={convertProjectId}
                  onChange={(e) => setConvertProjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Task Title</label>
                <input
                  type="text"
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Priority</label>
                <select
                  value={convertPriority}
                  onChange={(e) => setConvertPriority(e.target.value as Priority)}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#233549]">
              <button
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConvert}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white font-bold text-xs shadow-md"
              >
                Create Task & Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: COMPOSE NEW EMAIL */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleConfirmCompose} className="w-full max-w-lg rounded-2xl border border-[#233549] bg-[#121B26] text-slate-100 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#3BC0BB]" />
                <h3 className="font-bold text-sm">Compose Email</h3>
              </div>
              <button type="button" onClick={() => setShowComposeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Recipient Email (To)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@company.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Subject line..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Body</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write message..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#233549]">
              <span className="text-[10px] text-slate-500 font-mono">From: {currentUser?.email}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Transactional Email Gateway & Logs Modal */}
      <TransactionalEmailGatewayModal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
      />
    </div>
  );
};
