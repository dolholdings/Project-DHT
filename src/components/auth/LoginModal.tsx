import React, { useState } from 'react';
import { Lock, AlertTriangle, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APPROVED_DOMAINS } from '../../types';

export const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setCurrentUser, users, validateDomain, companies, inviteUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const domainValidation = validateDomain(email);
    if (!domainValidation.valid) {
      setErrorMsg(domainValidation.error || 'Access Denied: Email domain is not authorized.');
      return;
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setSuccessMsg(`Welcome back, ${matchedUser.name}! Domain verified.`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      // Auto-provision user if domain is whitelisted or registered
      const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const matchedComp = domainValidation.registeredCompany || companies.find((c) => c.domain.toLowerCase() === domainValidation.domain) || companies[0];

      const res = inviteUser(nameFromEmail, email, 'Team Member', matchedComp.isExternal ? 'External Team' : 'Engineering', matchedComp.id);
      
      if (res.success) {
        setSuccessMsg(`Verified domain @${domainValidation.domain}! Created workspace account for ${nameFromEmail}.`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg('No corporate user found with this email in Dolphin DB.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#0773BB]/20 border border-[#0773BB]/40 flex items-center justify-center text-[#3BC0BB]">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">DOLPHIN GLOBAL HOLDINGS</h2>
          <p className="text-xs text-slate-400">
            Enter your corporate email address to authenticate via domain SSO.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Corporate Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g., suhail@dolrad.ae"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#0773BB]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#0773BB]"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center">
              {successMsg}
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Demo Login:</span>
            <div className="flex flex-wrap gap-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setEmail(u.email)}
                  className="px-2 py-1 rounded bg-[#16222F] hover:bg-[#233549] text-slate-300 text-[10px] font-mono border border-[#233549]"
                >
                  {u.email}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-xs shadow-lg"
            >
              Verify & Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
