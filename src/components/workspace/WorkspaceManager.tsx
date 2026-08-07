import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Settings,
  Trash2,
  Edit3,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Building,
  ShieldCheck,
  Zap,
  Sliders,
  Check,
  X,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Download,
  AlertTriangle,
  Tag,
  BarChart2,
  ArrowUpRight,
  Activity,
  ExternalLink,
  LayoutDashboard,
  Briefcase,
  Shield,
  ArrowRight,
  ListTodo,
  PieChart,
  Globe,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';

export const WorkspaceManager: React.FC = () => {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    companies,
    addCompany,
    updateCompany,
    deleteCompany,
    activeCompany,
    setActiveCompany,
    tasks,
    users,
    activityLogs,
    setActiveTab,
    setSelectedProjectId,
    theme
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'dashboard' | 'grid' | 'table' | 'hierarchy'>('dashboard');
  const [activityFilter, setActivityFilter] = useState<string>('all');

  // Modal States
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [configuringProject, setConfiguringProject] = useState<Project | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);
  const [activeConfigTab, setActiveConfigTab] = useState<'general' | 'clickapps' | 'statuses' | 'members'>('general');

  // Create Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Project['category']>('Industrial Manufacturing');
  const [newBudget, setNewBudget] = useState(250000);
  const [newStartDate, setNewStartDate] = useState('2026-08-01');
  const [newDueDate, setNewDueDate] = useState('2026-12-31');
  const [newManagerId, setNewManagerId] = useState(users[0]?.id || 'usr_1');
  const [newCompanyId, setNewCompanyId] = useState(activeCompany.id || 'comp_1');

  // Create Workspace / Company Form State
  const [newCompName, setNewCompName] = useState('');
  const [newCompCode, setNewCompCode] = useState('');
  const [newCompCategory, setNewCompCategory] = useState('Technology');
  const [newCompExternal, setNewCompExternal] = useState(false);

  // ClickApps State for Space Configuration
  const [clickApps, setClickApps] = useState({
    timeTracking: true,
    multipleAssignees: true,
    subtaskDependencies: true,
    priorityScores: true,
    customStatuses: true,
    publicSharing: false,
    aiDailyBriefs: true
  });

  // Filtered Projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Workspace Stats
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const inProgressProjects = projects.filter((p) => p.status === 'In Progress').length;

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const generatedCode = newCode.trim()
      ? newCode.trim().toUpperCase()
      : newTitle.trim().slice(0, 4).toUpperCase() || 'SPC';

    const createdProj = addProject({
      title: newTitle.trim(),
      code: generatedCode,
      companyId: newCompanyId || activeCompany.id,
      description: newDesc.trim() || 'Strategic workspace space',
      status: 'Planning',
      managerId: newManagerId || users[0]?.id || 'usr_1',
      startDate: newStartDate || new Date().toISOString().split('T')[0],
      dueDate: newDueDate || '2026-12-31',
      budget: Number(newBudget) || 100000,
      category: newCategory,
      members: [newManagerId || users[0]?.id || 'usr_1']
    });

    if (createdProj) {
      setSelectedProjectId(createdProj.id);
    }

    setShowCreateSpaceModal(false);
    setNewTitle('');
    setNewCode('');
    setNewDesc('');
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    const generatedCode = newCompCode.trim()
      ? newCompCode.trim().toUpperCase()
      : newCompName.trim().slice(0, 4).toUpperCase() || 'ORG';

    const domain = `${generatedCode.toLowerCase()}.dolphingroup.ae`;

    const created = addCompany({
      name: newCompName.trim(),
      code: generatedCode,
      domain: domain,
      logo: '🏢',
      description: `${newCompName.trim()} workspace organization`,
      type: newCompExternal ? 'External Partner' : 'Internal Dolphin Entity',
      isExternal: newCompExternal
    });

    if (created) {
      setActiveCompany(created);
    }
    setShowCreateCompanyModal(false);
    setNewCompName('');
    setNewCompCode('');
  };

  const handleSaveProjectConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringProject) return;

    updateProject(configuringProject.id, {
      title: configuringProject.title,
      code: configuringProject.code.toUpperCase(),
      category: configuringProject.category,
      status: configuringProject.status,
      budget: Number(configuringProject.budget),
      managerId: configuringProject.managerId,
      members: configuringProject.members
    });

    setConfiguringProject(null);
  };

  const exportWorkspaceConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      company: activeCompany,
      projects: projects,
      clickAppsSettings: clickApps,
      exportedAt: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `workspace_config_${activeCompany.code.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in">
      {/* 1. TOP HEADER BANNER */}
      <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
        theme === 'light'
          ? 'bg-gradient-to-r from-white via-slate-50 to-teal-50/40 border-slate-200'
          : 'bg-gradient-to-r from-[#16222F] via-[#1A2838] to-[#0D1520] border-[#233549]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 ${theme === 'light' ? 'text-[#0D9488]' : 'text-[#3BC0BB]'}`}>
              Workspace & Spaces Manager
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              Configure, rename, and manage projects (spaces), custom ClickApps, status workflows, and department access control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowCreateSpaceModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white font-bold text-xs shadow-md shadow-[#0773BB]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Space / Project</span>
            </button>

            <button
              onClick={() => setShowCreateCompanyModal(true)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-[#0D1520] hover:bg-[#16222F] border-[#233549] text-slate-200'
              }`}
            >
              <Building className="w-4 h-4 text-[#3BC0BB]" />
              <span>+ New Workspace</span>
            </button>

            <button
              onClick={exportWorkspaceConfig}
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-[#0D1520] hover:bg-[#16222F] border-[#233549] text-slate-300'
              }`}
              title="Export Workspace Configuration JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Spaces (Projects)</span>
            <FolderKanban className="w-4 h-4 text-[#0773BB]" />
          </div>
          <div className={`text-2xl font-black mt-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            {projects.length}
          </div>
          <p className="text-[11px] text-emerald-500 font-medium mt-1">
            {inProgressProjects} Active in Execution
          </p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Allocated Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-black mt-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            ${(totalBudget / 1000000).toFixed(2)}M
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Across {companies.length} Workspace entities
          </p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Workspace Task Load</span>
            <Layers className="w-4 h-4 text-[#3BC0BB]" />
          </div>
          <div className={`text-2xl font-black mt-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            {completedTasks} / {totalTasks} Done
          </div>
          <div className="w-full bg-slate-700/30 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-[#3BC0BB] h-1.5 rounded-full transition-all"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Assigned Team Members</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-2xl font-black mt-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            {users.length} Users
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Cross-functional roles & access
          </p>
        </div>
      </div>

      {/* 3. TOOLBAR CONTROLS (SEARCH, FILTERS, VIEW MODE) */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
      }`}>
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search space title, project code, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border focus:outline-none transition-all ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0D9488]'
                  : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#3BC0BB]'
              }`}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border ${
              theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Departments</option>
            <option value="Industrial Manufacturing">Industrial Manufacturing</option>
            <option value="HVAC Systems">HVAC Systems</option>
            <option value="ERP & Enterprise Software">ERP & Software</option>
            <option value="Energy & Utility Infrastructure">Energy & Utilities</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border ${
              theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0D1520] rounded-xl border border-[#233549]">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'dashboard' ? 'bg-[#0773BB] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Landing Dashboard</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid' ? 'bg-[#0773BB] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cards Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table' ? 'bg-[#0773BB] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Data Table
          </button>
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'hierarchy' ? 'bg-[#0773BB] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ClickUp Hierarchy
          </button>
        </div>
      </div>

      {/* 4. MAIN SPACES CONTENT LISTING */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* 1. SELECTED WORKSPACE HERO & ENTITY SELECTOR */}
          <div className={`p-5 rounded-2xl border transition-all ${
            theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#233549]/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0773BB] via-[#3BC0BB] to-[#16222F] flex items-center justify-center text-white text-xl shadow-lg">
                  {activeCompany.logo || '🏢'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40">
                      @{activeCompany.code}
                    </span>
                    <h2 className={`text-xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      {activeCompany.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{activeCompany.type || 'Internal Entity'}</span>
                    <span>•</span>
                    <span className="font-mono text-[#3BC0BB]">{activeCompany.domain}</span>
                  </p>
                </div>
              </div>

              {/* Workspace Quick Switcher Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Switch Workspace Entity:</span>
                {companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCompany(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      activeCompany.id === c.id
                        ? 'bg-[#0773BB] text-white border-[#0773BB] shadow-md'
                        : 'bg-[#0D1520] text-slate-400 hover:text-white border-[#233549] hover:border-[#3BC0BB]'
                    }`}
                  >
                    <span>{c.logo || '🏢'}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Workspace Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
              {(() => {
                const wsProjects = projects.filter((p) => p.companyId === activeCompany.id);
                const wsTasks = tasks.filter((t) => wsProjects.some((p) => p.id === t.projectId));
                const completedWsTasks = wsTasks.filter((t) => t.status === 'Done').length;
                const wsBudget = wsProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
                const taskPct = wsTasks.length > 0 ? Math.round((completedWsTasks / wsTasks.length) * 100) : 0;

                return (
                  <>
                    <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549]">
                      <span className="text-slate-400 font-semibold block text-[11px]">Active Spaces</span>
                      <span className="text-lg font-black text-white">{wsProjects.length} Spaces</span>
                      <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono">
                        {wsProjects.filter((p) => p.status === 'In Progress').length} in progress
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549]">
                      <span className="text-slate-400 font-semibold block text-[11px]">Task Execution</span>
                      <span className="text-lg font-black text-[#3BC0BB]">{completedWsTasks} / {wsTasks.length} Done ({taskPct}%)</span>
                      <div className="w-full bg-slate-700/40 rounded-full h-1 mt-1.5 overflow-hidden">
                        <div className="bg-[#3BC0BB] h-1 rounded-full" style={{ width: `${taskPct}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549]">
                      <span className="text-slate-400 font-semibold block text-[11px]">Allocated Budget</span>
                      <span className="text-lg font-black text-emerald-400">${wsBudget.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Across {wsProjects.length} spaces</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549]">
                      <span className="text-slate-400 font-semibold block text-[11px]">Workspace Users</span>
                      <span className="text-lg font-black text-purple-400">{users.length} Active Members</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Role-based access</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* 2. SUMMARY OF ACTIVE PROJECTS (SPACES) */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#0773BB]" />
                <h3 className={`text-base font-extrabold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Active Spaces Summary for {activeCompany.name}
                </h3>
              </div>

              <button
                onClick={() => setShowCreateSpaceModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Space</span>
              </button>
            </div>

            {(() => {
              const wsProjects = filteredProjects.filter((p) => p.companyId === activeCompany.id);
              const displayList = wsProjects.length > 0 ? wsProjects : filteredProjects;

              if (displayList.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-[#233549] bg-[#0D1520]/50 space-y-3">
                    <FolderKanban className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">No active spaces found in {activeCompany.name}.</p>
                    <button
                      onClick={() => setShowCreateSpaceModal(true)}
                      className="px-4 py-2 rounded-xl bg-[#0773BB] text-white font-bold text-xs"
                    >
                      + Create First Space in {activeCompany.name}
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayList.map((project) => {
                    const spaceTasks = tasks.filter((t) => t.projectId === project.id);
                    const doneCount = spaceTasks.filter((t) => t.status === 'Done').length;
                    const progress = spaceTasks.length > 0 ? Math.round((doneCount / spaceTasks.length) * 100) : 0;
                    const manager = users.find((u) => u.id === project.managerId);

                    return (
                      <div
                        key={project.id}
                        className="p-4 rounded-xl border border-[#233549] bg-[#0D1520] hover:border-[#3BC0BB] transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-[#0773BB]/30 text-[#3BC0BB] font-mono text-xs font-bold border border-[#0773BB]/40">
                                {project.code}
                              </span>
                              <h4 className="font-bold text-white text-sm line-clamp-1">{project.title}</h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              project.status === 'In Progress' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {project.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">{project.description}</p>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-400 text-[11px]">
                              <span>Progress ({doneCount}/{spaceTasks.length} Tasks)</span>
                              <span className="font-mono text-[#3BC0BB] font-bold">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-[#3BC0BB] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#233549]/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={manager?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={manager?.name}
                              className="w-5 h-5 rounded-full object-cover border border-[#3BC0BB]"
                            />
                            <span className="text-slate-300 text-[11px] font-medium">{manager?.name?.split(' ')[0]}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedProjectId(project.id);
                                setActiveTab('tasks');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold text-[11px] flex items-center gap-1"
                            >
                              <span>Open</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setConfiguringProject(project)}
                              className="p-1 rounded-lg bg-[#16222F] text-slate-300 hover:text-white border border-[#233549]"
                              title="Configure Space Settings"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 3. RECENT TEAM ACTIVITY & QUICK ACCESS GRID (2 COLUMNS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent Team Activity */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between border-b border-[#233549]/40 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#3BC0BB]" />
                  <h3 className={`text-base font-extrabold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Recent Team Activity
                  </h3>
                </div>

                <div className="flex items-center gap-1 bg-[#0D1520] p-1 rounded-lg border border-[#233549] text-[10px] font-bold">
                  <button
                    onClick={() => setActivityFilter('all')}
                    className={`px-2 py-0.5 rounded ${activityFilter === 'all' ? 'bg-[#0773BB] text-white' : 'text-slate-400'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActivityFilter('task')}
                    className={`px-2 py-0.5 rounded ${activityFilter === 'task' ? 'bg-[#0773BB] text-white' : 'text-slate-400'}`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setActivityFilter('auth')}
                    className={`px-2 py-0.5 rounded ${activityFilter === 'auth' ? 'bg-[#0773BB] text-white' : 'text-slate-400'}`}
                  >
                    Auth
                  </button>
                </div>
              </div>

              {/* Activity Feed List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {(() => {
                  const filteredLogs = (activityLogs || []).filter((log) => {
                    if (activityFilter === 'all') return true;
                    return log.type === activityFilter;
                  });

                  if (filteredLogs.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No recent activity recorded for this filter.
                      </p>
                    );
                  }

                  return filteredLogs.slice(0, 7).map((log) => {
                    const logUser = users.find((u) => u.id === log.userId) || { name: log.userName, avatar: log.userAvatar };
                    const timeAgo = log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';

                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] flex items-start gap-3 hover:border-[#3BC0BB]/40 transition-all text-xs"
                      >
                        <img
                          src={logUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={logUser.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-[#0773BB]"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white truncate">{logUser.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">{timeAgo}</span>
                          </div>

                          <p className="text-slate-300 mt-0.5 text-[11px] capitalize">
                            <span className="text-[#3BC0BB] font-semibold">{log.action}</span>
                            {log.target && <span> — {log.target}</span>}
                          </p>

                          {log.details && (
                            <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">{log.details}</p>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                          log.type === 'auth' ? 'bg-amber-500/20 text-amber-300' :
                          log.type === 'task' ? 'bg-emerald-500/20 text-emerald-300' :
                          log.type === 'project' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {log.type}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Workspace Quick-Access Links */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between border-b border-[#233549]/40 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className={`text-base font-extrabold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Quick-Access Workspace Shortcuts
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="p-3.5 rounded-xl bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] hover:border-[#3BC0BB] text-left transition-all group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <ListTodo className="w-5 h-5 text-[#3BC0BB]" />
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-bold text-white text-xs">Task Board & Kanban</div>
                  <p className="text-[10px] text-slate-400">Manage tasks, deadlines, and dependencies</p>
                </button>

                <button
                  onClick={() => setActiveTab('workload')}
                  className="p-3.5 rounded-xl bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] hover:border-[#3BC0BB] text-left transition-all group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Users className="w-5 h-5 text-purple-400" />
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-bold text-white text-xs">Team Workload Heatmap</div>
                  <p className="text-[10px] text-slate-400">Review team bandwidth & task allocations</p>
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className="p-3.5 rounded-xl bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] hover:border-[#3BC0BB] text-left transition-all group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <BarChart2 className="w-5 h-5 text-[#0773BB]" />
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-bold text-white text-xs">Reports & Analytics</div>
                  <p className="text-[10px] text-slate-400">Executive KPIs, budgets, and SLAs</p>
                </button>

                <button
                  onClick={() => setActiveTab('time')}
                  className="p-3.5 rounded-xl bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] hover:border-[#3BC0BB] text-left transition-all group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-bold text-white text-xs">Time Tracking & Logs</div>
                  <p className="text-[10px] text-slate-400">Review logged hours and live timers</p>
                </button>

                <button
                  onClick={() => setActiveTab('automations')}
                  className="p-3.5 rounded-xl bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] hover:border-[#3BC0BB] text-left transition-all group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-bold text-white text-xs">ClickUp Automations</div>
                  <p className="text-[10px] text-slate-400">Manage rules, auto-assignees, and triggers</p>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-3.5 rounded-xl bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] hover:border-[#3BC0BB] text-left transition-all group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <ShieldCheck className="w-5 h-5 text-teal-400" />
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-bold text-white text-xs">Domain Control & Settings</div>
                  <p className="text-[10px] text-slate-400">Manage email whitelists & enterprise auth</p>
                </button>

                <button
                  onClick={() => setShowCreateSpaceModal(true)}
                  className="p-3.5 rounded-xl bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] hover:border-[#3BC0BB] text-left transition-all group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Plus className="w-5 h-5 text-[#0773BB]" />
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-bold text-white text-xs">Create New Space</div>
                  <p className="text-[10px] text-slate-400">Launch a new project or department</p>
                </button>

                <button
                  onClick={() => setShowCreateCompanyModal(true)}
                  className="p-3.5 rounded-xl bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] hover:border-[#3BC0BB] text-left transition-all group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Building className="w-5 h-5 text-[#3BC0BB]" />
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-bold text-white text-xs">Add Workspace Entity</div>
                  <p className="text-[10px] text-slate-400">Register new corporate subsidiary</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const spaceTasks = tasks.filter((t) => t.projectId === project.id);
            const doneCount = spaceTasks.filter((t) => t.status === 'Done').length;
            const progress = spaceTasks.length > 0 ? Math.round((doneCount / spaceTasks.length) * 100) : 0;
            const manager = users.find((u) => u.id === project.managerId);
            const company = companies.find((c) => c.id === project.companyId);

            return (
              <div
                key={project.id}
                className={`p-5 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 hover:border-[#0D9488] shadow-sm hover:shadow-md'
                    : 'bg-[#16222F] border-[#233549] hover:border-[#3BC0BB] shadow-lg'
                }`}
              >
                <div>
                  {/* Space Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0773BB] to-[#3BC0BB] text-white font-mono font-bold flex items-center justify-center shadow-md text-xs">
                        {project.code}
                      </div>
                      <div>
                        <h3 className={`text-base font-bold tracking-tight line-clamp-1 ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {project.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {company?.name || 'Dolphin Global'} • {project.category}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                      project.status === 'In Progress'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : project.status === 'Planning'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed line-clamp-2 mb-4 ${
                    theme === 'light' ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    {project.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-400">
                      <span>Execution Progress</span>
                      <span>{progress}% ({doneCount}/{spaceTasks.length} tasks)</span>
                    </div>
                    <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Space Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
                    <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                    }`}>
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono text-slate-300 font-bold">${project.budget?.toLocaleString()}</span>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                    }`}>
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span className="truncate text-slate-300 font-semibold">{manager?.name || 'Manager'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-[#233549]/60">
                  <button
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setActiveTab('tasks');
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#3BC0BB] hover:underline"
                  >
                    <span>Open Tasks & Board</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setConfiguringProject(project)}
                      className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#233549] text-slate-300 hover:text-white border border-[#233549] transition-all"
                      title="Configure Space & ClickApps"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmProject(project)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all"
                      title="Delete Space / Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'table' && (
        <div className={`rounded-2xl border overflow-hidden ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b font-mono font-bold uppercase tracking-wider text-[11px] ${
                theme === 'light' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0D1520] text-slate-400 border-[#233549]'
              }`}>
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Space / Project Title</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Manager</th>
                  <th className="p-3.5">Budget</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233549]/50 font-medium">
                {filteredProjects.map((p) => {
                  const manager = users.find((u) => u.id === p.managerId);
                  return (
                    <tr key={p.id} className="hover:bg-[#0D1520]/40 transition-colors">
                      <td className="p-3.5 font-mono text-[#3BC0BB] font-bold">{p.code}</td>
                      <td className="p-3.5 font-bold text-white">{p.title}</td>
                      <td className="p-3.5 text-slate-300">{p.category}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{manager?.name || 'Unassigned'}</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">${p.budget?.toLocaleString()}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setActiveTab('tasks');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0773BB] text-white font-bold text-[11px]"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => setConfiguringProject(p)}
                            className="p-1.5 rounded-lg bg-[#0D1520] text-slate-300 border border-[#233549]"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'hierarchy' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <h2 className="text-sm font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-[#3BC0BB]" />
            <span>ClickUp Space & Folder Hierarchy Tree</span>
          </h2>

          <div className="space-y-4">
            {companies.map((comp) => {
              const compProjects = projects.filter((p) => p.companyId === comp.id);
              return (
                <div key={comp.id} className="border border-[#233549] rounded-xl overflow-hidden bg-[#0D1520]">
                  <div className="p-3.5 bg-[#16222F] flex items-center justify-between border-b border-[#233549]">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-[#0773BB] text-white font-mono text-xs font-bold">
                        {comp.code}
                      </span>
                      <span className="font-bold text-white text-sm">{comp.name}</span>
                      <span className="text-xs text-slate-400 font-mono">({compProjects.length} Spaces)</span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveCompany(comp);
                        setShowCreateSpaceModal(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 text-xs font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Space to {comp.code}</span>
                    </button>
                  </div>

                  <div className="p-3 space-y-2 pl-6">
                    {compProjects.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-2">No spaces configured in this workspace yet.</p>
                    ) : (
                      compProjects.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#16222F]/60 border border-[#233549] hover:border-[#3BC0BB] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronRight className="w-4 h-4 text-[#3BC0BB]" />
                            <span className="text-xs font-mono font-bold text-[#3BC0BB]">{p.code}</span>
                            <span className="text-xs font-bold text-white">{p.title}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedProjectId(p.id);
                                setActiveTab('tasks');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#0773BB] text-white text-xs font-bold"
                            >
                              Go to Space
                            </button>
                            <button
                              onClick={() => setConfiguringProject(p)}
                              className="p-1 rounded bg-[#0D1520] text-slate-300 border border-[#233549]"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MODAL: CREATE NEW SPACE / PROJECT */}
      {showCreateSpaceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#3BC0BB]" />
                <h2 className="text-base font-bold text-white">Create New Space / Project</h2>
              </div>
              <button onClick={() => setShowCreateSpaceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Space / Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dubai Metro HVAC Expansion"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Space Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DM-HVAC"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Workspace Entity</label>
                  <select
                    value={newCompanyId}
                    onChange={(e) => setNewCompanyId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Outline executive deliverables and strategic milestones..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department / Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Project['category'])}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Industrial Manufacturing">Industrial Manufacturing</option>
                    <option value="HVAC Engineering">HVAC Engineering</option>
                    <option value="Radiator Production">Radiator Production</option>
                    <option value="Heat Exchanger">Heat Exchanger</option>
                    <option value="Group IT">Group IT</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value))}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Manager</label>
                  <select
                    value={newManagerId}
                    onChange={(e) => setNewManagerId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowCreateSpaceModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] text-white font-bold shadow-lg"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: CREATE WORKSPACE COMPANY */}
      {showCreateCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-[#3BC0BB]" />
                <h2 className="text-base font-bold text-white">Add New Workspace Organization</h2>
              </div>
              <button onClick={() => setShowCreateCompanyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dolphin Global Logistics"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DLOG"
                  value={newCompCode}
                  onChange={(e) => setNewCompCode(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="extComp"
                  checked={newCompExternal}
                  onChange={(e) => setNewCompExternal(e.target.checked)}
                  className="rounded bg-[#0D1520] border-[#233549] text-[#3BC0BB]"
                />
                <label htmlFor="extComp" className="text-slate-300 cursor-pointer">
                  External Client / Partner Organization
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowCreateCompanyModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3BC0BB] text-[#0D1520] font-bold shadow-lg"
                >
                  Add Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: SPACE & CLICKAPPS CONFIGURATION */}
      {configuringProject && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#0773BB] text-white font-mono font-bold flex items-center justify-center text-xs">
                  {configuringProject.code}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Space Settings: {configuringProject.title}</h2>
                  <p className="text-[11px] text-slate-400">Manage project metadata, ClickApps, and status pipelines.</p>
                </div>
              </div>
              <button onClick={() => setConfiguringProject(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Config Tabs */}
            <div className="flex items-center gap-2 border-b border-[#233549] pb-2 text-xs font-bold">
              <button
                onClick={() => setActiveConfigTab('general')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeConfigTab === 'general' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                General Info
              </button>
              <button
                onClick={() => setActiveConfigTab('clickapps')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeConfigTab === 'clickapps' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ClickApps & Features
              </button>
              <button
                onClick={() => setActiveConfigTab('statuses')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeConfigTab === 'statuses' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Statuses Pipeline
              </button>
            </div>

            <form onSubmit={handleSaveProjectConfig} className="space-y-4 text-xs">
              {activeConfigTab === 'general' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Space Title</label>
                    <input
                      type="text"
                      required
                      value={configuringProject.title}
                      onChange={(e) => setConfiguringProject({ ...configuringProject, title: e.target.value })}
                      className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Project Code</label>
                      <input
                        type="text"
                        required
                        value={configuringProject.code}
                        onChange={(e) => setConfiguringProject({ ...configuringProject, code: e.target.value })}
                        className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Status</label>
                      <select
                        value={configuringProject.status}
                        onChange={(e) => setConfiguringProject({ ...configuringProject, status: e.target.value as ProjectStatus })}
                        className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                      >
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="In Review">In Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Allocated Budget ($)</label>
                      <input
                        type="number"
                        value={configuringProject.budget}
                        onChange={(e) => setConfiguringProject({ ...configuringProject, budget: Number(e.target.value) })}
                        className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Project Manager</label>
                      <select
                        value={configuringProject.managerId}
                        onChange={(e) => setConfiguringProject({ ...configuringProject, managerId: e.target.value })}
                        className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeConfigTab === 'clickapps' && (
                <div className="space-y-3">
                  <p className="text-slate-400 text-[11px]">Toggle modular ClickApps enabled for tasks inside this Space:</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(clickApps).map(([key, enabled]) => (
                      <div
                        key={key}
                        onClick={() => setClickApps({ ...clickApps, [key]: !enabled })}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          enabled ? 'bg-[#3BC0BB]/10 border-[#3BC0BB] text-white' : 'bg-[#0D1520] border-[#233549] text-slate-400'
                        }`}
                      >
                        <span className="capitalize text-xs font-semibold">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${enabled ? 'bg-[#3BC0BB] text-[#0D1520]' : 'bg-slate-700'}`}>
                          {enabled && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeConfigTab === 'statuses' && (
                <div className="space-y-3">
                  <p className="text-slate-400 text-[11px]">Workflow Status progression for this Space:</p>
                  <div className="space-y-2">
                    {['To Do', 'In Progress', 'In Review', 'Done'].map((st, i) => (
                      <div key={st} className="flex items-center gap-3 p-2.5 bg-[#0D1520] border border-[#233549] rounded-xl text-xs font-bold text-white">
                        <span className="w-5 h-5 rounded-full bg-[#0773BB] text-white text-[10px] flex items-center justify-center font-mono">
                          {i + 1}
                        </span>
                        <span>{st}</span>
                        <span className="ml-auto text-[10px] font-mono text-slate-400 uppercase">
                          {st === 'Done' ? 'Closed' : 'Active State'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmProject(configuringProject);
                    setConfiguringProject(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Space</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfiguringProject(null)}
                    className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#3BC0BB] text-[#0D1520] font-bold shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. CONFIRM DELETE MODAL */}
      {deleteConfirmProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Space "{deleteConfirmProject.title}"?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will permanently delete Space <span className="font-mono text-rose-400 font-bold">[{deleteConfirmProject.code}]</span> and remove all associated tasks, subtasks, and files from Firestore storage.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#233549]">
              <button
                onClick={() => setDeleteConfirmProject(null)}
                className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProject(deleteConfirmProject.id);
                  setDeleteConfirmProject(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
