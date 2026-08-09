import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  FileText,
  FolderKanban,
  CheckCircle2,
  Bookmark,
  User,
  Calendar,
  Tag,
  ArrowRight,
  Filter,
  History,
  Sparkles,
  Layers,
  Clock,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  FileSpreadsheet,
  Building2,
  HardDrive
} from 'lucide-react';
import { Project, Task, ProjectFile, ProjectTemplate, User as UserType } from '../../types';

export type SearchCategory = 'all' | 'tasks' | 'files' | 'templates' | 'projects';

interface UnifiedProjectSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  files: ProjectFile[];
  templates: ProjectTemplate[];
  users: UserType[];
  theme: string;
  onSelectProject: (projectId: string) => void;
  onSelectTask?: (task: Task) => void;
  onSelectFile?: (file: ProjectFile) => void;
  onSelectTemplate?: (templateId: string) => void;
}

interface SearchIndexItem {
  id: string;
  type: 'task' | 'file' | 'template' | 'project';
  title: string;
  subtitle: string;
  description: string;
  projectId?: string;
  projectName?: string;
  categoryTag?: string;
  date?: string;
  authorName?: string;
  priority?: string;
  status?: string;
  matchedTokens: string[];
  rawObject: Task | ProjectFile | ProjectTemplate | Project;
}

