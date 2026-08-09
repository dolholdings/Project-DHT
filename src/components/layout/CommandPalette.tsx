import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  FolderKanban,
  FileText,
  Zap,
  ArrowRight,
  Clock,
  Play,
  Square,
  Plus,
  LayoutDashboard,
  BarChart3,
  Calendar as CalendarIcon,
  Kanban as KanbanIcon,
  GitCommit,
  Bot,
  Users,
  Cpu,
  Shield,
  X,
  Sparkles,
  Command,
  FileSpreadsheet,
  CornerDownLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Project, ProjectFile } from '../../types';

type CategoryFilter = 'all' | 'tasks' | 'projects' | 'files' | 'actions';

interface CommandItem {
  id: string;
  type: 'task' | 'project' | 'file' | 'action' | 'navigation';
  title: string;
  subtitle?: string;
  category: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  shortcut?: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    tasks,
    projects,
    files,
    setActiveTab,
    setSelectedProjectId,
    setSearchQuery,
    timer,
    startTimer,
    stopTimer,
    activeCompany,
    companies,
    setActiveCompany,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Build command items list
  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. Navigation Commands
    const navCommands: CommandItem[] = [
      {
        id: 'nav-dashboard',
        type: 'navigation',
        title: 'Go to Executive Dashboard',
        subtitle: 'Main KPI overview, active projects, live project metrics',
        category: 'Navigation',
        icon: <LayoutDashboard className="w-4 h-4 text-[#3BC0BB]" />,
        badge: 'View',
        badgeColor: 'bg-[#3BC0BB]/20 text-[#3BC0BB]',
        onSelect: () => setActiveTab('dashboard'),
      },
      {
        id: 'nav-projects',
        type: 'navigation',
        title: 'Go to Projects Portfolio',
        subtitle: 'View all DOLPHIN GLOBAL HOLDINGS client & internal projects',
        category: 'Navigation',
        icon: <FolderKanban className="w-4 h-4 text-amber-400" />,
        badge: 'View',
        badgeColor: 'bg-amber-400/20 text-amber-400',
        onSelect: () => setActiveTab('projects'),
      },
      {
        id: 'nav-tasks',
        type: 'navigation',
        title: 'Go to Task Management Matrix',
        subtitle: 'Filter, assign, and organize active deliverables',
        category: 'Navigation',
        icon: <CheckSquare className="w-4 h-4 text-blue-400" />,
        badge: 'View',
        badgeColor: 'bg-blue-400/20 text-blue-400',
        onSelect: () => setActiveTab('tasks'),
      },
      {
        id: 'nav-gantt',
        type: 'navigation',
        title: 'Go to Interactive Gantt Chart',
        subtitle: 'Timeline schedules, critical path, dependencies',
        category: 'Navigation',
        icon: <GitCommit className="w-4 h-4 text-emerald-400" />,
        badge: 'View',
        badgeColor: 'bg-emerald-400/20 text-emerald-400',
        onSelect: () => setActiveTab('gantt'),
      },
      {
        id: 'nav-kanban',
        type: 'navigation',
        title: 'Go to Agile Kanban Board',
        subtitle: 'Drag and drop sprint workflow columns',
        category: 'Navigation',
        icon: <KanbanIcon className="w-4 h-4 text-purple-400" />,
        badge: 'View',
        badgeColor: 'bg-purple-400/20 text-purple-400',
        onSelect: () => setActiveTab('kanban'),
      },
      {
        id: 'nav-files',
        type: 'navigation',
        title: 'Go to Document Vault & AI Extractor',
        subtitle: 'Project specifications, contracts, PDF extractions',
        category: 'Navigation',
        icon: <FileText className="w-4 h-4 text-sky-400" />,
        badge: 'View',
        badgeColor: 'bg-sky-400/20 text-sky-400',
        onSelect: () => setActiveTab('files'),
      },
      {
        id: 'nav-reports',
        type: 'navigation',
        title: 'Go to Business Intelligence & Analytics',
        subtitle: 'Budget burnup, billable hours, team utilization',
        category: 'Navigation',
        icon: <BarChart3 className="w-4 h-4 text-[#3BC0BB]" />,
        badge: 'View',
        badgeColor: 'bg-[#3BC0BB]/20 text-[#3BC0BB]',
        onSelect: () => setActiveTab('reports'),
      },
      {
        id: 'nav-automations',
        type: 'navigation',
        title: 'Go to Workflow Automation Engine',
        subtitle: 'Auto-assign tasks, status triggers, smart webhooks',
        category: 'Navigation',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        badge: 'View',
        badgeColor: 'bg-amber-400/20 text-amber-400',
        onSelect: () => setActiveTab('automations'),
      },
      {
        id: 'nav-architecture',
        type: 'navigation',
        title: 'Go to System Architecture Blueprint',
        subtitle: 'DOLPHIN GLOBAL HOLDINGS enterprise infrastructure & security rules',
        category: 'Navigation',
        icon: <Cpu className="w-4 h-4 text-[#0773BB]" />,
        badge: 'View',
        badgeColor: 'bg-[#0773BB]/20 text-[#0773BB]',
        onSelect: () => setActiveTab('architecture'),
      },
      {
        id: 'nav-settings',
        type: 'navigation',
        title: 'Go to System Settings & Project Exporter',
        subtitle: 'Export source code, backup database, download JSON/CSV data & GoDaddy configuration',
        category: 'Navigation',
        icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
        badge: 'Export',
        badgeColor: 'bg-emerald-400/20 text-emerald-400',
        onSelect: () => setActiveTab('settings'),
      },
      {
        id: 'nav-users',
        type: 'navigation',
        title: 'Go to User Directory & Domain Auth',
        subtitle: 'Manage team access across authorized Dolphin domains',
        category: 'Navigation',
        icon: <Users className="w-4 h-4 text-indigo-400" />,
        badge: 'View',
        badgeColor: 'bg-indigo-400/20 text-indigo-400',
        onSelect: () => setActiveTab('users'),
      },
    ];

