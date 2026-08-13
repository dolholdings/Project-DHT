import React from 'react';
import {
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Columns,
  ListOrdered,
  GanttChart,
  Filter,
  CheckCircle2,
  ArrowRight,
  Layers,
  Calendar,
  HelpCircle,
  Zap
} from 'lucide-react';

export interface EmptyStateCardProps {
  variant: 'kanban' | 'list' | 'gantt' | 'custom';
  title?: string;
  description?: string;
  hasActiveFilters?: boolean;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  onSeedDemoData?: () => void;
  seedDemoLabel?: string;
  onResetFilters?: () => void;
  theme?: 'light' | 'dark';
  className?: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  variant,
  title,
  description,
  hasActiveFilters = false,
  onPrimaryAction,
  primaryActionLabel = 'Create First Task',
  onSecondaryAction,
  secondaryActionLabel = 'Import Tasks (CSV / Excel)',
  onSeedDemoData,
  seedDemoLabel = 'Load Demo Deliverables',
  onResetFilters,
  theme = 'dark',
  className = ''
}) => {
  const isLight = theme === 'light';

  // Default content per variant
  const getDefaultContent = () => {
    if (hasActiveFilters) {
      return {
        title: title || 'No Deliverables Match Your Active Filters',
        description:
          description ||
          'Your active search query, project filter, or stage criteria did not return any task records. Try adjusting your filters or search keywords.',
      };
    }

    switch (variant) {
      case 'kanban':
        return {
          title: title || 'Your Agile Kanban Board is Clean & Ready',
          description:
            description ||
            'There are currently no tasks in this board. Create your first task to start tracking work-in-progress stages from Backlog to Done.',
        };
      case 'gantt':
        return {
          title: title || 'No Timeline Tasks Scheduled Yet',
          description:
            description ||
            'Build your Gantt schedule by creating deliverables with start dates, due dates, and critical path dependencies.',
        };
      case 'list':
      default:
        return {
          title: title || 'No Task Deliverables Found',
          description:
            description ||
            'Get started by adding project tasks, setting assignees, and organizing work items into structured status lists.',
        };
    }
  };

  const content = getDefaultContent();

  // Render SVG Illustration Graphic for each view
  const renderIllustration = () => {
    if (variant === 'kanban') {
      return (
        <div className="relative w-48 h-32 flex items-center justify-center my-2">
          {/* Glowing backdrop */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0773BB]/20 via-[#3BC0BB]/20 to-purple-500/20 rounded-2xl blur-xl" />
          
          <svg className="w-full h-full relative z-10" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Column 1 */}
            <rect x="10" y="10" width="52" height="100" rx="8" fill={isLight ? "#E2E8F0" : "#16222F"} stroke={isLight ? "#CBD5E1" : "#233549"} strokeWidth="1.5" />
            <rect x="18" y="18" width="24" height="6" rx="3" fill="#3BC0BB" />
            <rect x="18" y="32" width="36" height="24" rx="6" fill={isLight ? "#FFFFFF" : "#0D1520"} stroke={isLight ? "#CBD5E1" : "#334155"} strokeWidth="1" />
            <rect x="24" y="38" width="24" height="4" rx="2" fill={isLight ? "#94A3B8" : "#64748B"} />
            <rect x="24" y="46" width="16" height="3" rx="1.5" fill={isLight ? "#CBD5E1" : "#475569"} />
            
            {/* Column 2 (Active/In Progress) */}
            <rect x="74" y="10" width="52" height="100" rx="8" fill={isLight ? "#EEF2FF" : "#1E1B4B"} stroke="#818CF8" strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x="82" y="18" width="28" height="6" rx="3" fill="#818CF8" />
            <rect x="82" y="32" width="36" height="28" rx="6" fill={isLight ? "#FFFFFF" : "#0D1520"} stroke="#818CF8" strokeWidth="1.5" />
            <rect x="88" y="38" width="24" height="4" rx="2" fill="#818CF8" />
            <rect x="88" y="46" width="18" height="3" rx="1.5" fill={isLight ? "#94A3B8" : "#64748B"} />
            {/* Dashed placeholder card */}
            <rect x="82" y="66" width="36" height="22" rx="6" fill="none" stroke={isLight ? "#A5B4FC" : "#6366F1"} strokeWidth="1" strokeDasharray="2 2" />

            {/* Column 3 (Done) */}
            <rect x="138" y="10" width="52" height="100" rx="8" fill={isLight ? "#ECFDF5" : "#064E3B"} stroke={isLight ? "#A7F3D0" : "#059669"} strokeWidth="1.5" />
            <rect x="146" y="18" width="20" height="6" rx="3" fill="#10B981" />
            <rect x="146" y="32" width="36" height="24" rx="6" fill={isLight ? "#FFFFFF" : "#0D1520"} stroke={isLight ? "#A7F3D0" : "#047857"} strokeWidth="1" />
            <circle cx="154" cy="44" r="5" fill="#10B981" />
            <path d="M152 44L153.5 45.5L156.5 42.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="162" y="42" width="14" height="4" rx="2" fill={isLight ? "#94A3B8" : "#64748B"} />
          </svg>
        </div>
      );
    }

    if (variant === 'gantt') {
      return (
        <div className="relative w-48 h-32 flex items-center justify-center my-2">
          {/* Glowing backdrop */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-cyan-500/20 to-teal-500/20 rounded-2xl blur-xl" />

          <svg className="w-full h-full relative z-10" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Timeline background grid */}
            <rect x="10" y="10" width="180" height="100" rx="8" fill={isLight ? "#F8FAFC" : "#0F172A"} stroke={isLight ? "#E2E8F0" : "#1E293B"} strokeWidth="1.5" />
            <line x1="55" y1="10" x2="55" y2="110" stroke={isLight ? "#E2E8F0" : "#1E293B"} strokeWidth="1" />
            <line x1="100" y1="10" x2="100" y2="110" stroke={isLight ? "#E2E8F0" : "#1E293B"} strokeWidth="1" />
            <line x1="145" y1="10" x2="145" y2="110" stroke={isLight ? "#E2E8F0" : "#1E293B"} strokeWidth="1" />

            {/* Task bar 1 */}
            <rect x="20" y="24" width="65" height="14" rx="4" fill="url(#ganttGrad1)" />
            <rect x="24" y="29" width="30" height="4" rx="2" fill="white" fillOpacity="0.8" />

            {/* Dependency connection curve */}
            <path d="M85 31 C 100 31, 100 55, 105 55" stroke="#3BC0BB" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
            <polygon points="105,53 109,55 105,57" fill="#3BC0BB" />

            {/* Task bar 2 */}
            <rect x="108" y="48" width="55" height="14" rx="4" fill="url(#ganttGrad2)" />
            <rect x="112" y="53" width="24" height="4" rx="2" fill="white" fillOpacity="0.8" />

            {/* Milestone Diamond */}
            <polygon points="175,76 182,83 175,90 168,83" fill="#F59E0B" stroke="#FBBF24" strokeWidth="1.5" />

            {/* Gradients */}
            <defs>
              <linearGradient id="ganttGrad1" x1="20" y1="24" x2="85" y2="38" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0773BB" />
                <stop offset="1" stopColor="#3BC0BB" />
              </linearGradient>
              <linearGradient id="ganttGrad2" x1="108" y1="48" x2="163" y2="62" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );
    }

    // List view illustration
    return (
      <div className="relative w-48 h-32 flex items-center justify-center my-2">
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 via-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl" />

        <svg className="w-full h-full relative z-10" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="10" width="170" height="100" rx="8" fill={isLight ? "#FFFFFF" : "#0D1520"} stroke={isLight ? "#CBD5E1" : "#233549"} strokeWidth="1.5" />
          
          {/* Row 1 */}
          <circle cx="32" cy="30" r="6" fill="#10B981" />
          <path d="M29.5 30L31 31.5L34.5 28.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="46" y="27" width="70" height="6" rx="3" fill={isLight ? "#64748B" : "#94A3B8"} />
          <rect x="130" y="25" width="28" height="10" rx="5" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="1" />

          <line x1="20" y1="45" x2="180" y2="45" stroke={isLight ? "#F1F5F9" : "#1E293B"} strokeWidth="1" />

          {/* Row 2 */}
          <circle cx="32" cy="60" r="6" fill="none" stroke="#818CF8" strokeWidth="1.5" />
          <rect x="46" y="57" width="85" height="6" rx="3" fill={isLight ? "#334155" : "#E2E8F0"} />
          <rect x="140" y="55" width="28" height="10" rx="5" fill="#818CF8" fillOpacity="0.2" stroke="#818CF8" strokeWidth="1" />

          <line x1="20" y1="75" x2="180" y2="75" stroke={isLight ? "#F1F5F9" : "#1E293B"} strokeWidth="1" />

          {/* Row 3 (Dashed new row) */}
          <rect x="25" y="85" width="150" height="16" rx="4" fill="none" stroke="#3BC0BB" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M35 93H45 M40 88V98" stroke="#3BC0BB" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="52" y="90" width="50" height="6" rx="3" fill="#3BC0BB" fillOpacity="0.6" />
        </svg>
      </div>
    );
  };

  return (
    <div
      className={`p-6 sm:p-10 rounded-2xl border text-center flex flex-col items-center justify-center space-y-5 transition-all shadow-xl ${
        isLight
          ? 'bg-gradient-to-b from-slate-50 to-white border-slate-200 text-slate-800'
          : 'bg-gradient-to-b from-[#121B26] to-[#0D1520] border-[#233549] text-slate-100'
      } ${className}`}
    >
      {/* Visual Illustration */}
      {renderIllustration()}

      {/* Title & Description */}
      <div className="max-w-md space-y-2">
        <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {content.title}
        </h3>
        <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {content.description}
        </p>
      </div>

      {/* Action Buttons Group */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        {/* Reset Filters CTA if filters active */}
        {hasActiveFilters && onResetFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-500 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Search & Filters</span>
          </button>
        ) : null}

        {/* Primary CTA Button */}
        {onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] via-[#0D9488] to-[#3BC0BB] hover:from-[#0882d4] hover:to-[#45d1cc] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#0773BB]/25 border border-[#3BC0BB]/40 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>{primaryActionLabel}</span>
          </button>
        )}

        {/* Secondary CSV/Excel Import CTA */}
        {onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-[#16222F] hover:bg-[#1E2E3E] border-[#233549] text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{secondaryActionLabel}</span>
          </button>
        )}

        {/* Demo Seed Data CTA */}
        {onSeedDemoData && !hasActiveFilters && (
          <button
            type="button"
            onClick={onSeedDemoData}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
              isLight
                ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'
                : 'bg-purple-950/40 hover:bg-purple-900/60 border-purple-500/30 text-purple-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{seedDemoLabel}</span>
          </button>
        )}
      </div>

      {/* Onboarding Guidance Quick Steps */}
      {!hasActiveFilters && (
        <div
          className={`w-full max-w-lg mt-4 p-3.5 rounded-xl border text-left text-xs ${
            isLight
              ? 'bg-slate-100/80 border-slate-200/80 text-slate-700'
              : 'bg-[#0D1520]/80 border-[#233549]/80 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#3BC0BB] mb-2">
            <Zap className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Quick Start Workflow Tips</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>Define tasks & assign team members</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span>Set start/due dates & dependencies</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span>Track progress in Kanban, List & Gantt</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
