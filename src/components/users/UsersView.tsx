import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  AlertTriangle,
  Check,
  X,
  Building2,
  Key,
  Plus,
  Globe,
  Briefcase,
  ExternalLink,
  Users as UsersIcon,
  Trash2,
  Mail,
  Lock,
  Edit2,
  ShieldAlert,
  Clock,
  FolderKanban,
  Layers,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  UserCheck,
  UserX,
  SlidersHorizontal,
  ArrowUpDown,
  UserCog,
  CheckCheck,
  Zap,
  Info,
  Camera,
  Cloud,
  UploadCloud
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APPROVED_DOMAINS, Role, CompanyType, Company, User } from '../../types';
import { getUserLastActive } from '../../lib/userActivity';
import { canCreateUser, canDeleteUser, canViewUsersDirectory } from '../../lib/permissions';
import { validatePasswordPolicy, generateSecureCompliantPassword } from '../../config/auth';
import { DolphinLogo } from '../common/DolphinLogo';
import { PermissionGuard } from '../common/PermissionGuard';
import { UserAvatar } from '../common/UserAvatar';
import { UserProfileEditModal } from './UserProfileEditModal';
import { PasswordComplexityValidatorUI } from '../auth/LoginModal';
import { CompanyIconBadge } from '../common/CompanyLogo';

