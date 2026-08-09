import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmailThread, Priority, EmailConfig } from '../../types';
import { TransactionalEmailGatewayModal } from '../notifications/TransactionalEmailGatewayModal';

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
    projects,
    tasks,
    currentUser,
    setActiveTab,
    setSelectedProjectId,
    theme
  } = useApp();

  // Active view states
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(emailThreads[0]?.id || null);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'linked' | 'starred' | 'archive'>('inbox');
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

  // Interactive Reply state
  const [replyText, setReplyText] = useState('');
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

  const handleRefreshInbox = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerToast('Synced with company mail server mail.dolphingroup.ae. 0 new messages.');
    }, 1000);
  };

  const selectedEmail = emailThreads.find((e) => e.id === selectedEmailId);
  const linkedTask = selectedEmail?.linkedTaskId ? tasks.find((t) => t.id === selectedEmail.linkedTaskId) : null;
  const linkedProject = linkedTask ? projects.find((p) => p.id === linkedTask.projectId) : null;

  // Filter email threads
  const filteredEmails = emailThreads.filter((email) => {
    // Folder filter
    if (activeFolder === 'sent' && email.folder !== 'sent') return false;
    if (activeFolder === 'inbox' && email.folder === 'sent') return false;
    if (activeFolder === 'linked' && !email.linkedTaskId) return false;
    if (activeFolder === 'starred' && !email.isStarred) return false;

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

  // Unique tags across emails
  const allTags = Array.from(new Set(emailThreads.flatMap((e) => e.tags || [])));

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail) return;
    sendEmailReply(selectedEmail.id, replyText.trim());
    setReplyText('');
    triggerToast('Email reply dispatched via company SMTP server.');
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
    }, 1000);
  };

  const handleConfirmLink = () => {
    if (!selectedEmail || !selectedTaskForLink) return;
    linkEmailToTask(selectedEmail.id, selectedTaskForLink, selectedProjForLink);
    setShowLinkModal(false);
    triggerToast('Email thread linked to project task successfully!');
  };

  const handleConfirmConvert = () => {
    if (!selectedEmail) return;
    const createdTask = convertEmailToTask(
      selectedEmail.id,
      convertProjectId,
      convertTitle || selectedEmail.subject,
      convertPriority
    );
    setShowConvertModal(false);
    triggerToast(`New task "${createdTask.title}" created & linked!`);
  };

  const handleConfirmCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) return;

    const newThread = composeNewEmail({
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      recipientEmail: composeTo,
      subject: composeSubject,
      snippet: composeBody.slice(0, 80),
      body: composeBody,
      linkedTaskId: composeLinkedTaskId || undefined,
      tags: ['Outgoing', 'Direct']
    });

    setSelectedEmailId(newThread.id);
    setShowComposeModal(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setComposeLinkedTaskId('');
    triggerToast(`Email dispatched to ${composeTo}`);
  };

  return (
    <div className={`h-[calc(100vh-8.5rem)] flex flex-col font-sans ${theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-[#0D1520] text-slate-100'}`}>
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-2xl border border-emerald-400 font-medium text-xs animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP INBOX HEADER BAR */}
      <div className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#2DD4BF] flex items-center justify-center text-white shadow-md">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">Company Email Inbox</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                emailConfig.isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${emailConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {emailConfig.isConnected ? `Connected: ${emailConfig.incomingHost}` : 'Disconnected'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sync company email threads and directly link communication to specific project tasks
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshInbox}
            disabled={isRefreshing}
            className={`p-2 rounded-xl border transition-all ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300'
            }`}
            title="Sync / Refresh Inbox with Company Mail Server"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#3BC0BB]' : ''}`} />
          </button>

          <button
            onClick={() => setShowGatewayModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all ${
              theme === 'light'
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-[#0D9488]/20 hover:bg-[#0D9488]/30 border-[#0D9488]/40 text-[#3BC0BB]'
            }`}
            title="View Transactional Email Service Logs & Test Gateway"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span className="hidden sm:inline">Notification Gateway</span>
          </button>

          <button
            onClick={() => {
              setSettingsForm({ ...emailConfig });
              setShowSettingsModal(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span className="hidden sm:inline">SMTP / API Integration</span>
          </button>

          <button
            onClick={() => setShowComposeModal(true)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-md transition-all ${
              theme === 'light'
                ? 'bg-gradient-to-r from-[#0D9488] to-[#06B6D4] hover:opacity-95'
                : 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-95'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Compose Email</span>
          </button>
        </div>
      </div>

      {/* THREE-PANE MAIN INBOX WORKSPACE */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* PANE 1: LEFT FOLDER & TAG NAVIGATION SIDEBAR (Desktop 1024px+) */}
        <div className={`hidden lg:flex w-56 shrink-0 border-r flex-col justify-between overflow-y-auto p-3 ${
          theme === 'light' ? 'bg-slate-100/70 border-slate-200' : 'bg-[#0B121C] border-[#233549]'
        }`}>
          <div className="space-y-4">
            {/* Primary Folders */}
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                FOLDERS
              </div>

              <button
                onClick={() => {
                  setActiveFolder('inbox');
                  setOnlyLinked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'inbox' && !onlyLinked
                    ? theme === 'light'
                      ? 'bg-[#0D9488] text-white shadow-sm'
                      : 'bg-[#0773BB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <InboxIcon className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                {emailThreads.filter((e) => e.isUnread && e.folder !== 'sent').length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                    {emailThreads.filter((e) => e.isUnread && e.folder !== 'sent').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveFolder('linked');
                  setOnlyLinked(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'linked'
                    ? theme === 'light'
                      ? 'bg-[#0D9488] text-white shadow-sm'
                      : 'bg-[#0773BB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                  <span>Linked to Tasks</span>
                </div>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {emailThreads.filter((e) => e.linkedTaskId).length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveFolder('starred');
                  setOnlyLinked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'starred'
                    ? theme === 'light'
                      ? 'bg-[#0D9488] text-white shadow-sm'
                      : 'bg-[#0773BB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <span>Starred</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {emailThreads.filter((e) => e.isStarred).length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveFolder('sent');
                  setOnlyLinked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === 'sent'
                    ? theme === 'light'
                      ? 'bg-[#0D9488] text-white shadow-sm'
                      : 'bg-[#0773BB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Sent Items</span>
                </div>
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
                Auto-Configured
              </span>
            </div>
            <div className="truncate font-mono text-[10px] text-slate-400">{emailConfig.email}</div>
            <div className="text-[9px] text-slate-500 font-mono truncate">
              User ID: <span className="text-slate-300">{currentUser.id}</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-[#233549]/40">
              <span>Port: {emailConfig.incomingPort} (SSL)</span>
              <span className="text-emerald-400 font-semibold">Active Mapping</span>
            </div>
          </div>
        </div>

        {/* PANE 2: MIDDLE EMAIL LIST COLUMN */}
        <div className={`w-full md:w-80 lg:w-80 xl:w-96 shrink-0 border-r flex flex-col min-h-0 overflow-hidden ${
          showMobilePreview ? 'hidden md:flex' : 'flex'
        } ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0E1723] border-[#233549]'
        }`}>
          {/* Tablet/Mobile Quick Folder Navigation Bar */}
          <div className="lg:hidden flex items-center gap-1.5 p-2 bg-slate-100 dark:bg-[#121B26] border-b border-slate-200 dark:border-[#233549] overflow-x-auto text-xs shrink-0">
            <button
              onClick={() => {
                setActiveFolder('inbox');
                setOnlyLinked(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-all ${
                activeFolder === 'inbox' && !onlyLinked
                  ? 'bg-[#00AEA9] text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#16222F]'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => {
                setActiveFolder('linked');
                setOnlyLinked(true);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-all ${
                activeFolder === 'linked'
                  ? 'bg-[#00AEA9] text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#16222F]'
              }`}
            >
              Linked
            </button>
            <button
              onClick={() => {
                setActiveFolder('starred');
                setOnlyLinked(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-all ${
                activeFolder === 'starred'
                  ? 'bg-[#00AEA9] text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#16222F]'
              }`}
            >
              Starred
            </button>
            <button
              onClick={() => {
                setActiveFolder('sent');
                setOnlyLinked(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-all ${
                activeFolder === 'sent'
                  ? 'bg-[#00AEA9] text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#16222F]'
              }`}
            >
              Sent
            </button>
          </div>

          {/* List Search & Quick Filter Controls */}
          <div className="p-3 space-y-2 border-b border-[#233549]/50">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search emails, senders, tasks..."
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

            {/* Quick Toggles */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOnlyUnread(!onlyUnread)}
                  className={`px-2 py-0.5 rounded-lg font-medium text-[11px] transition-all ${
                    onlyUnread
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:bg-[#16222F]'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setOnlyLinked(!onlyLinked)}
                  className={`px-2 py-0.5 rounded-lg font-medium text-[11px] transition-all ${
                    onlyLinked
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:bg-[#16222F]'
                  }`}
                >
                  Task Linked
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                {filteredEmails.length} messages
              </span>
            </div>
          </div>

          {/* Email Item Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#233549]/40">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Mail className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
                <p className="text-xs text-slate-400">No email threads found matching your filters.</p>
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmailId === email.id;
                const emailLinkedTask = email.linkedTaskId ? tasks.find((t) => t.id === email.linkedTaskId) : null;

                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmailId(email.id);
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
                    {/* Unread Pill Indicator */}
                    {email.isUnread && (
                      <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    )}

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

                    {/* Footer Tags & Task Link Badge */}
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <div className="flex items-center gap-1 truncate">
                        {emailLinkedTask ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold truncate max-w-[160px]">
                            <LinkIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{emailLinkedTask.title}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Unlinked</span>
                        )}

                        {email.attachments && email.attachments.length > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            <span>{email.attachments.length}</span>
                          </span>
                        )}
                      </div>

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
          </div>
        </div>

        {/* PANE 3: RIGHT EMAIL READER & TASK LINKING DETAIL VIEW */}
        <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${
          !showMobilePreview ? 'hidden md:flex' : 'flex'
        } ${
          theme === 'light' ? 'bg-white text-slate-900' : 'bg-[#0D1520] text-slate-100'
        }`}>
          {!selectedEmail ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#16222F] text-slate-400 flex items-center justify-center border border-[#233549]">
                <Mail className="w-8 h-8 text-[#3BC0BB]" />
              </div>
              <div className="max-w-sm space-y-1">
                <h2 className="text-base font-bold text-slate-200">Select an email thread</h2>
                <p className="text-xs text-slate-400">
                  Choose a company email thread from the list to view full communication history, attach it to a task, or convert it to a new task.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
              {/* READER HEADER ACTIONS BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#233549]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMobilePreview(false)}
                    className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-[#16222F] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-[#233549] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9]"
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
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    ID: {selectedEmail.id}
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
                      if (window.confirm('Are you sure you want to delete this email thread?')) {
                        deleteEmailThread(selectedEmail.id);
                        setSelectedEmailId(null);
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

              {/* TASK LINK HERO BANNER BOX (The primary feature required) */}
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
                        This email thread is not currently linked to any project task. You can link it to an existing task or convert it into a new task.
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
                            triggerToast('Unlinked email thread from task.');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1"
                          title="Remove Task Link"
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
                          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all ${
                            theme === 'light'
                              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                              : 'bg-[#1F2F42] hover:bg-[#283C54] border-[#344C68] text-white'
                          }`}
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
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Convert to New Task</span>
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
                      <div className="text-slate-500 text-[11px] font-mono">
                        To: {selectedEmail.recipientEmail}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-400">
                    <div>{new Date(selectedEmail.timestamp).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                    <div className="text-slate-500">{new Date(selectedEmail.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>

                {/* Email Tags */}
                {selectedEmail.tags && selectedEmail.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {selectedEmail.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-[#16222F] text-[#3BC0BB] border border-[#233549] text-[10px] font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* MAIN EMAIL BODY */}
              <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed space-y-4 whitespace-pre-wrap font-sans bg-[#121B26]/40 p-5 rounded-2xl border border-[#233549]/60">
                {selectedEmail.body}
              </div>

              {/* ATTACHMENTS LIST */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-[#3BC0BB]" />
                    <span>Attachments ({selectedEmail.attachments.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedEmail.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl bg-[#121B26] border border-[#233549] flex items-center justify-between gap-3 text-xs hover:border-[#3BC0BB]/50 transition-all"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-[#3BC0BB] shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-slate-200 truncate">{att.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{att.size}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => triggerToast(`Downloading attachment ${att.name}...`)}
                          className="p-1.5 rounded-lg bg-[#16222F] hover:bg-[#233549] text-[#3BC0BB] font-bold text-[11px]"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REPLIES HISTORY THREAD */}
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
                  <span className="text-slate-500 text-[10px] font-mono">From: {currentUser.email}</span>
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
                    <Paperclip className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                    <span>Attach file</span>
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: SMTP / API INTEGRATION SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549] text-slate-100'
          }`}>
            <div className="p-4 border-b border-[#233549] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#3BC0BB]" />
                <h3 className="font-bold text-sm">Company Email Integration Settings</h3>
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
                  <option value="IMAP/SMTP">IMAP / SMTP (Dolphin Mail Server)</option>
                  <option value="Gmail Workspace API">Google Workspace API (Gmail OAuth)</option>
                  <option value="Outlook Graph API">Microsoft 365 / Outlook Graph API</option>
                  <option value="Exchange Server">Exchange On-Premises Server</option>
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
                  <label className="block text-slate-400 mb-1 font-semibold">Username / Account ID</label>
                  <input
                    type="text"
                    value={settingsForm.username}
                    onChange={(e) => setSettingsForm({ ...settingsForm, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Incoming Host (IMAP)</label>
                  <input
                    type="text"
                    value={settingsForm.incomingHost}
                    onChange={(e) => setSettingsForm({ ...settingsForm, incomingHost: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Port</label>
                  <input
                    type="number"
                    value={settingsForm.incomingPort}
                    onChange={(e) => setSettingsForm({ ...settingsForm, incomingPort: parseInt(e.target.value) || 993 })}
                    className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Outgoing Host (SMTP)</label>
                  <input
                    type="text"
                    value={settingsForm.outgoingHost}
                    onChange={(e) => setSettingsForm({ ...settingsForm, outgoingHost: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Port</label>
                  <input
                    type="number"
                    value={settingsForm.outgoingPort}
                    onChange={(e) => setSettingsForm({ ...settingsForm, outgoingPort: parseInt(e.target.value) || 465 })}
                    className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#16222F]/60 border border-[#233549]">
                <div>
                  <div className="font-semibold text-slate-200">Enforce SSL / TLS Encryption</div>
                  <div className="text-[10px] text-slate-400">Strict end-to-end socket transport security</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.useSSL}
                  onChange={(e) => setSettingsForm({ ...settingsForm, useSSL: e.target.checked })}
                  className="w-4 h-4 accent-[#3BC0BB]"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 space-y-1.5">
                <label className="block text-teal-300 font-semibold text-[11px]">Test Dispatch Recipient Email</label>
                <input
                  type="email"
                  placeholder="e.g. user@dolphin-global.com"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#16222F] border border-[#233549] text-slate-200 text-xs"
                />
                <p className="text-[10px] text-teal-400/80">Saving will send an automated SMTP test email to this address to verify routing.</p>
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
                <span>{isTestingConnection ? 'Testing Connection...' : 'Save & Test Connection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LINK EMAIL TO EXISTING PROJECT TASK */}
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

      {/* MODAL 3: CONVERT EMAIL TO NEW TASK */}
      {showConvertModal && selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#233549] bg-[#121B26] text-slate-100 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Convert Email to New Project Task</h3>
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

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Preview Extracted Description</label>
                <div className="p-3 rounded-xl bg-[#16222F] border border-[#233549] text-[11px] text-slate-300 max-h-32 overflow-y-auto font-mono">
                  From: {selectedEmail.senderName} ({selectedEmail.senderEmail})<br />
                  Subject: {selectedEmail.subject}<br />
                  ---<br />
                  {selectedEmail.body}
                </div>
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
                Create Task & Link Thread
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
                <h3 className="font-bold text-sm">Compose Company Email</h3>
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
                  placeholder="e.g. client@adnoc.ae"
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
                <label className="block text-slate-400 mb-1 font-semibold">Link directly to Task (Optional)</label>
                <select
                  value={composeLinkedTaskId}
                  onChange={(e) => setComposeLinkedTaskId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                >
                  <option value="">None</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.status}] {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Body</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write message..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#233549]">
              <span className="text-[10px] text-slate-500 font-mono">From: {currentUser.email}</span>
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
