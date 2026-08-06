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
  PanelLeftOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useIsMobile } from '../../hooks/useIsMobile';

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
    theme
  } = useApp();

  const isMobile = useIsMobile();
  const [spacesOpen, setSpacesOpen] = useState(true);
  const [isSecondaryCollapsed, setIsSecondaryCollapsed] = useState(false);

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
                title="Dolphin ClickUp Home"
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
                className={`p-2.5 rounded-xl transition-all ${
                  activeTab === 'dashboard'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md'
                      : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Home & Command Center"
              >
                <Home className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('calendar')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTab === 'calendar'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md'
                      : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Planner & Calendar"
              >
                <Calendar className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('email')}
                className={`p-2.5 rounded-xl transition-all relative ${
                  activeTab === 'email'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md'
                      : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Company Email Inbox & Task Linking"
              >
                <Mail className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('automations')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTab === 'automations'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md'
                      : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="ClickUp AI & Automations"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
              </button>

              <button
                onClick={() => handleTabClick('workload')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTab === 'workload'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md'
                      : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Teams & Workload"
              >
                <Users className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('files')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTab === 'files'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md'
                      : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Docs & File Vault"
              >
                <FileText className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('kanban')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTab === 'kanban'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md'
                      : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Whiteboards & Workflow"
              >
                <Columns className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabClick('tasks')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTab === 'tasks'
                    ? theme === 'light'
                      ? 'bg-white/25 text-white shadow-md'
                      : 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
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

              <button
                onClick={() => handleTabClick('reports')}
                className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
                title="More Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
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

            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={currentUser?.name || 'User'}
              className={`w-8 h-8 rounded-full object-cover ring-2 ${
                theme === 'light' ? 'ring-[#2DD4BF]' : 'ring-[#3BC0BB]'
              }`}
            />
          </div>
        </aside>

        {/* 2. SECONDARY SPACES DRAWER (Collapsible) */}
        {!isSecondaryCollapsed && (
          <aside className={`w-56 sm:w-60 flex flex-col justify-between overflow-y-auto ${theme === 'light' ? 'bg-slate-50 text-slate-800 border-r border-slate-200' : 'bg-[#0D1520] text-slate-200'}`}>
            <div className="p-3 space-y-4">
              {/* Top Dropdown Header */}
              <div className={`flex items-center justify-between px-2 py-1.5 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F]/60 border-[#233549]/60'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className={`text-xs font-bold tracking-tight ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Home</span>
                </div>
                <button
                  onClick={() => setIsSecondaryCollapsed(true)}
                  className={`p-1 rounded-lg ${theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-[#233549] text-slate-400'}`}
                  title="Collapse secondary spaces drawer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick ClickUp Menu Items */}
              <div className="space-y-0.5 text-xs font-medium">
                <button
                  onClick={() => handleTabClick('email')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                    activeTab === 'email'
                      ? theme === 'light'
                        ? 'bg-[#0D9488]/15 text-[#0D9488] font-bold'
                        : 'bg-[#3BC0BB]/20 text-[#3BC0BB] font-bold'
                      : theme === 'light'
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-slate-400" />
                    <span>Inbox</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#7B68EE]/20 text-[#7B68EE] font-bold">
                    3
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick('chat')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-white hover:bg-[#16222F]'}`}
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Assigned Comments</span>
                </button>

                <button
                  onClick={() => handleTabClick('users')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-white hover:bg-[#16222F]'}`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Skills & Access Rules</span>
                </button>

                <button
                  onClick={() => handleTabClick('admin')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                    activeTab === 'admin'
                      ? theme === 'light'
                        ? 'bg-amber-100 text-amber-900 font-bold'
                        : 'bg-amber-500/20 text-amber-300 font-bold'
                      : theme === 'light'
                        ? 'text-amber-800 hover:bg-amber-100/60'
                        : 'text-amber-400/90 hover:text-amber-300 hover:bg-[#16222F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Admin Portal</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                    PRO
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick('calendar')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-white hover:bg-[#16222F]'}`}
                >
                  <Video className="w-4 h-4 text-slate-400" />
                  <span>Meetings</span>
                </button>

                <button
                  onClick={() => handleTabClick('tasks')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-white hover:bg-[#16222F]'}`}
                >
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                  <span>My Tasks</span>
                </button>
              </div>

              {/* AI Chats Banner */}
              <div className="space-y-1 pt-2 border-t border-[#233549]/50">
                <div className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  AI CHATS
                </div>
                <button
                  onClick={() => handleTabClick('chat')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#7B68EE] hover:bg-[#7B68EE]/10 font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ask, Build, Create</span>
                </button>
              </div>

              {/* Spaces Section Accordion */}
              <div className="space-y-1 pt-2 border-t border-[#233549]/50">
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => setSpacesOpen(!spacesOpen)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-white"
                  >
                    {spacesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>Spaces</span>
                  </button>
                  <button
                    onClick={() => handleTabClick('workspace')}
                    className="text-slate-400 hover:text-white p-0.5 text-[10px] font-bold flex items-center gap-1 bg-[#233549]/60 px-1.5 py-0.5 rounded"
                    title="Manage Workspaces & Spaces"
                  >
                    <Settings className="w-3 h-3 text-[#3BC0BB]" />
                    <span>Manager</span>
                  </button>
                </div>

                {spacesOpen && (
                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => handleProjectSelect(null)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedProjectId === null && activeTab === 'tasks'
                          ? 'bg-[#233549] text-white font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5 text-[#3BC0BB]" />
                      <span className="truncate">All Spaces & Tasks</span>
                    </button>

                    <div className="pl-1 space-y-0.5">
                      {projects.length === 0 ? (
                        <div className="p-3 text-center space-y-2 border border-dashed border-[#233549] rounded-xl my-1 bg-[#16222F]/40">
                          <p className="text-[11px] text-slate-400">No projects or spaces yet.</p>
                          <button
                            onClick={() => handleTabClick('projects')}
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
                        projects.map((p) => {
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
                                  : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                              }`}
                              onClick={() => handleProjectSelect(p.id)}
                            >
                              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-500/20 text-[#3BC0BB] shrink-0">
                                  {p.code}
                                </span>
                                <span className="truncate">{p.title}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <span className="text-[10px] text-slate-500 font-mono group-hover:hidden">
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
                                  className="hidden group-hover:block p-1 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
                                  title="Delete Space / Project"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Info Box */}
            <div className="p-3 border-t border-[#233549]/60 bg-[#16222F]/40 text-xs">
              <div className="flex items-center justify-between text-[#3BC0BB] font-mono text-[10px] font-bold">
                <span>Dolphin ClickUp Cloud</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </>
  );
};
