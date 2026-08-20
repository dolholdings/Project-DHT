import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  LogOut,
  Sparkles,
  Lock,
  Building2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCompanyByEmail } from '../../config/auth';
import { DolphinLogo } from '../common/DolphinLogo';

interface SessionTimeoutModalProps {
  secondsRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  secondsRemaining,
  onExtendSession,
  onLogout
}) => {
  const { currentUser, firebaseUser } = useApp();

  const userEmail = firebaseUser?.email || currentUser?.email || 'user@dolphingroup.ae';
  const companyInfo = getCompanyByEmail(userEmail);

  // Format MM:SS for display
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      {/* Glow highlight */}
      <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[#16222F] border border-[#233549] rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 animate-in zoom-in-95">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 animate-pulse">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Session Inactivity Warning</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              For corporate data protection and security compliance
            </p>
          </div>
        </div>

        {/* Live Ticking Countdown Box */}
        <div className="p-5 rounded-2xl bg-[#0D1520] border border-[#233549] text-center space-y-3">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Automatic Sign-Out In</span>
          </div>

          <div className="text-5xl font-mono font-black text-amber-400 tracking-wider font-bold drop-shadow-md">
            {formattedTime}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#16222F] h-2 rounded-full overflow-hidden border border-[#233549]">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            You have been inactive. To keep your current session active and avoid losing unsaved workspace changes, please click <strong className="text-white">"Extend Session"</strong> below.
          </p>
        </div>

        {/* User Account Info */}
        <div className="p-3.5 rounded-2xl bg-[#0D1520]/80 border border-[#233549] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0773BB]/20 text-[#3BC0BB] flex items-center justify-center border border-[#0773BB]/30 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">{currentUser.name}</div>
              <div className="text-[11px] font-mono text-slate-400">{userEmail}</div>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
              {companyInfo?.code || 'DOLPHIN'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onLogout}
            className="px-4 py-3 rounded-xl bg-[#0D1520] hover:bg-rose-500/10 border border-[#233549] hover:border-rose-500/30 text-slate-300 hover:text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-2 order-2 sm:order-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Now</span>
          </button>

          <button
            onClick={onExtendSession}
            className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90 text-white font-extrabold text-xs shadow-lg shadow-[#0773BB]/30 transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>Extend Session</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
          <Lock className="w-3 h-3 text-[#3BC0BB]" />
          <span>Dolphin Group Enterprise Security Protocol</span>
        </div>

      </div>
    </div>
  );
};
