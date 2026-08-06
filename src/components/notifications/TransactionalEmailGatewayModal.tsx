import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Settings,
  Sliders,
  X,
  Server,
  Key,
  Globe,
  Sparkles,
  UserCheck,
  Bell,
  Check,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Code
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  EmailLogEntry,
  fetchEmailDispatchLogs,
  sendTransactionalEmail,
  testEmailGatewayConnection
} from '../../services/emailNotificationService';

interface TransactionalEmailGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionalEmailGatewayModal: React.FC<TransactionalEmailGatewayModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, emailConfig, updateEmailConfig, theme } = useApp();

  const [activeTab, setActiveTab] = useState<'logs' | 'test' | 'config'>('logs');
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewLog, setPreviewLog] = useState<EmailLogEntry | null>(null);

  // Test form state
  const [testRecipient, setTestRecipient] = useState(currentUser?.email || 'dolphingroup786@gmail.com');
  const [testCategory, setTestCategory] = useState<'task_assigned' | 'task_updated' | 'user_invited' | 'daily_summary'>('task_assigned');
  const [testSubject, setTestSubject] = useState('Task Assignment: Calibrate Heavy Fabrication Valves');
  const [testTaskTitle, setTestTaskTitle] = useState('Calibrate Heavy Fabrication Valves');
  const [testProjectTitle, setTestProjectTitle] = useState('Sharjah Industrial Facility Overhaul');
  const [testDescription, setTestDescription] = useState('Verify pressure seal tolerances against DEWA 2026 specifications before site delivery.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Config Form State
  const [providerType, setProviderType] = useState<'default' | 'smtp' | 'sendgrid'>(
    emailConfig.protocol === 'Gmail Workspace API' ? 'sendgrid' : emailConfig.outgoingHost ? 'smtp' : 'default'
  );
  const [smtpHost, setSmtpHost] = useState(emailConfig.outgoingHost || 'smtp.dolphingroup.ae');
  const [smtpPort, setSmtpPort] = useState(emailConfig.outgoingPort || 465);
  const [smtpUser, setSmtpUser] = useState(emailConfig.username || 'notifications@dolphingroup.ae');
  const [smtpPass, setSmtpPass] = useState(emailConfig.appToken || '');
  const [sendgridKey, setSendgridKey] = useState('');
  const [fromEmail, setFromEmail] = useState(emailConfig.email || 'notifications@dolphingroup.ae');
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<string | null>(null);

  // Event Toggles
  const [triggers, setTriggers] = useState({
    taskAssigned: true,
    taskUpdated: true,
    taskCompleted: true,
    userInvited: true,
    activityMention: true,
    overdueAlerts: true
  });

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    const data = await fetchEmailDispatchLogs();
    setLogs(data);
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;

    setIsSendingTest(true);
    setTestFeedback(null);

    const res = await sendTransactionalEmail({
      toEmail: testRecipient,
      toName: currentUser?.name || 'Valued Team Member',
      subject: testSubject,
      category: testCategory,
      templateData: {
        taskTitle: testTaskTitle,
        projectTitle: testProjectTitle,
        description: testDescription,
        assignerName: currentUser?.name || 'Project Director',
        priority: 'High',
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        status: 'In Progress'
      },
      smtpConfig: providerType === 'smtp' ? {
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        fromEmail
      } : undefined,
      sendgridApiKey: providerType === 'sendgrid' ? sendgridKey : undefined
    });

    setIsSendingTest(false);

    if (res.success) {
      setTestFeedback({
        type: 'success',
        message: `Transactional email successfully dispatched to ${testRecipient}! Message ID: ${res.messageId || 'DELIVERED'}`
      });
      loadLogs();
    } else {
      setTestFeedback({
        type: 'error',
        message: res.error || 'Failed to dispatch test email.'
      });
    }
  };

  const handleTestConnection = async () => {
    setIsTestingGateway(true);
    setGatewayStatus(null);

    const res = await testEmailGatewayConnection(
      testRecipient,
      providerType === 'smtp' ? { host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass, fromEmail } : undefined,
      providerType === 'sendgrid' ? sendgridKey : undefined
    );

    setIsTestingGateway(false);
    if (res.success) {
      setGatewayStatus(`✅ ${res.message}`);
      loadLogs();
    } else {
      setGatewayStatus(`❌ ${res.message}`);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.messageId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-5xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0F172A] border-[#1E293B] text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-[#0F2338] to-[#0A131F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#0773BB] flex items-center justify-center text-white shadow-lg shadow-[#0D9488]/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Transactional Email Notification Gateway</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0D9488]/20 text-[#3BC0BB] border border-[#0D9488]/40">
                  SERVERLESS SERVICE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated task assignments, status updates, and user management activity notifications via SendGrid & Nodemailer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'logs'
                  ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Delivery Logs ({logs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('test')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'test'
                  ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Dispatch Test Email</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'config'
                  ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Gateway Settings & Triggers</span>
            </button>
          </div>

          <button
            onClick={loadLogs}
            disabled={isLoadingLogs}
            className="p-2 text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-all"
            title="Refresh Dispatch Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: DELIVERY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs by recipient, subject, or message ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-[#0D9488]"
                  >
                    <option value="all">All Notification Types</option>
                    <option value="task_assigned">Task Assignments</option>
                    <option value="task_updated">Task Updates</option>
                    <option value="task_completed">Task Completion</option>
                    <option value="activity_alert">Activity / Mentions</option>
                    <option value="user_invited">User Invitations</option>
                    <option value="daily_summary">Daily Summary</option>
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                  <Mail className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-300">No Transactional Email Logs Found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Transactional emails automatically log here when tasks are assigned, updated, or users are invited.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/70 text-slate-400 font-semibold border-b border-slate-700/60">
                        <tr>
                          <th className="px-4 py-3">Timestamp & Status</th>
                          <th className="px-4 py-3">Recipient</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Subject</th>
                          <th className="px-4 py-3">Provider</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {log.status === 'DELIVERED' ? (
                                  <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="p-1 rounded-full bg-amber-500/20 text-amber-400">
                                    <Clock className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                <div>
                                  <span className="font-semibold text-white block">
                                    {new Date(log.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(log.deliveredAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{log.recipientName || 'Team Member'}</div>
                              <div className="text-[11px] text-[#3BC0BB] font-mono">{log.recipientEmail}</div>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  log.category === 'task_assigned'
                                    ? 'bg-[#0D9488]/20 text-[#3BC0BB] border border-[#0D9488]/40'
                                    : log.category === 'task_updated'
                                    ? 'bg-[#0773BB]/20 text-[#38BDF8] border border-[#0773BB]/40'
                                    : log.category === 'user_invited'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                }`}
                              >
                                {log.category.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>

                            <td className="px-4 py-3 max-w-[260px] truncate font-medium text-slate-200" title={log.subject}>
                              {log.subject}
                            </td>

                            <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">
                              {log.providerUsed}
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setPreviewLog(log)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#3BC0BB] hover:text-white font-medium flex items-center gap-1.5 ml-auto transition-all text-[11px]"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Preview Email</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DISPATCH TEST EMAIL */}
          {activeTab === 'test' && (
            <form onSubmit={handleSendTestEmail} className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#3BC0BB] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-white mb-1">Instant Transactional Email Delivery Test</p>
                  Trigger a live transactional email with styled Dolphin Enterprise branding, metadata cards, and call-to-action buttons to verify email service delivery.
                </div>
              </div>

              {testFeedback && (
                <div
                  className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-3 ${
                    testFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span>{testFeedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Recipient Email Address</label>
                  <input
                    type="email"
                    required
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Notification Template</label>
                  <select
                    value={testCategory}
                    onChange={(e: any) => setTestCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#0D9488]"
                  >
                    <option value="task_assigned">Task Assignment Notification</option>
                    <option value="task_updated">Task Status Update Notification</option>
                    <option value="user_invited">User Invitation & Onboarding</option>
                    <option value="daily_summary">Executive Daily Brief</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Subject</label>
                <input
                  type="text"
                  required
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Task / Item Title</label>
                  <input
                    type="text"
                    value={testTaskTitle}
                    onChange={(e) => setTestTaskTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Project Space Title</label>
                  <input
                    type="text"
                    value={testProjectTitle}
                    onChange={(e) => setTestProjectTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Task Description / Instructions</label>
                <textarea
                  rows={3}
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#0D9488] text-white text-xs font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-[#0773BB]/30 disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Test Transactional Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: GATEWAY CONFIG & TRIGGERS */}
          {activeTab === 'config' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Event Triggers Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Bell className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Automatic Transactional Email Triggers</span>
                </div>
                <p className="text-xs text-slate-400">
                  Choose which user management and task operations automatically fire transactional email notifications to assignees and team leads.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors">
                    <span className="text-xs font-semibold text-slate-200">Task Assignments</span>
                    <input
                      type="checkbox"
                      checked={triggers.taskAssigned}
                      onChange={(e) => setTriggers({ ...triggers, taskAssigned: e.target.checked })}
                      className="w-4 h-4 accent-[#0D9488] rounded"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors">
                    <span className="text-xs font-semibold text-slate-200">Status & Priority Updates</span>
                    <input
                      type="checkbox"
                      checked={triggers.taskUpdated}
                      onChange={(e) => setTriggers({ ...triggers, taskUpdated: e.target.checked })}
                      className="w-4 h-4 accent-[#0D9488] rounded"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors">
                    <span className="text-xs font-semibold text-slate-200">Task Completion Alerts</span>
                    <input
                      type="checkbox"
                      checked={triggers.taskCompleted}
                      onChange={(e) => setTriggers({ ...triggers, taskCompleted: e.target.checked })}
                      className="w-4 h-4 accent-[#0D9488] rounded"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors">
                    <span className="text-xs font-semibold text-slate-200">User Invitations & Roles</span>
                    <input
                      type="checkbox"
                      checked={triggers.userInvited}
                      onChange={(e) => setTriggers({ ...triggers, userInvited: e.target.checked })}
                      className="w-4 h-4 accent-[#0D9488] rounded"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors">
                    <span className="text-xs font-semibold text-slate-200">Comment Mentions & Activity</span>
                    <input
                      type="checkbox"
                      checked={triggers.activityMention}
                      onChange={(e) => setTriggers({ ...triggers, activityMention: e.target.checked })}
                      className="w-4 h-4 accent-[#0D9488] rounded"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors">
                    <span className="text-xs font-semibold text-slate-200">Overdue Task Reminders</span>
                    <input
                      type="checkbox"
                      checked={triggers.overdueAlerts}
                      onChange={(e) => setTriggers({ ...triggers, overdueAlerts: e.target.checked })}
                      className="w-4 h-4 accent-[#0D9488] rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Provider Config Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Server className="w-4 h-4 text-[#3BC0BB]" />
                    <span>Email Service Provider Configuration</span>
                  </div>
                  <span className="text-[11px] text-[#3BC0BB] font-mono font-semibold">Nodemailer + SendGrid Supported</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setProviderType('default')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      providerType === 'default'
                        ? 'bg-[#0D9488]/20 border-[#0D9488] text-[#3BC0BB]'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Serverless Gateway
                  </button>

                  <button
                    type="button"
                    onClick={() => setProviderType('smtp')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      providerType === 'smtp'
                        ? 'bg-[#0D9488]/20 border-[#0D9488] text-[#3BC0BB]'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom SMTP (Nodemailer)
                  </button>

                  <button
                    type="button"
                    onClick={() => setProviderType('sendgrid')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      providerType === 'sendgrid'
                        ? 'bg-[#0D9488]/20 border-[#0D9488] text-[#3BC0BB]'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    SendGrid API
                  </button>
                </div>

                {providerType === 'smtp' && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">SMTP Host</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Port</label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">SMTP Username</label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Password / App Secret</label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {providerType === 'sendgrid' && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">SendGrid API Key (`SG....`)</label>
                    <input
                      type="password"
                      value={sendgridKey}
                      onChange={(e) => setSendgridKey(e.target.value)}
                      placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                )}

                {gatewayStatus && (
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
                    {gatewayStatus}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingGateway}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
                  >
                    {isTestingGateway ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#3BC0BB]" />}
                    <span>Test Gateway Connection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateEmailConfig({
                        outgoingHost: smtpHost,
                        outgoingPort: smtpPort,
                        username: smtpUser,
                        email: fromEmail,
                        isConnected: true
                      });
                      alert('Email notification gateway settings saved successfully!');
                    }}
                    className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-xs font-bold text-white transition-all shadow-md shadow-[#0D9488]/30"
                  >
                    Save Gateway Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RENDERED EMAIL PREVIEW MODAL */}
      {previewLog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#0B1320] border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Code className="w-4 h-4 text-[#3BC0BB]" />
                <span>HTML Email Preview &bull; {previewLog.subject}</span>
              </div>
              <button
                onClick={() => setPreviewLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 flex items-center justify-center">
              <div
                className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl"
                dangerouslySetInnerHTML={{ __html: previewLog.htmlPreview }}
              />
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
              <span>Dispatched To: <strong className="text-white">{previewLog.recipientEmail}</strong></span>
              <span>Message ID: <strong className="font-mono text-slate-300">{previewLog.messageId}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
