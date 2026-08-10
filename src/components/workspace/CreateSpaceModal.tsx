import React, { useState } from 'react';
import { FolderKanban, X, Plus, Sparkles, Building2, User, DollarSign, Calendar, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newProject: Project) => void;
}

export const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { addProject, companies, users, activeCompany, setSelectedProjectId, setActiveTab, theme, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Project['category']>('Industrial Manufacturing');
  const [companyId, setCompanyId] = useState(activeCompany.id || companies[0]?.id || 'comp_1');
  const [managerId, setManagerId] = useState(users[0]?.id || 'usr_1');
  const [budget, setBudget] = useState(250000);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('2026-12-31');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      setErrorMsg('Only Workspace Administrators (Admin role) can create new spaces.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please enter a space name.');
      return;
    }

    const generatedCode = (code.trim() || title.trim().slice(0, 4)).toUpperCase();

    const createdProject = addProject({
      title: title.trim(),
      code: generatedCode,
      companyId: companyId,
      description: description.trim() || 'Strategic workspace space',
      status: 'Planning',
      managerId: managerId,
      startDate: startDate,
      dueDate: dueDate,
      budget: Number(budget) || 100000,
      category: category,
      members: [managerId, ...users.slice(0, 3).map((u) => u.id)],
    });

    if (createdProject) {
      setSelectedProjectId(createdProject.id);
      if (onCreated) {
        onCreated(createdProject);
      }
    }
    setActiveTab('tasks');

    onClose();
  };

  const categories: Project['category'][] = [
    'Industrial Manufacturing',
    'HVAC Engineering',
    'Radiator Production',
    'Heat Exchanger',
    'Group IT',
    'Digital Marketing',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 sm:p-8 space-y-5 shadow-2xl relative my-auto animate-in zoom-in-95 ${
          theme === 'light'
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#16222F] border-[#233549] text-white'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-xl transition-colors ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              : 'bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] text-slate-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#233549]/60 pb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
              theme === 'light'
                ? 'bg-gradient-to-tr from-[#0D9488] to-[#2DD4BF] shadow-[#0D9488]/30'
                : 'bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] shadow-[#0773BB]/30'
            }`}
          >
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Create New Space</h2>
            <p className="text-xs text-slate-400">
              Add a new space to organize tasks, projects, team members, and workflows.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          {/* Space Name */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Space Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Industrial Automation, Growth Strategy"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!code) {
                  setCode(e.target.value.slice(0, 4).toUpperCase());
                }
              }}
              className={`w-full rounded-xl px-3.5 py-2.5 font-medium border focus:outline-none transition-colors ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0D9488]'
                  : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#0773BB]'
              }`}
            />
          </div>

          {/* Workspace / Organization & Lead Manager */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#3BC0BB]" />
                Workspace / Organization
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className={`w-full rounded-xl px-3 py-2.5 border focus:outline-none transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0D9488]'
                    : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#0773BB]'
                }`}
              >
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#3BC0BB]" />
                Space Lead / Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className={`w-full rounded-xl px-3 py-2.5 border focus:outline-none transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0D9488]'
                    : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#0773BB]'
                }`}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Space Description</label>
            <textarea
              rows={2}
              placeholder="Describe the primary goals, scope, and objectives of this space..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full rounded-xl px-3.5 py-2 border focus:outline-none transition-colors ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0D9488]'
                  : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#0773BB]'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#233549]/60">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-[#0D1520] hover:bg-slate-800 text-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 text-white transition-transform active:scale-95 ${
                theme === 'light'
                  ? 'bg-[#0D9488] hover:bg-[#0F766E] shadow-[#0D9488]/30'
                  : 'bg-[#0773BB] hover:bg-[#0773BB]/80 shadow-[#0773BB]/30'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Space</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
