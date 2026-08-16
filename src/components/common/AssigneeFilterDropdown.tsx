import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User as UserIcon, Users, UserX, Search, Check, X, ChevronDown } from 'lucide-react';
import { User, Task } from '../../types';
import { useApp } from '../../context/AppContext';

interface AssigneeFilterDropdownProps {
  value: string; // 'all' | 'unassigned' | userId
  onChange: (value: string) => void;
  users: User[];
  tasks?: Task[];
  className?: string;
  size?: 'sm' | 'md';
}

export const AssigneeFilterDropdown: React.FC<AssigneeFilterDropdownProps> = ({
  value = 'all',
  onChange,
  users = [],
  tasks = [],
  className = '',
  size = 'md',
}) => {
  const { theme, currentUser } = useApp();
  const isLight = theme === 'light';
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Compute task counts per user and unassigned
  const taskCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    let unassigned = 0;

    tasks.forEach((t) => {
      if (!t.assigneeIds || t.assigneeIds.length === 0 || !t.assigneeIds.some((id) => id && id.trim() !== '')) {
        unassigned++;
      } else {
        t.assigneeIds.forEach((aid) => {
          if (aid) {
            counts[aid] = (counts[aid] || 0) + 1;
          }
        });
      }
    });

    return { counts, unassigned, total: tasks.length };
  }, [tasks]);

  const selectedUser = useMemo(() => {
    if (value === 'all' || value === 'unassigned') return null;
    return users.find((u) => u.id === value || u.email.toLowerCase() === value.toLowerCase());
  }, [value, users]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return users;
    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.department && u.department.toLowerCase().includes(query)) ||
        (u.role && u.role.toLowerCase().includes(query))
      );
    });
  }, [users, searchTerm]);

  const isFiltered = value !== 'all';

  return (
    <div className={`relative inline-block text-left select-none ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all font-semibold shadow-xs border ${
          size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
        } ${
          isFiltered
            ? isLight
              ? 'bg-teal-50 border-teal-400 text-teal-900 ring-2 ring-teal-200'
              : 'bg-[#0773BB]/20 border-[#3BC0BB] text-cyan-200 ring-2 ring-[#3BC0BB]/20 shadow-md shadow-[#0773BB]/20'
            : isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-[#121B26] hover:bg-[#1A2634] border-[#233549] text-slate-300'
        }`}
        title="Filter tasks by assigned team member or unassigned status"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {value === 'all' ? (
            <Users className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
          ) : value === 'unassigned' ? (
            <UserX className="w-3.5 h-3.5 text-amber-500" />
          ) : selectedUser?.avatar ? (
            <img
              src={selectedUser.avatar}
              alt={selectedUser.name}
              className="w-4 h-4 rounded-full object-cover border border-[#3BC0BB]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-[#0773BB] text-white text-[9px] font-bold flex items-center justify-center">
              {selectedUser?.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          <span className="truncate max-w-[140px] font-bold">
            {value === 'all'
              ? 'Assignee: All'
              : value === 'unassigned'
              ? 'Assignee: Unassigned'
              : selectedUser?.name || 'Assignee'}
          </span>
        </div>

        {/* Task Count Badge */}
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
            isFiltered
              ? isLight
                ? 'bg-teal-200/60 text-teal-900'
                : 'bg-[#3BC0BB]/20 text-[#3BC0BB]'
              : isLight
              ? 'bg-slate-100 text-slate-600'
              : 'bg-[#16222F] text-slate-400'
          }`}
        >
          {value === 'all'
            ? taskCountMap.total
            : value === 'unassigned'
            ? taskCountMap.unassigned
            : taskCountMap.counts[value] || 0}
        </span>

        {/* Clear Filter button on hover/filtered */}
        {isFiltered ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('all');
            }}
            className="p-0.5 rounded-full hover:bg-black/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
            title="Clear Assignee Filter"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''} ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
        )}
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-1.5 w-72 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
              : 'bg-[#121B26] border-[#233549] text-slate-100 shadow-black/80'
          }`}
        >
          {/* Header & Quick Search */}
          <div className={`p-2.5 border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'}`}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Filter by Assignee
              </span>
              {isFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('all');
                    setIsOpen(false);
                  }}
                  className="text-[10px] font-bold text-[#3BC0BB] hover:underline"
                >
                  Reset to All
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search team member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border focus:outline-none transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                    : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB] focus:ring-1 focus:ring-[#3BC0BB]/30'
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y-0 text-xs">
            {/* Option 1: All Assignees */}
            <button
              type="button"
              onClick={() => {
                onChange('all');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                value === 'all'
                  ? isLight
                    ? 'bg-teal-50 text-teal-900 font-bold'
                    : 'bg-[#0773BB]/30 text-white font-bold'
                  : isLight
                  ? 'hover:bg-slate-100 text-slate-700'
                  : 'hover:bg-[#16222F] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#1A2634] text-slate-300'
                }`}>
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold leading-tight">All Assignees</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Show all tasks across team
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#0D1520] text-slate-300'
                }`}>
                  {taskCountMap.total}
                </span>
                {value === 'all' && <Check className="w-3.5 h-3.5 text-[#3BC0BB]" />}
              </div>
            </button>

            {/* Option 2: Unassigned Tasks */}
            <button
              type="button"
              onClick={() => {
                onChange('unassigned');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                value === 'unassigned'
                  ? isLight
                    ? 'bg-amber-50 text-amber-900 font-bold border border-amber-300'
                    : 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/30'
                  : isLight
                  ? 'hover:bg-slate-100 text-slate-700'
                  : 'hover:bg-[#16222F] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <UserX className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold leading-tight">Unassigned Tasks</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tasks requiring owner assignment
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {taskCountMap.unassigned}
                </span>
                {value === 'unassigned' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
            </button>

            {/* Quick Assigned to Me shortcut if currentUser is defined */}
            {currentUser && users.some((u) => u.id === currentUser.id) && (
              <button
                type="button"
                onClick={() => {
                  onChange(currentUser.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                  value === currentUser.id
                    ? isLight
                      ? 'bg-teal-50 text-teal-900 font-bold'
                      : 'bg-[#0773BB]/30 text-white font-bold'
                    : isLight
                    ? 'hover:bg-slate-100 text-slate-700'
                    : 'hover:bg-[#16222F] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full object-cover border border-[#3BC0BB]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#3BC0BB] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-bold leading-tight flex items-center gap-1.5">
                      <span>Assigned to Me</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-teal-500/20 text-teal-300">
                        You
                      </span>
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {currentUser.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#0D1520] text-slate-300'
                  }`}>
                    {taskCountMap.counts[currentUser.id] || 0}
                  </span>
                  {value === currentUser.id && <Check className="w-3.5 h-3.5 text-[#3BC0BB]" />}
                </div>
              </button>
            )}

            {/* Separator */}
            <div className={`my-1 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`} />

            {/* Team Members List */}
            <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Team Members ({filteredUsers.length})
            </div>

            {filteredUsers.map((user) => {
              const isSelected = value === user.id;
              const userCount = taskCountMap.counts[user.id] || 0;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onChange(user.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? isLight
                        ? 'bg-teal-50 text-teal-900 font-bold'
                        : 'bg-[#0773BB]/30 text-white font-bold'
                      : isLight
                      ? 'hover:bg-slate-100 text-slate-700'
                      : 'hover:bg-[#16222F] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-600"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#0773BB] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 truncate">
                      <div className="font-semibold leading-tight truncate">{user.name}</div>
                      <div className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {user.department || user.role || user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      userCount > 0
                        ? isLight
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-[#0D1520] text-slate-200'
                        : 'bg-transparent text-slate-500 opacity-60'
                    }`}>
                      {userCount}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#3BC0BB]" />}
                  </div>
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className={`p-4 text-center text-xs italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                No team members match &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
