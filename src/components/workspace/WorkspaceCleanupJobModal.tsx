import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Sliders,
  Calendar,
  Sparkles,
  X,
  History,
  Building2,
  Check,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WorkspaceCleanupJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export const WorkspaceCleanupJobModal: React.FC<WorkspaceCleanupJobModalProps> = ({
  isOpen,
  onClose,
  isLight = false,
}) => {
  const {
    cleanupJobConfig,
    updateCleanupJobConfig,
    cleanupJobLogs,
    lastCleanupRunAt,
    isCleanupJobRunning,
    runAutomatedWorkspaceCleanup,
    clearCleanupJobLogs,
    simulateExpiredWorkspace,
    createTestDeletedWorkspace,
    deletedCompanies,
    showRestorationToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'history' | 'test'>('overview');
  const [isExecutingNow, setIsExecutingNow] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [testDaysAgo, setTestDaysAgo] = useState(35);
  const [selectedCompToSimulate, setSelectedCompToSimulate] = useState('');

  if (!isOpen) return null;

  const handleRunNow = () => {
    setIsExecutingNow(true);
    setFeedback(null);

    setTimeout(() => {
      try {
        const result = runAutomatedWorkspaceCleanup(true);
        setIsExecutingNow(false);
        if (result.workspacesPurged > 0) {
          setFeedback({
            type: 'success',
            message: `Background cleanup completed: Successfully purged ${result.workspacesPurged} expired workspace(s) exceeding ${result.retentionDaysThreshold}-day retention.`
          });
        } else {
          setFeedback({
            type: 'info',
            message: `Background cleanup completed: ${result.workspacesEvaluated} workspace(s) in Recycle Bin evaluated. None have exceeded the ${result.retentionDaysThreshold}-day retention threshold.`
          });
        }
      } catch {
        setIsExecutingNow(false);
        setFeedback({
          type: 'error',
          message: 'An error occurred while executing the cleanup background job.'
        });
      }
    }, 400);
  };

  const handleCreateSimulatedExpired = () => {
    const testComp = createTestDeletedWorkspace(testDaysAgo);
    setFeedback({
      type: 'success',
      message: `Created simulated workspace "${testComp.name}" with deletion timestamp set to ${testDaysAgo} days ago. Run the cleanup job to verify permanent automated deletion.`
    });
  };

  const handleSimulateExisting = () => {
    if (!selectedCompToSimulate) return;
    simulateExpiredWorkspace(selectedCompToSimulate, testDaysAgo);
    const comp = deletedCompanies.find((c) => c.id === selectedCompToSimulate);
    setFeedback({
      type: 'success',
      message: `Set deletion timestamp of "${comp?.name || selectedCompToSimulate}" to ${testDaysAgo} days ago. It is now eligible for automated 30-day retention purge.`
    });
  };

  // Count items older than retention threshold
  const expiredWorkspacesCount = deletedCompanies.filter((c) => {
    if (!c.deletedAt) return false;
    const elapsedMs = Date.now() - new Date(c.deletedAt).getTime();
    return elapsedMs >= cleanupJobConfig.retentionDays * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121B27] border-[#233549] text-white'
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/40 bg-gradient-to-r from-rose-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Automated Workspace Cleanup Job</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {cleanupJobConfig.enabled ? 'Daemon Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently deletes workspaces in the Recycle Bin once their 30-day retention period has expired.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-700/40 px-6 pt-2 bg-slate-950/20 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#3BC0BB] text-[#3BC0BB]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Job Status & Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#3BC0BB] text-[#3BC0BB]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit History ({cleanupJobLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#3BC0BB] text-[#3BC0BB]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Job Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'test'
                ? 'border-rose-400 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Test / Simulate Purge</span>
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : feedback.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <Info className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 hover:bg-white/10 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* BODY CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* STATUS SUMMARY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182635] border-[#25394e]'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Retention Window
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-[#3BC0BB]">
                      {cleanupJobConfig.retentionDays}
                    </span>
                    <span className="text-xs text-slate-400">Days</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {cleanupJobConfig.retentionDays * 24} hours
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182635] border-[#25394e]'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Scan Frequency
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-amber-400">
                      {cleanupJobConfig.intervalMinutes}
                    </span>
                    <span className="text-xs text-slate-400">Minutes</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Background timer</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182635] border-[#25394e]'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    In Recycle Bin
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-200">
                      {deletedCompanies.length}
                    </span>
                    <span className="text-xs text-slate-400">Workspaces</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Retained safely</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    expiredWorkspacesCount > 0
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#182635] border-[#25394e]'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider block">
                    Expired (≥ 30d)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className={`text-2xl font-black ${
                        expiredWorkspacesCount > 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {expiredWorkspacesCount}
                    </span>
                    <span className="text-xs text-slate-400">Pending Purge</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {expiredWorkspacesCount > 0 ? 'Due for deletion' : 'All within 30 days'}
                  </span>
                </div>
              </div>

              {/* RETENTION POLICY EXPLANATION */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  isLight ? 'bg-sky-50 border-sky-200 text-slate-700' : 'bg-sky-950/20 border-sky-800/40 text-sky-200'
                }`}
              >
                <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs leading-relaxed">
                  <p className="font-bold text-sm">Automated 30-Day Retention Policy</p>
                  <p className="text-slate-400">
                    When a workspace is soft-deleted, it is placed into the Recycle Bin where it remains recoverable for 30 calendar days. The automated cleanup background job continuously checks timestamps and automatically, permanently deletes any workspaces exceeding 30 days to free storage and ensure enterprise compliance.
                  </p>
                </div>
              </div>

              {/* QUICK ACTION BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Manual Background Execution
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Last automatic background run:{' '}
                    <strong className="text-slate-300">
                      {lastCleanupRunAt ? new Date(lastCleanupRunAt).toLocaleTimeString() : 'At startup'}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={handleRunNow}
                  disabled={isExecutingNow || isCleanupJobRunning}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isExecutingNow ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>Run Cleanup Job Now</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black">Audit History of Background Cleanup Runs</h4>
                  <p className="text-xs text-slate-400">
                    Showing past runs, evaluated workspaces, and permanent purge records.
                  </p>
                </div>
                {cleanupJobLogs.length > 0 && (
                  <button
                    onClick={clearCleanupJobLogs}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Audit Log</span>
                  </button>
                )}
              </div>

              {cleanupJobLogs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-700/50 rounded-2xl">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No cleanup runs logged yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click "Run Cleanup Job Now" or wait for the scheduled background scan.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cleanupJobLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182635] border-[#25394e]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              log.triggerType === 'AUTOMATED_BACKGROUND'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {log.triggerType === 'AUTOMATED_BACKGROUND' ? 'Automated Scan' : 'Manual Trigger'}
                          </span>
                          <span className="font-semibold text-slate-300">
                            {new Date(log.runAt).toLocaleString()}
                          </span>
                        </div>
                        <span
                          className={`font-bold ${
                            log.workspacesPurged > 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {log.workspacesPurged > 0
                            ? `Purged ${log.workspacesPurged} expired workspace(s)`
                            : '0 expired items'}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-4">
                        <span>Workspaces Evaluated: {log.workspacesEvaluated}</span>
                        <span>Retention Threshold: {log.retentionDaysThreshold} Days</span>
                        {log.executionDurationMs !== undefined && (
                          <span>Duration: {log.executionDurationMs}ms</span>
                        )}
                      </div>

                      {log.purgedDetails && log.purgedDetails.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-700/40 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-rose-300 block">
                            Purged Workspaces:
                          </span>
                          {log.purgedDetails.map((item) => (
                            <div
                              key={item.id}
                              className="text-[11px] text-slate-300 flex items-center justify-between"
                            >
                              <span>{item.name} ({item.code || 'NO-CODE'})</span>
                              <span className="text-slate-400">{item.daysInRecycleBin} days in bin</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-black">Retention Background Job Configuration</h4>
                <p className="text-xs text-slate-400">
                  Control the automated frequency, threshold parameters, and notification alerts.
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-4 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182635] border-[#25394e]'
                }`}
              >
                {/* ENABLE / DISABLE TOGGLE */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Enable Automated Background Daemon
                    </span>
                    <span className="text-[11px] text-slate-400">
                      When enabled, background scans execute automatically at configured intervals.
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      updateCleanupJobConfig({ enabled: !cleanupJobConfig.enabled })
                    }
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      cleanupJobConfig.enabled ? 'bg-teal-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        cleanupJobConfig.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* INTERVAL FREQUENCY */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Background Scan Frequency
                    </span>
                    <span className="text-[11px] text-slate-400">
                      How frequently the background worker scans the Recycle Bin for expired items.
                    </span>
                  </div>
                  <select
                    value={cleanupJobConfig.intervalMinutes}
                    onChange={(e) =>
                      updateCleanupJobConfig({ intervalMinutes: Number(e.target.value) })
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-[#3BC0BB]"
                  >
                    <option value={5}>Every 5 minutes</option>
                    <option value={15}>Every 15 minutes (Default)</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every 1 hour</option>
                    <option value={360}>Every 6 hours</option>
                    <option value={1440}>Every 24 hours</option>
                  </select>
                </div>

                {/* RETENTION WINDOW DAYS */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Retention Window (Days)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Standard enterprise retention period before permanent automated purge.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={cleanupJobConfig.retentionDays}
                      onChange={(e) =>
                        updateCleanupJobConfig({ retentionDays: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-20 px-3 py-1.5 rounded-lg text-xs font-bold text-center bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-[#3BC0BB]"
                    />
                    <span className="text-xs text-slate-400">days</span>
                  </div>
                </div>

                {/* NOTIFICATION TOGGLE */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Activity Log Entry on Purge
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Record an enterprise audit trail log whenever expired workspaces are purged.
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      updateCleanupJobConfig({ autoNotifyOnPurge: !cleanupJobConfig.autoNotifyOnPurge })
                    }
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      cleanupJobConfig.autoNotifyOnPurge ? 'bg-teal-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        cleanupJobConfig.autoNotifyOnPurge ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-black text-rose-400">Test & Validate 30-Day Automated Purge</h4>
                <p className="text-xs text-slate-400">
                  Simulate workspaces older than 30 days to immediately verify that the background worker detects and permanently removes them without waiting 30 real days.
                </p>
              </div>

              {/* METHOD 1: GENERATE TEST EXPIRED WORKSPACE */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182635] border-[#25394e]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Option A: Generate Simulated Expired Workspace
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Creates a sample soft-deleted workspace with a deletion timestamp set to {testDaysAgo} days ago.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Simulate Days Ago:</span>
                    <input
                      type="number"
                      min={31}
                      max={90}
                      value={testDaysAgo}
                      onChange={(e) => setTestDaysAgo(Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 rounded-lg text-xs font-bold text-center bg-slate-900 border border-slate-700 text-slate-200"
                    />
                  </div>
                  <button
                    onClick={handleCreateSimulatedExpired}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow cursor-pointer"
                  >
                    <span>Generate Expired Workspace</span>
                  </button>
                </div>
              </div>

              {/* METHOD 2: SET EXISTING WORKSPACE TO EXPIRED */}
              {deletedCompanies.length > 0 && (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182635] border-[#25394e]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Option B: Fast-Forward Existing Workspace in Recycle Bin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Select a workspace currently in the Recycle Bin to artificially back-date its deletion timestamp to {testDaysAgo} days ago.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={selectedCompToSimulate}
                      onChange={(e) => setSelectedCompToSimulate(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-[#3BC0BB]"
                    >
                      <option value="">-- Select a workspace in Recycle Bin --</option>
                      {deletedCompanies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code || 'NO-CODE'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSimulateExisting}
                      disabled={!selectedCompToSimulate}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow cursor-pointer disabled:opacity-50"
                    >
                      <span>Set to {testDaysAgo} Days Old</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/40 bg-slate-950/20">
          <div className="text-[11px] text-slate-500">
            Automated Retention Daemon • Interval: {cleanupJobConfig.intervalMinutes}m • Retention: {cleanupJobConfig.retentionDays}d
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
