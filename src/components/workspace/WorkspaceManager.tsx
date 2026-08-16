import React, { useState, useEffect } from 'react';
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
  Building2,
  Lock,
  Bookmark,
  Copy,
  Sparkles,
  FileText,
  History,
  RotateCcw,
  GitBranch,
  FileClock,
  Eraser,
  UserX,
  CheckSquare,
  Link2Off,
  Network,
  Workflow,
  ArrowDown,
  Columns,
  ShieldAlert,
  BarChart3,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus, SpaceRole, ProjectTemplate, TemplateVersionRecord, TemplateCleanupRules, Task, TaskDependency, TemplateTask, TemplateDependency } from '../../types';
import { getUserLastActive } from '../../lib/userActivity';
import { canCreateSpace, canDeleteSpace } from '../../lib/permissions';
import { PermissionGuard } from '../common/PermissionGuard';
import { DependencyPreviewModal } from './DependencyPreviewModal';
import { CompareTemplatesModal } from './CompareTemplatesModal';
import { ResourceCapacityPlannerModal } from './ResourceCapacityPlannerModal';
import { SmartImportAssistantModal } from './SmartImportAssistantModal';
import { ValidationEngineModal } from './ValidationEngineModal';
import { TemplateMetricsDashboardModal } from './TemplateMetricsDashboardModal';
import { UnifiedProjectSearchModal } from './UnifiedProjectSearchModal';
import { ExcelImportModal } from '../common/ExcelImportModal';

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
    files,
    addTask,
    updateTask,
    users,
    updateUser,
    activityLogs,
    setActiveTab,
    setSelectedProjectId,
    theme,
    projectTemplates,
    dependencies,
    saveProjectAsTemplate,
    instantiateProjectFromTemplate,
    deleteProjectTemplate,
    rollbackTemplateVersion,
    currentUser
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'dashboard' | 'grid' | 'table' | 'hierarchy'>('dashboard');
  const [tableSubTab, setTableSubTab] = useState<'spaces' | 'users'>('spaces');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Modal States
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [configuringProject, setConfiguringProject] = useState<Project | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);
  const [activeConfigTab, setActiveConfigTab] = useState<'general' | 'clickapps' | 'statuses' | 'members'>('general');

  // Reusable Template Modal States
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [templateSourceProjectId, setTemplateSourceProjectId] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [templateDesc, setTemplateDesc] = useState<string>('');
  const [templateCategory, setTemplateCategory] = useState<Project['category']>('Industrial Manufacturing');

  // Template Versioning States
  const [templateSaveMode, setTemplateSaveMode] = useState<'new' | 'update'>('new');
  const [targetTemplateId, setTargetTemplateId] = useState<string>('');
  const [versionIncrement, setVersionIncrement] = useState<'minor' | 'major'>('minor');
  const [versionNote, setVersionNote] = useState<string>('');

  // Version History Modal State
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [selectedTemplateForHistory, setSelectedTemplateForHistory] = useState<ProjectTemplate | null>(null);

  const [showInstantiateModal, setShowInstantiateModal] = useState(false);
  const [selectedTemplateForInstantiate, setSelectedTemplateForInstantiate] = useState<ProjectTemplate | null>(null);
  const [selectedVersionRecordIdForInstantiate, setSelectedVersionRecordIdForInstantiate] = useState<string>('');
  
  // Template Preview & Dependency Map & Comparison & Capacity Planning States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showD3Modal, setShowD3Modal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showCapacityPlannerModal, setShowCapacityPlannerModal] = useState(false);
  const [showSmartImportModal, setShowSmartImportModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [importTargetProjectId, setImportTargetProjectId] = useState<string>('');
  const [showValidationEngineModal, setShowValidationEngineModal] = useState(false);
  const [showTemplateMetricsModal, setShowTemplateMetricsModal] = useState(false);
  const [showUnifiedSearchModal, setShowUnifiedSearchModal] = useState(false);

  // Global Keyboard Shortcut for Unified Search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowUnifiedSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Smart Import Assistant Handlers
  const handleImportTasks = (
    importedTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>[],
    targetProjectId: string
  ) => {
    importedTasks.forEach((t) => {
      addTask({
        ...t,
        projectId: targetProjectId
      });
    });
    setTemplateNotification(`Smart Import Assistant: Successfully imported ${importedTasks.length} tasks into workspace.`);
  };

  const handleCreateProjectAndImport = (
    newProjData: { title: string; code: string; category: string; budget: number },
    importedTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>[]
  ) => {
    const newProj = addProject({
      title: newProjData.title,
      code: newProjData.code,
      companyId: activeCompany.id,
      description: `Created via Smart Import Assistant from schedule file on ${new Date().toLocaleDateString()}`,
      status: 'Planning',
      progress: 0,
      managerId: users[0]?.id || 'usr_1',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      budget: newProjData.budget,
      spentBudget: 0,
      category: newProjData.category as any,
      members: users.map((u) => u.id),
      memberRoles: {}
    });

    importedTasks.forEach((t) => {
      addTask({
        ...t,
        projectId: newProj.id
      });
    });

    setTemplateNotification(`Created Space "${newProj.title}" and imported ${importedTasks.length} tasks via Smart Import Assistant.`);
  };
  const [compareInitialAId, setCompareInitialAId] = useState<string | undefined>(undefined);
  const [compareInitialBId, setCompareInitialBId] = useState<string | undefined>(undefined);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<ProjectTemplate | null>(null);
  const [previewTab, setPreviewTab] = useState<'tasks' | 'timeline' | 'dependencies'>('tasks');
  const [showInlineStructurePreview, setShowInlineStructurePreview] = useState(false);
  const [selectedDependencyNodeId, setSelectedDependencyNodeId] = useState<string | null>(null);
  const [depMapViewMode, setDepMapViewMode] = useState<'flow' | 'chain' | 'cards'>('flow');

  // Template Cleanup Rules State
  const [cleanupRules, setCleanupRules] = useState<TemplateCleanupRules>({
    clearAssignments: false,
    resetTaskStatuses: true,
    resetSubtasksCompletion: true,
    clearCustomTags: false,
    clearDependencies: false,
    resetEstimatedHours: false,
    clearDescriptionNotes: false,
  });
  const [instantiateTitle, setInstantiateTitle] = useState('');
  const [instantiateCode, setInstantiateCode] = useState('');
  const [instantiateCompanyId, setInstantiateCompanyId] = useState(activeCompany.id);
  const [instantiateManagerId, setInstantiateManagerId] = useState(users[0]?.id || 'usr_1');
  const [instantiateStartDate, setInstantiateStartDate] = useState('2026-08-10');
  const [instantiateBudget, setInstantiateBudget] = useState(200000);
  const [instantiateDescription, setInstantiateDescription] = useState('');
  const [instantiateBlankSpace, setInstantiateBlankSpace] = useState(false);
  const [templateNotification, setTemplateNotification] = useState<string | null>(null);

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
  const [selectedTemplateIdForNewSpace, setSelectedTemplateIdForNewSpace] = useState<string>('blank');

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

    const mgrId = newManagerId || users[0]?.id || 'usr_1';

    if (selectedTemplateIdForNewSpace !== 'blank') {
      try {
        const clonedProj = instantiateProjectFromTemplate(selectedTemplateIdForNewSpace, {
          title: newTitle.trim(),
          code: generatedCode,
          companyId: newCompanyId || activeCompany.id,
          managerId: mgrId,
          startDate: newStartDate || new Date().toISOString().split('T')[0],
          budget: Number(newBudget) || 100000,
          description: newDesc.trim()
        });
        if (clonedProj) {
          setSelectedProjectId(clonedProj.id);
        }
      } catch (err) {
        console.error('Failed to instantiate template:', err);
      }
    } else {
      const createdProj = addProject({
        title: newTitle.trim(),
        code: generatedCode,
        companyId: newCompanyId || activeCompany.id,
        description: newDesc.trim() || 'Strategic workspace space',
        status: 'Planning',
        managerId: mgrId,
        startDate: newStartDate || new Date().toISOString().split('T')[0],
        dueDate: newDueDate || '2026-12-31',
        budget: Number(newBudget) || 100000,
        category: newCategory,
        members: [mgrId],
        memberRoles: {
          [mgrId]: 'Admin'
        }
      });

      if (createdProj) {
        setSelectedProjectId(createdProj.id);
      }
    }

    setShowCreateSpaceModal(false);
    setNewTitle('');
    setNewCode('');
    setNewDesc('');
    setSelectedTemplateIdForNewSpace('blank');
  };

  const handleSaveProjectAsTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateSourceProjectId) return;
    try {
      if (templateSaveMode === 'update' && targetTemplateId) {
        const updatedTpl = saveProjectAsTemplate(
          templateSourceProjectId,
          templateName.trim(),
          templateDesc.trim(),
          templateCategory,
          {
            targetTemplateId,
            versionNote: versionNote.trim() || 'Updated structure from project space',
            isMajorVersion: versionIncrement === 'major'
          }
        );
        setShowSaveAsTemplateModal(false);
        setTemplateNotification(`Template "${updatedTpl.name}" updated to version ${updatedTpl.version || 'v1.1'}!`);
      } else {
        const newTpl = saveProjectAsTemplate(
          templateSourceProjectId,
          templateName.trim(),
          templateDesc.trim(),
          templateCategory,
          {
            versionNote: versionNote.trim() || 'Initial baseline release v1.0',
            isMajorVersion: false
          }
        );
        setShowSaveAsTemplateModal(false);
        setTemplateNotification(`Template "${newTpl.name}" (v1.0) successfully created and saved to library!`);
      }
      setShowTemplatesModal(true);
      setVersionNote('');
      setTimeout(() => setTemplateNotification(null), 4000);
    } catch (err) {
      console.error('Failed to save project as template:', err);
    }
  };

  const handleInstantiateProjectTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantiateTitle.trim()) return;

    const generatedCode = instantiateCode.trim()
      ? instantiateCode.trim().toUpperCase()
      : instantiateTitle.trim().slice(0, 4).toUpperCase() || 'SPC';

    const mgrId = instantiateManagerId || users[0]?.id || 'usr_1';

    if (instantiateBlankSpace || !selectedTemplateForInstantiate) {
      // Create empty space with structure metadata
      const createdProj = addProject({
        title: instantiateTitle.trim(),
        code: generatedCode,
        companyId: instantiateCompanyId || activeCompany.id,
        description: instantiateDescription.trim() || `Clean blank space created for production data`,
        status: 'Planning',
        managerId: mgrId,
        startDate: instantiateStartDate || new Date().toISOString().split('T')[0],
        dueDate: '2026-12-31',
        budget: Number(instantiateBudget) || 100000,
        category: selectedTemplateForInstantiate?.category || 'Industrial Manufacturing',
        members: [mgrId],
        memberRoles: {
          [mgrId]: 'Admin'
        }
      });
      if (createdProj) {
        setSelectedProjectId(createdProj.id);
      }
    } else {
      const clonedProj = instantiateProjectFromTemplate(selectedTemplateForInstantiate.id, {
        title: instantiateTitle.trim(),
        code: generatedCode,
        companyId: instantiateCompanyId || activeCompany.id,
        managerId: mgrId,
        startDate: instantiateStartDate || new Date().toISOString().split('T')[0],
        budget: Number(instantiateBudget) || 100000,
        description: instantiateDescription.trim(),
        versionRecordId: selectedVersionRecordIdForInstantiate || undefined,
        cleanupRules: cleanupRules
      });
      if (clonedProj) {
        setSelectedProjectId(clonedProj.id);
      }
    }

    setShowInstantiateModal(false);
    setShowTemplatesModal(false);
    setSelectedVersionRecordIdForInstantiate('');
    setTemplateNotification(`Space "${instantiateTitle}" successfully created!`);
    setTimeout(() => setTemplateNotification(null), 4000);
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
      members: configuringProject.members,
      memberRoles: configuringProject.memberRoles || {}
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
              onClick={() => setShowUnifiedSearchModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-[#3BC0BB] font-black text-xs shadow-md transition-all"
              title="Search across all tasks, files, space configurations, and templates (Ctrl+K / Cmd+K)"
            >
              <Search className="w-4 h-4 text-[#3BC0BB]" />
              <span>Unified Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-slate-300 border border-slate-700 ml-1">⌘K</kbd>
            </button>

            {currentUser?.role === 'Admin' && (
              <button
                onClick={() => setShowCreateSpaceModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white font-bold text-xs shadow-md shadow-[#0773BB]/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Space / Project</span>
              </button>
            )}

            <button
              onClick={() => setShowTemplatesModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-bold text-xs transition-all shadow-md"
              title="View, clone or save workspace templates"
            >
              <Bookmark className="w-4 h-4 text-purple-400" />
              <span>Templates Library ({projectTemplates?.length || 0})</span>
            </button>

            <button
              onClick={() => setShowCapacityPlannerModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all shadow-md"
              title="Define available weekly capacity and analyze real-time workload allocations"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Resource Capacity</span>
            </button>

            <button
              onClick={() => setShowSmartImportModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 font-bold text-xs transition-all shadow-md"
              title="AI-powered column mapping for Excel, MS-Project (.MPP/.XML), Jira, or CSV schedule imports"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Smart Import</span>
            </button>

            <button
              onClick={() => {
                setImportTargetProjectId('');
                setShowExcelModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all shadow-md"
              title="Direct Excel (.xlsx, .xls) and CSV file parser to upload & import existing project plans into workspaces"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Import CSV / Excel</span>
            </button>

            <button
              onClick={() => setShowValidationEngineModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all shadow-md"
              title="Audit workspace templates and schedules for broken dependency chains, circular loops, or orphan tasks"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Validation Engine</span>
            </button>

            <button
              onClick={() => setShowTemplateMetricsModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-bold text-xs transition-all shadow-md"
              title="Analytics dashboard showing template usage frequency, total tasks spawned, and most effective base structures"
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Template Metrics</span>
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

        {templateNotification && (
          <div className="mt-4 p-3 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
              <span>{templateNotification}</span>
            </div>
            <button onClick={() => setTemplateNotification(null)} className="text-purple-300 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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

        <div
          onClick={() => setShowCapacityPlannerModal(true)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
            theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:border-amber-400' : 'bg-[#16222F] border-[#233549] hover:border-amber-500/50'
          }`}
          title="Click to open Resource Capacity Planning Module"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Assigned Team Members</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-black mt-2 flex items-center justify-between ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <span>{users.length} Users</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Capacity Planner ➔
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Manage weekly hours & allocations
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

              <PermissionGuard action="create_space">
                <button
                  onClick={() => setShowCreateSpaceModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Space</span>
                </button>
              </PermissionGuard>
            </div>

            {(() => {
              const wsProjects = filteredProjects.filter((p) => p.companyId === activeCompany.id);
              const displayList = wsProjects.length > 0 ? wsProjects : filteredProjects;

              if (displayList.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-[#233549] bg-[#0D1520]/50 space-y-3">
                    <FolderKanban className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">No active spaces found in {activeCompany.name}.</p>
                    <PermissionGuard action="create_space">
                      <button
                        onClick={() => setShowCreateSpaceModal(true)}
                        className="px-4 py-2 rounded-xl bg-[#0773BB] text-white font-bold text-xs"
                      >
                        + Create First Space in {activeCompany.name}
                      </button>
                    </PermissionGuard>
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
                              onClick={() => {
                                setImportTargetProjectId(project.id);
                                setShowExcelModal(true);
                              }}
                              className="p-1 rounded-lg bg-[#16222F] text-emerald-400 hover:text-emerald-200 border border-[#233549] hover:border-emerald-500/50 flex items-center gap-1"
                              title={`Import MS-Project / Excel / CSV into "${project.title}"`}
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setTemplateSourceProjectId(project.id);
                                setTemplateName(`${project.title} Structure Template`);
                                setTemplateDesc(project.description || '');
                                setTemplateCategory(project.category);
                                setShowSaveAsTemplateModal(true);
                              }}
                              className="p-1 rounded-lg bg-[#16222F] text-purple-400 hover:text-purple-200 border border-[#233549] hover:border-purple-500/50"
                              title="Save Space Configuration as Reusable Template"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
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

                  {/* Space Roles & Permissions Summary Pill */}
                  <div className="mb-3 flex items-center justify-between text-[10px] font-mono bg-[#0D1520] p-2.5 rounded-xl border border-[#233549]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="font-bold">Space Roles:</span>
                      {(() => {
                        const rolesMap = project.memberRoles || {};
                        const membersList = project.members || [];
                        let admins = 0, editors = 0, viewers = 0;
                        users.forEach((u) => {
                          const isMem = membersList.includes(u.id);
                          const r = rolesMap[u.id] || (u.id === project.managerId ? 'Admin' : isMem ? 'Editor' : null);
                          if (r === 'Admin') admins++;
                          else if (r === 'Editor') editors++;
                          else if (r === 'Viewer') viewers++;
                        });
                        return (
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {admins} Admin
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              {editors} Editor
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {viewers} Viewer
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setConfiguringProject(project);
                        setActiveConfigTab('members');
                      }}
                      className="text-[#3BC0BB] hover:underline font-bold shrink-0 text-[11px]"
                    >
                      Manage Roles →
                    </button>
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
                    <PermissionGuard action="create_space">
                      <button
                        onClick={() => {
                          setTemplateSourceProjectId(project.id);
                          setTemplateName(`${project.title} Structure Template`);
                          setTemplateDesc(project.description || '');
                          setTemplateCategory(project.category);
                          setShowSaveAsTemplateModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-purple-500/20 text-purple-400 hover:text-purple-200 border border-[#233549] hover:border-purple-500/40 transition-all"
                        title="Save Space Configuration as Reusable Template"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGuard>
                    {(currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager') && (
                      <button
                        onClick={() => setConfiguringProject(project)}
                        className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#233549] text-slate-300 hover:text-white border border-[#233549] transition-all"
                        title="Configure Space & ClickApps"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <PermissionGuard action="delete_space">
                      <button
                        onClick={() => setDeleteConfirmProject(project)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all"
                        title="Delete Space / Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'table' && (
        <div className={`rounded-2xl border overflow-hidden shadow-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          {/* Table Subtab Navigation Header */}
          <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTableSubTab('spaces')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  tableSubTab === 'spaces'
                    ? 'bg-[#0773BB] text-white shadow-md'
                    : 'bg-[#16222F] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                <FolderKanban className="w-4 h-4 text-[#3BC0BB]" />
                <span>Spaces & Projects Table ({filteredProjects.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTableSubTab('users')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  tableSubTab === 'users'
                    ? 'bg-[#0773BB] text-white shadow-md'
                    : 'bg-[#16222F] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                <Users className="w-4 h-4 text-[#3BC0BB]" />
                <span>Workspace Users & Team Roster ({users.length})</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-[#16222F]/60 px-3 py-1.5 rounded-lg border border-[#233549]">
              <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>Real-Time Last Active Tracker</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {tableSubTab === 'spaces' ? (
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
                    <th className="p-3.5">Last Active</th>
                    <th className="p-3.5">Budget</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233549]/50 font-medium">
                  {filteredProjects.map((p) => {
                    const manager = users.find((u) => u.id === p.managerId);
                    const lastActiveInfo = manager ? getUserLastActive(manager, activityLogs) : { text: 'N/A', fullDate: 'Unassigned manager' };

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
                        <td className="p-3.5 font-mono text-slate-300">
                          <div className="flex items-center gap-1.5" title={`Manager Last Active: ${lastActiveInfo.fullDate}`}>
                            <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
                            <span>{lastActiveInfo.text}</span>
                          </div>
                        </td>
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
                            <PermissionGuard action="create_space">
                              <button
                                onClick={() => {
                                  setTemplateSourceProjectId(p.id);
                                  setTemplateName(`${p.title} Structure Template`);
                                  setTemplateDesc(p.description || '');
                                  setTemplateCategory(p.category);
                                  setShowSaveAsTemplateModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-[#0D1520] text-purple-400 hover:text-purple-200 border border-[#233549]"
                                title="Save Space as Template"
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                            </PermissionGuard>
                            {(currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager') && (
                              <button
                                onClick={() => setConfiguringProject(p)}
                                className="p-1.5 rounded-lg bg-[#0D1520] text-slate-300 border border-[#233549]"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className={`border-b font-mono font-bold uppercase tracking-wider text-[11px] ${
                  theme === 'light' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0D1520] text-slate-400 border-[#233549]'
                }`}>
                  <tr>
                    <th className="p-3.5">User Profile</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Entity</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Last Active</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233549]/50 font-medium">
                  {users.map((u) => {
                    const comp = companies.find((c) => c.id === u.companyId);
                    const lastActiveInfo = getUserLastActive(u, activityLogs);

                    return (
                      <tr key={u.id} className="hover:bg-[#0D1520]/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#0773BB]"
                            />
                            <div>
                              <div className="font-bold text-white text-xs">{u.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-extrabold border ${
                            u.role === 'Admin'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : u.role === 'Project Manager'
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                              : u.role === 'Team Member'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-300">{u.department}</td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                            <span>{comp?.logo || '🏢'}</span>
                            <span>{comp?.name || 'Dolphin Group'}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            u.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : u.status === 'In Meeting'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : u.status === 'On Leave'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                          }`}>
                            {u.status}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono">
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0D1520] border border-[#233549] text-teal-300 w-fit text-[11px] font-semibold"
                            title={`Last active on platform: ${lastActiveInfo.fullDate}`}
                          >
                            <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
                            <span>{lastActiveInfo.text}</span>
                          </div>
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setActiveTab('settings')}
                            className="px-2.5 py-1 rounded-lg bg-[#0D1520] hover:bg-[#233549] text-slate-300 hover:text-white border border-[#233549] text-[11px] font-bold transition-all"
                          >
                            Governance
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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

                    <PermissionGuard action="create_space">
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
                    </PermissionGuard>
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
                              onClick={() => {
                                setTemplateSourceProjectId(p.id);
                                setTemplateName(`${p.title} Structure Template`);
                                setTemplateDesc(p.description || '');
                                setTemplateCategory(p.category);
                                setShowSaveAsTemplateModal(true);
                              }}
                              className="p-1 rounded bg-[#0D1520] text-purple-400 hover:text-purple-200 border border-[#233549]"
                              title="Save Space as Template"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
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
              <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl space-y-1.5">
                <label className="block text-slate-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#3BC0BB]">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Space Creation Mode / Template Source</span>
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono">({projectTemplates?.length || 0} Templates Available)</span>
                </label>
                <select
                  value={selectedTemplateIdForNewSpace}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTemplateIdForNewSpace(val);
                    if (val !== 'blank') {
                      const tpl = projectTemplates.find((t) => t.id === val);
                      if (tpl) {
                        setNewTitle(`${tpl.name} Space`);
                        setNewDesc(tpl.description || '');
                        if (tpl.estimatedBudget) setNewBudget(tpl.estimatedBudget);
                        if (tpl.category) setNewCategory(tpl.category);
                      }
                    }
                  }}
                  className="w-full bg-[#16222F] border border-[#233549] rounded-lg px-3 py-2 text-white font-medium focus:border-purple-400"
                >
                  <option value="blank">✨ Blank Space (Empty Structure for Fresh Production Data)</option>
                  {projectTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      📋 Clone Template Structure: {tpl.name} ({tpl.tasks?.length || 0} tasks & dependencies)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 italic">
                  {selectedTemplateIdForNewSpace === 'blank'
                    ? 'Creates a clean, unpopulated Space structure ready for your production tasks and imports.'
                    : 'Pre-populates the new space with workflow tasks, day offsets, and dependencies from the selected template.'}
                </p>
              </div>

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
            <div className="flex items-center gap-2 border-b border-[#233549] pb-2 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveConfigTab('general')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeConfigTab === 'general' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                General Info
              </button>
              <button
                type="button"
                onClick={() => setActiveConfigTab('members')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeConfigTab === 'members' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Space Roles & Permissions</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveConfigTab('clickapps')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeConfigTab === 'clickapps' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ClickApps & Features
              </button>
              <button
                type="button"
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

              {activeConfigTab === 'members' && (
                <div className="space-y-4">
                  {/* Summary Banner */}
                  <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-[#3BC0BB]" />
                        <span>Space Access Control & Granular Permissions</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Assign 'Viewer' (Read-Only), 'Editor' (Create & Manage Tasks), or 'Admin' (Space Settings) roles.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono font-bold">
                      {(() => {
                        const rolesMap = configuringProject.memberRoles || {};
                        const membersList = configuringProject.members || [];
                        let adminCount = 0;
                        let editorCount = 0;
                        let viewerCount = 0;

                        users.forEach((u) => {
                          const isMem = membersList.includes(u.id);
                          const r = rolesMap[u.id] || (u.id === configuringProject.managerId ? 'Admin' : isMem ? 'Editor' : null);
                          if (r === 'Admin') adminCount++;
                          else if (r === 'Editor') editorCount++;
                          else if (r === 'Viewer') viewerCount++;
                        });

                        return (
                          <>
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {adminCount} Admins
                            </span>
                            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              {editorCount} Editors
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {viewerCount} Viewers
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Filter & Batch Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search team member name or email..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0D1520] border border-[#233549] text-white text-xs focus:outline-none focus:border-[#3BC0BB]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allUserIds = users.map((u) => u.id);
                          const newRoles: Record<string, SpaceRole> = { ...(configuringProject.memberRoles || {}) };
                          users.forEach((u) => {
                            if (!newRoles[u.id]) newRoles[u.id] = u.id === configuringProject.managerId ? 'Admin' : 'Editor';
                          });
                          setConfiguringProject({
                            ...configuringProject,
                            members: allUserIds,
                            memberRoles: newRoles
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] text-teal-400 font-bold text-[11px] transition-all"
                      >
                        Grant All Editors
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const allUserIds = users.map((u) => u.id);
                          const newRoles: Record<string, SpaceRole> = { ...(configuringProject.memberRoles || {}) };
                          users.forEach((u) => {
                            if (u.id !== configuringProject.managerId) {
                              newRoles[u.id] = 'Viewer';
                            } else {
                              newRoles[u.id] = 'Admin';
                            }
                          });
                          setConfiguringProject({
                            ...configuringProject,
                            members: allUserIds,
                            memberRoles: newRoles
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] text-amber-400 font-bold text-[11px] transition-all"
                      >
                        Grant All Viewers
                      </button>
                    </div>
                  </div>

                  {/* Members & Roles List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {users
                      .filter((u) =>
                        u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        u.department.toLowerCase().includes(memberSearchQuery.toLowerCase())
                      )
                      .map((u) => {
                        const membersList = configuringProject.members || [];
                        const rolesMap = configuringProject.memberRoles || {};
                        const isGranted = membersList.includes(u.id);
                        const isManager = u.id === configuringProject.managerId;
                        const currentRole: SpaceRole = rolesMap[u.id] || (isManager ? 'Admin' : isGranted ? 'Editor' : 'Viewer');
                        const lastActiveInfo = getUserLastActive(u, activityLogs);

                        const handleToggleAccess = (grant: boolean) => {
                          let updatedMembers = [...membersList];
                          let updatedRoles = { ...rolesMap };

                          if (grant) {
                            if (!updatedMembers.includes(u.id)) updatedMembers.push(u.id);
                            updatedRoles[u.id] = updatedRoles[u.id] || 'Editor';
                          } else {
                            if (isManager) return; // Cannot revoke manager
                            updatedMembers = updatedMembers.filter((id) => id !== u.id);
                            delete updatedRoles[u.id];
                          }

                          setConfiguringProject({
                            ...configuringProject,
                            members: updatedMembers,
                            memberRoles: updatedRoles
                          });
                        };

                        const handleRoleChange = (newRole: SpaceRole) => {
                          let updatedMembers = [...membersList];
                          if (!updatedMembers.includes(u.id)) updatedMembers.push(u.id);

                          const updatedRoles = {
                            ...rolesMap,
                            [u.id]: newRole
                          };

                          setConfiguringProject({
                            ...configuringProject,
                            members: updatedMembers,
                            memberRoles: updatedRoles
                          });
                        };

                        return (
                          <div
                            key={u.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                              isGranted
                                ? 'bg-[#0D1520] border-[#233549]'
                                : 'bg-[#0D1520]/40 border-[#233549]/50 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isGranted}
                                disabled={isManager}
                                onChange={(e) => handleToggleAccess(e.target.checked)}
                                className="rounded bg-[#16222F] border-[#233549] text-[#3BC0BB] focus:ring-0 cursor-pointer"
                              />

                              <img
                                src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-[#0773BB]"
                              />

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-xs">{u.name}</span>
                                  {isManager && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#0773BB]/30 text-[#3BC0BB] border border-[#0773BB]/40">
                                      Project Lead
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-mono">({u.department})</span>
                                </div>
                                <span className="text-[11px] text-slate-400 block">{u.email}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center">
                              {/* Last Active Badge */}
                              <div
                                className="px-2.5 py-1 rounded-xl bg-[#0D1520] border border-[#233549] text-teal-300 font-mono text-[11px] font-semibold flex items-center gap-1.5 shrink-0"
                                title={`Last active on platform: ${lastActiveInfo.fullDate}`}
                              >
                                <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
                                <span>{lastActiveInfo.text}</span>
                              </div>

                              {isGranted ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={currentRole}
                                    onChange={(e) => handleRoleChange(e.target.value as SpaceRole)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none transition-colors cursor-pointer ${
                                      currentRole === 'Admin'
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                                        : currentRole === 'Editor'
                                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 hover:bg-teal-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                                    }`}
                                  >
                                    <option value="Viewer" className="bg-[#16222F] text-amber-300 font-bold">
                                      Viewer (Read-Only)
                                    </option>
                                    <option value="Editor" className="bg-[#16222F] text-teal-300 font-bold">
                                      Editor (Create & Edit)
                                    </option>
                                    <option value="Admin" className="bg-[#16222F] text-purple-300 font-bold">
                                      Admin (Full Control)
                                    </option>
                                  </select>

                                  {/* Color-Coded Role Badge */}
                                  {currentRole === 'Admin' && (
                                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20 shrink-0">
                                      <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                      <span>Admin</span>
                                    </span>
                                  )}
                                  {currentRole === 'Editor' && (
                                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/40 shadow-sm shadow-teal-500/20 shrink-0">
                                      <Edit3 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                      <span>Editor</span>
                                    </span>
                                  )}
                                  {currentRole === 'Viewer' && (
                                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20 shrink-0">
                                      <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <span>Viewer</span>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 bg-slate-800/80 text-slate-400 border-slate-700/80 shrink-0">
                                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>No Access</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
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

      {/* 9. MODAL: SAVE SPACE AS REUSABLE TEMPLATE */}
      {showSaveAsTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-purple-500/40 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2.5 text-purple-400">
                <Bookmark className="w-5 h-5" />
                <h2 className="text-base font-bold text-white">Save Space as Reusable Template</h2>
              </div>
              <button onClick={() => setShowSaveAsTemplateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectAsTemplateSubmit} className="space-y-4 text-xs">
              {/* Save Mode Switcher: New vs Update Version */}
              <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2">
                <label className="block text-slate-300 font-bold mb-1">Template Saving Strategy:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateSaveMode('new');
                      setTargetTemplateId('');
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      templateSaveMode === 'new'
                        ? 'bg-purple-500/20 border-purple-500 text-white font-bold'
                        : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}
                  >
                    <Plus className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs text-white font-bold">New Template (v1.0)</span>
                      <span className="block text-[10px] text-slate-400">Create independent template</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTemplateSaveMode('update');
                      if (projectTemplates.length > 0 && !targetTemplateId) {
                        setTargetTemplateId(projectTemplates[0].id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      templateSaveMode === 'update'
                        ? 'bg-teal-500/20 border-[#3BC0BB] text-white font-bold'
                        : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}
                  >
                    <GitBranch className="w-4 h-4 text-[#3BC0BB] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs text-white font-bold">Version Update</span>
                      <span className="block text-[10px] text-slate-400">Bump existing template</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Source Space / Project *</label>
                <select
                  value={templateSourceProjectId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setTemplateSourceProjectId(pid);
                    const p = projects.find((proj) => proj.id === pid);
                    if (p && templateSaveMode === 'new') {
                      setTemplateName(`${p.title} Template`);
                      setTemplateDesc(p.description || '');
                      setTemplateCategory(p.category);
                    }
                  }}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-medium"
                >
                  <option value="">Select a Space to extract structure from...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {templateSaveMode === 'update' ? (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Template to Bump *</label>
                    <select
                      value={targetTemplateId}
                      onChange={(e) => {
                        const tId = e.target.value;
                        setTargetTemplateId(tId);
                        const targetTpl = projectTemplates.find((t) => t.id === tId);
                        if (targetTpl) {
                          setTemplateName(targetTpl.name);
                          setTemplateDesc(targetTpl.description);
                          setTemplateCategory(targetTpl.category);
                        }
                      }}
                      className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value="">Select existing template...</option>
                      {projectTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Current: {t.version || 'v1.0'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Version Release Increment *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                          versionIncrement === 'minor'
                            ? 'bg-purple-500/20 border-purple-500 text-white font-bold'
                            : 'bg-[#0D1520] border-[#233549] text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="versionBump"
                          checked={versionIncrement === 'minor'}
                          onChange={() => setVersionIncrement('minor')}
                          className="hidden"
                        />
                        <div>
                          <span className="block text-xs font-mono font-bold text-purple-300">Minor Release</span>
                          <span className="block text-[10px] text-slate-400">Routine structure adjustments</span>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                          versionIncrement === 'major'
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                            : 'bg-[#0D1520] border-[#233549] text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="versionBump"
                          checked={versionIncrement === 'major'}
                          onChange={() => setVersionIncrement('major')}
                          className="hidden"
                        />
                        <div>
                          <span className="block text-xs font-mono font-bold text-amber-300">Major Revamp</span>
                          <span className="block text-[10px] text-slate-400">Substantial process overhaul</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Turnkey Industrial HVAC Workflow Template"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category / Domain</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value as Project['category'])}
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
                  <label className="block text-slate-300 font-semibold mb-1">Structure Preservation</label>
                  <div className="p-2 bg-[#0D1520] border border-[#233549] rounded-xl text-[11px] text-teal-300 font-mono">
                    {(() => {
                      const projTasks = tasks.filter((t) => t.projectId === templateSourceProjectId);
                      return `${projTasks.length} Tasks & Dependencies Extracted`;
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Version Release Change Note / Summary *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Added HVAC pipe isolation checklist, adjusted thermal load offset days by +3..."
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Template Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the operational scope, milestone sequences, and target deliverable benchmarks..."
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-200 leading-relaxed">
                ✨ <span className="font-bold">Template Versioning Engine:</span> Version snapshots automatically archive previous task states, predecessor linkages, and timeline offsets so teams can review or rollback structures anytime.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowSaveAsTemplateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!templateSourceProjectId || (templateSaveMode === 'update' && !targetTemplateId)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {templateSaveMode === 'update' ? 'Publish Version Update' : 'Save to Template Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: TEMPLATES LIBRARY */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-4xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Space & Workspace Reusable Templates</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-xs font-bold">
                  {projectTemplates.length} Available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCompareInitialAId(projectTemplates[0]?.id);
                    setCompareInitialBId(projectTemplates[1]?.id || projectTemplates[0]?.id);
                    setShowCompareModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Compare two templates side-by-side"
                >
                  <Columns className="w-3.5 h-3.5 text-purple-400" />
                  <span>Compare Templates</span>
                </button>
                <button onClick={() => setShowTemplatesModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {templateNotification && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{templateNotification}</span>
              </div>
            )}

            <p className="text-xs text-slate-300 shrink-0">
              Select any pre-configured structure below to clone an empty project or instantiate complete operational spaces for new project starts.
            </p>

            <div className="overflow-y-auto space-y-3.5 pr-1 flex-1">
              {projectTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] hover:border-purple-500/50 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#233549]/60 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{tpl.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                          {tpl.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-[#3BC0BB]/40 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[#3BC0BB]" />
                          {tpl.version || 'v1.0'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => {
                          setSelectedTemplateForPreview(tpl);
                          setPreviewTab('tasks');
                          setShowPreviewModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#16222F] hover:bg-teal-500/20 text-[#3BC0BB] border border-[#233549] hover:border-[#3BC0BB]/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        title="Preview Template Structure Thumbnail & Timeline"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#3BC0BB]" />
                        <span>Preview Structure</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTemplateForPreview(tpl);
                          setShowD3Modal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#16222F] hover:bg-indigo-500/20 text-indigo-300 border border-[#233549] hover:border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        title="Render Interactive D3.js Force & Layered DAG Graph"
                      >
                        <Network className="w-3.5 h-3.5 text-indigo-400" />
                        <span>D3 Graph</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTemplateForPreview(tpl);
                          setPreviewTab('dependencies');
                          setSelectedDependencyNodeId(null);
                          setShowPreviewModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#16222F] hover:bg-purple-500/20 text-purple-300 border border-[#233549] hover:border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        title="View Interactive Visual Dependency Map of Linked Tasks"
                      >
                        <Workflow className="w-3.5 h-3.5 text-purple-400" />
                        <span>Dependency Map ({tpl.dependencies?.length || 0})</span>
                      </button>

                      <button
                        onClick={() => {
                          setCompareInitialAId(tpl.id);
                          const other = projectTemplates.find(t => t.id !== tpl.id);
                          setCompareInitialBId(other?.id || tpl.id);
                          setShowCompareModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#16222F] hover:bg-amber-500/20 text-amber-300 border border-[#233549] hover:border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        title="Compare this template side-by-side with another"
                      >
                        <Columns className="w-3.5 h-3.5 text-amber-400" />
                        <span>Compare</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTemplateForHistory(tpl);
                          setShowVersionHistoryModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#16222F] hover:bg-purple-500/20 text-purple-300 border border-[#233549] hover:border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        title="View Version History & Restore Previous Snapshots"
                      >
                        <History className="w-3.5 h-3.5 text-purple-400" />
                        <span>History ({tpl.versionHistory?.length || 1})</span>
                      </button>

                      <PermissionGuard action="create_space">
                        <button
                          onClick={() => {
                            setSelectedTemplateForInstantiate(tpl);
                            setSelectedVersionRecordIdForInstantiate('');
                            setInstantiateTitle(`${tpl.name} Project`);
                            setInstantiateCode(`CL-${Math.floor(100 + Math.random() * 900)}`);
                            setInstantiateDescription(tpl.description);
                            setInstantiateBudget(tpl.estimatedBudget || 250000);
                            setInstantiateBlankSpace(false);
                            setShowInstantiateModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Instantiate / Clone Space</span>
                        </button>
                      </PermissionGuard>

                      {tpl.tags?.includes('Custom Template') && (
                        <PermissionGuard action="delete_space">
                          <button
                            onClick={() => deleteProjectTemplate(tpl.id)}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-xs transition-all"
                            title="Delete Custom Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </PermissionGuard>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-[#16222F] border border-[#233549] text-slate-300">
                      <span className="text-slate-400 block text-[10px]">Structure Tasks:</span>
                      <span className="text-white font-bold">{tpl.tasks?.length || 0} Tasks</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#16222F] border border-[#233549] text-slate-300">
                      <span className="text-slate-400 block text-[10px]">Dependencies:</span>
                      <span className="text-teal-300 font-bold">{tpl.dependencies?.length || 0} Linkages</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#16222F] border border-[#233549] text-slate-300">
                      <span className="text-slate-400 block text-[10px]">Est Duration:</span>
                      <span className="text-purple-300 font-bold">{tpl.estimatedDurationDays || 30} Days</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#16222F] border border-[#233549] text-slate-300">
                      <span className="text-slate-400 block text-[10px]">Est Budget:</span>
                      <span className="text-emerald-400 font-bold">${(tpl.estimatedBudget || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#233549] flex items-center justify-between shrink-0 text-xs">
              <button
                onClick={() => {
                  if (projects[0]) {
                    setTemplateSourceProjectId(projects[0].id);
                    setTemplateName(`${projects[0].title} Structure Template`);
                    setTemplateDesc(projects[0].description || '');
                    setTemplateCategory(projects[0].category);
                    setShowSaveAsTemplateModal(true);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0D1520] hover:bg-[#16222F] border border-[#233549] text-purple-300 font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Save Current Space as Template</span>
              </button>

              <button
                onClick={() => setShowTemplatesModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL: INSTANTIATE / CLONE SPACE FROM TEMPLATE */}
      {showInstantiateModal && selectedTemplateForInstantiate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2.5">
                <Copy className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-base font-bold text-white">Instantiate Space from Template</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-purple-300 font-mono">Template: {selectedTemplateForInstantiate.name}</p>
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
                      {selectedTemplateForInstantiate.version || 'v1.0'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowInstantiateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInstantiateProjectTemplateSubmit} className="space-y-4 text-xs">
              {/* Target Version Selector */}
              {selectedTemplateForInstantiate.versionHistory && selectedTemplateForInstantiate.versionHistory.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Template Version Snapshot</label>
                  <select
                    value={selectedVersionRecordIdForInstantiate}
                    onChange={(e) => setSelectedVersionRecordIdForInstantiate(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono"
                  >
                    <option value="">Latest Version ({selectedTemplateForInstantiate.version || 'v1.0'} - Active)</option>
                    {selectedTemplateForInstantiate.versionHistory.map((vr) => (
                      <option key={vr.id} value={vr.id}>
                        {vr.version} - {vr.changeSummary} ({new Date(vr.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Space Data Mode Option */}
              <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2">
                <span className="block text-slate-300 font-bold">Space Content Mode:</span>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                      !instantiateBlankSpace
                        ? 'bg-purple-500/20 border-purple-500 text-white font-bold'
                        : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="spaceMode"
                      checked={!instantiateBlankSpace}
                      onChange={() => setInstantiateBlankSpace(false)}
                      className="hidden"
                    />
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="block text-xs">Clone Template Tasks</span>
                      <span className="block text-[10px] text-slate-400">
                        {(() => {
                          if (selectedVersionRecordIdForInstantiate && selectedTemplateForInstantiate.versionHistory) {
                            const vr = selectedTemplateForInstantiate.versionHistory.find((r) => r.id === selectedVersionRecordIdForInstantiate);
                            return `${vr?.tasksCount || selectedTemplateForInstantiate.tasks?.length || 0} version tasks`;
                          }
                          return `${selectedTemplateForInstantiate.tasks?.length || 0} sample tasks`;
                        })()}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                      instantiateBlankSpace
                        ? 'bg-teal-500/20 border-[#3BC0BB] text-white font-bold'
                        : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="spaceMode"
                      checked={instantiateBlankSpace}
                      onChange={() => setInstantiateBlankSpace(true)}
                      className="hidden"
                    />
                    <FolderKanban className="w-4 h-4 text-[#3BC0BB] shrink-0" />
                    <div>
                      <span className="block text-xs">Blank Space (Clean)</span>
                      <span className="block text-[10px] text-slate-400">0 tasks (Production Data)</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Space / Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ras Al Khaimah Plant Expansion"
                  value={instantiateTitle}
                  onChange={(e) => setInstantiateTitle(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Workspace Entity</label>
                  <select
                    value={instantiateCompanyId}
                    onChange={(e) => setInstantiateCompanyId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Manager</label>
                  <select
                    value={instantiateManagerId}
                    onChange={(e) => setInstantiateManagerId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Deliverables Scope</label>
                <textarea
                  rows={2}
                  value={instantiateDescription}
                  onChange={(e) => setInstantiateDescription(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Inline Structure Thumbnail Preview Toggle */}
              {!instantiateBlankSpace && (
                <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#3BC0BB]" />
                      <span className="text-xs font-bold text-white">Template Structure Thumbnail Preview</span>
                      <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-[#3BC0BB]/40 text-[10px] font-mono">
                        {selectedTemplateForInstantiate.tasks?.length || 0} Tasks
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInlineStructurePreview(!showInlineStructurePreview)}
                      className="text-xs text-purple-300 hover:text-white underline font-medium flex items-center gap-1"
                    >
                      {showInlineStructurePreview ? 'Hide Thumbnail Preview' : 'Show Thumbnail Preview'}
                    </button>
                  </div>

                  {showInlineStructurePreview && (
                    <div className="pt-2 border-t border-[#233549] space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                        <div className="p-2 rounded bg-[#16222F] border border-[#233549]">
                          <span className="text-slate-400 block">Total Workload:</span>
                          <span className="text-white font-bold">
                            {cleanupRules.resetEstimatedHours ? '0 hrs (Reset)' : `${selectedTemplateForInstantiate.tasks?.reduce((acc, t) => acc + (t.estimatedHours || 10), 0) || 0} hrs`}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-[#16222F] border border-[#233549]">
                          <span className="text-slate-400 block">Dependencies:</span>
                          <span className="text-teal-300 font-bold">
                            {cleanupRules.clearDependencies ? '0 (Cleared)' : `${selectedTemplateForInstantiate.dependencies?.length || 0} Linkages`}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-[#16222F] border border-[#233549]">
                          <span className="text-slate-400 block">Initial Status:</span>
                          <span className="text-emerald-400 font-bold">
                            {cleanupRules.resetTaskStatuses ? 'All To Do' : 'Preserved'}
                          </span>
                        </div>
                      </div>

                      {/* Mini Gantt / Task Breakdown List */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedTemplateForInstantiate.tasks?.map((t, idx) => {
                          const totalDays = selectedTemplateForInstantiate.estimatedDurationDays || 30;
                          const offsetPercent = Math.min(100, Math.max(0, ((t.dayOffset || 0) / totalDays) * 100));
                          const widthPercent = Math.min(100 - offsetPercent, Math.max(10, ((t.durationDays || 5) / totalDays) * 100));

                          return (
                            <div key={t.tempId || idx} className="p-2 rounded-lg bg-[#16222F] border border-[#233549] text-xs space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-slate-200 truncate">{t.title}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                    t.priority === 'High' || t.priority === 'Urgent'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : t.priority === 'Medium'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  }`}>
                                    {t.priority || 'Medium'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0">
                                  <span>Day +{t.dayOffset || 0}</span>
                                  <span>{t.durationDays || 5}d</span>
                                </div>
                              </div>

                              {/* Thumbnail Gantt Bar */}
                              <div className="w-full bg-[#0D1520] h-1.5 rounded-full overflow-hidden relative">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-teal-400 rounded-full"
                                  style={{ marginLeft: `${offsetPercent}%`, width: `${widthPercent}%` }}
                                />
                              </div>

                              {/* Subtasks summary */}
                              {t.subtasks && t.subtasks.length > 0 && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 pl-1">
                                  <span className="text-purple-400 font-bold">• {t.subtasks.length} subtasks</span>
                                  {cleanupRules.resetSubtasksCompletion && (
                                    <span className="text-teal-300 font-mono text-[9px]">(Reset to incomplete)</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cleanup Rules Panel */}
              {!instantiateBlankSpace && (
                <div className="p-3.5 bg-[#0D1520] border border-[#233549] rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#233549] pb-2">
                    <div className="flex items-center gap-2">
                      <Eraser className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-white">Template Spawning Cleanup Rules</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setCleanupRules({
                          clearAssignments: true,
                          resetTaskStatuses: true,
                          resetSubtasksCompletion: true,
                          clearCustomTags: false,
                          clearDependencies: false,
                          resetEstimatedHours: false,
                          clearDescriptionNotes: false,
                        })}
                        className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-mono transition-all"
                      >
                        Fresh Slate
                      </button>
                      <button
                        type="button"
                        onClick={() => setCleanupRules({
                          clearAssignments: true,
                          resetTaskStatuses: true,
                          resetSubtasksCompletion: true,
                          clearCustomTags: true,
                          clearDependencies: true,
                          resetEstimatedHours: true,
                          clearDescriptionNotes: true,
                        })}
                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-mono transition-all"
                      >
                        Full Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setCleanupRules({
                          clearAssignments: false,
                          resetTaskStatuses: false,
                          resetSubtasksCompletion: false,
                          clearCustomTags: false,
                          clearDependencies: false,
                          resetEstimatedHours: false,
                          clearDescriptionNotes: false,
                        })}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-all"
                      >
                        Preserve All
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal">
                    Automated data transformation rules applied to tasks and subtasks copied from the template:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Clear Assignments */}
                    <label className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                      cleanupRules.clearAssignments ? 'bg-amber-500/10 border-amber-500/50 text-white' : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!cleanupRules.clearAssignments}
                        onChange={(e) => setCleanupRules(prev => ({ ...prev, clearAssignments: e.target.checked }))}
                        className="mt-0.5 rounded bg-[#0D1520] border-[#233549] text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <UserX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Clear Assignment Data</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                          Unassign assignees (leave tasks unassigned)
                        </span>
                      </div>
                    </label>

                    {/* Reset Task Statuses */}
                    <label className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                      cleanupRules.resetTaskStatuses ? 'bg-emerald-500/10 border-emerald-500/50 text-white' : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!cleanupRules.resetTaskStatuses}
                        onChange={(e) => setCleanupRules(prev => ({ ...prev, resetTaskStatuses: e.target.checked }))}
                        className="mt-0.5 rounded bg-[#0D1520] border-[#233549] text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Reset Task Statuses</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                          Set status to 'To Do' & zero logged hours
                        </span>
                      </div>
                    </label>

                    {/* Reset Subtasks */}
                    <label className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                      cleanupRules.resetSubtasksCompletion ? 'bg-teal-500/10 border-[#3BC0BB]/50 text-white' : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!cleanupRules.resetSubtasksCompletion}
                        onChange={(e) => setCleanupRules(prev => ({ ...prev, resetSubtasksCompletion: e.target.checked }))}
                        className="mt-0.5 rounded bg-[#0D1520] border-[#233549] text-[#3BC0BB] focus:ring-[#3BC0BB]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <RotateCcw className="w-3.5 h-3.5 text-[#3BC0BB] shrink-0" />
                          <span>Uncheck Subtasks</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                          Reset subtask checkboxes back to incomplete
                        </span>
                      </div>
                    </label>

                    {/* Strip Custom Tags */}
                    <label className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                      cleanupRules.clearCustomTags ? 'bg-purple-500/10 border-purple-500/50 text-white' : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!cleanupRules.clearCustomTags}
                        onChange={(e) => setCleanupRules(prev => ({ ...prev, clearCustomTags: e.target.checked }))}
                        className="mt-0.5 rounded bg-[#0D1520] border-[#233549] text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <Tag className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>Strip Custom Tags</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                          Clear labels and tags attached to tasks
                        </span>
                      </div>
                    </label>

                    {/* Remove Predecessor Dependencies */}
                    <label className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                      cleanupRules.clearDependencies ? 'bg-rose-500/10 border-rose-500/50 text-white' : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!cleanupRules.clearDependencies}
                        onChange={(e) => setCleanupRules(prev => ({ ...prev, clearDependencies: e.target.checked }))}
                        className="mt-0.5 rounded bg-[#0D1520] border-[#233549] text-rose-500 focus:ring-rose-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <Link2Off className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Remove Dependencies</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                          Remove finish-to-start predecessor linkages
                        </span>
                      </div>
                    </label>

                    {/* Reset Estimated Hours */}
                    <label className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                      cleanupRules.resetEstimatedHours ? 'bg-cyan-500/10 border-cyan-500/50 text-white' : 'bg-[#16222F] border-[#233549] text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!cleanupRules.resetEstimatedHours}
                        onChange={(e) => setCleanupRules(prev => ({ ...prev, resetEstimatedHours: e.target.checked }))}
                        className="mt-0.5 rounded bg-[#0D1520] border-[#233549] text-cyan-500 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Reset Estimated Hours</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                          Set task estimated effort hours to 0
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowInstantiateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white font-bold shadow-lg"
                >
                  Create & Instantiate Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. MODAL: TEMPLATE VERSION HISTORY & ROLLBACK */}
      {showVersionHistoryModal && selectedTemplateForHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-base font-bold text-white">Template Version History & Rollback Log</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-medium">{selectedTemplateForHistory.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-[#3BC0BB]/40 font-mono text-[10px] font-bold">
                      Active: {selectedTemplateForHistory.version || 'v1.0'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowVersionHistoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-200 leading-relaxed shrink-0">
              📜 <span className="font-bold">Version Control Log:</span> Every saved update creates an immutable snapshot of tasks, subtasks, and dependency graphs. Restoring a version creates an automatic snapshot of your current state before rolling back.
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {/* Active / Latest Version State */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border-2 border-purple-500/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500 text-white font-mono text-xs font-bold">
                      {selectedTemplateForHistory.version || 'v1.0'} (Current Active)
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{selectedTemplateForHistory.name}</span>
                  </div>
                  <span className="text-[11px] text-purple-300 font-mono">Active Production Template</span>
                </div>
                <p className="text-xs text-slate-300">{selectedTemplateForHistory.description}</p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1 border-t border-purple-500/20">
                  <span>Tasks: {selectedTemplateForHistory.tasks?.length || 0}</span>
                  <span>Dependencies: {selectedTemplateForHistory.dependencies?.length || 0}</span>
                  <span>Duration: {selectedTemplateForHistory.estimatedDurationDays || 30} days</span>
                  <span>Budget: ${(selectedTemplateForHistory.estimatedBudget || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Version History List */}
              {selectedTemplateForHistory.versionHistory && selectedTemplateForHistory.versionHistory.length > 0 ? (
                selectedTemplateForHistory.versionHistory.map((vr) => (
                  <div
                    key={vr.id}
                    className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] hover:border-purple-500/40 transition-all space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#233549]/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-[#3BC0BB]/40 font-mono text-xs font-bold">
                          {vr.version}
                        </span>
                        <span className="text-xs font-bold text-white">{vr.changeSummary || 'Version Snapshot'}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedTemplateForInstantiate(selectedTemplateForHistory);
                            setSelectedVersionRecordIdForInstantiate(vr.id);
                            setInstantiateTitle(`${selectedTemplateForHistory.name} (${vr.version}) Project`);
                            setInstantiateCode(`CL-${Math.floor(100 + Math.random() * 900)}`);
                            setInstantiateDescription(vr.description || selectedTemplateForHistory.description);
                            setInstantiateBudget(vr.estimatedBudget || 250000);
                            setInstantiateBlankSpace(false);
                            setShowVersionHistoryModal(false);
                            setShowInstantiateModal(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Instantiate Version</span>
                        </button>

                        <button
                          onClick={() => {
                            rollbackTemplateVersion(selectedTemplateForHistory.id, vr.id);
                            const updated = projectTemplates.find((t) => t.id === selectedTemplateForHistory.id);
                            if (updated) {
                              setSelectedTemplateForHistory({ ...updated });
                            }
                            setTemplateNotification(`Template successfully rolled back to version snapshot ${vr.version}!`);
                            setTimeout(() => setTemplateNotification(null), 4000);
                          }}
                          className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                          title="Restore this historical version as active template state"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rollback / Restore</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center gap-3">
                      <span className="text-slate-400">Created by <strong className="text-white">{vr.createdBy || 'Workspace Admin'}</strong></span>
                      <span className="text-slate-500">•</span>
                      <span className="font-mono text-slate-400">{new Date(vr.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                      <div className="p-1.5 rounded-lg bg-[#16222F] border border-[#233549] text-slate-300">
                        <span className="text-slate-400 block text-[10px]">Tasks Count:</span>
                        <span className="text-white font-bold">{vr.tasksCount} Tasks</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#16222F] border border-[#233549] text-slate-300">
                        <span className="text-slate-400 block text-[10px]">Dependencies:</span>
                        <span className="text-teal-300 font-bold">{vr.dependenciesCount} Linkages</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#16222F] border border-[#233549] text-slate-300">
                        <span className="text-slate-400 block text-[10px]">Est Duration:</span>
                        <span className="text-purple-300 font-bold">{vr.estimatedDurationDays} Days</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#16222F] border border-[#233549] text-slate-300">
                        <span className="text-slate-400 block text-[10px]">Est Budget:</span>
                        <span className="text-emerald-400 font-bold">${vr.estimatedBudget.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-[#0D1520] border border-[#233549] rounded-xl text-slate-400 text-xs">
                  No historical version records available yet. Any new version save will populate the historical changelog.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#233549] flex items-center justify-between shrink-0 text-xs">
              <span className="text-slate-400 text-[11px]">
                Showing version history for <strong className="text-white">{selectedTemplateForHistory.name}</strong>
              </span>

              <button
                onClick={() => setShowVersionHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. MODAL: TEMPLATE STRUCTURE THUMBNAIL PREVIEW */}
      {showPreviewModal && selectedTemplateForPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-4xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#233549] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-[#3BC0BB]/30 text-[#3BC0BB]">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Template Structure Thumbnail Preview</h2>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-xs font-semibold text-slate-300">{selectedTemplateForPreview.name}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                      {selectedTemplateForPreview.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-[#3BC0BB]/40 text-[10px] font-mono font-bold">
                      {selectedTemplateForPreview.version || 'v1.0'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Structure Summary Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono shrink-0">
              <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549]">
                <span className="text-slate-400 block text-[10px]">Total Template Tasks:</span>
                <span className="text-white font-bold text-base">{selectedTemplateForPreview.tasks?.length || 0} Tasks</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549]">
                <span className="text-slate-400 block text-[10px]">Dependency Linkages:</span>
                <span className="text-teal-300 font-bold text-base">{selectedTemplateForPreview.dependencies?.length || 0} Linkages</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549]">
                <span className="text-slate-400 block text-[10px]">Estimated Duration:</span>
                <span className="text-purple-300 font-bold text-base">{selectedTemplateForPreview.estimatedDurationDays || 30} Days</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549]">
                <span className="text-slate-400 block text-[10px]">Baseline Budget:</span>
                <span className="text-emerald-400 font-bold text-base">${(selectedTemplateForPreview.estimatedBudget || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-2 border-b border-[#233549] pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewTab('tasks')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewTab === 'tasks'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                <ListTodo className="w-4 h-4" />
                <span>Task & Subtask Breakdown</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('timeline')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewTab === 'timeline'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Timeline Gantt Thumbnail</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('dependencies')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewTab === 'dependencies'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white border border-[#233549]'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                <span>Predecessor Dependencies ({selectedTemplateForPreview.dependencies?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setShowD3Modal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 ml-auto"
                title="Launch full-screen D3 force-directed and layered graph modal"
              >
                <Network className="w-4 h-4 text-indigo-400" />
                <span>Interactive D3 Graph ➔</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto pr-1 flex-1 space-y-3">
              {previewTab === 'tasks' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Showing structure tasks, sequence day offsets, effort estimates, and embedded subtask checklists:
                  </p>

                  <div className="space-y-2.5">
                    {selectedTemplateForPreview.tasks?.map((t, idx) => (
                      <div
                        key={t.tempId || idx}
                        className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] hover:border-purple-500/40 transition-all space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#233549]/60 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold flex items-center justify-center border border-purple-500/30 shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-white">{t.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.priority === 'High' || t.priority === 'Urgent'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : t.priority === 'Medium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {t.priority || 'Medium'} Priority
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono text-slate-300 shrink-0">
                            <span className="px-2 py-0.5 rounded bg-[#16222F] border border-[#233549] text-teal-300">
                              Day Offset: +{t.dayOffset || 0}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#16222F] border border-[#233549] text-purple-300">
                              Duration: {t.durationDays || 5} Days
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#16222F] border border-[#233549] text-emerald-400">
                              Est Effort: {t.estimatedHours || 10} hrs
                            </span>
                          </div>
                        </div>

                        {t.description && (
                          <p className="text-xs text-slate-300 leading-relaxed">{t.description}</p>
                        )}

                        {/* Subtasks */}
                        {t.subtasks && t.subtasks.length > 0 && (
                          <div className="pt-2 border-t border-[#233549]/40 space-y-1.5">
                            <span className="text-[11px] font-bold text-purple-300 block">Subtasks ({t.subtasks.length}):</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                              {t.subtasks.map((st, stIdx) => (
                                <div key={stIdx} className="text-xs text-slate-300 flex items-center gap-2 bg-[#16222F] p-1.5 rounded-lg border border-[#233549]/60">
                                  <div className="w-3.5 h-3.5 rounded border border-[#233549] bg-[#0D1520] shrink-0" />
                                  <span className="truncate">{st}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                            {t.tags.map((tg, tgIdx) => (
                              <span key={tgIdx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                                #{tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl text-xs text-slate-300 flex items-center justify-between">
                    <span>
                      📅 <strong className="text-white">Gantt Thumbnail Axis:</strong> Relative schedule from Day 0 to Day {selectedTemplateForPreview.estimatedDurationDays || 30}
                    </span>
                    <span className="text-teal-300 font-mono font-bold text-[11px]">
                      {selectedTemplateForPreview.tasks?.length || 0} Scheduled Bands
                    </span>
                  </div>

                  <div className="space-y-3 p-4 bg-[#0D1520] border border-[#233549] rounded-xl">
                    {/* Gantt Header Axis */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-[#233549] pb-2">
                      <span>Day 0 (Start)</span>
                      <span>Day {Math.round((selectedTemplateForPreview.estimatedDurationDays || 30) / 2)}</span>
                      <span>Day {selectedTemplateForPreview.estimatedDurationDays || 30} (Finish)</span>
                    </div>

                    {/* Task Timeline Bars */}
                    <div className="space-y-2.5">
                      {selectedTemplateForPreview.tasks?.map((t, idx) => {
                        const totalDays = selectedTemplateForPreview.estimatedDurationDays || 30;
                        const offsetPercent = Math.min(100, Math.max(0, ((t.dayOffset || 0) / totalDays) * 100));
                        const widthPercent = Math.min(100 - offsetPercent, Math.max(8, ((t.durationDays || 5) / totalDays) * 100));

                        return (
                          <div key={t.tempId || idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-200 truncate max-w-[250px]">
                                {idx + 1}. {t.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Day +{t.dayOffset || 0} → Day +{(t.dayOffset || 0) + (t.durationDays || 5)} ({t.durationDays || 5}d)
                              </span>
                            </div>

                            <div className="w-full bg-[#16222F] h-3.5 rounded-lg overflow-hidden relative border border-[#233549]">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 via-teal-400 to-emerald-400 rounded-lg flex items-center px-2 text-[9px] font-bold text-slate-900 shadow-sm"
                                style={{ marginLeft: `${offsetPercent}%`, width: `${widthPercent}%` }}
                              >
                                {t.title}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {previewTab === 'dependencies' && (
                <div className="space-y-4">
                  {/* Dependency Map Toolbar & View Switcher */}
                  <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">Template Dependency Map Visualizer</span>
                        <span className="text-[11px] text-slate-400">
                          {selectedTemplateForPreview.tasks?.length || 0} Tasks • {selectedTemplateForPreview.dependencies?.length || 0} Predecessor Linkages
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-[#16222F] border border-[#233549] rounded-xl text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => setDepMapViewMode('flow')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-semibold ${
                          depMapViewMode === 'flow'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Workflow className="w-3.5 h-3.5" />
                        <span>Flow Diagram</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepMapViewMode('chain')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-semibold ${
                          depMapViewMode === 'chain'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Execution Chains</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepMapViewMode('cards')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-semibold ${
                          depMapViewMode === 'cards'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Linkage Matrix</span>
                      </button>
                    </div>
                  </div>

                  {/* Selected Node Focus Inspector Banner */}
                  {selectedDependencyNodeId && (() => {
                    const selectedTask = selectedTemplateForPreview.tasks?.find((t) => t.tempId === selectedDependencyNodeId);
                    const incomingDeps = selectedTemplateForPreview.dependencies?.filter((d) => d.taskTempId === selectedDependencyNodeId) || [];
                    const outgoingDeps = selectedTemplateForPreview.dependencies?.filter((d) => d.dependsOnTaskTempId === selectedDependencyNodeId) || [];

                    return (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/40 rounded-xl space-y-2 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                            <span className="font-bold text-white">Focus Inspector: {selectedTask?.title || selectedDependencyNodeId}</span>
                            <span className="px-2 py-0.2 rounded bg-purple-500/30 text-purple-200 text-[10px] font-mono">
                              Day +{selectedTask?.dayOffset || 0} ({selectedTask?.durationDays || 5}d)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDependencyNodeId(null)}
                            className="text-slate-400 hover:text-white text-[11px] underline flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Clear Focus</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-[#0D1520] border border-amber-500/30 space-y-1">
                            <span className="text-amber-400 font-bold block">⬅ Predecessors (Must finish before this):</span>
                            {incomingDeps.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {incomingDeps.map((d, idx) => {
                                  const predTask = selectedTemplateForPreview.tasks?.find((t) => t.tempId === d.dependsOnTaskTempId);
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedDependencyNodeId(d.dependsOnTaskTempId)}
                                      className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all text-[10px] font-medium"
                                    >
                                      {predTask?.title || d.dependsOnTaskTempId}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">None (Root Task)</span>
                            )}
                          </div>

                          <div className="p-2 rounded-lg bg-[#0D1520] border border-teal-500/30 space-y-1">
                            <span className="text-teal-300 font-bold block">➔ Successors (Depend on this task):</span>
                            {outgoingDeps.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {outgoingDeps.map((d, idx) => {
                                  const succTask = selectedTemplateForPreview.tasks?.find((t) => t.tempId === d.taskTempId);
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedDependencyNodeId(d.taskTempId)}
                                      className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition-all text-[10px] font-medium"
                                    >
                                      {succTask?.title || d.taskTempId}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">None (Terminal Leaf Task)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* MODE 1: VISUAL FLOW DIAGRAM */}
                  {depMapViewMode === 'flow' && (() => {
                    const tasks = selectedTemplateForPreview.tasks || [];
                    const deps = selectedTemplateForPreview.dependencies || [];

                    // Group tasks by execution stages (Stage 1: Day 0, Stage 2: Mid, Stage 3: Late)
                    const stage1Tasks = tasks.filter((t) => (t.dayOffset || 0) <= 0);
                    const stage2Tasks = tasks.filter((t) => (t.dayOffset || 0) > 0 && (t.dayOffset || 0) <= 10);
                    const stage3Tasks = tasks.filter((t) => (t.dayOffset || 0) > 10);

                    const stages = [
                      { title: 'Stage 1: Kickoff & Prerequisites', sub: 'Day +0 Start', tasks: stage1Tasks.length > 0 ? stage1Tasks : tasks.slice(0, Math.ceil(tasks.length / 3)) },
                      { title: 'Stage 2: Core Execution & Dev', sub: 'Day +1 to +10', tasks: stage2Tasks.length > 0 ? stage2Tasks : tasks.slice(Math.ceil(tasks.length / 3), Math.ceil((tasks.length * 2) / 3)) },
                      { title: 'Stage 3: Validation & Launch', sub: 'Day +10+ Finish', tasks: stage3Tasks.length > 0 ? stage3Tasks : tasks.slice(Math.ceil((tasks.length * 2) / 3)) }
                    ];

                    return (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400">
                          Click any task node to inspect predecessor linkages and trace dependency flow:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {stages.map((stg, stgIdx) => (
                            <div key={stgIdx} className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl space-y-3 flex flex-col">
                              <div className="border-b border-[#233549] pb-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white">{stg.title}</span>
                                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono">
                                    {stg.tasks.length} Nodes
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{stg.sub}</span>
                              </div>

                              <div className="space-y-2 flex-1">
                                {stg.tasks.map((t, tIdx) => {
                                  const isSelected = selectedDependencyNodeId === t.tempId;
                                  const isPredecessor = selectedDependencyNodeId
                                    ? deps.some((d) => d.taskTempId === selectedDependencyNodeId && d.dependsOnTaskTempId === t.tempId)
                                    : false;
                                  const isSuccessor = selectedDependencyNodeId
                                    ? deps.some((d) => d.dependsOnTaskTempId === selectedDependencyNodeId && d.taskTempId === t.tempId)
                                    : false;

                                  const incomingCount = deps.filter((d) => d.taskTempId === t.tempId).length;
                                  const outgoingCount = deps.filter((d) => d.dependsOnTaskTempId === t.tempId).length;

                                  let cardStyle = 'bg-[#16222F] border-[#233549] text-slate-300 hover:border-purple-500/50';
                                  if (selectedDependencyNodeId) {
                                    if (isSelected) {
                                      cardStyle = 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/10 ring-1 ring-purple-500';
                                    } else if (isPredecessor) {
                                      cardStyle = 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/50';
                                    } else if (isSuccessor) {
                                      cardStyle = 'bg-teal-500/20 border-[#3BC0BB] text-teal-200 ring-1 ring-[#3BC0BB]/50';
                                    } else {
                                      cardStyle = 'bg-[#16222F]/50 border-[#233549]/50 text-slate-500 opacity-50';
                                    }
                                  }

                                  return (
                                    <div
                                      key={t.tempId || tIdx}
                                      onClick={() => setSelectedDependencyNodeId(isSelected ? null : t.tempId)}
                                      className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2 ${cardStyle}`}
                                    >
                                      <div className="flex items-start justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="text-xs font-bold truncate">{t.title}</span>
                                        </div>
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                          t.priority === 'High' || t.priority === 'Urgent'
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        }`}>
                                          {t.priority || 'Medium'}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-[#233549]/60">
                                        <span>Day +{t.dayOffset || 0} • {t.durationDays || 5}d</span>
                                        <div className="flex items-center gap-1">
                                          {incomingCount > 0 && (
                                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                              In: {incomingCount}
                                            </span>
                                          )}
                                          {outgoingCount > 0 && (
                                            <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-[#3BC0BB]/30">
                                              Out: {outgoingCount}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {stgIdx < 2 && (
                                <div className="hidden md:flex items-center justify-center pt-2 text-slate-500">
                                  <ArrowRight className="w-4 h-4 text-purple-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* MODE 2: EXECUTION CHAINS & CRITICAL PATH */}
                  {depMapViewMode === 'chain' && (() => {
                    const tasks = selectedTemplateForPreview.tasks || [];
                    const deps = selectedTemplateForPreview.dependencies || [];

                    // Identify root tasks (no predecessors)
                    const rootTasks = tasks.filter((t) => !deps.some((d) => d.taskTempId === t.tempId));

                    return (
                      <div className="space-y-3">
                        <div className="p-3 bg-gradient-to-r from-purple-900/30 to-teal-900/30 border border-purple-500/40 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block">Sequential Topological Chains</span>
                            <span className="text-[11px] text-slate-300">
                              Tracing execution flows from Root Tasks through dependencies to Terminal Leaves
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/40 font-mono font-bold text-[11px]">
                            {rootTasks.length} Execution Origins
                          </span>
                        </div>

                        <div className="space-y-3">
                          {rootTasks.map((rootT, rIdx) => {
                            const successors = deps
                              .filter((d) => d.dependsOnTaskTempId === rootT.tempId)
                              .map((d) => tasks.find((t) => t.tempId === d.taskTempId))
                              .filter(Boolean);

                            return (
                              <div key={rIdx} className="p-3.5 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2.5">
                                <div className="flex items-center justify-between border-b border-[#233549] pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                                      Chain Origin #{rIdx + 1}
                                    </span>
                                    <span className="text-sm font-bold text-white">{rootT.title}</span>
                                  </div>
                                  <span className="text-xs font-mono text-slate-400">
                                    Starts Day +{rootT.dayOffset || 0} ({rootT.durationDays || 5}d)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                  <div className="p-2 rounded-lg bg-[#16222F] border border-[#233549] text-white font-semibold">
                                    {rootT.title}
                                  </div>

                                  {successors.length > 0 ? (
                                    successors.map((succ, sIdx) => (
                                      <React.Fragment key={sIdx}>
                                        <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
                                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-200 font-medium">
                                          {succ?.title} <span className="text-[10px] text-slate-400">({succ?.durationDays || 5}d)</span>
                                        </div>
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <>
                                      <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                                      <span className="text-xs text-slate-500 italic">Independent Root Task (No Dependent Successors)</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* MODE 3: LINKAGE MATRIX TABLE */}
                  {depMapViewMode === 'cards' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">
                        Explicit pairwise dependency declarations:
                      </p>

                      {selectedTemplateForPreview.dependencies && selectedTemplateForPreview.dependencies.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {selectedTemplateForPreview.dependencies.map((dep, dIdx) => {
                            const targetTask = selectedTemplateForPreview.tasks?.find((t) => t.tempId === dep.taskTempId);
                            const dependsOnTask = selectedTemplateForPreview.tasks?.find((t) => t.tempId === dep.dependsOnTaskTempId);

                            return (
                              <div key={dIdx} className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 font-bold border-b border-[#233549] pb-1.5">
                                  <span>Linkage #{dIdx + 1}</span>
                                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30">
                                    {dep.type || 'finish_to_start'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                  <div className="p-2 rounded-lg bg-[#16222F] border border-[#233549] flex-1 min-w-0">
                                    <span className="text-[10px] text-slate-400 block">Predecessor (Must Finish First):</span>
                                    <span className="font-bold text-white truncate block">{dependsOnTask?.title || dep.dependsOnTaskTempId}</span>
                                  </div>

                                  <ArrowRight className="w-4 h-4 text-teal-400 shrink-0" />

                                  <div className="p-2 rounded-lg bg-[#16222F] border border-[#233549] flex-1 min-w-0">
                                    <span className="text-[10px] text-slate-400 block">Successor Task:</span>
                                    <span className="font-bold text-white truncate block">{targetTask?.title || dep.taskTempId}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-[#0D1520] border border-[#233549] rounded-xl text-slate-400 text-xs">
                          No explicitly defined task predecessor linkages for this template. All tasks run concurrently based on day offsets.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-[#233549] flex items-center justify-between shrink-0 text-xs">
              <button
                type="button"
                onClick={() => {
                  const tpl = selectedTemplateForPreview;
                  setShowPreviewModal(false);
                  setSelectedTemplateForInstantiate(tpl);
                  setSelectedVersionRecordIdForInstantiate('');
                  setInstantiateTitle(`${tpl.name} Project`);
                  setInstantiateCode(`CL-${Math.floor(100 + Math.random() * 900)}`);
                  setInstantiateDescription(tpl.description);
                  setInstantiateBudget(tpl.estimatedBudget || 250000);
                  setInstantiateBlankSpace(false);
                  setShowInstantiateModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <Copy className="w-4 h-4" />
                <span>Instantiate Space from This Template</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300 hover:text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D3 TASK DEPENDENCY GRAPH PREVIEW MODAL */}
      <DependencyPreviewModal
        template={selectedTemplateForPreview}
        isOpen={showD3Modal}
        onClose={() => setShowD3Modal(false)}
        onApplyTemplate={(tpl) => {
          setSelectedTemplateForInstantiate(tpl);
          setSelectedVersionRecordIdForInstantiate('');
          setInstantiateTitle(`${tpl.name} Project`);
          setInstantiateCode(`CL-${Math.floor(100 + Math.random() * 900)}`);
          setInstantiateDescription(tpl.description);
          setInstantiateBudget(tpl.estimatedBudget || 250000);
          setInstantiateBlankSpace(false);
          setShowInstantiateModal(true);
        }}
      />

      {/* SIDE-BY-SIDE TEMPLATE COMPARISON MODAL */}
      <CompareTemplatesModal
        templates={projectTemplates}
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        initialTemplateAId={compareInitialAId}
        initialTemplateBId={compareInitialBId}
        onInstantiateTemplate={(tpl) => {
          setSelectedTemplateForInstantiate(tpl);
          setSelectedVersionRecordIdForInstantiate('');
          setInstantiateTitle(`${tpl.name} Project`);
          setInstantiateCode(`CL-${Math.floor(100 + Math.random() * 900)}`);
          setInstantiateDescription(tpl.description);
          setInstantiateBudget(tpl.estimatedBudget || 250000);
          setInstantiateBlankSpace(false);
          setShowInstantiateModal(true);
        }}
      />

      {/* RESOURCE CAPACITY & ALLOCATION PLANNER MODAL */}
      <ResourceCapacityPlannerModal
        isOpen={showCapacityPlannerModal}
        onClose={() => setShowCapacityPlannerModal(false)}
        users={users}
        projects={projects}
        tasks={tasks}
        onUpdateUser={updateUser}
        onUpdateTask={updateTask}
      />

      {/* SMART IMPORT ASSISTANT MODAL */}
      <SmartImportAssistantModal
        isOpen={showSmartImportModal}
        onClose={() => setShowSmartImportModal(false)}
        projects={projects}
        users={users}
        activeCompanyId={activeCompany.id}
        theme={theme}
        onImportTasks={handleImportTasks}
        onCreateProjectAndImport={handleCreateProjectAndImport}
      />

      {/* EXCEL / CSV DIRECT IMPORT MODAL */}
      {showExcelModal && (
        <ExcelImportModal
          onClose={() => setShowExcelModal(false)}
          defaultProjectId={importTargetProjectId}
        />
      )}

      {/* VALIDATION ENGINE MODAL */}
      <ValidationEngineModal
        isOpen={showValidationEngineModal}
        onClose={() => setShowValidationEngineModal(false)}
        templates={projectTemplates}
        projects={projects}
        tasks={tasks}
        dependencies={dependencies || []}
        theme={theme}
      />

      {/* TEMPLATE METRICS DASHBOARD MODAL */}
      <TemplateMetricsDashboardModal
        isOpen={showTemplateMetricsModal}
        onClose={() => setShowTemplateMetricsModal(false)}
        templates={projectTemplates}
        projects={projects}
        tasks={tasks}
        theme={theme}
        onInstantiateTemplate={(templateId) => {
          const targetTpl = projectTemplates.find((t) => t.id === templateId);
          if (targetTpl) {
            setSelectedTemplateForInstantiate(targetTpl);
            setSelectedVersionRecordIdForInstantiate('');
            setInstantiateTitle(`${targetTpl.name} Space`);
            setInstantiateCode(`SP-${Math.floor(100 + Math.random() * 900)}`);
            setInstantiateDescription(targetTpl.description);
            setInstantiateBudget(targetTpl.estimatedBudget || 250000);
            setInstantiateBlankSpace(false);
            setShowInstantiateModal(true);
          }
        }}
      />

      {/* UNIFIED PROJECT SEARCH MODAL */}
      <UnifiedProjectSearchModal
        isOpen={showUnifiedSearchModal}
        onClose={() => setShowUnifiedSearchModal(false)}
        projects={projects}
        tasks={tasks}
        files={files || []}
        templates={projectTemplates}
        users={users}
        theme={theme}
        onSelectProject={(projId) => {
          setSelectedProjectId(projId);
        }}
        onSelectTask={(task) => {
          setSelectedProjectId(task.projectId);
          setActiveTab('projects');
          setTemplateNotification(`Navigated to task "${task.title}" in workspace space.`);
        }}
        onSelectFile={(file) => {
          setSelectedProjectId(file.projectId);
          setTemplateNotification(`Navigated to space for file "${file.name}".`);
        }}
        onSelectTemplate={(templateId) => {
          const tpl = projectTemplates.find((t) => t.id === templateId);
          if (tpl) {
            setSelectedTemplateForPreview(tpl);
            setShowPreviewModal(true);
          }
        }}
      />
    </div>
  );
};
