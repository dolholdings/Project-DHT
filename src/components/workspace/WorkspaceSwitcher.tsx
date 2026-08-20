import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FolderKanban,
  ChevronDown,
  Search,
  Check,
  Plus,
  Lock,
  Sparkles,
  Building2,
  CheckCircle2,
  Briefcase,
  Layers,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { canCreateSpace } from '../../lib/permissions';

interface WorkspaceSwitcherProps {
  onOpenCreateSpaceModal?: () => void;
  collapsed?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  onOpenCreateSpaceModal,
  collapsed = false,
}) => {
  const {
    projects,
    tasks,
    selectedProjectId,
    setSelectedProjectId,
    currentUser,
    activeCompany,
    theme,
    setActiveTab,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';
  const isAdmin = currentUser?.role === 'Admin';

  // Determine projects accessible to current user
  const accessibleProjects = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return projects;

    return projects.filter((p) => {
      if (p.managerId === currentUser.id) return true;
      if (p.members && p.members.includes(currentUser.id)) return true;
      if (p.memberRoles && p.memberRoles[currentUser.id]) return true;
      return false;
    });
  }, [projects, currentUser, isAdmin]);

  // Count restricted projects (only relevant to non-admins)
  const restrictedProjectsCount = projects.length - accessibleProjects.length;

  // Currently selected project object
  const activeProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return accessibleProjects.find((p) => p.id === selectedProjectId) || null;
  }, [selectedProjectId, accessibleProjects]);

  // Filtered list for search
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return accessibleProjects;
    return accessibleProjects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [accessibleProjects, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSpace = (projectId: string | null) => {
    setSelectedProjectId(projectId);
    setIsOpen(false);
    setActiveTab('tasks');
  };

  return (
    <div className="relative w-full no-print" ref={dropdownRef}>
      {/* Switcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between shadow-sm cursor-pointer ${
          isOpen
            ? isLight
              ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20'
              : 'bg-[#182738] border-teal-500/80 ring-2 ring-teal-500/20'
            : isLight
            ? 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-800'
            : 'bg-[#142232] hover:bg-[#1A2C3F] border-[#223548] text-slate-100'
        }`}
        title="Switch active Project Space"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            activeProject
              ? 'bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 font-black'
              : 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black'
          }`}>
            {activeProject ? (
              <span className="text-[10px] font-mono tracking-tight">{activeProject.code}</span>
            ) : (
              <Layers className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-[#0D9488]' : 'text-teal-400'}`}>
              <span>Space Switcher</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className={`text-xs font-extrabold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {activeProject ? activeProject.title : 'All Accessible Spaces'}
            </div>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isLight ? 'text-slate-500' : 'text-slate-400'} ${isOpen ? 'rotate-180 text-teal-500' : ''}`} />
      </button>

      {/* Switcher Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#121E2B] border-[#223548] text-slate-100'
          }`}
        >
          {/* Search Header */}
          <div className={`p-3 border-b flex items-center gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182738] border-[#223548]'
          }`}>
            <Search className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search project spaces..."
              className={`w-full bg-transparent text-xs font-medium focus:outline-none ${isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-slate-100 placeholder:text-slate-500'}`}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`text-[10px] font-bold ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
              >
                Clear
              </button>
            )}
          </div>

          {/* Accessible Spaces Count & All Spaces Option */}
          <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelectSpace(null)}
              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                selectedProjectId === null
                  ? isLight
                    ? 'bg-teal-50 border-teal-500/40 text-teal-900 font-bold'
                    : 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-bold'
                  : isLight
                  ? 'bg-transparent border-transparent hover:bg-slate-100 text-slate-800'
                  : 'bg-transparent border-transparent hover:bg-slate-800/40 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}>
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>All Accessible Spaces</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>View tasks across all granted spaces</div>
                </div>
              </div>

              {selectedProjectId === null && <Check className={`w-4 h-4 stroke-[2.5] ${isLight ? 'text-[#0D9488]' : 'text-teal-400'}`} />}
            </button>

            <div className={`pt-2 px-2 pb-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Your Allowed Spaces ({accessibleProjects.length})</span>
              {isAdmin && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                  isLight ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  ADMIN ACCESS
                </span>
              )}
            </div>

            {/* Accessible Projects List */}
            {filteredProjects.length === 0 ? (
              <div className={`p-4 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                No matching spaces found for "{searchQuery}"
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = selectedProjectId === p.id;
                const taskCount = tasks.filter((t) => t.projectId === p.id).length;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectSpace(p.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                      isSelected
                        ? isLight
                          ? 'bg-teal-50 border-teal-500/40 text-teal-900 font-bold'
                          : 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-bold'
                        : isLight
                        ? 'bg-transparent border-transparent hover:bg-slate-100 text-slate-800'
                        : 'bg-transparent border-transparent hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                        isLight
                          ? 'bg-teal-100 text-[#0D9488] border border-teal-200'
                          : 'bg-slate-800 text-teal-400 border border-slate-700'
                      }`}>
                        {p.code}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold truncate transition-colors ${
                          isLight
                            ? 'text-slate-800 group-hover:text-[#0D9488]'
                            : 'text-slate-100 group-hover:text-teal-400'
                        }`}>
                          {p.title}
                        </div>
                        <div className={`text-[10px] flex items-center gap-2 truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span>{p.category}</span>
                          <span>•</span>
                          <span>{taskCount} tasks</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className={`w-4 h-4 stroke-[2.5] shrink-0 ml-2 ${isLight ? 'text-[#0D9488]' : 'text-teal-400'}`} />}
                  </button>
                );
              })
            )}

            {/* Restricted Spaces Info Banner for Non-Admins */}
            {!isAdmin && restrictedProjectsCount > 0 && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {restrictedProjectsCount} additional space{restrictedProjectsCount > 1 ? 's' : ''} restricted. Request access from an Admin.
                </span>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className={`p-2.5 border-t flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#182738] border-[#223548]'
          }`}>
            <span className="text-[10px] text-slate-400 font-mono">
              {accessibleProjects.length} Spaces Available
            </span>

            {onOpenCreateSpaceModal && canCreateSpace(currentUser) && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateSpaceModal();
                }}
                className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Space</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
