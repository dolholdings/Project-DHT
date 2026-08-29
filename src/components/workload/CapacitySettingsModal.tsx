import React, { useState } from 'react';
import { User } from '../../types';
import {
  X,
  SlidersHorizontal,
  Clock,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  ShieldAlert,
  Calendar
} from 'lucide-react';

interface CapacitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  isLight: boolean;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onBatchUpdateMaxHours: (hours: number) => void;
}

export const CapacitySettingsModal: React.FC<CapacitySettingsModalProps> = ({
  isOpen,
  onClose,
  users,
  isLight,
  onUpdateUser,
  onBatchUpdateMaxHours
}) => {
  if (!isOpen) return null;

  const [globalWeeklyHours, setGlobalWeeklyHours] = useState<number>(40);
  const [localUserHours, setLocalUserHours] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => {
      map[u.id] = u.maxWeeklyHours || 40;
    });
    return map;
  });

  const handleSaveAll = () => {
    Object.entries(localUserHours).forEach(([userId, hours]) => {
      onUpdateUser(userId, { maxWeeklyHours: hours });
    });
    onClose();
  };

  const handleApplyGlobal = () => {
    onBatchUpdateMaxHours(globalWeeklyHours);
    const map: Record<string, number> = {};
    users.forEach((u) => {
      map[u.id] = globalWeeklyHours;
    });
    setLocalUserHours(map);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121B26] border-[#233549] text-white'
        }`}
      >
        {/* HEADER */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Workload & Capacity Settings</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure manager capacity thresholds, daily working hours, and individual member allocations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-700/30 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GLOBAL BULK SETTING */}
        <div className="p-4 sm:p-5 border-b border-slate-700/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0096C7]/10 border border-[#0096C7]/30 text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#0096C7] shrink-0" />
              <div>
                <div className="font-bold text-slate-200 dark:text-white">
                  Bulk Set Weekly Workload Capacity
                </div>
                <div className="text-[11px] text-slate-400">
                  Standard 40 hours/week (8 hours/day across 5 workdays).
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="80"
                value={globalWeeklyHours}
                onChange={(e) => setGlobalWeeklyHours(Number(e.target.value))}
                className={`w-16 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border outline-none text-center ${
                  isLight ? 'bg-white border-slate-300' : 'bg-[#0D1520] border-[#233549] text-white'
                }`}
              />
              <span className="text-[11px] text-slate-400 font-mono">hrs/wk</span>
              <button
                type="button"
                onClick={handleApplyGlobal}
                className="px-3 py-1 rounded-xl bg-[#0096C7] hover:bg-[#0096C7]/80 text-white font-bold text-xs shadow-sm transition-all"
              >
                Apply to All
              </button>
            </div>
          </div>
        </div>

        {/* PER-MEMBER THRESHOLDS LIST */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Team Member Overrides ({users.length} Assignees)</span>
            <span>Weekly Capacity Limit</span>
          </div>

          <div className="space-y-2">
            {users.map((user) => {
              const currentHours = localUserHours[user.id] || 40;
              return (
                <div
                  key={user.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isLight
                      ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                      : 'bg-[#16222F] hover:bg-[#1a2938] border-[#233549]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-teal-500 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate text-slate-200 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {user.role} • {user.department}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden sm:flex items-center gap-1">
                      {[30, 35, 40, 45].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setLocalUserHours((prev) => ({ ...prev, [user.id]: preset }));
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors ${
                            currentHours === preset
                              ? 'bg-teal-600 text-white font-bold'
                              : 'bg-slate-700/30 text-slate-400 hover:text-white'
                          }`}
                        >
                          {preset}h
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={currentHours}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setLocalUserHours((prev) => ({ ...prev, [user.id]: val }));
                        }}
                        className={`w-14 px-2 py-1 rounded-xl text-xs font-mono font-bold text-center border outline-none ${
                          isLight ? 'bg-white border-slate-300' : 'bg-[#0D1520] border-[#233549] text-white'
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 font-mono">hrs</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-600 text-xs font-bold text-slate-300 hover:bg-slate-700/30"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
