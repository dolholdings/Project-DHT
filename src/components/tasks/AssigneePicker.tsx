import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { UserPlus, Check, Search, X, User as UserIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AssigneePickerProps {
  assigneeIds: string[];
  users: User[];
  onUpdateAssignees: (newAssigneeIds: string[]) => void;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  showLabel?: boolean;
}

export const AssigneePicker: React.FC<AssigneePickerProps> = ({
  assigneeIds = [],
  users = [],
  onUpdateAssignees,
  size = 'sm',
  align = 'left',
  showLabel = true,
}) => {
  const { theme, currentUser } = useApp();
  const isLight = theme === 'light';
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
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

  const assignedUsers = users.filter((u) => assigneeIds.includes(u.id));

  const filteredUsers = users.filter((u) => {
    const query = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      (u.department && u.department.toLowerCase().includes(query)) ||
      (u.role && u.role.toLowerCase().includes(query))
    );
  });

  const toggleUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (assigneeIds.includes(userId)) {
      onUpdateAssignees(assigneeIds.filter((id) => id !== userId));
    } else {
      onUpdateAssignees([...assigneeIds, userId]);
    }
  };

  const assignToMe = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser && !assigneeIds.includes(currentUser.id)) {
      onUpdateAssignees([...assigneeIds, currentUser.id]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateAssignees([]);
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Trigger Button / Avatar Row */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1.5 cursor-pointer p-1 rounded-xl transition-all group border ${
          isOpen
            ? isLight
              ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200'
              : 'bg-[#16222F] border-[#3BC0BB] ring-2 ring-[#3BC0BB]/20'
            : isLight
              ? 'hover:bg-slate-100 border-transparent hover:border-slate-200'
              : 'hover:bg-[#16222F] border-transparent hover:border-[#233549]'
        }`}
        title="Click to add or modify assignees"
      >
        {assignedUsers.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex -space-x-2 overflow-hidden">
              {assignedUsers.slice(0, 3).map((user) => (
                <img
                  key={user.id}
                  src={user.avatar}
                  alt={user.name}
                  className={`inline-block rounded-full object-cover ring-2 border ${
                    size === 'sm' ? 'w-6 h-6' : 'w-7 h-7'
                  } ${
                    isLight ? 'ring-white border-slate-200' : 'ring-[#0D1520] border-[#3BC0BB]/40'
                  }`}
                  title={user.name}
                />
              ))}
            </div>

            {showLabel && (
              <div className="flex items-center gap-1">
                {assignedUsers.length === 1 ? (
                  <span className={`font-medium text-xs truncate max-w-[100px] ${
                    isLight ? 'text-slate-800' : 'text-slate-200'
                  }`}>
                    {assignedUsers[0].name}
                  </span>
                ) : (
                  <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded-full ${
                    isLight ? 'bg-teal-100 text-teal-800' : 'bg-[#3BC0BB]/20 text-[#3BC0BB]'
                  }`}>
                    +{assignedUsers.length} assigned
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold ${
            isLight
              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
          }`}>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Unassigned</span>
          </div>
        )}

        {/* Plus / Edit Indicator */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`p-1 rounded-lg text-xs font-bold transition-colors ${
            isLight
              ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              : 'text-slate-400 hover:text-white hover:bg-[#233549]'
          }`}
          title="Add or modify assignees"
        >
          <UserPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 mt-1 w-64 rounded-2xl border shadow-2xl p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/60'
              : 'bg-[#16222F] border-[#233549] text-white shadow-black/80'
          }`}
        >
          {/* Search Header */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-500'
                  : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#3BC0BB]'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between text-[10px] font-semibold px-1 pt-0.5">
            {currentUser && !assigneeIds.includes(currentUser.id) ? (
              <button
                type="button"
                onClick={assignToMe}
                className={`hover:underline ${isLight ? 'text-teal-700' : 'text-[#3BC0BB]'}`}
              >
                + Assign to me
              </button>
            ) : (
              <span className="text-slate-400">Team Members ({users.length})</span>
            )}

            {assigneeIds.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-rose-500 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* User List */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
            {filteredUsers.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4 italic">
                No matching team members
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = assigneeIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={(e) => toggleUser(user.id, e)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-all border ${
                      isSelected
                        ? isLight
                          ? 'bg-teal-50 border-teal-200 text-teal-900 font-bold'
                          : 'bg-[#0773BB]/20 border-[#0773BB]/50 text-white font-bold'
                        : isLight
                          ? 'hover:bg-slate-100 border-transparent text-slate-700'
                          : 'hover:bg-[#0D1520] border-transparent text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-700"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-xs">{user.name}</div>
                        <div className={`text-[10px] truncate ${
                          isLight ? 'text-slate-500 font-normal' : 'text-slate-400 font-normal'
                        }`}>
                          {user.department || user.role}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? isLight
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'bg-[#3BC0BB] border-[#3BC0BB] text-black'
                          : isLight
                            ? 'border-slate-300 bg-white'
                            : 'border-[#233549] bg-[#0D1520]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