export const UsersView: React.FC = () => {
  const {
    users,
    activityLogs,
    inviteUser,
    updateUser,
    deleteUser,
    activeCompany,
    companies,
    addCompany,
    authorizedDomains,
    addAuthorizedDomain,
    removeAuthorizedDomain,
    clearAllData,
    theme,
    projects,
    updateProject,
    dispatchEmailNotification,
    logActivity,
    currentUser,
    setActiveTab,
    syncAllUsersToFirestore
  } = useApp();

  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseSyncMessage, setFirebaseSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'skills' | 'domains' | 'companies'>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearSuccess, setClearSuccess] = useState('');
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [managingSpacesUserId, setManagingSpacesUserId] = useState<string | null>(null);

  // Workspace Invite Modal state
  const [showWorkspaceInviteModal, setShowWorkspaceInviteModal] = useState(false);
  const [workspaceInviteProjectId, setWorkspaceInviteProjectId] = useState<string>('');
  const [workspaceInviteUserIds, setWorkspaceInviteUserIds] = useState<string[]>([]);
  const [workspaceInviteNote, setWorkspaceInviteNote] = useState<string>('You have been invited to join our Dolphin workspace to collaborate on projects, tasks, and deliverables.');
  const [wsInviteError, setWsInviteError] = useState('');
  const [wsInviteSuccess, setWsInviteSuccess] = useState('');

  // Domain state
  const [newDomainInput, setNewDomainInput] = useState('');
  const [domainSuccess, setDomainSuccess] = useState('');

  // Add User Form State (Manual user creation)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [assignedPassword, setAssignedPassword] = useState('');
  const [role, setRole] = useState<Role>('Team Member');
  const [department, setDepartment] = useState('Engineering');
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || 'comp_5');

  // Custom company option state
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [customCompanyDomain, setCustomCompanyDomain] = useState('');

  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Search & Filter state for Team Members
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Password Reset Modal State
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');

  // Edit User Profile Modal State
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserDepartment, setEditUserDepartment] = useState('');
  const [editUserRole, setEditUserRole] = useState<Role>('Team Member');
  const [editUserCompanyId, setEditUserCompanyId] = useState('');
  const [editUserHourlyRate, setEditUserHourlyRate] = useState(100);
  const [editUserMaxHours, setEditUserMaxHours] = useState(40);
  const [editUserStatus, setEditUserStatus] = useState<'Active' | 'Offline' | 'In Meeting' | 'On Leave'>('Active');
  const [editUserSuccess, setEditUserSuccess] = useState('');

  // Legacy inline edit state (fallback)
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // User deletion confirm modal state
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null);

  // Register Company Form State
  const [compName, setCompName] = useState('');
  const [compCode, setCompCode] = useState('');
  const [compDomain, setCompDomain] = useState('');
  const [compType, setCompType] = useState<CompanyType>('Client');
  const [compDesc, setCompDesc] = useState('');
  const [compContact, setCompContact] = useState('');
  const [compLogo, setCompLogo] = useState('🏢');
  const [compError, setCompError] = useState('');
  const [compSuccess, setCompSuccess] = useState('');

  // Filtered Users computation
  const filteredUsers = users.filter((u) => {
    // Company filter
    if (companyFilter === 'internal') {
      const c = companies.find((comp) => comp.id === u.companyId);
      if (c?.isExternal) return false;
    } else if (companyFilter === 'external') {
      const c = companies.find((comp) => comp.id === u.companyId);
      if (!c?.isExternal) return false;
    } else if (companyFilter !== 'all' && u.companyId !== companyFilter) {
      return false;
    }

    // Role filter
    if (roleFilter !== 'all' && u.role !== roleFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && u.status !== statusFilter) {
      return false;
    }

    // Search query (name, email, department, company code, id)
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase().trim();
      const comp = companies.find((c) => c.id === u.companyId);
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchDept = u.department?.toLowerCase().includes(q);
      const matchComp = comp?.name?.toLowerCase().includes(q) || comp?.code?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      const matchId = u.id?.toLowerCase().includes(q);

      if (!matchName && !matchEmail && !matchDept && !matchComp && !matchRole && !matchId) {
        return false;
      }
    }

    return true;
  });

  // Password reset handlers
  const handleOpenPasswordResetModal = (u: User) => {
    setPasswordResetUser(u);
    // Pre-populate with existing password or generate a clean secure default
    const initialPass = u.password || generateSecureCompliantPassword();
    setNewPasswordInput(initialPass);
    setShowPassword(true);
    setPasswordCopied(false);
    setPasswordResetSuccess('');
    setPasswordResetError('');
  };

  const handleExecutePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordResetError('');
    setPasswordResetSuccess('');
    if (!passwordResetUser || !newPasswordInput.trim()) return;

    const trimmedPassword = newPasswordInput.trim();
    const pwdValidation = validatePasswordPolicy(trimmedPassword);
    if (!pwdValidation.isValid) {
      setPasswordResetError(`Password policy violation: ${pwdValidation.errors[0]}`);
      return;
    }

    updateUser(passwordResetUser.id, { password: trimmedPassword });

    setPasswordResetSuccess(`Password for ${passwordResetUser.name} (${passwordResetUser.email}) updated successfully to "${trimmedPassword}"!`);

    setTimeout(() => {
      setPasswordResetUser(null);
      setPasswordResetSuccess('');
      setPasswordResetError('');
    }, 1800);
  };

  // Toggle user status handler
  const handleToggleUserStatus = (u: User) => {
    const nextStatus: 'Active' | 'Offline' = u.status === 'Active' ? 'Offline' : 'Active';
    updateUser(u.id, { status: nextStatus });
  };

  // Open Edit User Modal
  const handleOpenEditUserModal = (u: User) => {
    setUserToEdit(u);
    setEditUserName(u.name);
    setEditUserEmail(u.email);
    setEditUserDepartment(u.department || 'Engineering');
    setEditUserRole(u.role);
    setEditUserCompanyId(u.companyId || companies[0]?.id || 'comp_5');
    setEditUserHourlyRate(u.hourlyRate || 100);
    setEditUserMaxHours(u.maxWeeklyHours || 40);
    setEditUserStatus(u.status || 'Active');
    setEditUserSuccess('');
  };

  // Save Edit User Modal
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    updateUser(userToEdit.id, {
      name: editUserName,
      department: editUserDepartment,
      role: editUserRole,
      companyId: editUserCompanyId,
      hourlyRate: Number(editUserHourlyRate) || 100,
      maxWeeklyHours: Number(editUserMaxHours) || 40,
      status: editUserStatus
    });

    setEditUserSuccess('User profile details updated successfully!');
    setTimeout(() => {
      setUserToEdit(null);
      setEditUserSuccess('');
    }, 1200);
  };

  const [invitedCode, setInvitedCode] = useState<string | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInvitedCode(null);

    if (!canCreateUser(currentUser)) {
      setInviteError('Permission denied: Team Members and Viewers cannot create or invite users.');
      return;
    }

    if (!name || !email) {
      setInviteError('Please provide both user full name and email address.');
      return;
    }

    let targetCompanyId = selectedCompanyId;
    const cleanEmail = email.toLowerCase().trim();
    const domain = cleanEmail.includes('@') ? cleanEmail.split('@')[1] : '';

    // Handle Custom Company Creation if selected
    if (isCustomCompany) {
      if (!customCompanyName) {
        setInviteError('Please enter a Custom Company Name.');
        return;
      }
      const newDomain = customCompanyDomain
        ? customCompanyDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').trim()
        : domain || `${customCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

      const newComp = addCompany({
        name: customCompanyName,
        code: customCompanyName.slice(0, 4).toUpperCase(),
        domain: newDomain,
        logo: '🏢',
        description: 'Manually added partner entity',
        type: 'Client',
        isExternal: true,
        contactEmail: cleanEmail
      });
      targetCompanyId = newComp.id;
    }

    // Auto-whitelist email domain if not whitelisted
    if (domain && !authorizedDomains.map((d) => d.toLowerCase()).includes(domain)) {
      addAuthorizedDomain(domain);
    }

    const finalPassword = assignedPassword.trim() || generateSecureCompliantPassword();
    const pwdValidation = validatePasswordPolicy(finalPassword);
    if (!pwdValidation.isValid) {
      setInviteError(`Password security requirement failure: ${pwdValidation.errors[0]}`);
      return;
    }

    const res = inviteUser(name, email, role, department, targetCompanyId, finalPassword, selectedSpaceIds);

    if (!res.success) {
      setInviteError(res.error || 'Failed to add user.');
    } else {
      const targetComp = companies.find((c) => c.id === targetCompanyId) || { name: customCompanyName || 'Specified Entity' };
      setInviteSuccess(
        `User "${name}" (${email}) added successfully with assigned password "${finalPassword}" and ${selectedSpaceIds.length} space(s) assigned!`
      );
      setTimeout(() => {
        setShowInviteModal(false);
        setName('');
        setEmail('');
        setAssignedPassword('');
        setRole('Team Member');
        setDepartment('Engineering');
        setIsCustomCompany(false);
        setCustomCompanyName('');
        setCustomCompanyDomain('');
        setSelectedSpaceIds([]);
        setInviteSuccess('');
      }, 1400);
    }
  };

  const handleSendWorkspaceInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setWsInviteError('');
    setWsInviteSuccess('');

    if (!canCreateUser(currentUser)) {
      setWsInviteError('Permission denied: Team Members and Viewers cannot invite users to workspaces.');
      return;
    }

    const targetProjId = workspaceInviteProjectId || projects[0]?.id;

    if (!targetProjId) {
      setWsInviteError('Please select a target workspace.');
      return;
    }

    if (workspaceInviteUserIds.length === 0) {
      setWsInviteError('Please select at least one user to invite.');
      return;
    }

    const targetProject = projects.find((p) => p.id === targetProjId);
    if (!targetProject) {
      setWsInviteError('Selected workspace not found.');
      return;
    }

    // Assign users to workspace
    const currentMembers = targetProject.members || [];
    const updatedMembers = Array.from(new Set([...currentMembers, ...workspaceInviteUserIds]));
    updateProject(targetProject.id, { members: updatedMembers });

    // Send email invitations & log activity
    let count = 0;
    workspaceInviteUserIds.forEach((uId) => {
      const targetUser = users.find((u) => u.id === uId);
      if (targetUser) {
        const emailBody = `Dear ${targetUser.name},\n\n` +
          `You have been invited by ${currentUser?.name || 'Workspace Manager'} (${currentUser?.email || 'Admin'}) to join the workspace:\n\n` +
          `📌 Workspace Name: ${targetProject.title}\n` +
          `🏷️ Workspace Code: ${targetProject.code}\n` +
          `📁 Category: ${targetProject.category}\n` +
          `⚡ Status: ${targetProject.status}\n\n` +
          (workspaceInviteNote.trim() ? `💬 Note from Manager:\n"${workspaceInviteNote.trim()}"\n\n` : '') +
          `As an assigned member of this workspace, you can now view its tasks, participate in discussions, upload documents, and track deliverables in Dolphin Heat Transfer SPS LLC.\n\n` +
          `Log in to your Dolphin account to access this workspace.\n\n` +
          `Best regards,\n` +
          `Dolphin Heat Transfer SPS LLC Workspace Governance Team`;

        dispatchEmailNotification({
          toEmail: targetUser.email,
          toName: targetUser.name,
          subject: `Workspace Invitation: Joined "${targetProject.title}" (${targetProject.code})`,
          body: emailBody,
          category: 'Invitation',
          relatedProjectId: targetProject.id
        });

        if (logActivity) {
          logActivity(
            'invited user to workspace',
            targetUser.name,
            'user',
            targetProject.id,
            undefined,
            `Invited ${targetUser.name} (${targetUser.email}) to workspace "${targetProject.title}" and dispatched email alert`,
            'info'
          );
        }
        count++;
      }
    });

    setWsInviteSuccess(
      `Successfully assigned ${count} user(s) to workspace "${targetProject.title}" and sent email invitation(s)!`
    );

    setTimeout(() => {
      setShowWorkspaceInviteModal(false);
      setWorkspaceInviteUserIds([]);
      setWsInviteSuccess('');
    }, 1600);
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setCompError('');
    setCompSuccess('');

    if (!compDomain.includes('.')) {
      setCompError('Please enter a valid domain (e.g. company.com or partner.ae)');
      return;
    }

    const cleanDomain = compDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').trim();
    const existing = companies.find((c) => (c?.domain || '').toLowerCase() === cleanDomain);

    if (existing) {
      setCompError(`A company with domain @${cleanDomain} already exists (${existing.name}).`);
      return;
    }

    const created = addCompany({
      name: compName,
      code: compCode.toUpperCase(),
      domain: cleanDomain,
      logo: compLogo || '🏢',
      description: compDesc,
      type: compType,
      isExternal: compType !== 'Internal Dolphin Entity',
      contactEmail: compContact
    });

    setCompSuccess(`Registered ${created.name} (@${created.domain})! Users from this company can now be invited.`);
    setTimeout(() => {
      setShowCompanyModal(false);
      setCompName('');
      setCompCode('');
      setCompDomain('');
      setCompDesc('');
      setCompContact('');
      setCompSuccess('');
    }, 1500);
  };

  const permissionsMatrix = [
    { feature: 'View User Directory & Member Profiles', Admin: true, PM: true, Member: false, Viewer: false },
    { feature: 'Create & Archive Projects', Admin: true, PM: true, Member: false, Viewer: false },
    { feature: 'Edit Task Deliverables', Admin: true, PM: true, Member: true, Viewer: false },
    { feature: 'Log Work Hours & Timesheets', Admin: true, PM: true, Member: true, Viewer: false },
    { feature: 'Run AI Contract Parser', Admin: true, PM: true, Member: true, Viewer: false },
    { feature: 'Configure Automations', Admin: true, PM: true, Member: false, Viewer: false },
    { feature: 'Register External Partner Companies', Admin: true, PM: true, Member: false, Viewer: false },
    { feature: 'Invite Corporate & Guest Users', Admin: true, PM: true, Member: false, Viewer: false },
  ];

  const isLight = theme === 'light';

  // Role Access Guard: Team Members & Viewers cannot view user profiles / organization directory
  if (!canViewUsersDirectory(currentUser)) {
    return (
      <div className={`p-4 sm:p-8 max-w-4xl mx-auto my-12 animate-in fade-in ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
        <div className={`p-8 rounded-2xl border text-center shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mx-auto flex items-center justify-center mb-5 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Access Restricted: Users & Teams Master View
          </h2>

          <p className={`text-sm max-w-lg mx-auto mb-6 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Your account is currently assigned the <span className="font-bold text-amber-500">"{currentUser?.role || 'Team Member'}"</span> access role. Accessing the Users master view, member profiles, user invitations, and administrative governance records is strictly restricted to <span className="font-semibold text-emerald-500">Workspace Administrators</span>.
          </p>

          <div className={`p-4 rounded-xl border max-w-md mx-auto mb-8 text-left text-xs space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0D1520] border-[#233549] text-slate-300'
          }`}>
            <div className="font-bold flex items-center gap-1.5 text-[#3BC0BB]">
              <ShieldCheck className="w-4 h-4" />
              <span>Your Permitted Workspace Actions</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
              <li>Manage assigned tasks & update deliverable statuses</li>
              <li>Log working hours, timesheets & completion notes</li>
              <li>Collaborate in space channels & comment threads</li>
              <li>Upload and preview project documents</li>
            </ul>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-2.5 rounded-xl bg-[#00AEA9] hover:bg-[#009691] text-white font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Return to Workspace Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3BC0BB] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#3BC0BB]" />
            <span>User & Company Governance</span>
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Dolphin Heat Transfer SPS LLC domain whitelist, partner company registration, and role-based permissions (RBAC).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PermissionGuard action="delete_user">
            <button
              onClick={() => setShowClearConfirmModal(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700'
                  : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400'
              }`}
              title="Wipe sample projects, tasks, and activities to start adding real data"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Old Data</span>
            </button>

            <button
              onClick={() => setShowCompanyModal(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs transition-all shadow-md ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-800'
                  : 'bg-[#16222F] hover:bg-[#1A2838] border border-[#233549] text-white'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#3BC0BB]" />
              <span>Register Company</span>
            </button>
          </PermissionGuard>

          <PermissionGuard action="create_user">
            <button
              onClick={async () => {
                setIsSyncingFirebase(true);
                setFirebaseSyncMessage(null);
                try {
                  const res = await syncAllUsersToFirestore();
                  if (res.success) {
                    setFirebaseSyncMessage({
                      type: 'success',
                      text: `Successfully synced ${res.count} users directly to Firebase Firestore database!`
                    });
                  } else {
                    setFirebaseSyncMessage({
                      type: 'error',
                      text: res.error || 'Failed to sync users to Firebase.'
                    });
                  }
                } catch (err: any) {
                  setFirebaseSyncMessage({
                    type: 'error',
                    text: err?.message || 'Error occurred during sync.'
                  });
                } finally {
                  setIsSyncingFirebase(false);
                  setTimeout(() => setFirebaseSyncMessage(null), 6000);
                }
              }}
              disabled={isSyncingFirebase}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-md ${
                isLight
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-emerald-600/90 hover:bg-emerald-600 text-white'
              } disabled:opacity-50`}
              title="Push all local & cached users directly into Firebase Firestore users collection"
            >
              {isSyncingFirebase ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span>{isSyncingFirebase ? 'Syncing...' : 'Sync All to Firebase'}</span>
            </button>

            <button
              onClick={() => {
                setShowWorkspaceInviteModal(true);
                setWsInviteError('');
                setWsInviteSuccess('');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3BC0BB] hover:bg-[#3BC0BB]/90 text-slate-900 font-bold text-xs shadow-lg shadow-[#3BC0BB]/20 transition-all"
            >
              <FolderKanban className="w-4 h-4" />
              <span>Invite to Workspace</span>
            </button>

            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-lg shadow-[#0773BB]/30 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Users</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      {firebaseSyncMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${
            firebaseSyncMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{firebaseSyncMessage.text}</span>
        </div>
      )}
      <div className={`flex items-center gap-2 border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'users'
              ? 'bg-[#0773BB] text-white shadow-lg'
              : isLight
              ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          <span>Active Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('domains')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'domains'
              ? 'bg-[#0773BB] text-white shadow-lg'
              : isLight
              ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 text-[#3BC0BB]" />
          <span>Email Access Control ({authorizedDomains.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('skills')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'skills'
              ? 'bg-[#0773BB] text-white shadow-lg'
              : isLight
              ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#3BC0BB]" />
          <span>Skills & Access Rules</span>
        </button>

        <button
          onClick={() => setActiveSubTab('companies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'companies'
              ? 'bg-[#0773BB] text-white shadow-lg'
              : isLight
              ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Registered Entities ({companies.length})</span>
        </button>
      </div>

      {/* Domain Whitelist Summary Banner */}
      <div className={`p-5 rounded-2xl backdrop-blur-md space-y-3 shadow-xl ${
        isLight
          ? 'bg-white border border-[#0773BB]/30 text-slate-900'
          : 'bg-[#16222F]/80 border border-[#3BC0BB]/40 text-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#0773BB] uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Dolphin Heat Transfer SPS LLC & Whitelisted Partner Domains</span>
          </span>
          <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            {APPROVED_DOMAINS.length} Core Dolphin Domains + {companies.filter(c => c.isExternal).length} External Partner Domains Whitelisted
          </span>
        </div>
        <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          Direct signups and invitations are restricted to verified <strong>Dolphin Heat Transfer SPS LLC / Dolphin Group</strong> domains, or companies registered by the Admin:
        </p>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
          {companies.map((c) => (
            <span
              key={c.id}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 shadow-sm ${
                isLight
                  ? 'bg-slate-100 border border-slate-300 text-slate-900'
                  : 'bg-[#0D1520] border border-[#0773BB]/50 text-white'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#0773BB]" />
              <span className={`font-sans font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.name}</span>
              <span className="text-[#0773BB] font-mono">({c.domain})</span>
            </span>
          ))}
        </div>
      </div>

      {/* VIEW 1: Active Users Table & Modern Directory */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className={`p-4 rounded-2xl border transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F]/90 border-[#233549] shadow-lg'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Total Team Members
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#0773BB]/10 text-[#0773BB] flex items-center justify-center">
                  <UsersIcon className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {users.length}
              </div>
              <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Across {companies.length} corporate entities
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F]/90 border-[#233549] shadow-lg'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Active Online
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {users.filter((u) => u.status === 'Active').length}
                </span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Live session authenticated
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F]/90 border-[#233549] shadow-lg'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Admins & Governance
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {users.filter((u) => u.role === 'Admin').length}
              </div>
              <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Full system clearance
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F]/90 border-[#233549] shadow-lg'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Project Managers & PMs
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#3BC0BB]/10 text-[#0F766E] flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {users.filter((u) => u.role === 'Project Manager').length}
              </div>
              <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Leading workspace spaces
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className={`p-6 rounded-2xl backdrop-blur-md space-y-5 shadow-xl border ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F]/80 border-[#233549] text-white'
          }`}>
            {/* Header Title & Action Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0773BB]/10 text-[#0773BB] flex items-center justify-center">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <span>Team Members & Organization Users</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0773BB]/10 text-[#0773BB] border border-[#0773BB]/20">
                        {filteredUsers.length} of {users.length}
                      </span>
                    </h2>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Manage user credentials, passwords, workspace assignments, roles, and real-time statuses.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {currentUser?.role === 'Admin' && (
                  <>
                    <button
                      onClick={() => {
                        setShowWorkspaceInviteModal(true);
                        setWsInviteError('');
                        setWsInviteSuccess('');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>Invite to Workspace</span>
                    </button>

                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white font-bold text-xs shadow-md transition-all shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Add User</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user by name, email, department, company..."
                  className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0773BB] transition-all ${
                    isLight
                      ? 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400'
                      : 'bg-[#16222F] border border-[#233549] text-white placeholder:text-slate-500'
                  }`}
                />
                {userSearchQuery && (
                  <button
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Company Filter */}
                <div className="flex items-center gap-1">
                  <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Entity:</span>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className={`text-xs font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0773BB] ${
                      isLight
                        ? 'bg-white border border-slate-300 text-slate-800'
                        : 'bg-[#16222F] border border-[#233549] text-slate-200'
                    }`}
                  >
                    <option value="all">All Companies</option>
                    <option value="internal">Dolphin Internal Only</option>
                    <option value="external">External Partners Only</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-1">
                  <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className={`text-xs font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0773BB] ${
                      isLight
                        ? 'bg-white border border-slate-300 text-slate-800'
                        : 'bg-[#16222F] border border-[#233549] text-slate-200'
                    }`}
                  >
                    <option value="all">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Team Member">Team Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1">
                  <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`text-xs font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0773BB] ${
                      isLight
                        ? 'bg-white border border-slate-300 text-slate-800'
                        : 'bg-[#16222F] border border-[#233549] text-slate-200'
                    }`}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(userSearchQuery || companyFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setUserSearchQuery('');
                      setCompanyFilter('all');
                      setRoleFilter('all');
                      setStatusFilter('all');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-[#16222F] text-slate-300 hover:text-white border border-[#233549]'
                    }`}
                    title="Clear search and filters"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-[#233549]">
              <table className={`w-full text-left text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                <thead className={`font-bold uppercase tracking-wider ${
                  isLight
                    ? 'bg-slate-100/90 text-slate-700 border-b border-slate-200'
                    : 'bg-[#0D1520] text-slate-400 border-b border-[#233549]'
                }`}>
                  <tr>
                    <th className="p-3.5 pl-4">User Profile</th>
                    <th className="p-3.5">Company Entity</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Access Role</th>
                    <th className="p-3.5">Assigned Spaces</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Last Active</th>
                    <th className="p-3.5 pr-4 text-right">Controller Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#233549]'}`}>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <UsersIcon className="w-8 h-8 text-slate-400 stroke-1" />
                          <p className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            No team members found matching your search criteria
                          </p>
                          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                            Try adjusting your search terms, entity filter, or role filter.
                          </p>
                          <button
                            onClick={() => {
                              setUserSearchQuery('');
                              setCompanyFilter('all');
                              setRoleFilter('all');
                              setStatusFilter('all');
                            }}
                            className="mt-2 px-3 py-1.5 rounded-xl bg-[#0773BB] text-white text-xs font-bold"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const comp = companies.find((c) => c.id === u.companyId);
                      const isCurrentUser = currentUser?.id === u.id;
                      const isOnline = u.status === 'Active';

                      return (
                        <tr
                          key={u.id}
                          className={`transition-colors ${
                            isLight
                              ? 'hover:bg-sky-50/50'
                              : 'hover:bg-[#0D1520]/80'
                          }`}
                        >
                          {/* User Profile */}
                          <td className="p-3.5 pl-4">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => handleOpenEditUserModal(u)}
                                className="relative shrink-0 group cursor-pointer"
                                title="Click to edit user profile or details"
                              >
                                <UserAvatar
                                  name={u.name}
                                  email={u.email}
                                  role={u.role}
                                  size="md"
                                  theme={theme}
                                />
                                <span
                                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#16222F] ${
                                    isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`}
                                  title={isOnline ? 'Active Online' : 'Offline'}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    onClick={() => handleOpenEditUserModal(u)}
                                    className={`font-bold text-sm truncate cursor-pointer hover:underline hover:text-[#0773BB] dark:hover:text-[#3BC0BB] ${isLight ? 'text-slate-900' : 'text-white'}`}
                                  >
                                    {u.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#0773BB]/20 text-[#0773BB] border border-[#0773BB]/30">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {u.email}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(u.email);
                                      setCopiedEmailId(u.id);
                                      setTimeout(() => setCopiedEmailId(null), 1500);
                                    }}
                                    className={`p-0.5 rounded transition-all ${
                                      copiedEmailId === u.id
                                        ? 'text-emerald-500 font-bold'
                                        : isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                    title={copiedEmailId === u.id ? 'Copied!' : 'Copy email address'}
                                  >
                                    {copiedEmailId === u.id ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  ID: {u.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Company Entity */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#0773BB] shrink-0" />
                              <div>
                                <div className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                                  {comp?.name || 'Dolphin Group'}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                    isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-[#0D1520] text-slate-400 border border-[#233549]'
                                  }`}>
                                    {comp?.code || 'CORP'}
                                  </span>
                                  {comp?.isExternal && (
                                    <span className="text-[9px] font-bold px-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                      External
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              isLight
                                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                : 'bg-[#0D1520] text-slate-300 border border-[#233549]'
                            }`}>
                              {u.department || 'Engineering'}
                            </span>
                          </td>

                          {/* Access Level (Role Controller) */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={u.role}
                                onChange={(e) => updateUser(u.id, { role: e.target.value as Role })}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0773BB] shadow-sm ${
                                  u.role === 'Admin'
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                    : u.role === 'Project Manager'
                                    ? 'bg-[#0773BB]/15 text-[#0773BB] dark:text-[#38BDF8] border-[#0773BB]/30'
                                    : u.role === 'Team Member'
                                    ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30'
                                    : isLight
                                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                                title="Change Access Role"
                              >
                                <option value="Viewer" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0D1520] text-slate-300'}>
                                  Viewer (Read-Only)
                                </option>
                                <option value="Team Member" className={isLight ? 'bg-white text-teal-800' : 'bg-[#0D1520] text-teal-400'}>
                                  Team Member (Standard)
                                </option>
                                <option value="Project Manager" className={isLight ? 'bg-white text-blue-800' : 'bg-[#0D1520] text-[#38BDF8]'}>
                                  Project Manager (PM)
                                </option>
                                <option value="Admin" className={isLight ? 'bg-white text-amber-800' : 'bg-[#0D1520] text-amber-400'}>
                                  Admin (Super Admin)
                                </option>
                              </select>
                            </div>
                          </td>

                          {/* Assigned Spaces */}
                          <td className="p-3.5">
                            {u.role === 'Admin' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <ShieldCheck className="w-3 h-3" />
                                <span>All Workspaces (Admin)</span>
                              </span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(() => {
                                  const userSpaces = projects.filter(
                                    (p) => p.managerId === u.id || (p.members && p.members.includes(u.id)) || (p.memberRoles && p.memberRoles[u.id])
                                  );
                                  if (userSpaces.length === 0) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                        0 Spaces Assigned
                                      </span>
                                    );
                                  }
                                  return userSpaces.slice(0, 2).map((sp) => (
                                    <span
                                      key={sp.id}
                                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0773BB]/10 text-[#0773BB] dark:text-[#38BDF8] border border-[#0773BB]/20"
                                      title={sp.title}
                                    >
                                      {sp.title.length > 14 ? sp.title.slice(0, 14) + '...' : sp.title}
                                    </span>
                                  ));
                                })()}
                                {(() => {
                                  const userSpaces = projects.filter(
                                    (p) => p.managerId === u.id || (p.members && p.members.includes(u.id)) || (p.memberRoles && p.memberRoles[u.id])
                                  );
                                  if (userSpaces.length > 2) {
                                    return (
                                      <span className="text-[10px] font-bold text-slate-500">
                                        +{userSpaces.length - 2}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                                {currentUser?.role === 'Admin' && (
                                  <button
                                    onClick={() => setManagingSpacesUserId(u.id)}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400 hover:bg-teal-500/25 border border-teal-500/30 transition-all flex items-center gap-1 shrink-0"
                                    title="Assign or modify spaces for this user"
                                  >
                                    <FolderKanban className="w-3 h-3" />
                                    <span>Manage</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                isOnline
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 hover:bg-slate-500/25'
                              }`}
                              title={`Click to switch status to ${isOnline ? 'Offline' : 'Active'}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <span>{u.status}</span>
                            </button>
                          </td>

                          {/* Last Active */}
                          <td className="p-3.5 font-mono">
                            {(() => {
                              const lastActiveInfo = getUserLastActive(u, activityLogs);
                              return (
                                <div
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl w-fit text-xs font-semibold ${
                                    isLight
                                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                      : 'bg-[#0D1520] text-teal-300 border border-[#233549]'
                                  }`}
                                  title={`Last active: ${lastActiveInfo.fullDate}`}
                                >
                                  <Clock className="w-3.5 h-3.5 text-teal-500" />
                                  <span>{lastActiveInfo.text}</span>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Controller Actions */}
                          <td className="p-3.5 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1. Reset Password Action Button */}
                              {(currentUser?.role === 'Admin' || currentUser?.id === u.id) && (
                                <button
                                  onClick={() => handleOpenPasswordResetModal(u)}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                                  title="Reset User Password & Credentials"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Reset Password</span>
                                </button>
                              )}

                              {/* 2. Manage Spaces Shortcut */}
                              {currentUser?.role === 'Admin' && u.role !== 'Admin' && (
                                <button
                                  onClick={() => setManagingSpacesUserId(u.id)}
                                  className={`p-1.5 rounded-xl text-xs transition-all flex items-center gap-1 ${
                                    isLight
                                      ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                                      : 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                  }`}
                                  title="Manage Workspaces"
                                >
                                  <FolderKanban className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* 3. Edit Profile & Picture Modal Trigger */}
                              <button
                                onClick={() => handleOpenEditUserModal(u)}
                                className={`p-1.5 rounded-xl text-xs transition-all flex items-center gap-1 font-bold ${
                                  isLight
                                    ? 'bg-sky-50 hover:bg-sky-100 text-[#0773BB] border border-sky-200'
                                    : 'bg-[#0773BB]/10 hover:bg-[#0773BB]/20 text-[#38BDF8] border border-[#0773BB]/30'
                                }`}
                                title="Edit User Profile & Change Avatar"
                              >
                                <Camera className="w-3.5 h-3.5 text-[#0773BB] dark:text-[#38BDF8]" />
                                <span className="hidden xl:inline">Edit & Photo</span>
                              </button>

                              {/* 4. Delete User (Protected) */}
                              <PermissionGuard action="delete_user">
                                {u.id !== currentUser?.id && (
                                  <button
                                    onClick={() => setUserToDelete({ id: u.id, name: u.name, email: u.email })}
                                    className={`p-1.5 rounded-xl text-xs transition-all flex items-center gap-1 ${
                                      isLight
                                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    }`}
                                    title="Remove User Access"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </PermissionGuard>
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
        </div>
      )}

      {/* VIEW: Skills & Access Rules Matrix */}
      {activeSubTab === 'skills' && (
        <div className="space-y-6">
          {/* Team Skills Matrix */}
          <div className={`p-6 rounded-2xl space-y-4 shadow-xl ${
            isLight ? 'bg-white border border-slate-200' : 'bg-[#16222F] border border-[#233549]'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
              isLight ? 'border-slate-200' : 'border-[#233549]'
            }`}>
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <ShieldCheck className="w-5 h-5 text-[#3BC0BB]" />
                  <span>Team Competency & Engineering Skills Matrix</span>
                </h2>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Track team member engineering certifications, ISO hydrostatic testing qualifications, and platform access tiers.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`font-mono uppercase tracking-wider text-[11px] border-b ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0D1520] text-slate-400 border-[#233549]'
                  }`}>
                    <th className="py-3.5 px-4">Team Member</th>
                    <th className="py-3.5 px-4">Role & Entity</th>
                    <th className="py-3.5 px-4">Primary Technical Skills</th>
                    <th className="py-3.5 px-4">Certifications</th>
                    <th className="py-3.5 px-4">Access Level</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#233549]'}`}>
                  {users.map((u) => {
                    const comp = companies.find((c) => c.id === u.companyId);
                    return (
                      <tr key={u.id} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-[#1A2838] transition-colors'}>
                        <td className={`py-3.5 px-4 font-bold flex items-center gap-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <UserAvatar
                            name={u.name}
                            email={u.email}
                            role={u.role}
                            size="sm"
                            theme={theme}
                          />
                          <div>
                            <p className="font-bold">{u.name}</p>
                            <p className={`text-[10px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{u.email}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{u.role}</p>
                          <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{comp?.name || 'Dolphin Group'}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 rounded bg-[#0773BB]/20 text-[#0773BB] font-mono text-[10px] font-bold">
                              {u.department || 'Engineering'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 font-mono text-[10px] font-bold">
                              Hydrostatic Testing
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                            isLight
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}>
                            DEWA / ISO 9001 Certified
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            u.role === 'Admin'
                              ? 'bg-amber-500/20 text-amber-800 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/40'
                          }`}>
                            {u.role === 'Admin' ? 'FULL ADMIN ACCESS' : 'MEMBER ACCESS'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Access Rules Matrix */}
          <div className={`p-6 rounded-2xl space-y-4 shadow-xl ${
            isLight ? 'bg-white border border-slate-200' : 'bg-[#16222F] border border-[#233549]'
          }`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Key className="w-4 h-4 text-amber-500" />
              <span>Role-Based Access Control (RBAC) Matrix</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`font-mono uppercase tracking-wider text-[11px] border-b ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0D1520] text-slate-400 border-[#233549]'
                  }`}>
                    <th className="py-3 px-4">Platform Feature / Capability</th>
                    <th className="py-3 px-4 text-center">Administrator</th>
                    <th className="py-3 px-4 text-center">Project Manager</th>
                    <th className="py-3 px-4 text-center">Team Member</th>
                    <th className="py-3 px-4 text-center">Auditor / Client</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#233549]'}`}>
                  {permissionsMatrix.map((row, idx) => (
                    <tr key={idx} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-[#1A2838] transition-colors'}>
                      <td className={`py-3 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{row.feature}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-600 font-bold">✓ Full</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={row.PM ? 'text-emerald-600 font-bold' : isLight ? 'text-slate-400' : 'text-slate-500'}>
                          {row.PM ? '✓ Allowed' : '✕ Restricted'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={row.Member ? 'text-emerald-600 font-bold' : isLight ? 'text-slate-400' : 'text-slate-500'}>
                          {row.Member ? '✓ Allowed' : '✕ Restricted'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={row.Viewer ? 'text-emerald-600 font-bold' : isLight ? 'text-slate-400' : 'text-slate-500'}>
                          {row.Viewer ? '✓ Read Only' : '✕ Restricted'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Email Access Control Domains Tab */}
      {activeSubTab === 'domains' && (
        <div className="space-y-4">
          <div className={`p-6 rounded-2xl space-y-4 shadow-xl ${
            isLight ? 'bg-white border border-slate-200' : 'bg-[#16222F] border border-[#233549]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <ShieldCheck className="w-5 h-5 text-[#3BC0BB]" />
                  <span>Project Management Email Whitelist Control</span>
                </h2>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Control which corporate email domains can sign in, create accounts, and access project management data.
                </p>
              </div>

              {/* Add Domain Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newDomainInput) return;
                  addAuthorizedDomain(newDomainInput);
                  setDomainSuccess(`Domain @${newDomainInput.toLowerCase().replace(/^@/, '')} added to authorized whitelist!`);
                  setNewDomainInput('');
                  setTimeout(() => setDomainSuccess(''), 3000);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="e.g. dolrad.ae"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[#0773BB] ${
                    isLight
                      ? 'bg-slate-100 border border-slate-300 text-slate-900'
                      : 'bg-[#0D1520] border border-[#233549] text-white'
                  }`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Domain</span>
                </button>
              </form>
            </div>

            {domainSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{domainSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {Array.from(new Set(authorizedDomains)).map((dom) => {
                const domainUsersCount = users.filter((u) => (u?.email || '').toLowerCase().endsWith(`@${dom}`)).length;
                return (
                  <div
                    key={`user-dom-${dom}`}
                    className={`p-4 rounded-xl flex items-center justify-between shadow-inner ${
                      isLight ? 'bg-slate-50 border border-slate-200' : 'bg-[#0D1520] border border-[#233549]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className={`font-mono font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>@{dom}</span>
                      </div>
                      <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {domainUsersCount} active team members
                      </div>
                    </div>

                    {authorizedDomains.length > 1 && (
                      <button
                        onClick={() => removeAuthorizedDomain(dom)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 transition-all"
                        title="Remove Domain Authorization"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Companies Directory Tab */}
      {activeSubTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Registered Companies & Partner Directory</h2>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Manage internal Dolphin entities and registered client / contractor / vendor companies.
              </p>
            </div>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Company</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => {
              const compUsers = users.filter((u) => u.companyId === c.id);
              return (
                <div
                  key={c.id}
                  className={`p-5 rounded-2xl backdrop-blur-md transition-all space-y-3 shadow-xl ${
                    isLight
                      ? 'bg-white border border-slate-200 hover:border-[#0773BB]'
                      : 'bg-[#16222F]/80 border border-[#233549] hover:border-[#0773BB]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden ${
                        isLight ? 'bg-slate-100 border border-slate-200' : 'bg-[#0D1520] border border-[#233549]'
                      }`}>
                        <CompanyIconBadge logo={c.logo} name={c.name} size="md" />
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-[#0773BB] font-bold">@{c.domain}</span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>({c.code})</span>
                        </div>
                      </div>
                    </div>

                    {c.isExternal ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30 shrink-0">
                        {c.type || 'External'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-800 border border-sky-500/30 shrink-0">
                        Internal Entity
                      </span>
                    )}
                  </div>

                  <p className={`text-xs line-clamp-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{c.description}</p>

                  <div className={`flex items-center justify-between text-xs pt-2 border-t ${
                    isLight ? 'border-slate-200 text-slate-600' : 'border-[#233549] text-slate-400'
                  }`}>
                    <span className="flex items-center gap-1">
                      <UsersIcon className="w-3.5 h-3.5 text-[#0773BB]" />
                      <span>{compUsers.length} Active Users</span>
                    </span>
                    {c.contactEmail && (
                      <span className="font-mono text-[10px] truncate max-w-[150px]">
                        {c.contactEmail}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Add User & Grant Access Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 border ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <UserPlus className="w-5 h-5 text-[#0773BB]" />
                  <span>Add New User & Assign Access Level</span>
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Manually add a team member or partner user, specify their company, and assign their access permissions.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Hamdan Al-Nuaimi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Corporate Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g., hamdan@company.com"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    if (val.includes('@') && !isCustomCompany) {
                      const dom = (val.split('@')[1] || '').toLowerCase().trim();
                      const matchedComp = companies.find((c) => (c?.domain || '').toLowerCase() === dom);
                      if (matchedComp) {
                        setSelectedCompanyId(matchedComp.id);
                      }
                    }
                  }}
                  className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                  }`}
                />
              </div>

              {/* Password Setting Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Assigned Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randPass = generateSecureCompliantPassword();
                      setAssignedPassword(randPass);
                    }}
                    className="text-[11px] text-[#0773BB] hover:underline font-bold flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" /> Auto-Generate Secure Password
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Dolphin@2026 (or leave blank for auto Dolphin@123)"
                  value={assignedPassword}
                  onChange={(e) => setAssignedPassword(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#0773BB] ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-amber-800'
                      : 'bg-[#0D1520] border border-[#233549] text-amber-300'
                  }`}
                />
              </div>

              {/* Company Selection or Custom Company Entry */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Company Entity *</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCompany(!isCustomCompany)}
                    className="text-[11px] text-[#0773BB] hover:underline font-bold"
                  >
                    {isCustomCompany ? '← Choose Existing Company' : '+ Enter Custom Company Name'}
                  </button>
                </div>

                {isCustomCompany ? (
                  <div className={`space-y-2 p-3 rounded-xl border animate-in fade-in ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0D1520] border-[#0773BB]/50'
                  }`}>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Dolphin Cooling Systems LLC"
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        className={`w-full rounded-lg px-2.5 py-1.5 ${
                          isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-[#16222F] border border-[#233549] text-white'
                        }`}
                        required={isCustomCompany}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Company Domain (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., dolcool.ae"
                        value={customCompanyDomain}
                        onChange={(e) => setCustomCompanyDomain(e.target.value)}
                        className={`w-full rounded-lg px-2.5 py-1.5 font-mono ${
                          isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-[#16222F] border border-[#233549] text-white'
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                    }`}
                  >
                    <optgroup label="Internal Dolphin Entities">
                      {companies
                        .filter((c) => !c.isExternal)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.domain})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Registered External Partners & Clients">
                      {companies
                        .filter((c) => c.isExternal)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} - {c.type} ({c.domain})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                )}
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Access Level (Role) *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                    }`}
                  >
                    <option value="Viewer">Viewer (Read-Only Access)</option>
                    <option value="Team Member">Team Member (Standard Member)</option>
                    <option value="Project Manager">Project Manager (PM Access)</option>
                    <option value="Admin">Admin (Full System Governance)</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 ${
                      isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                    }`}
                    placeholder="e.g. Thermal Design, QA/QC"
                  />
                </div>
              </div>

              {/* Assign Spaces (Workspaces) Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <FolderKanban className="w-3.5 h-3.5 text-[#0773BB]" />
                    <span>Assign Spaces (Workspaces)</span>
                    <span className={`text-[10px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      ({selectedSpaceIds.length} selected)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSpaceIds.length === projects.length) {
                        setSelectedSpaceIds([]);
                      } else {
                        setSelectedSpaceIds(projects.map((p) => p.id));
                      }
                    }}
                    className="text-[11px] text-[#0773BB] hover:underline font-bold"
                  >
                    {selectedSpaceIds.length === projects.length ? 'Deselect All' : 'Select All Spaces'}
                  </button>
                </div>
                <p className={`text-[11px] mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Non-admin users can ONLY view spaces assigned to them. If no spaces are checked, the user will not see any spaces upon login until assigned.
                </p>
                <div className={`max-h-36 overflow-y-auto p-2 rounded-xl border space-y-1.5 ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
                }`}>
                  {projects.map((proj) => {
                    const isChecked = selectedSpaceIds.includes(proj.id);
                    return (
                      <label
                        key={proj.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                          isChecked
                            ? isLight ? 'bg-sky-50 text-slate-900 font-bold border border-sky-200' : 'bg-[#0773BB]/20 text-white font-bold border border-[#0773BB]/40'
                            : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-[#16222F] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSpaceIds((prev) => [...prev, proj.id]);
                              } else {
                                setSelectedSpaceIds((prev) => prev.filter((id) => id !== proj.id));
                              }
                            }}
                            className="rounded text-[#0773BB] focus:ring-[#0773BB]"
                          />
                          <span>{proj.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">({proj.code})</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 font-mono">
                          {companies.find((c) => c.id === proj.companyId)?.code || 'Global'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {inviteError && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-700 border border-rose-500/30 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 text-xs font-bold text-center">
                  {inviteSuccess}
                </div>
              )}

              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#0D1520] text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold shadow-lg transition-all text-xs"
                >
                  Save & Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DELETION CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 border ${
            isLight ? 'bg-white border-rose-200 text-slate-900' : 'bg-[#16222F] border-rose-500/40 text-white'
          }`}>
            <div className={`flex items-center gap-3 text-rose-500 border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Confirm Remove User</h3>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Deactivate user access from the tenant workspace</p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Are you sure you want to remove user <strong className={isLight ? 'text-slate-900' : 'text-white'}>{userToDelete.name}</strong> (<span className="font-mono text-[#0773BB] font-bold">{userToDelete.email}</span>)?
              This will revoke their access to project data and remove them from active tenant directories.
            </p>

            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <button
                onClick={() => setUserToDelete(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#0D1520] text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register External Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 border ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Building2 className="w-5 h-5 text-[#3BC0BB]" />
                  <span>Register Company / Partner Entity</span>
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Register client, contractor, or vendor companies so their members can collaborate on company projects.
                </p>
              </div>
              <button
                onClick={() => setShowCompanyModal(false)}
                className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Petrofac Engineering or Al Futtaim HVAC"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PETRO, AFH"
                    value={compCode}
                    onChange={(e) => setCompCode(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Company Type *</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value as CompanyType)}
                    className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                    }`}
                  >
                    <option value="Client">Client Company</option>
                    <option value="Subcontractor">Subcontractor</option>
                    <option value="External Partner">External Partner</option>
                    <option value="Vendor">Vendor / Supplier</option>
                    <option value="Internal Dolphin Entity">Internal Dolphin Entity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Official Corporate Email Domain *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono">@</span>
                  <input
                    type="text"
                    required
                    placeholder="company.com or partner.ae"
                    value={compDomain}
                    onChange={(e) => setCompDomain(e.target.value.replace(/^@/, ''))}
                    className={`w-full rounded-xl pl-8 pr-3 py-2 font-mono focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                    }`}
                  />
                </div>
                <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Users with emails ending in this domain will be whitelisted for invitations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Contact Email</label>
                  <input
                    type="email"
                    placeholder="contracts@company.com"
                    value={compContact}
                    onChange={(e) => setCompContact(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 font-mono ${
                      isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Logo Icon / Emoji</label>
                  <input
                    type="text"
                    placeholder="🏢 or 🏗️ or 🔧"
                    value={compLogo}
                    onChange={(e) => setCompLogo(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-center ${
                      isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Description / Project Role</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding project scope, contract reference, or partner relationship..."
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 ${
                    isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-[#0D1520] border border-[#233549] text-white'
                  }`}
                />
              </div>

              {compError && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-700 border border-rose-500/30 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{compError}</span>
                </div>
              )}

              {compSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 text-xs font-bold text-center">
                  {compSuccess}
                </div>
              )}

              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#0D1520] text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] text-white font-medium shadow-lg"
                >
                  Register & Whitelist Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16222F] border-[#233549] text-white'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <UserPlus className="w-5 h-5 text-[#0773BB]" />
                  <span>Add New User & Assign Access Level</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Manually add a team member or partner user, specify their company, and assign their access permissions.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Hamdan Al-Nuaimi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Corporate Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g., hamdan@company.com"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    if (val.includes('@') && !isCustomCompany) {
                      const dom = (val.split('@')[1] || '').toLowerCase().trim();
                      const matchedComp = companies.find((c) => (c?.domain || '').toLowerCase() === dom);
                      if (matchedComp) {
                        setSelectedCompanyId(matchedComp.id);
                      }
                    }
                  }}
                  className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              {/* Password Setting Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Assigned Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randPass = generateSecureCompliantPassword();
                      setAssignedPassword(randPass);
                    }}
                    className="text-[11px] text-[#3BC0BB] hover:underline font-bold flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" /> Auto-Generate Secure Password
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Dolphin@2026 (or leave blank for auto Dolphin@123)"
                  value={assignedPassword}
                  onChange={(e) => setAssignedPassword(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-amber-600 font-bold' : 'bg-[#0D1520] border-[#233549] text-amber-300'
                  }`}
                />
              </div>

              {/* Company Selection or Custom Company Entry */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Company Entity *</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCompany(!isCustomCompany)}
                    className="text-[11px] text-[#3BC0BB] hover:underline font-bold"
                  >
                    {isCustomCompany ? '← Choose Existing Company' : '+ Enter Custom Company Name'}
                  </button>
                </div>

                {isCustomCompany ? (
                  <div className={`space-y-2 p-3 rounded-xl border border-[#0773BB]/50 animate-in fade-in ${
                    isLight ? 'bg-slate-50' : 'bg-[#0D1520]'
                  }`}>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Dolphin Cooling Systems LLC"
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                        }`}
                        required={isCustomCompany}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Company Domain (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., dolcool.ae"
                        value={customCompanyDomain}
                        onChange={(e) => setCustomCompanyDomain(e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 font-mono ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  >
                    <optgroup label="Internal Dolphin Entities">
                      {companies
                        .filter((c) => !c.isExternal)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.domain})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Registered External Partners & Clients">
                      {companies
                        .filter((c) => c.isExternal)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} - {c.type} ({c.domain})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                )}
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Access Level (Role) *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  >
                    <option value="Viewer">Viewer (Read-Only Access)</option>
                    <option value="Team Member">Team Member (Standard Member)</option>
                    <option value="Project Manager">Project Manager (PM Access)</option>
                    <option value="Admin">Admin (Full System Governance)</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                    placeholder="e.g. Thermal Design, QA/QC"
                  />
                </div>
              </div>

              {inviteError && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center">
                  {inviteSuccess}
                </div>
              )}

              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#0D1520] text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold shadow-lg transition-all"
                >
                  Save & Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DELETION CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400 border-b border-[#233549] pb-3">
              <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Confirm Remove User</h3>
                <p className="text-xs text-slate-400">Deactivate user access from the tenant workspace</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove user <strong className="text-white">{userToDelete.name}</strong> (<span className="font-mono text-[#3BC0BB]">{userToDelete.email}</span>)?
              This will revoke their access to project data and remove them from active tenant directories.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Old Sample Data Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#16222F] border border-red-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <Trash2 className="w-5 h-5 text-red-400" />
                <span>Remove Old Sample Data?</span>
              </div>
              <button onClick={() => setShowClearConfirmModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will clear all default demo sample projects, tasks, subtasks, files, activity logs, and time entries from local storage and database.
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>You will have a completely clean workspace ready to create real projects and invite team members!</span>
            </div>

            {clearSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                {clearSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setClearSuccess('Old sample data removed! Your workspace is clean and ready.');
                  setTimeout(() => {
                    setClearSuccess('');
                    setShowClearConfirmModal(false);
                  }, 1500);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all"
              >
                Yes, Remove Old Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Invite to Workspace */}
      {showWorkspaceInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl border ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#3BC0BB]/20 text-[#0F766E] border border-[#3BC0BB]/30">
                  <FolderKanban className="w-5 h-5 text-[#3BC0BB]" />
                </div>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <span>Invite Users to Workspace</span>
                  </h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Select a workspace and choose existing team members to assign and invite via email.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWorkspaceInviteModal(false);
                  setWsInviteError('');
                  setWsInviteSuccess('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendWorkspaceInvite} className="space-y-4">
              {/* Step 1: Target Workspace Selection */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  1. Select Target Workspace / Space
                </label>
                <select
                  value={workspaceInviteProjectId || projects[0]?.id || ''}
                  onChange={(e) => setWorkspaceInviteProjectId(e.target.value)}
                  className={`w-full text-xs font-semibold rounded-xl p-2.5 border focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  {projects.map((p) => {
                    const comp = companies.find((c) => c.id === p.companyId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.code}) — {comp?.name || 'Global'} ({p.members?.length || 0} Members)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Step 2: Select Existing Users */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    2. Select Team Members ({workspaceInviteUserIds.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (workspaceInviteUserIds.length === users.length) {
                        setWorkspaceInviteUserIds([]);
                      } else {
                        setWorkspaceInviteUserIds(users.map((u) => u.id));
                      }
                    }}
                    className="text-[11px] text-[#0773BB] hover:underline font-bold"
                  >
                    {workspaceInviteUserIds.length === users.length ? 'Deselect All' : 'Select All Users'}
                  </button>
                </div>

                <div className={`max-h-48 overflow-y-auto p-2 rounded-xl border space-y-1.5 ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
                }`}>
                  {users.map((u) => {
                    const selectedProjId = workspaceInviteProjectId || projects[0]?.id;
                    const selectedProj = projects.find((p) => p.id === selectedProjId);
                    const isAlreadyMember = selectedProj?.members?.includes(u.id) || selectedProj?.managerId === u.id;
                    const isChecked = workspaceInviteUserIds.includes(u.id);

                    return (
                      <label
                        key={u.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                          isChecked
                            ? isLight ? 'bg-sky-50 text-slate-900 font-bold border border-sky-300' : 'bg-[#0773BB]/20 text-white font-bold border border-[#0773BB]/50'
                            : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-[#16222F] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWorkspaceInviteUserIds((prev) => [...prev, u.id]);
                              } else {
                                setWorkspaceInviteUserIds((prev) => prev.filter((id) => id !== u.id));
                              }
                            }}
                            className="rounded text-[#0773BB] focus:ring-[#0773BB] w-4 h-4"
                          />
                          <UserAvatar
                            name={u.name}
                            email={u.email}
                            role={u.role}
                            size="xs"
                            theme={theme}
                          />
                          <div>
                            <span className="font-bold">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">({u.email})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            {u.role}
                          </span>
                          {isAlreadyMember && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                              Already Member
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Invitation Message Note */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  3. Email Invitation Note
                </label>
                <textarea
                  rows={2}
                  value={workspaceInviteNote}
                  onChange={(e) => setWorkspaceInviteNote(e.target.value)}
                  placeholder="Custom message included in the workspace email alert..."
                  className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              {wsInviteError && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-700 border border-rose-500/30 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{wsInviteError}</span>
                </div>
              )}

              {wsInviteSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 text-xs flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{wsInviteSuccess}</span>
                </div>
              )}

              <div className={`flex justify-end gap-2 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkspaceInviteModal(false);
                    setWsInviteError('');
                    setWsInviteSuccess('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#0D1520] hover:bg-[#16222F] text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white text-xs font-bold shadow-lg shadow-[#0773BB]/30 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Workspace Invitations ({workspaceInviteUserIds.length})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Manage User Space Assignments */}
      {managingSpacesUserId && (() => {
        const targetUser = users.find((u) => u.id === managingSpacesUserId);
        if (!targetUser) return null;

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className={`rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-[#0773BB]" />
                    <span>Space Assignments for {targetUser.name}</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">{targetUser.email}</p>
                </div>
                <button
                  onClick={() => setManagingSpacesUserId(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Select which spaces/projects <strong>{targetUser.name}</strong> is allowed to see and access. Non-admin users can only view spaces where they are an assigned member.
              </p>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const isMember = (proj.members || []).includes(targetUser.id) || proj.managerId === targetUser.id;

                  return (
                    <div
                      key={proj.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isMember
                          ? isLight ? 'bg-sky-50 border-sky-300' : 'bg-[#0773BB]/20 border-[#0773BB]/50'
                          : isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs flex items-center gap-2">
                          <span>{proj.title}</span>
                          <span className="font-mono text-[10px] text-[#0773BB]">({proj.code})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Category: {proj.category} | Status: {proj.status}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const currentMembers = proj.members || [];
                          if (isMember) {
                            updateProject(proj.id, {
                              members: currentMembers.filter((id) => id !== targetUser.id)
                            });
                          } else {
                            updateProject(proj.id, {
                              members: [...currentMembers, targetUser.id]
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow ${
                          isMember
                            ? 'bg-rose-500/20 text-rose-600 hover:bg-rose-500/30 border border-rose-500/30'
                            : 'bg-[#0773BB] text-white hover:bg-[#0773BB]/80'
                        }`}
                      >
                        {isMember ? 'Revoke Access' : 'Assign Space'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className={`flex justify-end pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
                <button
                  onClick={() => setManagingSpacesUserId(null)}
                  className="px-5 py-2 rounded-xl bg-[#0773BB] text-white text-xs font-bold hover:bg-[#0773BB]/80"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Dedicated Password Reset */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <span>Reset Password & Credentials</span>
                  </h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Update authentication password for this corporate account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordResetUser(null);
                  setPasswordResetSuccess('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target User Info Card */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <img
                src={passwordResetUser.avatar}
                alt={passwordResetUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0773BB]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm truncate">{passwordResetUser.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0773BB]/10 text-[#0773BB] border border-[#0773BB]/20">
                    {passwordResetUser.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono truncate mt-0.5">
                  {passwordResetUser.email}
                </div>
              </div>
            </div>

            {/* Success Alert */}
            {passwordResetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordResetSuccess}</span>
              </div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleExecutePasswordReset} className="space-y-4">
              <PasswordComplexityValidatorUI
                password={newPasswordInput}
                onChange={(val) => setNewPasswordInput(val)}
                label="New Security Password"
                placeholder="Enter new password (e.g. Dolphin@2026!)"
                isLight={isLight}
              />

              {passwordResetError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{passwordResetError}</span>
                </div>
              )}

              {/* Informational notice */}
              <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                isLight ? 'bg-sky-50/70 border-sky-200 text-sky-900' : 'bg-[#0773BB]/10 border-[#0773BB]/30 text-sky-200'
              }`}>
                <Info className="w-4 h-4 text-[#0773BB] shrink-0 mt-0.5" />
                <span>
                  Saving will immediately update this user's password in the database and local authentication cache. The user can log in with this new password right away.
                </span>
              </div>

              {/* Actions */}
              <div className={`flex items-center justify-end gap-2 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordResetUser(null);
                    setPasswordResetSuccess('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#0D1520] hover:bg-[#16222F] text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white text-xs font-bold shadow-lg shadow-[#0773BB]/30 transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Update & Save Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Comprehensive User Profile & Avatar Edit */}
      {userToEdit && (
        <UserProfileEditModal
          isOpen={!!userToEdit}
          onClose={() => setUserToEdit(null)}
          user={userToEdit}
          theme={theme}
        />
      )}
    </div>
  );
};
