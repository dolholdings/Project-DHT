import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  Sparkles,
  Users,
  FileText,
  LayoutDashboard,
  Columns,
  CheckSquare,
  MoreHorizontal,
  Plus,
  Inbox,
  MessageSquare,
  Briefcase,
  Video,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Bot,
  Zap,
  FolderKanban,
  ShieldCheck,
  ShieldAlert,
  Building2,
  UserPlus,
  Trash2,
  Settings,
  Mail,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CreateSpaceModal } from '../workspace/CreateSpaceModal';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';

export interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onToggleMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
  onToggleMobile
}) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    tasks,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    deleteProject,
    theme,
    logout,
    logActivity
  } = useApp();

  const isMobile = useIsMobile();
  const [spacesOpen, setSpacesOpen] = useState(true);
  const [isSecondaryCollapsed, setIsSecondaryCollapsed] = useState(false);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';

  const accessibleProjects = React.useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return projects;
    return projects.filter((p) => {
      if (p.managerId === currentUser.id) return true;
      if (p.members && p.members.includes(currentUser.id)) return true;
      if (p.memberRoles && p.memberRoles[currentUser.id]) return true;
      return false;
    });
  }, [projects, currentUser, isAdmin]);

  // Automatically collapse secondary drawer when switching to mobile viewport
  useEffect(() => {
    if (isMobile) {
      setIsSecondaryCollapsed(true);
    }
  }, [isMobile]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const handleProjectSelect = (projectId: string | null) => {
    setSelectedProjectId(projectId);
    setActiveTab('tasks');
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Main Container */}
      <div
        className={`
          flex shrink-0 border-r border-[#233549] transition-all duration-300 z-50
          ${
            isMobile
              ? `fixed top-0 bottom-0 left-0 h-full shadow-2xl ${
                  mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'relative h-screen'
          }
        `}
      >
        {/* 1. FAR LEFT PRIMARY DOCK (Icon Dock: Aqua Green in light mode, Deep Ocean Navy in dark mode) */}
        <aside
          className={`w-14 flex flex-col items-center justify-between py-3 shrink-0 shadow-2xl z-20 transition-colors duration-200 ${
            theme === 'light'
              ? 'bg-gradient-to-b from-[#0D9488] via-[#0F766E] to-[#115E59] text-white'
              : 'bg-gradient-to-b from-[#0F2338] via-[#0C1A2B] to-[#07111D] text-white border-r border-[#1E293B]'
          }`}
        >
          <div className="flex flex-col items-center space-y-4 w-full">
            {/* ClickUp / Dolphin Branding Logo & Mobile Close */}
            <div className="relative flex flex-col items-center gap-1">
              <div
                onClick={() => handleTabClick('dashboard')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg hover:scale-105 transition-transform cursor-pointer ${
                  theme === 'light'
                    ? 'bg-gradient-to-tr from-[#2DD4BF] to-[#0D9488] shadow-[#0D9488]/40'
                    : 'bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] shadow-[#0773BB]/40'
                }`}
                title="Dolphin Home"
              >
                <Zap className="w-5 h-5 fill-current" />
              </div>
              {isMobile && (
                <button
                  onClick={onMobileClose}
                  className="p-1 rounded-lg bg-black/30 hover:bg-black/50 text-white/80"
                  title="Close sidebar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="w-8 h-[1px] bg-white/10 my-1" />

            {/* Primary Navigation Icons */}
            <div className="flex flex-col items-center space-y-2 w-full px-1">
              <button
                onClick={() => handleTabClick('dashboard')}
                className={`p-2.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'dashboard'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md ring-2 ring-white/50'
                      : 'bg-[#00AEA9]/20 text-[#00AEA9] border border-[#00AEA9]/40 shadow-md ring-2 ring-[#00AEA9]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20'
                }`}
                title="Home & Command Center"
              >
                <Home className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('calendar')}
                className={`p-2.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'calendar'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md ring-2 ring-white/50'
                      : 'bg-[#00AEA9]/20 text-[#00AEA9] border border-[#00AEA9]/40 shadow-md ring-2 ring-[#00AEA9]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20'
                }`}
                title="Planner & Calendar"
              >
                <Calendar className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('email')}
                className={`p-2.5 rounded-xl transition-all relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'email'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md ring-2 ring-white/50'
                      : 'bg-[#00AEA9]/20 text-[#00AEA9] border border-[#00AEA9]/40 shadow-md ring-2 ring-[#00AEA9]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20'
                }`}
                title="Company Email Inbox & Task Linking"
              >
                <Mail className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('automations')}
                className={`p-2.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'automations'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md ring-2 ring-white/50'
                      : 'bg-[#00AEA9]/20 text-[#00AEA9] border border-[#00AEA9]/40 shadow-md ring-2 ring-[#00AEA9]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20'
                }`}
                title="AI Automations"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
              </button>

              <button
                onClick={() => handleTabClick('workload')}
                className={`p-2.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'workload'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md ring-2 ring-white/50'
                      : 'bg-[#00AEA9]/20 text-[#00AEA9] border border-[#00AEA9]/40 shadow-md ring-2 ring-[#00AEA9]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20'
                }`}
                title="Teams & Workload"
              >
                <Users className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('files')}
                className={`p-2.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'files'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md ring-2 ring-white/50'
                      : 'bg-[#00AEA9]/20 text-[#00AEA9] border border-[#00AEA9]/40 shadow-md ring-2 ring-[#00AEA9]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20'
                }`}
                title="Docs & File Vault"
              >
                <FileText className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('kanban')}
                className={`p-2.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'kanban'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md ring-2 ring-white/50'
                      : 'bg-[#00AEA9]/20 text-[#00AEA9] border border-[#00AEA9]/40 shadow-md ring-2 ring-[#00AEA9]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20'
                }`}
                title="Whiteboards & Workflow"
              >
                <Columns className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('tasks')}
                className={`p-2.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'tasks'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md ring-2 ring-white/50'
                      : 'bg-[#00AEA9]/20 text-[#00AEA9] border border-[#00AEA9]/40 shadow-md ring-2 ring-[#00AEA9]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20'
                }`}
                title="Forms & Tasks"
              >
                <CheckSquare className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('admin')}
                className={`p-2.5 rounded-xl transition-all relative ${
                  activeTab === 'admin'
                    ? theme === 'light'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                      : 'bg-amber-500/25 text-amber-400 border border-amber-500/40 shadow-md'
                    : 'text-amber-300/80 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
                title="Tenant Administration & Multi-Domain Governance"
              >
                <ShieldAlert className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse border-2 border-slate-900"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  title="More Navigation Options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {showMoreMenu && (
                  <div className="absolute left-14 bottom-0 z-50 w-48 py-2 rounded-xl bg-[#16222F] border border-[#233549] shadow-2xl text-xs space-y-1">
                    <button
                      onClick={() => {
                        handleTabClick('reports');
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#233549] text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#3BC0BB]" />
                      <span>Reports & Analytics</span>
                    </button>
                    <button
                      onClick={() => {
                        handleTabClick('architecture');
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#233549] text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Architecture Spec</span>
                    </button>
                    <button
                      onClick={() => {
                        handleTabClick('automations');
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#233549] text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>ClickUp Automations</span>
                    </button>
                    <button
                      onClick={() => {
                        handleTabClick('settings');
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#233549] text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Workspace Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        handleTabClick('admin');
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#233549] text-amber-300 hover:text-amber-200 flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Admin Governance</span>
                    </button>
                    <button
                      onClick={() => {
                        logActivity('user signed out', currentUser?.email || 'user', 'auth', undefined, undefined, `User ${currentUser?.name} signed out`, 'info');
                        logout();
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center gap-2 font-bold border-t border-[#233549]"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Dock Action & Secondary Drawer Toggle */}
          <div className="flex flex-col items-center space-y-3">
            {/* Secondary Panel Collapse Toggle */}
            <button
              onClick={() => setIsSecondaryCollapsed(!isSecondaryCollapsed)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              title={isSecondaryCollapsed ? "Expand Spaces Panel" : "Collapse Spaces Panel"}
            >
              {isSecondaryCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#3BC0BB]" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-white/80" />
              )}
            </button>

            <button
              onClick={() => handleTabClick('users')}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex flex-col items-center"
              title="Invite Users & Whitelist Domains"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-[9px] font-sans mt-0.5">Invite</span>
            </button>

            <div className="flex flex-col items-center gap-1.5 pt-1">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                alt={currentUser?.name || 'User'}
                className={`w-8 h-8 rounded-full object-cover ring-2 ${
                  theme === 'light' ? 'ring-[#2DD4BF]' : 'ring-[#3BC0BB]'
                }`}
                title={`Signed in as ${currentUser?.name} (${currentUser?.role})`}
              />
              <button
                onClick={() => {
                  logActivity('user signed out', currentUser?.email || 'user', 'auth', undefined, undefined, `User ${currentUser?.name} signed out`, 'info');
                  logout();
                }}
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all cursor-pointer"
                title="Sign Out (Log Out)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* 2. SECONDARY SPACES DRAWER (Collapsible) */}
        {!isSecondaryCollapsed && (
          <aside className={`w-56 sm:w-60 flex flex-col justify-between overflow-y-auto ${theme === 'light' ? 'bg-slate-50 text-slate-800 border-r border-slate-200' : 'bg-[#0D1520] text-slate-200'}`}>
            <div className="p-3 space-y-4">
              {/* Top Dropdown Header */}
              <div className={`flex items-center justify-between px-2 py-1.5 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F]/60 border-[#233549]/60 text-white'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className={`text-xs font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Dolphin Spaces</span>
                </div>
                <button
                  onClick={() => setIsSecondaryCollapsed(true)}
                  className={`p-1 rounded-lg ${theme === 'light' ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800' : 'hover:bg-[#233549] text-slate-400 hover:text-white'}`}
                  title="Collapse secondary spaces drawer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Workspace Switcher */}
              <WorkspaceSwitcher
                onOpenCreateSpaceModal={() => setShowCreateSpaceModal(true)}
              />

              {/* Quick ClickUp Menu Items */}
              <div className="space-y-0.5 text-xs font-medium">
                <button
                  onClick={() => handleTabClick('email')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                    activeTab === 'email'
                      ? 'bg-[#00AEA9] text-white font-extrabold shadow-sm'
                      : theme === 'light'
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-300 hover:text-white hover:bg-[#16222F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Inbox className={`w-4 h-4 ${activeTab === 'email' ? 'text-white' : theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
                    <span>Inbox</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'email' ? 'bg-white/30 text-white' : 'bg-[#7B68EE]/20 text-[#7B68EE]'
                  }`}>
                    3
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick('chat')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${
                    activeTab === 'chat'
                      ? 'bg-[#00AEA9] text-white font-extrabold shadow-sm'
                      : theme === 'light'
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-300 hover:text-white hover:bg-[#16222F]'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 ${activeTab === 'chat' ? 'text-white' : theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span>Assigned Comments</span>
                </button>

                <button
                  onClick={() => handleTabClick('users')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${
                    activeTab === 'users'
                      ? 'bg-[#00AEA9] text-white font-extrabold shadow-sm'
                      : theme === 'light'
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-300 hover:text-white hover:bg-[#16222F]'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 ${activeTab === 'users' ? 'text-white' : theme === 'light' ? 'text-[#0D9488]' : 'text-[#3BC0BB]'}`} />
                  <span>Skills & Access Rules</span>
                </button>

                <button
                  onClick={() => handleTabClick('admin')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                    activeTab === 'admin'
                      ? 'bg-[#00AEA9] text-white font-extrabold shadow-sm'
                      : theme === 'light'
                      ? 'text-amber-800 hover:bg-amber-100/60'
                      : 'text-amber-400/90 hover:text-amber-300 hover:bg-[#16222F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-4 h-4 ${activeTab === 'admin' ? 'text-white' : 'text-amber-500'}`} />
                    <span>Admin Portal</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    activeTab === 'admin'
                      ? 'bg-white/30 text-white'
                      : theme === 'light'
                      ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    PRO
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick('calendar')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${
                    activeTab === 'calendar'
                      ? 'bg-[#00AEA9] text-white font-extrabold shadow-sm'
                      : theme === 'light'
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-300 hover:text-white hover:bg-[#16222F]'
                  }`}
                >
                  <Video className={`w-4 h-4 ${activeTab === 'calendar' ? 'text-white' : theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span>Meetings</span>
                </button>

                <button
                  onClick={() => handleTabClick('tasks')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${
                    activeTab === 'tasks' && selectedProjectId === null
                      ? 'bg-[#00AEA9] text-white font-extrabold shadow-sm'
                      : theme === 'light'
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-300 hover:text-white hover:bg-[#16222F]'
                  }`}
                >
                  <CheckSquare className={`w-4 h-4 ${activeTab === 'tasks' && selectedProjectId === null ? 'text-white' : theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span>My Tasks</span>
                </button>
              </div>

              {/* AI Chats Banner */}
              <div className={`space-y-1 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-[#233549]/50'}`}>
                <div className={`px-2 text-[10px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  AI CHATS
                </div>
                <button
                  onClick={() => handleTabClick('chat')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    theme === 'light' ? 'text-[#0D9488] hover:bg-[#0D9488]/10' : 'text-[#7B68EE] hover:bg-[#7B68EE]/10'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ask, Build, Create</span>
                </button>
              </div>

              {/* Spaces Section Accordion */}
              <div className={`space-y-1 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-[#233549]/50'}`}>
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => setSpacesOpen(!spacesOpen)}
                    className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
                      theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spacesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>Spaces</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowCreateSpaceModal(true)}
                      className={`px-2 py-0.5 rounded text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all ${
                        theme === 'light' ? 'bg-[#0D9488] hover:bg-[#0F766E]' : 'bg-[#0773BB] hover:bg-[#0773BB]/80'
                      }`}
                      title="Create New Space"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Space</span>
                    </button>
                    <button
                      onClick={() => handleTabClick('workspace')}
                      className={`p-0.5 text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded transition-all ${
                        theme === 'light'
                          ? 'bg-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-300'
                          : 'bg-[#233549]/60 text-slate-400 hover:text-white'
                      }`}
                      title="Manage Workspaces & Spaces"
                    >
                      <Settings className={`w-3 h-3 ${theme === 'light' ? 'text-[#0D9488]' : 'text-[#3BC0BB]'}`} />
                    </button>
                  </div>
                </div>

                {spacesOpen && (
                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => handleProjectSelect(null)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedProjectId === null && activeTab === 'tasks'
                          ? theme === 'light'
                            ? 'bg-[#0D9488]/15 text-[#0D9488] font-bold'
                            : 'bg-[#233549] text-white font-bold'
                          : theme === 'light'
                          ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                          : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                      }`}
                    >
                      <Briefcase className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-[#0D9488]' : 'text-[#3BC0BB]'}`} />
                      <span className="truncate">All Spaces & Tasks</span>
                    </button>

                    <div className="pl-1 space-y-0.5">
                      {accessibleProjects.length === 0 ? (
                        <div className={`p-3 text-center space-y-2 border border-dashed rounded-xl my-1 ${
                          theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-[#16222F]/40 border-[#233549]'
                        }`}>
                          <p className={`text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>No granted spaces found.</p>
                          <button
                            onClick={() => setShowCreateSpaceModal(true)}
                            className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                              theme === 'light'
                                ? 'bg-[#0D9488] text-white hover:bg-[#0F766E]'
                                : 'bg-[#0773BB] text-white hover:bg-[#0773BB]/80'
                            }`}
                          >
                            + Create Space
                          </button>
                        </div>
                      ) : (
                        <>
                          {accessibleProjects.map((p) => {
                            const isSelected = selectedProjectId === p.id;
                            const taskCount = tasks.filter((t) => t.projectId === p.id).length;
                            return (
                              <div
                                key={p.id}
                                className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                  isSelected
                                    ? theme === 'light'
                                      ? 'bg-[#0D9488]/15 text-[#0D9488] font-bold border-l-2 border-l-[#0D9488]'
                                      : 'bg-[#3BC0BB]/20 text-[#3BC0BB] font-bold border-l-2 border-l-[#3BC0BB]'
                                    : theme === 'light'
                                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                                    : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                                }`}
                                onClick={() => handleProjectSelect(p.id)}
                              >
                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                  <span className={`text-[10px] font-mono px-1 py-0.2 rounded shrink-0 ${
                                    theme === 'light' ? 'bg-teal-100 text-[#0D9488] font-bold' : 'bg-slate-500/20 text-[#3BC0BB]'
                                  }`}>
                                    {p.code}
                                  </span>
                                  <span className="truncate">{p.title}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  <span className={`text-[10px] font-mono group-hover:hidden ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {taskCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Are you sure you want to delete Space/Project "${p.title}"? All associated tasks will be removed.`)) {
                                        deleteProject(p.id);
                                        if (selectedProjectId === p.id) {
                                          setSelectedProjectId(null);
                                        }
                                      }
                                    }}
                                    className="hidden group-hover:block p-1 rounded hover:bg-rose-500/20 text-rose-500 transition-all"
                                    title="Delete Space / Project"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          <button
                            onClick={() => setShowCreateSpaceModal(true)}
                            className={`w-full mt-2 py-1.5 px-2.5 rounded-lg text-xs font-bold border border-dashed flex items-center justify-center gap-1.5 transition-all ${
                              theme === 'light'
                                ? 'border-slate-300 text-[#0D9488] hover:bg-[#0D9488]/10'
                                : 'border-[#233549] text-[#3BC0BB] hover:bg-[#3BC0BB]/10'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add New Space</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Info Box */}
            <div className={`p-3 border-t text-xs ${
              theme === 'light'
                ? 'border-slate-200 bg-slate-100 text-slate-700'
                : 'border-[#233549]/60 bg-[#16222F]/40 text-slate-200'
            }`}>
              <div className={`flex items-center justify-between font-mono text-[10px] font-bold ${
                theme === 'light' ? 'text-[#0D9488]' : 'text-[#3BC0BB]'
              }`}>
                <span>Dolphin Cloud</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Global Space Creation Modal */}
      <CreateSpaceModal
        isOpen={showCreateSpaceModal}
        onClose={() => setShowCreateSpaceModal(false)}
      />
    </>
  );
};
