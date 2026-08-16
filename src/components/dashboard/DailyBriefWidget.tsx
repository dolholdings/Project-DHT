import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';
import { AIDailyBrief } from '../../types';

export interface DailyBriefWidgetProps {
  theme?: 'dark' | 'light';
  dailyBrief: AIDailyBrief | null;
  briefLoading: boolean;
  onRefresh: () => void;
}

export const DailyBriefWidget: React.FC<DailyBriefWidgetProps> = ({
  theme = 'dark',
  dailyBrief,
  briefLoading,
  onRefresh
}) => {
  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/20 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0773BB] to-[#3BC0BB] text-white shadow-lg">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold tracking-tight ${theme === 'light' ? 'text-[#0D9488]' : 'text-[#3BC0BB]'}`}>
                AI Chief of Staff • Daily Brief
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40">
                GEMINI FLASH
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated executive summary synthesized from task history and deadlines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {dailyBrief?.riskLevel && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                dailyBrief.riskLevel === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : dailyBrief.riskLevel === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              Risk Level: {dailyBrief.riskLevel}
            </span>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={briefLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            title="Refresh Daily AI Brief"
          >
            <Sparkles className={`w-3.5 h-3.5 text-[#3BC0BB] ${briefLoading ? 'animate-spin' : ''}`} />
            <span>{briefLoading ? 'Analyzing...' : 'Refresh AI Brief'}</span>
          </button>
        </div>
      </div>

      {briefLoading && !dailyBrief ? (
        <div className="p-8 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#3BC0BB] animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">
            Synthesizing workspace task history with Gemini API...
          </p>
        </div>
      ) : dailyBrief ? (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed font-medium ${
              theme === 'light'
                ? 'bg-slate-100/70 border-slate-200 text-slate-800'
                : 'bg-[#0D1520]/80 border-[#233549] text-slate-200'
            }`}
          >
            {dailyBrief.summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-[#0D1520]/50 border-[#233549]'
              }`}
            >
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Key Daily Progress</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4 font-mono">
                {(dailyBrief.keyProgress || dailyBrief.keyMilestones || ['All major milestones on schedule']).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-2 ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-[#0D1520]/50 border-[#233549]'
              }`}
            >
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Upcoming Deadlines</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4 font-mono">
                {(dailyBrief.upcomingDeadlines || dailyBrief.suggestedActions || ['Deliverables tracked in sprint view']).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-2 ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-[#0D1520]/50 border-[#233549]'
              }`}
            >
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                <Flame className="w-5 h-5" />
                <span>Urgent Blockers</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4 font-mono">
                {dailyBrief.urgentBlockers.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
