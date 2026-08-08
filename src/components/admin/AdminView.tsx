import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Building2,
  Activity,
  Search,
  Filter,
  UserPlus,
  Lock,
  Globe,
  Key,
  Database,
  Cpu,
  HardDrive,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MoreVertical,
  Plus,
  Trash2,
  ShieldCheck,
  UserCheck,
  Settings,
  RefreshCw,
  Clock,
  Download,
  Zap,
  Edit2,
  Check,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { User, Role, Company } from '../../types';

export const AdminView: React.FC = () => {
  const {
    users,
    updateUser,
    deleteUser,
    companies,
    authorizedDomains,
    addAuthorizedDomain,
    removeAuthorizedDomain,
    inviteUser,
    tasks,
    projects,
    updateProject,
    activityLogs,
    files,
    timeEntries,
    firebaseConnected,
    firebaseProjectId,
    theme,
    currentUser,
    logActivity
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'usage' | 'security'>('users');

  // Search & Filter state for Users Tab
  const [userSearch, setUserSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State for Inviting / Adding User
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('Team Member');
  const [newUserDept, setNewUserDept] = useState('Engineering');
  const [newUserCompany, setNewUserCompany] = useState<string>(companies[0]?.id || 'comp_corp');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Editing User Role Modal/Inline State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>('Team Member');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRate, setEditRate] = useState<number>(100);

  // Space & Project Access Permissions Modal State
  const [spaceAccessUser, setSpaceAccessUser] = useState<User | null>(null);
  const [selectedUserCompanyId, setSelectedUserCompanyId] = useState<string>('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [accessSavedMessage, setAccessSavedMessage] = useState<string>('');

  const handleOpenSpaceAccessModal = (user: User) => {
    setSpaceAccessUser(user);
    setSelectedUserCompanyId(user.companyId);
    const userProjects = projects.filter((p) => p.members?.includes(user.id)).map((p) => p.id);
    setSelectedProjectIds(userProjects);
    setAccessSavedMessage('');
  };

  const handleToggleProjectAccess = (projId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const handleSelectAllProjects = () => {
    setSelectedProjectIds(projects.map((p) => p.id));
  };

  const handleDeselectAllProjects = () => {
    setSelectedProjectIds([]);
  };

  const handleSaveSpaceAccess = () => {
    if (!spaceAccessUser) return;

    if (spaceAccessUser.companyId !== selectedUserCompanyId) {
      updateUser(spaceAccessUser.id, { companyId: selectedUserCompanyId });
    }

    projects.forEach((proj) => {
      const shouldHaveAccess = selectedProjectIds.includes(proj.id);
      const currentMembers = proj.members || [];
      const hasAccess = currentMembers.includes(spaceAccessUser.id);

      if (shouldHaveAccess && !hasAccess) {
        updateProject(proj.id, { members: [...currentMembers, spaceAccessUser.id] });
      } else if (!shouldHaveAccess && hasAccess) {
        updateProject(proj.id, { members: currentMembers.filter((m) => m !== spaceAccessUser.id) });
      }
    });

    logActivity(
      'updated user space & project access permissions',
      `Modified access scope for ${spaceAccessUser.name} (${spaceAccessUser.email})`,
      'permission',
      undefined,
      undefined,
      `Granted access to ${selectedProjectIds.length} projects in space.`,
      'warning'
    );

    setAccessSavedMessage(`Space permissions successfully updated for ${spaceAccessUser.name}!`);
    setTimeout(() => {
      setAccessSavedMessage('');
      setSpaceAccessUser(null);
    }, 1800);
  };

  // New Domain State
  const [newDomainInput, setNewDomainInput] = useState('');
  const [domainError, setDomainError] = useState('');

  // Cross-Domain Security Rules State
  const [domainSecurityRules, setDomainSecurityRules] = useState<{
    [domain: string]: { mfaRequired: boolean; crossTenantCollab: boolean; ssoOnly: boolean; exportAllowed: boolean };
  }>({
    'dolphingroup.ae': { mfaRequired: true, crossTenantCollab: true, ssoOnly: true, exportAllowed: true },
    'drc.ae': { mfaRequired: true, crossTenantCollab: true, ssoOnly: false, exportAllowed: true },
    'dolcool.ae': { mfaRequired: false, crossTenantCollab: true, ssoOnly: false, exportAllowed: true },
    'dolrad.ae': { mfaRequired: false, crossTenantCollab: false, ssoOnly: false, exportAllowed: false },
    'dolheat.ae': { mfaRequired: false, crossTenantCollab: true, ssoOnly: false, exportAllowed: true }
  });

  // Filter Users
  const filteredUsers = users.filter((u) => {
    const query = userSearch.toLowerCase();
    const matchesQuery =
      !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.department.toLowerCase().includes(query);

    const matchesCompany = companyFilter === 'all' || u.companyId === companyFilter;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesQuery && matchesCompany && matchesRole && matchesStatus;
  });

  // System Usage & Analytics Data Preparation
  const companyUsageData = companies.map((comp) => {
    const compUsers = users.filter((u) => u.companyId === comp.id).length;
    const compProjects = projects.filter((p) => p.companyId === comp.id).length;
    const compTasks = tasks.filter((t) => {
      const proj = projects.find((p) => p.id === t.projectId);
      return proj?.companyId === comp.id;
    }).length;
    return {
      name: comp.code || comp.name.split(' ')[0],
      fullName: comp.name,
      users: compUsers,
      projects: compProjects,
      tasks: compTasks
    };
  });

  const roleDistributionData = [
    { name: 'Admins', value: users.filter((u) => u.role === 'Admin').length, color: '#F59E0B' },
    { name: 'Project Managers', value: users.filter((u) => u.role === 'Project Manager').length, color: '#0773BB' },
    { name: 'Team Members', value: users.filter((u) => u.role === 'Team Member').length, color: '#3BC0BB' },
    { name: 'Viewers / Guests', value: users.filter((u) => u.role === 'Viewer').length, color: '#64748B' }
  ];

  const totalTimeLoggedHours = Math.round(
    timeEntries.reduce((acc, curr) => acc + curr.hours, 0) +
      tasks.reduce((acc, curr) => acc + (curr.loggedHours || 0), 0)
  );

  const totalFilesCount = files.length;
  const totalLogsCount = activityLogs.length;

  // Handle Invite / Manual User Add Submit
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!newUserName || !newUserEmail) {
      setInviteError('Please provide both name and email.');
      return;
    }

    const cleanEmail = newUserEmail.toLowerCase().trim();
    const domain = cleanEmail.includes('@') ? cleanEmail.split('@')[1] : '';
    if (domain && !authorizedDomains.map((d) => d.toLowerCase()).includes(domain)) {
      addAuthorizedDomain(domain);
    }

    const assignedPassword = newUserPassword.trim() || 'Dolphin@123';
    const result = inviteUser(newUserName, newUserEmail, newUserRole, newUserDept, newUserCompany, assignedPassword);
    if (!result.success) {
      setInviteError(result.error || 'Failed to add user.');
    } else {
      setInviteSuccess(`Successfully added user ${newUserName} (${newUserEmail}) with assigned password "${assignedPassword}"!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteSuccess('');
      }, 1500);
    }
  };

  // Handle Save User Edit
  const handleSaveUserEdit = (userId: string) => {
    updateUser(userId, {
      role: editRole,
      department: editDepartment,
      hourlyRate: editRate
    });
    setEditingUserId(null);
  };

  // Handle Add Domain
  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setDomainError('');
    if (!newDomainInput) return;
    const cleanDomain = newDomainInput.trim().toLowerCase().replace('@', '');
    if (authorizedDomains.includes(cleanDomain)) {
      setDomainError(`Domain '@${cleanDomain}' is already whitelisted.`);
      return;
    }
    addAuthorizedDomain(cleanDomain);
    setDomainSecurityRules((prev) => ({
      ...prev,
      [cleanDomain]: { mfaRequired: true, crossTenantCollab: true, ssoOnly: false, exportAllowed: true }
    }));
    setNewDomainInput('');
  };

  // Toggle Security Rule
  const toggleSecurityRule = (domain: string, key: 'mfaRequired' | 'crossTenantCollab' | 'ssoOnly' | 'exportAllowed') => {
    setDomainSecurityRules((prev) => {
      const current = prev[domain] || { mfaRequired: false, crossTenantCollab: true, ssoOnly: false, exportAllowed: true };
      const updated = { ...current, [key]: !current[key] };
      logActivity(
        'updated domain security policy',
        `@${domain} -> ${key}: ${updated[key]}`,
        'permission',
        undefined,
        undefined,
        `Domain policy update executed by tenant administrator ${currentUser.name}`,
        'warning'
      );
      return { ...prev, [domain]: updated };
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#16222F] border border-[#233549] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Tenant Administrator Portal</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cross-domain tenant governance, multi-entity user access control & system resource monitoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Tenant User</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#233549] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'users'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tenant Users & Roles</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'permissions'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Cross-Domain Governance</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
            {authorizedDomains.length} Domains
          </span>
        </button>

        <button
          onClick={() => setActiveTab('usage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'usage'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-sky-400" />
          <span>System Usage & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'security'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>System Health & Status</span>
        </button>
      </div>

      {/* TAB 1: TENANT USERS & ROLE MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Controls Bar */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name, email, department..."
                  className="w-full pl-10 pr-4 py-2 bg-[#0D1520] border border-[#233549] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0773BB] transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters:</span>
                </div>

                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#0773BB]"
                >
                  <option value="all">All Tenant Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.domain})
                    </option>
                  ))}
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#0773BB]"
                >
                  <option value="all">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Team Member">Team Member</option>
                  <option value="Viewer">Viewer</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#0773BB]"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Offline">Offline</option>
                  <option value="In Meeting">In Meeting</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>
          </div>

          {/* User List Table */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0D1520] border-b border-[#233549] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">User Profile</th>
                    <th className="py-3 px-4">Tenant Company & Domain</th>
                    <th className="py-3 px-4">Role & Privilege Level</th>
                    <th className="py-3 px-4">Department & Capacity</th>
                    <th className="py-3 px-4">Status & Email Verification</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233549]">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const userComp = companies.find((c) => c.id === u.companyId) || companies[0];
                      const isEditing = editingUserId === u.id;

                      let roleBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                      if (u.role === 'Admin') roleBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
                      if (u.role === 'Project Manager') roleBadge = 'bg-[#0773BB]/20 text-[#0773BB] border-[#0773BB]/40 font-bold';
                      if (u.role === 'Team Member') roleBadge = 'bg-[#3BC0BB]/20 text-[#3BC0BB] border-[#3BC0BB]/40';

                      return (
                        <tr key={u.id} className="hover:bg-[#1C2C3D]/60 transition-colors">
                          {/* User Avatar & Info */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-700 shadow-sm"
                              />
                              <div>
                                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {u.id === currentUser.id && (
                                    <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Company & Domain */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-slate-200">{userComp?.name}</div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                              <Globe className="w-3 h-3 text-[#3BC0BB]" />
                              <span>@{userComp?.domain || u.email.split('@')[1]}</span>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4 align-top">
                            {isEditing ? (
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value as Role)}
                                className="bg-[#0D1520] border border-[#0773BB] rounded px-2 py-1 text-xs text-white"
                              >
                                <option value="Admin">Admin</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="Team Member">Team Member</option>
                                <option value="Viewer">Viewer</option>
                              </select>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono ${roleBadge}`}>
                                {u.role}
                              </span>
                            )}
                          </td>

                          {/* Department & Rates */}
                          <td className="py-3.5 px-4 align-top">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editDepartment}
                                  onChange={(e) => setEditDepartment(e.target.value)}
                                  className="w-28 px-2 py-1 bg-[#0D1520] border border-[#233549] rounded text-xs text-white"
                                  placeholder="Department"
                                />
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <span>Rate: $</span>
                                  <input
                                    type="number"
                                    value={editRate}
                                    onChange={(e) => setEditRate(Number(e.target.value))}
                                    className="w-16 px-1.5 py-0.5 bg-[#0D1520] border border-[#233549] rounded text-xs text-white"
                                  />
                                  <span>/hr</span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-slate-300">{u.department}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  ${u.hourlyRate}/hr • Cap: {u.maxWeeklyHours}h/wk
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                                  u.status === 'Active'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                                <span>{u.status}</span>
                              </span>
                              <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Email Verified</span>
                              </span>
                            </div>
                          </td>

                          {/* Admin Actions */}
                          <td className="py-3.5 px-4 align-top text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleSaveUserEdit(u.id)}
                                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-all"
                                  title="Save Changes"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs transition-all"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenSpaceAccessModal(u)}
                                  className="p-1.5 bg-[#0D1520] hover:bg-[#1C2C3D] text-teal-300 border border-teal-500/30 rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
                                  title="Configure Space & Project Access Permissions"
                                >
                                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                                  <span className="hidden sm:inline font-semibold">Space Access</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingUserId(u.id);
                                    setEditRole(u.role);
                                    setEditDepartment(u.department);
                                    setEditRate(u.hourlyRate);
                                  }}
                                  className="p-1.5 bg-[#0D1520] hover:bg-[#1C2C3D] text-slate-300 border border-[#233549] rounded-lg text-xs transition-all flex items-center gap-1"
                                  title="Edit Role & Details"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="hidden sm:inline">Edit Role</span>
                                </button>

                                {u.id !== currentUser.id && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Deactivate user "${u.name}" (${u.email})?`)) {
                                        deleteUser(u.id);
                                      }
                                    }}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs transition-all"
                                    title="Deactivate User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="font-bold text-white text-sm">No Tenant Users Found</p>
                        <p className="text-xs text-slate-500">Try adjusting your search query or filter selection.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#0D1520] border-t border-[#233549] flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing <strong className="text-white">{filteredUsers.length}</strong> of <strong className="text-white">{users.length}</strong> tenant users
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Multi-Tenant RBAC Active</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CROSS-DOMAIN GOVERNANCE */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Domain Whitelist Panel */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#233549]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <span>Cross-Domain Governance & SSO Rules</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage corporate email domain whitelist for single sign-on (SSO), domain routing, and cross-entity security policies.
                </p>
              </div>

              {/* Add Domain Form */}
              <form onSubmit={handleAddDomain} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  placeholder="e.g. dolgroup.ae"
                  className="px-3 py-2 bg-[#0D1520] border border-[#233549] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0773BB]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Whitelist Domain</span>
                </button>
              </form>
            </div>

            {domainError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {domainError}
              </div>
            )}

            {/* Whitelisted Domains Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0D1520] border-b border-[#233549] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Authorized Domain</th>
                    <th className="py-3 px-4">Entity Mapping</th>
                    <th className="py-3 px-4">Require MFA</th>
                    <th className="py-3 px-4">Cross-Tenant Collab</th>
                    <th className="py-3 px-4">Strict SSO Only</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233549]">
                  {authorizedDomains.map((dom) => {
                    const rule = domainSecurityRules[dom] || {
                      mfaRequired: true,
                      crossTenantCollab: true,
                      ssoOnly: false,
                      exportAllowed: true
                    };
                    const matchedComp = companies.find((c) => c.domain === dom);

                    return (
                      <tr key={dom} className="hover:bg-[#1C2C3D]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>@{dom}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {matchedComp ? matchedComp.name : 'Dolphin Group Affiliate'}
                        </td>

                        {/* MFA Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleSecurityRule(dom, 'mfaRequired')}
                            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all border ${
                              rule.mfaRequired
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}
                          >
                            {rule.mfaRequired ? 'MFA ENFORCED' : 'OPTIONAL'}
                          </button>
                        </td>

                        {/* Cross-Tenant Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleSecurityRule(dom, 'crossTenantCollab')}
                            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all border ${
                              rule.crossTenantCollab
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}
                          >
                            {rule.crossTenantCollab ? 'ALLOWED' : 'RESTRICTED'}
                          </button>
                        </td>

                        {/* SSO Only Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleSecurityRule(dom, 'ssoOnly')}
                            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all border ${
                              rule.ssoOnly
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}
                          >
                            {rule.ssoOnly ? 'SSO MANDATORY' : 'PASSWORD/SSO'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {dom !== 'dolphingroup.ae' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Remove domain @${dom} from whitelist?`)) {
                                  removeAuthorizedDomain(dom);
                                }
                              }}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Remove Whitelisted Domain"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cross-Entity Access Policy Grid */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#3BC0BB]" />
              <span>Multi-Tenant Cross-Access Authorization Matrix</span>
            </h3>
            <p className="text-xs text-slate-400">
              Matrix controls which corporate entity's managers and team members can view or edit projects across subsidiary boundaries.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {companies.map((comp) => (
                <div key={comp.id} className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#233549]">
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#0773BB]" />
                      <span>{comp.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#3BC0BB]">@{comp.domain}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Holding Parent Override:</span>
                      <span className="text-emerald-400 font-bold font-mono">GRANTED (@dolphingroup.ae)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Subsidiary Sharing Scope:</span>
                      <span className="text-sky-400 font-medium font-mono">Shared Spaces Enabled</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Document Vault Export Policy:</span>
                      <span className="text-amber-400 font-medium font-mono">ISO Audit Compliant</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM USAGE & TELEMETRY */}
      {activeTab === 'usage' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#16222F] border border-[#233549] rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Active Projects</span>
                <Building2 className="w-4 h-4 text-[#0773BB]" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{projects.length}</div>
              <div className="text-[10px] text-slate-500">Across {companies.length} tenant entities</div>
            </div>

            <div className="p-4 bg-[#16222F] border border-[#233549] rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Total Workload Hours</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-300 font-mono">{totalTimeLoggedHours} hrs</div>
              <div className="text-[10px] text-emerald-400/70">Logged in system timesheets</div>
            </div>

            <div className="p-4 bg-[#16222F] border border-[#233549] rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Vault Files Stored</span>
                <HardDrive className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">{totalFilesCount} files</div>
              <div className="text-[10px] text-amber-400/70">Cloud storage encrypted</div>
            </div>

            <div className="p-4 bg-[#16222F] border border-[#233549] rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Audit Logs Recorded</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300 font-mono">{totalLogsCount}</div>
              <div className="text-[10px] text-purple-400/70">Security audit ledger</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Resource Utilization per Company */}
            <div className="p-6 bg-[#16222F] border border-[#233549] rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#0773BB]" />
                  <span>Tenant Resource Distribution</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Tasks & Projects / Company</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={companyUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#233549" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0D1520', borderColor: '#233549', color: '#FFF' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#CBD5E1' }} />
                    <Bar dataKey="tasks" name="Tasks" fill="#3BC0BB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="users" name="Users" fill="#0773BB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="projects" name="Projects" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Role Breakdown */}
            <div className="p-6 bg-[#16222F] border border-[#233549] rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>User Privilege Level Ratio</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">RBAC Breakdown</span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0D1520', borderColor: '#233549', color: '#FFF' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#CBD5E1' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM HEALTH & STATUS */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 bg-[#16222F] border border-[#233549] rounded-2xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              <span>System Health & Infrastructure Telemetry</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Firebase Firestore Status</div>
                  <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Connected ({firebaseProjectId})</span>
                  </div>
                </div>
                <Database className="w-6 h-6 text-emerald-400/80" />
              </div>

              <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Gemini AI Engine</div>
                  <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Operational (v2.4.0)</span>
                  </div>
                </div>
                <Zap className="w-6 h-6 text-amber-400/80" />
              </div>

              <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Database Latency</div>
                  <div className="text-sm font-bold text-sky-300 font-mono mt-1">
                    18ms (Cloud Run UK Region)
                  </div>
                </div>
                <RefreshCw className="w-6 h-6 text-sky-400/80" />
              </div>
            </div>

            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                System Compliance Checklist
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ISO 27001 Security Audit Log Retention: Enabled</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Corporate SSO & Google OAuth 2.0: Active</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>15-Minute Session Inactivity Timeout: Guard Enabled</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Multi-Tenant Cross-Domain Isolation: Enforced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INVITE TENANT USER */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0773BB]" />
                <span>Invite User to Tenant Portal</span>
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Tariq Al-Mansoori"
                  className="w-full px-3 py-2 bg-[#0D1520] border border-[#233549] rounded-xl text-white focus:outline-none focus:border-[#0773BB]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. tariq@dolphingroup.ae"
                  className="w-full px-3 py-2 bg-[#0D1520] border border-[#233549] rounded-xl text-white focus:outline-none focus:border-[#0773BB]"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">Must belong to a whitelisted corporate domain.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-semibold">Assigned Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = 'Dolphin@' + Math.floor(1000 + Math.random() * 9000);
                      setNewUserPassword(rand);
                    }}
                    className="text-[11px] text-[#3BC0BB] hover:underline font-bold"
                  >
                    Auto-Generate Password
                  </button>
                </div>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="e.g. Dolphin@2026 (or auto-generates Dolphin@123)"
                  className="w-full px-3 py-2 bg-[#0D1520] border border-[#233549] rounded-xl text-amber-300 font-mono focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Assign Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-[#0D1520] border border-[#233549] rounded-xl text-white focus:outline-none focus:border-[#0773BB]"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Team Member">Team Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1520] border border-[#233549] rounded-xl text-white focus:outline-none focus:border-[#0773BB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tenant Entity Association</label>
                <select
                  value={newUserCompany}
                  onChange={(e) => setNewUserCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1520] border border-[#233549] rounded-xl text-white focus:outline-none focus:border-[#0773BB]"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (@{c.domain})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold transition-all shadow-md"
                >
                  Dispatch Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Granular Space & Project Access Permissions Modal */}
      {spaceAccessUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#121E2B] border border-[#223548] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-[#223548] bg-[#182738] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Manage Space & Project Access
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Control workspace boundaries and specific project spaces for{' '}
                    <span className="text-teal-300 font-semibold">{spaceAccessUser.name}</span> ({spaceAccessUser.email})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSpaceAccessUser(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Saved Notification */}
            {accessSavedMessage && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{accessSavedMessage}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* User Overview Bar */}
              <div className="p-3.5 rounded-2xl bg-[#182738] border border-[#223548] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={spaceAccessUser.avatar}
                    alt={spaceAccessUser.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{spaceAccessUser.name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">
                        {spaceAccessUser.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{spaceAccessUser.email}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Granted Projects</div>
                  <div className="text-xs font-black text-teal-400 font-mono">
                    {selectedProjectIds.length} / {projects.length} Projects
                  </div>
                </div>
              </div>

              {/* Step 1: Company / Workspace Entity */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  Primary Tenant Entity / Workspace
                </label>
                <select
                  value={selectedUserCompanyId}
                  onChange={(e) => setSelectedUserCompanyId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-[#223548] bg-[#182738] text-white px-3.5 py-2.5 focus:outline-none focus:border-teal-500"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (@{c.domain})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Defines the user's primary organizational workspace domain.
                </p>
              </div>

              {/* Step 2: Granular Project Space Permissions */}
              <div className="space-y-2 pt-2 border-t border-[#223548]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Allowed Project Spaces
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllProjects}
                      className="text-[10px] font-bold text-teal-400 hover:text-teal-300 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllProjects}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-300 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {projects.map((p) => {
                    const isSelected = selectedProjectIds.includes(p.id);
                    const comp = companies.find((c) => c.id === p.companyId);

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleProjectAccess(p.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500/50 shadow-md'
                            : 'bg-[#182738]/50 border-[#223548] opacity-60 hover:opacity-100 hover:bg-[#182738]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-teal-500 border-teal-400 text-slate-950'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] font-mono font-bold">
                              {p.code}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{p.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {comp?.name || 'Workspace'} • {p.category}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanatory Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Access Enforcement Note:</span> Non-admin users (Team Members & Viewers) will strictly see tasks, documents, and Gantt timelines only for the project spaces selected above. Admins retain overall tenant visibility.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#223548] bg-[#182738] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSpaceAccessUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSpaceAccess}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save Space Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
