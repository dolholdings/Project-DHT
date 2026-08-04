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
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    addProject,
    updateProject,
    activeCompany,
    companies,
    users,
    setActiveTab,
    setSelectedProjectId
  } = useApp();

  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCompanyId, setNewCompanyId] = useState(activeCompany.id || 'comp_5');
  const [newCategory, setNewCategory] = useState<Project['category']>('Industrial Manufacturing');
  const [newBudget, setNewBudget] = useState(500000);
  const [newStartDate, setNewStartDate] = useState('2026-08-10');
  const [newDueDate, setNewDueDate] = useState('2026-12-31');
  const [newManagerId, setNewManagerId] = useState(users[0]?.id || 'usr_1');

  const filteredProjects = projects.filter((p) => {
    if (selectedCompanyFilter === 'all') return true;
    if (selectedCompanyFilter === 'internal') {
      const c = companies.find((comp) => comp.id === p.companyId);
      return !c?.isExternal;
    }
    if (selectedCompanyFilter === 'external') {
      const c = companies.find((comp) => comp.id === p.companyId);
      return c?.isExternal;
    }
    return p.companyId === selectedCompanyFilter;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode) return;

    addProject({
      title: newTitle,
      code: newCode.toUpperCase(),
      companyId: newCompanyId,
      description: newDesc || 'Strategic engineering project',
      status: 'Planning',
      managerId: newManagerId,
      startDate: newStartDate,
      dueDate: newDueDate,
      budget: Number(newBudget),
      category: newCategory,
      members: [newManagerId],
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewCode('');
    setNewDesc('');
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-[#0773BB]" />
            <span>Projects Portfolio</span>
          </h1>
          <p className="text-xs text-slate-400">
            Multi-entity capital expenditure and operational project management across Dolphin Group.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Company Filter Dropdown */}
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="bg-[#16222F] border border-[#233549] text-xs font-medium text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB]"
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
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg shadow-[#0773BB]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj) => {
          const comp = companies.find((c) => c.id === proj.companyId);
          const manager = users.find((u) => u.id === proj.managerId);

          return (
            <div
              key={proj.id}
              className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] hover:border-[#0773BB] transition-all flex flex-col justify-between space-y-4 group shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                    {proj.code}
                  </span>

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
                    <span>{comp?.logo}</span>
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
                      setSelectedProjectId(proj.id);
                      setActiveTab('gantt');
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-[#16222F] hover:bg-[#233549] text-slate-300 hover:text-white border border-[#233549] text-xs font-medium transition-all text-center"
                  >
                    Gantt View
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create New Project */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#233549] pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#0773BB]" />
                <span>Initialize Project for {activeCompany.code}</span>
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
                  <optgroup label="Registered External Partner Companies">
                    {companies
                      .filter((c) => c.isExternal)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) - {c.type}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dubai Airport Hangar Radiator System"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., DAH-RAD26"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#0773BB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Category
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
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Scope, technical deliverables, and objectives..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Budget ($ USD)
                  </label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value))}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#0773BB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Manager
                  </label>
                  <select
                    value={newManagerId}
                    onChange={(e) => setNewManagerId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Start Date
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
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white text-xs font-medium shadow-lg shadow-[#0773BB]/30"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