    items.push(...navCommands);

    // 2. Quick Actions
    if (timer.active && timer.taskId) {
      items.push({
        id: 'action-stop-timer',
        type: 'action',
        title: `Stop Active Timer (${timer.taskTitle})`,
        subtitle: 'Log elapsed time to project timesheet',
        category: 'Quick Action',
        icon: <Square className="w-4 h-4 text-red-400 fill-current" />,
        badge: 'Timer',
        badgeColor: 'bg-red-500/20 text-red-400',
        onSelect: () => {
          stopTimer('Logged via Command Palette');
        },
      });
    } else {
      const firstTask = tasks[0];
      if (firstTask) {
        items.push({
          id: 'action-start-timer',
          type: 'action',
          title: `Start Stopwatch Timer on "${firstTask.title}"`,
          subtitle: 'Begin tracking live hours for deliverable',
          category: 'Quick Action',
          icon: <Play className="w-4 h-4 text-emerald-400 fill-current" />,
          badge: 'Timer',
          badgeColor: 'bg-emerald-500/20 text-emerald-400',
          onSelect: () => {
            startTimer(firstTask.id, firstTask.title);
          },
        });
      }
    }

    items.push({
      id: 'action-new-task',
      type: 'action',
      title: 'Create New Task / Deliverable',
      subtitle: 'Open task matrix and initiate new assignment',
      category: 'Quick Action',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      badge: 'Action',
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
      onSelect: () => {
        setActiveTab('tasks');
        setSearchQuery('');
      },
    });

    items.push({
      id: 'action-ai-extract',
      type: 'action',
      title: 'Run Gemini AI Spec Document Extractor',
      subtitle: 'Parse PDF/DOC files into automated project tasks',
      category: 'Quick Action',
      icon: <Sparkles className="w-4 h-4 text-[#3BC0BB]" />,
      badge: 'Gemini AI',
      badgeColor: 'bg-[#3BC0BB]/20 text-[#3BC0BB]',
      onSelect: () => {
        setActiveTab('files');
      },
    });

