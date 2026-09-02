import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Camera,
  X,
  CheckCircle2,
  Building2,
  Briefcase,
  Mail,
  DollarSign,
  Clock,
  Shield,
  Phone,
  FileText,
  Sparkles,
  Save,
  Globe
} from 'lucide-react';
import { User, Role, Company } from '../../types';
import { useApp } from '../../context/AppContext';
import { AvatarPickerModal } from './AvatarPickerModal';

export interface UserProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  theme?: 'dark' | 'light' | string;
}

export const UserProfileEditModal: React.FC<UserProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  theme = 'dark'
}) => {
  const { updateUser, companies, currentUser, logActivity } = useApp();
  const isLight = theme === 'light';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<Role>('Team Member');
  const [companyId, setCompanyId] = useState('');
  const [companyAccessScope, setCompanyAccessScope] = useState<'all' | 'specific'>('specific');
  const [allowedCompanyIds, setAllowedCompanyIds] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [hourlyRate, setHourlyRate] = useState<number>(100);
  const [maxWeeklyHours, setMaxWeeklyHours] = useState<number>(40);
  const [status, setStatus] = useState<'Active' | 'Offline' | 'In Meeting' | 'On Leave'>('Active');
  const [avatar, setAvatar] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [bio, setBio] = useState<string>('');

  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setDepartment(user.department || 'Engineering');
      setRole(user.role || 'Team Member');
      setCompanyId(user.companyId || companies[0]?.id || 'comp_5');
      setCompanyAccessScope(user.companyAccessScope || (user.isSuperAdmin || user.role === 'Admin' ? 'all' : 'specific'));
      setAllowedCompanyIds(
        user.allowedCompanyIds && user.allowedCompanyIds.length > 0
          ? user.allowedCompanyIds
          : [user.companyId || companies[0]?.id || 'comp_5']
      );
      setIsSuperAdmin(!!user.isSuperAdmin || user.role === 'Admin');
      setHourlyRate(user.hourlyRate || 100);
      setMaxWeeklyHours(user.maxWeeklyHours || 40);
      setStatus(user.status || 'Active');
      setAvatar(user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200');
      setPhone((user as any).phone || '');
      setBio((user as any).bio || '');
      setSuccessMessage('');
    }
  }, [user, companies]);

  if (!isOpen || !user) return null;

  const isAdmin = currentUser?.role === 'Admin' || !!currentUser?.isSuperAdmin;
  const isEditingSelf = currentUser?.id === user.id;

  const handleToggleCompanyAllowed = (cId: string) => {
    setAllowedCompanyIds((prev) => {
      const exists = prev.includes(cId);
      if (exists) {
        const next = prev.filter((id) => id !== cId);
        return next.length > 0 ? next : [companyId || companies[0]?.id || 'comp_5'];
      } else {
        return [...prev, cId];
      }
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const updates: Partial<User> & Record<string, any> = {
      name: name.trim(),
      department: department.trim(),
      avatar: avatar || user.avatar,
      status,
      phone: phone.trim(),
      bio: bio.trim()
    };

    // Role, company, access scope, and billing adjustments can only be made by Workspace Admins
    if (isAdmin) {
      updates.role = role;
      updates.companyId = companyId;
      updates.companyAccessScope = companyAccessScope;
      updates.allowedCompanyIds =
        companyAccessScope === 'all' || isSuperAdmin || role === 'Admin'
          ? ['all']
          : allowedCompanyIds.length > 0
          ? allowedCompanyIds
          : [companyId];
      updates.isSuperAdmin = isSuperAdmin || role === 'Admin';
      updates.hourlyRate = Number(hourlyRate) || 100;
      updates.maxWeeklyHours = Number(maxWeeklyHours) || 40;
    }

    updateUser(user.id, updates);

    logActivity(
      'updated user profile picture & details',
      user.name,
      'user',
      undefined,
      undefined,
      `${isEditingSelf ? 'Personal profile' : `User profile for ${user.name}`} updated (avatar & details).`,
      'info'
    );

    setSuccessMessage('Profile and picture saved successfully!');
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage('');
      onClose();
    }, 1000);
  };

  const activeCompany = companies.find((c) => c.id === companyId) || companies[0];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
        <div
          className={`rounded-2xl w-full max-w-xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}
        >
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <span>{isEditingSelf ? 'Edit My Profile & Picture' : `Edit Profile: ${user.name}`}</span>
                  {isEditingSelf && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                      CURRENT USER
                    </span>
                  )}
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Customize your avatar photo, display name, department, and contact info
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSaveProfile} className="p-5 overflow-y-auto space-y-5 flex-1">
            
            {/* AVATAR HERO / CHANGE BUTTON SECTION */}
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => setIsAvatarPickerOpen(true)}>
                  <img
                    src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt={name}
                    className="w-20 h-20 rounded-2xl object-cover ring-3 ring-[#0773BB] shadow-lg group-hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5" />
                    <span className="text-[9px] font-bold mt-1">Change</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#0773BB] text-white shadow-md">
                    <Camera className="w-3 h-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold">{name || 'Your Name'}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        role === 'Admin'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : role === 'Project Manager'
                          ? 'bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30'
                          : 'bg-slate-700/40 text-slate-300 border border-slate-600/40'
                      }`}
                    >
                      {role}
                    </span>
                  </div>
                  <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{email}</p>
                  <p className="text-[11px] text-slate-400">
                    {department} • @{activeCompany?.domain || 'dolphin.global'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0773BB] hover:bg-[#0663a1] text-white shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Camera className="w-4 h-4" />
                <span>Change Picture</span>
              </button>
            </div>

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Alex Morgan"
                  className={`w-full text-xs font-semibold rounded-xl p-2.5 border focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              {/* Email Address (Read-Only) */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className={`w-full text-xs font-mono font-semibold rounded-xl p-2.5 border opacity-60 cursor-not-allowed ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#0D1520] border-[#233549] text-slate-400'
                  }`}
                />
              </div>

              {/* Department */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Department / Team
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, Product, Design"
                  className={`w-full text-xs font-semibold rounded-xl p-2.5 border focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              {/* Status */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Work Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={`w-full text-xs font-semibold rounded-xl p-2.5 border focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  <option value="Active">🟢 Active / Available</option>
                  <option value="In Meeting">🟡 In Meeting / Busy</option>
                  <option value="Offline">⚫ Offline</option>
                  <option value="On Leave">🏖️ On Leave / Vacation</option>
                </select>
              </div>

              {/* Phone / Contact */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className={`w-full text-xs font-semibold rounded-xl p-2.5 border focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              {/* Company (Admin editable or viewer) */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Tenant Company Association
                </label>
                {isAdmin ? (
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className={`w-full text-xs font-semibold rounded-xl p-2.5 border focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={activeCompany?.name || 'Dolphin Group'}
                    disabled
                    className={`w-full text-xs font-semibold rounded-xl p-2.5 border opacity-60 cursor-not-allowed ${
                      isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#0D1520] border-[#233549] text-slate-400'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* Admin-Only Settings: Role, Company Scope, and Billing Rates */}
            {isAdmin && (
              <div
                className={`p-4 rounded-xl border space-y-4 ${
                  isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/5 border-amber-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                    <Shield className="w-4 h-4" />
                    <span>Admin Privilege & Access Governance</span>
                  </div>
                  {isSuperAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      👑 Super Admin Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Access Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => {
                        const newR = e.target.value as Role;
                        setRole(newR);
                        if (newR === 'Admin') {
                          setCompanyAccessScope('all');
                          setIsSuperAdmin(true);
                        }
                      }}
                      className={`w-full text-xs font-semibold rounded-xl p-2 border focus:outline-none focus:border-amber-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                      }`}
                    >
                      <option value="Admin">Admin (Full Privilege)</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Team Member">Team Member</option>
                      <option value="Viewer">Viewer (Read Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Hourly Billing Rate ($)
                    </label>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      min="0"
                      className={`w-full text-xs font-semibold rounded-xl p-2 border focus:outline-none focus:border-amber-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Weekly Capacity (Hours)
                    </label>
                    <input
                      type="number"
                      value={maxWeeklyHours}
                      onChange={(e) => setMaxWeeklyHours(Number(e.target.value))}
                      min="1"
                      max="80"
                      className={`w-full text-xs font-semibold rounded-xl p-2 border focus:outline-none focus:border-amber-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Company Access Scope Controls */}
                <div className={`p-3 rounded-xl border text-xs space-y-2.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}>
                  <label className={`block text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Company & Workspace Dashboard Access Scope
                  </label>

                  {/* Scope Selection Radios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyAccessScope('all');
                        setIsSuperAdmin(true);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        companyAccessScope === 'all' || isSuperAdmin
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-[#16222F] border-[#233549] text-slate-300 hover:bg-[#1C2C3D]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>👑 All Companies & Spaces</span>
                        {(companyAccessScope === 'all' || isSuperAdmin) && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/30 rounded font-black">Active</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        Super Admin access to all company dashboards, workspaces, and project spaces across Dolphin Group.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCompanyAccessScope('specific');
                        setIsSuperAdmin(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        companyAccessScope === 'specific' && !isSuperAdmin
                          ? 'bg-[#0773BB]/15 border-[#0773BB]/50 text-[#0773BB] dark:text-[#38BDF8] ring-1 ring-[#0773BB]/30'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-[#16222F] border-[#233549] text-slate-300 hover:bg-[#1C2C3D]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>🏢 Specific Companies</span>
                        {companyAccessScope === 'specific' && !isSuperAdmin && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#0773BB]/30 rounded font-black">Active</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        Restrict access to selected corporate entities or external partners only.
                      </p>
                    </button>
                  </div>

                  {/* Multi-Company Checkboxes if Specific */}
                  {companyAccessScope === 'specific' && !isSuperAdmin && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Select Allowed Companies ({allowedCompanyIds.length} selected)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAllowedCompanyIds(companies.map((c) => c.id))}
                            className="text-[10px] font-bold text-[#0773BB] hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-slate-400">•</span>
                          <button
                            type="button"
                            onClick={() => setAllowedCompanyIds([companyId || companies[0]?.id || 'comp_5'])}
                            className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                          >
                            Primary Only
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {companies.map((c) => {
                          const isChecked = allowedCompanyIds.includes(c.id) || c.id === companyId;
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                                isChecked
                                  ? isLight
                                    ? 'bg-sky-50 border-[#0773BB]/40 text-slate-900 font-semibold'
                                    : 'bg-[#0773BB]/10 border-[#0773BB]/40 text-white font-semibold'
                                  : isLight
                                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                                  : 'bg-[#16222F] border-[#233549] text-slate-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCompanyAllowed(c.id)}
                                className="rounded text-[#0773BB] focus:ring-[#0773BB]"
                              />
                              <span className="truncate">{c.name}</span>
                              <span className="text-[9px] font-mono opacity-60 ml-auto">{c.code}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bio / Description */}
            <div>
              <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Professional Bio / Notes
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Brief summary of skills, experience, or responsibilities..."
                className={`w-full text-xs font-semibold rounded-xl p-2.5 border focus:outline-none focus:border-[#0773BB] ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                }`}
              />
            </div>

            {/* Footer Buttons */}
            <div className={`pt-4 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-[#0D1520] hover:bg-[#1C2C3D] text-slate-300'
                }`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90 text-white shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        currentAvatar={avatar}
        userName={name || user.name}
        onSaveAvatar={(newAvatarUrl) => {
          setAvatar(newAvatarUrl);
        }}
        theme={theme}
      />
    </>
  );
};
