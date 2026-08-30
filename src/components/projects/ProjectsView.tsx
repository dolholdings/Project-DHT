import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Calendar,
  DollarSign,
  User,
  Building,
  CheckCircle2,
  Clock,
  BarChart2,
  X,
  Settings,
  Trash2,
  BookmarkPlus,
  Copy,
  Layers,
  Search,
  Sparkles,
  ArrowRight,
  GitFork,
  FileText,
  ListTodo,
  Eye,
  Check,
  Zap,
  Info,
  FileSpreadsheet,
  Table,
  LayoutGrid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus, ProjectTemplate } from '../../types';
import { ProjectCsvImportModal } from './ProjectCsvImportModal';
import { ClientPsrReportModal } from '../reports/ClientPsrReportModal';
import { ProjectsDataTable } from './ProjectsDataTable';
import { canCreateSpace, canDeleteSpace } from '../../lib/permissions';
import { PermissionGuard } from '../common/PermissionGuard';
import { CompanyIconBadge } from '../common/CompanyLogo';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    projectTemplates,
    saveProjectAsTemplate,
    duplicateProjectTemplate,
    instantiateProjectFromTemplate,
    deleteProjectTemplate,
    customFields,
    tasks,
    dependencies,
    activeCompany,
    companies,
    users,
    setActiveTab,
    setSelectedProjectId,
    searchQuery,
    theme,
    currentUser
  } = useApp();

  // Navigation Tab State: 'projects' or 'templates'
  const [activeViewTab, setActiveViewTab] = useState<'projects' | 'templates'>('projects');
  const [projectsLayoutMode, setProjectsLayoutMode] = useState<'grid' | 'table'>('table');

  // Filter States
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showClientPsrModal, setShowClientPsrModal] = useState(false);
  const [psrProjectId, setPsrProjectId] = useState<string | undefined>(undefined);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Save as Template Modal State
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [selectedProjectToTemplate, setSelectedProjectToTemplate] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCategory, setTemplateCategory] = useState<Project['category']>('Industrial Manufacturing');
  const [selectedCustomFieldIdsForTemplate, setSelectedCustomFieldIdsForTemplate] = useState<string[]>([]);
  const [saveCleanupClearAssignments, setSaveCleanupClearAssignments] = useState(true);
  const [saveCleanupResetHours, setSaveCleanupResetHours] = useState(false);

  // Instantiate Modal State
  const [showInstantiateModal, setShowInstantiateModal] = useState(false);
  const [selectedTemplateForInstantiate, setSelectedTemplateForInstantiate] = useState<ProjectTemplate | null>(null);
  const [instantiateTitle, setInstantiateTitle] = useState('');
  const [instantiateCode, setInstantiateCode] = useState('');
  const [instantiateCompanyId, setInstantiateCompanyId] = useState(activeCompany.id || 'comp_5');
  const [instantiateManagerId, setInstantiateManagerId] = useState(users[0]?.id || 'usr_1');
  const [instantiateStartDate, setInstantiateStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [instantiateBudget, setInstantiateBudget] = useState(500000);
  const [instantiateDesc, setInstantiateDesc] = useState('');

  // Structure Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);

  // Notification Banner State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Standard Create Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCompanyId, setNewCompanyId] = useState(activeCompany.id || 'comp_5');
  const [newCategory, setNewCategory] = useState<Project['category']>('Industrial Manufacturing');
  const [newBudget, setNewBudget] = useState<string>('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newManagerId, setNewManagerId] = useState(users[0]?.id || 'usr_1');

  // Projects Filter
  const filteredProjects = projects.filter((p) => {
    const isAccessible =
      currentUser?.role === 'Admin' ||
      p.managerId === currentUser?.id ||
      (p.members && p.members.includes(currentUser?.id || '')) ||
      (p.memberRoles && Boolean(p.memberRoles[currentUser?.id || '']));

    if (!isAccessible) return false;

    if (selectedCompanyFilter !== 'all') {
      if (selectedCompanyFilter === 'internal') {
        const c = companies.find((comp) => comp.id === p.companyId);
        if (c?.isExternal) return false;
      } else if (selectedCompanyFilter === 'external') {
        const c = companies.find((comp) => comp.id === p.companyId);
        if (!c?.isExternal) return false;
      } else if (p.companyId !== selectedCompanyFilter) {
        return false;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchCode = p.code.toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      const manager = users.find((u) => u.id === p.managerId);
      const matchManager = manager ? manager.name.toLowerCase().includes(q) || manager.email.toLowerCase().includes(q) : false;
      const members = users.filter((u) => p.members.includes(u.id));
      const matchMember = members.some((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

      if (!matchTitle && !matchCode && !matchDesc && !matchCat && !matchManager && !matchMember) {
        return false;
      }
    }

    return true;
  });

  // Templates Filter
  const filteredTemplates = projectTemplates.filter((tpl) => {
    const matchesCategory =
      templateCategoryFilter === 'all' || tpl.category === templateCategoryFilter;
    const matchesSearch =
      !templateSearchQuery.trim() ||
      tpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tpl.tags.some((t) => t.toLowerCase().includes(templateSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateSpace(currentUser)) {
      showToast('Permission denied: Team Members and Viewers cannot create spaces/projects.');
      return;
    }
    if (!newTitle.trim()) return;

    // Auto-generate uppercase project code if left blank
    const generatedCode = newCode.trim()
      ? newCode.trim().toUpperCase()
      : (newTitle.trim().slice(0, 4).toUpperCase() || 'PRJ') + '-' + Math.floor(100 + Math.random() * 900);

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultDue = new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0];

    addProject({
      title: newTitle.trim(),
      code: generatedCode,
      companyId: newCompanyId,
      description: newDesc || 'Strategic engineering project',
      status: 'Planning',
      managerId: newManagerId,
      startDate: newStartDate || todayStr,
      dueDate: newDueDate || defaultDue,
      budget: newBudget ? Number(newBudget) : 0,
      category: newCategory || 'Industrial Manufacturing',
      members: [newManagerId],
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewCode('');
    setNewDesc('');
    setNewBudget('');
    setNewStartDate('');
    setNewDueDate('');
    showToast(`Project "${newTitle.trim()}" initialized successfully.`);
  };

  const handleOpenSaveAsTemplate = (projectId?: string) => {
    const projId = projectId || projects[0]?.id || '';
    const proj = projects.find((p) => p.id === projId);
    setSelectedProjectToTemplate(projId);
    setTemplateName(proj ? `${proj.title} Template` : '');
    setTemplateDesc(proj ? `Standard template based on ${proj.title}` : '');
    setTemplateCategory(proj?.category || 'Industrial Manufacturing');
    // Pre-select all available custom fields
    setSelectedCustomFieldIdsForTemplate(customFields.map((c) => c.id));
    setSaveCleanupClearAssignments(true);
    setSaveCleanupResetHours(false);
    setShowSaveTemplateModal(true);
  };

  const handleSaveProjectAsTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectToTemplate || !templateName) return;

    try {
      const createdTpl = saveProjectAsTemplate(
        selectedProjectToTemplate,
        templateName,
        templateDesc,
        templateCategory,
        undefined,
        selectedCustomFieldIdsForTemplate,
        {
          clearAssignments: saveCleanupClearAssignments,
          resetEstimatedHours: saveCleanupResetHours
        }
      );
      setShowSaveTemplateModal(false);
      showToast(`Template "${createdTpl.name}" created with ${createdTpl.tasks.length} tasks, ${createdTpl.dependencies.length} dependencies & ${createdTpl.customFields?.length || 0} custom fields!`);
      setActiveViewTab('templates');
    } catch (err: any) {
      alert(err.message || 'Failed to save template');
    }
  };

  const handleOpenInstantiate = (tpl: ProjectTemplate) => {
    setSelectedTemplateForInstantiate(tpl);
    const dateStr = new Date().toISOString().split('T')[0];
    const defaultCode = `PRJ-${tpl.category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    setInstantiateTitle(`${tpl.name} Project`);
    setInstantiateCode(defaultCode);
    setInstantiateCompanyId(activeCompany.id || 'comp_5');
    setInstantiateManagerId(currentUser.id || users[0]?.id || 'usr_1');
    setInstantiateStartDate(dateStr);
    setInstantiateBudget(tpl.estimatedBudget || 500000);
    setInstantiateDesc(tpl.description);
    setShowInstantiateModal(true);
  };

  const handleInstantiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForInstantiate || !instantiateTitle || !instantiateCode) return;

    try {
      const newProj = instantiateProjectFromTemplate(selectedTemplateForInstantiate.id, {
        title: instantiateTitle,
        code: instantiateCode,
        companyId: instantiateCompanyId,
        managerId: instantiateManagerId,
        startDate: instantiateStartDate,
        budget: Number(instantiateBudget),
        description: instantiateDesc
      });

      setShowInstantiateModal(false);
      showToast(`Project "${newProj.title}" instantiated successfully from template!`);
      setSelectedProjectId(newProj.id);
      setActiveViewTab('projects');
    } catch (err: any) {
      alert(err.message || 'Failed to instantiate project');
    }
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl font-medium text-xs flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Sub-navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#233549]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <FolderKanban className="w-6 h-6 text-[#0773BB]" />
              <span>{activeViewTab === 'projects' ? 'Projects Portfolio' : 'Project Template Library'}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30">
              {activeViewTab === 'projects' ? `${filteredProjects.length} Active` : `${filteredTemplates.length} Templates`}
            </span>
          </div>
          <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            {activeViewTab === 'projects'
              ? 'Multi-entity capital expenditure and operational project management across Dolphin Group.'
              : 'Standardized engineering project templates with pre-configured tasks, subtasks, and dependency schedules.'}
          </p>
        </div>

        {/* View Switcher Tabs & Primary Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-1 rounded-2xl bg-[#0D1520] border border-[#233549] flex items-center gap-1">
            <button
              onClick={() => setActiveViewTab('projects')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeViewTab === 'projects'
                  ? 'bg-[#0773BB] text-white shadow-md shadow-[#0773BB]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Projects ({projects.length})</span>
            </button>
            <button
              onClick={() => setActiveViewTab('templates')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeViewTab === 'templates'
                  ? 'bg-[#3BC0BB] text-slate-950 shadow-md shadow-[#3BC0BB]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Template Library ({projectTemplates.length})</span>
            </button>
          </div>

          {activeViewTab === 'projects' ? (
            <>
              {/* Layout Switcher (Grid vs Table) */}
              <div className="p-1 rounded-2xl bg-[#0D1520] border border-[#233549] flex items-center gap-1">
                <button
                  onClick={() => setProjectsLayoutMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    projectsLayoutMode === 'table'
                      ? 'bg-[#3BC0BB] text-slate-950 shadow-md shadow-[#3BC0BB]/30'
                      : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                  }`}
                  title="Full Data Table view with sorting, filtering, and pagination"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Data Table</span>
                </button>
                <button
                  onClick={() => setProjectsLayoutMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    projectsLayoutMode === 'grid'
                      ? 'bg-[#0773BB] text-white shadow-md shadow-[#0773BB]/30'
                      : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                  }`}
                  title="Card Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Card Grid</span>
                </button>
              </div>

              {/* Company Filter Dropdown */}
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className={`text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] border ${
                  theme === 'light'
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-[#16222F] border-[#233549] text-slate-200'
                }`}
              >
                <option value="all">All Companies & Projects</option>
                <option value="internal">Dolphin Entities Only (Internal)</option>
                <option value="external">External Partner Companies Only</option>
                <optgroup label="Specific Company Entities">
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </optgroup>
              </select>

              <button
                onClick={() => {
                  setPsrProjectId(undefined);
                  setShowClientPsrModal(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-white font-black text-xs transition-all border border-amber-400/50 shadow-md"
                title="Design & export Client Status Report (SLB PSR #03) from live Action Tracker tasks"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Client PSR #03 Report</span>
              </button>

              <PermissionGuard action="create_space">
                <button
                  onClick={() => setShowCsvImportModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0773BB]/20 hover:bg-[#0773BB]/30 text-[#3BC0BB] border border-[#0773BB]/40 font-bold text-xs transition-all"
                  title="Import Project structure from CSV or Excel task lists with column auto-mapping"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Import Project</span>
                </button>

                <button
                  onClick={() => handleOpenSaveAsTemplate()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#3BC0BB]/20 hover:bg-[#3BC0BB]/30 text-[#3BC0BB] border border-[#3BC0BB]/40 font-bold text-xs transition-all"
                  title="Save an existing project as a reusable template"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save as Template</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg shadow-[#0773BB]/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Blank Project</span>
                </button>
              </PermissionGuard>
            </>
          ) : (
            <>
              <PermissionGuard action="create_space">
                <button
                  onClick={() => handleOpenSaveAsTemplate()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg shadow-[#0773BB]/30 transition-all"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save Project as Template</span>
                </button>
              </PermissionGuard>
            </>
          )}
        </div>
      </div>

      {/* VIEW TAB 1: PROJECTS (GRID OR DATA TABLE) */}
      {activeViewTab === 'projects' && (
        projectsLayoutMode === 'table' ? (
          <ProjectsDataTable
            onOpenPsrReport={(id) => {
              setPsrProjectId(id);
              setShowClientPsrModal(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {filteredProjects.map((proj) => {
            const comp = companies.find((c) => c.id === proj.companyId);
            const manager = users.find((u) => u.id === proj.managerId);
            const projTaskCount = tasks.filter((t) => t.projectId === proj.id).length;

            return (
              <div
                key={proj.id}
                className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] hover:border-[#0773BB] transition-all flex flex-col justify-between space-y-4 group shadow-xl relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                        {proj.code}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0D1520] text-slate-400 border border-[#233549]">
                        {projTaskCount} Tasks
                      </span>
                    </div>

                    <select
                      value={proj.status}
                      onChange={(e) =>
                        updateProject(proj.id, {
                          status: e.target.value as ProjectStatus,
                        })
                      }
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#0D1520] border focus:outline-none ${
                        proj.status === 'In Progress'
                          ? 'text-emerald-400 border-emerald-500/30'
                          : proj.status === 'Planning'
                          ? 'text-sky-400 border-sky-500/30'
                          : proj.status === 'In Review'
                          ? 'text-amber-400 border-amber-500/30'
                          : 'text-slate-400 border-slate-500/30'
                      }`}
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#3BC0BB] transition-colors">
                      {proj.title}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                      <CompanyIconBadge logo={comp?.logo} name={comp?.name} size="xs" />
                      <span>{comp?.name}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    {proj.description}
                  </p>
                </div>

                {/* Progress & Budget Bar */}
                <div className="space-y-3 pt-2 border-t border-[#233549]">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
                      <span>Overall Progress</span>
                      <span className="text-[#3BC0BB] font-bold">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-[#0D1520] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] h-full"
                        style={{ width: `${proj.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2 rounded-xl bg-[#0D1520] border border-[#233549]">
                      <div className="text-[10px] text-slate-500 uppercase">Budget</div>
                      <div className="text-white font-bold">${proj.budget.toLocaleString()}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#0D1520] border border-[#233549]">
                      <div className="text-[10px] text-slate-500 uppercase">Manager</div>
                      <div className="text-slate-200 truncate">{manager?.name || 'Assigned'}</div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setActiveTab('tasks');
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-[#0773BB]/20 hover:bg-[#0773BB] text-[#3BC0BB] hover:text-white border border-[#0773BB]/40 text-xs font-medium transition-all text-center"
                    >
                      View Tasks
                    </button>

                    <button
                      onClick={() => {
                        setPsrProjectId(proj.id);
                        setShowClientPsrModal(true);
                      }}
                      className="p-1.5 rounded-xl bg-sky-900/40 hover:bg-sky-800 text-amber-400 border border-amber-400/40 transition-all"
                      title="Generate Client Status Report (SLB PSR #03) for this project"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    <PermissionGuard action="create_space">
                      <button
                        onClick={() => handleOpenSaveAsTemplate(proj.id)}
                        className="p-1.5 rounded-xl bg-[#3BC0BB]/10 hover:bg-[#3BC0BB] text-[#3BC0BB] hover:text-slate-950 border border-[#3BC0BB]/30 transition-all"
                        title="Save as Project Template"
                      >
                        <BookmarkPlus className="w-4 h-4" />
                      </button>
                    </PermissionGuard>

                    {(currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager') && (
                      <button
                        onClick={() => setEditingProject(proj)}
                        className="p-1.5 rounded-xl bg-[#16222F] hover:bg-[#233549] text-slate-400 hover:text-white border border-[#233549] transition-all"
                        title="Configure Space / Project"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}

                    <PermissionGuard action="delete_space">
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete Space/Project "${proj.title}"?`)) {
                            deleteProject(proj.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all"
                        title="Delete Space / Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* VIEW TAB 2: TEMPLATE LIBRARY */}
      {activeViewTab === 'templates' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Template Search & Category Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#16222F] border border-[#233549] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates by name, tags, description..."
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0D1520] border border-[#233549] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3BC0BB]"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Category:</span>
              <select
                value={templateCategoryFilter}
                onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                className="text-xs font-medium rounded-xl px-3 py-2 bg-[#0D1520] border border-[#233549] text-slate-200 focus:outline-none focus:border-[#3BC0BB]"
              >
                <option value="all">All Categories</option>
                <option value="HVAC Engineering">HVAC Engineering</option>
                <option value="Radiator Production">Radiator Production</option>
                <option value="Heat Exchanger">Heat Exchanger</option>
                <option value="Industrial Manufacturing">Industrial Manufacturing</option>
                <option value="Group IT">Group IT</option>
              </select>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-6 rounded-2xl bg-[#16222F] border border-[#233549] hover:border-[#3BC0BB] transition-all flex flex-col justify-between space-y-4 group shadow-xl relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30 uppercase font-mono">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      By {tpl.createdBy}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#3BC0BB] transition-colors flex items-center gap-2">
                      <span>{tpl.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Template Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 py-2">
                    <div className="p-2.5 rounded-xl bg-[#0D1520] border border-[#233549] text-center">
                      <div className="text-[9px] text-slate-500 font-mono uppercase">Tasks</div>
                      <div className="text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                        <ListTodo className="w-3 h-3 text-[#3BC0BB]" />
                        <span>{tpl.tasks.length}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0D1520] border border-[#233549] text-center">
                      <div className="text-[9px] text-slate-500 font-mono uppercase">Dependencies</div>
                      <div className="text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                        <GitFork className="w-3 h-3 text-indigo-400" />
                        <span>{tpl.dependencies.length}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0D1520] border border-[#233549] text-center">
                      <div className="text-[9px] text-slate-500 font-mono uppercase">Custom Fields</div>
                      <div className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        <span>{tpl.customFields?.length || 0}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0D1520] border border-[#233549] text-center">
                      <div className="text-[9px] text-slate-500 font-mono uppercase">Est. Days</div>
                      <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{tpl.estimatedDurationDays}d</span>
                      </div>
                    </div>
                  </div>

                  {/* Template Workflow Lists Pill */}
                  {tpl.lists && tpl.lists.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 overflow-x-auto py-1">
                      <span className="text-slate-500 font-mono">Stages:</span>
                      {tpl.lists.slice(0, 3).map((l, lIdx) => (
                        <span key={lIdx} className="px-2 py-0.5 rounded-md bg-[#0D1520] border border-[#233549] text-slate-300 whitespace-nowrap">
                          {l}
                        </span>
                      ))}
                      {tpl.lists.length > 3 && (
                        <span className="text-slate-500 font-mono">+{tpl.lists.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tpl.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-[#0D1520] border border-[#233549] text-[10px] text-slate-300 font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Action Buttons */}
                <div className="pt-3 border-t border-[#233549] space-y-2">
                  <div className="flex items-center gap-2">
                    <PermissionGuard action="create_space">
                      <button
                        onClick={() => handleOpenInstantiate(tpl)}
                        className="flex-1 py-2 rounded-xl bg-[#3BC0BB] hover:bg-[#3BC0BB]/80 text-slate-950 font-bold text-xs shadow-lg shadow-[#3BC0BB]/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-4 h-4 fill-slate-950" />
                        <span>Instantiate Project</span>
                      </button>
                    </PermissionGuard>

                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className="p-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-slate-300 hover:text-white border border-[#233549] transition-all flex-1 justify-center flex items-center gap-1.5 text-xs font-bold"
                      title="Preview Template Tasks, Dependencies & Custom Fields"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>

                    <PermissionGuard action="create_space">
                      <button
                        onClick={() => {
                          const copy = duplicateProjectTemplate(tpl.id);
                          showToast(`Template duplicated as "${copy.name}"`);
                        }}
                        className="p-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-indigo-300 hover:text-white border border-[#233549] transition-all"
                        title="Duplicate Template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </PermissionGuard>

                    {canDeleteSpace(currentUser) && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete template "${tpl.name}"?`)) {
                            deleteProjectTemplate(tpl.id);
                            showToast(`Template "${tpl.name}" deleted.`);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: SAVE EXISTING PROJECT AS TEMPLATE */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#233549] pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-[#3BC0BB]" />
                <span>Save Project Structure as Template</span>
              </h2>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectAsTemplateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Source Project to Extract Structure From *
                </label>
                <select
                  value={selectedProjectToTemplate}
                  onChange={(e) => {
                    setSelectedProjectToTemplate(e.target.value);
                    const p = projects.find((x) => x.id === e.target.value);
                    if (p) {
                      setTemplateName(`${p.title} Template`);
                      setTemplateDesc(p.description);
                      setTemplateCategory(p.category);
                    }
                  }}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                >
                  {projects.map((p) => {
                    const taskCount = tasks.filter((t) => t.projectId === p.id).length;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.code}) — {taskCount} Tasks
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Turnkey Radiator Production Line Template"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Engineering Category
                  </label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value as any)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
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
                  <label className="block text-slate-300 font-semibold mb-1">
                    Captured Structure Summary
                  </label>
                  <div className="p-2 rounded-xl bg-[#0D1520] border border-[#233549] text-[11px] font-mono text-[#3BC0BB]">
                    {(() => {
                      const projTasks = tasks.filter((t) => t.projectId === selectedProjectToTemplate);
                      const projTaskIds = new Set(projTasks.map((t) => t.id));
                      const projDeps = dependencies.filter(
                        (d) => projTaskIds.has(d.taskId) && projTaskIds.has(d.dependsOnTaskId)
                      );
                      return `${projTasks.length} Tasks | ${projDeps.length} Dependencies`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Custom Fields Selection */}
              {customFields && customFields.length > 0 && (
                <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Custom Fields to Bundle with Template</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCustomFieldIdsForTemplate.length === customFields.length) {
                          setSelectedCustomFieldIdsForTemplate([]);
                        } else {
                          setSelectedCustomFieldIdsForTemplate(customFields.map((c) => c.id));
                        }
                      }}
                      className="text-[10px] text-[#3BC0BB] hover:underline font-mono"
                    >
                      {selectedCustomFieldIdsForTemplate.length === customFields.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Selected custom fields and their task values will be packaged into the reusable template schema:
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {customFields.map((cf) => {
                      const isChecked = selectedCustomFieldIdsForTemplate.includes(cf.id);
                      return (
                        <label
                          key={cf.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                              : 'bg-[#16222F] border-[#233549] text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomFieldIdsForTemplate((prev) => [...prev, cf.id]);
                              } else {
                                setSelectedCustomFieldIdsForTemplate((prev) => prev.filter((id) => id !== cf.id));
                              }
                            }}
                            className="rounded border-[#233549] text-emerald-500 focus:ring-0"
                          />
                          <div className="truncate">
                            <span className="font-medium text-slate-200 block truncate">{cf.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono uppercase">{cf.type}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cleanup Rules */}
              <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-2">
                <label className="text-slate-300 font-semibold block">
                  Template Sanitization & Cleanup Rules
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveCleanupClearAssignments}
                      onChange={(e) => setSaveCleanupClearAssignments(e.target.checked)}
                      className="rounded border-[#233549] text-[#3BC0BB] focus:ring-0"
                    />
                    <span>Clear user assignments (tasks will be assigned to project manager upon instantiation)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveCleanupResetHours}
                      onChange={(e) => setSaveCleanupResetHours(e.target.checked)}
                      className="rounded border-[#233549] text-[#3BC0BB] focus:ring-0"
                    />
                    <span>Reset estimated hours to 0</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Template Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the scope, deliverables, and applicability of this template..."
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0773BB]/10 border border-[#0773BB]/30 text-slate-300 text-[11px] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-[#0773BB] shrink-0 mt-0.5" />
                <span>
                  All relative task durations, day offsets, subtasks, custom fields, and Finish-to-Start dependency linkages from the selected project will be saved into the template library.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3BC0BB] hover:bg-[#3BC0BB]/80 text-slate-950 font-bold shadow-lg shadow-[#3BC0BB]/20"
                >
                  Save to Template Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INSTANTIATE PROJECT FROM TEMPLATE */}
      {showInstantiateModal && selectedTemplateForInstantiate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#233549] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#3BC0BB]" />
                  <span>Instantiate Project from Template</span>
                </h2>
                <p className="text-xs text-[#3BC0BB] font-mono mt-0.5">
                  Template: {selectedTemplateForInstantiate.name}
                </p>
              </div>
              <button
                onClick={() => setShowInstantiateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInstantiateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    New Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={instantiateTitle}
                    onChange={(e) => setInstantiateTitle(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={instantiateCode}
                    onChange={(e) => setInstantiateCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#3BC0BB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Company Entity *
                  </label>
                  <select
                    value={instantiateCompanyId}
                    onChange={(e) => setInstantiateCompanyId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Manager *
                  </label>
                  <select
                    value={instantiateManagerId}
                    onChange={(e) => setInstantiateManagerId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={instantiateStartDate}
                    onChange={(e) => setInstantiateStartDate(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Estimated Budget ($)
                  </label>
                  <input
                    type="number"
                    value={instantiateBudget}
                    onChange={(e) => setInstantiateBudget(Number(e.target.value))}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#3BC0BB]"
                  />
                </div>
              </div>

              {/* Template Bundled Assets Summary */}
              {selectedTemplateForInstantiate.customFields && selectedTemplateForInstantiate.customFields.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Included Custom Fields ({selectedTemplateForInstantiate.customFields.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedTemplateForInstantiate.customFields.map((cf) => (
                      <span key={cf.id} className="px-2 py-0.5 rounded bg-[#0D1520] text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                        {cf.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  value={instantiateDesc}
                  onChange={(e) => setInstantiateDesc(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                />
              </div>

              {/* Live Schedule Calculation Summary */}
              <div className="p-3 rounded-xl bg-[#0D1520] border border-[#3BC0BB]/40 text-[11px] space-y-1">
                <div className="text-[#3BC0BB] font-bold font-mono flex items-center justify-between">
                  <span>Automatic Schedule Generator</span>
                  <span>{selectedTemplateForInstantiate.tasks.length} Tasks | {selectedTemplateForInstantiate.dependencies.length} Links</span>
                </div>
                <div className="text-slate-300 flex items-center justify-between font-mono">
                  <span>Start Date: <strong>{instantiateStartDate}</strong></span>
                  <span>Calculated End Date: <strong>{(() => {
                    const ms = new Date(instantiateStartDate).getTime() + (selectedTemplateForInstantiate.estimatedDurationDays || 30) * 24 * 60 * 60 * 1000;
                    return new Date(ms).toISOString().split('T')[0];
                  })()}</strong></span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInstantiateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold shadow-lg shadow-[#0773BB]/30"
                >
                  Generate Project & Tasks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW TEMPLATE TASKS, CUSTOM FIELDS & DEPENDENCIES */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#233549] pb-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#3BC0BB]" />
                  <span>Template Structure, Custom Fields & Dependency Graph</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {previewTemplate.name} — {previewTemplate.category}
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Custom Fields Overview */}
              {previewTemplate.customFields && previewTemplate.customFields.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#0D1520] border border-emerald-500/30 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      <span>Packaged Custom Fields ({previewTemplate.customFields.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Auto-provisioned on project creation</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewTemplate.customFields.map((cf) => (
                      <div key={cf.id} className="p-2 rounded-lg bg-[#16222F] border border-[#233549] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{cf.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#0D1520] text-emerald-300 font-mono text-[9px] uppercase border border-emerald-500/20">
                            {cf.type}
                          </span>
                        </div>
                        {cf.description && (
                          <p className="text-[10px] text-slate-400">{cf.description}</p>
                        )}
                        {cf.options && (
                          <div className="text-[9px] text-slate-500 truncate font-mono">
                            Options: {cf.options.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow Lists */}
              {previewTemplate.lists && previewTemplate.lists.length > 0 && (
                <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-300 font-mono flex items-center justify-between">
                    <span>Workflow Stages & Lists</span>
                    <span className="text-slate-500">{previewTemplate.lists.length} Lists</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {previewTemplate.lists.map((listName, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#16222F] border border-[#233549] text-slate-200 text-[11px] font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3BC0BB]" />
                        <span>{listName}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-slate-300 font-semibold text-xs flex items-center justify-between pt-1">
                <span>Task Timeline Breakdown ({previewTemplate.tasks.length} Tasks)</span>
                <span className="text-slate-400 font-mono text-[10px]">Total Duration: {previewTemplate.estimatedDurationDays} Days</span>
              </div>

              {previewTemplate.tasks.map((task, idx) => {
                const deps = previewTemplate.dependencies.filter((d) => d.taskTempId === task.tempId);
                const prerequisiteTasks = deps.map((d) =>
                  previewTemplate.tasks.find((t) => t.tempId === d.dependsOnTaskTempId)
                ).filter(Boolean);

                return (
                  <div key={idx} className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30 text-[10px] font-bold font-mono flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-white text-xs">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        {task.listName && (
                          <span className="px-2 py-0.5 rounded-md bg-[#16222F] text-slate-300 border border-[#233549]">
                            {task.listName}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-[#16222F] text-amber-400 border border-[#233549]">
                          Offset: Day {task.dayOffset}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#16222F] text-emerald-400 border border-[#233549]">
                          Duration: {task.durationDays}d
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {task.description}
                    </p>

                    {/* Task Custom Field Values */}
                    {task.customFields && Object.keys(task.customFields).length > 0 && (
                      <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
                        {Object.entries(task.customFields).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                            {k.replace('cf_', '').replace(/_/g, ' ')}: <strong>{String(v)}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {prerequisiteTasks.length > 0 && (
                      <div className="pt-2 border-t border-[#233549]/60 flex items-center gap-2 flex-wrap">
                        <GitFork className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] text-slate-400 font-mono">Prerequisites:</span>
                        {prerequisiteTasks.map((prereq, pIdx) => (
                          <span key={pIdx} className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                            {prereq?.title}
                          </span>
                        ))}
                      </div>
                    )}

                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        <CheckCircle2 className="w-3 h-3 text-slate-500" />
                        {task.subtasks.map((sub, sIdx) => (
                          <span key={sIdx} className="text-[10px] text-slate-400 bg-[#16222F] px-2 py-0.5 rounded border border-[#233549]">
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#233549] flex justify-between items-center shrink-0">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-slate-300 font-medium text-xs"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  handleOpenInstantiate(t);
                }}
                className="px-5 py-2 rounded-xl bg-[#3BC0BB] hover:bg-[#3BC0BB]/80 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#3BC0BB]/20"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Instantiate Project Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD CREATE BLANK PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#233549] pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#0773BB]" />
                <span>Initialize Blank Project for {activeCompany.code}</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Assigning Company / Organization *
                </label>
                <select
                  value={newCompanyId}
                  onChange={(e) => setNewCompanyId(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                >
                  <optgroup label="Dolphin Internal Companies">
                    {companies
                      .filter((c) => !c.isExternal)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) - @{c.domain}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="External Partner Entities">
                    {companies
                      .filter((c) => c.isExternal)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) - External
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dammam Line 3 Chillers"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Code <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DM-CHILL-03"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#0773BB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Industry Category <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
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
                  <label className="block text-slate-300 font-semibold mb-1">
                    Budget Allocation ($) <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#0773BB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Start Date <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Due Date <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Project Lead / Manager
                </label>
                <select
                  value={newManagerId}
                  onChange={(e) => setNewManagerId(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {u.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Project Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Engineering scope, key objectives, and deliverables..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold shadow-lg shadow-[#0773BB]/30"
                >
                  Create Blank Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV PROJECT IMPORT MODAL */}
      {showCsvImportModal && (
        <ProjectCsvImportModal
          onClose={() => setShowCsvImportModal(false)}
          onSuccess={(importedTitle, taskCount) => {
            showToast(`Successfully imported project "${importedTitle}" with ${taskCount} tasks!`);
          }}
        />
      )}

      {/* CLIENT PSR REPORT MODAL */}
      {showClientPsrModal && (
        <ClientPsrReportModal
          onClose={() => setShowClientPsrModal(false)}
          defaultProjectId={psrProjectId}
        />
      )}
    </div>
  );
};
