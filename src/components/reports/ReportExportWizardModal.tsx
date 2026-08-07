import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  FolderKanban,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  AlertCircle,
  BarChart2,
  CheckSquare,
  Square,
  Eye,
  ShieldCheck,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import Papa from 'papaparse';
import { Project, Task, Company, User, Priority, TaskStatus } from '../../types';

interface ReportExportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  companies: Company[];
  activeCompany: Company;
  currentUser: User | null;
  theme: 'light' | 'dark';
}

export const ReportExportWizardModal: React.FC<ReportExportWizardModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  companies,
  activeCompany,
  currentUser,
  theme
}) => {
  // Step indicator state (1: Format & Scope, 2: Date & Status Filters, 3: Sections & Preview)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Configuration state
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('pdf');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(['all']);

  // Date Range state
  const [dateRangePreset, setDateRangePreset] = useState<'last7' | 'last30' | 'last60' | 'last90' | 'ytd' | 'allTime' | 'custom'>('last60');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Status & Priority Filters
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([
    'Done',
    'In Progress',
    'In Review',
    'To Do',
    'Backlog'
  ]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([
    'Urgent',
    'High',
    'Medium',
    'Low'
  ]);
  const [onlyOverdue, setOnlyOverdue] = useState<boolean>(false);

  // Report Sections
  const [includedSections, setIncludedSections] = useState({
    executiveSummary: true,
    projectPerformance: true,
    taskBreakdown: true,
    statusDistribution: true,
    budgetAnalysis: true,
    executiveSignoff: true
  });

  // Report Title
  const [reportTitle, setReportTitle] = useState<string>('Project Performance & Velocity Audit Report');

  if (!isOpen) return null;

  // Available Statuses & Priorities
  const ALL_STATUSES: TaskStatus[] = ['Done', 'In Progress', 'In Review', 'To Do', 'Backlog'];
  const ALL_PRIORITIES: Priority[] = ['Urgent', 'High', 'Medium', 'Low'];

  // Toggle helpers
  const toggleStatus = (status: TaskStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleAllStatuses = () => {
    if (selectedStatuses.length === ALL_STATUSES.length) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses([...ALL_STATUSES]);
    }
  };

  const togglePriority = (priority: Priority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const toggleAllPriorities = () => {
    if (selectedPriorities.length === ALL_PRIORITIES.length) {
      setSelectedPriorities([]);
    } else {
      setSelectedPriorities([...ALL_PRIORITIES]);
    }
  };

  // Date range calculation helper
  const dateBounds = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date = now;

    if (dateRangePreset === 'last7') {
      start = new Date();
      start.setDate(now.getDate() - 7);
    } else if (dateRangePreset === 'last30') {
      start = new Date();
      start.setDate(now.getDate() - 30);
    } else if (dateRangePreset === 'last60') {
      start = new Date();
      start.setDate(now.getDate() - 60);
    } else if (dateRangePreset === 'last90') {
      start = new Date();
      start.setDate(now.getDate() - 90);
    } else if (dateRangePreset === 'ytd') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (dateRangePreset === 'custom') {
      start = customStartDate ? new Date(customStartDate) : null;
      end = customEndDate ? new Date(customEndDate) : now;
    } else {
      start = null; // all time
    }

    return { start, end };
  }, [dateRangePreset, customStartDate, customEndDate]);

  // Filter Projects based on Company selector
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedCompanyId !== 'all' && p.companyId !== selectedCompanyId) return false;
      return true;
    });
  }, [projects, selectedCompanyId]);

  // Filter Tasks based on all wizard settings
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Company Filter
      if (selectedCompanyId !== 'all' && t.companyId !== selectedCompanyId) return false;

      // 2. Project Filter
      if (!selectedProjectIds.includes('all')) {
        if (!selectedProjectIds.includes(t.projectId)) return false;
      }

      // 3. Status Filter
      if (!selectedStatuses.includes(t.status)) return false;

      // 4. Priority Filter
      if (!selectedPriorities.includes(t.priority)) return false;

      // 5. Only Overdue
      if (onlyOverdue) {
        if (t.status === 'Done') return false;
        if (!t.dueDate) return false;
        if (new Date(t.dueDate) >= new Date()) return false;
      }

      // 6. Date Range Filter
      if (dateBounds.start) {
        const taskDate = t.dueDate ? new Date(t.dueDate) : t.createdAt ? new Date(t.createdAt) : null;
        if (taskDate) {
          if (taskDate < dateBounds.start) return false;
        }
      }

      if (dateBounds.end) {
        const taskDate = t.dueDate ? new Date(t.dueDate) : t.createdAt ? new Date(t.createdAt) : null;
        if (taskDate) {
          if (taskDate > dateBounds.end) return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    selectedCompanyId,
    selectedProjectIds,
    selectedStatuses,
    selectedPriorities,
    onlyOverdue,
    dateBounds
  ]);

  // KPI Calculations on filtered subset
  const totalCount = filteredTasks.length;
  const completedCount = filteredTasks.filter((t) => t.status === 'Done').length;
  const inProgressCount = filteredTasks.filter((t) => t.status === 'In Progress').length;
  const overdueCount = filteredTasks.filter((t) => {
    if (t.status === 'Done') return false;
    return t.dueDate && new Date(t.dueDate) < new Date();
  }).length;

  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalLoggedHours = filteredTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
  const totalEstHours = filteredTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

  // Per-project summary for filtered set
  const projectSummary = useMemo(() => {
    return filteredProjects.map((p) => {
      const pTasks = filteredTasks.filter((t) => t.projectId === p.id);
      const done = pTasks.filter((t) => t.status === 'Done').length;
      const total = pTasks.length;
      const logged = pTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
      const est = pTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        id: p.id,
        code: p.code,
        title: p.title,
        budget: p.budget || 0,
        spentBudget: p.spentBudget || 0,
        totalTasks: total,
        completedTasks: done,
        completionPct: pct,
        loggedHours: logged,
        estHours: est
      };
    }).filter((p) => p.totalTasks > 0 || selectedProjectIds.includes(p.id) || selectedProjectIds.includes('all'));
  }, [filteredProjects, filteredTasks, selectedProjectIds]);

  // Execute CSV Download
  const handleExportCsv = () => {
    const metadataHeader = [
      ['REPORT METADATA'],
      ['Report Title', reportTitle],
      ['Generated On', new Date().toLocaleString()],
      ['Generated By', currentUser?.name || 'Tenant Admin'],
      ['Tenant Organization', activeCompany.name],
      ['Selected Company Scope', selectedCompanyId === 'all' ? 'All Tenant Entities' : companies.find((c) => c.id === selectedCompanyId)?.name],
      ['Date Range Preset', dateRangePreset.toUpperCase()],
      ['Status Filters', selectedStatuses.join('; ')],
      ['Priority Filters', selectedPriorities.join('; ')],
      ['Matching Tasks Count', filteredTasks.length],
      ['Overall Completion Rate', `${completionPct}%`],
      ['Total Logged Hours', `${totalLoggedHours}h`],
      ['Total Estimated Hours', `${totalEstHours}h`],
      []
    ];

    const projectSummarySection = includedSections.projectPerformance
      ? [
          ['PROJECT PERFORMANCE SUMMARY'],
          ['Project Code', 'Title', 'Total Tasks', 'Completed Tasks', 'Completion %', 'Est. Hours', 'Logged Hours', 'Budget ($)', 'Spent ($)'],
          ...projectSummary.map((ps) => [
            ps.code,
            `"${ps.title.replace(/"/g, '""')}"`,
            ps.totalTasks,
            ps.completedTasks,
            `${ps.completionPct}%`,
            ps.estHours,
            ps.loggedHours,
            ps.budget,
            ps.spentBudget
          ]),
          []
        ]
      : [];

    const taskDetailsSection = includedSections.taskBreakdown
      ? [
          ['DETAILED TASK INVENTORY'],
          ['Task ID', 'Project Code', 'Task Deliverable Title', 'Status', 'Priority', 'Logged Hours', 'Est. Hours', 'Due Date', 'Milestone', 'Critical Path'],
          ...filteredTasks.map((t) => {
            const proj = projects.find((p) => p.id === t.projectId);
            return [
              t.id,
              proj ? proj.code : t.projectId,
              `"${t.title.replace(/"/g, '""')}"`,
              t.status,
              t.priority,
              t.loggedHours || 0,
              t.estimatedHours || 0,
              t.dueDate || 'N/A',
              t.isMilestone ? 'YES' : 'NO',
              t.isCriticalPath ? 'YES' : 'NO'
            ];
          })
        ]
      : [];

    const fullCsvData = [...metadataHeader, ...projectSummarySection, ...taskDetailsSection];
    const csvString = Papa.unparse(fullCsvData);

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Project_Performance_Report_${activeCompany.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  // Execute PDF Print
  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-[#16222F] border border-[#233549] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] no-print">
        {/* Wizard Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0D1520] via-[#16222F] to-[#0D1520] border-b border-[#233549] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#0773BB] to-[#3BC0BB] text-white shadow-lg shadow-[#0773BB]/20">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Custom Report Export Wizard
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 text-[10px] font-mono font-bold">
                  CSV & PDF ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure custom date ranges, status filters, and report sections for executive reporting.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#233549]/50 text-slate-400 hover:text-white hover:bg-[#233549] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-[#0D1520] px-6 py-3 border-b border-[#233549] flex items-center justify-between shrink-0 text-xs font-mono">
          <div className="flex items-center gap-2 sm:gap-6">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 font-bold transition-all ${
                currentStep === 1 ? 'text-[#3BC0BB]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 1 ? 'bg-[#3BC0BB] text-slate-950 font-black' : 'bg-[#233549] text-slate-300'
              }`}>
                1
              </span>
              <span className="hidden sm:inline">Format & Scope</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-600" />

            <button
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2 font-bold transition-all ${
                currentStep === 2 ? 'text-[#3BC0BB]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 2 ? 'bg-[#3BC0BB] text-slate-950 font-black' : 'bg-[#233549] text-slate-300'
              }`}>
                2
              </span>
              <span className="hidden sm:inline">Date & Status Filters</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-600" />

            <button
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-2 font-bold transition-all ${
                currentStep === 3 ? 'text-[#3BC0BB]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 3 ? 'bg-[#3BC0BB] text-slate-950 font-black' : 'bg-[#233549] text-slate-300'
              }`}>
                3
              </span>
              <span className="hidden sm:inline">Sections & Live Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#16222F] px-3 py-1 rounded-full border border-[#233549] text-[#3BC0BB]">
            <Layers className="w-3.5 h-3.5" />
            <span>Matched: <strong>{filteredTasks.length}</strong> Tasks</span>
          </div>
        </div>

        {/* Wizard Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: FORMAT & SCOPE */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Report Title Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Report Header Title</span>
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0773BB] font-medium"
                  placeholder="Enter custom report title..."
                />
              </div>

              {/* Format Selection Card */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  1. Select Export File Format
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PDF Option */}
                  <div
                    onClick={() => setExportFormat('pdf')}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                      exportFormat === 'pdf'
                        ? 'bg-gradient-to-br from-[#0773BB]/20 to-[#3BC0BB]/10 border-[#3BC0BB] shadow-lg shadow-[#0773BB]/10'
                        : 'bg-[#0D1520] border-[#233549] hover:border-slate-500'
                    }`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 ${
                      exportFormat === 'pdf' ? 'bg-[#3BC0BB] text-slate-950 font-black' : 'bg-[#233549] text-slate-300'
                    }`}>
                      <Printer className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">Executive PDF Document</span>
                        {exportFormat === 'pdf' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#3BC0BB] text-[10px] font-mono font-bold">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Prints a formatted executive report complete with company headers, KPI summary cards, velocity charts, and sign-off blocks.
                      </p>
                    </div>
                  </div>

                  {/* CSV Option */}
                  <div
                    onClick={() => setExportFormat('csv')}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                      exportFormat === 'csv'
                        ? 'bg-gradient-to-br from-[#0773BB]/20 to-[#3BC0BB]/10 border-[#3BC0BB] shadow-lg shadow-[#0773BB]/10'
                        : 'bg-[#0D1520] border-[#233549] hover:border-slate-500'
                    }`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 ${
                      exportFormat === 'csv' ? 'bg-[#3BC0BB] text-slate-950 font-black' : 'bg-[#233549] text-slate-300'
                    }`}>
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">CSV Data File (Excel Compatible)</span>
                        {exportFormat === 'csv' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#3BC0BB] text-[10px] font-mono font-bold">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Exports raw structured project data, task statuses, logged hours, due dates, and budgets for data manipulation in Excel or BI tools.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company & Project Scope Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Company Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0773BB]" />
                    <span>2. Tenant Entity Scope</span>
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => {
                      setSelectedCompanyId(e.target.value);
                      setSelectedProjectIds(['all']);
                    }}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#0773BB]"
                  >
                    <option value="all">All Tenant Entities ({companies.length})</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-[#3BC0BB]" />
                    <span>3. Project Scope</span>
                  </label>
                  <select
                    value={selectedProjectIds[0] || 'all'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') setSelectedProjectIds(['all']);
                      else setSelectedProjectIds([val]);
                    }}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#0773BB]"
                  >
                    <option value="all">All Projects in Scope ({filteredProjects.length})</option>
                    {filteredProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & STATUS FILTERS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Date Range Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#3BC0BB]" />
                    <span>1. Date Range Filter</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Calculated Window: {dateBounds.start ? dateBounds.start.toLocaleDateString() : 'All Time'} → {dateBounds.end.toLocaleDateString()}
                  </span>
                </div>

                {/* Date Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[
                    { id: 'last7', label: 'Last 7 Days' },
                    { id: 'last30', label: 'Last 30 Days' },
                    { id: 'last60', label: 'Last 60 Days' },
                    { id: 'last90', label: 'Last 90 Days' },
                    { id: 'ytd', label: 'Year to Date' },
                    { id: 'allTime', label: 'All Time' },
                    { id: 'custom', label: 'Custom Range' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setDateRangePreset(preset.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        dateRangePreset === preset.id
                          ? 'bg-[#0773BB] text-white border-[#3BC0BB] shadow-md'
                          : 'bg-[#0D1520] text-slate-400 border-[#233549] hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Pickers if Custom preset */}
                {dateRangePreset === 'custom' && (
                  <div className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full bg-[#16222F] border border-[#233549] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0773BB]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-[#16222F] border border-[#233549] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0773BB]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filters */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#0773BB]" />
                    <span>2. Task Status Filter</span>
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllStatuses}
                    className="text-[11px] font-mono text-[#3BC0BB] hover:underline"
                  >
                    {selectedStatuses.length === ALL_STATUSES.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {ALL_STATUSES.map((st) => {
                    const isSelected = selectedStatuses.includes(st);
                    const count = tasks.filter((t) => t.status === st).length;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => toggleStatus(st)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#0773BB]/20 border-[#0773BB] text-white shadow-sm'
                            : 'bg-[#0D1520] border-[#233549] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#3BC0BB]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="text-xs font-bold">{st}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-[10px] text-slate-400">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Filters & Overdue Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Priorities */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      3. Task Priority Levels
                    </label>
                    <button
                      type="button"
                      onClick={toggleAllPriorities}
                      className="text-[11px] font-mono text-[#3BC0BB] hover:underline"
                    >
                      {selectedPriorities.length === ALL_PRIORITIES.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PRIORITIES.map((prio) => {
                      const isSelected = selectedPriorities.includes(prio);

                      return (
                        <button
                          key={prio}
                          type="button"
                          onClick={() => togglePriority(prio)}
                          className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-[#0773BB]/20 border-[#0773BB] text-white'
                              : 'bg-[#0D1520] border-[#233549] text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#3BC0BB]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="text-xs font-bold">{prio}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Special Flags */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    4. Special Risk Filter
                  </label>

                  <div
                    onClick={() => setOnlyOverdue(!onlyOverdue)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      onlyOverdue
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                        : 'bg-[#0D1520] border-[#233549] text-slate-400'
                    }`}
                  >
                    {onlyOverdue ? (
                      <CheckSquare className="w-5 h-5 text-rose-400 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-xs text-white">Only Overdue Items</div>
                      <div className="text-[11px] text-slate-400">
                        Filter explicitly for tasks exceeding target SLA completion dates.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SECTIONS & LIVE PREVIEW */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Sections to Include Checkboxes */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#3BC0BB]" />
                  <span>1. Included Report Sections</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'executiveSummary', label: 'Executive KPI Summary' },
                    { key: 'projectPerformance', label: 'Project Performance Table' },
                    { key: 'taskBreakdown', label: 'Detailed Task Breakdown' },
                    { key: 'statusDistribution', label: 'Status & Priority Ratios' },
                    { key: 'budgetAnalysis', label: 'Budget & Cost Hours' },
                    { key: 'executiveSignoff', label: 'ISO Audit & Sign-off Block' }
                  ].map((sec) => {
                    const isChecked = (includedSections as any)[sec.key];

                    return (
                      <button
                        key={sec.key}
                        type="button"
                        onClick={() =>
                          setIncludedSections((prev) => ({
                            ...prev,
                            [sec.key]: !(prev as any)[sec.key]
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                          isChecked
                            ? 'bg-[#0773BB]/20 border-[#0773BB] text-white'
                            : 'bg-[#0D1520] border-[#233549] text-slate-400'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#3BC0BB] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="text-xs font-bold">{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview & Summary Card */}
              <div className="p-5 rounded-2xl bg-[#0D1520] border border-[#233549] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#3BC0BB]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      2. Live Filtered Summary Preview
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    READY TO EXPORT
                  </span>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#16222F] border border-[#233549]">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Matched Tasks</div>
                    <div className="text-xl font-bold text-white font-mono mt-0.5">{totalCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{completedCount} Done / {inProgressCount} In Prog</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#16222F] border border-[#233549]">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Completion SLA</div>
                    <div className="text-xl font-bold text-[#3BC0BB] font-mono mt-0.5">{completionPct}%</div>
                    <div className="text-[10px] text-rose-400 mt-0.5">{overdueCount} Overdue Items</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#16222F] border border-[#233549]">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Logged Hours</div>
                    <div className="text-xl font-bold text-sky-300 font-mono mt-0.5">{totalLoggedHours}h</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{totalEstHours}h Estimated</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#16222F] border border-[#233549]">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Projects in Scope</div>
                    <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">{projectSummary.length}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{activeCompany.code} Tenant</div>
                  </div>
                </div>

                {/* Sample Filtered Task Preview Table */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold text-slate-300">
                    Sample Matched Deliverables ({Math.min(5, filteredTasks.length)} of {filteredTasks.length}):
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#233549]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#16222F] text-slate-400 text-[10px] uppercase">
                        <tr>
                          <th className="p-2 pl-3">Task Deliverable</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Priority</th>
                          <th className="p-2 text-right pr-3">Logged Hrs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#233549] text-slate-300">
                        {filteredTasks.slice(0, 5).map((t) => (
                          <tr key={t.id} className="hover:bg-[#16222F]/60">
                            <td className="p-2 pl-3 font-semibold text-white">{t.title}</td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0773BB]/30 text-[#3BC0BB]">
                                {t.status}
                              </span>
                            </td>
                            <td className="p-2 font-bold">{t.priority}</td>
                            <td className="p-2 text-right pr-3 font-bold">{t.loggedHours || 0}h</td>
                          </tr>
                        ))}
                        {filteredTasks.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400 italic text-xs">
                              No tasks matched the selected date range and status filters. Try relaxing filters above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-5 bg-[#0D1520] border-t border-[#233549] flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2.5 rounded-xl bg-[#233549] hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#233549]/50 text-slate-400 hover:text-white font-semibold text-xs transition-all"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition-all"
              >
                <span>Next: {currentStep === 1 ? 'Date & Status Filters' : 'Sections & Preview'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {exportFormat === 'csv' ? (
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={filteredTasks.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Custom CSV ({filteredTasks.length} Rows)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Generate & Print Custom PDF Report</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
