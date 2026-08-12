import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Search,
  Filter,
  Eye,
  Trash2,
  FolderKanban,
  Building,
  User as UserIcon,
  Calendar,
  DollarSign,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  FileText,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';

type ProjectSortField = 'code' | 'title' | 'companyId' | 'status' | 'progress' | 'dueDate' | 'budget';
type SortDirection = 'asc' | 'desc';

interface ProjectsDataTableProps {
  onSelectProject?: (projectId: string) => void;
  onOpenEditModal?: (project: Project) => void;
  onOpenPsrReport?: (projectId: string) => void;
}

export const ProjectsDataTable: React.FC<ProjectsDataTableProps> = ({
  onSelectProject,
  onOpenEditModal,
  onOpenPsrReport
}) => {
  const {
    projects,
    updateProject,
    deleteProject,
    companies,
    users,
    tasks,
    setSelectedProjectId,
    setActiveTab,
    theme,
    currentUser
  } = useApp();

  const isLight = theme === 'light';

  // Filters
  const [localSearch, setLocalSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState<ProjectSortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Delete Confirmation
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Filter Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      // Company Filter
      if (companyFilter !== 'all') {
        if (companyFilter === 'internal') {
          const comp = companies.find((c) => c.id === proj.companyId);
          if (comp && comp.isExternal) return false;
        } else if (companyFilter === 'external') {
          const comp = companies.find((c) => c.id === proj.companyId);
          if (!comp || !comp.isExternal) return false;
        } else if (proj.companyId !== companyFilter) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'all' && proj.status !== statusFilter) {
        return false;
      }

      // Category Filter
      if (categoryFilter !== 'all' && proj.category !== categoryFilter) {
        return false;
      }

      // Search
      const q = localSearch.toLowerCase().trim();
      if (q) {
        const comp = companies.find((c) => c.id === proj.companyId);
        const manager = users.find((u) => u.id === proj.managerId);
        const matchTitle = proj.title.toLowerCase().includes(q);
        const matchCode = proj.code.toLowerCase().includes(q);
        const matchDesc = (proj.description || '').toLowerCase().includes(q);
        const matchComp = comp ? comp.name.toLowerCase().includes(q) : false;
        const matchManager = manager ? manager.name.toLowerCase().includes(q) : false;

        if (!matchTitle && !matchCode && !matchDesc && !matchComp && !matchManager) {
          return false;
        }
      }

      return true;
    });
  }, [projects, companyFilter, statusFilter, categoryFilter, localSearch, companies, users]);

  // Sort Projects
  const sortedProjects = useMemo(() => {
    const list = [...filteredProjects];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'companyId':
          const compA = companies.find((c) => c.id === a.companyId)?.name || '';
          const compB = companies.find((c) => c.id === b.companyId)?.name || '';
          comparison = compA.localeCompare(compB);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'progress':
          comparison = (a.progress || 0) - (b.progress || 0);
          break;
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'budget':
          comparison = (a.budget || 0) - (b.budget || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredProjects, sortField, sortDirection, companies]);

  // Pagination
  const totalItems = sortedProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProjects = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedProjects.slice(start, start + pageSize);
  }, [sortedProjects, safePage, pageSize]);

  const handleSort = (field: ProjectSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('tasks');
    if (onSelectProject) onSelectProject(projectId);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* FILTER CONTROL BAR */}
      <div
        className={`p-4 rounded-2xl border ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#121B26] border-[#233549] shadow-xl'
        } flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search projects, codes, clients..."
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-[#0773BB]'
                  : 'bg-[#0D1520] border-[#233549] text-white focus:ring-[#3BC0BB]'
              }`}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800'
                : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Companies</option>
            <option value="internal">Dolphin Entities</option>
            <option value="external">External Clients</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800'
                : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800'
                : 'bg-[#0D1520] border-[#233549] text-slate-200'
            }`}
          >
            <option value="all">All Categories</option>
            <option value="Industrial Manufacturing">Industrial Manufacturing</option>
            <option value="HVAC Engineering">HVAC Engineering</option>
            <option value="Radiator Production">Radiator Production</option>
            <option value="Heat Exchanger">Heat Exchanger</option>
            <option value="Group IT">Group IT</option>
            <option value="Digital Marketing">Digital Marketing</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium shrink-0">
          Total: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{totalItems}</strong> projects
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-xl bg-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Project?</h3>
                <p className="text-xs text-slate-400">
                  Are you sure you want to delete <strong>{projectToDelete.title}</strong> ({projectToDelete.code})?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-[#0D1520] p-3 rounded-xl border border-[#233549]">
              Deleting this project will remove all associated task links and budget tracking records.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#1A2634] text-slate-300 font-bold text-xs border border-[#233549]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA TABLE */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-xl ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#121B26] border-[#233549]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr
                className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#16222F] text-slate-300 border-[#233549]'
                }`}
              >
                <th
                  onClick={() => handleSort('code')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] select-none w-28"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Code</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'code' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('title')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Project Name & Category</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'title' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('companyId')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Company / Client</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'companyId' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                <th className="p-3.5 w-32">Lead Manager</th>

                <th
                  onClick={() => handleSort('status')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] select-none w-32"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'status' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('progress')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] select-none w-32 text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Progress</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'progress' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('dueDate')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] select-none w-28"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Due Date</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'dueDate' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('budget')}
                  className="p-3.5 cursor-pointer hover:text-[#3BC0BB] select-none w-28 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Budget</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'budget' ? 'text-[#3BC0BB]' : 'text-slate-500'}`} />
                  </div>
                </th>

                <th className="p-3.5 w-28 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#233549]/60">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <p className="text-sm font-bold text-slate-300">No projects match the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((proj) => {
                  const comp = companies.find((c) => c.id === proj.companyId);
                  const manager = users.find((u) => u.id === proj.managerId);
                  const projTaskCount = tasks.filter((t) => t.projectId === proj.id).length;

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => handleProjectClick(proj.id)}
                      className={`group transition-colors cursor-pointer text-xs ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-[#16222F]/60'
                      }`}
                    >
                      {/* Code */}
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                          {proj.code}
                        </span>
                      </td>

                      {/* Title & Category */}
                      <td className="p-3.5">
                        <div>
                          <p className={`font-bold transition-colors ${
                            isLight ? 'text-slate-900 group-hover:text-[#0773BB]' : 'text-white group-hover:text-[#3BC0BB]'
                          }`}>
                            {proj.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {proj.category}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-mono">
                              • {projTaskCount} Tasks
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="p-3.5">
                        {comp ? (
                          <div className="flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-300">{comp.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>

                      {/* Lead Manager */}
                      <td className="p-3.5">
                        {manager ? (
                          <div className="flex items-center gap-2">
                            <img src={manager.avatar} alt={manager.name} className="w-5 h-5 rounded-full object-cover" />
                            <span className="font-medium text-slate-300">{manager.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={proj.status}
                          onChange={(e) => updateProject(proj.id, { status: e.target.value as ProjectStatus })}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${
                            proj.status === 'In Progress'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : proj.status === 'Planning'
                              ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                              : proj.status === 'In Review'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          <option value="Planning">Planning</option>
                          <option value="In Progress">In Progress</option>
                          <option value="In Review">In Review</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* Progress Bar */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#0D1520] h-2 rounded-full overflow-hidden border border-[#233549]">
                            <div
                              className="bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] h-full transition-all"
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-[#3BC0BB] w-9 text-right">
                            {proj.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="p-3.5 font-mono text-slate-300">
                        {proj.dueDate || 'Ongoing'}
                      </td>

                      {/* Budget */}
                      <td className="p-3.5 text-right font-mono font-bold text-amber-400">
                        ${(proj.budget || 0).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleProjectClick(proj.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#16222F] transition-colors"
                            title="View Project Tasks"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {onOpenPsrReport && (
                            <button
                              onClick={() => onOpenPsrReport(proj.id)}
                              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                              title="Client PSR #03 Report"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {currentUser?.role === 'Admin' && (
                            <button
                              onClick={() => setProjectToDelete(proj)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-[#16222F] border-[#233549] text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Showing <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                {totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1}
              </strong> to{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                {Math.min(safePage * pageSize, totalItems)}
              </strong> of <strong className={isLight ? 'text-slate-900' : 'text-white'}>{totalItems}</strong> entries
            </span>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-400 text-[11px]">Per Page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-[#0D1520] border-[#233549] text-white'
                }`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-[#233549] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-[#233549] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 px-2.5 font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <span className="px-3 py-1 font-mono font-bold text-xs rounded-lg bg-[#0D1520] border border-[#233549] text-[#3BC0BB]">
              Page {safePage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-[#233549] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 px-2.5 font-bold"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-[#233549] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