    // Company Domain Switchers
    companies.forEach((comp) => {
      if (comp.id !== activeCompany.id) {
        items.push({
          id: `action-switch-company-${comp.id}`,
          type: 'action',
          title: `Switch Entity to ${comp.name}`,
          subtitle: `Domain @${comp.domain} (${comp.code})`,
          category: 'Organization',
          icon: <Shield className="w-4 h-4 text-cyan-400" />,
          badge: comp.code,
          badgeColor: 'bg-cyan-500/20 text-cyan-300',
          onSelect: () => {
            setActiveCompany(comp);
          },
        });
      }
    });

    // 3. Project Items
    projects.forEach((proj) => {
      items.push({
        id: `proj-${proj.id}`,
        type: 'project',
        title: `${proj.title} (${proj.code})`,
        subtitle: `Company: ${companies.find((c) => c.id === proj.companyId)?.name || 'Dolphin Group'} • Budget: $${proj.budget.toLocaleString()} • Status: ${proj.status}`,
        category: 'Project',
        icon: <FolderKanban className="w-4 h-4 text-amber-400" />,
        badge: proj.status,
        badgeColor:
          proj.status === 'In Progress'
            ? 'bg-blue-500/20 text-blue-400'
            : proj.status === 'Completed'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/20 text-amber-400',
        onSelect: () => {
          setSelectedProjectId(proj.id);
          setActiveTab('projects');
        },
      });
    });

