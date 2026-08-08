import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  CheckSquare,
  FolderKanban,
  User as UserIcon,
  FileText,
  Tag,
  ArrowRight,
  Sparkles,
  Sliders,
  Filter,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useDebounce } from '../../hooks/useDebounce';
import { FullTextSearchIndex, SearchResultItem, highlightMatchText } from '../../services/searchIndexService';

export const HeaderSearchInput: React.FC = () => {
  const {
    tasks,
    projects,
    users,
    companies,
    files,
    selectedProjectId,
    setSelectedProjectId,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    theme
  } = useApp();

  const [inputVal, setInputVal] = useState(searchQuery || '');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'task' | 'project' | 'user' | 'document'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input value by 250ms
  const debouncedQuery = useDebounce(inputVal, 250);

  // Sync debounced search query to global AppContext state for view filtering
  useEffect(() => {
    setSearchQuery(debouncedQuery);
  }, [debouncedQuery, setSearchQuery]);

  // Keep input value in sync if searchQuery changes externally
  useEffect(() => {
    if (searchQuery !== debouncedQuery && searchQuery !== inputVal) {
      setInputVal(searchQuery);
    }
  }, [searchQuery]);

  // Initialize and memoize search index
  const searchIndex = useMemo(() => {
    return new FullTextSearchIndex(tasks, projects, users, companies, files);
  }, [tasks, projects, users, companies, files]);

  // Execute full-text search using index
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return searchIndex.search(debouncedQuery, activeFilter, selectedProjectId);
  }, [searchIndex, debouncedQuery, activeFilter, selectedProjectId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Keyboard Shortcut (Ctrl+K or Cmd+K to focus search input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation within dropdown
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || searchResults.length === 0) {
      if (e.key === 'ArrowDown') setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedItem = searchResults[selectedIndex];
      if (selectedItem) {
        handleSelectItem(selectedItem);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    if (item.type === 'task') {
      if (item.task?.projectId) {
        setSelectedProjectId(item.task.projectId);
      }
      setActiveTab('tasks');
    } else if (item.type === 'project') {
      if (item.project?.id) {
        setSelectedProjectId(item.project.id);
      }
      setActiveTab('projects');
    } else if (item.type === 'user') {
      setActiveTab('workload');
    } else if (item.type === 'document') {
      if (item.file?.projectId) {
        setSelectedProjectId(item.file.projectId);
      }
      setActiveTab('files');
    }
  };

  const handleClear = () => {
    setInputVal('');
    setSearchQuery('');
    setIsOpen(false);
  };

  const isDebouncing = inputVal !== debouncedQuery;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      {/* Header Search Bar Input */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
          isOpen
            ? theme === 'light'
              ? 'bg-white border-[#0D9488] shadow-md ring-2 ring-[#0D9488]/20'
              : 'bg-[#152332] border-[#3BC0BB] shadow-lg ring-2 ring-[#3BC0BB]/20'
            : theme === 'light'
            ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-300 text-slate-800'
            : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-white'
        }`}
      >
        <Search className={`w-3.5 h-3.5 shrink-0 ${isOpen ? 'text-[#3BC0BB]' : 'text-slate-400'}`} />
        
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search tasks, projects, documents, or team members across all workspaces..."
          className={`w-full bg-transparent text-xs focus:outline-none ${
            theme === 'light' ? 'text-slate-900 placeholder:text-slate-500 font-medium' : 'text-white placeholder:text-slate-400'
          }`}
        />

        {isDebouncing ? (
          <Loader2 className="w-3.5 h-3.5 text-[#3BC0BB] animate-spin shrink-0" />
        ) : inputVal ? (
          <button onClick={handleClear} className="p-0.5 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className={`hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${theme === 'light' ? 'bg-slate-200 text-slate-600' : 'bg-black/40 text-slate-400'}`}>
            Ctrl+K
          </kbd>
        )}
      </div>

      {/* Floating Full-Text Search Overlay Panel */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-2 w-full min-w-[360px] sm:min-w-[480px] md:min-w-[540px] z-50 rounded-2xl border shadow-2xl overflow-hidden transition-all animate-fadeIn ${
            theme === 'light'
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#0F172A] border-[#1E293B] text-slate-100'
          }`}
        >
          {/* Header Bar with Filter Tabs */}
          <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3BC0BB]" />
              <span className="text-xs font-bold text-white tracking-tight">Full-Text Search Index</span>
              {debouncedQuery.trim() && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#0D9488]/20 text-[#3BC0BB] border border-[#0D9488]/30">
                  {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}
                </span>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-[#0D9488] text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('task')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeFilter === 'task'
                    ? 'bg-[#0D9488] text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveFilter('project')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeFilter === 'project'
                    ? 'bg-[#0D9488] text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => setActiveFilter('document')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeFilter === 'document'
                    ? 'bg-[#0D9488] text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Docs
              </button>
              <button
                onClick={() => setActiveFilter('user')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeFilter === 'user'
                    ? 'bg-[#0D9488] text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Members
              </button>
            </div>
          </div>

          {/* Search Results List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
            {!debouncedQuery.trim() ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                <p className="font-semibold text-slate-300">Type to search indexed items</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Instant search across task titles, full descriptions, project files/documents, assignee names, status codes, and project spaces.
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <p className="font-semibold text-slate-300">No matching items found for "{debouncedQuery}"</p>
                <p className="text-[11px] text-slate-500 mt-1">Try searching by assignee name (e.g., "Parvez"), document name, title keywords, or project code.</p>
              </div>
            ) : (
              searchResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isTask = item.type === 'task';
                const isUser = item.type === 'user';
                const isDoc = item.type === 'document';

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? theme === 'light'
                          ? 'bg-slate-100 border-[#0D9488]'
                          : 'bg-slate-800/90 border-[#3BC0BB]/60 shadow-md'
                        : 'border-transparent hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left Details */}
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Type Icon Badge */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isTask
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : isUser
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : isDoc
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isTask ? (
                            <CheckSquare className="w-3.5 h-3.5" />
                          ) : isUser ? (
                            item.user?.avatar ? (
                              <img src={item.user.avatar} alt={item.title} className="w-6 h-6 rounded-md object-cover" />
                            ) : (
                              <UserIcon className="w-3.5 h-3.5" />
                            )
                          ) : isDoc ? (
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <FolderKanban className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title with Match Highlighting */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-white truncate">
                              {highlightMatchText(item.title, debouncedQuery).map((part, i) =>
                                part.isMatch ? (
                                  <mark key={i} className="bg-[#0D9488]/40 text-[#3BC0BB] font-bold px-0.5 rounded">
                                    {part.text}
                                  </mark>
                                ) : (
                                  <span key={i}>{part.text}</span>
                                )
                              )}
                            </span>

                            {item.code && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {item.code}
                              </span>
                            )}
                          </div>

                          {/* Description Snippet with Match Highlighting */}
                          {item.description && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {highlightMatchText(item.description, debouncedQuery).map((part, i) =>
                                part.isMatch ? (
                                  <mark key={i} className="bg-amber-500/30 text-amber-200 font-semibold px-0.5 rounded">
                                    {part.text}
                                  </mark>
                                ) : (
                                  <span key={i}>{part.text}</span>
                                )
                              )}
                            </p>
                          )}

                          {/* Matched Field Tags & Assignees */}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {/* Matched Fields Tag */}
                            {item.matchedFields.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-[#3BC0BB]">
                                <Tag className="w-3 h-3" />
                                <span>Matched: {item.matchedFields.join(', ')}</span>
                              </div>
                            )}

                            {/* Assignees avatars */}
                            {item.assignees.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500">Assigned:</span>
                                <div className="flex -space-x-1.5">
                                  {item.assignees.slice(0, 3).map((u) => (
                                    <img
                                      key={u.id}
                                      src={u.avatar}
                                      alt={u.name}
                                      className="w-4 h-4 rounded-full ring-1 ring-slate-900 object-cover"
                                      title={u.name}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-300 font-medium">
                                  {highlightMatchText(item.assignees.map((a) => a.name).join(', '), debouncedQuery).map((part, i) =>
                                    part.isMatch ? (
                                      <mark key={i} className="bg-emerald-500/30 text-emerald-300 font-bold px-0.5 rounded">
                                        {part.text}
                                      </mark>
                                    ) : (
                                      <span key={i}>{part.text}</span>
                                    )
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Status / Priority Pills */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'In Progress'
                              ? 'bg-[#0773BB]/20 text-[#38BDF8] border border-[#0773BB]/40'
                              : item.status === 'Done' || item.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {item.status}
                        </span>

                        {item.priority && (
                          <span
                            className={`text-[9px] font-bold ${
                              item.priority === 'Urgent'
                                ? 'text-rose-400'
                                : item.priority === 'High'
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.priority} Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation Bar */}
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span><kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[9px]">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[9px]">Enter</kbd> Select</span>
              <span><kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[9px]">Esc</kbd> Close</span>
            </div>
            <span className="text-[#3BC0BB] font-semibold">Dolphin Full-Text Engine</span>
          </div>
        </div>
      )}
    </div>
  );
};
