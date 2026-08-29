import React, { useState } from 'react';
import {
  Users,
  Lock,
  FileText,
  List,
  UserX,
  Gauge,
  Plus,
  Search,
  SlidersHorizontal,
  Settings,
  ChevronDown,
  Layers,
  Filter,
  UserCheck,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Grid,
  BarChart3,
  Sliders
} from 'lucide-react';
import { WorkloadTimescale, WorkloadViewMode, WorkloadUnit, WorkloadGroupBy } from './types';

interface WorkloadToolbarProps {
  dateRangeLabel: string;
  timescale: WorkloadTimescale;
  setTimescale: (ts: WorkloadTimescale) => void;
  viewMode: WorkloadViewMode;
  setViewMode: (vm: WorkloadViewMode) => void;
  isLight: boolean;
  onNavigateToday: () => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onOpenSettingsModal: () => void;
  meMode: boolean;
  setMeMode: (v: boolean) => void;
  showClosed: boolean;
  setShowClosed: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  departments: string[];
  totalAllocatedHours: number;
  totalMaxHours: number;
  avgCapacityPercent: number;
  overloadedCount: number;
}

export const WorkloadToolbar: React.FC<WorkloadToolbarProps> = ({
  dateRangeLabel,
  timescale,
  setTimescale,
  viewMode,
  setViewMode,
  isLight,
  onNavigateToday,
  onNavigatePrev,
  onNavigateNext,
  onOpenSettingsModal,
  meMode,
  setMeMode,
  showClosed,
  setShowClosed,
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  departments,
  totalAllocatedHours,
  totalMaxHours,
  avgCapacityPercent,
  overloadedCount
}) => {
  const [activePinnedTab, setActivePinnedTab] = useState<string>('workload');
  const [groupBy, setGroupBy] = useState<WorkloadGroupBy>('assignee');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  return (
    <div className="w-full space-y-2.5">
      {/* 1. TOP PINNED HEADER VIEWS BAR (ClickUp Style) */}
      <div
        className={`px-3 sm:px-4 py-1.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs font-medium ${
          isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-[#121B26] border-[#233549]'
        }`}
      >
        {/* Left pinned views list */}
        <div className="flex items-center gap-1 overflow-x-auto min-w-max">
          <button
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/20 transition-all`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>ZenPilot Knowledgebase</span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/20 transition-all`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>My Tasks</span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/20 transition-all`}
          >
            <List className="w-3.5 h-3.5 text-slate-400" />
            <span>Closed w/o Time Tracked</span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/20 transition-all`}
          >
            <UserX className="w-3.5 h-3.5 text-slate-400" />
            <span>No Assignee</span>
          </button>

          {/* ACTIVE WORKLOAD VIEW TAB */}
          <div className="relative">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border-b-2 transition-all ${
                isLight
                  ? 'border-[#0096C7] text-[#0096C7] bg-blue-50/50'
                  : 'border-[#0096C7] text-white bg-[#1A2838]'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-[#0096C7]" />
              <span>Workload View</span>
              <span className="px-1 py-0.2 rounded bg-[#0096C7]/20 text-[#0096C7] text-[10px] font-bold">2</span>
              <ChevronDown className="w-3 h-3 text-[#0096C7]" />
            </button>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/20"
          >
            <span>21 more...</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-700/20 font-semibold"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" />
            <span>View</span>
          </button>
        </div>

        {/* Right Search, Hide, Settings */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-7 pr-2.5 py-1 rounded-lg text-xs outline-none border transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-teal-500'
                  : 'bg-[#0D1520] border-[#233549] text-slate-200 focus:border-teal-500'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={onOpenSettingsModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0096C7]" />
            <span>Hide • 5</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettingsModal}
            className={`p-1.5 rounded-lg border transition-all ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300'
            }`}
            title="Workload Settings & Capacity Thresholds"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. FILTER & GROUP RIBBON (ClickUp Style Pills) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Group: Assignee Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-2xs ${
                isLight
                  ? 'bg-blue-50/80 hover:bg-blue-100 border-blue-200 text-blue-800'
                  : 'bg-[#1A2838] hover:bg-[#203348] border-[#2B435C] text-blue-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#0096C7]" />
              <span>Group: {groupBy === 'assignee' ? 'Assignee' : groupBy === 'department' ? 'Department' : 'Project'}</span>
              <ChevronDown className="w-3 h-3 text-blue-400" />
            </button>

            {isGroupDropdownOpen && (
              <div
                className={`absolute left-0 top-full mt-1 w-44 rounded-xl border shadow-xl p-1 z-30 space-y-0.5 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16222F] border-[#233549] text-slate-200'
                }`}
              >
                {(['assignee', 'department', 'project', 'status'] as WorkloadGroupBy[]).map((grp) => (
                  <button
                    key={grp}
                    onClick={() => {
                      setGroupBy(grp);
                      setIsGroupDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs capitalize hover:bg-teal-500/20 hover:text-teal-300 transition-colors ${
                      groupBy === grp ? 'font-bold text-teal-400 bg-teal-500/10' : ''
                    }`}
                  >
                    Group by {grp}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5 Filters Pill */}
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-2xs ${
              isLight
                ? 'bg-blue-50/80 hover:bg-blue-100 border-blue-200 text-blue-800'
                : 'bg-[#1A2838] hover:bg-[#203348] border-[#2B435C] text-blue-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#0096C7]" />
            <span>5 Filters</span>
          </button>

          {/* Me mode Pill */}
          <button
            type="button"
            onClick={() => setMeMode(!meMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-2xs ${
              meMode
                ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                : isLight
                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300'
            }`}
          >
            <UserCheck className={`w-3.5 h-3.5 ${meMode ? 'text-white' : 'text-slate-400'}`} />
            <span>Me mode</span>
          </button>

          {/* Assignees Filter Pill */}
          <div className="flex items-center gap-1">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-[#16222F] border-[#233549] text-slate-300'
              }`}
            >
              <option value="All">Assignees: All Departments</option>
              {departments.filter((d) => d !== 'All').map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Show closed Pill */}
          <button
            type="button"
            onClick={() => setShowClosed(!showClosed)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-2xs ${
              showClosed
                ? isLight
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-blue-950/60 border-blue-700 text-blue-300'
                : isLight
                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] text-slate-300'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${showClosed ? 'text-blue-500' : 'text-slate-400'}`} />
            <span>Show closed</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMeMode(false);
              setShowClosed(false);
              setSelectedDept('All');
              setSearchQuery('');
            }}
            className="text-slate-400 hover:text-slate-200 text-xs font-medium px-1.5 py-1"
          >
            Hide / Reset
          </button>
        </div>

        {/* View Mode Switcher (Grid vs Heatmap vs Cards) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D1520] border border-[#233549]">
          <button
            type="button"
            onClick={() => setViewMode('clickup_grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'clickup_grid'
                ? 'bg-[#0096C7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>ClickUp Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'heatmap'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Intensity Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'cards'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {/* 3. DATE NAVIGATION & TIMESCALE TOOLBAR (Matches Screenshot) */}
      <div
        className={`px-3 sm:px-4 py-2 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-[#16222F] border-[#233549]'
        }`}
      >
        {/* Left Date Range Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToday}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs active:scale-95 ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                : 'bg-[#1A2838] hover:bg-[#203348] border-[#2B435C] text-white'
            }`}
          >
            Today
          </button>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onNavigatePrev}
              className={`p-1.5 rounded-lg border transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                  : 'bg-[#1A2838] hover:bg-[#203348] border-[#2B435C] text-slate-300'
              }`}
              title="Previous 4 weeks"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNavigateNext}
              className={`p-1.5 rounded-lg border transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                  : 'bg-[#1A2838] hover:bg-[#203348] border-[#2B435C] text-slate-300'
              }`}
              title="Next 4 weeks"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Formatted Date Range Heading e.g. "Nov 12 - Dec 9" */}
          <div className="flex items-center gap-2 pl-2">
            <Calendar className="w-4 h-4 text-[#0096C7]" />
            <span className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {dateRangeLabel}
            </span>
          </div>
        </div>

        {/* Right Timescale & Capacity Summary Badges */}
        <div className="flex items-center gap-2.5">
          {/* Timescale pills (1w / 2w / 4w / Month) */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#0D1520] border border-[#233549] text-xs font-semibold">
            {(['1w', '2w', '4w', 'month'] as WorkloadTimescale[]).map((ts) => (
              <button
                key={ts}
                type="button"
                onClick={() => setTimescale(ts)}
                className={`px-2.5 py-1 rounded-lg transition-all uppercase text-[11px] ${
                  timescale === ts
                    ? 'bg-[#0096C7] text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ts === 'month' ? 'Month' : ts}
              </button>
            ))}
          </div>

          {/* Workload unit toggle / Configure Capacity Limit button */}
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-[#1A2838] hover:bg-[#203348] border-[#2B435C] text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#0096C7]" />
            <span>Workload</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
