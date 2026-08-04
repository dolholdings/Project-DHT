import React, { useState } from 'react';
import { ShieldCheck, UserPlus, AlertTriangle, Check, X, Building2, Key, Plus, Globe, Briefcase, ExternalLink, Users as UsersIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APPROVED_DOMAINS, Role, CompanyType, Company } from '../../types';

export const UsersView: React.FC = () => {
  const { users, inviteUser, activeCompany, companies, addCompany } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'companies'>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Invite Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Team Member');
  const [department, setDepartment] = useState('Engineering');
  const [selectedCompanyId, setSelectedCompanyId] = useState(activeCompany.id || 'comp_5');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

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

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    const targetComp = companies.find((c) => c.id === selectedCompanyId);
    const res = inviteUser(name, email, role, department, selectedCompanyId);

    if (!res.success) {
      setInviteError(res.error || 'Failed to invite user.');
    } else {
      setInviteSuccess(`Successfully invited ${name} (${email}) for ${targetComp?.name || 'selected company'}!`);
      setTimeout(() => {
        setShowInviteModal(false);
        setName('');
        setEmail('');
        setInviteSuccess('');
      }, 1500);
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

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#3BC0BB]" />
            <span>User & Company Governance</span>
          </h1>
          <p className="text-xs text-slate-400">
            Dolphin Heat Transfer SPS LLC domain whitelist, partner company registration, and role-based permissions (RBAC).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCompanyModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#16222F] hover:bg-[#1A2838] border border-[#233549] text-white font-medium text-xs transition-all shadow-md"
          >
            <Building2 className="w-4 h-4 text-[#3BC0BB]" />
            <span>Register External Company</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg shadow-[#0773BB]/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#233549] pb-3">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'users'
              ? 'bg-[#0773BB] text-white shadow-lg'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          <span>Active Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('companies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'companies'
              ? 'bg-[#0773BB] text-white shadow-lg'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Registered Companies & Domains ({companies.length})</span>
        </button>
      </div>

      {/* Domain Whitelist Summary Banner */}
      <div className="p-5 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#3BC0BB]/40 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#3BC0BB] uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Dolphin Heat Transfer SPS LLC & Whitelisted Partner Domains</span>
          </span>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {APPROVED_DOMAINS.length} Core Dolphin Domains + {companies.filter(c => c.isExternal).length} External Partner Domains Whitelisted
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Direct signups and invitations are restricted to verified <strong>Dolphin Heat Transfer SPS LLC / Dolphin Group</strong> domains, or companies registered by the Admin:
        </p>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
          {APPROVED_DOMAINS.map((d) => (
            <span
              key={d}
              className="px-3 py-1 rounded-xl bg-[#0D1520] border border-[#0773BB]/50 text-white font-bold flex items-center gap-1.5"
            >
              <span className="text-amber-400">🔥</span>
              <span>@{d}</span>
            </span>
          ))}
          {companies
            .filter((c) => c.isExternal)
            .map((c) => (
              <span
                key={c.id}
                className="px-3 py-1 rounded-xl bg-[#0D1520] border border-[#3BC0BB]/50 text-[#3BC0BB] font-bold flex items-center gap-1.5"
              >
                <span>{c.logo}</span>
                <span>@{c.domain}</span>
                <span className="text-[10px] text-slate-400 font-sans">({c.code})</span>
              </span>
            ))}
        </div>
      </div>

      {/* VIEW 1: Active Users Table */}
      {activeSubTab === 'users' && (
        <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-[#0773BB]" />
              <span>Team Members & External Collaborators ({filteredUsers.length})</span>
            </h2>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter Company:</span>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="bg-[#0D1520] border border-[#233549] text-xs font-medium text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#0773BB]"
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0D1520] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#233549]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Corporate Email</th>
                  <th className="p-3">Company Entity</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233549]">
                {filteredUsers.map((u) => {
                  const comp = companies.find((c) => c.id === u.companyId);
                  return (
                    <tr key={u.id} className="hover:bg-[#0D1520]/80">
                      <td className="p-3 font-bold text-white flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-[#0773BB]"
                        />
                        <div>
                          <div className="text-white font-bold">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.role}</div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[#3BC0BB] font-semibold">{u.email}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span>{comp?.logo || '🏢'}</span>
                          <span className="font-bold text-slate-200">{comp?.name || 'Dolphin Group'}</span>
                          <span className="text-[10px] font-mono text-slate-400">({comp?.code})</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {comp?.isExternal ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {comp.type || 'External Partner'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Internal Dolphin
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">{u.department}</td>
                      <td className="p-3 font-bold text-white">{u.role}</td>
                      <td className="p-3 font-mono">${u.hourlyRate}/hr</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Companies Directory Tab */}
      {activeSubTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Registered Companies & Partner Directory</h2>
              <p className="text-xs text-slate-400">
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
                  className="p-5 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] hover:border-[#0773BB] transition-all space-y-3 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0D1520] border border-[#233549] flex items-center justify-center text-xl shrink-0">
                        {c.logo}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">{c.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-[#3BC0BB] font-bold">@{c.domain}</span>
                          <span className="text-[10px] text-slate-400">({c.code})</span>
                        </div>
                      </div>
                    </div>

                    {c.isExternal ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        {c.type || 'External'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                        Internal Entity
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{c.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#233549]">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="w-3.5 h-3.5 text-[#3BC0BB]" />
                      <span>{compUsers.length} Active Users</span>
                    </span>
                    {c.contactEmail && (
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
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

      {/* Role-Based Permissions Matrix */}
      <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-[#0773BB]" />
          <span>Governance & Access Matrix (RBAC)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0D1520] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#233549]">
              <tr>
                <th className="p-3">Feature Capability</th>
                <th className="p-3 text-center">Admin</th>
                <th className="p-3 text-center">Project Manager</th>
                <th className="p-3 text-center">Team Member</th>
                <th className="p-3 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#233549]">
              {permissionsMatrix.map((row) => (
                <tr key={row.feature} className="hover:bg-[#0D1520]/80">
                  <td className="p-3 font-semibold text-white">{row.feature}</td>
                  <td className="p-3 text-center">
                    {row.Admin ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.PM ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.Member ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.Viewer ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Invite Member to Project</h2>
                <p className="text-xs text-slate-400">Invite Dolphin internal or registered partner company team members.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company / Organization *</label>
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
                          {c.name} (@{c.domain})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Registered External Partners & Clients">
                    {companies
                      .filter((c) => c.isExternal)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.type} (@{c.domain})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

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
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#0773BB]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Must match a Dolphin internal domain or a registered partner company domain.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Team Member">Team Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department / Discipline</label>
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
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{inviteError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setShowCompanyModal(true);
                      if (email.includes('@')) {
                        setCompDomain(email.split('@')[1]);
                      }
                    }}
                    className="text-left text-[11px] font-bold text-[#3BC0BB] hover:underline"
                  >
                    + Register missing company domain now
                  </button>
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
                  className="px-5 py-2 rounded-xl bg-[#0773BB] text-white font-medium shadow-lg"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Register External Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#3BC0BB]" />
                  <span>Register Company / Partner Entity</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Register client, contractor, or vendor companies so their members can collaborate on company projects.
                </p>
              </div>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Petrofac Engineering or Al Futtaim HVAC"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PETRO, AFH"
                    value={compCode}
                    onChange={(e) => setCompCode(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#0773BB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Type *</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value as CompanyType)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
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
                <label className="block text-slate-300 font-semibold mb-1">
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
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl pl-8 pr-3 py-2 text-white font-mono focus:outline-none focus:border-[#0773BB]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Users with emails ending in this domain will be whitelisted for invitations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="contracts@company.com"
                    value={compContact}
                    onChange={(e) => setCompContact(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Logo Icon / Emoji</label>
                  <input
                    type="text"
                    placeholder="🏢 or 🏗️ or 🔧"
                    value={compLogo}
                    onChange={(e) => setCompLogo(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Project Role</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding project scope, contract reference, or partner relationship..."
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                />
              </div>

              {compError && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{compError}</span>
                </div>
              )}

              {compSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center">
                  {compSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
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
    </div>
  );
};
