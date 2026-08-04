import React, { useState } from 'react';
import {
  Building2,
  Bell,
  Search,
  Clock,
  Play,
  Square,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Sparkles,
  Zap,
  Globe,
  Smartphone,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationsDrawer } from '../notifications/NotificationsDrawer';
import { LoginModal } from '../auth/LoginModal';
import { PWAInstallModal } from './PWAInstallModal';

export const Header: React.FC = () => {
  const {
    activeCompany,
    setActiveCompany,
    companies,
    currentUser,
    timer,
    stopTimer,
    notifications,
    searchQuery,
    setSearchQuery,
    setCommandPaletteOpen,
  } = useApp();

  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <header className="h-16 bg-[#16222F]/90 backdrop-blur-md border-b border-[#233549] px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
        {/* Left: Company Selector & Domain Indicator */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] text-white transition-all shadow-inner group"
            >
              <span className="text-xl">{activeCompany.logo}</span>
              <div className="text-left">
                <div className="text-xs font-semibold text-[#3BC0BB] uppercase tracking-wider flex items-center gap-1">
                  <span>{activeCompany.code}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({activeCompany.domain})</span>
                </div>
                <div className="text-sm font-medium text-slate-100 max-w-[180px] sm:max-w-[240px] truncate">
                  {activeCompany.name}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform" />
            </button>

            {showCompanyDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-[#16222F] border border-[#233549] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-[#233549] text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Dolphin Global Holdings Entities</span>
                  <Globe className="w-3.5 h-3.5 text-[#3BC0BB]" />
                </div>
                <div className="py-1 max-h-80 overflow-y-auto space-y-1">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveCompany(c);
                        setShowCompanyDropdown(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 ${
                        activeCompany.id === c.id
                          ? 'bg-[#0773BB]/20 border border-[#0773BB] text-white'
                          : 'hover:bg-[#0D1520] text-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{c.logo}</span>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-[#3BC0BB]">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{c.domain}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3BC0BB]/10 border border-[#3BC0BB]/30 text-[#3BC0BB] text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Authorized Corporate Domain</span>
          </div>
        </div>

        {/* Center: Command Palette Trigger Search Bar & Timer */}
        <div className="flex items-center gap-4 flex-1 max-w-md mx-4">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="relative w-full bg-[#0D1520] hover:bg-[#121C28] border border-[#233549] hover:border-[#0773BB]/60 text-slate-300 text-sm rounded-xl pl-10 pr-12 py-1.5 flex items-center justify-between transition-all group shadow-inner text-left"
          >
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#3BC0BB] transition-colors" />
            <span className="truncate text-slate-400 group-hover:text-slate-200">
              {searchQuery ? `Search: ${searchQuery}` : 'Search tasks, projects, files...'}
            </span>
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-[#16222F] border border-[#233549] rounded-md group-hover:border-[#0773BB] group-hover:text-[#3BC0BB] transition-all">
              Ctrl+K
            </kbd>
          </button>

          {/* Active Stopwatch Timer Widget */}
          {timer.active ? (
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono animate-pulse">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <div className="truncate max-w-[120px]" title={timer.taskTitle || ''}>
                {timer.taskTitle}
              </div>
              <span className="font-bold">{formatSeconds(timer.seconds)}</span>
              <button
                onClick={() => stopTimer('Completed timer log')}
                className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white transition-all"
                title="Stop Timer & Log Time"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D1520] border border-[#233549] text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Timer Idle</span>
            </div>
          )}
        </div>

        {/* Right: Export ZIP, Android App Install, Notifications, User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Download Source Code ZIP Button */}
          <a
            href="/api/download-source"
            download="dolphin_global_project_source.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-200 text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
            title="Download full project source code as .ZIP"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export ZIP</span>
          </a>

          {/* Install Mobile / PWA App Button */}
          <button
            onClick={() => setShowPwaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0773BB]/20 to-[#3BC0BB]/20 hover:from-[#0773BB]/40 hover:to-[#3BC0BB]/40 border border-[#3BC0BB]/40 text-[#3BC0BB] hover:text-white text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
            title="Install Android App & Mobile Client"
          >
            <Smartphone className="w-4 h-4 text-[#3BC0BB]" />
            <span className="hidden lg:inline">Install Android App</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3BC0BB]/20 text-[#3BC0BB] font-mono font-bold hidden xl:inline">
              $0 Host
            </span>
          </button>

          <button
            onClick={() => setShowNotifDrawer(true)}
            className="relative p-2 rounded-xl bg-[#0D1520] border border-[#233549] text-slate-300 hover:text-white hover:bg-[#1A2838] transition-all"
            title="Notifications Center"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0773BB] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#16222F]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Account / Domain Badge */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] transition-all group"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#0773BB]/50"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white flex items-center gap-1">
                <span>{currentUser.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0773BB]/30 text-[#3BC0BB]">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                {currentUser.email}
              </div>
            </div>
            <UserCheck className="w-4 h-4 text-[#3BC0BB] hidden sm:block" />
          </button>
        </div>
      </header>

      {/* Notification Drawer Component */}
      {showNotifDrawer && (
        <NotificationsDrawer onClose={() => setShowNotifDrawer(false)} />
      )}

      {/* Auth / Domain Switcher Modal */}
      {showAuthModal && (
        <LoginModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* PWA Mobile App Installation Modal */}
      {showPwaModal && (
        <PWAInstallModal onClose={() => setShowPwaModal(false)} />
      )}
    </>
  );
};
