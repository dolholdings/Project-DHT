import React, { useState } from 'react';
import { ShieldCheck, UserPlus, AlertTriangle, Check, X, Building2, Key, Plus, Globe, Briefcase, ExternalLink, Users as UsersIcon, Trash2, Mail, Lock, Edit2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APPROVED_DOMAINS, Role, CompanyType, Company } from '../../types';

export const UsersView: React.FC = () => {
  const {
    users,
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
    theme
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'skills' | 'domains' | 'companies'>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearSuccess, setClearSuccess] = useState('');

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

  // User Controller inline edit state
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

  // Filter Users
  const [companyFilter, setCompanyFilter] = useState('all');

  const filteredUsers = users.filter((u) => {
    if (companyFilter === 'all') return true;
    if (companyFilter === 'internal') {
      const c = companies.find((comp) => comp.id === u.companyId);
      return !c?.isExternal;
    }
    if (companyFilter === 'external') {
      const c = companies.find((comp) => comp.id === u.companyId);
      return c?.isExternal;
    }
    return u.companyId === companyFilter;
  });

  const [invitedCode, setInvitedCode] = useState<string | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInvitedCode(null);

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

    const finalPassword = assignedPassword.trim() || 'Dolphin@123';
    const res = inviteUser(name, email, role, department, targetCompanyId, finalPassword);

    if (!res.success) {
      setInviteError(res.error || 'Failed to add user.');
    } else {
      const targetComp = companies.find((c) => c.id === targetCompanyId) || { name: customCompanyName || 'Specified Entity' };
      setInviteSuccess(
        `User "${name}" (${email}) added successfully with assigned password "${finalPassword}"!`
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
        setInviteSuccess('');
      }, 1400);
    }
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
    const existing = companies.find((c) => c.domain.toLowerCase() === cleanDomain);

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
    { feature: 'Create & Archive Projects', Admin: true, PM: true, Member: false, Viewer: false },
    { feature: 'Edit Task Deliverables', Admin: true, PM: true, Member: true, Viewer: false },
    { feature: 'Log Work Hours & Timesheets', Admin: true, PM: true, Member: true, Viewer: false },
    { feature: 'Run AI Contract Parser', Admin: true, PM: true, Member: true, Viewer: false },
    { feature: 'Configure Automations', Admin: true, PM: true, Member: false, Viewer: false },
    { feature: 'Register External Partner Companies', Admin: true, PM: true, Member: false, Viewer: false },
    { feature: 'Invite Corporate & Guest Users', Admin: true, PM: true, Member: false, Viewer: false },
  ];

  const isLight = theme === 'light';

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

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-lg shadow-[#0773BB]/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Users</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
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
              <span>{c.logo || '🏢'}</span>
              <span className={`font-sans font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.name}</span>
              <span className="text-[#0773BB] font-mono">({c.domain})</span>
            </span>
          ))}
        </div>
      </div>

      {/* VIEW 1: Active Users Table */}
      {activeSubTab === 'users' && (
        <div className={`p-6 rounded-2xl backdrop-blur-md space-y-4 shadow-xl ${
          isLight ? 'bg-white border border-slate-200 text-slate-900' : 'bg-[#16222F]/80 border border-[#233549] text-white'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <UsersIcon className="w-4 h-4 text-[#0773BB]" />
                <span>Team Members & Organization Users ({filteredUsers.length})</span>
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Manage user access levels (Viewer, Member, PM, Admin), edit user details, or remove user access.
              </p>
            </div>

            {/* Filter & Add User Button */}
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Company:</span>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className={`text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#0773BB] ${
                  isLight
                    ? 'bg-slate-100 border border-slate-300 text-slate-800'
                    : 'bg-[#0D1520] border border-[#233549] text-slate-200'
                }`}
              >
                <option value="all">All Companies</option>
                <option value="internal">Dolphin Entities Only (Internal)</option>
                <option value="external">External Partner Companies Only</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-md transition-all shrink-0 ml-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add User</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full text-left text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              <thead className={`font-semibold uppercase tracking-wider border-b ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-[#0D1520] text-slate-400 border-[#233549]'
              }`}>
                <tr>
                  <th className="p-3">User Profile</th>
                  <th className="p-3">Corporate Email</th>
                  <th className="p-3">Company Entity</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Assigned Password</th>
                  <th className="p-3">Access Level (Role Controller)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Controller Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#233549]'}`}>
                {filteredUsers.map((u) => {
                  const comp = companies.find((c) => c.id === u.companyId);
                  const isEditing = editingUserId === u.id;

                  return (
                    <tr key={u.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-[#0D1520]/80'}>
                      {/* User Profile */}
                      <td className={`p-3 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-[#0773BB]"
                          />
                          <div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className={`border rounded px-2 py-1 text-xs font-bold ${
                                  isLight
                                    ? 'bg-white border-[#0773BB] text-slate-900'
                                    : 'bg-[#0D1520] border-[#0773BB] text-white'
                                }`}
                              />
                            ) : (
                              <div className={`font-bold flex items-center gap-1.5 ${
                                isLight ? 'text-slate-900' : 'text-white'
                              }`}>
                                <span>{u.name}</span>
                              </div>
                            )}
                            <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              ID: {u.id.slice(0, 10)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-3 font-mono text-[#0773BB] font-semibold">{u.email}</td>

                      {/* Company Entity */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span>{comp?.logo || '🏢'}</span>
                          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{comp?.name || 'Dolphin Group'}</span>
                          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>({comp?.code})</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className={`p-3 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            className={`border rounded px-2 py-1 text-xs ${
                              isLight ? 'bg-white border-[#0773BB] text-slate-900' : 'bg-[#0D1520] border-[#0773BB] text-white'
                            }`}
                          />
                        ) : (
                          u.department
                        )}
                      </td>

                      {/* Assigned Password */}
                      <td className="p-3 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="New password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className={`border rounded px-2 py-1 text-xs font-mono ${
                              isLight
                                ? 'bg-white border-[#0773BB] text-amber-800'
                                : 'bg-[#0D1520] border-[#0773BB] text-amber-300'
                            }`}
                          />
                        ) : (
                          <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold flex items-center gap-1 w-fit ${
                            isLight
                              ? 'bg-amber-50 border border-amber-200 text-amber-800'
                              : 'bg-[#0D1520] border border-[#233549] text-amber-300'
                          }`}>
                            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                            {u.password || 'Dolphin@123'}
                          </span>
                        )}
                      </td>

                      {/* Role Access Controller (Dropdown) */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            onChange={(e) => updateUser(u.id, { role: e.target.value as Role })}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0773BB] ${
                              u.role === 'Admin'
                                ? 'bg-amber-500/20 text-amber-700 border-amber-500/40'
                                : u.role === 'Project Manager'
                                ? 'bg-[#0773BB]/20 text-[#0773BB] border-[#0773BB]/40'
                                : u.role === 'Team Member'
                                ? 'bg-[#3BC0BB]/20 text-[#0F766E] border-[#3BC0BB]/40'
                                : isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                            title="Change Access Role"
                          >
                            <option value="Viewer" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0D1520] text-slate-300'}>
                              Viewer (Read-Only)
                            </option>
                            <option value="Team Member" className={isLight ? 'bg-white text-teal-800' : 'bg-[#0D1520] text-[#3BC0BB]'}>
                              Team Member (Standard)
                            </option>
                            <option value="Project Manager" className={isLight ? 'bg-white text-blue-800' : 'bg-[#0D1520] text-[#0773BB]'}>
                              Project Manager (PM)
                            </option>
                            <option value="Admin" className={isLight ? 'bg-white text-amber-800' : 'bg-[#0D1520] text-amber-400'}>
                              Admin (Super Admin)
                            </option>
                          </select>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      {/* Controller Actions */}
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                updateUser(u.id, {
                                  name: editName,
                                  department: editDepartment,
                                  ...(editPassword.trim() ? { password: editPassword.trim() } : {})
                                });
                                setEditingUserId(null);
                              }}
                              className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Save
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className={`px-2 py-1 rounded-lg text-xs ${
                                isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUserId(u.id);
                                setEditName(u.name);
                                setEditDepartment(u.department);
                                setEditPassword(u.password || '');
                              }}
                              className={`p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                                isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                                  : 'bg-[#0D1520] hover:bg-[#1C2C3D] text-slate-300 border border-[#233549]'
                              }`}
                              title="Edit User Info"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                            </button>

                            <button
                              onClick={() => setUserToDelete({ id: u.id, name: u.name, email: u.email })}
                              className={`p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                                isLight
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                              title="Remove User Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-[#3BC0BB]/40"
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
              {authorizedDomains.map((dom) => {
                const domainUsersCount = users.filter((u) => u.email.toLowerCase().endsWith(`@${dom}`)).length;
                return (
                  <div
                    key={dom}
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isLight ? 'bg-slate-100 border border-slate-200' : 'bg-[#0D1520] border border-[#233549]'
                      }`}>
                        {c.logo}
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
                      const dom = val.split('@')[1].toLowerCase().trim();
                      const matchedComp = companies.find((c) => c.domain.toLowerCase() === dom);
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
                      const randPass = 'Dolphin@' + Math.floor(1000 + Math.random() * 9000);
                      setAssignedPassword(randPass);
                    }}
                    className="text-[11px] text-[#0773BB] hover:underline font-bold flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" /> Auto-Generate
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
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Hamdan Al-Nuaimi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
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
                      const dom = val.split('@')[1].toLowerCase().trim();
                      const matchedComp = companies.find((c) => c.domain.toLowerCase() === dom);
                      if (matchedComp) {
                        setSelectedCompanyId(matchedComp.id);
                      }
                    }
                  }}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              {/* Password Setting Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Assigned Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randPass = 'Dolphin@' + Math.floor(1000 + Math.random() * 9000);
                      setAssignedPassword(randPass);
                    }}
                    className="text-[11px] text-[#3BC0BB] hover:underline font-bold flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Dolphin@2026 (or leave blank for auto Dolphin@123)"
                  value={assignedPassword}
                  onChange={(e) => setAssignedPassword(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              {/* Company Selection or Custom Company Entry */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Company Entity *</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCompany(!isCustomCompany)}
                    className="text-[11px] text-[#3BC0BB] hover:underline font-bold"
                  >
                    {isCustomCompany ? '← Choose Existing Company' : '+ Enter Custom Company Name'}
                  </button>
                </div>

                {isCustomCompany ? (
                  <div className="space-y-2 p-3 rounded-xl bg-[#0D1520] border border-[#0773BB]/50 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Dolphin Cooling Systems LLC"
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        className="w-full bg-[#16222F] border border-[#233549] rounded-lg px-2.5 py-1.5 text-white"
                        required={isCustomCompany}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Company Domain (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., dolcool.ae"
                        value={customCompanyDomain}
                        onChange={(e) => setCustomCompanyDomain(e.target.value)}
                        className="w-full bg-[#16222F] border border-[#233549] rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
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
                  <label className="block text-slate-300 font-semibold mb-1">Access Level (Role) *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                  >
                    <option value="Viewer">Viewer (Read-Only Access)</option>
                    <option value="Team Member">Team Member (Standard Member)</option>
                    <option value="Project Manager">Project Manager (PM Access)</option>
                    <option value="Admin">Admin (Full System Governance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                    placeholder="e.g. Thermal Design, QA/QC"
                  />
                </div>
              </div>

              {inviteError && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center">
                  {inviteSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
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
    </div>
  );
};
