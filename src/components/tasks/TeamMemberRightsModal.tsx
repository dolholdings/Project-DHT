import React, { useState } from 'react';
import {
  ShieldAlert,
  Calendar,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  X,
  Send,
  User as UserIcon,
  FolderKanban,
  Sliders,
  Clock,
  Sparkles,
  Info,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Project } from '../../types';
import { normalizeRole } from '../../lib/permissions';

export interface TeamMemberRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  project?: Project | null;
  initialTab?: 'overview' | 'request_date' | 'roles';
  restrictedActionAttempted?: 'due_date' | 'delete_task' | null;
}

export const TeamMemberRightsModal: React.FC<TeamMemberRightsModalProps> = ({
  isOpen,
  onClose,
  task,
  project,
  initialTab = 'overview',
  restrictedActionAttempted = null
}) => {
  const { currentUser, addTaskComment, users, theme } = useApp();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'overview' | 'request_date' | 'roles'>(
    restrictedActionAttempted === 'due_date' ? 'request_date' : initialTab
  );

  // Request Date Extension State
  const [proposedDueDate, setProposedDueDate] = useState<string>(
    task?.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [requestReason, setRequestReason] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentRole = currentUser?.role || 'Team Member';
  const normRole = normalizeRole(currentRole);
  const isManagerOrAdmin = normRole === 'admin' || normRole === 'project manager';

  const managerUser = project?.managerId
    ? users.find((u) => u.id === project.managerId)
    : users.find((u) => normalizeRole(u.role) === 'project manager' || normalizeRole(u.role) === 'admin');

  const handleSendDueDateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    const commentBody = `📅 [DUE DATE CHANGE REQUEST]
• Proposed Target Date: ${proposedDueDate}
• Current Due Date: ${task.dueDate || 'None'}
• Requested By: ${currentUser?.name || 'Team Member'} (${currentRole})
• Reason / Notes: ${requestReason.trim() || 'Schedule adjustment requested for review.'}`;

    addTaskComment(task.id, commentBody);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#121B26] border-[#233549] text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
            restrictedActionAttempted
              ? isLight
                ? 'bg-amber-50 border-amber-200'
                : 'bg-amber-950/30 border-amber-500/30'
              : isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                restrictedActionAttempted
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border-[#3BC0BB]/40'
              }`}
            >
              {restrictedActionAttempted ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Team Member Rights & Task Permissions
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                    normRole === 'admin'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : normRole === 'project manager'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                  }`}
                >
                  Your Role: {currentRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {restrictedActionAttempted === 'due_date'
                  ? 'Due date modifications are restricted to Project Managers & Admins.'
                  : restrictedActionAttempted === 'delete_task'
                  ? 'Task deletions are restricted to Project Managers & Admins.'
                  : 'Role-based access control and workspace rights hierarchy.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors ${
              isLight
                ? 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`px-5 pt-3 flex items-center gap-2 border-b shrink-0 ${
            isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-[#0D1520]/50 border-[#233549]'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? isLight
                  ? 'border-[#0D9488] text-[#0D9488]'
                  : 'border-[#3BC0BB] text-[#3BC0BB]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Rights Overview</span>
          </button>

          {task && (
            <button
              type="button"
              onClick={() => setActiveTab('request_date')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'request_date'
                  ? isLight
                    ? 'border-[#0D9488] text-[#0D9488]'
                    : 'border-[#3BC0BB] text-[#3BC0BB]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Request Due Date Change</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? isLight
                  ? 'border-[#0D9488] text-[#0D9488]'
                  : 'border-[#3BC0BB] text-[#3BC0BB]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Role Matrix</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: Rights Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Alert Banner if action attempted */}
              {restrictedActionAttempted && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-xs">
                      {restrictedActionAttempted === 'due_date'
                        ? 'Due Date Modification Locked for Team Members'
                        : 'Task Deletion Locked for Team Members'}
                    </p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      {restrictedActionAttempted === 'due_date'
                        ? 'In this organization, only Project Managers and Administrators have authority to set or change task due dates. This ensures sprint commitments, client milestones, and project delivery schedules remain coordinated.'
                        : 'To safeguard historical audit trails, time tracking, and team contributions, permanent task deletions are strictly reserved for Project Managers and Administrators.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Two Column Rights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Restricted Column */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isLight
                      ? 'bg-rose-50/50 border-rose-200 text-slate-900'
                      : 'bg-rose-950/20 border-rose-500/30 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>Project Manager & Admin Rights Only</span>
                  </div>

                  <ul className="space-y-2.5 text-[11px]">
                    <li className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-200">Due Date Modifications:</strong>
                        <span className="text-slate-400">
                          Setting or adjusting task deadlines is restricted to Project Managers.
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-200">Task Deletion:</strong>
                        <span className="text-slate-400">
                          Permanent removal of tasks is restricted to Project Managers & Admins.
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <FolderKanban className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-200">Space Management:</strong>
                        <span className="text-slate-400">
                          Creating spaces, deleting spaces, and configuring space security.
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Permitted Column */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isLight
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                      : 'bg-emerald-950/20 border-emerald-500/30 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Team Member Execution Rights</span>
                  </div>

                  <ul className="space-y-2.5 text-[11px]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-200">Status & Workflow:</strong>
                        <span className="text-slate-400">
                          Freely advance tasks (Backlog ➔ To Do ➔ In Progress ➔ In Review ➔ Done).
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-200">Interactive Progress:</strong>
                        <span className="text-slate-400">
                          Drag and set execution progress percentages (0% to 100%).
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-200">Subtasks & Time Logging:</strong>
                        <span className="text-slate-400">
                          Add subtasks, check off checklist items, and log hours worked.
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Space Project Manager Contact Card */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B68EE] to-[#3BC0BB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {managerUser?.name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Project Manager for this Space
                    </span>
                    <p className="font-bold text-xs text-slate-200">
                      {managerUser?.name || 'Project Manager'} ({managerUser?.email || 'manager@workspace.io'})
                    </p>
                  </div>
                </div>

                {task && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('request_date')}
                    className="px-3 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Request Date Extension</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Request Due Date Change */}
          {activeTab === 'request_date' && task && (
            <div className="space-y-4">
              <div
                className={`p-3.5 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}
              >
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                  Target Task
                </span>
                <h3 className="text-sm font-bold text-slate-200 mt-0.5">{task.title}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span>
                    Current Due Date:{' '}
                    <strong className="text-slate-200 font-mono">
                      {task.dueDate || 'Not set'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Project:{' '}
                    <strong className="text-slate-200">{project?.title || 'Current Space'}</strong>
                  </span>
                </div>
              </div>

              {isSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-300">
                    Request Submitted Successfully!
                  </h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    A formal due date modification request has been posted to the task comments and
                    forwarded to the Project Manager for approval.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendDueDateRequest} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#3BC0BB]" />
                      <span>Proposed New Due Date</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={proposedDueDate}
                      onChange={(e) => setProposedDueDate(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-xs font-mono font-bold border focus:outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-[#0D9488]'
                          : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB]'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Reason for Date Adjustment</span>
                      <span className="text-[10px] text-slate-400">Required for review</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="e.g., Awaiting client design approvals, expanded scope requirement, or third-party dependency delay..."
                      className={`w-full rounded-xl p-3 text-xs border focus:outline-none resize-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-[#0D9488]'
                          : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB]'
                      }`}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Request to Manager</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: Roles Matrix */}
          {activeTab === 'roles' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Summary of operational permissions across user roles in the workspace:
              </p>

              <div className="space-y-2">
                {/* Admin */}
                <div
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase mt-0.5">
                    Admin
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="font-bold text-xs text-slate-200">System Administrator</h4>
                    <p className="text-[11px] text-slate-400">
                      Full universal access across all workspaces, user provisioning, global task deletion, and system configuration.
                    </p>
                  </div>
                </div>

                {/* Project Manager */}
                <div
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase mt-0.5">
                    Manager
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="font-bold text-xs text-slate-200">Project Manager</h4>
                    <p className="text-[11px] text-slate-400">
                      Authoritative control of project spaces. Can set/modify due dates, delete tasks, invite members, and adjust timelines.
                    </p>
                  </div>
                </div>

                {/* Team Member */}
                <div
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 uppercase mt-0.5">
                    Member
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="font-bold text-xs text-slate-200">Team Member (Contributor)</h4>
                    <p className="text-[11px] text-slate-400">
                      Active task execution, status progression, progress tracking, time logging, and collaboration. Cannot change due dates or delete tasks.
                    </p>
                  </div>
                </div>

                {/* Viewer */}
                <div
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30 uppercase mt-0.5">
                    Viewer
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="font-bold text-xs text-slate-200">Read-Only Viewer</h4>
                    <p className="text-[11px] text-slate-400">
                      Read-only inspection rights for tracking reports and milestones. Cannot edit tasks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between gap-3 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <span className="text-[11px] text-slate-400">
            {isManagerOrAdmin
              ? 'You have Manager/Admin authority in this workspace.'
              : 'You are signed in with Team Member rights.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-200 text-slate-800 hover:bg-slate-300 border-slate-300'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberRightsModal;