export const UnifiedProjectSearchModal: React.FC<UnifiedProjectSearchModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  files,
  templates,
  users,
  theme,
  onSelectProject,
  onSelectTask,
  onSelectFile,
  onSelectTemplate
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SearchCategory>('all');
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>('all');
  const [recentQueries, setRecentQueries] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dolphin_recent_searches');
      return saved ? JSON.parse(saved) : ['heat exchanger', 'HVAC', 'migration', 'critical path'];
    } catch {
      return ['heat exchanger', 'HVAC', 'migration', 'critical path'];
    }
  });

  const [previewItem, setPreviewItem] = useState<SearchIndexItem | null>(null);

  const isLight = theme === 'light';

  // Save recent search queries
  const addRecentQuery = (q: string) => {
    if (!q.trim()) return;
    const clean = q.trim();
    const updated = [clean, ...recentQueries.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setRecentQueries(updated);
    try {
      localStorage.setItem('dolphin_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Build Unified Search Index across Tasks, Files, Templates, Projects
  const searchIndex = useMemo<SearchIndexItem[]>(() => {
    const projectMap = new Map<string, string>();
    projects.forEach((p) => projectMap.set(p.id, p.title));

    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u.id, u.name));

    const index: SearchIndexItem[] = [];

    // 1. Index Projects / Spaces
    projects.forEach((proj) => {
      index.push({
        id: `proj_${proj.id}`,
        type: 'project',
        title: proj.title,
        subtitle: `Space Code: ${proj.code} • ${proj.category}`,
        description: proj.description || 'Workspace project container',
        projectId: proj.id,
        projectName: proj.title,
        categoryTag: proj.category,
        status: proj.status,
        date: proj.startDate,
        matchedTokens: [
          proj.title.toLowerCase(),
          proj.code.toLowerCase(),
          proj.category.toLowerCase(),
          (proj.description || '').toLowerCase()
        ],
        rawObject: proj
      });
    });

    // 2. Index Tasks
    tasks.forEach((t) => {
      const projName = projectMap.get(t.projectId) || 'Workspace Space';
      const assignees = t.assigneeIds.map((id) => userMap.get(id) || id).join(', ');

      index.push({
        id: `task_${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: `Task in "${projName}" • Assignees: ${assignees || 'Unassigned'}`,
        description: t.description || 'Workspace task item',
        projectId: t.projectId,
        projectName: projName,
        categoryTag: t.priority,
        priority: t.priority,
        status: t.status,
        date: t.dueDate,
        authorName: assignees,
        matchedTokens: [
          t.title.toLowerCase(),
          (t.description || '').toLowerCase(),
          projName.toLowerCase(),
          (t.tags || []).join(' ').toLowerCase(),
          t.priority.toLowerCase(),
          t.status.toLowerCase(),
          assignees.toLowerCase()
        ],
        rawObject: t
      });
    });

    // 3. Index Files & Documents
    files.forEach((f) => {
      const projName = projectMap.get(f.projectId) || 'Workspace Space';
      index.push({
        id: `file_${f.id}`,
        type: 'file',
        title: f.name,
        subtitle: `File attached to "${projName}" • ${f.size} • Uploaded by ${f.uploadedByName}`,
        description: f.contentSnippet || `Document asset (${f.mimeType})`,
        projectId: f.projectId,
        projectName: projName,
        categoryTag: f.mimeType.split('/')[1] || 'document',
        date: f.uploadedAt,
        authorName: f.uploadedByName,
        matchedTokens: [
          f.name.toLowerCase(),
          projName.toLowerCase(),
          f.uploadedByName.toLowerCase(),
          (f.contentSnippet || '').toLowerCase(),
          f.mimeType.toLowerCase()
        ],
        rawObject: f
      });
    });

    // 4. Index Templates / Workspace Configurations
    templates.forEach((tpl) => {
      index.push({
        id: `tpl_${tpl.id}`,
        type: 'template',
        title: tpl.name,
        subtitle: `Template Blueprint • ${tpl.category} • ${tpl.tasks?.length || 0} Preset Tasks`,
        description: tpl.description || 'Reusable workspace project configuration blueprint',
        categoryTag: tpl.category,
        date: tpl.createdAt,
        matchedTokens: [
          tpl.name.toLowerCase(),
          tpl.category.toLowerCase(),
          (tpl.description || '').toLowerCase(),
          (tpl.tags || []).join(' ').toLowerCase()
        ],
        rawObject: tpl
      });
    });

    return index;
  }, [projects, tasks, files, templates, users]);

  // Filter Search Index
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return searchIndex.filter((item) => {
        if (categoryFilter !== 'all' && item.type !== categoryFilter.replace(/s$/, '')) return false;
        if (selectedProjectIdFilter !== 'all' && item.projectId !== selectedProjectIdFilter) return false;
        return true;
      }).slice(0, 15);
    }

    const terms = q.split(/\s+/);

    return searchIndex
      .filter((item) => {
        if (categoryFilter !== 'all' && item.type !== categoryFilter.replace(/s$/, '')) return false;
        if (selectedProjectIdFilter !== 'all' && item.projectId !== selectedProjectIdFilter) return false;

        return terms.every((term) =>
          item.matchedTokens.some((tok) => tok.includes(term))
        );
      })
      .slice(0, 30);
  }, [searchIndex, query, categoryFilter, selectedProjectIdFilter]);

  // Handle keyboard shortcut for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleExecuteResult = (item: SearchIndexItem) => {
    addRecentQuery(query || item.title);
    if (item.type === 'project' && item.projectId) {
      onSelectProject(item.projectId);
      onClose();
    } else if (item.type === 'task' && onSelectTask) {
      onSelectTask(item.rawObject as Task);
      onClose();
    } else if (item.type === 'file' && onSelectFile) {
      onSelectFile(item.rawObject as ProjectFile);
      onClose();
    } else if (item.type === 'template' && onSelectTemplate) {
      onSelectTemplate(item.rawObject.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121B26] border-[#233549] text-white'
        }`}
      >
        {/* SEARCH HEADER BAR */}
        <div className={`p-4 border-b flex items-center gap-3 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-[#3BC0BB] border border-teal-500/30">
            <Search className="w-5 h-5 animate-pulse" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all tasks, files, space configurations, and templates..."
            autoFocus
            className={`w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-500 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700 shrink-0">
            ESC to close
          </div>
        </div>

        {/* CATEGORY TABS & FILTER BAR */}
        <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                categoryFilter === 'all'
                  ? 'bg-teal-500/20 text-[#3BC0BB] border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Results</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono">
                {searchIndex.length}
              </span>
            </button>

            <button
              onClick={() => setCategoryFilter('tasks')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                categoryFilter === 'tasks'
                  ? 'bg-teal-500/20 text-[#3BC0BB] border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tasks</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono">
                {tasks.length}
              </span>
            </button>

            <button
              onClick={() => setCategoryFilter('files')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                categoryFilter === 'files'
                  ? 'bg-teal-500/20 text-[#3BC0BB] border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Files</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono">
                {files.length}
              </span>
            </button>

            <button
              onClick={() => setCategoryFilter('templates')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                categoryFilter === 'templates'
                  ? 'bg-teal-500/20 text-[#3BC0BB] border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-purple-400" />
              <span>Templates</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono">
                {templates.length}
              </span>
            </button>

            <button
              onClick={() => setCategoryFilter('projects')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                categoryFilter === 'projects'
                  ? 'bg-teal-500/20 text-[#3BC0BB] border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
              <span>Spaces</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono">
                {projects.length}
              </span>
            </button>
          </div>

          {/* PROJECT/SPACE FILTER SELECTOR */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Space:</span>
            </span>
            <select
              value={selectedProjectIdFilter}
              onChange={(e) => setSelectedProjectIdFilter(e.target.value)}
              className={`p-1 rounded-lg border text-[11px] font-bold outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
              }`}
            >
              <option value="all">All Workspace Spaces</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RECENT SEARCHES QUICK CHIPS */}
        {!query && recentQueries.length > 0 && (
          <div className="px-4 py-2 border-b border-[#233549] bg-black/20 flex items-center gap-2 text-xs overflow-x-auto">
            <span className="text-slate-500 font-bold text-[10px] uppercase font-mono shrink-0 flex items-center gap-1">
              <History className="w-3 h-3 text-slate-400" />
              Recent Searches:
            </span>
            {recentQueries.map((rq) => (
              <button
                key={rq}
                onClick={() => setQuery(rq)}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-[11px] shrink-0 transition-all border border-slate-700/60"
              >
                {rq}
              </button>
            ))}
          </div>
        )}

        {/* SEARCH RESULTS BODY & PREVIEW PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#233549]">
          {/* LEFT LIST RESULTS */}
          <div className="md:col-span-7 p-4 overflow-y-auto space-y-2 max-h-[55vh]">
            {searchResults.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-400">No matching items found</h4>
                <p className="text-xs text-slate-500">
                  Try searching for keywords like "Heat Exchanger", task names, file extensions, or space codes.
                </p>
              </div>
            ) : (
              searchResults.map((item) => {
                const isSelected = previewItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setPreviewItem(item)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500/50 shadow-md'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-teal-300'
                        : 'bg-[#16222F] border-[#233549] hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {item.type === 'task' && (
                          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'file' && (
                          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'template' && (
                          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 mt-0.5">
                            <Bookmark className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'project' && (
                          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 mt-0.5">
                            <FolderKanban className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                              {item.type}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">{item.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteResult(item);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs shrink-0 flex items-center gap-1 transition-all border border-teal-500/30"
                      >
                        <span>Jump</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT PREVIEW DETAILS DRAWER */}
          <div className="md:col-span-5 p-4 overflow-y-auto bg-black/10 space-y-4 max-h-[55vh]">
            {previewItem ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {previewItem.type}
                    </span>
                    {previewItem.status && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                        {previewItem.status}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-white">{previewItem.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{previewItem.description}</p>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {previewItem.projectName && (
                    <div className="p-2 rounded bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Workspace Space:</span>
                      <span className="text-teal-300 font-bold">{previewItem.projectName}</span>
                    </div>
                  )}

                  {previewItem.authorName && (
                    <div className="p-2 rounded bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Author / Assignee:</span>
                      <span className="text-white font-bold">{previewItem.authorName}</span>
                    </div>
                  )}

                  {previewItem.date && (
                    <div className="p-2 rounded bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Timestamp / Target:</span>
                      <span className="text-slate-300">{previewItem.date}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleExecuteResult(previewItem)}
                  className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <span>Open Selected {previewItem.type.toUpperCase()}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2 text-slate-500">
                <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-medium">Select any search result on the left to inspect its parameters and quick-jump.</p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className={`px-4 py-3 border-t flex items-center justify-between shrink-0 text-xs text-slate-400 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <div className="font-mono">
            Persistent Index Active: <strong>{searchIndex.length} items</strong> synced
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
          >
            Close Search
          </button>
        </div>
      </motion.div>
    </div>
  );
};
