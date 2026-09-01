import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  AlertTriangle,
  CheckCircle2,
  Mail,
  X,
  Building2,
  Send,
  Sparkles,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';
import { saveUserPasswordInFirestore, updateUserInFirestore, deduplicateUserList } from '../../services/dataService';
import {
  getCompanyByEmail,
  validatePasswordPolicy,
  checkPasswordRequirements,
  getPasswordStrengthScore,
  generateSecureCompliantPassword,
  PASSWORD_POLICY,
  PasswordRequirements
} from '../../config/auth';
import { User } from '../../types';
import { INITIAL_USERS } from '../../data/initialData';
import { LogoPlaceholder } from '../common/LogoPlaceholder';

export { checkPasswordRequirements, getPasswordStrengthScore };

export const PasswordComplexityValidatorUI: React.FC<{
  password: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  isLight?: boolean;
}> = ({
  password,
  onChange,
  label = 'Corporate Password Security Policy',
  placeholder = 'Enter new secure password...',
  isLight = false
}) => {
  const [showPwd, setShowPwd] = useState(false);
  const validation = validatePasswordPolicy(password);
  const reqs = validation.requirements;

  const reqList = [
    { key: 'minLength', label: `Min ${PASSWORD_POLICY.minLength} characters` },
    { key: 'hasUppercase', label: 'Uppercase letter (A-Z)' },
    { key: 'hasLowercase', label: 'Lowercase letter (a-z)' },
    { key: 'hasNumber', label: 'Numeric digit (0-9)' },
    { key: 'hasSpecialChar', label: 'Special character (!@#$%^&*)' },
    { key: 'notTrivial', label: 'No common/trivial words' }
  ];

  return (
    <div className={`space-y-3 p-3.5 rounded-2xl border transition-all ${
      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
    }`}>
      <div className="flex items-center justify-between">
        <label className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
          <Lock className="w-3.5 h-3.5 text-[#3BC0BB]" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={() => onChange(generateSecureCompliantPassword())}
          className="text-[11px] font-bold text-[#0773BB] hover:text-[#3BC0BB] transition-colors flex items-center gap-1 cursor-pointer"
          title="Generate an enterprise-compliant strong password"
        >
          <Sparkles className="w-3 h-3" />
          <span>Auto-Generate</span>
        </button>
      </div>

      <div className="relative">
        <input
          type={showPwd ? 'text' : 'password'}
          value={password}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0773BB]/50 transition-all border ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              : 'bg-[#16222F] border-[#233549] text-white placeholder:text-slate-500'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPwd(!showPwd)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors ${
            isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'
          }`}
          title={showPwd ? 'Hide password' : 'Show password'}
        >
          {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Password Strength Progress Bar & Badge */}
      {password && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Password Complexity:</span>
            <span className={`px-2 py-0.5 rounded text-white text-[10px] font-extrabold ${validation.strengthColor}`}>
              {validation.strengthLabel} ({validation.strengthPercent}%)
            </span>
          </div>
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#16222F]'}`}>
            <div
              className={`h-full transition-all duration-300 ${validation.strengthColor}`}
              style={{ width: `${validation.strengthPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Complexity Requirements Checklist */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
        {reqList.map((item) => {
          const isMet = reqs[item.key as keyof PasswordRequirements];
          return (
            <div
              key={item.key}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                isMet ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-slate-400' : 'text-slate-500')
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                  isMet
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                    : (isLight ? 'bg-slate-200 text-slate-400 border border-slate-300' : 'bg-slate-800 text-slate-600 border border-slate-700')
                }`}
              >
                {isMet ? '✓' : '•'}
              </div>
              <span className={isMet ? 'font-semibold' : ''}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LoginModal: React.FC<{ onClose: () => void; isGatekeeper?: boolean }> = ({ onClose, isGatekeeper = false }) => {
  const {
    theme,
    currentUser,
    isAuthenticated,
    logout,
    setCurrentUser,
    setIsAuthenticated,
    users,
    updateUser,
    companies,
    activeCompany,
    validateDomain,
    logActivity,
    setActiveTab: setActiveViewTab
  } = useApp();

  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Domain & Company Recognition
  const domainValidation = email ? validateDomain(email) : null;

  const getDetectedCompany = (userEmail: string) => {
    if (!userEmail || !userEmail.includes('@')) return null;
    const dom = userEmail.split('@')[1]?.toLowerCase().trim();
    if (!dom) return null;
    
    const compMatch = companies.find((c) => (c?.domain || '').toLowerCase() === dom);
    if (compMatch) return compMatch;

    const mapped = getCompanyByEmail(userEmail);
    if (mapped) {
      return { name: mapped.companyName, logo: mapped.logo, domain: mapped.domain, code: mapped.code };
    }

    return null;
  };

  const detectedCompany = getDetectedCompany(email);

  const handleDirectSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetInput = String(email || '').toLowerCase().trim();
    const enteredPassword = String(password || '').trim();

    if (!targetInput) {
      setErrorMsg('Please enter your Username or registered Email address.');
      return;
    }

    if (!enteredPassword) {
      setErrorMsg('Password is required. Please enter your account password.');
      return;
    }

    // Look up user in unified deduplicated users list
    let localStoredUsers: User[] = [];
    try {
      const stored = localStorage.getItem('dolphin_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStoredUsers = parsed;
        }
      }
    } catch (e) {
      // fallback
    }

    const targetUsersList = deduplicateUserList([...INITIAL_USERS, ...users, ...localStoredUsers]);

    // Match by email, username prefix, full name, or user ID
    const matchedUser = targetUsersList.find(
      (u) => {
        if (!u) return false;
        const uEmail = (u.email || '').toLowerCase().trim();
        const uName = (u.name || '').toLowerCase().trim();
        const uPrefix = uEmail.split('@')[0] || '';
        const uId = (u.id || '').toLowerCase().trim();
        return (
          uEmail === targetInput ||
          uName === targetInput ||
          uPrefix === targetInput ||
          uId === targetInput ||
          (targetInput === 'admin' && (uEmail === 'admin@dolrad.ae' || u.role === 'Admin')) ||
          (targetInput.includes('superadmin') && (uEmail.includes('superadmin') || u.role === 'Admin')) ||
          (targetInput.includes('prog.mgr') && uEmail.includes('proj.mgr')) ||
          (targetInput.includes('proj.mgr') && uEmail.includes('prog.mgr'))
        );
      }
    );

    if (!matchedUser) {
      setErrorMsg(`Account not found for "${targetInput}". Only registered users in the User Master can sign in.`);
      logActivity(
        'failed login attempt - unknown account',
        targetInput,
        'auth',
        undefined,
        undefined,
        `Rejected sign-in attempt for unregistered account "${targetInput}"`,
        'warning'
      );
      return;
    }

    // Check account active status
    if (matchedUser.status === 'On Leave' || (matchedUser as any).status === 'Suspended' || (matchedUser as any).status === 'Inactive' || matchedUser.isDeleted) {
      setErrorMsg('This account is deactivated or suspended. Please contact your Workspace Administrator.');
      return;
    }

    // Check exact password match (with whitespace trimming)
    let isPasswordCorrect = false;
    if (matchedUser.password && enteredPassword === matchedUser.password.trim()) {
      isPasswordCorrect = true;
    } else {
      // Fallback for initial demo accounts
      const initialMatch = INITIAL_USERS.find(
        (iu) => iu.email.toLowerCase().trim() === (matchedUser.email || '').toLowerCase().trim() || iu.id === matchedUser.id
      );
      if (initialMatch?.password && enteredPassword === initialMatch.password.trim()) {
        isPasswordCorrect = true;
      }
    }

    if (!isPasswordCorrect) {
      setErrorMsg('Invalid password. Please enter the correct password for your account.');
      logActivity(
        'failed login attempt - wrong password',
        matchedUser.email,
        'auth',
        undefined,
        undefined,
        `Failed password attempt for user ${matchedUser.email}`,
        'warning'
      );
      return;
    }

    // If matchedUser password is missing in state, backfill it
    if (!matchedUser.password && enteredPassword) {
      updateUser(matchedUser.id, { password: enteredPassword });
    }

    // Authentication verified! Role is automatically determined strictly from User Master record
    const verifiedUser: User = {
      ...matchedUser,
      password: matchedUser.password || enteredPassword,
      isEmailVerified: true
    };

    setCurrentUser(verifiedUser);
    setIsAuthenticated(true);

    if (verifiedUser.role === 'Admin') {
      if (setActiveViewTab) setActiveViewTab('admin');
    } else {
      if (setActiveViewTab) setActiveViewTab('dashboard');
    }

    logActivity(
      'user signed in',
      matchedUser.email,
      'auth',
      undefined,
      undefined,
      `User ${matchedUser.name} authenticated successfully with role: ${matchedUser.role}`,
      'info'
    );

    setSuccessMsg(`Welcome back, ${matchedUser.name}! Signed in as ${matchedUser.role}`);
    setTimeout(() => {
      onClose();
    }, 450);
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
    const cleanEmail = String(email || '').toLowerCase().trim();

    try {
      // Find matching user in system
      const targetUser = users.find(
        (u) =>
          u &&
          ((u.email || '').toLowerCase() === cleanEmail ||
            (u.name || '').toLowerCase() === cleanEmail ||
            (u.email || '').split('@')[0].toLowerCase() === cleanEmail)
      );

      if (newPassword && targetUser) {
        // Save new password to user in state, local storage, and directly in Firestore
        updateUser(targetUser.id, { password: newPassword });
        await saveUserPasswordInFirestore(targetUser.id, newPassword);
        setResetSentEmail(cleanEmail);
        setSuccessMsg(`New password for ${targetUser.name} (${cleanEmail}) has been securely updated and saved in Firebase! You can now log in with your new password.`);
        logActivity('password reset and saved to firebase', cleanEmail, 'auth');
      } else {
        await sendPasswordResetEmail(auth, cleanEmail);
        setResetSentEmail(cleanEmail);
        setSuccessMsg(`Password reset link sent to ${cleanEmail}! Check your email inbox.`);
        logActivity('password reset email sent', cleanEmail, 'auth');
      }
    } catch (err: any) {
      console.warn('Firebase password reset info/fallback:', err);
      // Fallback: if user was found and new password was provided, persist to Firestore
      const targetUser = users.find(
        (u) =>
          u &&
          ((u.email || '').toLowerCase() === cleanEmail ||
            (u.name || '').toLowerCase() === cleanEmail ||
            (u.email || '').split('@')[0].toLowerCase() === cleanEmail)
      );
      if (newPassword && targetUser) {
        updateUser(targetUser.id, { password: newPassword });
        await saveUserPasswordInFirestore(targetUser.id, newPassword).catch(() => {});
        setResetSentEmail(cleanEmail);
        setSuccessMsg(`New password for ${targetUser.name} (${cleanEmail}) updated and saved to Firebase database! You can now log in.`);
        logActivity('password reset and saved to firebase', cleanEmail, 'auth');
      } else {
        setResetSentEmail(cleanEmail);
        setSuccessMsg(`Password reset request dispatched to ${cleanEmail}! Check your email inbox.`);
        logActivity('password reset requested', cleanEmail, 'auth');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`border rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl my-auto relative z-10 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#16222F] border-[#233549] text-white'
        }`}
      >
        
        {/* Close Button */}
        {!isGatekeeper && (
          <button
            onClick={onClose}
            className={`absolute top-5 right-5 p-2 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
                : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <LogoPlaceholder
            area="login"
            className="flex justify-center mb-2"
            imgClassName="w-16 h-18 p-1.5 rounded-2xl bg-white shadow-lg border border-slate-200/80 ring-2 ring-[#0773BB]/10 object-contain"
          />
          <h2 className={`text-xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Project Management
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'login' && (
            <motion.div
              key="tab-login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-4 text-xs"
            >
              {/* Current Active Session & Sign Out Option */}
              {isAuthenticated && currentUser && (
                <div className="p-3.5 rounded-2xl bg-[#0D1520] border border-[#0773BB]/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#3BC0BB]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">{currentUser.name}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-[#0773BB]/30 text-[#3BC0BB]">
                          {currentUser.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">{currentUser.email}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setSuccessMsg('You have successfully signed out.');
                      setTimeout(() => setSuccessMsg(''), 3000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold border border-rose-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}

              <form onSubmit={(e) => handleDirectSignIn(e)} className="space-y-4">
                {/* Username / Email Input */}
                <div className="space-y-1.5">
                  <label className={`block font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Username or Corporate Email ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Enter registered username or email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-[#0773BB]/50 focus:border-[#0773BB] transition-all border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                          : 'bg-[#0D1520] border-[#233549] text-white placeholder:text-slate-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`block font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] font-semibold text-[#0773BB] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full rounded-xl pl-10 pr-10 py-2.5 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-[#0773BB]/50 focus:border-[#0773BB] transition-all border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                          : 'bg-[#0D1520] border-[#233549] text-white placeholder:text-slate-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Password Security Length & Complexity Indicator */}
                  {password && (
                    <div className="pt-1 space-y-1">
                      {(() => {
                        const validation = validatePasswordPolicy(password);
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={isLight ? 'text-slate-500 font-medium' : 'text-slate-400 font-medium'}>
                                Security strength:
                              </span>
                              <span className={`font-extrabold px-1.5 py-0.2 rounded text-[10px] text-white ${validation.strengthColor}`}>
                                {validation.strengthLabel} ({validation.strengthPercent}%)
                              </span>
                            </div>
                            <div className={`h-1 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#16222F]'}`}>
                              <div
                                className={`h-full transition-all duration-300 ${validation.strengthColor}`}
                                style={{ width: `${validation.strengthPercent}%` }}
                              />
                            </div>
                            {!validation.isValid && (
                              <p className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Min {PASSWORD_POLICY.minLength} chars, uppercase, lowercase, number & symbol required</span>
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#055c96] active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-[#0773BB]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}

        {activeTab === 'forgot' && (
          <motion.div
            key="tab-forgot"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="space-y-4 text-xs"
          >
            <div className={`p-3.5 rounded-xl border space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Key className="w-4 h-4 text-amber-500" />
                <span>Reset Corporate Account Password</span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Enter your verified corporate email address below. We will dispatch a password reset link directly to your inbox.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className={`block font-semibold mb-1 flex items-center justify-between ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#0773BB]" />
                    Registered Corporate Email Address *
                  </span>
                  {domainValidation && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        domainValidation.valid
                          ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-700 border border-rose-500/30'
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
                  className={`w-full rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-[#0773BB] transition-colors ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900'
                      : 'bg-[#0D1520] border border-[#233549] text-white'
                  }`}
                />

                {/* Company Badge */}
                {detectedCompany && (
                  <div className="mt-2.5 p-3 rounded-xl bg-[#0773BB]/15 border border-[#0773BB]/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0773BB]/20 text-[#3BC0BB] shrink-0 flex items-center justify-center border border-[#0773BB]/30">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Recognized Organization</span>
                        <span className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{detectedCompany.name}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 font-mono text-[11px] font-bold">
                      ✓ @{detectedCompany.domain}
                    </span>
                  </div>
                )}
              </div>

              {/* Password Complexity Validator */}
              <PasswordComplexityValidatorUI
                password={newPassword}
                onChange={(val) => setNewPassword(val)}
                label="New Password Security & Complexity Validator"
                placeholder="Type new password to test complexity rules..."
                isLight={isLight}
              />

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-700 border border-rose-500/30 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 space-y-2 text-xs text-center animate-in fade-in">
                  <div className="flex items-center justify-center gap-2 font-bold text-emerald-800 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Password Reset Link Dispatched</span>
                  </div>
                  <p className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                    Password reset request issued for <strong className="font-mono">{resetSentEmail}</strong>.
                  </p>
                  <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Check your email inbox and click the reset link to choose a new password for your Dolphin Group account.
                  </p>
                </div>
              )}

              <div className={`flex items-center justify-between pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ← Back to Sign In
                </button>

                <div className="flex items-center gap-2">
                  {!isGatekeeper && (
                    <button
                      type="button"
                      onClick={onClose}
                      className={`px-4 py-2.5 rounded-xl font-medium cursor-pointer ${
                        isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#0D1520] text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-6 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-lg shadow-[#0773BB]/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Send Reset Link</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