    // 4. Task Items
    tasks.forEach((t) => {
      const proj = projects.find((p) => p.id === t.projectId);
      const projName = proj ? proj.title : 'General';
      items.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: `Project: ${projName} • Assignee: ${t.assigneeIds.length} dev • Est: ${t.estimatedHours}h`,
        category: 'Task',
        icon: <CheckSquare className="w-4 h-4 text-sky-400" />,
        badge: t.priority,
        badgeColor:
          t.priority === 'Urgent'
            ? 'bg-red-500/20 text-red-400'
            : t.priority === 'High'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-slate-500/20 text-slate-300',
        onSelect: () => {
          setSelectedProjectId(t.projectId);
          setActiveTab('tasks');
          setSearchQuery(t.title);
        },
      });
    });

    // 5. File Items
    files.forEach((f) => {
      const proj = projects.find((p) => p.id === f.projectId);
      items.push({
        id: `file-${f.id}`,
        type: 'file',
        title: f.name,
        subtitle: `Size: ${f.size} • Type: ${f.mimeType || 'Document'} • Project: ${proj?.title || 'System'}`,
        category: 'File',
        icon: f.mimeType?.includes('pdf') ? <FileText className="w-4 h-4 text-red-400" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
        badge: (f.mimeType ? f.mimeType.split('/').pop() || 'FILE' : 'FILE').toUpperCase(),
        badgeColor: 'bg-[#3BC0BB]/20 text-[#3BC0BB]',
        onSelect: () => {
          setActiveTab('files');
          setSearchQuery(f.name);
        },
      });
    });

    return items;
  }, [tasks, projects, files, activeCompany, companies, timer, setActiveTab, setSelectedProjectId, setSearchQuery, stopTimer, startTimer, setActiveCompany]);

  // Filter items based on activeCategory and search query
  const filteredItems = useMemo(() => {
    let result = allItems;

    // Filter by Category tab
    if (activeCategory === 'tasks') {
      result = result.filter((item) => item.type === 'task');
    } else if (activeCategory === 'projects') {
      result = result.filter((item) => item.type === 'project');
    } else if (activeCategory === 'files') {
      result = result.filter((item) => item.type === 'file');
    } else if (activeCategory === 'actions') {
      result = result.filter((item) => item.type === 'action' || item.type === 'navigation');
    }

    // Filter by Search text query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const subMatch = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
        const catMatch = item.category.toLowerCase().includes(q);
        const badgeMatch = item.badge ? item.badge.toLowerCase().includes(q) : false;
        return titleMatch || subMatch || catMatch || badgeMatch;
      });
    }

    return result;
  }, [allItems, activeCategory, query]);

  // Handle Keyboard Navigation (Arrow keys, Enter, Esc, Tab)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
        onClose();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElem) {
        selectedElem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070D14]/80 backdrop-blur-md flex items-start justify-center pt-16 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border-t-2 border-t-[#0773BB] ${
          isLight
            ? 'bg-white border border-slate-300 text-slate-900'
            : 'bg-[#16222F] border border-[#233549] text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input & Header */}
        <div className={`p-4 border-b flex items-center gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <Command className="w-5 h-5 text-[#0773BB]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search tasks, projects, files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`flex-1 bg-transparent text-base focus:outline-none ${
              isLight ? 'text-slate-900 placeholder:text-slate-400 font-medium' : 'text-slate-100 placeholder:text-slate-500'
            }`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className={`p-1 rounded-lg ${isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-[#16222F] text-slate-400 hover:text-white'}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-semibold rounded-md shadow-inner ${
            isLight ? 'bg-slate-200 border border-slate-300 text-slate-700' : 'text-slate-400 bg-[#16222F] border border-[#233549]'
          }`}>
            ESC
          </kbd>
        </div>

        {/* Category Filter Pills */}
        <div className={`px-4 py-2 border-b flex items-center gap-2 overflow-x-auto text-xs ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121C28] border-[#233549]'
        }`}>
          {(['all', 'tasks', 'projects', 'files', 'actions'] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-all capitalize whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#0773BB] text-white shadow'
                  : isLight
                  ? 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-300'
                  : 'bg-[#0D1520] text-slate-400 hover:text-slate-200 hover:bg-[#1B2939]'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className={`ml-auto text-[11px] font-mono hidden sm:inline ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Command Items List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? isLight
                        ? 'bg-[#0773BB]/10 border border-[#0773BB] text-slate-900 shadow-sm'
                        : 'bg-[#0773BB]/25 border border-[#0773BB] text-white shadow-lg'
                      : isLight
                      ? 'hover:bg-slate-100 text-slate-800 border border-transparent'
                      : 'hover:bg-[#0D1520] text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg transition-colors ${
                      isLight ? 'bg-slate-100 border border-slate-300 text-[#0773BB]' : 'bg-[#0D1520] border border-[#233549] text-[#3BC0BB]'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            item.badgeColor || (isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300')
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className={`text-xs truncate mt-0.5 font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    <span className={`text-[11px] font-mono hidden md:inline ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      {item.category}
                    </span>
                    <CornerDownLeft className={`w-4 h-4 transition-opacity ${
                      isSelected
                        ? 'opacity-100 text-[#0773BB]'
                        : 'opacity-0 group-hover:opacity-100 text-slate-400'
                    }`} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`py-12 text-center ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Search className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium">No results found for "{query}"</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                Try searching for tasks, projects, file names, or navigation actions.
              </p>
            </div>
          )}
        </div>

        {/* Keyboard Navigation Footer */}
        <div className={`px-4 py-2.5 border-t text-xs flex flex-wrap items-center justify-between gap-3 font-mono ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0D1520] border-[#233549] text-slate-400'
        }`}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#16222F] border border-[#233549] rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-[#16222F] border border-[#233549] rounded text-[10px]">↓</kbd>
              <span className="text-slate-400 ml-1 font-sans">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#16222F] border border-[#233549] rounded text-[10px]">↵</kbd>
              <span className="text-slate-400 ml-1 font-sans">Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#16222F] border border-[#233549] rounded text-[10px]">ESC</kbd>
              <span className="text-slate-400 ml-1 font-sans">Close</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span className="text-[11px]">DOLPHIN GLOBAL HOLDINGS Search & Navigation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
