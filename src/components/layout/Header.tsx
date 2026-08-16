import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Bell,
  Search,
  Clock,
  Square,
  ShieldCheck,
  UserCheck,
  Smartphone,
  Download,
  Sun,
  Moon,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  Activity,
  LogOut,
  ChevronDown,
  User,
  Shield,
  KeyRound
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationsDrawer } from '../notifications/NotificationsDrawer';
import { ActivityLogDrawer } from '../activity/ActivityLogDrawer';
import { LoginModal } from '../auth/LoginModal';
import { PWAInstallModal } from './PWAInstallModal';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { HeaderSearchInput } from './HeaderSearchInput';
import { GlobalTimeTrackerWidget } from './GlobalTimeTrackerWidget';
import { DolphinTooltip } from '../common/DolphinTooltip';

export const Header: React.FC = () => {
  const {
    currentUser,
    timer,
    stopTimer,
    notifications,
    activityLogs,
    isActivityDrawerOpen,
    setIsActivityDrawerOpen,
    searchQuery,
    setSearchQuery,
    setCommandPaletteOpen,
    theme,
    toggleTheme,
    logout,
    logActivity
  } = useApp();

  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    setShowUserMenu(false);
  };

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <header className="h-16 bg-[#16222F]/90 backdrop-blur-md border-b border-[#233549] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
        {/* Left: ClickUp Style Workspace Title & Email Access Control Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#0D1520] border border-[#233549]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#7B68EE] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              DP
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Dolphin Project Management</span>
              </div>
              <div className="text-[10px] text-[#3BC0BB] font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#3BC0BB]" />
                <span>Email Domain Controlled</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAuthModal(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3BC0BB]/10 border border-[#3BC0BB]/30 text-[#3BC0BB] hover:bg-[#3BC0BB]/20 text-xs font-mono transition-all"
            title="Manage Authorized Email Domains & Accounts"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Email Access Rules</span>
          </button>
        </div>

        {/* Center: Global Search Input & Timer */}
        <div className="flex items-center gap-3 flex-1 max-w-md mx-4">
          <HeaderSearchInput />

          {/* Active Global Time Tracking Widget */}
          <GlobalTimeTrackerWidget />
        </div>

        {/* Right: Theme Toggle, Export ZIP, Android App Install, Notifications, User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Global Theme Switcher Toggle (Dolphin Dark / System Light) */}
          <DolphinTooltip
            title="Theme Switcher"
            badge={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            content={`Switch active application theme to ${theme === 'dark' ? 'System Light' : 'Dolphin Dark'}.`}
            position="bottom"
            variant="glass"
          >
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] text-slate-300 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 text-xs font-semibold"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="hidden xl:inline text-slate-300">Dolphin Dark</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="hidden xl:inline text-slate-700 font-bold">System Light</span>
                </>
              )}
            </button>
          </DolphinTooltip>

          {/* Import Excel / MS-Project Button */}
          <DolphinTooltip
            title="Import Excel / MS-Project"
            badge="XLSX / XML / MPP"
            content="Import tasks, timelines, dependencies, and schedules directly from Excel or MS-Project files."
            position="bottom"
            variant="glass"
          >
            <button
              onClick={() => setShowExcelModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 hover:text-white text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">Import Excel / MS-Project</span>
            </button>
          </DolphinTooltip>

          {/* Download Source Code ZIP Button */}
          <DolphinTooltip
            title="Export Source Code"
            badge="Full Stack"
            content="Download complete application source code archive (.ZIP) for local deployment."
            position="bottom"
            variant="glass"
          >
            <a
              href="/api/download-source"
              download="dolphin_global_project_source.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-200 text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export ZIP</span>
            </a>
          </DolphinTooltip>

          {/* Install Mobile / PWA App Button */}
          <DolphinTooltip
            title="Install Android App"
            badge="PWA / APK"
            content="Install the Dolphin Enterprise PWA client on Android or Desktop devices for offline access."
            position="bottom"
            variant="accent"
          >
            <button
              onClick={() => setShowPwaModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0773BB]/20 to-[#3BC0BB]/20 hover:from-[#0773BB]/40 hover:to-[#3BC0BB]/40 border border-[#3BC0BB]/40 text-[#3BC0BB] hover:text-white text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-[#3BC0BB]" />
              <span className="hidden lg:inline">Install Android App</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3BC0BB]/20 text-[#3BC0BB] font-mono font-bold hidden xl:inline">
                $0 Host
              </span>
            </button>
          </DolphinTooltip>

          {/* Real-Time Activity Stream Drawer Toggle */}
          <DolphinTooltip
            title="Live Activity Stream"
            badge="Real-time"
            content="View live activity logs, task transition events, and system notifications."
            position="bottom"
            variant="glass"
          >
            <button
              onClick={() => setIsActivityDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-[#0D1520] border border-[#233549] text-slate-300 hover:text-white hover:bg-[#1A2838] transition-all group"
            >
              <Activity className="w-5 h-5 text-[#3BC0BB] group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </button>
          </DolphinTooltip>

          <DolphinTooltip
            title="Notifications"
            badge={`${unreadCount} New`}
            content="Open notification center to view task assignments and email updates."
            position="bottom"
            variant="glass"
          >
            <button
              onClick={() => setShowNotifDrawer(true)}
              className="relative p-2 rounded-xl bg-[#0D1520] border border-[#233549] text-slate-300 hover:text-white hover:bg-[#1A2838] transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0773BB] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#16222F]">
                  {unreadCount}
                </span>
              )}
            </button>
          </DolphinTooltip>

          {/* User Account / Domain Badge & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] transition-all group cursor-pointer"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                alt={currentUser?.name || 'User'}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#0773BB]/50"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>{currentUser?.name || 'User'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0773BB]/30 text-[#3BC0BB]">
                    {currentUser?.role || 'Member'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                  {currentUser?.email || ''}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform" />
            </button>

            {/* User Account Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl bg-[#16222F] border border-[#233549] shadow-2xl z-50 text-xs space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0D1520] border border-[#233549]">
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={currentUser?.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#0773BB]"
                  />
                  <div className="overflow-hidden">
                    <p className="font-extrabold text-white text-sm truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-[#3BC0BB] font-mono truncate">{currentUser?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0773BB]/30 text-[#3BC0BB]">
                        {currentUser?.role || 'Member'}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">{currentUser?.department}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-[#233549]">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowAuthModal(true);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#0D1520] text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <ShieldCheck className="w-4 h-4 text-[#3BC0BB]" />
                      <span>Switch Account / Domain Rules</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#3BC0BB]/20 text-[#3BC0BB] font-mono">
                      Domain
                    </span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 flex items-center justify-between transition-colors font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out (Log Out)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                      Exit
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer Component */}
      {showNotifDrawer && (
        <NotificationsDrawer onClose={() => setShowNotifDrawer(false)} />
      )}

      {/* Real-Time Activity Log Drawer Component */}
      {isActivityDrawerOpen && (
        <ActivityLogDrawer onClose={() => setIsActivityDrawerOpen(false)} />
      )}

      {/* Auth / Domain Switcher Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <LoginModal key="header-auth-modal" onClose={() => setShowAuthModal(false)} />
        )}
      </AnimatePresence>

      {/* PWA Mobile App Installation Modal */}
      {showPwaModal && (
        <PWAInstallModal onClose={() => setShowPwaModal(false)} />
      )}

      {/* Excel / CSV Data Import Modal */}
      {showExcelModal && (
        <ExcelImportModal onClose={() => setShowExcelModal(false)} />
      )}
    </>
  );
};
