import React, { useState } from 'react';
import {
  Bell,
  Star,
  ChevronDown,
  Bot,
  Zap,
  Share2,
  List,
  Kanban,
  Users,
  Calendar,
  Activity,
  UserCheck,
  Table as TableIcon,
  LayoutDashboard,
  Plus,
  X,
  Search,
  Filter,
  SlidersHorizontal,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  Clock,
  Menu,
  Mail,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HeaderSearchInput } from './HeaderSearchInput';

export const ClickUpHeaderBanners: React.FC<{
  activeViewTab: string;
  setActiveViewTab: (tab: string) => void;
  onOpenCreateTaskModal: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenEmailGateway?: () => void;
  onOpenLoginModal?: () => void;
  isMobile?: boolean;
}> = ({ activeViewTab, setActiveViewTab, onOpenCreateTaskModal, onToggleMobileSidebar, onOpenEmailGateway, onOpenLoginModal, isMobile }) => {
  const { searchQuery, setSearchQuery, selectedProjectId, setSelectedProjectId, selectedListFilter, setSelectedListFilter, projects, theme, toggleTheme, setCommandPaletteOpen, currentUser, requestBrowserNotificationPermission, logout } = useApp();
  
  const [showPurpleBanner, setShowPurpleBanner] = useState(true);

  const viewTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'list', label: 'List', icon: List },
    { id: 'board', label: 'Board', icon: Kanban },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'workload', label: 'Workload', icon: UserCheck },
    { id: 'table', label: 'Table', icon: TableIcon },
  ];

  return (
    <div className="w-full space-y-0 border-b border-[#233549]/60 shrink-0">
      {/* Real-time Notifications Banner (Aqua Green in light mode, Deep Ocean Blue in dark mode) */}
      {showPurpleBanner && (
        <div className={`px-4 py-2 text-xs font-medium flex flex-wrap items-center justify-between gap-2 shadow-sm text-white ${
          theme === 'light'
            ? 'bg-gradient-to-r from-[#0D9488] via-[#0F766E] to-[#115E59]'
            : 'bg-gradient-to-r from-[#0773BB] via-[#0096C7] to-[#0D9488]'
        }`}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-white animate-bounce" />
            <span className="font-semibold">Don't let important updates slip by. Enable real-time notifications.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const res = await requestBrowserNotificationPermission();
                setShowPurpleBanner(false);
              }}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all"
            >
              Enable Alerts
            </button>
            <button
              onClick={() => setShowPurpleBanner(false)}
              className="px-3 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white/90 font-medium text-xs transition-all"
            >
              Snooze
            </button>
            <button
              onClick={() => setShowPurpleBanner(false)}
              className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. ClickUp Breadcrumbs & Workspace Title Bar */}
      <div className={`px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#233549]/40 ${theme === 'light' ? 'bg-white text-slate-800' : 'bg-[#121B26] text-white'}`}>
        {/* Left Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className={`p-1.5 rounded-lg border transition-all mr-1 ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300 hover:text-white'
              }`}
              title="Toggle Sidebar Navigation"
            >
              <Menu className="w-4 h-4 text-[#3BC0BB]" />
            </button>
          )}
          <div className={`w-5 h-5 rounded-md text-white flex items-center justify-center font-bold text-[10px] ${
            theme === 'light' ? 'bg-[#0D9488]' : 'bg-[#0773BB]'
          }`}>
            {projects.find((p) => p.id === selectedProjectId)?.code.slice(0, 1) || 'W'}
          </div>
          <span className="text-slate-400 font-semibold">Workspace</span>
          <span className="text-slate-500">/</span>
          <button
            onClick={() => {
              setSelectedProjectId(null);
              setSelectedListFilter(null);
            }}
            className={`flex items-center gap-1 font-bold text-sm transition-colors ${
              theme === 'light' ? 'hover:text-[#0D9488]' : 'hover:text-[#3BC0BB]'
            }`}
          >
            <span>{projects.find((p) => p.id === selectedProjectId)?.title || 'All Spaces & Projects'}</span>
          </button>
          {selectedListFilter && (
            <>
              <span className="text-slate-500">/</span>
              <span className={`px-2 py-0.5 rounded-md font-extrabold text-xs flex items-center gap-1 shadow-2xs ${
                theme === 'light' ? 'bg-[#0D9488]/15 text-[#0D9488]' : 'bg-[#3BC0BB]/20 text-[#3BC0BB]'
              }`}>
                <span>List: {selectedListFilter}</span>
                <button
                  onClick={() => setSelectedListFilter(null)}
                  className="hover:opacity-80 p-0.5"
                  title="Clear List Filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </>
          )}
        </div>

        {/* Right ClickUp Utility Actions */}
        <div className="flex items-center gap-2.5 text-xs font-medium">
          <HeaderSearchInput />

          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border transition-all ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300 hover:text-white'
            }`}
            title={`Active Theme: ${theme === 'dark' ? 'Dolphin Dark' : 'System Light'}. Click to switch to ${theme === 'dark' ? 'System Light' : 'Dolphin Dark'}.`}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </button>

          <button className="flex items-center gap-1 text-slate-400 hover:text-white">
            <Bot className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span className="hidden sm:inline">Agents</span>
          </button>
          <button className="flex items-center gap-1 text-slate-400 hover:text-white">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span className="hidden sm:inline">Automate</span>
          </button>
          {onOpenEmailGateway && (
            <button
              onClick={onOpenEmailGateway}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-bold text-xs transition-all ${
                theme === 'light'
                  ? 'bg-[#0D9488]/10 hover:bg-[#0D9488]/20 border-[#0D9488]/30 text-[#0D9488]'
                  : 'bg-[#0D9488]/20 hover:bg-[#0D9488]/30 border-[#0D9488]/40 text-[#3BC0BB]'
              }`}
              title="Open Transactional Email Notification Service & Gateway Logs"
            >
              <Mail className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span className="hidden sm:inline">Email Service</span>
            </button>
          )}

          {onOpenLoginModal && (
            <button
              onClick={onOpenLoginModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-bold text-xs transition-all ${
                theme === 'light'
                  ? 'bg-[#0773BB]/10 hover:bg-[#0773BB]/20 border-[#0773BB]/30 text-[#0773BB]'
                  : 'bg-[#0773BB]/20 hover:bg-[#0773BB]/30 border-[#0773BB]/40 text-[#3BC0BB]'
              }`}
              title="Sign In with user created from Admin Panel"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span className="hidden sm:inline">Sign In / Switch User</span>
            </button>
          )}

          <button className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-bold transition-all ${
            theme === 'light'
              ? 'bg-[#0D9488]/10 hover:bg-[#0D9488]/20 border-[#0D9488]/30 text-[#0D9488]'
              : 'bg-[#3BC0BB]/10 hover:bg-[#3BC0BB]/20 border-[#3BC0BB]/30 text-[#3BC0BB]'
          }`}>
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={currentUser?.name || 'User'}
            onClick={onOpenLoginModal}
            className={`w-7 h-7 rounded-full object-cover ring-2 cursor-pointer hover:opacity-80 transition-opacity ${
              theme === 'light' ? 'ring-[#0D9488]' : 'ring-[#3BC0BB]'
            }`}
            title={`${currentUser?.name || 'User'} (${currentUser?.role || 'User'}) — Click to Switch User / Sign In`}
          />

          <button
            onClick={logout}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 font-bold text-xs ${
              theme === 'light'
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
            title="Sign Out / Lock Workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* 4. ClickUp View Navigation Tabs Bar */}
      <div className={`px-4 sm:px-6 py-1.5 flex items-center justify-between gap-2 overflow-x-auto ${theme === 'light' ? 'bg-[#F1F5F9]' : 'bg-[#0D1520]'}`}>
        <div className="flex items-center gap-1 min-w-max">
          {viewTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeViewTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveViewTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? theme === 'light'
                      ? 'bg-[#0D9488] text-white shadow-md'
                      : 'bg-[#0773BB] text-white shadow-md'
                    : theme === 'light'
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'}`}>
            <Plus className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
        </div>

        {/* View Right Control Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          <button className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${
            theme === 'light'
              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'bg-[#16222F] border-[#233549] text-slate-300 hover:text-white'
          }`}>
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span className="hidden sm:inline">Status</span>
          </button>
          <button className={`p-1.5 rounded-lg border ${
            theme === 'light'
              ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
              : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white'
          }`}>
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button className={`p-1.5 rounded-lg border ${
            theme === 'light'
              ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
              : 'bg-[#16222F] border-[#233549] text-slate-400 hover:text-white'
          }`}>
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Primary ClickUp + Task Button */}
          <button
            onClick={onOpenCreateTaskModal}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl hover:opacity-95 text-white font-bold text-xs shadow-lg transition-all ${
              theme === 'light'
                ? 'bg-gradient-to-r from-[#0D9488] to-[#06B6D4] shadow-[#0D9488]/30'
                : 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] shadow-[#0773BB]/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Task</span>
            <ChevronDown className="w-3 h-3 text-white/70 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
