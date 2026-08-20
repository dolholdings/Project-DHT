import React, { useState } from 'react';
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
  Zap,
  Activity,
  Cpu,
  ShieldCheck
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
  showBanner?: boolean;
  bannerImageUrl?: string;
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
  className = '',
  showBanner = true,
  bannerImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80'
}) => {
  const isLight = theme === 'light';
  const [imageError, setImageError] = useState(false);

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
          title: title || 'Agile Kanban Board Ready',
          description:
            description ||
            'There are currently no tasks in this board. Create your first task to start tracking work-in-progress stages from Backlog to Done.',
        };
      case 'gantt':
        return {
          title: title || 'Gantt Timeline Schedule Ready',
          description:
            description ||
            'Build your project roadmap by creating deliverables with start dates, due dates, and critical path dependencies.',
        };
      case 'list':
      default:
        return {
          title: title || 'Ready to Plan Project Deliverables',
          description:
            description ||
            'Get started by adding project tasks, setting assignees, configuring critical path milestones, and organizing work items into structured status lists.',
        };
    }
  };

  const content = getDefaultContent();

  return (
    <div
      className={`rounded-3xl border overflow-hidden transition-all shadow-2xl ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0D1520] border-[#233549] text-slate-100'
      } ${className}`}
    >
      {/* High-Tech Abstract Banner Header */}
      {showBanner && (
        <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden border-b border-[#233549]/70 select-none">
          {!imageError ? (
            <img
              src={bannerImageUrl}
              alt="High-tech abstract workspace background"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center transform scale-105 hover:scale-100 transition-transform duration-1000 ease-out"
            />
          ) : (
            /* High-Tech Abstract Geometric SVG Fallback */
            <div className="w-full h-full bg-gradient-to-br from-[#061B2E] via-[#0D2847] to-[#120F24] relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#3BC0BB_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
              <div className="absolute w-96 h-96 bg-[#0773BB]/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute w-72 h-72 bg-[#3BC0BB]/20 rounded-full blur-2xl right-10 top-5" />
            </div>
          )}

          {/* Futuristic Gradient & Vignette Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1520] via-[#0D1520]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D1520]/80 via-transparent to-[#0D1520]/80" />
          <div className="absolute inset-0 bg-[#0773BB]/10 mix-blend-overlay" />

          {/* Floating Cybernetic Badge Overlays */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D1520]/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>DOLPHIN CORE ENGINE</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D1520]/80 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold shadow-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ENTERPRISE STANDBY</span>
            </div>
          </div>

          {/* Center Graphic Badge Floating in Banner */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="p-3 rounded-2xl bg-[#0D1520]/90 backdrop-blur-xl border border-[#3BC0BB]/50 shadow-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] flex items-center justify-center text-white shadow-md">
                {variant === 'kanban' ? (
                  <Columns className="w-5 h-5" />
                ) : variant === 'gantt' ? (
                  <GanttChart className="w-5 h-5" />
                ) : (
                  <ListOrdered className="w-5 h-5" />
                )}
              </div>
              <div className="text-left pr-2">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3BC0BB]">
                  {variant.toUpperCase()} PIPELINE
                </div>
                <div className="text-xs font-black text-white tracking-wide">
                  0 ACTIVE DELIVERABLES
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5">
        {/* Title & Description */}
        <div className="max-w-xl space-y-2">
          <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {content.title}
          </h3>
          <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {content.description}
          </p>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {/* Reset Filters CTA if filters active */}
          {hasActiveFilters && onResetFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-500 shadow-md transition-all active:scale-95 cursor-pointer"
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
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0773BB] via-[#0D9488] to-[#3BC0BB] hover:from-[#0882d4] hover:to-[#45d1cc] text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-[#0773BB]/30 border border-[#3BC0BB]/40 transition-all active:scale-95 cursor-pointer hover:shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4 text-white stroke-[3]" />
              <span>{primaryActionLabel}</span>
            </button>
          )}

          {/* Secondary CSV/Excel Import CTA */}
          {onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
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
              className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
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
            className={`w-full max-w-2xl mt-4 p-4 rounded-2xl border text-left text-xs ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-[#121B26]/80 border-[#233549]/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-700/40 pb-2">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-[#3BC0BB]">
                <Zap className="w-3.5 h-3.5 text-[#3BC0BB]" />
                <span>Production Workflow Guide</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">ISO 9001 / ASME Standards</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 flex items-start gap-2">
                <span className="w-5 h-5 rounded-lg bg-[#0773BB]/30 text-[#3BC0BB] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#0773BB]/50">
                  1
                </span>
                <div>
                  <span className="font-bold text-white block">Define Scope</span>
                  <span className="text-slate-400 text-[10px]">Create deliverable tasks & assign engineers</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 flex items-start gap-2">
                <span className="w-5 h-5 rounded-lg bg-[#0773BB]/30 text-[#3BC0BB] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#0773BB]/50">
                  2
                </span>
                <div>
                  <span className="font-bold text-white block">Schedule Timeline</span>
                  <span className="text-slate-400 text-[10px]">Set milestones & critical dependencies</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 flex items-start gap-2">
                <span className="w-5 h-5 rounded-lg bg-[#0773BB]/30 text-[#3BC0BB] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#0773BB]/50">
                  3
                </span>
                <div>
                  <span className="font-bold text-white block">Track Execution</span>
                  <span className="text-slate-400 text-[10px]">Monitor progress across Kanban, List & Gantt</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

