import React from 'react';
import { Network, Calendar, CheckCircle2, ChevronRight, Zap, ArrowRight, Link, Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TimelineView: React.FC = () => {
  const { projects, tasks, dependencies, activeCompany, theme } = useApp();

  const companyProjects = projects.filter((p) => p.companyId === activeCompany.id);

  const quarters = [
    { name: 'Q2 2026 (Apr - Jun)', active: false },
    { name: 'Q3 2026 (Jul - Sep)', active: true },
    { name: 'Q4 2026 (Oct - Dec)', active: false },
    { name: 'Q1 2027 (Jan - Mar)', active: false },
  ];

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in print-report-container timeline-print-wrapper ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Specific CSS Print Media Queries for A4 Landscape Executive Report */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 10mm;
          }
          body, html, #root, main {
            background: #ffffff !important;
            color: #0f172a !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          header, nav, footer, .no-print, button, select, .clickup-banner, .task-alert-toast {
            display: none !important;
          }
          .timeline-print-wrapper {
            background: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            padding: 12px !important;
            border-radius: 8px !important;
            width: 100% !important;
            max-width: none !important;
          }
          .timeline-project-card-print {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            background-color: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          .timeline-card-title {
            color: #0f172a !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Executive Print Report Header */}
      <div className="hidden print:block mb-6 p-5 border-b-2 border-slate-900 bg-white text-slate-900 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold tracking-wider text-slate-600 uppercase">
              {activeCompany?.name || 'DOLPHIN INDUSTRIAL PROJECTS'} — STRATEGIC REPORT
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Executive Roadmap & Quarterly Milestone Timeline
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Company Strategic Milestone Schedule & Task Dependency Mapping (Q2 2026 - Q1 2027)
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-600 space-y-1">
            <div><span className="font-semibold text-slate-700">Generated:</span> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div><span className="font-semibold text-slate-700">Format:</span> A4 Executive Landscape</div>
            <div className="px-2.5 py-1 rounded border border-slate-400 bg-slate-100 text-slate-800 font-bold inline-block mt-1 text-[10px] tracking-wider uppercase">
              CONFIDENTIAL ROADMAP
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <Network className="w-6 h-6 text-[#3BC0BB]" />
            <span>Roadmap & Quarterly Timeline</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Macro-level strategic milestone timeline with connected task dependency arrows for {activeCompany.name}.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700/80 border border-slate-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            title="Export formatted A4 Landscape Executive Report PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-300" />
            <span>Print Executive PDF (A4)</span>
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-6 shadow-xl timeline-print-wrapper">
        {/* Quarters Bar */}
        <div className="grid grid-cols-4 gap-2 border-b border-[#233549] pb-4">
          {quarters.map((q) => (
            <div
              key={q.name}
              className={`p-3 rounded-xl border text-center font-mono text-xs font-bold ${
                q.active
                  ? 'bg-[#0773BB]/20 border-[#0773BB] text-[#3BC0BB]'
                  : 'bg-[#0D1520] border-[#233549] text-slate-400'
              }`}
            >
              {q.name}
            </div>
          ))}
        </div>

        {/* Strategic Streams */}
        <div className="space-y-6">
          {companyProjects.map((p) => {
            const pTasks = tasks.filter((t) => t.projectId === p.id);

            return (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-4 relative timeline-project-card-print"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#0773BB]/20 text-[#3BC0BB]">
                      {p.code}
                    </span>
                    <h3 className="text-base font-bold text-white timeline-card-title">{p.title}</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {p.startDate} ➔ {p.dueDate}
                  </span>
                </div>

                {/* Milestone Nodes Stage */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 relative">
                  {pTasks.slice(0, 3).map((t, index) => {
                    // Check if this task depends on prior or vice versa
                    const hasPrereq = (t.dependencies && t.dependencies.length > 0) || dependencies.some((d) => d.taskId === t.id);

                    return (
                      <div key={t.id} className="relative flex items-center">
                        <div
                          className={`w-full p-3.5 rounded-xl bg-[#16222F] border transition-all ${
                            hasPrereq ? 'border-amber-500/50 shadow-md shadow-amber-500/10' : 'border-[#233549]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-white truncate flex items-center gap-1.5 timeline-card-title">
                              {hasPrereq && <Link className="w-3 h-3 text-amber-400 shrink-0" />}
                              <span className="truncate">{t.title}</span>
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                t.status === 'Done'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 pt-1 border-t border-[#233549]/50">
                            <span>Target: {t.dueDate}</span>
                            <span>{t.estimatedHours}h</span>
                          </div>
                        </div>

                        {/* Visual Connector Arrow to Next Task Node */}
                        {index < Math.min(pTasks.length, 3) - 1 && (
                          <div className="hidden md:flex items-center justify-center -mr-2 z-10 shrink-0 pl-1">
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center">
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
