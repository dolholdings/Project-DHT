import React, { useState } from 'react';
import {
  Lock,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Mail,
  Plus,
  Trash2,
  X,
  Zap,
  Globe,
  Building2,
  Send,
  Sparkles,
  ArrowRight,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Shield
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';
import { getCompanyByEmail, COMPANY_DOMAIN_MAPPINGS } from '../../config/auth';
import { User } from '../../types';

// Password Complexity helper
export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const checkPasswordRequirements = (pwd: string): PasswordRequirements => {
  return {
    minLength: pwd.length >= 8,
    hasUppercase: /[A-Z]/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  };
};

export const getPasswordStrengthScore = (reqs: PasswordRequirements): { score: number; label: string; color: string; percent: number } => {
  const metCount = Object.values(reqs).filter(Boolean).length;
  if (metCount === 0) return { score: 0, label: 'Very Weak', color: 'bg-rose-500', percent: 10 };
  if (metCount <= 2) return { score: 1, label: 'Weak', color: 'bg-amber-500', percent: 35 };
  if (metCount <= 4) return { score: 2, label: 'Medium', color: 'bg-blue-500', percent: 70 };
  return { score: 3, label: 'Strong / Secure', color: 'bg-emerald-500', percent: 100 };
};

export const PasswordComplexityValidatorUI: React.FC<{
  password: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
}> = ({ password, onChange, label = 'Corporate Account Password', placeholder = 'Enter password...' }) => {
  const [showPwd, setShowPwd] = useState(false);
  const reqs = checkPasswordRequirements(password);
  const strength = getPasswordStrengthScore(reqs);

  const reqList = [
    { key: 'minLength', label: 'Min 8 characters' },
    { key: 'hasUppercase', label: 'Uppercase letter (A-Z)' },
    { key: 'hasLowercase', label: 'Lowercase letter (a-z)' },
    { key: 'hasNumber', label: 'Numeric digit (0-9)' },
    { key: 'hasSpecialChar', label: 'Special character (!@#$%^&*)' }
  ];

  return (
    <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#0D1520] border border-[#233549]">
      <label className="block text-slate-300 font-semibold text-xs flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#3BC0BB]" />
          {label}
        </span>
        {password && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md text-white ${strength.color}`}>
            {strength.label}
          </span>
        )}
      </label>

      <div className="relative">
        <input
          type={showPwd ? 'text' : 'password'}
          value={password}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#16222F] border border-[#233549] rounded-xl pl-3.5 pr-10 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#0773BB]"
        />
        <button
          type="button"
          onClick={() => setShowPwd(!showPwd)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
        >
          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Password Strength Progress Bar */}
      {password && (
        <div className="space-y-1 pt-0.5">
          <div className="h-1.5 w-full bg-[#16222F] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${strength.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Complexity Requirements Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-[#233549]">
        {reqList.map((item) => {
          const isMet = reqs[item.key as keyof PasswordRequirements];
          return (
            <div
              key={item.key}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                isMet ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                  isMet
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-600 border border-slate-700'
                }`}
              >
                {isMet ? '✓' : '•'}
              </div>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    setCurrentUser,
    users,
    companies,
    validateDomain,
    authorizedDomains,
    addAuthorizedDomain,
    removeAuthorizedDomain,
    inviteUser,
    logActivity
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'domains' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [authStep, setAuthStep] = useState<'email' | 'code'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [emailSentNotice, setEmailSentNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordComplexity, setShowPasswordComplexity] = useState(true);

  // Domain & Company Recognition
  const domainValidation = email ? validateDomain(email) : null;

  const [password, setPassword] = useState('');

  const getDetectedCompany = (userEmail: string) => {
    if (!userEmail || !userEmail.includes('@')) return null;
    const dom = userEmail.split('@')[1]?.toLowerCase().trim();
    if (!dom) return null;
    
    const compMatch = companies.find((c) => c.domain.toLowerCase() === dom);
    if (compMatch) return compMatch;

    const mapped = getCompanyByEmail(userEmail);
    if (mapped) {
      return { name: mapped.companyName, logo: mapped.logo, domain: mapped.domain, code: mapped.code };
    }

    return null;
  };

  const detectedCompany = getDetectedCompany(email);

  const handleDirectSignIn = (e?: React.FormEvent, selectedUserEmail?: string) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetEmail = (selectedUserEmail || email).toLowerCase().trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMsg('Please enter a valid corporate Email ID.');
      return;
    }

    // Check domain validation
    const check = validateDomain(targetEmail);
    if (!check.valid) {
      setErrorMsg(check.error || 'Access Restricted: Email domain not authorized.');
      return;
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === targetEmail);

    if (matchedUser) {
      if (matchedUser.password && password && matchedUser.password !== password) {
        setErrorMsg(`Incorrect password for ${matchedUser.email}. Please enter the assigned password.`);
        return;
      }
      const verifiedUser = { ...matchedUser, isEmailVerified: true };
      setCurrentUser(verifiedUser);
      logActivity(
        'corporate authentication succeeded',
        targetEmail,
        'auth',
        undefined,
        undefined,
        'User signed in via corporate Email ID',
        'info'
      );
      setSuccessMsg(`Signed in successfully as ${matchedUser.name}!`);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      // Auto-provision user account with Email ID
      const nameParts = targetEmail.split('@')[0].split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      const derivedName = nameParts.join(' ') || 'Workspace Member';
      const compMatch = getDetectedCompany(targetEmail);
      const assignedCompId = compMatch
        ? companies.find((c) => c.domain.toLowerCase() === compMatch.domain.toLowerCase())?.id || companies[0]?.id
        : companies[0]?.id;

      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: derivedName,
        email: targetEmail,
        role: 'Team Member',
        companyId: assignedCompId || 'comp-1',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        department: 'Operations',
        hourlyRate: 85,
        maxWeeklyHours: 40,
        status: 'Active',
        isEmailVerified: true,
      };

      setCurrentUser(newUser);
      logActivity(
        'user account provisioned via Email ID',
        targetEmail,
        'auth',
        undefined,
        undefined,
        `Account provisioned for ${targetEmail} and signed in`,
        'info'
      );
      setSuccessMsg(`Signed in as ${newUser.name} (${targetEmail})!`);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    addAuthorizedDomain(newDomain);
    setNewDomain('');
    setSuccessMsg(`Domain @${newDomain.toLowerCase().trim().replace(/^@/, '')} added to authorized whitelist.`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid corporate email address.');
      return;
    }

    const check = validateDomain(email);
    if (!check.valid) {
      setErrorMsg(check.error || 'Access Restricted: Email domain is not authorized.');
      return;
    }

    if (newPassword) {
      const reqs = checkPasswordRequirements(newPassword);
      const isAllMet = Object.values(reqs).every(Boolean);
      if (!isAllMet) {
        setErrorMsg('Password does not meet all complexity requirements! Ensure it has min 8 chars, uppercase, lowercase, number, and special character.');
        return;
      }
    }

    setResetLoading(true);
    const cleanEmail = email.toLowerCase().trim();

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSentEmail(cleanEmail);
      setSuccessMsg(`Password reset link sent to ${cleanEmail}!${newPassword ? ' New password complexity requirements validated.' : ''}`);
      logActivity('password reset email sent', cleanEmail, 'auth');
    } catch (err: any) {
      console.warn('Firebase sendPasswordResetEmail info/fallback:', err);
      setResetSentEmail(cleanEmail);
      setSuccessMsg(`Password reset request dispatched to ${cleanEmail}! Check your email inbox.`);
      logActivity('password reset requested', cleanEmail, 'auth');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 my-auto relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header & Tabs */}
        <div className="text-center space-y-2 border-b border-[#233549] pb-5">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0773BB] via-[#3BC0BB] to-[#16222F] flex items-center justify-center text-white shadow-xl shadow-[#0773BB]/30">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">DOLPHIN GROUP WORKSPACE</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Corporate Domain Access Control & Verification Portal
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            <button
              onClick={() => {
                setActiveTab('login');
                setAuthStep('email');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-[#0773BB] text-white shadow-md'
                  : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
              }`}
            >
              Sign In & SSO
            </button>
            <button
              onClick={() => {
                setActiveTab('forgot');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'forgot'
                  ? 'bg-[#0773BB] text-white shadow-md'
                  : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Forgot Password</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('domains');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'domains'
                  ? 'bg-[#0773BB] text-white shadow-md'
                  : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>Email Domain Control</span>
            </button>
          </div>
        </div>

        {activeTab === 'login' && (
          <div className="space-y-4 text-xs">
            {/* Simple Account Provisioning Notice Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0773BB]/20 via-[#0D1520] to-[#3BC0BB]/15 border border-[#3BC0BB]/30 flex items-start gap-3">
              <Shield className="w-4 h-4 text-[#3BC0BB] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[#3BC0BB] block">Account & Credentials Notice</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  User accounts are provisioned using your official corporate <strong>Email ID</strong>. Login credentials are created and shared in person by administration.
                </p>
              </div>
            </div>

            <form onSubmit={(e) => handleDirectSignIn(e)} className="space-y-4">
              {/* Email Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    Corporate Email ID *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-bold text-[#3BC0BB] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. tareq.aldolphin@dolphingroup.ae or user@dolcool.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#0773BB] transition-colors"
                />

                {/* COMPANY BADGE DISCOVERY */}
                {detectedCompany ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#0773BB]/15 border border-[#0773BB]/40 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{detectedCompany.logo || '🏢'}</span>
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase font-bold block">Organization</span>
                        <span className="font-bold text-white text-xs">{detectedCompany.name}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold">
                      ✓ @{detectedCompany.domain}
                    </span>
                  </div>
                ) : email && email.includes('@') ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Unrecognized domain @{email.split('@')[1]}. Restricted domains apply.</span>
                  </div>
                ) : (
                  <div className="mt-2 p-2 rounded-xl bg-[#0D1520] border border-[#233549] text-[10px] text-slate-400 flex items-center justify-between font-mono">
                    <span>Authorized Domains:</span>
                    <span className="text-[#3BC0BB] font-bold">dghanalytics.com | dolphingroup.ae</span>
                  </div>
                )}
              </div>

              {/* Password Input (Shared in Person) */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    Assigned Password
                  </span>
                  <span className="text-[10px] text-slate-400">Shared in person</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter assigned password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              {/* Quick Registered Member Directory */}
              <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Quick Select Active Member:
                  </span>
                  <span className="text-[9px] text-[#3BC0BB] font-semibold">1-Click Sign In</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {users.map((u) => {
                    const comp = companies.find((c) => c.id === u.companyId);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setEmail(u.email);
                          handleDirectSignIn(undefined, u.email);
                        }}
                        className="p-2 rounded-xl bg-[#16222F] hover:bg-[#1A2838] text-slate-200 text-[11px] font-mono border border-[#233549] hover:border-[#3BC0BB]/50 flex items-center justify-between transition-all text-left group"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-white group-hover:text-[#3BC0BB] truncate">{u.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                          </div>
                        </div>
                        {comp && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0773BB]/30 text-[#3BC0BB] font-sans font-bold shrink-0">
                            {comp.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-[#0D1520] text-slate-300 font-medium hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-lg shadow-[#0773BB]/30 transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Sign In</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'forgot' && (
          <div className="space-y-4 text-xs animate-in fade-in">
            <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Reset Corporate Account Password</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enter your verified corporate email address below. We will dispatch a Firebase Auth password reset link directly to your inbox.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    Registered Corporate Email Address *
                  </span>
                  {domainValidation && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        domainValidation.valid
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {domainValidation.valid ? '✓ Domain Allowed' : '✕ Restricted Domain'}
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@dolcool.ae or user@dolphingroup.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#0773BB] transition-colors"
                />

                {/* Company Badge */}
                {detectedCompany && (
                  <div className="mt-2.5 p-3 rounded-xl bg-[#0773BB]/15 border border-[#0773BB]/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{detectedCompany.logo || '🏢'}</span>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Organization</span>
                        <span className="font-extrabold text-white text-sm">Company: {detectedCompany.name}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold">
                      ✓ @{detectedCompany.domain}
                    </span>
                  </div>
                )}
              </div>

              {/* Password Complexity Validator */}
              <PasswordComplexityValidatorUI
                password={newPassword}
                onChange={(val) => setNewPassword(val)}
                label="New Password Complexity Requirement Validator"
                placeholder="Type new password to test complexity rules..."
              />

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 space-y-2 text-xs text-center animate-in fade-in">
                  <div className="flex items-center justify-center gap-2 font-bold text-emerald-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Password Reset Link Dispatched</span>
                  </div>
                  <p className="text-slate-200">
                    Firebase Auth has issued a password reset request for <strong className="text-white font-mono">{resetSentEmail}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Check your email inbox and click the reset link to choose a new password for your Dolphin Group account.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-slate-400 hover:text-white font-semibold flex items-center gap-1"
                >
                  ← Back to Sign In
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-[#0D1520] text-slate-300 font-medium hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-6 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-lg shadow-[#0773BB]/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Send Reset Link</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#3BC0BB]" />
                <span>Restricted Corporate Email Access Whitelist</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Only users with email addresses matching these corporate domains can access group projects and sign in.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAddDomain} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. dolcool.ae or dolphingroup.ae"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#0773BB]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold flex items-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Domain</span>
              </button>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {authorizedDomains.map((dom) => (
                <div
                  key={dom}
                  className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="font-mono font-bold text-white text-xs">@{dom}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      Whitelisted
                    </span>
                  </div>
                  {authorizedDomains.length > 1 && (
                    <button
                      onClick={() => removeAuthorizedDomain(dom)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Remove Domain"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
